/**
 * @sheetx/interaction - 指针控制器
 *
 * 职责：把原生 pointer 事件翻译成「语义手势」，路由给选区/状态机/宿主回调。
 * 布局知识（这个坐标是哪个格子）全部来自 hitTest 回调——本文件零布局知识。
 *
 * 拖动选区的自动滚动：指针接近容器边缘时以 rAF 周期推进 scrollBy，
 * 同时继续 extendTo——这是大表范围选择的必备体验。
 */

import { InteractionState } from './types.js'
import type { CellAddress, CellRange, InteractionCallbacks, Point } from './types.js'
import type { SelectionModel } from './selection.js'
import type { InteractionStateMachine } from './fsm.js'

/** 距容器边缘多少像素开始自动滚动 */
const AUTOSCROLL_EDGE = 24
const AUTOSCROLL_SPEED = 16

interface DragContext {
  kind: 'select' | 'row' | 'col' | 'resize-row' | 'resize-col' | 'fill'
  startPointer: Point
  /** resize 的目标行/列 */
  handleIndex?: number
  /** fill 的源 range */
  fromRange?: CellRange
  lastTarget?: CellAddress | null
}

export class PointerController {
  private container: HTMLElement | null = null
  private callbacks: InteractionCallbacks | null = null
  private selection: SelectionModel | null = null
  private fsm: InteractionStateMachine | null = null
  private drag: DragContext | null = null
  private autoscrollRaf: number | null = null
  private lastPointer: Point = { x: 0, y: 0 }

  attach(
    container: HTMLElement,
    callbacks: InteractionCallbacks,
    selection: SelectionModel,
    fsm: InteractionStateMachine,
  ): void {
    this.detach()
    this.container = container
    this.callbacks = callbacks
    this.selection = selection
    this.fsm = fsm
    container.addEventListener('pointerdown', this.handlePointerDown)
    container.addEventListener('pointermove', this.handlePointerMove)
    container.addEventListener('pointerup', this.handlePointerUp)
    container.addEventListener('pointercancel', this.handlePointerUp)
    container.addEventListener('dblclick', this.handleDblClick)
  }

  /**
   * 指针事件的「容器内视口坐标」。
   *
   * 不能直接用 event.offsetX/offsetY：格子引擎的 DOM 是
   * `root(overflow:hidden) > scrollDiv(overflow:auto) > spacer + canvas(pointer-events:none)`，
   * 鼠标事件的 target 实际是**已滚动的 scrollDiv/spacer**，offsetX/offsetY 里已经含有
   * scrollLeft/scrollTop。布局层的 hitTest 又按视口坐标再叠加一次 scroll——
   * 双重偏移会让滚动后的点击/双击/拖选全部错位 scrollTop/rowHeight 行。
   *
   * 改由 clientX/clientY 减去容器（不滚动的 root）的视口矩形，得到稳定视口坐标。
   */
  private pointFromEvent(event: { clientX: number; clientY: number; offsetX?: number; offsetY?: number }): Point {
    const container = this.container
    if (!container) return { x: event.offsetX ?? 0, y: event.offsetY ?? 0 }
    const rect = container.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  detach(): void {
    if (!this.container) return
    this.container.removeEventListener('pointerdown', this.handlePointerDown)
    this.container.removeEventListener('pointermove', this.handlePointerMove)
    this.container.removeEventListener('pointerup', this.handlePointerUp)
    this.container.removeEventListener('pointercancel', this.handlePointerUp)
    this.container.removeEventListener('dblclick', this.handleDblClick)
    this.stopAutoscroll()
    this.container = null
    this.callbacks = null
    this.selection = null
    this.fsm = null
    this.drag = null
  }

  private handlePointerDown = (event: PointerEvent): void => {
    const callbacks = this.callbacks
    const selection = this.selection
    const fsm = this.fsm
    if (!callbacks || !selection || !fsm || event.button !== 0) return
    // 键盘导航（方向键/Tab/Enter）由容器上的 keydown 接收，必须先把焦点交还容器：
    // 鼠标命中的是内部滚动层，浏览器不会自动把焦点给 root（无法聚焦的 div 会把焦点丢给 body）
    try {
      this.container?.focus({ preventScroll: true })
    } catch {
      /* 老浏览器忽略 */
    }
    const point = this.pointFromEvent(event)
    const target = callbacks.hitTest(point)
    if (!target) return
    this.lastPointer = point

    switch (target.kind) {
      case 'cell': {
        selection.setAnchor(target.row, target.col, { additive: event.ctrlKey || event.metaKey })
        this.drag = { kind: 'select', startPointer: point, lastTarget: { row: target.row, col: target.col } }
        fsm.transition(InteractionState.SELECTING, 'mouse-down')
        break
      }
      case 'rowHeader': {
        selection.selectRows(target.row, target.row)
        this.drag = { kind: 'row', startPointer: point, lastTarget: { row: target.row, col: -1 } }
        fsm.transition(InteractionState.SELECTING, 'row-header-down')
        break
      }
      case 'colHeader': {
        selection.selectCols(target.col, target.col)
        this.drag = { kind: 'col', startPointer: point, lastTarget: { row: -1, col: target.col } }
        fsm.transition(InteractionState.SELECTING, 'col-header-down')
        break
      }
      case 'corner': {
        selection.selectAll()
        fsm.transition(InteractionState.SELECTING, 'corner-down')
        this.drag = null // 全选无需拖动
        return
      }
      case 'colSort': {
        // 列头右侧排序热区：只产出语义命令，排序实现归宿主（引擎）所有
        callbacks.onCommand({
          id: 'grid.command.sort',
          params: { col: target.handleIndex ?? target.col, toggle: true },
        })
        event.preventDefault()
        return
      }
      case 'rowResize':
      case 'colResize': {
        const isRow = target.kind === 'rowResize'
        const handleIndex = target.handleIndex ?? (isRow ? target.row : target.col)
        this.drag = {
          kind: isRow ? 'resize-row' : 'resize-col',
          startPointer: point,
          handleIndex,
        }
        fsm.transition(InteractionState.RESIZING, 'resize-handle-down')
        callbacks.onResize(isRow ? 'row' : 'col', handleIndex, 0, 'start')
        break
      }
      case 'fillHandle': {
        const fromRange = selection.getActiveRange()
        if (!fromRange) return
        this.drag = { kind: 'fill', startPointer: point, fromRange, lastTarget: { row: target.row, col: target.col } }
        fsm.transition(InteractionState.DRAGGING, 'fill-handle-down')
        break
      }
    }

    // pointer capture：拖出容器也能持续收事件
    try {
      this.container?.setPointerCapture(event.pointerId)
    } catch {
      /* 旧浏览器/特殊容器忽略 */
    }
    event.preventDefault()
  }

  private handlePointerMove = (event: PointerEvent): void => {
    const drag = this.drag
    const callbacks = this.callbacks
    if (!drag || !callbacks) return
    const point = this.pointFromEvent(event)
    this.lastPointer = point
    const selection = this.selection

    if (drag.kind === 'resize-row' || drag.kind === 'resize-col') {
      const isRow = drag.kind === 'resize-row'
      const delta = isRow ? point.y - drag.startPointer.y : point.x - drag.startPointer.x
      callbacks.onResize(isRow ? 'row' : 'col', drag.handleIndex!, delta, 'move')
      return
    }

    const target = callbacks.hitTest(point)
    if (!target) return

    switch (drag.kind) {
      case 'select':
        selection?.extendTo(target.row, target.col)
        drag.lastTarget = { row: target.row, col: target.col }
        break
      case 'row':
        selection?.extendToRows(target.row)
        break
      case 'col': {
        // 列拖选：把活动 range 的列对角拉到目标列
        const active = selection?.getActiveRange()
        if (active && selection) {
          selection.selectCols(active.start.col, target.col)
          // selectCols 重置了 anchor——恢复第一列的锚定语义
        }
        break
      }
      case 'fill': {
        if (drag.lastTarget && drag.lastTarget.row === target.row && drag.lastTarget.col === target.col) return
        drag.lastTarget = { row: target.row, col: target.col }
        callbacks.onCommand({
          id: 'grid.command.fill-range',
          params: { fromRange: drag.fromRange, toRow: target.row, toCol: target.col, phase: 'preview' },
        })
        break
      }
    }
    this.startAutoscrollIfNeeded()
  }

  private handlePointerUp = (event: PointerEvent): void => {
    const drag = this.drag
    const callbacks = this.callbacks
    const fsm = this.fsm
    if (!drag || !callbacks || !fsm) return
    try {
      this.container?.releasePointerCapture(event.pointerId)
    } catch {
      /* 忽略 */
    }
    this.stopAutoscroll()

    if (drag.kind === 'resize-row' || drag.kind === 'resize-col') {
      const isRow = drag.kind === 'resize-row'
      const delta = isRow ? this.lastPointer.y - drag.startPointer.y : this.lastPointer.x - drag.startPointer.x
      callbacks.onResize(isRow ? 'row' : 'col', drag.handleIndex!, delta, 'end')
      fsm.transition(InteractionState.IDLE, 'resize-end')
    } else if (drag.kind === 'fill') {
      if (drag.lastTarget && drag.fromRange) {
        callbacks.onCommand({
          id: 'grid.command.fill-range',
          params: { fromRange: drag.fromRange, toRow: drag.lastTarget.row, toCol: drag.lastTarget.col, phase: 'commit' },
        })
      }
      fsm.transition(InteractionState.IDLE, 'fill-end')
    } else {
      // 选区拖动结束
      fsm.transition(InteractionState.IDLE, 'select-end')
    }
    this.drag = null
  }

  private handleDblClick = (event: MouseEvent): void => {
    const callbacks = this.callbacks
    if (!callbacks) return
    const target = callbacks.hitTest(this.pointFromEvent(event))
    if (!target) return
    // 双击行/列边界 = 自适应尺寸（Excel 习惯）
    if (target.kind === 'colResize' || target.kind === 'rowResize') {
      const isCol = target.kind === 'colResize'
      callbacks.onAutoFit?.(isCol ? 'col' : 'row', target.handleIndex ?? (isCol ? target.col : target.row))
      return
    }
    if (target.kind !== 'cell') return
    if (!callbacks.isCellEditable(target.row, target.col)) return
    callbacks.onEditStart(target.row, target.col)
  }

  // ---- 自动滚动 ----

  private startAutoscrollIfNeeded(): void {
    if (this.autoscrollRaf !== null) return
    const step = (): void => {
      const callbacks = this.callbacks
      const drag = this.drag
      if (!callbacks || !drag) {
        this.autoscrollRaf = null
        return
      }
      const container = this.container
      if (!container) return
      const rect = container.getBoundingClientRect()
      const px = this.lastPointer.x
      const py = this.lastPointer.y
      let dx = 0
      let dy = 0
      if (px < AUTOSCROLL_EDGE) dx = -AUTOSCROLL_SPEED
      else if (px > rect.width - AUTOSCROLL_EDGE) dx = AUTOSCROLL_SPEED
      if (py < AUTOSCROLL_EDGE) dy = -AUTOSCROLL_SPEED
      else if (py > rect.height - AUTOSCROLL_EDGE) dy = AUTOSCROLL_SPEED
      if (dx !== 0 || dy !== 0) {
        callbacks.scrollBy(dx, dy)
        // 滚动后继续延伸选区（把指针位置换算出的命中点重新应用）
        const target = callbacks.hitTest({ x: px, y: py })
        if (target && drag.kind === 'select') this.selection?.extendTo(target.row, target.col)
        else if (target && drag.kind === 'row') this.selection?.extendToRows(target.row)
      }
      this.autoscrollRaf = requestAnimationFrame(step)
    }
    this.autoscrollRaf = requestAnimationFrame(step)
  }

  private stopAutoscroll(): void {
    if (this.autoscrollRaf !== null) cancelAnimationFrame(this.autoscrollRaf)
    this.autoscrollRaf = null
  }
}
