/**
 * @sheetx/formula - 递归下降解析器
 *
 * 任务书 T5 明确要求递归下降/Pratt——不用移栈、不用 eval。
 * 优先级从低到高：比较 → 字符串连接(&) → 加减 → 乘除 → 幂 → 一元正负 → 百分号(后缀) → 原子。
 * 幂运算右结合（Excel 语义：2^3^2 = 2^(3^2) = 512）。
 */

import type { AstNode, BinaryOp, RefParts } from './ast.js'
import { tokenize } from './lexer.js'
import { FormulaSyntaxError } from './lexer.js'
import { lettersToCol } from './refs.js'

/** Excel 最大行号（整列区间的行下界/上界） */
const MAX_ROW = 1_048_575 // 0 基

function isColumnLetters(text: string): boolean {
  return /^\$?[A-Za-z]{1,3}$/.test(text)
}

/** 列字母对 → 整列区间 AST（行覆盖全表） */
function makeColumnRange(sheet: string | null, fromLetters: string, toLetters: string): AstNode {
  const parse = (text: string): RefParts => {
    let rest = text
    const absCol = rest.startsWith('$')
    if (absCol) rest = rest.slice(1)
    return { row: 0, col: lettersToCol(rest), absRow: false, absCol }
  }
  const from = parse(fromLetters)
  const to = parse(toLetters)
  // 归一化列顺序（A:B 与 B:A 等价，Excel 允许反向书写）
  const [c1, c2] = from.col <= to.col ? [from.col, to.col] : [to.col, from.col]
  return {
    kind: 'range',
    sheet,
    from: { row: 0, col: c1, absRow: false, absCol: from.absCol },
    to: { row: MAX_ROW, col: c2, absRow: false, absCol: to.absCol },
  }
}

/** 解析公式文本（不带前导 =）。语法错误抛 FormulaSyntaxError（含位置） */
export function parseFormula(text: string): AstNode {
  const tokens = tokenize(text)
  const parser = new Parser(tokens, text)
  const node = parser.parseExpression()
  parser.expectEnd()
  return node
}

class Parser {
  private pos = 0

  constructor(
    private readonly tokens: ReturnType<typeof tokenize>,
    private readonly source: string,
  ) {}

  // ---- token 工具 ----

  private peek(): (typeof this.tokens)[number] | undefined {
    return this.tokens[this.pos]
  }

  private next(): (typeof this.tokens)[number] | undefined {
    return this.tokens[this.pos++]
  }

  /** 语法入口调用：确认 token 消耗完毕 */
  expectEnd(): void {
    const token = this.peek()
    if (token) {
      throw new FormulaSyntaxError(`多余的输入 "${token.value}"`, token.pos)
    }
  }

  private expectOp(op: string): boolean {
    const token = this.peek()
    if (token && token.type === 'op' && token.value === op) {
      this.pos++
      return true
    }
    return false
  }

  private error(message: string, tokenPos?: number): never {
    const token = this.peek()
    throw new FormulaSyntaxError(message, tokenPos ?? token?.pos ?? this.source.length)
  }

  // ---- 表达式层级（优先级由低到高） ----

  parseExpression(): AstNode {
    return this.parseComparison()
  }

  private parseComparison(): AstNode {
    let left = this.parseConcat()
    for (;;) {
      const token = this.peek()
      if (token && token.type === 'op' && ['=', '<>', '<', '>', '<=', '>='].includes(token.value)) {
        this.pos++
        const right = this.parseConcat()
        left = { kind: 'binary', op: token.value as Extract<BinaryOp, '=' | '<>' | '<' | '>' | '<=' | '>='>, left, right }
      } else {
        return left
      }
    }
  }

  private parseConcat(): AstNode {
    let left = this.parseAdditive()
    while (this.expectOp('&')) {
      const right = this.parseAdditive()
      left = { kind: 'binary', op: '&', left, right }
    }
    return left
  }

  private parseAdditive(): AstNode {
    let left = this.parseMultiplicative()
    for (;;) {
      if (this.expectOp('+')) {
        left = { kind: 'binary', op: '+', left, right: this.parseMultiplicative() }
      } else if (this.expectOp('-')) {
        left = { kind: 'binary', op: '-', left, right: this.parseMultiplicative() }
      } else {
        return left
      }
    }
  }

  private parseMultiplicative(): AstNode {
    let left = this.parsePower()
    for (;;) {
      if (this.expectOp('*')) {
        left = { kind: 'binary', op: '*', left, right: this.parsePower() }
      } else if (this.expectOp('/')) {
        left = { kind: 'binary', op: '/', left, right: this.parsePower() }
      } else {
        return left
      }
    }
  }

  /** 幂：右结合（递归下降天然表达） */
  private parsePower(): AstNode {
    const base = this.parseUnary()
    if (this.expectOp('^')) {
      return { kind: 'binary', op: '^', left: base, right: this.parsePower() }
    }
    return base
  }

  private parseUnary(): AstNode {
    if (this.expectOp('-')) {
      return { kind: 'unary', op: '-', operand: this.parseUnary() }
    }
    if (this.expectOp('+')) {
      return { kind: 'unary', op: '+', operand: this.parseUnary() }
    }
    return this.parsePercent()
  }

  private parsePercent(): AstNode {
    let operand = this.parsePrimary()
    while (this.expectOp('%')) {
      operand = { kind: 'percent', operand }
    }
    return operand
  }

  private parsePrimary(): AstNode {
    const token = this.next()
    if (!token) this.error('表达式意外结束')

    switch (token.type) {
      case 'number':
        return { kind: 'number', value: Number(token.value) }
      case 'string':
        return { kind: 'string', value: token.value }
      case 'error':
        return { kind: 'error', code: token.value }
      case 'ref':
        return this.parseRefTail(token.value, null)
      case 'lparen': {
        const inner = this.parseExpression()
        const close = this.next()
        if (!close || close.type !== 'rparen') this.error('缺少右括号')
        return inner
      }
      case 'ident': {
        // 函数调用：NAME(args)
        const next = this.peek()
        if (next && next.type === 'lparen') {
          this.pos++
          const args = this.parseArguments()
          return { kind: 'call', name: token.value.toUpperCase(), args }
        }
        // TRUE / FALSE 字面量
        const upper = token.value.toUpperCase()
        if (upper === 'TRUE' || upper === 'FALSE') {
          return { kind: 'bool', value: upper === 'TRUE' }
        }
        // Sheet 前缀：Sheet1!A1 / Sheet1!A:A
        if (next && next.type === 'op' && next.value === '!') {
          this.pos++
          const refToken = this.next()
          if (!refToken) this.error('! 后应为单元格引用')
          if (refToken.type === 'ident') {
            // 整列区间：Sheet1!A:A（列字母是合法标识符的子集）
            return this.parseColumnRangeTail(token.value, refToken.value)
          }
          if (refToken.type !== 'ref') this.error('! 后应为单元格引用')
          return this.parseRefTail(refToken.value, token.value)
        }
        // 整列区间：A:A（列字母组成的裸标识符 + 冒号 + 列字母）
        if (next && next.type === 'op' && next.value === ':' && isColumnLetters(token.value)) {
          this.pos++
          const toToken = this.next()
          if (!toToken || toToken.type !== 'ident' || !isColumnLetters(toToken.value)) {
            this.error(': 后应为列字母')
          }
          return makeColumnRange(null, token.value, toToken.value)
        }
        // 裸标识符 → #NAME?（求值时）
        return { kind: 'ident', name: token.value }
      }
      default:
        this.error(`意外的 token "${token.value}"`, token.pos)
    }
  }

  /** 引用 token 之后可能跟着 :range —— 解析为 range 或单引用 */
  private parseRefTail(refText: string, sheet: string | null): AstNode {
    const from = this.refTextToParts(refText)
    const next = this.peek()
    if (next && next.type === 'op' && next.value === ':') {
      this.pos++
      const toToken = this.next()
      if (!toToken || toToken.type !== 'ref') this.error(': 后应为单元格引用')
      const to = this.refTextToParts(toToken.value)
      return { kind: 'range', sheet, from, to }
    }
    return { kind: 'ref', sheet, parts: from }
  }

  /** Sheet!A:A 形式的整列区间尾解析 */
  private parseColumnRangeTail(sheet: string, fromLetters: string): AstNode {
    const colon = this.peek()
    if (colon && colon.type === 'op' && colon.value === ':') {
      this.pos++
      const toToken = this.next()
      if (!toToken || toToken.type !== 'ident' || !isColumnLetters(toToken.value)) {
        this.error(': 后应为列字母')
      }
      return makeColumnRange(sheet, fromLetters, toToken.value)
    }
    this.error('跨表引用后应为单元格引用')
  }

  private refTextToParts(text: string): RefParts {
    // 词法保证格式正确；此处拆解 $/字母/数字
    let rest = text
    let absCol = false
    let absRow = false
    if (rest.startsWith('$')) {
      absCol = true
      rest = rest.slice(1)
    }
    const lettersEnd = /[A-Za-z]{1,3}/.exec(rest)
    if (!lettersEnd) this.error(`非法引用 "${text}"`)
    const col = lettersToCol(lettersEnd[0]!)
    rest = rest.slice(lettersEnd[0].length)
    if (rest.startsWith('$')) {
      absRow = true
      rest = rest.slice(1)
    }
    const row = Number(rest) - 1
    if (!Number.isFinite(row) || row < 0 || col < 0) this.error(`非法引用 "${text}"`)
    return { row, col, absRow, absCol }
  }

  private parseArguments(): AstNode[] {
    const args: AstNode[] = []
    const token = this.peek()
    if (token && token.type === 'rparen') {
      this.pos++
      return args
    }
    for (;;) {
      args.push(this.parseExpression())
      const next = this.next()
      if (!next) this.error('函数参数列表未闭合')
      if (next.type === 'rparen') return args
      if (next.type !== 'comma') this.error('函数参数应以 , 或 ) 分隔')
    }
  }
}
