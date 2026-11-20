/**
 * @sheetx/core - 条件格式契约与纯逻辑求值（零依赖）
 *
 * 正式方案 M4「高级能力」之一，ERP 高频：阈值标红、数据条、色阶。
 * 规则是纯数据（可 JSON 序列化），求值只消费单元格值与坐标——
 * 因此 core 不依赖公式/网格/渲染，grid 与 spreadsheet 可共用。
 *
 * 冲突优先级：按规则数组顺序，第一条命中的规则生效（与 Excel 管理器的自上而下一致）。
 */
import type { CellRange, CellValue } from './types.js'

export interface ConditionalStyle {
  /** 背景色（CSS 颜色字符串） */
  background?: string
  /** 文字色 */
  color?: string
  bold?: boolean
}

/** 条件格式规则（判别联合；id 由宿主分配，删除/更新按 id） */
export type ConditionalRule =
  | {
      id: string
      type: 'cellIs'
      range: CellRange
      operator: '>' | '>=' | '<' | '<=' | '=' | '<>'
      value: CellValue | number | string
      style: ConditionalStyle
    }
  | { id: string; type: 'containsText'; range: CellRange; text: string; style: ConditionalStyle }
  /** 数据条：min/max 省略时取该规则覆盖区域的数值上下界（由宿主计算后传入 ctx） */
  | { id: string; type: 'dataBar'; range: CellRange; min?: number; max?: number; color: string }
  /** 三色/双色阶：min/max 为数值区间端点 */
  | {
      id: string
      type: 'colorScale'
      range: CellRange
      min: number
      max: number
      minColor: string
      maxColor: string
      midColor?: string
    }

/** 求值结果：样式覆盖 + 可视化比例（数据条/色阶由渲染层消费） */
export interface ConditionalFormatResult {
  background?: string
  color?: string
  bold?: boolean
  /** 数据条长度比例 0..1 */
  dataBarRatio?: number
  dataBarColor?: string
  /** 色阶插值后的颜色 */
  scaleColor?: string
}

/** 单元格是否落在规则区域内 */
export function isCellInRange(row: number, col: number, range: CellRange): boolean {
  return (
    row >= Math.min(range.start.row, range.end.row) &&
    row <= Math.max(range.start.row, range.end.row) &&
    col >= Math.min(range.start.col, range.end.col) &&
    col <= Math.max(range.start.col, range.end.col)
  )
}

function numeric(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

type ComparisonOperator = '>' | '>=' | '<' | '<=' | '=' | '<>'

function compare(left: unknown, right: unknown, operator: ComparisonOperator): boolean {
  const a = numeric(left)
  const b = numeric(right)
  // 只要两边都能转数值就按数值比较（"10" > "9" 而非字符串序）
  const numericCompare = a !== null && b !== null
  const l = numericCompare ? (a as number) : String(left ?? '').toLowerCase()
  const r = numericCompare ? (b as number) : String(right ?? '').toLowerCase()
  switch (operator) {
    case '>': return l > r
    case '>=': return l >= r
    case '<': return l < r
    case '<=': return l <= r
    case '=': return l === r
    case '<>': return l !== r
    default: return false
  }
}

function parseHex(color: string): [number, number, number] | null {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim())
  if (!match) return null
  let hex = match[1]!
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('')
  return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)]
}

function toHex(rgb: [number, number, number]): string {
  return `#${rgb.map((n) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0')).join('')}`
}

/** 两色线性插值（仅接受 #rgb / #rrggbb；其它颜色原样返回末色） */
export function lerpColor(from: string, to: string, ratio: number): string {
  const a = parseHex(from)
  const b = parseHex(to)
  if (!a || !b) return to
  const t = Math.max(0, Math.min(1, ratio))
  return toHex([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t])
}

/**
 * 对某格求值条件格式。
 * @param bounds 数据条/色阶的实际数据上下界（由宿主按规则区域预先算好）
 */
export function evaluateConditionalFormat(
  value: CellValue | null | undefined,
  row: number,
  col: number,
  rules: ReadonlyArray<ConditionalRule>,
  bounds?: { min?: number; max?: number },
): ConditionalFormatResult | null {
  for (const rule of rules) {
    if (!isCellInRange(row, col, rule.range)) continue
    switch (rule.type) {
      case 'cellIs':
        if (compare(value, rule.value, rule.operator)) return { ...rule.style }
        break
      case 'containsText':
        if (String(value ?? '').toLowerCase().includes(rule.text.toLowerCase())) return { ...rule.style }
        break
      case 'dataBar': {
        const current = numeric(value)
        if (current === null) break
        const min = rule.min ?? bounds?.min ?? 0
        const max = rule.max ?? bounds?.max ?? min
        const span = max - min
        return {
          dataBarRatio: span > 0 ? Math.max(0, Math.min(1, (current - min) / span)) : 1,
          dataBarColor: rule.color,
        }
      }
      case 'colorScale': {
        const current = numeric(value)
        if (current === null) break
        const span = rule.max - rule.min
        const ratio = span > 0 ? Math.max(0, Math.min(1, (current - rule.min) / span)) : 0.5
        return {
          scaleColor:
            rule.midColor && ratio <= 0.5
              ? lerpColor(rule.minColor, rule.midColor, ratio * 2)
              : rule.midColor
                ? lerpColor(rule.midColor, rule.maxColor, (ratio - 0.5) * 2)
                : lerpColor(rule.minColor, rule.maxColor, ratio),
        }
      }
    }
  }
  return null
}
