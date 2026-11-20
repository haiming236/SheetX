/**
 * Spreadsheet 完整模式演示数据（还原第 03 张设计稿的"销售数据统计报表"）
 * 仅用于 UI 展示，引擎接入后由 @sheetx/spreadsheet 替换。
 */

export interface SalesRow {
  code: string
  name: string
  qty: number
  amount: number
  margin: number
  trend: number[]
}

export const salesRows: SalesRow[] = [
  { code: 'SP001', name: '电脑', qty: 2350, amount: 1199250.0, margin: 28.5, trend: [30, 34, 32, 40, 38, 46, 44, 52, 48, 56, 54, 62] },
  { code: 'SP002', name: '显示器', qty: 1820, amount: 865430.0, margin: 26.3, trend: [22, 26, 24, 30, 28, 34, 32, 38, 36, 42, 40, 48] },
  { code: 'SP003', name: '键盘', qty: 3200, amount: 320000.0, margin: 32.1, trend: [35, 32, 38, 36, 42, 40, 46, 44, 50, 48, 56, 60] },
  { code: 'SP004', name: '鼠标', qty: 2960, amount: 296000.0, margin: 30.7, trend: [28, 32, 30, 36, 34, 40, 38, 44, 42, 48, 46, 52] },
  { code: 'SP005', name: '打印机', qty: 1120, amount: 448000.0, margin: 27.9, trend: [20, 24, 22, 28, 26, 32, 30, 36, 34, 40, 38, 44] },
]

export const salesTotal = {
  qty: 11450,
  amount: 3128680.0,
  margin: 29.6,
}

/** 产品占比（甜甜圈图）：电脑 37.6% / 显示器 27.7% / 其他 34.7% */
export const pieSlices = [
  { label: '电脑', value: 37.6, color: '#2563eb' },
  { label: '显示器', value: 27.7, color: '#e0a020' },
  { label: '其他', value: 34.7, color: '#22a06b' },
]

/** 月度销售趋势（折线图，单位：万） */
export const monthlyTrend = [
  55, 62, 60, 72, 68, 88, 76, 84, 80, 90, 86, 96,
]

export const monthLabels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

/** 顶部导航菜单（第03张：文件下拉 + 开始等） */
export const fullMenus = ['开始', '插入', '数据', '公式', '视图', '设置']

/** 底部工作表标签 */
export const fullSheetTabs = ['销售报表', '库存统计', '利润分析']
