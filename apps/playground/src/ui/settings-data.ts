/**
 * SheetX 第 10 张 · 主题与个性化设置 — 静态数据
 */
import type { IconName } from './icons.js'

export type ThemeMode = 'light' | 'dark' | 'system'

export interface ThemeOption {
  key: ThemeMode
  label: string
}

export const THEME_OPTIONS: ThemeOption[] = [
  { key: 'light', label: '浅色主题' },
  { key: 'dark', label: '深色主题' },
  { key: 'system', label: '跟随系统' },
]

/** 表格配色方案：header 表头色 / cellB 斑马纹 / border 强调边框 */
export interface PaletteOption {
  key: string
  label: string
  header: string
  cellB: string
  border: string
}

export const PALETTE_OPTIONS: PaletteOption[] = [
  { key: 'default', label: '默认', header: '#3b82f6', cellB: '#f0f6ff', border: '#c9dcfb' },
  { key: 'blue', label: '蓝色', header: '#2563eb', cellB: '#e3efff', border: '#b7d3fa' },
  { key: 'green', label: '绿色', header: '#22c55e', cellB: '#e9f9ef', border: '#c4e9d2' },
  { key: 'orange', label: '橙色', header: '#f97316', cellB: '#fff3e8', border: '#fbd7b8' },
  { key: 'purple', label: '紫色', header: '#8b5cf6', cellB: '#f3efff', border: '#dccffb' },
  { key: 'plain', label: '简约', header: '#64748b', cellB: '#f1f4f8', border: '#d6dce5' },
]

export interface LayoutOption {
  key: string
  label: string
}

export const LAYOUT_OPTIONS: LayoutOption[] = [
  { key: 'classic', label: '经典布局' },
  { key: 'simple', label: '简洁布局' },
  { key: 'compact', label: '紧凑布局' },
]

export interface ToggleOption {
  key: string
  label: string
}

/** 功能面板复选框（数据统计面板默认关闭，还原设计稿） */
export const PANEL_OPTIONS: ToggleOption[] = [
  { key: 'props', label: '右侧属性面板' },
  { key: 'formula', label: '公式助手面板' },
  { key: 'stats', label: '数据统计面板' },
  { key: 'chart', label: '图表面板' },
]

/** 其他设置开关（默认全部开启，还原设计稿） */
export const MISC_OPTIONS: ToggleOption[] = [
  { key: 'gridlines', label: '显示网格线' },
  { key: 'coords', label: '显示行列号' },
  { key: 'highlight', label: '单元格选中时高亮行列' },
  { key: 'smooth', label: '启用平滑滚动' },
]

export const FONT_FAMILIES: readonly string[] = ['思源黑体', '苹方', '微软雅黑', '宋体', '黑体', 'Roboto']
export const FONT_SIZES: readonly string[] = ['12', '13', '14', '16', '18', '20']
export const LINE_HEIGHTS: readonly string[] = ['20px', '24px', '28px', '32px', '36px']

export interface NavItem {
  key: string
  label: string
  icon: IconName
}

export const SETTINGS_NAV: NavItem[] = [
  { key: 'general', label: '通用设置', icon: 'settings' },
  { key: 'appearance', label: '外观主题', icon: 'palette' },
  { key: 'table', label: '表格设置', icon: 'tableStyle' },
  { key: 'shortcuts', label: '快捷键', icon: 'bolt' },
  { key: 'advanced', label: '高级设置', icon: 'sliders' },
  { key: 'about', label: '关于我们', icon: 'help' },
]

/** 预览窗口表格数据 */
export const PREVIEW_COLUMNS: readonly string[] = ['产品名称', '数量', '单价', '金额']

export const PREVIEW_ROWS: string[][] = [
  ['笔记本', '10', '6999', '69,990'],
  ['显示器', '20', '1299', '25,980'],
  ['键盘', '30', '299', '8,970'],
]

/** 恢复默认用的初始快照 */
export const DEFAULT_PANELS: Record<string, boolean> = { props: true, formula: true, stats: false, chart: true }
export const DEFAULT_MISC: Record<string, boolean> = { gridlines: true, coords: true, highlight: true, smooth: true }
