/**
 * @sheetx/renderer - 文本度量缓存
 *
 * measureText 是 Canvas 渲染最昂贵的调用之一（触发字体整形），
 * 表格一帧要测成百上千个文本。这里做两级缓存：
 *   键 = font 字符串 + 文本内容 → { width, ascent, descent }
 *
 * 缓存管理借鉴 Univer FontCache 的两个关键机制（思想借鉴，实现自研）：
 * 1. 容量上限 + 减半淘汰——长会话下文本组合无限增长，必须有界；
 * 2. metricsRevision 版本号——字体加载完成/DPR 变化时整体失效，
 *   上层（视口缓存等）靠版本号联动，而不是逐个通知。
 */

export interface TextMetrics {
  /** 文本宽度（CSS 像素） */
  width: number
  /** 基线到行框顶部 */
  ascent: number
  /** 基线到行框底部 */
  descent: number
}

const CACHE_CAPACITY = 100_000

export class TextCache {
  /** 度量版本号：任何整体失效都会自增，上层据此判断缓存是否仍然有效 */
  metricsRevision = 1

  private cache = new Map<string, TextMetrics>()
  private measureCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null

  /**
   * 度量文本。无 DOM 环境（纯 Node 测试）下降级为估算——
   * 纯逻辑层（虚拟化/布局）的测试不依赖真实字体度量。
   */
  measure(text: string, font: string): TextMetrics {
    const key = `${font}\u0000${text}`
    const cached = this.cache.get(key)
    if (cached) return cached
    const metrics = this.measureUncached(text, font)
    // FIFO 淘汰：Map 保持插入序，超限删掉前一半（比逐条 LRU 便宜得多，效果相近）
    if (this.cache.size >= CACHE_CAPACITY) {
      const entries = [...this.cache.entries()]
      this.cache.clear()
      for (const [k, v] of entries.slice(entries.length / 2)) this.cache.set(k, v)
    }
    this.cache.set(key, metrics)
    return metrics
  }

  /** 文本宽度（最常用路径的快捷方法） */
  width(text: string, font: string): number {
    return this.measure(text, font).width
  }

  /** 整体失效（字体加载/DPR 变化时调用）；版本号自增驱动上层缓存联动 */
  invalidateAll(): void {
    this.cache.clear()
    this.metricsRevision++
  }

  get size(): number {
    return this.cache.size
  }

  private measureUncached(text: string, font: string): TextMetrics {
    const ctx = this.ensureContext()
    if (!ctx) {
      // 无 DOM 环境：按 0.62em/字符估算（够测试断言用，不能用于生产度量）
      const estimated = text.length * 6.2
      return { width: estimated, ascent: 8, descent: 4 }
    }
    ctx.font = font
    const metrics = ctx.measureText(text)
    return {
      width: metrics.width,
      // fontBoundingBox 在部分老实现缺失时用 actualBoundingBox 兜底
      ascent: metrics.fontBoundingBoxAscent ?? metrics.actualBoundingBoxAscent ?? 10,
      descent: metrics.fontBoundingBoxDescent ?? metrics.actualBoundingBoxDescent ?? 4,
    }
  }

  private ensureContext(): CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null {
    if (this.measureCtx) return this.measureCtx
    try {
      // OffscreenCanvas 优先：不触碰主文档 DOM（Worker 里也能用）
      if (typeof OffscreenCanvas !== 'undefined') {
        const canvas = new OffscreenCanvas(10, 10)
        this.measureCtx = canvas.getContext('2d')
        return this.measureCtx
      }
      if (typeof document !== 'undefined') {
        const canvas = document.createElement('canvas')
        this.measureCtx = canvas.getContext('2d')
        return this.measureCtx
      }
    } catch {
      /* 环境不支持则走估算降级 */
    }
    return null
  }
}
