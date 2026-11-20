/**
 * @sheetx/interaction - IME 守卫（SheetX 中文第一差异化的核心组件）
 *
 * 任务书 T3 的 P0 要求：compositionstart/update/end 全程处理，
 * composing 期间绝不提交、绝不响应 Enter 跳格，兼容 keyCode 229。
 *
 * 本组件沉淀了三个项目踩坑换来的语义（《开源项目源码研究报告.md》§05）：
 * 1. Univer：composition 文本进命令体系（可撤销的最小步）；
 *    compositionend 时文本与上一次相同 = 用户取消了候选词 → 视为取消；
 *    隐藏 input 必须锚定单元格屏幕坐标（OS 候选词窗口跟随焦点元素）。
 * 2. Luckysheet/FS：没有 composition 处理，只靠 keyCode 229 短路 + 延迟重写
 *    innerHTML 苟活——这就是「中文丢字/重复字」类 bug 的根源，反例。
 *
 * 使用方式（编辑器宿主）：
 *   const guard = new ImeGuard()
 *   guard.attach(inputElement)
 *   // 键盘入口：
 *   if (guard.shouldSuppressKeyEvent(e)) { e.preventDefault(); return }
 *   // 提交入口：
 *   if (guard.isComposing()) return  // 绝不提交
 */

export interface ImeGuardOptions {
  /** 状态变化回调（编辑器 UI 可据此显示「输入中」状态） */
  onStateChange?: (composing: boolean) => void
  /** compositionend 回调（参数：是否被用户取消） */
  onCompositionEnd?: (canceled: boolean) => void
}

export class ImeGuard {
  private composing = false
  private currentText = ''
  /** 上一次成功结束的组合文本（跨组合比较的取消判定基准） */
  private lastEndedText = ''
  /** compositionend 后置位的「取消」标记（消费一次后清除） */
  private canceledFlag = false
  private target: HTMLElement | null = null
  private options: ImeGuardOptions

  /** 组合过程中的最终文本（编辑器实时同步候选串用） */
  get compositionText(): string {
    return this.currentText
  }

  constructor(options: ImeGuardOptions = {}) {
    this.options = options
  }

  /** 绑定到输入元素（通常由编辑器在挂载时调用） */
  attach(target: HTMLElement): void {
    this.detach()
    this.target = target
    target.addEventListener('compositionstart', this.handleStart)
    target.addEventListener('compositionupdate', this.handleUpdate)
    target.addEventListener('compositionend', this.handleEnd)
  }

  detach(): void {
    if (!this.target) return
    this.target.removeEventListener('compositionstart', this.handleStart)
    this.target.removeEventListener('compositionupdate', this.handleUpdate)
    this.target.removeEventListener('compositionend', this.handleEnd)
    this.target = null
    this.reset()
  }

  isComposing(): boolean {
    return this.composing
  }

  /**
   * 取消判定：compositionend 文本与**上一次成功结束的组合文本**相同
   * ——用户 Esc 取消后立即重新输入相同串的场景（跨组合比较；同一组合内
   * end 必然等于最后一次 update，所以不能在组合内比较）。结果只消费一次。
   */
  wasCanceled(): boolean {
    const canceled = this.canceledFlag
    this.canceledFlag = false
    return canceled
  }

  /**
   * 键盘事件守卫。返回 true = 该事件来自 IME 组合过程，宿主必须吞掉：
   * - e.isComposing：标准属性（Safari/Chrome 均支持）
   * - keyCode === 229：老式 IME 合成键标记（微软拼音/搜狗在 Windows 上广泛出现）
   */
  shouldSuppressKeyEvent(event: { isComposing?: boolean; keyCode?: number }): boolean {
    if (this.composing) return true
    if (event.isComposing) return true
    if (event.keyCode === 229) return true
    return false
  }

  reset(): void {
    this.composing = false
    this.currentText = ''
    this.canceledFlag = false
  }

  private handleStart = (event: CompositionEvent): void => {
    event.stopPropagation()
    this.composing = true
    this.currentText = ''
    this.options.onStateChange?.(true)
  }

  private handleUpdate = (event: CompositionEvent): void => {
    event.stopPropagation()
    this.currentText = event.data ?? ''
  }

  private handleEnd = (event: CompositionEvent): void => {
    event.stopPropagation()
    const finalText = event.data ?? this.currentText
    // 取消判定 = 与上一次成功结束的文本相同（跨组合）
    const canceled = finalText === this.lastEndedText && finalText !== ''
    this.lastEndedText = finalText
    this.composing = false
    this.currentText = finalText
    this.canceledFlag = canceled
    this.options.onStateChange?.(false)
    this.options.onCompositionEnd?.(canceled)
  }
}
