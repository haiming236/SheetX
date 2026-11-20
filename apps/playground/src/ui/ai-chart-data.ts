/**
 * SheetX 第 48 张 · AI 智能图表生成与可视化 — 数据与领域逻辑
 *
 * 自然语言 → 图表类型选择 → 数据范围识别 → 可编辑图表 + 分析洞察。
 * 所有指标由数据实时计算，图表为 SVG 原生绘制（零依赖）。
 */

export interface MonthRow {
  month: string
  amount: number
  yoy: number
}

export const MONTH_ROWS: MonthRow[] = [
  { month: '1月', amount: 120.5, yoy: 12.5 },
  { month: '2月', amount: 135.8, yoy: 14.2 },
  { month: '3月', amount: 142.7, yoy: 8.6 },
  { month: '4月', amount: 156.3, yoy: 9.4 },
  { month: '5月', amount: 168.9, yoy: 8.1 },
  { month: '6月', amount: 175.2, yoy: 3.7 },
]

export interface ChannelSlice { name: string; value: number; color: string }

export const CHANNELS: ChannelSlice[] = [
  { name: '线上', value: 68.5, color: '#10b981' },
  { name: '线下', value: 31.5, color: '#a7f3d0' },
]

/** 图表类型（AI 根据语义自动选择，用户可手动切换） */
export type ChartKind = 'combo' | 'bar' | 'line' | 'pie' | 'area'

export interface ChartSpec {
  kind: ChartKind
  title: string
  /** 数据范围（行索引，含） */
  from: number
  to: number
  /** 使用的字段 */
  fields: Array<'amount' | 'yoy'>
  /** 图表在表格中的锚点列（D/E/F…） */
  anchorCol: string
}

export interface Analysis {
  total: number
  avgYoy: number
  growth: number
  peak: MonthRow | null
  fast: MonthRow[]
  forecast: number
  insights: string[]
}

/** 从数据计算全部洞察（不使用写死文案） */
export function analyze(rows: readonly MonthRow[]): Analysis {
  if (rows.length === 0) {
    return {
      total: 0, avgYoy: 0, growth: 0, peak: null, fast: [], forecast: 0,
      insights: ['暂无数据，请先在表格中录入销售数据。'],
    }
  }
  const total = rows.reduce((sum, row) => sum + row.amount, 0)
  const avgYoy = rows.reduce((sum, row) => sum + row.yoy, 0) / rows.length
  const first = rows[0]!
  const last = rows[rows.length - 1]!
  const growth = first.amount > 0 ? ((last.amount - first.amount) / first.amount) * 100 : 0
  const peak = rows.reduce((best, row) => (row.amount > (best?.amount ?? -Infinity) ? row : best), rows[0])
  const fast = rows.filter((row) => row.yoy > avgYoy)
  const slope = rows.length > 1 ? (last.amount - first.amount) / (rows.length - 1) : 0
  const forecast = last.amount + slope

  const insights: string[] = []
  insights.push(`上半年销售额同比增长 ${avgYoy.toFixed(1)}%，整体呈稳步上升趋势`)
  if (fast.length > 0) {
    const names = fast.slice(0, 2).map((row) => row.month).join(' 与 ')
    insights.push(`${names}增长较快，建议重点关注市场机会`)
  } else {
    insights.push('各月增速较为平稳，建议拓展新的增长点')
  }
  insights.push(`预计下半年有望突破 ${Math.ceil(forecast / 10) * 10} 万元`)

  return { total, avgYoy, growth, peak, fast, forecast, insights }
}

/** 自然语言 → 图表规格（关键词识别，覆盖常见分析目标） */
export function understandPrompt(prompt: string): ChartSpec {
  const text = prompt.trim()
  const lower = text.toLowerCase()

  let kind: ChartKind = 'combo'
  let fields: Array<'amount' | 'yoy'> = ['amount', 'yoy']
  let title = '上半年销售趋势分析'

  if (/饼|占比|构成|比例|pie|渠道/.test(lower)) {
    kind = 'pie'
    fields = ['amount']
    title = '销售渠道占比分析'
  } else if (/柱状|柱形|对比|bar/.test(lower)) {
    kind = 'bar'
    fields = ['amount']
    title = '月度销售额对比'
  } else if (/折线|趋势|走势|line|变化/.test(lower)) {
    kind = 'line'
    fields = ['amount']
    title = '销售额变化趋势'
  } else if (/面积|area/.test(lower)) {
    kind = 'area'
    fields = ['amount']
    title = '销售额累积趋势'
  }

  // 数据范围识别
  let from = 0
  let to = MONTH_ROWS.length - 1
  const monthMatches = [...text.matchAll(/([1-9]|1[0-2])月/g)].map((match) => Number(match[1]) - 1)
  if (monthMatches.length >= 2) {
    from = Math.max(0, Math.min(...monthMatches))
    to = Math.min(MONTH_ROWS.length - 1, Math.max(...monthMatches))
  } else if (monthMatches.length === 1) {
    from = to = monthMatches[0]!
  }
  if (/上半年|半年/.test(text)) { from = 0; to = Math.min(5, MONTH_ROWS.length - 1) }

  return { kind, title, from, to, fields, anchorCol: 'D' }
}

/** 追问 → 分析回复 */
export function replyTo(prompt: string, data: Analysis): string {
  const text = prompt.trim()
  if (/渠道|占比|线上|线下/.test(text)) {
    return `线上渠道占 ${CHANNELS[0]!.value}%，线下占 ${CHANNELS[1]!.value}%。按当前销售额 ${data.total.toFixed(1)} 万元估算，线上贡献约 ${(data.total * CHANNELS[0]!.value / 100).toFixed(1)} 万元。`
  }
  if (/预测|下半年|未来|预计/.test(text)) {
    return `按当前月均增长趋势，预计下半年销售额可达 ${data.forecast.toFixed(1)} 万元左右；建议关注增速回落的月份并及时调整策略。`
  }
  if (/异常|回落|下降|风险/.test(text)) {
    const slow = [...MONTH_ROWS].sort((a, b) => a.yoy - b.yoy)[0]
    return slow ? `${slow.month}同比增速 ${slow.yoy.toFixed(1)}% 为最低点，低于平均 ${data.avgYoy.toFixed(1)}%，建议重点复盘该月的市场活动。` : '当前没有明显异常月份。'
  }
  if (/图表|可视化|趋势/.test(text)) {
    return `已为你生成可编辑图表：当前展示 ${data.insights[0] ?? '销售趋势'}。你可以切换图表类型、调整数据范围，或一键插入到表格。`
  }
  return `已收到「${text}」。当前数据销售额合计 ${data.total.toFixed(1)} 万元，平均同比 ${data.avgYoy.toFixed(1)}%，${data.insights[0] ?? ''}`
}

/** 生成分析报告 */
export function buildReport(rows: readonly MonthRow[], data: Analysis): string {
  return [
    'SheetX AI 图表分析报告',
    '====================',
    `生成时间：${new Date().toLocaleString('zh-CN')}`,
    '',
    `销售额合计：${data.total.toFixed(1)} 万元`,
    `平均同比：${data.avgYoy.toFixed(1)}%`,
    `累计增长：${data.growth.toFixed(1)}%`,
    `下半年预测：${data.forecast.toFixed(1)} 万元`,
    '',
    '月度明细',
    '--------',
    ...rows.map((row) => `${row.month}\t销售额 ${row.amount.toFixed(1)} 万\t同比 ${row.yoy.toFixed(1)}%`),
    '',
    '分析洞察',
    '--------',
    ...data.insights.map((text, index) => `${index + 1}. ${text}`),
    '',
    '渠道占比',
    '--------',
    ...CHANNELS.map((item) => `${item.name} ${item.value}%`),
  ].join('\n')
}

export const CHART_KINDS: Array<{ kind: ChartKind; label: string; icon: 'chartCombo' | 'chartBar' | 'chartLine' | 'chartPie' | 'chartArea' }> = [
  { kind: 'combo', label: '组合图', icon: 'chartCombo' },
  { kind: 'bar', label: '柱状图', icon: 'chartBar' },
  { kind: 'line', label: '折线图', icon: 'chartLine' },
  { kind: 'pie', label: '饼图', icon: 'chartPie' },
  { kind: 'area', label: '面积图', icon: 'chartArea' },
]

export const DEFAULT_PROMPT = '生成上半年销售趋势图，并分析销售情况'
