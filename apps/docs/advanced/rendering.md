# 渲染管线与脏矩形

## 管线

```
场景构建器（Grid/Spreadsheet）
  → 纯数据绘制指令 DrawCommand[]
  → RenderScheduler（rAF 合帧）
  → Renderer（脏区域 + 滚动位块搬移 + HiDPI）
  → Canvas
```

业务层只产出**纯数据指令**，渲染器不解释任何业务含义：

```ts
type DrawCommand =
  | { t: 'rect'; x; y; w; h; fill?; stroke?; space? }
  | { t: 'text'; x; y; text; font; fill?; ...; space? }
  | { t: 'line'; ... }
  | { t: 'polyline'; points; ... }
  | { t: 'clip'; ... } | { t: 'clip-end' }
```

`space: 'content'` 随滚动平移，`space: 'viewport'` 钉在屏幕上（行头 / 列头 / 冻结区）。

## 脏矩形

- `invalidate(rect)` 收集脏矩形；`render()` 只对脏矩形 `clear + clip + 重绘`。
- 修改一个单元格**绝不重绘整表**（任务书验收标准）。
- 数量超过上限（12）时收敛为整体包围盒，避免脏区碎片化后逐个 clip 的开销反超重绘。
- `debug: true` 时脏矩形描红框，用于可视化验证（见 [Grid API](/api/grid#调试)）。

## 滚动位块搬移（blit）

- 内容未变、仅滚动时，用 `getImageData` / `putImageData` 搬移上一帧，只重绘暴露的空带。
- 固定带（列头 / 行头 / 冻结行列）不随像素位移，搬移后单独重绘。
- 纯像素搬运避免 `drawImage` 在软件渲染管线（swiftshader）上的自拷贝损坏问题。

## HiDPI

- backing store = CSS 尺寸 × `devicePixelRatio`，绘制统一走 CSS 坐标。
- DPR 变化（缩放 / 跨屏拖动）时重建 backing store 并整体失效文本度量缓存。

## 文本度量缓存

`measureText` 是 Canvas 最昂贵的调用之一。`TextCache` 做两级缓存：

- 键 = 字体串 + 文本 → `{width, ascent, descent}`；
- 容量上限 + 减半淘汰（有界）；
- `metricsRevision` 版本号：字体加载 / DPR 变化时整体失效，上层据此联动。

## 分层与固定带

图层按 `zIndex` 排序绘制，`visible: false` 跳过。固定带通过 `scene.fixedBands = {top, left}` 告知渲染器，保证冻结区域正确绘制与搬移后重绘。

## 下一步

[后台渲染](/advanced/offscreen) · [并行计算](/advanced/worker) · [性能基准](/engineering/performance)
