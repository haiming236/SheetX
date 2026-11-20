/** T11：主题令牌完整性、CSS 变量出口、注册表与旧主题兼容 */
import { describe, it, expect } from 'vitest'
import {
  ThemeRegistry,
  applyTheme,
  darkTheme,
  lightTheme,
  themeToCssText,
  themeToCssVariables,
  type ThemeTokens,
} from '../src/index.js'

describe('主题令牌', () => {
  it('浅色/深色内置主题都覆盖颜色、字号、间距、边框', () => {
    for (const theme of [lightTheme, darkTheme]) {
      expect(theme.background).toBeTruthy()
      expect(theme.cellText).toBeTruthy()
      expect(theme.fontFamily).toBeTruthy()
      expect(theme.fontSize).toBeGreaterThan(0)
      expect(theme.spacing).toEqual({ xs: 2, sm: 4, md: 8, lg: 16 })
      expect(theme.border?.width).toBe(1)
      expect(theme.border?.radius).toBe(4)
      expect(theme.border?.color).toBeTruthy()
    }
    expect(lightTheme.dark).toBe(false)
    expect(darkTheme.dark).toBe(true)
  })

  it('themeToCssVariables 输出完整 --sx-* 令牌', () => {
    const vars = themeToCssVariables(lightTheme)
    expect(vars['--sx-color-bg']).toBe(lightTheme.background)
    expect(vars['--sx-font-size']).toBe('13px')
    expect(vars['--sx-space-md']).toBe('8px')
    expect(vars['--sx-border-width']).toBe('1px')
    expect(vars['--sx-border-color']).toBe(lightTheme.headerBorder)
  })

  it('旧版自定义主题缺新增字段时按默认值兜底，不破坏调用方', () => {
    const legacy = { ...lightTheme, name: 'legacy' } as ThemeTokens
    delete legacy.spacing
    delete legacy.border
    const vars = themeToCssVariables(legacy)
    expect(vars['--sx-space-lg']).toBe('16px')
    expect(vars['--sx-border-color']).toBe(legacy.gridLine)
  })

  it('themeToCssText 生成可直接插入的 :root 变量块', () => {
    const css = themeToCssText(darkTheme)
    expect(css.startsWith(':root {')).toBe(true)
    expect(css).toContain('--sx-color-bg: #1a1c20;')
  })
})

describe('ThemeRegistry', () => {
  it('内置 light/dark + 注册自定义主题', () => {
    const registry = new ThemeRegistry()
    expect(registry.list()).toEqual(['light', 'dark'])
    const custom = { ...lightTheme, name: 'brand', spacing: { xs: 1, sm: 2, md: 4, lg: 8 } }
    registry.register(custom)
    expect(registry.get('brand')).toBe(custom)
    expect(registry.list()).toContain('brand')
  })

  it('未注册主题抛出明确错误', () => {
    expect(() => new ThemeRegistry().get('ghost')).toThrow(/未注册的主题/)
  })

  it('applyTheme 把变量写到目标元素 style', () => {
    const calls: Array<[string, string]> = []
    const setProperty = (key: string, value: string): void => { calls.push([key, value]) }
    const element = { style: { setProperty } } as unknown as HTMLElement
    applyTheme(element, 'dark')
    expect(calls.some(([key, value]) => key === '--sx-color-bg' && value === darkTheme.background)).toBe(true)
  })
})
