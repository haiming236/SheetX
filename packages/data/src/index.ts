/**
 * @sheetx/data - 数据引擎
 *
 * 职责：存储、稀疏索引、变更追踪、事务、Undo/Redo（任务书 T1）。
 *
 * 依赖方向：只依赖 @sheetx/core（引擎层纪律）。
 * 设计约束：借鉴 Univer ObjectMatrix / UndoMutationFactory / CommandService 思想，
 * 代码为自研实现（Apache-2.0 只借鉴思想，禁止复制）。
 */

// 存储
export { SparseMatrix } from './sparse.js'
export { GridStore, generateRowId } from './grid-store.js'
export { WorksheetStore, StyleTable } from './sheet-store.js'
export type { CellStyle, MergeRange } from './sheet-store.js'

// 变更协议
export { ChangeTracker, normalizeRows } from './changes.js'
export type { TransactionSource } from './changes.js'
export { UndoRedoService, DEFAULT_UNDO_LIMIT } from './undo-redo.js'
export { CommandService, MutationRegistry, newTransactionId } from './command-service.js'
export type {
  MutationDef,
  MutationInfo,
  CommandDef,
  DataChangedPayload,
  CommandServiceOptions,
  UndoMutationRef,
} from './command-service.js'

// Grid 内置 mutation
export {
  SetCellsMutation,
  InsertRowsMutation,
  DeleteRowsMutation,
  ReplaceRowsMutation,
  registerGridMutations,
  buildSetCellsParams,
} from './mutations-grid.js'
export type { SetCellsParams, InsertRowsParams, DeleteRowsParams, ReplaceRowsParams } from './mutations-grid.js'
