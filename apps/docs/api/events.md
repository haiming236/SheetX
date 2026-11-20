# 事件系统

Grid 与 Spreadsheet 共享统一的事件语义，通过 `on` / `once` / `off` 订阅。事件名以 `PublicEvent` 常量给出。

## 订阅与退订

```ts
const handler = (tx) => console.log(tx.changes)
grid.on('cell-change', handler)
grid.once('after-edit', handler)
grid.off('cell-change', handler)
```

## 公共事件表

| 事件 | 载荷 | 说明 |
|---|---|---|
| `cell-change` | Grid：`DataTransaction{changes: CellChange[]}`；Sheet：`SheetTransaction{sheetId, changes: SheetCellChange[]}` | 数据变化（用户编辑 / API / 粘贴 / 撤销均触发） |
| `selection-change` | `{ranges: CellRange[], activeIndex}` | 选区变化（不进 undo） |
| `before-edit`（Grid）/ `before-cell-edit`（Sheet） | `{rowId/row, col, value, cancel()}` | **可取消**——监听器调 `cancel()` 阻止进入编辑（ERP 拦截点） |
| `after-edit` | `{rowId, field, row, col, oldValue, newValue, committed}` | 编辑关闭后（含被校验拦截的 `committed=false`） |
| `validation-error` | `{errors: ValidationError[]}` | 校验失败 |
| `formula-change`（Sheet） | `FormulaChange[]` | 公式增量重算结果 |
| `sheet-added` / `sheet-removed` / `active-sheet-changed`（Sheet） | `{sheetId…}` | 工作簿结构，供 sheet tabs UI |
| `sx:*`（如 `sx:resized`） | — | 内部诊断事件，可订阅但勿依赖 |

## CellChange 形态

```ts
interface CellChange {
  rowId: string
  field: string
  oldValue: unknown
  newValue: unknown
}
interface DataTransaction {
  id: string
  changes: CellChange[]
  source: 'user' | 'api' | 'paste' | 'import'
}
```

事务的 `source` 字段帮助区分变化来源（保存、审计、协作同步都基于此）。

## Web Component 桥接

Wrapper 应把引擎事件转成 CustomEvent 转发给宿主：

```ts
wrapper.addEventListener('cell-change', (e) => {
  el.dispatchEvent(new CustomEvent('sx-cell-change', {
    detail: e.detail,
    bubbles: true,
    composed: true,
  }))
})
```

**方向键 / Enter 等 UI 内部导航事件不要转发到引擎外**，避免与宿主的键盘处理冲突。

## 下一步

[Grid API](/api/grid) · [Spreadsheet API](/api/spreadsheet) · [插件系统](/advanced/plugins)
