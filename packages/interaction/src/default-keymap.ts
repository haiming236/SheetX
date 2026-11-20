/**
 * @sheetx/interaction - 默认键位表
 *
 * Excel 习惯导航语义（任务书 T3 验收标准）。优先级约定：
 *   10  撤销重做（最高——任何状态下都不应被覆盖）
 *   20  全选/行列选择
 *   30  F2 编辑
 *   50  删除
 *  100  导航键（Tab/Enter/方向键/Home/End/PageUp/PageDown）
 *  200  printable 直接输入
 *
 * 复制/剪切/粘贴不在这里——它们由浏览器的 'copy'/'cut'/'paste' 事件驱动
 * （ClipboardController），无需键位拦截。
 */

import { InteractionState } from './types.js'
import type { InteractionCallbacks, SelectionModel } from './types-exports.js'
import type { KeyBinding, KeyContext } from './keymap.js'

export interface DefaultKeymapOptions {
  callbacks: InteractionCallbacks
  selection: SelectionModel
}

/**
 * 构造默认键位绑定。宿主可在此基础上追加/覆盖（register 高优先级绑定）。
 */
export function createDefaultKeyBindings(options: DefaultKeymapOptions): KeyBinding[] {
  const { callbacks, selection } = options
  const editingGuard = (ctx: KeyContext): boolean =>
    ctx.state === InteractionState.EDITING || ctx.state === InteractionState.IME_COMPOSING

  const bindings: KeyBinding[] = []

  // ---- 撤销重做（10）----
  bindings.push({
    keys: ['ctrl+z'],
    priority: 10,
    handler: (ctx) => {
      if (editingGuard(ctx)) return 'continue'
      callbacks.onCommand({ id: 'grid.command.undo', params: {} })
      return 'stop'
    },
  })
  bindings.push({
    keys: ['ctrl+y', 'ctrl+shift+z'],
    priority: 10,
    handler: (ctx) => {
      if (editingGuard(ctx)) return 'continue'
      callbacks.onCommand({ id: 'grid.command.redo', params: {} })
      return 'stop'
    },
  })

  // ---- 选择（20）----
  bindings.push({
    keys: ['ctrl+a'],
    priority: 20,
    handler: (ctx) => {
      if (editingGuard(ctx)) return 'continue'
      selection.selectAll()
      return 'stop'
    },
  })
  bindings.push({
    keys: 'shift+space',
    priority: 20,
    handler: (ctx) => {
      if (editingGuard(ctx)) return 'continue'
      const focus = selection.getFocusCell()
      if (focus) selection.selectRows(focus.row, focus.row)
      return 'stop'
    },
  })
  bindings.push({
    keys: 'ctrl+space',
    priority: 20,
    handler: (ctx) => {
      if (editingGuard(ctx)) return 'continue'
      const focus = selection.getFocusCell()
      if (focus) selection.selectCols(focus.col, focus.col)
      return 'stop'
    },
  })

  // ---- 编辑入口（30）----
  bindings.push({
    keys: 'f2',
    priority: 30,
    handler: (ctx) => {
      if (editingGuard(ctx)) return 'continue'
      const focus = selection.getFocusCell()
      if (focus && callbacks.isCellEditable(focus.row, focus.col)) {
        callbacks.onEditStart(focus.row, focus.col)
        return 'stop'
      }
      return 'continue'
    },
  })
  bindings.push({
    keys: 'printable',
    priority: 200,
    handler: (ctx) => {
      if (editingGuard(ctx)) return 'continue'
      const focus = selection.getFocusCell()
      if (focus && callbacks.isCellEditable(focus.row, focus.col)) {
        // Excel 语义：直接打字 = 开始编辑并以该字符作为初始输入
        callbacks.onEditStart(focus.row, focus.col, { initialChar: ctx.event.key })
        return 'stop'
      }
      return 'continue'
    },
  })

  // ---- 删除（50）----
  bindings.push({
    keys: ['delete', 'backspace'],
    priority: 50,
    handler: (ctx) => {
      if (editingGuard(ctx)) return 'continue'
      const ranges = selection.getRanges()
      if (ranges.length > 0) {
        callbacks.onCommand({ id: 'grid.command.clear-cells', params: { ranges: [...ranges] } })
        return 'stop'
      }
      return 'continue'
    },
  })

  // ---- 导航（100）——Tabulator 教训：不冒泡的导航语义要统一收口 ----
  // 是否扩选由事件自身的 shiftKey 决定：普通方向键「移动」选区（单格），
  // Shift+方向键「扩展」选区。此前把 extend 写死为 true，导致按方向键只是
  // 不断拉大选区、活动格停原地（Excel 语义错误）。
  const nav = (dr: number, dc: number) => ({
    handler: (ctx: KeyContext): 'stop' => {
      if (editingGuard(ctx)) return 'stop' // 编辑态导航键交给编辑器
      selection.moveFocus(dr, dc, { extend: ctx.event.shiftKey })
      return 'stop'
    },
  })
  bindings.push(
    { keys: ['arrowup', 'shift+arrowup'], priority: 100, ...nav(-1, 0) },
    { keys: ['arrowdown', 'shift+arrowdown'], priority: 100, ...nav(1, 0) },
    { keys: ['arrowleft', 'shift+arrowleft'], priority: 100, ...nav(0, -1) },
    { keys: ['arrowright', 'shift+arrowright'], priority: 100, ...nav(0, 1) },
    {
      keys: ['tab', 'shift+tab'],
      priority: 100,
      handler: (ctx) => {
        if (editingGuard(ctx)) return 'stop'
        const dir = ctx.event.shiftKey ? -1 : 1
        selection.moveFocus(0, dir)
        return 'stop'
      },
    },
    {
      // Enter：非编辑态下移一格（编辑态由编辑器处理提交+下移）
      keys: ['enter', 'shift+enter'],
      priority: 100,
      handler: (ctx) => {
        if (editingGuard(ctx)) return 'stop'
        const dir = ctx.event.shiftKey ? -1 : 1
        selection.moveFocus(dir, 0)
        return 'stop'
      },
    },
    {
      keys: 'home',
      priority: 100,
      handler: (ctx) => {
        if (editingGuard(ctx)) return 'stop'
        const focus = selection.getFocusCell() ?? { row: 0, col: 0 }
        selection.collapseTo(focus.row, 0)
        return 'stop'
      },
    },
    {
      keys: 'end',
      priority: 100,
      handler: (ctx) => {
        if (editingGuard(ctx)) return 'stop'
        const focus = selection.getFocusCell() ?? { row: 0, col: 0 }
        selection.collapseTo(focus.row, Math.max(0, callbacks.getColCount() - 1))
        return 'stop'
      },
    },
    {
      keys: 'pageup',
      priority: 100,
      handler: (ctx) => {
        if (editingGuard(ctx)) return 'stop'
        selection.moveFocus(-20, 0)
        return 'stop'
      },
    },
    {
      keys: 'pagedown',
      priority: 100,
      handler: (ctx) => {
        if (editingGuard(ctx)) return 'stop'
        selection.moveFocus(20, 0)
        return 'stop'
      },
    },
  )

  // ---- Excel 语义的数据边界跳转（Ctrl+方向 / Ctrl+Home / Ctrl+End）----
  // 事件匹配里 ctrl 同时接受 Cmd（macOS），因此无需额外的 meta 变体。
  const jump = (dr: number, dc: number) => ({
    handler: (ctx: KeyContext): 'stop' => {
      if (editingGuard(ctx)) return 'stop'
      const focus = selection.getFocusCell()
      if (!focus) return 'stop'
      const extend = ctx.event.shiftKey
      const edge = callbacks.getEdgeCell?.(focus.row, focus.col, dr, dc)
      if (edge) {
        if (extend) {
          // 扩选到边界：先确保 anchor 存在（focus 变化前的当前格）
          selection.moveFocus(edge.row - focus.row, edge.col - focus.col, { extend: true })
        } else {
          selection.collapseTo(edge.row, edge.col)
        }
        return 'stop'
      }
      // 宿主未实现 getEdgeCell：退化为一屏跨度
      selection.moveFocus(dr === 0 ? 0 : dr * 20, dc === 0 ? 0 : dc * 10, { extend })
      return 'stop'
    },
  })
  bindings.push(
    { keys: ['ctrl+arrowup', 'ctrl+shift+arrowup'], priority: 100, ...jump(-1, 0) },
    { keys: ['ctrl+arrowdown', 'ctrl+shift+arrowdown'], priority: 100, ...jump(1, 0) },
    { keys: ['ctrl+arrowleft', 'ctrl+shift+arrowleft'], priority: 100, ...jump(0, -1) },
    { keys: ['ctrl+arrowright', 'ctrl+shift+arrowright'], priority: 100, ...jump(0, 1) },
  )

  // Ctrl+Home / Ctrl+End：表首 / 表尾（数据最后一格）
  bindings.push(
    {
      keys: 'ctrl+home',
      priority: 20,
      handler: (ctx) => {
        if (editingGuard(ctx)) return 'continue'
        selection.collapseTo(0, 0)
        return 'stop'
      },
    },
    {
      keys: 'ctrl+end',
      priority: 20,
      handler: (ctx) => {
        if (editingGuard(ctx)) return 'continue'
        const row = Math.max(0, callbacks.getRowCount() - 1)
        const col = Math.max(0, callbacks.getColCount() - 1)
        selection.collapseTo(row, col)
        return 'stop'
      },
    },
  )

  return bindings
}
