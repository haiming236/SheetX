# 后台渲染（OffscreenCanvas）

`OffscreenRenderer` 把整帧绘制搬进内联 Worker，主线程只负责构建场景与提交帧。属于**可选加速层**。

## 能力检测与降级

```ts
import { OffscreenRenderer, isOffscreenRendererAvailable } from '@sheetx/renderer'

isOffscreenRendererAvailable() // Node / 旧浏览器 / 无 transfer 支持时为 false

const renderer = new OffscreenRenderer()
renderer.mode // 'worker' | 'main'

renderer.initialize(canvasEl)
renderer.resize(width, height)
renderer.render(scene)                     // 提交帧（异步绘制，主线程不阻塞）
const stats = await renderer.waitForStats() // { lastRenderMs, drawCalls, sample }
```

降级发生在三种情况，均不抛错：

1. 环境不支持（构造即 `mode: 'main'`）；
2. `canvas.transferControlToOffscreen()` 失败（canvas 已被主线程 `getContext('2d')`）；
3. Worker 运行时 ERROR / onerror。

降级后自动切回主线程 `Canvas2DRenderer`，功能不受影响。

## 统计与验收

- `stats.sample` 是画布中心像素 `[r,g,b,a]`，供自动化确认"真的画上了"（E2E 实测 `[255,0,0,255]`）。
- `stats.drawCalls` 为本帧绘制指令数。
- `getStats()` 读最近一次；`waitForStats()` 等待下一帧到达。

## 纪律与边界

- `render()` 是**提交帧**语义（异步）。
- 脏矩形与滚动位块搬移仍由主线程 `Canvas2DRenderer` 提供；后台模式价值在"绘制不阻塞主线程"。
- 一条 canvas 只能 `transferControlToOffscreen()` 一次。
- Worker 脚本为内联 Blob（零构建产物），与 `@sheetx/worker` 风格一致。

## 下一步

[渲染管线](/advanced/rendering) · [并行计算](/advanced/worker) · [浏览器兼容](/engineering/compatibility)
