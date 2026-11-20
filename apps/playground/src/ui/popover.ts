/**
 * SheetX Playground · 通用下拉菜单
 *
 * 背景：各页面大量「▾」按钮此前只在视觉上切换高亮，点了没有菜单——
 * 这是「页面像静态图」的主要体感来源。本模块提供统一的浮层菜单：
 * - fixed 定位到锚点下方（空间不足自动翻转到上方），右侧对齐可选；
 * - 点击项执行 onSelect 后关闭；点击外部 / Esc / 滚动 / resize 关闭；
 * - 键盘 ↑↓ 移动、Enter 选择、带勾选项与快捷键提示；
 * - 挂 document.body，不受各页 shadow DOM 的 overflow:hidden 裁切。
 */
import { render } from 'lit'
import { sxIcon, type IconName } from './icons.js'

export interface MenuItem {
  label?: string
  icon?: IconName
  /** 右侧快捷键/说明文案 */
  shortcut?: string
  /** 危险操作（红色） */
  danger?: boolean
  /** 勾选态（单选菜单用） */
  checked?: boolean
  disabled?: boolean
  /** 分隔线（其余字段忽略） */
  separator?: boolean
  onSelect?: () => void
}

export interface MenuOptions {
  /** 菜单相对锚点的对齐方式（默认左对齐；right 用于右边缘按钮） */
  align?: 'left' | 'right'
  minWidth?: number
}

let current: { el: HTMLElement; dispose: () => void } | null = null

const STYLE_ID = 'sx-menu-style'
const MENU_CSS = `
.sx-menu {
  position: fixed;
  z-index: 10000;
  padding: 4px;
  border-radius: 8px;
  background: var(--sx-bg-surface);
  border: 1px solid var(--sx-border-strong);
  font: 13px/1.45 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
  color: var(--sx-text-primary);
  max-height: 340px;
  overflow-y: auto;
  overscroll-behavior: contain;
  min-width: 148px;
  scrollbar-width: thin;
  scrollbar-color: var(--sx-border-strong) transparent;
}
.sx-menu::-webkit-scrollbar { width: 10px; }
.sx-menu::-webkit-scrollbar-thumb { background: var(--sx-border-strong); border-radius: 5px; }
.sx-menu::-webkit-scrollbar-thumb:hover { background: var(--sx-text-hint); }
.sx-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 30px;
  padding: 0 8px;
  border-radius: 5px;
  cursor: pointer;
  white-space: nowrap;
  user-select: none;
}
.sx-menu-item:hover,
.sx-menu-item.focused { background: var(--sx-bg-subtle); }
.sx-menu-item .lbl { flex: 1 1 auto; }
.sx-menu-item .sc { color: var(--sx-text-hint); font-size: 11px; padding-left: 12px; }
.sx-menu-item .tick { width: 14px; flex: 0 0 14px; display: inline-flex; align-items: center; justify-content: center; color: #2563eb; }
.sx-menu-item .ico { width: 16px; flex: 0 0 16px; display: inline-flex; align-items: center; justify-content: center; color: var(--sx-text-secondary); }
.sx-menu-item.danger { color: #d64545; }
.sx-menu-item.danger .ico { color: #d64545; }
.sx-menu-item.disabled { color: var(--sx-text-hint); pointer-events: none; }
.sx-menu-item.disabled .ico { color: #c7cedb; }
.sx-menu-sep { height: 1px; background: var(--sx-bg-subtle); margin: 4px 2px; }
`

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = MENU_CSS
  document.head.appendChild(style)
}

export function closeMenu(): void {
  current?.dispose()
  current = null
}

/** 当前是否有菜单打开（宿主可据此忽略 Esc 等按键） */
export function isMenuOpen(): boolean {
  return current !== null
}

export function openMenu(anchor: HTMLElement, items: MenuItem[], options: MenuOptions = {}): void {
  closeMenu()
  ensureStyle()

  const el = document.createElement('div')
  el.className = 'sx-menu'
  el.setAttribute('role', 'menu')
  if (options.minWidth) el.style.minWidth = `${options.minWidth}px`

  const actionable: HTMLElement[] = []
  let focusIndex = -1

  const setFocus = (index: number): void => {
    if (actionable.length === 0) return
    focusIndex = (index + actionable.length) % actionable.length
    actionable.forEach((node, i) => node.classList.toggle('focused', i === focusIndex))
  }

  for (const item of items) {
    if (item.separator) {
      const sep = document.createElement('div')
      sep.className = 'sx-menu-sep'
      el.appendChild(sep)
      continue
    }
    const row = document.createElement('div')
    row.className = 'sx-menu-item'
    if (item.danger) row.classList.add('danger')
    if (item.disabled) row.classList.add('disabled')
    row.setAttribute('role', 'menuitem')

    const tick = document.createElement('span')
    tick.className = 'tick'
    if (item.checked) render(sxIcon('check', 13), tick)
    row.appendChild(tick)

    if (item.icon) {
      const ico = document.createElement('span')
      ico.className = 'ico'
      render(sxIcon(item.icon, 15), ico)
      row.appendChild(ico)
    }

    const label = document.createElement('span')
    label.className = 'lbl'
    label.textContent = item.label ?? ''
    row.appendChild(label)

    if (item.shortcut) {
      const sc = document.createElement('span')
      sc.className = 'sc'
      sc.textContent = item.shortcut
      row.appendChild(sc)
    }

    if (!item.disabled) {
      actionable.push(row)
      row.addEventListener('click', (event) => {
        event.stopPropagation()
        closeMenu()
        item.onSelect?.()
      })
      row.addEventListener('mouseenter', () => setFocus(actionable.indexOf(row)))
    }
    el.appendChild(row)
  }

  document.body.appendChild(el)

  // ---- 定位：优先锚点下方，空间不足翻转上方，并钳制在视口内 ----
  const rect = anchor.getBoundingClientRect()
  const menuRect = el.getBoundingClientRect()
  const gap = 4
  let left = options.align === 'right' ? rect.right - menuRect.width : rect.left
  let top = rect.bottom + gap
  if (top + menuRect.height > window.innerHeight - 8) {
    top = Math.max(8, rect.top - menuRect.height - gap)
  }
  left = Math.min(Math.max(8, left), window.innerWidth - menuRect.width - 8)
  el.style.left = `${Math.round(left)}px`
  el.style.top = `${Math.round(top)}px`

  // ---- 关闭策略：外部点击 / Esc / 滚动 / resize ----
  const onPointerDown = (event: PointerEvent): void => {
    if (event.target instanceof Node && el.contains(event.target)) return
    if (event.target instanceof Node && anchor.contains(event.target)) return
    closeMenu()
  }
  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      closeMenu()
      event.stopPropagation()
      return
    }
    if (event.key === 'ArrowDown') {
      setFocus(focusIndex + 1)
      event.preventDefault()
      return
    }
    if (event.key === 'ArrowUp') {
      setFocus(focusIndex - 1)
      event.preventDefault()
      return
    }
    if (event.key === 'Enter' && focusIndex >= 0) {
      actionable[focusIndex]?.click()
      event.preventDefault()
    }
  }
  // 只响应菜单**外部**的滚动：菜单内部滚动条滚动不应关闭菜单，
  // 否则带滚动的长菜单（单元格右键）一滚就消失，无法浏览/选择。
  const onScroll = (event: Event): void => {
    const target = event.target
    if (target instanceof Node && el.contains(target)) return
    closeMenu()
  }

  document.addEventListener('pointerdown', onPointerDown, true)
  document.addEventListener('keydown', onKeyDown, true)
  window.addEventListener('scroll', onScroll, true)
  window.addEventListener('resize', onScroll)

  current = {
    el,
    dispose: () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
      el.remove()
    },
  }

  if (actionable.length > 0) setFocus(0)
  el.style.left = `${Math.round(left)}px`
  el.style.top = `${Math.round(top)}px`
}
