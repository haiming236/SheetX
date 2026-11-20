/**
 * SheetX 第 11 张 · 工作簿与多工作表管理 — 静态数据
 */
import type { IconName } from './icons.js'

export type Cell = string | number

export interface SheetState {
  name: string
  color: string
  hidden: boolean
}

export interface WorkbookDef {
  key: string
  name: string
  title: string
  chartTitle: string
  columns: string[]
  rows: Cell[][]
  totalRow: Cell[]
  chartValueCol: number
  stats: { avg: string; count: number; sum: string }
  info: { rows: number; cols: number; size: string }
  sheets: SheetState[]
}

/** 底部工作表标签（按设计稿，所有工作簿共用同一组标签名） */
const BASE_SHEETS: SheetState[] = [
  { name: '销售数据', color: '#3b82f6', hidden: false },
  { name: '库存数据', color: '', hidden: false },
  { name: '客户分析', color: '', hidden: false },
  { name: '财务报表', color: '', hidden: false },
]

export const WORKBOOKS: WorkbookDef[] = [
  {
    key: 'sales',
    name: '销售报表.xlsx',
    title: '销售数据统计报表',
    chartTitle: '销售额趋势图',
    columns: ['月份', '销售额', '订单数', '同比增长', '环比增长'],
    rows: [
      ['1月', '¥128,000', '1,250', '12.5%', '8.7%'],
      ['2月', '¥156,000', '1,320', '15.2%', '21.9%'],
      ['3月', '¥172,000', '1,410', '18.7%', '10.3%'],
      ['4月', '¥189,000', '1,520', '20.1%', '9.9%'],
      ['5月', '¥207,000', '1,680', '22.4%', '9.5%'],
    ],
    totalRow: ['合计', '¥852,000', '6,220', '—', '—'],
    chartValueCol: 1,
    stats: { avg: '170,400', count: 30, sum: '852,000' },
    info: { rows: 1000, cols: 26, size: '128 KB' },
    sheets: BASE_SHEETS.map((s) => ({ ...s })),
  },
  {
    key: 'stock',
    name: '库存统计.xlsx',
    title: '库存数据统计报表',
    chartTitle: '库存金额趋势图',
    columns: ['品类', '库存量', '单价', '库存金额', '环比'],
    rows: [
      ['传感器', '12,400', '¥86', '¥1,066,400', '6.2%'],
      ['控制器', '8,600', '¥145', '¥1,247,000', '4.8%'],
      ['驱动模块', '6,200', '¥320', '¥1,984,000', '9.1%'],
      ['电源件', '15,800', '¥45', '¥711,000', '3.5%'],
      ['结构件', '23,500', '¥28', '¥658,000', '2.9%'],
    ],
    totalRow: ['合计', '66,500', '—', '¥5,666,400', '—'],
    chartValueCol: 3,
    stats: { avg: '1,133,280', count: 30, sum: '5,666,400' },
    info: { rows: 1000, cols: 26, size: '96 KB' },
    sheets: BASE_SHEETS.map((s) => ({ ...s })),
  },
  {
    key: 'customer',
    name: '客户分析.xlsx',
    title: '客户分析统计报表',
    chartTitle: '客户消费额趋势图',
    columns: ['客户', '消费额', '订单数', '客单价', '环比'],
    rows: [
      ['华东集团', '¥486,000', '326', '¥1,491', '12.4%'],
      ['南方电力', '¥392,000', '254', '¥1,543', '8.7%'],
      ['中天建设', '¥287,000', '198', '¥1,449', '15.2%'],
      ['蓝海贸易', '¥245,000', '176', '¥1,392', '6.3%'],
      ['星辰科技', '¥182,000', '132', '¥1,379', '9.8%'],
    ],
    totalRow: ['合计', '¥1,592,000', '1,086', '—', '—'],
    chartValueCol: 1,
    stats: { avg: '318,400', count: 30, sum: '1,592,000' },
    info: { rows: 1000, cols: 26, size: '84 KB' },
    sheets: BASE_SHEETS.map((s) => ({ ...s })),
  },
  {
    key: 'finance',
    name: '财务报表.xlsx',
    title: '财务数据统计报表',
    chartTitle: '支出实际发生趋势图',
    columns: ['项目', '预算', '实际', '完成率', '同比'],
    rows: [
      ['营业收入', '¥1,200,000', '¥1,356,000', '113.0%', '14.2%'],
      ['营业成本', '¥780,000', '¥752,000', '96.4%', '6.8%'],
      ['销售费用', '¥210,000', '¥198,000', '94.3%', '3.5%'],
      ['管理费用', '¥150,000', '¥142,000', '94.7%', '2.1%'],
      ['研发投入', '¥260,000', '¥275,000', '105.8%', '18.6%'],
    ],
    totalRow: ['合计', '¥2,600,000', '¥2,723,000', '—', '—'],
    chartValueCol: 2,
    stats: { avg: '544,600', count: 30, sum: '2,723,000' },
    info: { rows: 1000, cols: 26, size: '112 KB' },
    sheets: BASE_SHEETS.map((s) => ({ ...s })),
  },
]

/** 右键菜单项 */
export interface SheetMenuItem {
  icon: IconName
  label: string
  action: string
  submenu?: boolean
}

export const SHEET_MENU_ITEMS: SheetMenuItem[] = [
  { icon: 'plus', label: '插入工作表', action: 'insert' },
  { icon: 'trash', label: '删除工作表', action: 'delete' },
  { icon: 'edit', label: '重命名', action: 'rename' },
  { icon: 'copy', label: '复制工作表', action: 'copy' },
  { icon: 'arrowRight', label: '移动或复制...', action: 'move' },
  { icon: 'eye', label: '隐藏工作表', action: 'hide' },
  { icon: 'eye', label: '取消隐藏...', action: 'unhide' },
  { icon: 'palette', label: '工作表颜色', action: 'color', submenu: true },
  { icon: 'lock', label: '保护工作表', action: 'protect' },
  { icon: 'tableStyle', label: '选定全部工作表', action: 'selectAll' },
  { icon: 'settings', label: '工作表管理设置...', action: 'manage' },
]

/** 工作表颜色子菜单色板 */
export const SHEET_COLORS: { label: string; value: string }[] = [
  { label: '蓝色', value: '#3b82f6' },
  { label: '橙色', value: '#f97316' },
  { label: '绿色', value: '#22c55e' },
  { label: '紫色', value: '#8b5cf6' },
  { label: '灰色', value: '#94a3b8' },
]

/** 属性面板标签颜色可选项（含无色） */
export const TAG_COLORS: { label: string; value: string }[] = [
  { label: '无颜色', value: '' },
  ...SHEET_COLORS,
]

/** 属性面板 Tab */
export const PROP_TABS = ['常规', '保护', '高级'] as const

/** 顶部菜单 */
export const TOP_MENUS = ['文件', '开始', '插入', '数据', '公式', '视图', '设置'] as const

/** 列宽（行号列 + A-F） */
export const COL_WIDTHS = [105, 115, 90, 105, 110, 85] as const
