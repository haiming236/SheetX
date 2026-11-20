/**
 * @sheetx/core - 渲染接口
 *
 * 来自正式方案的 Renderer 接口（L67-79）。渲染器通过接口提供绘制能力，
 * 不直接依赖任何业务模式的数据结构。业务层只需实现 RenderScene。
 */

import type { CellRange, Rect } from './types.js'

/** 脏区域矩形别名 */
export type DirtyRect = Rect

/** 渲染场景：渲染器消费的纯数据描述（不含业务模型） */
export interface RenderScene {
  /** 视口区域（像素） */
  viewport: Rect
  /** 待绘制的图层数据（由上层生成，渲染器不解释业务含义） */
  layers: RenderLayer[]
  /** 设备像素比 */
  dpr: number
  /**
   * 不随内容滚动的固定带尺寸（CSS px）：顶部=列头+冻结行，左侧=行头+冻结列。
   * 渲染器走滚动位块搬移时，这些带不能跟着整帧像素位移，必须在搬移后单独重绘。
   */
  fixedBands?: { top: number; left: number }
}

/** 渲染图层 */
export interface RenderLayer {
  id: string
  zIndex: number
  /** 图层绘制指令（不透明数据，由各模式自行定义结构） */
  commands: unknown[]
  visible?: boolean
}

/** 统一渲染接口（第一版实现 Canvas2DRenderer，未来可加 Offscreen/WebGPU） */
export interface Renderer {
  initialize(canvas: HTMLCanvasElement): void
  resize(width: number, height: number): void
  render(scene: RenderScene): void
  invalidate(rect?: DirtyRect): void
  destroy(): void
}

/* ============================================================================
 * 渲染架构（Canvas + DOM 混合）契约
 *
 * 设计原则：
 * 1. core 完全不依赖 DOM / Canvas —— 只定义契约与纯数据类型；
 * 2. DOM / Canvas / Hybrid 是**可替换实现**，业务层不直接依赖具体技术；
 * 3. 现有 Renderer / RenderScene 保持向后兼容，新契约以扩展方式加入。
 * ==========================================================================*/

/** 渲染技术类型（可替换实现的选择） */
export type RendererKind = 'dom' | 'canvas' | 'hybrid'

/**
 * 画布渲染层（由 Canvas 主渲染器绘制，不产生 DOM 节点）
 *
 * 典型分层（zIndex 从小到大）：背景 → 网格线 → 单元格文字/数字 → 选区 → 交互高亮。
 */
export type CanvasLayerKind = 'background' | 'gridlines' | 'cells' | 'selection' | 'interaction'

/** DOM 覆盖层（编辑器/下拉/右键菜单等需要原生 DOM 能力的控件） */
export type DomOverlayKind =
  | 'editor'           // 单元格输入框
  | 'picker'           // 下拉 / 日期选择器
  | 'formula-bar'      // 公式编辑框
  | 'context-menu'     // 右键菜单
  | 'tooltip'

/** 视口：可见区域 + 滚动偏移（布局引擎计算后交给渲染器） */
export interface Viewport {
  /** 可见区域（CSS px，相对画布左上角） */
  rect: Rect
  /** 内容滚动偏移（px） */
  scrollLeft: number
  /** 内容滚动偏移（px） */
  scrollTop: number
  /** 每行/列的可见范围（零基，闭区间） */
  firstRow: number
  lastRow: number
  firstCol: number
  lastCol: number
}

/** 命中检测结果：屏幕坐标 → 单元格地址 */
export interface HitResult {
  row: number
  col: number
  /** 命中区域类型，用于区分表头与数据区 */
  zone: 'body' | 'col-header' | 'row-header' | 'corner' | 'outside'
}

/**
 * 分层渲染器接口（正式契约）
 *
 * 与旧 Renderer 并存：旧接口走 RenderScene + commands（Canvas 内部实现），
 * 新接口暴露"分层 + 命中检测 + DOM 覆盖层"的产品级能力。
 */
export interface SheetXRenderer {
  /** 渲染技术标识，供 UI/调试显示 */
  readonly kind: RendererKind
  /** 挂载：canvas 渲染层与 DOM 覆盖层各用一个容器 */
  initialize(host: HTMLElement, overlayHost?: HTMLElement): void
  /** 视口变化（滚动/缩放/尺寸变化） */
  setViewport(viewport: Viewport): void
  /** 绘制指定画布图层；range 省略表示重绘全部可见区域 */
  renderLayer(layer: CanvasLayerKind, range?: CellRange): void
  /** 绘制选区（交互层，高频增量） */
  renderSelection(selection: CellRange | null): void
  /** 坐标 → 单元格（Canvas 必需；DOM 实现可退化为 elementFromPoint） */
  hitTest(x: number, y: number): HitResult | null
  /** 挂载/更新一个 DOM 覆盖控件（编辑器等） */
  showOverlay(kind: DomOverlayKind, element: HTMLElement, rect: Rect): void
  /** 隐藏指定 DOM 覆盖控件 */
  hideOverlay(kind: DomOverlayKind): void
  /** 尺寸变化 */
  resize(width: number, height: number): void
  /** 释放全部资源（含 DOM 覆盖层） */
  destroy(): void
}

/** 渲染器选择配置（宿主可覆盖；缺省由各引擎决定） */
export interface RendererConfig {
  kind?: RendererKind
  /** 完全自定义实现（优先于 kind） */
  engine?: SheetXRenderer
  /** 设备像素比上限，默认 2 */
  maxDpr?: number
}
