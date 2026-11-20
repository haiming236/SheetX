/**
 * SheetX 第 37 张 · 综合功能 Playground — 数据
 *
 * Grid / Spreadsheet 双模式 + 编辑 + 公式 + 筛选排序 + 主题 + 功能配置，
 * 让开发者无需接入 ERP 就能完整体验 SheetX。
 */
import type { IconName } from './icons.js'

/** 左侧功能演示 */
export const FUNC_NAV: Array<{ key: string; label: string; icon: IconName }> = [
  { key: 'showcase', label: '功能演示', icon: 'gridView' },
  { key: 'formula', label: '公式计算', icon: 'fx' },
  { key: 'data', label: '数据处理', icon: 'database' },
  { key: 'filter', label: '筛选排序', icon: 'filter' },
  { key: 'conditional', label: '条件格式', icon: 'conditional' },
  { key: 'chart', label: '图表分析', icon: 'chartBar' },
  { key: 'freeze', label: '冻结与分屏', icon: 'freeze' },
  { key: 'validation', label: '数据验证', icon: 'validation' },
  { key: 'print', label: '打印导出', icon: 'print' },
  { key: 'theme', label: '主题切换', icon: 'palette' },
]

/** 数据行 */
export interface PlayRow {
  id: string
  name: string
  category: string
  price: number
  qty: number
  amount: number
  status: '已发货' | '处理中' | '待发货'
  note: string
}

export const INITIAL_ROWS: PlayRow[] = [
  { id: 'r1', name: '笔记本电脑', category: '电子产品', price: 5800, qty: 10, amount: 58000, status: '已发货', note: '轻薄本' },
  { id: 'r2', name: '平板电脑', category: '电子产品', price: 3200, qty: 20, amount: 64000, status: '处理中', note: '11 寸' },
  { id: 'r3', name: '智能手机', category: '电子产品', price: 4200, qty: 15, amount: 63000, status: '已发货', note: '旗舰款' },
  { id: 'r4', name: '无线耳机', category: '数码配件', price: 1200, qty: 30, amount: 36000, status: '待发货', note: '蓝牙 5.3' },
  { id: 'r5', name: '智能手表', category: '数码配件', price: 1800, qty: 25, amount: 45000, status: '已发货', note: '运动版' },
]

/** 列头（A-G） */
export const COLUMNS = [
  { key: 'name', title: '产品名称', letter: 'A', width: 18 },
  { key: 'category', title: '类别', letter: 'B', width: 12 },
  { key: 'price', title: '单价', letter: 'C', width: 12 },
  { key: 'qty', title: '数量', letter: 'D', width: 10 },
  { key: 'amount', title: '金额', letter: 'E', width: 12 },
  { key: 'status', title: '状态', letter: 'F', width: 12 },
  { key: 'note', title: '备注', letter: 'G', width: 14 },
] as const

/** 主题风格 */
export const THEMES = ['Light 亮色', 'Dark 暗色', 'Tech 科技蓝', 'Fresh 清新绿'] as const
export const THEME_COLORS: Record<string, string> = {
  'Light 亮色': '#2563eb', 'Dark 暗色': '#5b8cff', 'Tech 科技蓝': '#0891b2', 'Fresh 清新绿': '#16a34a',
}

/** 表格密度 */
export const DENSITIES = ['默认', '紧凑', '宽松'] as const

/** 功能开关 */
export const FEATURE_SWITCHES = [
  { key: 'formula', label: '公式计算' },
  { key: 'filter', label: '筛选排序' },
  { key: 'conditional', label: '条件格式' },
  { key: 'chart', label: '图表分析' },
  { key: 'print', label: '打印导出' },
] as const

/** 数据来源 */
export const DATA_SOURCES = ['本地数据', '远程接口', '示例数据'] as const

/** 销售趋势 */
export const TREND = [58, 64, 63, 36, 45]
export const TREND_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月']

/** 分类占比 */
export const CATEGORY_SHARE = [
  { label: '电子产品', value: 55, color: '#3b82f6' },
  { label: '数码配件', value: 45, color: '#a855f7' },
]

/** 底部功能卡 */
export const FEATURE_CARDS: Array<{ key: string; title: string; icon: IconName; hint: string }> = [
  { key: 'edit', title: '数据编辑', icon: 'edit', hint: '单元格' },
  { key: 'formula', title: '公式计算', icon: 'fx', hint: '=SUM' },
  { key: 'filter', title: '筛选排序', icon: 'filter', hint: '多条件' },
  { key: 'conditional', title: '条件格式', icon: 'conditional', hint: '色阶' },
  { key: 'validation', title: '数据验证', icon: 'validation', hint: '校验' },
  { key: 'chart', title: '图表分析', icon: 'chartBar', hint: '可视化' },
  { key: 'print', title: '打印导出', icon: 'print', hint: 'PDF' },
  { key: 'theme', title: '主题切换', icon: 'palette', hint: '换肤' },
]

export interface FullConfig {
  mode: 'grid' | 'sheet'
  func: string
  theme: string
  density: string
  features: Record<string, boolean>
  dataSource: string
  selected: { row: number; col: number }
  sortBy: string
  sortDir: 'asc' | 'desc' | ''
  filterStatus: string
}

export const DEFAULT_CONFIG: FullConfig = {
  mode: 'grid',
  func: 'showcase',
  theme: 'Light 亮色',
  density: '默认',
  features: Object.fromEntries(FEATURE_SWITCHES.map((s) => [s.key, true])),
  dataSource: '本地数据',
  selected: { row: 1, col: 2 }, // C4（设计稿行4=平板电脑3200；tbody index1 + 行偏移3）
  sortBy: '',
  sortDir: '',
  filterStatus: '',
}
