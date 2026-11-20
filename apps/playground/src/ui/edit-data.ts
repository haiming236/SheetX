/**
 * SheetX 第 28 张 · 数据编辑与事务提交 — 数据
 *
 * 核心原则：SheetX 管理编辑过程（暂存 / 批量 / 确认 / 回滚 / 冲突），
 * 宿主系统负责最终数据持久化（提交时调用 DataAdapter.save）。
 */
import type { IconName } from './icons.js'

/** 订单数据（表格行） */
export interface EditRow {
  id: string
  no: string
  date: string
  customer: string
  amount: number
  status: '已发货' | '待发货' | '已完成' | '已取消'
  /** 服务端版本号，用于乐观锁冲突检测 */
  version: number
}

export const INITIAL_ROWS: EditRow[] = [
  { id: 'r1', no: 'SQ202501001', date: '2025-01-15', customer: '华东贸易有限公司', amount: 12800, status: '已发货', version: 1 },
  { id: 'r2', no: 'SQ202501002', date: '2025-01-15', customer: '北京科技有限公司', amount: 8560, status: '已发货', version: 1 },
  { id: 'r3', no: 'SQ202501003', date: '2025-01-16', customer: '深圳创新科技', amount: 15200, status: '待发货', version: 1 },
  { id: 'r4', no: 'SQ202501004', date: '2025-01-16', customer: '上海商贸公司', amount: 9800, status: '已发货', version: 1 },
  { id: 'r5', no: 'SQ202501005', date: '2025-01-17', customer: '广州智联科技', amount: 11600, status: '已发货', version: 2 },
  { id: 'r6', no: 'SQ202501006', date: '2025-01-18', customer: '杭州数字科技', amount: 18400, status: '待发货', version: 1 },
  { id: 'r7', no: 'SQ202501007', date: '2025-01-19', customer: '成都 Tech 公司', amount: 7600, status: '已发货', version: 1 },
  { id: 'r8', no: 'SQ202501008', date: '2025-01-20', customer: '重庆智能科技', amount: 13200, status: '待发货', version: 1 },
  { id: 'r9', no: 'SQ202501009', date: '2025-01-21', customer: '南京软件园', amount: 6300, status: '已取消', version: 1 },
  { id: 'r10', no: 'SQ202501010', date: '2025-01-22', customer: '武汉科技有限公司', amount: 9500, status: '已发货', version: 1 },
]

/** 表格列 */
export const COLUMNS: Array<{ key: keyof EditRow; title: string; icon?: IconName; width?: string }> = [
  { key: 'no', title: '订单编号', icon: 'cart', width: '17%' },
  { key: 'date', title: '订单日期', icon: 'calendar', width: '16%' },
  { key: 'customer', title: '客户名称', icon: 'box', width: '24%' },
  { key: 'amount', title: '订单金额', icon: 'currency', width: '16%' },
  { key: 'status', title: '订单状态', icon: 'checkCircle', width: '16%' },
]

/** 暂存变更（mutation） */
export interface PendingChange {
  id: number
  rowId: string
  field: keyof EditRow
  oldValue: string | number
  newValue: string | number
  time: string
  source: 'cell' | 'batch'
}

/** 操作日志 */
export type LogStatus = '已提交' | '已回滚' | '冲突待处理' | '暂存'
export interface OpLog {
  id: number
  time: string
  operator: string
  action: string
  status: LogStatus
  note: string
  count?: number
}

export const INITIAL_LOGS: OpLog[] = [
  { id: 1, time: '10:24:33', operator: '张三', action: '修改了第 3 行的订单金额: 8,260.00 → 8,560.00', status: '已提交', note: '提交成功', count: 1 },
  { id: 2, time: '10:20:12', operator: '张三', action: '批量更新订单状态: 待发货 → 已发货（共 3 条）', status: '已提交', note: '提交成功', count: 3 },
  { id: 3, time: '10:15:08', operator: '张三', action: '暂存第 5 行客户名称修改', status: '暂存', note: '等待提交' },
]

/** 日志 tab */
export const LOG_TABS = ['操作日志', '提交记录', '数据变更'] as const
export type LogTab = (typeof LOG_TABS)[number]

/** 批量编辑模式 */
export const BATCH_MODES = ['设置为固定值', '递增数值', '清空字段', '追加前缀'] as const
export type BatchMode = (typeof BATCH_MODES)[number]

/** 批量编辑字段 */
export const BATCH_FIELDS: Array<{ key: keyof EditRow; label: string }> = [
  { key: 'status', label: '订单状态' },
  { key: 'amount', label: '订单金额' },
  { key: 'date', label: '订单日期' },
  { key: 'customer', label: '客户名称' },
]

export const STATUS_CHOICES = ['已发货', '待发货', '已完成', '已取消'] as const

/** 接口响应模拟结果 */
export type SubmitOutcome = 'success' | 'fail' | 'conflict'

export const OUTCOMES: Array<{ key: SubmitOutcome; label: string; desc: string; color: string }> = [
  { key: 'success', label: '成功', desc: '宿主 API 返回 200，事务提交', color: '#16a34a' },
  { key: 'fail', label: '失败', desc: '宿主 API 返回 500，自动回滚', color: '#dc2626' },
  { key: 'conflict', label: '冲突', desc: '版本号不匹配，弹出冲突处理', color: '#d97706' },
]

/** 状态颜色（与第27页一致） */
export const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  已发货: { bg: '#dcfce7', color: '#16803c' },
  待发货: { bg: '#fef3c7', color: '#a16207' },
  已完成: { bg: '#dbeafe', color: '#1d4ed8' },
  已取消: { bg: '#fee2e2', color: '#b91c1c' },
}

/** 冲突信息 */
export interface Conflict {
  rowId: string
  field: keyof EditRow
  localValue: string | number
  serverValue: string | number
  serverVersion: number
}

/** 格式化金额 */
export function fmtAmount(value: number): string {
  return `¥ ${value.toLocaleString('zh-CN')}.00`
}

/** 生成时间戳 */
export function nowTime(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}
