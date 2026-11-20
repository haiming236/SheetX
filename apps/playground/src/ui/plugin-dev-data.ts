/**
 * SheetX 第 33 张 · 插件开发与扩展 API — 数据
 *
 * 重点体现面向第三方开发者的扩展能力：注册 / 生命周期 / 编辑器 / 渲染器 /
 * 工具栏 / 事件订阅 / 调试。插件市场 + 详情 + 代码运行 + 管理。
 */
import type { IconName } from './icons.js'

/** 左侧导航 */
export const LEFT_NAV: Array<{ key: string; label: string; icon: IconName }> = [
  { key: 'center', label: '插件中心', icon: 'gridView' },
  { key: 'market', label: '插件市场', icon: 'market' },
  { key: 'mine', label: '我的插件', icon: 'puzzle' },
  { key: 'develop', label: '插件开发', icon: 'code' },
  { key: 'manage', label: '插件管理', icon: 'settings' },
  { key: 'apidoc', label: 'API 文档', icon: 'terminal' },
  { key: 'devtools', label: '开发者工具', icon: 'bolt' },
]

/** 分类 */
export const CATEGORIES = ['全部', '数据处理', '图表增强', '办公效率', '可视化', '其他'] as const
export type Category = (typeof CATEGORIES)[number]

/** 插件项 */
export interface Plugin {
  id: string
  name: string
  desc: string
  icon: IconName
  color: string
  category: Exclude<Category, '全部'>
  rating: number
  installs: string
  author: string
  version: string
  abilities: string[]
  detail: string
}

export const PLUGINS: Plugin[] = [
  {
    id: 'qrcode', name: '二维码生成器', desc: '一键生成二维码，支持多种样式和批量生成',
    icon: 'gridView', color: '#7c5cff', category: '办公效率', rating: 4.9, installs: '6.3 万次安装', author: 'SheetX Team', version: '1.0.0',
    abilities: ['自定义工具栏按钮', '自定义单元格渲染', '监听表格事件', '扩展数据处理', '添加右键菜单', '使用宿主 API'],
    detail: '二维码生成器插件，支持文本、链接、WiFi、名片等多种类型的二维码生成，可自定义样式、颜色和尺寸，并支持批量生成。',
  },
  {
    id: 'excel-import', name: 'Excel 导入增强', desc: '更好的 Excel 导入体验，支持复杂格式解析',
    icon: 'file', color: '#16a34a', category: '数据处理', rating: 4.7, installs: '8.9 万次安装', author: 'DataWorks', version: '2.1.3',
    abilities: ['扩展数据处理', '自定义文件解析', '监听导入事件', '使用宿主 API'],
    detail: '增强 Excel 导入能力，支持复杂表格、合并单元格、多工作表与字段映射，大幅提升业务数据接入效率。',
  },
  {
    id: 'advanced-chart', name: '高级图表分析', desc: '提供更多专业图表类型和分析功能，支持数据洞察',
    icon: 'chartBar', color: '#2563eb', category: '图表增强', rating: 4.8, installs: '12.5 万次安装', author: 'ChartLab', version: '3.2.0',
    abilities: ['自定义单元格渲染', '扩展图表类型', '监听数据变更', '使用宿主 API'],
    detail: '提供瀑布图、桑基图、漏斗图等专业图表类型，支持数据洞察与交互式分析。',
  },
  {
    id: 'date-tools', name: '日期工具箱', desc: '日期计算、日期范围、工作日计算等实用工具',
    icon: 'calendar', color: '#ea580c', category: '办公效率', rating: 4.6, installs: '5.8 万次安装', author: 'ToolBox', version: '1.4.2',
    abilities: ['自定义编辑器', '自定义函数', '监听编辑事件'],
    detail: '提供日期计算、工作日推算、节假日识别、日期范围选择等实用工具。',
  },
  {
    id: 'translate', name: '翻译助手', desc: '支持多语言翻译，快速实现表格内容翻译',
    icon: 'globe', color: '#0891b2', category: '数据处理', rating: 4.5, installs: '4.2 万次安装', author: 'Lingo', version: '2.0.1',
    abilities: ['自定义工具栏按钮', '监听单元格事件', '使用宿主 API'],
    detail: '集成多语言翻译能力，可批量翻译表格内容，支持自动检测源语言。',
  },
  {
    id: 'code-highlight', name: '代码高亮', desc: '在单元格中展示代码，支持多种编程语言',
    icon: 'code', color: '#6366f1', category: '可视化', rating: 4.7, installs: '3.1 万次安装', author: 'DevTools', version: '1.1.0',
    abilities: ['自定义单元格渲染', '自定义编辑器'],
    detail: '在单元格中以语法高亮方式展示代码片段，支持主流编程语言与主题切换。',
  },
]

/** 详情标签 */
export const DETAIL_TABS = ['插件介绍', '功能特性', '使用说明', '版本历史'] as const
export type DetailTab = (typeof DETAIL_TABS)[number]

/** 已安装插件（管理表） */
export interface InstalledPlugin {
  id: string
  version: string
  enabled: boolean
  installedAt: string
}

export const INITIAL_INSTALLED: InstalledPlugin[] = [
  { id: 'qrcode', version: '1.0.0', enabled: true, installedAt: '2025-01-16 14:30:22' },
  { id: 'excel-import', version: '1.0.0', enabled: true, installedAt: '2025-01-15 09:12:18' },
]

/** 插件开发示例代码 */
export const PLUGIN_CODE = `import { registerPlugin } from 'sheetx'

registerPlugin({
  id: 'qrcode',
  name: '二维码生成器',
  version: '1.0.0',
  install: (app) => {
    app.addToolbarButton({
      icon: 'qrcode',
      title: '生成二维码',
      onClick: () => {
        // 打开二维码生成面板
      }
    })
    app.registerEditor('qrcode', QrcodeEditor)
    app.on('cell-change', handleChange)
  }
})`

/** 运行示例输出 */
export const RUN_OUTPUT = `[SheetX] 插件运行时 · qrcode v1.0.0
✓ registerPlugin() 注册成功
✓ install(app) 生命周期已执行
✓ addToolbarButton 注册 1 个按钮
✓ registerEditor('qrcode') 编辑器已注册
✓ on('cell-change') 事件订阅成功
→ 插件已就绪，等待用户交互`

/** 调试日志 */
export const DEBUG_LOGS = [
  { time: '14:32:08', level: 'INFO', msg: 'plugin:qrcode installed · v1.0.0' },
  { time: '14:31:55', level: 'INFO', msg: 'toolbar:button registered [qrcode]' },
  { time: '14:30:22', level: 'OK', msg: 'plugin:qrcode activated successfully' },
  { time: '14:28:10', level: 'WARN', msg: 'plugin:translate not installed (skipped)' },
]

/** 生命周期钩子（API 文档） */
export const LIFECYCLE_HOOKS = [
  { hook: 'install(app)', desc: '安装时执行一次，注册扩展点', event: 'plugin:install' },
  { hook: 'activate(ctx)', desc: '插件启用，获取运行时上下文', event: 'plugin:activate' },
  { hook: 'deactivate()', desc: '插件停用，释放资源', event: 'plugin:deactivate' },
  { hook: 'uninstall()', desc: '卸载，清理持久化状态', event: 'plugin:uninstall' },
]

/** 扩展点 */
export const EXTENSION_POINTS: Array<{ key: string; label: string; desc: string }> = [
  { key: 'editor', label: '自定义编辑器', desc: '注册单元格编辑 UI 与提交逻辑' },
  { key: 'renderer', label: '渲染器扩展', desc: '自定义绘制指令与图层' },
  { key: 'toolbar', label: '工具栏按钮', desc: '向顶部工具栏注入按钮' },
  { key: 'event', label: '事件订阅', desc: '监听表格生命周期与数据事件' },
  { key: 'formatter', label: '格式化器', desc: '自定义显示格式' },
  { key: 'dataAdapter', label: '数据适配器', desc: '接入第三方数据源' },
]

/** 底部标签 */
export const BOTTOM_TABS = ['插件管理', '开发者工具', '运行日志'] as const
export type BottomTab = (typeof BOTTOM_TABS)[number]

export interface FullConfig {
  selected: string
  category: Category
  query: string
  detailTab: DetailTab
  bottomTab: BottomTab
  installed: InstalledPlugin[]
}

export const DEFAULT_CONFIG: FullConfig = {
  selected: 'qrcode',
  category: '全部',
  query: '',
  detailTab: '插件介绍',
  bottomTab: '插件管理',
  installed: INITIAL_INSTALLED.map((p) => ({ ...p })),
}
