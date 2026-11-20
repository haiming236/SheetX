---
layout: home

hero:
  name: Sheet X
  tagline: 专为企业业务系统打造的嵌入式高性能表格引擎
  desc: Grid + Spreadsheet 双模式共存，Canvas 渲染、虚拟滚动、公式增量计算、中文输入与 Excel 剪贴板互操作 —— 一个脚本即可集成。
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 查看 API
      link: /api/
    - theme: alt
      text: 架构总览
      link: /guide/architecture
  image:
    alt: SheetX Logo
    src: /logo.svg
    width: 180

features:
  - icon: 🧩
    title: 双模式，一套内核
    details: 业务数据网格（Grid）与电子表格（Spreadsheet）共享选择、渲染、命令与编辑基础设施，却各自拥有贴合场景的数据模型。
  - icon: ⚡
    title: 为大数据而生
    details: 行高前缀和索引 + 虚拟滚动 + 脏矩形重绘 + 滚动位块搬移，10 万行滚动目标 60 FPS，1000 列横向虚拟滚动。
  - icon: 🧮
    title: 独立公式引擎
    details: 自研解析器、依赖图与增量调度，改 A1 只重算受影响节点；函数注册表支持内置与自定义函数，MIT 核心零第三方依赖。
  - icon: 🇨🇳
    title: 中文与 Excel 互操作
    details: 独立 IME 守卫正确处理 composition 全序列；TSV / HTML 剪贴板与 Excel、WPS 双向粘贴；XLSX 零依赖读写。
  - icon: 🔌
    title: 插件与扩展生态
    details: 8 类扩展点、插件目录与依赖拓扑、生命周期账本；自定义编辑器、渲染器、数据适配器均可注入，商业扩展与 MIT 核心边界清晰。
  - icon: 📦
    title: 跨框架、按需加载
    details: 原生 Web Component + Vue / React 适配层；Script / npm / Custom Element 三种集成方式；只装 Grid 不会拉入公式与 XLSX 代码。
---

## 为什么是 SheetX {#why}

SheetX 的定位不是"再做一个 Univer"，而是：**集成体验更简单、业务编辑体验更专业、中文支持更好、性能透明、授权更友好的 Web 表格引擎**。

- **纯前端**：不内置后端、数据库、账户权限或强制云服务。数据通过 Data Adapter 回调与宿主系统交互。
- **MIT 核心开源**：虚拟滚动、基础编辑、复制粘贴、撤销重做等基础能力全部在社区版且足够优秀；商业版卖的是高阶生产力与企业级能力。
- **工程透明**：渲染 benchmark、浏览器 E2E 与单测全部落盘为真实报告，不靠"感觉流畅"。

## 十秒上手 {#quick-look}

```ts
import { createGrid } from '@sheetx/grid'

const grid = createGrid({
  container: '#grid',
  columns: [
    { key: 'name', title: '商品名称', width: 180 },
    { key: 'qty', title: '数量', editor: 'number', editable: true },
    { key: 'price', title: '单价', editor: 'currency' },
  ],
  data: [
    { name: '苹果', qty: 100, price: 5.5 },
    { name: '香蕉', qty: 200, price: 3.2 },
  ],
})

grid.on('cell-change', (tx) => console.log(tx.changes))
```

继续阅读 [快速开始](/guide/getting-started) 了解完整集成步骤。
