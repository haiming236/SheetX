/**
 * SheetX 第 35 张 · 嵌入式集成示例 — 数据
 *
 * 展示 CDN / npm / Web Components 三种集成方式，分别嵌入 Vue / React / 原生 HTML，
 * 以及初始化配置、数据绑定与事件回调。
 */
import type { IconName } from './icons.js'

/** 顶部文档菜单 */
export const DOC_NAV = ['首页', '开发者文档', '示例中心', 'API 参考', '常见问题']

/** 左侧开发者指南 */
export const GUIDE_NAV: Array<{ key: string; label: string; icon: IconName; children?: string[] }> = [
  { key: 'quick', label: '快速开始', icon: 'rocket' },
  { key: 'embed', label: '嵌入式集成', icon: 'link', children: ['Vue 集成示例', 'React 集成示例', '原生 HTML 示例'] },
  { key: 'api', label: 'API 参考', icon: 'terminal' },
  { key: 'advanced', label: '高级功能', icon: 'bolt' },
  { key: 'best', label: '最佳实践', icon: 'thumbsUp' },
  { key: 'tools', label: '开发工具', icon: 'puzzle' },
  { key: 'version', label: '版本更新', icon: 'clock' },
]

/** 框架 tab */
export const FRAMEWORKS = [
  { key: 'vue', label: 'Vue 示例', icon: '' as const, name: 'Vue 集成示例' },
  { key: 'react', label: 'React 示例', icon: '' as const, name: 'React 集成示例' },
  { key: 'html', label: 'HTML 示例', icon: '' as const, name: '原生 HTML 集成示例' },
] as const
export type Framework = (typeof FRAMEWORKS)[number]['key']

/** 三框架代码（真实可运行形态） */
export const FRAMEWORK_CODE: Record<Framework, string> = {
  vue: `<template>
  <div class="app">
    <SheetX
      :data="tableData"
      :options="sheetOptions"
      @onChange="handleChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { SheetX } from 'sheetx-vue';

const tableData = ref([
  { name: '笔记本电脑', qty: 10, price: 5800 },
  { name: '平板电脑', qty: 20, price: 3200 },
  { name: '智能手机', qty: 30, price: 4200 },
]);

const sheetOptions = {
  columns: [
    { field: 'name',  title: '产品名称', width: 160 },
    { field: 'qty',   title: '数量',    editor: 'number' },
    { field: 'price', title: '单价',    editor: 'currency' },
    { field: 'total', title: '金额',    computed: 'qty * price' },
  ],
  virtualScroll: true,
};

function handleChange(changes) {
  console.log('cell-change', changes);
}
</script>`,
  react: `import React, { useState } from 'react';
import { SheetXGrid } from 'sheetx-react';

export default function App() {
  const [data, setData] = useState([
    { name: '笔记本电脑', qty: 10, price: 5800 },
    { name: '平板电脑', qty: 20, price: 3200 },
    { name: '智能手机', qty: 30, price: 4200 },
  ]);

  const columns = [
    { field: 'name',  title: '产品名称', width: 160 },
    { field: 'qty',   title: '数量',    editor: 'number' },
    { field: 'price', title: '单价',    editor: 'currency' },
    { field: 'total', title: '金额',    computed: 'qty * price' },
  ];

  return (
    <SheetXGrid
      data={data}
      columns={columns}
      features={{ virtualScroll: true }}
      onCellChange={(changes) => console.log(changes)}
    />
  );
}`,
  html: `<!doctype html>
<html>
<head>
  <script src="https://cdn.sheetx.com/sheetx.js"></script>
</head>
<body>
  <sheetx-grid id="grid"></sheetx-grid>

  <script>
    const grid = document.getElementById('grid');
    grid.columns = [
      { field: 'name',  title: '产品名称', width: 160 },
      { field: 'qty',   title: '数量',    editor: 'number' },
      { field: 'price', title: '单价',    editor: 'currency' },
      { field: 'total', title: '金额',    computed: 'qty * price' },
    ];
    grid.data = [
      { name: '笔记本电脑', qty: 10, price: 5800 },
      { name: '平板电脑', qty: 20, price: 3200 },
      { name: '智能手机', qty: 30, price: 4200 },
    ];
    grid.addEventListener('sx-cell-change', (e) => {
      console.log('changed', e.detail);
    });
  </script>
</body>
</html>`,
}

/** 运行效果表格数据 */
export interface DemoRow { name: string; qty: number; price: number; total: number }
export const DEMO_ROWS: DemoRow[] = [
  { name: '笔记本电脑', qty: 10, price: 5800, total: 58000 },
  { name: '平板电脑', qty: 20, price: 3200, total: 64000 },
  { name: '智能手机', qty: 30, price: 4200, total: 126000 },
]
export const DEMO_TOTAL = { qty: 60, total: 248000 }

/** 三种集成方式 */
export const INTEGRATIONS: Array<{ key: string; title: string; desc: string; code: string; icon: IconName }> = [
  { key: 'cdn', title: '1. CDN 引入', desc: '通过 CDN 快速引入', code: '<script src="https://cdn.sheetx.com/sheetx.js"></script>', icon: 'cloudUpload' },
  { key: 'npm', title: '2. npm 安装', desc: '使用 npm 安装依赖', code: 'npm install sheetx', icon: 'package' },
  { key: 'wc', title: '3. Web Components', desc: '作为自定义元素使用', code: '<sheetx-grid ref="sheet" />', icon: 'gridView' },
]

/** 事件回调代码 */
export const EVENT_CODE = `<SheetX
  @onLoad="handleLoad"
  @onChange="handleChange"
  @onSave="handleSave"
/>`

/** 事件说明 */
export const EVENTS = [
  { name: 'onLoad', desc: '数据加载完成后触发' },
  { name: 'onChange', desc: '单元格数据变化时触发' },
  { name: 'onSave', desc: '提交保存到后端时触发' },
]

export interface FullConfig {
  framework: Framework
  copied: boolean
  showEventHelp: boolean
}

export const DEFAULT_CONFIG: FullConfig = {
  framework: 'vue',
  copied: false,
  showEventHelp: false,
}
