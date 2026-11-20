/**
 * SheetX 第 25 张 · 属性设置与企业个性化配置 — 数据
 *
 * 设计稿范围：销售数据报表 + 柱状/饼图 + 右侧四标签统一属性面板；
 * 并向下展开「宿主系统传入用户信息 / 主题 / 字体配置」的企业个性化契约。
 */

export type PropTab = 'cell' | 'rowcol' | 'data' | 'chart'

export const PROP_TABS: Array<{ key: PropTab; label: string }> = [
  { key: 'cell', label: '单元格' },
  { key: 'rowcol', label: '行列' },
  { key: 'data', label: '数据' },
  { key: 'chart', label: '图表' },
]

/** 销售数据报表（与设计稿一致） */
export interface SalesRow {
  name: string
  qty: number
  amount: number
  growth: number
  note: string
}

export const SALES_ROWS: SalesRow[] = [
  { name: '笔记本电脑', qty: 1250, amount: 1892500, growth: 12.5, note: '增长良好' },
  { name: '平板电脑', qty: 980, amount: 784000, growth: 8.3, note: '稳定增长' },
  { name: '智能手机', qty: 1860, amount: 2976000, growth: 15.8, note: '表现优秀' },
  { name: '显示器', qty: 720, amount: 576000, growth: 5.2, note: '稳步增长' },
  { name: '路由器', qty: 640, amount: 416000, growth: -2.1, note: '略有下降' },
  { name: '耳机', qty: 920, amount: 552000, growth: 6.7, note: '保持增长' },
]

export const SALES_TOTAL = {
  qty: 6370,
  amount: 7196500,
  growth: 9.8,
}

/** 销售趋势（柱状图） */
export const TREND_DATA = [
  { label: '1月', value: 920000 },
  { label: '2月', value: 1280000 },
  { label: '3月', value: 1540000 },
  { label: '4月', value: 1380000 },
  { label: '5月', value: 1710000 },
  { label: '6月', value: 1892500 },
]

/** 产品销售占比（饼图） */
export const PIE_DATA = [
  { label: '笔记本电脑', value: 32.1, color: '#4f7cff' },
  { label: '平板电脑', value: 18.2, color: '#f5a623' },
  { label: '智能手机', value: 27.5, color: '#2fbf8f' },
  { label: '其他', value: 22.2, color: '#9b7bf0' },
]

/** 字体 / 格式 / 数字格式选项 */
export const FONT_FAMILIES = ['微软雅黑', '等线', '宋体', '黑体', 'Consolas', 'Arial']
export const FONT_SIZES = [10, 11, 12, 14, 16, 18, 20, 24]
export const NUMBER_FORMATS = ['常规', '数值', '货币', '会计专用', '日期', '百分比', '分数', '科学记数', '文本']
export const ALIGN_H = [
  { key: 'left', label: '左对齐', icon: 'alignLeft' as const },
  { key: 'center', label: '居中对齐', icon: 'alignCenter' as const },
  { key: 'right', label: '右对齐', icon: 'alignRight' as const },
  { key: 'justify', label: '两端对齐', icon: 'alignJustify' as const },
]
export const ALIGN_V = [
  { key: 'top', label: '顶端对齐', icon: 'valignTop' as const },
  { key: 'middle', label: '垂直居中', icon: 'valignMiddle' as const },
  { key: 'bottom', label: '底端对齐', icon: 'valignBottom' as const },
]

/** 单元格属性状态（可应用） */
export interface CellProps {
  format: string
  fontFamily: string
  fontSize: number
  bold: boolean
  italic: boolean
  underline: boolean
  fontColor: string
  fillColor: string
  hAlign: string
  vAlign: string
  wrap: boolean
  borders: { left: boolean; right: boolean; top: boolean; bottom: boolean }
  borderStyle: string
  rowHeight: number
  colWidth: number
  autoFit: boolean
}

export const DEFAULT_CELL_PROPS: CellProps = {
  format: '常规',
  fontFamily: '微软雅黑',
  fontSize: 12,
  bold: false,
  italic: false,
  underline: false,
  fontColor: '#1f2329',
  fillColor: '#ffffff',
  hAlign: 'left',
  vAlign: 'middle',
  wrap: true,
  borders: { left: true, right: true, top: true, bottom: true },
  borderStyle: '实线',
  rowHeight: 24,
  colWidth: 120,
  autoFit: true,
}

/** 行列属性 */
export interface RowColProps {
  rowHeight: number
  colWidth: number
  freezeRows: number
  freezeCols: number
  showGridlines: boolean
  showRowNumbers: boolean
  hiddenRows: number
  hiddenCols: number
}

export const DEFAULT_ROWCOL_PROPS: RowColProps = {
  rowHeight: 24,
  colWidth: 120,
  freezeRows: 1,
  freezeCols: 0,
  showGridlines: true,
  showRowNumbers: true,
  hiddenRows: 0,
  hiddenCols: 0,
}

/** 数据属性 */
export interface DataProps {
  source: string
  refreshInterval: number
  validateOnEdit: boolean
  allowBlank: boolean
  uniqueKey: string
  decimalPlaces: number
  thousandsSeparator: boolean
  importMode: string
}

export const DEFAULT_DATA_PROPS: DataProps = {
  source: '内置示例数据',
  refreshInterval: 0,
  validateOnEdit: true,
  allowBlank: false,
  uniqueKey: 'id',
  decimalPlaces: 2,
  thousandsSeparator: true,
  importMode: '追加',
}

/** 图表属性 */
export interface ChartProps {
  type: 'bar' | 'line' | 'pie'
  title: string
  showLegend: boolean
  showDataLabel: boolean
  colorScheme: string
  dataRange: string
}

export const DEFAULT_CHART_PROPS: ChartProps = {
  type: 'bar',
  title: '销售趋势分析',
  showLegend: true,
  showDataLabel: false,
  colorScheme: '#4f7cff',
  dataRange: 'A2:F9',
}

/**
 * 宿主系统传入的企业个性化配置（第25页核心）
 * 真实接入时由宿主通过 props / postMessage 注入，这里给出默认示例与契约说明。
 */
export interface HostConfig {
  /** 用户信息 */
  user: {
    name: string
    avatar: string
    role: string
    department: string
    email: string
  }
  /** 主题配置 */
  theme: {
    mode: 'light' | 'dark' | 'system'
    primaryColor: string
    accentColor: string
    radius: number
  }
  /** 字体配置 */
  font: {
    family: string
    size: number
    lineHeight: number
  }
  /** 企业品牌 */
  brand: {
    name: string
    logoText: string
    watermark: string
  }
}

export const DEFAULT_HOST_CONFIG: HostConfig = {
  user: {
    name: '张三',
    avatar: '张',
    role: '数据管理员',
    department: '销售运营部',
    email: 'zhangsan@example.com',
  },
  theme: {
    mode: 'light',
    primaryColor: '#2f6bff',
    accentColor: '#7c5cff',
    radius: 8,
  },
  font: {
    family: '微软雅黑',
    size: 13,
    lineHeight: 1.6,
  },
  brand: {
    name: 'SheetX 企业版',
    logoText: 'SX',
    watermark: '内部资料 · 请勿外传',
  },
}

/** 宿主配置注入契约（供文档 / 宿主对接参考） */
export const HOST_CONFIG_CONTRACT = `// 宿主注入示例（Web Component）
const sheet = document.querySelector('sheetx-grid')
sheet.hostConfig = {
  user:    { name, avatar, role, department, email },
  theme:   { mode, primaryColor, accentColor, radius },
  font:    { family, size, lineHeight },
  brand:   { name, logoText, watermark },
}

// 或 iframe / postMessage 场景
window.postMessage({ type: 'sx:host-config', payload: hostConfig }, '*')`

/** 属性应用记录（点击「应用到范围」后追加） */
export interface ApplyLog {
  id: number
  time: string
  target: string
  summary: string
}

export const INITIAL_APPLY_LOGS: ApplyLog[] = [
  { id: 1, time: '14:32', target: 'A1:F1', summary: '标题样式 · 蓝底白字' },
  { id: 2, time: '14:35', target: 'B3:D9', summary: '货币格式 · ¥ #,##0' },
]

/** 柱状图数值格式化（万元） */
export function formatWan(value: number): string {
  return `${(value / 10000).toFixed(1)}M`
}

/** 千分位 */
export function thousand(value: number): string {
  return value.toLocaleString('zh-CN')
}
