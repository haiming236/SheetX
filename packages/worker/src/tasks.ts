/** 可并行执行的纯计算任务（主线程与 Worker 共用同一套语义） */
import type { UnknownRecord } from '@sheetx/core'

export interface SortPayload {
  rows: ReadonlyArray<UnknownRecord>
  field: string
  dir?: 'asc' | 'desc'
}

export interface FilterCondition {
  field: string
  op: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains'
  value: unknown
}

export interface FilterPayload {
  rows: ReadonlyArray<UnknownRecord>
  conditions: ReadonlyArray<FilterCondition>
}

export interface AggregatePayload {
  rows: ReadonlyArray<UnknownRecord>
  field?: string
  op: 'sum' | 'avg' | 'min' | 'max' | 'count'
}

export type TaskPayload = SortPayload | FilterPayload | AggregatePayload

function compareValues(a: unknown, b: unknown): number {
  if (Object.is(a, b)) return 0
  if (a === null || a === undefined || a === '') return 1
  if (b === null || b === undefined || b === '') return -1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), 'zh-CN', { numeric: true })
}

function comparable(value: unknown): number | string {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value)
  return String(value ?? '')
}

export function sortRows(payload: SortPayload): UnknownRecord[] {
  const dir = payload.dir ?? 'asc'
  return [...payload.rows].sort((a, b) => {
    const left = a[payload.field]
    const right = b[payload.field]
    const leftEmpty = left === null || left === undefined || left === ''
    const rightEmpty = right === null || right === undefined || right === ''
    // 空值恒后：desc 只反转有效值的比较，不反转空值位置
    if (leftEmpty && rightEmpty) return 0
    if (leftEmpty) return 1
    if (rightEmpty) return -1
    const delta = compareValues(left, right)
    return dir === 'desc' ? -delta : delta
  })
}

export function filterRows(payload: FilterPayload): UnknownRecord[] {
  return payload.rows.filter((row) => payload.conditions.every((condition) => {
    const left = comparable(row[condition.field])
    const right = comparable(condition.value)
    switch (condition.op) {
      case 'eq': return left === right
      case 'ne': return left !== right
      case 'gt': return left > right
      case 'gte': return left >= right
      case 'lt': return left < right
      case 'lte': return left <= right
      case 'contains': return String(left).includes(String(right))
      default: return false
    }
  }))
}

export function aggregateRows(payload: AggregatePayload): number {
  const { rows, op } = payload
  if (op === 'count') return rows.length
  if (!payload.field) return 0
  const values = rows
    .map((row) => row[payload.field!])
    .filter((value): value is number | string => typeof value === 'number' || (typeof value === 'string' && value.trim() !== ''))
    .map(Number)
    .filter(Number.isFinite)
  if (values.length === 0) return 0
  switch (op) {
    case 'sum': return values.reduce((sum, value) => sum + value, 0)
    case 'avg': return values.reduce((sum, value) => sum + value, 0) / values.length
    case 'min': return Math.min(...values)
    case 'max': return Math.max(...values)
    default: return 0
  }
}

export function runTask(task: 'sort' | 'filter' | 'aggregate', payload: unknown): unknown {
  if (task === 'sort') return sortRows(payload as SortPayload)
  if (task === 'filter') return filterRows(payload as FilterPayload)
  if (task === 'aggregate') return aggregateRows(payload as AggregatePayload)
  throw new Error(`[SheetX] 未知计算任务: ${task}`)
}
