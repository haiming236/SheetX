/**
 * @sheetx/data - Grid 模式数据存储
 *
 * 以业务记录为中心（正式方案 L147-165）：一行 = 一条业务记录（RowData），
 * 一列 = 一个业务字段。**不为每个单元格建对象**——单元格值就是 row.data[field]，
 * 100 万行 × 20 列在内存中是 100 万个普通对象，而不是 2000 万个 Cell 实例。
 */

import { nextId } from '@sheetx/core'
import type { CellChange, RowData } from '@sheetx/core'

/** Grid 数据存储：行序 + 行索引 + 字段读写 */
export class GridStore {
  private rowsById = new Map<string, RowData>()
  /** 行顺序数组。insert/delete 是 O(n) splice——相对「编辑」低频，可接受 */
  private order: string[] = []
  /** id → 当前下标。随 order 增删增量维护，保证 getRowIndex O(1) */
  private indexById = new Map<string, number>()

  constructor(rows: RowData[] = []) {
    this.insertRows(0, rows)
  }

  get rowCount(): number {
    return this.order.length
  }

  getRowIds(): readonly string[] {
    return this.order
  }

  getRow(id: string): RowData | undefined {
    return this.rowsById.get(id)
  }

  getRowByIndex(index: number): RowData | undefined {
    const id = this.order[index]
    return id === undefined ? undefined : this.rowsById.get(id)
  }

  getRowIndex(id: string): number {
    return this.indexById.get(id) ?? -1
  }

  /** 读取单元格原始值；行不存在返回 undefined（与「字段不存在」无法区分，引擎层先校验行） */
  getCell(rowId: string, field: string): unknown {
    return this.rowsById.get(rowId)?.data[field]
  }

  /**
   * 直接写值（绕过命令系统，供 Mutation.apply 调用）。
   * 返回本次变更（含旧值）；值相同返回 null。
   * 事件派发与 undo 入栈是 CommandService 的职责，本方法保持纯净。
   */
  setRawCell(rowId: string, field: string, value: unknown): CellChange | null {
    const row = this.rowsById.get(rowId)
    if (!row) return null
    const oldValue = row.data[field]
    if (Object.is(oldValue, value)) return null
    row.data[field] = value
    return { rowId, field, oldValue, newValue: value }
  }

  /** 批量写值（Mutation.apply 用），返回实际发生的变更 */
  setRawCells(changes: ReadonlyArray<CellChange>): CellChange[] {
    const applied: CellChange[] = []
    for (const change of changes) {
      const applied1 = this.setRawCell(change.rowId, change.field, change.newValue)
      if (applied1) applied.push(applied1)
    }
    return applied
  }

  /**
   * 插入行。index 越界自动钳制；id 必须唯一且不存在。
   * 全量数据替换（setData）也走这里。
   * 性能注意：不能用 splice(clamped, 0, ...ids) —— 百万级参数展开会爆调用栈
   * （benchmark 实测发现）；尾插走 push 循环快路径，中插走 concat。
   */
  insertRows(index: number, rows: ReadonlyArray<RowData>): void {
    const clamped = Math.max(0, Math.min(index, this.order.length))
    for (const row of rows) {
      if (this.rowsById.has(row.id)) {
        throw new Error(`[SheetX] insertRows: 行 id "${row.id}" 已存在。`)
      }
    }
    const ids = rows.map((row) => row.id)
    if (clamped === this.order.length) {
      // 尾插快路径：初始装载/追加行（最高频的大批量场景）
      for (const id of ids) this.order.push(id)
      for (const row of rows) this.rowsById.set(row.id, row)
      // 全部新行顺序追加：直接建索引，不必重排旧区间
      let indexCounter = clamped
      for (const row of rows) this.indexById.set(row.id, indexCounter++)
    } else {
      this.order = this.order.slice(0, clamped).concat(ids as string[], this.order.slice(clamped))
      for (const row of rows) this.rowsById.set(row.id, row)
      this.reindexFrom(clamped)
    }
  }

  /** 删除行；返回被删的行数据（undo 反演直接复用），未知 id 抛错（快速失败，避免静默丢数据） */
  deleteRows(rowIds: ReadonlyArray<string>): RowData[] {
    const deleted: RowData[] = []
    const idSet = new Set(rowIds)
    // 收集被删行与其当前下标（删除前）
    const victims: Array<{ id: string; index: number; row: RowData }> = []
    for (const id of idSet) {
      const index = this.indexById.get(id)
      if (index === undefined) {
        throw new Error(`[SheetX] deleteRows: 行 id "${id}" 不存在。`)
      }
      victims.push({ id, index, row: this.rowsById.get(id)! })
    }
    victims.sort((a, b) => a.index - b.index)
    // 从大到小删除，避免 splice 使后续下标失效
    for (let i = victims.length - 1; i >= 0; i--) {
      const victim = victims[i]!
      this.order.splice(victim.index, 1)
      this.rowsById.delete(victim.id)
      this.indexById.delete(victim.id) // 必须清理索引缓存，否则 getRowIndex 返回陈旧值
      deleted.push(victim.row)
    }
    if (victims.length > 0) this.reindexFrom(victims[0]!.index)
    // 返回按原顺序（下标升序）
    deleted.reverse()
    return deleted
  }

  /** 清空并重建（setData 使用） */
  replaceRows(rows: ReadonlyArray<RowData>): void {
    this.rowsById.clear()
    this.order = []
    this.indexById.clear()
    this.insertRows(0, rows)
  }

  /** 导出全部行（快照；行对象为引用共享，不做深拷贝——内存优先，调用方不得篡改） */
  getAllRows(): RowData[] {
    return this.order.map((id) => this.rowsById.get(id)!)
  }

  private reindexFrom(start: number): void {
    for (let i = start; i < this.order.length; i++) {
      this.indexById.set(this.order[i]!, i)
    }
  }
}

/** 生成稳定行 id（宿主未提供主键时的兜底） */
export function generateRowId(): string {
  return nextId('row')
}
