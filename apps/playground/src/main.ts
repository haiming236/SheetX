/**
 * SheetX Playground 入口
 *
 * 布局：body 为 flex 列 —— 顶部常驻 <global-nav>（17 个视图一键切换）+ #app 内容区。
 * 路由：URL hash，与顶部 tab 双向同步（点 tab 改 hash，hash 变更换页并回填高亮）。
 *
 *   #home（默认）  首页 · 设计稿导航中心
 *   #spreadsheet  01 · Spreadsheet 主工作界面
 *   #grid         02 · Grid 业务数据网格模式
 *   #sheet-full   03 · Spreadsheet 完整电子表格模式
 *   #editors      04 · 单元格编辑与业务下拉选择
 *   #virtual      05 · 大数据量与虚拟滚动
 *   #formula      06 · 公式编辑与函数助手
 *   #data         07 · 数据导入与导出
 *   #context      08 · 右键菜单与快捷操作
 *   #filter       09 · 数据筛选与排序
 *   #settings     10 · 主题与个性化设置
 *   #workbook     11 · 工作簿与多工作表管理
 *   #charts       12 · 图表与数据可视化
 *   #pivot        13 · 数据透视表
 *   #review       14 · 单元格批注与协作审阅
 *   #validate     15 · 数据验证与智能输入
 *   #engine       16 · 引擎对接演示（<sheetx-grid>/<sheetx-spreadsheet> 真实驱动）
 *   #print        17 · 打印预览与页面布局（真引擎图表 + 可打印 HTML）
 *   #format       18 · 单元格格式与高级样式（真引擎 formatValue + setCellStyle）
 *   #formula-lib  19 · 公式函数库与公式管理器（真引擎求值 + 错误诊断）
 *   #history      20 · 撤销重做与历史版本管理（mutation 栈 + 版本快照）
 *   #import       21 · 大数据导入与批量处理（分批让出主线程 + 错误行定位）
 *   #adv-filter   22 · 多维数据筛选与高级查询（AND/OR 分组 + 方案持久化）
 *   #multi-view   23 · 多视图与视图管理（同数据多视图 + 个人视图配置）
 *   #plugins      24 · 插件中心与扩展生态（市场 / 安装管理 / 扩展点 / 第三方集成）
 *   #properties   25 · 属性设置与企业个性化（统一属性面板 / 宿主用户信息·主题·字体）
 *   #host         26 · 宿主系统集成与开放 API 调试中心（ERP 接入 / 用户上下文 / 权限回调）
 *   #datasource   27 · 数据源适配与远程数据加载（远程分页 / 筛选 / 懒加载 / 不内置数据库）
 *   #edit         28 · 数据编辑与事务提交（单元格/批量编辑 / 暂存 / 确认 / 回滚 / 冲突）
 *   #permission   29 · 数据权限与安全控制（列级/单元格/行级/编辑回调/脱敏，宿主任判断）
 *   #i18n         30 · 国际化与多语言配置（8语言/格式本地化/文本翻译/RTL，自带i18n）
 *   #keyboard     32 · 快捷键与键盘操作管理（Excel/WPS兼容 / 自定义 / 冲突检测）
 *   #plugin-dev   33 · 插件开发与扩展 API（市场/详情代码运行/生命周期/调试）
 *   #debug        34 · 开发者调试与性能监控（帧率/内存/趋势图/事件日志/API统计）
 *   #embed        35 · 嵌入式集成示例（CDN/npm/WebComponents → Vue/React/HTML）
 *   #api-doc      36 · 完整 API 文档中心（实例/数据/列/事件/扩展/类型定义）
 *   #playground-all 37 · 综合功能 Playground（双模式/编辑/公式/筛选/主题/配置）
 *   #dual-mode     38 · Grid 与 Spreadsheet 双模式对比（ERP网格 / Excel电子表格）
 *   #engine-arch   39 · 核心引擎架构可视化（8模块 + 中心引擎 / 扩展生态 / 应用支持）
 *   #render-arch   40 · 技术选型与底层渲染架构（Canvas+DOM混合 / 主线程Worker分工 / 技术栈）
 *   #virtual-scroll 41 · 虚拟滚动与百万级数据性能（可视区计算/动态行高/缓存/增量渲染）
 *   #ai-assistant  44 · AI助手与智能数据分析（可插拔Provider/预览确认撤销，AI系列起点）
 *   #ai-generate  45 · AI自然语言生成表格与业务数据（场景模板/字段规划/预览插入撤销）
 *   #ai-analysis  46 · AI 数据分析：智能洞察与可视化（联动指标/SVG 组合图/洞察面板）
 *   #ai-formula   47 · AI 公式助手：自然语言生成公式、真实引擎求值、解释与诊断修复
 *   #ai-chart    48 · AI 智能图表生成与可视化：自然语言选图表类型/数据范围、可编辑图表、洞察报告
 */
import './ui/global-nav.js'
import './ui/home-app.js'
import './ui/sheetx-app.js'
import './ui/grid-app.js'
import './ui/full-app.js'
import './ui/editors-app.js'
import './ui/virtual-app.js'
import './ui/formula-app.js'
import './ui/io-app.js'
import './ui/context-app.js'
import './ui/filter-app.js'
import './ui/settings-app.js'
import './ui/workbook-app.js'
import './ui/chart-app.js'
import './ui/pivot-app.js'
import './ui/review-app.js'
import './ui/validation-app.js'
import './ui/engine-app.js'
import './ui/print-app.js'
import './ui/fmt-app.js'
import './ui/formula-lib-app.js'
import './ui/history-app.js'
import './ui/import-app.js'
import './ui/advfilter-app.js'
import './ui/multiview-app.js'
import './ui/plugin-app.js'
import './ui/props-app.js'
import './ui/host-app.js'
import './ui/datasource-app.js'
import './ui/edit-app.js'
import './ui/permission-app.js'
import './ui/i18n-app.js'
import './ui/keyboard-app.js'
import './ui/plugin-dev-app.js'
import './ui/debug-app.js'
import './ui/embed-app.js'
import './ui/api-doc-app.js'
import './ui/playground-all-app.js'
import './ui/dual-mode-app.js'
import './ui/engine-arch-app.js'
import './ui/render-arch-app.js'
import './ui/virtual-scroll-app.js'
import './ui/ai-assistant-app.js'
import './ui/ai-generate-app.js'
import './ui/ai-analysis-app.js'
import './ui/ai-formula-app.js'
import './ui/ai-chart-app.js'
import { initTheme } from './ui/theme.js'

const app = document.getElementById('app') ?? document.body

/** hash → 自定义元素标签（新增视图只需在此登记一行） */
const ROUTES: Record<string, string> = {
  spreadsheet: 'sheetx-app',
  grid: 'grid-app',
  'sheet-full': 'full-app',
  editors: 'editors-app',
  virtual: 'virtual-app',
  formula: 'formula-app',
  data: 'io-app',
  context: 'context-app',
  filter: 'filter-app',
  settings: 'settings-app',
  workbook: 'workbook-app',
  charts: 'chart-app',
  pivot: 'pivot-app',
  review: 'review-app',
  validate: 'validation-app',
  engine: 'engine-app',
  print: 'print-app',
  format: 'fmt-app',
  'formula-lib': 'formula-lib-app',
  history: 'history-app',
  import: 'import-app',
  'adv-filter': 'advfilter-app',
  'multi-view': 'multiview-app',
  plugins: 'plugin-app',
  properties: 'props-app',
  host: 'host-app',
  datasource: 'datasource-app',
  edit: 'edit-app',
  permission: 'permission-app',
  i18n: 'i18n-app',
  keyboard: 'keyboard-app',
  'plugin-dev': 'plugin-dev-app',
  debug: 'debug-app',
  embed: 'embed-app',
  'api-doc': 'api-doc-app',
  'playground-all': 'playground-all-app',
  'dual-mode': 'dual-mode-app',
  'engine-arch': 'engine-arch-app',
  'render-arch': 'render-arch-app',
  'virtual-scroll': 'virtual-scroll-app',
  'ai-assistant': 'ai-assistant-app',
  'ai-generate': 'ai-generate-app',
  'ai-analysis': 'ai-analysis-app',
  'ai-formula': 'ai-formula-app',
  'ai-chart': 'ai-chart-app',
}

const TITLES: Record<string, string> = {
  home: '首页',
  spreadsheet: '主工作界面',
  grid: '业务数据网格',
  'sheet-full': '完整电子表格',
  editors: '单元格编辑器',
  virtual: '大数据量虚拟滚动',
  formula: '公式编辑与函数助手',
  data: '数据导入与导出',
  context: '右键菜单与快捷操作',
  filter: '数据筛选与排序',
  settings: '主题与个性化设置',
  workbook: '工作簿与多工作表',
  charts: '图表与数据可视化',
  pivot: '数据透视表',
  review: '批注与协作审阅',
  validate: '数据验证与智能输入',
  engine: '引擎对接演示',
  print: '打印预览与页面布局',
  format: '单元格格式与高级样式',
  'formula-lib': '公式函数库与公式管理器',
  history: '撤销重做与历史版本管理',
  import: '大数据导入与批量处理',
  'adv-filter': '多维数据筛选与高级查询',
  'multi-view': '多视图与视图管理',
  plugins: '插件中心与扩展生态',
  properties: '属性设置与企业个性化',
  host: '宿主系统集成与 API 调试',
  datasource: '数据源适配与远程数据加载',
  edit: '数据编辑与事务提交',
  permission: '数据权限与安全控制',
  i18n: '国际化与多语言配置',
  keyboard: '快捷键与键盘操作管理',
  'plugin-dev': '插件开发与扩展 API',
  debug: '开发者调试与性能监控',
  embed: '嵌入式集成示例',
  'api-doc': '完整 API 文档中心',
  'playground-all': '综合功能 Playground',
  'dual-mode': '双模式对比体验',
  'engine-arch': '核心引擎架构',
  'render-arch': '技术选型与渲染架构',
  'virtual-scroll': '虚拟滚动与百万级数据性能',
  'ai-assistant': 'AI 助手与智能数据分析',
  'ai-generate': 'AI 自然语言生成表格',
  'ai-analysis': 'AI 数据分析与可视化',
  'ai-formula': 'AI 公式助手',
  'ai-chart': 'AI 智能图表生成与可视化',
}

/** 顶部全局导航（body flex 列的第 1 行；只创建一次，hashchange 只换 #app 内容） */
const nav = document.createElement('global-nav')
if (!document.querySelector('global-nav')) document.body.insertBefore(nav, app)

const RECENT_KEY = 'sx:recent'

/** 记录最近访问（首页「最近访问」区读取） */
function recordRecent(mode: string): void {
  if (mode === 'home') return
  try {
    const list: string[] = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')
    const next = [mode, ...list.filter((item) => item !== mode)].slice(0, 5)
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {
    /* 隐私模式/禁用存储时忽略 */
  }
}

/** 递归穿透 shadow DOM 找当前页顶栏搜索框（各页都在 .search-box 内） */
function findSearchInput(root: Document | ShadowRoot): HTMLInputElement | null {
  const direct = root.querySelector<HTMLInputElement>('.search-box input, input[type="search"]')
  if (direct) return direct
  for (const element of root.querySelectorAll('*')) {
    if (element.shadowRoot) {
      const found = findSearchInput(element.shadowRoot)
      if (found) return found
    }
  }
  return null
}

/** 视图顺序（快捷键 Alt+1..9 使用） */
const ROUTE_ORDER = ['home', ...Object.keys(ROUTES)]

function setupShortcuts(): void {
  window.addEventListener('keydown', (event) => {
    const mod = event.ctrlKey || event.metaKey

    // Ctrl/Cmd+F：聚焦当前页搜索框（浏览器原生查找被替换为页内搜索）
    if (mod && event.key.toLowerCase() === 'f') {
      const input = findSearchInput(document)
      if (input) {
        event.preventDefault()
        input.focus()
        input.select()
      }
      return
    }

    // Alt+1..9：跳转到第 N 个视图
    if (event.altKey && !mod && /^[1-9]$/.test(event.key)) {
      const route = ROUTE_ORDER[Number(event.key) - 1]
      if (route) {
        event.preventDefault()
        location.hash = `#${route}`
      }
    }
  })
}

function render(): void {
  const mode = location.hash.replace('#', '') || 'home'
  const tag = ROUTES[mode] ?? 'home-app'
  // 同一视图重复渲染会销毁页面内部状态（主题/展开的面板等），仅在标签真正变化时重建
  const current = app.firstElementChild?.tagName.toLowerCase()
  if (current === tag) return
  app.innerHTML = `<${tag}></${tag}>`
  document.title = `SheetX · ${TITLES[mode] ?? 'UI Design'}`
  recordRecent(ROUTES[mode] ? mode : '')
}

window.addEventListener('hashchange', render)
initTheme()
setupShortcuts()
render()

