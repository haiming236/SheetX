/**
 * @sheetx/formula - 词法分析器
 *
 * 把公式文本切成 token 流。设计决策（对照研究报告 §10）：
 * - 用简单手写扫描器而不是 Univer 的移栈构造器——Univer 源码注释自认
 *   "over complex, need to refactor"，SheetX 不重复这个坑；
 * - 引用记法（$A$1 / Sheet1!A1:B2）的语法级解析交给 Parser（词法层只产出
 *   原子 token），保持两层职责清晰。
 */

export type TokenType = 'number' | 'string' | 'ident' | 'ref' | 'op' | 'lparen' | 'rparen' | 'comma' | 'error'

export interface Token {
  type: TokenType
  value: string
  /** 在公式串中的起始位置（错误定位用） */
  pos: number
}

/** Excel 错误字面量（#DIV/0! 等） */
const ERROR_PATTERN = /#(DIV\/0!|NAME\?|N\/A|NULL!|NUM!|REF!|VALUE!|SPILL!|CALC!)/y
/** 引用记法：$?列字母(1-3位)$?行号 */
const REF_PATTERN = /\$?[A-Za-z]{1,3}\$?\d{1,7}/y
/** 标识符：函数名/TRUE/FALSE/中文工作表名（\p{L} 覆盖 CJK） */
const IDENT_PATTERN = /[A-Za-z_\p{L}][\w.\p{L}]*/uy
const NUMBER_PATTERN = /\d+(\.\d+)?([eE][+-]?\d+)?/y

export class FormulaSyntaxError extends Error {
  constructor(message: string, readonly position: number) {
    super(message)
  }
}

export function tokenize(input: string): Token[] {
  const tokens: Token[] = []
  let pos = 0

  const matchAt = (pattern: RegExp): string | null => {
    pattern.lastIndex = pos
    const match = pattern.exec(input)
    return match ? match[0] : null
  }

  while (pos < input.length) {
    const char = input[pos]!
    // 空白跳过
    if (char === ' ' || char === '\t' || char === '\r' || char === '\n') {
      pos++
      continue
    }
    // 字符串字面量：支持双引号（Excel 标准）与单引号；引号内成对的引号转义
    if (char === '"' || char === "'") {
      const quote = char
      let value = ''
      let cursor = pos + 1
      let closed = false
      while (cursor < input.length) {
        const c = input[cursor]!
        if (c === quote) {
          if (input[cursor + 1] === quote) {
            value += quote
            cursor += 2
            continue
          }
          closed = true
          cursor++
          break
        }
        value += c
        cursor++
      }
      if (!closed) throw new FormulaSyntaxError('字符串未闭合', pos)
      tokens.push({ type: 'string', value, pos })
      pos = cursor
      continue
    }
    // 错误字面量
    const errorMatch = matchAt(ERROR_PATTERN)
    if (errorMatch) {
      tokens.push({ type: 'error', value: errorMatch, pos })
      pos += errorMatch.length
      continue
    }
    // 引用（在标识符之前判定：A1 是引用，SUM 是标识符）
    const refMatch = matchAt(REF_PATTERN)
    if (refMatch && !/[A-Za-z0-9_\p{L}]/u.test(input[pos + refMatch.length] ?? '')) {
      tokens.push({ type: 'ref', value: refMatch, pos })
      pos += refMatch.length
      continue
    }
    // 数字
    const numberMatch = matchAt(NUMBER_PATTERN)
    if (numberMatch) {
      tokens.push({ type: 'number', value: numberMatch, pos })
      pos += numberMatch.length
      continue
    }
    // 标识符
    const identMatch = matchAt(IDENT_PATTERN)
    if (identMatch) {
      tokens.push({ type: 'ident', value: identMatch, pos })
      pos += identMatch.length
      continue
    }
    // 括号/逗号
    if (char === '(') {
      tokens.push({ type: 'lparen', value: '(', pos })
      pos++
      continue
    }
    if (char === ')') {
      tokens.push({ type: 'rparen', value: ')', pos })
      pos++
      continue
    }
    if (char === ',') {
      tokens.push({ type: 'comma', value: ',', pos })
      pos++
      continue
    }
    // 运算符（先双字符后单字符）
    const two = input.slice(pos, pos + 2)
    if (two === '<=' || two === '>=' || two === '<>') {
      tokens.push({ type: 'op', value: two, pos })
      pos += 2
      continue
    }
    if ('+-*/^&=<>%!:'.includes(char)) {
      tokens.push({ type: 'op', value: char, pos })
      pos++
      continue
    }
    throw new FormulaSyntaxError(`非法字符 "${char}"`, pos)
  }
  return tokens
}
