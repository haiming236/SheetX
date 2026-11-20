/**
 * @sheetx/ui - 外观预设（Appearance Presets）
 *
 * 设计原则：compact / standard / spreadsheet **只是配置不同，绝不做三套实现**。
 * Grid 与 Spreadsheet 共用同一套 UI 组件，宿主通过 appearance 选择需要的部分。
 */

export type UIPreset = 'compact' | 'standard' | 'spreadsheet'

/** 可显示的 UI 部件（宿主可在此基础上逐项覆盖） */
export interface UIParts {
  /** 工具栏 */
  toolbar: boolean
  /** 公式栏 */
  formulaBar: boolean
  /** 状态栏 */
  statusBar: boolean
  /** 工作表标签栏 */
  sheetTabs: boolean
  /** 右键菜单 */
  contextMenu: boolean
  /** 列头/行头 */
  headers: boolean
  /** 网格线 */
  gridLines: boolean
}

/** 外观配置 */
export interface Appearance {
  preset?: UIPreset
  /** 主题名或令牌对象 */
  theme?: string | Record<string, unknown>
  /** 行高（px） */
  rowHeight?: number
  /** 字号（px） */
  fontSize?: number
  /** 逐项覆盖预设中的部件开关 */
  parts?: Partial<UIParts>
  /** 自定义工具栏项（由宿主注入，预设之外） */
  toolbarItems?: string[]
}

/** 三种官方预设：仅配置差异 */
export const UI_PRESETS: Record<UIPreset, { parts: UIParts; rowHeight: number; fontSize: number }> = {
  compact: {
    parts: {
      toolbar: true,
      formulaBar: false,
      statusBar: false,
      sheetTabs: false,
      contextMenu: true,
      headers: true,
      gridLines: true,
    },
    rowHeight: 26,
    fontSize: 12,
  },
  standard: {
    parts: {
      toolbar: true,
      formulaBar: false,
      statusBar: true,
      sheetTabs: false,
      contextMenu: true,
      headers: true,
      gridLines: true,
    },
    rowHeight: 28,
    fontSize: 12,
  },
  spreadsheet: {
    parts: {
      toolbar: true,
      formulaBar: true,
      statusBar: true,
      sheetTabs: true,
      contextMenu: true,
      headers: true,
      gridLines: true,
    },
    rowHeight: 26,
    fontSize: 12,
  },
}

/** 把 appearance（可能未填）解析成完整、可消费的配置 */
export function resolveAppearance(appearance?: Appearance): Required<Omit<Appearance, 'theme' | 'parts' | 'toolbarItems' | 'preset'>> & {
  preset: UIPreset
  theme?: string | Record<string, unknown>
  parts: UIParts
  toolbarItems: string[]
} {
  const preset = appearance?.preset ?? 'compact'
  const base = UI_PRESETS[preset]
  return {
    preset,
    theme: appearance?.theme,
    parts: { ...base.parts, ...(appearance?.parts ?? {}) },
    rowHeight: appearance?.rowHeight ?? base.rowHeight,
    fontSize: appearance?.fontSize ?? base.fontSize,
    toolbarItems: appearance?.toolbarItems ?? [],
  }
}
