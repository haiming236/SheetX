/**
 * SheetX 第 07 张设计稿数据（数据导入与导出）
 *
 * 纯 UI 外壳的静态 mock 数据；引擎接入后由 @sheetx/io 驱动真实导入导出流程。
 */
import type { IconName } from './icons.js'

/** 顶部导航菜单（本页"数据"高亮） */
export const ioNavMenus = ['开始', '插入', '数据', '公式', '视图', '设置'] as const

/** 工具栏按钮 */
export interface ToolbarItem {
  label: string
  icon: IconName
  caret?: boolean
  active?: boolean
  /** 点击行为：openImport = 打开数据导入弹窗 */
  action?: 'openImport'
}

export const ioToolbar: ToolbarItem[] = [
  { label: '导入', icon: 'download', caret: true, active: true, action: 'openImport' },
  { label: '导出', icon: 'upload', caret: true },
  { label: '数据筛选', icon: 'filter' },
  { label: '排序', icon: 'sort' },
  { label: '去重', icon: 'dedup' },
  { label: '分割', icon: 'split' },
  { label: '数据验证', icon: 'validation' },
  { label: '刷新', icon: 'refresh' },
  { label: '数据透视表', icon: 'pivot' },
  { label: '更多', icon: 'more' },
]

/** 导入文件类型 */
export interface FileTypeItem {
  key: string
  name: string
  sub: string
  /** 彩色文件徽标（excel/csv/json） */
  badge?: 'excel' | 'csv' | 'json'
  /** 线性图标（粘贴/数据库） */
  icon?: IconName
}

export const fileTypes: FileTypeItem[] = [
  { key: 'excel', name: 'Excel 文件', sub: '.xlsx, .xls', badge: 'excel' },
  { key: 'csv', name: 'CSV 文件', sub: '.csv', badge: 'csv' },
  { key: 'json', name: 'JSON 文件', sub: '.json', badge: 'json' },
  { key: 'paste', name: '粘贴数据', sub: '', icon: 'clipboard' },
  { key: 'db', name: '从数据库', sub: '', icon: 'database' },
]

/** 导入流程步骤 */
export const importSteps = ['选择文件', '映射字段', '导入预览'] as const

/** 模拟可选文件池（点击"选择文件"时轮换） */
export const filePool = ['销售订单数据.xlsx', '库存明细.xlsx', '客户名单.csv', '出库记录.json'] as const

/** 导入选项 */
export interface ImportOption {
  label: string
  checked: boolean
}

export const defaultImportOptions: ImportOption[] = [
  { label: '第一行为表头', checked: true },
  { label: '重复数据覆盖', checked: false },
  { label: '导入后自动调整列宽', checked: true },
]

/** 字段映射行 */
export interface MappingRow {
  field: string
  sample: string
  target: string
  icon: IconName
}

export const defaultMapping: MappingRow[] = [
  { field: '订单编号', sample: 'SO20250001', target: '订单编号', icon: 'file' },
  { field: '客户名称', sample: '北京华泰科技有限公司', target: '客户名称', icon: 'user' },
  { field: '订单日期', sample: '2025-12-01', target: '订单日期', icon: 'calendar' },
  { field: '金额', sample: '12,680.00', target: '金额', icon: 'currency' },
  { field: '状态', sample: '已发货', target: '状态', icon: 'checkCircle' },
]

/** 映射下拉可选目标字段 */
export const mappingTargets = ['订单编号', '客户名称', '订单日期', '金额', '状态', '渠道', '备注'] as const

/** 数据预览 */
export interface PreviewRow {
  id: string
  customer: string
  date: string
  amount: string
  status: '已发货' | '待发货'
}

export const previewRows: PreviewRow[] = [
  { id: 'SO20250001', customer: '北京华泰科技有限公司', date: '2025-12-01', amount: '12,680.00', status: '已发货' },
  { id: 'SO20250002', customer: '上海分公司', date: '2025-12-01', amount: '8,920.00', status: '待发货' },
]

/** 导出格式 */
export interface ExportFormat {
  key: string
  name: string
  sub: string
  badge: 'excel' | 'csv' | 'pdf' | 'img'
}

export const exportFormats: ExportFormat[] = [
  { key: 'xlsx', name: 'Excel 文件', sub: '.xlsx', badge: 'excel' },
  { key: 'csv', name: 'CSV 文件', sub: '.csv', badge: 'csv' },
  { key: 'pdf', name: 'PDF 文件', sub: '.pdf', badge: 'pdf' },
  { key: 'img', name: '图片', sub: '.png / .jpg', badge: 'img' },
]

/** 导出范围 */
export const exportScopes = ['当前工作表', '选中区域', '整个工作簿'] as const

/** 背景表格列 */
export interface BgColumn {
  title: string
  width: number
  accent?: boolean
  num?: boolean
}

export const bgColumns: BgColumn[] = [
  { title: '序号', width: 64, accent: true },
  { title: '订单编号', width: 110 },
  { title: '客户名称', width: 168 },
  { title: '订单日期', width: 98 },
  { title: '金额', width: 92, num: true },
  { title: '状态', width: 78 },
]

/** 背景表格数据（销售订单） */
export interface BgRow {
  id: string
  customer: string
  date: string
  amount: string
  status: '已发货' | '待发货'
}

export const bgRows: BgRow[] = [
  { id: 'SO20250001', customer: '北京华泰科技有限公司', date: '2025-12-01', amount: '12,680.00', status: '已发货' },
  { id: 'SO20250002', customer: '上海分公司', date: '2025-12-01', amount: '8,920.00', status: '待发货' },
  { id: 'SO20250003', customer: '深圳市恒信电子', date: '2025-11-30', amount: '23,400.00', status: '已发货' },
  { id: 'SO20250004', customer: '广州云顶贸易有限公司', date: '2025-11-30', amount: '5,670.00', status: '已发货' },
  { id: 'SO20250005', customer: '杭州临安科技', date: '2025-11-29', amount: '18,030.00', status: '待发货' },
  { id: 'SO20250006', customer: '成都锦程实业', date: '2025-11-29', amount: '9,860.00', status: '已发货' },
  { id: 'SO20250007', customer: '武汉江城供应链', date: '2025-11-28', amount: '14,275.00', status: '待发货' },
  { id: 'SO20250008', customer: '南京金陵商贸', date: '2025-11-28', amount: '7,320.00', status: '已发货' },
  { id: 'SO20250009', customer: '苏州工业园区制造', date: '2025-11-27', amount: '31,050.00', status: '已发货' },
  { id: 'SO20250010', customer: '青岛海川物流', date: '2025-11-27', amount: '6,480.00', status: '待发货' },
]

/** 状态栏统计 */
export const ioStats = {
  total: 1248,
  avg: '622.87',
  count: '1,248',
  sum: '777,567.00',
} as const

/** 工作表标签 */
export const ioSheetTabs = ['销售数据'] as const
