/**
 * @sheetx/formula - 抽象语法树
 *
 * 纯数据节点（plain object，非类实例）：可序列化检查友好、无循环引用、
 * 访问模式简单。kind 判别联合。
 */

import { colToLetters, formatA1 } from './refs.js'

export interface RefParts {
  row: number
  col: number
  absRow: boolean
  absCol: boolean
}

export type AstNode =
  | { kind: 'number'; value: number }
  | { kind: 'string'; value: string }
  | { kind: 'bool'; value: boolean }
  | { kind: 'error'; code: string }
  /** 单元格引用。sheet 为 null 表示当前工作表 */
  | { kind: 'ref'; sheet: string | null; parts: RefParts }
  /** 区域引用（矩形，闭区间；from/to 均为解析时语法顺序，求值时归一化） */
  | { kind: 'range'; sheet: string | null; from: RefParts; to: RefParts }
  | { kind: 'unary'; op: '-' | '+'; operand: AstNode }
  | { kind: 'percent'; operand: AstNode }
  | { kind: 'binary'; op: BinaryOp; left: AstNode; right: AstNode }
  | { kind: 'call'; name: string; args: AstNode[] }
  /** 裸标识符（未知名字）——求值时报 #NAME? */
  | { kind: 'ident'; name: string }

export type BinaryOp = '+' | '-' | '*' | '/' | '^' | '&' | '=' | '<>' | '<' | '>' | '<=' | '>='

/** 依赖提取的引用区间（归一化后；sheet 恒为实际表名——null 引用在建图时已解析） */
export interface ExtractedRange {
  sheet: string
  r1: number
  c1: number
  r2: number
  c2: number
}

/** 从 AST 收集全部引用区间（依赖图建边用；相对引用以 formulaSheet 归一化） */
export function collectRanges(node: AstNode, formulaSheet: string | null, out: ExtractedRange[] = []): ExtractedRange[] {
  switch (node.kind) {
    case 'ref': {
      const sheet = node.sheet ?? formulaSheet
      if (sheet !== null) {
        out.push({ sheet, r1: node.parts.row, c1: node.parts.col, r2: node.parts.row, c2: node.parts.col })
      }
      break
    }
    case 'range': {
      const sheet = node.sheet ?? formulaSheet
      if (sheet !== null) {
        out.push({
          sheet,
          r1: Math.min(node.from.row, node.to.row),
          c1: Math.min(node.from.col, node.to.col),
          r2: Math.max(node.from.row, node.to.row),
          c2: Math.max(node.from.col, node.to.col),
        })
      }
      break
    }
    case 'unary':
    case 'percent':
      collectRanges(node.operand, formulaSheet, out)
      break
    case 'binary':
      collectRanges(node.left, formulaSheet, out)
      collectRanges(node.right, formulaSheet, out)
      break
    case 'call':
      for (const arg of node.args) collectRanges(arg, formulaSheet, out)
      break
    default:
      break
  }
  return out
}

/** AST 调试打印（依赖追踪日志/测试用） */
export function astToString(node: AstNode): string {
  switch (node.kind) {
    case 'number':
      return String(node.value)
    case 'string':
      return `'${node.value}'`
    case 'bool':
      return node.value ? 'TRUE' : 'FALSE'
    case 'error':
      return node.code
    case 'ref':
      return `${node.sheet ? `${node.sheet}!` : ''}${formatA1(node.parts.row, node.parts.col, node.parts.absRow, node.parts.absCol)}`
    case 'range':
      return `${node.sheet ? `${node.sheet}!` : ''}${formatA1(node.from.row, node.from.col)}:${formatA1(node.to.row, node.to.col)}`
    case 'unary':
      return `${node.op}${astToString(node.operand)}`
    case 'percent':
      return `${astToString(node.operand)}%`
    case 'binary':
      return `(${astToString(node.left)} ${node.op} ${astToString(node.right)})`
    case 'call':
      return `${node.name.toUpperCase()}(${node.args.map(astToString).join(', ')})`
    case 'ident':
      return node.name
  }
}

export { colToLetters }
