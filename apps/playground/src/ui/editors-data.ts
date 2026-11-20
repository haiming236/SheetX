/**
 * 单元格编辑与业务下拉演示数据（还原第 04 张设计稿）
 */

export interface PurchaseRow {
  no: number
  code: string
  name: string
  spec: string
  qty: number
  price: number
  amount: number
  date: string
  status: '正常' | '待发货' | '缺货'
}

export const purchaseRows: PurchaseRow[] = [
  { no: 1, code: 'SP001', name: '笔记本电脑', spec: 'i7/16G/1T', qty: 10, price: 4999.0, amount: 49990.0, date: '2025-12-01', status: '正常' },
  { no: 2, code: 'SP002', name: '显示器', spec: '27英寸/4K', qty: 20, price: 899.0, amount: 17980.0, date: '2025-12-05', status: '待发货' },
  { no: 3, code: 'SP003', name: '键盘', spec: '机械/87键', qty: 8, price: 99.0, amount: 1980.0, date: '2025-12-06', status: '正常' },
  { no: 4, code: 'SP004', name: '鼠标', spec: '无线/静音', qty: 8, price: 79.0, amount: 790.0, date: '2025-12-08', status: '缺货' },
  { no: 5, code: 'SP005', name: '打印机', spec: '激光/A4', qty: 8, price: 1199.0, amount: 11990.0, date: '2025-12-10', status: '正常' },
  { no: 6, code: 'SP006', name: '办公椅', spec: '人体工学', qty: 8, price: 599.0, amount: 5990.0, date: '2025-12-12', status: '正常' },
]

/** 商品远程搜索结果（编辑单元格下拉） */
export const productResults = [
  { title: '笔记本电脑 Pro 14', code: 'SP005', spec: '14英寸 / i6G / 1T' },
  { title: '笔记本电脑 Air 13', code: 'SP006', spec: '13英寸 / 8G / 512G' },
  { title: '笔记本电脑 Pro 16', code: 'SP007', spec: '16英寸 / 32G / 1T' },
]

/** 状态下拉选项 */
export const statusOptions = [
  { label: '正常', color: '#22a06b' },
  { label: '缺货', color: '#e08a1e' },
  { label: '待发货', color: '#2563eb' },
  { label: '已下架', color: '#9aa1ad' },
]

/** 远程客户搜索结果 */
export const customerResults = [
  { name: '张三', company: '深圳市科技有限公司', color: '#2563eb' },
  { name: '李四', company: '上海贸易有限公司', color: '#8b5cf6' },
  { name: '王五', company: '广州实业有限公司', color: '#0f9b96' },
]

/** 日期选择器：2025年12月，星期一起 */
export const calendarDays = [
  1, 2, 3, 4, 5, 6, 7,
  8, 9, 10, 11, 12, 13, 14,
  15, 16, 17, 18, 19, 20, 21,
]
