/** 第 22 张设计稿 · 多维数据筛选与高级查询 — 数据层（与 data-adapter/filter-groups 同构） */

export interface CustomerRow {
  id: string
  name: string
  region: string
  category: string
  amount: number
  date: string
  status: '已完成' | '进行中' | '未开始'
}

export const CUSTOMER_ROWS: CustomerRow[] = [
  { id: 'r1', name: '华东科技', region: '华东', category: '笔记本电脑', amount: 128000, date: '2025-01-15', status: '已完成' },
  { id: 'r2', name: '创新电子', region: '华南', category: '平板电脑', amount: 95000, date: '2025-01-16', status: '已完成' },
  { id: 'r3', name: '智联网络', region: '华北', category: '智能手机', amount: 156000, date: '2025-01-17', status: '进行中' },
  { id: 'r4', name: '新视界科技', region: '华东', category: '显示器', amount: 72000, date: '2025-01-18', status: '已完成' },
  { id: 'r5', name: '博远科技', region: '华南', category: '笔记本电脑', amount: 118000, date: '2025-01-19', status: '已完成' },
  { id: 'r6', name: '卓越电子', region: '华北', category: '平板电脑', amount: 82000, date: '2025-01-20', status: '进行中' },
  { id: 'r7', name: '天启科技', region: '西南', category: '智能手机', amount: 110000, date: '2025-01-21', status: '已完成' },
  { id: 'r8', name: '数字互联', region: '华中', category: '显示器', amount: 69000, date: '2025-01-22', status: '未开始' },
  { id: 'r9', name: '华创科技', region: '华东', category: '笔记本电脑', amount: 142000, date: '2025-01-23', status: '已完成' },
  { id: 'r10', name: '未来智能', region: '华南', category: '平板电脑', amount: 88000, date: '2025-01-24', status: '进行中' },
  { id: 'r11', name: '天和科技', region: '华北', category: '智能手机', amount: 125000, date: '2025-01-25', status: '已完成' },
  { id: 'r12', name: '联创科技', region: '西南', category: '显示器', amount: 73000, date: '2025-01-26', status: '未开始' },
  { id: 'r13', name: '宏图电子', region: '华东', category: '笔记本电脑', amount: 101000, date: '2025-01-27', status: '已完成' },
]

export const COLUMNS = ['客户名称', '地区', '产品类别', '销售额（元）', '订单日期', '状态'] as const

export type FieldKey = 'name' | 'region' | 'category' | 'amount' | 'date' | 'status'
export const FIELD_OPTIONS: Array<{ key: FieldKey; label: string }> = [
  { key: 'region', label: '地区' },
  { key: 'category', label: '产品类别' },
  { key: 'amount', label: '销售额（元）' },
  { key: 'status', label: '状态' },
  { key: 'name', label: '客户名称' },
  { key: 'date', label: '订单日期' },
]

export type Operator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in' | 'notEmpty'
export const OPERATOR_LABELS: Record<Operator, string> = {
  eq: '等于', ne: '不等于', gt: '大于', gte: '大于等于', lt: '小于', lte: '小于等于',
  contains: '包含', in: '属于', notEmpty: '非空',
}

export interface Condition {
  id: string
  field: FieldKey
  op: Operator
  value: string
  enabled: boolean
}

export interface ConditionGroup {
  id: string
  logic: 'and' | 'or'
  label: string
  conditions: Condition[]
}

export const DEFAULT_GROUPS: ConditionGroup[] = [
  {
    id: 'g1', logic: 'and', label: '条件组 1（满足以下所有条件）',
    conditions: [
      { id: 'c1', field: 'region', op: 'eq', value: '华东', enabled: true },
      { id: 'c2', field: 'amount', op: 'gte', value: '100000', enabled: true },
    ],
  },
  {
    id: 'g2', logic: 'or', label: '条件组 2（满足以下任一条件）',
    conditions: [
      { id: 'c3', field: 'category', op: 'eq', value: '笔记本电脑', enabled: true },
      { id: 'c4', field: 'category', op: 'eq', value: '平板电脑', enabled: true },
    ],
  },
]

export interface SavedScheme { id: string; name: string; groups: ConditionGroup[] }

export const DEFAULT_SCHEMES: SavedScheme[] = [
  {
    id: 's1', name: '华东大额订单',
    groups: [
      { id: 'g1', logic: 'and', label: '条件组 1', conditions: [
        { id: 'c1', field: 'region', op: 'eq', value: '华东', enabled: true },
        { id: 'c2', field: 'amount', op: 'gte', value: '100000', enabled: true },
      ] },
    ],
  },
  {
    id: 's2', name: '进行中订单',
    groups: [
      { id: 'g1', logic: 'and', label: '条件组 1', conditions: [
        { id: 'c1', field: 'status', op: 'eq', value: '进行中', enabled: true },
      ] },
    ],
  },
  {
    id: 's3', name: '高价值笔记本',
    groups: [
      { id: 'g1', logic: 'and', label: '条件组 1', conditions: [
        { id: 'c1', field: 'category', op: 'eq', value: '笔记本电脑', enabled: true },
        { id: 'c2', field: 'amount', op: 'gte', value: '120000', enabled: true },
      ] },
    ],
  },
]

/** 求值单条件（与引擎 applyOp 同语义） */
export function matchCondition(row: CustomerRow, condition: Condition): boolean {
  const actual = row[condition.field]
  const expected = condition.value
  switch (condition.op) {
    case 'eq': return String(actual) === expected
    case 'ne': return String(actual) !== expected
    case 'gt': return Number(actual) > Number(expected)
    case 'gte': return Number(actual) >= Number(expected)
    case 'lt': return Number(actual) < Number(expected)
    case 'lte': return Number(actual) <= Number(expected)
    case 'contains': return String(actual).includes(expected)
    case 'in': return expected.split(',').map((item) => item.trim()).includes(String(actual))
    case 'notEmpty': return actual !== null && actual !== undefined && actual !== ''
    default: return false
  }
}

function matchGroup(row: CustomerRow, group: ConditionGroup): boolean {
  const active = group.conditions.filter((condition) => condition.enabled)
  if (active.length === 0) return true
  const checks = active.map((condition) => matchCondition(row, condition))
  return group.logic === 'and' ? checks.every(Boolean) : checks.some(Boolean)
}

/** 组间默认 AND（设计稿里两个条件组同时生效） */
export function matchAll(row: CustomerRow, groups: ReadonlyArray<ConditionGroup>): boolean {
  const active = groups.filter((group) => group.conditions.some((condition) => condition.enabled))
  if (active.length === 0) return true
  return active.every((group) => matchGroup(row, group))
}

export function countBy(
  rows: ReadonlyArray<CustomerRow>,
  field: 'region' | 'category' | 'status',
): Map<string, number> {
  const map = new Map<string, number>()
  for (const row of rows) map.set(String(row[field]), (map.get(String(row[field])) ?? 0) + 1)
  return map
}

export const STATUS_STYLE: Record<CustomerRow['status'], { color: string; background: string }> = {
  已完成: { color: '#16a34a', background: '#f0fdf4' },
  进行中: { color: '#2563eb', background: '#eff6ff' },
  未开始: { color: '#d97706', background: '#fffbeb' },
}
