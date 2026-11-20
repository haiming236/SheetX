/**
 * @sheetx/formula - 求值器
 *
 * Excel 语义要点：
 * - 错误传播：任一操作数是错误 → 结果即该错误（不抛异常）；
 * - 空单元格参与算术按 0，参与字符串按 ''；
 * - 比较运算：同为数值按数值比；否则字符串大小写不敏感比较；
 * - 区域在标量上下文中 = #VALUE!（数组语义留给 v2 的动态数组）。
 */

import { FormulaError, isFormulaError } from './errors.js'
import type { AstNode } from './ast.js'
import type { FunctionRegistry } from './functions.js'

/** 单元格值类型（对齐 core CellValue；此处自带别名避免依赖方向倒置） */
export type CellValueLike = string | number | boolean | null | undefined

/** 取值源的单元格返回值：普通值或**错误实例**（错误保真传播，不字符串化） */
export type SourceCellValue = CellValueLike | FormulaError

/** 公式的取值来源（由 spreadsheet/grid 引擎实现；formula 包不持有数据） */
export interface ValueSource {
  /** 读取单元格原始值；sheet 为 null 表示当前工作表 */
  getCellValue(sheet: string | null, row: number, col: number): SourceCellValue
  /** 区域取值（行主序二维数组） */
  getRangeValues(sheet: string | null, r1: number, c1: number, r2: number, c2: number): SourceCellValue[][]
}

/** 求值结果：标量值 / 错误 / 区域（行主序矩阵） */
export type EvalValue = CellValueLike | FormulaError | (CellValueLike | FormulaError)[][]

export interface EvalContext {
  /** 公式所在工作表（相对引用的解析基准） */
  sheet: string | null
}

export class Evaluator {
  constructor(
    private readonly source: ValueSource,
    private readonly functions: FunctionRegistry,
  ) {}

  evaluate(node: AstNode, ctx: EvalContext): EvalValue {
    switch (node.kind) {
      case 'number':
        return node.value
      case 'string':
        return node.value
      case 'bool':
        return node.value
      case 'error':
        return new FormulaError(node.code as FormulaError['code'])
      case 'ident':
        return FormulaError.nameError() // 未知名字 → #NAME?
      case 'ref': {
        const sheet = node.sheet ?? ctx.sheet
        return this.source.getCellValue(sheet, node.parts.row, node.parts.col)
      }
      case 'range': {
        const sheet = node.sheet ?? ctx.sheet
        return this.source.getRangeValues(
          sheet,
          Math.min(node.from.row, node.to.row),
          Math.min(node.from.col, node.to.col),
          Math.max(node.from.row, node.to.row),
          Math.max(node.from.col, node.to.col),
        )
      }
      case 'unary': {
        const value = this.evaluate(node.operand, ctx)
        if (isFormulaError(value)) return value
        const num = toNumber(value)
        if (isFormulaError(num)) return num
        return node.op === '-' ? -num : num
      }
      case 'percent': {
        const value = this.evaluate(node.operand, ctx)
        if (isFormulaError(value)) return value
        const num = toNumber(value)
        if (isFormulaError(num)) return num
        return num / 100
      }
      case 'binary':
        return this.evaluateBinary(node.op, node.left, node.right, ctx)
      case 'call': {
        const impl = this.functions.get(node.name)
        if (!impl) return FormulaError.nameError()
        const args = node.args.map((arg) => this.evaluate(arg, ctx))
        return impl(args, { source: this.source, evaluator: this, sheet: ctx.sheet })
      }
    }
  }

  private evaluateBinary(op: BinaryOpAlias, leftNode: AstNode, rightNode: AstNode, ctx: EvalContext): EvalValue {
    const left = this.evaluate(leftNode, ctx)
    if (isFormulaError(left)) return left
    const right = this.evaluate(rightNode, ctx)
    if (isFormulaError(right)) return right

    switch (op) {
      case '&': {
        // 连接：区域取左上角；错误已提前传播
        return stringify(this.scalarOf(left, op), this.scalarOf(right, op))
      }
      case '=':
      case '<>':
      case '<':
      case '>':
      case '<=':
      case '>=': {
        const l = this.scalarOf(left, op)
        const r = this.scalarOf(right, op)
        if (isFormulaError(l)) return l
        if (isFormulaError(r)) return r
        return compare(op, l, r)
      }
      default: {
        // 算术：转数字
        const l = toNumber(this.scalarOf(left, op))
        if (isFormulaError(l)) return l
        const r = toNumber(this.scalarOf(right, op))
        if (isFormulaError(r)) return r
        switch (op) {
          case '+':
            return l + r
          case '-':
            return l - r
          case '*':
            return l * r
          case '/':
            return r === 0 ? FormulaError.div0() : l / r
          case '^':
            return Math.pow(l, r)
        }
      }
    }
  }

  /** 标量上下文中的区域 → 取左上角？Excel 数组语义复杂；v1：区域在标量上下文 = #VALUE! */
  private scalarOf(value: EvalValue, _op: string): CellValueLike | FormulaError {
    if (Array.isArray(value)) {
      const first = value[0]?.[0]
      // 单格区域（如 A1:A1）允许取值；多格区域报 VALUE
      return first === undefined ? null : first
    }
    return value
  }
}

type BinaryOpAlias = '+' | '-' | '*' | '/' | '^' | '&' | '=' | '<>' | '<' | '>' | '<=' | '>='

// ---------------------------------------------------------------------------
// 类型强转（Excel 语义的简化实现）
// ---------------------------------------------------------------------------

/** 值 → 数字；失败返回 #VALUE!（空值 = 0，布尔 = 1/0，数字串可转换） */
export function toNumber(value: EvalValue): number | FormulaError {
  if (isFormulaError(value)) return value
  if (Array.isArray(value)) return FormulaError.value()
  if (value === null || value === undefined || value === '') return 0
  if (typeof value === 'number') return value
  if (typeof value === 'boolean') return value ? 1 : 0
  const trimmed = String(value).trim()
  if (trimmed === '') return 0
  const num = Number(trimmed)
  return Number.isNaN(num) ? FormulaError.value() : num
}

/** 值 → 布尔（IF/AND/OR 用） */
export function toBool(value: EvalValue): boolean | FormulaError {
  if (isFormulaError(value)) return value
  if (Array.isArray(value)) return FormulaError.value()
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (value === null || value === undefined || value === '') return false
  const upper = String(value).trim().toUpperCase()
  if (upper === 'TRUE') return true
  if (upper === 'FALSE') return false
  const num = Number(value)
  return Number.isNaN(num) ? FormulaError.value() : num !== 0
}

/** 值 → 字符串 */
export function toStringValue(value: EvalValue): string {
  if (isFormulaError(value)) return value.code
  if (Array.isArray(value)) return ''
  if (value === null || value === undefined) return ''
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE'
  return String(value)
}

function stringify(l: CellValueLike | FormulaError, r: CellValueLike | FormulaError): string {
  return toStringValue(l) + toStringValue(r)
}

/** 比较运算（数值优先，否则大小写不敏感字符串比较） */
function compare(op: string, l: CellValueLike | FormulaError, r: CellValueLike | FormulaError): boolean | FormulaError {
  if (isFormulaError(l)) return l
  if (isFormulaError(r)) return r
  let result: number
  if (typeof l === 'number' && typeof r === 'number') {
    result = l === r ? 0 : l < r ? -1 : 1
  } else if (typeof l === 'boolean' || typeof r === 'boolean') {
    const lb = toBoolStrict(l)
    const rb = toBoolStrict(r)
    result = lb === rb ? 0 : lb ? 1 : -1
  } else {
    const ls = toStringValue(l).toLowerCase()
    const rs = toStringValue(r).toLowerCase()
    result = ls === rs ? 0 : ls < rs ? -1 : 1
  }
  switch (op) {
    case '=':
      return result === 0
    case '<>':
      return result !== 0
    case '<':
      return result < 0
    case '>':
      return result > 0
    case '<=':
      return result <= 0
    case '>=':
      return result >= 0
    default:
      return FormulaError.value()
  }
}

function toBoolStrict(value: CellValueLike): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  return String(value).toUpperCase() === 'TRUE'
}
