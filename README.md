

<img src="./logo.png" alt="logo2" style="zoom:30%;" />

# SheetX

> **Embedded Spreadsheet Engine** · 框架无关、纯前端、可嵌入的表格引擎。
> 一套引擎，两种模式：**Grid 业务数据表格** + **Spreadsheet 电子表格**。
> 可独立运行体验，也可嵌入 ERP / CRM / MES 等任何 Web 系统。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

---

## 为什么是 SheetX

SheetX 不是另一个独立 Excel 网站，而是一组**可发布的 npm 包与 CDN 构建产物**。宿主页面是客户自己的，SheetX 只负责表格区域：

```vue
<template>
  <div class="page">
    <h2>商品管理</h2>
    <SheetXGrid :columns="columns" :data="products" @change="handleChange" />
  </div>
</template>
```

**产品边界**

- **纯前端**：不内置后端、数据库、账户权限或强制云服务；数据通过 Data Adapter 与宿主交互。
- **双模式**：Grid（业务数据网格）+ Spreadsheet（Excel 式电子表格）。
- **可嵌入**：Web Components / Vue / React / CDN IIFE 四种接入方式。
- **渲染可替换**：DOM / Canvas / Hybrid 三种 Renderer，同一契约，业务层不依赖具体技术。
- **字体与打印**：内置字体注册表（含 PDF 嵌入），屏幕渲染与 PDF 输出使用独立管线。

## 特性

- 虚拟滚动、脏矩形增量重绘、文本缓存、OffscreenCanvas 降级 —— 面向大数据量设计
- 公式引擎（AST → 依赖图 → 增量计算）、XLSX / CSV 零依赖读写
- 单元格编辑器：文本、数字、日期、下拉、远程搜索；IME、剪贴板、键盘导航完整
- 数据验证、条件格式、排序筛选、合并单元格、冻结行列
- 主题令牌、外观预设（compact / standard / spreadsheet）、插件运行时
- Playground 提供 46 个可交互演示页（含 AI 数据分析、图表生成、公式助手等）

## 包一览（18 个）

| 包 | 职责 |
| --- | --- |
| `@sheetx/core` | 公共类型、命令、事件、插件、生命周期、渲染契约（零运行时依赖） |
| `@sheetx/data` / `@sheetx/data-adapter` | 数据存储/稀疏索引/事务/Undo 与宿主数据接口 |
| `@sheetx/renderer` | Canvas 2D 分层渲染、脏矩形、文本缓存、DOM/Hybrid Renderer |
| `@sheetx/interaction` | 键鼠、IME、剪贴板、选择 |
| `@sheetx/editors` | 单元格编辑器与业务控件 |
| `@sheetx/formula` | 公式引擎：词法 → AST → 依赖图 → 增量求值 |
| `@sheetx/io` | CSV / XLSX 导入导出、打印分页 |
| `@sheetx/validation` | 数据校验 |
| `@sheetx/grid` | 业务数据网格模式 |
| `@sheetx/spreadsheet` | 电子表格模式 |
| `@sheetx/themes` / `@sheetx/fonts` | 主题令牌与内置字体（含 PDF 嵌入） |
| `@sheetx/ui` | 通用 UI 部件模型与外观预设 |
| `@sheetx/worker` | 并行计算：增量消息协议、内联 Worker、主线程降级 |
| `@sheetx/web-component` / `vue` / `react` | 框架适配器与 CDN 入口 |

依赖方向单向：`适配层 → 模式层 → 引擎层 → core（零依赖）`。

## 快速开始

环境要求：**Node.js ≥ 22**、**pnpm ≥ 12**。

```bash
git clone https://github.com/<your-account>/SheetX.git   # 或 Gitee 地址
cd SheetX
pnpm install
pnpm dev            # 启动 Playground（默认首页）
```

打开终端显示的地址，默认进入 Playground 工作台；在顶部导航可切换 Grid、Spreadsheet、编辑器、公式、主题、API、插件等演示页。

## 作为库使用

npm 方式（具名导入，无副作用）：

```ts
import { SheetX } from '@sheetx/web-component'

const grid = SheetX.createGrid({
  container: '#app',
  appearance: { preset: 'compact', theme: 'excel-green' },
  columns: [
    { key: 'name', title: '商品名称' },
    { key: 'price', title: '单价（元）' },
  ],
  data: products,
})
```

Web Components 方式：

```html
<script type="module">
  import { defineSheetxElements } from '@sheetx/web-component'
  defineSheetxElements()
</script>
<sheetx-grid id="grid"></sheetx-grid>
```

CDN 单脚本方式（加载后自动挂全局 `SheetX` 并注册元素）：

```html
<script src="https://cdn.jsdelivr.net/npm/@sheetx/web-component/dist/sheetx.iife.js"></script>
<script>
  SheetX.createGrid({ container: '#app', columns, data })
</script>
```

三种外观预设只是配置差异，不是三套实现：

| 预设 | 场景 | 工具栏 | 公式栏 | 状态栏 | 工作表标签 |
| --- | --- | --- | --- | --- | --- |
| `compact` | ERP / CRM / MES | ✓ | — | — | — |
| `standard` | 普通业务系统 | ✓ | — | ✓ | — |
| `spreadsheet` | Excel 式场景 | ✓ | ✓ | ✓ | ✓ |

宿主可在 `appearance.parts` 上逐项覆盖，也可通过 `renderer: { kind: 'dom' | 'canvas' | 'hybrid' }` 选择渲染实现。

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `pnpm dev` | 启动 Playground（开发演示工作台） |
| `pnpm build` | 构建全部发布包（ESM + d.ts + CDN IIFE） |
| `pnpm build:cdn` | 只构建 CDN 单脚本 |
| `pnpm build:all` | 构建发布包 + Playground + 文档站 |
| `pnpm typecheck` | 全工程类型检查 |
| `pnpm test` | 单元测试（vitest） |
| `pnpm test:e2e` | 浏览器级集成测试 |
| `pnpm dev:docs` / `pnpm build:docs` | 本地预览 / 构建文档站 |
| `pnpm benchmark` | 启动性能基准应用 |
| `pnpm dev:integration` | 启动宿主集成测试（Integration Lab） |

## 工程结构

```
SheetX/
├── packages/                 # 真正的产品：发布到 npm/CDN 的 18 个包
├── apps/
│   ├── playground/           # 官方体验与开发测试工作台（默认启动）
│   ├── docs/                 # VitePress 文档站
│   ├── integration-lab/      # 原生 HTML / Vue / React 嵌入测试
│   ├── benchmark/            # 性能与稳定性基准
│   └── e2e/                  # 浏览器级交互验收
├── scripts/build-lib.mjs     # 统一发布构建（ESM + d.ts + CDN）
├── PRODUCT.md                # 产品定位与交付体系
├── ARCHITECTURE.md           # 依赖方向与边界约束
├── RENDERING.md              # Canvas + DOM 混合渲染架构
├── LICENSE                   # MIT
└── pnpm-workspace.yaml
```

`packages/` 是产品代码，`apps/` 是使用这些包的应用 —— Playground 的导航、调试面板、示例数据都不属于产品本体。

## 文档

| 文档 | 说明 |
| --- | --- |
| `PRODUCT.md` | 发布什么、客户怎么用、apps 与 packages 边界、开发顺序 |
| `ARCHITECTURE.md` | 依赖方向、UI 组件归属、构建与发布、字体与 PDF 约束 |
| `RENDERING.md` | 五层渲染架构、Renderer 契约、双模式策略、基准指标、打印分离 |
| `apps/docs/` | 官方文档站（指南 / API / 进阶 / 工程），`pnpm dev:docs` |

## 测试与质量

- `pnpm typecheck`：全工程类型检查
- `pnpm test`：418 个单元测试
- `pnpm test:e2e`：真实浏览器交互验收（IME / 剪贴板 / 键盘 / Worker）
- `apps/benchmark`：真实 rAF 采样，输出 FPS、P95 帧耗时、DOM 节点数、渲染器类型

## 开源许可

MIT © SheetX contributors. 详见 [LICENSE](./LICENSE)。

核心引擎与全部 `packages/*` 以 MIT 开源；欢迎 Issue、PR 与讨论。

---

**仓库地址**：GitHub `https://github.com/<your-account>/SheetX` · Gitee `https://gitee.com/<your-account>/SheetX`
（提交前请把 `<your-account>` 替换为你的实际账号；两个地址按需保留其一。）
