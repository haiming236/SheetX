/**
 * @sheetx/spreadsheet - 数字/日期格式化
 *
 * v1 支持的 numFmt 模式（覆盖 ERP/财务最高频场景）：
 *   General（默认）、0.00 / 0.000…（定点）、#,##0（千分位）、#,##0.00、
 *   0% / 0.00%（百分比）、¥#,##0.00（货币）、
 *   yyyy-mm-dd / yyyy/mm/dd / mm-dd / hh:mm（Excel 日期序列）
 * 未识别的模式按 General 输出——宁可显示原值，不显示乱码。
 */

import { serialToDate } from '@sheetx/formula'
import type { CellValueLike } from '@sheetx/formula'

/** 按格式串格式化单元格值 */
export function formatValue(value: CellValueLike, fmt: string | undefined): string {
  if (value === null || value === undefined || value === '') return ''
  if (fmt === undefined || fmt === '' || fmt === 'General') return defaultFormat(value)
  const pattern = fmt.trim()

  // 日期类模式（含日期/时间关键字）
  if (/[yYmMdDhHsS]/.test(pattern) && /^(y|Y|m|M|d|D|h|H|s|S|"[^"]*"|\/|\-|:| )+$/.test(pattern.replace(/yyyy|yy|mm|m|dd|d|hh|h|ss|s/g, '"$&"'))) {
    return formatDate(value, pattern)
  }
  // 百分比
  if (pattern.endsWith('%')) {
    const num = toNumberOrNull(value)
    if (num === null) return String(value)
    const decimals = pattern.includes('.') ? pattern.split('.')[1]!.replace(/[^0]/g, '').length : 0
    return `${(num * 100).toFixed(decimals)}%`
  }
  // 货币/千分位（含 #,##0 结构）
  if (pattern.includes('#,##')) {
    const num = toNumberOrNull(value)
    if (num === null) return String(value)
    const decimals = pattern.includes('.') ? pattern.split('.')[1]!.replace(/[^0]/g, '').length : 0
    const formatted = formatThousand(num, decimals)
    const prefix = pattern.slice(0, pattern.indexOf('#')).trim()
    return `${prefix}${formatted}`
  }
  // 定点小数（0.00 / 0）
  if (/^0+$/.test(pattern) || /^0\.0+$/.test(pattern)) {
    const num = toNumberOrNull(value)
    if (num === null) return String(value)
    const decimals = pattern.includes('.') ? pattern.split('.')[1]!.length : 0
    return num.toFixed(decimals)
  }
  return defaultFormat(value)
}

function defaultFormat(value: CellValueLike): string {
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE'
  return String(value)
}

function toNumberOrNull(value: CellValueLike): number | null {
  if (typeof value === 'number') return Number.isNaN(value) ? null : value
  if (typeof value === 'boolean') return value ? 1 : 0
  if (typeof value === 'string') {
    const num = Number(value.replaceAll(',', ''))
    return Number.isNaN(num) ? null : num
  }
  return null
}

/** 千分位 + 定点 */
function formatThousand(value: number, decimals: number): string {
  const fixed = Math.abs(value).toFixed(decimals)
  const [intPart, decimalPart] = fixed.split('.')
  const withComma = intPart!.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const sign = value < 0 ? '-' : ''
  return decimalPart !== undefined ? `${sign}${withComma}.${decimalPart}` : `${sign}${withComma}`
}

/** Excel 日期序列 / ISO 字符串 → 按模式格式化 */
function formatDate(value: CellValueLike, pattern: string): string {
  let date: Date | null = null
  if (typeof value === 'number') date = serialToDate(value)
  else if (typeof value === 'string') {
    const parsed = new Date(value)
    date = Number.isNaN(parsed.getTime()) ? null : parsed
  }
  if (!date) return String(value)
  const tokens: Array<[RegExp, (d: Date) => string]> = [
    [/yyyy/g, (d) => String(d.getUTCFullYear()).padStart(4, '0')],
    [/yy/g, (d) => String(d.getUTCFullYear()).slice(-2)],
    [/mm/g, (d) => String(d.getUTCMonth() + 1).padStart(2, '0')],
    [/dd/g, (d) => String(d.getUTCDate()).padStart(2, '0')],
    [/hh/g, (d) => String(d.getUTCHours()).padStart(2, '0')],
    [/ss/g, (d) => String(d.getUTCSeconds()).padStart(2, '0')],
  ]
  let out = pattern
  for (const [regex, fn] of tokens) out = out.replace(regex, fn(date))
  // 单字符 m/d/h（Excel 语法）——在双字符替换后处理
  out = out
    .replace(/m/g, String(date.getUTCMonth() + 1))
    .replace(/d/g, String(date.getUTCDate()))
    .replace(/h/g, String(date.getUTCHours()))
    .replace(/s/g, String(date.getUTCSeconds()))
  return out
}

/** 内置格式化器名（ColumnDef.formatter 可引用） */
export const builtinFormatters = {
  general: (value: unknown) => String(value ?? ''),
  number: (value: unknown) => (typeof value === 'number' ? String(value) : String(value ?? '')),
  thousand: (value: unknown) => {
    const num = toNumberOrNull(value as CellValueLike)
    return num === null ? String(value ?? '') : formatThousand(num, 0)
  },
  currency: (value: unknown) => {
    const num = toNumberOrNull(value as CellValueLike)
    return num === null ? String(value ?? '') : `¥${formatThousand(num, 2)}`
  },
  percent: (value: unknown) => {
    const num = toNumberOrNull(value as CellValueLike)
    return num === null ? String(value ?? '') : `${(num * 100).toFixed(0)}%`
  },
  date: (value: unknown) => {
    const num = toNumberOrNull(value as CellValueLike)
    if (num === null) return String(value ?? '')
    const date = serialToDate(num)
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
  },
}
