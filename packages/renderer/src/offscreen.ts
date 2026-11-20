/**
 * @sheetx/renderer - OffscreenCanvas 后台渲染器（正式方案「渲染 Worker」加速层）
 *
 * 设计纪律（与 @sheetx/worker 一致）：
 * 1. 内联 Worker（Blob URL），零构建产物、零第三方依赖；
 * 2. 能力检测不满足（Node / 旧浏览器 / canvas 已被主线程 getContext）时，
 *    自动降级到主线程 Canvas2DRenderer —— 新 API 缺失绝不让表格不可用；
 * 3. Worker 只接收「渲染场景 + 视口」，不读任何业务数据结构（渲染器不解释业务）；
 * 4. 每帧把整帧绘制搬离主线程；脏矩形优化仍保留在主线程 Canvas2DRenderer，
 *    因为 Worker 侧无法低成本访问上一帧像素做增量搬移。
 *
 * 该渲染器实现 core 的 Renderer 接口。注意 render() 是「提交渲染帧」语义（异步），
 * 主线程不阻塞；统计通过 getStats()/waitForStats() 异步读取。
 */

import type { DirtyRect, RenderScene } from '@sheetx/core'
import { Canvas2DRenderer } from './canvas2d-renderer.js'
import type { RenderStats } from './canvas2d-renderer.js'

export type OffscreenRendererMode = 'worker' | 'main'

export interface OffscreenStats extends RenderStats {
  /** Worker 完成渲染的帧序号 */
  frame: number
  /** 画布中心采样像素 [r,g,b,a]，供浏览器验收确认「真的画上了」 */
  sample: [number, number, number, number] | null
}

export interface OffscreenRendererOptions {
  /** 强制主线程降级（测试/兼容模式） */
  forceMainThread?: boolean
  /** 注入 Worker（测试/宿主自建 worker 场景） */
  worker?: Worker
}

/**
 * 能力检测：OffscreenCanvas + transferControlToOffscreen + Worker + Blob URL 全部可用。
 * Node/jsdom 下恒为 false，自动走主线程降级。
 */
export function isOffscreenRendererAvailable(): boolean {
  return (
    typeof OffscreenCanvas !== 'undefined' &&
    typeof Worker !== 'undefined' &&
    typeof Blob !== 'undefined' &&
    typeof URL !== 'undefined' &&
    typeof URL.createObjectURL === 'function' &&
    typeof HTMLCanvasElement !== 'undefined' &&
    typeof HTMLCanvasElement.prototype.transferControlToOffscreen === 'function'
  )
}

/**
 * Worker 端脚本（纯 JS 字符串，不 import 任何模块）。
 * DrawCommand 判别联合与 canvas2d-renderer.executeCommand 保持同一契约：
 * rect / text / line / polyline / clip / clip-end，content 指令按 viewport 平移，
 * viewport 指令原样绘制；text 支持省略号与多行。
 */
const WORKER_SOURCE = `
var ctx = null;
var dpr = 1;
var cssWidth = 0;
var cssHeight = 0;
var textCache = new Map();

function measure(text, font) {
  var key = font + '\u0000' + text;
  var v = textCache.get(key);
  if (v === undefined) {
    ctx.font = font;
    v = ctx.measureText(text).width;
    textCache.set(key, v);
  }
  return v;
}
function truncate(text, font, maxWidth) {
  var low = 0, high = text.length, e = '…';
  while (low < high) {
    var mid = Math.ceil((low + high) / 2);
    if (measure(text.slice(0, mid) + e, font) <= maxWidth) low = mid;
    else high = mid - 1;
  }
  return text.slice(0, low) + e;
}
function exec(cmd, viewport) {
  var space = cmd.space || 'content';
  if (cmd.t === 'clip') {
    ctx.save();
    ctx.beginPath();
    var ox = space === 'content' ? -viewport.x : 0;
    var oy = space === 'content' ? -viewport.y : 0;
    ctx.rect(cmd.x + ox, cmd.y + oy, cmd.w, cmd.h);
    ctx.clip();
    return;
  }
  if (cmd.t === 'clip-end') { ctx.restore(); return; }
  if (space === 'content') ctx.translate(-viewport.x, -viewport.y);
  try {
    if (cmd.t === 'rect') {
      if (cmd.fill) { ctx.fillStyle = cmd.fill; ctx.fillRect(cmd.x, cmd.y, cmd.w, cmd.h); }
      if (cmd.stroke) { ctx.strokeStyle = cmd.stroke; ctx.lineWidth = cmd.lineWidth || 1; ctx.strokeRect(cmd.x, cmd.y, cmd.w, cmd.h); }
    } else if (cmd.t === 'line') {
      ctx.strokeStyle = cmd.stroke; ctx.lineWidth = cmd.width || 1;
      ctx.beginPath(); ctx.moveTo(cmd.x1, cmd.y1); ctx.lineTo(cmd.x2, cmd.y2); ctx.stroke();
    } else if (cmd.t === 'polyline') {
      ctx.strokeStyle = cmd.stroke; ctx.lineWidth = cmd.width || 1;
      ctx.beginPath();
      (cmd.points || []).forEach(function (pt, i) { if (i === 0) ctx.moveTo(pt[0], pt[1]); else ctx.lineTo(pt[0], pt[1]); });
      ctx.stroke();
    } else if (cmd.t === 'text') {
      ctx.font = cmd.font;
      ctx.fillStyle = cmd.fill || '#333';
      ctx.textAlign = cmd.align || 'left';
      ctx.textBaseline = cmd.baseline || 'middle';
      var text = cmd.text;
      if (cmd.maxWidth !== undefined && measure(text, cmd.font) > cmd.maxWidth) text = truncate(text, cmd.font, cmd.maxWidth);
      if (text.indexOf('\\n') >= 0) {
        var lines = text.split('\\n');
        var fontSize = parseFloat(cmd.font) || 13;
        var lineHeight = fontSize * 1.35;
        var total = lines.length * lineHeight;
        var baseline = cmd.baseline || 'middle';
        var startY = cmd.y;
        if (baseline === 'middle') startY = cmd.y - total / 2 + lineHeight / 2;
        else if (baseline === 'bottom') startY = cmd.y - total + lineHeight / 2;
        else startY = cmd.y + lineHeight / 2;
        ctx.textBaseline = 'middle';
        for (var i = 0; i < lines.length; i++) {
          var line = lines[i] || '';
          if (cmd.maxWidth !== undefined && measure(line, cmd.font) > cmd.maxWidth) line = truncate(line, cmd.font, cmd.maxWidth);
          ctx.fillText(line, cmd.x, startY + i * lineHeight, cmd.maxWidth);
        }
      } else {
        ctx.fillText(text, cmd.x, cmd.y, cmd.maxWidth);
      }
    }
  } finally {
    if (space === 'content') ctx.translate(viewport.x, viewport.y);
  }
}
function resizeCanvas(width, height, ratio) {
  cssWidth = width; cssHeight = height; dpr = ratio;
  ctx.canvas.width = Math.max(1, Math.round(width * dpr));
  ctx.canvas.height = Math.max(1, Math.round(height * dpr));
}
self.onmessage = function (event) {
  var msg = event.data;
  if (!msg) return;
  if (msg.type === 'INIT') {
    try {
      ctx = msg.canvas.getContext('2d', { alpha: msg.alpha !== false });
      resizeCanvas(msg.width, msg.height, msg.dpr);
      self.postMessage({ type: 'READY' });
    } catch (err) {
      self.postMessage({ type: 'ERROR', message: String(err && err.message || err) });
    }
    return;
  }
  if (msg.type === 'RESIZE') {
    if (ctx) { resizeCanvas(msg.width, msg.height, msg.dpr); textCache.clear(); }
    return;
  }
  if (msg.type === 'RENDER') {
    if (!ctx) { self.postMessage({ type: 'ERROR', message: 'Worker 未初始化' }); return; }
    var started = performance.now();
    var scene = msg.scene || {};
    var viewport = scene.viewport || { x: 0, y: 0, width: cssWidth, height: cssHeight };
    var layers = (scene.layers || []).slice().sort(function (a, b) { return a.zIndex - b.zIndex; });
    var calls = 0;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssWidth, cssHeight);
    for (var l = 0; l < layers.length; l++) {
      if (layers[l].visible === false) continue;
      var commands = layers[l].commands || [];
      for (var c = 0; c < commands.length; c++) { exec(commands[c], viewport); calls++; }
    }
    var sample = null;
    try {
      var px = ctx.getImageData(Math.floor(cssWidth / 2), Math.floor(cssHeight / 2), 1, 1).data;
      sample = [px[0], px[1], px[2], px[3]];
    } catch (ignored) {}
    self.postMessage({
      type: 'STATS',
      frame: msg.frame,
      stats: {
        lastRenderMs: performance.now() - started,
        drawCalls: calls,
        blitFrames: 0,
        frame: msg.frame,
        sample: sample,
      },
    });
    return;
  }
  if (msg.type === 'DESTROY') { ctx = null; self.close(); }
};
`

export class OffscreenRenderer {
  private fallback: Canvas2DRenderer | null
  private currentMode: OffscreenRendererMode
  private worker: Worker | null = null
  private objectUrl: string | null = null
  private ownsWorker = false
  private frame = 0
  private dpr = 1
  private cssWidth = 0
  private cssHeight = 0
  private lastStats: OffscreenStats | null = null
  private readonly statsWaiters: Array<(stats: OffscreenStats) => void> = []
  private ready = false
  private disposed = false

  get mode(): OffscreenRendererMode {
    return this.currentMode
  }

  constructor(options: OffscreenRendererOptions = {}) {
    const canUse = !options.forceMainThread && (!!options.worker || isOffscreenRendererAvailable())
    if (canUse) {
      this.fallback = null
      this.currentMode = 'worker'
      this.worker = options.worker ?? null
    } else {
      this.fallback = new Canvas2DRenderer()
      this.currentMode = 'main'
    }
  }

  /** core Renderer 接口：绑定画布。worker 模式把控制权转移给 Worker；失败则降级。 */
  initialize(canvas: HTMLCanvasElement): void {
    if (this.disposed) return
    this.dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
    if (this.mode === 'main') {
      this.fallback!.initialize(canvas)
      return
    }
    let offscreen: OffscreenCanvas
    try {
      offscreen = canvas.transferControlToOffscreen()
    } catch {
      // 已被主线程 getContext 等导致无法转移 —— 降级，不抛错
      this.downgrade(canvas)
      return
    }
    try {
      if (!this.worker) {
        if (!isOffscreenRendererAvailable()) {
          this.downgrade(canvas)
          return
        }
        this.objectUrl = URL.createObjectURL(new Blob([WORKER_SOURCE], { type: 'text/javascript' }))
        this.worker = new Worker(this.objectUrl)
        this.ownsWorker = true
      }
      this.worker.onmessage = (event: MessageEvent<{ type: string; message?: string; stats?: OffscreenStats; frame?: number }>): void => {
        const msg = event.data
        if (msg?.type === 'ERROR') {
          // Worker 端运行异常：降级到主线程，避免整块画布永久空白
          console.warn('[SheetX] 渲染 Worker 异常，降级到主线程：', msg.message)
          this.downgrade()
          return
        }
        if (msg?.type === 'READY') this.ready = true
        if (msg?.type === 'STATS' && msg.stats) {
          this.lastStats = msg.stats
          const waiters = this.statsWaiters.splice(0)
          waiters.forEach((resolve) => resolve(msg.stats!))
        }
      }
      this.worker.onerror = (): void => this.downgrade()
      this.worker.postMessage(
        { type: 'INIT', canvas: offscreen, width: this.cssWidth, height: this.cssHeight, dpr: this.dpr, alpha: true },
        [offscreen],
      )
    } catch {
      this.downgrade(canvas)
    }
  }

  /** 降级到主线程：保留已绑定的 canvas（initialize 时）或等待重新绑定。 */
  private downgrade(canvas?: HTMLCanvasElement): void {
    if (this.mode === 'main') return
    this.disposeWorker()
    this.currentMode = 'main'
    this.fallback = new Canvas2DRenderer()
    if (canvas) this.fallback!.initialize(canvas)
    this.fallback!.resize(this.cssWidth, this.cssHeight)
  }

  resize(width: number, height: number): void {
    this.cssWidth = width
    this.cssHeight = height
    if (this.mode === 'main') {
      this.fallback!.resize(width, height)
      return
    }
    if (this.worker && this.ready) {
      this.worker.postMessage({ type: 'RESIZE', width, height, dpr: this.dpr })
    }
  }

  invalidate(rect?: DirtyRect): void {
    if (this.mode === 'main') this.fallback!.invalidate(rect)
    // worker 模式每帧整绘，invalidate 无需额外状态
  }

  render(scene: RenderScene): void {
    if (this.mode === 'main') {
      this.fallback!.render(scene)
      return
    }
    if (!this.worker) return
    const frame = ++this.frame
    this.worker.postMessage({ type: 'RENDER', scene, frame })
  }

  destroy(): void {
    if (this.disposed) return
    this.disposed = true
    this.disposeWorker()
    if (this.fallback) this.fallback.destroy()
    for (const waiter of this.statsWaiters.splice(0)) {
      waiter(this.lastStats ?? { lastRenderMs: 0, drawCalls: 0, blitFrames: 0, frame: 0, sample: null })
    }
  }

  /** 最近一次渲染统计（worker 模式异步到达；主线程模式读内部渲染器）。 */
  getStats(): OffscreenStats {
    if (this.mode === 'main') {
      const s = this.fallback!.stats
      return { ...s, frame: 0, sample: null }
    }
    return this.lastStats ?? { lastRenderMs: 0, drawCalls: 0, blitFrames: 0, frame: 0, sample: null }
  }

  /** 等待下一帧渲染统计到达（浏览器验收/诊断用）。 */
  waitForStats(): Promise<OffscreenStats> {
    if (this.mode === 'main') return Promise.resolve(this.getStats())
    if (this.lastStats) return Promise.resolve(this.lastStats)
    return new Promise((resolve) => this.statsWaiters.push(resolve))
  }

  private disposeWorker(): void {
    if (this.worker) {
      try { this.worker.postMessage({ type: 'DESTROY' }) } catch { /* 已退出 */ }
      this.worker.onmessage = null
      this.worker.onerror = null
      if (this.ownsWorker) {
        this.worker.terminate()
        if (this.objectUrl) URL.revokeObjectURL(this.objectUrl)
      }
    }
    this.worker = null
    this.objectUrl = null
    this.ownsWorker = false
    this.ready = false
  }
}
