# 安装与集成

SheetX 提供三种集成方式，按需选择。

## 方式一：npm + 框架项目（推荐）

按使用场景安装最小依赖集：

```bash
# 只需要业务数据网格
pnpm add @sheetx/grid

# 需要电子表格与公式
pnpm add @sheetx/spreadsheet

# 需要文件导入导出
pnpm add @sheetx/io

# 需要主题令牌
pnpm add @sheetx/themes
```

依赖方向是单向的：`适配层 → 模式层 → 引擎层 → core（零依赖）`。只安装 Grid 不会拉入公式引擎或 XLSX 代码，利于 Tree Shaking。

### Web Component 适配层

```ts
import '@sheetx/web-component' // 注册 <sheetx-grid> / <sheetx-spreadsheet>
```

```html
<sheetx-grid id="grid"></sheetx-grid>
```

```ts
const el = document.querySelector('sheetx-grid')
el.columns = columns
el.data = data
el.addEventListener('sx-cell-change', (e) => console.log(e.detail))
```

### Vue / React 适配层

`@sheetx/vue` 与 `@sheetx/react` 提供框架包装。当前状态见 [状态与路线](/guide/roadmap)；适配层的实现配方与已解决的坑见 [进阶文档](/advanced/)。

## 方式二：公共门面（跨模式统一 API）

```ts
import { SheetX } from '@sheetx/web-component'

const grid = SheetX.createGrid({ container: '#grid', columns, data })
const sheet = SheetX.createSpreadsheet({ container: '#sheet', sheets })

grid.on('cell-change', handler)
grid.destroy()
```

npm 场景从包主入口具名导入，**无副作用**（不会污染全局）。

## 方式三：CDN / 单脚本

```html
<script src="https://cdn.example.com/sheetx/web-component.js"></script>
<script>
  const grid = SheetX.createGrid({ container: '#grid', columns, data })
</script>
```

入口为 `@sheetx/web-component/cdn`：加载后自动挂全局 `SheetX` 并注册自定义元素。适合无构建工具的后台页面或低代码平台嵌入。

## 容器要求

- 容器元素必须有**确定尺寸**（引擎按 100% 填充）。给容器设置 `height` 或确认父级有高度，否则画布尺寸为 0。
- 一个 canvas 只能执行一次 `transferControlToOffscreen()`；已被主线程 `getContext('2d')` 的画布无法再交给后台渲染 Worker，会自动降级（见 [后台渲染](/advanced/offscreen)）。

## 浏览器基线

| 浏览器 | 支持 |
|---|---|
| Chrome / Edge | 完整支持 |
| Firefox / Safari | 暂不作为基线目标（部分新 API 可能缺失时自动降级） |
| 企业旧版浏览器 | 不兼容 |

详见 [浏览器兼容](/engineering/compatibility)。

## 下一步

[快速开始](/guide/getting-started) · [架构总览](/guide/architecture) · [Grid API](/api/grid)
