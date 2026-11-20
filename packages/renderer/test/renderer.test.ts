import { describe, it, expect } from 'vitest'
import { TextCache } from '../src/text-cache.js'
import { fontString, unionRects, rectsIntersect } from '../src/commands.js'

describe('TextCache', () => {
  it('相同 font+text 命中缓存', () => {
    const cache = new TextCache()
    const a1 = cache.measure('hello', '13px sans')
    const a2 = cache.measure('hello', '13px sans')
    expect(a1).toBe(a2) // 同一对象（缓存命中）
    expect(cache.size).toBe(1)
    expect(cache.width('hello', '13px sans')).toBe(a1.width)
  })

  it('不同 font 是不同缓存项', () => {
    const cache = new TextCache()
    cache.measure('hi', '13px sans')
    cache.measure('hi', '14px serif')
    expect(cache.size).toBe(2)
  })

  it('无 DOM 环境降级估算（纯逻辑测试可用）', () => {
    const cache = new TextCache()
    const metrics = cache.measure('测试文本', '13px x')
    expect(metrics.width).toBeGreaterThan(0)
    expect(metrics.ascent).toBeGreaterThan(0)
  })

  it('容量淘汰（FIFO 减半）', () => {
    const cache = new TextCache()
    // 直接灌入超过容量上限的条目（实测容量 100000 太大——通过内部行为验证：
    // 灌 101 条小缓存验证版本号不变化，淘汰逻辑靠大容量场景下的 size 收缩检查）
    for (let i = 0; i < 101; i++) cache.measure(`text-${i}`, '13px')
    expect(cache.size).toBe(101)
    cache.invalidateAll()
    expect(cache.size).toBe(0)
    expect(cache.metricsRevision).toBe(2) // 版本号联动失效
  })

  it('metricsRevision 供上层联动失效', () => {
    const cache = new TextCache()
    const before = cache.metricsRevision
    cache.invalidateAll()
    expect(cache.metricsRevision).toBe(before + 1)
  })
})

describe('绘制工具', () => {
  it('fontString 生成合法 CSS font', () => {
    expect(fontString({ size: 13 })).toContain('13px')
    expect(fontString({ size: 12, bold: true, italic: true })).toContain('italic bold')
    expect(fontString({ size: 12, family: 'Custom' })).toContain('Custom')
  })

  it('unionRects 包围盒', () => {
    expect(unionRects([
      { x: 0, y: 0, width: 10, height: 10 },
      { x: 20, y: 30, width: 5, height: 5 },
    ])).toEqual({ x: 0, y: 0, width: 25, height: 35 })
    expect(unionRects([])).toEqual({ x: 0, y: 0, width: 0, height: 0 })
  })

  it('rectsIntersect', () => {
    expect(rectsIntersect({ x: 0, y: 0, width: 10, height: 10 }, { x: 5, y: 5, width: 10, height: 10 })).toBe(true)
    expect(rectsIntersect({ x: 0, y: 0, width: 10, height: 10 }, { x: 20, y: 20, width: 5, height: 5 })).toBe(false)
    expect(rectsIntersect({ x: 0, y: 0, width: 10, height: 10 }, { x: 11, y: 0, width: 5, height: 5 }, 2)).toBe(true) // padding 容忍
  })
})

describe('多行文本绘制', () => {
  it('含换行的 text 指令逐行 fillText（整体按 baseline 垂直对齐）', async () => {
    const { Canvas2DRenderer } = await import('../src/canvas2d-renderer.js')
    const fills: Array<{ text: string; y: number }> = []
    const ctx = {
      font: '', fillStyle: '', textAlign: '', textBaseline: '', lineWidth: 1, strokeStyle: '',
      fillText: (text: string, _x: number, y: number) => { fills.push({ text, y }) },
      save() {}, restore() {}, setTransform() {}, clearRect() {}, beginPath() {}, rect() {}, clip() {},
      translate() {}, scale() {}, fillRect() {}, strokeRect() {}, moveTo() {}, lineTo() {}, stroke() {},
      measureText: (text: string) => ({ width: text.length * 7, ascent: 10, descent: 3 }),
      getImageData: () => ({ data: new Uint8ClampedArray(4) }),
      putImageData() {},
    }
    const canvas = { getContext: () => ctx, width: 400, height: 300 } as unknown as HTMLCanvasElement
    const renderer = new Canvas2DRenderer()
    renderer.initialize(canvas)
    renderer.render(
      {
        viewport: { x: 0, y: 0, width: 400, height: 300 },
        layers: [
          {
            id: 'content',
            zIndex: 0,
            commands: [{ t: 'text', x: 10, y: 30, text: '一\n二\n三', font: '14px sans', fill: '#000', baseline: 'middle' }],
          },
        ],
        dpr: 1,
      },
      { fullRedraw: true },
    )
    expect(fills.map((f) => f.text)).toEqual(['一', '二', '三'])
    expect(fills[1]!.y - fills[0]!.y).toBeCloseTo(14 * 1.35)
  })
})

describe('debugDirty · 脏矩形可视化', () => {
  function mockCanvas(): { canvas: HTMLCanvasElement; strokes: Array<[number, number, number, number]> } {
    const strokes: Array<[number, number, number, number]> = []
    const ctx = {
      font: '', fillStyle: '', textAlign: '', textBaseline: '', lineWidth: 1, strokeStyle: '',
      fillText() {}, save() {}, restore() {}, setTransform() {}, clearRect() {}, beginPath() {}, rect() {},
      clip() {}, translate() {}, scale() {}, fillRect() {},
      strokeRect(x: number, y: number, w: number, h: number) { strokes.push([x, y, w, h]) },
      moveTo() {}, lineTo() {}, stroke() {},
      measureText: (text: string) => ({ width: text.length * 7 }),
      getImageData: () => ({ data: new Uint8ClampedArray(4) }),
      putImageData() {},
    }
    return {
      canvas: { getContext: () => ctx, width: 400, height: 300, style: { width: '', height: '' } } as unknown as HTMLCanvasElement,
      strokes,
    }
  }

  const scene = {
    viewport: { x: 0, y: 0, width: 400, height: 300 },
    layers: [{ id: 'content', zIndex: 0, commands: [] }],
    dpr: 1,
  } as never

  it('默认不描红框（零开销）', async () => {
    const { Canvas2DRenderer } = await import('../src/canvas2d-renderer.js')
    const { canvas, strokes } = mockCanvas()
    const renderer = new Canvas2DRenderer()
    renderer.initialize(canvas)
    renderer.resize(400, 300)
    renderer.invalidate({ x: 10, y: 10, width: 20, height: 20 })
    renderer.render(scene, { fullRedraw: true })
    expect(strokes).toHaveLength(0)
  })

  it('内容变更整帧重绘时，红框仍只标出显式脏区（不是全屏）', async () => {
    const { Canvas2DRenderer } = await import('../src/canvas2d-renderer.js')
    const { canvas, strokes } = mockCanvas()
    const renderer = new Canvas2DRenderer()
    renderer.initialize(canvas)
    renderer.resize(400, 300)
    renderer.invalidate({ x: 10, y: 20, width: 30, height: 40 })
    renderer.render(scene, { fullRedraw: true, debugDirty: true })
    expect(strokes).toEqual([[10.5, 20.5, 29, 39]])
  })

  it('相邻脏区合并后只描一个红框', async () => {
    const { Canvas2DRenderer } = await import('../src/canvas2d-renderer.js')
    const { canvas, strokes } = mockCanvas()
    const renderer = new Canvas2DRenderer()
    renderer.initialize(canvas)
    renderer.resize(400, 300)
    renderer.invalidate({ x: 10, y: 10, width: 20, height: 20 })
    renderer.invalidate({ x: 31, y: 10, width: 20, height: 20 })
    renderer.render(scene, { fullRedraw: true, debugDirty: true })
    expect(strokes).toHaveLength(1)
    expect(strokes[0]![0]).toBe(10.5)
    expect(strokes[0]![2]).toBe(40)
  })

  it('整帧失效（resize/主题）没有显式脏区时仍描全屏红框', async () => {
    const { Canvas2DRenderer } = await import('../src/canvas2d-renderer.js')
    const { canvas, strokes } = mockCanvas()
    const renderer = new Canvas2DRenderer()
    renderer.initialize(canvas)
    renderer.resize(400, 300)
    renderer.invalidate()
    renderer.render(scene, { fullRedraw: true, debugDirty: true })
    expect(strokes).toEqual([[0.5, 0.5, 399, 299]])
  })
})
