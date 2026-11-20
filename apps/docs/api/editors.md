# 编辑器

编辑器负责单元格的编辑 UI。SheetX 内置多种编辑器，并支持注册自定义编辑器——这是 ERP 场景定制的主战场。

## 内置编辑器

| 名称 | 用途 | 关键参数 |
|---|---|---|
| `text` | 文本 | — |
| `number` | 数字 | 精度、上下界 |
| `currency` | 金额 | 币种、小数位 |
| `date` | 日期 | 日期格式（ISO 互转） |
| `select` | 下拉选择 | 静态选项列表 |
| `remote-search` | 远程搜索（ERP 核心） | `query(params)` 回调、防抖 |

在列定义中通过 `editor` 指定，未指定时按值类型推断：

```ts
columns: [
  { key: 'name', title: '名称', editor: 'text' },
  { key: 'qty', title: '数量', editor: 'number', editable: true },
  { key: 'price', title: '单价', editor: 'currency' },
  { key: 'sku', title: '商品', editor: 'remote-search', editorParams: { query } },
]
```

## 远程搜索编辑器

通过回调获取数据，可 mock 测试，不硬编码任何后端：

```ts
const query = async ({ keyword, signal }) => {
  const res = await fetch(`/api/products?q=${encodeURIComponent(keyword)}`, { signal })
  return res.json() // [{ label: '苹果', value: 'P001' }, ...]
}

columns: [{
  key: 'product', title: '商品', editor: 'remote-search',
  editorParams: { query, debounceMs: 200 },
}]
```

关键行为（有单测覆盖）：

- **防抖**：连续输入只在停止 `debounceMs` 后发起一次请求。
- **竞态保护**：用 `querySeq` 丢弃过期响应，慢请求不会覆盖新结果。
- **字段联动**：`commit(value, payload, meta)` 可在一次事务中写回多列（如选商品同时带出单价）。
- **缺参报错**：未传 `params.query` 时给出可诊断错误，而非静默失败。

## 自定义编辑器契约

```ts
grid.registerEditor('my-editor', () => ({
  el: HTMLElement,          // 编辑 UI 根元素
  focus(): void,            // 进入编辑时聚焦
  getValue(): unknown,      // 提交值
  commit(value, payload, meta): void, // 一次事务写回多字段（可选）
  destroy(): void,          // 销毁
}))
```

要点：

- 焦点管理：编辑器要正确处理焦点是否仍属当前单元格。
- 键盘：方向键在选项间移动还是移动单元格，由编辑器与 Input Engine 协同决定。
- Esc / Enter：区分"关闭下拉"与"取消编辑"。
- 弹层定位：滚动时弹层要跟随单元格（详见 [进阶](/advanced/) 中的弹层挂载说明）。

## IME 协同

编辑器天然与 `ImeGuard` 配合：组合期间不提交输入，`compositionend` 后提交一次。无需在自定义编辑器里重复实现守卫逻辑，但**不要在 composition 期间调用 `commit()`**。

## 下一步

[格式化器](/api/formatters) · [Grid API](/api/grid) · [事件系统](/api/events)
