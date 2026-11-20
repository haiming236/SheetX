# 插件与扩展生态

SheetX 通过插件运行时支撑可扩展架构：目录 / 安装态分离、依赖拓扑、生命周期与扩展点账本。

## 扩展点

| 扩展点 | 用途 |
|---|---|
| `editor` | 自定义单元格编辑器 |
| `formatter` | 显示格式化 |
| `renderer` | 渲染扩展（绘制指令 / 图层） |
| `dataAdapter` | 数据适配器（本地 / 远程 / 分页） |
| `validator` | 校验规则 |
| `function` | 自定义公式函数 |
| `theme` | 主题扩展 |
| `command` | 命令扩展 |

## 插件运行时

`@sheetx/core` 的插件运行时提供：

- **目录 / 安装态分离**：清单（manifest）与运行时状态（安装 / 启用 / 版本）解耦。
- **依赖拓扑排序**：按依赖关系决定加载顺序；依赖缺失 / 循环 / 未启用会被拒绝。
- **生命周期**：`STARTING → READY → RENDERED → STEADY`，错误隔离（单个插件异常不影响宿主）。
- **状态序列化**：插件状态可持久化，刷新后恢复。
- **卸载保护**：存在下游依赖时拒绝卸载。

## 注册插件（概念示例）

```ts
runtime.install({
  id: 'barcode',
  name: '条码与二维码',
  extensionPoint: 'editor',
  dependencies: [],
  activate(ctx) {
    ctx.registerEditor('barcode', createBarcodeEditor)
  },
})
```

## 第三方集成能力

插件中心类 UI 通常还需要：市场（分类 / 搜索 / 排序）、安装管理（启用 / 停用 / 更新 / 卸载）、开发者工具（指南 / 示例 / API / 调试）与第三方集成（如企业微信 / 钉钉连接）。playground 的 `#plugins` 页面提供完整交互参考。

## 与 MIT / 商业边界

- MIT 核心提供插件运行时与扩展点契约。
- 专业插件与商业扩展独立加载、独立授权，不在核心植入不透明限制代码。
- 宿主可注入自有完整实现（如 XLSX 适配器）覆盖内置版本。

## 下一步

[编辑器](/api/editors) · [格式化器](/api/formatters) · [XLSX 导入导出](/advanced/xlsx)
