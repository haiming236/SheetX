# SheetX — Embedded Spreadsheet Engine

> **一句话定位**：SheetX 是可独立运行体验、又可被宿主系统直接嵌入的**前端表格组件产品**，不是独立桌面式表格软件，也不是一个在线 Excel 网站。

## 发布的是什么

真正发布的是 `packages/` 下的 npm 包与 CDN 构建产物：

| 包 | 职责 |
| --- | --- |
| `@sheetx/core` | 内核：数据模型、命令、事件、插件、生命周期（零运行时依赖） |
| `@sheetx/data` / `@sheetx/data-adapter` | 数据模型与宿主数据接口适配 |
| `@sheetx/renderer` | Canvas + DOM 混合渲染 |
| `@sheetx/interaction` | 选择、键盘、鼠标交互 |
| `@sheetx/editors` | 单元格编辑器与业务控件 |
| `@sheetx/formula` | 公式引擎（词法 → AST → 求值） |
| `@sheetx/ui` | **通用 UI**：工具栏/公式栏/状态栏/右键菜单 + 外观预设 |
| `@sheetx/grid` | Grid 业务表格模式（ERP 主场景） |
| `@sheetx/spreadsheet` | Spreadsheet 电子表格模式 |
| `@sheetx/io` | CSV / XLSX 导入导出与打印分页 |
| `@sheetx/themes` / `@sheetx/fonts` | 主题与内置字体（含 PDF 嵌入） |
| `@sheetx/web-component` | Web Components + `SheetX` 门面 + CDN IIFE |
| `@sheetx/vue` / `@sheetx/react` | 框架适配器 |

发布形态：ESM（`dist/index.js`）+ 类型声明（`dist/index.d.ts`）+ CDN 单脚本（`dist/sheetx.iife.js`）。
开发时包入口仍指向 `src`（免编译热更新），`publishConfig` 在发布时切换为 `dist`。

## 客户怎么用

```vue
<template>
  <div class="page">
    <h2>商品管理</h2>
    <SheetXGrid :columns="columns" :data="products" @change="handleChange" />
  </div>
</template>
```

商品管理页面属于 ERP；SheetX **只负责表格区域**。

统一门面（npm 与 CDN 同签名）：

```ts
import { SheetX } from '@sheetx/web-component'

SheetX.createGrid({
  container: '#app',
  appearance: { preset: 'compact', theme: 'excel-green', parts: { statusBar: false } },
  columns,
  data,
})
```

## 三种外观预设（配置差异，不是三套实现）

| 预设 | 场景 | 工具栏 | 公式栏 | 状态栏 | 工作表标签 |
| --- | --- | --- | --- | --- | --- |
| `compact` | ERP / CRM / MES | ✓ | — | — | — |
| `standard` | 普通业务系统 | ✓ | — | ✓ | — |
| `spreadsheet` | Excel 式场景 | ✓ | ✓ | ✓ | ✓ |

宿主可在 `appearance.parts` 上逐项覆盖，也可注入 `toolbarItems` 自定义工具栏。
**核心表格、编辑器、右键菜单、选区、工具栏都复用同一套 SheetX 实现**，预设只是开关组合。

## apps 与 packages 的边界

- `packages/**` = 产品代码与发布包。
- `apps/playground` = 官方演示与开发测试工作台（**默认启动**），不是产品本身。
- `apps/docs` = 文档。
- `apps/integration-lab` = 原生 HTML / Vue / React 嵌入测试。
- `apps/benchmark` / `apps/e2e` = 性能与集成验证。

Playground 可以有自己的导航、调试面板、示例数据；ERP 宿主不需要也不应加载这些。
Playground 必须通过依赖 `packages` 来运行 —— 在 `packages/grid` 改一处，Playground 立即看到变化。

## 开发顺序

1. 先把 `Grid` 做成真正可嵌入的完整产品；
2. 再完善 `Spreadsheet`；
3. 最后才是 Playground 的展示页面。

**UI 设计图是产品的视觉规格与功能参考，不是要求把每张图变成一个独立应用页面。**

## 命令

| 命令 | 作用 |
| --- | --- |
| `pnpm dev` | 启动 Playground |
| `pnpm build` | 构建全部发布包（ESM + d.ts + CDN） |
| `pnpm test` | 单元测试 |
| `pnpm test:e2e` | 浏览器集成测试 |
| `pnpm docs:dev` | 文档 |
| `pnpm benchmark` | 性能测试 |
| `pnpm build:cdn` | 单独构建 CDN 单脚本 |
