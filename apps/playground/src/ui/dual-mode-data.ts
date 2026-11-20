/**
 * SheetX 第 38 张 · Grid 与 Spreadsheet 双模式对比体验 — 数据层
 *
 * 同一套底层引擎的两种交互：左侧 ERP 风格业务数据网格，右侧 Excel 风格电子表格。
 * 零依赖，纯数据 + 类型定义。
 */

export type ViewMode = 'dual' | 'grid' | 'sheet'
export type OrderStatus = '已发货' | '待发货' | '退途中'

/** Grid 模式 · 业务订单（设计稿 7 行） */
export interface Order {
  id: string
  customer: string
  date: string
  amount: number
  status: OrderStatus
}

export const GRID_ORDERS: Order[] = [
  { id: 'S02025101001', customer: '北京华联', date: '2025-11-01', amount: 12800, status: '已发货' },
  { id: 'S02025101002', customer: '上海百货', date: '2025-11-02', amount: 8560, status: '待发货' },
  { id: 'S02025101003', customer: '深圳科技', date: '2025-11-03', amount: 15200, status: '已发货' },
  { id: 'S02025101004', customer: '广州商贸', date: '2025-11-04', amount: 6780, status: '退途中' },
  { id: 'S02025101005', customer: '杭州电子', date: '2025-11-05', amount: 9960, status: '已发货' },
  { id: 'S02025101006', customer: '成都科技', date: '2025-11-06', amount: 11300, status: '已发货' },
  { id: 'S02025101007', customer: '武汉商贸', date: '2025-11-07', amount: 7520, status: '待发货' },
]

export const STATUS_OPTIONS: Array<'全部状态' | OrderStatus> = ['全部状态', '已发货', '待发货', '退途中']
export const MONTH_OPTIONS = ['本月', '上月', '近 3 个月', '全部时间']

/** Spreadsheet 模式 · 销售报表（设计稿 1-5 月 + 合计） */
export interface SaleRow {
  month: string
  revenue: number
  cost: number
  profit: number
  margin: string
}

export const SHEET_ROWS: SaleRow[] = [
  { month: '1月', revenue: 120000, cost: 80000, profit: 40000, margin: '33.3%' },
  { month: '2月', revenue: 135000, cost: 90000, profit: 45000, margin: '33.3%' },
  { month: '3月', revenue: 148000, cost: 96000, profit: 52000, margin: '35.1%' },
  { month: '4月', revenue: 160000, cost: 102000, profit: 58000, margin: '36.3%' },
  { month: '5月', revenue: 175000, cost: 110000, profit: 65000, margin: '37.1%' },
]
export const SHEET_TOTAL: SaleRow = { month: '合计', revenue: 718000, cost: 478000, profit: 240000, margin: '33.4%' }
export const SHEET_COLUMNS = ['A', 'B', 'C', 'D', 'E'] as const
export const SHEET_HEADERS = ['月份', '销售额', '成本', '利润', '利润率'] as const

/** 顶部文档菜单 */
export const TOP_MENU = ['首页', '功能演示', '组件示例', 'API 文档', '关于我们'] as const

/** 左侧功能演示导航 */
export const SIDE_NAV = [
  { label: '双模式对比', icon: 'split', route: '' },
  { label: '数据编辑', icon: 'edit', route: 'edit' },
  { label: '公式计算', icon: 'fx', route: 'playground-all' },
  { label: '筛选排序', icon: 'filter', route: 'adv-filter' },
  { label: '图表分析', icon: 'chartBar', route: 'chart' },
  { label: '打印导出', icon: 'print', route: 'print' },
  { label: '主题切换', icon: 'palette', route: 'theme' },
] as const

export const MORE_NAV = [
  { label: '表单集成', icon: 'tableStyle', route: 'plugins' },
  { label: '数据联动', icon: 'link', route: 'datasource' },
  { label: '自定义渲染', icon: 'code', route: 'plugin-dev' },
] as const

/** 两侧模式优势 */
export const GRID_ADVANTAGES = [
  '专业的业务数据展示，支持复杂表格操作',
  '丰富的行列交互，适合 ERP / 企业应用',
  '高性能数据处理，支持海量数据',
] as const
export const SHEET_ADVANTAGES = [
  '完整的表格编辑体验，支持公式与计算',
  '灵活的数据分析，内置图表功能',
  '熟悉的 Excel 操作，轻松上手',
] as const

/** 状态徽章配色（浅 / 深主题一致） */
export const STATUS_COLOR: Record<OrderStatus, string> = {
  已发货: '#16a34a',
  待发货: '#d97706',
  退途中: '#dc2626',
}

/** 完整可持久化配置 */
export interface FullConfig {
  view: ViewMode
  statusFilter: '全部状态' | OrderStatus
  monthFilter: string
  search: string
  selectedOrder: string | null
  checked: string[]
  pageSize: number
  sheetCell: string
  sheetFont: string
  sheetSize: number
  sheetBold: boolean
  sheetItalic: boolean
  sheetUnderline: boolean
  align: 'left' | 'center' | 'right'
  showGridChart: boolean
}

export const DEFAULT_CONFIG: FullConfig = {
  view: 'dual',
  statusFilter: '全部状态',
  monthFilter: '本月',
  search: '',
  selectedOrder: 'S02025101002',
  checked: ['S02025101002'],
  pageSize: 10,
  sheetCell: 'A1',
  sheetFont: '微软雅黑',
  sheetSize: 14,
  sheetBold: false,
  sheetItalic: false,
  sheetUnderline: false,
  align: 'left',
  showGridChart: true,
}

/** 千分位格式化 */
export const fmt = (n: number): string => n.toLocaleString('zh-CN')
