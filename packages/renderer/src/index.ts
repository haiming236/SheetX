/**
 * @sheetx/renderer - 渲染引擎
 *
 * 职责：Canvas 2D 分层渲染、脏区域、文本缓存、滚动帧复用（任务书 T2）。
 * 依赖方向：只依赖 @sheetx/core（渲染器不读取任何业务数据结构）。
 */

export { Canvas2DRenderer, isPointInRect } from './canvas2d-renderer.js'
export type { RenderOptions, RenderStats } from './canvas2d-renderer.js'
export { RenderScheduler } from './render-scheduler.js'
export { OffscreenRenderer, isOffscreenRendererAvailable } from './offscreen.js'
export type { OffscreenRendererMode, OffscreenRendererOptions, OffscreenStats } from './offscreen.js'
export { TextCache } from './text-cache.js'
export type { TextMetrics } from './text-cache.js'
export {
  fontString,
  drawRect,
  drawText,
  unionRects,
  rectsIntersect,
} from './commands.js'
export type { DrawCommand, CoordSpace } from './commands.js'

// ---- 分层渲染器（DOM / Canvas / Hybrid 可替换实现）----
export {
  DomRenderer,
  HybridRenderer,
  createRenderer,
  type LayoutProvider,
} from './hybrid-renderer.js'
