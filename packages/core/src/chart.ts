/**
 * @sheetx/core - 图表（M4「图表」，零依赖 SVG 原生手写）
 *
 * 不引入 ECharts / Chart.js：输出纯矢量 SVG 字符串，放大不模糊、体积可控，
 * 与打印引擎（io/print.ts）的矢量纪律一致。Node 与浏览器均可运行。
 *
 * 支持：折线 / 分组柱状 / 饼图（三种）；自动刻度、网格、图例、标题、空数据态。
 */

export type ChartKind = 'line' | 'bar' | 'pie'

export interface ChartSeries {
  name: string
  values: number[]
  /** 显式颜色；缺省时按调色板顺序分配 */
  color?: string
}

export interface ChartSpec {
  kind: ChartKind
  /** 横轴分类标签 */
  categories: string[]
  series: ChartSeries[]
  title?: string
  width?: number
  height?: number
  /** 显示图例，默认 true */
  legend?: boolean
  /** 显示网格线，默认 true */
  grid?: boolean
  /** 调色板（十六进制），内置默认 8 色 */
  palette?: string[]
}

/** 默认调色板（高对比、深浅底通用） */
export const DEFAULT_CHART_PALETTE = [
  '#3b82f6', '#22c55e', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16',
]

interface ChartLayout {
  width: number
  height: number
  left: number
  top: number
  right: number
  bottom: number
  plotW: number
  plotH: number
  legendH: number
}

function layoutOf(spec: ChartSpec): ChartLayout {
  const width = Math.max(200, spec.width ?? 640)
  const height = Math.max(160, spec.height ?? 360)
  const titleH = spec.title ? 28 : 0
  const legendH = spec.legend === false ? 0 : 26
  const padding = { left: 52, right: 18, bottom: 36 }
  const top = 8 + titleH
  return {
    width,
    height,
    left: spec.kind === 'pie' ? 12 : padding.left,
    top,
    right: padding.right,
    bottom: padding.bottom,
    plotW: Math.max(10, width - (spec.kind === 'pie' ? 12 : padding.left) - padding.right),
    plotH: Math.max(10, height - top - padding.bottom - legendH),
    legendH,
  }
}

function escapeXml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

/** 取「整齐」刻度步长（1/2/2.5/5/10 × 10^n） */
function niceStep(raw: number): number {
  if (!Number.isFinite(raw) || raw <= 0) return 1
  const exponent = Math.floor(Math.log10(raw))
  const magnitude = 10 ** exponent
  const fraction = raw / magnitude
  const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10
  return nice * magnitude
}

interface Scale {
  min: number
  max: number
  ticks: number[]
}

function scaleOf(values: ReadonlyArray<number>): Scale {
  const finite = values.filter((value) => Number.isFinite(value))
  if (finite.length === 0) return { min: 0, max: 1, ticks: [0, 0.5, 1] }
  let min = Math.min(0, ...finite)
  let max = Math.max(0, ...finite)
  if (min === max) max = min + 1
  const step = niceStep((max - min) / 4)
  min = Math.floor(min / step) * step
  max = Math.ceil(max / step) * step
  const ticks: number[] = []
  for (let value = min; value <= max + step * 0.001; value += step) {
    ticks.push(Math.round(value * 1e6) / 1e6)
  }
  return { min, max, ticks }
}

function formatTick(value: number): string {
  if (Number.isInteger(value)) return String(value)
  return String(Math.round(value * 100) / 100)
}

function pointPath(values: ReadonlyArray<number>, scale: Scale, layout: ChartLayout, categories: number): string {
  const { left, top, plotW, plotH } = layout
  return values
    .map((value, index) => {
      const x = categories <= 1 ? left + plotW / 2 : left + (plotW * index) / (categories - 1)
      const ratio = (value - scale.min) / (scale.max - scale.min)
      const y = top + plotH - Math.max(0, Math.min(1, ratio)) * plotH
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')
}

/** 构建 SVG 图表（空数据返回带提示的占位 SVG） */
export function buildChartSvg(spec: ChartSpec): string {
  const layout = layoutOf(spec)
  const parts: string[] = []
  const open = (extra = ''): void => {
    parts.push(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${layout.width}" height="${layout.height}" ` +
        `viewBox="0 0 ${layout.width} ${layout.height}" ${extra}>`,
    )
    parts.push(`<rect x="0" y="0" width="${layout.width}" height="${layout.height}" fill="#fff"/>`)
  }
  open()
  const fontFamily = "'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif"
  const axisColor = '#94a3b8'
  const labelColor = '#64748b'

  if (spec.title) {
    parts.push(
      `<text x="${(layout.width / 2).toFixed(2)}" y="19" text-anchor="middle" font-family="${fontFamily}" ` +
        `font-size="14" font-weight="600" fill="#1f2937">${escapeXml(spec.title)}</text>`,
    )
  }

  const palette = spec.palette ?? DEFAULT_CHART_PALETTE
  const colors = spec.series.map((series, index) => series.color ?? palette[index % palette.length]!)

  if (spec.series.length === 0 || spec.categories.length === 0) {
    parts.push(
      `<text x="${(layout.width / 2).toFixed(2)}" y="${(layout.height / 2).toFixed(2)}" text-anchor="middle" ` +
        `font-family="${fontFamily}" font-size="14" fill="${labelColor}">暂无数据</text></svg>`,
    )
    return parts.join('')
  }

  // ---- 坐标轴 + 网格（饼图无坐标轴） ----
  let scale: Scale = { min: 0, max: 1, ticks: [] }
  if (spec.kind !== 'pie') {
    scale = scaleOf(spec.series.flatMap((series) => series.values))
    const { left, top, plotW, plotH } = layout
    if (spec.grid !== false) {
      for (const tick of scale.ticks) {
        const y = top + plotH - ((tick - scale.min) / (scale.max - scale.min)) * plotH
        parts.push(`<line x1="${left}" y1="${y.toFixed(2)}" x2="${(left + plotW).toFixed(2)}" y2="${y.toFixed(2)}" stroke="#e2e8f0" stroke-width="1"/>`)
        parts.push(
          `<text x="${(left - 6).toFixed(2)}" y="${(y + 4).toFixed(2)}" text-anchor="end" font-family="${fontFamily}" ` +
            `font-size="10" fill="${labelColor}">${formatTick(tick)}</text>`,
        )
      }
    }
    // 横轴标签（最多显示 12 个，其余省略避免重叠）
    const step = Math.max(1, Math.ceil(spec.categories.length / 12))
    spec.categories.forEach((category, index) => {
      if (index % step !== 0) return
      const x = spec.categories.length <= 1
        ? left + plotW / 2
        : left + (plotW * index) / (spec.categories.length - 1)
      const label = category.length > 8 ? category.slice(0, 8) + '…' : category
      parts.push(
        `<text x="${x.toFixed(2)}" y="${(top + plotH + 16).toFixed(2)}" text-anchor="middle" font-family="${fontFamily}" ` +
          `font-size="10" fill="${labelColor}">${escapeXml(label)}</text>`,
      )
    })
    parts.push(`<line x1="${left}" y1="${(top + plotH).toFixed(2)}" x2="${(left + plotW).toFixed(2)}" y2="${(top + plotH).toFixed(2)}" stroke="${axisColor}" stroke-width="1"/>`)
  }

  // ---- 图形 ----
  if (spec.kind === 'line') {
    const { left, top, plotW, plotH } = layout
    spec.series.forEach((series, index) => {
      const points = pointPath(series.values, scale, layout, spec.categories.length)
      parts.push(`<polyline points="${points}" fill="none" stroke="${colors[index]}" stroke-width="2" stroke-linejoin="round"/>`)
      series.values.forEach((value, i) => {
        const x = spec.categories.length <= 1 ? left + plotW / 2 : left + (plotW * i) / (spec.categories.length - 1)
        const y = top + plotH - ((value - scale.min) / (scale.max - scale.min)) * plotH
        parts.push(`<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="2.5" fill="#fff" stroke="${colors[index]}" stroke-width="1.5"/>`)
      })
    })
  } else if (spec.kind === 'bar') {
    const { left, top, plotW, plotH } = layout
    const groupWidth = plotW / spec.categories.length
    const barGap = Math.min(4, groupWidth * 0.08)
    const barWidth = Math.max(1, (groupWidth - barGap * (spec.series.length + 1)) / spec.series.length)
    spec.categories.forEach((_category, categoryIndex) => {
      const groupX = left + groupWidth * categoryIndex
      spec.series.forEach((series, seriesIndex) => {
        const value = series.values[categoryIndex] ?? 0
        const rawY = top + plotH - ((value - scale.min) / (scale.max - scale.min)) * plotH
        const baseline = top + plotH - ((0 - scale.min) / (scale.max - scale.min)) * plotH
        const x = groupX + barGap * (seriesIndex + 1) + barWidth * seriesIndex
        const y = Math.min(rawY, baseline)
        parts.push(
          `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${barWidth.toFixed(2)}" ` +
            `height="${Math.max(1, Math.abs(baseline - rawY)).toFixed(2)}" fill="${colors[seriesIndex]}"/>`,
        )
      })
    })
  } else {
    // pie：按首条系列绘制（多系列时忽略后续，与 Excel 饼图一致）
    const values = spec.series[0]!.values
    const total = values.reduce((sum, value) => sum + Math.max(0, value), 0)
    const cx = layout.left + layout.plotW / 2
    const cy = layout.top + layout.plotH / 2
    const radius = Math.max(10, Math.min(layout.plotW, layout.plotH) / 2 - 8)
    if (total <= 0) {
      parts.push(`<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${radius.toFixed(2)}" fill="#e2e8f0"/>`)
    } else {
      let angle = -Math.PI / 2
      values.forEach((value, index) => {
        const sweep = (Math.max(0, value) / total) * Math.PI * 2
        if (sweep <= 0) return
        const end = angle + sweep
        const x1 = cx + radius * Math.cos(angle)
        const y1 = cy + radius * Math.sin(angle)
        const x2 = cx + radius * Math.cos(end)
        const y2 = cy + radius * Math.sin(end)
        const largeArc = sweep > Math.PI ? 1 : 0
        parts.push(
          `<path d="M ${cx.toFixed(2)} ${cy.toFixed(2)} L ${x1.toFixed(2)} ${y1.toFixed(2)} ` +
            `A ${radius.toFixed(2)} ${radius.toFixed(2)} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z" ` +
            `fill="${palette[index % palette.length]}" stroke="#fff" stroke-width="1"/>`,
        )
        angle = end
      })
    }
  }

  // ---- 图例（底部居中） ----
  if (spec.legend !== false) {
    const labels = spec.kind === 'pie' ? spec.categories : spec.series.map((series) => series.name)
    const legendY = layout.height - 10
    const itemWidth = Math.min(180, (layout.width - 24) / Math.max(1, labels.length))
    const startX = Math.max(8, (layout.width - itemWidth * labels.length) / 2)
    labels.forEach((label, index) => {
      const x = startX + itemWidth * index
      parts.push(`<rect x="${x.toFixed(2)}" y="${(legendY - 9).toFixed(2)}" width="9" height="9" fill="${palette[index % palette.length]}"/>`)
      parts.push(
        `<text x="${(x + 13).toFixed(2)}" y="${legendY.toFixed(2)}" font-family="${fontFamily}" font-size="10" ` +
          `fill="${labelColor}">${escapeXml(label.length > 10 ? label.slice(0, 10) + '…' : label)}</text>`,
      )
    })
  }

  parts.push('</svg>')
  return parts.join('')
}

// ---------------------------------------------------------------------------
// 记录适配：分组求和 → ChartSpec
// ---------------------------------------------------------------------------

export interface ChartFromRecordsConfig {
  kind: ChartKind
  /** 分类字段（记录里的列名） */
  categoryField: string
  /** 数值字段（每条生成一个系列） */
  valueFields: ReadonlyArray<{ key: string; name?: string }>
  title?: string
  width?: number
  height?: number
}

/** 记录数组 → 图表规格：按分类字段分组，对各数值字段求和（保持分类首次出现顺序） */
export function chartFromRecords(
  records: ReadonlyArray<Record<string, unknown>>,
  config: ChartFromRecordsConfig,
): ChartSpec {
  const categories: string[] = []
  const categoryIndex = new Map<string, number>()
  const sums: number[][] = config.valueFields.map(() => [])
  for (const record of records) {
    const raw = record[config.categoryField]
    const category = raw === null || raw === undefined || raw === '' ? '(空白)' : String(raw)
    let index = categoryIndex.get(category)
    if (index === undefined) {
      index = categories.length
      categories.push(category)
      categoryIndex.set(category, index)
      config.valueFields.forEach((_field, vi) => sums[vi]!.push(0))
    }
    config.valueFields.forEach((field, vi) => {
      const value = record[field.key]
      const numeric = typeof value === 'number' && Number.isFinite(value)
        ? value
        : typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))
          ? Number(value)
          : 0
      sums[vi]![index] = (sums[vi]![index] ?? 0) + numeric
    })
  }
  return {
    kind: config.kind,
    categories,
    series: config.valueFields.map((field, vi) => ({
      name: field.name ?? field.key,
      values: sums[vi] ?? [],
    })),
    title: config.title,
    width: config.width,
    height: config.height,
  }
}
