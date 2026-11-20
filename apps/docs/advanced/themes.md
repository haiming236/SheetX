# 主题系统

`@sheetx/themes` 提供主题令牌与浅 / 深两套内置主题。

## 使用

```ts
createGrid({
  container: '#grid',
  columns, data,
  theme: 'light', // 'light' | 'dark' | 自定义 ThemeTokens
})

grid.setTheme('dark')
```

## 令牌

`ThemeTokens` 定义颜色、字体与间距 / 边框令牌：

- 颜色：背景、前景、边框、选区、表头等；
- 字体：`fontFamily` / `fontSize` / `headerFontSize`；
- 间距：`spacing`（可选，旧主题缺字段自动兜底）；
- 边框：`border`（可选）。

## 双出口

主题有两套出口，务必理解：

1. **Canvas 渲染出口**：引擎读取令牌数值直接绘制（不依赖 CSS 变量）。
2. **CSS 变量出口**：`toCssVariables(theme)` 输出 `--sx-*` 变量（如 `--sx-font-family`、`--sx-space-*`、`--sx-border-*`），供 DOM 层（编辑器、菜单、弹层）使用。

改主题时两条出口同时更新，避免 Canvas 与 DOM 视觉不一致。

## 全局换肤

宿主文档站的全局主题（如 playground 的深浅切换）通过根元素 `data-theme` 与 CSS 变量覆盖实现；引擎实例通过 `setTheme()` 联动。两者职责分离：文档站主题管页面，引擎主题管表格。

## 自定义主题

传一个 `ThemeTokens` 对象即可完全定制；缺失字段由内置浅色主题兜底，便于只覆盖少数令牌。

## 下一步

[Grid API](/api/grid) · [格式化器](/api/formatters) · [插件生态](/advanced/plugins)
