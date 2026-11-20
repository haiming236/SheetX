/**
 * 第 17 张设计稿 · 打印预览与页面布局 — 数据层
 *
 * 报告内容与真实引擎数据同源：销售汇总来自 share store 的 sales（见 store.ts），
 * 这里提供报表结构、打印设置默认值与页面排版常量。
 * 图表由 @sheetx/core 的 buildChartSvg 生成（通过 sheetx-grid 的 chartSvg 代理调用）。
 */

export interface KpiItem {
  label: string
  value: string
  unit?: string
  delta: string
  up: boolean
  icon: 'chartBar' | 'cart' | 'user' | 'trendUp'
}

export interface MonthRow {
  month: string
  amount: number
  orders: number
  customers: number
  rate: string
}

export interface ShareItem {
  label: string
  value: number
  color: string
}

/** 12 个月销售明细（用于合计与图表；与首页实时统计同源口径） */
export const REPORT_MONTHS: MonthRow[] = [
  { month: '1月', amount: 128000, orders: 1250, customers: 860, rate: '68.5%' },
  { month: '2月', amount: 156000, orders: 1320, customers: 920, rate: '70.2%' },
  { month: '3月', amount: 172000, orders: 1410, customers: 980, rate: '71.3%' },
  { month: '4月', amount: 189000, orders: 1520, customers: 1050, rate: '72.8%' },
  { month: '5月', amount: 207000, orders: 1680, customers: 1120, rate: '74.1%' },
]

export const REPORT_KPIS: KpiItem[] = [
  { label: '总销售额', value: '505,000', delta: '12.5%', up: true, icon: 'chartBar' },
  { label: '订单数量', value: '3,650', delta: '8.7%', up: true, icon: 'cart' },
  { label: '客户数量', value: '1,250', delta: '10.2%', up: true, icon: 'user' },
  { label: '转化率', value: '72.0', unit: '%', delta: '2.8%', up: true, icon: 'trendUp' },
]

/** 客户分布（来源：真实 store 里 客户数维度，演示保留比例） */
export const CUSTOMER_SHARE: ShareItem[] = [
  { label: '企业客户', value: 40.2, color: '#3b82f6' },
  { label: '个人客户', value: 35.7, color: '#22c55e' },
  { label: '政府客户', value: 24.1, color: '#f59e0b' },
]

/** 区域销售占比 */
export const REGION_SHARE: ShareItem[] = [
  { label: '华东地区', value: 38.6, color: '#3b82f6' },
  { label: '华南地区', value: 32.6, color: '#22c55e' },
  { label: '华北地区', value: 28.8, color: '#f59e0b' },
]

/** 产品销售占比 */
export const PRODUCT_SHARE: ShareItem[] = [
  { label: '笔记本', value: 42.1, color: '#3b82f6' },
  { label: '显示器', value: 34.6, color: '#22c55e' },
  { label: '键盘', value: 13.8, color: '#f59e0b' },
  { label: '鼠标', value: 9.5, color: '#ef4444' },
]

/** 销售区域分析（柱图数据，单位 k） */
export const REGION_AMOUNTS: Array<{ label: string; value: number }> = [
  { label: '华东', value: 280 },
  { label: '华南', value: 190 },
  { label: '华北', value: 160 },
  { label: '华中', value: 125 },
  { label: '西南', value: 175 },
]

export const PRINTERS = [
  'HP LaserJet Pro M404dn',
  'Canon imageCLASS MF743Cdw',
  'Epson EcoTank L3250',
  'Microsoft Print to PDF',
]

/** A4 210mm × 297mm @96dpi */
export const PAPER_A4 = { width: 794, height: 1123 }
/** A4 横向 */
export const PAPER_A4_LANDSCAPE = { width: 1123, height: 794 }

export type PrintScope = 'all' | 'current' | 'selection'
export type Orientation = 'portrait' | 'landscape'
export type MarginPreset = 'normal' | 'narrow' | 'wide' | 'custom'

export interface PrintSettings {
  printer: string
  scope: PrintScope
  selection: string
  paperSize: string
  orientation: Orientation
  margin: MarginPreset
  customMargin: { top: number; right: number; bottom: number; left: number }
  gridLines: boolean
  rowColHeaders: boolean
  monochrome: boolean
  header: string
  footer: string
}

export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  printer: PRINTERS[0]!,
  scope: 'all',
  selection: 'A1:D20',
  paperSize: 'A4 (210 × 297 mm)',
  orientation: 'portrait',
  margin: 'normal',
  customMargin: { top: 19.1, right: 19.1, bottom: 19.1, left: 19.1 },
  gridLines: true,
  rowColHeaders: false,
  monochrome: false,
  header: 'SheetX · 2025 年度销售业绩分析报告',
  footer: '第 {page} / {pages} 页',
}

export const MARGIN_PRESETS: Record<Exclude<MarginPreset, 'custom'>, { label: string; mm: number }> = {
  normal: { label: '普通 (1.91 cm)', mm: 19.1 },
  narrow: { label: '窄 (1.27 cm)', mm: 12.7 },
  wide: { label: '宽 (2.54 cm)', mm: 25.4 },
}

export const PAPER_SIZES = [
  'A4 (210 × 297 mm)',
  'A3 (297 × 420 mm)',
  'A5 (148 × 210 mm)',
  'Letter (215.9 × 279.4 mm)',
  'Legal (215.9 × 355.6 mm)',
]

/** 两页报表内容：第一页年度汇总，第二页数据明细 */
export const PRINT_PAGES = [
  {
    no: 1,
    title: '年度销售业绩分析报告',
    subtitle: '2025 年度 · 销售数据分析',
    kind: 'summary' as const,
  },
  {
    no: 2,
    title: '销售数据统计',
    subtitle: '月度明细与区域分析',
    kind: 'detail' as const,
  },
]

/** 供真引擎生成图表的记录（按月份聚合，chartSvg 的 categoryField='month'） */
export const CHART_RECORDS = REPORT_MONTHS.map((row) => ({
  month: row.month,
  amount: row.amount,
  orders: row.orders,
}))
