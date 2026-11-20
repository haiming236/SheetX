/**
 * @sheetx/themes - 主题与设计令牌（任务书 T11）
 *
 * 双出口设计（关键架构点，对接文档会展开）：
 * 1. **Canvas 色板（TS 常量）**——canvas 2D 无法读 CSS 变量，渲染层的颜色
 *    必须从这里的 TS 对象取值；主题切换 = 换 tokens 引用 + 触发场景重绘。
 * 2. **CSS 变量（--sx-*）**——DOM 层（编辑器/菜单/弹层）消费 CSS 变量，
 *    与 Lit UI 组件库共享同一套令牌（shadow DOM 穿透用 var()）。
 *
 * 令牌命名对齐 UI 设计稿（playground tokens.ts 的 --sx- 前缀约定）。
 */

/** 主题令牌（Canvas + DOM 共用的语义集合） */
export interface ThemeTokens {
  name: string
  dark: boolean

  // 表格区
  background: string
  cellText: string
  cellTextSecondary: string
  gridLine: string
  zebra: string | null

  // 表头
  headerBackground: string
  headerText: string
  headerBorder: string

  // 交互态
  selectionFill: string
  selectionBorder: string
  activeBorder: string
  hoverFill: string
  frozenLine: string

  // 功能色
  error: string
  success: string
  warning: string

  // 编辑器（DOM 层消费）
  editorBg: string
  editorText: string

  // 字体
  fontFamily: string
  fontSize: number
  headerFontSize: number

  /** T11：间距令牌（旧版自定义主题可省略，由 themeToCssVariables 补默认值） */
  spacing?: { xs: number; sm: number; md: number; lg: number }
  /** T11：边框令牌（同上，旧主题按 gridLine 派生） */
  border?: { width: number; radius: number; color: string }
}

export const lightTheme: ThemeTokens = {
  name: 'light',
  dark: false,
  background: '#ffffff',
  cellText: '#1f2329',
  cellTextSecondary: '#646a73',
  gridLine: '#e5e8ed',
  zebra: null,
  headerBackground: '#f5f6f7',
  headerText: '#1f2329',
  headerBorder: '#d0d3d9',
  selectionFill: 'rgba(26,115,232,0.10)',
  selectionBorder: '#1a73e8',
  activeBorder: '#1a73e8',
  hoverFill: 'rgba(31,35,41,0.04)',
  frozenLine: '#b8bcc4',
  error: '#d93025',
  success: '#0f9d58',
  warning: '#f9ab00',
  editorBg: '#ffffff',
  editorText: '#1f2329',
  fontFamily: "'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
  fontSize: 13,
  headerFontSize: 12,
  spacing: { xs: 2, sm: 4, md: 8, lg: 16 },
  border: { width: 1, radius: 4, color: '#d0d3d9' },
}

export const darkTheme: ThemeTokens = {
  name: 'dark',
  dark: true,
  background: '#1a1c20',
  cellText: '#e8eaed',
  cellTextSecondary: '#9aa0a6',
  gridLine: '#2f3338',
  zebra: null,
  headerBackground: '#232529',
  headerText: '#e8eaed',
  headerBorder: '#3c4043',
  selectionFill: 'rgba(138,180,248,0.16)',
  selectionBorder: '#8ab4f8',
  activeBorder: '#8ab4f8',
  hoverFill: 'rgba(232,234,237,0.06)',
  frozenLine: '#5f6368',
  error: '#f28b82',
  success: '#81c995',
  warning: '#fdd663',
  editorBg: '#232529',
  editorText: '#e8eaed',
  fontFamily: "'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
  fontSize: 13,
  headerFontSize: 12,
  spacing: { xs: 2, sm: 4, md: 8, lg: 16 },
  border: { width: 1, radius: 4, color: '#3c4043' },
}

/** 主题注册表（插件/宿主可注册自定义主题） */
export class ThemeRegistry {
  private themes = new Map<string, ThemeTokens>()

  constructor() {
    this.themes.set('light', lightTheme)
    this.themes.set('dark', darkTheme)
  }

  register(tokens: ThemeTokens): void {
    this.themes.set(tokens.name, tokens)
  }

  get(name: string): ThemeTokens {
    const theme = this.themes.get(name)
    if (!theme) throw new Error(`[SheetX] 未注册的主题: "${name}"。可用: ${[...this.themes.keys()].join(', ')}`)
    return theme
  }

  list(): string[] {
    return [...this.themes.keys()]
  }
}

// ---------------------------------------------------------------------------
// CSS 变量出口（DOM 层/UI 组件库消费）
// ---------------------------------------------------------------------------

/** 令牌 → CSS 变量映射（--sx- 前缀；与 UI 设计稿 tokens.ts 对齐） */
export function themeToCssVariables(theme: ThemeTokens): Record<string, string> {
  return {
    '--sx-color-bg': theme.background,
    '--sx-color-text': theme.cellText,
    '--sx-color-text-secondary': theme.cellTextSecondary,
    '--sx-color-grid-line': theme.gridLine,
    '--sx-color-header-bg': theme.headerBackground,
    '--sx-color-header-text': theme.headerText,
    '--sx-color-header-border': theme.headerBorder,
    '--sx-color-selection-fill': theme.selectionFill,
    '--sx-color-selection-border': theme.selectionBorder,
    '--sx-color-active-border': theme.activeBorder,
    '--sx-color-hover-fill': theme.hoverFill,
    '--sx-color-frozen-line': theme.frozenLine,
    '--sx-color-error': theme.error,
    '--sx-color-success': theme.success,
    '--sx-color-warning': theme.warning,
    '--sx-color-editor-bg': theme.editorBg,
    '--sx-color-editor-text': theme.editorText,
    '--sx-font-family': theme.fontFamily,
    '--sx-font-size': `${theme.fontSize}px`,
    // 新增令牌对旧主题做兼容兜底：外部自定义 ThemeTokens 不需要一次性补齐
    '--sx-space-xs': `${theme.spacing?.xs ?? 2}px`,
    '--sx-space-sm': `${theme.spacing?.sm ?? 4}px`,
    '--sx-space-md': `${theme.spacing?.md ?? 8}px`,
    '--sx-space-lg': `${theme.spacing?.lg ?? 16}px`,
    '--sx-border-width': `${theme.border?.width ?? 1}px`,
    '--sx-border-radius': `${theme.border?.radius ?? 4}px`,
    '--sx-border-color': theme.border?.color ?? theme.gridLine,
  }
}

/** 把主题注入到元素（宿主 root / document.documentElement） */
export function applyTheme(element: HTMLElement, themeOrName: ThemeTokens | string, registry?: ThemeRegistry): void {
  const theme = typeof themeOrName === 'string' ? (registry ?? new ThemeRegistry()).get(themeOrName) : themeOrName
  for (const [key, value] of Object.entries(themeToCssVariables(theme))) {
    element.style.setProperty(key, value)
  }
}

/** 生成一段可插入 <style> 的 CSS 变量块（UI 组件库初始化用） */
export function themeToCssText(theme: ThemeTokens, selector = ':root'): string {
  const vars = Object.entries(themeToCssVariables(theme))
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n')
  return `${selector} {\n${vars}\n}`
}
