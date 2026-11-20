/**
 * SheetX Playground · 全局主题
 *
 * 变量定义在 index.css 的 `:root`（浅色）与 `html[data-theme="dark"]`（深色），
 * 文档根上的 CSS 变量会继承进每个页面组件的 shadow DOM——因此一次切换
 * 即可让全部 17 个页面同时换肤（这正是把变量从各页 :host 迁到根节点的原因）。
 *
 * 模式：light / dark / system（跟随系统偏好，实时响应变化）。
 */

export type ThemeMode = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

const THEME_KEY = 'sx:theme'
const listeners = new Set<(mode: ThemeMode, resolved: ResolvedTheme) => void>()
let media: MediaQueryList | null = null

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === 'system') return systemPrefersDark() ? 'dark' : 'light'
  return mode
}

export function getThemeMode(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved
  } catch {
    /* 存储不可用 */
  }
  return 'light'
}

export function getResolvedTheme(): ResolvedTheme {
  return resolveTheme(getThemeMode())
}

function notify(mode: ThemeMode, resolved: ResolvedTheme): void {
  for (const listener of listeners) listener(mode, resolved)
}

function apply(mode: ThemeMode): void {
  const resolved = resolveTheme(mode)
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = resolved
    document.documentElement.style.colorScheme = resolved
  }
  notify(mode, resolved)
}

/** 设置并持久化主题模式 */
export function setThemeMode(mode: ThemeMode): void {
  try {
    localStorage.setItem(THEME_KEY, mode)
  } catch {
    /* 忽略 */
  }
  apply(mode)
}

/** 在浅色/深色间切换（system 视为当前解析结果的反面），返回切换后的解析主题 */
export function toggleTheme(): ResolvedTheme {
  const next: ResolvedTheme = getResolvedTheme() === 'dark' ? 'light' : 'dark'
  setThemeMode(next)
  return next
}

/** 订阅主题变化（返回退订函数） */
export function onThemeChange(listener: (mode: ThemeMode, resolved: ResolvedTheme) => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** 应用启动时调用：恢复上次选择 + 监听系统偏好变化（system 模式实时切换） */
export function initTheme(): void {
  apply(getThemeMode())
  if (typeof window === 'undefined' || media) return
  media = window.matchMedia('(prefers-color-scheme: dark)')
  media.addEventListener('change', () => {
    if (getThemeMode() === 'system') apply('system')
  })
}

/**
 * 页面级主题绑定：把解析后的主题同步到页面自身的 state
 * （用于仍带 `[data-theme='dark']` 局部规则的页面）。
 * 立即回调一次当前值，之后每次全局切换都会回调。
 */
export function bindPageTheme(apply: (resolved: ResolvedTheme) => void): () => void {
  apply(getResolvedTheme())
  return onThemeChange((_mode, resolved) => apply(resolved))
}
