/**
 * @sheetx/editors - 编辑器引擎
 *
 * 职责：文本、数字、日期、下拉、远程搜索、自定义编辑器（任务书 T4）。
 * 契约核心：编辑器不写数据——commit/cancel 回调由 grid 引擎接管，
 * 写值走 CommandService（可校验、可撤销、可广播）。
 */

export { EditorRegistry, BuiltinEditorNames } from './registry.js'
export type { BuiltinEditorName } from './registry.js'
export type { EditorContext, EditorFactory, EditorHandle, RemoteSearchItem, SelectOption, RemoteQueryFn, CommitMeta } from './types.js'

export {
  TextEditor,
  MultilineEditor,
  NumberEditor,
  CurrencyEditor,
  DateEditor,
  DatetimeEditor,
  BooleanEditor,
  SwitchEditor,
  toIsoDate,
  serialToIsoDate,
} from './editors-basic.js'
export type { NumberEditorParams, CurrencyEditorParams } from './editors-basic.js'
export { SelectEditor, RemoteSearchEditor } from './editors-select.js'
export type { RemoteSearchEditorParams } from './editors-select.js'

import { EditorRegistry } from './registry.js'
import {
  BooleanEditor,
  CurrencyEditor,
  DateEditor,
  DatetimeEditor,
  MultilineEditor,
  NumberEditor,
  SwitchEditor,
  TextEditor,
} from './editors-basic.js'
import { RemoteSearchEditor, SelectEditor } from './editors-select.js'

/**
 * 创建内置编辑器齐全的注册表。
 * UI 层/插件可在返回实例上继续 register 自定义编辑器。
 */
export function createDefaultEditorRegistry(): EditorRegistry {
  const registry = new EditorRegistry()
  registry.register('text', TextEditor)
  registry.register('multiline', MultilineEditor)
  registry.register('number', NumberEditor)
  registry.register('currency', CurrencyEditor)
  registry.register('date', DateEditor)
  registry.register('datetime', DatetimeEditor)
  registry.register('select', SelectEditor)
  registry.register('boolean', BooleanEditor)
  registry.register('switch', SwitchEditor)
  registry.register('remote-search', RemoteSearchEditor)
  return registry
}
