/**
 * @sheetx/formula - A1 引用记法工具
 *
 * 行列均为 0 基（引擎内部约定），A1 记法是 1 基显示层。
 * '$' 前缀表示绝对引用（填充/平移时不改变）。
 */

export interface ParsedRef {
  row: number
  col: number
  absRow: boolean
  absCol: boolean
}

/** 0 基列号 → 列字母（0→A, 25→Z, 26→AA） */
export function colToLetters(col: number): string {
  let letters = ''
  let n = col
  while (n >= 0) {
    letters = String.fromCharCode(65 + (n % 26)) + letters
    n = Math.floor(n / 26) - 1
  }
  return letters
}

/** 列字母 → 0 基列号（A→0, Z→25, AA→26） */
export function lettersToCol(letters: string): number {
  let col = 0
  for (const char of letters.toUpperCase()) {
    col = col * 26 + (char.charCodeAt(0) - 64)
  }
  return col - 1
}

/** 0 基行列 → A1 文本（含 $ 绝对标记） */
export function formatA1(row: number, col: number, absRow = false, absCol = false): string {
  return `${absCol ? '$' : ''}${colToLetters(col)}${absRow ? '$' : ''}${row + 1}`
}

/** 单个引用文本 → 解析结果；非法返回 null */
export function parseRefText(text: string): ParsedRef | null {
  const match = /^\$?([A-Za-z]{1,3})\$?(\d{1,7})$/.exec(text)
  if (!match) return null
  return {
    col: lettersToCol(match[1]!),
    row: Number(match[2]) - 1,
    absCol: text.startsWith('$'),
    absRow: text.lastIndexOf('$') > 0,
  }
}

/** 引用是否匹配某个单元格（range 语义用） */
export function refContains(
  range: { r1: number; c1: number; r2: number; c2: number },
  row: number,
  col: number,
): boolean {
  return row >= range.r1 && row <= range.r2 && col >= range.c1 && col <= range.c2
}
