/**
 * 演示数据（还原第 06 张设计稿 · 公式编辑与函数助手）
 * 仅用于 UI 展示，引擎接入后由 @sheetx/spreadsheet 驱动真实公式。
 */

/** 顶部导航菜单（本稿「公式」高亮） */
export const formulaNavMenus = ['开始', '插入', '数据', '公式', '视图', '设置']

/** 工作表标签 */
export const formulaSheetTabs = ['销售数据', '区域汇总', '产品分析']

/** 函数分类工具栏（icon 为 icons.ts 的 IconName；空串表示无图标） */
export const functionCategories: Array<{ label: string; icon: string; bordered?: boolean }> = [
  { label: '插入函数', icon: 'sigma', bordered: true },
  { label: '自动求和', icon: 'sigma' },
  { label: '常用函数', icon: 'gridView' },
  { label: '财务', icon: 'currency' },
  { label: '日期时间', icon: 'calendar' },
  { label: '文本', icon: 'textT' },
  { label: '逻辑', icon: '' },
  { label: '查找引用', icon: 'search' },
  { label: '数学和三角', icon: 'sigma' },
  { label: '更多', icon: 'dash' },
]

/** F2 正在编辑的公式（公式栏与单元格一致） */
export const editingFormula = '=SUMIF($B$2:$B$1000, E2, $C$2:$C$1000)'

/** 公式栏语法高亮分段（手工切分，还原设计稿配色） */
export interface FormulaSegment {
  text: string
  kind: 'fn' | 'ref' | 'criteria' | 'plain'
}
export const formulaSegments: FormulaSegment[] = [
  { text: '=', kind: 'plain' },
  { text: 'SUMIF', kind: 'fn' },
  { text: '(', kind: 'plain' },
  { text: '$B$2:$B$1000', kind: 'ref' },
  { text: ', ', kind: 'plain' },
  { text: 'E2', kind: 'criteria' },
  { text: ', ', kind: 'plain' },
  { text: '$C$2:$C$1000', kind: 'ref' },
  { text: ')', kind: 'plain' },
]

/** 函数自动补全下拉（SUMIF 选中高亮） */
export interface FunctionSuggestion {
  name: string
  desc: string
  active?: boolean
}
export const functionSuggestions: FunctionSuggestion[] = [
  { name: 'SUMIF', desc: '按条件求和', active: true },
  { name: 'SUMIFS', desc: '多条件求和' },
  { name: 'SUM', desc: '求和' },
  { name: 'AVERAGEIF', desc: '按条件求平均值' },
  { name: 'AVERAGEIFS', desc: '多条件求平均值' },
  { name: 'COUNTIF', desc: '按条件计数' },
  { name: 'COUNTIFS', desc: '多条件计数' },
]

/** 表格数据行（A 日期 / B 产品类别 / C 销售额 / D 区域 / E 辅助列 / F 公式列） */
export interface FormulaRow {
  date: string
  category: string
  amount: string
  region: string
  /** E 列辅助下拉值（仅第 2 行有） */
  helper?: string
}
export const formulaRows: FormulaRow[] = [
  { date: '2025-12-01', category: '电脑', amount: '12,800', region: '华东', helper: '电脑' },
  { date: '2025-12-01', category: '显示器', amount: '8,600', region: '华东' },
  { date: '2025-12-02', category: '笔记本', amount: '15,200', region: '华南' },
  { date: '2025-12-03', category: '电脑', amount: '11,500', region: '华北' },
  { date: '2025-12-03', category: '打印机', amount: '7,800', region: '华东' },
  { date: '2025-12-04', category: '显示器', amount: '9,200', region: '华南' },
  { date: '2025-12-04', category: '笔记本', amount: '13,600', region: '华北' },
]

/** 列定义（corner 之后的 A-F 列） */
export const formulaColumns = [
  { key: 'date', title: '日期', width: 108 },
  { key: 'category', title: '产品类别', width: 100 },
  { key: 'amount', title: '销售额', width: 96 },
  { key: 'region', title: '区域', width: 88 },
  { key: 'helper', title: '产品类别', width: 116, highlight: true },
  { key: 'formula', title: '合计销售额', width: 170, accent: true },
] as const

/** 销售汇总卡片 */
export interface SummaryRow {
  category: string
  amount: string
  highlight?: boolean
}
export const summaryRows: SummaryRow[] = [
  { category: '电脑', amount: '24,300', highlight: true },
  { category: '显示器', amount: '17,800' },
  { category: '笔记本', amount: '28,800' },
  { category: '打印机', amount: '7,800' },
]

/** 各产品销售趋势（折线图） */
export interface TrendSeries {
  name: string
  color: string
  values: number[]
}
export const trendSeries: TrendSeries[] = [
  { name: '电脑', color: '#2563eb', values: [15200, 20100, 26300, 27500] },
  { name: '显示器', color: '#22a06b', values: [11400, 9200, 20500, 9400] },
  { name: '笔记本', color: '#f59e0b', values: [12300, 10900, 17800, 17200] },
  { name: '打印机', color: '#8b5cf6', values: [10200, 8600, 13100, 7300] },
]
export const trendXLabels = ['12-01', '12-02', '12-03', '12-04']
export const trendYTicks = [0, 10000, 20000, 30000]

/** 函数助手面板（SUMIF 词条） */
export const assistantDoc = {
  name: 'SUMIF',
  desc: '按条件求和',
  syntax: '=SUMIF(range, criteria, [sum_range])',
  params: [
    { name: 'range', color: '#8b5cf6', soft: '#f3efff', desc: '条件区域' },
    { name: 'criteria', color: '#2563eb', soft: '#e8f0fe', desc: '条件' },
    { name: 'sum_range', color: '#22a06b', soft: '#e6f6ee', desc: '求和区域（可选）' },
  ],
  example: '=SUMIF(B2:B100, "电脑", C2:C100)',
  exampleDesc: '计算 B 列中"电脑"的销售额总和',
}

/** 函数助手 · 函数分类 Tab 的演示数据 */
export const functionCategoriesDoc = [
  { name: '数学和三角', count: 62 },
  { name: '统计', count: 48 },
  { name: '逻辑', count: 9 },
  { name: '日期时间', count: 24 },
  { name: '文本', count: 31 },
  { name: '查找引用', count: 18 },
  { name: '财务', count: 55 },
]

/** 函数助手 · 使用示例 Tab 的演示数据 */
export const functionExamples = [
  { formula: '=SUMIF(B2:B100, "电脑", C2:C100)', desc: '按单条件求和' },
  { formula: '=SUMIFS(C2:C100, B2:B100, "电脑", D2:D100, "华东")', desc: '多条件求和' },
  { formula: '=COUNTIF(B2:B100, "显示器")', desc: '按条件计数' },
  { formula: '=AVERAGEIF(B2:B100, "笔记本", C2:C100)', desc: '按条件求平均' },
]

/** 状态栏统计 */
export const formulaStats = {
  total: '1,000',
  avg: '11,520',
  count: '3',
  sum: '34,560',
}
