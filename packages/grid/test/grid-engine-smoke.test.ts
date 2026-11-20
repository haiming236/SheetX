// @vitest-environment jsdom
/**
 * SheetXGrid DOM 集成冒烟测试：
 * 验证引擎在浏览器环境下的完整装配链路——构建 DOM → 编辑 → 事件 → 撤销 → 销毁。
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { SheetXGrid } from '../src/grid-engine.js'
import { PublicEvent } from '@sheetx/core'

describe('SheetXGrid 集成冒烟', () => {
  let host: HTMLElement
  let grid: SheetXGrid

  beforeEach(() => {
    host = document.createElement('div')
    // jsdom 无真实布局（getBoundingClientRect 全 0）——手动给尺寸
    Object.defineProperty(host, 'getBoundingClientRect', {
      value: () => ({ x: 0, y: 0, width: 800, height: 600, top: 0, left: 0, right: 800, bottom: 600, toJSON: () => ({}) }),
    })
    document.body.appendChild(host)
  })

  afterEach(() => {
    grid?.destroy()
    host.remove()
  })

  function makeGrid(): SheetXGrid {
    return new SheetXGrid({
      container: host,
      columns: [
        { key: 'name', title: '名称', width: 120, editable: true },
        { key: 'qty', title: '数量', width: 80, editable: true },
        { key: 'price', title: '单价', width: 80, editable: true, editor: 'number' },
      ],
      data: [
        { id: 'r1', name: '苹果', qty: 10, price: 5.5 },
        { id: 'r2', name: '香蕉', qty: 20, price: 3.2 },
      ],
    })
  }

  it('构建后产生完整 DOM 装配', () => {
    grid = makeGrid()
    expect(host.querySelector('.sx-grid')).not.toBeNull()
    expect(host.querySelector('.sx-grid-scroll')).not.toBeNull()
    expect(host.querySelector('.sx-grid-spacer')).not.toBeNull()
    expect(host.querySelector('canvas.sx-grid-canvas')).not.toBeNull()
    expect(host.querySelector('.sx-grid-editors')).not.toBeNull()
  })

  it('setValue 触发 cell-change 公共事件', () => {
    grid = makeGrid()
    const events: unknown[] = []
    grid.on(PublicEvent.CELL_CHANGE, (tx: unknown) => events.push(tx))
    grid.setValue('r1', 'qty', 99)
    expect(grid.getValue('r1', 'qty')).toBe(99)
    expect(events.length).toBe(1)
    const tx = events[0] as { changes: Array<{ rowId: string; oldValue: unknown; newValue: unknown }> }
    expect(tx.changes[0]).toEqual({ rowId: 'r1', field: 'qty', oldValue: 10, newValue: 99 })
  })

  it('setValue 可撤销/重做（API 路径与用户路径同一协议）', async () => {
    grid = makeGrid()
    grid.setValue('r1', 'name', '红苹果')
    expect(grid.getValue('r1', 'name')).toBe('红苹果')
    expect(grid.canUndo()).toBe(true)
    await grid.undo()
    expect(grid.getValue('r1', 'name')).toBe('苹果')
    await grid.redo()
    expect(grid.getValue('r1', 'name')).toBe('红苹果')
  })

  it('insertRows/deleteRows 与选区钳制联动', () => {
    grid = makeGrid()
    grid.insertRows(2, [{ name: '樱桃', qty: 3 }])
    expect(grid.getRowCount()).toBe(3)
    grid.deleteRows(['r1'])
    expect(grid.getRowCount()).toBe(2)
    // 选区不越界
    expect(grid.getSelectedRanges().every((r) => r.end.row < grid.getRowCount())).toBe(true)
  })

  it('setData 全量替换可撤销', async () => {
    grid = makeGrid()
    grid.setData([{ name: '新数据集', qty: 1 }])
    expect(grid.getRowCount()).toBe(1)
    await grid.undo()
    expect(grid.getRowCount()).toBe(2)
  })

  it('destroy 清理 DOM 且二次销毁安全', () => {
    grid = makeGrid()
    grid.destroy()
    expect(host.querySelector('.sx-grid')).toBeNull()
    expect(grid.isDestroyed()).toBe(true)
    expect(() => grid.destroy()).not.toThrow()
  })
})
