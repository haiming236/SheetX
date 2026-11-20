/**
 * SheetX 第 27 张 · 数据源适配与远程数据加载 — 数据
 *
 * 核心立场：SheetX 不管理数据库、不内置后端，只通过标准 DataAdapter 接口与宿主交换数据。
 * 本页展示远程分页 / 排序 / 筛选 / 懒加载 / 数据更新 / 错误处理的完整配置与预览。
 */
import type { IconName } from './icons.js'

/** 左侧数据源管理导航 */
export const SOURCE_NAV: Array<{ key: string; label: string; icon: IconName }> = [
  { key: 'remote', label: '远程数据源', icon: 'cloudUpload' },
  { key: 'local', label: '本地数据源', icon: 'database' },
  { key: 'transform', label: '数据转换', icon: 'refresh' },
  { key: 'cache', label: '数据缓存', icon: 'copy' },
  { key: 'binding', label: '数据绑定', icon: 'link' },
]

/** 数据源类型 */
export const SOURCE_TYPES = [
  { key: 'api', label: 'API 接口', icon: 'cloudUpload' as const },
  { key: 'database', label: '数据库', icon: 'database' as const },
  { key: 'file', label: '文件', icon: 'file' as const },
  { key: 'fn', label: '自定义函数', icon: 'code' as const },
]

/** 中间子标签 */
export const DETAIL_TABS = ['接口配置', '参数设置', '数据预览', '使用说明'] as const
export type DetailTab = (typeof DETAIL_TABS)[number]

/** 接口配置 */
export interface ApiConfig {
  url: string
  method: string
  format: string
  pageParam: string
  pageSize: number
  totalField: string
  params: string
}

export const DEFAULT_API: ApiConfig = {
  url: '/api/sales/orders',
  method: 'GET',
  format: 'JSON',
  pageParam: 'page',
  pageSize: 100,
  totalField: 'total',
  params: '{\n  "status": "",\n  "dateRange": "last30days"\n}',
}

/** 预览数据（设计稿 5 行可见，补足 10 行用于分页演示） */
export interface OrderRow {
  id: string
  customer: string
  date: string
  amount: number
  status: '已发货' | '待发货' | '已完成' | '已取消'
}

export const ORDERS: OrderRow[] = [
  { id: 'SQ202501001', customer: '华东贸易有限公司', date: '2025-01-15', amount: 12800, status: '已发货' },
  { id: 'SQ202501002', customer: '北京科技有限公司', date: '2025-01-15', amount: 8560, status: '已发货' },
  { id: 'SQ202501003', customer: '深圳创新科技', date: '2025-01-16', amount: 15200, status: '待发货' },
  { id: 'SQ202501004', customer: '上海商贸公司', date: '2025-01-16', amount: 9800, status: '已发货' },
  { id: 'SQ202501005', customer: '广州智联科技', date: '2025-01-17', amount: 11600, status: '已发货' },
  { id: 'SQ202501006', customer: '成都云图信息', date: '2025-01-17', amount: 23400, status: '已完成' },
  { id: 'SQ202501007', customer: '杭州电商集团', date: '2025-01-18', amount: 7600, status: '待发货' },
  { id: 'SQ202501008', customer: '武汉光谷科技', date: '2025-01-18', amount: 18900, status: '已发货' },
  { id: 'SQ202501009', customer: '南京软件园', date: '2025-01-19', amount: 6300, status: '已取消' },
  { id: 'SQ202501010', customer: '西安数据服务', date: '2025-01-19', amount: 14200, status: '已发货' },
]

export const TOTAL_ROWS = 12580
export const TOTAL_PAGES = 126

/** 高级配置 */
export interface AdvancedConfig {
  loadMode: 'paged' | 'all'
  autoRefresh: boolean
  serverSort: boolean
  lazyLoad: boolean
  retry: number
  timeout: number
  complexQuery: boolean
  crud: boolean
  cache: boolean
}

export const DEFAULT_ADVANCED: AdvancedConfig = {
  loadMode: 'paged',
  autoRefresh: true,
  serverSort: true,
  lazyLoad: true,
  retry: 3,
  timeout: 30,
  complexQuery: true,
  crud: true,
  cache: true,
}

/** 使用说明 / DataAdapter 契约 */
export const USAGE_DOC = `// SheetX 不内置数据库 —— 宿主注入 DataAdapter 即可
SheetX.registerDataAdapter({
  async load({ page, pageSize, sort, filters }) {
    const res = await fetch('/api/sales/orders?' + new URLSearchParams({
      page, pageSize, sort: JSON.stringify(sort), filters: JSON.stringify(filters)
    }))
    const data = await res.json()
    return { rows: data.list, total: data.total }   // 分页 + 总数
  },
  async save(transaction) { /* 增量写回，不传整表 */ },
  getUser() { return currentUser },                  // 用户上下文
  can(action) { return permissions[action] },        // 权限回调
})

// 约定：只传变更补丁 + revision，永不传整表快照`

/** 参数助手可插入的示例参数 */
export const PARAM_SNIPPETS = [
  { label: '时间范围', value: '"dateRange": "last30days"' },
  { label: '状态筛选', value: '"status": "已发货"' },
  { label: '客户关键字', value: '"keyword": "科技"' },
  { label: '排序', value: '"sort": { "field": "date", "order": "desc" }' },
]

/** 状态颜色 */
export const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  已发货: { bg: '#dcfce7', color: '#16803c' },
  待发货: { bg: '#fef3c7', color: '#a16207' },
  已完成: { bg: '#dbeafe', color: '#1d4ed8' },
  已取消: { bg: '#fee2e2', color: '#b91c1c' },
}

export interface FullConfig {
  api: ApiConfig
  advanced: AdvancedConfig
  sourceType: string
  connected: boolean
}

export const DEFAULT_CONFIG: FullConfig = {
  api: { ...DEFAULT_API },
  advanced: { ...DEFAULT_ADVANCED },
  sourceType: 'api',
  connected: true,
}
