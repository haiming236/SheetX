/**
 * @sheetx/renderer - 渲染调度器（rAF 帧合流）
 *
 * 职责：把「任何时刻发生的任意多次 invalidate」合并成每帧最多一次 render。
 * 这是硬性架构约束：滚动/输入/数据变更一律只标脏，绝不直接画
 * （Luckysheet 注释掉 rAF 节流导致滚动风暴的教训）。
 *
 * 内容版本机制：
 * - markContentChanged()：数据/选区/主题变了 → 下一帧整帧重绘；
 * - 仅滚动（内容未变）→ 携带 scrollDelta 走渲染器的位块搬移路径。
 */

import type { DirtyRect, RenderScene } from '@sheetx/core'
import type { Canvas2DRenderer } from './canvas2d-renderer.js'

export interface RenderSchedulerOptions {
  /** 场景提供器：调度器在帧回调时才取场景（保证拿到的是当帧最新状态） */
  getScene: () => RenderScene
  /** 调试脏矩形可视化 */
  debugDirty?: boolean
}

export class RenderScheduler {
  private renderer: Canvas2DRenderer
  private getScene: () => RenderScene
  private debugDirty: boolean

  private pending = false
  private fullRedraw = false
  private contentVersion = 0
  private renderedContentVersion = -1
  private rafId: number | null = null

  /** FPS 采样（benchmark/调试用） */
  private frameTimestamps: number[] = []

  constructor(renderer: Canvas2DRenderer, options: RenderSchedulerOptions) {
    this.renderer = renderer
    this.getScene = options.getScene
    this.debugDirty = options.debugDirty ?? false
  }

  /** 请求一帧渲染（可带脏矩形；多次调用在下一帧合并） */
  request(rect?: DirtyRect): void {
    if (rect) this.renderer.invalidate(rect)
    if (this.pending) return
    this.pending = true
    this.rafId = requestAnimationFrame(() => this.frame())
  }

  /**
   * 内容已变化（数据/选区/主题）——下一帧强制整帧重绘，不走位块搬移。
   * rect 可选：单格编辑传入局部矩形，debugDirty 红框才能只圈出被改单元格；
   * 不传则按整帧调试提示处理（规格变化/主题切换等）。
   */
  markContentChanged(rect?: DirtyRect): void {
    this.contentVersion++
    this.request(rect)
  }

  /** 强制下一帧整帧重绘（resize 后由渲染器 invalidate 也会触发同等效果） */
  forceFullRedraw(): void {
    this.fullRedraw = true
    this.request()
  }

  /** 仅滚动（内容未变）：下一帧走 scroll-preserve 位块搬移路径 */
  requestScrollFrame(): void {
    // 调度器逐帧比较 viewport 得到 scrollDelta；渲染器用 getImageData/putImageData
    // 做纯像素搬移（不经过 drawImage 合成，软件渲染管线也安全），只重绘暴露带
    // 与固定带（表头/行头/冻结行）。内容版本变化时仍由 markContentChanged 走整帧。
    this.request()
  }

  frame(): void {
    this.pending = false
    const scene = this.getScene()
    // 计算 scrollDelta：viewport.x/y 是可见区在内容坐标中的原点
    let scrollDelta: { dx: number; dy: number } | undefined
    if (this.renderer.hasFrame && !this.fullRedraw && this.contentVersion === this.renderedContentVersion) {
      // 与上一帧视口对比——需要渲染器记录上帧 viewport；这里通过 renderer.stats 无法拿到，
      // 因此调度器自己保存上一帧 viewport。
      if (this.lastViewport) {
        scrollDelta = { dx: scene.viewport.x - this.lastViewport.x, dy: scene.viewport.y - this.lastViewport.y }
      }
    }
    const full = this.fullRedraw || this.contentVersion !== this.renderedContentVersion || !this.renderer.hasFrame
    this.renderer.render(scene, {
      fullRedraw: full,
      scrollDelta: full ? undefined : scrollDelta,
      debugDirty: this.debugDirty,
    })
    this.lastViewport = { ...scene.viewport }
    this.renderedContentVersion = this.contentVersion
    this.fullRedraw = false
    this.trackFps()
  }

  /** 当前 FPS（1 秒窗口） */
  getFps(): number {
    const now = performance.now()
    this.frameTimestamps = this.frameTimestamps.filter((t) => now - t < 1000)
    return this.frameTimestamps.length
  }

  dispose(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId)
    this.rafId = null
    this.pending = false
  }

  private lastViewport: { x: number; y: number } | null = null

  private trackFps(): void {
    const now = performance.now()
    this.frameTimestamps.push(now)
    if (this.frameTimestamps.length > 120) this.frameTimestamps.shift()
  }
}
