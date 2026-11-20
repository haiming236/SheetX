/**
 * SheetX 第 24 张 · 插件中心与扩展生态 — 数据层
 *
 * 与 @sheetx/core/plugin-runtime 同构：manifest（市场条目）与安装状态分离，
 * 依赖拓扑排序 / 分类筛选 / 扩展点账本均为纯函数（playground 不额外加依赖）。
 */
import type { IconName } from './icons.js'

export type ExtensionPoint =
  | 'command' | 'editor' | 'formatter' | 'renderer'
  | 'dataAdapter' | 'theme' | 'menu' | 'function'

export const EP_LABELS: Record<ExtensionPoint, string> = {
  command: '命令',
  editor: '编辑器',
  formatter: '格式化器',
  renderer: '渲染器',
  dataAdapter: '数据适配器',
  theme: '主题',
  menu: '菜单',
  function: '函数',
}

export type PluginCategory =
  | '数据连接' | '可视化与图表' | 'AI 助手' | '函数扩展'
  | '业务组件' | '导入导出' | '效率工具'

export interface PluginItem {
  id: string
  name: string
  version: string
  category: PluginCategory
  desc: string
  rating: number
  downloads: number
  icon: IconName
  accent: string
  installed: boolean
  recommended?: boolean
  publisher: string
  extensionPoints: ExtensionPoint[]
  dependencies?: string[]
  permissions: string[]
  changelog: string
  updatedAt: string
}

export interface PluginState {
  installed: boolean
  enabled: boolean
  installedAt?: string
}

export type PluginSort = 'recommended' | 'downloads' | 'rating' | 'name'

export const PLUGIN_CATEGORIES: Array<'全部插件' | PluginCategory> = [
  '全部插件', '数据连接', '可视化与图表', 'AI 助手', '函数扩展', '业务组件', '导入导出', '效率工具',
]

export const SORT_OPTIONS: Array<{ key: PluginSort; label: string }> = [
  { key: 'recommended', label: '推荐排序' },
  { key: 'downloads', label: '下载量优先' },
  { key: 'rating', label: '评分优先' },
  { key: 'name', label: '名称排序' },
]

export const PLUGINS: PluginItem[] = [
  {
    id: 'db-connector', name: '数据库连接连接器', version: '1.2.0', category: '数据连接',
    desc: '连接 MySQL、PostgreSQL、达梦、金仓、SQL Server 等数据库，支持数据查询与导入。',
    rating: 4.9, downloads: 1230, icon: 'database', accent: '#10b981', installed: true,
    publisher: 'SheetX Labs', extensionPoints: ['dataAdapter', 'command'],
    permissions: ['读取连接配置', '发起只读查询'],
    changelog: 'v1.2.0：新增达梦 / 金仓驱动，连接池空闲回收。',
    updatedAt: '2026-11-18',
  },
  {
    id: 'function-plus', name: '函数增强包', version: '1.2.0', category: '函数扩展',
    desc: '扩展 300+ 常用函数（财务、统计、工程、文本处理等），与原生函数无缝集成。',
    rating: 4.8, downloads: 936, icon: 'fx', accent: '#8b5cf6', installed: true,
    publisher: 'Formula Team', extensionPoints: ['function', 'formatter'],
    permissions: ['注册全局函数'],
    changelog: 'v1.2.0：新增 XIRR / TEXTJOIN / 中文大写金额。',
    updatedAt: '2026-11-16',
  },
  {
    id: 'chart-pro', name: '高级图表库', version: '1.5.0', category: '可视化与图表',
    desc: '提供 ECharts 等增强图表类型：雷达图、桑基图、词云、地图等多种专业可视化。',
    rating: 4.8, downloads: 1102, icon: 'chartCombo', accent: '#2563eb', installed: false,
    publisher: 'Chart Studio', extensionPoints: ['renderer', 'menu'],
    permissions: ['注册渲染器', '添加插入菜单'],
    changelog: 'v1.5.0：新增桑基图与地图下钻，SVG 导出保真。',
    updatedAt: '2026-11-17',
  },
  {
    id: 'ai-assistant', name: 'AI 助手', version: '1.0.0', category: 'AI 助手',
    desc: '基于用户配置的本地模型或自定义 API Key，提供公式生成、数据分析、智能填充等能力。',
    rating: 4.9, downloads: 2413, icon: 'sparkles', accent: '#7c3aed', installed: false, recommended: true,
    publisher: 'SheetX AI', extensionPoints: ['command', 'function', 'menu'],
    permissions: ['读取当前选区', '调用用户配置模型'],
    changelog: 'v1.0.0：公式生成、异常值解释、批量填充。',
    updatedAt: '2026-11-19',
  },
  {
    id: 'format-pack', name: '格式扩展包', version: '1.3.0', category: '导入导出',
    desc: '支持更多文件格式：JSON、XML、CAJ、MOBI、Markdown 等导入与预览。',
    rating: 4.7, downloads: 698, icon: 'format', accent: '#ea580c', installed: false,
    publisher: 'IO Craft', extensionPoints: ['formatter', 'dataAdapter'],
    permissions: ['读取用户选择文件'],
    changelog: 'v1.3.0：新增 Markdown 表格预览与字段推断。',
    updatedAt: '2026-11-14',
  },
  {
    id: 'business-kit', name: '业务组件集', version: '1.1.0', category: '业务组件',
    desc: '常用业务组件：下拉选择、级联选择、日期区间、附件、用户选择等，快速构建业务表单。',
    rating: 4.7, downloads: 512, icon: 'gridView', accent: '#3b82f6', installed: false,
    publisher: 'Biz Components', extensionPoints: ['editor', 'menu'],
    permissions: ['注册单元格编辑器'],
    changelog: 'v1.1.0：级联选择与用户选择器支持远程数据源。',
    updatedAt: '2026-11-12',
  },
  {
    id: 'data-adapter', name: '数据适配器', version: '1.0.0', category: '数据连接',
    desc: '对接 ERP、OA 等系统数据（HTTP/REST），实现数据拉取与回写。',
    rating: 4.8, downloads: 459, icon: 'link', accent: '#0ea5e9', installed: false,
    publisher: 'SheetX Labs', extensionPoints: ['dataAdapter', 'command'], dependencies: ['db-connector'],
    permissions: ['访问用户授权接口', '回写业务数据'],
    changelog: 'v1.0.0：REST 适配器、字段映射与增量拉取。',
    updatedAt: '2026-11-10',
  },
  {
    id: 'custom-renderer', name: '自定义渲染器', version: '1.0.0', category: '可视化与图表',
    desc: '支持自定义单元格渲染（进度条、标签、评分、富文本等），提供开发 API 与示例。',
    rating: 4.7, downloads: 326, icon: 'palette', accent: '#ec4899', installed: false,
    publisher: 'Render Lab', extensionPoints: ['renderer', 'editor'],
    permissions: ['注册 Canvas 绘制钩子'],
    changelog: 'v1.0.0：进度条 / 评分 / 状态标签示例。',
    updatedAt: '2026-11-08',
  },
]

/** 社区市场补充项（“更多插件”卡片打开） */
export const COMMUNITY_PLUGINS: PluginItem[] = [
  {
    id: 'map-kit', name: '地图可视化', version: '0.9.2', category: '可视化与图表',
    desc: '在城市/区域格子里嵌入矢量地图与热力分布。', rating: 4.6, downloads: 288,
    icon: 'image', accent: '#0891b2', installed: false, publisher: 'GeoKit',
    extensionPoints: ['renderer'], permissions: ['加载地图瓦片'], changelog: '初版发布。', updatedAt: '2026-11-06',
  },
  {
    id: 'barcode', name: '条码与二维码', version: '1.4.0', category: '效率工具',
    desc: '按单元格内容生成 Code128 / QR Code，支持批量导出。', rating: 4.8, downloads: 764,
    icon: 'gridView', accent: '#475569', installed: false, publisher: 'Label Works',
    extensionPoints: ['formatter', 'renderer'], permissions: ['读取单元格内容'], changelog: '支持批量导出矢量码。', updatedAt: '2026-11-05',
  },
  {
    id: 'workflow', name: '审批流集成', version: '0.8.0', category: '业务组件',
    desc: '把表格行推送到飞书/钉钉审批，并回写审批状态。', rating: 4.5, downloads: 194,
    icon: 'clipboard', accent: '#6366f1', installed: false, publisher: 'Flow Bridge',
    extensionPoints: ['command', 'dataAdapter'], permissions: ['调用审批 API'], changelog: '飞书审批初版。', updatedAt: '2026-11-03',
  },
]

export interface ExtensionPointInfo {
  key: ExtensionPoint
  title: string
  icon: IconName
  color: string
  desc: string
  api: string
  code: string
}

export const EXTENSION_POINTS: ExtensionPointInfo[] = [
  {
    key: 'editor', title: '自定义编辑器', icon: 'edit', color: '#8b5cf6',
    desc: '用任意 Web Component 接管单元格编辑态：星级、颜色、级联选择都可插拔。',
    api: 'registerEditor(name, factory)',
    code: "grid.registerEditor('rating', (ctx) => ({\n  mount: (host) => host.append(createStars(ctx.value)),\n  getValue: () => current,\n}))",
  },
  {
    key: 'renderer', title: '渲染扩展', icon: 'palette', color: '#ec4899',
    desc: '在绘制指令层追加自定义图层，进度条、标签、水印保持矢量清晰。',
    api: 'registerRenderer(name, renderer)',
    code: "ctx.registerRenderer('progress', {\n  draw(cell, api) { api.rect(cell.bounds, track); api.rect(fillBounds, bar) },\n})",
  },
  {
    key: 'dataAdapter', title: '数据适配器', icon: 'database', color: '#10b981',
    desc: '把远端数据映射成虚拟页：分页、预取、去重与回写统一走适配器契约。',
    api: 'registerDataAdapter(name, adapter)',
    code: "ctx.registerDataAdapter('erp', {\n  async loadPage(offset, limit) { return fetch(`/api/rows?from=${offset}&size=${limit}`) },\n})",
  },
  {
    key: 'command', title: '命令扩展', icon: 'bolt', color: '#f59e0b',
    desc: '向工具栏、右键菜单与快捷键注册可撤销命令，进入统一 undo/redo 栈。',
    api: 'registerCommand(id, handler)',
    code: "ctx.registerCommand('plugin.normalize', {\n  execute: (ctx) => ctx.mutate(rows.map(trim)),\n  undo: (ctx, prev) => ctx.restore(prev),\n})",
  },
  {
    key: 'formatter', title: '格式化器', icon: 'format', color: '#3b82f6',
    desc: '注册显示格式与导入解析规则，不影响原始值，导出时可逆向解析。',
    api: 'registerFormatter(name, formatter)',
    code: "ctx.registerFormatter('duration', {\n  format: (v) => `${Math.round(v / 60)} 分`,\n  parse: (s) => Number(s.replace(' 分', '')) * 60,\n})",
  },
  {
    key: 'theme', title: '主题扩展', icon: 'sliders', color: '#a855f7',
    desc: '通过 CSS 变量注入整套设计令牌，插件 UI 自动跟随浅色/深色主题。',
    api: 'registerTheme(name, tokens)',
    code: "ctx.registerTheme('brand', {\n  '--sx-brand': '#4f46e5',\n  '--sx-bg-subtle': '#eef2ff',\n})",
  },
  {
    key: 'menu', title: '菜单扩展', icon: 'menu', color: '#0ea5e9',
    desc: '向顶部菜单、插入菜单与右键菜单追加入口，按权限与上下文动态显示。',
    api: 'registerMenu(name, menu)',
    code: "ctx.registerMenu('insert.map', {\n  path: 'insert', label: '地图图表',\n  when: (ctx) => ctx.selection.cols > 0,\n})",
  },
  {
    key: 'function', title: '函数扩展', icon: 'fx', color: '#22c55e',
    desc: '注册工作表函数，复用现有解析器、依赖追踪与错误诊断。',
    api: 'registerFunction(name, fn)',
    code: "ctx.registerFunction('CNY', {\n  minArgs: 1, maxArgs: 1,\n  evaluate: ([v]) => `¥${Number(v).toFixed(2)}`,\n})",
  },
]

export interface IntegrationItem {
  id: string
  name: string
  category: string
  icon: IconName
  color: string
  desc: string
  status: 'connected' | 'available'
}

export const INTEGRATIONS: IntegrationItem[] = [
  { id: 'mysql', name: 'MySQL / PostgreSQL', category: '数据库', icon: 'database', color: '#10b981', desc: '直连业务库，分页拉取与只读查询', status: 'connected' },
  { id: 'wecom', name: '企业微信 / 钉钉', category: '协同办公', icon: 'users', color: '#2563eb', desc: '审批推送、消息通知与通讯录选人', status: 'available' },
  { id: 'map', name: '高德 / 百度地图', category: '地理信息', icon: 'image', color: '#0891b2', desc: '地址解析、轨迹与热力分布可视化', status: 'available' },
  { id: 'llm', name: 'OpenAI / Ollama', category: 'AI 模型', icon: 'sparkles', color: '#7c3aed', desc: '公式生成、数据解释与智能填充', status: 'connected' },
  { id: 'erp', name: '金蝶 / 用友 ERP', category: '企业系统', icon: 'box', color: '#f59e0b', desc: '单据拉取、库存回写与凭证导出', status: 'available' },
]

export const DEV_GUIDE_STEPS = [
  { no: '01', title: '创建插件工程', desc: '复制示例工程，填写 manifest.json：id、版本、扩展点与依赖。' },
  { no: '02', title: '实现生命周期', desc: '在 onReady 中注册能力；资源清理统一放到 dispose / onDisable。' },
  { no: '03', title: '声明权限边界', desc: '只申请必要权限；所有外部请求由宿主代理，插件不直接持有凭据。' },
  { no: '04', title: '调试与预览', desc: '本地 dev server 热更新，调试面板可查看扩展点账本与加载顺序。' },
  { no: '05', title: '打包上架', desc: '产出 ESM + 类型声明， marketplace 校验签名后发布。' },
]

export const DEV_API_ITEMS = [
  { name: 'registerEditor', point: 'editor', sign: '(name, factory) => void', desc: '注册单元格编辑器工厂' },
  { name: 'registerRenderer', point: 'renderer', sign: '(name, renderer) => void', desc: '注册自定义绘制图层' },
  { name: 'registerDataAdapter', point: 'dataAdapter', sign: '(name, adapter) => void', desc: '注册分页数据适配器' },
  { name: 'registerCommand', point: 'command', sign: '(id, command) => void', desc: '注册可撤销命令' },
  { name: 'registerFormatter', point: 'formatter', sign: '(name, formatter) => void', desc: '注册格式化/解析器' },
  { name: 'registerFunction', point: 'function', sign: '(name, fn) => void', desc: '注册工作表函数' },
  { name: 'registerTheme', point: 'theme', sign: '(name, tokens) => void', desc: '注册设计令牌' },
  { name: 'registerMenu', point: 'menu', sign: '(name, menu) => void', desc: '注册菜单入口' },
]

export const DEV_EXAMPLE = `import type { IPlugin } from '@sheetx/core'

export default class RatingPlugin implements IPlugin {
  readonly name = 'rating-editor'
  readonly version = '1.0.0'
  readonly extensionPoints = ['editor'] as const

  onReady(ctx) {
    ctx.registerEditor('rating', (cell) => ({
      mount: (host) => renderStars(host, cell.value),
      getValue: () => readStars(),
      dispose: () => host.replaceChildren(),
    }))
  }

  dispose() { /* 插件自绘 DOM 由编辑器注册表统一回收 */ }
}`

/** 与 core/resolvePluginOrder 同构的依赖顺序（用于扩展管理面板） */
export function resolveInstallOrder(
  plugins: ReadonlyArray<PluginItem>,
  enabledIds: ReadonlySet<string>,
): { id: string; name: string; deps: string[] }[] {
  const byId = new Map(plugins.map((plugin) => [plugin.id, plugin]))
  const order: { id: string; name: string; deps: string[] }[] = []
  const visiting = new Set<string>()
  const done = new Set<string>()

  const visit = (id: string): void => {
    if (done.has(id)) return
    if (visiting.has(id)) return // UI 层遇到循环只跳过，运行时会给出明确错误
    const plugin = byId.get(id)
    if (!plugin || !enabledIds.has(id)) return
    visiting.add(id)
    for (const dep of plugin.dependencies ?? []) visit(dep)
    visiting.delete(id)
    done.add(id)
    order.push({ id, name: plugin.name, deps: [...(plugin.dependencies ?? [])] })
  }

  for (const plugin of plugins) visit(plugin.id)
  return order
}

/** 与 core/filterPlugins 同构的搜索、分类与排序 */
export function filterPlugins(
  plugins: ReadonlyArray<PluginItem>,
  options: { query?: string; category?: string; sort?: PluginSort; installedIds?: ReadonlySet<string> },
): PluginItem[] {
  const keyword = options.query?.trim().toLocaleLowerCase() ?? ''
  const result = plugins.filter((plugin) => {
    if (options.category && options.category !== '全部插件' && plugin.category !== options.category) return false
    if (keyword) {
      const haystack = [
        plugin.name, plugin.desc, plugin.category, plugin.publisher,
        ...plugin.extensionPoints.map((point) => EP_LABELS[point]),
      ].join(' ').toLocaleLowerCase()
      if (!haystack.includes(keyword)) return false
    }
    return true
  })
  const sort = options.sort ?? 'recommended'
  return result.sort((a, b) => {
    if (sort === 'downloads') return b.downloads - a.downloads || a.name.localeCompare(b.name, 'zh-CN')
    if (sort === 'rating') return b.rating - a.rating || a.name.localeCompare(b.name, 'zh-CN')
    if (sort === 'name') return a.name.localeCompare(b.name, 'zh-CN')
    // 推荐排序 = 设计稿中的清单顺序（稳定排序）
    return 0
  })
}

export function initialPluginStates(): Record<string, PluginState> {
  const states: Record<string, PluginState> = {}
  for (const plugin of PLUGINS) {
    states[plugin.id] = { installed: plugin.installed, enabled: plugin.installed }
  }
  return states
}

export function installedCount(states: Record<string, PluginState>): number {
  return Object.values(states).filter((state) => state.installed).length
}
