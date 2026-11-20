/**
 * 演示数据（还原第 01 张设计稿的"销售数据"工作表）
 * 仅用于 UI 展示，引擎接入后由 @sheetx/grid 替换。
 */

export interface DemoRow {
  no: number
  region: string
  dept: string
  amount: number
  rate: number
  owner: string
  note: string
}

export const demoColumns = [
  { key: 'no', title: '序号', width: 56, align: 'center' as const },
  { key: 'region', title: '地区', width: 132, align: 'left' as const },
  { key: 'dept', title: '销售部门', width: 110, align: 'left' as const },
  { key: 'amount', title: '销售额（万元）', width: 132, align: 'right' as const },
  { key: 'rate', title: '完成率', width: 130, align: 'left' as const },
  { key: 'owner', title: '负责人', width: 84, align: 'left' as const },
  { key: 'note', title: '备注', width: 96, align: 'left' as const },
]

export const demoRows: DemoRow[] = [
  { no: 1, region: '北京分公司', dept: '销售一部', amount: 128.5, rate: 92, owner: '张三', note: '重点客户' },
  { no: 2, region: '上海分公司', dept: '销售二部', amount: 115.0, rate: 85, owner: '李四', note: '增长良好' },
  { no: 3, region: '广州分公司', dept: '销售一部', amount: 98.6, rate: 76, owner: '王五', note: '潜力客户' },
  { no: 4, region: '深圳分公司', dept: '销售三部', amount: 132.7, rate: 98, owner: '赵六', note: '业绩优秀' },
  { no: 5, region: '成都分公司', dept: '销售二部', amount: 87.3, rate: 64, owner: '钱七', note: '需要跟进' },
  { no: 6, region: '杭州分公司', dept: '销售一部', amount: 110.2, rate: 81, owner: '孙八', note: '稳定增长' },
  { no: 7, region: '武汉分公司', dept: '销售三部', amount: 95.8, rate: 71, owner: '周九', note: '表现良好' },
  { no: 8, region: '南京分公司', dept: '销售二部', amount: 120.0, rate: 88, owner: '吴十', note: '重点维护' },
  { no: 9, region: '重庆分公司', dept: '销售一部', amount: 103.9, rate: 79, owner: '郑十一', note: '持续增长' },
]

/** 顶部导航菜单 */
export const navMenus = ['文件', '开始', '插入', '页面布局', '公式', '数据', '审阅', '视图', '设置']

/** 工作表标签 */
export const sheetTabs = ['销售数据', '产品信息', '客户资料']

/** 状态栏统计（基于 demoRows 计算，与设计稿一致） */
export function computeStats(rows: DemoRow[]) {
  const count = rows.length
  const sum = rows.reduce((acc, r) => acc + r.amount, 0)
  const avg = count ? sum / count : 0
  return {
    avg: avg.toFixed(1),
    count,
    sum: sum.toFixed(1),
  }
}
