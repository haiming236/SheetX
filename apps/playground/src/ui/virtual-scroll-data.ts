/**
 * SheetX 第 41 张 · 虚拟滚动与百万级数据性能设计 — 数据层
 *
 * 行列虚拟化 / 可视区域计算 / 动态行高 / 缓存机制 / 增量渲染。
 * 零依赖，纯数据 + 类型定义。
 */
import type { IconName } from './icons.js'

/** 顶部导航 */
export const PERF_NAV = ['技术选型', '渲染架构', '性能优化', '跨平台支持', '生态兼容'] as const

/** 顶部 4 指标卡 */
export interface Metric { icon: IconName; value: string; label: string; color: string }
export const METRICS: Metric[] = [
  { icon: 'bolt', value: '60 FPS+', label: '流畅滚动', color: '#2563eb' },
  { icon: 'database', value: '1,000,000+', label: '行数据支持', color: '#7c3aed' },
  { icon: 'settings', value: '< 200MB', label: '内存占用', color: '#0891b2' },
  { icon: 'clock', value: '< 50ms', label: '响应延迟', color: '#d97706' },
]

/** 虚拟滚动演示表列定义 */
export const COLS = [
  { key: 'check', label: '', width: 30 },
  { key: 'id', label: 'ID', width: 72 },
  { key: 'name', label: '姓名', width: 70 },
  { key: 'dept', label: '部门', width: 78 },
  { key: 'title', label: '职位', width: 88 },
  { key: 'date', label: '入职日期', width: 96 },
  { key: 'salary', label: '薪资', width: 78 },
  { key: 'status', label: '状态', width: 60 },
  { key: 'note', label: '备注', width: 90 },
] as const

/** 生成一行数据的确定性工厂（百万行不预生成，按需计算） */
export const SURNAMES = ['张', '李', '王', '赵', '钱', '孙', '周', '吴', '郑', '冯', '陈', '褚', '卫', '蒋', '沈', '杨']
export const GIVEN = ['三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '子涵', '雨桐', '浩然', '欣怡']
export const DEPTS = ['技术部', '运营部', '产品部', '市场部', '设计部', '客服部', '财务部']
export const TITLES = ['高级工程师', '产品经理', '运营专员', '开发工程师', '市场专员', 'UI 设计师', '客服代表', '架构师', '技术专家', '运营经理']
export const NOTES = ['优秀员工', '重点关注', '表现良好', '技术骨干', '市场拓展', '设计优秀', '服务标兵', '技术专家', '产品负责人', '运营专家']
export const TOTAL_ROWS = 1_000_000
export const ROW_HEIGHT = 26
export const VIEWPORT_ROWS = 11

export interface DataRow {
  id: number
  name: string
  dept: string
  title: string
  date: string
  salary: number
  status: '在职' | '试用' | '离职'
  note: string
}

/** 按需生成第 index 行（0-based），确定性，不占内存 */
export function makeRow(index: number): DataRow {
  const s = SURNAMES[index % SURNAMES.length]
  const g = GIVEN[Math.floor(index / SURNAMES.length) % GIVEN.length]
  const dept = DEPTS[index % DEPTS.length]
  const title = TITLES[(index * 3) % TITLES.length]
  const note = NOTES[(index * 7) % NOTES.length]
  const year = 2023 + Math.floor(index / 12 / 31) % 3
  const month = (index % 12) + 1
  const day = (index % 27) + 1
  const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const salary = 8000 + (index % 40) * 1000
  const status: DataRow['status'] = index % 17 === 0 ? '离职' : index % 11 === 0 ? '试用' : '在职'
  return { id: 104857 + index, name: s + g, dept, title, date, salary, status, note }
}

/** 虚拟滚动工作原理 5 步 */
export interface Principle { icon: IconName; title: string; desc: string; tone: 'blue' | 'green' }
export const PRINCIPLES: Principle[] = [
  { icon: 'laptop', title: '可视区域计算', desc: '根据滚动位置计算可见行范围', tone: 'blue' },
  { icon: 'database', title: '数据获取', desc: '按需加载数据（支持分页 / 懒加载）', tone: 'blue' },
  { icon: 'gridView', title: '虚拟化渲染', desc: '只渲染可视区域的行列', tone: 'blue' },
  { icon: 'bolt', title: '缓存机制', desc: '复用行数据，减少重绘', tone: 'blue' },
  { icon: 'shieldCheck', title: '流畅交互', desc: '大数据下依然保持 60 FPS+', tone: 'green' },
]

/** 核心优化策略 */
export const STRATEGIES = [
  '行虚拟虚拟化：仅渲染可视区域',
  '动态行高：支持自适应行高',
  '智能缓存：复用渲染结果',
  '增量更新：最小化 DOM 操作',
  'Web Worker：后台计算不阻塞 UI',
] as const

/** 性能指标 */
export const PERF_STATS: Metric[] = [
  { icon: 'bolt', value: '60+ FPS', label: '滚动流畅度', color: '#2563eb' },
  { icon: 'settings', value: '< 200MB', label: '内存占用', color: '#7c3aed' },
  { icon: 'clock', value: '< 50ms', label: '响应延迟', color: '#0891b2' },
  { icon: 'database', value: '1M+', label: '行支持', color: '#059669' },
]

/** 适用场景 */
export const SCENES = [
  '大数据报表与分析', 'ERP 业务报表', '金融数据展示', '监控大屏展示', '海量数据管理系统',
] as const

/** 性能对比折线数据（传统渲染 vs 虚拟渲染，纵轴 FPS） */
export const PERF_CURVE = [
  { x: '10万', traditional: 60, virtual: 60 },
  { x: '50万', traditional: 24, virtual: 60 },
  { x: '100万', traditional: 8, virtual: 60 },
] as const
