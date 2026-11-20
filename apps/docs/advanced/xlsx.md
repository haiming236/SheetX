# XLSX 导入导出

`@sheetx/io` 提供**零依赖** XLSX 基础读写：最小 OOXML + ZIP（store / deflate-raw），不引入 SheetJS / ExcelJS。完整 Excel 兼容仍保留为宿主可注入适配器的边界。

## 基本用法

```ts
import { buildXlsx, parseXlsx, registerBuiltinXlsxAdapter } from '@sheetx/io'

const bytes = await buildXlsx([
  { name: '销售', cells: [['商品', '金额'], ['苹果', '5.5']] },
])

const result = await parseXlsx(buffer)
console.log(result.sheets[0].cells)

registerBuiltinXlsxAdapter() // 注册为引擎默认适配器；宿主完整实现可覆盖
```

`registerXlsxAdapter()` 仍可注入宿主完整实现（SheetJS 等），覆盖内置版本。

## 支持的能力

| 能力 | 说明 |
|---|---|
| 单元格值 | 字符串 / 数字；`001` 保持文本，`5.5` 写成数值 |
| 富文本 | run 级粗体 / 斜体 / 下划线 / 字体色 / 字体名 / 字号；inlineStr 与 sharedStrings 均可读 |
| 日期 | 1900 日期系统序列号 + 最小 `styles.xml`；读回按 numFmt 自动还原 ISO 字符串 |
| 公式 | `<f>` + 缓存值；含共享公式读取与引用平移 |
| 样式 | 粗体 / 斜体 / 下划线、字体色、填充、边框、对齐、自动换行、数字格式 |
| 数据验证 | list / whole / decimal / date / textLength / custom |
| 条件格式 | cellIs / containsText / colorScale / expression / duplicateValues / top10 + dxf 差分样式 |
| 合并区域 | A1 记法（如 `B2:D4`） |
| 压缩 | `CompressionStream('deflate-raw')` 可用时压缩，否则降级 store |

## 日期与闰日边界

- Excel 1900 闰日 bug：序列号 1–59 用 1899-12-31 基准，≥61 用 1899-12-30；序列号 60（伪造的 1900-02-29）归一化到 1900-03-01。
- 非法日期（如 `2023-02-30`）返回 `null`，不静默算错。
- 时间分数 `.5` / `.75` 正确往返为 12:00 / 18:00。

## 公式边界

- 只保留公式字符串与缓存显示值，**不执行公式计算**，不把公式引擎拉进 IO 包。
- 外部契约统一带前导 `=`，写入时剥离、读回时补回。
- 共享公式按工作表内 `si` 分组，按相对偏移平移 A1 引用，`$` 锚点不动；函数名 / 工作表名 / 标识符片段不被误判。
- 写入端每格写普通 `<f>`（不改成 shared），旧行为零回归。

## OOXML 纪律

- worksheet 子节点顺序：`sheetData → mergeCells → conditionalFormatting → dataValidations`。
- 样式惰性登记（只写用到的），无样式 / 无公式 / 无验证时不输出对应字段（向后兼容）。

## 下一步

[Spreadsheet API](/api/spreadsheet) · [插件生态](/advanced/plugins) · [测试与验收](/engineering/testing)
