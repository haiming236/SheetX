/**
 * @sheetx/formula - 公式错误值
 *
 * Excel 语义：错误是「值」不是异常——#DIV/0! 会沿依赖传播，而不是炸掉求值器。
 * 因此 FormulaError 以实例形态在求值管线中流动，函数逐层检查并传播。
 */

/** Excel 标准错误码 + SheetX 扩展（循环引用） */
export const FormulaErrorCode = {
  DIV0: '#DIV/0!',
  NAME: '#NAME?',
  NA: '#N/A',
  NULL: '#NULL!',
  NUM: '#NUM!',
  REF: '#REF!',
  VALUE: '#VALUE!',
  /** SheetX 扩展：依赖图中检测到的循环引用（Excel 显示 0 + 警告，我们显式标错） */
  CYCLE: '#CYCLE!',
} as const

export type FormulaErrorCodeValue = (typeof FormulaErrorCode)[keyof typeof FormulaErrorCode]

export class FormulaError {
  readonly code: FormulaErrorCodeValue

  constructor(code: FormulaErrorCodeValue) {
    this.code = code
  }

  static div0(): FormulaError {
    return new FormulaError(FormulaErrorCode.DIV0)
  }
  /** #NAME?（不能命名为 static name——与 Function.prototype.name 冲突，
   *  在 useDefineForClassFields:false 的宿主包（Lit 适配层）下直接编译失败） */
  static nameError(): FormulaError {
    return new FormulaError(FormulaErrorCode.NAME)
  }
  static na(): FormulaError {
    return new FormulaError(FormulaErrorCode.NA)
  }
  static num(): FormulaError {
    return new FormulaError(FormulaErrorCode.NUM)
  }
  static ref(): FormulaError {
    return new FormulaError(FormulaErrorCode.REF)
  }
  static value(): FormulaError {
    return new FormulaError(FormulaErrorCode.VALUE)
  }
  static cycle(): FormulaError {
    return new FormulaError(FormulaErrorCode.CYCLE)
  }

  toString(): string {
    return this.code
  }
}

/** 运行时判别：值是否为公式错误 */
export function isFormulaError(value: unknown): value is FormulaError {
  return value instanceof FormulaError
}
