/**
 * @sheetx/editors - 编辑器公共工具
 *
 * 所有内置编辑器共享的：输入元素样式、Enter/Esc/Blur 生命周期接线、
 * IME 安全的键盘处理。样式用内联 + 类名（sx-editor-*）——引擎自足可用，
 * UI 层可通过类名覆盖主题。
 */

import type { EditorContext, EditorHandle } from './types.js'

/** 输入元素基础样式（与画布文字视觉衔接） */
const INPUT_BASE_STYLE: Partial<CSSStyleDeclaration> = {
  position: 'absolute',
  boxSizing: 'border-box',
  margin: '0',
  padding: '2px 6px',
  border: '2px solid var(--sx-color-active-border, #1a73e8)',
  borderRadius: '0',
  background: 'var(--sx-color-editor-bg, #fff)',
  color: 'var(--sx-color-text, #333)',
  font: "13px 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
  outline: 'none',
  zIndex: '10',
}

/** 定位编辑器到单元格矩形（宿主容器坐标系） */
export function positionEditor(el: HTMLElement, ctx: EditorContext, minWidth = 80): void {
  el.style.left = `${ctx.rect.x}px`
  el.style.top = `${ctx.rect.y}px`
  el.style.width = `${Math.max(ctx.rect.width, minWidth)}px`
  el.style.height = `${Math.max(ctx.rect.height, 24)}px`
}

export interface CommonKeysOptions {
  /** Enter 提交（IME 安全：composing 中自动忽略） */
  onEnter?: () => void
  /** Esc 取消 */
  onEscape?: () => void
  /** Tab 提交并移动（direction: 1 右 / -1 左） */
  onTab?: (direction: 1 | -1) => void
  /** 失焦行为：'commit' 提交 / 'cancel' 取消 / 'none' 忽略 / 自定义回调 */
  onBlur?: 'commit' | 'cancel' | 'none' | (() => void)
}

/**
 * 接线通用键盘生命周期。
 * 返回一个 detach 函数（destroy 时调用）。
 *
 * IME 安全关键点：keydown 里先问 imeGuard.shouldSuppressKeyEvent——
 * composing 期间的 Enter/Tab/Esc 全部吞掉，这是「中文输入不误提交」的唯一保障。
 */
export function attachCommonKeys(el: HTMLElement, ctx: EditorContext, options: CommonKeysOptions): () => void {
  const keydown = (event: KeyboardEvent): void => {
    if (ctx.imeGuard.shouldSuppressKeyEvent(event)) {
      event.preventDefault()
      return
    }
    // Alt+Enter：在单元格值中插入换行（Excel 习惯），不提交、不导航
    if (event.key === 'Enter' && event.altKey && !event.ctrlKey && !event.metaKey) {
      event.preventDefault()
      event.stopPropagation()
      if (el instanceof HTMLTextAreaElement) {
        const start = el.selectionStart ?? el.value.length
        const end = el.selectionEnd ?? start
        el.value = `${el.value.slice(0, start)}\n${el.value.slice(end)}`
        el.selectionStart = el.selectionEnd = start + 1
        el.dispatchEvent(new Event('input', { bubbles: true }))
      } else if (el instanceof HTMLInputElement) {
        // input 无法可视化换行：提交带换行的值，下次进入编辑由渲染器显示为多行
        ctx.commit(`${el.value}\n`, undefined, { move: 'down' })
      }
      return
    }
    if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.altKey) {
      if (options.onEnter) {
        event.preventDefault()
        // 必须阻止冒泡：提交会退出编辑态，事件若继续冒泡到容器键位表，
        // 会再触发一次 Enter 导航，表现为「提交后跳两格」。
        event.stopPropagation()
        options.onEnter()
      }
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      options.onEscape?.()
      return
    }
    if (event.key === 'Tab') {
      event.preventDefault()
      event.stopPropagation()
      options.onTab?.(event.shiftKey ? -1 : 1)
      return
    }
  }

  const blur = (): void => {
    const behavior = options.onBlur
    if (behavior === 'commit') ctx.commit(readValue(el, ctx))
    else if (behavior === 'cancel') ctx.cancel()
    else if (typeof behavior === 'function') behavior()
  }

  el.addEventListener('keydown', keydown)
  if (options.onBlur && options.onBlur !== 'none') el.addEventListener('blur', blur)
  return () => {
    el.removeEventListener('keydown', keydown)
    el.removeEventListener('blur', blur)
  }
}

/** 读输入元素当前值（按编辑器类型解析为 CellValue；基类按字符串处理） */
export function readValue(el: HTMLElement, _ctx: EditorContext): string {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return el.value
  return el.textContent ?? ''
}

/** 构造基础输入元素 */
export function createInputElement(type: string, ctx: EditorContext, initial: string): HTMLInputElement {
  const input = document.createElement('input')
  input.type = type
  input.className = 'sx-editor-input'
  input.value = initial
  input.spellcheck = false
  Object.assign(input.style, INPUT_BASE_STYLE)
  // IME 守卫接线：所有内置编辑器共用这一行——忘掉它就是 Luckysheet 的中文灾难
  ctx.imeGuard.attach(input)
  return input
}

/** 构造句柄的公共部分（focus/mount 延迟聚焦） */
export function makeHandle(el: HTMLElement, extra: Partial<EditorHandle> = {}): EditorHandle {
  return {
    el,
    mount() {
      // requestAnimationFrame：确保布局完成后再聚焦，避免焦点闪烁
      requestAnimationFrame(() => el.focus())
    },
    focus() {
      el.focus()
    },
    destroy() {
      el.remove()
    },
    ...extra,
  }
}

/** 数字解析（number/currency 共用）：去千分位、货币符号、全角空格；非法返回 null */
export function parseNumeric(text: string, params: { thousand?: boolean; prefix?: string }): number | null {
  let cleaned = text.trim()
  if (params.prefix && cleaned.startsWith(params.prefix)) cleaned = cleaned.slice(params.prefix.length)
  if (params.thousand !== false) cleaned = cleaned.replaceAll(',', '')
  cleaned = cleaned.replaceAll('\u00a0', '').trim()
  if (cleaned === '' || cleaned === '-') return null
  const num = Number(cleaned)
  return Number.isNaN(num) ? null : num
}

/** 千分位格式化（currency 编辑器显示用） */
export function formatThousand(value: number, precision?: number): string {
  const fixed = precision !== undefined ? value.toFixed(precision) : String(value)
  const [intPart, decimalPart] = fixed.split('.')
  const withComma = intPart!.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return decimalPart !== undefined ? `${withComma}.${decimalPart}` : withComma
}
