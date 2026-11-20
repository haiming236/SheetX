/**
 * @sheetx/core - 事件总线
 *
 * 轻量类型化事件总线，供各引擎模块之间解耦通信。
 * 对外公共事件（cell-change / selection-change 等）由此派发。
 */

/** 事件监听器签名 */
export type EventListener<T = unknown> = (payload: T) => void

/** 取消订阅函数 */
export type Unsubscribe = () => void

/** 事件总线接口 */
export interface IEventBus {
  on<T = unknown>(event: string, listener: EventListener<T>): Unsubscribe
  once<T = unknown>(event: string, listener: EventListener<T>): Unsubscribe
  off(event: string, listener: EventListener): void
  emit<T = unknown>(event: string, payload: T): void
  clear(event?: string): void
}

/** SheetX 对外公共事件名（常量集合） */
export const PublicEvent = {
  CELL_CHANGE: 'cell-change',
  SELECTION_CHANGE: 'selection-change',
  BEFORE_EDIT: 'before-edit',
  AFTER_EDIT: 'after-edit',
  DATA_CHANGED: 'data-changed',
  VALIDATION_ERROR: 'validation-error',
} as const

export type PublicEventName = (typeof PublicEvent)[keyof typeof PublicEvent]
