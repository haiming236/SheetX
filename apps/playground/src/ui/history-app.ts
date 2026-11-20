/**
 * SheetX 第 20 张 · 撤销重做与历史版本管理
 *
 * 数据安全设计（与引擎一致）：
 * - 撤销栈存「成对 mutation」而非整表快照 → 内存与变更量成正比，默认 100 步；
 * - 显式版本快照深拷贝、可 JSON 持久化，高频编辑用节流合并（停止 1.5s 后才落版）；
 * - 恢复只产出目标数据，由宿主写入；本页在本地状态演示这一过程。
 * 对应的引擎实现：@sheetx/data 的 UndoRedoService / @sheetx/core 的 VersionManager。
 */
import { LitElement, html, nothing, type TemplateResult } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { baseStyles, lightTokens } from './tokens.js'
import { bindPageTheme, toggleTheme as toggleGlobalTheme } from './theme.js'
import { historyStyles } from './history-styles.js'
import { sxIcon, sxLogo, type IconName } from './icons.js'
import { toast } from './toast.js'
import {
  INITIAL_HISTORY, INITIAL_VERSIONS, CURRENT_ROWS, EVENT_ICON,
  groupForBatch, diffRows,
  type HistoryRow, type HistoryEvent, type VersionRecord, type RowDiff,
} from './history-data.js'

const TOP_MENUS = ['文件', '开始', '插入', '数据', '公式', '视图', '设置']
const FONT_FAMILIES = ['思源黑体', '苹方', '微软雅黑', 'Segoe UI']
const FONT_SIZES = [12, 10, 11, 14, 16, 18]

@customElement('history-app')
export class HistoryApp extends LitElement {
  static styles = [baseStyles, lightTokens, historyStyles]

  @state() private theme: 'light' | 'dark' = 'light'
  @state() private activeMenu = '开始'
  @state() private undoMenuOpen = false
  @state() private rows: HistoryRow[] = CURRENT_ROWS.map((row) => ({ ...row }))
  @state() private history: HistoryEvent[] = [...INITIAL_HISTORY]
  @state() private redoStack: HistoryEvent[] = []
  @state() private versions: VersionRecord[] = [...INITIAL_VERSIONS]
  @state() private tab: 'history' | 'versions' = 'history'
  @state() private compareFrom = 'v1'
  @state() private compareTo = 'v3'
  @state() private showCompare = false
  @state() private activeSheet = '销售数据'
  @state() private fontFamily = FONT_FAMILIES[0]!
  @state() private fontSize = 12
  @state() private changedIds = new Set<string>()
  private stopTheme: (() => void) | null = null

  constructor() {
    super()
    this.stopTheme = bindPageTheme((resolved) => { this.theme = resolved; this.requestUpdate() })
  }

  disconnectedCallback(): void {
    this.stopTheme?.()
    this.stopTheme = null
    super.disconnectedCallback()
  }

  private get canUndo(): boolean {
    return this.history.length > 0
  }

  private get canRedo(): boolean {
    return this.redoStack.length > 0
  }

  private clone(rows: ReadonlyArray<HistoryRow>): HistoryRow[] {
    return rows.map((row) => ({ ...row }))
  }

  private total(): number {
    return this.rows.reduce((sum, row) => sum + row.amount, 0)
  }

  private restore(rows: ReadonlyArray<HistoryRow>, label: string): void {
    this.rows = this.clone(rows)
    this.changedIds = new Set(this.rows.map((row) => row.id))
    toast(`已恢复：${label}`)
  }

  private undo(count = 1): void {
    if (!this.canUndo) return
    const undone = this.history.slice(0, count)
    const target = this.history[count - 1]
    // 恢复目标事件之前的数据：从当前数据反向应用较简单——用 events 里更早一条的 rows，
    // 若没有更早记录则用初始版本快照
    const fallback = this.versions.find((version) => version.id === 'v1')?.rows ?? []
    this.restore(target ? this.rollbackFrom(target, fallback) : fallback, `撤销 ${count} 步`)
    this.history = this.history.slice(count)
    this.redoStack = [...undone.reverse(), ...this.redoStack]
    this.undoMenuOpen = false
    toast(`已撤销 ${count} 步（合并 ${undone.reduce((s, item) => s + item.mutations, 0)} 个 mutation）`)
  }

  /** 从事件倒推「执行前」的数据：用当前数据与事件 rows 的差异反向还原 */
  private rollbackFrom(target: HistoryEvent, fallback: HistoryRow[]): HistoryRow[] {
    const base = this.clone(fallback)
    // 演示语义：目标是「修改 r3=158000」→ 回退到 initial r3=156000
    const diff = diffRows(base, target.rows)
    for (const change of diff) {
      const row = base.find((item) => item.id === change.id)
      if (row && change.kind === '修改') row.amount = change.before
      if (row && change.kind === '新增') base.splice(base.indexOf(row), 1)
    }
    return base
  }

  private redo(count = 1): void {
    if (!this.canRedo) return
    const redone = this.redoStack.slice(0, count)
    const target = redone[redone.length - 1]
    this.restore(target?.rows ?? this.rows, `重做 ${count} 步`)
    this.history = [...redone.reverse(), ...this.history]
    this.redoStack = this.redoStack.slice(count)
    this.undoMenuOpen = false
    toast(`已重做 ${count} 步`)
  }

  private batchUndo(): void {
    if (!this.canUndo) return
    const groups = groupForBatch(this.history, 3)
    const first = groups[0] ?? []
    this.undo(Math.max(1, first.length))
    toast(`批量撤销 ${first.length} 条操作（节流合并为一次快照）`)
  }

  private captureVersion(auto = false): void {
    const now = new Date()
    const time = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ` +
      `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const version: VersionRecord = {
      id: `v${Date.now().toString(36)}`,
      label: auto ? '自动快照 · 编辑后' : '手动快照',
      time,
      rows: this.clone(this.rows),
      auto,
    }
    this.versions = [version, ...this.versions]
    this.tab = 'versions'
    toast(auto ? '已生成自动快照（节流合并）' : '已保存版本快照')
  }

  private restoreVersion(version: VersionRecord): void {
    this.restore(version.rows, version.label)
    this.compareTo = version.id
  }

  private deleteVersion(id: string): void {
    this.versions = this.versions.filter((version) => version.id !== id)
    toast('版本已删除')
  }

  private get versionDiff(): RowDiff[] {
    return diffRows(
      this.versions.find((version) => version.id === this.compareFrom)?.rows ?? [],
      this.versions.find((version) => version.id === this.compareTo)?.rows ?? [],
    )
  }

  private makeComparison(): void {
    if (this.versions.length < 2) { toast('至少需要两个版本才能对比'); return }
    this.compareFrom = this.versions[Math.min(1, this.versions.length - 1)]!.id
    this.compareTo = this.versions[0]!.id
    this.showCompare = true
  }

  private renderTopbar(): TemplateResult {
    return html`
      <header class="topbar">
        <span class="brand">${sxLogo()}</span>
        <nav class="top-menus">
          ${TOP_MENUS.map((menu) => html`
            <button class="top-menu ${menu === this.activeMenu ? 'active' : ''}" @click=${() => { this.activeMenu = menu }}>${menu}</button>`)}
        </nav>
        <div class="top-right">
          <label class="search">${sxIcon('search', 14)}<input placeholder="搜索功能..." /></label>
          <button class="tb" title="切换主题" @click=${toggleGlobalTheme}>${sxIcon(this.theme === 'dark' ? 'sun' : 'moon', 15)}</button>
          <span class="avatar">JD</span>
        </div>
      </header>`
  }

  private renderToolbar(): TemplateResult {
    return html`
      <div class="toolbar">
        <button class="tb ${this.undoMenuOpen ? 'active' : ''}" title="撤销菜单" @click=${() => { this.undoMenuOpen = !this.undoMenuOpen }}>
          ${sxIcon('undo', 16)} ${sxIcon('chevronDown', 11)}
        </button>
        <button class="tb" title="重做" ?disabled=${!this.canRedo} @click=${() => this.redo()}>${sxIcon('redo', 16)}</button>
        <button class="tb" title="打印" @click=${() => toast('打印')}>${sxIcon('print', 15)}</button>
        <span class="tb-sep"></span>
        <select class="tb-select" .value=${this.fontFamily} @change=${(event: Event) => {
          this.fontFamily = (event.target as HTMLSelectElement).value
        }}>
          ${FONT_FAMILIES.map((font) => html`<option value=${font}>${font}</option>`)}
        </select>
        <select class="tb-select" .value=${String(this.fontSize)} @change=${(event: Event) => {
          this.fontSize = Number((event.target as HTMLSelectElement).value)
        }}>
          ${FONT_SIZES.map((size) => html`<option value=${size}>${size}</option>`)}
        </select>
        <span class="tb-sep"></span>
        ${(['bold', 'italic', 'underline'] as const).map((name) => html`
          <button class="tb" title=${name} @click=${() => toast(`${name} 样式`)}>
            <${name === 'bold' ? 'b' : name === 'italic' ? 'i' : 'u'}>${name === 'bold' ? 'B' : name === 'italic' ? 'I' : 'U'}</${name === 'bold' ? 'b' : name === 'italic' ? 'i' : 'u'}>
          </button>`)}
        <span class="tb-sep"></span>
        <span class="kv">撤销栈 <b>${this.history.length}</b> / 100　重做栈 <b>${this.redoStack.length}</b></span>
        <span class="kv" style="margin-left:auto">内存：mutation 对（非整表快照）</span>
      </div>`
  }

  private renderUndoMenu(): TemplateResult {
    const batchCount = groupForBatch(this.history, 3)[0]?.length ?? 0
    return html`
      <div class="undo-menu">
        <button class="active-item" ?disabled=${!this.canUndo} @click=${() => this.undo()}>
          ${sxIcon('undo', 15)} 撤销 ${this.history[0]?.label ?? ''} <span class="shortcut">⌘Z</span>
        </button>
        <button ?disabled=${!this.canRedo} @click=${() => this.redo()}>
          ${sxIcon('redo', 15)} 重做 <span class="shortcut">⌘⇧Z</span>
        </button>
        <div class="sep"></div>
        <button ?disabled=${!this.canUndo} @click=${this.batchUndo}>
          ${sxIcon('batch', 15)} 批量撤销 ${batchCount > 0 ? `(${batchCount})` : ''}
        </button>
        <button ?disabled=${!this.canRedo} @click=${() => this.redo(Math.min(3, this.redoStack.length))}>
          ${sxIcon('refresh', 15)} 批量重做
        </button>
        <div class="sep"></div>
        <button @click=${() => { this.undoMenuOpen = false; this.tab = 'history' }}>
          ${sxIcon('history', 15)} 操作历史...
        </button>
      </div>`
  }

  private renderTable(): TemplateResult {
    return html`
      <table class="grid">
        <thead><tr><th class="rowhead"></th><th>行号</th><th>产品名称</th><th>销售额（元）</th></tr></thead>
        <tbody>
          ${this.rows.map((row, index) => html`
            <tr>
              <th class="rowhead">${index + 2}</th>
              <td>${index + 1}</td>
              <td>${row.name}</td>
              <td class="num ${this.changedIds.has(row.id) ? 'changed' : ''}">${row.amount.toLocaleString()}</td>
            </tr>`)}
          <tr class="total">
            <th class="rowhead">7</th><td></td><td>合计</td><td class="num">${this.total().toLocaleString()}</td>
          </tr>
        </tbody>
      </table>`
  }

  private renderHistoryTab(): TemplateResult {
    return html`
      <div class="timeline">
        <div class="tl-item">
          <div class="tl-card current">
            <div class="tl-row">
              <span class="tl-title">当前状态</span>
              <span class="tl-badge">当前</span>
            </div>
            <div class="tl-time">2025-01-15 14:30:25 · ${this.rows.length} 行 / 合计 ${this.total().toLocaleString()}</div>
          </div>
        </div>
        ${this.history.map((event, index) => html`
          <div class="tl-item ${index > 3 ? 'muted' : ''}">
            <div class="tl-card">
              <div class="tl-row">
                <span style="color:var(--sx-brand);display:flex">${sxIcon(EVENT_ICON[event.type] as IconName, 14)}</span>
                <span class="tl-title">${event.label}</span>
                <button class="btn-xs" style="margin-left:auto" @click=${() => this.restore(event.rows, event.label)}>恢复</button>
              </div>
              <div class="tl-time">${event.time} · ${event.mutations} mutation${event.mutations > 1 ? 's' : ''}</div>
            </div>
          </div>`)}
      </div>
      <button class="restore-all" @click=${this.captureVersion}>
        ${sxIcon('checkCircle', 15)} 恢复到此版本（生成新快照）
      </button>`
  }

  private renderVersionsTab(): TemplateResult {
    return html`
      ${this.versions.map((version) => html`
        <div class="version-card">
          <span style="color:var(--sx-brand);display:flex">${sxIcon('history', 16)}</span>
          <div class="meta"><b>${version.label}</b><span>${version.time}</span></div>
          ${version.auto ? html`<span class="tag-auto">自动</span>` : nothing}
          <button class="btn-xs" @click=${() => this.restoreVersion(version)}>恢复</button>
          <button class="btn-xs" title="对比" @click=${() => { this.compareTo = version.id; this.showCompare = true }}>${sxIcon('split', 12)}</button>
          <button class="btn-xs" @click=${() => this.deleteVersion(version.id)}>${sxIcon('close', 12)}</button>
        </div>`)}
      <div style="display:flex;gap:8px;margin:10px 0">
        <button class="btn-xs" @click=${() => this.captureVersion(false)}>＋ 手动快照</button>
        <button class="btn-xs" @click=${this.makeComparison}>⇄ 版本对比</button>
      </div>
      <div class="safety">
        <b>${sxIcon('shieldCheck', 15)} 高频编辑下的数据安全</b>
        <p>① 撤销栈存<b>成对 mutation</b>（执行+回滚），不是整表快照——内存只与变更量成正比；默认 100 步，超出按 FIFO 淘汰。</p>
        <p>② 版本快照<b>深拷贝</b>且可 <code>JSON.stringify</code> 持久化；连续编辑用 <code>1.5s 节流</code> 合并，避免产生海量版本。</p>
        <p>③ 恢复只产出目标数据，由宿主写入引擎；<code>flush()</code> 保证离开页面前最后一次编辑不丢失。</p>
      </div>`
  }

  private renderPanel(): TemplateResult {
    return html`
      <aside class="panel">
        <div class="panel-head">
          <span>${sxIcon('history', 17)} 操作历史</span>
          <button class="tb" title="关闭" @click=${() => toast('历史面板已收起')}>${sxIcon('close', 15)}</button>
        </div>
        <div class="panel-tabs">
          <button class="panel-tab ${this.tab === 'history' ? 'active' : ''}" @click=${() => { this.tab = 'history' }}>历史记录</button>
          <button class="panel-tab ${this.tab === 'versions' ? 'active' : ''}" @click=${() => { this.tab = 'versions' }}>版本管理</button>
        </div>
        <div class="panel-body">
          ${this.tab === 'history' ? this.renderHistoryTab() : this.renderVersionsTab()}
        </div>
      </aside>`
  }

  private renderCompare(): TemplateResult {
    const version = (id: string) => this.versions.find((item) => item.id === id)
    const a = version(this.compareFrom)
    const b = version(this.compareTo)
    const diff = this.versionDiff
    const changedIds = new Set(diff.filter((item) => item.kind === '修改').map((item) => item.id))
    const table = (rows: ReadonlyArray<HistoryRow>, isAfter: boolean): TemplateResult => html`
      <table class="mini-table">
        <thead><tr><th>产品名称</th><th>销售额（元）</th></tr></thead>
        <tbody>
          ${rows.map((row) => html`
            <tr>
              <td>${row.name}</td>
              <td class="num ${isAfter && changedIds.has(row.id) ? 'changed' : !isAfter && changedIds.has(row.id) ? 'removed' : ''}">${row.amount.toLocaleString()}</td>
            </tr>`)}
          <tr class="total"><td>合计</td><td class="num">${rows.reduce((sum, row) => sum + row.amount, 0).toLocaleString()}</td></tr>
        </tbody>
      </table>`
    return html`
      <div class="modal-mask" @click=${(event: Event) => {
        if (event.target === event.currentTarget) this.showCompare = false
      }}>
        <div class="modal">
          <div class="modal-head"><span>${sxIcon('split', 16)} 版本对比</span>
            <button class="tb" @click=${() => { this.showCompare = false }}>${sxIcon('close', 15)}</button>
          </div>
          <div class="modal-body">
            <div class="compare-grid">
              <div>
                <h4>版本 A · ${a?.time ?? '—'}</h4>
                ${table(a?.rows ?? [], false)}
              </div>
              <div class="compare-arrow">${sxIcon('arrowRight', 20)}</div>
              <div>
                <h4>版本 B · ${b?.time ?? '—'}</h4>
                ${table(b?.rows ?? [], true)}
              </div>
            </div>
            <div class="legend">
              <span><i style="background:#dcfce7"></i>新增 / 修改（${diff.filter((item) => item.kind !== '删除').length}）</span>
              <span><i style="background:#fee2e2"></i>删除内容（${diff.filter((item) => item.kind === '删除').length}）</span>
            </div>
          </div>
          <div class="modal-foot">
            <button class="btn" @click=${() => { this.showCompare = false }}>关闭</button>
            <button class="btn btn-primary" @click=${() => {
              if (b) this.restoreVersion(b)
              this.showCompare = false
            }}>恢复版本 B</button>
          </div>
        </div>
      </div>`
  }

  render(): TemplateResult {
    return html`
      <div class="app" data-theme=${this.theme}>
        ${this.renderTopbar()}
        ${this.renderToolbar()}
        <div class="body">
          <div class="sheet-side">
            ${this.undoMenuOpen ? this.renderUndoMenu() : nothing}
            ${this.renderTable()}
          </div>
          ${this.renderPanel()}
        </div>
        <div class="sheet-tabs">
          ${['销售数据', '统计分析', '年度汇总'].map((name) => html`
            <button class="sheet-tab ${this.activeSheet === name ? 'active' : ''}" @click=${() => { this.activeSheet = name }}>${name}</button>`)}
        </div>
        <div class="statusbar">
          <span>平均值: ${Math.round(this.total() / Math.max(1, this.rows.length)).toLocaleString()}　计数: ${this.rows.length}　求和: ${this.total().toLocaleString()}</span>
          <span class="right"><span>历史 ${this.history.length} 步</span><span>版本 ${this.versions.length} 个</span><span>100%</span></span>
        </div>
        ${this.showCompare ? this.renderCompare() : nothing}
      </div>`
  }
}

declare global {
  interface HTMLElementTagNameMap { 'history-app': HistoryApp }
}
