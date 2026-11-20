/** 图表（M4）：零依赖 SVG 原生手写，坐标与转义回归 */
import { describe, it, expect } from 'vitest'
import { buildChartSvg, chartFromRecords, DEFAULT_CHART_PALETTE } from '../src/chart.js'
import type { ChartSpec } from '../src/chart.js'

const lineSpec: ChartSpec = {
  kind: 'line',
  title: '销售趋势',
  categories: ['Q1', 'Q2', 'Q3'],
  series: [
    { name: '华东', values: [0, 50, 100] },
    { name: '华南', values: [100, 50, 0] },
  ],
  width: 640,
  height: 360,
}

describe('buildChartSvg · 通用', () => {
  it('输出纯矢量 SVG，含标题/图例/坐标轴，无位图', () => {
    const svg = buildChartSvg(lineSpec)
    expect(svg.startsWith('<svg')).toBe(true)
    expect(svg).toContain('viewBox="0 0 640 360"')
    expect(svg).toContain('销售趋势')
    expect(svg).toContain('华东')
    expect(svg).toContain('华南')
    expect(svg).not.toContain('<image')
    expect(svg).not.toContain('base64')
    expect(svg.endsWith('</svg>')).toBe(true)
  })

  it('空数据返回占位 SVG（不抛错）', () => {
    const svg = buildChartSvg({ kind: 'bar', categories: [], series: [] })
    expect(svg).toContain('暂无数据')
    expect(svg.endsWith('</svg>')).toBe(true)
  })

  it('XML 特殊字符转义（标题/分类/系列名）', () => {
    const svg = buildChartSvg({
      kind: 'bar',
      title: '<A&B>',
      categories: ['<脚本>'],
      series: [{ name: '"X"', values: [1] }],
    })
    expect(svg).toContain('&lt;A&amp;B&gt;')
    expect(svg).toContain('&lt;脚本&gt;')
    expect(svg).toContain('&quot;X&quot;')
  })

  it('grid/legend 可关闭', () => {
    const plain = buildChartSvg(lineSpec)
    const minimal = buildChartSvg({ ...lineSpec, grid: false, legend: false })
    expect((plain.match(/stroke="#e2e8f0"/g) ?? []).length).toBeGreaterThan(0)
    expect(minimal).not.toContain('stroke="#e2e8f0"')
    expect(minimal).not.toContain('华东')
  })

  it('默认调色板循环分配，显式颜色优先', () => {
    const spec: ChartSpec = {
      kind: 'line',
      categories: ['A'],
      series: [
        { name: 's1', values: [1] },
        { name: 's2', values: [2], color: '#123456' },
      ],
    }
    const svg = buildChartSvg(spec)
    expect(svg).toContain(`stroke="${DEFAULT_CHART_PALETTE[0]}"`)
    expect(svg).toContain('stroke="#123456"')
  })
})

describe('buildChartSvg · 坐标回归', () => {
  it('折线点按数值线性映射：0 在基线、100 在顶部，x 等距', () => {
    // categories=3, width=640, left=52, right=18 → plotW=570; top=8+titleH(28)=36, bottom=36, legendH=26 → plotH=254
    const svg = buildChartSvg(lineSpec)
    const polyline = svg.match(/<polyline points="([^"]+)"/)![1]!
    const points = polyline.split(' ').map((point) => point.split(',').map(Number))
    expect(points[0]![0]).toBeCloseTo(52, 2)
    expect(points[1]![0]).toBeCloseTo(52 + 570 / 2, 2)
    expect(points[2]![0]).toBeCloseTo(52 + 570, 2)
    // 第一条 series 0→50→100，scale 0..100：y 从基线 290 到顶部 36
    expect(points[0]![1]).toBeCloseTo(298, 2)
    expect(points[1]![1]).toBeCloseTo(36 + 262 / 2, 2)
    expect(points[2]![1]).toBeCloseTo(36, 2)
  })

  it('柱状图：3 类 × 2 系列 = 6 个柱，宽度为正且落在绘图区内', () => {
    const svg = buildChartSvg({ ...lineSpec, kind: 'bar', grid: false, legend: false })
    const bars = [...svg.matchAll(/<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/g)]
      .filter((bar) => Number(bar[3]) > 10 && Number(bar[1]) >= 52) // 排除背景与图例色块
    expect(bars).toHaveLength(6)
    for (const bar of bars) {
      expect(Number(bar[3])).toBeGreaterThan(0)
      expect(Number(bar[1])).toBeGreaterThanOrEqual(52)
      expect(Number(bar[1]) + Number(bar[3])).toBeLessThanOrEqual(640 - 18 + 0.1)
    }
  })

  it('饼图：每个分类一个扇形 path，角度合计整圆', () => {
    const svg = buildChartSvg({
      kind: 'pie',
      categories: ['甲', '乙', '丙'],
      series: [{ name: '占比', values: [1, 1, 2] }],
      legend: false,
    })
    expect((svg.match(/<path d=/g) ?? []).length).toBe(3)
    // 分类色按调色板分配（历史 bug：按系列建 colors → 越界成 undefined，浏览器渲染黑色）
    expect(svg).not.toContain('fill="undefined"')
    expect(svg).toContain(`fill="${DEFAULT_CHART_PALETTE[0]}"`)
    expect(svg).toContain(`fill="${DEFAULT_CHART_PALETTE[1]}"`)
    expect(svg).toContain(`fill="${DEFAULT_CHART_PALETTE[2]}"`)
  })
})

describe('chartFromRecords · 记录适配', () => {
  it('按分类字段分组求和，字符串数值可转数，顺序按首次出现', () => {
    const spec = chartFromRecords(
      [
        { 地区: '华东', 电脑: 10, 手机: 5 },
        { 地区: '华南', 电脑: 20, 手机: 8 },
        { 地区: '华东', 电脑: '5', 手机: 2 },
        { 地区: '', 电脑: 1 },
      ],
      { kind: 'bar', categoryField: '地区', valueFields: [{ key: '电脑', name: '电脑销量' }, { key: '手机' }] },
    )
    expect(spec.categories).toEqual(['华东', '华南', '(空白)'])
    expect(spec.series[0]).toEqual({ name: '电脑销量', values: [15, 20, 1] })
    expect(spec.series[1]).toEqual({ name: '手机', values: [7, 8, 0] })
    // 适配结果可直接渲染
    expect(buildChartSvg(spec)).toContain('电脑销量')
  })
})
