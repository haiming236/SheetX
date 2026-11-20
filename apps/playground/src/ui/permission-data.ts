/**
 * SheetX 第 29 张 · 数据权限与安全控制 — 数据
 *
 * 核心边界：SheetX 提供权限控制接口（can / canEdit / canView / mask），
 * 最终权限判断与数据安全由宿主 ERP 后端负责 —— 前端只执行宿主返回的决策。
 */
import type { IconName } from './icons.js'

/** 左侧权限导航 */
export const PERM_NAV: Array<{ key: string; label: string; icon: IconName }> = [
  { key: 'overview', label: '权限概览', icon: 'shield' },
  { key: 'column', label: '列级权限', icon: 'tableStyle' },
  { key: 'cell', label: '单元格只读', icon: 'lock' },
  { key: 'row', label: '行级数据范围', icon: 'filter' },
  { key: 'mask', label: '敏感字段脱敏', icon: 'eye' },
  { key: 'callback', label: '权限回调日志', icon: 'terminal' },
]

/** 角色（宿主任命，前端只展示） */
export interface Role { key: string; label: string; dept: string; desc: string; color: string }
export const ROLES: Role[] = [
  { key: 'admin', label: '系统管理员', dept: 'IT 部', desc: '全部权限', color: '#2563eb' },
  { key: 'sales', label: '销售经理', dept: '销售运营部', desc: '本部门数据', color: '#16a34a' },
  { key: 'viewer', label: '只读观察员', dept: '财务部', desc: '只读 + 脱敏', color: '#d97706' },
]

/** 列级权限 */
export interface ColumnPerm {
  key: string
  title: string
  visible: boolean
  editable: boolean
  mask: boolean
  sensitive: boolean
}

export const INITIAL_COLUMNS: ColumnPerm[] = [
  { key: 'no', title: '订单编号', visible: true, editable: false, mask: false, sensitive: false },
  { key: 'customer', title: '客户名称', visible: true, editable: true, mask: false, sensitive: false },
  { key: 'phone', title: '联系电话', visible: true, editable: true, mask: true, sensitive: true },
  { key: 'amount', title: '订单金额', visible: true, editable: true, mask: false, sensitive: true },
  { key: 'idcard', title: '身份证号', visible: true, editable: false, mask: true, sensitive: true },
  { key: 'status', title: '订单状态', visible: true, editable: true, mask: false, sensitive: false },
]

/** 订单数据（含敏感字段，用于脱敏演示） */
export interface SecureRow {
  id: string
  no: string
  customer: string
  phone: string
  amount: number
  idcard: string
  status: '已发货' | '待发货' | '已完成'
  dept: string
  owner: string
}

export const SECURE_ROWS: SecureRow[] = [
  { id: 'r1', no: 'SQ202501001', customer: '华东贸易有限公司', phone: '13812345678', amount: 12800, idcard: '310101199001011234', status: '已发货', dept: '销售运营部', owner: '张三' },
  { id: 'r2', no: 'SQ202501002', customer: '北京科技有限公司', phone: '13923456789', amount: 8560, idcard: '110101198502023456', status: '已发货', dept: '销售运营部', owner: '李四' },
  { id: 'r3', no: 'SQ202501003', customer: '深圳创新科技', phone: '13734567890', amount: 15200, idcard: '440301199203034567', status: '待发货', dept: '华南分公司', owner: '王五' },
  { id: 'r4', no: 'SQ202501004', customer: '上海商贸公司', phone: '13645678901', amount: 9800, idcard: '310104198804045678', status: '已发货', dept: '销售运营部', owner: '张三' },
  { id: 'r5', no: 'SQ202501005', customer: '广州智联科技', phone: '13556789012', amount: 11600, idcard: '440106199505056789', status: '已完成', dept: '华南分公司', owner: '赵六' },
  { id: 'r6', no: 'SQ202501006', customer: '杭州数字科技', phone: '13467890123', amount: 18400, idcard: '330106199106067890', status: '待发货', dept: '华东分公司', owner: '张三' },
]

/** 单元格只读例外（宿主后端下发） */
export const INITIAL_READONLY_CELLS = new Set(['r2|amount', 'r4|customer', 'r5|phone'])

/** 回调日志 */
export interface CallbackLog {
  id: number
  time: string
  action: string
  detail: string
  result: 'allow' | 'deny' | 'masked'
  source: string
}

export const INITIAL_CALLBACKS: CallbackLog[] = [
  { id: 1, time: '14:32:08', action: 'canEdit', detail: 'cell r2|amount', result: 'deny', source: '宿主 ERP 后端' },
  { id: 2, time: '14:31:55', action: 'canView', detail: 'column idcard', result: 'masked', source: '宿主 ERP 后端' },
  { id: 3, time: '14:30:12', action: 'canEdit', detail: 'cell r1|customer', result: 'allow', source: '宿主 ERP 后端' },
]

/** 权限回调契约 */
export const PERM_CONTRACT = `// SheetX 只提供接口，不自行判断权限 —— 决策完全由宿主后端返回
SheetX.setPermissionCallback({
  // 编辑权限：返回 false 时单元格进入只读，编辑被拦截
  async canEdit({ rowId, field, user, row }) {
    const res = await fetch('/api/perm/can-edit', {
      method: 'POST',
      body: JSON.stringify({ rowId, field, userId: user.id })
    })
    return (await res.json()).allow   // 宿主说了算
  },

  // 可见性 / 脱敏：返回 'full' | 'masked' | 'hidden'
  canView({ field, user }) {
    return SENSITIVE_FIELDS.has(field) && user.role !== 'admin'
      ? 'masked' : 'full'
  },

  // 行级数据范围：宿主下发可见行 / 过滤条件
  rowScope(user) {
    return { dept: user.dept, owner: user.id }
  },
})

// 安全底线：前端权限仅用于 UX，真正的数据安全
// 必须由宿主 ERP 后端在 API 层强制校验，永不信任前端。`

/** 一次编辑权限检查的完整链路（调试面板展开文案） */
export const CONTRACT_STEPS = `// 一次编辑权限检查的完整链路
1. 用户点击单元格 → SheetX 调用 canEdit({rowId,field,user})
2. canEdit 内部请求宿主 POST /api/perm/can-edit（带用户身份）
3. 宿主后端查询权限表，返回 { allow: false, reason: '只读字段' }
4. SheetX 收到 false → 阻止进入编辑 + 触发 validation-error

// 安全底线：即使有人绕过前端直接调 API，
// 宿主 ERP 后端仍必须在保存接口再次校验权限。`

/** 脱敏算法（前端展示层，仅 UX） */
export type MaskKind = 'phone' | 'idcard' | 'amount' | 'none'

export function maskValue(value: string | number, kind: MaskKind): string {
  const s = String(value)
  if (kind === 'phone') return s.length >= 11 ? `${s.slice(0, 3)}****${s.slice(-4)}` : '****'
  if (kind === 'idcard') return s.length >= 8 ? `${s.slice(0, 4)}**********${s.slice(-4)}` : '****'
  if (kind === 'amount') return '¥ ****'
  return s
}

/** 行级范围判定（宿主 scope 的前端投影） */
export function inRowScope(row: SecureRow, scope: { dept: string; owner: string }): boolean {
  if (scope.dept === '全部') return true
  return row.dept === scope.dept || row.owner === scope.owner
}

/** 回调结果样式 */
export const RESULT_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  allow: { bg: '#dcfce7', color: '#16803c', label: '允许' },
  deny: { bg: '#fee2e2', color: '#b91c1c', label: '拒绝' },
  masked: { bg: '#fef3c7', color: '#a16207', label: '脱敏' },
}

export interface FullConfig {
  role: string
  columns: ColumnPerm[]
  readonlyCells: string[]
  rowScope: { dept: string; owner: string }
  revealSensitive: boolean
}

export const DEFAULT_CONFIG: FullConfig = {
  role: 'sales',
  columns: INITIAL_COLUMNS.map((c) => ({ ...c })),
  readonlyCells: [...INITIAL_READONLY_CELLS],
  rowScope: { dept: '销售运营部', owner: '张三' },
  revealSensitive: false,
}
