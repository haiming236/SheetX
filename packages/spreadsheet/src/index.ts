/**
 * @sheetx/spreadsheet - 电子表格模式
 *
 * 对外主入口之一（任务书 T10）。以工作簿/单元格为中心的稀疏数据模型，
 * 集成公式引擎（@sheetx/formula）与布局基建（@sheetx/grid）。
 *
 * 依赖方向：spreadsheet → grid（布局基建单向复用，无环）+ formula/data/renderer/
 * interaction/editors/themes/core。
 */

export { SheetXSpreadsheet } from './sheet-engine.js'
export type {
  SpreadsheetConfig,
  SpreadsheetSheetConfig,
  BeforeCellEditPayload,
} from './sheet-engine.js'
import { SheetXSpreadsheet } from './sheet-engine.js'
import type { SpreadsheetConfig } from './sheet-engine.js'

/** 公共 API 工厂（与 createGrid 对应的 Spreadsheet 侧签名） */
export function createSpreadsheet(config: SpreadsheetConfig): SheetXSpreadsheet {
  return new SheetXSpreadsheet(config)
}

export { WorkbookModel } from './workbook.js'
export { formatValue, builtinFormatters } from './format.js'
export {
  SetSheetCellsMutation,
  SetStyleIdsMutation,
  MergeCellsMutation,
  UnmergeCellsMutation,
  SetRowHeightMutation,
  SetColWidthMutation,
  AddSheetMutation,
  RemoveSheetMutation,
  RenameSheetMutation,
  registerSheetMutations,
} from './sheet-mutations.js'
export type {
  SetSheetCellsParams,
  SetStyleIdsParams,
  MergeCellsParams,
  SheetTransaction,
  SheetCellChange,
  CellStyle,
} from './sheet-mutations.js'
export { buildSheetScene } from './scene/sheet-scene-builder.js'
export type { SheetSceneInput } from './scene/sheet-scene-builder.js'
