/**
 * <sheetx-spreadsheet> - 电子表格模式 Web Component（@sheetx/spreadsheet 的 Lit 外壳）
 *
 * 与 <sheetx-grid> 同一套设计纪律：引擎实例不进响应式、firstUpdated 创建、
 * 断连销毁、语义事件桥接为 CustomEvent。
 */

import { LitElement, html, css } from 'lit'
import { customElement } from 'lit/decorators/custom-element.js'
import { property } from 'lit/decorators/property.js'
import { createSpreadsheet } from '@sheetx/spreadsheet'
import type { SheetXSpreadsheet, SpreadsheetSheetConfig, CellStyle } from '@sheetx/spreadsheet'
import type { EditorHostMode } from '@sheetx/grid'
import type { Appearance } from '@sheetx/ui'
import type { CellRange, ConditionalRule, PivotConfig, PivotResult, ChartFromRecordsConfig } from '@sheetx/core'
import { SheetXEvents, emitSheetXEvent } from './events.js'

interface SheetFeatures {
  clipboard?: boolean
  undoRedo?: boolean
  editing?: boolean
  formula?: boolean
}

@customElement('sheetx-spreadsheet')
export class SheetXSpreadsheetElement extends LitElement {
  /** 初始工作表配置 */
  @property({ type: Object, attribute: false }) sheets?: SpreadsheetSheetConfig[]
  @property({ type: String, attribute: 'active-sheet' }) activeSheet?: string
  @property({ type: Object, attribute: false }) features?: SheetFeatures
  @property({ type: Object, attribute: false }) theme?: string | object
  /** 外观预设（compact/standard/spreadsheet）与部件开关 */
  @property({ type: Object, attribute: false }) appearance?: Appearance
  @property({ type: Number }) rowHeight?: number
  @property({ type: Number }) colWidth?: number
  /** 编辑器弹出层宿主模式：'inline'（表格根内，默认）| 'body'（document.body，弹出层不被表格边界裁切） */
  @property({ type: Object, attribute: false }) editorHostMode?: EditorHostMode
  @property({ type: Boolean }) debug = false

  private engineInstance: SheetXSpreadsheet | null = null
  private lastTheme: string | object | undefined
  private unsubscribe: Array<() => void> = []
  private readySettled = false
  private readyResolve: ((engine: SheetXSpreadsheet) => void) | null = null
  private readyReject: ((reason: unknown) => void) | null = null
  private readyPromise: Promise<SheetXSpreadsheet> = new Promise((resolve, reject) => {
    this.readyResolve = resolve
    this.readyReject = reject
  })

  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      min-height: 120px;
    }
    .host {
      width: 100%;
      height: 100%;
    }
  `

  get engine(): SheetXSpreadsheet | null {
    return this.engineInstance
  }

  /**
   * 等待引擎就绪。firstUpdated（shadow DOM 首帧）完成后 resolve 出引擎实例；
   * 元素在就绪前断连销毁则 reject。宿主无需再用 rAF/setTimeout 轮询 `.engine`。
   *
   * ```ts
   * const engine = await sheet.whenReady()
   * engine.setCellValue(undefined, 0, 0, '=SUM(A1:A2)')
   * ```
   */
  whenReady(): Promise<SheetXSpreadsheet> {
    return this.readyPromise
  }

  firstUpdated(): void {
    const host = this.renderRoot.querySelector<HTMLElement>('.host')
    if (!host) return
    this.engineInstance = createSpreadsheet({
      container: host,
      sheets: this.sheets,
      activeSheetName: this.activeSheet,
      features: this.features,
      theme: this.theme as never,
      appearance: this.appearance,
      rowHeight: this.rowHeight,
      colWidth: this.colWidth,
      debug: this.debug,
      editorHostMode: this.editorHostMode,
    })
    this.lastTheme = this.theme
    this.bridgeEvents()
    if (!this.readySettled) {
      this.readySettled = true
      this.readyResolve?.(this.engineInstance)
    }
  }

  updated(changed: Map<string, unknown>): void {
    if (this.engine && changed.has('theme') && this.theme !== this.lastTheme) {
      this.lastTheme = this.theme
      this.engine.setTheme(this.theme as never)
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    for (const off of this.unsubscribe) off()
    this.unsubscribe = []
    this.engineInstance?.destroy()
    this.engineInstance = null
    if (!this.readySettled) {
      this.readySettled = true
      this.readyReject?.(new Error('<sheetx-spreadsheet> disconnected before engine ready'))
    }
  }

  private bridgeEvents(): void {
    const engine = this.engineInstance
    if (!engine) return
    this.unsubscribe = [
      engine.on('cell-change', (tx) => emitSheetXEvent(this, SheetXEvents.CELL_CHANGE, tx)),
      engine.on<{ ranges: CellRange[]; activeIndex: number }>('selection-change', (payload) => {
        emitSheetXEvent(this, SheetXEvents.SELECTION_CHANGE, payload)
      }),
      engine.on('before-cell-edit', (payload) => {
        emitSheetXEvent(this, SheetXEvents.BEFORE_CELL_EDIT, payload)
      }),
      engine.on('after-edit', (payload) => emitSheetXEvent(this, SheetXEvents.AFTER_EDIT, payload)),
      engine.on('formula-change', (changes) => emitSheetXEvent(this, SheetXEvents.FORMULA_CHANGE, changes)),
      engine.on('sheet-added', (payload) => emitSheetXEvent(this, SheetXEvents.SHEET_ADDED, payload)),
      engine.on('sheet-removed', (payload) => emitSheetXEvent(this, SheetXEvents.SHEET_REMOVED, payload)),
      engine.on('active-sheet-changed', (payload) => {
        emitSheetXEvent(this, SheetXEvents.ACTIVE_SHEET_CHANGED, payload)
      }),
    ]
  }

  // ==========================================================================
  // 常用 API 代理
  // ==========================================================================

  getCellValue(sheetNameOrId: string | undefined, row: number, col: number): unknown {
    return this.engine?.getCellValue(sheetNameOrId, row, col)
  }

  setCellValue(sheetNameOrId: string | undefined, row: number, col: number, value: unknown): void {
    this.engine?.setCellValue(sheetNameOrId, row, col, value as never)
  }

  /** 公式栏：A1 地址 */
  cellAddress(row: number, col: number): string {
    return this.engine?.cellAddress(row, col) ?? ''
  }

  /** 公式栏：回填文本（公式格为 '=…' 原文） */
  getFormulaBarText(row: number, col: number, sheetNameOrId?: string): string {
    return this.engine?.getFormulaBarText(row, col, sheetNameOrId) ?? ''
  }

  /** 公式栏：只读计算结果 */
  getFormulaBarValue(row: number, col: number, sheetNameOrId?: string): unknown {
    return this.engine?.getFormulaBarValue(row, col, sheetNameOrId) ?? null
  }

  /** 公式栏：写回（'=…' 建公式、数字推断、空串清空） */
  setFormulaBarText(row: number, col: number, text: string, sheetNameOrId?: string): void {
    this.engine?.setFormulaBarText(row, col, text, sheetNameOrId)
  }

  /** 整体缩放（双指手势或宿主按钮），返回实际倍率 */
  setZoom(scale: number): number {
    return this.engine?.setZoom(scale) ?? 1
  }

  getZoom(): number {
    return this.engine?.getZoom() ?? 1
  }

  /** 条件格式：新增/覆盖规则（同 id 覆盖） */
  addConditionalRule(rule: ConditionalRule): void {
    this.engine?.addConditionalRule(rule)
  }

  removeConditionalRule(id: string): boolean {
    return this.engine?.removeConditionalRule(id) ?? false
  }

  clearConditionalRules(): void {
    this.engine?.clearConditionalRules()
  }

  getConditionalRules(): readonly ConditionalRule[] {
    return this.engine?.getConditionalRules() ?? []
  }

  setCellStyle(sheetNameOrId: string | undefined, range: CellRange, style: CellStyle | null): void {
    this.engine?.setCellStyle(sheetNameOrId, range, style)
  }

  mergeCells(sheetNameOrId: string | undefined, range: CellRange): void {
    this.engine?.mergeCells(sheetNameOrId, range)
  }

  unmergeCells(sheetNameOrId: string | undefined, anchorRow: number, anchorCol: number): void {
    this.engine?.unmergeCells(sheetNameOrId, anchorRow, anchorCol)
  }

  addSheet(name?: string): string | undefined {
    return this.engine?.addSheet(name)?.id
  }

  removeSheet(sheetId: string): void {
    this.engine?.removeSheet(sheetId)
  }

  setActiveSheet(sheetId: string): void {
    this.engine?.setActiveSheet(sheetId)
  }

  recalculateAll(): void {
    this.engine?.recalculateAll()
  }

  async undo(): Promise<void> {
    await this.engine?.undo()
  }

  async redo(): Promise<void> {
    await this.engine?.redo()
  }

  refresh(): void {
    this.engine?.refresh()
  }

  /** 按区域生成矢量 SVG 图表（首行作字段名） */
  chartRangeSvg(range: CellRange, config: ChartFromRecordsConfig): string {
    return this.engine?.chartRangeSvg(range, config) ?? ''
  }

  /** 按区域构建数据透视表（首行作字段名） */
  pivotRange(range: CellRange, config: PivotConfig): PivotResult | null {
    return this.engine?.pivotRange(range, config) ?? null
  }

  /** 冻结前 N 行（表头行钉住，滚动时保持可见） */
  freezeRows(count: number): void {
    this.engine?.freezeRows(count)
  }

  /** 冻结前 N 列（从第 0 列起连续） */
  freezeColumns(count: number): void {
    this.engine?.freezeColumns(count)
  }

  /** 切换编辑器弹出层宿主模式（'body' 可避免底部行弹出编辑器被表格边界裁切） */
  setEditorHostMode(mode: EditorHostMode): void {
    this.engine?.setEditorHostMode(mode)
  }

  /** 显式指定编辑器弹出层宿主元素（传 null 恢复 editorHostMode 默认行为） */
  setPopupHost(element: HTMLElement | null): void {
    this.engine?.setPopupHost(element)
  }

  render() {
    return html`<div class="host" part="host"></div>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sheetx-spreadsheet': SheetXSpreadsheetElement
  }
}

export { SheetXEvents }
