/**
 * @sheetx/data-adapter - 多维筛选条件组合（高级查询）
 *
 * 现有 FilterCriterion 只能平铺 AND；本模块补：
 * - 条件组（AND/OR）+ 任意层级嵌套；
 * - 跨字段比较（valueFrom: 用另一字段的值作为比较对象，而非常量）；
 * - 方案序列化/反序列化（保存筛选方案、快速切换视图）；
 * - 求值结果带统计（命中行数/各条件组贡献），支持 UI 实时预览。
 *
 * 零依赖、纯逻辑：不知道数据来源，宿主可把它用于内存数据或远程查询翻译。
 */

import type { RowData } from '@sheetx/core'
import { queryUtils } from './index.js'

export type LogicOperator = 'and' | 'or'

export type AdvancedOperator =
  | 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte'
  | 'contains' | 'notContains' | 'startsWith' | 'endsWith'
  | 'in' | 'notIn' | 'empty' | 'notEmpty'
  | 'between'

/** 单条筛选条件 */
export interface FilterCondition {
  id: string
  field: string
  op: AdvancedOperator
  /** 常量值；valueField 存在时忽略 */
  value?: unknown
  /** 跨字段比较：取该字段的值作为比较对象 */
  valueField?: string
  /** between 的第二个边界 */
  value2?: unknown
  enabled?: boolean
}

/** 条件组（可嵌套） */
export interface FilterGroup {
  id: string
  logic: LogicOperator
  conditions: FilterCondition[]
  groups?: FilterGroup[]
  /** UI 展示名，如「条件组 1（满足以下所有条件）」 */
  label?: string
}

export interface SavedFilter {
  id: string
  name: string
  group: FilterGroup
  createdAt: string
}

export interface FilterEvalResult {
  matched: number
  total: number
  /** 每条条件命中的次数（用于 UI 显示条件贡献度） */
  conditionHits: Record<string, number>
  /** 命中行 id（最多保留 maxMatchedIds 条，避免大结果集占内存） */
  matchedIds: string[]
}

function resolveValue(row: RowData, condition: FilterCondition): unknown {
  if (condition.valueField) return row.data[condition.valueField]
  return condition.value
}

function matchesCondition(row: RowData, condition: FilterCondition): boolean {
  const actual = row.data[condition.field]
  const expected = resolveValue(row, condition)
  switch (condition.op) {
    case 'eq': return queryUtils.applyOp(actual, 'eq', expected)
    case 'ne': return queryUtils.applyOp(actual, 'ne', expected)
    case 'gt': return queryUtils.applyOp(actual, 'gt', expected)
    case 'gte': return queryUtils.applyOp(actual, 'gte', expected)
    case 'lt': return queryUtils.applyOp(actual, 'lt', expected)
    case 'lte': return queryUtils.applyOp(actual, 'lte', expected)
    case 'contains': return String(actual ?? '').includes(String(expected ?? ''))
    case 'notContains': return !String(actual ?? '').includes(String(expected ?? ''))
    case 'startsWith': return String(actual ?? '').startsWith(String(expected ?? ''))
    case 'endsWith': return String(actual ?? '').endsWith(String(expected ?? ''))
    case 'in': return Array.isArray(expected) && expected.includes(actual)
    case 'notIn': return Array.isArray(expected) && !expected.includes(actual)
    case 'empty': return actual === null || actual === undefined || actual === ''
    case 'notEmpty': return !(actual === null || actual === undefined || actual === '')
    case 'between': {
      const num = Number(actual)
      const low = Number(expected)
      const high = Number(condition.value2)
      return Number.isFinite(num) && Number.isFinite(low) && Number.isFinite(high) && num >= low && num <= high
    }
    default: return false
  }
}

/** 求值单条条件，返回是否命中（禁用条件恒不参与） */
export function evaluateCondition(row: RowData, condition: FilterCondition): boolean {
  if (condition.enabled === false) return false
  return matchesCondition(row, condition)
}

/**
 * 求值条件组（递归）。空组视为「不过滤」（true），这符合 Excel 筛选面板的直觉。
 */
export function evaluateGroup(row: RowData, group: FilterGroup): boolean {
  const checks: boolean[] = []
  for (const condition of group.conditions) {
    if (condition.enabled === false) continue
    checks.push(matchesCondition(row, condition))
  }
  for (const child of group.groups ?? []) checks.push(evaluateGroup(row, child))
  if (checks.length === 0) return true
  return group.logic === 'and' ? checks.every(Boolean) : checks.some(Boolean)
}

/** 对数据集求值，返回命中统计与 id 列表 */
export function evaluateFilter(
  rows: ReadonlyArray<RowData>,
  group: FilterGroup,
  options: { maxMatchedIds?: number } = {},
): FilterEvalResult {
  const conditionHits: Record<string, number> = {}
  const matchedIds: string[] = []
  const maxMatchedIds = options.maxMatchedIds ?? 500
  let matched = 0

  for (const row of rows) {
    const hit = evaluateGroup(row, group)
    if (hit) {
      matched++
      if (matchedIds.length < maxMatchedIds) matchedIds.push(row.id)
    }
    for (const condition of group.conditions) {
      if (condition.enabled === false) continue
      if (matchesCondition(row, condition)) {
        conditionHits[condition.id] = (conditionHits[condition.id] ?? 0) + 1
      }
    }
  }
  return { matched, total: rows.length, conditionHits, matchedIds }
}

/** 收集组里所有条件 id（UI 初始化命中计数用） */
export function conditionIds(group: FilterGroup): string[] {
  const ids = group.conditions.filter((condition) => condition.enabled !== false).map((condition) => condition.id)
  for (const child of group.groups ?? []) ids.push(...conditionIds(child))
  return ids
}

/** 序列化筛选方案（仅保存数据，不保存行数据） */
export function serializeFilters(filters: ReadonlyArray<SavedFilter>): string {
  return JSON.stringify(filters)
}

/** 反序列化，结构非法时返回 null（不破坏现有方案） */
export function deserializeFilters(json: string): SavedFilter[] | null {
  try {
    const parsed: unknown = JSON.parse(json)
    if (!Array.isArray(parsed)) return null
    const valid = parsed.every((item) =>
      item !== null && typeof item === 'object' &&
      typeof item.id === 'string' && typeof item.name === 'string' &&
      item.group !== null && typeof item.group === 'object' &&
      Array.isArray(item.group.conditions))
    return valid ? parsed as SavedFilter[] : null
  } catch {
    return null
  }
}
