/**
 * OffscreenCanvas 渲染器测试
 *
 * node 环境无 OffscreenCanvas，验证能力检测与主线程降级；
 * 注入假 Worker 验证 INIT/RENDER/RESIZE/DESTROY 消息协议与统计回传，
 * 不依赖真实浏览器线程（真实路径由 apps/e2e 覆盖）。
 */
import { describe, it, expect, vi } from 'vitest'
import type { RenderScene } from '@sheetx/core'
import { OffscreenRenderer, isOffscreenRendererAvailable } from '../src/offscreen.js'

function fakeScene(): RenderScene {
  return {
    viewport: { x: 0, y: 0, width: 200, height: 100 },
    dpr: 1,
    layers: [
      { id: 'bg', zIndex: 0, commands: [{ t: 'rect', x: 0, y: 0, w: 200, h: 100, fill: '#fff' }] },
      { id: 'fg', zIndex: 1, commands: [{ t: 'text', x: 5, y: 10, text: 'A1', font: '13px sans-serif' }] },
    ],
  }
}

/** node 下无真实画布：getContext 返回 null 让主线程渲染器进入无头模式；transfer 供 worker 路径用。 */
function fakeCanvas(): HTMLCanvasElement {
  return {
    getContext: () => null,
    transferControlToOffscreen: vi.fn(() => ({ tag: 'offscreen' })),
    width: 0,
    height: 0,
    style: {},
  } as unknown as HTMLCanvasElement
}

class FakeWorker {
  static instances: FakeWorker[] = []
  onmessage: ((e: MessageEvent) => void) | null = null
  onerror: ((e: ErrorEvent) => void) | null = null
  messages: Array<{ data: unknown; transfer?: Transferable[] }> = []
  closed = false

  constructor() {
    FakeWorker.instances.push(this)
  }

  postMessage(data: unknown, transfer?: Transferable[]): void {
    this.messages.push({ data, transfer })
  }

  terminate(): void {
    this.closed = true
  }

  emit(msg: unknown): void {
    this.onmessage?.({ data: msg } as MessageEvent)
  }
}

describe('OffscreenRenderer 能力检测与降级', () => {
  it('Node 环境能力检测为 false 并走主线程模式', () => {
    expect(isOffscreenRendererAvailable()).toBe(false)
    const renderer = new OffscreenRenderer()
    expect(renderer.mode).toBe('main')
    renderer.destroy()
  })

  it('forceMainThread 强制主线程，不创建 Worker', () => {
    const renderer = new OffscreenRenderer({ forceMainThread: true })
    expect(renderer.mode).toBe('main')
    expect(renderer.getStats()).toMatchObject({ frame: 0, sample: null })
    renderer.destroy()
  })

  it('主线程模式 initialize/resize/invalidate/render/destroy 不抛错', () => {
    const renderer = new OffscreenRenderer({ forceMainThread: true })
    expect(() => {
      renderer.initialize(fakeCanvas())
      renderer.resize(300, 150)
      renderer.invalidate({ x: 0, y: 0, width: 10, height: 10 })
      renderer.render(fakeScene())
      renderer.getStats()
    }).not.toThrow()
    renderer.destroy()
  })
})

describe('OffscreenRenderer Worker 消息协议（注入 FakeWorker）', () => {
  it('构造即 worker 模式，initialize 发送 INIT（含 transfer 列表）', () => {
    FakeWorker.instances = []
    const fake = new FakeWorker() as unknown as Worker
    const renderer = new OffscreenRenderer({ worker: fake })
    expect(renderer.mode).toBe('worker')

    renderer.initialize(fakeCanvas())
    const init = FakeWorker.instances[0]!.messages[0]!
    expect((init.data as { type: string }).type).toBe('INIT')
    expect(init.transfer).toHaveLength(1)
    renderer.destroy()
  })

  it('render 发送 RENDER 场景帧号递增，STATS 回传可被 waitForStats 消费', async () => {
    FakeWorker.instances = []
    const fake = new FakeWorker() as unknown as Worker
    const renderer = new OffscreenRenderer({ worker: fake })
    renderer.initialize(fakeCanvas())

    const readyWait = renderer.waitForStats()
    FakeWorker.instances[0]!.emit({
      type: 'STATS',
      frame: 1,
      stats: { lastRenderMs: 3.2, drawCalls: 7, blitFrames: 0, frame: 1, sample: [255, 255, 255, 255] },
    })

    renderer.render(fakeScene())
    renderer.render(fakeScene())
    const renders = FakeWorker.instances[0]!.messages.filter((m) => (m.data as { type: string }).type === 'RENDER')
    expect(renders).toHaveLength(2)
    expect((renders[0]!.data as { frame: number }).frame).toBe(1)
    expect((renders[1]!.data as { frame: number }).frame).toBe(2)
    expect((renders[0]!.data as { scene: RenderScene }).scene.layers).toHaveLength(2)

    const stats = await readyWait
    expect(stats.drawCalls).toBe(7)
    expect(stats.sample).toEqual([255, 255, 255, 255])
    expect(renderer.getStats().frame).toBe(1)
    renderer.destroy()
  })

  it('READY 后 resize 发送 RESIZE；注入的 worker 不由本类终止', () => {
    FakeWorker.instances = []
    const fake = new FakeWorker() as unknown as Worker
    const renderer = new OffscreenRenderer({ worker: fake })
    renderer.initialize(fakeCanvas())
    FakeWorker.instances[0]!.emit({ type: 'READY' })
    renderer.resize(640, 480)
    const types = FakeWorker.instances[0]!.messages.map((m) => (m.data as { type: string }).type)
    expect(types).toContain('RESIZE')
    renderer.destroy()
    expect(FakeWorker.instances[0]!.closed).toBe(false)
  })

  it('Worker ERROR 自动降级到主线程且不抛错', () => {
    FakeWorker.instances = []
    const fake = new FakeWorker() as unknown as Worker
    const renderer = new OffscreenRenderer({ worker: fake })
    renderer.initialize(fakeCanvas())
    expect(renderer.mode).toBe('worker')
    FakeWorker.instances[0]!.emit({ type: 'ERROR', message: 'boom' })
    expect(renderer.mode).toBe('main')
    expect(() => renderer.render(fakeScene())).not.toThrow()
    renderer.destroy()
  })
})
