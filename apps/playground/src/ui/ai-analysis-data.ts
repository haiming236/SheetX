/**
 * SheetX 第 46 张 · AI 数据分析 — 数据与领域逻辑
 *
 * 原则：指标、洞察全部由表格数据计算得出，不写死结论；
 * 编辑表格后 AI 面板与图表联动，保证"看到的分析"和"真实数据"一致。
 */

export interface SaleRow {
  /** 月份，如 '1月' */
  month: string
  /** 销售额（万元） */
  amount: number
  /** 订单量 */
  orders: number
  /** 同比增长（%） */
  yoy: number
}

export const SALE_ROWS: SaleRow[] = [
  { month: '1月', amount: 120.5, orders: 1230, yoy: 12.5 },
  { month: '2月', amount: 135.8, orders: 1380, yoy: 14.2 },
  { month: '3月', amount: 142.7, orders: 1420, yoy: 8.6 },
  { month: '4月', amount: 156.3, orders: 1560, yoy: 9.4 },
  { month: '5月', amount: 168.9, orders: 1680, yoy: 8.1 },
  { month: '6月', amount: 175.2, orders: 1730, yoy: 3.7 },
]

export interface ChannelSlice {
  name: string
  value: number
  color: string
}

export const CHANNELS: ChannelSlice[] = [
  { name: '线上', value: 68, color: '#10b981' },
  { name: '线下', value: 32, color: '#a7f3d0' },
]

export interface Insight {
  text: string
  tone: 'good' | 'warn' | 'info'
}

export interface AnalysisResult {
  /** 销售额合计（万元） */
  total: number
  /** 订单总量 */
  orders: number
  /** 平均同比（%） */
  avgYoy: number
  /** 累计增长（首月 → 末月，%） */
  growth: number
  /** 连续增长月数 */
  streak: number
  /** 同比最高月份 */
  peak: SaleRow | null
  /** 同比回落月份 */
  dip: SaleRow | null
  insights: Insight[]
}

const fmt1 = (value: number): string => value.toFixed(1)

/** 从当前表格数据计算分析结果（唯一的"AI 结论"来源） */
export function analyze(rows: readonly SaleRow[]): AnalysisResult {
  if (rows.length === 0) {
    return {
      total: 0, orders: 0, avgYoy: 0, growth: 0, streak: 0,
      peak: null, dip: null, insights: [{ text: '暂无数据可分析，请先在表格中录入销售数据。', tone: 'warn' }],
    }
  }

  const total = rows.reduce((sum, row) => sum + row.amount, 0)
  const orders = rows.reduce((sum, row) => sum + row.orders, 0)
  const avgYoy = rows.reduce((sum, row) => sum + row.yoy, 0) / rows.length
  const first = rows[0]!
  const last = rows[rows.length - 1]!
  const growth = first.amount > 0 ? ((last.amount - first.amount) / first.amount) * 100 : 0

  let streak = 1
  for (let i = rows.length - 1; i > 0; i--) {
    if ((rows[i]?.amount ?? 0) > (rows[i - 1]?.amount ?? 0)) streak++
    else break
  }

  const peak = rows.reduce((best, row) => (row.yoy > (best?.yoy ?? -Infinity) ? row : best), rows[0])
  const dip = rows.reduce((worst, row) => (row.yoy < (worst?.yoy ?? Infinity) ? row : worst), rows[0])

  const insights: Insight[] = []
  insights.push({
    text: streak >= 2
      ? `销售额连续 ${streak} 个月增长，累计增长 ${fmt1(growth)}%`
      : `销售额未形成连续增长，首末月变化 ${fmt1(growth)}%`,
    tone: streak >= 2 ? 'good' : 'warn',
  })
  if (peak) insights.push({ text: `${peak.month}销售增速最高，达到 ${peak.yoy.toFixed(1)}%`, tone: 'good' })
  if (dip && dip.yoy < avgYoy) {
    insights.push({
      text: `${dip.month}增速回落至 ${dip.yoy.toFixed(1)}%，建议关注市场变化`,
      tone: 'warn',
    })
  }
  insights.push({ text: `平均同比 ${fmt1(avgYoy)}%，订单总量 ${orders.toLocaleString('zh-CN')} 单`, tone: 'info' })

  return { total, orders, avgYoy, growth, streak, peak, dip, insights }
}

/** 根据用户追问生成回复（离线规则式，不依赖任何 AI 服务） */
export function replyTo(prompt: string, data: AnalysisResult): string {
  const text = prompt.trim()
  if (!text) return '请输入你想了解的问题。'
  if (/异常|回落|风险|下降/.test(text)) {
    return data.dip
      ? `${data.dip.month}同比增速为 ${data.dip.yoy.toFixed(1)}%，低于平均 ${data.avgYoy.toFixed(1)}%，是当前最需要关注的变化点。建议结合订单量（${data.dip.orders.toLocaleString('zh-CN')} 单）判断是需求波动还是价格因素。`
      : '当前数据中没有发现明显异常，各月同比保持在合理区间。'
  }
  if (/渠道|线上|线下|占比/.test(text)) {
    const online = CHANNELS.find((item) => item.name === '线上')?.value ?? 0
    return `销售渠道中线上占 ${online}%、线下占 ${100 - online}%。按当前销售额 ${data.total.toFixed(1)} 万元估算，线上贡献约 ${(data.total * online / 100).toFixed(1)} 万元。`
  }
  if (/图表|可视化|柱状|趋势图/.test(text)) {
    return '已在工作区生成组合趋势图：绿色柱形为销售额（左轴），折线为同比增速（右轴）。点击「插入图表」可再插入一份。'
  }
  if (/增长|趋势|表现|总结/.test(text)) {
    return `上半年销售额合计 ${data.total.toFixed(1)} 万元，首末月累计增长 ${data.growth.toFixed(1)}%，连续 ${data.streak} 个月保持增长；平均同比 ${data.avgYoy.toFixed(1)}%。`
  }
  return `已收到问题「${text}」。基于当前 ${data.total.toFixed(1)} 万元销售额与 ${data.orders.toLocaleString('zh-CN')} 单订单，我在洞察区更新了关键结论，你可以继续追问「分析异常」或「看看渠道占比」。`
}

/** 生成文字报告（可复制 / 下载） */
export function buildReport(rows: readonly SaleRow[], data: AnalysisResult): string {
  const lines = [
    'SheetX 销售数据分析报告',
    '========================',
    `生成时间：${new Date().toLocaleString('zh-CN')}`,
    '',
    `销售额合计：${data.total.toFixed(1)} 万元`,
    `订单总量：${data.orders.toLocaleString('zh-CN')} 单`,
    `平均同比：${data.avgYoy.toFixed(1)}%`,
    `累计增长：${data.growth.toFixed(1)}%`,
    '',
    '月度明细',
    '--------',
    ...rows.map((row) => `${row.month}\t销售额 ${row.amount.toFixed(1)} 万\t订单 ${row.orders}\t同比 ${row.yoy.toFixed(1)}%`),
    '',
    '关键洞察',
    '--------',
    ...data.insights.map((item, index) => `${index + 1}. ${item.text}`),
    '',
    '渠道占比',
    '--------',
    ...CHANNELS.map((item) => `${item.name} ${item.value}%`),
  ]
  return lines.join('\n')
}

export const QUICK_PROMPTS = ['分析一下上半年的销售情况，并生成图表', '有没有异常月份？', '渠道占比如何？']

export const fmtNum = (n: number): string => n.toLocaleString('zh-CN')
