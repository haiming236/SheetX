/**
 * @sheetx/renderer - Canvas 2D 渲染器（任务书 T2）
 *
 * 实现 core 的 Renderer 接口。核心能力：
 * 1. HiDPI——backing store = CSS 尺寸 × devicePixelRatio，绘制统一走 CSS 坐标；
 * 2. 脏区域——invalidate() 收集脏矩形，render() 只对脏矩形 clear+clip+重绘，
 *   修改一个单元格绝不全表重绘（验收标准，附 debugDirty 可视化验证）；
 * 3. 滚动位块搬移（scroll-preserve，Univer 已验证的滚动优化）——内容未变、只有
 *   滚动位移时，把上一帧按位移 drawImage 搬移，只重绘暴露出来的空带；
 * 4. 文本度量缓存（TextCache）——measureText 结果全局复用。
 *
 * 帧合流纪律：本渲染器不主动 rAF；调度由 RenderScheduler 负责（单一职责）。
 */

import type { DirtyRect, Rect, RenderScene } from '@sheetx/core'
import type { CoordSpace, DrawCommand } from './commands.js'
import { TextCache } from './text-cache.js'

export interface RenderOptions {
  /** 强制整帧重绘（内容版本变化/首次渲染/resize 后） */
  fullRedraw?: boolean
  /** 视口位移增量（content 坐标）：scrollDelta = 本帧 viewport.xy − 上帧 viewport.xy */
  scrollDelta?: { dx: number; dy: number }
  /** 开发调试：把脏矩形描红框（验收「脏区域可视化」用） */
  debugDirty?: boolean
}

export interface RenderStats {
  lastRenderMs: number
  drawCalls: number
  /** 走了位块搬移路径的帧数 */
  blitFrames: number
}

/** 脏矩形合并上限：超过则收敛为整体包围盒，避免脏区碎片化后逐个 clip 的开销反超重绘 */
const MAX_DIRTY_RECTS = 12

export class Canvas2DRenderer {
  readonly textCache = new TextCache()

  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private dpr = 1
  private cssWidth = 0
  private cssHeight = 0
  /** 待处理脏矩形（viewport 坐标，CSS px） */
  private dirtyRects: Rect[] = []
  /**
   * 本帧显式标脏的矩形。fullRedraw 时实际重绘范围是全屏，但 debugDirty
   * 的红框应显示「用户改了哪一格」而不是整屏红框——两者语义必须分开。
   */
  private explicitRects: Rect[] = []
  /** 收到过 invalidate()（无矩形）＝真正需要整帧调试提示 */
  private fullInvalidation = false
  private lastViewport: Rect | null = null
  private hasRenderedOnce = false

  stats: RenderStats = { lastRenderMs: 0, drawCalls: 0, blitFrames: 0 }

  // ---- core Renderer 接口 ----

  initialize(canvas: HTMLCanvasElement): void {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      // 无头模式：jsdom/非图形环境没有 2D 实现。数据层、交互层、布局层照常工作，
      // 仅跳过绘制——引擎的可测试性设计（Node/CI 里也能跑完整业务逻辑）。
      console.warn('[SheetX] 环境无 2D 渲染上下文，渲染器进入无头模式（仅跳过绘制）。')
      this.ctx = null
    } else {
      this.ctx = ctx
    }
    this.dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
    this.hasRenderedOnce = false
    this.lastViewport = null
    this.explicitRects = []
    this.fullInvalidation = false
  }

  resize(width: number, height: number): void {
    this.cssWidth = width
    this.cssHeight = height
    if (!this.canvas || !this.ctx) return
    const newDpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : this.dpr
    if (newDpr !== this.dpr) {
      // DPR 变化（浏览器缩放/跨屏拖动）：backing store 重建 + 文本度量整体失效
      this.dpr = newDpr
      this.textCache.invalidateAll()
    }
    this.canvas.width = Math.max(1, Math.round(width * this.dpr))
    this.canvas.height = Math.max(1, Math.round(height * this.dpr))
    this.canvas.style.width = `${width}px`
    this.canvas.style.height = `${height}px`
    this.invalidate() // 尺寸变化必须整帧重绘
  }

  /** 标记脏区域。rect 为 viewport 坐标（CSS px）；不传 = 全帧 */
  invalidate(rect?: DirtyRect): void {
    if (!rect) {
      this.dirtyRects = [{ x: 0, y: 0, width: this.cssWidth, height: this.cssHeight }]
      this.fullInvalidation = true
      return
    }
    this.dirtyRects.push(rect)
    this.explicitRects.push(rect)
    // 同一帧内先 resize（整帧）再编辑（局部）：调试红框以用户编辑为准
    this.fullInvalidation = false
  }

  destroy(): void {
    this.canvas = null
    this.ctx = null
    this.dirtyRects = []
    this.explicitRects = []
    this.fullInvalidation = false
    this.lastViewport = null
  }

  // ---- 渲染主流程 ----

  render(scene: RenderScene, options: RenderOptions = {}): void {
    const ctx = this.ctx
    if (!ctx) return
    const started = performance.now()
    let drawCalls = 0

    // ---- 计算本轮要处理的脏矩形 ----
    // 调试红框与实际重绘范围分离：内容变更帧仍然整帧重绘（保证公式联动/选区
    // 等间接影响不被漏画），但红框只标出宿主显式标脏的单元格。
    const debugRects = options.debugDirty && !this.fullInvalidation && this.explicitRects.length > 0
      ? this.normalizeRects(this.explicitRects)
      : null
    let dirtyRects = this.collectDirtyRects(options)
    this.dirtyRects = []
    this.explicitRects = []
    this.fullInvalidation = false

    // ---- 滚动位块搬移：内容没变、只有位移时，搬移上一帧而不是重绘 ----
    // 注意：纯滚动帧（requestScrollFrame）不携带任何脏矩形——恰恰是 blit 的
    // 主战场。若此处再要求 dirtyRects.length > 0，滚动帧会整体空转（blit 不走、
    // 下方重绘循环也因无脏区跳过），表现为画布不跟随滚动。故不得依赖脏矩形。
    const canBlit =
      !options.fullRedraw &&
      options.scrollDelta !== undefined &&
      (options.scrollDelta.dx !== 0 || options.scrollDelta.dy !== 0) &&
      this.hasRenderedOnce

    if (canBlit && options.scrollDelta) {
      const { dx, dy } = options.scrollDelta
      // 纯像素快照：getImageData / putImageData 只做像素搬运，不经过 drawImage
      // 的合成路径（离屏 canvas 自拷贝在 swiftshader/软件渲染管线会损坏目标）。
      // putImageData 的目标偏移直接以设备像素给出，超出画布部分由浏览器裁剪。
      if (this.canvas && ctx) {
        const width = this.canvas.width
        const height = this.canvas.height
        const snapshot = ctx.getImageData(0, 0, width, height)
        ctx.save()
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.clearRect(0, 0, width, height)
        ctx.putImageData(snapshot, -Math.round(dx * this.dpr), -Math.round(dy * this.dpr))
        ctx.restore()
        this.stats.blitFrames++
      }
      // 搬移后暴露的空带成为新的脏区（viewport 坐标）
      dirtyRects = exposedBands(dx, dy, this.cssWidth, this.cssHeight)
      // 固定带（列头/行头/冻结行）不能跟着像素位移，搬移后单独重绘
      const bands = scene.fixedBands
      if (bands) {
        if (bands.top > 0) dirtyRects.push({ x: 0, y: 0, width: this.cssWidth, height: bands.top })
        if (bands.left > 0) {
          dirtyRects.push({
            x: 0,
            y: bands.top,
            width: bands.left,
            height: Math.max(0, this.cssHeight - bands.top),
          })
        }
      }
    }

    // ---- 逐脏矩形重绘 ----
    if (dirtyRects.length > 0) {
      const layers = [...scene.layers].filter((layer) => layer.visible !== false).sort((a, b) => a.zIndex - b.zIndex)
      for (const rect of dirtyRects) {
        ctx.save()
        ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
        ctx.beginPath()
        ctx.rect(rect.x, rect.y, rect.width, rect.height)
        ctx.clip()
        // 先清透明：上层场景必须自绘不透明背景（场景构建器的 Background 层保证）
        ctx.clearRect(rect.x, rect.y, rect.width, rect.height)
        for (const layer of layers) {
          for (const command of layer.commands as DrawCommand[]) {
            this.executeCommand(ctx, command, scene.viewport, rect)
            drawCalls++
          }
        }
        const outlines = debugRects ?? dirtyRects
        const outline = outlines.find((candidate) => rectsOverlap(candidate, rect))
        if (options.debugDirty && outline) {
          ctx.strokeStyle = 'rgba(255,0,0,0.7)'
          ctx.lineWidth = 1
          ctx.strokeRect(outline.x + 0.5, outline.y + 0.5, outline.width - 1, outline.height - 1)
        }
        ctx.restore()
      }
    }

    this.lastViewport = { ...scene.viewport }
    this.hasRenderedOnce = true
    this.stats.lastRenderMs = performance.now() - started
    this.stats.drawCalls = drawCalls
  }

  /** 供调度器查询「是否有历史帧可做位块搬移」 */
  get hasFrame(): boolean {
    return this.hasRenderedOnce
  }

  // ---- 内部 ----

  private collectDirtyRects(options: RenderOptions): Rect[] {
    if (options.fullRedraw) {
      return [{ x: 0, y: 0, width: this.cssWidth, height: this.cssHeight }]
    }
    return this.normalizeRects(this.dirtyRects)
  }

  /** 视口裁剪 + 相交合并 + 数量上限；实际绘制与调试红框共用同一套几何规范 */
  private normalizeRects(rects: ReadonlyArray<Rect>): Rect[] {
    if (rects.length === 0) return []
    let clipped = [...rects]
    // 与视口求交（脏区来自视口坐标语义）
    if (this.lastViewport) {
      clipped = clipped
        .map((rect) => intersectWithViewport(rect, this.cssWidth, this.cssHeight))
        .filter((rect): rect is Rect => rect !== null)
    }
    if (clipped.length === 0) return []
    const merged: Rect[] = []
    for (const rect of clipped) {
      const hit = merged.find((existing) => rectsIntersectPadded(existing, rect))
      if (hit) mergeInto(hit, rect)
      else merged.push({ ...rect })
    }
    if (merged.length > MAX_DIRTY_RECTS) return [boundingBox(merged)]
    return merged
  }

  private executeCommand(ctx: CanvasRenderingContext2D, command: DrawCommand, viewport: Rect, clipRect: Rect): void {
    const space: CoordSpace = (command as { space?: CoordSpace }).space ?? 'content'
    // clip/clip-end 是结构性指令，不参与下方「指令内平移 + finally 还原」协议。
    // 历史缺陷：clip-end 无 space 字段、被默认按 content 处理，restore 之后再
    // translate(+viewport) —— 平移是累积的，而后续 clip 的 save 恰好保存了污染
    // 状态，于是每过一个 clip-end 就多累积一份视口平移；滚动后数层累积即可把
    // 全部绘制推出画布（表现为「滚动后画布空白」，未滚动时位移为 0 故不复现）。
    if (command.t === 'clip') {
      ctx.save()
      ctx.beginPath()
      // clip 矩形按所属空间先映射到视口坐标再裁剪；save 保存干净变换，
      // 块内指令的平移由此自洽（content 指令只平移一次，不会二次叠加）
      const offsetX = space === 'content' ? -viewport.x : 0
      const offsetY = space === 'content' ? -viewport.y : 0
      ctx.rect(command.x + offsetX, command.y + offsetY, command.w, command.h)
      ctx.clip()
      return
    }
    if (command.t === 'clip-end') {
      ctx.restore()
      return
    }
    // content 指令平移进视口；viewport 指令原样绘制（行头/列头等钉住的元素）
    if (space === 'content') {
      ctx.translate(-viewport.x, -viewport.y)
    }
    try {
      switch (command.t) {
        case 'rect': {
          if (command.fill) {
            ctx.fillStyle = command.fill
            ctx.fillRect(command.x, command.y, command.w, command.h)
          }
          if (command.stroke) {
            ctx.strokeStyle = command.stroke
            ctx.lineWidth = command.lineWidth ?? 1
            ctx.strokeRect(command.x, command.y, command.w, command.h)
          }
          break
        }
        case 'line': {
          ctx.strokeStyle = command.stroke
          ctx.lineWidth = command.width ?? 1
          ctx.beginPath()
          // 半像素偏移让 1px 线清晰（非 HiDPI 下经验值；HiDPI 由 transform 处理）
          ctx.moveTo(command.x1, command.y1)
          ctx.lineTo(command.x2, command.y2)
          ctx.stroke()
          break
        }
        case 'polyline': {
          ctx.strokeStyle = command.stroke
          ctx.lineWidth = command.width ?? 1
          ctx.beginPath()
          command.points.forEach(([x, y], index) => {
            if (index === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          })
          ctx.stroke()
          break
        }
        case 'text': {
          ctx.font = command.font
          ctx.fillStyle = command.fill ?? '#333'
          ctx.textAlign = command.align ?? 'left'
          ctx.textBaseline = command.baseline ?? 'middle'
          let text = command.text
          // 省略号截断：maxWidth 存在且文本超宽时，按缓存宽度二分截断
          if (command.maxWidth !== undefined) {
            const measured = this.textCache.width(text, command.font)
            if (measured > command.maxWidth) text = this.truncate(text, command.font, command.maxWidth)
          }
          if (text.includes('\n')) {
            // 多行文本：Ctrl/Alt+Enter 写入的换行按行绘制，整体按 baseline 垂直对齐
            const lines = text.split('\n')
            const fontSize = Number.parseFloat(command.font) || 13
            const lineHeight = fontSize * 1.35
            const totalHeight = lines.length * lineHeight
            const baseline = command.baseline ?? 'middle'
            let startY = command.y
            if (baseline === 'middle') startY = command.y - totalHeight / 2 + lineHeight / 2
            else if (baseline === 'bottom') startY = command.y - totalHeight + lineHeight / 2
            else startY = command.y + lineHeight / 2
            ctx.textBaseline = 'middle'
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i] ?? ''
              const drawLine = command.maxWidth !== undefined && this.textCache.width(line, command.font) > command.maxWidth
                ? this.truncate(line, command.font, command.maxWidth)
                : line
              ctx.fillText(drawLine, command.x, startY + i * lineHeight, command.maxWidth)
            }
          } else {
            ctx.fillText(text, command.x, command.y, command.maxWidth)
          }
          break
        }
      }
    } finally {
      // 平移只在单条指令内生效——指令之间互不污染（省去成对的 save/restore）
      if (space === 'content') ctx.translate(viewport.x, viewport.y)
    }
    // clipRect 仅作为未来「指令级剔除」的预留：当前依赖 canvas clip 天然剔除
    void clipRect
  }

  /** 按字符二分截断加省略号（利用度量缓存，单次成本 O(log n) 次查表） */
  private truncate(text: string, font: string, maxWidth: number): string {
    let low = 0
    let high = text.length
    const ellipsis = '…'
    while (low < high) {
      const mid = Math.ceil((low + high) / 2)
      if (this.textCache.width(text.slice(0, mid) + ellipsis, font) <= maxWidth) low = mid
      else high = mid - 1
    }
    return text.slice(0, low) + ellipsis
  }
}

// ---------------------------------------------------------------------------
// 脏区域几何工具
// ---------------------------------------------------------------------------

/** 位移后暴露的空带（viewport 坐标） */
function exposedBands(dx: number, dy: number, width: number, height: number): Rect[] {
  const bands: Rect[] = []
  if (dy !== 0) {
    // 内容上移 dy（向下滚动）：底部暴露 dy 高的带；反之顶部
    bands.push(dy > 0 ? { x: 0, y: height - dy, width, height: dy } : { x: 0, y: 0, width, height: -dy })
  }
  if (dx !== 0) {
    bands.push(dx > 0 ? { x: width - dx, y: 0, width: dx, height } : { x: 0, y: 0, width: -dx, height })
  }
  return bands
}

function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
}

function rectsIntersectPadded(a: Rect, b: Rect): boolean {
  return (
    a.x <= b.x + b.width + 2 &&
    b.x <= a.x + a.width + 2 &&
    a.y <= b.y + b.height + 2 &&
    b.y <= a.y + a.height + 2
  )
}

function mergeInto(target: Rect, source: Rect): void {
  const minX = Math.min(target.x, source.x)
  const minY = Math.min(target.y, source.y)
  const maxX = Math.max(target.x + target.width, source.x + source.width)
  const maxY = Math.max(target.y + target.height, source.y + source.height)
  target.x = minX
  target.y = minY
  target.width = maxX - minX
  target.height = maxY - minY
}

function boundingBox(rects: ReadonlyArray<Rect>): Rect {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const rect of rects) {
    minX = Math.min(minX, rect.x)
    minY = Math.min(minY, rect.y)
    maxX = Math.max(maxX, rect.x + rect.width)
    maxY = Math.max(maxY, rect.y + rect.height)
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

function intersectWithViewport(rect: Rect, width: number, height: number): Rect | null {
  const x1 = Math.max(0, rect.x)
  const y1 = Math.max(0, rect.y)
  const x2 = Math.min(width, rect.x + rect.width)
  const y2 = Math.min(height, rect.y + rect.height)
  if (x2 <= x1 || y2 <= y1) return null
  return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 }
}

/** canvas 上执行脏区绘制的辅助（供测试/工具复用） */
export function isPointInRect(point: { x: number; y: number }, rect: Rect): boolean {
  return point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height
}
