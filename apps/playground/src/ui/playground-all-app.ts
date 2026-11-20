/**
 * SheetX 第 37 张 · 综合功能 Playground
 *
 * 双模式 / 编辑 / 公式联动 / 筛选排序 / 条件格式 / 图表 / 主题 / 功能配置，
 * 让开发者无需接入 ERP 即可完整体验 SheetX。
 */
import { LitElement, html, nothing, type TemplateResult } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { baseStyles, lightTokens } from './tokens.js'
import { bindPageTheme, type ResolvedTheme } from './theme.js'
import { playgroundAllStyles } from './playground-all-styles.js'
import { sxIcon, sxLogo } from './icons.js'
import { toast } from './toast.js'
import {
  FUNC_NAV, INITIAL_ROWS, COLUMNS, THEMES, THEME_COLORS, DENSITIES,
  FEATURE_SWITCHES, DATA_SOURCES, TREND, TREND_LABELS, CATEGORY_SHARE, FEATURE_CARDS,
  DEFAULT_CONFIG, type PlayRow, type FullConfig,
} from './playground-all-data.js'

const STORE_KEY = 'sx:playground-all-config'

@customElement('playground-all-app')
export class PlaygroundAllApp extends LitElement {
  static styles = [baseStyles, lightTokens, playgroundAllStyles]

  @state() private theme: ResolvedTheme = 'light'
  @state() private cfg: FullConfig = this.load()
  @state() private rows: PlayRow[] = this.loadRows()
  @state() private editing: { row: number; col: number } | null = null
  @state() private editValue = ''
  @state() private statusFilter = ''
  @state() private search = ''
  @state() private showBottomMore = false

  private stopTheme: (() => void) | null = null

  constructor() {
    super()
    this.stopTheme = bindPageTheme((resolved) => { this.theme = resolved })
  }

  connectedCallback(): void {
    super.connectedCallback()
    this.applyTheme()
  }

  disconnectedCallback(): void {
    this.stopTheme?.()
    this.stopTheme = null
  }

  private load(): FullConfig {
    try {
      const raw = localStorage.getItem(STORE_KEY)
      if (raw) return { ...structuredClone(DEFAULT_CONFIG), ...JSON.parse(raw) }
    } catch { /* 忽略 */ }
    return structuredClone(DEFAULT_CONFIG)
  }

  private loadRows(): PlayRow[] {
    try {
      const raw = localStorage.getItem(STORE_KEY + ':rows')
      if (raw) return JSON.parse(raw)
    } catch { /* 忽略 */ }
    return INITIAL_ROWS.map((r) => ({ ...r }))
  }

  private save(): void {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(this.cfg))
      localStorage.setItem(STORE_KEY + ':rows', JSON.stringify(this.rows))
    } catch { /* 忽略 */ }
  }

  private patch(key: keyof FullConfig, value: unknown): void {
    this.cfg = { ...this.cfg, [key]: value }
    this.save()
  }

  private applyTheme(): void {
    document.documentElement.style.setProperty('--sx-brand', THEME_COLORS[this.cfg.theme] ?? '#2563eb')
  }

  private setTheme(theme: string): void {
    this.patch('theme', theme)
    this.applyTheme()
    toast(`主题已切换：${theme}`)
  }

  private setMode(mode: 'grid' | 'sheet'): void {
    this.patch('mode', mode)
    toast(mode === 'grid' ? '已切换到 Grid 业务网格模式' : '已切换到 Spreadsheet 电子表格模式')
  }

  private toggleFeature(key: string): void {
    this.patch('features', { ...this.cfg.features, [key]: !this.cfg.features[key] })
    toast(this.cfg.features[key] ? `已开启：${FEATURE_SWITCHES.find((f) => f.key === key)?.label}` : '功能已关闭')
  }

  /** 当前选中格的展示值（公式栏用） */
  private currentCellValue(): string {
    const r = this.rows[this.cfg.selected.row]
    if (!r) return ''
    const field = COLUMNS[this.cfg.selected.col]?.key as keyof PlayRow
    return String(r[field] ?? '')
  }

  private selectCell(row: number, col: number): void {
    this.patch('selected', { row, col })
    const r = this.rows[row]
    if (r) {
      const field = COLUMNS[col]?.key as keyof PlayRow
      this.editValue = String(r[field] ?? '')
    }
  }

  private startEdit(row: number, col: number): void {
    if (!this.cfg.features.formula && col === 4) { toast('公式计算已关闭'); return }
    this.selectCell(row, col)
    this.editing = { row, col }
  }

  /** 编辑提交 → 单价/数量变化时重算金额（公式联动） */
  private commitEdit(): void {
    if (!this.editing) return
    const { row, col } = this.editing
    const field = COLUMNS[col]?.key as keyof PlayRow
    const raw = this.editValue.trim()
    let value: string | number = raw
    if (field === 'price' || field === 'qty') value = Number(raw)
    if (Number.isNaN(value as number)) { toast('请输入有效数字'); return }
    const next = this.rows.map((r, i) => {
      if (i !== row) return r
      const updated = { ...r, [field]: value }
      // 公式联动：金额 = 单价 × 数量
      updated.amount = Number(updated.price) * Number(updated.qty)
      return updated
    })
    this.rows = next
    this.editing = null
    this.save()
    if (field === 'price' || field === 'qty') {
      toast(`已更新 ${field}，金额自动重算为 ${next[row]!.amount.toLocaleString('zh-CN')}`)
    } else {
      toast(`已更新单元格 ${COLUMNS[col]?.letter}${row + 1}`)
    }
  }

  private sortBy(field: string): void {
    if (!this.cfg.features.filter) { toast('筛选排序已关闭'); return }
    const dir = this.cfg.sortBy === field && this.cfg.sortDir === 'asc' ? 'desc' : 'asc'
    this.cfg = { ...this.cfg, sortBy: field, sortDir: dir }
    const key = field as keyof PlayRow
    this.rows = [...this.rows].sort((a, b) => {
      const av = a[key], bv = b[key]
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv), 'zh-CN')
      return dir === 'asc' ? cmp : -cmp
    })
    this.save()
    toast(`已按 ${field} ${dir === 'asc' ? '升序' : '降序'}排列`)
  }

  private setStatusFilter(status: string): void {
    this.statusFilter = this.statusFilter === status ? '' : status
    toast(this.statusFilter ? `已筛选：${status}` : '已清除筛选')
  }

  private chooseNav(key: string): void {
    this.patch('func', key)
    if (key === 'theme') this.setTheme(THEMES[(THEMES.indexOf(this.cfg.theme as typeof THEMES[number]) + 1) % THEMES.length]!)
    else if (key === 'filter') toast('筛选排序：点击列头可排序，或点状态标签筛选')
    else if (key === 'formula') toast('公式计算：修改单价或数量，金额列自动重算')
    else if (key === 'conditional') toast('条件格式：金额 ≥ 60000 显示绿色，< 50000 显示黄色')
    else toast(`${FUNC_NAV.find((n) => n.key === key)?.label}（综合演示）`)
  }

  private chooseCard(key: string): void {
    const nav = FUNC_NAV.find((n) => n.key === key)
    this.chooseNav(nav ? key : 'showcase')
  }

  private visibleRows(): PlayRow[] {
    let list = [...this.rows]
    if (this.statusFilter) list = list.filter((r) => r.status === this.statusFilter)
    if (this.search.trim()) {
      const q = this.search.trim().toLowerCase()
      list = list.filter((r) => r.name.toLowerCase().includes(q) || r.category.toLowerCase().includes(q))
    }
    return list
  }

  private total(): { qty: number; amount: number } {
    return this.visibleRows().reduce((acc, r) => ({ qty: acc.qty + r.qty, amount: acc.amount + r.amount }), { qty: 0, amount: 0 })
  }

  /* ================= 渲染 ================= */

  private renderTop(): TemplateResult {
    return html`
      <div class="menu-bar">
        <div class="brand">${sxLogo(22)}</div>
        <span class="page-title">综合功能 Playground</span>
        <span class="live-badge"><span class="dot"></span>在线体验中心</span>
        <div class="search-box">${sxIcon('search', 14)}<input placeholder="搜索功能..." .value=${this.search} @input=${(e: Event) => { this.search = (e.target as HTMLInputElement).value }} /></div>
        <button class="icon-btn" title="主题" @click=${() => this.chooseNav('theme')}>${sxIcon('sun', 15)}</button>
        <span class="avatar" title="宿主用户">张</span>
      </div>`
  }

  private renderModeBar(): TemplateResult {
    const tb = (icon: Parameters<typeof sxIcon>[0], title = ''): TemplateResult => html`<button class="tool-btn" title=${title}>${sxIcon(icon, 14)}</button>`
    return html`
      <div class="mode-bar">
        <button class="mode-btn ${this.cfg.mode === 'grid' ? 'active' : ''}" @click=${() => this.setMode('grid')}>${sxIcon('gridView', 12)} Grid 模式</button>
        <button class="mode-btn ${this.cfg.mode === 'sheet' ? 'active' : ''}" @click=${() => this.setMode('sheet')}>Spreadsheet</button>
        <div class="tool-group">${tb('undo', '撤销')}${tb('redo', '重做')}<span>丨</span>${tb('filter', '插入')}</div>
        <div class="tool-group">
          <select class="mini-select fmt"><option>格式</option><option>数字</option></select>
          ${tb('edit', '编辑')}
          <select class="mini-select fmt"><option>微软雅黑</option><option>PingFang SC</option></select>
          <select class="mini-select size"><option>14</option><option>12</option></select>
          ${tb('bold')}${tb('italic')}${tb('underline')}${tb('fontColor')}${tb('fill')}
        </div>
        <div class="tool-group">
          ${(['alignLeft', 'alignCenter', 'alignRight'] as const).map((i) => tb(i))}
          ${tb('gridView')}${tb('freeze')}
          <button class="tool-btn">更多 ${sxIcon('chevronDown', 9)}</button>
        </div>
        <div class="right">
          <button class="btn" @click=${() => this.chooseNav('theme')}>切换主题 ${sxIcon('chevronDown', 10)}</button>
          <button class="btn ghost" @click=${() => toast('全屏（演示）')}>${sxIcon('fullscreen', 12)}</button>
        </div>
      </div>
      <div class="formula-bar">
        <div class="addr">${COLUMNS[this.cfg.selected.col]?.letter ?? 'A'}${this.cfg.selected.row + 3} ${sxIcon('chevronDown', 10)}</div>
        <span class="fx">fx</span>
        <input class="formula-input" .value=${this.currentCellValue()} @change=${(e: Event) => { this.editValue = (e.target as HTMLInputElement).value; this.commitEdit() }} />
      </div>`
  }

  private renderSidebar(): TemplateResult {
    return html`
      <aside class="sidebar">
        ${FUNC_NAV.map((n) => html`
          <button class="side-item ${this.cfg.func === n.key ? 'active' : ''}" @click=${() => this.chooseNav(n.key)}>
            ${sxIcon(n.icon, 14)} ${n.label}
          </button>`)}
        <div class="side-cta">
          <h4>${sxIcon('rocket', 13)} SheetX</h4>
          <p>开箱即用，功能强大，让表格开发更简单！</p>
          <button class="link" @click=${() => toast('了解更多（演示）')}>了解更多 →</button>
        </div>
      </aside>`
  }

  private renderTable(): TemplateResult {
    const rows = this.visibleRows()
    const total = this.total()
    const densityPad = this.cfg.density === '紧凑' ? '4px 9px' : this.cfg.density === '宽松' ? '11px 9px' : '7px 9px'
    return html`
      <div class="sheet-panel">
        <div class="report-title">${sxIcon('chartBar', 17)} SheetX 综合功能演示表格
          <span class="sub">强大的表格组件，支持多种业务场景</span>
        </div>
        <div class="col-letter-row" style="display:flex;background:var(--sx-bg-subtle);border-bottom:1px solid var(--sx-grid-line)">
          <span style="width:34px;text-align:center;padding:3px 0;color:var(--sx-text-hint);font-size:10px;border-right:1px solid var(--sx-grid-line)"></span>
          ${COLUMNS.map((c) => html`<span style="flex:${c.width};text-align:center;padding:3px 0;color:var(--sx-text-hint);font-size:10px;border-right:1px solid var(--sx-grid-line)">${c.letter}</span>`)}
        </div>
        <table class="data-table" style=${`--row-pad:${densityPad}`}>
          <thead><tr>
            ${COLUMNS.map((c) => html`
              <th style=${`width:${c.width}%`} @click=${() => this.sortBy(c.key)}>
                ${c.title}${this.cfg.sortBy === c.key ? html`<span class="sort-caret">${this.cfg.sortDir === 'asc' ? '▲' : '▼'}</span>` : ''}
              </th>`)}
          </tr></thead>
          <tbody>
            ${rows.map((r, i) => html`
              <tr>
                ${COLUMNS.map((c, ci) => {
                  const field = c.key as keyof PlayRow
                  const selected = this.cfg.selected.row === i && this.cfg.selected.col === ci
                  const isEditing = this.editing?.row === i && this.editing.col === ci
                  // 条件格式演示：金额 ≥ 60000 标绿、< 50000 标黄（金额列），与状态徽章共同体现条件着色
                  const cond = this.cfg.features.conditional && field === 'amount'
                    ? (r.amount >= 60000 ? 'cond-hot' : r.amount < 50000 ? 'cond-warm' : '')
                    : ''
                  return html`
                    <td class="cell ${selected ? 'selected' : ''} ${cond}" style=${`padding:${densityPad}`}
                        @click=${() => this.selectCell(i, ci)} @dblclick=${() => this.startEdit(i, ci)}>
                      ${isEditing
                        ? html`<input class="cell-input" .value=${this.editValue} @input=${(e: Event) => { this.editValue = (e.target as HTMLInputElement).value }} @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this.commitEdit(); if (e.key === 'Escape') this.editing = null }} @blur=${() => { if (this.editing) this.commitEdit() }} autofocus />`
                        : field === 'status'
                          ? html`<span class="status-tag" style=${`background:${r.status === '已发货' ? '#dcfce7' : r.status === '处理中' ? '#dbeafe' : '#fef3c7'};color:${r.status === '已发货' ? '#16803c' : r.status === '处理中' ? '#1d4ed8' : '#a16207'}`} @click=${(e: Event) => { e.stopPropagation(); this.setStatusFilter(r.status) }}>${r.status}</span>`
                          : field === 'amount' ? r.amount.toLocaleString('zh-CN') : field === 'price' ? r.price.toLocaleString('zh-CN') : String(r[field] ?? '')}
                    </td>`
                })}
              </tr>`)}
            <tr class="total">
              <td style=${`padding:${densityPad}`}>合计</td><td style=${`padding:${densityPad}`}>—</td><td style=${`padding:${densityPad}`}>—</td>
              <td style=${`padding:${densityPad}`}>${total.qty}</td><td style=${`padding:${densityPad}`}>${total.amount.toLocaleString('zh-CN')}</td>
              <td style=${`padding:${densityPad}`} colspan="2">${rows.length} 条记录</td>
            </tr>
          </tbody>
        </table>
      </div>`
  }

  private renderCharts(): TemplateResult {
    const base = TREND
    const max = 60000
    const pts = base.map((v, i) => `${(i / (base.length - 1)) * 100},${88 - (v * 1000 / max) * 76}`).join(' ')
    const stops = CATEGORY_SHARE.map((s, i) => `${s.color} ${i === 0 ? 0 : CATEGORY_SHARE[i - 1]!.value}% ${i === 0 ? s.value : 100}%`).join(', ')
    return html`
      <div class="charts">
        ${this.cfg.features.chart ? html`
          <div class="chart-card">
            <h3>${sxIcon('chartLine', 13)} 销售趋势</h3>
            <svg class="line-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
              <line x1="0" y1="88" x2="100" y2="88" stroke="var(--sx-border)" stroke-width=".5" />
              <polygon points=${`0,88 ${pts} 100,88`} fill="var(--sx-brand)" opacity=".12" />
              <polyline points=${pts} fill="none" stroke="var(--sx-brand)" stroke-width="1.5" vector-effect="non-scaling-stroke" />
              ${base.map((v, i) => html`<circle cx=${(i / (base.length - 1)) * 100} cy=${88 - (v * 1000 / max) * 76} r="1.6" fill="var(--sx-brand)" />`)}
            </svg>
            <div style="display:flex;justify-content:space-between;font-size:9px;color:var(--sx-text-hint)">
              ${TREND_LABELS.slice(0, 6).map((l) => html`<span>${l}</span>`)}
            </div>
          </div>` : nothing}
        ${this.cfg.features.chart ? html`
          <div class="chart-card">
            <h3>${sxIcon('chartPie', 13)} 产品分类占比</h3>
            <div class="pie-wrap">
              <div class="pie-donut" style=${`background:conic-gradient(${stops})`}>
                <span class="pie-hole">266,000<br />总金额</span>
              </div>
              <div class="pie-legend">
                ${CATEGORY_SHARE.map((s) => html`
                  <div class="legend-row"><span class="legend-dot" style=${`background:${s.color}`}></span><span>${s.label}</span><span class="pct">${s.value}%</span></div>`)}
              </div>
            </div>
          </div>` : nothing}
      </div>`
  }

  private renderConfig(): TemplateResult {
    return html`
      <aside class="config">
        <div class="config-head">${sxIcon('settings', 15)} 配置面板</div>
        <div class="sec-title">基本配置</div>
        <div style="font-size:11px;font-weight:600;margin-bottom:4px">渲染模式</div>
        <label class="radio-row" @click=${() => this.setMode('grid')}>
          <span class="radio ${this.cfg.mode === 'grid' ? 'on' : ''}"></span>表格模式
        </label>
        <label class="radio-row" @click=${() => this.setMode('sheet')}>
          <span class="radio ${this.cfg.mode === 'sheet' ? 'on' : ''}"></span>电子表格
        </label>
        <span class="field-label">主题风格</span>
        <select class="full-select" .value=${this.cfg.theme} @change=${(e: Event) => this.setTheme((e.target as HTMLSelectElement).value)}>
          ${THEMES.map((t) => html`<option>${t}</option>`)}
        </select>
        <span class="field-label">表格密度</span>
        <select class="full-select" .value=${this.cfg.density} @change=${(e: Event) => this.patch('density', (e.target as HTMLSelectElement).value)}>
          ${DENSITIES.map((d) => html`<option>${d}</option>`)}
        </select>
        <div class="sec-title">功能开关</div>
        ${FEATURE_SWITCHES.map((s) => html`
          <div class="switch-row">${s.label}
            <button class="switch ${this.cfg.features[s.key] ? 'on' : ''}" @click=${() => this.toggleFeature(s.key)}><span class="knob"></span></button>
          </div>`)}
        <div class="sec-title">数据来源</div>
        <div class="chip-row">
          ${DATA_SOURCES.map((d) => html`
            <button class="chip ${this.cfg.dataSource === d ? 'on' : ''}" @click=${() => { this.patch('dataSource', d); toast(`数据来源：${d}`) }}>${d}</button>`)}
        </div>
        <div class="config-tip"><span class="ic">${sxIcon('infoCircle', 13)}</span><span>体验完整功能，感受 SheetX 的强大与易用！</span></div>
      </aside>`
  }

  private renderBottom(): TemplateResult {
    return html`
      <div class="bottom">
        <div class="bottom-head">更多功能演示
          <button class="link" @click=${() => { this.showBottomMore = !this.showBottomMore; toast(this.showBottomMore ? '已展开更多演示' : '已收起') }}>查看更多功能 →</button>
        </div>
        <div class="cards">
          ${FEATURE_CARDS.map((c) => html`
            <div class="feature-card ${this.cfg.func === c.key ? 'active' : ''}" @click=${() => this.chooseCard(c.key)}>
              <div class="thumb">${sxIcon(c.icon, 18)}</div>
              <div class="name">${c.title}</div>
              <div class="hint">${c.hint}</div>
            </div>`)}
        </div>
        ${this.showBottomMore ? html`<div class="config-tip" style="margin-top:9px"><span class="ic">${sxIcon('bulb', 13)}</span><span>全部功能均在本页真实可交互：双击单元格编辑、点列头排序、点状态标签筛选、右侧切换主题与功能开关。</span></div>` : nothing}
      </div>`
  }

  render(): TemplateResult {
    return html`
      <div class="app" data-pg-theme=${this.theme}>
        ${this.renderTop()}
        ${this.renderModeBar()}
        <div class="shell">
          ${this.renderSidebar()}
          <div class="workspace">${this.renderTable()}${this.renderCharts()}</div>
          ${this.renderConfig()}
        </div>
        ${this.renderBottom()}
      </div>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'playground-all-app': PlaygroundAllApp
  }
}
