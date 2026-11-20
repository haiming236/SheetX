/**
 * @sheetx/spreadsheet - Sheet 模式 Mutation 集（S = WorkbookModel）
 *
 * 与 Grid mutation 同一套纪律：params 可序列化、apply 幂等、createUndo 变更前计算。
 * 公共事务载荷 SheetTransaction 是 Spreadsheet 模式的对外事件契约（对接文档 §事件）。
 */

import type { CellData, CellRange } from '@sheetx/core'
import type { MutationDef } from '@sheetx/data'
import type { UndoMutationRef } from '@sheetx/data'
import { WorksheetStore } from '@sheetx/data'
import type { CellStyle } from '@sheetx/data'
import type { WorkbookModel } from './workbook.js'

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Sheet 模式公共事务载荷（DATA_CHANGED 事件 → cell-change 事件的载体） */
export interface SheetTransaction {
  id: string
  sheetId: string
  /** 单元格值/样式变更（稀疏：只含被触碰的格子） */
  changes: SheetCellChange[]
  source: 'user' | 'api' | 'paste' | 'import' | 'formula'
}

export interface SheetCellChange {
  row: number
  col: number
  oldData: CellData | undefined
  newData: CellData | undefined
}

function requireSheet(workbook: WorkbookModel, sheetId: string): WorksheetStore {
  const sheet = workbook.getSheet(sheetId)
  if (!sheet) throw new Error(`[SheetX] 工作表不存在: "${sheetId}"`)
  return sheet
}

// ---------------------------------------------------------------------------
// sheet.mutation.set-cells —— 单元格写值/写样式（Sheet 模式最高频）
// ---------------------------------------------------------------------------

export interface SetSheetCellsParams {
  sheetId: string
  /** newData 为 null = 删除格子（稀疏不变量） */
  cells: Array<{ row: number; col: number; newData: CellData | null }>
}

export const SetSheetCellsMutation: MutationDef<WorkbookModel, SetSheetCellsParams> = {
  id: 'sheet.mutation.set-cells',
  apply(workbook, params) {
    const sheet = requireSheet(workbook, params.sheetId)
    for (const cell of params.cells) {
      sheet.setCellData(cell.row, cell.col, cell.newData)
    }
  },
  createUndo(workbook, params): UndoMutationRef {
    // 变更前抢救旧数据（旧 CellData 完整对象）
    const sheet = requireSheet(workbook, params.sheetId)
    const undoCells = params.cells.map((cell) => ({
      row: cell.row,
      col: cell.col,
      newData: sheet.getCellData(cell.row, cell.col) ?? null,
    }))
    return { id: SetSheetCellsMutation.id, params: { sheetId: params.sheetId, cells: undoCells } }
  },
  transaction: () => null, // 公共 cell-change 事件由引擎层组装（携带编辑现场捕获的完整 oldData）
}

// ---------------------------------------------------------------------------
// sheet.mutation.set-style-ids —— 批量设置样式引用（样式对象→id 由引擎解析）
// ---------------------------------------------------------------------------

export interface SetStyleIdsParams {
  sheetId: string
  cells: Array<{ row: number; col: number; styleId: number | null; prevStyleId: number | null }>
}

export const SetStyleIdsMutation: MutationDef<WorkbookModel, SetStyleIdsParams> = {
  id: 'sheet.mutation.set-style-ids',
  apply(workbook, params) {
    const sheet = requireSheet(workbook, params.sheetId)
    for (const cell of params.cells) {
      const existing = sheet.getCellData(cell.row, cell.col)
      if (cell.styleId === null) {
        // 清样式：若格子只剩样式字段则整体删除（稀疏不变量）
        if (existing && existing.v === undefined && existing.f === undefined && existing.t === undefined) {
          sheet.setCellData(cell.row, cell.col, null)
        } else if (existing) {
          const { s: _removed, ...rest } = existing
          sheet.setCellData(cell.row, cell.col, rest)
        }
      } else {
        sheet.setCellData(cell.row, cell.col, { ...existing, s: cell.styleId })
      }
    }
  },
  createUndo(_workbook, params): UndoMutationRef {
    // prevStyleId 已在 params 携带（编辑现场捕获）——反演 = 交换
    return {
      id: SetStyleIdsMutation.id,
      params: {
        sheetId: params.sheetId,
        cells: params.cells.map((cell) => ({
          row: cell.row,
          col: cell.col,
          styleId: cell.prevStyleId,
          prevStyleId: cell.styleId,
        })),
      },
    }
  },
  transaction: () => null, // 样式变更由引擎派发独立事件（不混入值事务）
}

// ---------------------------------------------------------------------------
// sheet.mutation.merge / unmerge —— 合并单元格（互为反演）
// ---------------------------------------------------------------------------

export interface MergeCellsParams {
  sheetId: string
  range: CellRange
}

export const MergeCellsMutation: MutationDef<WorkbookModel, MergeCellsParams> = {
  id: 'sheet.mutation.merge',
  apply(workbook, params) {
    requireSheet(workbook, params.sheetId).addMerge(params.range)
  },
  createUndo(_workbook, params): UndoMutationRef {
    return { id: UnmergeCellsMutation.id, params: { sheetId: params.sheetId, anchorRow: params.range.start.row, anchorCol: params.range.start.col } }
  },
  transaction: () => null,
}

export interface UnmergeCellsParams {
  sheetId: string
  anchorRow: number
  anchorCol: number
}

export const UnmergeCellsMutation: MutationDef<WorkbookModel, UnmergeCellsParams> = {
  id: 'sheet.mutation.unmerge',
  apply(workbook, params) {
    requireSheet(workbook, params.sheetId).removeMerge(params.anchorRow, params.anchorCol)
  },
  createUndo(workbook, params): UndoMutationRef {
    const sheet = requireSheet(workbook, params.sheetId)
    const merge = sheet.findMergeAt(params.anchorRow, params.anchorCol)
    return { id: MergeCellsMutation.id, params: { sheetId: params.sheetId, range: merge?.range ?? { start: { row: params.anchorRow, col: params.anchorCol }, end: { row: params.anchorRow, col: params.anchorCol } } } }
  },
  transaction: () => null,
}

// ---------------------------------------------------------------------------
// sheet.mutation.set-row-height / set-col-width
// ---------------------------------------------------------------------------

export interface SetRowHeightParams {
  sheetId: string
  row: number
  height: number
  prevHeight: number
}

export const SetRowHeightMutation: MutationDef<WorkbookModel, SetRowHeightParams> = {
  id: 'sheet.mutation.set-row-height',
  apply(workbook, params) {
    requireSheet(workbook, params.sheetId).setRowHeight(params.row, params.height)
  },
  createUndo(_workbook, params): UndoMutationRef {
    return { id: SetRowHeightMutation.id, params: { ...params, height: params.prevHeight, prevHeight: params.height } }
  },
  transaction: () => null,
}

export interface SetColWidthParams {
  sheetId: string
  col: number
  width: number
  prevWidth: number
}

export const SetColWidthMutation: MutationDef<WorkbookModel, SetColWidthParams> = {
  id: 'sheet.mutation.set-col-width',
  apply(workbook, params) {
    requireSheet(workbook, params.sheetId).setColWidth(params.col, params.width)
  },
  createUndo(_workbook, params): UndoMutationRef {
    return { id: SetColWidthMutation.id, params: { ...params, width: params.prevWidth, prevWidth: params.width } }
  },
  transaction: () => null,
}

// ---------------------------------------------------------------------------
// sheet.mutation.add-sheet / remove-sheet / rename-sheet —— 工作簿结构
// ---------------------------------------------------------------------------

export interface AddSheetParams {
  sheetId: string
  name: string
  rowCount: number
  columnCount: number
  /** 完整快照（删表撤销时回灌数据；普通新建不传） */
  snapshot?: Record<string, unknown>
}

export const AddSheetMutation: MutationDef<WorkbookModel, AddSheetParams> = {
  id: 'sheet.mutation.add-sheet',
  apply(workbook, params) {
    const sheet = params.snapshot
      ? WorksheetStore.fromJSON({ ...params.snapshot, id: params.sheetId, name: params.name })
      : new WorksheetStore(params.sheetId, params.name, params.rowCount, params.columnCount)
    workbook.addSheet(sheet)
  },
  createUndo(_workbook, params): UndoMutationRef {
    return { id: RemoveSheetMutation.id, params: { sheetId: params.sheetId } }
  },
  transaction: () => null,
}

export interface RemoveSheetParams {
  sheetId: string
}

export const RemoveSheetMutation: MutationDef<WorkbookModel, RemoveSheetParams> = {
  id: 'sheet.mutation.remove-sheet',
  apply(workbook, params) {
    workbook.removeSheet(params.sheetId)
  },
  createUndo(workbook, params): UndoMutationRef {
    // 删表是丢失型操作：变更前抢救完整快照（undo 回灌全部数据）
    const sheet = requireSheet(workbook, params.sheetId)
    const snapshot = sheet.toJSON()
    return {
      id: AddSheetMutation.id,
      params: {
        sheetId: params.sheetId,
        name: sheet.name,
        rowCount: sheet.rowCount,
        columnCount: sheet.columnCount,
        snapshot,
      },
    }
  },
  transaction: () => null,
}

export interface RenameSheetParams {
  sheetId: string
  name: string
  prevName: string
}

export const RenameSheetMutation: MutationDef<WorkbookModel, RenameSheetParams> = {
  id: 'sheet.mutation.rename-sheet',
  apply(workbook, params) {
    workbook.renameSheet(params.sheetId, params.name)
  },
  createUndo(_workbook, params): UndoMutationRef {
    return { id: RenameSheetMutation.id, params: { ...params, name: params.prevName, prevName: params.name } }
  },
  transaction: () => null,
}

/** 注册 Sheet 模式全部内置 mutation */
export function registerSheetMutations(service: { registerMutation(def: MutationDef<WorkbookModel, any>): void }): void {
  service.registerMutation(SetSheetCellsMutation)
  service.registerMutation(SetStyleIdsMutation)
  service.registerMutation(MergeCellsMutation)
  service.registerMutation(UnmergeCellsMutation)
  service.registerMutation(SetRowHeightMutation)
  service.registerMutation(SetColWidthMutation)
  service.registerMutation(AddSheetMutation)
  service.registerMutation(RemoveSheetMutation)
  service.registerMutation(RenameSheetMutation)
}

/** 样式对象引用（引擎把 CellStyle 解析为样式表 id 后组装 SetStyleIdsParams） */
export type { CellStyle }
