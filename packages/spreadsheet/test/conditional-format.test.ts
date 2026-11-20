/**
 * Spreadsheet 条件格式集成回归
 *
 * core 的求值逻辑已在 core/test 覆盖，这里验证引擎 → 场景层的接线：
 * 1) 规则命中生成 conditional 图层指令（背景 / 数据条）；
 * 2) 求值使用公式「计算值」而非公式原文；
 * 3) 删除规则后图层指令消失。
 */
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { createSpreadsheet } from '../src/index.js'
import { buildSheetScene } from '../src/scene/sheet-scene-builder.js'

type DrawCommandLike = { t: string; fill?: string; text?: string; x?: number; y?: number; w?: number; h?: number }

function makeSheet() {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const sheet = createSpreadsheet({
    container: host,
    sheets: [{ name: 'S', rowCount: 30, columnCount: 30 }],
  })
  return { sheet, host }
}

function sceneOf(sheet: ReturnType<typeof makeSheet>['sheet']) {
  const internal = sheet as unknown as {
    layout: never
    themeTokens: never
    input: { selection: never }
    getActiveSheet: () => never
    conditionalRules: never[]
  }
  return buildSheetScene({
    layout: internal.layout,
    sheet: internal.getActiveSheet(),
    theme: internal.themeTokens,
    selection: internal.input.selection,
    getValue: (row, col) => sheet.getCellValue(undefined, row, col),
    conditionalRules: internal.conditionalRules as never,
  })
}

function conditionalCommands(sheet: ReturnType<typeof makeSheet>['sheet']): DrawCommandLike[] {
  const layer = sceneOf(sheet).layers.find((item) => item.id === 'conditional')
  return (layer?.commands ?? []) as DrawCommandLike[]
}

describe('Spreadsheet 条件格式场景集成', () => {
  it('cellIs 命中生成背景指令，删除规则后消失', () => {
    const { sheet, host } = makeSheet()
    sheet.setCellValue(undefined, 0, 0, 120)

    sheet.addConditionalRule({
      id: 'high',
      type: 'cellIs',
      range: { start: { row: 0, col: 0 }, end: { row: 0, col: 0 } },
      operator: '>',
      value: 90,
      style: { background: '#fdeeee', color: '#c00', bold: true },
    })

    const commands = conditionalCommands(sheet)
    expect(commands.some((command) => command.t === 'rect' && command.fill === '#fdeeee')).toBe(true)
    expect(sheet.getConditionalRules()).toHaveLength(1)

    expect(sheet.removeConditionalRule('high')).toBe(true)
    expect(conditionalCommands(sheet).filter((command) => command.t === 'rect')).toHaveLength(0)
    sheet.destroy()
    host.remove()
  })

  it('求值使用公式计算值：SUM 结果命中阈值', () => {
    const { sheet, host } = makeSheet()
    sheet.setCellValue(undefined, 0, 0, 120)
    sheet.setCellValue(undefined, 1, 0, 80)
    sheet.setCellValue(undefined, 2, 0, '=SUM(A1:A2)') // 200

    sheet.addConditionalRule({
      id: 'formula-total',
      type: 'cellIs',
      range: { start: { row: 2, col: 0 }, end: { row: 2, col: 0 } },
      operator: '>',
      value: 150,
      style: { background: '#e8f7ee' },
    })
    expect(sheet.getCellValue(undefined, 2, 0)).toBe(200)
    expect(conditionalCommands(sheet).some((command) => command.t === 'rect' && command.fill === '#e8f7ee')).toBe(true)

    // 阈值调高后不再命中
    sheet.addConditionalRule({
      id: 'formula-total',
      type: 'cellIs',
      range: { start: { row: 2, col: 0 }, end: { row: 2, col: 0 } },
      operator: '>',
      value: 300,
      style: { background: '#e8f7ee' },
    })
    expect(conditionalCommands(sheet).filter((command) => command.t === 'rect')).toHaveLength(0)
    sheet.destroy()
    host.remove()
  })

  it('数据条按区域数值上下界绘制', () => {
    const { sheet, host } = makeSheet()
    sheet.setCellValue(undefined, 0, 0, 10)
    sheet.setCellValue(undefined, 1, 0, 30)
    sheet.addConditionalRule({
      id: 'bar',
      type: 'dataBar',
      range: { start: { row: 0, col: 0 }, end: { row: 1, col: 0 } },
      color: '#63b3ed',
    })
    const bars = conditionalCommands(sheet).filter((command) => command.t === 'rect' && command.fill === '#63b3ed')
    expect(bars.length).toBe(2)
    expect((bars[1]?.w ?? 0)).toBeGreaterThan(bars[0]?.w ?? 0)
    sheet.destroy()
    host.remove()
  })
})

describe('引擎 API · freezeColumns', () => {
  it('运行时冻结列并影响场景固定带', () => {
    const { sheet, host } = makeSheet()
    sheet.freezeColumns(2)
    const internal = sheet as unknown as { layout: { cols: { frozenCount: number; frozenWidth: number } } }
    expect(internal.layout.cols.frozenCount).toBe(2)
    expect(sceneOf(sheet).fixedBands?.left).toBe(48 + internal.layout.cols.frozenWidth)
    sheet.destroy()
    host.remove()
  })
})

describe('引擎 API · printSource', () => {
  it('输出公式计算值作为打印文本', () => {
    const { sheet, host } = makeSheet()
    sheet.setCellValue(undefined, 0, 0, 120)
    sheet.setCellValue(undefined, 1, 0, 80)
    sheet.setCellValue(undefined, 2, 0, '=SUM(A1:A2)')
    const source = sheet.printSource()
    expect(source.rowCount).toBe(30)
    expect(source.colCount).toBe(30)
    expect(source.cellText(2, 0)).toBe('200')
    sheet.destroy()
    host.remove()
  })
})

describe('引擎 API · pivotRange', () => {
  it('区域首行作字段名，按数据区构建透视表', () => {
    const { sheet, host } = makeSheet()
    sheet.setCellValue(undefined, 0, 0, '地区')
    sheet.setCellValue(undefined, 0, 1, '金额')
    sheet.setCellValue(undefined, 1, 0, '华东')
    sheet.setCellValue(undefined, 1, 1, 120)
    sheet.setCellValue(undefined, 2, 0, '华南')
    sheet.setCellValue(undefined, 2, 1, 80)
    const result = sheet.pivotRange(
      { start: { row: 0, col: 0 }, end: { row: 2, col: 1 } },
      { rows: [{ key: '地区' }], cols: [], values: [{ key: '金额', agg: 'sum' }] },
    )
    expect(result.rowKeys).toEqual([['华东'], ['华南']])
    expect(result.cells).toEqual([[120], [80]])
    expect(result.grandTotal).toEqual([200])
    sheet.destroy()
    host.remove()
  })
})

describe('引擎 API · chartRangeSvg', () => {
  it('区域首行作字段名生成 SVG 图表', () => {
    const { sheet, host } = makeSheet()
    sheet.setCellValue(undefined, 0, 0, '地区')
    sheet.setCellValue(undefined, 0, 1, '金额')
    sheet.setCellValue(undefined, 1, 0, '华东')
    sheet.setCellValue(undefined, 1, 1, 120)
    sheet.setCellValue(undefined, 2, 0, '华南')
    sheet.setCellValue(undefined, 2, 1, 80)
    const svg = sheet.chartRangeSvg(
      { start: { row: 0, col: 0 }, end: { row: 2, col: 1 } },
      { kind: 'pie', categoryField: '地区', valueFields: [{ key: '金额' }] },
    )
    expect(svg).toContain('<path d=')
    expect(svg).toContain('华东')
    expect(svg).not.toContain('<image')
    sheet.destroy()
    host.remove()
  })
})
