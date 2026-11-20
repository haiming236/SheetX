/**
 * 第 19 张设计稿 · 公式函数库与公式管理器 — 数据层
 *
 * 函数元数据（分类/语法/说明/示例）是 UI 展示信息；
 * 真正的求值与错误诊断走 <sheetx-spreadsheet> 引擎（setFormulaBarText + getFormulaBarValue）。
 */

export interface FuncDef {
  name: string
  category: FuncCategory
  syntax: string
  desc: string
  example: string
  /** 参数说明（参数名 + 提示） */
  params: Array<{ name: string; hint: string }>
  tip?: string
}

export type FuncCategory =
  | 'common' | 'math' | 'stat' | 'text' | 'logic' | 'datetime'
  | 'lookup' | 'finance' | 'info' | 'engineering' | 'other'

export const FUNC_CATEGORIES: Array<{ key: FuncCategory; label: string; icon: string }> = [
  { key: 'common', label: '常用函数', icon: 'sigma' },
  { key: 'math', label: '数学与三角', icon: 'sigma' },
  { key: 'stat', label: '统计函数', icon: 'chartBar' },
  { key: 'text', label: '文本函数', icon: 'textT' },
  { key: 'logic', label: '逻辑函数', icon: 'bolt' },
  { key: 'datetime', label: '日期和时间', icon: 'calendar' },
  { key: 'lookup', label: '查找与引用', icon: 'link' },
  { key: 'finance', label: '财务函数', icon: 'currency' },
  { key: 'info', label: '信息函数', icon: 'infoCircle' },
  { key: 'engineering', label: '工程函数', icon: 'settings' },
  { key: 'other', label: '其他函数', icon: 'more' },
]

const N = (name: string, hint: string) => ({ name, hint })

export const FUNCTIONS: FuncDef[] = [
  {
    name: 'SUM', category: 'common',
    syntax: 'SUM(number1, [number2], ...)',
    desc: '计算一组值的和。',
    example: '=SUM(A1:A10)',
    params: [N('number1', '要求和的第一个数或单元格区域'), N('number2', '可选，最多 255 个参数')],
    tip: '使用 SUMIFS 可以根据多个条件进行求和。',
  },
  {
    name: 'AVERAGE', category: 'stat',
    syntax: 'AVERAGE(number1, [number2], ...)',
    desc: '返回参数的平均值（算术平均）。',
    example: '=AVERAGE(C2:C8)',
    params: [N('number1', '要求平均值的第一个数或区域')],
  },
  {
    name: 'COUNT', category: 'stat',
    syntax: 'COUNT(value1, [value2], ...)',
    desc: '计算区域中数字的个数。',
    example: '=COUNT(A1:A10)',
    params: [N('value1', '要统计的第一个值或区域')],
  },
  {
    name: 'IF', category: 'logic',
    syntax: 'IF(logical_test, value_if_true, value_if_false)',
    desc: '根据条件判断返回不同的结果。',
    example: '=IF(D2>=1,"优秀","需改进")',
    params: [N('logical_test', '计算结果为 TRUE 或 FALSE 的条件'), N('value_if_true', '条件为 TRUE 时返回'), N('value_if_false', '条件为 FALSE 时返回')],
  },
  {
    name: 'SUMIF', category: 'common',
    syntax: 'SUMIF(range, criteria, [sum_range])',
    desc: '按单个条件对指定区域求和。',
    example: '=SUMIF(B:B,"销售部",C:C)',
    params: [N('range', '用于条件判断的单元格区域'), N('criteria', '条件，如 "销售部" 或 ">100"'), N('sum_range', '可选，实际求和的区域')],
  },
  {
    name: 'SUMIFS', category: 'common',
    syntax: 'SUMIFS(sum_range, criteria_range1, criteria1, ...)',
    desc: '根据多个条件对指定区域求和。',
    example: '=SUMIFS(C:C,B:B,"销售部",A:A,"华东")',
    params: [
      N('sum_range', '要求和的单元格区域'),
      N('criteria_range1', '第一个条件区域'),
      N('criteria1', '第一个条件'),
      N('criteria_range2', '可选，第二个条件区域'),
      N('criteria2', '可选，第二个条件'),
    ],
    tip: 'SUMIFS 可以根据多个条件进行求和。',
  },
  {
    name: 'COUNTIF', category: 'stat',
    syntax: 'COUNTIF(range, criteria)',
    desc: '计算区域中满足给定条件的单元格数目。',
    example: '=COUNTIF(D2:D8,">=1")',
    params: [N('range', '要统计的单元格区域'), N('criteria', '统计条件')],
  },
  {
    name: 'COUNTIFS', category: 'stat',
    syntax: 'COUNTIFS(criteria_range1, criteria1, ...)',
    desc: '计算区域中满足多个条件的单元格数目。',
    example: '=COUNTIFS(B:B,"销售部",A:A,"华东")',
    params: [N('criteria_range1', '第一个条件区域'), N('criteria1', '第一个条件')],
  },
  {
    name: 'MIN', category: 'stat',
    syntax: 'MIN(number1, [number2], ...)',
    desc: '返回一组值中的最小值。',
    example: '=MIN(C2:C8)',
    params: [N('number1', '要找最小值的第一个数或区域')],
  },
  {
    name: 'MAX', category: 'stat',
    syntax: 'MAX(number1, [number2], ...)',
    desc: '返回一组值中的最大值。',
    example: '=MAX(C2:C8)',
    params: [N('number1', '要找最大值的第一个数或区域')],
  },
  {
    name: 'ROUND', category: 'math',
    syntax: 'ROUND(number, num_digits)',
    desc: '将数字四舍五入到指定的位数。',
    example: '=ROUND(C2,2)',
    params: [N('number', '要四舍五入的数字'), N('num_digits', '保留的小数位数')],
  },
  {
    name: 'ABS', category: 'math',
    syntax: 'ABS(number)',
    desc: '返回数字的绝对值。',
    example: '=ABS(-12.5)',
    params: [N('number', '要求绝对值的数字')],
  },
  {
    name: 'VLOOKUP', category: 'lookup',
    syntax: 'VLOOKUP(lookup_value, table_array, col_index_num, [range_lookup])',
    desc: '在表格首列查找值并返回同一行指定列的值。',
    example: '=VLOOKUP("华东",A2:D8,3,0)',
    params: [N('lookup_value', '要查找的值'), N('table_array', '查找区域'), N('col_index_num', '返回第几列（从 1 起）'), N('range_lookup', 'FALSE/0 精确匹配，TRUE 近似匹配')],
  },
  {
    name: 'HLOOKUP', category: 'lookup',
    syntax: 'HLOOKUP(lookup_value, table_array, row_index_num, [range_lookup])',
    desc: '在表格首行查找值并返回同一列指定行的值。',
    example: '=HLOOKUP("销售",A1:F2,2,0)',
    params: [N('lookup_value', '要查找的值'), N('table_array', '查找区域'), N('row_index_num', '返回第几行（从 1 起）')],
  },
  {
    name: 'INDEX', category: 'lookup',
    syntax: 'INDEX(array, row_num, [column_num])',
    desc: '返回表格中指定行列交叉处的值。',
    example: '=INDEX(A1:D8,3,2)',
    params: [N('array', '单元格区域'), N('row_num', '区域中的行号（从 1 起）'), N('column_num', '可选，列号')],
  },
  {
    name: 'MATCH', category: 'lookup',
    syntax: 'MATCH(lookup_value, lookup_array, [match_type])',
    desc: '返回查找值在区域中的相对位置。',
    example: '=MATCH("华东",A2:A8,0)',
    params: [N('lookup_value', '要查找的值'), N('lookup_array', '查找区域'), N('match_type', '0 精确 / 1 升序 / -1 降序')],
  },
  {
    name: 'IFERROR', category: 'logic',
    syntax: 'IFERROR(value, value_if_error)',
    desc: '若公式出错则返回指定值，否则返回公式结果。',
    example: '=IFERROR(VLOOKUP(...),"未找到")',
    params: [N('value', '要检查的公式或值'), N('value_if_error', '出错时返回的值')],
  },
  {
    name: 'CONCAT', category: 'text',
    syntax: 'CONCAT(text1, [text2], ...)',
    desc: '连接多个文本字符串。',
    example: '=CONCAT(A2,"-",B2)',
    params: [N('text1', '第一个要连接的文本')],
  },
  {
    name: 'LEFT', category: 'text',
    syntax: 'LEFT(text, [num_chars])',
    desc: '从文本左侧提取指定个数的字符。',
    example: '=LEFT(A2,3)',
    params: [N('text', '要提取的文本'), N('num_chars', '提取的字符数')],
  },
  {
    name: 'RIGHT', category: 'text',
    syntax: 'RIGHT(text, [num_chars])',
    desc: '从文本右侧提取指定个数的字符。',
    example: '=RIGHT(A2,2)',
    params: [N('text', '要提取的文本'), N('num_chars', '提取的字符数')],
  },
  {
    name: 'MID', category: 'text',
    syntax: 'MID(text, start_num, num_chars)',
    desc: '从文本指定位置开始提取字符。',
    example: '=MID(A2,2,3)',
    params: [N('text', '要提取的文本'), N('start_num', '起始位置（从 1 起）'), N('num_chars', '提取字符数')],
  },
  {
    name: 'AND', category: 'logic',
    syntax: 'AND(logical1, [logical2], ...)',
    desc: '所有参数为真时返回 TRUE。',
    example: '=AND(D2>=1,C2>100000)',
    params: [N('logical1', '第一个条件')],
  },
  {
    name: 'OR', category: 'logic',
    syntax: 'OR(logical1, [logical2], ...)',
    desc: '任一参数为真时返回 TRUE。',
    example: '=OR(A2="华东",A2="华南")',
    params: [N('logical1', '第一个条件')],
  },
  {
    name: 'NOT', category: 'logic',
    syntax: 'NOT(logical)',
    desc: '对逻辑值取反。',
    example: '=NOT(D2>1)',
    params: [N('logical', '要取反的条件')],
  },
  {
    name: 'TODAY', category: 'datetime',
    syntax: 'TODAY()',
    desc: '返回当前日期。',
    example: '=TODAY()',
    params: [],
  },
  {
    name: 'NOW', category: 'datetime',
    syntax: 'NOW()',
    desc: '返回当前日期和时间。',
    example: '=NOW()',
    params: [],
  },
  {
    name: 'DATE', category: 'datetime',
    syntax: 'DATE(year, month, day)',
    desc: '返回指定日期的序列号。',
    example: '=DATE(2026,1,15)',
    params: [N('year', '年份'), N('month', '月份'), N('day', '日')],
  },
]

export function functionsOf(category: FuncCategory): FuncDef[] {
  if (category === 'common') return FUNCTIONS.filter((f) => f.category === 'common')
  return FUNCTIONS.filter((f) => f.category === category)
}

/** 表格数据：地区 / 部门 / 销售额 / 日期 */
export interface SalesRow {
  area: string
  dept: string
  amount: number
  date: string
}

export const SALES_ROWS: SalesRow[] = [
  { area: '华东', dept: '销售部', amount: 128000, date: '2025-01-15' },
  { area: '华南', dept: '销售部', amount: 156000, date: '2025-01-16' },
  { area: '华北', dept: '销售部', amount: 124000, date: '2025-01-17' },
  { area: '华东', dept: '市场部', amount: 98000, date: '2025-01-18' },
  { area: '华南', dept: '市场部', amount: 110000, date: '2025-01-19' },
  { area: '华北', dept: '技术部', amount: 95000, date: '2025-01-20' },
  { area: '华东', dept: '技术部', amount: 120000, date: '2025-01-21' },
]

export const DEFAULT_FORMULA = '=SUMIFS(C:C,B:B,"销售部",A:A,"华东")'

/** 命名区域（Design 里的「名称管理器」） */
export interface NamedRange { name: string; refersTo: string; scope: string }
export const NAMED_RANGES: NamedRange[] = [
  { name: '销售金额', refersTo: '=Sheet1!$C$2:$C$8', scope: '工作簿' },
  { name: '销售部门', refersTo: '=Sheet1!$B$2:$B$8', scope: '工作簿' },
  { name: '地区', refersTo: '=Sheet1!$A$2:$A$8', scope: '工作簿' },
  { name: '华东销售', refersTo: '=SUMIFS(销售金额,销售部门,"销售部",地区,"华东")', scope: '工作簿' },
]

/** 错误诊断示例（用于「公式审核」面板） */
export interface DiagnosticItem { cell: string; formula: string; code: string; hint: string; severity: 'error' | 'warning' }
export const DIAGNOSTICS: DiagnosticItem[] = [
  { cell: 'C10', formula: '=SUMIFS(C:C,B:B,"销售部",A:A,"华东")', code: 'OK', hint: '公式语法正确，计算结果为 248,000', severity: 'warning' },
  { cell: 'D12', formula: '=1/0', code: '#DIV/0!', hint: '除数不能为零，请检查分母单元格', severity: 'error' },
  { cell: 'D13', formula: '=NOSUCH(1)', code: '#NAME?', hint: '无法识别函数名 NOSUCH，请检查拼写', severity: 'error' },
  { cell: 'D14', formula: '=VLOOKUP("华北",A2:C8,5,0)', code: '#REF!', hint: '列索引 5 超出区域列数 3', severity: 'error' },
]
