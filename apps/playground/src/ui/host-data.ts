/**
 * SheetX 第 26 张 · 宿主系统集成与开放 API 调试中心 — 数据
 *
 * 展示 SheetX 如何接入不同 ERP 系统：数据接口、用户上下文、权限回调、主题配置、自定义字体。
 * 所有配置可持久化，API 示例可"运行测试"并回填真实形态的响应。
 */
import type { IconName } from './icons.js'

/** 左侧集成导航项 */
export interface NavItem { key: string; label: string; icon: IconName }

export const INTEGRATION_NAV: NavItem[] = [
  { key: 'basic', label: '宿主系统集成', icon: 'link' },
  { key: 'data', label: '数据接口适配', icon: 'database' },
  { key: 'context', label: '用户上下文', icon: 'user' },
  { key: 'perm', label: '权限控制', icon: 'lock' },
  { key: 'theme', label: '主题与样式', icon: 'palette' },
  { key: 'i18n', label: '国际化配置', icon: 'globe' },
  { key: 'plugins', label: '自定义插件', icon: 'puzzle' },
  { key: 'api', label: 'API 调试中心', icon: 'terminal' },
]

/** 主区 6 个配置标签 */
export const CONFIG_TABS = ['基本配置', '数据接口', '用户上下文', '权限配置', '主题定制', '高级选项'] as const
export type ConfigTab = (typeof CONFIG_TABS)[number]

/** 三种集成模式 */
export const MODES = [
  { key: 'pure', title: '纯前端嵌入', desc: '无需额外部署，直接在宿主系统中使用', icon: 'laptop' as const },
  { key: 'full', title: '前端 + 后端增强', desc: '配合宿主系统提供 API，支持更多企业级功能', icon: 'database' as const },
  { key: 'collab', title: '协同与扩展', desc: '支持多人协作与高级功能（可选）', icon: 'users' as const },
]

/** 功能开关 */
export const FEATURE_TOGGLES = ['工具栏', '公式计算', '图表功能', '数据导出', '打印功能', '全屏模式'] as const

/** ERP 系统预设 —— 数据接口适配核心 */
export interface ErpPreset {
  key: string
  name: string
  vendor: string
  color: string
  baseUrl: string
  auth: string
  endpoints: { list: string; save: string; user: string }
  fieldMap: Array<{ sheet: string; erp: string }>
}

export const ERP_PRESETS: ErpPreset[] = [
  {
    key: 'yonyou', name: '用友 U8', vendor: '用友网络', color: '#e8453c',
    baseUrl: 'https://erp.example.com/u8/api/v2', auth: 'Token（AppKey + AppSecret）',
    endpoints: { list: '/sales/orders', save: '/sales/orders/save', user: '/auth/current' },
    fieldMap: [
      { sheet: 'name', erp: 'cInvName' }, { sheet: 'qty', erp: 'iQuantity' },
      { sheet: 'amount', erp: 'iAmount' }, { sheet: 'note', erp: 'cMemo' },
    ],
  },
  {
    key: 'kingdee', name: '金蝶 K3', vendor: '金蝶国际', color: '#2f7de1',
    baseUrl: 'https://erp.example.com/k3/api/v3', auth: 'OAuth 2.0（Client Credentials）',
    endpoints: { list: '/SalOutStock/List', save: '/SalOutStock/Save', user: '/Token/UserInfo' },
    fieldMap: [
      { sheet: 'name', erp: 'FMaterialName' }, { sheet: 'qty', erp: 'FQty' },
      { sheet: 'amount', erp: 'FAmount' }, { sheet: 'note', erp: 'FNote' },
    ],
  },
  {
    key: 'sap', name: 'SAP S/4HANA', vendor: 'SAP', color: '#0a6ed1',
    baseUrl: 'https://erp.example.com/sap/odata/v4', auth: 'Basic Auth / OAuth 2.0',
    endpoints: { list: '/SalesOrder', save: '/SalesOrder', user: '/UserInfo' },
    fieldMap: [
      { sheet: 'name', erp: 'ProductName' }, { sheet: 'qty', erp: 'OrderQuantity' },
      { sheet: 'amount', erp: 'NetAmount' }, { sheet: 'note', erp: 'Note' },
    ],
  },
  {
    key: 'odoo', name: 'Odoo', vendor: 'Odoo SA', color: '#714b67',
    baseUrl: 'https://erp.example.com/odoo/api/v1', auth: 'API Key（X-API-KEY）',
    endpoints: { list: '/sale.order', save: '/sale.order', user: '/res.users/me' },
    fieldMap: [
      { sheet: 'name', erp: 'name' }, { sheet: 'qty', erp: 'product_uom_qty' },
      { sheet: 'amount', erp: 'amount_total' }, { sheet: 'note', erp: 'note' },
    ],
  },
  {
    key: 'custom', name: '自研系统（REST）', vendor: '通用 REST', color: '#64748b',
    baseUrl: 'https://api.example.com/v1', auth: 'Bearer Token（JWT）',
    endpoints: { list: '/records', save: '/records/batch', user: '/me' },
    fieldMap: [
      { sheet: 'name', erp: 'productName' }, { sheet: 'qty', erp: 'quantity' },
      { sheet: 'amount', erp: 'amount' }, { sheet: 'note', erp: 'remark' },
    ],
  },
]

/** 用户上下文 */
export interface UserContext {
  id: string
  name: string
  department: string
  role: string
  tenant: string
  locale: string
  token: string
}

export const DEFAULT_USER: UserContext = {
  id: 'U-20260118', name: '张三', department: '销售运营部', role: '数据管理员',
  tenant: 'ACME-集团', locale: 'zh-CN', token: 'eyJhbGciOiJIUzI1NiIs...',
}

/** 权限回调：模块 × 操作 */
export const PERM_MODULES = ['工作表', '单元格编辑', '数据导出', '打印', '插件'] as const
export const PERM_ACTIONS = ['读', '写', '删除'] as const
export type PermModule = (typeof PERM_MODULES)[number]
export type PermAction = (typeof PERM_ACTIONS)[number]

export const DEFAULT_PERMS: Record<string, boolean> = {
  '工作表|读': true, '工作表|写': true, '工作表|删除': false,
  '单元格编辑|读': true, '单元格编辑|写': true, '单元格编辑|删除': false,
  '数据导出|读': true, '数据导出|写': false, '数据导出|删除': false,
  '打印|读': true, '打印|写': true, '打印|删除': false,
  '插件|读': true, '插件|写': false, '插件|删除': false,
}

/** 主题与字体 */
export interface ThemeConfig {
  preset: string
  primary: string
  fontFamily: string
  fontSize: number
  radius: number
  customFont: string
}

export const THEME_PRESETS = [
  { key: 'simple', label: '简约风格', primary: '#2f6bff', font: 'Microsoft YaHei' },
  { key: 'modern', label: '现代商务', primary: '#7c5cff', font: 'Microsoft YaHei' },
  { key: 'fresh', label: '清新自然', primary: '#2fbf8f', font: 'PingFang SC' },
  { key: 'tech', label: '科技蓝', primary: '#1e88e5', font: 'Consolas' },
]

export const DEFAULT_THEME: ThemeConfig = {
  preset: 'simple', primary: '#2f6bff', fontFamily: 'Microsoft YaHei',
  fontSize: 13, radius: 8, customFont: 'SheetX Sans',
}

export const FONT_CHOICES = ['Microsoft YaHei', 'PingFang SC', 'SimSun', 'Consolas', 'Arial', '自定义字体']

/** 国际化 */
export interface I18nConfig {
  locale: string
  timezone: string
  dateFormat: string
  currency: string
  weekStart: string
}

export const DEFAULT_I18N: I18nConfig = {
  locale: 'zh-CN', timezone: 'Asia/Shanghai', dateFormat: 'YYYY-MM-DD', currency: 'CNY (¥)', weekStart: '周一',
}

/** 自定义插件 */
export interface HostPlugin { name: string; point: string; enabled: boolean; version: string }
export const DEFAULT_PLUGINS: HostPlugin[] = [
  { name: 'ERP 数据同步', point: 'dataAdapter', enabled: true, version: '1.2.0' },
  { name: '审批流集成', point: 'command', enabled: true, version: '0.9.3' },
  { name: '条码扫描编辑器', point: 'editor', enabled: false, version: '1.0.1' },
  { name: '企业水印', point: 'renderer', enabled: true, version: '2.1.0' },
]

/** API 调试示例 */
export interface ApiExample {
  key: string
  title: string
  desc: string
  code: string
  response: string
  ms: number
}

export const API_EXAMPLES: ApiExample[] = [
  {
    key: 'getUser', title: '获取用户信息', desc: '获取当前用户上下文信息',
    code: 'const user = await SheetX.getUser();\nconsole.log(user);',
    response: JSON.stringify({ id: 'U-20260118', name: '张三', department: '销售运营部', role: '数据管理员', tenant: 'ACME-集团' }, null, 2),
    ms: 82,
  },
  {
    key: 'loadData', title: '加载数据', desc: '加载表格数据',
    code: "const data = await SheetX.loadData({\n  url: '/api/data',\n  method: 'GET'\n});",
    response: JSON.stringify({ ok: true, rows: 6370, fields: 5, elapsed: '68ms', source: '用友 U8 /sales/orders' }, null, 2),
    ms: 68,
  },
  {
    key: 'setTheme', title: '设置主题', desc: '切换表格主题风格',
    code: "SheetX.setTheme('modern');",
    response: JSON.stringify({ ok: true, theme: 'modern', primary: '#7c5cff', applied: true }, null, 2),
    ms: 41,
  },
]

/** API 调试中心标签 */
export const API_TABS = ['调用示例', '响应结果', '错误日志'] as const
export type ApiTab = (typeof API_TABS)[number]

export const ERROR_LOGS = [
  { time: '14:32:08', level: 'WARN', msg: 'Token 将在 5 分钟后过期，请刷新' },
  { time: '14:28:41', level: 'ERROR', msg: 'POST /sales/orders/save 409 主键冲突（重试 1 次后成功）' },
  { time: '14:20:15', level: 'INFO', msg: '字段映射已应用：qty → iQuantity' },
]

/** 完整集成配置 */
export interface IntegrationConfig {
  mode: string
  selector: string
  theme: string
  font: string
  features: Record<string, boolean>
  erp: string
  baseUrl: string
  auth: string
  user: UserContext
  perms: Record<string, boolean>
  themeCfg: ThemeConfig
  i18n: I18nConfig
  plugins: HostPlugin[]
}

export const DEFAULT_CONFIG: IntegrationConfig = {
  mode: 'pure',
  selector: '#sheet-container',
  theme: '简约风格',
  font: 'Microsoft YaHei',
  features: Object.fromEntries(FEATURE_TOGGLES.map((f) => [f, true])),
  erp: 'yonyou',
  baseUrl: ERP_PRESETS[0]!.baseUrl,
  auth: ERP_PRESETS[0]!.auth,
  user: { ...DEFAULT_USER },
  perms: { ...DEFAULT_PERMS },
  themeCfg: { ...DEFAULT_THEME },
  i18n: { ...DEFAULT_I18N },
  plugins: DEFAULT_PLUGINS.map((p) => ({ ...p })),
}
