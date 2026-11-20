/**
 * @sheetx/formula - 公式引擎
 *
 * 职责：词法、AST、依赖图、增量计算、函数注册表（任务书 T5）。
 * 依赖方向：只依赖 @sheetx/core（引擎层纪律；可独立 import，不拉入 UI）。
 * 借鉴 Univer engine-formula 的架构思想（Lexer→AST→Interpreter→依赖图→增量调度），
 * 代码为自研实现（Apache-2.0 只借鉴思想，禁止复制）。
 */

export { FormulaEngine, valueToCell } from './engine.js'
export type { FormulaChange, FormulaEngineOptions } from './engine.js'
export { parseFormula } from './parser.js'
export { tokenize, FormulaSyntaxError } from './lexer.js'
export type { Token, TokenType } from './lexer.js'
export { FormulaError, FormulaErrorCode, isFormulaError } from './errors.js'
export type { FormulaErrorCodeValue } from './errors.js'
export { Evaluator, toNumber, toBool, toStringValue } from './evaluator.js'
export type { EvalValue, ValueSource, CellValueLike, EvalContext } from './evaluator.js'
export { FunctionRegistry, createBuiltinFunctions, dateToSerial, serialToDate } from './functions.js'
export { registerLookupFunctions } from './functions-lookup.js'
export type { FunctionImpl, FunctionContext } from './functions.js'
export { DependencyGraph, nodeKey } from './graph.js'
export type { FormulaNode, ChangedCell, CollectResult } from './graph.js'
export { colToLetters, lettersToCol, formatA1, parseRefText, refContains } from './refs.js'
export { collectRanges, astToString } from './ast.js'
export type { AstNode, BinaryOp, ExtractedRange, RefParts } from './ast.js'
