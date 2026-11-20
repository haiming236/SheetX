# API 总览

SheetX 对外只暴露稳定的公共 API，内部实现可自由重构。本栏目覆盖两种模式、事件系统与扩展点。

## 两条创建路径

```ts
// 路径一：按模式导入（推荐，按需加载）
import { createGrid } from '@sheetx/grid'
import { createSpreadsheet } from '@sheetx/spreadsheet'

// 路径二：公共门面（跨模式统一入口）
import { SheetX } from '@sheetx/web-component'
SheetX.createGrid(config)
SheetX.createSpreadsheet(config)
```

## API 一览

| 领域 | 文档 | 主要入口 |
|---|---|---|
| 业务网格 | [SheetXGrid](/api/grid) | `createGrid(config)` |
| 电子表格 | [SheetXSpreadsheet](/api/spreadsheet) | `createSpreadsheet(config)` |
| 事件 | [事件系统](/api/events) | `on` / `once` / `off`，`PublicEvent` 常量 |
| 编辑器扩展 | [编辑器](/api/editors) | `registerEditor(name, factory)` |
| 公式 | [公式与函数](/api/formula) | 函数注册表、`=公式` 字符串 |
| 格式化 | [格式化器](/api/formatters) | `registerFormatter(name, fn)` |

## 通用约定

- **同步 / 异步**：读值与选区为同步；`validate()`、批量异步任务、Worker 计算为异步。公共 API 的同步语义不会因 Worker 化而改变。
- **变更走 mutation**：所有写操作通过命令层，可撤销、有事件；请勿直接修改数据数组。
- **事件取消点**：`before-edit` / `before-cell-edit` 监听可调用 `cancel()` 阻止进入编辑，是 ERP 拦截点。
- **销毁**：视图卸载时调用 `destroy()` 释放事件与 Worker 资源。

## 扩展点一览

| 扩展点 | 用途 | 文档 |
|---|---|---|
| 编辑器 | 单元格编辑 UI（文本 / 数字 / 远程搜索…） | [编辑器](/api/editors) |
| 格式化器 | 显示层格式化（日期 / 千分位…） | [格式化器](/api/formatters) |
| 函数注册表 | 自定义公式函数 | [公式与函数](/api/formula) |
| 插件 | 生命周期、依赖、扩展点账本 | [插件生态](/advanced/plugins) |
| 主题令牌 | 全局换肤 | [主题系统](/advanced/themes) |

从 [SheetXGrid](/api/grid) 开始查阅。
