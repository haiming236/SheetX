/**
 * @sheetx/data - Grid 模式内置 Mutation 集
 *
 * 命名遵循 `<namespace>.mutation.<name>` 规范。
 * 每个 mutation 必须满足：① params 可 JSON 序列化；② apply 幂等可重放；
 * ③ createUndo 在变更前基于当前状态计算反演 mutation。
 *
 * undo 的实现策略说明：
 * - set-cells 的 params 里已携带 oldValue（编辑时刻的现场），反演 = 自己 + 新旧互换；
 * - insert-rows / delete-rows 是互逆型——反演指向**对方的** mutation id；
 * - delete-rows 这类「丢失型」操作必须在 createUndo 里从 store 抢救出完整行数据。
 */

import type { CellChange, DataTransaction, RowData } from '@sheetx/core'
import { nextId } from '@sheetx/core'
import type { MutationDef, UndoMutationRef } from './command-service.js'
import type { GridStore } from './grid-store.js'

/* eslint-disable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------
// grid.mutation.set-cells —— 单元格批量写值（Grid 模式最高频的 mutation）
// ---------------------------------------------------------------------------

export interface SetCellsParams {
  /** 变更数组：oldValue 是「执行前」的值（由调用方在编辑现场捕获，见 buildSetCellsParams） */
  changes: CellChange[]
}

export const SetCellsMutation: MutationDef<GridStore, SetCellsParams> = {
  id: 'grid.mutation.set-cells',
  apply(store, params) {
    for (const change of params.changes) {
      const applied = store.setRawCell(change.rowId, change.field, change.newValue)
      if (!applied && !store.getRow(change.rowId)) {
        throw new Error(`[SheetX] set-cells: 行 "${change.rowId}" 不存在。`)
      }
    }
  },
  // 自反型：反演 = 同一条 mutation + 新旧互换
  createUndo(_store, params): UndoMutationRef {
    return {
      id: SetCellsMutation.id,
      params: {
        changes: params.changes.map((change) => ({
          rowId: change.rowId,
          field: change.field,
          oldValue: change.newValue,
          newValue: change.oldValue,
        })),
      },
    }
  },
  transaction(params, source): DataTransaction {
    return { id: nextId('tx'), changes: params.changes, source }
  },
}

// ---------------------------------------------------------------------------
// grid.mutation.insert-rows / delete-rows —— 结构性变更（互为反演）
// ---------------------------------------------------------------------------

export interface InsertRowsParams {
  index: number
  rows: RowData[]
}

export const InsertRowsMutation: MutationDef<GridStore, InsertRowsParams> = {
  id: 'grid.mutation.insert-rows',
  apply(store, params) {
    store.insertRows(params.index, params.rows)
  },
  // 插入的反演 = 删除这些 id（行数据已知，无需抢救）
  createUndo(_store, params): UndoMutationRef {
    return { id: DeleteRowsMutation.id, params: { rowIds: params.rows.map((row) => row.id) } }
  },
  // 结构变更不派发单元格值事务；行集变化由 grid 引擎派发行级事件
  transaction: () => null,
}

export interface DeleteRowsParams {
  rowIds: string[]
}

export const DeleteRowsMutation: MutationDef<GridStore, DeleteRowsParams> = {
  id: 'grid.mutation.delete-rows',
  apply(store, params) {
    store.deleteRows(params.rowIds)
  },
  // 删除是「丢失型」操作：必须在变更前抢救出完整行数据与位置
  createUndo(store, params): UndoMutationRef {
    let minIndex = Number.MAX_SAFE_INTEGER
    const rows: RowData[] = []
    for (const id of params.rowIds) {
      const index = store.getRowIndex(id)
      if (index >= 0) minIndex = Math.min(minIndex, index)
      const row = store.getRow(id)
      if (row) rows.push(row)
    }
    return { id: InsertRowsMutation.id, params: { index: minIndex === Number.MAX_SAFE_INTEGER ? 0 : minIndex, rows } }
  },
  transaction: () => null,
}

// ---------------------------------------------------------------------------
// grid.mutation.replace-data —— 全量替换（setData 使用）
// ---------------------------------------------------------------------------

export interface ReplaceRowsParams {
  rows: RowData[]
}

export const ReplaceRowsMutation: MutationDef<GridStore, ReplaceRowsParams> = {
  id: 'grid.mutation.replace-data',
  apply(store, params) {
    store.replaceRows(params.rows)
  },
  createUndo(store): UndoMutationRef {
    // 全量替换的 undo 保存旧数据集的引用（浅引用，不深拷贝——
    // 行对象本身被 store 持有、未被修改，引用是安全的）
    return { id: ReplaceRowsMutation.id, params: { rows: store.getAllRows() } }
  },
  transaction: () => null,
}

/** 注册 Grid 模式全部内置 mutation */
export function registerGridMutations(service: { registerMutation(def: MutationDef<GridStore, any>): void }): void {
  service.registerMutation(SetCellsMutation)
  service.registerMutation(InsertRowsMutation)
  service.registerMutation(DeleteRowsMutation)
  service.registerMutation(ReplaceRowsMutation)
}

/** 便捷工具：把若干 {rowId, field, value} 写值意图转成 set-cells 参数（在编辑现场捕获旧值） */
export function buildSetCellsParams(
  store: GridStore,
  intents: ReadonlyArray<{ rowId: string; field: string; value: unknown }>,
): SetCellsParams {
  const changes: CellChange[] = []
  for (const intent of intents) {
    const oldValue = store.getCell(intent.rowId, intent.field)
    if (Object.is(oldValue, intent.value)) continue
    changes.push({ rowId: intent.rowId, field: intent.field, oldValue, newValue: intent.value })
  }
  return { changes }
}

/* eslint-enable @typescript-eslint/no-explicit-any */
