/**
 * @sheetx/editors - 下拉选择编辑器（单选/多选）与远程搜索编辑器
 *
 * 下拉编辑器的特殊问题（正式方案 L1103-1122 点名）：
 * - 焦点必须留在当前单元格语义内（Esc 关下拉 vs 取消编辑）；
 * - 方向键在「选项间移动」而不是移动单元格；
 * - 弹层不能被表格容器裁切 → 由 grid 引擎把编辑器挂到不裁切的宿主层，
 *   本编辑器只管渲染与键盘。
 *
 * 远程搜索是 ERP 核心卖点：输入商品编码 → 调宿主 API → 选中后自动填充
 * 名称/规格/单位/价格（payload 联动字段与主值同一事务提交）。
 */

import type { CellValue } from '@sheetx/core'
import type { CommitMeta, EditorContext, EditorFactory, EditorHandle, RemoteSearchItem, SelectOption } from './types.js'
import { attachCommonKeys, positionEditor } from './base.js'

const LIST_STYLE = [
  'position:absolute', 'box-sizing:border-box', 'max-height:180px', 'overflow-y:auto', 'z-index:11',
  'background:var(--sx-color-editor-bg, #fff)', 'border:1px solid var(--sx-color-border, #dadce0)',
  'box-shadow:0 2px 8px rgba(0,0,0,0.15)', 'min-width:120px',
  'font:13px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
].join(';')

const ITEM_ACTIVE_BG = 'var(--sx-color-selection-fill, rgba(26,115,232,0.12))'

function normalizeOptions(params: unknown): SelectOption[] {
  const raw = (params as { options?: unknown })?.options
  if (!Array.isArray(raw)) return []
  return raw.map((item) => (typeof item === 'string' ? { label: item, value: item } : (item as SelectOption)))
}

function createListEl(): HTMLDivElement {
  const list = document.createElement('div')
  list.className = 'sx-editor-list'
  list.style.cssText = LIST_STYLE
  return list
}

function styleItem(item: HTMLDivElement, active: boolean): void {
  item.style.cssText = `padding:5px 10px;cursor:pointer;user-select:none;${active ? `background:${ITEM_ACTIVE_BG};` : ''}`
}

function createItemEl(option: SelectOption, checked: boolean, multiple: boolean): HTMLDivElement {
  const item = document.createElement('div')
  item.className = 'sx-editor-list-item'
  item.dataset.value = String(option.value)
  if (multiple) {
    const box = document.createElement('input')
    box.type = 'checkbox'
    box.checked = checked
    box.style.marginRight = '6px'
    box.style.pointerEvents = 'none'
    item.appendChild(box)
  }
  item.appendChild(document.createTextNode(option.label))
  return item
}

/**
 * 下拉选择编辑器。
 * params: { options: Array<string | {label, value}>, multiple?: boolean }
 * 多选提交值为数组（CellValue[]），单选提交单个值。
 */
export const SelectEditor: EditorFactory = (ctx: EditorContext): EditorHandle => {
  const options = normalizeOptions(ctx.params)
  const multiple = (ctx.params as { multiple?: boolean }).multiple === true
  const currentValue = ctx.value

  const wrap = document.createElement('div')
  wrap.className = 'sx-editor-select'
  wrap.style.cssText = 'position:absolute;z-index:10'
  wrap.style.left = `${ctx.rect.x}px`
  wrap.style.top = `${ctx.rect.y}px`
  wrap.style.width = `${ctx.rect.width}px`

  const filter = document.createElement('input')
  filter.type = 'text'
  filter.className = 'sx-editor-select-filter'
  filter.placeholder = options.length > 0 ? '输入筛选…' : ''
  filter.style.cssText = [
    'width:100%', 'box-sizing:border-box', 'padding:2px 6px', 'border:2px solid var(--sx-color-active-border, #1a73e8)',
    'background:var(--sx-color-editor-bg, #fff)', 'color:var(--sx-color-text, #333)',
    'font:13px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif', 'outline:none',
  ].join(';')
  ctx.imeGuard.attach(filter)
  wrap.appendChild(filter)

  const list = createListEl()
  wrap.appendChild(list)
  positionEditor(list as unknown as HTMLElement, ctx, 120) // 复用定位：列表初始对齐单元格
  list.style.position = 'static'
  list.style.width = '100%'

  const selectedValues = new Set<CellValue>(Array.isArray(currentValue) ? (currentValue as CellValue[]) : [currentValue as CellValue])
  let activeIndex = 0
  let items: Array<{ option: SelectOption; el: HTMLDivElement }> = []

  const renderList = (): void => {
    const keyword = filter.value.trim().toLowerCase()
    items = options
      .filter((option) => keyword === '' || option.label.toLowerCase().includes(keyword))
      .map((option) => ({ option, el: createItemEl(option, selectedValues.has(option.value), multiple) }))
    list.innerHTML = ''
    items.forEach((entry, index) => {
      styleItem(entry.el, index === activeIndex)
      list.appendChild(entry.el)
    })
    if (items.length === 0) {
      const empty = document.createElement('div')
      empty.textContent = '无匹配项'
      empty.style.cssText = 'padding:6px 10px;color:#999'
      list.appendChild(empty)
    }
  }
  renderList()

  const commitSelection = (meta?: CommitMeta): void => {
    if (multiple) {
      ctx.commit([...selectedValues] as unknown as CellValue, undefined, meta)
    } else {
      const chosen = options.find((option) => selectedValues.has(option.value))
      ctx.commit(chosen ? chosen.value : null, undefined, meta)
    }
  }

  const setActive = (index: number): void => {
    activeIndex = Math.max(0, Math.min(index, items.length - 1))
    items.forEach((entry, i) => styleItem(entry.el, i === activeIndex))
    items[activeIndex]?.el.scrollIntoView({ block: 'nearest' })
  }

  // 键盘：方向键在选项间移动（不是移动单元格！）、Enter 选中、Esc 取消
  const keydown = (event: KeyboardEvent): void => {
    if (ctx.imeGuard.shouldSuppressKeyEvent(event)) return
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        event.stopPropagation()
        setActive(activeIndex + 1)
        return
      case 'ArrowUp':
        event.preventDefault()
        event.stopPropagation()
        setActive(activeIndex - 1)
        return
      case 'Enter': {
        event.preventDefault()
        event.stopPropagation()
        const entry = items[activeIndex]
        if (!entry) return
        if (multiple) {
          if (selectedValues.has(entry.option.value)) selectedValues.delete(entry.option.value)
          else selectedValues.add(entry.option.value)
          renderList()
        } else {
          ctx.commit(entry.option.value, undefined, { move: 'down' })
        }
        return
      }
      case 'Tab':
        event.preventDefault()
        commitSelection({ move: 'right' })
        return
      case 'Escape':
        event.preventDefault()
        event.stopPropagation()
        ctx.cancel()
        return
    }
  }
  filter.addEventListener('keydown', keydown)

  list.addEventListener('click', (event) => {
    const target = (event.target as HTMLElement).closest('[data-value]') as HTMLElement | null
    if (!target) return
    const value = target.dataset.value
    const option = options.find((entry) => String(entry.value) === value)
    if (!option) return
    if (multiple) {
      if (selectedValues.has(option.value)) selectedValues.delete(option.value)
      else selectedValues.add(option.value)
      renderList()
    } else {
      ctx.commit(option.value)
    }
  })

  const detachKeys = attachCommonKeys(filter, ctx, { onBlur: 'none', onEscape: () => ctx.cancel() })
  const outsideDown = (event: PointerEvent): void => {
    if (!wrap.contains(event.target as Node)) commitSelection() // 点击外部 = 确认当前选择
  }
  document.addEventListener('pointerdown', outsideDown, true)  // 点击外部确认当前选择（不移动焦点）

  return {
    el: wrap,
    mount() {
      requestAnimationFrame(() => filter.focus())
    },
    focus() {
      filter.focus()
    },
    destroy() {
      detachKeys()
      document.removeEventListener('pointerdown', outsideDown, true)
      wrap.remove()
    },
  }
}

export interface RemoteSearchEditorParams {
  /** 查询函数（宿主注入——SheetX 不实现网络） */
  query: (keyword: string) => Promise<ReadonlyArray<RemoteSearchItem>>
  /** 触发查询的最小字符数，默认 1 */
  minChars?: number
  /** 防抖毫秒，默认 200 */
  debounceMs?: number
  /** 空态文案 */
  emptyText?: string
}

/**
 * 远程搜索编辑器（ERP 核心卖点）：
 * 输入关键字 → 防抖查询宿主 API → 上下键选择 → Enter 提交
 * → commit(item.value, item.payload)——payload 联动字段与主值同一事务写入。
 */
export const RemoteSearchEditor: EditorFactory = (ctx: EditorContext): EditorHandle => {
  const params = ctx.params as unknown as RemoteSearchEditorParams
  if (typeof params.query !== 'function') {
    throw new Error('[SheetX] remote-search 编辑器需要 params.query（宿主注入查询函数）。')
  }
  const minChars = params.minChars ?? 1
  const debounceMs = params.debounceMs ?? 200

  const wrap = document.createElement('div')
  wrap.className = 'sx-editor-remote'
  wrap.style.cssText = 'position:absolute;z-index:10'
  wrap.style.left = `${ctx.rect.x}px`
  wrap.style.top = `${ctx.rect.y}px`
  wrap.style.width = `${ctx.rect.width}px`

  const input = document.createElement('input')
  input.type = 'text'
  input.className = 'sx-editor-remote-input'
  input.value = ctx.displayValue
  input.placeholder = (ctx.params as { placeholder?: string }).placeholder ?? '输入以搜索…'
  input.style.cssText = [
    'width:100%', 'box-sizing:border-box', 'padding:2px 6px', 'border:2px solid var(--sx-color-active-border, #1a73e8)',
    'background:var(--sx-color-editor-bg, #fff)', 'color:var(--sx-color-text, #333)',
    'font:13px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif', 'outline:none',
  ].join(';')
  ctx.imeGuard.attach(input)
  wrap.appendChild(input)

  const list = createListEl()
  list.style.width = '100%'
  list.style.display = 'none'
  wrap.appendChild(list)

  let items: RemoteSearchItem[] = []
  let activeIndex = 0
  let loading = false
  let debounceTimer: number | null = null
  let querySeq = 0 // 竞态防护：旧响应不得覆盖新响应（@lit/task 的 AbortSignal 思路，轻量版）

  const renderList = (): void => {
    list.innerHTML = ''
    if (loading) {
      const tip = document.createElement('div')
      tip.textContent = '查询中…'
      tip.style.cssText = 'padding:6px 10px;color:#999'
      list.appendChild(tip)
      list.style.display = 'block'
      return
    }
    items.forEach((item, index) => {
      const el = document.createElement('div')
      el.className = 'sx-editor-remote-item'
      el.textContent = item.label
      styleItem(el, index === activeIndex)
      el.addEventListener('click', () => commitItem(item))
      list.appendChild(el)
    })
    if (items.length === 0) {
      const tip = document.createElement('div')
      tip.textContent = params.emptyText ?? '无匹配结果'
      tip.style.cssText = 'padding:6px 10px;color:#999'
      list.appendChild(tip)
    }
    list.style.display = 'block'
  }

  const commitItem = (item: RemoteSearchItem, meta?: CommitMeta): void => {
    // payload 联动字段与主值一起提交——引擎把它们放进同一个事务（一次 undo）
    ctx.commit(item.value, item.payload, meta)
  }

  const runQuery = async (keyword: string): Promise<void> => {
    if (keyword.length < minChars) {
      list.style.display = 'none'
      return
    }
    loading = true
    renderList()
    const seq = ++querySeq
    try {
      const results = await params.query(keyword)
      if (seq !== querySeq) return // 旧响应丢弃
      items = [...results]
      activeIndex = 0
    } catch (error) {
      if (seq !== querySeq) return
      items = []
      list.innerHTML = ''
      const tip = document.createElement('div')
      tip.textContent = `查询失败: ${error instanceof Error ? error.message : String(error)}`
      tip.style.cssText = 'padding:6px 10px;color:#d93025'
      list.appendChild(tip)
    } finally {
      if (seq === querySeq) {
        loading = false
        renderList()
      }
    }
  }

  const inputKeydown = (event: KeyboardEvent): void => {
    if (ctx.imeGuard.shouldSuppressKeyEvent(event)) {
      // composing 中的方向键/Enter 是选词操作，全部放行给 IME（吞掉引擎逻辑）
      return
    }
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setActive(activeIndex + 1)
        return
      case 'ArrowUp':
        event.preventDefault()
        setActive(activeIndex - 1)
        return
      case 'Enter': {
        event.preventDefault()
        const item = items[activeIndex]
        if (item) commitItem(item, { move: 'down' })
        else ctx.commit(input.value, undefined, { move: 'down' })
        return
      }
      case 'Escape':
        event.preventDefault()
        event.stopPropagation()
        ctx.cancel()
        return
      case 'Tab':
        event.preventDefault()
        if (items[activeIndex]) commitItem(items[activeIndex]!, { move: 'right' })
        else ctx.commit(input.value, undefined, { move: 'right' })
        return
    }
  }

  const setActive = (index: number): void => {
    activeIndex = Math.max(0, Math.min(index, items.length - 1))
    renderList()
  }

  const inputEvent = (): void => {
    if (debounceTimer !== null) window.clearTimeout(debounceTimer)
    debounceTimer = window.setTimeout(() => void runQuery(input.value.trim()), debounceMs)
  }
  input.addEventListener('keydown', inputKeydown)
  input.addEventListener('input', inputEvent)

  return {
    el: wrap,
    mount() {
      requestAnimationFrame(() => input.focus())
    },
    focus() {
      input.focus()
    },
    destroy() {
      if (debounceTimer !== null) window.clearTimeout(debounceTimer)
      input.removeEventListener('keydown', inputKeydown)
      input.removeEventListener('input', inputEvent)
      wrap.remove()
    },
  } satisfies EditorHandle
}
