/**
 * SheetX 首页 · 设计稿导航中心 — 数据
 *
 * 42 张高保真设计稿（含引擎演示、扩展生态、企业个性化、宿主集成、数据、事务、权限、国际化、快捷键、插件、调试、嵌入、API文档、综合Playground、双模式对比、核心引擎架构、技术选型、虚拟滚动与AI生成），点击卡片经 hash 路由进入对应视图。
 */
import type { IconName } from './icons.js'

export type MockKind =
  | 'table' | 'grid' | 'sheet' | 'editors' | 'virtual' | 'formula'
  | 'io' | 'context' | 'filter' | 'settings' | 'workbook' | 'charts'
  | 'pivot' | 'review' | 'validate' | 'engine' | 'print' | 'format' | 'formula-lib' | 'history' | 'import' | 'adv-filter' | 'multi-view' | 'plugins' | 'properties' | 'host' | 'datasource' | 'edit' | 'permission' | 'i18n' | 'keyboard' | 'plugin-dev' | 'debug' | 'embed' | 'api-doc' | 'playground-all' | 'dual-mode' | 'engine-arch' | 'render-arch' | 'virtual-scroll' | 'ai-assistant' | 'ai-generate' | 'ai-analysis' | 'ai-formula' | 'ai-chart'

export interface PageEntry {
  no: string
  route: string
  title: string
  desc: string
  tags: string[]
  accent: string
  mock: MockKind
  icon: IconName
}

export const PAGE_ENTRIES: PageEntry[] = [
  {
    no: '01', route: 'spreadsheet', title: '主工作界面',
    desc: 'SheetX 主界面骨架：顶栏、工具栏、公式栏、网格画布与工作表标签。',
    tags: ['布局骨架', '工具栏'], accent: '#3b82f6', mock: 'table', icon: 'gridView',
  },
  {
    no: '02', route: 'grid', title: '业务数据网格',
    desc: 'Grid 业务网格模式：状态标签、行操作与密集数据展示。',
    tags: ['状态徽章', '密集行'], accent: '#0ea5e9', mock: 'grid', icon: 'listView',
  },
  {
    no: '03', route: 'sheet-full', title: '完整电子表格',
    desc: '完整电子表格模式：合并单元格、数字格式与冻结行列。',
    tags: ['合并单元格', '冻结'], accent: '#2563eb', mock: 'sheet', icon: 'tableStyle',
  },
  {
    no: '04', route: 'editors', title: '单元格编辑器',
    desc: '文本、数字、日期与业务下拉选择等多种单元格编辑器。',
    tags: ['下拉编辑', '内联输入'], accent: '#8b5cf6', mock: 'editors', icon: 'edit',
  },
  {
    no: '05', route: 'virtual', title: '大数据量虚拟滚动',
    desc: '十万行级数据虚拟滚动渲染，流畅不卡顿。',
    tags: ['虚拟滚动', '性能'], accent: '#06b6d4', mock: 'virtual', icon: 'bolt',
  },
  {
    no: '06', route: 'formula', title: '公式编辑与函数助手',
    desc: '公式输入、函数提示、参数说明、引用高亮与计算结果。',
    tags: ['语法高亮', '函数补全'], accent: '#f59e0b', mock: 'formula', icon: 'fx',
  },
  {
    no: '07', route: 'data', title: '数据导入与导出',
    desc: 'Excel / CSV / JSON 导入，字段映射、预览与导出配置。',
    tags: ['拖拽上传', '字段映射'], accent: '#10b981', mock: 'io', icon: 'cloudUpload',
  },
  {
    no: '08', route: 'context', title: '右键菜单与快捷操作',
    desc: '单元格、行列区域上下文菜单，复制粘贴、插入删除与填充。',
    tags: ['上下文菜单', '填充序列'], accent: '#6366f1', mock: 'context', icon: 'menu',
  },
  {
    no: '09', route: 'filter', title: '数据筛选与排序',
    desc: '多字段筛选、条件组合、升降序排列与结果统计联动。',
    tags: ['多条件', '实时统计'], accent: '#14b8a6', mock: 'filter', icon: 'filter',
  },
  {
    no: '10', route: 'settings', title: '主题与个性化设置',
    desc: '浅色/深色主题、表格配色、字体行高与自定义工作区。',
    tags: ['深色模式', '实时预览'], accent: '#a855f7', mock: 'settings', icon: 'settings',
  },
  {
    no: '11', route: 'workbook', title: '工作簿与多工作表',
    desc: '新建、重命名、复制、隐藏、保护工作表与多工作簿切换。',
    tags: ['标签颜色', '工作表保护'], accent: '#3b82f6', mock: 'workbook', icon: 'folder',
  },
  {
    no: '12', route: 'charts', title: '图表与数据可视化',
    desc: '柱状、折线、饼图、组合图一键创建，样式与数据源配置。',
    tags: ['6 种图表', '原生 SVG'], accent: '#f97316', mock: 'charts', icon: 'chartCombo',
  },
  {
    no: '13', route: 'pivot', title: '数据透视表',
    desc: '字段拖拽布局、行列维度、值汇总与动态交叉分析。',
    tags: ['拖拽布局', '交叉汇总'], accent: '#0ea5e9', mock: 'pivot', icon: 'pivot',
  },
  {
    no: '14', route: 'review', title: '批注与协作审阅',
    desc: '单元格批注、评论线程、@提及、修改记录与审阅状态。',
    tags: ['评论线程', '@提及'], accent: '#ec4899', mock: 'review', icon: 'comment',
  },
  {
    no: '15', route: 'validate', title: '数据验证与智能输入',
    desc: '必填、数字范围、日期限制、下拉选项与批量数据校验。',
    tags: ['实时校验', '错误提示'], accent: '#ef4444', mock: 'validate', icon: 'shieldCheck',
  },
  {
    no: '16', route: 'engine', title: '引擎对接演示',
    desc: '<sheetx-grid> / <sheetx-spreadsheet> 真实引擎驱动的联调示例。',
    tags: ['Web Components', '真实引擎'], accent: '#22c55e', mock: 'engine', icon: 'rocket',
  },
  {
    no: '17', route: 'print', title: '打印预览与页面布局',
    desc: '纸张/方向/页边距/打印区域/分页符/页眉页脚配置与多页矢量预览。',
    tags: ['打印预览', '页面布局', '企业报表'], accent: '#2563eb', mock: 'print', icon: 'print',
  },
  {
    no: '18', route: 'format', title: '单元格格式与高级样式',
    desc: '数字格式/自定义格式代码/边框/填充/字体/对齐/合并与格式刷。',
    tags: ['数字格式', '样式排版', '格式刷'], accent: '#7c3aed', mock: 'format', icon: 'palette',
  },
  {
    no: '19', route: 'formula-lib', title: '公式函数库与公式管理器',
    desc: '函数分类/搜索/参数提示/示例/命名区域与公式错误诊断。',
    tags: ['函数库', '公式审核', '命名区域'], accent: '#0ea5e9', mock: 'formula-lib', icon: 'fx',
  },
  {
    no: '20', route: 'history', title: '撤销重做与历史版本管理',
    desc: '操作历史时间线/批量撤销/版本快照/版本对比与恢复，高频编辑数据安全。',
    tags: ['撤销重做', '版本快照', '数据安全'], accent: '#f59e0b', mock: 'history', icon: 'history',
  },
  {
    no: '21', route: 'import', title: '大数据导入与批量处理',
    desc: '百万级导入/字段映射/数据预览/后台进度/错误行定位与批量处理结果。',
    tags: ['百万级', '分批导入', '错误定位'], accent: '#22c55e', mock: 'import', icon: 'cloudUpload',
  },
  {
    no: '22', route: 'adv-filter', title: '多维数据筛选与高级查询',
    desc: '筛选条件组合/AND-OR 分组/跨字段查询/保存筛选方案与快速切换视图。',
    tags: ['条件组合', 'AND/OR', '方案保存'], accent: '#3b82f6', mock: 'adv-filter', icon: 'filter',
  },
  {
    no: '23', route: 'multi-view', title: '多视图与视图管理',
    desc: '同一数据在表格/卡片/看板/分组视图切换，个人视图保存与配置。',
    tags: ['多视图', '看板', '视图配置'], accent: '#14b8a6', mock: 'multi-view', icon: 'gridView',
  },
  {
    no: '24', route: 'plugins', title: '插件中心与扩展生态',
    desc: '插件市场 / 分类搜索 / 安装管理 / 开发者工具，展示编辑器、渲染器、数据适配器与第三方集成。',
    tags: ['插件市场', '扩展点', '可插拔架构'], accent: '#6366f1', mock: 'plugins', icon: 'puzzle',
  },
  {
    no: '25', route: 'properties', title: '属性设置与企业个性化',
    desc: '单元格 / 行列 / 数据 / 图表统一属性面板，支持宿主传入用户信息、主题与字体配置。',
    tags: ['统一属性面板', '宿主配置', '企业个性化'], accent: '#2563eb', mock: 'properties', icon: 'sliders',
  },
  {
    no: '26', route: 'host', title: '宿主系统集成与 API 调试',
    desc: '接入不同 ERP：数据接口适配 / 用户上下文 / 权限回调 / 主题字体 / 开放 API 在线调试。',
    tags: ['ERP 接入', '开放 API', '权限回调'], accent: '#0ea5e9', mock: 'host', icon: 'link',
  },
  {
    no: '27', route: 'datasource', title: '数据源适配与远程加载',
    desc: '对接 ERP 后端 API：远程分页 / 排序 / 筛选 / 懒加载 / 数据更新 / 错误处理，不内置数据库。',
    tags: ['远程分页', 'DataAdapter', '不内置数据库'], accent: '#2563eb', mock: 'datasource', icon: 'database',
  },
  {
    no: '28', route: 'edit', title: '数据编辑与事务提交',
    desc: '单元格/批量编辑、前端暂存、提交确认、接口响应、失败回滚与版本冲突，宿主负责持久化。',
    tags: ['事务提交', '失败回滚', '冲突处理'], accent: '#7c3aed', mock: 'edit', icon: 'edit',
  },
  {
    no: '29', route: 'permission', title: '数据权限与安全控制',
    desc: '列级权限 / 单元格只读 / 行级范围 / 编辑权限回调 / 敏感字段脱敏；最终判断由宿主 ERP 后端负责。',
    tags: ['列级权限', '脱敏', '宿主裁决'], accent: '#0891b2', mock: 'permission', icon: 'shield',
  },
  {
    no: '30', route: 'i18n', title: '国际化与多语言配置',
    desc: '8 语言切换 / 日期数字货币本地化 / 文本翻译 / RTL 镜像布局，SheetX 自带 i18n 不依赖宿主框架。',
    tags: ['8 语言', 'RTL', '自带 i18n'], accent: '#8b5cf6', mock: 'i18n', icon: 'globe',
  },
  {
    no: '32', route: 'keyboard', title: '快捷键与键盘操作',
    desc: 'Excel/WPS 快捷键兼容、自定义录入、冲突检测、键盘操作帮助，打造高效编辑体验。',
    tags: ['快捷键', '冲突检测', '高效编辑'], accent: '#2563eb', mock: 'keyboard', icon: 'gridView',
  },
  {
    no: '33', route: 'plugin-dev', title: '插件开发与扩展 API',
    desc: '插件注册 / 生命周期钩子 / 自定义编辑器与渲染器 / 工具栏按钮 / 事件订阅 / 插件调试。',
    tags: ['插件开发', '扩展 API', '第三方生态'], accent: '#7c5cff', mock: 'plugin-dev', icon: 'puzzle',
  },
  {
    no: '34', route: 'debug', title: '开发者调试与性能监控',
    desc: '帧率/内存/渲染耗时趋势、事件追踪、组件状态、Worker 与 API 调用日志，助第三方排查集成问题。',
    tags: ['性能监控', '事件追踪', '调试'], accent: '#0891b2', mock: 'debug', icon: 'chartLine',
  },
  {
    no: '35', route: 'embed', title: '嵌入式集成示例',
    desc: 'CDN / npm / Web Components 三种方式嵌入 Vue、React、原生 HTML，含初始化配置、数据绑定与事件回调。',
    tags: ['Vue/React/HTML', 'CDN/npm', '事件回调'], accent: '#2563eb', mock: 'embed', icon: 'link',
  },
  {
    no: '36', route: 'api-doc', title: '完整 API 文档中心',
    desc: '实例创建 / 数据接口 / 列配置 / 事件系统 / 编辑器与渲染器扩展 / TypeScript 类型定义。',
    tags: ['API 文档', '类型定义', '深度集成'], accent: '#4f46e5', mock: 'api-doc', icon: 'terminal',
  },
  {
    no: '37', route: 'playground-all', title: '综合功能 Playground',
    desc: 'Grid/Spreadsheet 双模式、数据编辑、公式联动、筛选排序、条件格式、主题与功能配置，无需接 ERP 即可完整体验。',
    tags: ['双模式', '公式联动', '在线体验'], accent: '#0ea5e9', mock: 'playground-all', icon: 'rocket',
  },
  {
    no: '38', route: 'dual-mode', title: 'Grid 与 Spreadsheet 双模式对比',
    desc: '同一套底层引擎的两种交互：左侧 ERP 风格业务数据网格，右侧 Excel 风格电子表格，双栏对比直观体验。',
    tags: ['双模式对比', 'ERP网格', 'Excel表格'], accent: '#059669', mock: 'dual-mode', icon: 'split',
  },
  {
    no: '39', route: 'engine-arch', title: '核心引擎架构可视化',
    desc: 'Data / Render / Interaction / Formula / Worker / Plugin / Adapter / State 八大模块关系图，展示如何共同支撑双模式。',
    tags: ['引擎架构', '八大模块', '双模式支撑'], accent: '#2563eb', mock: 'engine-arch', icon: 'settings',
  },
  {
    no: '40', route: 'render-arch', title: '技术选型与底层渲染架构',
    desc: 'TypeScript / Canvas 2D / DOM / Web Components / Worker / OffscreenCanvas / Vite 组合，主线程与后台线程任务分工。',
    tags: ['技术选型', 'Canvas+DOM', '线程分工'], accent: '#0891b2', mock: 'render-arch', icon: 'gridView',
  },
  {
    no: '41', route: 'virtual-scroll', title: '虚拟滚动与百万级数据性能',
    desc: '行列虚拟化、可视区域计算、动态行高、缓存与增量渲染，百万行数据保持 60 FPS 流畅交互。',
    tags: ['虚拟滚动', '百万级数据', '60 FPS'], accent: '#2563eb', mock: 'virtual-scroll', icon: 'rocket',
  },
  {
    no: '44', route: 'ai-assistant', title: 'AI 助手与智能数据分析',
    desc: '自然语言对话、上下文理解与智能摘要；可插拔 Provider（云端API/本地模型/企业服务），AI 变更预览确认与撤销。',
    tags: ['AI 助手', '可插拔 Provider', '预览确认撤销'], accent: '#8b5cf6', mock: 'ai-assistant', icon: 'sparkles',
  },
  {
    no: '45', route: 'ai-generate', title: 'AI 自然语言生成表格与业务数据',
    desc: '一句话理解业务场景、规划字段结构、生成模拟数据，插入前预览调整，支持批量生成与快速填充。',
    tags: ['自然语言生成', '场景模板', '预览插入'], accent: '#059669', mock: 'ai-generate', icon: 'sparkles',
  },
  {
    no: '46', route: 'ai-analysis', title: 'AI 数据分析：智能洞察与可视化',
    desc: '一键分析表格数据、识别业务趋势与异常，生成动态 SVG 图表与关键指标；一键导出分析报告、插入图表，或继续用自然语言追问。',
    tags: ['智能洞察', 'SVG 图表', '分析报告', '自然语言追问'], accent: '#059669', mock: 'ai-analysis', icon: 'sparkles',
  },
  {
    no: '47', route: 'ai-formula', title: 'AI 公式助手：智能生成与解释公式',
    desc: '自然语言生成 Excel 兼容公式，真实公式引擎求值预览，解释逻辑、推荐函数、诊断并一键修复错误，支持复制与插入表格。',
    tags: ['自然语言生成公式', '真实求值', '公式诊断修复'], accent: '#059669', mock: 'ai-formula', icon: 'sigma',
  },
  {
    no: '48', route: 'ai-chart', title: 'AI 智能图表生成与可视化',
    desc: '自然语言识别数据范围、自动选择合适图表类型，生成可编辑 SVG 图表与分析洞察；一键插入图表、生成报告，或继续追问。',
    tags: ['智能选图', '可编辑图表', '业务洞察', '分析报告'], accent: '#059669', mock: 'ai-chart', icon: 'chartCombo',
  },
]

export const HERO_STATS = [
  { value: '45', label: '高保真页面' },
  { value: '100%', label: '真实交互' },
  { value: 'SVG', label: '零依赖图表' },
  { value: 'Lit 3', label: 'Web Components' },
]
