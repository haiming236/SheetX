/**
 * @sheetx/interaction - 键位表
 *
 * 设计借鉴 Tabulator Keybindings 的「键位表/动作表分离」与其内部事件总线的
 * 优先级订阅（SelectRange 抢在 Edit 之前处理导航键的机制）：
 * - 绑定按 priority 升序执行，先命中者可返回 'stop' 吞掉事件；
 * - 同一按键允许多个处理器（插件可插队拦截）；
 * - 'printable' 特殊键位匹配「无修饰键的单字符输入」（Excel 直接输入开始编辑的语义）。
 *
 * KeyEventLike：结构化的键盘事件类型（DOM KeyboardEvent 的最小子集）。
 * 用结构类型而非具体 DOM 类型，纯逻辑测试可以直接传普通对象。
 */

import type { ImeGuard } from './ime.js'
import type { InteractionStateValue } from './types.js'

export interface KeyEventLike {
  key: string
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
  altKey: boolean
  keyCode: number
  isComposing: boolean
  preventDefault(): void
  stopPropagation(): void
}

export interface KeyContext {
  event: KeyEventLike
  /** IME 守卫：composing 中的按键必须被吞掉（SheetX 中文体验的第一守则） */
  imeGuard: ImeGuard
  state: InteractionStateValue
}

export type KeyHandlerResult = 'stop' | 'continue'

export interface KeyBinding {
  /** 键位描述：'ctrl+a' / 'shift+enter' / 'f2' / 'escape' / 'printable'；数组表示任意匹配 */
  keys: string | ReadonlyArray<string>
  /** 数字越小越先执行（默认 100） */
  priority?: number
  handler(ctx: KeyContext): KeyHandlerResult
}

interface ParsedKey {
  ctrl: boolean
  meta: boolean
  shift: boolean
  alt: boolean
  key: string
}

function parseKeyCombination(spec: string): ParsedKey {
  const parts = spec.toLowerCase().split('+')
  const key = parts[parts.length - 1]!
  return {
    ctrl: parts.includes('ctrl'),
    meta: parts.includes('meta') || parts.includes('cmd'),
    shift: parts.includes('shift'),
    alt: parts.includes('alt'),
    key,
  }
}

function eventMatches(parsed: ParsedKey, event: KeyEventLike): boolean {
  // ctrl 约定同时接受 Cmd（macOS 习惯，Ctrl/Cmd 差异是任务书 P0 测试项）
  const ctrlOk = parsed.ctrl ? event.ctrlKey || event.metaKey : !(event.ctrlKey || event.metaKey)
  const shiftOk = parsed.shift === event.shiftKey
  const altOk = parsed.alt === event.altKey
  const keyOk = event.key.toLowerCase() === parsed.key
  return ctrlOk && shiftOk && altOk && keyOk
}

/** 无修饰键的单字符可打印输入（Shift 允许——大写/符号） */
function isPrintable(event: KeyEventLike): boolean {
  if (event.ctrlKey || event.metaKey || event.altKey) return false
  return event.key.length === 1
}

export class Keymap {
  private bindings: KeyBinding[] = []

  register(binding: KeyBinding): void {
    this.bindings.push({ priority: 100, ...binding })
    this.bindings.sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100))
  }

  unregisterAll(): void {
    this.bindings.length = 0
  }

  /**
   * 尝试处理一个键盘事件。
   * 返回 true 表示被某绑定消费（宿主应 preventDefault）。
   * 注意：IME composing 中（keyDown keyCode=229 / isComposing）本方法不做任何匹配——
   * 宿主在调用前应先用 ImeGuard.shouldSuppressKeyEvent 拦截。
   */
  handle(event: KeyEventLike, ctx: KeyContext): boolean {
    for (const binding of this.bindings) {
      const specs = Array.isArray(binding.keys) ? binding.keys : [binding.keys]
      let matched = false
      for (const spec of specs) {
        if (spec === 'printable') {
          if (isPrintable(event)) matched = true
          continue
        }
        if (eventMatches(parseKeyCombination(spec), event)) matched = true
      }
      if (!matched) continue
      if (binding.handler(ctx) === 'stop') return true
    }
    return false
  }
}
