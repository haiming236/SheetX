/**
 * SheetX 第 44 张 · AI 助手与智能数据分析 — 数据层
 *
 * AI 正式纳入 SheetX 产品体系。核心原则：
 * - SheetX 仍是纯前端嵌入式表格 SDK，不强制搭建 AI 云端服务器
 * - AI 层采用可插拔 Provider 架构（云端 API / 本地模型 / 企业 AI 服务）
 * - AI 生成/修改数据提供预览、确认和撤销机制
 */
import type { IconName } from './icons.js'

/** 左侧导航 */
export const SIDE_NAV = [
  { label: '首页', icon: 'gridView' as IconName, active: true },
  { label: 'Grid 表格', icon: 'tableStyle' as IconName },
  { label: 'Spreadsheet 电子表格', icon: 'gridView' as IconName },
  { label: 'AI 助手', icon: 'sparkles' as IconName },
  { label: '示例与教程', icon: 'code' as IconName },
  { label: '文档中心', icon: 'help' as IconName },
  { label: '关于我们', icon: 'help' as IconName },
]

/** 销售报表数据（设计稿 5 行） */
export interface SaleRow {
  product: string
  qty: number
  amount: number
  growth: number
  share: number
  color: string
}
export const SALE_ROWS: SaleRow[] = [
  { product: 'MacBook Pro', qty: 1250, amount: 1987500, growth: 12.5, share: 28.4, color: '#16a34a' },
  { product: 'iPhone 17', qty: 980, amount: 1568000, growth: 8.7, share: 22.4, color: '#2563eb' },
  { product: 'iPad Pro', qty: 720, amount: 1152000, growth: 10.2, share: 16.5, color: '#7c3aed' },
  { product: 'AirPods Pro', qty: 680, amount: 748000, growth: 6.8, share: 10.7, color: '#f59e0b' },
  { product: 'Apple Watch', qty: 520, amount: 624000, growth: 5.1, share: 8.9, color: '#0891b2' },
]
export const SALE_TOTAL = SALE_ROWS.reduce((a, r) => a + r.amount, 0) // 6,278,500
export const fmtMoney = (n: number) => '¥' + n.toLocaleString('zh-CN')
export const fmtNum = (n: number) => n.toLocaleString('zh-CN')

/** 销售趋势（7-11 月） */
export const TREND = [
  { month: '7月', revenue: 72, qty: 48 },
  { month: '8月', revenue: 100, qty: 68 },
  { month: '9月', revenue: 128, qty: 92 },
  { month: '10月', revenue: 112, qty: 78 },
  { month: '11月', revenue: 145, qty: 108 },
]

/** 可插拔 AI Provider */
export interface Provider {
  id: string
  name: string
  desc: string
  icon: IconName
  color: string
  badge: string
}
export const PROVIDERS: Provider[] = [
  { id: 'cloud', name: '自定义云端 API', desc: '接入你自己的 OpenAI / 兼容端点，密钥仅存本地', icon: 'database', color: '#2563eb', badge: '需 API Key' },
  { id: 'local', name: '本地模型', desc: 'Ollama / WebLLM 浏览器内运行，数据不出本机', icon: 'laptop', color: '#059669', badge: '零云端' },
  { id: 'enterprise', name: '企业 AI 服务', desc: '对接企业私有化部署，走内网与统一鉴权', icon: 'settings', color: '#7c3aed', badge: '内网' },
]
export type ProviderId = typeof PROVIDERS[number]['id']

/** AI 快捷操作（6 项，对应后续 AI 系列方向） */
export interface QuickAction { label: string; icon: IconName; prompt: string }
export const QUICK_ACTIONS: QuickAction[] = [
  { label: '生成销售报表', icon: 'chartBar', prompt: '根据当前数据生成销售报表' },
  { label: '分析数据趋势', icon: 'chartLine', prompt: '分析本月数据的趋势和异常' },
  { label: '创建图表', icon: 'chartPie', prompt: '根据数据自动创建合适的图表' },
  { label: '数据清洗', icon: 'sliders', prompt: '检查重复、缺失和异常数据' },
  { label: '智能问答', icon: 'sparkles', prompt: '帮我总结这份表格的关键信息' },
  { label: '公式推荐', icon: 'sigma', prompt: '推荐计算增长率的公式' },
]

/** 模拟 AI 回复（不调用任何真实 AI 服务） */
export const AI_REPLIES: Array<{ match: string[]; reply: string }> = [
  { match: ['趋势', '分析'], reply: '📈 已分析：近 5 个月销售额持续上升，11 月达到峰值 145 万；10 月有短暂回落（-12.5%）。MacBook Pro 贡献最大，建议加大其市场投放。' },
  { match: ['公式', '增长'], reply: 'fx 推荐公式：同比增长率 = (本期 - 上期) / 上期。在当前表格可用 = (C3-C2)/C2，设置单元格格式为百分比即可。' },
  { match: ['图表', '创建'], reply: '📊 已根据数据结构推荐：销售趋势用折线图（时间维度），产品销售占比用环形图（构成维度），均已插入表格下方。' },
  { match: ['清洗', '重复', '缺失'], reply: '🧹 扫描结果：5 行数据无重复、无缺失；Apple Watch 增长率 5.1% 低于均值，属于可关注异常值，非错误。' },
  { match: ['生成', '报表', '总结', '摘要'], reply: '✅ 已生成分析摘要：本月销售额 ¥6,278,500，同比增长 8.6%。MacBook Pro 表现最佳，占比 28.4%，建议加大推广力度。' },
  { match: ['销售', '数据'], reply: '📋 当前表格共 5 个产品，销售额合计 ¥6,278,500，平均 ¥1,255,700。需要我生成图表或导出分析结论吗？' },
]

/** AI 预览变更：模拟「AI 建议修改」的单元格 diff */
export interface PreviewChange { cell: string; field: string; before: string; after: string }
export interface PreviewPlan {
  id: string
  title: string
  desc: string
  changes: PreviewChange[]
}
export const PREVIEW_PLANS: Record<string, PreviewPlan> = {
  generate: {
    id: 'generate',
    title: 'AI 将新增 1 行模拟数据',
    desc: 'AI 根据「智能手表配件」描述生成以下业务数据，应用后可一键撤销。',
    changes: [
      { cell: 'A9', field: '产品名称', before: '（空）', after: 'MagSafe 充电器' },
      { cell: 'B9', field: '销售数量', before: '（空）', after: '1,420' },
      { cell: 'C9', field: '销售金额', before: '（空）', after: '¥426,000' },
      { cell: 'D9', field: '同比增长', before: '（空）', after: '+15.2%' },
    ],
  },
  clean: {
    id: 'clean',
    title: 'AI 建议清洗 2 处数据',
    desc: 'AI 识别到格式不一致，建议统一后方可应用，应用后可一键撤销。',
    changes: [
      { cell: 'C5', field: '销售金额', before: '¥748,000', after: '¥748,000.00' },
      { cell: 'E7', field: '占比', before: '8.9%', after: '9.0%' },
    ],
  },
}

/** 完整可持久化配置 */
export interface FullConfig {
  provider: ProviderId
  aiEnabled: boolean
  apiEndpoint: string
  modelName: string
  showAiPanel: boolean
}
export const DEFAULT_CONFIG: FullConfig = {
  provider: 'local',
  aiEnabled: true,
  apiEndpoint: 'https://api.example.com/v1/chat/completions',
  modelName: 'qwen2.5:7b',
  showAiPanel: true,
}
