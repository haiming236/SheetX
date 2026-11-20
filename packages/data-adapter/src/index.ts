/**
 * @sheetx/data-adapter - 数据适配器（任务书 T7）
 *
 * 职责：本地/远程数据加载、分页、排序、筛选的**契约层**。
 *
 * 纯前端边界（《SheetX的产品边界.md》）：SheetX 不内置任何 HTTP client 与后端逻辑。
 * RemoteAdapter 只定义回调契约，fetch/axios 由宿主系统注入。
 * 切换本地/远程适配器不改变上层（grid）代码——这是 AG Grid IRowModel 抽象的价值。
 */

import type { RowData, UnknownRecord } from '@sheetx/core'
import { normalizeRows } from '@sheetx/data'

export * from './windowed-store.js'
export * from './filter-groups.js'

// ---------------------------------------------------------------------------
// 查询模型（Grid 模式的服务端契约，JSON 可序列化）
// ---------------------------------------------------------------------------

export type SortDirection = 'asc' | 'desc'

export interface SortCriterion {
  field: string
  dir: SortDirection
}

export type FilterOperator =
  | 'eq'
  | 'ne'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'in'
  | 'empty'
  | 'notEmpty'

export interface FilterCriterion {
  field: string
  op: FilterOperator
  value?: unknown
}

export interface DataQuery {
  /** 页码（1 起始）。不传 = 全量 */
  page?: number
  pageSize?: number
  sort?: SortCriterion[]
  filter?: FilterCriterion[]
  /** 全局关键字（搜索全部字符串字段） */
  keyword?: string
}

export interface PageResult {
  /** 当前页/全量行（已按 id 规整） */
  rows: RowData[]
  /** 总行数（分页时用于滚动条与页数计算；未知传 -1） */
  total: number
}

export interface SaveChange {
  op: 'insert' | 'update' | 'delete'
  row: RowData
}

export interface SaveResult {
  success: boolean
  message?: string
  /** 服务端可能回填 id/计算字段——返回的行由引擎合并进 store */
  rows?: RowData[]
}

/**
 * 数据适配器契约。
 * Grid 引擎只面向此接口编程，数据来自内存数组还是宿主 API 无关紧要。
 */
export interface IDataAdapter {
  readonly kind: 'local' | 'remote'
  load(query: DataQuery): Promise<PageResult>
  /** 可选：宿主接入保存回调后引擎才提供「保存」能力 */
  save?(changes: ReadonlyArray<SaveChange>): Promise<SaveResult>
}

// ---------------------------------------------------------------------------
// 本地适配器：内存数据的分页/排序/筛选（纯函数，无副作用）
// ---------------------------------------------------------------------------

export class LocalAdapter implements IDataAdapter {
  readonly kind = 'local' as const

  constructor(private readonly source: () => ReadonlyArray<RowData>) {}

  /** 从原始记录数组创建（自动规整 id） */
  static fromRecords(records: ReadonlyArray<UnknownRecord>, idField = 'id'): LocalAdapter {
    const rows = normalizeRows(records, idField)
    return new LocalAdapter(() => rows)
  }

  async load(query: DataQuery): Promise<PageResult> {
    let rows = [...this.source()]
    if (query.filter && query.filter.length > 0) rows = rows.filter((row) => matchesAllFilters(row, query.filter!))
    if (query.keyword) rows = rows.filter((row) => matchesKeyword(row, query.keyword!))
    if (query.sort && query.sort.length > 0) rows = sortRows(rows, query.sort)
    const total = rows.length
    if (query.page !== undefined && query.pageSize !== undefined) {
      const start = (query.page - 1) * query.pageSize
      rows = rows.slice(start, start + query.pageSize)
    }
    return { rows, total }
  }
}

// ---------------------------------------------------------------------------
// 远程适配器：回调契约（宿主实现 load/save，SheetX 不碰网络）
// ---------------------------------------------------------------------------

export interface RemoteAdapterCallbacks {
  /** 宿主实现：把 DataQuery 翻译成自家 API 调用并返回 PageResult */
  load(query: DataQuery): Promise<PageResult>
  /** 宿主实现：提交变更（可省略——省略时引擎的保存能力关闭） */
  save?(changes: ReadonlyArray<SaveChange>): Promise<SaveResult>
}

export class RemoteAdapter implements IDataAdapter {
  readonly kind = 'remote' as const

  constructor(private readonly callbacks: RemoteAdapterCallbacks) {}

  load(query: DataQuery): Promise<PageResult> {
    return this.callbacks.load(query)
  }

  save(changes: ReadonlyArray<SaveChange>): Promise<SaveResult> {
    if (!this.callbacks.save) {
      return Promise.resolve({ success: false, message: '宿主未提供 save 回调，保存能力关闭。' })
    }
    return this.callbacks.save(changes)
  }
}

// ---------------------------------------------------------------------------
// 排序/筛选/关键字工具（LocalAdapter 内部用；导出供远程宿主复用同一语义）
// ---------------------------------------------------------------------------

function compareValues(a: unknown, b: unknown): number {
  if (a === b) return 0
  if (a === null || a === undefined) return -1
  if (b === null || b === undefined) return 1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b)
  return String(a).localeCompare(String(b), 'zh-CN')
}

function applyOp(actual: unknown, op: FilterOperator, expected: unknown): boolean {
  switch (op) {
    case 'eq':
      return actual === expected
    case 'ne':
      return actual !== expected
    case 'gt':
      return compareValues(actual, expected) > 0
    case 'gte':
      return compareValues(actual, expected) >= 0
    case 'lt':
      return compareValues(actual, expected) < 0
    case 'lte':
      return compareValues(actual, expected) <= 0
    case 'contains':
      return String(actual ?? '').includes(String(expected))
    case 'startsWith':
      return String(actual ?? '').startsWith(String(expected))
    case 'endsWith':
      return String(actual ?? '').endsWith(String(expected))
    case 'in':
      return Array.isArray(expected) && (expected as unknown[]).includes(actual)
    case 'empty':
      return actual === null || actual === undefined || actual === ''
    case 'notEmpty':
      return !(actual === null || actual === undefined || actual === '')
    default:
      return true
  }
}

function matchesAllFilters(row: RowData, filters: ReadonlyArray<FilterCriterion>): boolean {
  return filters.every((f) => applyOp(row.data[f.field], f.op, f.value))
}

function matchesKeyword(row: RowData, keyword: string): boolean {
  const lower = keyword.toLowerCase()
  return Object.values(row.data).some((value) => typeof value === 'string' && value.toLowerCase().includes(lower))
}

function sortRows(rows: RowData[], criteria: ReadonlyArray<SortCriterion>): RowData[] {
  return rows.sort((a, b) => {
    for (const criterion of criteria) {
      const result = compareValues(a.data[criterion.field], b.data[criterion.field])
      if (result !== 0) return criterion.dir === 'asc' ? result : -result
    }
    return 0
  })
}

/** 与 LocalAdapter 相同语义的排序/筛选工具（远程宿主在服务端实现时参考） */
export const queryUtils = { applyOp, compareValues, sortRows, matchesAllFilters, matchesKeyword }
