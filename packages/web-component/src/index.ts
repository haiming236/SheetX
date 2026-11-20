/**
 * @sheetx/web-component - 适配层：Web Component（Lit）
 *
 * 导出：
 * - <sheetx-grid>          SheetXGridElement
 * - <sheetx-spreadsheet>   SheetXSpreadsheetElement
 * - defineSheetxElements() 手动注册（副作用隔离：import 本包不会自动注册元素）
 *
 * 事件命名：引擎 `cell-change` → DOM `sx-cell-change`（bubbles + composed），
 * 全部事件名见 SheetXEvents。
 */

import { SheetXGridElement } from './sheetx-grid.js'
import { SheetXSpreadsheetElement } from './sheetx-spreadsheet.js'

export { SheetXGridElement } from './sheetx-grid.js'
export { SheetXSpreadsheetElement } from './sheetx-spreadsheet.js'
export { SheetX, installSheetX } from './facade.js'
export {
  UI_PRESETS,
  resolveAppearance,
  defaultToolbar,
  defaultContextMenu,
  type UIPreset,
  type UIParts,
  type Appearance,
} from '@sheetx/ui'
export type { SheetXFacade } from './facade.js'
export { SheetXEvents, emitSheetXEvent, onSheetXEvent } from './events.js'
export type {
  SheetXEventName,
  SheetXEventTypes,
  SheetXCustomEvent,
  FormulaChangeDetail,
} from './events.js'

/**
 * 手动注册全部元素（幂等）。宿主按需调用；CDN 场景加载后调用一次即可。
 * （不在模块顶层自动注册，保持 sideEffects: false 的 tree-shaking 纪律）
 */
export function defineSheetxElements(): void {
  if (!customElements.get('sheetx-grid')) {
    customElements.define('sheetx-grid', SheetXGridElement)
  }
  if (!customElements.get('sheetx-spreadsheet')) {
    customElements.define('sheetx-spreadsheet', SheetXSpreadsheetElement)
  }
}
