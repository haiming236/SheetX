/**
 * @sheetx/formula - 函数注册表与第一版内置函数
 *
 * 第一版范围（正式方案 L509-522）：
 *   SUM AVERAGE MIN MAX | COUNT COUNTA | IF AND OR NOT | ROUND ABS
 *   CONCAT LEFT RIGHT MID | TODAY NOW DATE
 *   单元格引用 / 区域引用 / 相对绝对引用 / 跨表引用（引用在 Parser/Evaluator 层支持）
 *
 * 函数签名：接收「已求值的参数」（惰性参数——如 IF 的短路——v1 不做，
 * Excel 的 IF 其实两个分支都会先算吗？不会。v1 简化为先算后调，
 * 文档中注明：IF 分支短路留给 v2（需要把 AST 传给函数）。
 */

import { FormulaError, isFormulaError } from './errors.js'
import type { EvalValue, CellValueLike, ValueSource } from './evaluator.js'
import { toNumber, toBool, toStringValue } from './evaluator.js'
import { registerLookupFunctions } from './functions-lookup.js'

/** 函数实现上下文 */
export interface FunctionContext {
  source: ValueSource
  /** 供需要二次求值的函数使用（v1 未用，保留） */
  evaluator: unknown
  /** 公式所在工作表 */
  sheet: string | null
}

export type FunctionImpl = (args: EvalValue[], ctx: FunctionContext) => EvalValue

export class FunctionRegistry {
  private impls = new Map<string, FunctionImpl>()

  register(name: string, impl: FunctionImpl, options: { override?: boolean } = {}): void {
    const key = name.toUpperCase()
    if (this.impls.has(key) && !options.override) {
      throw new Error(`[SheetX] 公式函数 "${name}" 已注册。如需覆盖请传 { override: true }。`)
    }
    this.impls.set(key, impl)
  }

  get(name: string): FunctionImpl | undefined {
    return this.impls.get(name.toUpperCase())
  }

  has(name: string): boolean {
    return this.impls.has(name.toUpperCase())
  }

  list(): string[] {
    return [...this.impls.keys()]
  }
}

// ---------------------------------------------------------------------------
// 参数展开工具：区域 → 扁平值列表（聚合函数的基础）
// 错误实例保留在列表中（COUNTA 计数、聚合函数传播首错）
// ---------------------------------------------------------------------------

function flatten(args: ReadonlyArray<EvalValue>): Array<CellValueLike | FormulaError> {
  const out: Array<CellValueLike | FormulaError> = []
  for (const arg of args) {
    if (Array.isArray(arg)) {
      for (const row of arg) {
        for (const cell of row) out.push(cell)
      }
    } else {
      out.push(arg)
    }
  }
  return out
}

/** 聚合语义：任一错误参与 → 返回首个错误（Excel：SUM(A1:A3) 含 #DIV/0! → #DIV/0!） */
function firstError(values: ReadonlyArray<CellValueLike | FormulaError>): FormulaError | null {
  for (const value of values) {
    if (isFormulaError(value)) return value
  }
  return null
}

/** 聚合函数的数字提取：跳过空值与非数字（Excel SUM 语义） */
function numbersOf(values: ReadonlyArray<CellValueLike | FormulaError>): number[] {
  const out: number[] = []
  for (const value of values) {
    if (typeof value === 'number') out.push(value)
    else if (typeof value === 'boolean') out.push(value ? 1 : 0)
    else if (typeof value === 'string') {
      const num = Number(value)
      // Excel：SUM 中的字符串数字（单元格里的）不参与计算——只有字面量参数才转。
      // v1 采用严格语义：字符串一律跳过。
      void num
    }
  }
  return out
}

// ---------------------------------------------------------------------------
// Excel 日期序列（1900 系统；序列 1 = 1899-12-31，以 1899-12-30 起算使 1900-01-01 = 1）
// ---------------------------------------------------------------------------

const EXCEL_EPOCH_MS = Date.UTC(1899, 11, 30)

/** Date → Excel 序列（按 UTC 计算，避免时区漂移；文档说明） */
export function dateToSerial(date: Date): number {
  return (Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - EXCEL_EPOCH_MS) / 86400000
}

/** Excel 序列 → Date */
export function serialToDate(serial: number): Date {
  return new Date(EXCEL_EPOCH_MS + serial * 86400000)
}

function nowSerial(): number {
  const now = new Date()
  const daySerial = (Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - EXCEL_EPOCH_MS) / 86400000
  return daySerial + (now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds()) / 86400
}

// ---------------------------------------------------------------------------
// 第一版内置函数
// ---------------------------------------------------------------------------

export function createBuiltinFunctions(): FunctionRegistry {
  const registry = new FunctionRegistry()

  const needArgs = (args: EvalValue[], min: number, name: string): FormulaError | null => {
    if (args.length < min) return FormulaError.value()
    void name
    return null
  }

  // ---- 聚合（错误传播：区间内任一错误 → 结果为该错误） ----
  registry.register('SUM', (args) => {
    const err = needArgs(args, 1, 'SUM')
    if (err) return err
    const values = flatten(args)
    const cellError = firstError(values)
    if (cellError) return cellError
    return numbersOf(values).reduce((sum, n) => sum + n, 0)
  })

  registry.register('AVERAGE', (args) => {
    const err = needArgs(args, 1, 'AVERAGE')
    if (err) return err
    const values = flatten(args)
    const cellError = firstError(values)
    if (cellError) return cellError
    const numbers = numbersOf(values)
    if (numbers.length === 0) return FormulaError.div0()
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length
  })

  registry.register('MIN', (args) => {
    const err = needArgs(args, 1, 'MIN')
    if (err) return err
    const values = flatten(args)
    const cellError = firstError(values)
    if (cellError) return cellError
    const numbers = numbersOf(values)
    return numbers.length === 0 ? 0 : Math.min(...numbers)
  })

  registry.register('MAX', (args) => {
    const err = needArgs(args, 1, 'MAX')
    if (err) return err
    const values = flatten(args)
    const cellError = firstError(values)
    if (cellError) return cellError
    const numbers = numbersOf(values)
    return numbers.length === 0 ? 0 : Math.max(...numbers)
  })

  // ---- 计数 ----
  registry.register('COUNT', (args) => numbersOf(flatten(args)).length)

  registry.register('COUNTA', (args) => {
    return flatten(args).filter((value) => value !== null && value !== undefined && value !== '').length
  })

  // ---- 逻辑 ----
  registry.register('IF', (args) => {
    const err = needArgs(args, 2, 'IF')
    if (err) return err
    const cond = toBool(args[0]!)
    if (isFormulaError(cond)) return cond
    if (cond) return args[1]!
    return args.length >= 3 ? args[2]! : false
  })

  registry.register('AND', (args) => {
    const err = needArgs(args, 1, 'AND')
    if (err) return err
    for (const value of flatten(args)) {
      const bool = toBool(value)
      if (isFormulaError(bool)) return bool
      if (!bool) return false
    }
    return true
  })

  registry.register('OR', (args) => {
    const err = needArgs(args, 1, 'OR')
    if (err) return err
    for (const value of flatten(args)) {
      const bool = toBool(value)
      if (isFormulaError(bool)) return bool
      if (bool) return true
    }
    return false
  })

  registry.register('NOT', (args) => {
    const err = needArgs(args, 1, 'NOT')
    if (err) return err
    const bool = toBool(args[0]!)
    if (isFormulaError(bool)) return bool
    return !bool
  })

  // ---- 数学 ----
  registry.register('ROUND', (args) => {
    const err = needArgs(args, 1, 'ROUND')
    if (err) return err
    const num = toNumber(args[0]!)
    if (isFormulaError(num)) return num
    const digits = args.length >= 2 ? toNumber(args[1]!) : 0
    if (isFormulaError(digits)) return digits
    const factor = Math.pow(10, digits)
    return Math.sign(num) * Math.round(Math.abs(num) * factor) / factor
  })

  registry.register('ABS', (args) => {
    const err = needArgs(args, 1, 'ABS')
    if (err) return err
    const num = toNumber(args[0]!)
    if (isFormulaError(num)) return num
    return Math.abs(num)
  })

  // ---- 文本 ----
  registry.register('CONCAT', (args) => flatten(args).map((value) => toStringValue(value)).join(''))

  registry.register('LEFT', (args) => {
    const err = needArgs(args, 1, 'LEFT')
    if (err) return err
    const text = toStringValue(args[0]!)
    const count = args.length >= 2 ? toNumber(args[1]!) : 1
    if (isFormulaError(count)) return count
    return text.slice(0, Math.max(0, count))
  })

  registry.register('RIGHT', (args) => {
    const err = needArgs(args, 1, 'RIGHT')
    if (err) return err
    const text = toStringValue(args[0]!)
    const count = args.length >= 2 ? toNumber(args[1]!) : 1
    if (isFormulaError(count)) return count
    return count <= 0 ? '' : text.slice(Math.max(0, text.length - count))
  })

  registry.register('MID', (args) => {
    const err = needArgs(args, 3, 'MID')
    if (err) return err
    const text = toStringValue(args[0]!)
    const start = toNumber(args[1]!)
    if (isFormulaError(start)) return start
    const length = toNumber(args[2]!)
    if (isFormulaError(length)) return length
    if (start < 1 || length < 0) return FormulaError.value()
    return text.substr(start - 1, length)
  })

  // ---- 日期 ----
  registry.register('TODAY', () => Math.floor(nowSerial()))
  registry.register('NOW', () => nowSerial())

  registry.register('DATE', (args) => {
    const err = needArgs(args, 3, 'DATE')
    if (err) return err
    const year = toNumber(args[0]!)
    if (isFormulaError(year)) return year
    const month = toNumber(args[1]!)
    if (isFormulaError(month)) return month
    const day = toNumber(args[2]!)
    if (isFormulaError(day)) return day
    // Excel 语义：月/日越界自动进位（DATE(2026,13,1) = 2027-01-01）
    const date = new Date(Date.UTC(year, month - 1, day))
    return (Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - EXCEL_EPOCH_MS) / 86400000
  })

  // M4 高级公式：查找 / 条件聚合（与第一版 19 个函数同一注册表）
  registerLookupFunctions(registry)

  return registry
}
