/** 第 23 张设计稿 · 多视图与视图管理 — 数据层（与 core/view-manager 同构） */

export interface SalesRow {
  id: string
  region: string
  product: string
  amount: number
  date: string
  status: '待处理' | '进行中' | '已完成' | '已取消'
  owner: string
}

export const SALES_ROWS: SalesRow[] = [
  { id: 'r1', region: '华东', product: '笔记本电脑', amount: 128000, date: '2025-01-15', status: '已完成', owner: 'A-15' },
  { id: 'r2', region: '华南', product: '平板电脑', amount: 95000, date: '2025-01-16', status: '已完成', owner: 'A-16' },
  { id: 'r3', region: '华北', product: '智能手机', amount: 156000, date: '2025-01-17', status: '进行中', owner: 'A-17' },
  { id: 'r4', region: '华东', product: '显示器', amount: 72000, date: '2025-01-18', status: '已完成', owner: 'A-18' },
  { id: 'r5', region: '华南', product: '笔记本电脑', amount: 118000, date: '2025-01-19', status: '已完成', owner: 'A-19' },
  { id: 'r6', region: '华北', product: '平板电脑', amount: 82000, date: '2025-01-20', status: '进行中', owner: 'A-20' },
  { id: 'r7', region: '西南', product: '智能手机', amount: 110000, date: '2025-01-21', status: '已完成', owner: 'A-21' },
  { id: 'r8', region: '华中', product: '智能手表', amount: 68000, date: '2025-01-22', status: '已取消', owner: 'A-22' },
]

export type ViewType = 'table' | 'card' | 'kanban' | 'group'

export interface ViewDef {
  id: string
  name: string
  type: ViewType
  personal?: boolean
  groupBy?: string
  boardBy?: string
  cardSize?: 'small' | 'medium' | 'large'
  description?: string
}

export const VIEW_TYPES: Array<{ key: ViewType; label: string; icon: string }> = [
  { key: 'table', label: '表格视图', icon: 'gridView' },
  { key: 'card', label: '卡片视图', icon: 'listView' },
  { key: 'kanban', label: '看板视图', icon: 'colsV' },
  { key: 'group', label: '分组视图', icon: 'group' },
]

export const INITIAL_VIEWS: ViewDef[] = [
  { id: 'v1', name: '销售报表视图', type: 'table', personal: true, description: '默认表格明细' },
  { id: 'v2', name: '按地区分析', type: 'group', groupBy: 'region', personal: true, description: '地区汇总' },
  { id: 'v3', name: '按产品分类', type: 'group', groupBy: 'product', personal: true, description: '产品汇总' },
  { id: 'v4', name: '季度汇总视图', type: 'kanban', boardBy: 'status', description: '状态看板' },
]

export const VIEW_KEY = 'sx:personal-views'

export interface Bucket { key: string; rows: SalesRow[]; total: number }

export function groupRows(rows: ReadonlyArray<SalesRow>, field: keyof SalesRow): Bucket[] {
  const map = new Map<string, SalesRow[]>()
  for (const row of rows) {
    const key = String(row[field] ?? '未分组') || '未分组'
    const list = map.get(key) ?? []
    list.push(row)
    map.set(key, list)
  }
  return [...map.entries()].map(([key, list]) => ({
    key,
    rows: list,
    total: Math.round(list.reduce((sum, row) => sum + row.amount, 0) * 100) / 100,
  }))
}

export const KANBAN_COLUMNS: Array<{ key: SalesRow['status']; color: string; background: string }> = [
  { key: '待处理', color: '#64748b', background: 'var(--sx-bg-subtle)' },
  { key: '进行中', color: '#2563eb', background: '#eff6ff' },
  { key: '已完成', color: '#16a34a', background: '#f0fdf4' },
  { key: '已取消', color: '#dc2626', background: '#fef2f2' },
]

export const STATUS_STYLE: Record<SalesRow['status'], { color: string; background: string }> = {
  待处理: { color: '#64748b', background: 'var(--sx-bg-subtle)' },
  进行中: { color: '#2563eb', background: '#eff6ff' },
  已完成: { color: '#16a34a', background: '#f0fdf4' },
  已取消: { color: '#dc2626', background: '#fef2f2' },
}

export const PRODUCT_ICONS: Record<string, string> = {
  笔记本电脑: '💻', 平板电脑: '📱', 智能手机: '📲', 显示器: '🖥️', 智能手表: '⌚',
}

export const CARD_SIZES: Array<{ key: 'small' | 'medium' | 'large'; label: string }> = [
  { key: 'small', label: '小' }, { key: 'medium', label: '中' }, { key: 'large', label: '大' },
]
