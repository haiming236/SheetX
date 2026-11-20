# SheetX 渲染架构 — Canvas + DOM 混合

> 结论：SheetX 采用 **Canvas + DOM 混合渲染**。Grid 保留 DOM 语义优势并可切 Canvas；Spreadsheet 以 Canvas 主渲染、DOM 负责编辑层。Core 完全独立于渲染技术，Renderer 可替换。

## 分层职责（唯一事实来源）

| 层 | 技术 | 职责 |
| --- | --- | --- |
| DOM UI Layer | DOM | 工具栏、菜单、右键菜单、对话框、属性面板 |
| DOM Overlay Layer | DOM | 单元格输入框、下拉编辑器、日期选择器、公式编辑框 |
| Canvas Interaction Layer | Canvas | 选区、活动单元格、拖拽填充柄、边框、高亮 |
| Canvas Grid Layer | Canvas | 单元格背景、文字、网格线、数字、图标 |
| Core Layout Engine | TypeScript | 行高、列宽、坐标转换、虚拟滚动、布局计算 |

**禁止**：业务组件直接 `new Canvas2DRenderer()` 或依赖 DOM 节点结构。统一走 `SheetXRenderer` 契约。

## 统一契约（core/src/renderer.ts）

```ts
interface SheetXRenderer {
  readonly kind: 'dom' | 'canvas' | 'hybrid'
  initialize(host: HTMLElement, overlayHost?: HTMLElement): void
  setViewport(viewport: Viewport): void
  renderLayer(layer: CanvasLayerKind, range?: CellRange): void
  renderSelection(selection: CellRange | null): void
  hitTest(x: number, y: number): HitResult | null
  showOverlay(kind: DomOverlayKind, element: HTMLElement, rect: Rect): void
  hideOverlay(kind: DomOverlayKind): void
  resize(width: number, height: number): void
  destroy(): void
}
```

三种可替换实现（`packages/renderer/src/hybrid-renderer.ts`）：

| 实现 | 定位 |
| --- | --- |
| `DomRenderer` | 保留 DOM 语义层，虚拟滚动由 Layout/Viewport 算好后只创建可见单元格 |
| `HybridRenderer` | Canvas 画网格/文字/选区，DOM 只 overlay 编辑器与菜单 |
| 自定义 `engine` | 宿主/第三方完全实现（Worker、WebGPU、OffscreenCanvas 等） |

工厂：`createRenderer(config, layoutProvider)`，业务层唯一入口。

## 双模式策略

| 模式 | 主渲染 | 原因 |
| --- | --- | --- |
| `SheetXGrid`（ERP 业务表格） | DOM 优先，大数据可切 Canvas | 无障碍、复制粘贴、CSS 样式对业务系统重要 |
| `SheetXSpreadsheet`（Excel 式） | Canvas 主渲染 + DOM 编辑层 | 二维单元格画布，大范围选区/合并/冻结更适合自绘 |

宿主通过 config 选择，**不改变业务 API**：

```ts
createGrid({
  container: '#app',
  columns,
  data,
  renderer: { kind: 'dom' },        // 或 'canvas' / 'hybrid'
})

createSpreadsheet({
  container: '#app',
  renderer: { kind: 'hybrid' },
})
```

## 当前实现状态（诚实说明）

- `Canvas2DRenderer`（底层）：已实现脏矩形、位块搬移、文本缓存、OffscreenCanvas 降级。
- `Renderer` 旧接口（core）：`initialize(canvas)/render(scene)/invalidate()`，grid 与 spreadsheet 的绘制仍由它驱动——**行为不变**。
- `SheetXRenderer` 新契约 + `DomRenderer`/`HybridRenderer` + `createRenderer`：本次新增，引擎已初始化 `layeredRenderer` 可供查询/后续增量迁移。
- 迁移是**渐进式**的：现有 DOM 样品与 Canvas 引擎继续运行，不推倒重做。

## 性能原则

Canvas 不天然比 DOM 快。真正决定性能的是：

1. 是否有虚拟滚动（只渲染可见区）；
2. 是否只重绘变化区域（脏矩形）；
3. 是否缓存文字与单元格绘制结果；
4. 滚动、布局、命中检测是否合理；
5. 计算与渲染是否分离（Worker/OffscreenCanvas）。

**不要用"10 万行数据模型"单独判断渲染性能**——瓶颈可能在布局、数据存储或公式计算。

## 基准指标（`apps/benchmark`）

`window.__bench` 提供真实测量（非 mock）：

| 场景 | 指标 |
| --- | --- |
| `seed(rows, cols)` | 数据生成耗时、引擎创建耗时、**rendererKind**、**DOM 节点数** |
| `scroll(axis, frames)` | 稳态 FPS、平均/p95 帧耗时、`getRenderStats()`（drawCalls/blitFrames） |
| `paste(cells)` | 批量写入同步耗时 + 渲染耗时 |

建议矩阵：100×20（基准）、1000×50、10000×50（虚拟滚动/虚拟绘制）、100000×50（数据与渲染分离）、连续滚动、批量粘贴、多区域选区、PDF 导出。

## 打印 / PDF

**Canvas 屏幕渲染与 PDF 打印不共用输出管线**：两者共享布局、字体、样式、数据模型；PDF 走独立打印渲染管线，使用能正确嵌入 TTF 的引擎（子集化 + FontFile2 + CIDFontType2 + ToUnicode），保证文字清晰、可搜索、可复制。严禁把屏幕 Canvas 位图直接当最终 PDF。
