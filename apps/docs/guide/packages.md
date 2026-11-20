# 包地图与依赖方向

SheetX 采用 pnpm monorepo，包按「平台 / 模式 / 引擎 / 内核」四层组织。理解依赖方向有助于按需安装与避免循环依赖。

## 包清单

| 包 | 层 | 职责 |
|---|---|---|
| `@sheetx/core` | 内核 | 公共类型契约、命令、事件、插件、渲染接口、生命周期（零依赖） |
| `@sheetx/data` | 引擎 | 数据存储、稀疏索引、变更追踪、事务、撤销 |
| `@sheetx/renderer` | 引擎 | Canvas 2D 分层渲染、脏区域、文本缓存、后台渲染 |
| `@sheetx/interaction` | 引擎 | 键鼠、触摸、IME 守卫、剪贴板、选择 |
| `@sheetx/editors` | 引擎 | 文本 / 数字 / 日期 / 下拉 / 远程搜索编辑器 |
| `@sheetx/formula` | 引擎 | 公式解析 AST、依赖图、增量计算、函数注册表 |
| `@sheetx/validation` | 引擎 | 规则校验、异步校验 |
| `@sheetx/data-adapter` | 引擎 | 本地 / 远程 / 分页数据适配 |
| `@sheetx/worker` | 引擎 | 并行计算：增量消息协议、内联 Worker、主线程降级 |
| `@sheetx/io` | 引擎 | CSV / XLSX / 剪贴板导入导出 |
| `@sheetx/themes` | 引擎 | 主题令牌（浅 / 深） |
| `@sheetx/grid` | 模式 | 业务数据网格 `createGrid` |
| `@sheetx/spreadsheet` | 模式 | 电子表格 `createSpreadsheet` |
| `@sheetx/web-component` | 平台 | 原生 Web Component 外壳、公共门面、CDN 入口 |
| `@sheetx/vue` / `@sheetx/react` | 平台 | 框架适配层 |

## 依赖规则（单向，不可成环）

```
适配层 → 模式层 → 引擎层 → core（零依赖）
```

- `core` **不允许**依赖 `grid` / `spreadsheet` / `vue` / `react`。
- 渲染器通过接口提供能力，**不直接依赖**业务模式的数据结构。
- 公式引擎独立成包：Grid 模式不引入它，Spreadsheet 独立升级。

## 按需安装建议

| 需求 | 依赖 |
|---|---|
| 只做业务网格 | `@sheetx/grid` |
| 电子表格 + 公式 | `@sheetx/spreadsheet`（内部含 `@sheetx/formula`） |
| 导入导出 Excel | `@sheetx/io` |
| 自定义主题 | `@sheetx/themes` |
| 无框架 / 低代码嵌入 | `@sheetx/web-component` 或其 `/cdn` 入口 |

## 命令速查

```bash
pnpm install          # 安装
pnpm typecheck        # 全工程类型检查
pnpm test             # 全部单元测试
pnpm build            # 构建所有 packages + benchmark + e2e
pnpm build:playground # 构建调试应用
pnpm build:docs       # 构建本 documentation 站点
```

## 下一步

[架构总览](/guide/architecture) · [API 总览](/api/) · [进阶总览](/advanced/)
