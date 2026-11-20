/**
 * @sheetx/grid - 编辑器弹出层宿主管理器（E4，grid/spreadsheet 共用）
 *
 * 问题：编辑器 DOM 挂在引擎 root 内，root `overflow:hidden` 会把下拉/日期面板
 * 越出表格边界的部分裁掉（任务书对接问题 #E4）。
 *
 * 方案：三级宿主解析——
 *   1. `setPopupHost(element)`：宿主显式指定（UI 想自己管理弹层容器时用）；
 *   2. `editorHostMode: 'body'`：引擎在 document.body 创建 fixed 全屏覆盖层
 *      （pointer-events:none，编辑器子元素各自 auto），坐标换算成视口坐标；
 *   3. 默认 `inline`：宿主在 root 内（原行为）。
 *
 * IME 守卫、commit/cancel 回调语义完全不变——只换挂载点与坐标换算。
 */

import type { Rect } from '@sheetx/core'

export type EditorHostMode = 'inline' | 'body'

export interface PopupHostManagerOptions {
  /** 引擎 root 元素提供者（坐标换算基准；销毁期间可能为 null） */
  getRoot: () => HTMLElement | null
}

export class PopupHostManager {
  private mode: EditorHostMode = 'inline'
  private customHost: HTMLElement | null = null
  private bodyHost: HTMLElement | null = null
  private changeCallbacks = new Set<() => void>()
  private windowListenersAttached = false
  private readonly getRoot: () => HTMLElement | null

  constructor(options: PopupHostManagerOptions) {
    this.getRoot = options.getRoot
  }

  /** 设置宿主模式（默认 inline）。切离 body 时回收 body 宿主，避免残留死节点 */
  setMode(mode: EditorHostMode): void {
    this.mode = mode
    if (mode !== 'body') {
      this.bodyHost?.remove()
      this.bodyHost = null
    }
  }

  getMode(): EditorHostMode {
    return this.mode
  }

  /** 显式指定弹层宿主（传 null 恢复模式默认） */
  setCustomHost(element: HTMLElement | null): void {
    this.customHost = element
  }

  /** 当前是否为「脱离引擎 root」的宿主（决定坐标换算与窗口监听） */
  isDetached(inlineHost: HTMLElement): boolean {
    const host = this.resolve(inlineHost)
    return host !== inlineHost
  }

  /**
   * 解析当前应使用的编辑器宿主。
   * @param inlineHost 引擎 root 内的默认宿主
   */
  resolve(inlineHost: HTMLElement): HTMLElement {
    if (this.customHost && this.customHost.isConnected) return this.customHost
    if (this.mode === 'body') return this.ensureBodyHost()
    return inlineHost
  }

  /**
   * 单元格矩形（root 本地坐标）→ 编辑器应处的宿主坐标。
   * inline：宿主与 root 同原点，坐标原样；body/custom：换算成视口坐标
   * （fixed 宿主的原点 = 视口原点）。
   */
  toHostCoords(rect: Rect): Rect {
    const host = this.currentResolvedHost
    if (!host || host === this.inlineHostRef) return rect
    const root = this.getRoot()
    if (!root) return rect
    const rootRect = root.getBoundingClientRect()
    return { x: rootRect.left + rect.x, y: rootRect.top + rect.y, width: rect.width, height: rect.height }
  }

  /** 页面滚动/窗口尺寸变化时需要重新定位（body/custom 宿主才有意义） */
  onChange(callback: () => void): () => void {
    this.changeCallbacks.add(callback)
    this.ensureWindowListeners()
    return () => {
      this.changeCallbacks.delete(callback)
      if (this.changeCallbacks.size === 0) this.detachWindowListeners()
    }
  }

  dispose(): void {
    this.detachWindowListeners()
    this.bodyHost?.remove()
    this.bodyHost = null
    this.customHost = null
    this.changeCallbacks.clear()
    this.currentResolvedHost = null
  }

  // ---- 内部 ----

  /** resolve 的最近结果缓存（toHostCoords 需要知道「当前宿主是否脱离 root」） */
  private currentResolvedHost: HTMLElement | null = null
  private inlineHostRef: HTMLElement | null = null

  /** 引擎在每次 openEditor 时调用：先 resolve 再记缓存 */
  trackResolve(inlineHost: HTMLElement): HTMLElement {
    const host = this.resolve(inlineHost)
    this.currentResolvedHost = host
    this.inlineHostRef = inlineHost
    return host
  }

  private ensureBodyHost(): HTMLElement {
    if (this.bodyHost?.isConnected) return this.bodyHost
    const host = document.createElement('div')
    host.className = 'sx-popup-host'
    host.style.cssText = [
      'position:fixed', 'left:0', 'top:0', 'width:100vw', 'height:100vh',
      'pointer-events:none', 'overflow:visible', 'z-index:9999',
    ].join(';')
    document.body.appendChild(host)
    this.bodyHost = host
    return host
  }

  private ensureWindowListeners(): void {
    if (this.windowListenersAttached || typeof window === 'undefined') return
    const dispatch = (): void => {
      for (const callback of this.changeCallbacks) callback()
    }
    // capture：页面任意祖先容器滚动都会触发（编辑器跟随单元格）
    window.addEventListener('scroll', dispatch, true)
    window.addEventListener('resize', dispatch)
    this.windowListenersAttached = true
    this.detachWindowListeners = (): void => {
      window.removeEventListener('scroll', dispatch, true)
      window.removeEventListener('resize', dispatch)
      this.windowListenersAttached = false
    }
  }

  private detachWindowListeners: () => void = (): void => {}
}
