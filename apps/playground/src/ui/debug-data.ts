/**
 * SheetX 第 34 张 · 开发者调试与性能监控 — 数据
 *
 * 帮助第三方开发者排查集成问题：帧率 / 内存 / 渲染耗时 / 数据量 / 虚拟滚动 /
 * 事件追踪 / API 调用日志。所有数据为真实形态的监控采样（可实时刷新模拟）。
 */
import type { IconName } from './icons.js'

/** 左侧导航 */
export const LEFT_NAV: Array<{ key: string; label: string; icon: IconName }> = [
  { key: 'performance', label: '性能监控', icon: 'chartLine' },
  { key: 'panel', label: '调试面板', icon: 'sliders' },
  { key: 'logs', label: '日志管理', icon: 'terminal' },
  { key: 'api', label: 'API 调试', icon: 'code' },
  { key: 'component', label: '组件检查', icon: 'gridView' },
  { key: 'version', label: '版本信息', icon: 'infoCircle' },
]

/** 时间范围 */
export const TIME_RANGES = ['1分钟', '5分钟', '15分钟', '1小时'] as const
export type TimeRange = (typeof TIME_RANGES)[number]

/** 采样间隔 */
export const SAMPLE_INTERVALS = ['1 秒', '2 秒', '5 秒'] as const

/** 性能采样点（5分钟，60 点，真实形态） */
export interface Sample { t: string; fps: number; mem: number; cost: number }

function genSamples(): Sample[] {
  const out: Sample[] = []
  for (let i = 0; i < 60; i++) {
    const min = 20 + Math.floor(i / 12) // 14:20 → 14:24
    const sec = (i % 12) * 5
    const wave = Math.sin(i / 4) * 1.6 + Math.cos(i / 7) * 0.9
    out.push({
      t: `14:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`,
      fps: Math.round((58 + wave) * 10) / 10,
      mem: Math.round((128 + wave * 2.5) * 10) / 10,
      cost: Math.round((8 + wave * 0.8 + 4) * 10) / 10,
    })
  }
  return out
}

export const SAMPLES: Sample[] = genSamples()

/** 指标卡 */
export interface Metric {
  key: string
  label: string
  value: string
  unit: string
  delta: string
  up: boolean
  icon: IconName
  color: string
  bg: string
}

export const METRICS: Metric[] = [
  { key: 'fps', label: '当前帧率', value: '60', unit: 'FPS', delta: '0.5', up: true, icon: 'chartLine', color: '#2563eb', bg: '#eff6ff' },
  { key: 'mem', label: '内存占用', value: '128', unit: 'MB', delta: '2.3', up: false, icon: 'database', color: '#16a34a', bg: '#f0fdf4' },
  { key: 'cost', label: '渲染耗时', value: '12.8', unit: 'ms', delta: '1.2', up: false, icon: 'clock', color: '#9333ea', bg: '#faf5ff' },
  { key: 'rows', label: '数据量', value: '50,000', unit: '行', delta: '0', up: true, icon: 'gridView', color: '#ea580c', bg: '#fff7ed' },
]

/** 事件日志 */
export interface EventLog {
  id: number
  time: string
  level: 'info' | 'success' | 'warn' | 'error' | 'purple'
  msg: string
  source: string
}

export const EVENT_LOGS: EventLog[] = [
  { id: 1, time: '14:24:12', level: 'warn', msg: '渲染完成，耗时 12.8ms，行数 50,000', source: 'Renderer' },
  { id: 2, time: '14:24:11', level: 'success', msg: '数据加载完成，共 50,000 行，耗时 842ms', source: 'DataSource' },
  { id: 3, time: '14:24:10', level: 'success', msg: '用户执行了筛选操作：状态 = 已发货', source: 'Event' },
  { id: 4, time: '14:24:08', level: 'info', msg: '插件事件：onDataChange', source: 'Plugin' },
  { id: 5, time: '14:24:05', level: 'purple', msg: '内存使用：128 MB（峰值：156 MB）', source: 'Monitor' },
  { id: 6, time: '14:24:02', level: 'purple', msg: '开始渲染，数据量：50,000 行', source: 'Renderer' },
  { id: 7, time: '14:23:58', level: 'error', msg: 'API /api/data/update 超时（重试 1 次后成功）', source: 'API' },
  { id: 8, time: '14:23:51', level: 'info', msg: '虚拟滚动：可见区 32 行，缓冲区 8 行', source: 'Renderer' },
]

/** 日志筛选 */
export const LOG_FILTERS = ['全部', '渲染', '数据', 'API', '错误', '警告'] as const
export type LogFilter = (typeof LOG_FILTERS)[number]

/** 组件状态 */
export interface Component {
  name: string
  status: string
  healthy: boolean
  action?: string
}

export const COMPONENTS: Component[] = [
  { name: '主表格实例', status: '运行中', healthy: true },
  { name: '虚拟滚动', status: '已启用', healthy: true },
  { name: 'Web Worker', status: '运行中', healthy: true },
  { name: '数据缓存', status: '128 MB', healthy: true, action: '清理' },
]

/** API 统计 */
export interface ApiStat { endpoint: string; calls: number; avg: number; rate: number }

export const API_STATS: ApiStat[] = [
  { endpoint: '/api/data/query', calls: 28, avg: 142, rate: 100 },
  { endpoint: '/api/data/update', calls: 12, avg: 87, rate: 100 },
  { endpoint: '/api/plugin/load', calls: 6, avg: 64, rate: 100 },
  { endpoint: '/api/config/theme', calls: 4, avg: 52, rate: 100 },
]

/** 性能提示 */
export const PERF_TIP = '当前性能良好，建议继续保持。'

/** 报告导出模板 */
export function buildReport(): string {
  return `SheetX 性能监控报告
生成时间：${new Date().toLocaleString('zh-CN')}
────────────────────────
当前帧率：60 FPS
内存占用：128 MB
渲染耗时：12.8 ms
数据量：50,000 行

组件状态：
${COMPONENTS.map((c) => `  · ${c.name}: ${c.status} (${c.healthy ? '正常' : '异常'})`).join('\n')}

API 调用统计（近 5 分钟）：
${API_STATS.map((a) => `  · ${a.endpoint}: ${a.calls} 次 / 平均 ${a.avg}ms / 成功率 ${a.rate}%`).join('\n')}

结论：${PERF_TIP}`
}

export interface FullConfig {
  monitoring: boolean
  interval: string
  timeRange: TimeRange
  logFilter: LogFilter
  logQuery: string
}

export const DEFAULT_CONFIG: FullConfig = {
  monitoring: true,
  interval: '1 秒',
  timeRange: '5分钟',
  logFilter: '全部',
  logQuery: '',
}
