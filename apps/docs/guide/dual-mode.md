# 双模式：Grid 与 Spreadsheet

SheetX 有两个并列的产品模式。它们共享底层基础设施，但数据模型与产品能力各自独立。选错模式会增加不必要的复杂度。

## 对比

| 维度 | Grid（业务数据网格） | Spreadsheet（电子表格） |
|---|---|---|
| 抽象中心 | 业务记录（一行 = 一条记录） | 工作簿 / 单元格 |
| 标识 | 稳定业务主键 `id` | 行列坐标（A1 记法） |
| 数据规模 | 百万级记录，远程分页 / 虚拟化访问 | 稀疏单元格，万行 × 百列级 |
| 编辑器 | 文本 / 数字 / 日期 / 下拉 / 远程搜索（ERP 重点） | 通用单元格编辑 |
| 公式 | 不需要 | 核心能力（AST / 依赖图 / 增量计算） |
| 典型场景 | ERP 列表、库存、订单明细、CRM | 报表、财务模型、类 Excel 编辑 |
| 里程碑 | M0–M2 优先 | M3 |

## 何时用 Grid

- 行对应数据库记录，有稳定主键；
- 列是字段，需要自定义编辑器（如下拉选商品、远程搜索）与单元格级校验；
- 数据来自远程 API，需要分页 / 排序 / 筛选下推；
- 需要行选择、批量修改、插入 / 删除行。

```ts
const grid = createGrid({
  container: '#grid',
  columns: [
    { key: 'sku', title: '商品编码', width: 140 },
    { key: 'name', title: '商品名称', editor: 'remote-search', editorParams: { /* ... */ } },
    { key: 'qty', title: '库存', editor: 'number' },
  ],
  data: records, // 每条含稳定 id
})
```

## 何时用 Spreadsheet

- 用户需要 Excel 式自由编辑、公式联动、合并单元格、多工作表；
- 数据以单元格坐标组织，而非业务记录；
- 需要样式（字体、颜色、边框、数字格式）与条件格式。

```ts
const sheet = createSpreadsheet({
  container: '#sheet',
  sheets: [{ name: 'Sheet1', rowCount: 1000, columnCount: 26 }],
  features: { formula: true },
})
sheet.setCellValue(undefined, 0, 0, '=SUM(1,2,3)')
```

## 共享与差异

**共享**：选择系统、键盘导航、剪贴板、命令/撤销重做、渲染管线、主题、事件。

**不共享**：数据模型（记录 vs 稀疏单元格）、标识体系（rowId vs 行列坐标）、编辑与校验侧重、公式能力。

因此两者可以共享一套 UI 外壳与主题，但 API 与内部实现保持独立。公共门面 `SheetX.createGrid` / `SheetX.createSpreadsheet` 提供统一入口，但不隐藏二者语义差异。

## 下一步

[SheetXGrid API](/api/grid) · [SheetXSpreadsheet API](/api/spreadsheet) · [包地图](/guide/packages)
