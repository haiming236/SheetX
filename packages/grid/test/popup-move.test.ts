// @vitest-environment jsdom
/**
 * E4 弹层宿主 + E6 提交后焦点移动：通过自定义编辑器捕获 ctx 做断言。
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { SheetXGrid } from '../src/grid-engine.js'
import type { EditorContext, EditorHandle } from '@sheetx/editors'

describe('E4 · 弹层宿主', () => {
  let host: HTMLElement
  let grid: SheetXGrid
  let captured: EditorContext | null = null
  let capturedEl: HTMLElement | null = null

  beforeEach(() => {
    host = document.createElement('div')
    document.body.appendChild(host)
  })

  afterEach(() => {
    grid?.destroy()
    host.remove()
    document.querySelector('.sx-popup-host')?.remove()
    captured = null
  })

  function makeGrid(mode?: 'inline' | 'body'): SheetXGrid {
    const grid = new SheetXGrid({
      container: host,
      columns: [{ key: 'name', title: '名称', editable: true, editor: 'probe' }],
      data: [{ name: '苹果' }],
      editorHostMode: mode,
    })
    // 探针编辑器：捕获 ctx 与 handle.el 并暴露给测试
    grid.registerEditor('probe', (editorCtx: EditorContext): EditorHandle => {
      captured = editorCtx
      const el = document.createElement('input')
      el.style.position = 'absolute'
      capturedEl = el
      return {
        el,
        mount() {
          el.focus()
        },
        focus() {
          el.focus()
        },
        destroy() {
          el.remove()
        },
      }
    })
    return grid
  }

  it('默认 inline：编辑器在引擎 root 内，坐标为 root 本地坐标', () => {
    grid = makeGrid()
    grid.openEditor(0, 0)
    expect(captured).not.toBeNull()
    expect(captured!.container).toBe(grid.canvas!.parentElement!.querySelector('.sx-grid-editors'))
    expect(captured!.rect).toEqual({ x: ROW_LOCAL.x, y: ROW_LOCAL.y, width: 100, height: 28 })
    grid.destroy()
  })

  it('body 模式：编辑器挂到 body 弹出层，坐标换算为视口坐标（E4 验收核心）', () => {
    grid = makeGrid('body')
    grid.openEditor(0, 0)
    expect(captured).not.toBeNull()
    // 宿主是 body 级弹出层（不在引擎 root 内）
    const popupHost = document.querySelector('.sx-popup-host')
    expect(popupHost).not.toBeNull()
    expect(popupHost!.contains(capturedEl!)).toBe(true)
    expect(grid.canvas!.parentElement!.contains(capturedEl!)).toBe(false)
    // 坐标 = rootRect + cellRect（jsdom rootRect 为 0，此处验证换算管线）
    expect(captured!.rect.x).toBe(ROW_LOCAL.x)
    grid.destroy()
  })

  it('body 模式坐标 = root 屏幕位置 + 单元格位置（rootRect 偏移生效）', () => {
    grid = makeGrid('body')
    // 模拟 root 在视口中的位置
    const root = host.querySelector('.sx-grid') as HTMLElement
    Object.defineProperty(root, 'getBoundingClientRect', {
      value: () => ({ x: 0, y: 0, width: 800, height: 600, top: 120, left: 200, right: 1000, bottom: 720, toJSON: () => ({}) }),
    })
    grid.openEditor(0, 0)
    expect(captured).not.toBeNull()
    expect(captured!.rect.x).toBe(200 + ROW_LOCAL.x)
    expect(captured!.rect.y).toBe(120 + ROW_LOCAL.y)
    grid.destroy()
  })

  it('setPopupHost 自定义宿主优先生效', () => {
    grid = makeGrid()
    const custom = document.createElement('div')
    document.body.appendChild(custom)
    grid.setPopupHost(custom)
    grid.openEditor(0, 0)
    expect(captured).not.toBeNull()
    expect(custom.contains(capturedEl!)).toBe(true)
    custom.remove()
    grid.destroy()
  })
})

const ROW_LOCAL = { x: 48, y: 24 } // 第一个单元格的 root 本地坐标（行头宽 + 列头高）

describe('E6 · 提交后焦点移动', () => {
  let host: HTMLElement
  let grid: SheetXGrid
  let ctx: EditorContext | null = null

  beforeEach(() => {
    host = document.createElement('div')
    document.body.appendChild(host)
    grid = new SheetXGrid({
      container: host,
      columns: [
        { key: 'a', title: 'A', editable: true, editor: 'probe' },
        { key: 'b', title: 'B', editable: true, editor: 'probe' },
        { key: 'c', title: 'C', editable: true, editor: 'probe' },
      ],
      data: [
        { a: 1, b: 1, c: 1 },
        { a: 2, b: 2, c: 2 },
      ],
    })
    grid.registerEditor('probe', (editorCtx: EditorContext): EditorHandle => {
      ctx = editorCtx
      const el = document.createElement('input')
      return { el, focus() {}, destroy() { el.remove() } }
    })
  })

  afterEach(() => {
    grid.destroy()
    host.remove()
    ctx = null
  })

  it('Enter 提交 → 焦点下移', () => {
    grid.openEditor(0, 0)
    ctx!.commit('x', undefined, { move: 'down' })
    expect(grid.getValue(grid.getRowByIndex(0)!.id, 'a')).toBe('x')
    expect(grid.getSelectedRanges()[0]!.start).toEqual({ row: 1, col: 0 })
  })

  it('Tab 提交 → 焦点右移', () => {
    grid.openEditor(0, 0)
    ctx!.commit('x', undefined, { move: 'right' })
    expect(grid.getSelectedRanges()[0]!.start).toEqual({ row: 0, col: 1 })
  })

  it('行尾 Tab 提交 → 换行到下一行首列（Excel 习惯）', () => {
    grid.openEditor(0, 2) // 最后一列
    ctx!.commit('x', undefined, { move: 'right' })
    expect(grid.getSelectedRanges()[0]!.start).toEqual({ row: 1, col: 0 })
  })

  it('失焦/点击提交（无 meta）→ 焦点不移动', () => {
    grid.openEditor(0, 0)
    ctx!.commit('x') // 无 meta
    expect(grid.getSelectedRanges()[0]!.start).toEqual({ row: 0, col: 0 })
  })

  it('越界钳制：最后一行 Enter 提交 → 停在原格', () => {
    grid.openEditor(1, 2)
    ctx!.commit('x', undefined, { move: 'down' })
    expect(grid.getSelectedRanges()[0]!.start).toEqual({ row: 1, col: 2 })
  })
})
