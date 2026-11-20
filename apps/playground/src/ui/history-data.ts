/**
 * 第 20 张设计稿 · 撤销重做与历史版本管理 — 数据层
 *
 * 页面演示与引擎一致的数据安全策略：
 * - 撤销/重做栈 = 成对 mutation（内存只与变更量成正比，深度 100）
 * - 版本快照 = 显式深拷贝 + 节流合并（高频编辑不产生海量版本）+ 可序列化持久化
 * - 恢复只产出目标数据，由宿主/引擎写入（本页用本地状态演示）
 */

export interface HistoryRow { id: string; name: string; amount: number }
export type HistoryChangeType = '编辑' | '插入' | '格式' | '删除' | '创建'

export interface HistoryEvent {
  id: string
  type: HistoryChangeType
  label: string
  time: string
  /** 对应的版本数据（用于恢复） */
  rows: HistoryRow[]
  /** 批量撤销时合并的底层 mutation 数 */
  mutations: number
}

export interface VersionRecord {
  id: string
  label: string
  time: string
  rows: HistoryRow[]
  auto: boolean
}

const INITIAL_ROWS: HistoryRow[] = [
  { id: 'r1', name: '笔记本电脑', amount: 128000 },
  { id: 'r2', name: '平板电脑', amount: 95000 },
  { id: 'r3', name: '智能手机', amount: 156000 },
  { id: 'r4', name: '显示器', amount: 72000 },
  { id: 'r5', name: '键盘鼠标', amount: 68000 },
]

const variant = (index: number, value: number): HistoryRow[] => {
  const rows = INITIAL_ROWS.map((row) => ({ ...row }))
  if (index >= 0 && index < rows.length) rows[index]!.amount = value
  return rows
}

/** 初始历史（时间倒序：最新在前） */
export const INITIAL_HISTORY: HistoryEvent[] = [
  {
    id: 'h1', type: '编辑', label: '修改单元格内容', time: '2025-01-15 14:28:17',
    rows: variant(2, 158000), mutations: 1,
  },
  {
    id: 'h2', type: '插入', label: '插入行', time: '2025-01-15 14:26:43',
    rows: [...INITIAL_ROWS.map((row) => ({ ...row })), { id: 'r6', name: '耳机', amount: 24000 }],
    mutations: 3,
  },
  {
    id: 'h3', type: '格式', label: '设置单元格格式', time: '2025-01-15 14:24:32',
    rows: variant(0, 128000), mutations: 2,
  },
  {
    id: 'h4', type: '删除', label: '删除行', time: '2025-01-15 14:22:19',
    rows: INITIAL_ROWS.slice(0, 4).map((row) => ({ ...row })), mutations: 2,
  },
  {
    id: 'h5', type: '编辑', label: '修改表格数据', time: '2025-01-15 14:20:12',
    rows: variant(4, 68000), mutations: 5,
  },
]

export const INITIAL_VERSIONS: VersionRecord[] = [
  {
    id: 'v1', label: '初始版本', time: '2025-01-15 14:18:00',
    rows: INITIAL_ROWS.map((row) => ({ ...row })), auto: false,
  },
  {
    id: 'v2', label: '自动快照 · 编辑后', time: '2025-01-15 14:20:20',
    rows: variant(4, 68000), auto: true,
  },
  {
    id: 'v3', label: '自动快照 · 批量修改后', time: '2025-01-15 14:28:30',
    rows: variant(2, 158000), auto: true,
  },
]

export const CURRENT_ROWS: HistoryRow[] = variant(2, 158000)

export const EVENT_ICON: Record<HistoryChangeType, string> = {
  编辑: 'edit', 插入: 'plus', 格式: 'palette', 删除: 'trash', 创建: 'checkCircle',
}

/** 批量撤销：按 mutation 数合并成一组（减少用户点击次数） */
export function groupForBatch(events: ReadonlyArray<HistoryEvent>, size: number): HistoryEvent[][] {
  const groups: HistoryEvent[][] = []
  let current: HistoryEvent[] = []
  let mutations = 0
  for (const event of events) {
    current.push(event)
    mutations += event.mutations
    if (mutations >= size) {
      groups.push(current)
      current = []
      mutations = 0
    }
  }
  if (current.length > 0) groups.push(current)
  return groups
}

/** 轻量 diff（与 core VersionManager 同语义）：只返回变化的字段 */
export interface RowDiff { id: string; name: string; before: number; after: number; kind: '修改' | '新增' | '删除' }

export function diffRows(
  before: ReadonlyArray<HistoryRow>,
  after: ReadonlyArray<HistoryRow>,
): RowDiff[] {
  const beforeMap = new Map(before.map((row) => [row.id, row]))
  const afterMap = new Map(after.map((row) => [row.id, row]))
  const result: RowDiff[] = []
  for (const [id, row] of afterMap) {
    const old = beforeMap.get(id)
    if (!old) {
      result.push({ id, name: row.name, before: 0, after: row.amount, kind: '新增' })
    } else if (old.amount !== row.amount || old.name !== row.name) {
      result.push({ id, name: row.name, before: old.amount, after: row.amount, kind: '修改' })
    }
  }
  for (const [id, row] of beforeMap) {
    if (!afterMap.has(id)) result.push({ id, name: row.name, before: row.amount, after: 0, kind: '删除' })
  }
  return result
}
