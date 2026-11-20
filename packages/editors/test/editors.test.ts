// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { EditorRegistry, BuiltinEditorNames } from '../src/registry.js'
import { createDefaultEditorRegistry } from '../src/index.js'
import { TextEditor, NumberEditor, CurrencyEditor, toIsoDate } from '../src/editors-basic.js'
import { RemoteSearchEditor } from '../src/editors-select.js'
import { parseNumeric, formatThousand } from '../src/base.js'
import type { EditorContext } from '../src/types.js'
import { ImeGuard } from '@sheetx/interaction'

function makeContext(overrides: Partial<EditorContext> = {}): EditorContext {
  const imeGuard = new ImeGuard()
  return {
    row: 0,
    col: 0,
    rowId: 'r1',
    field: 'name',
    value: '原始值',
    displayValue: '原始值',
    rect: { x: 10, y: 10, width: 100, height: 28 },
    container: document.createElement('div'),
    imeGuard,
    params: {},
    commit: () => {},
    cancel: () => {},
    ...overrides,
  }
}

describe('EditorRegistry', () => {
  it('createDefaultEditorRegistry 注册全部内置编辑器', () => {
    const registry = createDefaultEditorRegistry()
    expect(registry.has('text')).toBe(true)
    expect(registry.has('number')).toBe(true)
    expect(registry.has('currency')).toBe(true)
    expect(registry.has('date')).toBe(true)
    expect(registry.has('select')).toBe(true)
    expect(registry.has('remote-search')).toBe(true)
    expect(registry.list().length).toBe(10)
  })

  it('未知编辑器报错并列出可用项', () => {
    const registry = new EditorRegistry()
    registry.register('text', TextEditor)
    expect(() => registry.create('nope', makeContext())).toThrow(/可用/)
  })

  it('重复注册需显式 override', () => {
    const registry = new EditorRegistry()
    registry.register('text', TextEditor)
    expect(() => registry.register('text', TextEditor)).toThrow(/override/)
    expect(() => registry.register('text', TextEditor, { override: true })).not.toThrow()
  })
})

describe('TextEditor', () => {
  it('创建后 IME 守卫已接线（中文不丢字的关键）', () => {
    const guard = new ImeGuard()
    const handle = TextEditor(makeContext({ imeGuard: guard }))
    const input = handle.el as HTMLInputElement
    expect(input.tagName).toBe('INPUT')
    // 组合输入事件到达 input 后守卫应进入 composing 态
    input.dispatchEvent(new CompositionEvent('compositionstart', { data: '' }))
    expect(guard.isComposing()).toBe(true)
    handle.destroy()
  })

  it('commit 回调收到输入值', () => {
    let committed: unknown = '未调用'
    const handle = TextEditor(makeContext({ commit: (value) => (committed = value) }))
    const input = handle.el as HTMLInputElement
    input.value = '新值'
    // 模拟 Enter 提交（非 composing）
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    expect(committed).toBe('新值')
    handle.destroy()
  })

  it('Esc 取消', () => {
    let canceled = false
    const handle = TextEditor(makeContext({ cancel: () => (canceled = true) }))
    const input = handle.el as HTMLInputElement
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(canceled).toBe(true)
    handle.destroy()
  })

  it('composing 中 Enter 不提交（IME 铁律）', () => {
    let committed = false
    const handle = TextEditor(makeContext({ commit: () => (committed = true) }))
    const input = handle.el as HTMLInputElement
    input.dispatchEvent(new CompositionEvent('compositionstart'))
    // keyCode 229 的 Enter（IME 候选确认）
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 229, bubbles: true }))
    expect(committed).toBe(false)
    handle.destroy()
  })
})

describe('NumberEditor / CurrencyEditor', () => {
  it('数字提交与范围钳制', () => {
    let committed: unknown
    const handle = NumberEditor(makeContext({
      displayValue: '',
      params: { min: 0, max: 100, precision: 2 },
      commit: (value) => (committed = value),
    }))
    const input = handle.el as HTMLInputElement
    input.value = '150'
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    expect(committed).toBe(100) // 钳到 max
    handle.destroy()
  })

  it('非法输入保持打开不提交', () => {
    let committed: unknown = null
    let commitCalled = false
    const handle = NumberEditor(makeContext({ commit: (value) => { commitCalled = true; committed = value } }))
    const input = handle.el as HTMLInputElement
    input.value = 'abc'
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    expect(commitCalled).toBe(false)
    void committed
    handle.destroy()
  })

  it('货币：¥ 前缀与千分位解析', () => {
    expect(parseNumeric('¥1,234.50', { thousand: true, prefix: '¥' })).toBe(1234.5)
    expect(formatThousand(1234567.5, 2)).toBe('1,234,567.50')
    let committed: unknown
    const handle = CurrencyEditor(makeContext({ displayValue: '', commit: (value) => (committed = value) }))
    const input = handle.el as HTMLInputElement
    input.value = '¥2,000'
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    expect(committed).toBe(2000)
    handle.destroy()
  })
})

describe('日期工具', () => {
  it('toIsoDate 支持序列与字符串', () => {
    expect(toIsoDate(61)).toBe('1900-03-01')
    expect(toIsoDate('2026-01-05T00:00:00')).toBe('2026-01-05')
    expect(toIsoDate(null)).toBe('')
  })
})

describe('Alt+Enter 单元格内换行', () => {
  it('文本编辑器 Alt+Enter 提交带换行的值且不触发导航提交', () => {
    let committed: unknown = null
    const ctx = makeContext({
      value: '第一行',
      displayValue: '第一行',
      commit: (value) => { committed = value },
    })
    const handle = TextEditor(ctx)
    const input = handle.el as HTMLInputElement
    expect(input).not.toBeNull()
    input.value = '第一行'
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', altKey: true, bubbles: true, cancelable: true }))
    expect(committed).toBe('第一行\n')
    handle.destroy()
  })

  it('普通 Enter 仍提交不带换行（回归）', () => {
    let committed: unknown = null
    const ctx = makeContext({
      value: '第一行',
      displayValue: '第一行',
      commit: (value) => { committed = value },
    })
    const handle = TextEditor(ctx)
    const input = handle.el as HTMLInputElement
    input.value = '第一行'
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
    expect(committed).toBe('第一行')
    handle.destroy()
  })
})

describe('RemoteSearchEditor · ERP 远程搜索', () => {
  const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

  it('缺少 query 回调时直接报错（宿主必须在编辑器参数里注入）', () => {
    expect(() => RemoteSearchEditor(makeContext({ params: {} }))).toThrow(/params.query/)
  })

  it('输入防抖：只在停止输入后查询一次', async () => {
    const query = vi.fn(async () => [])
    const handle = RemoteSearchEditor(makeContext({ params: { query, debounceMs: 20 } }))
    const input = handle.el.querySelector('input')!
    input.value = '苹'
    input.dispatchEvent(new Event('input'))
    await wait(8)
    expect(query).not.toHaveBeenCalled()
    await wait(25)
    expect(query).toHaveBeenCalledTimes(1)
    expect(query).toHaveBeenCalledWith('苹')
    handle.destroy()
  })

  it('竞态防护 + payload 联动：旧响应不得覆盖新结果，Enter 一并提交联动字段', async () => {
    let resolveOld: ((rows: Array<{ label: string; value: string }>) => void) | null = null
    const oldPromise = new Promise<Array<{ label: string; value: string }>>((resolve) => { resolveOld = resolve })
    const query = vi.fn()
      .mockImplementationOnce(() => oldPromise)
      .mockImplementationOnce(async () => [{ label: '键盘', value: 'KB-02', payload: { name: '机械键盘', price: 299 } }])
    const commit = vi.fn()
    const handle = RemoteSearchEditor(makeContext({ params: { query, debounceMs: 5 }, commit }))
    const input = handle.el.querySelector('input')!

    input.value = 'A'
    input.dispatchEvent(new Event('input'))
    await wait(15)
    input.value = 'AB'
    input.dispatchEvent(new Event('input'))
    await wait(15)

    // 新响应先到，旧响应后到——后者必须被 querySeq 丢弃
    const items = handle.el.querySelectorAll('.sx-editor-remote-item')
    expect(items.length).toBe(1)
    expect(items[0]!.textContent).toBe('键盘')
    resolveOld?.([{ label: '过时结果', value: 'A' }])
    await wait(0)

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
    expect(commit).toHaveBeenCalledWith('KB-02', { name: '机械键盘', price: 299 }, { move: 'down' })
    handle.destroy()
  })
})
