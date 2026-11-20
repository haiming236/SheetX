/**
 * @sheetx/ui
 *
 * SheetX 通用 UI 组件与外观预设。Grid / Spreadsheet / 各框架适配器共用，
 * 保证「表格核心、编辑器、右键菜单、选择区域、工具栏」是同一套实现。
 *
 * 注意：本包保持框架无关——只提供配置与部件模型，具体 DOM 渲染由适配层完成。
 */
export {
  UI_PRESETS,
  resolveAppearance,
  type UIPreset,
  type UIParts,
  type Appearance,
} from './presets.js'
export {
  defaultToolbar,
  defaultContextMenu,
  visibleParts,
  type ToolbarItem,
  type FormulaBarState,
  type StatusBarState,
  type MenuItemModel,
} from './parts.js'
