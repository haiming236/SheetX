import { describe, it, expect } from 'vitest'
import { GridLayout, ROW_HEADER_WIDTH, COL_HEADER_HEIGHT } from '../src/layout/grid-layout.js'
import { buildGridScene } from '../src/scene/grid-scene-builder.js'
import type { DrawCommand } from '@sheetx/renderer'
import { GridStore } from '@sheetx/data'
import { lightTheme } from '@sheetx/themes'
import { SelectionModel } from '@sheetx/interaction'

function makeLayout(frozenRows = 0): GridLayout {
  const layout = new GridLayout()
  layout.rows.defaultHeight = 100
  layout.rows.setRowCount(50_000) // 5 万行（任务书 E3 验收场景）
  layout.cols.setColumns([
    { key: 'a', title: 'A', width: 100 },
    { key: 'b', title: 'B', width: 100 },
    { key: 'c', title: 'C', width: 100 },
  ])
  layout.frozenRowCount = frozenRows
  layout.viewportSize = { width: 800, height: 600 }
  layout.scroll = { x: 0, y: 0 }
  return layout
}

describe('E3 · 冻结行布局几何', () => {
  it('frozenBandHeight = 冻结行高度合计', () => {
    const layout = makeLayout(2)
    expect(layout.frozenBandHeight).toBe(200)
    expect(makeLayout(0).frozenBandHeight).toBe(0)
  })

  it('冻结行钉在列头下方（滚动不影响），主区行随滚动', () => {
    const layout = makeLayout(2)
    layout.scroll = { x: 0, y: 500 }
    expect(layout.rowToViewportY(0)).toBe(COL_HEADER_HEIGHT) // 冻结行 1 钉住
    expect(layout.rowToViewportY(1)).toBe(COL_HEADER_HEIGHT + 100)
    // 主区第 3 行（offset 200）：视口 y = 24 + 200 - 500 = -276（已滚出，被主带 clip）
    expect(layout.rowToViewportY(2)).toBe(COL_HEADER_HEIGHT + 200 - 500)
  })

  it('rowAtViewportY：冻结带内固定解析，主区按滚动（命中不漂移验收）', () => {
    const layout = makeLayout(2)
    layout.scroll = { x: 0, y: 1000 }
    // 冻结带内（视口 y 在 24~224 之间）→ 永远解析为冻结行
    expect(layout.rowAtViewportY(COL_HEADER_HEIGHT + 50)).toBe(0)
    expect(layout.rowAtViewportY(COL_HEADER_HEIGHT + 150)).toBe(1)
    // 主区：视口 y = 24 + 200 + Δ → 内容偏移 1000 + 200 + Δ - 200 = ... 命中主区行
    const mainHit = layout.rowAtViewportY(COL_HEADER_HEIGHT + 200 + 50)
    expect(mainHit).toBeGreaterThanOrEqual(2)
  })

  it('hitTest 主区命中带滚动偏移', () => {
    const layout = makeLayout(2)
    layout.scroll = { x: 0, y: 300 }
    // 主区第一屏顶部在视口 y = 24 + 200；命中其下 50px → 内容偏移 300 + 200 + 50 - 200 = ...
    const hit = layout.hitTest({ x: ROW_HEADER_WIDTH + 50, y: COL_HEADER_HEIGHT + 200 + 50 })
    expect(hit?.kind).toBe('cell')
    expect(hit?.row).toBeGreaterThanOrEqual(2)
    // 冻结行头命中
    const frozenHit = layout.hitTest({ x: 20, y: COL_HEADER_HEIGHT + 50 })
    expect(frozenHit).toEqual({ kind: 'rowHeader', row: 0, col: -1 })
  })

  it('getVisibleWindow 不含冻结行（主窗口从冻结行之后开始）', () => {
    const layout = makeLayout(2)
    layout.scroll = { x: 0, y: 0 }
    const win = layout.getVisibleWindow()
    expect(win.firstRow).toBeGreaterThanOrEqual(2)
    // 滚动后依然不含冻结行
    layout.scroll = { x: 0, y: 2000 }
    expect(layout.getVisibleWindow().firstRow).toBeGreaterThanOrEqual(2)
  })

  it('isCellVisible：主区行以冻结带底缘为上边界', () => {
    const layout = makeLayout(2)
    // 主区第一行 (row 2) 在 scroll=0 时完整可见
    expect(layout.isCellVisible(2, 0)).toBe(true)
    // 滚动 50px 后 row2 半埋进冻结带 → 不可见
    layout.scroll = { x: 0, y: 50 }
    expect(layout.isCellVisible(2, 0)).toBe(false)
  })
})

describe('E3 · 场景构建器冻结带', () => {
  it('背景/网格/内容层出现「冻结带 + 主带」两组 clip', () => {
    const layout = makeLayout(2)
    layout.scroll = { x: 0, y: 800 }
    const store = new GridStore([])
    const scene = buildGridScene({
      layout,
      store,
      theme: lightTheme,
      selection: new SelectionModel(),
      formatters: new Map(),
      showRowNumbers: true,
    })
    const countClips = (commands: DrawCommand[]): number =>
      commands.filter((command) => 't' in command && command.t === 'clip').length
    const bgClips = countClips(scene.layers[0]!.commands as DrawCommand[])
    // 冻结带 1 + 主带 1 = 2 个内容 clip（表头是精确尺寸矩形，无需 clip）
    expect(bgClips).toBe(2)
    // 冻结带的 clip y = 列头高；主带的 clip y = 列头 + 冻结带
    const clipYs = (scene.layers[0]!.commands as DrawCommand[])
      .filter((command): command is Extract<DrawCommand, { t: 'clip' }> => 't' in command && command.t === 'clip')
      .map((command) => command.y)
    expect(clipYs).toContain(COL_HEADER_HEIGHT)
    expect(clipYs).toContain(COL_HEADER_HEIGHT + 200)
  })

  it('无冻结行时与旧行为一致（单内容 clip）', () => {
    const layout = makeLayout(0)
    const scene = buildGridScene({
      layout,
      store: new GridStore([]),
      theme: lightTheme,
      selection: new SelectionModel(),
      formatters: new Map(),
      showRowNumbers: true,
    })
    const bgClips = (scene.layers[0]!.commands as DrawCommand[]).filter((c) => 't' in c && c.t === 'clip').length
    expect(bgClips).toBe(1) // 仅内容带
  })
})

describe('M3 · 冻结列几何与命中', () => {
  it('setFrozen 按 Excel 语义冻结前 N 列，frozenWidth 为前缀宽度', () => {
    const layout = makeLayout(0)
    layout.cols.setFrozen(2)
    expect(layout.cols.frozenCount).toBe(2)
    expect(layout.frozenBandWidth).toBe(200)
    expect(layout.cols.getDef(0)?.frozen).toBe(true)
    expect(layout.cols.getDef(1)?.frozen).toBe(true)
    expect(layout.cols.getDef(2)?.frozen).toBe(false)
    // 越界钳制
    layout.cols.setFrozen(99)
    expect(layout.cols.frozenCount).toBe(3)
    layout.cols.setFrozen(0)
    expect(layout.frozenBandWidth).toBe(0)
  })

  it('冻结列钉在行头右侧，主区列随滚动；命中不漂移', () => {
    const layout = makeLayout(0)
    layout.cols.setFrozen(2)
    layout.scroll = { x: 150, y: 0 }

    expect(layout.colToViewportX(0)).toBe(ROW_HEADER_WIDTH)
    expect(layout.colToViewportX(1)).toBe(ROW_HEADER_WIDTH + 100)
    // 冻结带内命中永远解析到冻结列（旧实现会算成 col2/col3）
    expect(layout.colAtViewportX(ROW_HEADER_WIDTH + 20)).toBe(0)
    expect(layout.colAtViewportX(ROW_HEADER_WIDTH + 120)).toBe(1)
    const hit = layout.hitTest({ x: ROW_HEADER_WIDTH + 20, y: COL_HEADER_HEIGHT + 30 })
    expect(hit?.kind).toBe('cell')
    expect(hit?.col).toBe(0)
    // 列头命中同样冻结
    const headerHit = layout.hitTest({ x: ROW_HEADER_WIDTH + 20, y: 10 })
    expect(headerHit?.col).toBe(0)
  })

  it('getVisibleWindow 保持向后兼容（仍包含冻结列）', () => {
    const layout = makeLayout(0)
    layout.cols.setFrozen(2)
    layout.scroll = { x: 0, y: 0 }
    expect(layout.getVisibleWindow().firstCol).toBe(0)
    // 主区过滤由场景层完成（frozenColCount 之前的部分不进 mainColList）
  })
})

describe('M3 · 场景构建器冻结列', () => {
  it('冻结列 + 主区各一组水平 clip，且列头含冻结列', () => {
    const layout = makeLayout(0)
    layout.cols.setFrozen(2)
    layout.scroll = { x: 150, y: 0 }
    const scene = buildGridScene({
      layout,
      store: new GridStore([]),
      theme: lightTheme,
      selection: new SelectionModel(),
      formatters: new Map(),
      showRowNumbers: true,
    })
    const clips = (scene.layers[0]!.commands as DrawCommand[]).filter((c): c is Extract<DrawCommand, { t: 'clip' }> => 't' in c && c.t === 'clip')
    expect(clips).toHaveLength(2)
    expect(clips.map((c) => c.x)).toEqual([ROW_HEADER_WIDTH, ROW_HEADER_WIDTH + 200])
    expect(scene.fixedBands?.left).toBe(ROW_HEADER_WIDTH + 200)
    // 列头绘制含冻结列 A/B（不随 scroll 消失）
    const headers = scene.layers.find((layer) => layer.id === 'headers')!.commands as DrawCommand[]
    const hasTitle = (title: string): boolean => headers.some((c) => 'text' in c && (c as { text?: string }).text === title)
    expect(hasTitle('A')).toBe(true)
    expect(hasTitle('B')).toBe(true)
  })
})
