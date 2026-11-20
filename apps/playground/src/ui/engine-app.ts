/**
 * #engine 路由 · 真实引擎对接演示
 *
 * 用 @sheetx/web-component 的 <sheetx-grid> / <sheetx-spreadsheet>
 * 驱动真实引擎（区别于 01-05 张的纯 UI 外壳）：
 * - Grid：业务数据编辑、before-edit 拦截、undo/redo、校验、事件日志
 * - Spreadsheet：公式写入与增量重算（formula-change）
 */

import { LitElement, html, css } from 'lit'
import { customElement } from 'lit/decorators/custom-element.js'
import { state } from 'lit/decorators/state.js'
import { defineSheetxElements } from '@sheetx/web-component'
import type { SheetXGridElement, SheetXSpreadsheetElement } from '@sheetx/web-component'
import type { GridColumnDef } from '@sheetx/grid'

defineSheetxElements()

interface LogItem {
  time: string
  text: string
}

const CATEGORIES = ['办公用品', '数码设备', '生活电器', '食品饮料']

function mockRows(count: number): Array<Record<string, unknown>> {
  const rows: Array<Record<string, unknown>> = []
  for (let i = 0; i < count; i++) {
    rows.push({
      id: `row-${i + 1}`,
      name: `商品 ${String(i + 1).padStart(3, '0')}`,
      category: CATEGORIES[i % CATEGORIES.length]!,
      qty: Math.floor(Math.random() * 500) + 10,
      price: Math.round(Math.random() * 9000) / 10 + 5,
      status: i % 7 === 0 ? '停售' : '在售',
      stockedAt: `2026-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 27) + 1).padStart(2, '0')}`,
    })
  }
  return rows
}

@customElement('engine-app')
export class EngineApp extends LitElement {
  @state() private dark = false
  @state() private logs: LogItem[] = []
  /** E4：编辑器弹出层宿主模式（inline=表格根内 / body=document.body） */
  @state() private hostMode: 'inline' | 'body' = 'inline'
  /** 引擎实时指标（行数/选中数/FPS/绘制调用/帧耗时） */
  @state() private stats = { rows: 0, selected: 0, fps: 0, drawCalls: 0, ms: 0 }

  private statsTimer: ReturnType<typeof setInterval> | null = null

  private data = mockRows(200)
  private lastData: Array<Record<string, unknown>> = this.data

  private columns: GridColumnDef[] = [
    { key: 'name', title: '商品名称', width: 150 },
    { key: 'category', title: '分类', width: 110, editor: 'select', editorParams: { options: CATEGORIES } },
    { key: 'qty', title: '数量', width: 90, editor: 'number', editorParams: { min: 0, max: 99999 } },
    { key: 'price', title: '单价', width: 110, editor: 'currency' },
    {
      key: 'amount',
      title: '金额',
      width: 120,
      editable: false,
      formatter: 'rmb',
    },
    { key: 'status', title: '状态', width: 90, editor: 'select', editorParams: { options: ['在售', '停售'] } },
    { key: 'stockedAt', title: '入库日期', width: 130, editor: 'date' },
  ]

  static styles = css`
    :host {
      display: block;
      height: 100%;
      overflow-y: auto;
      background: var(--sx-bg, #f3f4f8);
      color: var(--sx-text, #1f2329);
      font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
      box-sizing: border-box;
    }
    * {
      box-sizing: border-box;
    }
    .page {
      max-width: 1280px;
      margin: 0 auto;
      padding: 20px 24px 48px;
    }
    .top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 18px;
      margin: 0;
    }
    .top .tip {
      font-size: 12px;
      color: var(--sx-text-weak, #8a8f99);
    }
    .card {
      background: var(--sx-panel, #fff);
      border: 1px solid var(--sx-border, var(--sx-border));
      border-radius: 10px;
      padding: 14px 16px;
      margin-bottom: 18px;
    }
    .card h2 {
      font-size: 14px;
      margin: 0 0 10px;
    }
    .card .desc {
      font-size: 12px;
      color: var(--sx-text-weak, #8a8f99);
      margin: 0 0 10px;
    }
    .toolbar {
      display: flex;
      gap: 8px;
      margin-bottom: 10px;
      flex-wrap: wrap;
    }
    button {
      border: 1px solid var(--sx-border, #d0d3d9);
      background: var(--sx-panel, #fff);
      color: inherit;
      border-radius: 6px;
      padding: 5px 12px;
      font-size: 12px;
      cursor: pointer;
    }
    button:hover {
      border-color: #1a73e8;
      color: #1a73e8;
    }
    .grid-box {
      height: 380px;
      border: 1px solid var(--sx-border, var(--sx-border));
      border-radius: 8px;
      overflow: hidden;
    }
    .sheet-box {
      height: 300px;
      border: 1px solid var(--sx-border, var(--sx-border));
      border-radius: 8px;
      overflow: hidden;
    }
    .stats-row {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      margin-top: 10px;
      padding: 7px 12px;
      border: 1px solid var(--sx-border, var(--sx-border));
      border-radius: 7px;
      background: var(--sx-log-bg, #f7f8fa);
      font-size: 12px;
      color: var(--sx-text-weak, #8a8f99);
    }
    .stats-row b {
      color: var(--sx-text, #1f2329);
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }

    .log {
      margin-top: 10px;
      background: var(--sx-log-bg, #f7f8fa);
      border-radius: 6px;
      padding: 8px 10px;
      font-family: 'JetBrains Mono', Menlo, Consolas, monospace;
      font-size: 11px;
      line-height: 1.7;
      max-height: 120px;
      overflow: auto;
      color: var(--sx-text-weak, #646a73);
    }
    .log .err {
      color: #d93025;
    }
    .log .empty {
      color: var(--sx-text-weak, #a8adb5);
    }
  `

  private log(text: string): void {
    const time = new Date().toLocaleTimeString('zh-CN', { hour12: false })
    this.logs = [{ time, text }, ...this.logs].slice(0, 30)
  }

  private handleCellChange(e: Event): void {
    // Grid: {changes:[{rowId,field,oldValue,newValue}]}；Sheet: {sheetId,changes:[{row,col,oldData,newData}]}
    const detail = (e as CustomEvent).detail as {
      sheetId?: string
      changes?: Array<{
        rowId?: string
        field?: string
        row?: number
        col?: number
        oldValue?: unknown
        newValue?: unknown
        oldData?: { v?: unknown; f?: string }
        newData?: { v?: unknown; f?: string }
      }>
    }
    const changes = detail?.changes ?? []
    for (const c of changes.slice(0, 3)) {
      if (c.field !== undefined) {
        this.log(`grid cell-change ${c.rowId}.${c.field}: ${JSON.stringify(c.oldValue)} → ${JSON.stringify(c.newValue)}`)
      } else {
        const coord = `R${(c.row ?? 0) + 1}C${(c.col ?? 0) + 1}`
        const oldV = c.oldData?.f ?? JSON.stringify(c.oldData?.v)
        const newV = c.newData?.f ?? JSON.stringify(c.newData?.v)
        this.log(`sheet${detail.sheetId ? `(${detail.sheetId.slice(0, 6)})` : ''} ${coord}: ${oldV} → ${newV}`)
      }
    }
  }

  private handleBeforeEdit(_e: Event): void {
    // 宿主拦截点演示位：需要时从 detail 取 rowId/field/value 并调用 detail.cancel()
  }

  private handleFormulaChange(e: Event): void {
    const changes = (e as CustomEvent).detail as Array<{ sheet: string; row: number; col: number; oldValue: unknown; newValue: unknown }>
    for (const c of changes.slice(0, 4)) {
      this.log(`formula-change ${c.sheet}!R${c.row + 1}C${c.col + 1}: ${JSON.stringify(c.oldValue)} → ${JSON.stringify(c.newValue)}`)
    }
  }

  private handleValidationError(e: Event): void {
    const detail = (e as CustomEvent).detail as { errors: Array<{ field: string; message: string }> }
    for (const err of detail.errors.slice(0, 3)) {
      this.log(`校验失败 ${err.field}: ${err.message}`)
    }
  }

  private async handleUndo(): Promise<void> {
    const grid = this.gridRef
    if (!grid?.engine) return
    if (grid.canUndo()) {
      await grid.undo()
      this.log('undo() 已执行')
    } else {
      this.log('没有可撤销的操作')
    }
  }

  private async handleRedo(): Promise<void> {
    const grid = this.gridRef
    if (!grid?.engine) return
    if (grid.canRedo()) {
      await grid.redo()
      this.log('redo() 已执行')
    } else {
      this.log('没有可重做的操作')
    }
  }

  private handleValidate(): void {
    const grid = this.gridRef
    if (!grid) return
    void grid.validate().then((errors) => {
      if (errors.length === 0) this.log('validate() 通过，0 个错误')
      else this.log(`validate() 发现 ${errors.length} 个错误`)
    })
  }

  private handleAppendRow(): void {
    const grid = this.gridRef
    if (!grid) return
    const n = grid.engine?.getRowCount() ?? 0
    grid.insertRows(n, [
      { id: `row-new-${Date.now()}`, name: `新商品 ${n + 1}`, category: '办公用品', qty: 1, price: 9.9, status: '在售', stockedAt: '2026-11-20' },
    ])
    this.log(`insertRows() 追加第 ${n + 1} 行`)
  }

  private get gridRef(): SheetXGridElement | null {
    return this.renderRoot.querySelector<SheetXGridElement>('#demo-grid')
  }

  // ---------- 引擎能力（公开 API 真实演示） ----------

  /** 轮询引擎实时指标（1s 粒度，不影响渲染） */
  private refreshStats(): void {
    const grid = this.gridRef
    if (!grid?.engine) return
    const engine = grid.engine
    const render = engine.getRenderStats()
    this.stats = {
      rows: engine.getRowCount(),
      selected: engine.getSelectedRows().length,
      fps: render.fps,
      drawCalls: render.drawCalls,
      ms: Number((render.lastRenderMs ?? 0).toFixed(2)),
    }
  }

  private handleColumnWidth(): void {
    const grid = this.gridRef
    if (!grid?.engine) return
    grid.engine.setColumnWidth(1, 220)
    this.log('setColumnWidth(1, 220)：第二列加宽（场景重排 + 整帧重绘）')
  }

  private handleDeleteSelected(): void {
    const grid = this.gridRef
    if (!grid?.engine) return
    const rows = grid.engine.getSelectedRows()
    if (rows.length === 0) {
      this.log('✗ 请先点击行头 / 拖选若干行')
      return
    }
    grid.engine.deleteRows(rows.map((row) => row.id))
    this.log(`deleteRows(${rows.length})：已删除选中行`)
    this.refreshStats()
  }

  private handleSumSelected(): void {
    const grid = this.gridRef
    if (!grid?.engine) return
    const rows = grid.engine.getSelectedRows()
    if (rows.length === 0) {
      this.log('✗ 请先选中若干行')
      return
    }
    const values = grid.engine.getSelectedFieldValues('amount')
    const total = values.reduce<number>((sum, value) => sum + Number(value ?? 0), 0)
    this.log(
      `选中 ${rows.length} 行 · 金额合计 ${total.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    )
  }

  private handleExportCsv(): void {
    const grid = this.gridRef
    if (!grid?.engine) return
    const rows = grid.engine.getData()
    const keys = this.columns.map((column) => column.key)
    const header = this.columns.map((column) => column.title)
    const csv =
      '\uFEFF' + [header.join(','), ...rows.map((row) => keys.map((key) => String(row[key] ?? '')).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'engine-grid.csv'
    link.click()
    URL.revokeObjectURL(url)
    this.log(`getData()：已导出 ${rows.length} 行 CSV`)
  }

  private toggleTheme(): void {
    this.dark = !this.dark
    // 变量挂在宿主元素上，:host 与 shadow 内部均可继承
    const style = this.style
    if (this.dark) {
      style.setProperty('--sx-bg', '#14161a')
      style.setProperty('--sx-panel', '#1c1f26')
      style.setProperty('--sx-text', '#e8eaed')
      style.setProperty('--sx-text-weak', '#9aa0a6')
      style.setProperty('--sx-border', '#3c4049')
      style.setProperty('--sx-log-bg', '#22252d')
    } else {
      style.setProperty('--sx-bg', '#f3f4f8')
      style.setProperty('--sx-panel', '#ffffff')
      style.setProperty('--sx-text', '#1f2329')
      style.setProperty('--sx-text-weak', '#8a8f99')
      style.setProperty('--sx-border', '#e5e8ed')
      style.setProperty('--sx-log-bg', '#f7f8fa')
    }
  }

  /** 等子 wrapper 引擎就绪后写入演示公式。
   *  U1.1：用 wrapper 的 whenReady() 等待引擎，替代此前的 rAF 轮询——
   *  父 firstUpdated 时子元素的 firstUpdated 还在 microtask 队列里，
   *  engine 尚为 null，必须等待（Lit 嵌套时序坑，已写入对接指南）。 */
  private async writeFormulaDemo(): Promise<void> {
    const sheet = this.renderRoot.querySelector<SheetXSpreadsheetElement>('#demo-sheet')
    if (!sheet) return
    const engine = await sheet.whenReady()
    engine.setCellValue(undefined, 0, 0, 120)
    engine.setCellValue(undefined, 1, 0, 80)
    engine.setCellValue(undefined, 2, 0, '=SUM(A1:A2)')
    engine.setCellValue(undefined, 3, 0, '=A1*A2')
    engine.setCellValue(undefined, 4, 0, '=IF(A1>100,"达标","未达标")')
    this.log('已写入演示公式：A3=SUM(A1:A2)、A4=A1*A2、A5=IF(A1>100,…)')
  }

  /** E3：冻结前 3 行数据行（滚动时钉住） */
  private handleFreezeRows(): void {
    const grid = this.gridRef
    if (!grid) return
    void grid.whenReady().then((engine) => {
      engine.freezeRows(3)
      this.log('freezeRows(3)：前 3 行已冻结，滚动试试')
    })
  }

  /** E3：解除冻结 */
  private handleUnfreezeRows(): void {
    const grid = this.gridRef
    if (!grid) return
    void grid.whenReady().then((engine) => {
      engine.freezeRows(0)
      this.log('freezeRows(0)：冻结已解除')
    })
  }

  /** E3：滚动到第 100 行，配合冻结行演示钉住效果 */
  private handleScrollMid(): void {
    const grid = this.gridRef
    if (!grid) return
    void grid.whenReady().then((engine) => {
      engine.scrollToCell(100, 0)
      this.log('scrollToCell(100, 0)：已滚动到第 101 行（冻结行应仍可见）')
    })
  }

  /** E4：切换编辑器弹出层宿主（inline = 表格根内；body = document.body，不被表格边界裁切） */
  private handleToggleHostMode(): void {
    const grid = this.gridRef
    if (!grid) return
    this.hostMode = this.hostMode === 'inline' ? 'body' : 'inline'
    void grid.whenReady().then((engine) => {
      engine.setEditorHostMode(this.hostMode)
      this.log(`setEditorHostMode('${this.hostMode}')：${this.hostMode === 'body' ? '弹出层挂 document.body，底部行下拉不再被裁切' : '弹出层回到表格根内'}`)
    })
  }

  firstUpdated(): void {
    void this.writeFormulaDemo()
    window.setTimeout(() => this.refreshStats(), 400)
    this.statsTimer = window.setInterval(() => this.refreshStats(), 1000)
  }

  disconnectedCallback(): void {
    if (this.statsTimer !== null) {
      clearInterval(this.statsTimer)
      this.statsTimer = null
    }
    super.disconnectedCallback()
  }

  render() {
    return html`
      <div class="page">
        <div class="top">
          <h1>引擎对接演示 · &lt;sheetx-grid&gt; / &lt;sheetx-spreadsheet&gt;</h1>
          <div class="tip">
            <a href="#spreadsheet">返回 UI 稿</a> ·
            <button @click=${this.toggleTheme}>${this.dark ? '浅色' : '深色'}</button>
          </div>
        </div>

        <section class="card">
          <h2>Grid 业务数据网格（200 行真实数据 + 编辑 + 撤销 + 冻结行）</h2>
          <p class="desc">
            双击 / F2 / 直接打字进入编辑；分类与状态为下拉编辑器；金额列由格式化器只读展示。
            事件经 wrapper 桥接为 <code>sx-cell-change</code> 等标准 DOM 事件；
            <code>freezeRows()</code> 冻结行、<code>setEditorHostMode('body')</code> 让弹出层不被表格边界裁切。
          </p>
          <div class="toolbar">
            <button @click=${this.handleUndo}>↩ Undo</button>
            <button @click=${this.handleRedo}>↪ Redo</button>
            <button @click=${this.handleValidate}>✓ 全表校验</button>
            <button @click=${this.handleAppendRow}>＋ 追加一行</button>
            <button @click=${this.handleFreezeRows}>⬇ 冻结前 3 行</button>
            <button @click=${this.handleUnfreezeRows}>✕ 解冻</button>
            <button @click=${this.handleScrollMid}>⇥ 滚动到第 101 行</button>
            <button @click=${this.handleColumnWidth}>↔ 列宽加到 220</button>
            <button @click=${this.handleDeleteSelected}>🗑 删除选中行</button>
            <button @click=${this.handleSumSelected}>Σ 选中金额汇总</button>
            <button @click=${this.handleExportCsv}>⬇ 导出 CSV</button>
            <button @click=${this.handleToggleHostMode}>⬍ 弹出层宿主：${this.hostMode === 'inline' ? '表格内' : 'body'}（点击切换）</button>
          </div>
          <div class="grid-box">
            <sheetx-grid
              id="demo-grid"
              .columns=${this.columns}
              .data=${this.lastData}
              .features=${{ clipboard: true, undoRedo: true, editing: true, rowSelection: true }}
              .theme=${this.dark ? 'dark' : 'light'}
              .editorHostMode=${this.hostMode}
              .rowHeight=${30}
              @sx-cell-change=${this.handleCellChange}
              @sx-before-edit=${this.handleBeforeEdit}
              @sx-validation-error=${this.handleValidationError}
            ></sheetx-grid>
          </div>
          <div class="stats-row">
            <span>行数 <b>${this.stats.rows}</b></span>
            <span>选中 <b>${this.stats.selected}</b></span>
            <span>FPS <b>${this.stats.fps}</b></span>
            <span>drawCalls <b>${this.stats.drawCalls}</b></span>
            <span>帧耗时 <b>${this.stats.ms}</b> ms</span>
          </div>
          <div class="log">
            ${this.logs.length === 0
              ? html`<span class="empty">事件日志：等待操作（编辑一个单元格试试）</span>`
              : this.logs.map(
                  (item) => html`<div class=${item.text.startsWith('✗') ? 'err' : ''}>[${item.time}] ${item.text}</div>`,
                )}
          </div>
        </section>

        <section class="card">
          <h2>Spreadsheet 公式引擎（增量重算）</h2>
          <p class="desc">
            A1=120、A2=80、A3=<code>=SUM(A1:A2)</code>、A4=<code>=A1*A2</code>、A5=<code>=IF(A1&gt;100,"达标","未达标")</code>。
            修改 A1 后只有受影响公式重算，并通过 <code>sx-formula-change</code> 广播结果。
          </p>
          <div class="sheet-box">
            <sheetx-spreadsheet
              id="demo-sheet"
              .sheets=${[{ name: '公式演示', rowCount: 50, columnCount: 12 }]}
              .features=${{ formula: true, clipboard: true, undoRedo: true, editing: true }}
              .theme=${this.dark ? 'dark' : 'light'}
              @sx-formula-change=${this.handleFormulaChange}
              @sx-cell-change=${this.handleCellChange}
            ></sheetx-spreadsheet>
          </div>
        </section>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'engine-app': EngineApp
  }
}
