/**
 * 大数据量与虚拟滚动演示数据（还原第 05 张设计稿）
 */

export interface BigDataRow {
  no: number
  branch: string
  customer: string
  category: string
  qty: number
  amount: number
  date: string
}

export const bigDataRows: BigDataRow[] = [
  { no: 1, branch: '北京分公司', customer: '北京华泰科技有限公司', category: '电脑', qty: 1000, amount: 598000.0, date: '2025-12-01' },
  { no: 2, branch: '上海分公司', customer: '上海智联信息技术有限公司', category: '显示器', qty: 800, amount: 479200.0, date: '2025-12-01' },
  { no: 3, branch: '广州分公司', customer: '广州创想科技有限公司', category: '笔记本', qty: 1200, amount: 719000.0, date: '2025-12-02' },
  { no: 4, branch: '深圳分公司', customer: '深圳云联科技有限公司', category: '平板电脑', qty: 950, amount: 569050.0, date: '2025-12-02' },
  { no: 5, branch: '成都分公司', customer: '成都博睿科技有限公司', category: '电脑', qty: 780, amount: 465840.0, date: '2025-12-03' },
  { no: 6, branch: '杭州分公司', customer: '杭州数智科技有限公司', category: '显示器', qty: 620, amount: 370360.0, date: '2025-12-03' },
  { no: 7, branch: '武汉分公司', customer: '武汉睿智科技有限公司', category: '笔记本', qty: 1100, amount: 658900.0, date: '2025-12-04' },
  { no: 8, branch: '南京分公司', customer: '南京科创信息技术有限公司', category: '平板电脑', qty: 870, amount: 520170.0, date: '2025-12-04' },
  { no: 9, branch: '重庆分公司', customer: '重庆宏图科技有限公司', category: '电脑', qty: 660, amount: 394680.0, date: '2025-12-05' },
  { no: 10, branch: '天津分公司', customer: '天津优创科技有限公司', category: '显示器', qty: 720, amount: 430560.0, date: '2025-12-05' },
  { no: 11, branch: '苏州分公司', customer: '苏州汇智科技有限公司', category: '笔记本', qty: 910, amount: 543380.0, date: '2025-12-06' },
  { no: 12, branch: '西安分公司', customer: '西安智汇科技有限公司', category: '平板电脑', qty: 630, amount: 376290.0, date: '2025-12-06' },
  { no: 13, branch: '长沙分公司', customer: '长沙蓝海科技有限公司', category: '电脑', qty: 770, amount: 459860.0, date: '2025-12-07' },
  { no: 14, branch: '济南分公司', customer: '济南新媒科技有限公司', category: '显示器', qty: 690, amount: 412110.0, date: '2025-12-07' },
  { no: 15, branch: '青岛分公司', customer: '青岛海信科技有限公司', category: '笔记本', qty: 880, amount: 527040.0, date: '2025-12-08' },
]

/** 产品类别标签配色 */
export const categoryColors: Record<string, { bg: string; fg: string }> = {
  电脑: { bg: '#e8f1ff', fg: '#2563eb' },
  显示器: { bg: '#e3f6ed', fg: '#159a68' },
  笔记本: { bg: '#f2e9ff', fg: '#8b5cf6' },
  平板电脑: { bg: '#fff0e3', fg: '#e07b39' },
}

/** 滚动性能采样（最近30秒，稳定在60FPS附近） */
export const fpsSeries = [
  60, 60, 59, 60, 60, 58, 60, 60, 60, 59,
  60, 60, 60, 57, 60, 60, 60, 59, 60, 60,
  58, 60, 60, 60, 60, 59, 60, 60, 60, 60,
]

/** 性能面板状态项 */
export const perfStatuses = ['虚拟滚动', '增量渲染', 'OffscreenCanvas', 'Web Worker']
