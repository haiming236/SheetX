# 格式化器

格式化器负责**显示层**：把原始值转换成用户看到的字符串，不改变底层数据。

## 注册与使用

```ts
grid.registerFormatter('percent1', (value) =>
  typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : String(value ?? ''))

columns: [
  { key: 'rate', title: '完成率', formatter: 'percent1' },
]
```

- 格式化器是纯函数：`(value) => string`。
- 注册按名称，列定义通过 `formatter` 引用。
- 未指定时使用默认格式化（按值类型）。

## 常见场景

| 场景 | 示例实现要点 |
|---|---|
| 千分位 | `Number(value).toLocaleString('zh-CN')` |
| 日期 | 配合 `Intl.DateTimeFormat`，注意时区 |
| 金额 | 固定小数位 + 币种符号 |
| 状态映射 | 枚举值 → 中文标签 / 徽标文本 |

## 与表格样式 / Excel 数字格式的区别

- **格式化器**是 Grid 显示层的轻量转换，适合业务字段的定制展示。
- **单元格样式 `numFmt`**（Spreadsheet）是单元格级数字格式，随 XLSX 一起读写（见 [XLSX 导入导出](/advanced/xlsx)）。
- 两者不互相覆盖：Grid 用 formatter，Sheet 用 numFmt。

## 提示

格式化只影响显示；值与校验始终基于原始值。若需要"显示 1,234 但编辑时是 1234"，在编辑器的取值/提交层处理，不要在 formatter 里改数据。

## 下一步

[编辑器](/api/editors) · [Grid API](/api/grid) · [主题系统](/advanced/themes)
