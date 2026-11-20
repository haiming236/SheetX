/**
 * @sheetx/renderer - 分层渲染器实现（DOM / Canvas / Hybrid）
 *
 * 设计纪律：
 * - 这里实现的是 core 的 `SheetXRenderer` 高层契约（分层 + 命中 + DOM 覆盖层）；
 * - 底层 Canvas 绘制仍复用既有 `Canvas2DRenderer`（脏矩形/位块搬移/文本缓存）；
 * - DOM 渲染器保留 DOM 语义层（无障碍、复制粘贴、CSS 样式）；
 * - Hybrid 负责组合：Canvas 画网格/文字/选区，DOM 只 overlay 编辑器与菜单。
 *
 * 三种实现共用同一接口，业务层（grid/spreadsheet）不依赖具体技术。
 */

import type {
  CanvasLayerKind,
  CellRange,
  DomOverlayKind,
  HitResult,
  Rect,
  RendererConfig,
  RendererKind,
  SheetXRenderer,
  Viewport,
} from '@sheetx/core'

/** 默认视口（未 setViewport 前使用） */
const EMPTY_VIEWPORT: Viewport = {
  rect: { x: 0, y: 0, width: 0, height: 0 },
  scrollLeft: 0,
  scrollTop: 0,
  firstRow: 0,
  lastRow: 0,
  firstCol: 0,
  lastCol: 0,
}

/** 布局提供者：把逻辑坐标 → 像素矩形（由引擎注入，渲染器不解释业务数据） */
export interface LayoutProvider {
  /** 单元格矩形（含滚动偏移），无数据时返回 null */
  cellRect(row: number, col: number): Rect | null
  /** 像素坐标 → 行列（DOM 实现可退化为元素命中） */
  locate(x: number, y: number): { row: number; col: number; zone: HitResult['zone'] } | null
  /** 列宽（px） */
  colWidth(col: number): number
  /** 行高（px） */
  rowHeight(row: number): number
}

/** 渲染器公共基类：管理视口、DOM 覆盖层、生命周期 */
abstract class BaseRenderer implements SheetXRenderer {
  abstract readonly kind: RendererKind

  protected host: HTMLElement | null = null
  protected overlayHost: HTMLElement | null = null
  protected viewport: Viewport = EMPTY_VIEWPORT
  protected overlays = new Map<DomOverlayKind, HTMLElement>()
  protected destroyed = false

  initialize(host: HTMLElement, overlayHost?: HTMLElement): void {
    this.host = host
    this.overlayHost = overlayHost ?? host
    this.destroyed = false
  }

  setViewport(viewport: Viewport): void {
    this.viewport = viewport
    this.onViewportChanged(viewport)
  }

  showOverlay(kind: DomOverlayKind, element: HTMLElement, rect: Rect): void {
    if (!this.overlayHost) return
    this.hideOverlay(kind)
    element.style.position = 'absolute'
    element.style.left = `${rect.x}px`
    element.style.top = `${rect.y}px`
    element.style.minWidth = `${rect.width}px`
    element.style.minHeight = `${rect.height}px`
    this.overlayHost.appendChild(element)
    this.overlays.set(kind, element)
  }

  hideOverlay(kind: DomOverlayKind): void {
    const element = this.overlays.get(kind)
    if (element?.parentNode) element.parentNode.removeChild(element)
    this.overlays.delete(kind)
  }

  resize(_width: number, _height: number): void {
    // 子类按需实现（Canvas 需处理 dpr 与位图尺寸）
  }

  destroy(): void {
    for (const kind of [...this.overlays.keys()]) this.hideOverlay(kind)
    this.host = null
    this.overlayHost = null
    this.destroyed = true
  }

  protected onViewportChanged(_viewport: Viewport): void {
    // 子类按需实现
  }

  abstract renderLayer(layer: CanvasLayerKind, range?: CellRange): void
  abstract renderSelection(selection: CellRange | null): void
  abstract hitTest(x: number, y: number): HitResult | null
}

/** DOM 渲染器：单元格仍是 DOM 节点，保留语义与 CSS 能力 */
export class DomRenderer extends BaseRenderer {
  readonly kind: RendererKind = 'dom'

  private body: HTMLElement | null = null

  constructor(private readonly layout: LayoutProvider) {
    super()
  }

  initialize(host: HTMLElement, overlayHost?: HTMLElement): void {
    super.initialize(host, overlayHost)
    this.body = document.createElement('div')
    this.body.className = 'sx-dom-grid'
    // DOM 语义层：虚拟滚动由引擎的 layout/viewport 计算后只创建可见单元格
    this.body.style.cssText = 'position:absolute;inset:0;overflow:hidden;'
    host.appendChild(this.body)
  }

  renderLayer(layer: CanvasLayerKind, range?: CellRange): void {
    if (!this.body || this.destroyed) return
    // DOM 实现只关心 cells 层；gridlines/selection 走 CSS。
    if (layer !== 'cells') return
    const { firstRow, lastRow, firstCol, lastCol } = this.viewport
    const r1 = Math.max(firstRow, range?.start.row ?? firstRow)
    const r2 = Math.min(lastRow, range?.end.row ?? lastRow)
    const c1 = Math.max(firstCol, range?.start.col ?? firstCol)
    const c2 = Math.min(lastCol, range?.end.col ?? lastCol)
    // 布局/内容由上层 DOM 引擎生成；这里仅保证容器存在与视口裁剪。
    this.body.style.clipPath = `inset(${Math.max(0, this.viewport.rect.y)}px ${Math.max(0, this.viewport.rect.x)}px)`
    void r1; void r2; void c1; void c2
  }

  renderSelection(selection: CellRange | null): void {
    if (!this.body) return
    const rect = selection ? this.layout.cellRect(selection.start.row, selection.start.col) : null
    this.body.style.outline = rect ? '2px solid var(--sx-brand)' : ''
  }

  hitTest(x: number, y: number): HitResult | null {
    const hit = this.layout.locate(x, y)
    return hit ? { row: hit.row, col: hit.col, zone: hit.zone } : null
  }
}

/**
 * Hybrid 渲染器：Canvas 负责网格/文字/选区，DOM 只负责编辑与菜单覆盖层。
 *
 * 当前底层 Canvas 绘制仍由引擎既有的 Canvas2DRenderer 执行（本类持有布局与命中），
 * 因此创建 Hybrid 与创建 Canvas 的视觉行为一致；差异在 DOM overlay 的责任归属。
 */
export class HybridRenderer extends BaseRenderer {
  readonly kind: RendererKind = 'hybrid'

  constructor(private readonly layout: LayoutProvider) {
    super()
  }

  renderLayer(_layer: CanvasLayerKind, _range?: CellRange): void {
    // 底层绘制由引擎的 Canvas2DRenderer 驱动；此处不重复绘制，保留接口位置。
  }

  renderSelection(_selection: CellRange | null): void {
    // 选区由 Canvas 交互层绘制，DOM 不参与。
  }

  hitTest(x: number, y: number): HitResult | null {
    const hit = this.layout.locate(x, y)
    return hit ? { row: hit.row, col: hit.col, zone: hit.zone } : null
  }
}

/**
 * 渲染器工厂：业务层唯一入口。
 *
 * - `kind: 'canvas' | 'hybrid'` → 高层契约由 HybridRenderer 承担，底层仍是既有 Canvas2D；
 * - `kind: 'dom'` → DomRenderer；
 * - `engine` 提供时完全覆盖（第三方实现）。
 */
export function createRenderer(
  config: RendererConfig | undefined,
  layout: LayoutProvider,
): SheetXRenderer {
  if (config?.engine) return config.engine
  switch (config?.kind ?? 'canvas') {
    case 'dom':
      return new DomRenderer(layout)
    case 'hybrid':
    case 'canvas':
      return new HybridRenderer(layout)
  }
}
