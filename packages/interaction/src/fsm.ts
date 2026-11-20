/**
 * @sheetx/interaction - 交互状态机
 *
 * 正式方案（L362-371）的显式 FSM 落地。为什么必须显式状态机——
 * Luckysheet 用 20+ 个散落 store 的布尔位当状态机，手势流程无法追踪、
 * 状态组合爆炸出各类错位 bug（见《开源项目源码研究报告.md》教训 #1/#9）。
 *
 * 这里做的是「记录 + 校验 + 可观测」：转移表约束合法路径，
 * 非法转移抛错（开发期暴露逻辑漏洞），提供转移历史供调试。
 */

import { InteractionState } from './types.js'
import type { InteractionStateValue } from './types.js'

/** 合法转移表：from → 允许的 to 集合 */
const TRANSITIONS: Record<InteractionStateValue, ReadonlyArray<InteractionStateValue>> = {
  [InteractionState.IDLE]: [InteractionState.SELECTING, InteractionState.EDITING, InteractionState.DRAGGING, InteractionState.RESIZING],
  [InteractionState.SELECTING]: [InteractionState.IDLE, InteractionState.EDITING, InteractionState.DRAGGING, InteractionState.RESIZING],
  [InteractionState.EDITING]: [InteractionState.IDLE, InteractionState.IME_COMPOSING],
  [InteractionState.IME_COMPOSING]: [InteractionState.EDITING, InteractionState.IDLE],
  [InteractionState.DRAGGING]: [InteractionState.IDLE, InteractionState.SELECTING],
  [InteractionState.RESIZING]: [InteractionState.IDLE],
}

export interface StateTransition {
  from: InteractionStateValue
  to: InteractionStateValue
  /** 触发原因（调试用）：'mouse-down' / 'edit-start' / 'composition-start'…… */
  reason: string
  at: number
}

export class InteractionStateMachine {
  private current: InteractionStateValue = InteractionState.IDLE
  private history: StateTransition[] = []
  private changeListener: ((state: InteractionStateValue, previous: InteractionStateValue) => void) | null = null

  get state(): InteractionStateValue {
    return this.current
  }

  setChangeListener(listener: ((state: InteractionStateValue, previous: InteractionStateValue) => void) | null): void {
    this.changeListener = listener
  }

  /**
   * 转移状态。非法转移抛错——与其静默进入错误状态，不如开发期炸出来。
   * reason 是强制参数：每个转移都必须能回答「为什么」。
   */
  transition(to: InteractionStateValue, reason: string): void {
    if (to === this.current) return
    const allowed = TRANSITIONS[this.current] ?? []
    if (!allowed.includes(to)) {
      throw new Error(
        `[SheetX] 非法的交互状态转移: ${this.current} → ${to}（原因: ${reason}）。` +
          `允许的目标: ${allowed.join(', ')}`,
      )
    }
    const from = this.current
    this.current = to
    this.history.push({ from, to, reason, at: Date.now() })
    if (this.history.length > 50) this.history.shift()
    this.changeListener?.(to, from)
  }

  isEditing(): boolean {
    return this.current === InteractionState.EDITING || this.current === InteractionState.IME_COMPOSING
  }

  isBusy(): boolean {
    return this.current !== InteractionState.IDLE
  }

  /** 最近 N 条转移（调试面板用） */
  getHistory(): readonly StateTransition[] {
    return this.history
  }

  reset(): void {
    this.current = InteractionState.IDLE
  }
}
