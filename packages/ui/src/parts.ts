/**
 * @sheetx/ui - 通用 UI 部件模型（框架无关）
 *
 * 这里只定义**结构与行为描述**，不绑定 Lit/Vue/React。
 * 各适配层（web-component / vue / react）按同一份描述渲染，避免三套实现漂移。
 */

import type { UIParts } from './presets.js'

export interface ToolbarItem {
  id: string
  label?: string
  icon?: string
  kind?: 'button' | 'select' | 'separator' | 'toggle'
  /** toggle 类的当前态 */
  active?: boolean
  /** 禁用态 */
  disabled?: boolean
  /** 下拉选项（select 类） */
  options?: string[]
  value?: string
  title?: string
}

/** 标准工具栏：Grid 与 Spreadsheet 共用，按需裁剪 */
export function defaultToolbar(preset: 'compact' | 'standard' | 'spreadsheet'): ToolbarItem[] {
  const common: ToolbarItem[] = [
    { id: 'undo', icon: 'undo', title: '撤销' },
    { id: 'redo', icon: 'redo', title: '重做' },
    { id: 'sep1', kind: 'separator' },
    { id: 'fontFamily', kind: 'select', options: ['思源宋体', '思源黑体', 'Inter'], value: '思源宋体' },
    { id: 'fontSize', kind: 'select', options: ['10', '11', '12', '14', '16', '20'], value: '12' },
    { id: 'sep2', kind: 'separator' },
    { id: 'bold', icon: 'bold', kind: 'toggle', title: '加粗' },
    { id: 'italic', icon: 'italic', kind: 'toggle', title: '斜体' },
    { id: 'underline', icon: 'underline', kind: 'toggle', title: '下划线' },
    { id: 'color', icon: 'fontColor', title: '字体颜色' },
    { id: 'sep3', kind: 'separator' },
    { id: 'alignLeft', icon: 'alignLeft', kind: 'toggle', title: '左对齐' },
    { id: 'alignCenter', icon: 'alignCenter', kind: 'toggle', title: '居中' },
    { id: 'alignRight', icon: 'alignRight', kind: 'toggle', title: '右对齐' },
  ]
  if (preset === 'spreadsheet') {
    return [
      ...common,
      { id: 'sep4', kind: 'separator' },
      { id: 'merge', icon: 'merge', title: '合并居中' },
      { id: 'currency', icon: 'currency', title: '货币格式' },
      { id: 'percent', icon: 'percent', title: '百分比' },
      { id: 'conditional', icon: 'conditional', title: '条件格式' },
    ]
  }
  return common
}

export interface FormulaBarState {
  address: string
  value: string
  /** 可读但不可编辑（如文本单元格） */
  readonly?: boolean
}

export interface StatusBarState {
  message: string
  cellCount?: number
  sum?: string
  average?: string
  zoom?: number
}

export interface MenuItemModel {
  id: string
  label: string
  icon?: string
  shortcut?: string
  checked?: boolean
  disabled?: boolean
  danger?: boolean
  separator?: boolean
  submenu?: MenuItemModel[]
}

/** 默认右键菜单（与"右键菜单页"保持同一套操作集合） */
export function defaultContextMenu(): MenuItemModel[] {
  return [
    { id: 'copy', label: '复制', icon: 'copy', shortcut: 'Ctrl+C' },
    { id: 'cut', label: '剪切', icon: 'scissors', shortcut: 'Ctrl+X' },
    { id: 'paste', label: '粘贴', icon: 'paste', shortcut: 'Ctrl+V' },
    { id: 'sep1', label: '', separator: true },
    { id: 'insertRow', label: '插入行', icon: 'plus' },
    { id: 'deleteRow', label: '删除行', icon: 'trash', danger: true },
    { id: 'clear', label: '清除内容', icon: 'eraser', shortcut: 'Delete' },
    { id: 'sep2', label: '', separator: true },
    { id: 'merge', label: '合并选中区域', icon: 'merge' },
    { id: 'fill', label: '填充颜色', icon: 'fill' },
    { id: 'format', label: '设置单元格格式…', icon: 'format', shortcut: 'Ctrl+1' },
  ]
}

/** 按预设裁剪部件（返回真正应该渲染的部分） */
export function visibleParts(parts: UIParts): UIParts {
  return { ...parts }
}
