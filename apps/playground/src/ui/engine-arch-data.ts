/**
 * SheetX 第 39 张 · 核心引擎架构可视化 — 数据层
 *
 * 8 个核心模块 + 中心引擎，统一支撑 Grid 与 Spreadsheet 双模式。
 * 零依赖，纯数据 + 类型定义。
 */
import type { IconName } from './icons.js'

/** 顶部导航 */
export const ARCH_NAV = ['核心架构', '技术优势', '模块详解', '扩展生态', '应用场景'] as const

/** 左侧产品特性 */
export interface Feature {
  icon: IconName
  title: string
  desc: string
  color: string
}
export const FEATURES: Feature[] = [
  { icon: 'bolt', title: '高性能渲染', desc: '百万级数据流畅体验', color: '#f59e0b' },
  { icon: 'gridView', title: '双模式支持', desc: 'Grid + Spreadsheet', color: '#2563eb' },
  { icon: 'fx', title: '强大公式引擎', desc: 'Excel 兼容计算', color: '#7c3aed' },
  { icon: 'puzzle', title: '插件扩展', desc: '开放的开发生态', color: '#059669' },
  { icon: 'laptop', title: '多端适配', desc: 'Web / 桌面 / 移动', color: '#0891b2' },
  { icon: 'shieldCheck', title: '稳定可靠', desc: '企业级质量保障', color: '#16a34a' },
]

/** 模块在 3×3 网格中的位置：row 0-2, col 0-2（中心 1,1 为引擎核心） */
export type ModuleKey = 'data' | 'formula' | 'interaction' | 'render' | 'worker' | 'plugin' | 'adapter' | 'state'
export interface CoreModule {
  key: ModuleKey
  icon: IconName
  cn: string
  en: string
  points: string[]
  row: number
  col: number
  tone: 'blue' | 'purple' | 'green' | 'amber' | 'cyan'
  detail: string
  api: string
}

export const CORE_MODULES: CoreModule[] = [
  {
    key: 'data', icon: 'database', cn: '数据层', en: 'Data', row: 0, col: 0, tone: 'blue',
    points: ['多数据源支持', '数据格式转换', '数据虚拟化'],
    detail: '统一的数据抽象层，通过 DataAdapter 接口对接任意宿主数据源。支持分页加载、增量提交、字段映射与虚拟滚动所需的数据切片，引擎本身不管理数据库。',
    api: 'registerDataAdapter() · load({page,pageSize,sort,filters}) · save(transaction)',
  },
  {
    key: 'formula', icon: 'fx', cn: '公式引擎', en: 'Formula', row: 0, col: 1, tone: 'purple',
    points: ['Excel 兼容公式', '自定义函数', '计算引擎优化'],
    detail: '独立于 UI 的纯计算内核，支持跨单元格引用、函数嵌套与依赖追踪。计算在 Worker 中执行，不阻塞渲染主线程。',
    api: 'registerFunction() · evaluate(expr, context) · onCalculate',
  },
  {
    key: 'interaction', icon: 'edit', cn: '交互层', en: 'Interaction', row: 0, col: 2, tone: 'cyan',
    points: ['单元格编辑', '选择操作', '事件处理'],
    detail: '键盘/鼠标/触摸的统一交互状态机，覆盖选区、编辑、复制粘贴、IME 输入法守卫与快捷键，全部以事件形式对外暴露。',
    api: 'on(\'cell:change\') · setSelection() · registerShortcut()',
  },
  {
    key: 'render', icon: 'palette', cn: '渲染层', en: 'Render', row: 1, col: 0, tone: 'purple',
    points: ['高性能渲染', '虚拟滚动', '多主题支持'],
    detail: '基于渲染指令（DrawCommand）的可插拔渲染管线，主线程 Canvas2D 与 OffscreenCanvas Worker 双后端，脏矩形与位块搬移保障 60 FPS。',
    api: 'Canvas2DRenderer · OffscreenRenderer · setTheme()',
  },
  {
    key: 'worker', icon: 'settings', cn: '工作线程', en: 'Worker', row: 1, col: 2, tone: 'blue',
    points: ['数据处理', '公式计算', '异步任务'],
    detail: '内联 Worker（零构建产物）承载排序、聚合、公式计算与后台渲染。带 revision 版本协议与主线程自动降级，Node 环境无 Worker 时透明回退。',
    api: 'createComputeRunner() · OffscreenRenderer · revision 协议',
  },
  {
    key: 'plugin', icon: 'puzzle', cn: '插件系统', en: 'Plugin', row: 2, col: 0, tone: 'green',
    points: ['功能扩展', '自定义组件', '开发者 API'],
    detail: '面向第三方开发者的扩展体系，提供生命周期钩子与 8 类扩展点：单元格编辑器、渲染器、工具栏按钮、事件订阅等均可替换。',
    api: 'registerPlugin() · addToolbarButton() · registerEditor()',
  },
  {
    key: 'adapter', icon: 'link', cn: '适配层', en: 'Adapter', row: 2, col: 1, tone: 'cyan',
    points: ['多框架支持', '多平台适配', '数据源适配'],
    detail: '宿主集成的统一边界：Vue / React / 原生 HTML 三种嵌入方式，Web Component 与 postMessage 双通道，用户上下文、权限回调与主题字体注入。',
    api: 'createInstance() · setHostConfig() · setPermissionCallback()',
  },
  {
    key: 'state', icon: 'shieldCheck', cn: '状态管理', en: 'State', row: 2, col: 2, tone: 'amber',
    points: ['数据状态', '视图状态', '撤销重做'],
    detail: '集中式状态容器管理选区、滚动、编辑暂存与操作历史，支持事务提交前的前端暂存与冲突比对，撤销重做基于不可变快照。',
    api: 'getState() · commit() · undo() / redo()',
  },
]

/** 右侧扩展生态 */
export interface EcoItem { icon: IconName; title: string; desc: string }
export const ECO_ITEMS: EcoItem[] = [
  { icon: 'code', title: '自定义渲染器', desc: '支持个性化单元格渲染' },
  { icon: 'edit', title: '自定义编辑器', desc: '扩展更多编辑组件' },
  { icon: 'puzzle', title: '业务插件', desc: '集成企业业务功能' },
  { icon: 'palette', title: '主题定制', desc: '打造专属品牌风格' },
  { icon: 'link', title: '第三方集成', desc: '与更多系统集成' },
]

/** 底部应用支持 */
export interface AppItem { icon: IconName; name: string; sub: string; color: string }
export const APP_ITEMS: AppItem[] = [
  { icon: 'globe', name: 'Web 应用', sub: '浏览器', color: '#2563eb' },
  { icon: 'laptop', name: '桌面应用', sub: 'Windows / macOS', color: '#0891b2' },
  { icon: 'gridView', name: '移动端', sub: 'iOS / Android', color: '#7c3aed' },
  { icon: 'code', name: 'Vue', sub: '官方组件', color: '#16a34a' },
  { icon: 'box', name: 'React', sub: '官方组件', color: '#0891b2' },
  { icon: 'more', name: '更多框架', sub: '支持扩展', color: '#6b7280' },
]

/** tone → 主题色（浅色主题强调色） */
export const TONE_COLOR: Record<CoreModule['tone'], string> = {
  blue: '#2563eb', purple: '#7c3aed', green: '#059669', amber: '#d97706', cyan: '#0891b2',
}
