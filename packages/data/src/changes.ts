/**
 * @sheetx/data - 变更追踪
 *
 * 把零散的单元格修改聚合成 DataTransaction（core 契约）。
 * 事务是撤销重做、事件派发、未来协同的共同载体。
 */

import type { CellChange, DataTransaction, RowData } from '@sheetx/core'
import { nextId } from '@sheetx/core'

/** 事务来源类型（core DataTransaction['source'] 的别名） */
export type TransactionSource = DataTransaction['source']

/** 变更追踪器：收集 CellChange，聚合成事务 */
export class ChangeTracker {
  private changes: CellChange[] = []

  /**
   * 记录一次变更。新旧值相同（Object.is）时返回 undefined——
   * 「写相同值」不算变更，避免空事务打扰 undo/事件系统。
   */
  record(rowId: string, field: string, oldValue: unknown, newValue: unknown): CellChange | undefined {
    if (Object.is(oldValue, newValue)) return undefined
    const change: CellChange = { rowId, field, oldValue, newValue }
    this.changes.push(change)
    return change
  }

  getChanges(): readonly CellChange[] {
    return this.changes
  }

  get size(): number {
    return this.changes.length
  }

  clear(): void {
    this.changes.length = 0
  }

  /** 聚合为事务；没有任何变更时返回 undefined（调用方据此跳过事件与 undo） */
  toTransaction(source: TransactionSource): DataTransaction | undefined {
    if (this.changes.length === 0) return undefined
    return { id: nextId('tx'), changes: this.changes, source }
  }
}

/** 行数据工具：把宿主传入的任意记录数组规整为 RowData（保证 id 存在且唯一） */
export function normalizeRows(rows: ReadonlyArray<Record<string, unknown>>, idField = 'id'): RowData[] {
  const out: RowData[] = []
  const seen = new Set<string>()
  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i]!
    const rawId = raw[idField]
    let id: string
    if (typeof rawId === 'string' && rawId !== '') {
      id = rawId
    } else {
      // 宿主数据没有 id 字段时自动生成——但会失去「行身份」的稳定性，
      // 文档中明确建议宿主提供稳定业务主键。
      id = `row_${i}_${nextId('r')}`
    }
    if (seen.has(id)) {
      throw new Error(`[SheetX] 重复的行 id: "${id}"。行 id 必须唯一（第 ${i} 条记录）。`)
    }
    seen.add(id)
    out.push({ id, data: raw })
  }
  return out
}
