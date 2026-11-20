/**
 * @sheetx/formula - 高级公式（正式方案 M4）：查找与条件聚合函数
 *
 * 零依赖、只消费「已求值参数」：区域以二维数组传入（EvalValue），
 * 因此 VLOOKUP/HLOOKUP/INDEX/MATCH 不需要访问引擎内部存储。
 * 错误值原样参与（#N/A 可经 IFERROR 兜底，符合 Excel 语义）。
 */
import { FormulaError, isFormulaError } from './errors.js'
import { toNumber, toBool } from './evaluator.js'
import type { EvalValue, CellValueLike } from './evaluator.js'
import type { FunctionRegistry } from './functions.js'

type Cell = CellValueLike | FormulaError
type Matrix = Cell[][]

function asMatrix(value: EvalValue | undefined): Matrix {
  if (value === undefined || value === null) return []
  if (Array.isArray(value)) return value
  return [[value as Cell]]
}

/** 标量位置收到区域时取左上角（Excel 语义） */
function asCell(value: EvalValue): Cell {
  return Array.isArray(value) ? ((value[0]?.[0] ?? null) as Cell) : (value as Cell)
}

function cellEqual(a: Cell, b: Cell): boolean {
  if (isFormulaError(a) || isFormulaError(b)) return false
  // Excel 文本比较不区分大小写
  if (typeof a === 'string' && typeof b === 'string') return a.toLowerCase() === b.toLowerCase()
  return a === b
}

/** 条件匹配：精确值 或 ">=10" / "<>甲" 这类简单比较表达式 */
function criteriaMatch(value: Cell, criteria: Cell): boolean {
  if (isFormulaError(value) || isFormulaError(criteria)) return false
  if (typeof criteria !== 'string') return cellEqual(value, criteria)
  const match = /^(>=|<=|<>|>|<|=)\s*(.*)$/.exec(criteria.trim())
  if (!match) return cellEqual(value, criteria.trim())
  const operator = match[1]!
  const raw = match[2]!
  const numeric = Number(raw)
  if (Number.isFinite(numeric) && raw !== '') {
    const current = Number(value)
    if (!Number.isFinite(current)) return false
    switch (operator) {
      case '>': return current > numeric
      case '<': return current < numeric
      case '>=': return current >= numeric
      case '<=': return current <= numeric
      case '=': return current === numeric
      case '<>': return current !== numeric
    }
  }
  const text = String(value).toLowerCase()
  const target = raw.toLowerCase()
  switch (operator) {
    case '>': return text > target
    case '<': return text < target
    case '>=': return text >= target
    case '<=': return text <= target
    case '=': return text === target
    case '<>': return text !== target
  }
  return false
}

/** 注册 M4 查找/条件聚合函数（在 createBuiltinFunctions 中调用） */
export function registerLookupFunctions(registry: FunctionRegistry): void {
  // VLOOKUP(查找值, 区域, 列序号, [精确匹配])
  registry.register('VLOOKUP', (args) => {
    if (args.length < 3) return FormulaError.value()
    const key = args[0]!
    if (isFormulaError(key)) return key
    const table = asMatrix(args[1])
    const column = toNumber(args[2]!)
    if (isFormulaError(column)) return column
    const maxColumns = Math.max(0, ...table.map((row) => row.length))
    if (table.length === 0 || column < 1 || column > maxColumns) return FormulaError.ref()
    // Excel: 第 4 参数 FALSE/0 = 精确匹配，TRUE/1/省略 = 近似匹配
    const exact = args.length > 3 && toBool(args[3]!) === false

    if (exact) {
      for (const row of table) {
        if (cellEqual(row[0]!, asCell(key))) return row[column - 1]!
      }
      return FormulaError.na()
    }
    // 近似匹配：首列升序，返回不超过查找值的最大一行
    const numericKey = toNumber(key)
    if (isFormulaError(numericKey)) return FormulaError.na()
    let found: Cell | null = null
    for (const row of table) {
      const first = toNumber(row[0]!)
      if (isFormulaError(first)) continue
      if (first > numericKey) break
      found = row[column - 1]!
    }
    return found ?? FormulaError.na()
  })

  // HLOOKUP(查找值, 区域, 行序号, [精确匹配])：按首行匹配列
  registry.register('HLOOKUP', (args) => {
    if (args.length < 3) return FormulaError.value()
    const key = args[0]!
    if (isFormulaError(key)) return key
    const table = asMatrix(args[1])
    const rowIndex = toNumber(args[2]!)
    if (isFormulaError(rowIndex)) return rowIndex
    const header = table[0]
    if (!header || rowIndex < 1 || rowIndex > table.length) return FormulaError.ref()
    // Excel: 第 4 参数 FALSE/0 = 精确匹配，TRUE/1/省略 = 近似匹配
    const exact = args.length > 3 && toBool(args[3]!) === false

    if (exact) {
      for (let col = 0; col < header.length; col++) {
        if (cellEqual(header[col]!, asCell(key))) return table[rowIndex - 1]![col]!
      }
      return FormulaError.na()
    }
    const numericKey = toNumber(key)
    if (isFormulaError(numericKey)) return FormulaError.na()
    let found: Cell | null = null
    for (let col = 0; col < header.length; col++) {
      const first = toNumber(header[col]!)
      if (isFormulaError(first)) continue
      if (first > numericKey) break
      found = table[rowIndex - 1]![col]!
    }
    return found ?? FormulaError.na()
  })

  // INDEX(区域, 行, [列])：1-based；省略列时按一维区域处理
  registry.register('INDEX', (args) => {
    if (args.length < 2) return FormulaError.value()
    const array = asMatrix(args[0])
    const row = toNumber(args[1]!)
    const col = args.length > 2 ? toNumber(args[2]!) : 1
    if (isFormulaError(row)) return row
    if (isFormulaError(col)) return col
    if (row < 1 || col < 1) return FormulaError.value()
    const value = (args.length > 2 ? array[row - 1]?.[col - 1] : array[0]?.[row - 1]) ?? null
    return value === null ? FormulaError.ref() : value
  })

  // MATCH(查找值, 区域, [匹配类型])：0 精确 / 1 升序近似 / -1 降序近似
  registry.register('MATCH', (args) => {
    if (args.length < 2) return FormulaError.value()
    const key = args[0]!
    if (isFormulaError(key)) return key
    const values = asMatrix(args[1]).flat()
    const type = args.length > 2 ? toNumber(args[2]!) : 1
    if (isFormulaError(type)) return type

    if (type === 0) {
      for (let i = 0; i < values.length; i++) {
        if (cellEqual(values[i]!, asCell(key))) return i + 1
      }
      return FormulaError.na()
    }
    const numericKey = toNumber(key)
    if (isFormulaError(numericKey)) return FormulaError.na()
    let found = 0
    for (let i = 0; i < values.length; i++) {
      const current = toNumber(values[i]!)
      if (isFormulaError(current)) continue
      if (type === -1) {
        if (current >= numericKey) found = i + 1
        else break
      } else if (current <= numericKey) {
        found = i + 1
      } else {
        break
      }
    }
    return found === 0 ? FormulaError.na() : found
  })

  // IFERROR(值, 出错时的值)
  registry.register('IFERROR', (args) => {
    if (args.length < 2) return FormulaError.value()
    return isFormulaError(args[0]!) ? args[1]! : args[0]!
  })

  // SUMIF(条件区域, 条件, [求和区域])
  registry.register('SUMIF', (args) => {
    if (args.length < 2) return FormulaError.value()
    const range = asMatrix(args[0]).flat()
    const criteria = args[1]!
    const sumRange = args.length > 2 ? asMatrix(args[2]).flat() : range
    const criteriaCell = asCell(criteria)
    let total = 0
    for (let i = 0; i < range.length; i++) {
      if (!criteriaMatch(range[i]!, criteriaCell)) continue
      const value = toNumber(sumRange[i] ?? 0)
      if (isFormulaError(value)) return value
      total += value
    }
    return total
  })

  // COUNTIF(区域, 条件)
  registry.register('COUNTIF', (args) => {
    if (args.length < 2) return FormulaError.value()
    const range = asMatrix(args[0]).flat()
    const criteriaCell = asCell(args[1]!)
    return range.reduce<number>((count, value) => count + (criteriaMatch(value, criteriaCell) ? 1 : 0), 0)
  })
}
