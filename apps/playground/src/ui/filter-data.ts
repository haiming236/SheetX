/**
 * SheetX 第 09 张 mock 数据 · 数据筛选与排序
 */
import type { IconName } from './icons.js'

export interface FilterRow {
  order: string
  customer: string
  category: string
  product: string
  qty: number
  amount: number
}

/** 订单数据（C 列产品分类在初始态被筛选面板遮挡，但数据模型完整） */
export const FILTER_ROWS: FilterRow[] = [
  { order: 'SO-2025001', customer: '华东科技有限公司', category: '办公用品', product: '高档订书机', qty: 50, amount: 2500 },
  { order: 'SO-2025002', customer: '星海贸易公司', category: '办公用品', product: '笔记本', qty: 100, amount: 3200 },
  { order: 'SO-2025003', customer: '创新科技集团', category: '电子产品', product: '无线鼠标', qty: 80, amount: 7200 },
  { order: 'SO-2025004', customer: '智联科技有限公司', category: '电子产品', product: '机械键盘', qty: 60, amount: 9000 },
  { order: 'SO-2025005', customer: '未来信息科技', category: '办公用品', product: '文件夹', qty: 200, amount: 1600 },
  { order: 'SO-2025006', customer: '华东科技有限公司', category: '电子产品', product: '显示器', qty: 40, amount: 16000 },
  { order: 'SO-2025007', customer: '星海贸易公司', category: '家居用品', product: '家温杯', qty: 120, amount: 2400 },
  { order: 'SO-2025008', customer: '创新科技集团', category: '家居用品', product: '台灯', qty: 70, amount: 3500 },
  { order: 'SO-2025009', customer: '智联科技有限公司', category: '办公用品', product: '打印纸', qty: 300, amount: 1200 },
  { order: 'SO-2025010', customer: '未来信息科技', category: '电子产品', product: 'U盘', qty: 150, amount: 1500 },
]

export const FILTER_COLUMNS = ['订单编号', '客户名称', '产品分类', '产品名称', '数量', '金额'] as const

/** C 列筛选面板 · 排序操作 */
export const colSortActions: Array<{ icon: IconName; label: string }> = [
  { icon: 'sortAZ', label: '升序排列' },
  { icon: 'sortZA', label: '降序排列' },
]

/** C 列筛选面板 · 更多筛选项 */
export const colMoreActions = ['按颜色排序', '按颜色筛选', '文本筛选', '值筛选'] as const

/** 分类复选框初始态（设计稿：电子产品、家居用品勾选） */
export const categoryInit: Record<string, boolean> = {
  办公用品: false,
  电子产品: true,
  家居用品: true,
  其他: false,
}

/** 条件字段 / 运算符 / 排序方向下拉选项 */
export const conditionFields = ['订单编号', '客户名称', '产品分类', '产品名称', '数量', '金额'] as const
export const conditionOps = ['包含', '不包含', '等于', '大于', '小于'] as const
export const sortDirections = ['升序', '降序'] as const

export interface FilterCondition {
  field: string
  op: string
  value: string
}

/** 右侧面板初始条件（设计稿） */
export const conditionsInit: FilterCondition[] = [
  { field: '客户名称', op: '包含', value: '科技' },
  { field: '金额', op: '大于', value: '3000' },
]

/** 工作表标签 */
export const filterSheetTabs = ['订单数据', '销售统计', '客户信息'] as const

/** 设计稿快照统计（首屏还原；点击"应用"后按真实条件计算） */
export const statsSnapshot = { count: 3, sum: 25200, avg: 8400 }

/** 金额格式化：千分位 + 两位小数 */
export function fmtAmount(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
