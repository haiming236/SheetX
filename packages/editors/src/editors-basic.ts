/**
 * @sheetx/editors - 基础编辑器集
 *
 * text / multiline / number / currency / date / datetime / boolean / switch
 * 八个轻量编辑器。共同特征：
 * - Enter 提交、Esc 取消、失焦提交（Excel 语义）；
 * - 全部经过 IME 守卫接线（createInputElement 内统一处理）；
 * - 数字类编辑器只在**提交时**解析——输入过程中不做转换，避免打断 IME 与输入节奏。
 */

import type { CommitMeta, EditorContext, EditorFactory, EditorHandle } from './types.js'
import {
  attachCommonKeys,
  createInputElement,
  formatThousand,
  makeHandle,
  parseNumeric,
  positionEditor,
} from './base.js'

/** 文本编辑器：单行输入，选中既有内容（Excel 语义） */
export const TextEditor: EditorFactory = (ctx: EditorContext): EditorHandle => {
  const initial = ctx.displayValue !== '' ? ctx.displayValue : (ctx.value === null || ctx.value === undefined ? '' : String(ctx.value))
  const input = createInputElement('text', ctx, initial)
  positionEditor(input, ctx)
  const detachKeys = attachCommonKeys(input, ctx, {
    onEnter: () => ctx.commit(input.value, undefined, { move: 'down' }),
    onEscape: () => ctx.cancel(),
    onTab: (direction) => ctx.commit(input.value, undefined, { move: direction === 1 ? 'right' : 'left' }),
    onBlur: 'commit',
  })
  return makeHandle(input, {
    mount() {
      requestAnimationFrame(() => {
        input.focus()
        input.select() // Excel：进入编辑即全选原值，直接打字覆盖
      })
    },
    destroy() {
      detachKeys()
      input.remove()
    },
  })
}

/** 多行文本编辑器：textarea；Enter 换行，Ctrl+Enter 提交，Esc 取消 */
export const MultilineEditor: EditorFactory = (ctx: EditorContext): EditorHandle => {
  const initial = ctx.displayValue !== '' ? ctx.displayValue : String(ctx.value ?? '')
  const textarea = document.createElement('textarea')
  textarea.className = 'sx-editor-textarea'
  textarea.value = initial
  textarea.spellcheck = false
  textarea.style.cssText = [
    'position:absolute', 'box-sizing:border-box', 'margin:0', 'padding:2px 6px',
    'border:2px solid var(--sx-color-active-border, #1a73e8)', 'background:var(--sx-color-editor-bg, #fff)',
    'color:var(--sx-color-text, #333)', 'font:13px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
    'outline:none', 'resize:none', 'z-index:10',
  ].join(';')
  ctx.imeGuard.attach(textarea)
  positionEditor(textarea, ctx, 160)
  textarea.style.height = `${Math.max(ctx.rect.height, 24) * 3}px` // 三行起步

  const detachKeys = attachCommonKeys(textarea, ctx, {
    // 注意：不传 onEnter——裸 Enter 保留 textarea 默认换行行为，Ctrl+Enter 由下方 ctrlEnter 提交
    onEscape: () => ctx.cancel(),
    onBlur: 'commit',
    onTab: (direction) => ctx.commit(textarea.value, undefined, { move: direction === 1 ? 'right' : 'left' }),
  })
  // 裸 Enter = 换行（textarea 默认行为），Ctrl+Enter = 提交
  const ctrlEnter = (event: KeyboardEvent): void => {
    if (ctx.imeGuard.shouldSuppressKeyEvent(event)) return
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault()
      ctx.commit(textarea.value, undefined, { move: 'down' })
    }
  }
  textarea.addEventListener('keydown', ctrlEnter)

  return makeHandle(textarea, {
    mount() {
      requestAnimationFrame(() => textarea.focus())
    },
    destroy() {
      detachKeys()
      textarea.removeEventListener('keydown', ctrlEnter)
      textarea.remove()
    },
  })
}

export interface NumberEditorParams {
  /** 小数位数（undefined = 不限制） */
  precision?: number
  min?: number
  max?: number
}

/** 数字编辑器：提交时解析与校验，非法则保持打开（红框提示），绝不静默写错值 */
export const NumberEditor: EditorFactory = (ctx: EditorContext): EditorHandle => {
  const params = ctx.params as NumberEditorParams
  const input = createInputElement('text', ctx, ctx.displayValue)
  positionEditor(input, ctx, 100)
  input.inputMode = 'decimal'

  const commitOrReject = (meta?: CommitMeta): void => {
    const num = parseNumeric(input.value, {})
    if (num === null) {
      if (input.value.trim() === '') {
        ctx.commit(null, undefined, meta) // 清空 = 写 null
        return
      }
      input.style.borderColor = 'var(--sx-color-error, #d93025)'
      return // 保持打开，等用户修正
    }
    let value = num
    if (params.precision !== undefined) value = Number(value.toFixed(params.precision))
    if (params.min !== undefined && value < params.min) value = params.min
    if (params.max !== undefined && value > params.max) value = params.max
    ctx.commit(value, undefined, meta)
  }

  const detachKeys = attachCommonKeys(input, ctx, {
    onEnter: () => commitOrReject({ move: 'down' }),
    onEscape: () => ctx.cancel(),
    onTab: (direction) => commitOrReject({ move: direction === 1 ? 'right' : 'left' }),
    onBlur: () => {
      const num = parseNumeric(input.value, {})
      if (num !== null || input.value.trim() === '') commitOrReject()
      else ctx.cancel() // 失焦时非法输入直接放弃（不打断用户流向）
    },
  })
  return makeHandle(input, {
    mount() {
      requestAnimationFrame(() => {
        input.focus()
        input.select()
      })
    },
    destroy() {
      detachKeys()
      input.remove()
    },
  })
}

export interface CurrencyEditorParams extends NumberEditorParams {
  /** 货币符号，默认 '¥' */
  symbol?: string
}

/** 金额编辑器：¥ 前缀 + 千分位显示；提交值为数字 */
export const CurrencyEditor: EditorFactory = (ctx: EditorContext): EditorHandle => {
  const params = ctx.params as CurrencyEditorParams
  const symbol = params.symbol ?? '¥'
  const input = createInputElement('text', ctx, ctx.displayValue)
  positionEditor(input, ctx, 120)
  input.inputMode = 'decimal'
  input.style.textAlign = 'right'

  const commitOrReject = (meta?: CommitMeta): void => {
    const num = parseNumeric(input.value, { thousand: true, prefix: symbol })
    if (num === null) {
      if (input.value.trim() === '' || input.value.trim() === symbol) {
        ctx.commit(null, undefined, meta)
        return
      }
      input.style.borderColor = 'var(--sx-color-error, #d93025)'
      return
    }
    let value = num
    if (params.precision !== undefined) value = Number(value.toFixed(params.precision))
    if (params.min !== undefined && value < params.min) value = params.min
    if (params.max !== undefined && value > params.max) value = params.max
    ctx.commit(value, undefined, meta)
  }

  const detachKeys = attachCommonKeys(input, ctx, {
    onEnter: () => commitOrReject({ move: 'down' }),
    onEscape: () => ctx.cancel(),
    onTab: (direction) => commitOrReject({ move: direction === 1 ? 'right' : 'left' }),
    onBlur: 'commit',
  })
  return makeHandle(input, {
    mount() {
      requestAnimationFrame(() => {
        input.focus()
        input.select()
      })
    },
    destroy() {
      detachKeys()
      input.remove()
    },
  })
}

export { formatThousand }

/** 日期编辑器：原生 input[type=date]（引擎不自带日历 UI，UI 层可覆盖样式/替换实现） */
export const DateEditor: EditorFactory = (ctx: EditorContext): EditorHandle => {
  const input = createInputElement('date', ctx, toIsoDate(ctx.value))
  positionEditor(input, ctx, 130)
  const detachKeys = attachCommonKeys(input, ctx, {
    onEnter: () => ctx.commit(input.value === '' ? null : input.value, undefined, { move: 'down' }),
    onEscape: () => ctx.cancel(),
    onTab: (direction) => ctx.commit(input.value === '' ? null : input.value, undefined, { move: direction === 1 ? 'right' : 'left' }),
    onBlur: 'commit',
  })
  return makeHandle(input, {
    mount() {
      requestAnimationFrame(() => input.focus())
    },
    destroy() {
      detachKeys()
      input.remove()
    },
  })
}

/** 日期时间编辑器：input[type=datetime-local] */
export const DatetimeEditor: EditorFactory = (ctx: EditorContext): EditorHandle => {
  const input = createInputElement('datetime-local', ctx, toIsoDateTime(ctx.value))
  positionEditor(input, ctx, 190)
  const detachKeys = attachCommonKeys(input, ctx, {
    onEnter: () => ctx.commit(input.value === '' ? null : input.value, undefined, { move: 'down' }),
    onEscape: () => ctx.cancel(),
    onBlur: 'commit',
    onTab: (direction) => ctx.commit(input.value === '' ? null : input.value, undefined, { move: direction === 1 ? 'right' : 'left' }),
  })
  return makeHandle(input, {
    mount() {
      requestAnimationFrame(() => input.focus())
    },
    destroy() {
      detachKeys()
      input.remove()
    },
  })
}

/** 布尔编辑器：checkbox，点击/空格即提交（Excel 语义：勾选立即生效） */
export const BooleanEditor: EditorFactory = (ctx: EditorContext): EditorHandle => {
  const wrap = document.createElement('label')
  wrap.className = 'sx-editor-boolean'
  wrap.style.cssText = 'position:absolute;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:10'
  wrap.style.left = `${ctx.rect.x}px`
  wrap.style.top = `${ctx.rect.y}px`
  wrap.style.width = `${ctx.rect.width}px`
  wrap.style.height = `${ctx.rect.height}px`
  const checkbox = document.createElement('input')
  checkbox.type = 'checkbox'
  checkbox.checked = ctx.value === true || ctx.value === 'true'
  checkbox.style.width = '14px'
  checkbox.style.height = '14px'
  wrap.appendChild(checkbox)
  ctx.imeGuard.attach(checkbox)

  const commitNow = (meta?: CommitMeta): void => ctx.commit(checkbox.checked, undefined, meta)
  // Excel：点击 checkbox 立即提交并关闭编辑器（点击不移动焦点）
  checkbox.addEventListener('change', () => commitNow())
  const detachKeys = attachCommonKeys(checkbox, ctx, {
    onEscape: () => ctx.cancel(),
    onBlur: 'none',
    onEnter: () => commitNow({ move: 'down' }),
    onTab: (direction) => commitNow({ move: direction === 1 ? 'right' : 'left' }),
  })
  return makeHandle(wrap, {
    mount() {
      requestAnimationFrame(() => checkbox.focus())
    },
    focus() {
      checkbox.focus()
    },
    destroy() {
      detachKeys()
      wrap.remove()
    },
  })
}

/** 开关编辑器：switch 形态的布尔（提交值仍是 boolean） */
export const SwitchEditor: EditorFactory = (ctx: EditorContext): EditorHandle => {
  const wrap = document.createElement('button')
  wrap.type = 'button'
  wrap.className = 'sx-editor-switch'
  const isOn = ctx.value === true || ctx.value === 'true'
  wrap.style.cssText = [
    'position:absolute', 'cursor:pointer', 'border:none', 'z-index:10',
    'width:36px', 'height:18px', 'border-radius:9px',
    'background: var(--sx-color-active-border, #1a73e8)', 'position:absolute',
    'left:' + `${ctx.rect.x + Math.max(0, (ctx.rect.width - 36) / 2)}px`,
    'top:' + `${ctx.rect.y + Math.max(0, (ctx.rect.height - 18) / 2)}px`,
    isOn ? '' : 'background: var(--sx-color-border, #ccc)',
  ].join(';')
  wrap.setAttribute('role', 'switch')
  wrap.setAttribute('aria-checked', String(isOn))
  ctx.imeGuard.attach(wrap)

  const toggle = (meta?: CommitMeta): void => ctx.commit(!isOn, undefined, meta)
  wrap.addEventListener('click', () => toggle())
  const detachKeys = attachCommonKeys(wrap, ctx, {
    onEnter: () => toggle({ move: 'down' }),
    onEscape: () => ctx.cancel(),
    onBlur: 'none',
    onTab: (direction) => toggle({ move: direction === 1 ? 'right' : 'left' }),
  })
  return makeHandle(wrap, {
    mount() {
      requestAnimationFrame(() => wrap.focus())
    },
    focus() {
      wrap.focus()
    },
    destroy() {
      detachKeys()
      wrap.remove()
    },
  })
}

// ---------------------------------------------------------------------------
// 工具
// ---------------------------------------------------------------------------

/** 值 → ISO 日期串（yyyy-MM-dd）；支持 Date、Excel 序列、ISO 字符串 */
export function toIsoDate(value: unknown): string {
  if (value === null || value === undefined || value === '') return ''
  if (typeof value === 'string') return value.slice(0, 10)
  if (typeof value === 'number') return serialToIsoDate(value)
  if (value instanceof Date) return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
  return ''
}

function toIsoDateTime(value: unknown): string {
  if (typeof value === 'string' && value.includes('T')) return value.slice(0, 16)
  const isoDate = toIsoDate(value)
  return isoDate === '' ? '' : `${isoDate}T00:00`
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** Excel 日期序列 → ISO（1900 日期系统：序列 1 = 1899-12-31，含 1900 闰年 bug 兼容） */
export function serialToIsoDate(serial: number): string {
  // Excel 的 1900-02-29（序列 60）是历史 bug；≥61 的序列需要 -1 天补偿。
  // 简化处理：用 1899-12-30 起算（与主流实现一致），不做逐日 bug 兼容——文档说明。
  const ms = Date.UTC(1899, 11, 30) + serial * 86400000
  const date = new Date(ms)
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}
