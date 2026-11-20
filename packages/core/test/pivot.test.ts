/** 数据透视表（M4）：分组、聚合、多级维度、总计、矩阵导出 */
import { describe, it, expect } from 'vitest'
import { buildPivotTable, pivotToMatrix } from '../src/pivot.js'
import type { PivotConfig } from '../src/pivot.js'

interface Sale {
  地区: string
  类别: string
  季度: string
  金额: number | string | null
  数量?: number
}

const sales: Sale[] = [
  { 地区: '华东', 类别: '电脑', 季度: 'Q1', 金额: 100, 数量: 2 },
  { 地区: '华东', 类别: '电脑', 季度: 'Q2', 金额: 200, 数量: 3 },
  { 地区: '华东', 类别: '手机', 季度: 'Q1', 金额: 50, 数量: 1 },
  { 地区: '华南', 类别: '电脑', 季度: 'Q1', 金额: 300, 数量: 4 },
  { 地区: '华南', 类别: '手机', 季度: 'Q2', 金额: 80, 数量: 2 },
  { 地区: '华南', 类别: '手机', 季度: 'Q2', 金额: '20', 数量: 1 },
  { 地区: '华北', 类别: '电脑', 季度: 'Q1', 金额: null, 数量: 0 },
]

const config: PivotConfig = {
  rows: [{ key: '地区' }],
  cols: [{ key: '季度' }],
  values: [{ key: '金额', agg: 'sum' }],
}

describe('buildPivotTable · 基础聚合', () => {
  it('按行列分组求和，空值不参与，字符串数值可转数', () => {
    const result = buildPivotTable(sales, config)
    expect(result.recordCount).toBe(7)
    expect(result.rowKeys).toEqual([['华东'], ['华南'], ['华北']])
    expect(result.colKeys).toEqual([['Q1'], ['Q2']])
    // 华东 Q1 = 100 + 50 = 150；华南 Q2 = 80 + 20 = 100；华北 Q1 空值 → null
    expect(result.cells).toEqual([
      [150, 200],
      [300, 100],
      [null, null],
    ])
    expect(result.counts).toEqual([
      [2, 1],
      [1, 2],
      [0, 0],
    ])
    expect(result.grandTotal).toEqual([750])
  })

  it('行总计/列总计可关闭', () => {
    const off = buildPivotTable(sales, { ...config, rowTotal: false, colTotal: false })
    expect(off.rowTotals).toEqual([])
    expect(off.colTotals).toEqual([])
    expect(off.grandTotal).toEqual([750]) // 全局总计始终给
    const on = buildPivotTable(sales, config)
    expect(on.rowTotals).toEqual([[350], [400], [null]])
    expect(on.colTotals).toEqual([[450], [300]])
  })

  it('count / avg / min / max 各自语义正确', () => {
    const result = buildPivotTable(sales, {
      rows: [{ key: '地区' }],
      cols: [],
      values: [
        { key: '金额', agg: 'count' },
        { key: '金额', agg: 'avg' },
        { key: '金额', agg: 'min' },
        { key: '金额', agg: 'max' },
      ],
    })
    // 华东 3 笔：100,200,50 → count=3 avg=116.67 min=50 max=200
    expect(result.valueKeys).toEqual([
      'count(金额)', 'avg(金额)', 'min(金额)', 'max(金额)',
    ])
    expect(result.cells[0]![0]).toBe(3)
    expect(result.cells[0]![1]).toBeCloseTo(350 / 3)
    expect(result.cells[0]![2]).toBe(50)
    expect(result.cells[0]![3]).toBe(200)
    // 华北只有空值
    expect(result.cells[2]).toEqual([null, null, null, null])
  })
})

describe('buildPivotTable · 多级维度', () => {
  it('行/列均支持多级路径，分组顺序按首次出现', () => {
    const result = buildPivotTable(sales, {
      rows: [{ key: '地区' }, { key: '类别' }],
      cols: [{ key: '季度' }],
      values: [{ key: '金额', agg: 'sum' }],
    })
    expect(result.rowKeys).toEqual([
      ['华东', '电脑'], ['华东', '手机'], ['华南', '电脑'], ['华南', '手机'], ['华北', '电脑'],
    ])
    expect(result.rowLabels[0]).toBe('华东 / 电脑')
    expect(result.cells[0]).toEqual([100, 200])
    expect(result.cells[1]).toEqual([50, null])
  })

  it('空值使用 blankLabel 分组（默认与自定义）', () => {
    const withNull = [...sales, { 地区: '', 类别: '其他', 季度: 'Q3', 金额: 12 }]
    const result = buildPivotTable(withNull, { ...config, blankLabel: '(未填)' })
    expect(result.rowKeys).toContainEqual(['(未填)'])
    expect(result.colKeys).toContainEqual(['Q3'])
    const defaultLabel = buildPivotTable(withNull, config)
    expect(defaultLabel.rowKeys).toContainEqual(['(空白)'])
  })

  it('无行维度时仍按列分组并给出总计', () => {
    const result = buildPivotTable(sales, {
      rows: [],
      cols: [{ key: '季度' }],
      values: [{ key: '金额', agg: 'sum' }],
    })
    expect(result.rowKeys).toEqual([[]])
    expect(result.cells).toEqual([[450, 300]])
  })
})

describe('pivotToMatrix · 导出', () => {
  it('生成带表头、行总计与列总计的二维矩阵', () => {
    const result = buildPivotTable(sales, config)
    const matrix = pivotToMatrix(result, config)
    expect(matrix[0]![0]).toBe('地区')
    expect(matrix[0]![1]).toContain('Q1')
    expect(matrix[0]!.at(-1)).toContain('总计')
    expect(matrix[1]).toEqual(['华东', '150', '200', '350'])
    expect(matrix.at(-1)![0]).toBe('总计')
    expect(matrix.at(-1)!.at(-1)).toBe('750')
  })
})

describe('大数据量', () => {
  it('1 万行 × 100 分组在合理时间内完成', () => {
    const rows = Array.from({ length: 10_000 }, (_, i) => ({
      地区: `R${i % 100}`,
      季度: `Q${i % 4}`,
      金额: i % 7,
    }))
    const started = Date.now()
    const result = buildPivotTable(rows, config)
    expect(result.recordCount).toBe(10_000)
    expect(result.cells).toHaveLength(100)
    expect(Date.now() - started).toBeLessThan(2000)
  })
})
