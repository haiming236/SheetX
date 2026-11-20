# SheetX 架构约束

## 依赖方向（单向，禁止反向）

```
core
  ↑
data / data-adapter / formula / themes / fonts
  ↑
renderer / interaction / editors / validation / ui
  ↑
grid / spreadsheet / io
  ↑
web-component / vue / react
  ↑
apps (playground / docs / integration-lab / benchmark / e2e)
```

- `core` 零运行时依赖。
- 下层包不得 import 上层包。
- `apps/*` 只能消费 `packages/*`，不得被 `packages/*` 反向依赖。

## 产品与演示环境的分界

| 维度 | packages（产品） | apps/playground（工作台） |
| --- | --- | --- |
| 发布 | npm / CDN | 不发布 |
| 导航 | 无（宿主提供） | 有（全局导航 + 示例目录） |
| 调试面板 | 无 | 有 |
| 表格核心 | 实现 | 只引用 |
| 可裁剪 | appearance 预设 | 全量展示 |

判断一个功能该放哪里：**宿主是否需要它？** 需要 → `packages`；只有开发者演示需要 → `apps/playground`。

## UI 组件归属

以下属于产品能力，必须放在 `packages`（当前在 `@sheetx/ui` / `@sheetx/editors` / 各引擎包）：

- 工具栏、公式栏、状态栏、工作表标签
- 单元格编辑框、日期选择器、下拉、远程搜索
- 右键菜单、筛选菜单、格式面板
- 列宽/行高调整、快捷键系统、选择区域

Playground 中手写的演示页（如 AI 系列页面）是**功能规格展示**，待能力成熟后应沉淀进对应产品包，而不是长期留在 apps 里重复实现。

## 构建与发布

- 开发：`package.json#exports` 指向 `src`，改代码即时生效。
- 发布：`publishConfig` 覆盖为 `dist`，由 `scripts/build-lib.mjs` 统一产出。
- CDN：`@sheetx/web-component` 额外产出 `dist/sheetx.iife.js`，加载后自动挂全局 `SheetX` 并注册 `<sheetx-grid>` / `<sheetx-spreadsheet>`。

## 字体与 PDF

字体注册表由 `@sheetx/core` 定义契约、`@sheetx/fonts` 提供实现；Grid / Spreadsheet / Renderer / IO 共用，保证屏幕显示与打印/PDF 导出一致。TTF 不等于可嵌入 PDF，必须走子集化 + FontFile2 + CIDFontType2 + ToUnicode。
