/**
 * 列头排序 API 回归
 * - 数值/文本/空值语义
 * - toggle 升→降、换列重置
 * - 经 replace-data mutation，undo 恢复原行序
 * - 事件派发 sx:sort-changed
 */
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { createGrid } from '../src/index.js'

interface Item {
  id: string
  name: string
  qty: number | null
}

function makeGrid() {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const grid = createGrid({
    container: host,
    columns: [
      { key: 'name', title: '名称', width: 100 },
      { key: 'qty', title: '数量', width: 80 },
    ],
    data: [
      { id: 'r1', name: '乙', qty: 3 },
      { id: 'r2', name: '甲', qty: 1 },
      { id: 'r3', name: '丙', qty: null },
      { id: 'r4', name: '丁', qty: 2 },
    ] as Item[],
  })
  return { grid, host }
}

describe('SheetXGrid.sortByColumn', () => {
  it('数值列升序 / 降序 / toggle 循环，空值恒在末尾', () => {
    const { grid, host } = makeGrid()
    const qtys = () => grid.getData().map((row) => row.qty)

    expect(grid.sortByColumn(1)).toBe('asc')
    expect(qtys()).toEqual([1, 2, 3, null])

    expect(grid.sortByColumn(1)).toBe('desc')
    expect(qtys()).toEqual([3, 2, 1, null])

    expect(grid.sortByColumn(1)).toBe('asc')
    expect(qtys()).toEqual([1, 2, 3, null])
    grid.destroy()
    host.remove()
  })

  it('文本列按中文 locale 排序；换列重置为升序', () => {
    const { grid, host } = makeGrid()
    grid.sortByColumn(0)
    expect(grid.getData().map((row) => row.name)).toEqual(['丙', '丁', '甲', '乙'])

    // 先降序再换列 → 新列应回到升序
    grid.sortByColumn(0, 'desc')
    grid.sortByColumn(1, 'toggle')
    expect(grid.getData().map((row) => row.qty)).toEqual([1, 2, 3, null])
    grid.destroy()
    host.remove()
  })

  it('排序可撤销：undo 恢复原始行序', () => {
    const { grid, host } = makeGrid()
    const original = grid.getData().map((row) => row.id)
    grid.sortByColumn(1, 'desc')
    expect(grid.getData().map((row) => row.id)).not.toEqual(original)
    grid.undo()
    expect(grid.getData().map((row) => row.id)).toEqual(original)
    grid.destroy()
    host.remove()
  })

  it('越界列安全返回 null，不改变数据', () => {
    const { grid, host } = makeGrid()
    const before = grid.getData().map((row) => row.id)
    expect(grid.sortByColumn(99)).toBe(null)
    expect(grid.getData().map((row) => row.id)).toEqual(before)
    grid.destroy()
    host.remove()
  })
})

describe('行高自适应（autoFit row）', () => {
  it('按换行数增高，短内容回落到默认行高', () => {
    const { grid, host } = makeGrid()
    const layout = (grid as unknown as { layout: { rows: { getHeight(i: number): number } } }).layout
    const before = layout.rows.getHeight(0)

    grid.setValue('r1', 'name', '第一行\n第二行\n第三行')
    grid.autoFit('row', 0)
    expect(layout.rows.getHeight(0)).toBeGreaterThan(before)

    grid.setValue('r1', 'name', '短')
    grid.autoFit('row', 0)
    expect(layout.rows.getHeight(0)).toBe(before)
    grid.destroy()
    host.remove()
  })
})


describe('触摸/宿主缩放', () => {
  it('setZoom 按比例调整列宽与行高，复位后回到基准尺寸', () => {
    const { grid, host } = makeGrid()
    const layout = (grid as unknown as {
      layout: { cols: { getWidth(i: number): number }; rows: { defaultHeight: number } }
    }).layout
    const baseWidth = layout.cols.getWidth(0)
    const baseHeight = layout.rows.defaultHeight

    expect(grid.setZoom(1.5)).toBe(1.5)
    expect(grid.getZoom()).toBe(1.5)
    expect(layout.cols.getWidth(0)).toBe(Math.round(baseWidth * 1.5))
    expect(layout.rows.defaultHeight).toBe(Math.round(baseHeight * 1.5))

    grid.setZoom(1)
    expect(layout.cols.getWidth(0)).toBe(baseWidth)
    expect(layout.rows.defaultHeight).toBe(baseHeight)

    // 倍率钳制
    expect(grid.setZoom(99)).toBe(2.5)
    expect(grid.setZoom(0.01)).toBe(0.6)
    grid.destroy()
    host.remove()
  })
})

describe('条件格式集成（Grid 场景层）', () => {
  it('规则命中生成 conditional 图层指令；删除规则后消失', async () => {
    const { buildGridScene } = await import('../src/scene/grid-scene-builder.js')
    const { grid, host } = makeGrid()
    grid.setValue('r1', 'qty', 95)

    grid.addConditionalRule({
      id: 'high',
      type: 'cellIs',
      range: { start: { row: 0, col: 1 }, end: { row: 3, col: 1 } },
      operator: '>',
      value: 90,
      style: { background: '#fdeeee', bold: true },
    })

    const internal = grid as unknown as {
      layout: unknown
      store: unknown
      themeTokens: never
      input: { selection: unknown }
      formatters: unknown
      conditionalRules: never[]
    }
    const scene = buildGridScene({
      layout: internal.layout as never,
      store: internal.store as never,
      theme: internal.themeTokens,
      selection: internal.input.selection as never,
      formatters: internal.formatters as never,
      showRowNumbers: true,
      conditionalRules: internal.conditionalRules as never,
    })
    const layer = scene.layers.find((item) => item.id === 'conditional')
    const commands = layer?.commands as Array<{ t: string; fill?: string }> | undefined
    expect(commands?.some((command) => command.t === 'rect' && command.fill === '#fdeeee')).toBe(true)

    expect(grid.removeConditionalRule('high')).toBe(true)
    expect(grid.getConditionalRules()).toHaveLength(0)
    grid.destroy()
    host.remove()
  })
})

describe('引擎 API · freezeColumns', () => {
  it('运行时冻结列并影响场景固定带', () => {
    const { grid, host } = makeGrid()
    grid.freezeColumns(1)
    const internal = grid as unknown as { layout: { cols: { frozenCount: number; frozenWidth: number } } }
    expect(internal.layout.cols.frozenCount).toBe(1)
    expect(internal.layout.cols.frozenWidth).toBe(100)
    grid.destroy()
    host.remove()
  })
})

describe('引擎 API · printSource', () => {
  it('输出与 io.PrintSource 同构的打印数据（含列格式化值）', () => {
    const { grid, host } = makeGrid()
    const source = grid.printSource()
    expect(source.rowCount).toBe(4)
    expect(source.colCount).toBe(2)
    expect(source.rowHeight(0)).toBeGreaterThan(0)
    expect(source.colWidth(0)).toBe(100)
    expect(source.cellText(0, 0)).toBe('乙')
    expect(source.cellText(0, 1)).toBe('3')
    expect(source.cellText(2, 1)).toBe('') // null 空值
    grid.destroy()
    host.remove()
  })
})

describe('引擎 API · pivot', () => {
  it('按当前数据构建透视表（字段对应列名）', () => {
    const { grid, host } = makeGrid()
    const result = grid.pivot({
      rows: [{ key: 'name' }],
      cols: [],
      values: [{ key: 'qty', agg: 'sum' }],
    })
    expect(result.rowKeys).toEqual([['乙'], ['甲'], ['丙'], ['丁']])
    expect(result.cells).toEqual([[3], [1], [null], [2]])
    expect(result.grandTotal).toEqual([6])
    grid.destroy()
    host.remove()
  })
})

describe('引擎 API · chartSvg', () => {
  it('按当前数据生成矢量 SVG 图表', () => {
    const { grid, host } = makeGrid()
    const svg = grid.chartSvg({
      kind: 'bar',
      categoryField: 'name',
      valueFields: [{ key: 'qty', name: '数量' }],
      title: '库存数量',
    })
    expect(svg).toContain('<svg')
    expect(svg).toContain('库存数量')
    expect(svg).toContain('数量')
    expect(svg).not.toContain('<image')
    grid.destroy()
    host.remove()
  })
})
