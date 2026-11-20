/**
 * Grid 模式演示数据（还原第 02 张设计稿的"库存管理"）
 * 仅用于 UI 展示，引擎接入后由 @sheetx/grid 替换。
 */

export interface InventoryRow {
  no: number
  code: string
  name: string
  category: string
  spec: string
  stock: number
  unit: string
  price: number
  amount: number
  status: '正常' | '预警'
}

/** 分类标签配色（Design tokens） */
export const categoryColors: Record<string, { bg: string; fg: string }> = {
  办公用品: { bg: '#e8f1ff', fg: '#2563eb' },
  电脑配件: { bg: '#e3f6ed', fg: '#159a68' },
  数码配件: { bg: '#f2e9ff', fg: '#8b5cf6' },
  电脑整机: { bg: '#fff0e6', fg: '#e07b39' },
  办公家具: { bg: '#fff6d9', fg: '#b8860b' },
}

export const inventoryColumns = [
  { key: 'no', title: '序号', width: 52 },
  { key: 'code', title: '商品编码', width: 92 },
  { key: 'name', title: '商品名称', width: 110 },
  { key: 'category', title: '分类', width: 92 },
  { key: 'spec', title: '规格型号', width: 96 },
  { key: 'stock', title: '库存数量', width: 96 },
  { key: 'unit', title: '单位', width: 52 },
  { key: 'price', title: '单价(元)', width: 94 },
  { key: 'amount', title: '金额(元)', width: 100 },
  { key: 'status', title: '状态', width: 72 },
  { key: 'op', title: '操作', width: 96 },
]

export const inventoryRows: InventoryRow[] = [
  { no: 1, code: 'SP001', name: '无线鼠标', category: '办公用品', spec: 'M-100', stock: 120, unit: '个', price: 89.0, amount: 10680.0, status: '正常' },
  { no: 2, code: 'SP002', name: '机械键盘', category: '电脑配件', spec: 'K87', stock: 65, unit: '个', price: 299.0, amount: 19435.0, status: '正常' },
  { no: 3, code: 'SP003', name: '显示器', category: '电脑配件', spec: '27英寸', stock: 30, unit: '台', price: 899.0, amount: 26970.0, status: '正常' },
  { no: 4, code: 'SP004', name: '充电宝', category: '数码配件', spec: '20000mAh', stock: 200, unit: '个', price: 79.0, amount: 15800.0, status: '正常' },
  { no: 5, code: 'SP005', name: '笔记本电脑', category: '电脑整机', spec: 'i5/16G', stock: 15, unit: '台', price: 4999.0, amount: 74985.0, status: '预警' },
  { no: 6, code: 'SP006', name: '文件夹', category: '办公用品', spec: 'A4', stock: 500, unit: '个', price: 2.5, amount: 1250.0, status: '正常' },
  { no: 7, code: 'SP007', name: '打印纸', category: '办公用品', spec: 'A4 500张', stock: 80, unit: '包', price: 23.0, amount: 1840.0, status: '正常' },
  { no: 8, code: 'SP008', name: '办公椅', category: '办公家具', spec: '人体工学', stock: 25, unit: '把', price: 599.0, amount: 14975.0, status: '正常' },
  { no: 9, code: 'SP009', name: '电脑包', category: '数码配件', spec: '15.6寸', stock: 60, unit: '个', price: 129.0, amount: 7740.0, status: '正常' },
  { no: 10, code: 'SP010', name: '鼠标垫', category: '办公用品', spec: '加厚', stock: 300, unit: '个', price: 19.9, amount: 5970.0, status: '正常' },
]

export const sideMenus = [
  { key: 'inventory', label: '库存管理', icon: 'navInventory' as const },
  { key: 'purchase', label: '采购管理', icon: 'navPurchase' as const },
  { key: 'sales', label: '销售管理', icon: 'navSales' as const },
  { key: 'finance', label: '财务管理', icon: 'navFinance' as const },
  { key: 'report', label: '报表中心', icon: 'navReport' as const },
  { key: 'settings', label: '系统设置', icon: 'settings' as const },
]
