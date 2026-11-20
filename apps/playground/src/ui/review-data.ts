/**
 * SheetX 第 14 张 · 单元格批注与协作审阅 — 静态数据
 */

export interface Member {
  name: string
  initials: string
  bg: string
}

export const MEMBERS: Member[] = [
  { name: 'John Doe', initials: 'JD', bg: '#334155' },
  { name: 'Mike Chen', initials: 'MK', bg: '#22c55e' },
  { name: 'Sarah Li', initials: 'SL', bg: '#f59e0b' },
]

export const CURRENT_USER: Member = MEMBERS[0]

export interface TableRow {
  dept: string
  target: number
  actual: number
  note: string
}

/** 完成率由 actual/target 真实计算 */
export const TABLE_ROWS: TableRow[] = [
  { dept: '销售部', target: 1000000, actual: 1120000, note: '超额完成' },
  { dept: '市场部', target: 800000, actual: 760000, note: '待改进' },
  { dept: '技术部', target: 600000, actual: 580000, note: '' },
  { dept: '产品部', target: 700000, actual: 710000, note: '表现优秀' },
  { dept: '运营部', target: 500000, actual: 480000, note: '' },
]

export const REPORT_TITLE = '年度销售业绩分析报告'
export const REPORT_DEADLINE = '数据截止：2025-12-31'

export interface Reply {
  author: string
  time: string
  text: string
}

export interface Comment {
  id: string
  cell: string
  author: string
  time: string
  text: string
  likes: number
  liked: boolean
  resolved: boolean
  replies: Reply[]
}

/** 三条批注：C4/D4 未解决（黄角标），D8 已解决（绿角标） */
export const INITIAL_COMMENTS: Comment[] = [
  {
    id: 'c1', cell: 'C4', author: 'John Doe', time: '2025-11-19 14:32',
    text: '市场部的完成率偏低，建议分析原因并制定改进方案。',
    likes: 1, liked: false, resolved: false, replies: [],
  },
  {
    id: 'c2', cell: 'D4', author: 'Mike Chen', time: '2025-11-19 15:20',
    text: '已安排下周专项分析会议。',
    likes: 0, liked: false, resolved: false, replies: [],
  },
  {
    id: 'c3', cell: 'D8', author: 'Sarah Li', time: '2025-11-19 16:05',
    text: '同意，重点关注市场部业绩。',
    likes: 2, liked: false, resolved: true, replies: [],
  },
]

export interface Revision {
  time: string
  user: string
  action: string
  detail: string
}

export const INITIAL_REVISIONS: Revision[] = [
  { time: '2025-11-19 16:05', user: 'Sarah Li', action: '解决批注', detail: 'D8 的批注已标记为已解决' },
  { time: '2025-11-19 15:20', user: 'Mike Chen', action: '添加批注', detail: '在 D4 添加了一条批注' },
  { time: '2025-11-19 14:32', user: 'John Doe', action: '添加批注', detail: '在 C4 添加了一条批注' },
  { time: '2025-11-19 14:02', user: 'John Doe', action: '修改数值', detail: 'C5：758,000 → 760,000' },
  { time: '2025-11-19 11:47', user: 'John Doe', action: '更新公式', detail: 'C8 合计公式 =SUM(C3:C7)' },
  { time: '2025-11-18 18:22', user: 'Mike Chen', action: '导入数据', detail: '导入 11 月销售明细（35 行）' },
]

export interface FlowStep {
  name: string
  owner: string
  status: 'done' | 'active' | 'todo'
}

export const REVIEW_FLOW: FlowStep[] = [
  { name: '报表编制', owner: 'John Doe', status: 'done' },
  { name: '部门审核', owner: 'Mike Chen', status: 'active' },
  { name: '财务复核', owner: 'Sarah Li', status: 'todo' },
  { name: '归档发布', owner: '—', status: 'todo' },
]

export const PANEL_TABS = ['批注', '修订记录', '审阅状态'] as const

export const SHEET_TABS = ['年度报告', '月度数据', '数据分析'] as const

export const TOP_MENUS = ['文件', '开始', '插入', '数据', '公式', '视图', '审阅', '设置'] as const
