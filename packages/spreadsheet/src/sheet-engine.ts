/**
 * @sheetx/spreadsheet - 电子表格模式（任务书 T10，对外主入口之一）
 *
 * 组装：workbook 模型 + formula(T5) + renderer(T2) + interaction(T3) + editors(T4)
 *      + data 的 WorksheetStore/StyleTable + themes(T11)。
 *
 * 公式集成（研究报告 §10 的落地方）：
 * - FormulaEngine 持有稀疏原始值（WorksheetStore），公式串存 CellData.f；
 * - 用户写值 → sheet.mutation.set-cells → 引擎收集变更坐标 → formula.recompute
 *   → 计算值留在引擎缓存（**不写回 store**）→ 'formula-change' 事件 + 重绘；
 * - undo 恢复的是公式串与原始值，计算值由重算推导——与 Univer 同款语义；
 * - 公式结果显示：getCellValue = computed ?? raw。
 */

import type { CellRange, ConditionalRule, Disposable, PivotConfig, PivotResult, ChartFromRecordsConfig, UnknownRecord, ValueFormatter, Rect } from '@sheetx/core'
import { PublicEvent, evaluateConditionalFormat, buildPivotTable, chartFromRecords, buildChartSvg } from '@sheetx/core'
import type { IEventBus } from '@sheetx/core'
import { EventBus } from '@sheetx/core'
import type { CellData } from '@sheetx/core'
import type { WorksheetStore, CellStyle } from '@sheetx/data'
import { CommandService } from '@sheetx/data'
import { WorkbookModel } from './workbook.js'
import { registerSheetMutations } from './sheet-mutations.js'
import type { SetSheetCellsParams, SheetCellChange, SheetTransaction } from './sheet-mutations.js'
import { formatValue } from './format.js'
import { FormulaEngine } from '@sheetx/formula'
import type { CellValueLike, FormulaChange } from '@sheetx/formula'
import type { RendererConfig, SheetXRenderer, HitResult } from '@sheetx/core'
import { Canvas2DRenderer, RenderScheduler, fontString, unionRects, createRenderer } from '@sheetx/renderer'
import type { InteractionCallbacks, SemanticCommand } from '@sheetx/interaction'
import { InputController } from '@sheetx/interaction'
import type { CommitMeta, EditorHandle, EditorRegistry } from '@sheetx/editors'
import { BuiltinEditorNames, createDefaultEditorRegistry } from '@sheetx/editors'
import type { ThemeTokens } from '@sheetx/themes'
import { ThemeRegistry, applyTheme } from '@sheetx/themes'
import { GridLayout, ROW_HEADER_WIDTH, COL_HEADER_HEIGHT } from '@sheetx/grid'
import { PopupHostManager } from '@sheetx/grid'
import type { EditorHostMode } from '@sheetx/grid'
import { deriveFillSeries } from '@sheetx/grid'
import { buildSheetScene } from './scene/sheet-scene-builder.js'

export interface SpreadsheetSheetConfig {
  name?: string
  rowCount?: number
  columnCount?: number
  /** 稀疏单元格快照（"row" → "col" → CellData） */
  cells?: Record<string, Record<string, CellData>>
}

import type { Appearance } from '@sheetx/ui'

export interface SpreadsheetConfig {
  container: HTMLElement | string
  sheets?: ReadonlyArray<SpreadsheetSheetConfig>
  activeSheetName?: string
  features?: {
    clipboard?: boolean
    undoRedo?: boolean
    editing?: boolean
    formula?: boolean
  }
  rowHeight?: number
  colWidth?: number
  theme?: ThemeTokens | string
  /** 外观预设（compact/standard/spreadsheet）与部件开关；缺省 spreadsheet */
  appearance?: Appearance
  /** 渲染器选择（可选）；缺省保持既有 Canvas2DRenderer 行为不变 */
  renderer?: RendererConfig
  debug?: boolean
  /** E4：编辑器宿主模式——body = 弹出层挂 document.body（下拉不被表格边界裁切） */
  editorHostMode?: EditorHostMode
}

export interface BeforeCellEditPayload {
  sheetId: string
  row: number
  col: number
  value: CellValueLike
  canceled: boolean
  cancel(): void
}

const ROOT_STYLE = 'position:relative;width:100%;height:100%;overflow:hidden;outline:none;user-select:none;background:var(--sx-color-bg,#fff)'
const SCROLL_STYLE = 'position:absolute;inset:0;overflow:auto;scrollbar-gutter:stable'
const CANVAS_STYLE = 'position:absolute;inset:0;pointer-events:none'
const EDITOR_HOST_STYLE = 'position:absolute;inset:0;pointer-events:none;overflow:visible'

export class SheetXSpreadsheet implements Disposable {
  readonly workbook = new WorkbookModel()
  private readonly commands: CommandService<WorkbookModel>
  private readonly bus = new EventBus()
  private readonly formula: FormulaEngine
  private readonly renderer = new Canvas2DRenderer()
  /** 分层渲染器（高层契约；当前底层绘制仍由 renderer 承担，行为不变） */
  readonly layeredRenderer: SheetXRenderer
  private scheduler: RenderScheduler | null = null
  private readonly layout = new GridLayout()
  private readonly input = new InputController()
  private readonly editorRegistry: EditorRegistry
  private editing: { sheetId: string; row: number; col: number; handle: EditorHandle } | null = null
  private themeTokens: ThemeTokens
  /** 条件格式规则（按添加顺序求值，首条命中生效） */
  private conditionalRules: ConditionalRule[] = []
  /** 双指/宿主缩放（相对构造时基准尺寸的倍率） */
  private zoomScale = 1
  private baseFontSize = 13
  private baseRowHeight = 30
  private baseColWidths: number[] = []
  private touchDist = 0
  private touchStartZoom = 1
  private readonly features: Required<SpreadsheetConfig['features']> & { formula: boolean }
  /** T2 验收开关：脏矩形红框可视化（默认 false，零开销） */
  private readonly debugMode: boolean
  private readonly themeRegistry = new ThemeRegistry()
  private readonly formatters = new Map<string, ValueFormatter>()

  private container: HTMLElement
  private root: HTMLElement | null = null
  private scrollDiv: HTMLElement | null = null
  private spacer: HTMLElement | null = null
  canvas: HTMLCanvasElement | null = null
  private editorHost: HTMLElement | null = null
  private resizeObserver: ResizeObserver | null = null
  private destroyed = false
  /** E4：编辑器弹出层宿主管理 */
  private readonly popup = new PopupHostManager({ getRoot: () => this.root })
  private detachPopupChange: (() => void) | null = null
  /** E3：每表冻结行数（切表恢复） */
  private readonly frozenRowsBySheet = new Map<string, number>()
  private readonly frozenColsBySheet = new Map<string, number>()

  constructor(config: SpreadsheetConfig) {
    this.container = resolveContainer(config.container)
    this.features = {
      clipboard: config.features?.clipboard ?? true,
      undoRedo: config.features?.undoRedo ?? true,
      editing: config.features?.editing ?? true,
      formula: config.features?.formula ?? true,
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

    // 工作簿：至少一张表
    const sheets = config.sheets ?? [{ name: 'Sheet1' }]
    for (const sheetConfig of sheets) {
      const sheet = this.workbook.createSheet(sheetConfig.name, sheetConfig.rowCount ?? 200, sheetConfig.columnCount ?? 26)
      if (sheetConfig.cells) {
        loadSparseCells(sheet, sheetConfig.cells)
      }
    }
    const activeByName = config.activeSheetName
      ? this.workbook.getSheetByName(config.activeSheetName)
      : undefined
    if (activeByName) this.workbook.setActiveSheet(activeByName.id)

    // 命令系统
    this.commands = new CommandService(this.workbook, 'sheet', { eventBus: this.bus })
    registerSheetMutations(this.commands)

    // 公式引擎：取值源 = 工作簿稀疏原始值（按表名解析）
    this.formula = new FormulaEngine({
      source: {
        getCellValue: (sheetName, row, col) => {
          const sheet = this.workbook.resolveSheet(sheetName)
          return sheet?.getRawValue(row, col) ?? null
        },
        getRangeValues: (sheetName, r1, c1, r2, c2) => {
          const sheet = this.workbook.resolveSheet(sheetName)
          const matrix: CellValueLike[][] = []
          for (let r = r1; r <= r2; r++) {
            const rowValues: CellValueLike[] = []
            for (let c = c1; c <= c2; c++) rowValues.push(sheet?.getRawValue(r, c) ?? null)
            matrix.push(rowValues)
          }
          return matrix
        },
      },
    })

    this.editorRegistry = createDefaultEditorRegistry()
    this.buildDom()
    this.bindEvents()
    this.applyThemeToDom()
    this.syncLayoutFromStore()
    this.recalculateAll()

    this.baseFontSize = this.themeTokens.fontSize
    this.baseRowHeight = this.layout.rows.defaultHeight
    this.baseColWidths = Array.from({ length: this.layout.cols.count }, (_, i) => this.layout.cols.getWidth(i))
    this.bindTouchZoom()

    this.input.selection.bounds = { rowCount: this.getActiveSheet().rowCount, colCount: this.getActiveSheet().columnCount }
    this.input.selection.setAnchor(0, 0)
  }

  // ==========================================================================
  // 基建（与 SheetXGrid 同构的 DOM/事件/布局装配）
  // ==========================================================================

  private getActiveSheet(): WorksheetStore {
    const sheet = this.workbook.getActive()
    if (!sheet) throw new Error('[SheetX] 工作簿没有活动工作表。')
    return sheet
  }

  private buildDom(): void {
    const root = document.createElement('div')
    root.className = 'sx-sheet'
    root.setAttribute('role', 'grid')
    root.style.cssText = ROOT_STYLE
    root.tabIndex = 0

    const scrollDiv = document.createElement('div')
    scrollDiv.style.cssText = SCROLL_STYLE
    const spacer = document.createElement('div')
    scrollDiv.appendChild(spacer)
    const canvas = document.createElement('canvas')
    canvas.style.cssText = CANVAS_STYLE
    const editorHost = document.createElement('div')
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
        buildSheetScene({
          layout: this.layout,
          sheet: this.getActiveSheet(),
          theme: this.themeTokens,
          selection: this.input.selection,
          getValue: (row, col) => this.getCellValue(undefined, row, col),
          conditionalRules: this.conditionalRules,
        }),
      debugDirty: this.debugMode,
    })

    const rect = this.container.getBoundingClientRect()
    this.renderer.resize(rect.width || 640, rect.height || 480)
    this.layout.viewportSize = { width: rect.width || 640, height: rect.height || 480 }
    this.updateSpacer()
    this.scheduler.forceFullRedraw()

    // ResizeObserver 缺失时（旧浏览器/测试环境）照常工作，只是不自适应容器
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0]
        if (!entry || this.destroyed) return
        this.renderer.resize(entry.contentRect.width, entry.contentRect.height)
        this.layout.viewportSize = { width: entry.contentRect.width, height: entry.contentRect.height }
        this.updateSpacer()
        this.scheduler?.forceFullRedraw()
      })
      this.resizeObserver.observe(this.container)
    }
  }

  private updateSpacer(): void {
    if (!this.spacer) return
    const size = this.layout.getContentSize()
    this.spacer.style.width = `${size.width}px`
    this.spacer.style.height = `${size.height}px`
  }

  private applyThemeToDom(): void {
    if (this.root) applyTheme(this.root, this.themeTokens, this.themeRegistry)
  }

  /** 活动表尺寸/行列尺寸 → 布局模型（切表/结构变化后调用） */
  private syncLayoutFromStore(): void {
    const sheet = this.getActiveSheet()
    this.layout.rows.setDefaultHeight(sheet.defaultRowHeight)
    this.layout.rows.setRowCount(sheet.rowCount)
    for (const [row, height] of sheet.rowHeights) this.layout.rows.setHeight(row, height)
    const defs = Array.from({ length: sheet.columnCount }, (_, index) => ({
      key: `c${index}`,
      title: '',
      width: sheet.getColWidth(index),
    }))
    this.layout.cols.setColumns(defs)
    this.layout.cols.setFrozen(this.frozenColsBySheet.get(sheet.id) ?? 0)
    this.layout.frozenRowCount = this.frozenRowsBySheet.get(sheet.id) ?? 0
    this.layout.scroll = { x: this.layout.scroll.x, y: this.layout.scroll.y }
    this.layout.clampScroll(this.layout.scroll.x, this.layout.scroll.y)
    this.updateSpacer()
    this.input.syncBounds(sheet.rowCount, sheet.columnCount)
    this.markContentChanged()
  }

  private bindEvents(): void {
    this.scrollDiv?.addEventListener('scroll', () => {
      if (this.destroyed || !this.scrollDiv) return
      this.layout.scroll = { x: this.scrollDiv.scrollLeft, y: this.scrollDiv.scrollTop }
      this.scheduler?.requestScrollFrame()
      this.repositionEditor()
    })

    this.input.attach(this.root!, this.buildInteractionCallbacks())
  }

  private buildInteractionCallbacks(): InteractionCallbacks {
    const active = (): WorksheetStore => this.getActiveSheet()
    return {
      hitTest: (point) => {
        const target = this.layout.hitTest(point)
        if (target?.kind !== 'cell') return target
        const activeRange = this.input.selection.getActiveRange()
        if (activeRange) {
          const handleRect = this.layout.getFillHandleRect(activeRange)
          if (handleRect && point.x >= handleRect.x - 2 && point.x <= handleRect.x + handleRect.width + 2 && point.y >= handleRect.y - 2 && point.y <= handleRect.y + handleRect.height + 2) {
            return { kind: 'fillHandle', row: activeRange.end.row, col: activeRange.end.col }
          }
        }
        return target
      },
      getCellRect: (row, col) => this.layout.getCellRect(row, col),
      getContentSize: () => this.layout.getContentSize(),
      getRowCount: () => active().rowCount,
      getColCount: () => active().columnCount,
      isCellEditable: () => this.features.editing && !this.editing,
      getScroll: () => ({ x: this.layout.scroll.x, y: this.layout.scroll.y }),
      scrollBy: (dx, dy) => {
        if (!this.scrollDiv) return
        const clamped = this.layout.clampScroll(this.scrollDiv.scrollLeft + dx, this.scrollDiv.scrollTop + dy)
        this.scrollDiv.scrollLeft = clamped.x
        this.scrollDiv.scrollTop = clamped.y
      },
      onCommand: (command) => this.handleCommand(command),
      onSelectionChange: (ranges, activeIndex) => {
        this.bus.emit(PublicEvent.SELECTION_CHANGE, { ranges: [...ranges], activeIndex })
        const focus = this.input.selection.getFocusCell()
        if (focus && !this.layout.isCellVisible(focus.row, focus.col)) {
          const rect = this.layout.getCellRect(focus.row, focus.col)
          if (rect) {
            const size = this.layout.viewportSize
            // E3：主区行以冻结带底缘为上边界
            const topBound = focus.row < this.layout.frozenRowCount ? COL_HEADER_HEIGHT : COL_HEADER_HEIGHT + this.layout.frozenBandHeight
            const dx = rect.x < ROW_HEADER_WIDTH ? rect.x - ROW_HEADER_WIDTH : rect.x + rect.width > size.width ? rect.x + rect.width - size.width : 0
            const dy = rect.y < topBound ? rect.y - topBound : rect.y + rect.height > size.height ? rect.y + rect.height - size.height : 0
            if (dx !== 0 || dy !== 0) this.buildInteractionCallbacks().scrollBy(dx, dy)
          }
        }
        this.markContentChanged()
      },
      onEditStart: (row, col, options) => this.openEditor(row, col, options?.initialChar),
      onResize: (kind, index, delta, phase) => this.handleResize(kind, index, delta, phase),
      getCopyData: () => this.buildCopyData(),
      getEdgeCell: (row, col, dr, dc) => this.findEdgeCell(row, col, dr, dc),
      onAutoFit: (kind, index) => this.autoFit(kind, index),
    }
  }

  /** 双击行/列边界：按内容自适应（与 Grid 同构；上限 320px） */
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

  /** 按内容自适应行高 / 列宽（宿主可直接调用；双击边界也走这里） */
  autoFit(kind: 'row' | 'col', index: number): void {
    if (kind === 'col') {
      const font = fontString({ size: this.themeTokens.fontSize, family: this.themeTokens.fontFamily })
      const visible = this.layout.getVisibleWindow()
      const lastRow = Math.min(visible.lastRow, visible.firstRow + 300)
      let maxWidth = 64
      for (let row = visible.firstRow; row <= lastRow; row++) {
        const value = this.getCellValue(undefined, row, index)
        if (value === null || value === undefined) continue
        const text = typeof value === 'number' ? String(Math.round(value * 100) / 100) : String(value)
        const width = this.renderer.textCache.width(text, font) + 18
        if (width > maxWidth) maxWidth = width
      }
      this.layout.cols.setWidth(index, Math.min(320, Math.ceil(maxWidth)))
    } else {
      this.layout.rows.setHeight(index, this.layout.rows.defaultHeight)
    }
    this.updateSpacer()
    this.markContentChanged()
    this.bus.emit('sx:resized', {
      kind,
      index,
      size: kind === 'col' ? this.layout.cols.getWidth(index) : this.layout.rows.getHeight(index),
    })
  }

  /** Excel Ctrl+方向键语义：连续非空区的边界格（与 Grid 实现同构） */
  private findEdgeCell(row: number, col: number, dr: number, dc: number): { row: number; col: number } | null {
    const rowCount = this.layout.rows.rowCount
    const colCount = this.layout.cols.count
    if (rowCount === 0 || colCount === 0) return null
    const isEmpty = (r: number, c: number): boolean => {
      const value = this.getCellValue(undefined, r, c)
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

  // ==========================================================================
  // 命令处理
  // ==========================================================================

  private handleCommand(command: SemanticCommand): void {
    if (this.destroyed) return
    switch (command.id) {
      case 'grid.command.undo':
        if (this.features.undoRedo) void this.commands.undo()
        break
      case 'grid.command.redo':
        if (this.features.undoRedo) void this.commands.redo()
        break
      case 'grid.command.clear-cells': {
        const ranges = (command.params as { ranges: CellRange[] }).ranges
        this.clearRanges(ranges)
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
        break
      }
      default:
        console.warn(`[SheetX] 未知的语义命令: ${command.id}`)
    }
  }

  private collectRangeCells(ranges: ReadonlyArray<CellRange>, value: CellData | null): SetSheetCellsParams {
    const sheet = this.getActiveSheet()
    const cells: SetSheetCellsParams['cells'] = []
    for (const range of ranges) {
      for (let row = range.start.row; row <= range.end.row; row++) {
        for (let col = range.start.col; col <= range.end.col; col++) {
          if (row >= sheet.rowCount || col >= sheet.columnCount) continue
          cells.push({ row, col, newData: value })
        }
      }
    }
    return { sheetId: sheet.id, cells }
  }

  private clearRanges(ranges: ReadonlyArray<CellRange>): void {
    const params = this.collectRangeCells(ranges, null)
    if (params.cells.length === 0) return
    this.executeSetCells(params, 'user')
  }

  private pasteMatrix(matrix: string[][], startRow: number, startCol: number): void {
    const sheet = this.getActiveSheet()
    const params: SetSheetCellsParams = { sheetId: sheet.id, cells: [] }
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r]!.length; c++) {
        const row = startRow + r
        const col = startCol + c
        if (row >= sheet.rowCount || col >= sheet.columnCount) break
        const text = matrix[r]![c] ?? ''
        const cellData = text.startsWith('=')
          ? { f: text }
          : text === ''
            ? null
            : { v: coerceText(text) }
        params.cells.push({ row, col, newData: cellData })
      }
    }
    if (params.cells.length === 0) return
    this.executeSetCells(params, 'paste')
  }

  /**
   * 填充柄（E5）：数字等差 / 日期序列（月末钳制）/ 中文循环序列。
   * 公式格不做引用平移（v1 限制）——含公式的行线退回重复平铺。
   */
  private applyFill(fromRange: CellRange, toRow: number, toCol: number): void {
    const sheet = this.getActiveSheet()
    const params: SetSheetCellsParams = { sheetId: sheet.id, cells: [] }
    const vertical = toRow > fromRange.end.row || toRow < fromRange.start.row
    const horizontal = toCol > fromRange.end.col || toCol < fromRange.start.col

    const tileLine = (targets: Array<{ row: number; col: number }>, sources: Array<{ row: number; col: number }>): void => {
      targets.forEach((target, index) => {
        const src = sources[index % sources.length]!
        params.cells.push({ row: target.row, col: target.col, newData: sheet.getCellData(src.row, src.col) ?? null })
      })
    }

    const deriveLine = (targets: Array<{ row: number; col: number }>, sources: Array<{ row: number; col: number }>): void => {
      // 任一源格是公式 → 该线退回平铺（v1 不做公式引用平移）
      if (sources.some((src) => sheet.getCellData(src.row, src.col)?.f)) {
        tileLine(targets, sources)
        return
      }
      const sourceValues = sources.map((src) => sheet.getRawValue(src.row, src.col))
      const derived = deriveFillSeries(sourceValues as never, targets.length)
      targets.forEach((target, index) => {
        const value = derived[index]
        params.cells.push({
          row: target.row,
          col: target.col,
          newData: value === null || value === undefined || value === '' ? null : { v: value as never },
        })
      })
    }

    if (vertical || !horizontal) {
      const down = toRow >= fromRange.end.row
      const count = down ? toRow - fromRange.end.row : fromRange.start.row - toRow
      if (count > 0) {
        for (let col = fromRange.start.col; col <= fromRange.end.col; col++) {
          const sources: Array<{ row: number; col: number }> = []
          for (let row = fromRange.start.row; row <= fromRange.end.row; row++) sources.push({ row, col })
          const ordered = down ? sources : [...sources].reverse()
          const targets: Array<{ row: number; col: number }> = []
          for (let i = 1; i <= count; i++) targets.push({ row: down ? fromRange.end.row + i : fromRange.start.row - i, col })
          deriveLine(targets, ordered)
        }
      }
    } else {
      const right = toCol >= fromRange.end.col
      const count = right ? toCol - fromRange.end.col : fromRange.start.col - toCol
      if (count > 0) {
        for (let row = fromRange.start.row; row <= fromRange.end.row; row++) {
          const sources: Array<{ row: number; col: number }> = []
          for (let col = fromRange.start.col; col <= fromRange.end.col; col++) sources.push({ row, col })
          const ordered = right ? sources : [...sources].reverse()
          const targets: Array<{ row: number; col: number }> = []
          for (let i = 1; i <= count; i++) targets.push({ row, col: right ? fromRange.end.col + i : fromRange.start.col - i })
          deriveLine(targets, ordered)
        }
      }
    }
    if (params.cells.length > 0) this.executeSetCells(params, 'user')
  }

  /**
   * set-cells 统一入口：
   * mutation 执行 → 公共 cell-change 事件（带编辑现场捕获的 oldData）→
   * 公式增量重算 → 内容重绘。
   */
  private executeSetCells(params: SetSheetCellsParams, source: SheetTransaction['source'], captured?: SheetCellChange[]): void {
    const sheet = this.workbook.getSheet(params.sheetId)
    if (!sheet) return
    // 编辑现场捕获旧值（mutation 的 transaction 载荷需要它）
    const changes: SheetCellChange[] =
      captured ??
      params.cells.map((cell) => ({
        row: cell.row,
        col: cell.col,
        oldData: sheet.getCellData(cell.row, cell.col),
        newData: cell.newData ?? undefined,
      }))
    this.commands.executeMutation({ id: 'sheet.mutation.set-cells', params, source })
    // 公共事件
    const transaction: SheetTransaction = { id: `tx_${Date.now().toString(36)}`, sheetId: params.sheetId, changes, source }
    this.bus.emit(PublicEvent.CELL_CHANGE, transaction)
    // 公式联动：先同步依赖图（新写入/删除的公式），再对变更坐标做增量重算。
    // 修复：此前只调 recompute，而新公式格不在依赖图中，导致运行时
    // setCellValue('=…') 写入的公式永不求值（getCellValue 返回 null）。
    if (this.features.formula && changes.length > 0) {
      for (const change of changes) {
        const newFormula = change.newData?.f ?? null
        const oldFormula = change.oldData?.f ?? null
        if (newFormula !== oldFormula) {
          this.formula.setFormula(sheet.name, change.row, change.col, newFormula)
        }
      }
      const changed = changes.map((change) => ({ sheet: sheet.name, row: change.row, col: change.col }))
      const formulaChanges = this.formula.recompute(changed)
      if (formulaChanges.length > 0) {
        this.bus.emit<FormulaChange[]>('formula-change', formulaChanges)
      }
    }
    // 当前活动表才需要用局部矩形做 debug 红框；后台表变更走整帧提示。
    const active = this.getActiveSheet()
    const rects: Rect[] = []
    if (active?.id === sheet.id) {
      for (const change of changes) {
        const rect = this.layout.getCellRect(change.row, change.col)
        if (rect) rects.push(rect)
      }
    }
    this.markContentChanged(rects.length > 0 ? unionRects(rects) : undefined)
  }

  // ==========================================================================
  // 编辑流
  // ==========================================================================

  openEditor(row: number, col: number, initialChar?: string): void {
    if (this.destroyed || this.editing) return
    const sheet = this.getActiveSheet()
    if (row >= sheet.rowCount || col >= sheet.columnCount) return
    const rect = this.layout.getCellRect(row, col)
    if (!rect) return

    const payload: BeforeCellEditPayload = {
      sheetId: sheet.id,
      row,
      col,
      value: this.getCellValue(undefined, row, col),
      canceled: false,
      cancel() {
        this.canceled = true
      },
    }
    this.bus.emit('before-cell-edit', payload)
    if (payload.canceled) return

    const raw = sheet.getRawValue(row, col)
    const editorName = typeof raw === 'number' ? BuiltinEditorNames.NUMBER : BuiltinEditorNames.TEXT
    // 编辑预填显示公式串（编辑公式而非计算值——Excel 语义）
    const data = sheet.getCellData(row, col)
    const initial = initialChar ?? (data?.f ?? '')
    // E4：宿主解析 + 坐标换算（body 弹出层用视口坐标）
    const host = this.popup.trackResolve(this.editorHost!)
    const hostRect = this.popup.toHostCoords({ x: rect.x, y: rect.y, width: rect.width, height: rect.height })
    let handle: EditorHandle
    try {
      handle = this.editorRegistry.create(editorName, {
        row,
        col,
        rowId: `${row},${col}`,
        field: 'cell',
        value: raw as never,
        displayValue: initial,
        rect: hostRect,
        container: host,
        imeGuard: this.input.ime,
        params: {},
        commit: (value, autofill, meta) => this.closeEditor(true, value, autofill, meta),
        cancel: () => this.closeEditor(false),
      })
    } catch (error) {
      console.error('[SheetX] 打开编辑器失败:', error)
      return
    }
    host.appendChild(handle.el)
    handle.mount?.()
    this.input.beginEditing()
    this.editing = { sheetId: sheet.id, row, col, handle }
    this.detachPopupChange = this.popup.isDetached(this.editorHost!)
      ? this.popup.onChange(() => this.repositionEditor())
      : null
  }

  private closeEditor(committed: boolean, value?: unknown, autofill?: Record<string, unknown>, meta?: CommitMeta): void {
    const editing = this.editing
    if (!editing) return
    editing.handle.destroy()
    this.editing = null
    this.input.endEditing()
    if (this.detachPopupChange) {
      this.detachPopupChange()
      this.detachPopupChange = null
    }
    if (committed && value !== undefined) {
      const text = typeof value === 'string' ? value : String(value ?? '')
      const cellData: CellData | null = text === '' ? null : text.startsWith('=') ? { f: text } : { v: coerceText(text) }
      const params: SetSheetCellsParams = {
        sheetId: editing.sheetId,
        cells: [{ row: editing.row, col: editing.col, newData: cellData }],
      }
      this.executeSetCells(params, 'user')
      // autofill（远程搜索联动字段）v1 仅 Grid 模式支持——Sheet 模式无「字段→列」映射
      void autofill
    }
    // E6：提交后焦点移动（基准 = 刚编辑的格子）
    if (committed) this.moveFocusAfterCommit(meta?.move, editing.row, editing.col)
    this.markContentChanged()
  }

  /** E6：提交后焦点移动（Enter↓ / Tab→；行尾换行） */
  private moveFocusAfterCommit(move: CommitMeta['move'], fromRow: number, fromCol: number): void {
    if (!move) return
    const selection = this.input.selection
    const sheet = this.getActiveSheet()
    const rowCount = sheet.rowCount
    const colCount = sheet.columnCount
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

  private repositionEditor(): void {
    if (!this.editing) return
    const rect = this.layout.getCellRect(this.editing.row, this.editing.col)
    if (!rect) return
    const hostRect = this.popup.toHostCoords(rect)
    this.editing.handle.el.style.left = `${hostRect.x}px`
    this.editing.handle.el.style.top = `${hostRect.y}px`
  }

  // ==========================================================================
  // 行列尺寸调整（写回 store 的 mutation，undo 可撤销）
  // ==========================================================================

  private resizeState: { kind: 'row' | 'col'; index: number; startSize: number } | null = null

  private handleResize(kind: 'row' | 'col', index: number, delta: number, phase: 'start' | 'move' | 'end'): void {
    const sheet = this.getActiveSheet()
    if (phase === 'start') {
      this.resizeState = {
        kind,
        index,
        startSize: kind === 'row' ? this.layout.rows.getHeight(index) : this.layout.cols.getWidth(index),
      }
      return
    }
    const state = this.resizeState
    if (!state) return
    const newSize = Math.max(kind === 'row' ? 20 : 40, state.startSize + delta)
    // 预览直接改布局模型（O(log n)）；结束后以 mutation 固化（可撤销）
    if (kind === 'row') this.layout.rows.setHeight(index, newSize)
    else this.layout.cols.setWidth(index, newSize)
    if (phase === 'end') {
      if (kind === 'row') {
        this.commands.executeMutation({
          id: 'sheet.mutation.set-row-height',
          params: { sheetId: sheet.id, row: index, height: newSize, prevHeight: state.startSize },
          source: 'user',
        })
      } else {
        this.commands.executeMutation({
          id: 'sheet.mutation.set-col-width',
          params: { sheetId: sheet.id, col: index, width: newSize, prevWidth: state.startSize },
          source: 'user',
        })
      }
      this.resizeState = null
      this.updateSpacer()
    }
    this.markContentChanged()
  }

  // ==========================================================================
  // 剪贴板
  // ==========================================================================

  private buildCopyData(): { text: string; html?: string } | null {
    const ranges = this.input.selection.getRanges()
    if (ranges.length === 0) return null
    const range = ranges[this.input.selection.getActiveIndex()] ?? ranges[0]!
    const sheet = this.getActiveSheet()
    const lines: string[] = []
    const htmlRows: string[] = []
    for (let row = range.start.row; row <= range.end.row; row++) {
      const cells: string[] = []
      const htmlCells: string[] = []
      for (let col = range.start.col; col <= range.end.col; col++) {
        const style = styleOf(sheet, row, col)
        const display = formatValue(this.getCellValue(undefined, row, col), style?.numFmt)
        cells.push(display)
        htmlCells.push(`<td>${escapeHtml(display)}</td>`)
      }
      lines.push(cells.join('\t'))
      htmlRows.push(`<tr>${htmlCells.join('')}</tr>`)
    }
    return { text: lines.join('\n'), html: `<table>${htmlRows.join('')}</table>` }
  }

  // ==========================================================================
  // 公共 API
  // ==========================================================================

  /** 读单元格值（公式格返回计算值；无公式/未计算返回原始值） */
  getCellValue(sheetNameOrId: string | undefined, row: number, col: number): CellValueLike {
    const sheet = sheetNameOrId ? this.workbook.resolveSheet(sheetNameOrId) : this.workbook.getActive()
    if (!sheet) return null
    if (this.features.formula) {
      const computed = this.formula.getComputed(sheet.name, row, col)
      if (computed !== undefined) {
        // 错误对象 → 错误码字符串
        return typeof computed === 'object' && computed !== null && 'code' in computed ? String((computed as { code: string }).code) : (computed as CellValueLike)
      }
    }
    return sheet.getRawValue(row, col)
  }

  /** 双指缩放：单指保留原生惯性滚动，双指按距离比例矢量缩放（非 CSS transform） */
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

  /** 设置整体缩放倍率（0.6–2.5），返回实际生效值 */
  setZoom(scale: number): number {
    const next = Math.max(0.6, Math.min(2.5, scale))
    this.zoomScale = next
    this.themeTokens = { ...this.themeTokens, fontSize: Math.max(8, Math.round(this.baseFontSize * next)) }
    this.layout.rows.setDefaultHeight(Math.max(18, Math.round(this.baseRowHeight * next)))
    for (let col = 0; col < this.baseColWidths.length; col++) {
      this.layout.cols.setWidth(col, Math.round((this.baseColWidths[col] ?? 100) * next))
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

  /** 单元格 A1 地址（公式栏左侧显示；支持 AA 及以后列） */
  cellAddress(row: number, col: number): string {
    let name = ''
    let index = col
    while (index >= 0) {
      name = String.fromCharCode(65 + (index % 26)) + name
      index = Math.floor(index / 26) - 1
    }
    return `${name}${row + 1}`
  }

  /**
   * 公式栏输入文本：有公式则回填公式原文（'=…'），否则回填原始值。
   * 这是宿主公式栏与单元格之间的「读」方向；写方向见 setFormulaBarText。
   */
  getFormulaBarText(row: number, col: number, sheetNameOrId?: string): string {
    const sheet = sheetNameOrId ? this.workbook.resolveSheet(sheetNameOrId) : this.workbook.getActive()
    if (!sheet) return ''
    const data = sheet.getCellData(row, col)
    if (data?.f) return data.f
    const raw = data?.v
    return raw === null || raw === undefined ? '' : String(raw)
  }

  /** 公式栏右侧的只读结果（公式格显示计算值，错误显示 #CODE!） */
  getFormulaBarValue(row: number, col: number, sheetNameOrId?: string): CellValueLike {
    return this.getCellValue(sheetNameOrId, row, col)
  }

  /** 公式栏写回单元格：'=…' 建公式，纯数字转数值，空串清空；可撤销 */
  setFormulaBarText(row: number, col: number, text: string, sheetNameOrId?: string): void {
    const trimmed = text.trim()
    if (trimmed === '') {
      this.setCellValue(sheetNameOrId, row, col, null)
      return
    }
    if (trimmed.startsWith('=')) {
      this.setCellValue(sheetNameOrId, row, col, trimmed)
      return
    }
    // Excel 公式栏语义：输入 "120" 得到数字格（否则 SUM/AVERAGE 会当作文本忽略）
    const numeric = Number(trimmed)
    this.setCellValue(sheetNameOrId, row, col, Number.isFinite(numeric) ? numeric : trimmed)
  }

  /** 写单元格值（'=…' 触发公式解析；可撤销） */
  setCellValue(sheetNameOrId: string | undefined, row: number, col: number, value: CellValueLike): void {
    const sheet = sheetNameOrId ? this.workbook.resolveSheet(sheetNameOrId) : this.workbook.getActive()
    if (!sheet) return
    const cellData: CellData | null =
      value === null || value === undefined || value === ''
        ? null
        : typeof value === 'string' && value.startsWith('=')
          ? { f: value }
          : { v: value as never }
    this.executeSetCells({ sheetId: sheet.id, cells: [{ row, col, newData: cellData }] }, 'api')
  }

  /** 设置单元格样式（样式表去重存储；可撤销） */
  setCellStyle(sheetNameOrId: string | undefined, range: CellRange, style: CellStyle | null): void {
    const sheet = sheetNameOrId ? this.workbook.resolveSheet(sheetNameOrId) : this.workbook.getActive()
    if (!sheet) return
    const styleId = style ? sheet.styles.put(style) : null
    const cells: Array<{ row: number; col: number; styleId: number | null; prevStyleId: number | null }> = []
    for (let row = range.start.row; row <= range.end.row; row++) {
      for (let col = range.start.col; col <= range.end.col; col++) {
        const prev = sheet.getCellData(row, col)?.s ?? null
        cells.push({ row, col, styleId, prevStyleId: prev })
      }
    }
    this.commands.executeMutation({ id: 'sheet.mutation.set-style-ids', params: { sheetId: sheet.id, cells }, source: 'user' })
    this.markContentChanged()
  }

  /** 合并单元格 */
  mergeCells(sheetNameOrId: string | undefined, range: CellRange): void {
    const sheet = sheetNameOrId ? this.workbook.resolveSheet(sheetNameOrId) : this.workbook.getActive()
    if (!sheet) return
    this.commands.executeMutation({ id: 'sheet.mutation.merge', params: { sheetId: sheet.id, range }, source: 'user' })
    this.markContentChanged()
  }

  unmergeCells(sheetNameOrId: string | undefined, anchorRow: number, anchorCol: number): void {
    const sheet = sheetNameOrId ? this.workbook.resolveSheet(sheetNameOrId) : this.workbook.getActive()
    if (!sheet) return
    this.commands.executeMutation({ id: 'sheet.mutation.unmerge', params: { sheetId: sheet.id, anchorRow, anchorCol }, source: 'user' })
    this.markContentChanged()
  }

  addSheet(name?: string): WorksheetStore {
    const sheet = this.workbook.createSheet(name)
    this.commands.clearHistory() // 结构变更跨表undo由 v2 支持；先防历史错位
    this.bus.emit('sheet-added', { sheetId: sheet.id, name: sheet.name })
    this.syncLayoutFromStore()
    return sheet
  }

  removeSheet(sheetId: string): void {
    this.commands.executeMutation({ id: 'sheet.mutation.remove-sheet', params: { sheetId }, source: 'user' })
    this.commands.clearHistory()
    this.bus.emit('sheet-removed', { sheetId })
    this.syncLayoutFromStore()
  }

  setActiveSheet(sheetId: string): void {
    if (this.editing) this.closeEditor(false) // 跨表编辑取消（避免坐标错位）
    this.workbook.setActiveSheet(sheetId)
    this.layout.scroll = { x: 0, y: 0 }
    if (this.scrollDiv) {
      this.scrollDiv.scrollLeft = 0
      this.scrollDiv.scrollTop = 0
    }
    this.syncLayoutFromStore()
    this.bus.emit('active-sheet-changed', { sheetId })
  }

  getActiveSheetId(): string | null {
    return this.workbook.activeSheetId
  }

  getSheetIds(): readonly string[] {
    return this.workbook.getSheetIds()
  }

  /** 重新解析并计算全部公式（加载快照后调用） */
  recalculateAll(): void {
    if (!this.features.formula) return
    // 从 store 的 f 字段重建公式图
    this.formula.reset()
    for (const id of this.workbook.getSheetIds()) {
      const sheet = this.workbook.getSheet(id)!
      sheet.cells.forEach((row, col, data) => {
        if (data.f) this.formula.setFormula(sheet.name, row, col, data.f)
      })
    }
    const changes = this.formula.recalculateAll()
    if (changes.length > 0) this.bus.emit<FormulaChange[]>('formula-change', changes)
    this.markContentChanged()
  }

  async undo(): Promise<void> {
    await this.commands.undo()
    this.syncLayoutFromStore()
    this.recalculateAll()
  }

  async redo(): Promise<void> {
    await this.commands.redo()
    this.syncLayoutFromStore()
    this.recalculateAll()
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

  /**
   * 按区域生成矢量 SVG 图表：区域首行作为字段名，其余行按分类字段聚合。
   */
  chartRangeSvg(range: CellRange, config: ChartFromRecordsConfig): string {
    const startRow = Math.min(range.start.row, range.end.row)
    const endRow = Math.max(range.start.row, range.end.row)
    const startCol = Math.min(range.start.col, range.end.col)
    const endCol = Math.max(range.start.col, range.end.col)
    const headers: string[] = []
    for (let col = startCol; col <= endCol; col++) {
      const value = this.getCellValue(undefined, startRow, col)
      headers.push(value === null || value === undefined ? `c${col}` : String(value))
    }
    const records: Array<Record<string, unknown>> = []
    for (let row = startRow + 1; row <= endRow; row++) {
      const record: Record<string, unknown> = {}
      headers.forEach((header, index) => {
        record[header] = this.getCellValue(undefined, row, startCol + index)
      })
      records.push(record)
    }
    return buildChartSvg(chartFromRecords(records, config))
  }

  /**
   * 按区域构建数据透视表：区域首行作为字段名，其余行作为记录。
   * 结果矩阵可用 pivotToMatrix 导出（CSV/打印），不修改工作表内容。
   */
  pivotRange(range: CellRange, config: PivotConfig): PivotResult {
    const startRow = Math.min(range.start.row, range.end.row)
    const endRow = Math.max(range.start.row, range.end.row)
    const startCol = Math.min(range.start.col, range.end.col)
    const endCol = Math.max(range.start.col, range.end.col)
    const headers: string[] = []
    for (let col = startCol; col <= endCol; col++) {
      const value = this.getCellValue(undefined, startRow, col)
      headers.push(value === null || value === undefined ? `c${col}` : String(value))
    }
    const records: Array<Record<string, unknown>> = []
    for (let row = startRow + 1; row <= endRow; row++) {
      const record: Record<string, unknown> = {}
      headers.forEach((header, index) => {
        record[header] = this.getCellValue(undefined, row, startCol + index)
      })
      records.push(record)
    }
    return buildPivotTable(records, config)
  }

  /**
   * 打印数据源（结构与 @sheetx/io 的 PrintSource 兼容；不新增包依赖）。
   * 文本取公式计算值；条件格式样式同步到打印输出。
   */
  printSource(): {
    rowCount: number
    colCount: number
    rowHeight(row: number): number
    colWidth(col: number): number
    cellText(row: number, col: number): string
    cellStyle(row: number, col: number): { background?: string; color?: string; bold?: boolean; align?: 'left' | 'center' | 'right' } | undefined
    sheetName?: string
  } {
    return {
      rowCount: this.layout.rows.rowCount,
      colCount: this.layout.cols.count,
      rowHeight: (row) => this.layout.rows.getHeight(row),
      colWidth: (col) => this.layout.cols.getWidth(col),
      cellText: (row, col) => {
        const value = this.getCellValue(undefined, row, col)
        return value === null || value === undefined ? '' : String(value)
      },
      cellStyle: (row, col) => {
        if (this.conditionalRules.length === 0) return undefined
        const value = this.getCellValue(undefined, row, col)
        const bounds = new Map<string, { min: number; max: number }>()
        for (const rule of this.conditionalRules) {
          if (rule.type === 'colorScale') bounds.set(rule.id, { min: rule.min, max: rule.max })
          else if (rule.type === 'dataBar') bounds.set(rule.id, { min: rule.min ?? 0, max: rule.max ?? 1 })
        }
        const envelope = {
          min: Math.min(0, ...[...bounds.values()].map((b) => b.min)),
          max: Math.max(1, ...[...bounds.values()].map((b) => b.max)),
        }
        const result = evaluateConditionalFormat(value as never, row, col, this.conditionalRules, envelope)
        if (!result || (!result.background && !result.color && !result.bold)) return undefined
        return { background: result.background, color: result.color, bold: result.bold }
      },
      sheetName: this.getActiveSheetId() ?? undefined,
    }
  }

  /** E3：冻结活动表前 N 行（切表保留，按表记录） */
  freezeRows(count: number): void {
    const sheet = this.getActiveSheet()
    const clamped = Math.max(0, Math.min(count, sheet.rowCount))
    this.frozenRowsBySheet.set(sheet.id, clamped)
    this.layout.frozenRowCount = clamped
    this.markContentChanged()
  }

  /** E3：冻结活动表前 N 列（按表记录，反向选区同样从第 0 列起） */
  freezeColumns(count: number): void {
    const sheet = this.getActiveSheet()
    const clamped = Math.max(0, Math.min(count, sheet.columnCount))
    this.frozenColsBySheet.set(sheet.id, clamped)
    this.layout.cols.setFrozen(clamped)
    this.markContentChanged()
  }

  /** E4：显式指定编辑器弹出层宿主（传 null 恢复默认） */
  setPopupHost(element: HTMLElement | null): void {
    this.popup.setCustomHost(element)
  }

  /** E4：切换编辑器宿主模式 */
  setEditorHostMode(mode: EditorHostMode): void {
    this.popup.setMode(mode)
  }

  setTheme(theme: ThemeTokens | string): void {
    this.themeTokens = resolveTheme(theme, this.themeRegistry)
    this.applyThemeToDom()
    this.markContentChanged()
  }

  registerFormatter(name: string, formatter: ValueFormatter): void {
    this.formatters.set(name, formatter)
  }

  registerEditor(name: string, factory: Parameters<EditorRegistry['register']>[1]): void {
    this.editorRegistry.register(name, factory, { override: true })
  }

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

  getRenderStats(): { lastRenderMs: number; drawCalls: number; blitFrames: number; fps: number } {
    return {
      lastRenderMs: this.renderer.stats.lastRenderMs,
      drawCalls: this.renderer.stats.drawCalls,
      blitFrames: this.renderer.stats.blitFrames,
      fps: this.scheduler?.getFps() ?? 0,
    }
  }

  refresh(): void {
    this.scheduler?.forceFullRedraw()
  }

  isDestroyed(): boolean {
    return this.destroyed
  }

  dispose(): void {
    this.destroy()
  }

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
    this.formula.reset()
    this.popup.dispose()
    this.bus.clear()
    this.renderer.destroy()
    this.root?.remove()
    this.root = null
    this.scrollDiv = null
    this.spacer = null
    this.canvas = null
    this.editorHost = null
  }

  private markContentChanged(rect?: Rect): void {
    this.scheduler?.markContentChanged(rect)
  }
}

// ---------------------------------------------------------------------------
// 工具
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

function loadSparseCells(sheet: WorksheetStore, cells: Record<string, Record<string, CellData>>): void {
  for (const rowKey of Object.keys(cells)) {
    const row = cells[rowKey]!
    for (const colKey of Object.keys(row)) {
      sheet.setCellData(Number(rowKey), Number(colKey), row[colKey]!)
    }
  }
}

/** 粘贴/编辑文本 → 值（数字识别；'' → null） */
function coerceText(text: string): CellValueLike {
  if (text === '') return null
  const num = Number(text)
  if (text.trim() !== '' && !Number.isNaN(num) && /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(text.trim())) return num
  return text
}

function styleOf(sheet: WorksheetStore, row: number, col: number): CellStyle | undefined {
  const data = sheet.getCellData(row, col)
  if (data?.s === undefined) return undefined
  return sheet.styles.get(data.s)
}

function escapeHtml(text: string): string {
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

export type { UnknownRecord }
