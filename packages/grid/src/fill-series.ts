/**
 * @sheetx/grid - 填充柄序列推导（E5）
 *
 * 之前是重复平铺；本模块补齐任务书要求的序列语义：
 * - 数字等差（步长 = 相邻差，A1=1,A2=3 下拉 → 5,7,9）；
 * - 日期序列：日（±1 天）/周（±7 天）/月（同日递增，**月末钳制**：01-31 下拉 → 02-28）/年；
 * - 中文循环序列：周一~周日、星期一~星期日、一月~十二月、一~十（简繁常用形）；
 * - 其余（文本/布尔/公式格）保持重复平铺（Excel 对纯文本的默认行为）。
 *
 * 算法思想参考 FortuneSheet dropCell 的分类推导（只借鉴思路，实现自研）。
 * 约定：source 必须已按「朝填充方向」排序（下拉=自上而下），返回值按同方向续接。
 */

import { serialToDate, dateToSerial } from '@sheetx/formula'
import type { CellValueLike } from '@sheetx/formula'

/** 中文循环序列表（按 Excel 填充习惯） */
const CYCLE_TABLES: string[][] = [
  ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
  ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'],
  ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
  ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '腊月'],
  ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'],
]

/**
 * 从源序列推导后续填充值。
 * @param source 朝填充方向排序的源值（至少 1 个）
 * @param count 需要推导的个数
 */
export function deriveFillSeries(source: ReadonlyArray<CellValueLike>, count: number): CellValueLike[] {
  if (count <= 0) return []
  const values = source.filter((value) => value !== null && value !== undefined && value !== '')
  if (values.length === 0) return Array.from({ length: count }, () => null)
  // 单值源的复制守卫移到分类之后（中文循环表的单值要续接序列而不是复制）

  // 分类顺序（关键）：
  // 1. **日期候选优先于纯数字**——Excel 序号日期本质是 number，若数字分支先行，
  //    日期序列（01-31 → 02-28）会被等差推导截获（步长 28 天）。日期候选 = ISO
  //    字符串或落在序号区间（≈1954 年后）的整数；单值日期退回复制（无方向语义）。
  // 2. 中文循环表（单值也命中，默认步长 +1）优先于单值复制——单个「周一」下拉 → 周二…
  // 3. 其余单值 → 复制；多值数字 → 等差；其余 → 平铺。
  const dateSerials = tryParseAllDates(values)
  if (dateSerials && dateSerials.length >= 2) {
    return deriveDates(dateSerials, count, typeof values[0] === 'string')
  }
  const cyclic = tryMatchCycle(values)
  if (cyclic) return deriveCycle(cyclic.table, cyclic.positions, count)
  if (values.length === 1) return Array.from({ length: count }, () => values[0]!)
  if (values.every((value) => typeof value === 'number')) {
    return deriveNumeric(values as number[], count)
  }
  return Array.from({ length: count }, (_, index) => values[index % values.length]!)
}

// ---------------------------------------------------------------------------
// 数字等差
// ---------------------------------------------------------------------------

function deriveNumeric(source: number[], count: number): CellValueLike[] {
  const step = source[source.length - 1]! - source[source.length - 2]!
  const out: CellValueLike[] = []
  let current = source[source.length - 1]!
  for (let i = 0; i < count; i++) {
    current += step
    out.push(current)
  }
  return out
}

// ---------------------------------------------------------------------------
// 日期序列（Excel 序号制；源可以是序号或 ISO 字符串）
// ---------------------------------------------------------------------------

/** 全部可解析为日期时返回序号数组，否则 null */
function tryParseAllDates(values: ReadonlyArray<CellValueLike>): number[] | null {
  const serials: number[] = []
  for (const value of values) {
    const serial = parseDateLike(value)
    if (serial === null) return null
    serials.push(serial)
  }
  return serials
}

function parseDateLike(value: CellValueLike): number | null {
  if (typeof value === 'number') {
    // 序号日期启发式：整数且 ≥ 20000（≈1954-07 之后）。小于该值的数字按普通数字
    // 走等差——否则 [1,3] 这类计数序列会被误判成日期。
    return value >= 20000 && value < 3000000 && Number.isInteger(value) ? value : null
  }
  if (typeof value === 'string') {
    const match = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(value.trim())
    if (!match) return null
    return dateToSerial(new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))))
  }
  return null
}

function deriveDates(serials: number[], count: number, returnIso: boolean): CellValueLike[] {
  const diff = serials[serials.length - 1]! - serials[serials.length - 2]!
  const out: CellValueLike[] = []
  // 月序列：相邻日期「月递增」（日相同或经月末钳制）→ 逐月推进 + 月末钳制。
  // 锚定日取**首格**——01-31 → 02-28（钳制值）→ 03-31（Excel 语义：不能用钳制后的
  // 28 当锚，否则后续月份全变 28 号）。
  if (isMonthSeries(serials)) {
    const anchorDay = serialToDate(serials[0]!).getUTCDate()
    let cursor = serialToDate(serials[serials.length - 1]!)
    for (let i = 0; i < count; i++) {
      cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1))
      const daysInMonth = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 0)).getUTCDate()
      cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), Math.min(anchorDay, daysInMonth)))
      out.push(formatOut(dateToSerial(cursor), returnIso))
    }
    return out
  }
  // 日序列（±1 天）/ 周序列（±7 天）/ 其他固定差值
  for (let i = 0; i < count; i++) {
    out.push(formatOut(serials[serials.length - 1]! + diff * (i + 1), returnIso))
  }
  return out
}

/** 相邻日期是否构成「月递增」序列（允许月末钳制：31→28 视为同日推进） */
function isMonthSeries(serials: number[]): boolean {
  if (serials.length < 2) return false
  const anchorDay = serialToDate(serials[0]!).getUTCDate()
  let prevMonth = serialToDate(serials[0]!).getUTCMonth()
  let prevYear = serialToDate(serials[0]!).getUTCFullYear()
  for (let i = 1; i < serials.length; i++) {
    const curr = serialToDate(serials[i]!)
    const monthDiff = (curr.getUTCFullYear() - prevYear) * 12 + (curr.getUTCMonth() - prevMonth)
    if (monthDiff !== 1) return false
    // 当前月有效日 = min(锚定日, 当月天数)——与钳制后的实际日期比对
    const daysInMonth = new Date(Date.UTC(curr.getUTCFullYear(), curr.getUTCMonth() + 1, 0)).getUTCDate()
    if (curr.getUTCDate() !== Math.min(anchorDay, daysInMonth)) return false
    prevMonth = curr.getUTCMonth()
    prevYear = curr.getUTCFullYear()
  }
  return true
}

function formatOut(serial: number, iso: boolean): CellValueLike {
  if (!iso) return serial
  const date = serialToDate(serial)
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}

// ---------------------------------------------------------------------------
// 中文循环序列
// ---------------------------------------------------------------------------

function tryMatchCycle(values: ReadonlyArray<CellValueLike>): { table: string[]; positions: number[] } | null {
  if (!values.every((value) => typeof value === 'string')) return null
  for (const table of CYCLE_TABLES) {
    const positions: number[] = []
    for (const value of values as string[]) {
      const position = table.indexOf(value)
      if (position < 0) {
        // 该表未完全命中
        positions.length = 0
        break
      }
      positions.push(position)
    }
    // 单值也命中（Excel：单个「周一」下拉 → 周二、周三…，默认步长 +1）
    if (positions.length === values.length && positions.length >= 1) {
      return { table, positions }
    }
  }
  return null
}

function deriveCycle(table: string[], positions: number[], count: number): CellValueLike[] {
  // 单值源默认步长 +1（Excel 语义）；多值取相邻差
  const step = positions.length >= 2 ? positions[positions.length - 1]! - positions[positions.length - 2]! : 1
  const out: CellValueLike[] = []
  let cursor = positions[positions.length - 1]!
  for (let i = 0; i < count; i++) {
    cursor += step
    // 循环取模（负步长也正确：双取模防负下标）
    const normalized = ((cursor % table.length) + table.length) % table.length
    out.push(table[normalized]!)
  }
  return out
}

/**
 * 判断填充方向并把源序列排成「朝填充方向」。
 * @returns null 表示方向无法确定（拖动量不足）
 */
export function orderSourceToward(
  sourceCells: CellValueLike[],
  from: { start: number; end: number },
  to: number,
): { source: CellValueLike[]; sign: 1 | -1 } | null {
  if (to > from.end) return { source: sourceCells, sign: 1 } // 向下/右拖：正序续接
  if (to < from.start) return { source: [...sourceCells].reverse(), sign: -1 } // 向上/左拖：逆序续接
  return null
}
