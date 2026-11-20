/**
 * @sheetx/web-component - 事件桥接
 *
 * 引擎事件（EventBus 回调）→ DOM CustomEvent（bubbles + composed）。
 * 命名规则：引擎事件 `cell-change` → DOM 事件 `sx-cell-change`。
 *
 * 纪律（对接指南 §2.3 / §7.1）：只转发**语义事件**；
 * 方向键/Enter 等引擎内部导航事件不外发，避免宿主重复处理。
 */

import type { DataTransaction, CellRange } from '@sheetx/core'
import type { ValidationError } from '@sheetx/validation'
import type { BeforeEditPayload, AfterEditPayload } from '@sheetx/grid'
import type { BeforeCellEditPayload } from '@sheetx/spreadsheet'

/** <sheetx-grid> / <sheetx-spreadsheet> 对外 DOM 事件名 */
export const SheetXEvents = {
  CELL_CHANGE: 'sx-cell-change',
  SELECTION_CHANGE: 'sx-selection-change',
  BEFORE_EDIT: 'sx-before-edit',
  AFTER_EDIT: 'sx-after-edit',
  VALIDATION_ERROR: 'sx-validation-error',
  FORMULA_CHANGE: 'sx-formula-change',
  BEFORE_CELL_EDIT: 'sx-before-cell-edit',
  SHEET_ADDED: 'sx-sheet-added',
  SHEET_REMOVED: 'sx-sheet-removed',
  ACTIVE_SHEET_CHANGED: 'sx-active-sheet-changed',
} as const

export type SheetXEventName = (typeof SheetXEvents)[keyof typeof SheetXEvents]

/**
 * formula-change 载荷单项。
 * 与 @sheetx/formula 的 FormulaChange 结构一致；此处独立声明，
 * 避免本包为纯类型引入对 @sheetx/formula 的运行时依赖。
 */
export interface FormulaChangeDetail {
  sheet: string
  row: number
  col: number
  /** 之前的计算值（或无缓存时的原始单元格值） */
  oldValue: unknown
  /** 新计算值（错误以其错误码字符串落值，如 "#DIV/0!"） */
  newValue: unknown
}

/** 事件载荷类型（宿主 TypeScript 侧使用） */
export interface SheetXEventTypes {
  [SheetXEvents.CELL_CHANGE]: DataTransaction
  [SheetXEvents.SELECTION_CHANGE]: { ranges: CellRange[]; activeIndex: number }
  [SheetXEvents.BEFORE_EDIT]: BeforeEditPayload | BeforeCellEditPayload
  [SheetXEvents.AFTER_EDIT]: AfterEditPayload
  [SheetXEvents.VALIDATION_ERROR]: { errors: ValidationError[] }
  [SheetXEvents.FORMULA_CHANGE]: FormulaChangeDetail[]
  [SheetXEvents.BEFORE_CELL_EDIT]: BeforeCellEditPayload
  [SheetXEvents.SHEET_ADDED]: { sheetId: string; name?: string }
  [SheetXEvents.SHEET_REMOVED]: { sheetId: string }
  [SheetXEvents.ACTIVE_SHEET_CHANGED]: { sheetId: string }
}

/** 类型化 CustomEvent：监听回调中 detail 自动收窄为对应载荷类型 */
export interface SheetXCustomEvent<N extends SheetXEventName = SheetXEventName> extends CustomEvent {
  detail: SheetXEventTypes[N]
}

/**
 * 类型安全的事件监听助手：
 *
 * ```ts
 * const off = onSheetXEvent(el, SheetXEvents.CELL_CHANGE, (e) => {
 *   e.detail.changes // DataTransaction['changes']，自动收窄
 * })
 * ```
 *
 * 返回解绑函数；也可继续用原生 addEventListener（detail 需自行断言）。
 */
export function onSheetXEvent<N extends SheetXEventName>(
  target: EventTarget,
  event: N,
  handler: (e: SheetXCustomEvent<N>) => void,
  options?: AddEventListenerOptions,
): () => void {
  const wrapped = handler as unknown as EventListener
  target.addEventListener(event, wrapped, options)
  return () => target.removeEventListener(event, wrapped, options)
}

/** 派发桥接事件（detail = 引擎原始载荷） */
export function emitSheetXEvent<T>(target: EventTarget, event: string, detail: T): void {
  target.dispatchEvent(new CustomEvent(event, { detail, bubbles: true, composed: true }))
}
