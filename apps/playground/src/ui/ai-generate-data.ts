/**
 * SheetX 第 45 张 · AI 自然语言生成表格与业务数据 — 数据层
 *
 * 自然语言 → 理解场景 → 规划字段 → 生成模拟数据 → 预览 → 确认插入 → 撤销。
 * 纯前端本地生成，遵循可插拔 Provider 与预览确认撤销原则。
 */
import type { IconName } from './icons.js'

/** 顶部菜单 */
export const MENU = ['文件', '开始', '插入', '页面布局', '公式', '数据', '视图', '帮助'] as const

/** 业务场景模板（每个模板定义字段与数据生成器） */
export interface Field {
  name: string
  type: 'text' | 'number' | 'money' | 'percent' | 'date'
  gen: (i: number, seed: number) => string | number
}
export interface Scenario {
  id: string
  name: string
  icon: IconName
  desc: string
  prompt: string
  fields: Field[]
}

const pick = <T,>(arr: readonly T[], i: number, seed = 1): T => arr[(i * 7 + seed * 3) % arr.length]
const num = (min: number, max: number, i: number, seed = 1) => min + ((i * 37 + seed * 91) % (max - min + 1))
const money = (min: number, max: number, i: number, seed = 1) => num(min, max, i, seed) * 100

const REGIONS = ['华东', '华南', '华北', '西南', '东北'] as const
const PRODUCTS = ['笔记本电脑', '平板电脑', '无线耳机', '智能手表', '显示器', '机械键盘'] as const
const CATS = ['电子产品', '电子产品', '数码配件', '智能设备'] as const
const CUSTOMERS = ['北京华联', '上海百货', '深圳科技', '广州商贸', '杭州电子', '成都科技'] as const
const STATUSES = ['已发货', '待发货', '已完成', '处理中'] as const
const DEPTS = ['技术部', '市场部', '运营部', '财务部', '产品部'] as const
const NAMES = ['张三', '李四', '王五', '赵六', '钱七', '孙八'] as const
const WARES = ['办公桌椅', '打印机', '服务器', '投影仪', '文件柜'] as const

export const SCENARIOS: Scenario[] = [
  {
    id: 'sales', name: '地区销售数据', icon: 'chartBar', desc: '产品、销量、销售额',
    prompt: '生成一份 2024 年各地区销售数据，包含产品、销量和销售额，数据要真实一些。',
    fields: [
      { name: '产品名称', type: 'text', gen: (i) => pick(PRODUCTS, i, 2) },
      { name: '分类', type: 'text', gen: (i) => pick(CATS, i, 3) },
      { name: '销售区域', type: 'text', gen: (i) => pick(REGIONS, i) },
      { name: '月销量', type: 'number', gen: (i) => num(800, 18000, i) },
      { name: '销售额', type: 'money', gen: (i) => money(6000, 18000, i) },
    ],
  },
  {
    id: 'customer', name: '客户名单', icon: 'database', desc: '客户、行业、联系人',
    prompt: '生成一份客户名单，包含客户名称、所属行业、联系人和合作状态。',
    fields: [
      { name: '客户名称', type: 'text', gen: (i) => pick(CUSTOMERS, i) },
      { name: '联系人', type: 'text', gen: (i) => pick(NAMES, i, 2) },
      { name: '部门', type: 'text', gen: (i) => pick(DEPTS, i, 3) },
      { name: '订单数', type: 'number', gen: (i) => num(3, 88, i) },
      { name: '状态', type: 'text', gen: (i) => pick(STATUSES, i, 4) },
    ],
  },
  {
    id: 'inventory', name: '库存台账', icon: 'box', desc: '物料、库存、单价',
    prompt: '生成一份库存台账，包含物料名称、仓库、库存数量和单价。',
    fields: [
      { name: '物料名称', type: 'text', gen: (i) => pick(WARES, i) },
      { name: '仓库', type: 'text', gen: (i) => pick(REGIONS, i, 2) },
      { name: '库存数量', type: 'number', gen: (i) => num(50, 5000, i) },
      { name: '单价', type: 'money', gen: (i) => money(20, 900, i) },
      { name: '状态', type: 'text', gen: (i) => num(1, 100, i) > 85 ? '需补货' : '正常' },
    ],
  },
  {
    id: 'order', name: '订单记录', icon: 'tableStyle', desc: '订单、客户、金额',
    prompt: '生成一批订单记录，包含订单号、客户、金额和发货状态。',
    fields: [
      { name: '订单号', type: 'text', gen: (i) => `SO2025${String(10001 + i).padStart(5, '0')}` },
      { name: '客户', type: 'text', gen: (i) => pick(CUSTOMERS, i, 2) },
      { name: '产品', type: 'text', gen: (i) => pick(PRODUCTS, i, 3) },
      { name: '金额', type: 'money', gen: (i) => money(800, 15000, i) },
      { name: '状态', type: 'text', gen: (i) => pick(STATUSES, i, 5) },
    ],
  },
]

/** 模拟 AI 理解需求：关键词 → 场景 */
export function detectScenario(prompt: string): Scenario {
  if (/客户|名单|联系人/.test(prompt)) return SCENARIOS[1]
  if (/库存|仓库|物料|补货/.test(prompt)) return SCENARIOS[2]
  if (/订单|发货|单号/.test(prompt)) return SCENARIOS[3]
  return SCENARIOS[0] // 销售数据为默认
}

/** 生成 N 行数据（确定性，纯前端） */
export function generateRows(scenario: Scenario, count: number, seed = 42): string[][] {
  const rows: string[][] = []
  for (let i = 0; i < count; i++) {
    rows.push(scenario.fields.map((f) => {
      const v = f.gen(i, seed)
      if (f.type === 'money') return '¥' + Number(v).toLocaleString('zh-CN')
      if (f.type === 'number') return Number(v).toLocaleString('zh-CN')
      return String(v)
    }))
  }
  return rows
}

/** 步骤 */
export const AI_STEPS = ['理解需求', '规划数据结构', '生成数据并预览'] as const

/** 底部三特性 */
export const FEATURES = [
  { icon: 'bolt', title: '快速生成结构化数据', desc: '一句话完成建表', color: '#2563eb' },
  { icon: 'gridView', title: '支持多种业务场景', desc: '销售 / 客户 / 库存 / 订单', color: '#7c3aed' },
  { icon: 'sliders', title: '可预览、可调整更可控', desc: '插入前确认，插入后撤销', color: '#059669' },
] as const

export const DEFAULT_PROMPT = SCENARIOS[0].prompt
