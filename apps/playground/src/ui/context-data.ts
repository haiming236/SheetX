/**
 * 第 08 张 · 右键菜单与快捷操作 —— 页面数据
 *
 * 订单数据表格 + 上下文菜单（复制/剪切/粘贴/插入/删除/填充…）+ 填充子菜单 + 快捷操作提示。
 */
import type { IconName } from './icons.js'

// ---------- 顶部导航 / 工作表 / 状态栏 ----------
export const contextNavMenus = ['文件', '开始', '插入', '数据', '公式', '视图', '设置']
export const contextSheetTabs = ['订单数据', '销售统计', '客户信息']
export const contextStats = { avg: '15,375.00', count: 5, sum: '76,875.00' }
/** 公式栏内容（还原设计稿：B3 + fx + 张三） */
export const formulaBarText = '张三'

// ---------- 表格 ----------
export interface ContextColumn {
  key: string
  title: string
  width: number
  num?: boolean
  /** 整列浅蓝高亮（B 列·客户名称） */
  highlight?: boolean
}

export const contextColumns: ContextColumn[] = [
  { key: 'orderNo', title: '订单号', width: 178 },
  { key: 'customer', title: '客户名称', width: 178, highlight: true },
  { key: 'amount', title: '金额', width: 120, num: true },
  { key: 'status', title: '订单状态', width: 120 },
  { key: 'date', title: '下单日期', width: 130 },
  { key: 'owner', title: '业务员', width: 120 },
  { key: 'remark', title: '备注', width: 120 },
]

export interface ContextRow {
  orderNo: string
  customer: string
  amount: string
  status: string
  date: string
  owner: string
  remark: string
}

export const contextRows: ContextRow[] = [
  { orderNo: 'SO-2025001', customer: '华东科技有限公司', amount: '12,500.00', status: '已发货', date: '2025-05-01', owner: '张三', remark: '及时发货' },
  { orderNo: 'SO-2025002', customer: '星海贸易公司', amount: '8,200.00', status: '待发货', date: '2025-05-02', owner: '李四', remark: '—' },
  { orderNo: 'SO-2025003', customer: '创新科技集团', amount: '15,800.00', status: '已发货', date: '2025-05-03', owner: '王五', remark: 'VIP客户' },
  { orderNo: 'SO-2025004', customer: '智联科技有限公司', amount: '23,375.00', status: '已发货', date: '2025-05-04', owner: '张三', remark: '—' },
  { orderNo: 'SO-2025005', customer: '未来信息科技', amount: '17,000.00', status: '待发货', date: '2025-05-05', owner: '李四', remark: '加急处理' },
]

/** 总行数（含空行），设计稿展示 10 行 */
export const contextTotalRows = 10

// ---------- 右键菜单 ----------
export interface MenuItem {
  icon?: IconName
  label: string
  shortcut?: string
  /** 右侧展开箭头（插入/删除/筛选/排序/填充） */
  arrow?: boolean
  /** 选中高亮（当前悬停的"填充"项） */
  active?: boolean
  /** 点击后展开子菜单 */
  submenu?: boolean
}

/** 右键菜单分组（组间渲染分隔线） */
export const contextMenuSections: MenuItem[][] = [
  [
    { icon: 'copy', label: '复制', shortcut: 'Ctrl + C' },
    { icon: 'scissors', label: '剪切', shortcut: 'Ctrl + X' },
    { icon: 'paste', label: '粘贴', shortcut: 'Ctrl + V' },
  ],
  [
    { label: '插入', arrow: true },
    { label: '删除', arrow: true },
    { icon: 'eraser', label: '清除内容', shortcut: 'Delete' },
    { icon: 'format', label: '设置单元格格式...', shortcut: 'Ctrl + 1' },
    { icon: 'filter', label: '筛选', arrow: true },
    { icon: 'sort', label: '排序', arrow: true },
    { icon: 'fill', label: '填充', arrow: true, active: true, submenu: true },
    { icon: 'validation', label: '数据验证' },
    { icon: 'link', label: '超链接', shortcut: 'Ctrl + K' },
  ],
]

export const contextMenuMore = '查看更多操作...'

/** 填充子菜单分组 */
export const fillSubmenuSections: MenuItem[][] = [
  [
    { icon: 'arrowDown', label: '向下填充', shortcut: 'Ctrl + D' },
    { icon: 'arrowRight', label: '向右填充', shortcut: 'Ctrl + R' },
    { icon: 'arrowUp', label: '向上填充' },
    { icon: 'arrowLeft', label: '向左填充' },
  ],
  [
    { icon: 'listView', label: '序列填充...' },
    { icon: 'blankCell', label: '填充空白单元格' },
    { icon: 'sameFormat', label: '填充相同格式' },
  ],
]

// ---------- 快捷操作提示卡 ----------
export const quickTips = ['右键菜单操作更丰富', '支持多种填充方式', '快速完成数据处理']
