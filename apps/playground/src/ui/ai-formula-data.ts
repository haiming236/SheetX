/**
 * SheetX 第 47 张 · AI 公式助手 — 数据与公式逻辑
 *
 * 关键：公式求值直接使用 @sheetx/formula 的真实引擎（Lexer → AST → Evaluator），
 * 页面上的"结果预览"是真算出来的，不是写死的展示值。
 */
import { FormulaEngine, isFormulaError } from '@sheetx/formula'
import type { ValueSource, CellValueLike } from '@sheetx/formula'

export interface ProductRow {
  name: string
  price: number
  qty: number
  /** D 列公式，如 =B2*C2 */
  formula: string
}

export const PRODUCT_ROWS: ProductRow[] = [
  { name: 'MacBook Pro', price: 12999, qty: 2, formula: '=B2*C2' },
  { name: 'iPhone 17', price: 7999, qty: 3, formula: '=B3*C3' },
  { name: 'iPad Pro', price: 5999, qty: 5, formula: '=B4*C4' },
  { name: 'AirPods Pro', price: 1999, qty: 10, formula: '=B5*C5' },
  { name: 'Apple Watch', price: 2999, qty: 4, formula: '=B6*C6' },
]

export const SHEET = '销售数据'

/**
 * D 列「小计」的数值。
 * 引擎的数据源必须提供**值**（引擎不持有数据），所以不能把 '=B2*C2' 文本直接喂给 SUM。
 * 这里把每行的公式解析成实际数值后再提供给引擎，SUM/AVERAGE 才有意义。
 */
export function computeD(item: ProductRow, rows: readonly ProductRow[]): number {
  const f = item.formula.trim().toUpperCase()
  if (/^=B\d+\*C\d+$/.test(f)) return item.price * item.qty
  const all = rows.map((row) => row.price * row.qty)
  if (f.startsWith('=SUM(D')) return all.reduce((sum, value) => sum + value, 0)
  if (f.startsWith('=AVERAGE(D')) return all.length > 0 ? all.reduce((sum, value) => sum + value, 0) / all.length : 0
  if (f.startsWith('=COUNT(D')) return all.length
  if (f.startsWith('=MAX(D')) return Math.max(...all)
  if (f.startsWith('=MIN(D')) return Math.min(...all)
  return item.price * item.qty
}

/** 构造真实公式引擎：数据源把 A/B/C/D 列映射为行主序单元格 */
export function createEngine(rows: readonly ProductRow[]): FormulaEngine {
  const valueAt = (row: number, col: number): CellValueLike => {
    if (row <= 0) {
      if (row === 0) return ['产品名称', '单价（元）', '数量', '小计'][col] ?? null
      return null
    }
    const item = rows[row - 1]
    if (!item) return null
    if (col === 0) return item.name
    if (col === 1) return item.price
    if (col === 2) return item.qty
    if (col === 3) return computeD(item, rows)
    return null
  }
  const source: ValueSource = {
    getCellValue(_sheet: string | null, row: number, col: number): CellValueLike {
      return valueAt(row, col)
    },
    getRangeValues(_sheet: string | null, r1: number, c1: number, r2: number, c2: number): CellValueLike[][] {
      const result: CellValueLike[][] = []
      for (let r = r1; r <= r2; r++) {
        const line: CellValueLike[] = []
        for (let c = c1; c <= c2; c++) line.push(valueAt(r, c))
        result.push(line)
      }
      return result
    },
  }
  return new FormulaEngine({ source })
}

/** 用真实引擎求值；出错时返回错误码字符串 */
export function evalFormula(engine: FormulaEngine, formula: string): number | string {
  try {
    const value = engine.evaluateText(formula, SHEET)
    if (isFormulaError(value)) return value.code
    if (typeof value === 'number') return value
    if (typeof value === 'boolean') return value ? 1 : 0
    if (Array.isArray(value)) {
      const first = value[0]?.[0]
      return typeof first === 'number' ? first : String(first ?? '')
    }
    return String(value ?? '')
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return message.includes('syntax') || message.includes('Syntax') ? '#NAME?' : '#ERROR!'
  }
}

/** 数字格式化（千分位、最多 2 位小数） */
export function fmt(value: number | string): string {
  if (typeof value !== 'number') return value
  return value.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
}

export interface FormulaSuggestion {
  formula: string
  /** 简短说明 */
  desc: string
  /** 图标名 */
  icon: 'chartBar' | 'sigma' | 'calc' | 'count' | 'warnTriangle'
}

/** 常用公式推荐（点击即写入并求值） */
export const SUGGESTIONS: FormulaSuggestion[] = [
  { formula: '=SUM(C2:C6)', desc: '计算 C2:C6 的总和', icon: 'chartBar' },
  { formula: '=SUMIF(A2:A6,"MacBook*",C2:C6)', desc: '按产品名称汇总', icon: 'sigma' },
  { formula: '=AVERAGE(C2:C6)', desc: '计算平均值', icon: 'sigma' },
  { formula: '=COUNT(C2:C6)', desc: '统计数量', icon: 'count' },
]

/** 自然语言 → 公式（规则式，覆盖常见业务问法） */
export function generateFormula(prompt: string): FormulaSuggestion[] {
  const text = prompt.trim()
  const lower = text.toLowerCase()
  const all: FormulaSuggestion[] = []

  if (/总|合计|求和|sum/.test(text) || /total|sum/.test(lower)) {
    all.push({ formula: '=SUM(D2:D6)', desc: '计算总销售额（D2:D6）', icon: 'chartBar' })
    all.push({ formula: '=SUM(C2:C6)', desc: '计算总数量（C2:C6）', icon: 'sigma' })
  }
  if (/平均|均值|average/.test(text) || /avg/.test(lower)) {
    all.push({ formula: '=AVERAGE(D2:D6)', desc: '计算平均销售额', icon: 'sigma' })
    all.push({ formula: '=AVERAGE(C2:C6)', desc: '计算平均数量', icon: 'sigma' })
  }
  if (/条件|筛选|指定|macbook|sumif|按产品/.test(lower)) {
    all.push({ formula: '=SUMIF(A2:A6,"MacBook*",C2:C6)', desc: '按产品名称汇总数量', icon: 'sigma' })
  }
  if (/数量|个数|统计|count/.test(text) || /count/.test(lower)) {
    all.push({ formula: '=COUNT(C2:C6)', desc: '统计数量列非空单元格', icon: 'count' })
  }
  if (/最大|最高|max/.test(text) || /max/.test(lower)) {
    all.push({ formula: '=MAX(D2:D6)', desc: '找出最高销售额', icon: 'chartBar' })
  }
  if (/最小|最低|min/.test(text) || /min/.test(lower)) {
    all.push({ formula: '=MIN(D2:D6)', desc: '找出最低销售额', icon: 'chartBar' })
  }
  if (/小计|单价|乘以|金额|每行/.test(text)) {
    all.push({ formula: '=B2*C2', desc: '单价 × 数量，计算本行小计', icon: 'sigma' })
  }

  return all.length > 0 ? dedupe(all) : dedupe(SUGGESTIONS)
}

function dedupe(items: FormulaSuggestion[]): FormulaSuggestion[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    if (seen.has(item.formula)) return false
    seen.add(item.formula)
    return true
  })
}

/** 公式解释（按函数拆解，中文说明） */
export function explain(formula: string): string {
  const f = formula.toUpperCase()
  if (f.includes('SUMIF')) {
    return 'SUMIF 按条件求和：先在 A2:A6 中查找以「MacBook」开头的产品，再把这些产品对应的 C2:C6 数量相加。'
  }
  if (f.includes('AVERAGE')) {
    return 'AVERAGE 计算平均值：把参数范围内所有数字相加，再除以数字的个数（忽略空白与文本）。'
  }
  if (f.includes('COUNT')) {
    return 'COUNT 统计数字个数：只统计范围内为数值的单元格，文本与空白不计入。'
  }
  if (f.includes('MAX')) return 'MAX 返回范围内的最大值，适合找出销售额最高的记录。'
  if (f.includes('MIN')) return 'MIN 返回范围内的最小值，适合找出销售额最低的记录。'
  if (f.includes('SUM')) {
    return 'SUM 用于计算一列或一行数值的总和。这里对指定区域逐格相加，空白单元格按 0 处理。'
  }
  if (/[*/]/.test(formula)) {
    return '这是算术公式：按运算符优先级先乘除后加减。此处用单价乘以数量得到本行小计。'
  }
  return '该公式引用了表格中的单元格或区域，引擎会按引用取值后参与计算。'
}

/** 公式诊断与修复：返回 { ok, message, fixed? } */
export function diagnose(formula: string): { ok: boolean; message: string; fixed?: string } {
  const trimmed = formula.trim()
  if (!trimmed) return { ok: false, message: '公式为空，请输入以 = 开头的公式。' }
  if (!trimmed.startsWith('=')) {
    return { ok: false, message: '公式需要以 = 开头。', fixed: `=${trimmed}` }
  }
  // 括号配对
  let depth = 0
  for (const ch of trimmed) {
    if (ch === '(') depth++
    if (ch === ')') depth--
    if (depth < 0) return { ok: false, message: '括号不匹配：多了一个右括号。', fixed: trimmed.replace(/\)$/, '') }
  }
  if (depth > 0) return { ok: false, message: '括号不匹配：缺少右括号。', fixed: `${trimmed}${')'.repeat(depth)}` }
  // 列名拼写常见错误
  const fixedCol = trimmed.replace(/=([A-Za-z]+)(\d|:)/g, (match, letters: string, rest: string) => {
    const upper = letters.toUpperCase()
    return /^[A-Z]{1,3}$/.test(upper) ? `=${upper}${rest}` : match
  })
  if (fixedCol !== trimmed) {
    return { ok: false, message: '检测到小写列名，已自动改为大写。', fixed: fixedCol }
  }
  // 中文引号（从聊天复制常见）
  if (/[“”]/.test(trimmed)) {
    return { ok: false, message: '检测到中文引号，公式中应使用英文双引号。', fixed: trimmed.replace(/[“”]/g, '"') }
  }
  return { ok: true, message: '公式语法检查通过。' }
}

/** 预设提问 */
export const QUICK_PROMPTS = [
  '请帮我计算总销售额，并给出平均值',
  '统计各产品的数量个数',
  '按产品名称求和 MacBook 的数量',
]
