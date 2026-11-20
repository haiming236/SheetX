# SheetXSpreadsheet

电子表格模式，面向"工作簿 / 单元格 / 公式"场景（报表、财务模型、类 Excel 编辑）。

## 创建

```ts
createSpreadsheet({
  container,
  sheets: [{ name, rowCount, columnCount, cells? }],
  activeSheetName?,
  features: { formula: true, clipboard: true, undoRedo: true, editing: true },
  theme,
  rowHeight,
  colWidth,
})
```

- `sheets`：工作簿内的工作表定义；`rowCount` / `columnCount` 决定虚拟网格规模；`cells` 可选稀疏初值。
- 存储为**稀疏单元格**：只存有内容的格子，不为几十万个空格创建对象。

## 单元格 API

| 方法 | 说明 |
|---|---|
| `getCellValue(sheetNameOrId?, row, col)` | 读（公式格返回**计算值**；错误显示 `#DIV/0!` 等） |
| `setCellValue(sheetNameOrId?, row, col, value)` | 写。字符串以 `=` 开头 → 自动按公式处理 |
| `setCellStyle(sheetNameOrId?, range, style \| null)` | 样式：bold / color / background / hAlign / numFmt / border… |
| `mergeCells(...)` / `unmergeCells(...)` | 合并 / 拆分（可撤销） |
| `recalculateAll()` | 快照加载后手动触发全量重算 |

### 工作簿结构

| 方法 | 说明 |
|---|---|
| `addSheet(name?)` / `removeSheet(id)` / `setActiveSheet(id)` | 工作表增删改 |
| `getSheetIds()` | 工作表 id 列表 |
| `undo()` / `redo()` / `getSelectedRanges()` / `on()` / `destroy()` | 与 Grid 一致 |

## 公式示例

```ts
sheet.setCellValue(undefined, 0, 0, 100)      // A1
sheet.setCellValue(undefined, 1, 0, '=A1*2')  // B1
sheet.on('formula-change', (changes) => console.log(changes))
```

修改 A1 后只有依赖它的节点（B1 等）重算。函数支持与自定义注册见 [公式与函数](/api/formula)。

## 事件

| 事件 | 载荷 | 说明 |
|---|---|---|
| `formula-change` | `FormulaChange[]` | 公式增量重算结果 |
| `sheet-added` / `sheet-removed` / `active-sheet-changed` | `{sheetId…}` | 工作簿结构，供 sheet tabs UI |
| `before-cell-edit` | `{row, col, value, cancel()}` | 可取消的编辑拦截 |
| `cell-change` | `SheetTransaction{sheetId, changes}` | 数据变化 |

完整表见 [事件系统](/api/events)。

## 与 Grid 的选择

若数据是业务记录、需要远程搜索编辑器与行级校验，请用 [Grid](/api/grid)。本模式适合自由单元格编辑与公式联动。对比见 [双模式](/guide/dual-mode)。

## 下一步

[事件系统](/api/events) · [公式与函数](/api/formula) · [XLSX 导入导出](/advanced/xlsx)
