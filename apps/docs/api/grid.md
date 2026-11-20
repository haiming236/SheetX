# SheetXGrid

业务数据网格模式，面向"一行 = 一条业务记录"的场景（ERP 列表、库存、订单明细）。

## 创建

`createGrid(config: GridConfig)` 或 `new SheetXGrid(config)`。

```ts
interface GridConfig {
  container: HTMLElement | string          // 必填
  columns: GridColumnDef[]                 // 必填
  data?: UnknownRecord[]                   // 缺省空表
  adapter?: IDataAdapter                   // 缺省 LocalAdapter
  features?: {
    clipboard?: boolean                    // 默认 true
    undoRedo?: boolean                     // 默认 true
    rowSelection?: boolean                 // 默认 true
    editing?: boolean                      // 默认 true（总开关）
    showRowNumbers?: boolean               // 默认 true
    strictValidation?: boolean             // 默认 true：error 级校验失败阻止提交
  }
  rowHeight?: number                       // 默认 28
  colWidth?: number                        // 默认 100
  theme?: 'light' | 'dark' | ThemeTokens   // 默认 light
  debug?: boolean                          // 默认 false；true 开启脏矩形红框可视化
}
```

### 列定义

```ts
interface GridColumnDef {
  key: string
  title: string
  width?: number            // 缺省 100
  editor?: string           // 编辑器名，缺省按值类型推断
  editable?: boolean        // 缺省 true
  formatter?: string        // 格式化器名
  frozen?: boolean          // 冻结列（必须从第 0 列连续出现）
  editorParams?: Record<string, unknown>
}
```

## 数据 API

所有写操作走 mutation（可撤销、有事件）。

| 方法 | 说明 |
|---|---|
| `getValue(rowId, field): unknown` | 读取单元格值 |
| `setValue(rowId, field, value)` | 写入（source='api'，可撤销） |
| `setData(records)` | 全量替换（可撤销） |
| `getData(): UnknownRecord[]` | 导出当前数据 |
| `insertRows(index, records)` / `deleteRows(rowIds)` | 结构变更（可撤销，undo 恢复位置与数据） |
| `getRowIndex(rowId): number` | 行 id → 下标 |
| `validate(): Promise<ValidationError[]>` | 全表校验（保存前调用） |
| `undo()` / `redo()` / `canUndo()` / `canRedo()` | 历史 |
| `getSelectedRanges()` / `getSelectedRange()` / `getSelectedRows()` / `getSelectedFieldValues(field)` | 选区 |
| `scrollToCell(row, col)` / `setColumnWidth(col, width)` / `freezeRows(n)` | 视图 |
| `paste(matrix, startRow, startCol)` | 批量写入（与 Ctrl+V 同一 mutation 路径） |
| `sortByColumn(col, dir)` / `autoFit(kind, index)` / `setZoom(scale)` | 排序 / 自适应 / 缩放 |
| `registerFormatter(name, fn)` / `registerEditor(name, factory)` | 扩展点 |
| `setTheme(theme)` / `refresh()` / `getRenderStats()` / `on/once/off` / `destroy()` | 其他 |

### 行 id 说明

引擎要求每行有稳定唯一 id。宿主数据含 `id` 字段（或通过 `LocalAdapter.fromRecords` 指定 `idField`）则直接用；**没有 id 会自动生成但不稳定**。

- 生产环境务必提供业务主键。
- `getValue` / `setValue` 使用 rowId。
- 下标会随插删漂移，**禁止把下标当身份存储**。

### 移动 / 触摸 / 编辑细节

- 键盘：`ArrowRight` / `Enter` 导航符合 Excel 习惯，`Shift+方向` 扩选。
- IME：组合期间不提交，`compositionend` 后提交一次（见 [浏览器兼容](/engineering/compatibility)）。
- 剪贴板：TSV / HTML 粘贴，Excel / WPS 互操作（见 [事件系统](/api/events)）。

## 事件

```ts
grid.on('cell-change', (tx) => {
  console.log(tx.changes) // CellChange[]：rowId / field / oldValue / newValue
})

grid.on('before-edit', (e) => {
  if (e.field === 'locked') e.cancel() // 阻止进入编辑
})
```

完整事件表见 [事件系统](/api/events)。

## 调试

```ts
createGrid({ container, columns, data, debug: true })
```

`debug: true` 时编辑单格会在脏矩形上描红框——用于验证"改一个格只重绘对应区域"。`getRenderStats()` 返回 `{fps, lastRenderMs, drawCalls, blitFrames}`，`blitFrames > 0` 表示滚动位块搬移生效。

## 下一步

[SheetXSpreadsheet](/api/spreadsheet) · [编辑器](/api/editors) · [事件系统](/api/events)
