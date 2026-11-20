/**
 * SheetX 第 40 张 · 技术选型与底层渲染架构 — 数据层
 *
 * Canvas 2D + DOM 混合渲染：Canvas 负责大规模数据渲染，DOM 处理交互编辑。
 * 技术栈组合与主线程/后台线程任务分工。
 */
import type { IconName } from './icons.js'

/** 顶部导航 */
export const ARCH_NAV = ['技术选型', '渲染架构', '性能优化', '跨平台支持', '生态兼容'] as const
/** 三个 tab */
export const ARCH_TABS = ['混合渲染架构', '渲染流程', '关键技术点'] as const
export type ArchTab = typeof ARCH_TABS[number]

/** 协同机制 4 条 */
export interface Synergy { icon: IconName; title: string; desc: string }
export const SYNERGY: Synergy[] = [
  { icon: 'gridView', title: 'Canvas 绘制基础内容', desc: '渲染网格、单元格、数据和网格线' },
  { icon: 'edit', title: 'DOM 处理交互元素', desc: '输入框、下拉框、菜单、浮层等' },
  { icon: 'settings', title: '坐标同步与映射', desc: 'Canvas 与 DOM 位置对齐' },
  { icon: 'link', title: '事件协作处理', desc: '统一事件分发与状态管理' },
]

/** 表格演示数据（A 列标签 + B 列值），C 列是下拉编辑器 */
export const TABLE_ROWS: Array<{ label: string; value: string }> = [
  { label: '高性能渲染', value: '快速' },
  { label: '灵活的编辑', value: '强大' },
  { label: '丰富的功能', value: '专业' },
  { label: '完美的体验', value: '卓越' },
]
export const DROPDOWN_OPTIONS = ['产品方案', '技术方案', '商业方案'] as const

/** 渲染流程 tab：主线程 vs 后台线程任务分工 */
export interface FlowStep {
  side: 'main' | 'worker'
  icon: IconName
  title: string
  desc: string
  tag: string
}
export const MAIN_THREAD_STEPS: FlowStep[] = [
  { side: 'main', icon: 'edit', title: '交互与输入', desc: '键盘 / 鼠标 / IME 输入法事件，选区状态机', tag: 'Interaction' },
  { side: 'main', icon: 'fx', title: '渲染指令生成', desc: '布局引擎产出 DrawCommand（纯数据、可序列化）', tag: 'Layout' },
  { side: 'main', icon: 'gridView', title: 'Canvas 合成', desc: '脏矩形重绘 + 位块搬移，60 FPS 呈现', tag: 'Canvas2D' },
  { side: 'main', icon: 'code', title: 'DOM 浮层', desc: '编辑器 / 菜单 / 浮层绝对定位叠加', tag: 'DOM' },
]
export const WORKER_STEPS: FlowStep[] = [
  { side: 'worker', icon: 'database', title: '数据排序聚合', desc: '大数据集 sort / filter / aggregate', tag: 'Compute Worker' },
  { side: 'worker', icon: 'fx', title: '公式计算', desc: '复杂公式与依赖图计算，不阻塞 UI', tag: 'Formula' },
  { side: 'worker', icon: 'gridView', title: '离屏渲染', desc: 'transferControlToOffscreen 后台整帧绘制', tag: 'OffscreenCanvas' },
  { side: 'worker', icon: 'link', title: '回传统计', desc: 'revision 版本协议回传绘制结果与像素采样', tag: 'Stats' },
]

/** 关键技术点 tab：技术栈 */
export interface TechItem {
  icon: IconName
  name: string
  category: string
  desc: string
  color: string
  layer: 'core' | 'render' | 'runtime' | 'build'
}
export const TECH_STACK: TechItem[] = [
  { icon: 'code', name: 'TypeScript', category: '类型安全', desc: '全链路静态类型，公开 API 带完整 d.ts', color: '#3178c6', layer: 'core' },
  { icon: 'gridView', name: 'Canvas 2D', category: '绘制内核', desc: '大规模网格绘制，脏矩形 + 位块搬移', color: '#2563eb', layer: 'render' },
  { icon: 'code', name: 'DOM', category: '交互浮层', desc: '编辑器 / 下拉 / 菜单，精准命中测试', color: '#0891b2', layer: 'render' },
  { icon: 'puzzle', name: 'Web Components', category: '框架无关', desc: 'Lit 3 + Custom Elements，跨框架复用', color: '#7c3aed', layer: 'core' },
  { icon: 'settings', name: 'Web Worker', category: '计算加速', desc: '内联 Worker 零构建产物，Node 自动降级', color: '#059669', layer: 'runtime' },
  { icon: 'gridView', name: 'OffscreenCanvas', category: '后台渲染', desc: '整帧绘制搬进 Worker，能力检测降级', color: '#d97706', layer: 'runtime' },
  { icon: 'rocket', name: 'Vite', category: '构建工具', desc: 'pnpm monorepo + vite 构建，秒级 HMR', color: '#646cff', layer: 'build' },
]

export const TECH_LAYERS: Array<{ key: TechItem['layer']; label: string; color: string }> = [
  { key: 'core', label: '核心语言 / 组件模型', color: '#7c3aed' },
  { key: 'render', label: '渲染层', color: '#2563eb' },
  { key: 'runtime', label: '运行时加速', color: '#059669' },
  { key: 'build', label: '工程构建', color: '#646cff' },
]

/** 底部四卡 */
export const BOTTOM_CARDS = {
  strategy: {
    icon: 'eye' as IconName, title: '渲染策略', color: '#2563eb',
    items: ['可视区域渲染：只绘制可见区域', 'Canvas 批量绘制：提升渲染性能'],
  },
  perf: {
    icon: 'bolt' as IconName, title: '性能优势', color: '#7c3aed',
    items: ['百万级数据流畅展示', '复杂表格依然高性能', '内存占用更低'],
  },
  scene: {
    icon: 'chartBar' as IconName, title: '典型应用场景', color: '#059669',
    items: ['大数据表格展示', '财务报表分析', '复杂业务系统', '专业数据编辑'],
  },
  highlight: {
    icon: 'bulb' as IconName, title: '技术亮点', color: '#d97706',
    items: ['Canvas + DOM 混合架构', '智能渲染与虚拟化', '精准的交互体验', '可扩展的插件机制'],
  },
}
