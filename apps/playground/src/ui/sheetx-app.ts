/**
 * SheetX 主工作界面（第 01 张设计稿 · Spreadsheet 模式）
 *
 * 纯 UI 外壳：引擎未接入前用 mock 数据 + DOM 表格展示。
 * 后续由 @sheetx/web-component + @sheetx/grid / spreadsheet 替换数据与渲染。
 *
 * 交互闭环（本文件负责）：
 * - 顶部菜单栏 / 工具栏下拉（字体、字号、数字格式、条件格式、筛选、排序）真实弹出并生效
 * - 排序、筛选、条件格式作用于演示数据，状态栏统计随之更新
 * - 单元格双击内联编辑，公式栏与选中单元格双向同步
 * - 工作表标签可切换/新增，属性面板可改字体字号与对齐
 */
import { LitElement, html, nothing, type TemplateResult } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { baseStyles, lightTokens } from './tokens.js'
import { bindPageTheme, toggleTheme as toggleGlobalTheme } from './theme.js'
import { appStyles } from './app-styles.js'
import { sxIcon, sxLogo } from './icons.js'
import { demoColumns, navMenus, sheetTabs, computeStats, type DemoRow } from './mock-data.js'
import { openMenu, type MenuItem } from './popover.js'
import { SheetXFonts } from '@sheetx/fonts'
import { installFontAssets } from './font-assets.js'
import { store, useStore } from './store.js'

type NumberFormat = '常规' | '数值' | '货币' | '百分比' | '日期'
type CondRule = 'none' | 'high' | 'low'
type SortKey = 'amount' | 'rate' | null
type FilterRate = 'all' | 'high' | 'low'

/** 单元格样式（只存被显式设置过的字段，未设置则用默认） */
interface CellStyle {
  fontFamily?: string
  fontSize?: number
  bold?: boolean
  italic?: boolean
  underline?: boolean
  color?: string
  numberFormat?: NumberFormat
  decimals?: number
  vAlign?: 'top' | 'middle' | 'bottom'
}

/** 把界面上的字体名（显示名或逻辑名）解析成 CSS font-family 栈 */
function resolveCssFamilyByName(name: string): string {
  const hit = SheetXFonts.getAvailableFonts().find((font) => font.displayName === name || font.family === name)
  if (hit) return SheetXFonts.resolveCssFamily(hit.family)
  return `'${name}', Inter, 'Source Han Sans CN', 'PingFang SC', 'Microsoft YaHei', sans-serif`
}

/** 字体菜单：优先取 @sheetx/fonts 注册表，未注册时回退系统字体 */
function availableFontFamilies(): string[] {
  const registered = SheetXFonts.getAvailableFonts().map((font) => font.displayName ?? font.family)
  return registered.length > 0 ? registered : ['思源宋体', '思源黑体', 'Inter', '苹方', '微软雅黑']
}
const FONT_SIZES = [10, 11, 12, 14, 16, 18, 20, 24]
const NUMBER_FORMATS: NumberFormat[] = ['常规', '数值', '货币', '百分比', '日期']

/** 默认铺满的行数（含第 1 行列标题），不足补空行；超出则按数据行数展示 */
const TOTAL_ROWS = 200
/** 额外空列数量（数据列之外），使表格横向可滚动（像 Excel 一样右侧留大量空列） */
const FILLER_COLS = 20
/** 空列宽度（px，未缩放） */
const FILLER_COL_WIDTH = 108


@customElement('sheetx-app')
export class SheetXApp extends LitElement {
  static styles = [baseStyles, lightTokens, appStyles]

  @state() private theme: 'light' | 'dark' = 'light'
  @state() private activeMenu = '开始'
  @state() private activeSheet = '销售数据'
  @state() private sheetNames: string[] = [...sheetTabs]
  /** 各工作表独立数据；"销售数据"仍走全局 store（跨页同步），其余为本地独立表格 */
  @state() private sheetData: Record<string, DemoRow[]> = {}
  /** 隐藏的工作表（WPS 风格右键：隐藏/取消隐藏） */
  @state() private hiddenSheets: string[] = []
  /** 工作表标签颜色 */
  @state() private sheetColors: Record<string, string> = {}
  /** 受保护的工作表（禁止编辑） */
  @state() private protectedSheets: string[] = []
  /** 新建工作表是空表格（仅空白行，不复制任何数据） */
  @state() private selectedCell = { row: 0, col: 1 }
  /** 选区锚点（拖拽/Shift 扩展的起点）；与 selectedCell(焦点) 共同组成矩形选区 */
  @state() private anchorCell = { row: 0, col: 1 }
  /** 正在拖拽框选 */
  private dragging = false
  /** 正在横向拖选列头 */
  private colSelecting = false
  /** 正在纵向拖选行号 */
  private rowSelecting = false
  /** 整行/整列选择模式 */
  @state() private selectMode: 'cell' | 'row' | 'col' | 'all' = 'cell'
  @state() private inspectorVisible = true
  @state() private inspectorTab: '格式' | '数据' | '高级' = '格式'
  @state() private zoom = 100
  @state() private alignMode: 'left' | 'center' | 'right' | 'justify' = 'center'
  /** 每个单元格独立对齐（key = `${row}-${col}`），覆盖列默认对齐 */
  @state() private cellAlign: Record<string, 'left' | 'center' | 'right' | 'justify'> = {}
  /** 列顺序（列拖拽重排），存的是 demoColumns 的原始索引 */
  @state() private columnOrder: number[] = demoColumns.map((_, i) => i)
  @state() private dragCol: number | null = null
  @state() private dragOverCol: number | null = null
  /** 合并单元格：key = `${row}-${col}`，value = 横向合并列数 */
  @state() private merges: Record<string, { rs: number; cs: number }> = {}
  /** 小数位（货币/百分比/数值格式共用） */
  @state() private decimals = 1
  /** 单元格填充色：key = `${row}-${col}` */
  @state() private fills: Record<string, string> = {}
  /** 数据验证规则：key = `${row}-${col}`，value = { type, min?, max? } */
  @state() private validations: Record<string, { type: 'int' | 'decimal' | 'date'; min?: number; max?: number }> = {}
  /** 列宽覆盖（列索引 → 像素宽，未缩放基准）；为空时用默认列宽 */
  @state() private colWidths: Record<number, number> = {}
  /** 行高覆盖（行索引 → 像素高，未缩放基准） */
  @state() private rowHeights: Record<number, number> = {}
  /** 拖拽调整中的提示信息 */
  @state() private resizing = ''
  /** 内部剪贴板（右键复制/剪切/粘贴） */
  private clipboard: { row: DemoRow; key: string } | null = null
  /** 撤销/重做栈（存 sales 快照） */
  private undoStack: DemoRow[][] = []
  private redoStack: DemoRow[][] = []
  /** 视图状态快照栈（与 undoStack 同步长度） */
  private viewUndoStack: Array<{ merges: Record<string, { rs: number; cs: number }>; fills: Record<string, string>; cellAlign: Record<string, 'left' | 'center' | 'right' | 'justify'>; cellStyles: Record<string, CellStyle> }> = []
  private viewRedoStack: Array<{ merges: Record<string, { rs: number; cs: number }>; fills: Record<string, string>; cellAlign: Record<string, 'left' | 'center' | 'right' | 'justify'>; cellStyles: Record<string, CellStyle> }> = []
  @state() private historyTick = 0
  @state() private cellType = '文本'

  /** 当前是否为"整列选择"模式（列头高亮用） */
  private get selModeIsCol(): boolean { return this.selectMode === 'col' }

  /** 内置字体是否已加载完成 */
  @state() private fontsReady = false
  /** 是否已选中单元格（未选中时任何属性操作都不生效） */
  @state() private hasSelection = false
  /** 每个单元格的样式（key=`row-col`）；未设置的格子回落到默认值 */
  @state() private cellStyles: Record<string, CellStyle> = {}

  @state() private numberFormat: NumberFormat = '常规'
  @state() private condRule: CondRule = 'none'
  @state() private sortKey: SortKey = null
  @state() private sortDir: 'asc' | 'desc' = 'asc'
  @state() private filterRate: FilterRate = 'all'
  @state() private frozen = false
  @state() private viewMode: 'grid' | 'card' = 'grid'
  @state() private editing: { row: number; col: number } | null = null
  @state() private editValue = ''
  @state() private statusMessage = '就绪'

  constructor() {
    super()
    // 数据来自全局 store：其他页面的增删改会即时反映到这里（反之亦然）
    useStore(this)
    try {
      const raw = localStorage.getItem('sx:main-columns')
      if (raw) {
        const order = JSON.parse(raw) as number[]
        if (Array.isArray(order) && order.length === demoColumns.length && order.every((n) => typeof n === 'number')) {
          this.columnOrder = order
        }
      }
      const savedZoom = Number(localStorage.getItem('sx:main-zoom'))
      if (savedZoom >= 50 && savedZoom <= 150) this.zoom = savedZoom
      const savedSizes = JSON.parse(localStorage.getItem('sx:main-sizes') || '{}')
      if (savedSizes.colWidths) this.colWidths = savedSizes.colWidths
      if (savedSizes.rowHeights) this.rowHeights = savedSizes.rowHeights
      // 本地工作表（新增的空白表及其数据）
      const savedSheets = JSON.parse(localStorage.getItem('sx:main-sheet-data') || '{}')
      if (Array.isArray(savedSheets.names) && savedSheets.names.length > 0) this.sheetNames = savedSheets.names
      if (savedSheets.data && typeof savedSheets.data === 'object') this.sheetData = savedSheets.data
      if (Array.isArray(savedSheets.hidden)) this.hiddenSheets = savedSheets.hidden
      if (savedSheets.colors && typeof savedSheets.colors === 'object') this.sheetColors = savedSheets.colors
      if (Array.isArray(savedSheets.protected)) this.protectedSheets = savedSheets.protected
    } catch { /* 忽略 */ }
  }

  private saveSizes(): void {
    try {
      localStorage.setItem('sx:main-sizes', JSON.stringify({ colWidths: this.colWidths, rowHeights: this.rowHeights }))
    } catch { /* 忽略 */ }
  }

  /** 列宽拖拽：在列头右边缘按下，跟随鼠标水平移动 */
  private startColResize(event: PointerEvent, ci: number, baseWidth: number): void {
    event.preventDefault()
    event.stopPropagation()
    const startX = event.clientX
    const scale = this.zoom / 100
    const move = (e: PointerEvent) => {
      const next = Math.max(48, Math.round(baseWidth + (e.clientX - startX) / scale))
      this.colWidths = { ...this.colWidths, [ci]: next }
      this.resizing = `列 ${this.colLabel(ci)} 宽度：${next}px`
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      document.body.style.cursor = ''
      this.saveSizes()
      this.notify(this.resizing)
      this.resizing = ''
    }
    document.body.style.cursor = 'col-resize'
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  /** 行高拖拽：在行号下边缘按下，跟随鼠标垂直移动 */
  private startRowResize(event: PointerEvent, ri: number, baseHeight: number): void {
    event.preventDefault()
    event.stopPropagation()
    const startY = event.clientY
    const scale = this.zoom / 100
    const move = (e: PointerEvent) => {
      const next = Math.max(18, Math.round(baseHeight + (e.clientY - startY) / scale))
      this.rowHeights = { ...this.rowHeights, [ri]: next }
      this.resizing = `第 ${ri + 2} 行高：${next}px`
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      document.body.style.cursor = ''
      this.saveSizes()
      this.notify(this.resizing)
      this.resizing = ''
    }
    document.body.style.cursor = 'row-resize'
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  private saveZoom(): void {
    try { localStorage.setItem('sx:main-zoom', String(this.zoom)) } catch { /* 忽略 */ }
  }

  /** 缩放写入表格 zoom 属性（等比重排，保持列宽自适应铺满） */
  private setZoom(value: number): void {
    void this.selectedCellCount
    void this.selectionAddress
    void this.selectionSum
    this.zoom = Math.max(50, Math.min(150, Math.round(value)))
    this.saveZoom()
  }

  private saveColumnOrder(): void {
    try { localStorage.setItem('sx:main-columns', JSON.stringify(this.columnOrder)) } catch { /* 忽略 */ }
  }

  /** 当前工作表数据：销售数据走全局 store（跨页同步），其余工作表各自独立 */
  private get rows(): DemoRow[] {
    if (this.activeSheet === '销售数据') return store.snapshot().sales
    return this.sheetData[this.activeSheet] ?? []
  }

  /** 写入当前工作表：销售数据写回全局 store，其余写本地并触发刷新 */
  private writeRows(rows: DemoRow[]): void {
    if (this.activeSheet === '销售数据') {
      store.replaceSales(rows)
    } else {
      this.sheetData = { ...this.sheetData, [this.activeSheet]: rows }
      this.saveSheetData()
      this.requestUpdate()
    }
  }

  /** 保存本地工作表数据（不含销售数据，它由 store 持久化） */
  private saveSheetData(): void {
    try {
      const local = Object.fromEntries(
        Object.entries(this.sheetData).filter(([name]) => name !== '销售数据'),
      )
      localStorage.setItem('sx:main-sheet-data', JSON.stringify({
        names: this.sheetNames,
        data: local,
        hidden: this.hiddenSheets,
        colors: this.sheetColors,
        protected: this.protectedSheets,
      }))
    } catch { /* 忽略 */ }
  }

  /* ---------------- 派生数据 ---------------- */

  /** 筛选 + 排序后的可见行 */
  private get visibleRows(): DemoRow[] {
    let rows = this.rows
    if (this.filterRate === 'high') rows = rows.filter((row) => row.rate >= 80)
    if (this.filterRate === 'low') rows = rows.filter((row) => row.rate < 80)
    if (this.sortKey) {
      const dir = this.sortDir === 'asc' ? 1 : -1
      const key = this.sortKey
      rows = [...rows].sort((a, b) => (a[key] - b[key]) * dir)
    }
    return rows
  }


  private get selectedRow(): DemoRow | undefined {
    return this.visibleRows[this.selectedCell.row]
  }

  /** 选区矩形边界（含焦点与锚点，行列均归一化为 min/max） */
  private get selRect(): { r1: number; r2: number; c1: number; c2: number } {
    if (this.selectMode === 'all') {
      return { r1: 0, r2: Math.max(TOTAL_ROWS - 2, this.visibleRows.length - 1), c1: 0, c2: this.columnOrder.length + FILLER_COLS - 1 }
    }
    if (this.selectMode === 'row') {
      return {
        r1: Math.min(this.anchorCell.row, this.selectedCell.row),
        r2: Math.max(this.anchorCell.row, this.selectedCell.row),
        c1: 0,
        c2: this.columnOrder.length + FILLER_COLS - 1,
      }
    }
    if (this.selectMode === 'col') {
      return {
        r1: 0,
        r2: Math.max(TOTAL_ROWS - 2, this.visibleRows.length - 1),
        c1: Math.min(this.anchorCell.col, this.selectedCell.col),
        c2: Math.max(this.anchorCell.col, this.selectedCell.col),
      }
    }
    return {
      r1: Math.min(this.anchorCell.row, this.selectedCell.row),
      r2: Math.max(this.anchorCell.row, this.selectedCell.row),
      c1: Math.min(this.anchorCell.col, this.selectedCell.col),
      c2: Math.max(this.anchorCell.col, this.selectedCell.col),
    }
  }

  /** 该单元格是否落在选区内 */
  private inSelection(row: number, col: number): boolean {
    if (!this.hasSelection) return false
    const { r1, r2, c1, c2 } = this.selRect
    return row >= r1 && row <= r2 && col >= c1 && col <= c2
  }

  /** 选区边框类（Excel 式蓝框四条边） */
  private selEdgeClass(row: number, col: number): string {
    if (!this.hasSelection) return ''
    const { r1, r2, c1, c2 } = this.selRect
    if (row < r1 || row > r2 || col < c1 || col > c2) return ''
    const parts: string[] = []
    if (row === r1) parts.push('sel-top')
    if (row === r2) parts.push('sel-bottom')
    if (col === c1) parts.push('sel-left')
    if (col === c2) parts.push('sel-right')
    if (row === r2 && col === c2) parts.push('sel-corner')
    return parts.join(' ')
  }

  /** 选区内有效数据单元格数量（状态栏"选中 N"） */
  private get selectedCellCount(): number {
    if (!this.hasSelection) return 0
    const { r1, r2, c1, c2 } = this.selRect
    const maxRow = Math.min(r2, Math.max(0, this.visibleRows.length - 1))
    const maxCol = Math.min(c2, this.columnOrder.length - 1)
    if (r1 > maxRow || c1 > maxCol) return (r2 - r1 + 1) * (c2 - c1 + 1)
    return (r2 - r1 + 1) * (c2 - c1 + 1)
  }

  /** 选区地址文案（如 C3:E6） */
  private get selectionAddress(): string {
    const { r1, r2, c1, c2 } = this.selRect
    const a = `${this.colLabel(c1)}${r1 + 2}`
    const b = `${this.colLabel(c2)}${r2 + 2}`
    return a === b ? a : `${a}:${b}`
  }

  /** 选区数值求和（状态栏多选统计，Excel 行为） */
  private get selectionSum(): string {
    if (!this.hasSelection) return '0'
    const { r1, r2, c1, c2 } = this.selRect
    const maxRow = Math.min(r2, Math.max(0, this.visibleRows.length - 1))
    const maxCol = Math.min(c2, this.columnOrder.length - 1)
    let sum = 0
    for (let r = r1; r <= maxRow; r++) {
      const row = this.visibleRows[r]
      if (!row) continue
      for (let c = c1; c <= maxCol; c++) {
        const col = demoColumns[this.columnOrder[c]]
        if (!col) continue
        const value = (row as unknown as Record<string, unknown>)[col.key]
        if (typeof value === 'number') sum += value
      }
    }
    return sum.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
  }

  /** 拖拽填充柄：向下扩展选区，松手后把源行内容填充下去 */
  private startFillHandle(event: PointerEvent): void {
    event.preventDefault()
    event.stopPropagation()
    const rect = { ...this.selRect }
    const startY = event.clientY
    const rowH = (26 * this.zoom) / 100
    let targetRow = rect.r2
    const move = (e: PointerEvent) => {
      const delta = Math.round((e.clientY - startY) / rowH)
      targetRow = Math.max(rect.r2, Math.min(TOTAL_ROWS - 2, rect.r2 + delta))
      this.hasSelection = true
      this.selectedCell = { row: targetRow, col: rect.c2 }
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      document.body.style.cursor = ''
      this.fillDown(rect, targetRow)
    }
    document.body.style.cursor = 'crosshair'
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  /** 填充：把选区首行内容复制到扩展出的每一行 */
  private fillDown(rect: { r1: number; r2: number; c1: number; c2: number }, targetRow: number): void {
    if (targetRow <= rect.r2) return
    const maxCol = Math.min(rect.c2, this.columnOrder.length - 1)
    if (rect.r1 > this.visibleRows.length - 1) { this.notify('选区无数据可填充'); return }
    this.pushHistory()
    let filled = 0
    for (let r = rect.r2 + 1; r <= targetRow; r++) {
      const target = this.visibleRows[r]
      if (!target) continue
      for (let c = rect.c1; c <= maxCol; c++) {
        const source = this.visibleRows[rect.r1]
        const col = demoColumns[this.columnOrder[c]]
        if (!source || !col) continue
        const value = (source as unknown as Record<string, unknown>)[col.key]
        const patch: Record<string, unknown> = {}
        patch[col.key] = value
        this.writeRows(this.rows.map((r) => (r.no === target.no ? { ...r, ...patch } : r)))
        filled++
      }
    }
    this.notify(`已填充 ${targetRow - rect.r2} 行（${filled} 个单元格）`)
  }

  /* ---------------- 渲染 ---------------- */

  render(): TemplateResult {
    return html`
      <div class="app" data-theme=${this.theme}>
        ${this.renderTopbar()}
        ${this.renderToolbar()}
        ${this.renderFormulaBar()}
        <div class="body">
          <div
            class="grid-area"
            tabindex="0"
            @mouseup=${() => { this.endSelect(); this.endColSelect(); this.endRowSelect() }}
            @mouseleave=${() => this.endSelect()}
            @mousedown=${(e: MouseEvent) => { if (e.target === e.currentTarget) { this.hasSelection = false; this.dragging = false } }}
            @keydown=${(e: KeyboardEvent) => this.onGridKeydown(e)}
            @wheel=${(e: WheelEvent) => {
              // Ctrl + 滚轮缩放：只缩放画布（右侧属性面板、顶部工具栏不受影响）
              if (!e.ctrlKey && !e.metaKey) return
              e.preventDefault()
              this.setZoom(this.zoom + (e.deltaY < 0 ? 5 : -5))
            }}
          >${this.viewMode === 'grid' ? this.renderGrid() : this.renderCards()}</div>
          ${this.inspectorVisible ? this.renderInspector() : nothing}
        </div>
        ${this.renderSheetTabs()}
        ${!this.inspectorVisible ? this.renderReopenButton() : nothing}
      </div>
    `
  }

  // ---------- 顶部导航 ----------

  /** 各菜单的下拉项（点击后写入状态栏反馈） */
  private menuItemsFor(menu: string): MenuItem[] {
    const notify = (label: string) => () => this.notify(label)
    switch (menu) {
      case '文件':
        return [
          { label: '新建工作簿', icon: 'file', shortcut: 'Ctrl+N', onSelect: notify('新建工作簿') },
          { label: '打开…', icon: 'folder', shortcut: 'Ctrl+O', onSelect: notify('打开文件对话框') },
          { label: '保存', icon: 'download', shortcut: 'Ctrl+S', onSelect: notify('已保存当前工作簿') },
          { separator: true },
          { label: '导出为 Excel', icon: 'upload', onSelect: notify('导出 Excel') },
          { label: '导出为 CSV', icon: 'upload', onSelect: notify('导出 CSV') },
          { separator: true },
          { label: '打印', icon: 'print', shortcut: 'Ctrl+P', onSelect: notify('打开打印预览') },
        ]
      case '开始':
        return [
          { label: '撤销', icon: 'undo', shortcut: 'Ctrl+Z', onSelect: notify('撤销') },
          { label: '重做', icon: 'redo', shortcut: 'Ctrl+Y', onSelect: notify('重做') },
          { separator: true },
          { label: '复制', icon: 'copy', shortcut: 'Ctrl+C', onSelect: notify('已复制选中单元格') },
          { label: '剪切', icon: 'scissors', shortcut: 'Ctrl+X', onSelect: notify('已剪切选中单元格') },
          { label: '粘贴', icon: 'paste', shortcut: 'Ctrl+V', onSelect: notify('已粘贴') },
          { separator: true },
          { label: '清除格式', icon: 'eraser', onSelect: () => this.clearFormat() },
        ]
      case '插入':
        return [
          { label: '插入函数', icon: 'fx', onSelect: notify('插入函数 =SUM()') },
          { label: '插入图表', icon: 'chartBar', onSelect: notify('插入图表') },
          { label: '插入批注', icon: 'comment', onSelect: notify('插入批注') },
          { label: '插入图片', icon: 'image', onSelect: notify('插入图片') },
        ]
      case '数据':
        return [
          { label: '按销售额升序', icon: 'sortAZ', onSelect: () => this.applySort('amount', 'asc') },
          { label: '按销售额降序', icon: 'sortZA', onSelect: () => this.applySort('amount', 'desc') },
          { label: '按完成率升序', icon: 'sortAZ', onSelect: () => this.applySort('rate', 'asc') },
          { label: '按完成率降序', icon: 'sortZA', onSelect: () => this.applySort('rate', 'desc') },
          { separator: true },
          { label: '筛选：完成率 ≥ 80%', icon: 'filter', checked: this.filterRate === 'high', onSelect: () => this.applyFilter('high') },
          { label: '筛选：完成率 < 80%', icon: 'filter', checked: this.filterRate === 'low', onSelect: () => this.applyFilter('low') },
          { label: '显示全部', icon: 'filter', checked: this.filterRate === 'all', onSelect: () => this.applyFilter('all') },
        ]
      case '公式':
        return [
          { label: '函数库…', icon: 'fx', onSelect: notify('打开函数库') },
          { label: '自动求和', icon: 'sigma', shortcut: 'Alt+=', onSelect: () => this.insertFormula('=SUM(D2:D10)') },
          { label: '平均值', icon: 'sigma', onSelect: () => this.insertFormula('=AVERAGE(D2:D10)') },
          { label: '名称管理器', icon: 'tag', onSelect: notify('名称管理器') },
        ]
      case '页面布局':
        return [
          { label: '页边距', icon: 'tableStyle', onSelect: notify('页边距设置') },
          { label: '纸张方向', icon: 'file', onSelect: notify('纸张方向：纵向') },
          { label: '打印区域', icon: 'print', onSelect: notify('打印区域设置') },
          { separator: true },
          { label: '冻结首行', icon: 'freeze', checked: this.frozen, onSelect: () => this.toggleFreeze() },
          { label: '网格线', icon: 'gridView', checked: true, onSelect: notify('网格线显示') },
        ]
      case '审阅':
        return [
          { label: '拼写检查', icon: 'checkCircle', onSelect: notify('拼写检查完成') },
          { label: '插入批注', icon: 'comment', onSelect: notify('已插入批注') },
          { label: '数据验证', icon: 'validation', onSelect: notify('数据验证设置') },
          { separator: true },
          { label: '条件格式', icon: 'conditional', onSelect: notify('条件格式规则') },
          { label: '保护工作表', icon: 'lock', onSelect: notify('工作表已保护') },
          { label: '修订记录', icon: 'history', onSelect: notify('修订记录') },
        ]
      case '视图':
        return [
          { label: '冻结首行', icon: 'freeze', checked: this.frozen, onSelect: () => this.toggleFreeze() },
          { label: '网格视图', icon: 'gridView', checked: this.viewMode === 'grid', onSelect: () => this.setViewMode('grid') },
          { label: '卡片视图', icon: 'listView', checked: this.viewMode === 'card', onSelect: () => this.setViewMode('card') },
          { separator: true },
          { label: '显示/隐藏设置面板', icon: 'sliders', checked: this.inspectorVisible, onSelect: () => { this.inspectorVisible = !this.inspectorVisible } },
          { label: '全屏', icon: 'fullscreen', onSelect: () => this.toggleFullscreen() },
        ]
      default:
        return [
          { label: this.theme === 'light' ? '切换深色主题' : '切换浅色主题', icon: this.theme === 'light' ? 'moon' : 'sun', onSelect: () => this.toggleTheme() },
          { label: '选项…', icon: 'settings', onSelect: notify('打开选项') },
        ]
    }
  }

  private renderTopbar(): TemplateResult {
    return html`
      <div class="topbar">
        <div class="brand">${sxLogo()}</div>
        <nav class="nav">
          ${navMenus.map(
            (menu) => html`
              <button
                class="nav-item ${menu === this.activeMenu ? 'active' : ''}"
                @click=${() => { this.activeMenu = menu }}
              >
                ${menu}
              </button>
            `,
          )}
        </nav>
        <div class="topbar-right">
          <div class="search-box">
            ${sxIcon('search', 14)}
            <input
              placeholder="搜索 (Ctrl + F)"
              @input=${(event: Event) => this.notify(`搜索：${(event.target as HTMLInputElement).value || '（空）'}`)}
            />
          </div>
          <button class="icon-btn" title="帮助" @click=${() => this.notify('帮助中心：F1')}>${sxIcon('help', 17)}</button>
          <button
            class="icon-btn"
            title=${this.theme === 'light' ? '切换深色' : '切换浅色'}
            @click=${this.toggleTheme}
          >${sxIcon(this.theme === 'light' ? 'sun' : 'moon', 17)}</button>
          <span class="avatar">张</span>
        </div>
      </div>
    `
  }

  // ---------- 工具栏 ----------

  /** 记录一次快照到撤销栈（写操作前调用）。快照含数据 + 合并/填充/对齐等视图状态 */
  private pushHistory(): void {
    this.undoStack = [...this.undoStack, this.rows.map((r) => ({ ...r }))].slice(-50)
    this.viewUndoStack = [...this.viewUndoStack, {
      merges: { ...this.merges }, fills: { ...this.fills }, cellAlign: { ...this.cellAlign }, cellStyles: { ...this.cellStyles },
    }].slice(-50)
    this.redoStack = []
    this.historyTick++
  }

  private undo(): void {
    const prev = this.undoStack[this.undoStack.length - 1]
    if (!prev) { this.notify('没有可撤销的操作'); return }
    this.redoStack = [...this.redoStack, this.rows.map((r) => ({ ...r }))]
    this.viewRedoStack = [...this.viewRedoStack, { merges: { ...this.merges }, fills: { ...this.fills }, cellAlign: { ...this.cellAlign }, cellStyles: { ...this.cellStyles } }]
    this.undoStack = this.undoStack.slice(0, -1)
    const view = this.viewUndoStack.pop()
    if (view) { this.merges = view.merges; this.fills = view.fills; this.cellAlign = view.cellAlign; this.cellStyles = view.cellStyles }
    this.writeRows(prev)
    this.historyTick++
    this.notify('已撤销')
  }

  private redo(): void {
    const next = this.redoStack[this.redoStack.length - 1]
    if (!next) { this.notify('没有可重做的操作'); return }
    this.undoStack = [...this.undoStack, this.rows.map((r) => ({ ...r }))]
    this.viewUndoStack = [...this.viewUndoStack, { merges: { ...this.merges }, fills: { ...this.fills }, cellAlign: { ...this.cellAlign }, cellStyles: { ...this.cellStyles } }]
    this.redoStack = this.redoStack.slice(0, -1)
    const view = this.viewRedoStack.pop()
    if (view) { this.merges = view.merges; this.fills = view.fills; this.cellAlign = view.cellAlign; this.cellStyles = view.cellStyles }
    this.writeRows(next)
    this.historyTick++
    this.notify('已重做')
  }

  // ---------- 单元格样式（作用于选区） ----------

  /** 焦点单元格已生效的样式（工具栏状态栏显示用） */
  private get focusStyle(): CellStyle {
    if (!this.hasSelection) return {}
    return this.cellStyles[`${this.selectedCell.row}-${this.selectedCell.col}`] ?? {}
  }

  /** 焦点格字号（显示用，未设置为默认 12） */
  private get focusFontSize(): number { return this.focusStyle.fontSize ?? 16 }
  private get focusFontFamily(): string { return this.focusStyle.fontFamily ?? '思源黑体' }
  private get focusBold(): boolean { return this.focusStyle.bold === true }
  private get focusItalic(): boolean { return this.focusStyle.italic === true }
  private get focusUnderline(): boolean { return this.focusStyle.underline === true }
  private get focusColor(): string { return this.focusStyle.color ?? '#1f2937' }
  private get focusNumberFormat(): NumberFormat { return this.focusStyle.numberFormat ?? this.numberFormat }
  private get focusDecimals(): number { return this.focusStyle.decimals ?? this.decimals }
  private get focusVAlign(): 'top' | 'middle' | 'bottom' { return this.focusStyle.vAlign ?? 'middle' }

  /**
   * 把样式补丁应用到当前选区内的所有单元格。
   * 未选择任何单元格时直接拒绝（用户要求：没选就不能改任何格子）。
   */
  private applyCellStyle(patch: CellStyle, label: string): void {
    if (!this.hasSelection) {
      this.notify('请先选择一个或多个单元格')
      return
    }
    const { r1, r2, c1, c2 } = this.selRect
    // 只作用于有效数据范围（避免给 200 行空行写样式）
    const maxRow = Math.min(r2, Math.max(0, this.visibleRows.length - 1))
    const maxCol = Math.min(c2, this.columnOrder.length - 1)
    if (r1 > maxRow || c1 > maxCol) {
      this.notify('所选区域暂无数据，无法设置格式')
      return
    }
    this.pushHistory()
    const next = { ...this.cellStyles }
    for (let r = r1; r <= maxRow; r++) {
      for (let c = c1; c <= maxCol; c++) {
        const key = `${r}-${c}`
        next[key] = { ...(next[key] ?? {}), ...patch }
      }
    }
    this.cellStyles = next
    const count = (maxRow - r1 + 1) * (maxCol - c1 + 1)
    const addr = count > 1
      ? `${this.colLabel(c1)}${r1 + 2}:${this.colLabel(maxCol)}${maxRow + 2}`
      : `${this.colLabel(this.selectedCell.col)}${this.selectedCell.row + 2}`
    this.notify(`${addr} ${label}`)
  }

  private renderToolbar(): TemplateResult {
    void this.historyTick
    // WPS 式：Tab 切换功能区；"开始"保留既有完整工具栏，其余 Tab 用 Ribbon 分组按钮
    if (this.activeMenu !== '开始') return this.renderRibbon(this.activeMenu)
    return html`
      <div class="toolbar">
        <button class="tool-btn" title="撤销" @click=${() => this.undo()} ?disabled=${this.undoStack.length === 0}>${sxIcon('undo', 16)}</button>
        <button class="tool-btn" title="重做" @click=${() => this.redo()} ?disabled=${this.redoStack.length === 0}>${sxIcon('redo', 16)}</button>
        <span class="sep"></span>

        <button
          class="tool-select font"
          title=${this.fontsReady ? '字体（SDK 内置字体已加载）' : '字体（内置字体加载中…）'}
          @click=${(event: Event) =>
            openMenu(
              event.currentTarget as HTMLElement,
              availableFontFamilies().map((name) => ({
                label: name,
                checked: this.focusFontFamily === name,
                onSelect: () => this.applyCellStyle({ fontFamily: name }, `字体：${name}`),
              })),
              { minWidth: 160 },
            )}
        >${this.focusFontFamily} <span class="caret">${sxIcon('chevronDown', 13)}</span></button>

        <button
          class="tool-select size"
          @click=${(event: Event) =>
            openMenu(
              event.currentTarget as HTMLElement,
              FONT_SIZES.map((size) => ({
                label: String(size),
                checked: this.focusFontSize === size,
                onSelect: () => this.applyCellStyle({ fontSize: size }, `字号：${size}px`),
              })),
              { minWidth: 92 },
            )}
        >${this.focusFontSize} <span class="caret">${sxIcon('chevronDown', 13)}</span></button>
        <span class="sep"></span>

        <button
          class="tool-btn ${this.focusBold ? 'active' : ''}"
          title="加粗"
          @click=${() => this.applyCellStyle({ bold: !this.focusBold }, `加粗：${!this.focusBold ? '开' : '关'}`)}
        >${sxIcon('bold', 16)}</button>
        <button
          class="tool-btn ${this.focusItalic ? 'active' : ''}"
          title="斜体"
          @click=${() => this.applyCellStyle({ italic: !this.focusItalic }, `斜体：${!this.focusItalic ? '开' : '关'}`)}
        >${sxIcon('italic', 16)}</button>
        <button
          class="tool-btn ${this.focusUnderline ? 'active' : ''}"
          title="下划线"
          @click=${() => this.applyCellStyle({ underline: !this.focusUnderline }, `下划线：${!this.focusUnderline ? '开' : '关'}`)}
        >${sxIcon('underline', 16)}</button>
        <button
          class="tool-btn fcolor"
          title="字体颜色"
          @click=${(event: Event) =>
            openMenu(
              event.currentTarget as HTMLElement,
              ['#1f2937', '#2563eb', '#22a06b', '#d64545', '#f59e0b', '#8b5cf6'].map((color) => ({
                label: color,
                checked: this.focusColor === color,
                onSelect: () => this.applyCellStyle({ color }, `字体颜色：${color}`),
              })),
              { minWidth: 130 },
            )}
        >${sxIcon('fontColor', 16)}</button>
        <span class="sep"></span>

        ${(['left', 'center', 'right', 'justify'] as const).map(
          (mode) => html`
            <button
              class="tool-btn ${this.alignMode === mode ? 'active' : ''}"
              title=${`${mode}对齐`}
              @click=${() => this.applyAlign(mode)}
            >${sxIcon(`align${mode[0]!.toUpperCase()}${mode.slice(1)}` as Parameters<typeof sxIcon>[0], 16)}</button>
          `,
        )}

        <button
          class="tool-btn ${this.merges[`${this.selRect.r1}-${this.selRect.c1}`] ? 'active' : ''}"
          title="合并选中区域 / 取消合并"
          @click=${() => this.toggleMerge()}
        >${sxIcon('merge', 16)}</button>
        <span class="sep"></span>

        <button
          class="tool-select format"
          @click=${(event: Event) =>
            openMenu(
              event.currentTarget as HTMLElement,
              NUMBER_FORMATS.map((format) => ({
                label: format,
                checked: this.focusNumberFormat === format,
                onSelect: () => this.applyCellStyle({ numberFormat: format }, `数字格式：${format}`),
              })),
              { minWidth: 140 },
            )}
        >${this.focusNumberFormat} <span class="caret">${sxIcon('chevronDown', 13)}</span></button>
        <button class="tool-btn ${this.focusNumberFormat === '货币' ? 'active' : ''}" title="货币格式" @click=${() => this.applyCellStyle({ numberFormat: '货币' }, '数字格式：货币')}>${sxIcon('currency', 16)}</button>
        <button class="tool-btn ${this.focusNumberFormat === '百分比' ? 'active' : ''}" title="百分比格式" @click=${() => this.applyCellStyle({ numberFormat: '百分比' }, '数字格式：百分比')}>${sxIcon('percent', 16)}</button>
        <button class="tool-btn" title="减少小数位" @click=${() => this.applyCellStyle({ decimals: Math.max(0, this.focusDecimals - 1) }, `小数位：${Math.max(0, this.focusDecimals - 1)}`)}>${sxIcon('decimalMinus', 16)}</button>
        <button class="tool-btn" title="增加小数位" @click=${() => this.applyCellStyle({ decimals: Math.min(4, this.focusDecimals + 1) }, `小数位：${Math.min(4, this.focusDecimals + 1)}`)}>${sxIcon('decimalPlus', 16)}</button>
        <span class="sep"></span>

        <button
          class="tool-action"
          title="条件格式"
          @click=${(event: Event) =>
            openMenu(
              event.currentTarget as HTMLElement,
              [
                { label: '无', checked: this.condRule === 'none', onSelect: () => this.setCondRule('none') },
                { label: '完成率 ≥ 90% 高亮绿色', checked: this.condRule === 'high', onSelect: () => this.setCondRule('high') },
                { label: '完成率 < 70% 高亮红色', checked: this.condRule === 'low', onSelect: () => this.setCondRule('low') },
              ],
              { minWidth: 220 },
            )}
        >${sxIcon('conditional', 17)}<span>条件格式</span></button>

        <button
          class="tool-action"
          title="数据验证"
          @click=${(event: Event) =>
            openMenu(
              event.currentTarget as HTMLElement,
              [
                { label: '整数（0-1000）', icon: 'validation', checked: this.currentValidation?.type === 'int', onSelect: () => this.applyValidation('int') },
                { label: '小数（≥ 0）', icon: 'validation', checked: this.currentValidation?.type === 'decimal', onSelect: () => this.applyValidation('decimal') },
                { label: '日期（今天之后）', icon: 'calendar', checked: this.currentValidation?.type === 'date', onSelect: () => this.applyValidation('date') },
                { separator: true },
                { label: '清除验证', icon: 'eraser', onSelect: () => this.clearValidation() },
              ],
              { minWidth: 190 },
            )}
        >${sxIcon('validation', 17)}<span>数据验证</span></button>

        <button
          class="tool-action"
          title="筛选"
          @click=${(event: Event) =>
            openMenu(
              event.currentTarget as HTMLElement,
              [
                { label: '显示全部', checked: this.filterRate === 'all', onSelect: () => this.applyFilter('all') },
                { label: '完成率 ≥ 80%', checked: this.filterRate === 'high', onSelect: () => this.applyFilter('high') },
                { label: '完成率 < 80%', checked: this.filterRate === 'low', onSelect: () => this.applyFilter('low') },
              ],
              { minWidth: 170 },
            )}
        >${sxIcon('filter', 17)}<span>筛选</span></button>

        <button
          class="tool-action"
          title="排序"
          @click=${(event: Event) =>
            openMenu(
              event.currentTarget as HTMLElement,
              [
                { label: '销售额 ↑ 升序', checked: this.sortKey === 'amount' && this.sortDir === 'asc', onSelect: () => this.applySort('amount', 'asc') },
                { label: '销售额 ↓ 降序', checked: this.sortKey === 'amount' && this.sortDir === 'desc', onSelect: () => this.applySort('amount', 'desc') },
                { label: '完成率 ↑ 升序', checked: this.sortKey === 'rate' && this.sortDir === 'asc', onSelect: () => this.applySort('rate', 'asc') },
                { label: '完成率 ↓ 降序', checked: this.sortKey === 'rate' && this.sortDir === 'desc', onSelect: () => this.applySort('rate', 'desc') },
                { separator: true },
                { label: '恢复默认顺序', checked: this.sortKey === null, onSelect: () => this.applySort(null, 'asc') },
              ],
              { minWidth: 190 },
            )}
        >${sxIcon('sort', 17)}<span>排序</span></button>

        <button
          class="tool-action ${this.frozen ? 'active' : ''}"
          title="冻结"
          @click=${() => this.toggleFreeze()}
        >${sxIcon('freeze', 17)}<span>冻结</span></button>
      </div>
    `
  }

  /** WPS 式 Ribbon：按当前 Tab 分组展示该菜单下的功能（数据来自 menuItemsFor） */
  private renderRibbon(menu: string): TemplateResult {
    const items = this.menuItemsFor(menu)
    const groups: Array<{ title: string; items: MenuItem[] }> = []
    let current: MenuItem[] = []
    const flush = (title: string) => {
      if (current.length > 0) groups.push({ title, items: current })
      current = []
    }
    for (const item of items) {
      if (item.separator) { flush(groups.length === 0 ? '操作' : `更多${groups.length}`); continue }
      current.push(item)
    }
    flush('操作')
    return html`
      <div class="ribbon">
        ${groups.map(
          (group) => html`
            <div class="ribbon-group">
              <div class="ribbon-group-body">
                ${group.items.map(
                  (item) => html`
                    <button
                      class="ribbon-item ${item.checked ? 'active' : ''}"
                      title=${item.label ?? ''}
                      ?disabled=${item.disabled ?? false}
                      @click=${() => item.onSelect?.()}
                    >
                      ${item.icon ? sxIcon(item.icon, 18) : nothing}
                      <span>${item.label}</span>
                    </button>
                  `,
                )}
              </div>
              <div class="ribbon-group-label">${group.title}</div>
            </div>
          `,
        )}
      </div>
    `
  }

  // ---------- 公式栏 ----------

  private renderFormulaBar(): TemplateResult {
    const addr = `${this.colLabel(this.selectedCell.col)}${this.selectedCell.row + 2}`
    const row = this.selectedRow
    const col = demoColumns[this.selectedCell.col]
    const raw = row && col ? (row as unknown as Record<string, unknown>)[col.key] : ''
    return html`
      <div class="formula-bar">
        <div class="cell-address">${addr} <span class="caret">${sxIcon('chevronDown', 12)}</span></div>
        <div class="fx-box">fx</div>
        <input
          class="formula-input"
          .value=${String(raw ?? '')}
          aria-label="公式输入框"
          @keydown=${(event: KeyboardEvent) => {
            const input = event.target as HTMLInputElement
            if (event.key === 'Enter') input.blur()
            if (event.key === 'Escape') {
              input.value = String(raw ?? '')
              input.blur()
            }
          }}
          @change=${(event: Event) => {
            this.commitCellValue(this.selectedCell.row, this.selectedCell.col, (event.target as HTMLInputElement).value)
          }}
        />
      </div>
    `
  }

  // ---------- 表格工作区 ----------

  private formatAmount(value: number, row?: number, col?: number): string {
    const s: CellStyle = row !== undefined && col !== undefined ? (this.cellStyles[`${row}-${col}`] ?? {}) : {}
    const fmt = s.numberFormat ?? this.numberFormat
    const d = s.decimals ?? this.decimals
    switch (fmt) {
      case '数值':
        return value.toFixed(d)
      case '货币':
        return `¥${value.toFixed(d)}`
      case '百分比':
        return `${value.toFixed(1)}%`
      case '日期':
        return '—'
      default:
        return value.toFixed(d)
    }
  }

  /** 条件格式：返回该行的内联样式 */
  private condStyle(row: DemoRow): string {
    if (this.condRule === 'high' && row.rate >= 90) return 'background:#e8f8ef;color:#14804a;'
    if (this.condRule === 'low' && row.rate < 70) return 'background:#fdeeee;color:#b33636;'
    return ''
  }

  private cellTextStyle(row?: number, col?: number): string {
    const key = row !== undefined && col !== undefined ? `${row}-${col}` : ''
    const s: CellStyle = (key && this.cellStyles[key]) || {}
    const familyName = s.fontFamily ?? '思源黑体'
    const family = resolveCssFamilyByName(familyName)
    const align = key ? this.cellAlign[key] : undefined
    const styles = [
      `font-family:${family}`,
      `font-size:${Math.max(1, Math.round(s.fontSize ?? 16))}px`,
      `font-weight:${s.bold ? 700 : 400}`,
      `font-style:${s.italic ? 'italic' : 'normal'}`,
      `text-decoration:${s.underline ? 'underline' : 'none'}`,
      // 默认字体色跟随主题变量（深色下固定色会看不清）；用户显式选色时才用固定色
      `color:${!s.color || s.color === '#1f2937' ? 'var(--sx-text-primary)' : s.color}`,
    ]
    if (s.vAlign) styles.push(`vertical-align:${s.vAlign === 'middle' ? 'middle' : s.vAlign === 'top' ? 'top' : 'bottom'}`)
    if (align) styles.push(`text-align:${align}`)
    return styles.join(';')
  }

  /** 对齐按钮作用到当前选中单元格（不是只改全局 state） */
  private applyAlign(mode: 'left' | 'center' | 'right' | 'justify'): void {
    if (!this.hasSelection) { this.notify('请先选择一个或多个单元格'); return }
    this.pushHistory()
    this.alignMode = mode
    const { r1, r2, c1, c2 } = this.selRect
    const next = { ...this.cellAlign }
    // 限制在有效数据范围内，避免给 200 行空行都写状态
    const maxRow = Math.min(r2, Math.max(0, this.visibleRows.length - 1))
    const maxCol = Math.min(c2, this.columnOrder.length - 1)
    for (let r = r1; r <= maxRow; r++) for (let c = c1; c <= maxCol; c++) next[`${r}-${c}`] = mode
    this.cellAlign = next
    const count = (maxRow - r1 + 1) * (maxCol - c1 + 1)
    this.notify(count > 1 ? `已对 ${count} 个单元格设置${mode}对齐` : `${this.colLabel(this.selectedCell.col)}${this.selectedCell.row + 2} 对齐：${mode}`)
  }

  /** 列拖拽重排：把 from 位置的列移动到 to 位置 */
  private reorderColumn(from: number, to: number): void {
    if (from === to || from < 0 || to < 0) return
    const next = [...this.columnOrder]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    this.columnOrder = next
    this.saveColumnOrder()
    this.notify(`列已移动：${String.fromCharCode(65 + from)} → ${String.fromCharCode(65 + to)}`)
  }

  /** Excel 列名：0→A, 25→Z, 26→AA */
  private colLabel(index: number): string {
    let n = index
    let label = ''
    do {
      label = String.fromCharCode(65 + (n % 26)) + label
      n = Math.floor(n / 26) - 1
    } while (n >= 0)
    return label
  }

  private renderGrid(): TemplateResult {
    const sel = this.selectedCell
    const rows = this.visibleRows
    const cols = this.columnOrder.map((i) => demoColumns[i])
    const totalCols = cols.length + FILLER_COLS
    const scale = this.zoom / 100
    // 固定像素列宽（缩放后同步），总宽超出容器即出现横向滚动条
    const baseColW = (ci: number) => (ci < cols.length ? demoColumns[this.columnOrder[ci]].width : FILLER_COL_WIDTH)
    const dataColW = (ci: number) => Math.max(1, Math.round((this.colWidths[ci] ?? baseColW(ci)) * scale))
    // 总行数：列标题行(第1行) + 数据/空白行，最少 TOTAL_ROWS 行
    const dataRowCount = Math.max(TOTAL_ROWS - 1, rows.length)
    const tbodyRows = Array.from({ length: dataRowCount }, (_, i) => i)
    return html`
      <table class="sheet" style=${`--sheet-row-h:${Math.round(26 * scale)}px;--sheet-font:${Math.round(16 * scale)}px`}>
        <thead class="${this.frozen ? 'frozen' : ''}">
          <tr>
            <th class="corner" title="全选" @click=${() => this.selectAll()}></th>
            ${Array.from({ length: totalCols }, (_, ci) => html`
              <th
                class="col-head ${this.hasSelection && this.selModeIsCol && ci >= this.selRect.c1 && ci <= this.selRect.c2 ? 'hl' : ''} ${this.dragOverCol === ci ? 'drag-over' : ''} ${this.dragCol === ci ? 'dragging' : ''}"
                style="width:${dataColW(ci)}px"
                title=${`${this.colLabel(ci)} · 点击选中整列（可横向拖选多列）`}
                @mousedown=${(e: MouseEvent) => { if (ci < cols.length) { e.preventDefault(); this.beginColSelect(ci, e.shiftKey) } else { this.beginColSelect(ci, e.shiftKey) } }}
                @mouseenter=${() => this.extendColSelect(ci)}
                @dragover=${(e: DragEvent) => { if (this.dragCol !== null && ci < cols.length) { e.preventDefault(); this.dragOverCol = ci } }}
                @drop=${(e: DragEvent) => {
                  if (ci >= cols.length) return
                  e.preventDefault()
                  const from = this.dragCol ?? Number(e.dataTransfer?.getData('text/plain'))
                  this.reorderColumn(from, ci)
                  this.dragCol = null
                  this.dragOverCol = null
                }}
                @click=${() => { this.renderRoot.querySelector('.grid-area')?.dispatchEvent(new Event('focus')) }}
              >
                ${ci < cols.length ? html`<span
                  class="col-drag-handle"
                  title="按住拖动可移动列 ${this.colLabel(ci)}"
                  draggable="true"
                  @mousedown=${(e: MouseEvent) => e.stopPropagation()}
                  @dragstart=${(e: DragEvent) => {
                    e.stopPropagation()
                    this.dragCol = ci
                    e.dataTransfer?.setData('text/plain', String(ci))
                    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
                  }}
                  @dragend=${() => { this.dragCol = null; this.dragOverCol = null }}
                >${sxIcon('drag', 11)}</span>` : nothing}
                <span class="col-label">${this.colLabel(ci)}</span>

                <span
                  class="col-resizer"
                  title="拖动调整列宽"
                  @pointerdown=${(e: PointerEvent) => this.startColResize(e, ci, this.colWidths[ci] ?? baseColW(ci))}
                  @dragstart=${(e: DragEvent) => e.preventDefault()}
                ></span>
              </th>
            `)}
          </tr>
        </thead>
        <tbody>
          <!-- 第 1 行：列标题 -->
          <tr style="height:${Math.round((this.rowHeights[-1] ?? 26) * scale)}px">
            <th class="row-head" @mousedown=${(e: MouseEvent) => { e.preventDefault(); this.beginRowSelect(-1, e.shiftKey) }} @mouseenter=${() => this.extendRowSelect(-1)}>1
              <span class="row-resizer" title="拖动调整行高" @pointerdown=${(e: PointerEvent) => this.startRowResize(e, -1, this.rowHeights[-1] ?? 26)}></span>
            </th>
            ${cols.map((col) => html`<td class="cell head-cell">${col.title}</td>`)}
            ${Array.from({ length: FILLER_COLS }, () => html`<td class="cell head-cell"></td>`)}
          </tr>
          <!-- 第 2 行起：数据行，不足补空白行到 200 行 -->
          ${tbodyRows.map((i) => {
            const row = rows[i]
            const ri = i
            const isActive = ri === sel.row
            const rowSelected = this.selectMode === 'row' ? (ri >= this.selRect.r1 && ri <= this.selRect.r2) : false
            return html`
              <tr class="${rowSelected ? 'row-active' : ''}" style="height:${Math.round((this.rowHeights[ri] ?? 26) * scale)}px">
                <th class="row-head ${this.hasSelection && (isActive || rowSelected) ? 'hl' : ''}" data-row=${ri} @mousedown=${(e: MouseEvent) => { e.preventDefault(); this.beginRowSelect(ri, e.shiftKey) }} @mouseenter=${() => this.extendRowSelect(ri)}>${ri + 2}
                  <span class="row-resizer" title="拖动调整行高" @pointerdown=${(e: PointerEvent) => this.startRowResize(e, ri, this.rowHeights[ri] ?? 26)}></span>
                </th>
                ${Array.from({ length: totalCols }, (_, ci) => {
                  if (ci >= cols.length) return html`<td class="cell ${this.inSelection(ri, ci) ? 'in-sel' : ''} ${this.selEdgeClass(ri, ci)}" @mousedown=${() => this.beginSelect(ri, ci)} @mouseenter=${() => this.extendSelect(ri, ci)} @contextmenu=${(event: MouseEvent) => this.openCellMenu(event, ri, ci)}></td>`
                  const col = cols[ci]
                  if (this.isMergedInto(ri, ci)) return nothing
                  const mspan = this.mergeSpan(ri, ci)
                  const fill = this.fills[`${ri}-${ci}`]
                  return html`
                    <td
                      class="cell ${this.inSelection(ri, ci) ? 'in-sel' : ''} ${this.hasSelection && ri === sel.row && ci === sel.col ? 'active-cell' : ''} ${mspan ? 'merged' : ''} ${this.selEdgeClass(ri, ci)}"
                      colspan=${mspan && mspan.cs > 1 ? mspan.cs : nothing}
                      rowspan=${mspan && mspan.rs > 1 ? mspan.rs : nothing}
                      style=${fill ? `background:${fill}` : ''}
                      @mousedown=${(e: MouseEvent) => { if (e.shiftKey) { this.selectedCell = { row: ri, col: ci } } else { this.beginSelect(ri, ci) } }}
                      @mouseenter=${() => this.extendSelect(ri, ci)}
                      @dblclick=${() => { if (row) this.beginEdit(ri, ci) }}
                      @contextmenu=${(event: MouseEvent) => this.openCellMenu(event, ri, ci)}
                    >
                      ${!row ? nothing : this.editing && this.editing.row === ri && this.editing.col === ci
                        ? html`<input
                            class="cell-editor"
                            .value=${this.editValue}
                            @click=${(event: Event) => event.stopPropagation()}
                            @input=${(event: Event) => { this.editValue = (event.target as HTMLInputElement).value }}
                            @blur=${() => this.commitEdit()}
                            @keydown=${(event: KeyboardEvent) => {
                              if (event.key === 'Enter') this.commitEdit()
                              if (event.key === 'Escape') {
                                this.editing = null
                                this.notify('已取消编辑')
                              }
                            }}
                          />`
                        : html`<span style=${`${this.cellTextStyle(ri, ci)};display:block;text-align:${this.cellAlign[`${ri}-${ci}`] ?? col.align}`}>${this.renderCell(row, col.key, ri, ci)}</span>`}
                      ${this.hasSelection && this.selRect.r2 === ri && this.selRect.c2 === ci
                        ? html`<span class="fill-handle" title="拖动填充" @pointerdown=${(e: PointerEvent) => this.startFillHandle(e)}></span>`
                        : nothing}
                    </td>
                  `
                })}
              </tr>
            `
          })}
        </tbody>
      </table>
    `
  }

  private renderCards(): TemplateResult {
    const rows = this.visibleRows
    return html`
      <div class="card-grid">
        ${rows.map(
          (row) => html`
            <div class="data-card" style=${this.condStyle(row)}>
              <div class="dc-head">
                <strong>${row.region}</strong>
                <span class="dc-rate">${row.rate}%</span>
              </div>
              <div class="dc-row"><span>销售部门</span><b>${row.dept}</b></div>
              <div class="dc-row"><span>销售额</span><b>${this.formatAmount(row.amount)}</b></div>
              <div class="dc-row"><span>负责人</span><b>${row.owner}</b></div>
              <div class="dc-note">${row.note}</div>
            </div>
          `,
        )}
      </div>
    `
  }

  /** 该列是否已被左侧合并单元格覆盖（需跳过渲染） */
  /** 该单元格是否被某个合并块覆盖（是块的下/右部分，需跳过渲染） */
  private isMergedInto(row: number, col: number): boolean {
    const entries = Object.entries(this.merges)
    if (entries.length === 0) return false
    for (const [key, span] of entries) {
      const [sr, sc] = key.split('-').map(Number)
      if (row >= sr && row < sr + span.rs && col >= sc && col < sc + span.cs) {
        if (row !== sr || col !== sc) return true
      }
    }
    return false
  }

  /** 该单元格起点是否是合并块（用于取 colspan/rowspan） */
  private mergeSpan(row: number, col: number): { rs: number; cs: number } | null {
    return this.merges[`${row}-${col}`] ?? null
  }

  /** 右键菜单：作用于点击的单元格（与右键菜单页一致的操作集合） */
  private openCellMenu(event: MouseEvent, row: number, col: number): void {
    event.preventDefault()
    this.selectedCell = { row, col }
    const target = this.visibleRows[row]
    const column = demoColumns[col]
    // 空白行/填充列也允许右键（空表要能插入行）；仅数据相关项禁用
    const addr = `${this.colLabel(col)}${row + 2}`
    const anchor = (event.currentTarget as HTMLElement | null) ?? (event.target as HTMLElement | null) ?? this.renderRoot.querySelector('.sheet') as HTMLElement
    openMenu(anchor, [
      { label: '复制', icon: 'copy', shortcut: 'Ctrl C', disabled: !target || !column, onSelect: () => {
        if (!target || !column) return
        this.clipboard = { row: { ...target }, key: column.key }
        this.notify(`已复制 ${addr}（${String((target as unknown as Record<string, unknown>)[column.key])}）`)
      } },
      { label: '剪切', icon: 'scissors', shortcut: 'Ctrl X', disabled: !target || !column, onSelect: () => {
        if (!target || !column) return
        this.clipboard = { row: { ...target }, key: column.key }
        this.commitCellValue(row, col, '')
        this.notify(`已剪切 ${addr}`)
      } },
      { label: '粘贴', icon: 'paste', shortcut: 'Ctrl V', disabled: !this.clipboard || !target || !column, onSelect: () => {
        const clip = this.clipboard
        if (!clip) return
        const value = (clip.row as unknown as Record<string, unknown>)[clip.key]
        this.commitCellValue(row, col, String(value ?? ''))
        this.notify(`已粘贴到 ${addr}`)
      } },
      { separator: true },
      { label: '插入行', icon: 'plus', onSelect: () => this.insertRowAt(row) },
      { label: '删除行', icon: 'trash', danger: true, disabled: !target, onSelect: () => this.deleteRowAt(row) },
      { label: '清除内容', icon: 'eraser', shortcut: 'Delete', disabled: !target || !column, onSelect: () => { this.commitCellValue(row, col, ''); this.notify(`已清除 ${addr}`) } },
      { separator: true },
      { label: this.merges[`${row}-${col}`] ? '取消合并' : '合并选中区域', icon: 'merge', onSelect: () => this.toggleMerge() },
      { label: '填充颜色', icon: 'fill', onSelect: () => this.fillCell(row, col) },
      { separator: true },
      { label: '对齐：左', icon: 'alignLeft', onSelect: () => { this.cellAlign = { ...this.cellAlign, [`${row}-${col}`]: 'left' }; this.notify(`${addr} 左对齐`) } },
      { label: '对齐：居中', icon: 'alignCenter', onSelect: () => { this.cellAlign = { ...this.cellAlign, [`${row}-${col}`]: 'center' }; this.notify(`${addr} 居中`) } },
      { label: '对齐：右', icon: 'alignRight', onSelect: () => { this.cellAlign = { ...this.cellAlign, [`${row}-${col}`]: 'right' }; this.notify(`${addr} 右对齐`) } },
      { separator: true },
      { label: '按销售额降序', icon: 'sort', onSelect: () => this.applySort('amount', 'desc') },
      { label: '筛选完成率 ≥ 80%', icon: 'filter', onSelect: () => this.applyFilter('high') },
    ], { minWidth: 190 })
  }

  /** 在指定行前插入一行空记录（写回 store，其他页同步） */
  private insertRowAt(row: number): void {
    const target = this.visibleRows[row]
    const no = target?.no ?? this.rows.length + 1
    this.pushHistory()
    const next = [...this.rows]
    next.splice(Math.max(0, Math.min(row, next.length)), 0, {
      no, region: '—', dept: '—', amount: 0, rate: 0, owner: '—', note: '（新增）',
    })
    this.writeRows(next.map((item, index) => ({ ...item, no: index + 1 })))
    this.notify(`已在第 ${row + 2} 行前插入一行`)
  }

  private deleteRowAt(row: number): void {
    const target = this.visibleRows[row]
    if (!target) return
    this.pushHistory()
    this.writeRows(this.rows.filter((r) => r.no !== target.no).map((item, index) => ({ ...item, no: index + 1 })))
    this.selectedCell = { row: Math.max(0, row - 1), col: this.selectedCell.col }
    this.notify(`已删除第 ${row + 2} 行`)
  }

  /** 合并/取消合并：与右侧一格合并（Excel 合并的最小单元） */
  /** 合并当前选区（矩形）；若起点已合并则取消 */
  private toggleMerge(row?: number, col?: number): void {
    if (row === undefined && !this.hasSelection) { this.notify('请先选择要合并的单元格区域'); return }
    const r1 = row ?? this.selRect.r1
    const c1 = col ?? this.selRect.c1
    const r2 = row !== undefined ? row : this.selRect.r2
    const c2 = col !== undefined ? col : this.selRect.c2
    const key = `${r1}-${c1}`
    this.pushHistory()
    const next = { ...this.merges }
    const existing = next[key]
    if (existing) {
      delete next[key]
      this.notify('已取消合并')
    } else {
      const rs = Math.max(1, r2 - r1 + 1)
      const cs = Math.max(1, c2 - c1 + 1)
      if (rs === 1 && cs === 1) { this.notify('请先选中多个单元格再合并'); return }
      // 清除块内的其它合并，避免重叠
      for (const k of Object.keys(next)) {
        const [sr, sc] = k.split('-').map(Number)
        const sp = next[k]
        const overlaps = sr < r1 + rs && sr + sp.rs > r1 && sc < c1 + cs && sc + sp.cs > c1
        if (overlaps) delete next[k]
      }
      next[key] = { rs, cs }
      this.notify(`已合并 ${rs} 行 × ${cs} 列`)
    }
    this.merges = next
  }

  /** 填充颜色：循环 4 色，作用于整个选区 */
  private fillCell(row?: number, col?: number): void {
    if (!this.hasSelection) { this.notify('请先选择一个或多个单元格'); return }
    this.pushHistory()
    const palette = ['', '#fef9c3', '#dcfce7', '#dbeafe', '#fee2e2']
    const r1 = row ?? this.selRect.r1
    const c1 = col ?? this.selRect.c1
    const r2 = row !== undefined ? row : this.selRect.r2
    const c2 = col !== undefined ? col : this.selRect.c2
    const current = this.fills[`${r1}-${c1}`] ?? ''
    const index = palette.indexOf(current)
    const nextColor = palette[(index + 1) % palette.length]
    const next = { ...this.fills }
    const maxRow = Math.min(r2, Math.max(0, this.visibleRows.length - 1))
    const maxCol = Math.min(c2, this.columnOrder.length - 1)
    for (let r = r1; r <= maxRow; r++) for (let c = c1; c <= maxCol; c++) {
      if (nextColor) next[`${r}-${c}`] = nextColor
      else delete next[`${r}-${c}`]
    }
    this.fills = next
    const count = (maxRow - r1 + 1) * (maxCol - c1 + 1)
    this.notify(nextColor ? `已填充 ${count} 个单元格` : '已清除填充')
  }

  private renderCell(row: DemoRow, key: string, rowIndex?: number, colIndex?: number): TemplateResult | string | number {
    if (key === 'no') return row.no
    if (key === 'region') return row.region
    if (key === 'dept') return row.dept
    if (key === 'amount') return this.formatAmount(row.amount, rowIndex, colIndex)
    if (key === 'rate') {
      return html`
        <span class="rate">
          <span class="track"><span class="fill" style="width:${row.rate}%"></span></span>
          <span class="num">${row.rate}%</span>
        </span>
      `
    }
    if (key === 'owner') return row.owner
    if (key === 'note') return row.note
    return ''
  }

  // ---------- 右侧属性面板 ----------

  private renderInspector(): TemplateResult {
    const tabs = ['格式', '数据', '高级'] as const
    return html`
      <aside class="inspector">
        <div class="inspector-head">
          <span>单元格设置</span>
          <button class="icon-btn" title="关闭面板" style="width:24px;height:24px" @click=${() => { this.inspectorVisible = false }}>
            ${sxIcon('close', 15)}
          </button>
        </div>
        <div class="inspector-tabs">
          ${tabs.map(
            (tab) => html`
              <button class="inspector-tab ${this.inspectorTab === tab ? 'active' : ''}" @click=${() => { this.inspectorTab = tab }}>${tab}</button>
            `,
          )}
        </div>
        <div class="inspector-body">
          <div>
            <span class="field-label">单元格类型</span>
            <div
              class="field-select"
              @click=${(event: Event) =>
                openMenu(
                  event.currentTarget as HTMLElement,
                  ['文本', '数值', '日期', '下拉选择', '复选框'].map((type) => ({
                    label: type,
                    checked: this.cellType === type,
                    onSelect: () => {
                      this.cellType = type
                      this.notify(`单元格类型：${type}`)
                    },
                  })),
                  { minWidth: 150 },
                )}
            >${this.cellType} <span class="caret">${sxIcon('chevronDown', 13)}</span></div>
          </div>

          <div class="inspector-divider"></div>

          <div>
            <span class="field-label">字体</span>
            <div class="field-row">
              <div
                class="field-select"
                @click=${(event: Event) =>
                  openMenu(
                    event.currentTarget as HTMLElement,
                    availableFontFamilies().map((name) => ({
                      label: name,
                      checked: this.focusFontFamily === name,
                      onSelect: () => this.applyCellStyle({ fontFamily: name }, `字体：${name}`),
                    })),
                    { minWidth: 150 },
                  )}
              >${this.focusFontFamily} <span class="caret">${sxIcon('chevronDown', 13)}</span></div>
              <div
                class="field-select"
                style="flex:0 0 54px"
                @click=${(event: Event) =>
                  openMenu(
                    event.currentTarget as HTMLElement,
                    FONT_SIZES.map((size) => ({
                      label: String(size),
                      checked: this.focusFontSize === size,
                      onSelect: () => this.applyCellStyle({ fontSize: size }, `字号：${size}px`),
                    })),
                    { minWidth: 90 },
                  )}
              >${this.focusFontSize} <span class="caret">${sxIcon('chevronDown', 13)}</span></div>
            </div>
          </div>
          <div class="btn-group">
            ${(
              [
                ['bold', this.focusBold, () => this.applyCellStyle({ bold: !this.focusBold }, `加粗：${!this.focusBold ? '开' : '关'}`)],
                ['italic', this.focusItalic, () => this.applyCellStyle({ italic: !this.focusItalic }, `斜体：${!this.focusItalic ? '开' : '关'}`)],
                ['underline', this.focusUnderline, () => this.applyCellStyle({ underline: !this.focusUnderline }, `下划线：${!this.focusUnderline ? '开' : '关'}`)],
                ['fontColor', this.focusColor !== '#1f2937', () => this.applyCellStyle({ color: this.focusColor === '#d64545' ? '#1f2937' : '#d64545' }, '切换字体颜色')],
              ] as const
            ).map(
              ([name, active, onClick], index) => html`
                <button class="tool-btn ${active ? 'active' : ''} ${index === 3 ? 'fcolor' : ''}" title=${name} @click=${onClick}>
                  ${sxIcon(name, 15)}
                </button>
              `,
            )}
          </div>

          <div class="inspector-divider"></div>

          <div>
            <span class="field-label">对齐方式</span>
            <div class="btn-group">
              ${(['left', 'center', 'right', 'justify'] as const).map(
                (mode) => html`
                  <button
                    class="tool-btn ${(this.hasSelection ? (this.cellAlign[`${this.selectedCell.row}-${this.selectedCell.col}`] ?? this.alignMode) : this.alignMode) === mode ? 'active' : ''}"
                    @click=${() => this.applyAlign(mode)}
                    title=${mode}
                  >
                    ${sxIcon(`align${mode[0]!.toUpperCase()}${mode.slice(1)}` as Parameters<typeof sxIcon>[0], 15)}
                  </button>
                `,
              )}
            </div>
            <div class="btn-group" style="margin-top:4px">
              ${(['top', 'middle', 'bottom'] as const).map(
                (v) => html`
                  <button
                    class="tool-btn ${this.focusVAlign === v ? 'active' : ''}"
                    title=${v}
                    @click=${() => this.applyCellStyle({ vAlign: v }, `垂直对齐：${v}`)}
                  >${sxIcon(`valign${v[0]!.toUpperCase()}${v.slice(1)}` as Parameters<typeof sxIcon>[0], 15)}</button>
                `,
              )}
            </div>
          </div>

          <div class="inspector-divider"></div>

          <div>
            <span class="field-label">边框</span>
            <div class="border-row">
              ${(['valignTop', 'alignLeft', 'alignRight', 'valignBottom'] as const).map(
                (name) => html`
                  <button class="tool-btn" title=${name} @click=${() => this.notify('已应用边框')}>${sxIcon(name, 14)}</button>
                `,
              )}
              <span class="swatch-label">颜色 <span class="swatch color"></span></span>
            </div>
          </div>

          <div>
            <span class="field-label">填充颜色</span>
            <span class="swatch fill" style="display:inline-block;width:100%;height:24px"></span>
          </div>
        </div>
        <button class="clear-format" @click=${() => this.clearFormat()}>${sxIcon('close', 13)} 清除格式</button>
      </aside>
    `
  }

  private renderReopenButton(): TemplateResult {
    return html`
      <button class="icon-btn inspector-reopen" title="打开单元格设置" @click=${() => { this.inspectorVisible = true }}>
        ${sxIcon('settings', 17)}
      </button>
    `
  }

  // ---------- 工作表标签 ----------

  private renderSheetTabs(): TemplateResult {
    return html`
      <div class="sheet-tabs">
        <button class="tab-add" title="添加工作表" @click=${() => this.addSheet()}>${sxIcon('plus', 15)}</button>
        ${this.sheetNames.filter((name) => !this.hiddenSheets.includes(name)).map(
          (name) => html`
            <button
              class="sheet-tab ${this.activeSheet === name ? 'active' : ''}"
              style=${this.sheetColors[name] ? `box-shadow: inset 0 -3px ${this.sheetColors[name]}` : ''}
              @click=${() => { this.activeSheet = name }}
              @contextmenu=${(event: MouseEvent) => this.openSheetMenu(event, name)}
            >${name}</button>
          `,
        )}
        <button class="tab-add" title="添加工作表" @click=${() => this.addSheet()}>${sxIcon('plus', 15)}</button>
        <span class="zoom">
          <button class="tool-btn" title="缩小" @click=${() => this.setZoom(this.zoom - 10)}>${sxIcon('zoomOut', 14)}</button>
          <input type="range" min="50" max="150" step="10" .value=${String(this.zoom)}
            @input=${(e: Event) => this.setZoom(Number((e.target as HTMLInputElement).value))} />
          <span class="zoom-value">${this.zoom}%</span>
          <button class="tool-btn" title="放大" @click=${() => this.setZoom(this.zoom + 10)}>${sxIcon('zoomIn', 14)}</button>
        </span>
      </div>
    `
  }

  /** Sheet 标签右键菜单（参考 WPS：插入/删除/重命名/复制/移动/隐藏/标签颜色/保护） */
  private openSheetMenu(event: MouseEvent, name: string): void {
    event.preventDefault()
    event.stopPropagation()
    const index = this.sheetNames.indexOf(name)
    const isLast = this.sheetNames.length <= 1
    const hiddenNames = this.sheetNames.filter((item) => this.hiddenSheets.includes(item))
    const anchor = (event.currentTarget as HTMLElement | null) ?? (event.target as HTMLElement | null) ?? this.renderRoot.querySelector('.sheet-tabs') as HTMLElement
    openMenu(anchor, [
      { label: '插入工作表(I)…', icon: 'plus', onSelect: () => this.insertSheetAfter(name) },
      { label: '删除(D)', icon: 'trash', danger: true, disabled: isLast, onSelect: () => this.deleteSheet(name) },
      { separator: true },
      {
        label: '移动或复制工作表(M)…', icon: 'arrowRight',
        onSelect: () => openMenu(this.renderRoot.querySelector('.sheet-tabs') as HTMLElement, [
          { label: '左移一位', icon: 'arrowLeft', disabled: index <= 0, onSelect: () => this.moveSheet(name, -1) },
          { label: '右移一位', icon: 'arrowRight', disabled: index >= this.sheetNames.length - 1, onSelect: () => this.moveSheet(name, 1) },
          { separator: true },
          { label: '创建副本(W)', icon: 'copy', onSelect: () => this.duplicateSheet(name) },
        ]),
      },
      { label: '隐藏(H)', icon: 'eye', disabled: isLast, onSelect: () => this.hideSheet(name) },
      {
        label: '取消隐藏(U)…', icon: 'eye', disabled: hiddenNames.length === 0,
        onSelect: () => openMenu(this.renderRoot.querySelector('.sheet-tabs') as HTMLElement,
          hiddenNames.map((item) => ({ label: item, icon: 'gridView', onSelect: () => this.showSheet(item) }))),
      },
      { separator: true },
      { label: '重命名(R)', icon: 'edit', onSelect: () => this.renameSheet(name) },
      {
        label: '工作表标签颜色(T)', icon: 'palette',
        onSelect: () => openMenu(this.renderRoot.querySelector('.sheet-tabs') as HTMLElement,
          ['#059669', '#2563eb', '#dc2626', '#f59e0b', '#8b5cf6', ''].map((color) => ({
            label: color ? '　' : '无颜色',
            icon: 'palette',
            checked: (this.sheetColors[name] ?? '') === color,
            onSelect: () => this.setColor(name, color),
          }))),
      },
      {
        label: this.protectedSheets.includes(name) ? '撤销工作表保护' : '保护工作表(P)…',
        icon: this.protectedSheets.includes(name) ? 'checkCircle' : 'lock',
        onSelect: () => this.toggleProtect(name),
      },
      { separator: true },
      { label: '选定全部工作表(S)', icon: 'checkbox', onSelect: () => this.notify(`已选定全部 ${this.sheetNames.length} 个工作表`) },
    ], { minWidth: 210 })
  }

  private insertSheetAfter(name: string): void {
    const index = this.sheetNames.indexOf(name)
    let n = this.sheetNames.length + 1
    let newName = `工作表${n}`
    while (this.sheetNames.includes(newName)) { n++; newName = `工作表${n}` }
    const names = [...this.sheetNames]
    names.splice(index + 1, 0, newName)
    this.sheetNames = names
    this.sheetData = { ...this.sheetData, [newName]: [] }
    this.activeSheet = newName
    this.saveSheetData()
  }

  private deleteSheet(name: string): void {
    if (this.sheetNames.length <= 1) return
    this.sheetNames = this.sheetNames.filter((item) => item !== name)
    const next = { ...this.sheetData }
    delete next[name]
    this.sheetData = next
    this.hiddenSheets = this.hiddenSheets.filter((item) => item !== name)
    if (this.activeSheet === name) this.activeSheet = this.sheetNames[0]!
    this.saveSheetData()
    this.notify(`已删除工作表「${name}」`)
  }

  private moveSheet(name: string, delta: number): void {
    const names = [...this.sheetNames]
    const index = names.indexOf(name)
    const target = index + delta
    if (index < 0 || target < 0 || target >= names.length) return
    ;[names[index], names[target]] = [names[target]!, names[index]!]
    this.sheetNames = names
    this.saveSheetData()
  }

  private duplicateSheet(name: string): void {
    let n = this.sheetNames.length + 1
    let newName = `${name} (2)`
    while (this.sheetNames.includes(newName)) { n++; newName = `${name} (${n})` }
    const index = this.sheetNames.indexOf(name)
    const names = [...this.sheetNames]
    names.splice(index + 1, 0, newName)
    this.sheetNames = names
    this.sheetData = { ...this.sheetData, [newName]: [...(this.sheetData[name] ?? [])].map((row) => ({ ...row })) }
    if (this.sheetColors[name]) this.sheetColors = { ...this.sheetColors, [newName]: this.sheetColors[name]! }
    this.activeSheet = newName
    this.saveSheetData()
  }

  private hideSheet(name: string): void {
    if (this.sheetNames.length <= 1) return
    this.hiddenSheets = [...this.hiddenSheets, name]
    if (this.activeSheet === name) this.activeSheet = this.sheetNames.find((item) => !this.hiddenSheets.includes(item)) ?? this.sheetNames[0]!
    this.saveSheetData()
  }

  private showSheet(name: string): void {
    this.hiddenSheets = this.hiddenSheets.filter((item) => item !== name)
    this.activeSheet = name
    this.saveSheetData()
  }

  private renameSheet(name: string): void {
    const next = window.prompt('重命名工作表', name)
    if (!next || next.trim() === name) return
    const trimmed = next.trim()
    if (this.sheetNames.includes(trimmed)) { this.notify(`工作表「${trimmed}」已存在`); return }
    this.sheetNames = this.sheetNames.map((item) => (item === name ? trimmed : item))
    if (name in this.sheetData) {
      const data = { ...this.sheetData }
      data[trimmed] = data[name]!
      delete data[name]
      this.sheetData = data
    }
    if (name in this.sheetColors) {
      const colors = { ...this.sheetColors }
      colors[trimmed] = colors[name]!
      delete colors[name]
      this.sheetColors = colors
    }
    if (this.activeSheet === name) this.activeSheet = trimmed
    this.saveSheetData()
  }

  private setColor(name: string, color: string): void {
    const colors = { ...this.sheetColors }
    if (color) colors[name] = color
    else delete colors[name]
    this.sheetColors = colors
    this.saveSheetData()
  }

  private toggleProtect(name: string): void {
    this.protectedSheets = this.protectedSheets.includes(name)
      ? this.protectedSheets.filter((item) => item !== name)
      : [...this.protectedSheets, name]
    this.saveSheetData()
    this.notify(this.protectedSheets.includes(name) ? `工作表「${name}」已保护` : `工作表「${name}」已取消保护`)
  }


  // ---------- 选择（区域 / 整行 / 整列） ----------

  /** 开始选择：mousedown 落在单元格 → 锚点重置 */
  private beginSelect(row: number, col: number): void {
    this.hasSelection = true
    this.selectMode = 'cell'
    this.anchorCell = { row, col }
    this.selectedCell = { row, col }
    this.dragging = true
  }

  /** 拖拽过程中移动到某单元格 → 扩展焦点 */
  private extendSelect(row: number, col: number): void {
    if (!this.dragging) return
    if (this.selectMode !== 'cell') return
    this.selectedCell = { row, col }
  }

  private endSelect(): void {
    this.dragging = false
  }

  /** 列头按下：选中整列并进入横拖选列状态 */
  private beginColSelect(ci: number, shift = false): void {
    this.hasSelection = true
    this.dragging = false
    this.colSelecting = true
    this.selectMode = 'col'
    if (shift) {
      this.selectedCell = { row: this.selectedCell.row, col: ci }
    } else {
      this.anchorCell = { row: 0, col: ci }
      this.selectedCell = { row: 0, col: ci }
    }
    const count = Math.abs(this.selectedCell.col - this.anchorCell.col) + 1
    this.notify(count > 1 ? `已选中 ${count} 列` : `已选中 ${this.colLabel(ci)} 列`)
  }

  /** 横向拖过列头：扩展选中列范围 */
  private extendColSelect(ci: number): void {
    if (!this.colSelecting) return
    this.selectedCell = { row: this.selectedCell.row, col: ci }
    const count = Math.abs(this.selectedCell.col - this.anchorCell.col) + 1
    this.notify(`已选中 ${count} 列（${this.colLabel(Math.min(this.anchorCell.col, ci))}:${this.colLabel(Math.max(this.anchorCell.col, ci))}）`)
  }

  private endColSelect(): void {
    this.colSelecting = false
  }

  /** 行号按下：选中整行并进入纵拖选行状态 */
  private rowSelectMove: ((e: PointerEvent) => void) | null = null
  private rowSelectUp: (() => void) | null = null

  private beginRowSelect(ri: number, shift = false): void {
    this.hasSelection = true
    this.dragging = false
    this.colSelecting = false
    this.rowSelecting = true
    this.selectMode = 'row'
    const dataRow = Math.max(0, ri)
    if (shift) this.selectedCell = { row: dataRow, col: this.selectedCell.col }
    else {
      this.anchorCell = { row: dataRow, col: 0 }
      this.selectedCell = { row: dataRow, col: 0 }
    }
    this.notify(`已选中第 ${dataRow + 2} 行`)

    // 用 document 级 pointermove 跟踪：鼠标从任意方向进入行号都能扩展选区，
    // 不依赖 th 的 mouseenter（快速拖动或从单元格区域穿入时会漏事件）。
    this.rowSelectMove = (e: PointerEvent) => {
      if (!this.rowSelecting) return
      const target = e.target as HTMLElement | null
      const head = target?.closest('th.row-head') as HTMLElement | null
      const row = head?.dataset?.row
      if (!row) return
      const next = Number(row)
      if (!Number.isFinite(next)) return
      this.extendRowSelect(next)
    }
    this.rowSelectUp = () => this.endRowSelect()
    document.addEventListener('pointermove', this.rowSelectMove)
    document.addEventListener('pointerup', this.rowSelectUp, { once: true })
  }

  /** 纵拖过行号：扩展选中行范围 */
  private extendRowSelect(ri: number): void {
    if (!this.rowSelecting) return
    this.selectedCell = { row: Math.max(0, ri), col: this.selectedCell.col }
    const count = Math.abs(this.selectedCell.row - this.anchorCell.row) + 1
    this.notify(`已选中 ${count} 行`)
  }

  private endRowSelect(): void {
    this.rowSelecting = false
    if (this.rowSelectMove) document.removeEventListener('pointermove', this.rowSelectMove)
    this.rowSelectMove = null
    this.rowSelectUp = null
  }

  /** 左上角：全选 */
  private selectAll(): void {
    this.hasSelection = true
    this.selectMode = 'all'
    this.anchorCell = { row: 0, col: 0 }
    this.selectedCell = { row: 0, col: 0 }
    this.notify('已全选')
  }

  /** 键盘方向键移动焦点（Shift 扩展选区） */
  private moveSelection(dRow: number, dCol: number, extend: boolean): void {
    if (!this.hasSelection) { this.hasSelection = true; return }
    const maxRow = Math.max(TOTAL_ROWS - 2, this.visibleRows.length - 1)
    const maxCol = this.columnOrder.length + FILLER_COLS - 1
    const nr = Math.max(0, Math.min(maxRow, this.selectedCell.row + dRow))
    const nc = Math.max(0, Math.min(maxCol, this.selectedCell.col + dCol))
    if (!extend) {
      this.selectMode = 'cell'
      this.anchorCell = { row: nr, col: nc }
    }
    this.selectedCell = { row: nr, col: nc }
  }

  /** 表格键盘交互：方向键移动 / Shift 扩展 / Delete 清除 / Ctrl+A 全选 */
  private onGridKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
    const mod = event.ctrlKey || event.metaKey
    if (mod && event.key.toLowerCase() === 'a') { event.preventDefault(); this.selectAll(); return }
    if (mod) return
    const map: Record<string, [number, number]> = {
      ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1],
    }
    const delta = map[event.key]
    if (delta) {
      event.preventDefault()
      this.moveSelection(delta[0], delta[1], event.shiftKey)
      return
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault()
      this.clearSelection()
      return
    }
    if (event.key === 'Enter' && this.hasSelection) {
      event.preventDefault()
      this.beginEdit(this.selectedCell.row, this.selectedCell.col)
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      this.hasSelection = false
      this.dragging = false
      this.notify('已取消选择')
    }
  }

  /** 清除选中区域内所有单元格内容 */
  private clearSelection(): void {
    if (!this.hasSelection) { this.notify('请先选择一个或多个单元格'); return }
    const { r1, r2, c1, c2 } = this.selRect
    const maxDataRow = this.visibleRows.length - 1
    const maxDataCol = this.columnOrder.length - 1
    if (r1 > maxDataRow || c1 > maxDataCol) { this.notify('选区无数据可清除'); return }
    this.pushHistory()
    const cleared = this.rows.map((row) => {
      const index = this.rows.indexOf(row)
      if (index < r1 || index > Math.min(r2, maxDataRow)) return row
      const patch: Record<string, unknown> = {}
      for (let c = c1; c <= Math.min(c2, maxDataCol); c++) {
        const col = demoColumns[this.columnOrder[c]]
        if (col) patch[col.key] = col.key === 'amount' || col.key === 'rate' || col.key === 'no' ? 0 : ''
      }
      return { ...row, ...patch }
    })
    this.writeRows(cleared)
    this.notify(`已清除选区 ${r2 - r1 + 1} 行 × ${c2 - c1 + 1} 列`)
  }

  // ---------- 交互实现 ----------

  private notify(message: string): void {
    // 状态栏已移除（Sheet 行即最底部）；仍保留通知入口供宿主/调试读取
    this.statusMessage = message
    void this.statusMessage
  }

  private applySort(key: SortKey, dir: 'asc' | 'desc'): void {
    this.sortKey = key
    this.sortDir = dir
    this.selectedCell = { row: 0, col: this.selectedCell.col }
    this.notify(key === null ? '已恢复默认顺序' : `按${key === 'amount' ? '销售额' : '完成率'}${dir === 'asc' ? '升序' : '降序'}排列`)
  }

  private applyFilter(rate: FilterRate): void {
    this.filterRate = rate
    this.selectedCell = { row: 0, col: this.selectedCell.col }
    this.notify(rate === 'all' ? '已显示全部行' : rate === 'high' ? '已筛选：完成率 ≥ 80%' : '已筛选：完成率 < 80%')
  }

  private setCondRule(rule: CondRule): void {
    this.condRule = rule
    this.notify(rule === 'none' ? '已清除条件格式' : rule === 'high' ? '条件格式：≥90% 绿色高亮' : '条件格式：<70% 红色高亮')
  }

  private toggleFreeze(): void {
    this.frozen = !this.frozen
    this.notify(this.frozen ? '已冻结表头行' : '已取消冻结')
  }

  private setViewMode(mode: 'grid' | 'card'): void {
    this.viewMode = mode
    this.notify(mode === 'grid' ? '网格视图' : '卡片视图')
  }

  private addSheet(): void {
    const name = `工作表${this.sheetNames.length + 1}`
    this.sheetNames = [...this.sheetNames, name]
    // 全新空表格：不复制任何数据
    this.sheetData = { ...this.sheetData, [name]: [] }
    this.activeSheet = name
    this.saveSheetData()
    // 新建工作表不写状态栏
  }

  private beginEdit(row: number, col: number): void {
    const target = this.visibleRows[row]
    const column = demoColumns[col]
    if (!target || !column) return
    this.selectedCell = { row, col }
    this.editValue = String((target as unknown as Record<string, unknown>)[column.key] ?? '')
    this.editing = { row, col }
    void this.updateComplete.then(() => {
      const input = this.renderRoot.querySelector('.cell-editor') as HTMLInputElement | null
      input?.focus()
      input?.select()
    })
  }

  private commitEdit(): void {
    const editing = this.editing
    if (!editing) return
    this.commitCellValue(editing.row, editing.col, this.editValue)
    this.editing = null
  }

  /** 写回单元格：直接写全局 store（首页统计与其他页面同步，且持久化） */
  private commitCellValue(rowIndex: number, colIndex: number, value: string): void {
    if (this.protectedSheets.includes(this.activeSheet)) { this.notify(`工作表「${this.activeSheet}」已保护，无法编辑`); return }
    const target = this.visibleRows[rowIndex]
    const column = demoColumns[colIndex]
    if (!target || !column) return
    // 数据验证：不符合规则时拒绝写入并提示
    const invalid = this.validateValue(rowIndex, colIndex, value)
    if (invalid) { this.notify(invalid); return }
    const patch: Record<string, unknown> = {}
    if (column.key === 'amount' || column.key === 'rate' || column.key === 'no') {
      const numeric = Number(value)
      if (!Number.isFinite(numeric)) { this.notify(`验证失败：${column.title}需为数字`); return }
      patch[column.key] = numeric
    } else {
      patch[column.key] = value
    }
    this.pushHistory()
    this.writeRows(this.rows.map((r) => (r.no === target.no ? { ...r, ...patch } : r)))
    this.notify(`已更新 ${this.colLabel(colIndex)}${rowIndex + 2}：${value}`)
  }

  /** 当前选中单元格的验证规则 */
  private get currentValidation(): { type: 'int' | 'decimal' | 'date'; min?: number; max?: number } | undefined {
    return this.validations[`${this.selectedCell.row}-${this.selectedCell.col}`]
  }

  private applyValidation(type: 'int' | 'decimal' | 'date'): void {
    const key = `${this.selectedCell.row}-${this.selectedCell.col}`
    const rule =
      type === 'int' ? { type, min: 0, max: 1000 } as const
      : type === 'decimal' ? { type, min: 0 } as const
      : { type } as const
    this.validations = { ...this.validations, [key]: rule }
    const addr = `${this.colLabel(this.selectedCell.col)}${this.selectedCell.row + 2}`
    this.notify(`已为 ${addr} 设置验证：${type === 'int' ? '整数 0-1000' : type === 'decimal' ? '小数 ≥ 0' : '日期在今天之后'}`)
  }

  private clearValidation(): void {
    const key = `${this.selectedCell.row}-${this.selectedCell.col}`
    const next = { ...this.validations }
    delete next[key]
    this.validations = next
    this.notify('已清除数据验证')
  }

  /** 校验输入值是否符合规则，返回错误信息或 null */
  private validateValue(rowIndex: number, colIndex: number, value: string): string | null {
    const rule = this.validations[`${rowIndex}-${colIndex}`]
    if (!rule) return null
    if (rule.type === 'int') {
      const n = Number(value)
      if (!Number.isInteger(n)) return '验证失败：需为整数'
      if (rule.min !== undefined && n < rule.min) return `验证失败：不能小于 ${rule.min}`
      if (rule.max !== undefined && n > rule.max) return `验证失败：不能大于 ${rule.max}`
    } else if (rule.type === 'decimal') {
      const n = Number(value)
      if (!Number.isFinite(n)) return '验证失败：需为数字'
      if (rule.min !== undefined && n < rule.min) return `验证失败：不能小于 ${rule.min}`
    } else if (rule.type === 'date') {
      const d = new Date(value)
      if (Number.isNaN(d.getTime())) return '验证失败：非合法日期'
      if (d.getTime() < Date.now() - 86400000) return '验证失败：日期需在今天之后'
    }
    return null
  }

  private insertFormula(formula: string): void {
    this.notify(`已插入公式 ${formula}（结果：${computeStats(this.visibleRows).sum}）`)
  }

  private clearFormat(): void {
    if (!this.hasSelection) { this.notify('请先选择一个或多个单元格'); return }
    this.pushHistory()
    const { r1, r2, c1, c2 } = this.selRect
    const maxRow = Math.min(r2, Math.max(0, this.visibleRows.length - 1))
    const maxCol = Math.min(c2, this.columnOrder.length - 1)
    const nextStyles = { ...this.cellStyles }
    const nextAlign = { ...this.cellAlign }
    for (let r = r1; r <= maxRow; r++) for (let c = c1; c <= maxCol; c++) {
      delete nextStyles[`${r}-${c}`]
      delete nextAlign[`${r}-${c}`]
    }
    this.cellStyles = nextStyles
    this.cellAlign = nextAlign
    this.notify('已清除选区格式')
  }

  private toggleFullscreen(): void {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void document.documentElement.requestFullscreen()
  }

  private stopTheme: (() => void) | null = null

  connectedCallback(): void {
    super.connectedCallback()
    this.stopTheme = bindPageTheme((resolved) => {
      this.theme = resolved
      this.requestUpdate()
    })
    // 注册并加载 SDK 内置字体：表格用它渲染、导出直接复用它
    installFontAssets()
    void SheetXFonts.registerBuiltins({ load: true }).then(() => {
      this.fontsReady = true
      this.requestUpdate()
    })
  }

  disconnectedCallback(): void {
    this.stopTheme?.()
    this.stopTheme = null
    super.disconnectedCallback()
  }

  private toggleTheme(): void {
    toggleGlobalTheme()
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sheetx-app': SheetXApp
  }
}
