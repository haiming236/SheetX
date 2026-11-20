// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { SelectionModel, normalizeRange, rangeContains } from '../src/selection.js'
import { Keymap } from '../src/keymap.js'
import { ImeGuard } from '../src/ime.js'
import { ClipboardController } from '../src/clipboard.js'
import { InteractionStateMachine } from '../src/fsm.js'
import { InteractionState } from '../src/types.js'

describe('SelectionModel', () => {
  let model: SelectionModel
  beforeEach(() => {
    model = new SelectionModel({ rowCount: 10, colCount: 5 })
    model.setAnchor(2, 1)
  })

  it('单格选中', () => {
    expect(model.getActiveRange()).toEqual({ start: { row: 2, col: 1 }, end: { row: 2, col: 1 } })
    expect(model.isCellSelected(2, 1)).toBe(true)
    expect(model.isCellSelected(3, 1)).toBe(false)
  })

  it('Shift 扩选（anchor 固定）', () => {
    model.moveFocus(3, 2, { extend: true })
    expect(model.getActiveRange()).toEqual({ start: { row: 2, col: 1 }, end: { row: 5, col: 3 } })
    // 反向扩选自动归一化
    model.moveFocus(-10, -10, { extend: true })
    expect(model.getActiveRange()).toEqual({ start: { row: 0, col: 0 }, end: { row: 2, col: 1 } })
  })

  it('键盘导航钳制边界', () => {
    model.moveFocus(-5, -5)
    expect(model.getFocusCell()).toEqual({ row: 0, col: 0 })
    model.moveFocus(100, 100)
    expect(model.getFocusCell()).toEqual({ row: 9, col: 4 })
  })

  it('Ctrl 多选区 + 活动区', () => {
    model.clear()
    model.setAnchor(0, 0, { additive: true })
    model.setAnchor(5, 3, { additive: true })
    expect(model.getRanges().length).toBe(2)
    expect(rangeContains(model.getActiveRange()!, 5, 3)).toBe(true)
    // selectAll 覆盖
    model.selectAll()
    expect(model.getRanges().length).toBe(1)
    expect(rangeContains(model.getActiveRange()!, 9, 4)).toBe(true)
  })

  it('selectRows / selectCols', () => {
    model.selectRows(3, 5)
    expect(model.getActiveRange()).toEqual({ start: { row: 3, col: 0 }, end: { row: 5, col: 4 } })
    model.selectCols(1, 2)
    expect(model.getActiveRange()).toEqual({ start: { row: 0, col: 1 }, end: { row: 9, col: 2 } })
  })

  it('clampToBounds（删行后）', () => {
    model.setAnchor(9, 4)
    model.bounds = { rowCount: 3, colCount: 2 }
    model.clampToBounds()
    expect(rangeContains(model.getActiveRange()!, 2, 1)).toBe(true)
    expect(model.isCellSelected(9, 4)).toBe(false)
  })

  it('变更通知', () => {
    let calls = 0
    model.setChangeListener(() => calls++)
    model.setAnchor(1, 1)
    expect(calls).toBe(1)
    model.moveFocus(0, 1)
    expect(calls).toBe(2)
  })

  it('normalizeRange 工具', () => {
    expect(normalizeRange({ row: 5, col: 3 }, { row: 1, col: 0 })).toEqual({
      start: { row: 1, col: 0 },
      end: { row: 5, col: 3 },
    })
  })
})

describe('Keymap', () => {
  function makeEvent(key: string, mods: Partial<{ ctrl: boolean; shift: boolean; alt: boolean }> = {}): { key: string; ctrlKey: boolean; metaKey: boolean; shiftKey: boolean; altKey: boolean; keyCode: number; isComposing: boolean; preventDefault(): void; stopPropagation(): void } {
    return {
      key,
      ctrlKey: mods.ctrl ?? false,
      metaKey: mods.ctrl ?? false,
      shiftKey: mods.shift ?? false,
      altKey: mods.alt ?? false,
      keyCode: 0,
      isComposing: false,
      preventDefault() {},
      stopPropagation() {},
    }
  }

  it('优先级与 stop/continue', () => {
    const keymap = new Keymap()
    const order: string[] = []
    keymap.register({ keys: 'ctrl+s', priority: 50, handler: () => { order.push('low'); return 'continue' } })
    keymap.register({ keys: 'ctrl+s', priority: 10, handler: () => { order.push('high'); return 'stop' } })
    const handled = keymap.handle(makeEvent('s', { ctrl: true }), { event: makeEvent('s', { ctrl: true }), imeGuard: new ImeGuard(), state: InteractionState.IDLE })
    expect(handled).toBe(true)
    expect(order).toEqual(['high']) // 高优先级 stop 后低优先级不执行
  })

  it('printable 匹配单字符无修饰键', () => {
    const keymap = new Keymap()
    keymap.register({ keys: 'printable', handler: (ctx) => { expect(ctx.event.key).toBe('中'); return 'stop' } })
    expect(keymap.handle(makeEvent('中'), { event: makeEvent('中'), imeGuard: new ImeGuard(), state: InteractionState.IDLE })).toBe(true)
    // Ctrl+V 不算 printable
    expect(keymap.handle(makeEvent('v', { ctrl: true }), { event: makeEvent('v', { ctrl: true }), imeGuard: new ImeGuard(), state: InteractionState.IDLE })).toBe(false)
  })

  it('macOS Cmd 视同 Ctrl', () => {
    const keymap = new Keymap()
    keymap.register({ keys: 'ctrl+z', handler: () => 'stop' })
    expect(keymap.handle(makeEvent('z', { ctrl: true }), { event: makeEvent('z', { ctrl: true }), imeGuard: new ImeGuard(), state: InteractionState.IDLE })).toBe(true)
  })
})

describe('ImeGuard（中文体验第一守卫）', () => {
  function makeInput(): HTMLInputElement {
    return document.createElement('input')
  }

  function fireComposition(target: HTMLElement, type: string, data?: string): void {
    target.dispatchEvent(new CompositionEvent(type, { data }))
  }

  it('composing 期间抑制键盘事件', () => {
    const guard = new ImeGuard()
    const input = makeInput()
    guard.attach(input)
    expect(guard.isComposing()).toBe(false)
    fireComposition(input, 'compositionstart')
    expect(guard.isComposing()).toBe(true)
    // keyCode 229 / isComposing 都要抑制
    expect(guard.shouldSuppressKeyEvent({ keyCode: 229 })).toBe(true)
    expect(guard.shouldSuppressKeyEvent({ isComposing: true })).toBe(true)
    fireComposition(input, 'compositionend', '你好')
    expect(guard.isComposing()).toBe(false)
    expect(guard.shouldSuppressKeyEvent({ keyCode: 13 })).toBe(false) // 结束后 Enter 放行
  })

  it('取消判定：与上次成功结束文本相同（跨组合比较）', () => {
    const guard = new ImeGuard()
    const input = makeInput()
    guard.attach(input)
    // 第一次组合 'ni' 正常提交 → 不算取消
    fireComposition(input, 'compositionstart')
    fireComposition(input, 'compositionupdate', 'ni')
    fireComposition(input, 'compositionend', 'ni')
    expect(guard.wasCanceled()).toBe(false)
    // 第二次组合相同文本后取消 → 判定为取消
    fireComposition(input, 'compositionstart')
    fireComposition(input, 'compositionupdate', 'ni')
    fireComposition(input, 'compositionend', 'ni')
    expect(guard.wasCanceled()).toBe(true)
  })

  it('正常提交不算取消', () => {
    const guard = new ImeGuard()
    const input = makeInput()
    guard.attach(input)
    fireComposition(input, 'compositionstart')
    fireComposition(input, 'compositionupdate', '你好')
    fireComposition(input, 'compositionend', '你好')
    expect(guard.wasCanceled()).toBe(false)
    expect(guard.compositionText).toBe('你好')
  })
})

describe('InteractionStateMachine', () => {
  it('合法转移', () => {
    const fsm = new InteractionStateMachine()
    expect(fsm.state).toBe(InteractionState.IDLE)
    fsm.transition(InteractionState.SELECTING, 'mouse-down')
    fsm.transition(InteractionState.IDLE, 'mouse-up')
    fsm.transition(InteractionState.EDITING, 'edit-start')
    expect(fsm.isEditing()).toBe(true)
    fsm.transition(InteractionState.IME_COMPOSING, 'composition-start')
    fsm.transition(InteractionState.EDITING, 'composition-end')
    fsm.transition(InteractionState.IDLE, 'commit')
  })

  it('非法转移抛错（开发期暴露逻辑漏洞）', () => {
    const fsm = new InteractionStateMachine()
    // IDLE → IME_COMPOSING 不合法（必须先进 EDITING）
    expect(() => fsm.transition(InteractionState.IME_COMPOSING, 'jump')).toThrow(/非法/)
  })
})

describe('ClipboardController 解析', () => {
  it('TSV 解析（Excel text/plain 格式）', () => {
    const matrix = ClipboardController.parseTsv('a\tb\tc\n1\t2\t3\n')
    expect(matrix).toEqual([['a', 'b', 'c'], ['1', '2', '3']])
  })

  it('HTML 表格解析含 colspan/rowspan', () => {
    const matrix = ClipboardController.parseHtmlTable(
      '<table><tr><td colspan="2">合并</td><td>C</td></tr><tr><td rowspan="2">R</td><td>b</td><td>c</td></tr><tr><td>x</td><td>y</td></tr></table>',
    )
    expect(matrix).toEqual([
      ['合并', '', 'C'],
      ['R', 'b', 'c'],
      ['', 'x', 'y'],
    ])
  })

  it('非表格 HTML 返回 null', () => {
    expect(ClipboardController.parseHtmlTable('<p>普通文本</p>')).toBeNull()
  })
})
