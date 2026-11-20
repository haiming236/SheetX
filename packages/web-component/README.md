# @sheetx/web-component

SheetX 引擎的 Web Component 适配层（Lit 3 wrapper）。提供两个自定义元素：

- `<sheetx-grid>` —— 业务数据网格（@sheetx/grid）
- `<sheetx-spreadsheet>` —— 电子表格模式（@sheetx/spreadsheet，含公式引擎）

宿主无需接触引擎内部：传属性、听 DOM 事件、调代理方法即可。需要完整 API 时通过 `.engine` 取底层实例。引擎侧能力总览见《引擎使用与对接指南》（`docs/引擎使用与对接指南.md`）。

## 五分钟上手

```html
<script type="module">
  import { defineSheetxElements } from '@sheetx/web-component'
  defineSheetxElements() // 幂等注册；也可直接 import 本包内任意模块触发元素定义
</script>

<sheetx-grid id="grid" style="width:800px;height:400px"></sheetx-grid>
```

```ts
const grid = document.querySelector('#grid')

grid.columns = [
  { key: 'name', title: '商品名称', width: 160 },
  { key: 'qty', title: '数量', width: 90, editor: 'number' },
  { key: 'price', title: '单价', width: 110, editor: 'currency' },
]
grid.data = [
  { id: 'r1', name: '打印机', qty: 3, price: 1299 },
  { id: 'r2', name: '复印纸', qty: 50, price: 29.9 },
]

// 等引擎就绪（替代 rAF/setTimeout 轮询 .engine）
const engine = await grid.whenReady()
engine.freezeRows(1) // 冻结首行
```

监听事件（原生写法）：

```ts
grid.addEventListener('sx-cell-change', (e) => {
  // e.detail: DataTransaction（完整类型见 SheetXEventTypes）
  console.log(e.detail.changes)
})
```

监听事件（类型安全写法，detail 自动收窄）：

```ts
import { onSheetXEvent, SheetXEvents } from '@sheetx/web-component'

const off = onSheetXEvent(grid, SheetXEvents.CELL_CHANGE, (e) => {
  e.detail.changes // DataTransaction['changes']
})
off() // 解绑
```

## 属性

### `<sheetx-grid>`

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `columns` | `GridColumnDef[]` | `[]` | 列定义。**引用变化触发引擎重建**（见下文「columns 热更新」） |
| `data` | `UnknownRecord[]` | `[]` | 行数据；引用变化 → `engine.setData()`（可撤销的全量替换） |
| `features` | `GridFeatures` | — | 功能开关：`clipboard` / `undoRedo` / `editing` / `rowSelection` 等 |
| `adapter` | `IDataAdapter` | — | 自定义数据适配器（远程分页等） |
| `theme` | `'light' \| 'dark' \| ThemeTokens` | `'light'` | 主题名或令牌对象 |
| `rowHeight` | `number` | 28 | 默认行高（px） |
| `colWidth` | `number` | 100 | 默认列宽（px） |
| `editorHostMode` | `'inline' \| 'body'` | `'inline'` | 编辑器弹出层宿主：`body` 挂 `document.body`，底部行下拉不被表格边界裁切 |
| `debug` | `boolean` | `false` | 脏矩形描红可视化（调试用） |

### `<sheetx-spreadsheet>`

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `sheets` | `SpreadsheetSheetConfig[]` | — | 初始工作表配置（name / rowCount / columnCount） |
| `active-sheet` | `string` | 首表 | 初始激活工作表名 |
| `features` | `{ clipboard, undoRedo, editing, formula }` | — | 功能开关 |
| `theme` | `'light' \| 'dark' \| ThemeTokens` | `'light'` | 主题 |
| `rowHeight` / `colWidth` | `number` | 28 / 100 | 默认行高 / 列宽 |
| `editorHostMode` | `'inline' \| 'body'` | `'inline'` | 编辑器弹出层宿主模式 |
| `debug` | `boolean` | `false` | 脏矩形可视化 |

## 事件

引擎语义事件桥接为 DOM `CustomEvent`（`bubbles: true` + `composed: true`），命名规则：引擎 `cell-change` → DOM `sx-cell-change`。方向键/Enter 等内部导航事件**不**外发。

| DOM 事件名 | 常量（SheetXEvents） | detail 类型 | 适用元素 |
| --- | --- | --- | --- |
| `sx-cell-change` | `CELL_CHANGE` | `DataTransaction`（`{ id, changes: CellChange[], source }`） | 两者 |
| `sx-selection-change` | `SELECTION_CHANGE` | `{ ranges: CellRange[]; activeIndex: number }` | 两者 |
| `sx-before-edit` | `BEFORE_EDIT` | `BeforeEditPayload \| BeforeCellEditPayload`（调用 `detail.cancel()` 可阻止编辑） | 两者 |
| `sx-after-edit` | `AFTER_EDIT` | `AfterEditPayload` | 两者 |
| `sx-validation-error` | `VALIDATION_ERROR` | `{ errors: ValidationError[] }` | grid |
| `sx-formula-change` | `FORMULA_CHANGE` | `FormulaChangeDetail[]`（`{ sheet, row, col, oldValue, newValue }`） | spreadsheet |
| `sx-before-cell-edit` | `BEFORE_CELL_EDIT` | `BeforeCellEditPayload` | spreadsheet |
| `sx-sheet-added` | `SHEET_ADDED` | `{ sheetId, name? }` | spreadsheet |
| `sx-sheet-removed` | `SHEET_REMOVED` | `{ sheetId }` | spreadsheet |
| `sx-active-sheet-changed` | `ACTIVE_SHEET_CHANGED` | `{ sheetId }` | spreadsheet |

完整载荷类型集中在 `SheetXEventTypes`；`onSheetXEvent()` 提供按事件名自动收窄 `detail` 的类型安全监听。

## 方法

### 等待就绪

| 方法 | 返回 | 说明 |
| --- | --- | --- |
| `whenReady()` | `Promise<SheetXGrid \| SheetXSpreadsheet>` | 首帧渲染完成后 resolve 出引擎实例；就绪前断连则 reject。**宿主请用它在 `engine` 就绪后再调 API** |

### `<sheetx-grid>` 常用代理

| 方法 | 说明 |
| --- | --- |
| `getValue(rowId, field)` / `setValue(rowId, field, value)` | 读写单元格 |
| `getData()` | 取全量行数据 |
| `getRowId(index)` | 行号 → rowId |
| `insertRows(index, records)` / `deleteRows(rowIds)` | 增删行（走命令栈，可撤销） |
| `undo()` / `redo()` / `canUndo()` / `canRedo()` | 撤销 / 重做 |
| `getSelectedRanges()` / `getSelectedRows()` | 选区 / 选中行数据 |
| `scrollToCell(row, col)` | 滚动到指定单元格 |
| `registerFormatter(name, formatter)` | 注册列格式化器 |
| `validate()` | 全表校验，返回错误列表 |
| `refresh()` | 强制重绘 |
| `freezeRows(count)` | 冻结前 N 行（滚动时钉住） |
| `setEditorHostMode(mode)` | 切换编辑器弹出层宿主（`'inline' \| 'body'`） |
| `setPopupHost(element \| null)` | 显式指定弹出层宿主元素（`null` 恢复默认） |

### `<sheetx-spreadsheet>` 常用代理

| 方法 | 说明 |
| --- | --- |
| `getCellValue(sheet?, row, col)` / `setCellValue(sheet?, row, col, value)` | 读写单元格（值或 `=公式`） |
| `setCellStyle(sheet?, range, style)` | 设置区域样式（`null` 清除） |
| `mergeCells(sheet?, range)` / `unmergeCells(sheet?, anchorRow, anchorCol)` | 合并 / 拆分单元格 |
| `addSheet(name?)` / `removeSheet(sheetId)` / `setActiveSheet(sheetId)` | 工作表管理 |
| `recalculateAll()` | 全表重算公式 |
| `undo()` / `redo()` | 撤销 / 重做 |
| `refresh()` | 强制重绘 |
| `freezeRows(count)` / `setEditorHostMode(mode)` / `setPopupHost(el)` | 同 grid |

## columns 热更新（v1 取舍说明）

`columns` 属性**引用变化**时，wrapper 会销毁并重建引擎实例（v1 引擎无公开 `setColumns` API）。重建后：

- ✅ 新列结构、当前 `data`、当前 `theme` 全部生效
- ⚠️ 选区、滚动位置、撤销/重做栈会重置
- ✅ `whenReady()` 已 resolve 的 Promise 不受影响；`.engine` 指向新实例

适合「列结构切换」这类低频操作；高频场景请等引擎公开 `setColumns` 后升级。

## 设计纪律（为什么这样封装）

- 引擎实例是普通私有字段，**不进 Lit 响应式系统**（避免 Proxy 化引擎导致性能坍塌）；
- 引擎创建放在 `firstUpdated()`：shadow DOM 首帧渲染完成后才有 `.host` 容器；
- 断连（`disconnectedCallback`）即销毁引擎并解绑全部事件桥接；
- 本包 `sideEffects: false`：import 不会自动注册元素，需调用 `defineSheetxElements()`（或 import 具体元素模块）。

## 引擎完整 API

wrapper 只代理高频 API。批量填充、自定义编辑器、脏矩形调试、数据适配器等完整能力请通过 `element.engine` 使用底层实例，能力清单见《引擎使用与对接指南》（`docs/引擎使用与对接指南.md`）。
