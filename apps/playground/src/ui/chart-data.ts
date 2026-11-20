/**
 * SheetX 第 12 张 · 图表与数据可视化 — 静态数据
 */
import type { IconName } from './icons.js'

export const TOP_MENUS = ['文件', '开始', '插入', '数据', '公式', '视图', '设置']

export const COL_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N']
export const ROW_COUNT = 17

/** 网格单元尺寸（px） */
export const CELL_W = 64
export const CELL_H = 32
export const ROW_HEAD_W = 44
export const COL_HEAD_H = 26

/** 销售分析表 */
export const TABLE_HEADERS = ['月份', '销售额', '订单数', '客户数', '转化率']
export const TABLE_ROWS: string[][] = [
  ['1月', '128,000', '1,250', '860', '68.5%'],
  ['2月', '156,000', '1,320', '920', '70.2%'],
  ['3月', '172,000', '1,410', '980', '71.3%'],
  ['4月', '189,000', '1,520', '1,050', '72.8%'],
  ['5月', '207,000', '1,680', '1,120', '74.1%'],
]

export const MONTHS = ['1月', '2月', '3月', '4月', '5月']
export const SALES = [128000, 156000, 172000, 189000, 207000]
export const ORDERS = [1250, 1320, 1410, 1520, 1680]

/** 客户分布（环形图） */
export const CUSTOMER_SPLIT = [
  { name: '企业客户', pct: 40.2, color: '#3b82f6' },
  { name: '个人客户', pct: 35.7, color: '#22c55e' },
  { name: '政府客户', pct: 24.1, color: '#f59e0b' },
]
export const CUSTOMER_TOTAL = '1,120'

/** 销售额占比（饼图） */
export const REGION_SPLIT = [
  { name: '华东地区', pct: 38.4, color: '#3b82f6' },
  { name: '华南地区', pct: 32.6, color: '#22c55e' },
  { name: '华北地区', pct: 29.0, color: '#f59e0b' },
]

/** 季度对比（折线图） */
export const QUARTERS = ['一季度', '二季度', '三季度', '四季度']
export const Y2024 = [120000, 150000, 180000, 210000]
export const Y2025 = [150000, 205000, 235000, 265000]

export type ChartTypeKey = 'bar' | 'line' | 'pie' | 'hbar' | 'area' | 'combo'

export const CHART_TYPES: { key: ChartTypeKey; label: string; icon: IconName }[] = [
  { key: 'bar', label: '柱状图', icon: 'chartBar' },
  { key: 'line', label: '折线图', icon: 'chartLine' },
  { key: 'pie', label: '饼图', icon: 'chartPie' },
  { key: 'hbar', label: '条形图', icon: 'chartHBar' },
  { key: 'area', label: '面积图', icon: 'chartArea' },
  { key: 'combo', label: '组合图', icon: 'chartCombo' },
]

export interface StylePreset {
  key: string
  label: string
  primary: string
  secondary: string
}

export const STYLE_PRESETS: StylePreset[] = [
  { key: 'classic', label: '经典蓝橙', primary: '#3b82f6', secondary: '#f59e0b' },
  { key: 'emerald', label: '翡翠绿', primary: '#10b981', secondary: '#14b8a6' },
  { key: 'violet', label: '梦幻紫', primary: '#8b5cf6', secondary: '#ec4899' },
]

export const SERIES_OPTIONS = ['销售额', '订单数']

export const PANEL_TABS = ['类型', '数据', '样式', '其他']

export const SHEET_TABS = ['销售分析', '数据明细', '客户分析', '图表统计']
