/**
 * SheetX 第 36 张 · 完整 API 文档中心 — 数据
 *
 * 让第三方开发者快速上手并完成深度集成：实例创建 / 数据接口 / 列配置 / 事件 /
 * 编辑器扩展 / 渲染器扩展 / TypeScript 类型。
 */
/** 顶部文档菜单 */
export const DOC_NAV = ['首页', '开发者文档', '示例中心', 'API 参考', '常见问题']

/** 左侧分组导航 */
export interface NavGroup { title: string; items: Array<{ key: string; label: string; child?: boolean }> }
export const NAV_GROUPS: NavGroup[] = [
  { title: '快速开始', items: [
    { key: 'install', label: '安装引入' }, { key: 'create', label: '创建实例', child: true }, { key: 'basic', label: '基本使用' },
  ] },
  { title: '核心 API', items: [
    { key: 'data', label: '数据接口' }, { key: 'columns', label: '列配置' }, { key: 'events', label: '事件系统' }, { key: 'methods', label: '方法调用' },
  ] },
  { title: '扩展开发', items: [
    { key: 'editor-ext', label: '自定义编辑器' }, { key: 'renderer-ext', label: '自定义渲染器' }, { key: 'plugin-ext', label: '插件开发' },
  ] },
  { title: '类型定义', items: [{ key: 'types', label: 'TypeScript 类型' }] },
  { title: '其他', items: [{ key: 'changelog', label: '更新日志' }, { key: 'faq', label: '常见问题' }] },
]

/** 文档元信息（面包屑 + 标题 + 副标题） */
export const DOC_META: Record<string, { group: string; title: string; sub: string }> = {
  install: { group: '快速开始', title: '安装引入', sub: '通过 CDN、npm 或 Web Components 引入 SheetX。' },
  create: { group: '快速开始', title: '创建实例', sub: '通过简单的配置，快速创建一个 SheetX 表格实例。' },
  basic: { group: '快速开始', title: '基本使用', sub: '掌握读写数据、选区与销毁实例的基本操作。' },
  data: { group: '核心 API', title: '数据接口', sub: '通过 DataAdapter 与宿主系统交换数据，引擎不管理数据库。' },
  columns: { group: '核心 API', title: '列配置', sub: '定义字段、编辑器、格式化器与列宽等列级能力。' },
  events: { group: '核心 API', title: '事件系统', sub: '订阅数据变化、选区变化与编辑拦截事件。' },
  methods: { group: '核心 API', title: '方法调用', sub: 'getValue / setValue / undo / validate 等公共 API。' },
  'editor-ext': { group: '扩展开发', title: '自定义编辑器', sub: '注册单元格编辑 UI，支持远程搜索等业务编辑器。' },
  'renderer-ext': { group: '扩展开发', title: '自定义渲染器', sub: '通过绘制指令扩展图层，不侵入业务数据结构。' },
  'plugin-ext': { group: '扩展开发', title: '插件开发', sub: '通过生命周期钩子与扩展点构建第三方插件。' },
  types: { group: '类型定义', title: 'TypeScript 类型', sub: '完整的公共类型定义，支持类型安全的深度集成。' },
  changelog: { group: '其他', title: '更新日志', sub: '版本演进与破坏性变更说明。' },
  faq: { group: '其他', title: '常见问题', sub: '集成过程中的高频问题与解答。' },
}

/** 引入方式 3 tab */
export const INTRO_TABS = ['CDN 引入', 'npm 安装', 'Web Components'] as const
export type IntroTab = (typeof INTRO_TABS)[number]

export const INTRO_CODE: Record<IntroTab, string> = {
  'CDN 引入': `<script src="https://cdn.sheetx.com/sheetx.js"></script>
<link rel="stylesheet" href="https://cdn.sheetx.com/sheetx.css" />`,
  'npm 安装': `pnpm add @sheetx/core @sheetx/grid

// ES 模块化引入（推荐）
import { SheetX } from '@sheetx/web-component'`,
  'Web Components': `<script type="module">
  import '@sheetx/web-component'
</script>
<sheetx-grid id="grid"></sheetx-grid>`,
}

/** 创建实例代码 */
export const CREATE_CODE = `const sheet = new SheetX({
  el: '#app',
  columns: /* 列配置 */,
  data: /* 数据源 */,
  height: 500,
});`

/** 完整示例代码 */
export const FULL_CODE = `import { SheetX } from 'sheetx';

const sheet = new SheetX({
  el: '#app',
  columns: columns,
  data: data,
  height: 600,
});`

/** 配置选项表 */
export interface ConfigOption { param: string; type: string; def: string; desc: string }
export const CONFIG_OPTIONS: ConfigOption[] = [
  { param: 'el', type: 'string | HTMLElement', def: '-', desc: '容器元素或选择器' },
  { param: 'columns', type: 'Column[]', def: '[]', desc: '列配置数组' },
  { param: 'data', type: 'any[]', def: '[]', desc: '数据源' },
  { param: 'height', type: 'number | string', def: '400', desc: '表格高度' },
  { param: 'theme', type: 'string', def: 'default', desc: '主题风格' },
  { param: 'i18n', type: 'I18nConfig', def: '-', desc: '国际化配置' },
  { param: 'features', type: 'Features', def: '{}', desc: '功能开关' },
]

/** 在线示例表格 */
export interface DemoRow { name: string; qty: number; price: number; total: number }
export const DEMO_ROWS: DemoRow[] = [
  { name: '笔记本电脑', qty: 10, price: 5800, total: 58000 },
  { name: '平板电脑', qty: 20, price: 3200, total: 64000 },
  { name: '智能手机', qty: 30, price: 4200, total: 126000 },
]

/** 其它文档页的正文片段（概念说明 + 代码片段） */
export const DOC_BODY: Record<string, { points: string[]; code: string }> = {
  install: { points: ['CDN 适合无构建工具页面，npm 适合现代工程', 'ES 模块化引入便于 Tree Shaking', 'Web Components 可跨框架嵌入'], code: INTRO_CODE['CDN 引入'] },
  basic: { points: ['getValue / setValue 读写单元格', 'getSelectedRange 获取选区', 'destroy 释放事件与 Worker 资源'], code: `sheet.setValue('r1', 'qty', 20);\nconst v = sheet.getValue('r1', 'qty');\nsheet.on('cell-change', (tx) => console.log(tx.changes));` },
  data: { points: ['引擎不内置数据库', '通过 DataAdapter.load / save 交换增量', '支持远程分页、排序、筛选下推'], code: `SheetX.registerDataAdapter({\n  async load({ page, pageSize }) {\n    const res = await fetch('/api/rows?page=' + page);\n    return { rows: res.list, total: res.total };\n  }\n});` },
  columns: { points: ['field 绑定数据字段', 'editor 指定编辑器名', 'formatter 控制显示格式', 'frozen 冻结列需从首列连续'], code: `columns: [\n  { field: 'name', title: '名称', width: 160 },\n  { field: 'qty', title: '数量', editor: 'number' },\n  { field: 'price', title: '单价', editor: 'currency' },\n]` },
  events: { points: ['cell-change 数据变化', 'selection-change 选区变化', 'before-edit 可取消编辑'], code: `sheet.on('before-edit', (e) => {\n  if (e.field === 'locked') e.cancel();\n});` },
  methods: { points: ['读写值与批量更新', 'undo / redo 历史', 'validate 全表校验'], code: `await sheet.validate();\nsheet.undo();\nsheet.setData(records);` },
  'editor-ext': { points: ['registerEditor 注册编辑器工厂', '支持文本/数字/日期/远程搜索', '编辑器通过 commit 写回多字段'], code: `sheet.registerEditor('remote-search', () => ({\n  el, focus, getValue, commit, destroy\n}));` },
  'renderer-ext': { points: ['绘制指令为纯数据', '渲染器不解释业务含义', '可新增指令类型扩展图层'], code: `app.addLayer({\n  id: 'badge',\n  commands: [{ t: 'rect', x, y, w, h }]\n});` },
  'plugin-ext': { points: ['install / activate / deactivate 生命周期', '8 类扩展点', '插件状态可持久化'], code: `registerPlugin({\n  id: 'qrcode',\n  install(app) { app.addToolbarButton({ ... }); }\n});` },
  types: { points: ['GridConfig / ColumnDef 等公共类型', '事件载荷类型完整', '@sheetx/core 零依赖可独立引用'], code: `import type { GridConfig, CellChange } from '@sheetx/core';\n\nconst config: GridConfig = { container: '#grid', columns: [] };` },
  changelog: { points: ['v1.0.0 稳定公共 API', '新增 OffscreenCanvas 后台渲染', '新增 i18n 与 RTL 支持'], code: `// v1.0.0\n- MIT 核心 + 商业扩展边界\n- Worker 并行计算` },
  faq: { points: ['容器需有确定尺寸', '行 id 必须稳定唯一', '前端权限仅用于 UX'], code: `// Q: 画布空白？\n// A: 给容器设置明确 height` },
}

export interface FullConfig { doc: string; introTab: IntroTab; copied: string }
export const DEFAULT_CONFIG: FullConfig = { doc: 'create', introTab: 'CDN 引入', copied: '' }
