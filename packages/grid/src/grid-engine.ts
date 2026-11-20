/**
 * @sheetx/grid - 业务数据网格（任务书 T6，集成中枢）
 *
 * 组装：data(T1) + renderer(T2) + interaction(T3) + editors(T4) + validation(T9)
 *      + data-adapter(T7) + themes(T11)，对外输出统一公共 API。
 *
 * DOM 结构（native scrollbar 方案）：
 *   root（position:relative，tabindex=0，接收键盘/指针）
 *   ├── scrollDiv（overflow:auto —— 原生滚动条免实现）
 *   │     └── spacer（撑出内容总尺寸，产生滚动量）
 *   ├── canvas（absolute inset-0，pointer-events:none —— 渲染叠在滚动区上）
 *   └── editorHost（absolute，pointer-events:none —— 编辑器子元素各自 auto）
 *
 * 事件纪律：interaction 只发语义命令；命令在这里翻译成 mutation（可撤销、可广播）；
 * 数据变化经 core DATA_CHANGED 事件回流 → 标内容脏 → rAF 合帧重绘。
 */

import type { Appearance } from '@sheetx/ui'
import type {
  CellRange,
  CellValue,
  PivotConfig,
  PivotResult,
  ChartFromRecordsConfig,
  ColumnDef,
  Disposable,
  RowData,
  UnknownRecord,
  ValueFormatter,
  DataTransaction,
  ConditionalRule,
  Rect,
  RendererConfig,
  SheetXRenderer,
  HitResult,
} from '@sheetx/core'
import { evaluateConditionalFormat, buildPivotTable, chartFromRecords, buildChartSvg } from '@sheetx/core'
import { PublicEvent } from '@sheetx/core'
import type { IEventBus } from '@sheetx/core'
import { EventBus } from '@sheetx/core'
import {
  CommandService,
  GridStore,
  buildSetCellsParams,
  normalizeRows,
  registerGridMutations,
} from '@sheetx/data'
import type { InsertRowsParams } from '@sheetx/data'
import { Canvas2DRenderer, RenderScheduler, fontString, unionRects, createRenderer } from '@sheetx/renderer'
import type { InteractionCallbacks, SemanticCommand } from '@sheetx/interaction'
import { InputController } from '@sheetx/interaction'
import type { CommitMeta, EditorHandle, EditorRegistry } from '@sheetx/editors'
import { BuiltinEditorNames, createDefaultEditorRegistry } from '@sheetx/editors'
import { ValidationEngine } from '@sheetx/validation'
import type { ValidationError } from '@sheetx/validation'
import type { IDataAdapter } from '@sheetx/data-adapter'
import { LocalAdapter } from '@sheetx/data-adapter'
import type { ThemeTokens } from '@sheetx/themes'
import { ThemeRegistry, applyTheme } from '@sheetx/themes'
import { GridLayout, ROW_HEADER_WIDTH, COL_HEADER_HEIGHT } from './layout/grid-layout.js'
import { buildGridScene } from './scene/grid-scene-builder.js'
import { PopupHostManager } from './popup-host.js'
import type { EditorHostMode } from './popup-host.js'
import { deriveFillSeries } from './fill-series.js'

/** Grid 专用列定义（在 core ColumnDef 上追加编辑器参数） */
export interface GridColumnDef extends ColumnDef {
  /** 传给编辑器的参数（precision/options/query 等，见编辑器包文档） */
  editorParams?: UnknownRecord
}

export interface GridFeatures {
  /** 虚拟滚动（布局恒为虚拟化；此开关保留用于关闭缓冲区调参） */
  virtualScroll?: boolean
  clipboard?: boolean
  undoRedo?: boolean
  rowSelection?: boolean
  /** 是否允许编辑（总开关；列级用 ColumnDef.editable） */
  editing?: boolean
  showRowNumbers?: boolean
  /** 校验失败阻止提交（默认 true；false 时仅派发事件） */
  strictValidation?: boolean
}

export interface GridConfig {
  container: HTMLElement | string
  columns: ReadonlyArray<GridColumnDef>
  data?: ReadonlyArray<UnknownRecord>
  /** 远程/自定义数据源；缺省用 LocalAdapter（内存数组） */
  adapter?: IDataAdapter
  features?: GridFeatures
  /** 默认行高（px），默认 28 */
  rowHeight?: number
  /** 默认列宽（px），默认 100 */
  colWidth?: number
  /** 主题名（light/dark）或令牌对象 */
  theme?: ThemeTokens | string
  /** 外观预设（compact/standard/spreadsheet）与部件开关；缺省 compact */
  appearance?: Appearance
  /** 开发调试：脏矩形描红可视化 */
  /** 渲染器选择（可选）；缺省保持既有 Canvas2DRenderer 行为不变 */
  renderer?: RendererConfig
  debug?: boolean
  /** E4：编辑器宿主模式——body = 弹出层挂 document.body（下拉不被表格边界裁切） */
  editorHostMode?: EditorHostMode
}

/** before-edit 事件载荷（监听器调用 cancel() 可阻止编辑） */
export interface BeforeEditPayload {
  rowId: string
  field: string
  row: number
  col: number
  value: unknown
  canceled: boolean
  cancel(): void
}

export interface AfterEditPayload {
  rowId: string
  field: string
  row: number
  col: number
  oldValue: unknown
  newValue: unknown
  committed: boolean
}

interface EditingState {
  row: number
  col: number
  rowId: string
  field: string
  handle: EditorHandle
}

/** 排序比较器：数值按大小、其余按中文 locale、空值恒排末尾（Excel 习惯） */
function compareCellValues(a: unknown, b: unknown): number {
  if (Object.is(a, b)) return 0
  const aEmpty = a === null || a === undefined || a === ''
  const bEmpty = b === null || b === undefined || b === ''
  if (aEmpty) return 1
  if (bEmpty) return -1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), 'zh-CN', { numeric: true })
}

const ROOT_STYLE = 'position:relative;width:100%;height:100%;overflow:hidden;outline:none;user-select:none;background:var(--sx-color-bg,#fff)'
const SCROLL_STYLE = 'position:absolute;inset:0;overflow:auto;scrollbar-gutter:stable'
const CANVAS_STYLE = 'position:absolute;inset:0;pointer-events:none'
const EDITOR_HOST_STYLE = 'position:absolute;inset:0;pointer-events:none;overflow:visible'

export class SheetXGrid implements Disposable {
  // ---------- 数据与命令 ----------
  private readonly store: GridStore
  private readonly commands: CommandService<GridStore>
  private readonly bus = new EventBus()
  readonly validation = new ValidationEngine({ eventBus: this.bus })
  /** 数据适配器（宿主可读取以扩展；引擎后续版本用它实现远程加载编排） */
  readonly adapter: IDataAdapter
  /** E4：编辑器弹出层宿主管理（inline / body / 自定义宿主） */
  private readonly popup = new PopupHostManager({ getRoot: () => this.root })
  private detachPopupChange: (() => void) | null = null

  // ---------- 布局与渲染 ----------
  private readonly layout = new GridLayout()
  private readonly renderer = new Canvas2DRenderer()
  /** 分层渲染器（高层契约；当前底层绘制仍由 renderer 承担，行为不变） */
  readonly layeredRenderer: SheetXRenderer
  private scheduler: RenderScheduler | null = null
  private themeTokens: ThemeTokens

  // ---------- 交互与编辑 ----------
  private readonly input = new InputController()
  private readonly editorRegistry: EditorRegistry
  private editing: EditingState | null = null
  private readonly features: Required<GridFeatures>
  /** T2 验收开关：脏矩形红框可视化（默认 false，零开销） */
  private readonly debugMode: boolean
  private readonly formatters = new Map<string, ValueFormatter>()
  private readonly themeRegistry = new ThemeRegistry()

  // ---------- DOM ----------
  private container: HTMLElement
  private root: HTMLElement | null = null
  private scrollDiv: HTMLElement | null = null
  private spacer: HTMLElement | null = null
  /** 渲染画布（公开：UI 层可读取 DPR 等信息；不要直接画） */
  canvas: HTMLCanvasElement | null = null
  private editorHost: HTMLElement | null = null
  private resizeObserver: ResizeObserver | null = null

  private destroyed = false
  private columnDefs: GridColumnDef[]
  /** 触摸/宿主缩放：相对基准尺寸的倍率（1 = 原始尺寸） */
  private zoomScale = 1
  private baseFontSize = 13
  private baseRowHeight = 30
  private baseColWidths: number[] = []
  private touchDist = 0
  private touchStartZoom = 1

  constructor(config: GridConfig) {
    this.container = resolveContainer(config.container)
    this.columnDefs = config.columns.map((def) => ({ ...def }))
    this.features = {
      virtualScroll: config.features?.virtualScroll ?? true,
      clipboard: config.features?.clipboard ?? true,
      undoRedo: config.features?.undoRedo ?? true,
      rowSelection: config.features?.rowSelection ?? true,
      editing: config.features?.editing ?? true,
      showRowNumbers: config.features?.showRowNumbers ?? true,
      strictValidation: config.features?.strictValidation ?? true,
    }
    this.themeTokens = resolveTheme(config.theme, this.themeRegistry)
    this.debugMode = config.debug ?? false
    this.layeredRenderer = createRenderer(config.renderer, {
      cellRect: (row, col) => this.layout.getCellRect(row, col),
      locate: (x, y) => {
        const hit = this.layout.hitTest({ x, y })
        if (!hit) return null
        const zone: HitResult['zone'] = hit.kind === 'rowHeader' ? 'row-header'
          : hit.kind === 'colHeader' ? 'col-header'
          : hit.kind === 'corner' ? 'corner' : 'body'
        return { row: hit.row, col: hit.col, zone }
      },
      colWidth: (col) => this.layout.cols.getWidth(col),
      rowHeight: (row) => this.layout.rows.getHeight(row),
    })
    if (config.editorHostMode) this.popup.setMode(config.editorHostMode)

    // 数据
    this.store = new GridStore(config.data ? normalizeRows(config.data) : [])
    this.adapter = config.adapter ?? LocalAdapter.fromRecords(config.data ?? [])

    // 命令系统（注册 Grid 内置 mutation；undo 纪律见 data 包文档）
    this.commands = new CommandService(this.store, 'grid', { eventBus: this.bus })
    registerGridMutations(this.commands)

    // 布局
    if (config.rowHeight !== undefined) this.layout.rows.setDefaultHeight(config.rowHeight)
    if (config.colWidth !== undefined) this.layout.cols.defaultWidth = config.colWidth
    this.layout.cols.setColumns(this.columnDefs)
    this.layout.rows.setRowCount(this.store.rowCount)

    // 编辑器注册表（UI 层/插件可继续注册）
    this.editorRegistry = createDefaultEditorRegistry()

    this.buildDom()
    this.bindEvents()
    this.applyThemeToDom()
    this.syncBounds()

    // 初始选区：A1
    this.input.selection.bounds = { rowCount: this.store.rowCount, colCount: this.layout.cols.count }
    if (this.store.rowCount > 0 && this.layout.cols.count > 0) {
      this.input.selection.setAnchor(0, 0)
    }

    // 缩放基准：取构造时的主题/行高/列宽；双指缩放只改倍率，不破坏用户后续的单列调整
    this.baseFontSize = this.themeTokens.fontSize
    this.baseRowHeight = this.layout.rows.defaultHeight
    this.baseColWidths = this.columnDefs.map((def) => def.width ?? this.layout.cols.defaultWidth)
    this.bindTouchZoom()
  }

  /**
   * 双指缩放（移动端）：单指保留原生 overflow 惯性滚动；双指按距离比例调整
   * 字号/行高/列宽（矢量重绘，非 CSS transform，不模糊）。宿主也可直接调 setZoom。
   */
  private bindTouchZoom(): void {
    const root = this.root
    if (!root || typeof window === 'undefined') return
    root.style.touchAction = 'pan-x pan-y'
    const distance = (touches: TouchList): number =>
      Math.hypot(touches[0]!.clientX - touches[1]!.clientX, touches[0]!.clientY - touches[1]!.clientY)
    root.addEventListener('touchstart', (event: TouchEvent) => {
      if (event.touches.length !== 2) return
      this.touchDist = distance(event.touches)
      this.touchStartZoom = this.zoomScale
    })
    root.addEventListener(
      'touchmove',
      (event: TouchEvent) => {
        if (event.touches.length !== 2 || this.touchDist <= 0) return
        event.preventDefault()
        this.setZoom(this.touchStartZoom * (distance(event.touches) / this.touchDist))
      },
      { passive: false },
    )
  }

  // ==========================================================================
  // DOM 组装
  // ==========================================================================

  private buildDom(): void {
    const root = document.createElement('div')
    root.className = 'sx-grid'
    root.setAttribute('role', 'grid')
    root.style.cssText = ROOT_STYLE
    root.tabIndex = 0

    const scrollDiv = document.createElement('div')
    scrollDiv.className = 'sx-grid-scroll'
    scrollDiv.style.cssText = SCROLL_STYLE
    const spacer = document.createElement('div')
    spacer.className = 'sx-grid-spacer'
    scrollDiv.appendChild(spacer)

    const canvas = document.createElement('canvas')
    canvas.className = 'sx-grid-canvas'
    canvas.style.cssText = CANVAS_STYLE

    const editorHost = document.createElement('div')
    editorHost.className = 'sx-grid-editors'
    editorHost.style.cssText = EDITOR_HOST_STYLE

    root.appendChild(scrollDiv)
    root.appendChild(canvas)
    root.appendChild(editorHost)
    this.container.appendChild(root)

    this.root = root
    this.scrollDiv = scrollDiv
    this.spacer = spacer
    this.canvas = canvas
    this.editorHost = editorHost

    this.renderer.initialize(canvas)
    this.scheduler = new RenderScheduler(this.renderer, {
      getScene: () =>
        buildGridScene({
          layout: this.layout,
          store: this.store,
          theme: this.themeTokens,
          selection: this.input.selection,
          formatters: this.formatters,
          showRowNumbers: this.features.showRowNumbers,
          sortState: this.sortState ?? undefined,
          conditionalRules: this.conditionalRules,
        }),
      debugDirty: this.debugMode,
    })

    // 初始尺寸 + ResizeObserver
    const rect = this.container.getBoundingClientRect()
    this.renderer.resize(rect.width || 640, rect.height || 480)
    this.layout.viewportSize = { width: rect.width || 640, height: rect.height || 480 }
    this.updateSpacer()
    this.scheduler.forceFullRedraw()

    // ResizeObserver 缺失时（旧浏览器/测试环境）引擎照常工作，只是不自适应容器
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0]
        if (!entry || this.destroyed) return
        const { width, height } = entry.contentRect
        this.renderer.resize(width, height)
        this.layout.viewportSize = { width, height }
        this.updateSpacer()
        this.scheduler?.forceFullRedraw()
      })
      this.resizeObserver.observe(this.container)
    }
  }

  /** spacer 撑出内容总尺寸（产生原生滚动量；表头带也在 spacer 内=一起滚动，
   *  canvas 侧用 viewport 空间指令把表头「钉」回固定位置） */
  private updateSpacer(): void {
    if (!this.spacer) return
    const size = this.layout.getContentSize()
    this.spacer.style.width = `${size.width}px`
    this.spacer.style.height = `${size.height}px`
  }

  private applyThemeToDom(): void {
    if (this.root) applyTheme(this.root, this.themeTokens, this.themeRegistry)
  }

  // ==========================================================================
  // 事件与交互接线
  // ==========================================================================

  private bindEvents(): void {
    // 滚动 → 只标脏（rAF 合帧 + 位块搬移路径），绝不直接画
    this.scrollDiv?.addEventListener('scroll', () => {
      if (this.destroyed) return
      const el = this.scrollDiv!
      this.layout.scroll = { x: el.scrollLeft, y: el.scrollTop }
      this.scheduler?.requestScrollFrame()
      this.repositionEditor()
    })

    // 数据变化（mutation 执行后回流）→ 公共 cell-change 事件 + 重绘
    this.bus.on<{ unitId: string; transaction: DataTransaction }>(PublicEvent.DATA_CHANGED, (payload) => {
      if (payload.unitId !== 'grid') return
      this.bus.emit(PublicEvent.CELL_CHANGE, payload.transaction)
      this.markDataChanged(payload.transaction)
      // 结构性变更（insert/delete）不在 DataTransaction 里表达——行集变化由下方的行事件兜底
    })

    // 行/列数变化后同步交互边界
    this.bus.on('sx:command-executed', () => {
      this.syncBounds()
      this.updateSpacer()
    })

    // 交互引擎接入（callbacks 见下方定义）
    this.input.attach(this.root!, this.buildInteractionCallbacks())
  }

  private buildInteractionCallbacks(): InteractionCallbacks {
    return {
      hitTest: (point) => {
        const target = this.layout.hitTest(point)
        if (target?.kind !== 'cell') return target
        // 填充柄优先：活动选区右下角 6px 内视为 fillHandle
        const active = this.input.selection.getActiveRange()
        if (active) {
          const handleRect = this.layout.getFillHandleRect(active)
          if (
            handleRect &&
            point.x >= handleRect.x - 2 &&
            point.x <= handleRect.x + handleRect.width + 2 &&
            point.y >= handleRect.y - 2 &&
            point.y <= handleRect.y + handleRect.height + 2
          ) {
            return { kind: 'fillHandle', row: active.end.row, col: active.end.col }
          }
        }
        return target
      },
      getCellRect: (row, col) => this.layout.getCellRect(row, col),
      getContentSize: () => this.layout.getContentSize(),
      getRowCount: () => this.store.rowCount,
      getColCount: () => this.layout.cols.count,
      isCellEditable: (_row, col) => {
        if (!this.features.editing || this.editing) return false
        const def = this.layout.cols.getDef(col)
        return def !== undefined && def.editable !== false
      },
      getScroll: () => ({ x: this.layout.scroll.x, y: this.layout.scroll.y }),
      scrollBy: (dx, dy) => {
        const el = this.scrollDiv
        if (!el) return
        const clamped = this.layout.clampScroll(el.scrollLeft + dx, el.scrollTop + dy)
        el.scrollLeft = clamped.x
        el.scrollTop = clamped.y
      },
      onCommand: (command) => this.handleCommand(command),
      onSelectionChange: (ranges, activeIndex) => {
        this.bus.emit(PublicEvent.SELECTION_CHANGE, { ranges: [...ranges], activeIndex })
        // 焦点格滚出视口时自动跟随（Excel 语义）
        const focus = this.input.selection.getFocusCell()
        if (focus && !this.layout.isCellVisible(focus.row, focus.col)) this.ensureVisible(focus.row, focus.col)
        this.scheduler?.markContentChanged()
        void activeIndex
      },
      onEditStart: (row, col, options) => this.openEditor(row, col, options?.initialChar),
      onResize: (kind, index, delta, phase) => this.handleResize(kind, index, delta, phase),
      getCopyData: () => this.buildCopyData(),
      getEdgeCell: (row, col, dr, dc) => this.findEdgeCell(row, col, dr, dc),
      onAutoFit: (kind, index) => this.autoFit(kind, index),
    }
  }

  /**
   * 双击行/列边界：按内容自适应尺寸（Excel 习惯）。
   * 列宽扫描可见窗口内最多 300 行文本的度量宽度（首行标题也算），上限 320px；
   * 行高恢复默认单行高度（多行换行内容待 v2）。
   */
  /** 按内容自适应行高 / 列宽（宿主可直接调用；双击边界也走这里） */
  autoFit(kind: 'row' | 'col', index: number): void {
    if (kind === 'col') {
      const def = this.layout.cols.getDef(index)
      if (!def) return
      const font = fontString({ size: this.themeTokens.fontSize, family: this.themeTokens.fontFamily })
      const visible = this.layout.getVisibleWindow()
      const lastRow = Math.min(visible.lastRow, visible.firstRow + 300)
      let maxWidth = Math.max(64, this.renderer.textCache.width(def.title, font) + 18)
      for (let row = visible.firstRow; row <= lastRow; row++) {
        const rowData = this.store.getRowByIndex(row)
        if (!rowData) continue
        const value = this.store.getCell(rowData.id, def.key)
        if (value === null || value === undefined) continue
        const text = typeof value === 'number' ? String(Math.round(value * 100) / 100) : String(value)
        const width = this.renderer.textCache.width(text, font) + 18
        if (width > maxWidth) maxWidth = width
      }
      this.layout.cols.setWidth(index, Math.min(320, Math.ceil(maxWidth)))
    } else {
      // 行高自适应：扫描该行所有单元格，按最多换行数计算高度
      const font = fontString({ size: this.themeTokens.fontSize, family: this.themeTokens.fontFamily })
      const rowData = this.store.getRowByIndex(index)
      let maxLines = 1
      for (let col = 0; col < this.layout.cols.count; col++) {
        const def = this.layout.cols.getDef(col)
        if (!def || !rowData) continue
        const value = this.store.getCell(rowData.id, def.key)
        if (value === null || value === undefined) continue
        const display = String(value)
        // 宽度超限时也会折行（按列宽估算），再加显式换行
        const wrapped = display.includes('\n')
          ? display.split('\n').length
          : Math.max(1, Math.ceil(this.renderer.textCache.width(display, font) / Math.max(1, this.layout.cols.getWidth(col) - 12)))
        maxLines = Math.max(maxLines, wrapped)
      }
      const height = Math.ceil(maxLines * this.themeTokens.fontSize * 1.35 + 6)
      this.layout.rows.setHeight(index, Math.max(this.layout.rows.defaultHeight, height))
    }
    this.updateSpacer()
    this.scheduler?.markContentChanged()
    this.bus.emit('sx:resized', {
      kind,
      index,
      size: kind === 'col' ? this.layout.cols.getWidth(index) : this.layout.rows.getHeight(index),
    })
  }

  /**
   * Excel Ctrl+方向键语义：返回该方向的「数据边界」格。
   * - 当前格非空：跳到连续非空区的最后一格；
   * - 当前格为空：跳到下一个非空格的前一格（Excel 行为）；
   * - 整行/列都空或到边界：返回最后一个可达格。
   */
  private findEdgeCell(row: number, col: number, dr: number, dc: number): { row: number; col: number } | null {
    const rowCount = this.store.rowCount
    const colCount = this.layout.cols.count
    if (rowCount === 0 || colCount === 0) return null
    const isEmpty = (r: number, c: number): boolean => {
      const rowData = this.store.getRowByIndex(r)
      const def = this.layout.cols.getDef(c)
      if (!rowData || !def) return true
      const value = this.store.getCell(rowData.id, def.key)
      return value === null || value === undefined || value === ''
    }
    let r = row + dr
    let c = col + dc
    if (r < 0 || r >= rowCount || c < 0 || c >= colCount) return null
    const startEmpty = isEmpty(r, c)
    let lastR = r
    let lastC = c
    while (r >= 0 && r < rowCount && c >= 0 && c < colCount) {
      lastR = r
      lastC = c
      const hitBoundary = startEmpty ? !isEmpty(r, c) : isEmpty(r, c)
      if (hitBoundary) return { row: r - dr, col: c - dc }
      r += dr
      c += dc
    }
    return { row: lastR, col: lastC }
  }

  /** 焦点格滚入视口（键盘导航跟随；E3：主区行以冻结带底缘为上边界） */
  private ensureVisible(row: number, col: number): void {
    const rect = this.layout.getCellRect(row, col)
    if (!rect) return
    const size = this.layout.viewportSize
    const topBound = row < this.layout.frozenRowCount ? COL_HEADER_HEIGHT : COL_HEADER_HEIGHT + this.layout.frozenBandHeight
    let dx = 0
    let dy = 0
    if (rect.y < topBound) dy = rect.y - topBound
    else if (rect.y + rect.height > size.height) dy = rect.y + rect.height - size.height
    if (rect.x < ROW_HEADER_WIDTH) dx = rect.x - ROW_HEADER_WIDTH
    else if (rect.x + rect.width > size.width) dx = rect.x + rect.width - size.width
    if (dx !== 0 || dy !== 0) {
      this.buildInteractionCallbacks().scrollBy(dx, dy)
    }
  }

  // ==========================================================================
  // 语义命令 → mutation（interaction 只发意图，这里才碰数据）
  // ==========================================================================

  private handleCommand(command: SemanticCommand): void {
    if (this.destroyed) return
    switch (command.id) {
      case 'grid.command.undo': {
        if (this.features.undoRedo) void this.commands.undo()
        break
      }
      case 'grid.command.redo': {
        if (this.features.undoRedo) void this.commands.redo()
        break
      }
      case 'grid.command.clear-cells': {
        const ranges = (command.params as { ranges: CellRange[] }).ranges
        this.writeRangeValues(ranges, null, 'user')
        break
      }
      case 'grid.command.paste': {
        if (!this.features.clipboard) break
        const { matrix, target } = command.params as { matrix: string[][]; target: { row: number; col: number } }
        this.pasteMatrix(matrix, target.row, target.col)
        break
      }
      case 'grid.command.fill-range': {
        const { fromRange, toRow, toCol, phase } = command.params as {
          fromRange: CellRange
          toRow: number
          toCol: number
          phase: 'preview' | 'commit'
        }
        if (phase === 'commit') this.applyFill(fromRange, toRow, toCol)
        // preview 阶段 v1 不画预览框（记录为 v2 项）
        break
      }
      case 'grid.command.sort': {
        const { col, dir } = command.params as { col: number; dir?: 'asc' | 'desc' | 'toggle' }
        this.sortByColumn(col, dir ?? 'toggle')
        break
      }
      default:
        console.warn(`[SheetX] 未知的语义命令: ${command.id}`)
    }
  }

  /** 把一段选区全部写成指定值（clear/paste 共用） */
  private writeRangeValues(ranges: ReadonlyArray<CellRange>, value: unknown, source: 'user' | 'paste'): void {
    const intents: Array<{ rowId: string; field: string; value: unknown }> = []
    for (const range of ranges) {
      for (let row = range.start.row; row <= range.end.row; row++) {
        const rowData = this.store.getRowByIndex(row)
        if (!rowData) continue
        for (let col = range.start.col; col <= range.end.col; col++) {
          const def = this.layout.cols.getDef(col)
          if (!def) continue
          intents.push({ rowId: rowData.id, field: def.key, value })
        }
      }
    }
    if (intents.length === 0) return
    const params = buildSetCellsParams(this.store, intents)
    if (params.changes.length === 0) return
    this.commands.executeMutation({ id: 'grid.mutation.set-cells', params, source })
  }

  /** 粘贴矩阵：从目标格起平铺写入（列数以选区/矩阵较小者为准，越界截断——文档注明） */
  private pasteMatrix(matrix: string[][], startRow: number, startCol: number): void {
    const intents: Array<{ rowId: string; field: string; value: unknown }> = []
    for (let r = 0; r < matrix.length; r++) {
      const rowData = this.store.getRowByIndex(startRow + r)
      if (!rowData) break
      const rowCells = matrix[r]!
      for (let c = 0; c < rowCells.length; c++) {
        const def = this.layout.cols.getDef(startCol + c)
        if (!def) break
        const text = rowCells[c] ?? ''
        intents.push({ rowId: rowData.id, field: def.key, value: text === '' ? null : text })
      }
    }
    if (intents.length === 0) return
    const params = buildSetCellsParams(this.store, intents)
    if (params.changes.length === 0) return
    this.commands.executeMutation({ id: 'grid.mutation.set-cells', params, source: 'paste' })
  }

  /** 填充柄：从源 range 平铺复制到目标区域（按源尺寸取模） */
  /**
   * 填充柄（E5）：数字等差 / 日期序列（月末钳制）/ 中文循环序列 / 其余平铺。
   * 拖拽方向决定推导轴：垂直拖动按列推导，水平拖动按行推导。
   */
  private applyFill(fromRange: CellRange, toRow: number, toCol: number): void {
    const intents: Array<{ rowId: string; field: string; value: unknown }> = []
    const vertical = toRow > fromRange.end.row || toRow < fromRange.start.row
    const horizontal = toCol > fromRange.end.col || toCol < fromRange.start.col

    if (vertical || !horizontal) {
      // 垂直推导：每列独立
      const down = toRow >= fromRange.end.row
      const count = down ? toRow - fromRange.end.row : fromRange.start.row - toRow
      if (count > 0) {
        for (let col = fromRange.start.col; col <= fromRange.end.col; col++) {
          const def = this.layout.cols.getDef(col)
          if (!def) continue
          const source: unknown[] = []
          let gap = false
          for (let row = fromRange.start.row; row <= fromRange.end.row; row++) {
            const rowData = this.store.getRowByIndex(row)
            if (!rowData) { gap = true; break }
            source.push(rowData.data[def.key])
          }
          if (gap) continue
          // 朝填充方向排序（上拖 = 逆序续接）
          const ordered = down ? source : [...source].reverse()
          const derived = deriveFillSeries(ordered as never, count)
          const targetRows: number[] = []
          for (let i = 1; i <= count; i++) targetRows.push(down ? fromRange.end.row + i : fromRange.start.row - i)
          targetRows.forEach((row, index) => {
            const rowData = this.store.getRowByIndex(row)
            if (!rowData) return
            intents.push({ rowId: rowData.id, field: def.key, value: derived[index] })
          })
        }
      }
    } else {
      // 水平推导：每行独立
      const right = toCol >= fromRange.end.col
      const count = right ? toCol - fromRange.end.col : fromRange.start.col - toCol
      if (count > 0) {
        for (let row = fromRange.start.row; row <= fromRange.end.row; row++) {
          const rowData = this.store.getRowByIndex(row)
          if (!rowData) continue
          const source: unknown[] = []
          for (let col = fromRange.start.col; col <= fromRange.end.col; col++) {
            const def = this.layout.cols.getDef(col)
            source.push(def ? rowData.data[def.key] : null)
          }
          const ordered = right ? source : [...source].reverse()
          const derived = deriveFillSeries(ordered as never, count)
          const targetCols: number[] = []
          for (let i = 1; i <= count; i++) targetCols.push(right ? fromRange.end.col + i : fromRange.start.col - i)
          targetCols.forEach((col, index) => {
            const def = this.layout.cols.getDef(col)
            if (!def) return
            intents.push({ rowId: rowData.id, field: def.key, value: derived[index] })
          })
        }
      }
    }
    if (intents.length === 0) return
    const params = buildSetCellsParams(this.store, intents)
    if (params.changes.length === 0) return
    this.commands.executeMutation({ id: 'grid.mutation.set-cells', params, source: 'user' })
  }

  // ==========================================================================
  // 行列尺寸调整（拖拽行头底缘/列头右缘）
  // ==========================================================================

  private resizeState: { kind: 'row' | 'col'; index: number; startSize: number } | null = null

  private handleResize(kind: 'row' | 'col', index: number, delta: number, phase: 'start' | 'move' | 'end'): void {
    if (phase === 'start') {
      this.resizeState = {
        kind,
        index,
        startSize: kind === 'row' ? this.layout.rows.getHeight(index) : this.layout.cols.getWidth(index),
      }
      return
    }
    const state = this.resizeState
    if (!state || state.kind !== kind || state.index !== index) return
    const newSize = Math.max(kind === 'row' ? 20 : 40, state.startSize + delta)
    if (kind === 'row') {
      this.layout.rows.setHeight(index, newSize)
    } else {
      this.layout.cols.setWidth(index, newSize)
    }
    if (phase === 'end') {
      this.resizeState = null
      this.updateSpacer()
      this.bus.emit('sx:resized', { kind, index, size: newSize })
    }
    this.scheduler?.markContentChanged()
  }

  // ==========================================================================
  // 编辑流（任务书 T4/T6 核心：BEFORE_EDIT → 编辑器 → 校验 → mutation → AFTER_EDIT）
  // ==========================================================================

  openEditor(row: number, col: number, initialChar?: string): void {
    if (this.destroyed || this.editing) return
    const rowData = this.store.getRowByIndex(row)
    const def = this.layout.cols.getDef(col)
    const rect = this.layout.getCellRect(row, col)
    if (!rowData || !def || !rect) return
    if (def.editable === false || !this.features.editing) return

    // before-edit 可取消（ERP 拦截需求：行状态/权限/弹确认）
    const payload: BeforeEditPayload = {
      rowId: rowData.id,
      field: def.key,
      row,
      col,
      value: this.store.getCell(rowData.id, def.key),
      canceled: false,
      cancel() {
        this.canceled = true
      },
    }
    this.bus.emit(PublicEvent.BEFORE_EDIT, payload)
    if (payload.canceled) return

    const rawValue = this.store.getCell(rowData.id, def.key)
    const editorName = def.editor ?? inferEditorName(rawValue)
    const params = { ...(def as GridColumnDef).editorParams, ...this.editorExtraParams(def, rowData) }

    // E4：解析编辑器宿主（inline / body 弹出层 / 自定义），坐标换算到宿主坐标系
    const host = this.popup.trackResolve(this.editorHost!)
    const hostRect = this.popup.toHostCoords({ x: rect.x, y: rect.y, width: rect.width, height: rect.height })
    let handle: EditorHandle
    try {
      handle = this.editorRegistry.create(editorName, {
        row,
        col,
        rowId: rowData.id,
        field: def.key,
        value: rawValue as never,
        displayValue: initialChar ?? '',
        rect: hostRect,
        container: host,
        // IME 守卫由 interaction 提供、跨编辑器共享——这是中文不丢字的关键接线
        imeGuard: this.input.ime,
        params,
        commit: (value, autofill, meta) => {
          this.closeEditor(true, value, autofill, meta)
        },
        cancel: () => {
          this.closeEditor(false)
        },
      })
    } catch (error) {
      console.error('[SheetX] 打开编辑器失败:', error)
      return
    }
    host.appendChild(handle.el)
    handle.mount?.()
    this.input.beginEditing()
    this.editing = { row, col, rowId: rowData.id, field: def.key, handle }
    // E4：宿主脱离 root 时（body 弹出层），页面滚动需要跟随重新定位
    this.detachPopupChange = this.popup.isDetached(this.editorHost!)
      ? this.popup.onChange(() => this.repositionEditor())
      : null
  }

  private editorExtraParams(def: ColumnDef, rowData: RowData): UnknownRecord {
    // 远程搜索编辑器默认提供「整行数据」上下文（宿主 query 可用于带条件搜索）
    return { __row: rowData.data, __field: def.key }
  }

  private closeEditor(committed: boolean, value?: unknown, autofill?: Record<string, unknown>, meta?: CommitMeta): void {
    const editing = this.editing
    if (!editing) return
    const { rowId, field, row, col, handle } = editing
    handle.destroy()
    this.editing = null
    this.input.endEditing()
    if (this.detachPopupChange) {
      this.detachPopupChange()
      this.detachPopupChange = null
    }

    let finalValue: unknown = undefined
    let blocked = false
    if (committed) {
      finalValue = value
      // 校验闸门（strictValidation：error 级错误阻止提交）
      const errors = this.validation.validateValue(field, finalValue, { rowId })
      if (errors.length > 0) {
        this.bus.emit('validation-error', { errors })
        if (this.features.strictValidation && errors.some((e) => e.level === 'error')) {
          blocked = true
        }
      }
      if (!blocked) {
        // 主值 + 联动字段（远程搜索的 payload）同一事务提交——一次 undo 撤销全部
        const intents: Array<{ rowId: string; field: string; value: unknown }> = [
          { rowId, field, value: finalValue },
        ]
        if (autofill) {
          for (const [key, fillValue] of Object.entries(autofill)) {
            if (key === field) continue
            intents.push({ rowId, field: key, value: fillValue })
          }
        }
        const params = buildSetCellsParams(this.store, intents)
        if (params.changes.length > 0) {
          this.commands.executeMutation({ id: 'grid.mutation.set-cells', params, source: 'user' })
        }
      }
    }
    this.bus.emit<AfterEditPayload>(PublicEvent.AFTER_EDIT, {
      rowId,
      field,
      row,
      col,
      oldValue: blocked ? undefined : this.store.getCell(rowId, field),
      newValue: blocked ? undefined : finalValue,
      committed: committed && !blocked,
    })
    // E6：按提交来源方向移动焦点（Enter↓ / Tab→；行尾 Tab 换行到下一行首列）
    if (committed && !blocked) this.moveFocusAfterCommit(meta?.move, row, col)
    this.scheduler?.markContentChanged()
  }

  /** E6：提交后焦点移动（Excel 习惯；越界钳制 + 行尾换行）。基准 = 刚编辑的格子 */
  private moveFocusAfterCommit(move: CommitMeta['move'], fromRow: number, fromCol: number): void {
    if (!move) return
    const selection = this.input.selection
    const rowCount = this.store.rowCount
    const colCount = this.layout.cols.count
    let row = fromRow
    let col = fromCol
    if (move === 'right') {
      if (col >= colCount - 1) {
        if (row < rowCount - 1) { row += 1; col = 0 }
      } else col += 1
    } else if (move === 'left') {
      if (col <= 0) {
        if (row > 0) { row -= 1; col = Math.max(0, colCount - 1) }
      } else col -= 1
    } else if (move === 'down') {
      if (row < rowCount - 1) row += 1
    } else if (move === 'up') {
      if (row > 0) row -= 1
    }
    selection.collapseTo(row, col)
  }

  /** 编辑器跟随滚动/行高变化重新定位（E4：坐标按当前宿主换算） */
  private repositionEditor(): void {
    if (!this.editing) return
    const rect = this.layout.getCellRect(this.editing.row, this.editing.col)
    if (!rect) return
    const hostRect = this.popup.toHostCoords(rect)
    this.editing.handle.el.style.left = `${hostRect.x}px`
    this.editing.handle.el.style.top = `${hostRect.y}px`
  }

  // ==========================================================================
  // 剪贴板数据（选区 → TSV/HTML）
  // ==========================================================================

  private buildCopyData(): { text: string; html?: string } | null {
    const ranges = this.input.selection.getRanges()
    if (ranges.length === 0) return null
    const range = ranges[this.input.selection.getActiveIndex()] ?? ranges[0]!
    const lines: string[] = []
    const htmlRows: string[] = []
    for (let row = range.start.row; row <= range.end.row; row++) {
      const rowData = this.store.getRowByIndex(row)
      if (!rowData) continue
      const cells: string[] = []
      const htmlCells: string[] = []
      for (let col = range.start.col; col <= range.end.col; col++) {
        const def = this.layout.cols.getDef(col)
        if (!def) continue
        const display = formatValueForCopy(this.store.getCell(rowData.id, def.key), def, this.formatters, row, col)
        cells.push(display)
        htmlCells.push(`<td>${escapeHtml(display)}</td>`)
      }
      lines.push(cells.join('\t'))
      htmlRows.push(`<tr>${htmlCells.join('')}</tr>`)
    }
    return {
      text: lines.join('\n'),
      html: `<table>${htmlRows.join('')}</table>`,
    }
  }

  // ==========================================================================
  // 公共 API（对接文档的主体）
  // ==========================================================================

  /** 读单元格值 */
  getValue(rowId: string, field: string): unknown {
    return this.store.getCell(rowId, field)
  }

  /** 按下标读行 */
  getRowByIndex(index: number): RowData | undefined {
    return this.store.getRowByIndex(index)
  }

  /** 写单元格值（API 路径，可撤销） */
  setValue(rowId: string, field: string, value: unknown): void {
    const params = buildSetCellsParams(this.store, [{ rowId, field, value }])
    if (params.changes.length === 0) return
    this.commands.executeMutation({ id: 'grid.mutation.set-cells', params, source: 'api' })
  }

  /** 全量替换数据（可撤销；撤销保存旧数据集引用） */
  setData(records: ReadonlyArray<UnknownRecord>): void {
    this.commands.executeMutation({
      id: 'grid.mutation.replace-data',
      params: { rows: normalizeRows(records) },
      source: 'api',
    })
    this.syncBounds()
    this.updateSpacer()
  }

  getData(): Array<Record<string, unknown>> {
    return this.store.getAllRows().map((row) => row.data)
  }

  /** 当前排序状态（列头箭头/宿主可读取） */
  private sortState: { col: number; dir: 'asc' | 'desc' } | null = null
  /** 条件格式规则（按添加顺序求值，首条命中生效） */
  private conditionalRules: ConditionalRule[] = []

  /** 新增条件格式规则（同 id 覆盖；规则是纯数据，可持久化） */
  addConditionalRule(rule: ConditionalRule): void {
    this.conditionalRules = [...this.conditionalRules.filter((item) => item.id !== rule.id), rule]
    this.markContentChanged()
  }

  /** 删除条件格式规则；返回是否确实删除 */
  removeConditionalRule(id: string): boolean {
    const next = this.conditionalRules.filter((rule) => rule.id !== id)
    if (next.length === this.conditionalRules.length) return false
    this.conditionalRules = next
    this.markContentChanged()
    return true
  }

  clearConditionalRules(): void {
    if (this.conditionalRules.length === 0) return
    this.conditionalRules = []
    this.markContentChanged()
  }

  getConditionalRules(): readonly ConditionalRule[] {
    return this.conditionalRules
  }

  /**
   * 按列排序（稳定排序，空值恒排末尾）。
   * 走 grid.mutation.replace-data —— undo 自动恢复原行序；
   * dir='toggle' 时同列升→降→升循环，换列重置为升序。
   */
  sortByColumn(col: number, dir: 'asc' | 'desc' | 'toggle' = 'toggle'): 'asc' | 'desc' | null {
    const def = this.layout.cols.getDef(col)
    if (!def) return null
    const next: 'asc' | 'desc' =
      dir === 'toggle'
        ? this.sortState?.col === col && this.sortState.dir === 'asc'
          ? 'desc'
          : 'asc'
        : dir
    const sign = next === 'asc' ? 1 : -1
    const sorted = [...this.store.getAllRows()].sort((a, b) => {
      const av = a.data[def.key]
      const bv = b.data[def.key]
      const aEmpty = av === null || av === undefined || av === ''
      const bEmpty = bv === null || bv === undefined || bv === ''
      // 空值恒在末尾（Excel 习惯）：不能乘 sign，否则降序时会被翻到开头
      if (aEmpty !== bEmpty) return aEmpty ? 1 : -1
      return compareCellValues(av, bv) * sign
    })
    this.commands.executeMutation({ id: 'grid.mutation.replace-data', params: { rows: sorted }, source: 'user' })
    this.sortState = { col, dir: next }
    this.bus.emit('sx:sort-changed', { col, dir: next, field: def.key })
    this.syncBounds()
    this.markContentChanged()
    return next
  }

  /**
   * 打印数据源（结构与 @sheetx/io 的 PrintSource 兼容，但不引入 io 依赖）。
   * 宿主：`renderPrintSvg(grid.printSource(), { header: '{sheet} 第 {page} 页' })`。
   * 单元格文本沿用列格式化器；条件格式样式同步到打印输出。
   */
  printSource(): {
    rowCount: number
    colCount: number
    rowHeight(row: number): number
    colWidth(col: number): number
    cellText(row: number, col: number): string
    cellStyle(row: number, col: number): { background?: string; color?: string; bold?: boolean; align?: 'left' | 'center' | 'right' } | undefined
  } {
    return {
      rowCount: this.store.rowCount,
      colCount: this.layout.cols.count,
      rowHeight: (row) => this.layout.rows.getHeight(row),
      colWidth: (col) => this.layout.cols.getWidth(col),
      cellText: (row, col) => {
        const def = this.layout.cols.getDef(col)
        if (!def) return ''
        const rowData = this.store.getRowByIndex(row)
        const value = rowData ? this.store.getCell(rowData.id, def.key) : null
        if (value === null || value === undefined) return ''
        const formatterName = def.formatter
        const formatter = formatterName ? this.formatters.get(formatterName) : undefined
        return formatter ? formatter(value as CellValue, { column: def, row, col }) : String(value)
      },
      cellStyle: (row, col) => {
        if (this.conditionalRules.length === 0) return undefined
        const def = this.layout.cols.getDef(col)
        const rowData = this.store.getRowByIndex(row)
        const value = rowData && def ? this.store.getCell(rowData.id, def.key) : null
        const ruleBounds = new Map<string, { min: number; max: number }>()
        for (const rule of this.conditionalRules) {
          if (rule.type === 'colorScale') ruleBounds.set(rule.id, { min: rule.min, max: rule.max })
          else if (rule.type === 'dataBar') ruleBounds.set(rule.id, { min: rule.min ?? 0, max: rule.max ?? 1 })
        }
        const envelope = {
          min: Math.min(0, ...[...ruleBounds.values()].map((bounds) => bounds.min)),
          max: Math.max(1, ...[...ruleBounds.values()].map((bounds) => bounds.max)),
        }
        const result = evaluateConditionalFormat(value as never, row, col, this.conditionalRules, envelope)
        if (!result || (!result.background && !result.color && !result.bold)) return undefined
        return { background: result.background, color: result.color, bold: result.bold }
      },
    }
  }

  getRowCount(): number {
    return this.store.rowCount
  }

  /** 插入行（可撤销） */
  insertRows(index: number, records: ReadonlyArray<UnknownRecord>): void {
    const params: InsertRowsParams = { index, rows: normalizeRows(records) }
    this.commands.executeMutation({ id: 'grid.mutation.insert-rows', params, source: 'api' })
    this.syncBounds()
  }

  /** 删除行（可撤销；undo 恢复位置与数据） */
  deleteRows(rowIds: ReadonlyArray<string>): void {
    this.commands.executeMutation({ id: 'grid.mutation.delete-rows', params: { rowIds: [...rowIds] }, source: 'api' })
    this.syncBounds()
  }

  /** 行 id → 下标 */
  getRowIndex(rowId: string): number {
    return this.store.getRowIndex(rowId)
  }

  /** 公共批量粘贴入口（benchmark/宿主可直接调用；与 Ctrl+V 走同一 mutation 路径） */
  paste(matrix: ReadonlyArray<ReadonlyArray<string>>, startRow = 0, startCol = 0): void {
    this.pasteMatrix(matrix.map((row) => [...row]), startRow, startCol)
  }

  async undo(): Promise<void> {
    await this.commands.undo()
  }

  async redo(): Promise<void> {
    await this.commands.redo()
  }

  canUndo(): boolean {
    return this.commands.canUndo()
  }

  canRedo(): boolean {
    return this.commands.canRedo()
  }

  getSelectedRanges(): CellRange[] {
    return [...this.input.selection.getRanges()]
  }

  /** 正式方案 L757 单数别名：返回活动选区（无多区域时退化为第一个） */
  getSelectedRange(): CellRange | null {
    return this.input.selection.getActiveRange() ?? this.getSelectedRanges()[0] ?? null
  }

  getSelectedRows(): RowData[] {
    const rows: RowData[] = []
    for (const range of this.input.selection.getRanges()) {
      for (let row = range.start.row; row <= range.end.row; row++) {
        const rowData = this.store.getRowByIndex(row)
        if (rowData) rows.push(rowData)
      }
    }
    return rows
  }

  getSelectedFieldValues(field: string): unknown[] {
    return this.getSelectedRows().map((row) => row.data[field])
  }

  scrollToCell(row: number, col: number): void {
    const x = this.layout.cols.offsetOf(col)
    const y = this.layout.rows.offsetOf(row)
    const clamped = this.layout.clampScroll(x, y)
    if (this.scrollDiv) {
      this.scrollDiv.scrollLeft = clamped.x
      this.scrollDiv.scrollTop = clamped.y
    }
  }

  /**
   * 设置整体缩放倍率（0.6–2.5），返回实际生效值。
   * 按构造时的基准尺寸换算，重复调用不累积；缩放会重设所有列宽（与 Excel 缩放语义一致）。
   */
  setZoom(scale: number): number {
    const next = Math.max(0.6, Math.min(2.5, scale))
    this.zoomScale = next
    this.themeTokens = { ...this.themeTokens, fontSize: Math.max(8, Math.round(this.baseFontSize * next)) }
    this.layout.rows.setDefaultHeight(Math.max(18, Math.round(this.baseRowHeight * next)))
    for (let col = 0; col < this.columnDefs.length; col++) {
      const base = this.baseColWidths[col] ?? this.layout.cols.defaultWidth
      this.layout.cols.setWidth(col, Math.round(base * next))
    }
    this.applyThemeToDom()
    this.updateSpacer()
    this.markContentChanged()
    return next
  }

  /** 当前缩放倍率 */
  getZoom(): number {
    return this.zoomScale
  }

  setColumnWidth(col: number, width: number): void {
    this.layout.cols.setWidth(col, width)
    this.updateSpacer()
    this.markContentChanged()
  }

  /** 按当前数据生成矢量 SVG 图表（折线/柱状/饼图，零依赖） */
  chartSvg(config: ChartFromRecordsConfig): string {
    return buildChartSvg(chartFromRecords(this.getData(), config))
  }

  /** 按当前数据构建数据透视表（字段 key 对应行数据的列名；零依赖纯逻辑） */
  pivot(config: PivotConfig): PivotResult {
    return buildPivotTable(this.getData(), config)
  }

  /** 冻结前 N 行 */
  freezeRows(count: number): void {
    this.layout.frozenRowCount = Math.max(0, Math.min(count, this.store.rowCount))
    this.markContentChanged()
  }

  /** 冻结前 N 列（从第 0 列起连续；Excel 语义，可撤销状态之外的视图配置） */
  freezeColumns(count: number): void {
    this.layout.cols.setFrozen(count)
    this.markContentChanged()
  }

  /** 注册格式化器（ColumnDef.formatter 引用名字） */
  registerFormatter(name: string, formatter: ValueFormatter): void {
    this.formatters.set(name, formatter)
    this.markContentChanged()
  }

  /** 注册自定义编辑器（插件扩展点） */
  registerEditor(name: string, factory: Parameters<EditorRegistry['register']>[1]): void {
    this.editorRegistry.register(name, factory, { override: true })
  }

  /** E4：显式指定编辑器弹出层宿主（传 null 恢复 editorHostMode 默认） */
  setPopupHost(element: HTMLElement | null): void {
    this.popup.setCustomHost(element)
  }

  /** E4：切换编辑器宿主模式（inline = root 内；body = document.body 弹出层，不被表格边界裁切） */
  setEditorHostMode(mode: EditorHostMode): void {
    this.popup.setMode(mode)
  }

  setTheme(theme: ThemeTokens | string): void {
    this.themeTokens = resolveTheme(theme, this.themeRegistry)
    this.applyThemeToDom()
    this.markContentChanged()
  }

  /** 全表校验（保存前调用） */
  async validate(): Promise<ValidationError[]> {
    return this.validation.validateRows(this.store.getAllRows())
  }

  /** 事件订阅（cell-change / selection-change / before-edit / after-edit / validation-error / sx:* ） */
  on<T = unknown>(event: string, listener: (payload: T) => void): () => void {
    return this.bus.on(event, listener)
  }

  once<T = unknown>(event: string, listener: (payload: T) => void): () => void {
    return this.bus.once(event, listener)
  }

  off(event: string, listener: (payload: unknown) => void): void {
    this.bus.off(event, listener)
  }

  getEventBus(): IEventBus {
    return this.bus
  }

  /** 渲染统计（benchmark 用） */
  getRenderStats(): { lastRenderMs: number; drawCalls: number; blitFrames: number; fps: number } {
    return {
      lastRenderMs: this.renderer.stats.lastRenderMs,
      drawCalls: this.renderer.stats.drawCalls,
      blitFrames: this.renderer.stats.blitFrames,
      fps: this.scheduler?.getFps() ?? 0,
    }
  }

  /** 强制整帧重绘（主题变化/调试） */
  refresh(): void {
    this.scheduler?.forceFullRedraw()
  }

  /** 是否已销毁 */
  isDestroyed(): boolean {
    return this.destroyed
  }

  /** core Disposable 契约（= destroy 的别名） */
  dispose(): void {
    this.destroy()
  }

  /** 销毁：解绑全部监听、释放 DOM（UI 层在元素移除时调用） */
  destroy(): void {
    if (this.destroyed) return
    this.destroyed = true
    this.resizeObserver?.disconnect()
    this.scheduler?.dispose()
    this.input.detach()
    if (this.editing) {
      this.editing.handle.destroy()
      this.editing = null
    }
    this.bus.clear()
    this.popup.dispose()
    this.renderer.destroy()
    this.root?.remove()
    this.root = null
    this.scrollDiv = null
    this.spacer = null
    this.canvas = null
    this.editorHost = null
  }

  // ==========================================================================
  // 内部工具
  // ==========================================================================

  /** 数据事务 → 局部脏矩形（仅用于 debug 红框；实际重绘仍由内容版本触发整帧） */
  private markDataChanged(transaction: DataTransaction): void {
    const rects: Rect[] = []
    for (const change of transaction.changes) {
      const row = this.store.getRowIndex(change.rowId)
      if (row < 0) continue
      let col = -1
      for (let index = 0; index < this.layout.cols.count; index++) {
        if (this.layout.cols.getDef(index)?.key === change.field) {
          col = index
          break
        }
      }
      if (col < 0) continue
      const rect = this.layout.getCellRect(row, col)
      if (rect) rects.push(rect)
    }
    this.markContentChanged(rects.length > 0 ? unionRects(rects) : undefined)
  }

  private markContentChanged(rect?: Rect): void {
    this.scheduler?.markContentChanged(rect)
  }

  private syncBounds(): void {
    this.input.syncBounds(this.store.rowCount, this.layout.cols.count)
    if (!this.input.selection.isEmpty() || this.store.rowCount > 0) {
      // 选区钳制（删行后防止越界）
      this.input.selection.bounds = { rowCount: this.store.rowCount, colCount: this.layout.cols.count }
      this.input.selection.clampToBounds()
    }
  }
}

// ---------------------------------------------------------------------------
// 模块级工具
// ---------------------------------------------------------------------------

function resolveContainer(container: HTMLElement | string): HTMLElement {
  if (typeof container === 'string') {
    const el = document.querySelector(container)
    if (!el) throw new Error(`[SheetX] 容器不存在: "${container}"`)
    return el as HTMLElement
  }
  return container
}

function resolveTheme(theme: ThemeTokens | string | undefined, registry: ThemeRegistry): ThemeTokens {
  if (theme === undefined) return registry.get('light')
  if (typeof theme === 'string') return registry.get(theme)
  return theme
}

/** 无显式 editor 时按值类型推断编辑器 */
function inferEditorName(value: unknown): string {
  if (typeof value === 'number') return BuiltinEditorNames.NUMBER
  if (typeof value === 'boolean') return BuiltinEditorNames.BOOLEAN
  return BuiltinEditorNames.TEXT
}

function formatValueForCopy(
  value: unknown,
  def: ColumnDef | undefined,
  formatters: ReadonlyMap<string, ValueFormatter>,
  row: number,
  col: number,
): string {
  if (value === null || value === undefined) return ''
  const formatterName = def?.formatter
  if (formatterName) {
    const formatter = formatters.get(formatterName)
    if (formatter) return formatter(value as never, { column: def ?? { key: '', title: '' }, row, col })
  }
  return String(value)
}

function escapeHtml(text: string): string {
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

export { ROW_HEADER_WIDTH, COL_HEADER_HEIGHT }
