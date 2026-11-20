/**
 * @sheetx/interaction - 交互引擎
 *
 * 职责：键盘、鼠标、IME、剪贴板、选择（任务书 T3）。
 * 铁律：只产出语义命令与回调，绝不直接改数据。
 */

export { InputController } from './input-controller.js'
export { SelectionModel, normalizeRange, rangeContains, rangeEquals } from './selection.js'
export type { SelectionChangePayload } from './selection.js'
export { ImeGuard } from './ime.js'
export { ClipboardController, parseTsv, parseHtmlTable } from './clipboard.js'
export type { CopyData, PasteMeta, ClipboardCallbacks } from './clipboard.js'
export { Keymap } from './keymap.js'
export type { KeyBinding, KeyContext, KeyHandlerResult, KeyEventLike } from './keymap.js'
export { createDefaultKeyBindings } from './default-keymap.js'
export { InteractionStateMachine } from './fsm.js'
export type { StateTransition } from './fsm.js'
export { PointerController } from './pointer.js'
export { InteractionState } from './types.js'
export type {
  InteractionCallbacks,
  HitTarget,
  HitKind,
  SemanticCommand,
  ResizePhase,
  InteractionStateValue,
} from './types.js'
