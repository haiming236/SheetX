/**
 * SheetX Playground · 轻量操作反馈
 *
 * 各页面的工具栏按钮（撤销/加粗/对齐/全屏…）在纯 UI 阶段没有真实数据可改，
 * 但「点了毫无反应」正是静态图的体感来源。统一用右下角提示条给出即时反馈，
 * 让每个可点元素都有可见响应（1.8s 自动消失，可叠放，不遮挡顶部导航）。
 */

const STYLE_ID = 'sx-toast-style'
const CONTAINER_ID = 'sx-toast-root'

const CSS = `
#sx-toast-root {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 10001;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  pointer-events: none;
  font: 12.5px/1.4 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
}
.sx-toast {
  max-width: 320px;
  padding: 7px 12px;
  border-radius: 7px;
  border: 1px solid var(--sx-border-strong);
  background: var(--sx-bg-surface);
  color: var(--sx-text-primary);
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 0.16s ease, transform 0.16s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sx-toast.show { opacity: 1; transform: translateY(0); }
`

function ensureRoot(): HTMLElement {
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style')
    style.id = STYLE_ID
    style.textContent = CSS
    document.head.appendChild(style)
  }
  let root = document.getElementById(CONTAINER_ID)
  if (!root) {
    root = document.createElement('div')
    root.id = CONTAINER_ID
    document.body.appendChild(root)
  }
  return root
}

export function toast(message: string): void {
  const root = ensureRoot()
  const item = document.createElement('div')
  item.className = 'sx-toast'
  item.textContent = message
  root.appendChild(item)
  // 超过 4 条时移除最旧的，避免堆满屏幕
  while (root.children.length > 4) root.firstElementChild?.remove()

  requestAnimationFrame(() => item.classList.add('show'))
  window.setTimeout(() => {
    item.classList.remove('show')
    window.setTimeout(() => item.remove(), 200)
  }, 1800)
}

/** 演示型按钮的通用动作：给出「谁被点了」的明确反馈 */
export function demoClick(label: string): () => void {
  return () => toast(label)
}
