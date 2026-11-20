/**
 * SheetX 第 32 张 · 快捷键与键盘操作管理 — 数据
 *
 * 重点：Excel / WPS 快捷键兼容 + 自定义 + 冲突检测 + 键盘操作帮助，体现高效编辑体验。
 * 边界：本页是「配置管理 UI」，真实全局快捷键由 main.ts 管理（Alt+1..9 / Ctrl+F），
 * 不在此页重复劫持浏览器键盘事件，避免与演示壳冲突。
 */
import type { IconName } from './icons.js'

/** 设置中心侧栏 */
export const SETTING_NAV: Array<{ key: string; label: string; icon: IconName }> = [
  { key: 'general', label: '通用设置', icon: 'settings' },
  { key: 'theme', label: '主题定制', icon: 'palette' },
  { key: 'font', label: '字体管理', icon: 'textT' },
  { key: 'layout', label: '布局设置', icon: 'gridView' },
  { key: 'shortcut', label: '快捷键', icon: 'gridView' },
  { key: 'advanced', label: '高级设置', icon: 'sliders' },
  { key: 'about', label: '关于 SheetX', icon: 'infoCircle' },
]

/** 分类标签 */
export const SHORTCUT_TABS = ['常用快捷键', '编辑操作', '表格操作', '视图操作', '公式与函数', '其他操作'] as const
export type ShortcutTab = (typeof SHORTCUT_TABS)[number]

/** 快捷键项 */
export interface Shortcut {
  id: string
  name: string
  icon: IconName
  keys: string[]
  desc: string
  /** Excel/WPS 兼容 */
  excel: boolean
}

/** 常用快捷键（设计稿 13 条） */
export const COMMON_SHORTCUTS: Shortcut[] = [
  { id: 'copy', name: '复制', icon: 'copy', keys: ['Ctrl', 'C'], desc: '复制选中内容', excel: true },
  { id: 'cut', name: '剪切', icon: 'scissors', keys: ['Ctrl', 'X'], desc: '剪切选中内容', excel: true },
  { id: 'paste', name: '粘贴', icon: 'paste', keys: ['Ctrl', 'V'], desc: '粘贴内容', excel: true },
  { id: 'undo', name: '撤销', icon: 'undo', keys: ['Ctrl', 'Z'], desc: '撤销上一步操作', excel: true },
  { id: 'redo', name: '重做', icon: 'redo', keys: ['Ctrl', 'Y'], desc: '重做下一步操作', excel: true },
  { id: 'selectAll', name: '全选', icon: 'gridView', keys: ['Ctrl', 'A'], desc: '全选表格', excel: true },
  { id: 'bold', name: '加粗', icon: 'bold', keys: ['Ctrl', 'B'], desc: '加粗字体', excel: true },
  { id: 'italic', name: '斜体', icon: 'italic', keys: ['Ctrl', 'I'], desc: '斜体字体', excel: true },
  { id: 'underline', name: '下划线', icon: 'underline', keys: ['Ctrl', 'U'], desc: '下划线', excel: true },
  { id: 'find', name: '查找', icon: 'search', keys: ['Ctrl', 'F'], desc: '查找内容', excel: true },
  { id: 'replace', name: '替换', icon: 'refresh', keys: ['Ctrl', 'H'], desc: '替换内容', excel: true },
  { id: 'save', name: '保存', icon: 'download', keys: ['Ctrl', 'S'], desc: '保存文件', excel: true },
  { id: 'print', name: '打印', icon: 'print', keys: ['Ctrl', 'P'], desc: '打印表格', excel: true },
]

/** 其它分类快捷键 */
export const CATEGORY_SHORTCUTS: Record<Exclude<ShortcutTab, '常用快捷键'>, Shortcut[]> = {
  '编辑操作': [
    { id: 'editCell', name: '编辑单元格', icon: 'edit', keys: ['F2'], desc: '进入编辑模式', excel: true },
    { id: 'commit', name: '提交并下移', icon: 'arrowDown', keys: ['Enter'], desc: '提交编辑并移到下一行', excel: true },
    { id: 'commitRight', name: '提交并右移', icon: 'arrowRight', keys: ['Tab'], desc: '提交编辑并移到右侧', excel: true },
    { id: 'cancelEdit', name: '取消编辑', icon: 'close', keys: ['Esc'], desc: '放弃当前编辑', excel: true },
    { id: 'fillDown', name: '向下填充', icon: 'arrowDown', keys: ['Ctrl', 'D'], desc: '向上复制内容填充', excel: true },
    { id: 'del', name: '清除内容', icon: 'eraser', keys: ['Delete'], desc: '清除选中单元格内容', excel: true },
    { id: 'insertRow', name: '插入行', icon: 'plus', keys: ['Ctrl', '+'], desc: '在选中位置插入行', excel: true },
  ],
  '表格操作': [
    { id: 'insertRow2', name: '插入行', icon: 'plus', keys: ['Ctrl', '+'], desc: '插入新行', excel: true },
    { id: 'deleteRow', name: '删除行', icon: 'trash', keys: ['Ctrl', '-'], desc: '删除选中行', excel: true },
    { id: 'merge', name: '合并单元格', icon: 'merge', keys: ['Alt', 'M'], desc: '合并选中区域', excel: false },
    { id: 'freeze', name: '冻结窗格', icon: 'freeze', keys: ['Alt', 'W', 'F'], desc: '冻结当前行列', excel: true },
    { id: 'sort', name: '排序', icon: 'sort', keys: ['Alt', 'S'], desc: '按当前列排序', excel: false },
    { id: 'filter', name: '筛选', icon: 'filter', keys: ['Ctrl', 'Shift', 'L'], desc: '切换筛选', excel: true },
  ],
  '视图操作': [
    { id: 'zoomIn', name: '放大', icon: 'zoomIn', keys: ['Ctrl', '+'], desc: '放大视图', excel: false },
    { id: 'zoomOut', name: '缩小', icon: 'zoomOut', keys: ['Ctrl', '-'], desc: '缩小视图', excel: false },
    { id: 'fullscreen', name: '全屏', icon: 'fullscreen', keys: ['F11'], desc: '切换全屏显示', excel: false },
    { id: 'nextSheet', name: '下一工作表', icon: 'arrowRight', keys: ['Ctrl', 'PageDown'], desc: '切换到下一个工作表', excel: true },
    { id: 'prevSheet', name: '上一工作表', icon: 'arrowLeft', keys: ['Ctrl', 'PageUp'], desc: '切换到上一个工作表', excel: true },
  ],
  '公式与函数': [
    { id: 'formula', name: '插入函数', icon: 'fx', keys: ['Shift', 'F3'], desc: '打开函数助手', excel: true },
    { id: 'autosum', name: '自动求和', icon: 'sigma', keys: ['Alt', '='], desc: '插入 SUM 公式', excel: true },
    { id: 'expand', name: '展开引用', icon: 'chevronRight', keys: ['F4'], desc: '切换相对/绝对引用', excel: true },
    { id: 'calc', name: '重算全部', icon: 'refresh', keys: ['F9'], desc: '重新计算所有公式', excel: true },
  ],
  '其他操作': [
    { id: 'help', name: '帮助', icon: 'help', keys: ['F1'], desc: '打开帮助文档', excel: false },
    { id: 'comment', name: '插入批注', icon: 'comment', keys: ['Shift', 'F2'], desc: '添加单元格批注', excel: true },
    { id: 'hide', name: '隐藏行/列', icon: 'eye', keys: ['Ctrl', '0'], desc: '隐藏选中行或列', excel: true },
    { id: 'unhide', name: '取消隐藏', icon: 'eye', keys: ['Ctrl', 'Shift', '0'], desc: '显示隐藏的行或列', excel: true },
  ],
}

/** 自定义功能下拉 */
export const CUSTOM_ACTIONS = [
  '导出为 Excel', '导出为 PDF', '打印预览', '插入批注', '数据校验', '切换主题',
]

/** 内置冲突 */
export interface Conflict {
  keys: string[]
  title: string
  detail: string
  suggest: string[]
}

export const INITIAL_CONFLICTS: Conflict[] = [
  {
    keys: ['Ctrl', 'P'], title: 'Ctrl + P 已被浏览器用于打印',
    detail: '建议更换为以下组合，避免与系统快捷键冲突：', suggest: ['Ctrl', 'Shift', 'P'],
  },
]

/** 小贴士 */
export const TIPS: Array<{ text: string; icon: IconName }> = [
  { text: 'Ctrl + 鼠标滚轮：缩放表格', icon: 'zoomIn' },
  { text: 'Shift + 方向键：快速选择区域', icon: 'arrowRight' },
  { text: 'Alt + Enter：单元格内换行', icon: 'edit' },
]

/** 快捷键说明契约（高效编辑体现） */
export const KEYBOARD_CONTRACT = `// SheetX 键盘系统（Input Engine）原生支持 Excel / WPS 习惯
// 1. 状态机：Idle → Select → Edit(IME Composing) → Commit
// 2. 编辑提交后焦点按 Enter↓ / Tab→ 移动，符合 Excel 习惯
// 3. IME 组合期间不提交，compositionend 后提交一次
// 4. 快捷键通过 Command 执行，全部可撤销

// 内置快捷键可直接用，且与宿主框架键盘事件隔离
// 自定义快捷键由 ShortcutRegistry 注册，注册时做冲突检测：
sheet.registerShortcut({
  id: 'export-excel',
  keys: ['Ctrl', 'Shift', 'E'],
  action: () => sheet.exportXlsx(),
  scope: 'grid',   // grid | sheet | global
})

// 冲突检测：与内置键位 / 浏览器保留键（Ctrl+P / Ctrl+W 等）冲突时拒绝注册`

export interface FullConfig {
  enabled: boolean
  custom: Record<string, string[]>
  resolvedConflicts: string[]
  activeTab: ShortcutTab
}

export const DEFAULT_CONFIG: FullConfig = {
  enabled: true,
  custom: {},
  resolvedConflicts: [],
  activeTab: '常用快捷键',
}

/** 键位显示格式化 */
export function keysLabel(keys: string[]): string {
  return keys.join(' + ')
}
