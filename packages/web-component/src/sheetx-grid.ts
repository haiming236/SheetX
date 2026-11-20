/**
 * <sheetx-grid> - 业务数据网格 Web Component（@sheetx/grid 的 Lit 外壳）
 *
 * 设计要点（对接指南 §7.1 / 研究报告 §07）：
 * - 引擎实例是普通私有字段，绝不进 Lit 响应式系统；
 * - 复杂配置（columns/data/features）走 property（attribute: false），
 *   简单配置（theme）走 attribute；
 * - 引擎创建放在 firstUpdated()（shadow DOM 首帧渲染完成后才有 .host 容器）；
 * - data 属性引用变化 → engine.setData()（可撤销的全量替换）；
 * - columns 属性引用变化 → wrapper 层销毁并重建引擎（引擎 v1 无公开 setColumns；
 *   重建会重置选区/滚动/撤销栈，见 README「columns 热更新」）；
 * - whenReady()：等待引擎就绪的 Promise，替代宿主侧 rAF/setTimeout 轮询；
 * - disconnectedCallback 销毁引擎（断连即销毁的 v1 简单策略）。
 */

import { LitElement, html, css } from 'lit'
import { customElement } from 'lit/decorators/custom-element.js'
import { property } from 'lit/decorators/property.js'
import { createGrid } from '@sheetx/grid'
import type {
  SheetXGrid,
  GridColumnDef,
  GridFeatures,
  BeforeEditPayload,
  AfterEditPayload,
  EditorHostMode,
} from '@sheetx/grid'
import type { UnknownRecord, DataTransaction, CellRange, ValueFormatter, ConditionalRule, PivotConfig, PivotResult, ChartFromRecordsConfig } from '@sheetx/core'
import type { ValidationError } from '@sheetx/validation'
import type { Appearance } from '@sheetx/ui'
import type { IDataAdapter } from '@sheetx/data-adapter'
import { SheetXEvents, emitSheetXEvent } from './events.js'

@customElement('sheetx-grid')
export class SheetXGridElement extends LitElement {
  /** 列定义（对象数组，禁止走 attribute） */
  @property({ type: Object, attribute: false }) columns: GridColumnDef[] = []
  /** 行数据（对象数组；引用变化即全量替换进引擎） */
  @property({ type: Object, attribute: false }) data: UnknownRecord[] = []
  /** 功能开关 */
  @property({ type: Object, attribute: false }) features?: GridFeatures
  /** 自定义数据适配器（远程分页等） */
  @property({ type: Object, attribute: false }) adapter?: IDataAdapter
  /** 主题：'light' | 'dark' | ThemeTokens */
  @property({ type: Object, attribute: false }) theme?: string | object
  /** 外观预设（compact/standard/spreadsheet）与部件开关 */
  @property({ type: Object, attribute: false }) appearance?: Appearance
  @property({ type: Number }) rowHeight?: number
  @property({ type: Number }) colWidth?: number
  /** 编辑器弹出层宿主模式：'inline'（表格根内，默认）| 'body'（document.body，下拉不被表格边界裁切） */
  @property({ type: Object, attribute: false }) editorHostMode?: EditorHostMode
  /** 脏矩形可视化（调试） */
  @property({ type: Boolean }) debug = false

  /** 引擎实例——私有普通字段，不进响应式系统（getter 对外只读） */
  private engineInstance: SheetXGrid | null = null
  private lastData: UnknownRecord[] | null = null
  private lastColumns: GridColumnDef[] | null = null
  private lastTheme: string | object | undefined
  private unsubscribe: Array<() => void> = []
  private readySettled = false
  private readyResolve: ((engine: SheetXGrid) => void) | null = null
  private readyReject: ((reason: unknown) => void) | null = null
  private readyPromise: Promise<SheetXGrid> = new Promise((resolve, reject) => {
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

  /** 引擎实例（宿主需要高级 API 时直接取用） */
  get engine(): SheetXGrid | null {
    return this.engineInstance
  }

  /**
   * 等待引擎就绪。firstUpdated（shadow DOM 首帧）完成后 resolve 出引擎实例；
   * 元素在就绪前断连销毁则 reject。宿主无需再用 rAF/setTimeout 轮询 `.engine`。
   *
   * ```ts
   * const engine = await grid.whenReady()
   * engine.freezeRows(1)
   * ```
   */
  whenReady(): Promise<SheetXGrid> {
    return this.readyPromise
  }

  firstUpdated(): void {
    this.createEngine()
  }

  updated(changed: Map<string, unknown>): void {
    // columns 引用变化 → wrapper 层重建引擎（引擎 v1 无公开 setColumns）。
    // 取舍：重建会重置选区/滚动位置/撤销栈；换来不改引擎公共 API、
    // 不与引擎并行开发冲突。重建后 data 以当前 this.data 重新灌入。
    // 放在 data/theme 之前：columns 变化时 createEngine 会用最新 data 重建，
    // 避免先对旧引擎做一次多余的 setData。
    if (changed.has('columns') && this.columns !== this.lastColumns) {
      this.createEngine()
      return
    }
    // data 引用变化 → 全量替换（走 mutation，可撤销）
    if (this.engine && changed.has('data') && this.data !== this.lastData) {
      this.lastData = this.data
      this.engine.setData(this.data)
    }
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
      this.readyReject?.(new Error('<sheetx-grid> disconnected before engine ready'))
    }
  }

  /** 创建（或重建）引擎并桥接事件 */
  private createEngine(): void {
    const host = this.renderRoot.querySelector<HTMLElement>('.host')
    if (!host) return
    this.engineInstance?.destroy()
    for (const off of this.unsubscribe) off()
    this.unsubscribe = []
    this.engineInstance = createGrid({
      container: host,
      columns: this.columns,
      data: this.data,
      adapter: this.adapter,
      features: this.features,
      theme: this.theme as never,
      appearance: this.appearance,
      rowHeight: this.rowHeight,
      colWidth: this.colWidth,
      debug: this.debug,
      editorHostMode: this.editorHostMode,
    })
    this.lastData = this.data
    this.lastColumns = this.columns
    this.lastTheme = this.theme
    this.bridgeEvents()
    if (!this.readySettled) {
      this.readySettled = true
      this.readyResolve?.(this.engineInstance)
    }
  }

  /** 引擎事件 → DOM CustomEvent（bubbles + composed） */
  private bridgeEvents(): void {
    const engine = this.engineInstance
    if (!engine) return
    this.unsubscribe = [
      engine.on<DataTransaction>(/* cell-change */ 'cell-change', (tx) => {
        emitSheetXEvent(this, SheetXEvents.CELL_CHANGE, tx)
      }),
      engine.on<{ ranges: CellRange[]; activeIndex: number }>('selection-change', (payload) => {
        emitSheetXEvent(this, SheetXEvents.SELECTION_CHANGE, payload)
      }),
      engine.on<BeforeEditPayload>('before-edit', (payload) => {
        emitSheetXEvent(this, SheetXEvents.BEFORE_EDIT, payload)
      }),
      engine.on<AfterEditPayload>('after-edit', (payload) => {
        emitSheetXEvent(this, SheetXEvents.AFTER_EDIT, payload)
      }),
      engine.on<{ errors: ValidationError[] }>('validation-error', (payload) => {
        emitSheetXEvent(this, SheetXEvents.VALIDATION_ERROR, payload)
      }),
    ]
  }

  // ==========================================================================
  // 常用 API 代理（完整 API 可通过 .engine 使用）
  // ==========================================================================

  getValue(rowId: string, field: string): unknown {
    return this.engine?.getValue(rowId, field)
  }

  setValue(rowId: string, field: string, value: unknown): void {
    this.engine?.setValue(rowId, field, value)
  }

  /** 按列排序（点击列头排序热区也走这里；可撤销） */
  sortByColumn(col: number, dir?: 'asc' | 'desc' | 'toggle'): 'asc' | 'desc' | null {
    return this.engine?.sortByColumn(col, dir) ?? null
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

  /** 整体缩放（双指手势或宿主按钮），返回实际倍率 */
  setZoom(scale: number): number {
    return this.engine?.setZoom(scale) ?? 1
  }

  getZoom(): number {
    return this.engine?.getZoom() ?? 1
  }

  getData(): Array<Record<string, unknown>> {
    return this.engine?.getData() ?? []
  }

  getRowId(index: number): string | undefined {
    return this.engine?.getRowByIndex(index)?.id
  }

  insertRows(index: number, records: ReadonlyArray<UnknownRecord>): void {
    this.engine?.insertRows(index, records)
  }

  deleteRows(rowIds: ReadonlyArray<string>): void {
    this.engine?.deleteRows(rowIds)
  }

  async undo(): Promise<void> {
    await this.engine?.undo()
  }

  async redo(): Promise<void> {
    await this.engine?.redo()
  }

  canUndo(): boolean {
    return this.engine?.canUndo() ?? false
  }

  canRedo(): boolean {
    return this.engine?.canRedo() ?? false
  }

  getSelectedRanges(): CellRange[] {
    return this.engine?.getSelectedRanges() ?? []
  }

  getSelectedRows(): UnknownRecord[] {
    return this.engine?.getSelectedRows().map((row) => row.data) ?? []
  }

  scrollToCell(row: number, col: number): void {
    this.engine?.scrollToCell(row, col)
  }

  registerFormatter(name: string, formatter: ValueFormatter): void {
    this.engine?.registerFormatter(name, formatter)
  }

  async validate(): Promise<ValidationError[]> {
    return this.engine?.validate() ?? []
  }

  refresh(): void {
    this.engine?.refresh()
  }

  /** 按当前数据生成矢量 SVG 图表 */
  chartSvg(config: ChartFromRecordsConfig): string {
    return this.engine?.chartSvg(config) ?? ''
  }

  /** 按当前数据构建数据透视表 */
  pivot(config: PivotConfig): PivotResult | null {
    return this.engine?.pivot(config) ?? null
  }

  /** 冻结前 N 行（表头/汇总行钉住，滚动时保持可见） */
  freezeRows(count: number): void {
    this.engine?.freezeRows(count)
  }

  /** 冻结前 N 列（从第 0 列起连续） */
  freezeColumns(count: number): void {
    this.engine?.freezeColumns(count)
  }

  /** 切换编辑器弹出层宿主模式（'body' 可避免底部行下拉被表格边界裁切） */
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
    'sheetx-grid': SheetXGridElement
  }
}

// 供事件类型收窄使用（保持 import 被消费，避免 verbatimModuleSyntax 未用告警）
export type { GridFeatures, BeforeEditPayload, AfterEditPayload }
export { SheetXEvents }
