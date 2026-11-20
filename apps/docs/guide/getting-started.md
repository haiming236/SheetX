# 快速开始

本页用最短路径带你跑起一个可编辑的 Grid 和一个支持公式的 Spreadsheet。

## 环境要求

- Node.js ≥ 22
- pnpm ≥ 12（本仓库使用 `packageManager: pnpm@12.15.0`）
- 浏览器：Chrome / Edge（基线目标）

## 一、拉起仓库与开发服务

```bash
pnpm install
pnpm dev        # 启动 playground，访问 http://localhost:5227
pnpm typecheck  # 全工程类型检查
pnpm test       # 全部单元测试
```

> 引擎包以 **workspace 源码直连**形态提供（`main` 直接指向 `src/index.ts`），Vite 原生支持，无需先 build。

## 二、最小 Grid（业务数据网格）

```ts
import { createGrid } from '@sheetx/grid'

const grid = createGrid({
  container: '#grid-host', // 容器必须有确定尺寸（引擎 100% 填充）
  columns: [
    { key: 'name', title: '商品名称', width: 180 },
    { key: 'qty', title: '数量', width: 100, editor: 'number', editable: true },
    { key: 'price', title: '单价', width: 100, editor: 'currency' },
  ],
  data: [
    { id: 'p1', name: '苹果', qty: 100, price: 5.5 },
    { id: 'p2', name: '香蕉', qty: 200, price: 3.2 },
  ],
  features: { clipboard: true, undoRedo: true, editing: true },
})

// 监听数据变化（用户编辑 / API 写入 / 粘贴 / 撤销都会触发）
grid.on('cell-change', (tx) => console.log(tx.changes))

// 读值与写值都使用稳定的行 id
console.log(grid.getValue('p1', 'qty')) // 100
grid.setValue('p1', 'qty', 120)
await grid.undo()
```

**⚠️ 行 id 必须稳定**：生产环境务必给每条业务记录提供唯一主键 `id`。省略时引擎会生成不稳定 id，`getValue` / `setValue` 依赖它，下标会随插删漂移，禁止把下标当身份存储。详见 [Grid API](/api/grid#行-id-说明)。

## 三、最小 Spreadsheet（电子表格）

```ts
import { createSpreadsheet } from '@sheetx/spreadsheet'

const sheet = createSpreadsheet({
  container: '#sheet-host',
  sheets: [{ name: 'Sheet1', rowCount: 200, columnCount: 26 }],
  features: { formula: true },
})

sheet.setCellValue(undefined, 0, 0, 100)      // A1 = 100
sheet.setCellValue(undefined, 1, 0, '=A1*2')  // B1 = 公式，自动增量重算
console.log(sheet.getCellValue(undefined, 1, 0)) // 200

sheet.on('formula-change', (changes) => console.log(changes))
```

字符串以 `=` 开头即被识别为公式。公式引擎采用依赖图 + 增量调度，修改 A1 只重算受影响节点（见 [公式与函数](/api/formula)）。

## 四、通过公共门面创建

不想区分两个包时，可用顶层门面：

```ts
import { SheetX } from '@sheetx/web-component'

const grid = SheetX.createGrid({ container: '#grid', columns, data })
const sheet = SheetX.createSpreadsheet({ container: '#sheet', sheets })
```

CDN / 单脚本场景改用 `@sheetx/web-component/cdn` 入口：脚本加载后自动挂载全局 `SheetX` 并注册 `<sheetx-grid>` / `<sheetx-spreadsheet>` 自定义元素；npm 场景从 `@sheetx/web-component` 具名导入，**无副作用**。详见 [安装与集成](/guide/installation)。

## 下一步

- 想理解为什么这样设计：[架构总览](/guide/architecture)
- 想知道全部可用方法：[API 总览](/api/)
- 想接入 ERP 场景（远程搜索编辑器、数据校验）：[编辑器](/api/editors)
