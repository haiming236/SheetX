/**
 * @sheetx/interaction - 输入控制器（门面）
 *
 * 把键盘/指针/剪贴板/选区/状态机/IME 组装成一个.attach() 即用的整体。
 * 所有语义输出（命令、编辑请求、选区变化）都走 InteractionCallbacks——
 * interaction 与数据层零耦合，Grid 与 Spreadsheet 共用。
 *
 * 键盘事件入口 handleKeydown 的三段式守卫顺序不可颠倒：
 *   1) IME 抑制（composing 中的键全部吞掉——丢字/误提交的防波堤）
 *   2) 编辑态放行（编辑器拥有键盘，容器键位表不参与）
 *   3) 键位表匹配
 */

import { ClipboardController } from './clipboard.js'
import { InteractionStateMachine } from './fsm.js'
import { ImeGuard } from './ime.js'
import { Keymap } from './keymap.js'
import type { KeyEventLike, KeyContext } from './keymap.js'
import { PointerController } from './pointer.js'
import { SelectionModel } from './selection.js'
import { createDefaultKeyBindings } from './default-keymap.js'
import { InteractionState } from './types.js'
import type { InteractionCallbacks } from './types.js'

export class InputController {
  readonly selection = new SelectionModel()
  readonly ime = new ImeGuard()
  readonly stateMachine = new InteractionStateMachine()
  readonly keymap = new Keymap()
  private readonly pointer = new PointerController()
  private readonly clipboard = new ClipboardController()
  private container: HTMLElement | null = null
  private callbacks: InteractionCallbacks | null = null

  /** 选区变化 → 宿主回调（OPERATION 事件，不进 undo） */
  private selectionListener = (): void => {
    if (!this.callbacks) return
    this.callbacks.onSelectionChange(this.selection.getRanges(), this.selection.getActiveIndex())
  }

  attach(container: HTMLElement, callbacks: InteractionCallbacks): void {
    this.detach()
    this.container = container
    this.callbacks = callbacks
    // 容器必须可聚焦才能接收键盘事件（grid 创建自己的 root，此处兜底）
    if (container.tabIndex < 0) container.tabIndex = 0

    this.selection.setChangeListener(this.selectionListener)
    this.selection.bounds = { rowCount: callbacks.getRowCount(), colCount: callbacks.getColCount() }

    // 默认键位（宿主可在 attach 后用 this.keymap.register 插队/覆盖）
    for (const binding of createDefaultKeyBindings({ callbacks, selection: this.selection })) {
      this.keymap.register(binding)
    }

    container.addEventListener('keydown', this.handleKeydown)
    container.addEventListener('mousedown', this.preventFocusLoss)
    this.pointer.attach(container, callbacks, this.selection, this.stateMachine)
    this.clipboard.attach(container, {
      getCopyData: () => callbacks.getCopyData(),
      getPasteTarget: () => this.selection.getFocusCell(),
      onPaste: (matrix, meta) => {
        const target = this.selection.getFocusCell() ?? { row: 0, col: 0 }
        callbacks.onCommand({ id: 'grid.command.paste', params: { matrix, target, format: meta.format } })
      },
      onCut: () => {
        const ranges = this.selection.getRanges()
        callbacks.onCommand({ id: 'grid.command.clear-cells', params: { ranges: [...ranges] } })
      },
    })
  }

  detach(): void {
    if (!this.container) return
    this.container.removeEventListener('keydown', this.handleKeydown)
    this.container.removeEventListener('mousedown', this.preventFocusLoss)
    this.pointer.detach()
    this.clipboard.detach()
    this.selection.setChangeListener(null)
    this.keymap.unregisterAll()
    this.container = null
    this.callbacks = null
  }

  // ---- 编辑态管理（grid 编辑控制器调用） ----

  beginEditing(): void {
    this.stateMachine.transition(InteractionState.EDITING, 'edit-start')
  }

  beginComposing(): void {
    this.stateMachine.transition(InteractionState.IME_COMPOSING, 'composition-start')
  }

  endComposing(): void {
    this.stateMachine.transition(InteractionState.EDITING, 'composition-end')
  }

  endEditing(): void {
    this.stateMachine.transition(InteractionState.IDLE, 'edit-end')
  }

  /** 数据行/列数变化后同步选区边界（grid 在 insert/delete 后调用） */
  syncBounds(rowCount: number, colCount: number): void {
    this.selection.bounds = { rowCount, colCount }
    this.selection.clampToBounds()
  }

  /**
   * 键盘事件统一入口（容器 keydown 与编辑器转发都走这里）。
   *
   * 必须是箭头函数字段：本方法直接作为 `container.addEventListener('keydown', this.handleKeydown)`
   * 的监听器，原型方法会以容器元素为 this 调用，导致 `this.callbacks` 为 undefined、
   * 整个键位表静默失效（方向键/Tab/Enter/Home/End/Ctrl+A 全部无反应）。
   */
  handleKeydown = (event: KeyEventLike): boolean => {
    const callbacks = this.callbacks
    if (!callbacks) return false

    // 1) IME 抑制：组合过程中的按键一律吞掉（含 keyCode 229）
    if (this.ime.shouldSuppressKeyEvent(event)) {
      event.preventDefault()
      return true
    }
    // 2) 编辑态：键盘归编辑器，容器键位表不参与
    if (this.stateMachine.isEditing()) return false

    // 3) 键位表
    const ctx: KeyContext = { event, imeGuard: this.ime, state: this.stateMachine.state }
    const handled = this.keymap.handle(event, ctx)
    if (handled) event.preventDefault()
    return handled
  }

  /** 编辑器把自身的键盘事件转发进来（如 Ctrl+Z 在编辑态下提交后撤销） */
  forwardEditorKeydown(event: KeyEventLike): boolean {
    return this.handleKeydown(event)
  }

  getCopyData(): { text: string; html?: string } | null {
    return this.callbacks?.getCopyData() ?? null
  }

  private preventFocusLoss = (event: MouseEvent): void => {
    // 在引擎区域按下鼠标时保持键盘焦点在容器上（否则 Tab 导航会丢焦点）
    if (this.container && document.activeElement !== this.container) {
      this.container.focus({ preventScroll: true })
    }
    void event
  }
}
