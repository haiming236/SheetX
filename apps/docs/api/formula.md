# 公式与函数

SheetX 的公式引擎是独立包 `@sheetx/formula`：AST 解析 + 依赖图 + 增量计算 + 函数注册表。Grid 模式不引入它，Spreadsheet 独立升级。

## 基本用法

```ts
sheet.setCellValue(undefined, 0, 0, 100)      // A1
sheet.setCellValue(undefined, 1, 0, 200)      // A2
sheet.setCellValue(undefined, 2, 0, '=A1+A2') // A3 = 300
sheet.setCellValue(undefined, 3, 0, '=A3*2')  // A4 = 600

// 修改 A1 → 只有 A3、A4 重算，不会重算所有公式
sheet.setCellValue(undefined, 0, 0, 150)      // A3=350, A4=700
```

- 字符串以 `=` 开头即被识别为公式。
- 读取公式格 `getCellValue` 返回**计算值**；错误显示 `#DIV/0!` 等。
- 快照加载后用 `recalculateAll()` 手动触发全量重算。

## 第一版函数范围

| 类别 | 函数 |
|---|---|
| 聚合 | `SUM` `AVERAGE` `MIN` `MAX` `COUNT` `COUNTA` |
| 逻辑 | `IF` `AND` `OR` `NOT` |
| 数学 | `ROUND` `ABS` |
| 文本 | `CONCAT` `LEFT` `RIGHT` `MID` |
| 日期 | `TODAY` `NOW` `DATE` |
| 引用 | 单元格引用、区域引用、相对 / 绝对引用、跨工作表引用 |

后续版本逐步支持数组公式、动态数组、查找函数、命名区域。

## 依赖图与增量调度

- 引擎在**建图时**检测循环引用（不依赖求值时发现），避免栈溢出。
- 变更单元格时只重新计算受影响的节点，通过 `formula-change` 事件推送结果。
- 依赖查询使用区间索引（RTree 空间索引作为性能储备），200 变更格的场景下批量查询有基准数据。

## 自定义函数

通过函数注册表扩展（不修改核心即可增加领域函数）：

```ts
// 概念示例：注册后即可在公式中调用 =MYFUNC(...)
registerFunction('MYFUNC', (...args) => {
  // 纯函数：相同输入返回相同输出，便于缓存与增量计算
  return args.reduce((sum, v) => sum + Number(v), 0)
})
```

约定：

- 自定义函数应为**纯函数**（无副作用），否则增量调度与缓存语义不成立。
- 函数注册与 `core` 解耦，宿主可按需注册领域函数，不污染 MIT 核心。

## 循环引用

引擎会检测并报告循环引用，不会无限求值导致栈溢出。检测到时单元格显示错误值，并通过校验/诊断通道反馈。

## 下一步

[SheetXSpreadsheet API](/api/spreadsheet) · [并行计算](/advanced/worker) · [事件系统](/api/events)
