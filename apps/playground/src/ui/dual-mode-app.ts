/**
 * SheetX 第 38 张 · Grid 与 Spreadsheet 双模式对比体验
 *
 * 同一套底层引擎的两种交互：左侧 ERP 风格业务数据网格，右侧 Excel 风格电子表格。
 * 双栏对比 / 单栏全屏切换；两侧工具栏、公式栏、筛选、分页、混合图表全部可交互。
 */
import { LitElement, html, nothing, type TemplateResult } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { baseStyles, lightTokens } from './tokens.js'
import { bindPageTheme, type ResolvedTheme } from './theme.js'
import { dualModeStyles } from './dual-mode-styles.js'
import { sxIcon, sxLogo, type IconName } from './icons.js'
import { toast } from './toast.js'
import {
  GRID_ORDERS, STATUS_OPTIONS, MONTH_OPTIONS, SHEET_ROWS, SHEET_TOTAL,
  SHEET_COLUMNS, SHEET_HEADERS, TOP_MENU, SIDE_NAV, MORE_NAV,
  GRID_ADVANTAGES, SHEET_ADVANTAGES, STATUS_COLOR, DEFAULT_CONFIG, fmt,
  type Order, type FullConfig, type ViewMode, type OrderStatus,
} from './dual-mode-data.js'

const STORE_KEY = 'sx:dual-mode-config'

@customElement('dual-mode-app')
export class DualModeApp extends LitElement {
  static styles = [baseStyles, lightTokens, dualModeStyles]

  @state() private theme: ResolvedTheme = 'light'
  @state() private cfg: FullConfig = this.load()
  @state() private orders: Order[] = GRID_ORDERS.map((r) => ({ ...r }))
  @state() private activeMenu = '功能演示'

  private stopTheme: (() => void) | null = null

  constructor() {
    super()
    this.stopTheme = bindPageTheme((resolved) => { this.theme = resolved })
  }

  connectedCallback(): void {
    super.connectedCallback()
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

  private save(): void {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(this.cfg)) } catch { /* 忽略 */ }
  }

  private patch(p: Partial<FullConfig>): void {
    this.cfg = { ...this.cfg, ...p }
    this.save()
  }

  // ===== Grid 交互 =====
  private get filteredOrders(): Order[] {
    const { search, statusFilter } = this.cfg
    const kw = search.trim().toLowerCase()
    return this.orders.filter((o) => {
      if (statusFilter !== '全部状态' && o.status !== statusFilter) return false
      if (kw && !`${o.id} ${o.customer}`.toLowerCase().includes(kw)) return false
      return true
    })
  }

  private toggleCheck(id: string): void {
    const checked = this.cfg.checked.includes(id)
      ? this.cfg.checked.filter((x) => x !== id)
      : [...this.cfg.checked, id]
    this.patch({ checked, selectedOrder: id })
  }

  private selectOrder(id: string): void {
    this.patch({ selectedOrder: id })
  }

  private addOrder(): void {
    const n = this.orders.length + 1
    const id = `S02025101${String(n).padStart(3, '0')}`
    const order: Order = { id, customer: '新客户', date: '2025-11-08', amount: 5000, status: '待发货' }
    this.orders = [...this.orders, order]
    toast(`已新增订单 ${id}`)
  }

  private deleteSelected(): void {
    const id = this.cfg.selectedOrder
    if (!id) { toast('请先选中一行'); return }
    this.orders = this.orders.filter((o) => o.id !== id)
    this.patch({
      checked: this.cfg.checked.filter((x) => x !== id),
      selectedOrder: this.orders[0]?.id ?? null,
    })
    toast(`已删除订单 ${id}`)
  }

  private exportOrders(): void {
    const lines = ['订单号,客户名称,订单日期,金额,状态',
      ...this.filteredOrders.map((o) => `${o.id},${o.customer},${o.date},${o.amount},${o.status}`)]
    const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'sheetx-orders.csv'
    a.click()
    URL.revokeObjectURL(a.href)
    toast('已导出 CSV')
  }

  // ===== Spreadsheet 交互 =====
  private selectSheetCell(cell: string): void {
    this.patch({ sheetCell: cell })
  }

  private commitFormula(e: Event): void {
    const v = (e.target as HTMLInputElement).value
    if (v.trim()) toast(`已写入 ${this.cfg.sheetCell}：${v.trim()}`)
  }

  // ===== 视图切换 =====
  private setView(view: ViewMode): void {
    this.patch({ view })
  }

  private chooseNav(label: string, route: string): void {
    if (label === '双模式对比') { toast('当前即双模式对比体验'); return }
    if (label === '主题切换') {
      document.dispatchEvent(new CustomEvent('sx-toggle-theme'))
      toast('已切换深浅主题')
      return
    }
    if (route) {
      window.location.hash = '#' + route
      toast(`已跳转到「${label}」`)
    } else {
      toast(`${label}（本页聚焦双模式对比）`)
    }
  }

  // ================= 渲染 =================
  render(): TemplateResult {
    const single = this.cfg.view !== 'dual'
    return html`
      <div class="app" data-dm-theme=${this.theme}>
        ${this.renderTop()}
        <div class="shell">
          ${this.renderSidebar()}
          <div class="main">
            ${this.renderHead()}
            <div class="compare ${single ? 'single' : ''}">
              ${this.cfg.view === 'sheet' ? nothing : this.renderGridPane()}
              ${this.cfg.view === 'grid' ? nothing : this.renderSheetPane()}
            </div>
          </div>
        </div>
      </div>`
  }

  private renderTop(): TemplateResult {
    return html`
      <div class="menu-bar">
        <div class="brand">${sxLogo(24)}</div>
        <div class="menu-items">
          ${TOP_MENU.map((m) => html`
            <button class="menu-item ${m === this.activeMenu ? 'active' : ''}" @click=${() => { this.activeMenu = m; if (m !== '功能演示') toast(`${m}（本页聚焦功能演示）`) }}>${m}</button>`)}
        </div>
        <div class="search-box">${sxIcon('search', 14)}<input placeholder="搜索功能..." /></div>
        <button class="icon-btn" title="主题" @click=${() => this.chooseNav('主题切换', '')}>${sxIcon('sun', 15)}</button>
        <span class="avatar"><span class="face">张</span>张三 ${sxIcon('chevronDown', 10)}</span>
      </div>`
  }

  private renderSidebar(): TemplateResult {
    const item = (n: { label: string; icon: string; route: string }) => html`
      <button class="side-item ${n.label === '双模式对比' ? 'active' : ''}" @click=${() => this.chooseNav(n.label, n.route)}>
        ${sxIcon(n.icon as IconName, 14)} ${n.label}
      </button>`
    return html`
      <aside class="sidebar">
        <div class="side-title">功能演示</div>
        ${SIDE_NAV.map(item)}
        <div class="side-title spaced">更多示例</div>
        ${MORE_NAV.map(item)}
        <div class="side-cta">
          <div class="t">SheetX</div>
          <div class="d">一套引擎 · 双模式体验</div>
          <button class="btn-link" @click=${() => toast('了解更多：双模式共享同一套渲染引擎')}>了解更多 →</button>
        </div>
      </aside>`
  }

  private renderHead(): TemplateResult {
    return html`
      <div class="head">
        <span class="head-icon">${sxIcon('split', 20)}</span>
        <div>
          <h1>Grid 与 Spreadsheet 双模式对比体验</h1>
          <p>同一套底层引擎，提供两种不同的交互模式：左侧为 ERP 风格业务数据网格，右侧为 Excel 风格电子表格。</p>
        </div>
        <div class="head-actions">
          <button class="btn ${this.cfg.view === 'dual' ? 'active' : ''}" @click=${() => this.setView('dual')}>${sxIcon('split', 13)} 双栏对比</button>
          <button class="btn ${this.cfg.view !== 'dual' ? 'active' : ''}" @click=${() => this.setView(this.cfg.view === 'grid' ? 'sheet' : 'grid')}>${sxIcon('fullscreen', 13)} 全屏体验</button>
          ${this.cfg.view !== 'dual' ? html`<button class="btn" @click=${() => this.setView(this.cfg.view === 'grid' ? 'sheet' : 'grid')}>切换至${this.cfg.view === 'grid' ? 'Spreadsheet' : 'Grid'} ${sxIcon('chevronRight', 11)}</button>` : nothing}
        </div>
      </div>`
  }

  // ---------- Grid 面板 ----------
  private renderGridPane(): TemplateResult {
    const rows = this.filteredOrders
    const allChecked = rows.length > 0 && rows.every((o) => this.cfg.checked.includes(o.id))
    const tool = (ic: IconName, title: string, fn?: () => void) => html`
      <button class="tool" title=${title} @click=${fn ?? (() => toast(`${title}（演示）`))}>${sxIcon(ic, 13)} ${title}</button>`
    return html`
      <section class="pane">
        <div class="pane-head grid">${sxIcon('tableStyle', 15)} Grid 模式 · 业务数据网格 <span class="tag">适合复杂业务数据管理</span></div>
        <div class="toolbar">
          ${tool('refresh', '刷新', () => toast('数据已刷新'))}
          ${tool('plus', '新增', () => this.addOrder())}
          ${tool('edit', '编辑', () => { if (this.cfg.selectedOrder) toast(`编辑 ${this.cfg.selectedOrder}`); else toast('请先选中一行') })}
          ${tool('trash', '删除', () => this.deleteSelected())}
          ${tool('download', '导出', () => this.exportOrders())}
          <span class="tool-sep"></span>
          ${tool('more', '更多')}
        </div>
        <div class="filter-bar">
          <div class="search-sm">${sxIcon('search', 12)}
            <input placeholder="搜索客户、订单号..." .value=${this.cfg.search} @input=${(e: Event) => this.patch({ search: (e.target as HTMLInputElement).value })} />
          </div>
          <select class="mini-sel" @change=${(e: Event) => this.patch({ statusFilter: (e.target as HTMLSelectElement).value as OrderStatus | '全部状态' })}>
            ${STATUS_OPTIONS.map((s) => html`<option ?selected=${s === this.cfg.statusFilter}>${s}</option>`)}
          </select>
          <select class="mini-sel" @change=${(e: Event) => { this.patch({ monthFilter: (e.target as HTMLSelectElement).value }); toast('时间范围已更新') }}>
            ${MONTH_OPTIONS.map((m) => html`<option ?selected=${m === this.cfg.monthFilter}>${m}</option>`)}
          </select>
        </div>
        <div class="tbl-wrap">
          <table class="grid-table">
            <thead><tr>
              <th style="width:28px"><input class="cbx" type="checkbox" .checked=${allChecked} @change=${() => this.patch({ checked: allChecked ? [] : rows.map((o) => o.id) })} /></th>
              <th>订单号</th><th>客户名称</th><th>订单日期</th><th>金额</th><th>状态</th><th>操作</th>
            </tr></thead>
            <tbody>
              ${rows.length === 0 ? html`<tr><td colspan="7" style="text-align:center;color:var(--sx-text-hint);padding:16px">无匹配数据</td></tr>` : nothing}
              ${rows.map((o) => html`
                <tr class="${this.cfg.selectedOrder === o.id ? 'sel' : ''}" @click=${() => this.selectOrder(o.id)}>
                  <td><input class="cbx" type="checkbox" .checked=${this.cfg.checked.includes(o.id)} @click=${(e: Event) => e.stopPropagation()} @change=${() => this.toggleCheck(o.id)} /></td>
                  <td>${o.id}</td><td>${o.customer}</td><td>${o.date}</td>
                  <td style="font-variant-numeric:tabular-nums">¥${fmt(o.amount)}.00</td>
                  <td><span class="status-tag" style="background:${this.statusBg(o.status)};color:${STATUS_COLOR[o.status]}" @click=${(e: Event) => { e.stopPropagation(); this.patch({ statusFilter: o.status }); toast(`已筛选状态：${o.status}`) }}>${o.status}</span></td>
                  <td><span class="op-link" @click=${(e: Event) => { e.stopPropagation(); toast(`查看 ${o.id}`) }}>查看</span><span class="op-link" @click=${(e: Event) => { e.stopPropagation(); toast(`编辑 ${o.id}`) }}>编辑</span></td>
                </tr>`)}
            </tbody>
          </table>
        </div>
        <div class="pager">
          <span>共 ${rows.length} 条，已选 ${this.cfg.checked.length} 条</span>
          <span class="pgs">
            <button class="pg" disabled>‹</button>
            <button class="pg on">1</button>
            <button class="pg" @click=${() => toast('第 2 页（演示数据仅 1 页）')}>2</button>
            <button class="pg" @click=${() => toast('下一页（演示）')}>›</button>
            <select class="mini-sel" @change=${(e: Event) => this.patch({ pageSize: Number((e.target as HTMLSelectElement).value) })}>
              <option ?selected=${this.cfg.pageSize === 10}>每页 10</option>
              <option ?selected=${this.cfg.pageSize === 20}>每页 20</option>
            </select>
          </span>
        </div>
        ${this.renderAdvantage('grid', GRID_ADVANTAGES)}
      </section>`
  }

  private statusBg(s: OrderStatus): string {
    return s === '已发货' ? '#e7f7ed' : s === '待发货' ? '#fdf3e2' : '#fdeaea'
  }

  // ---------- Spreadsheet 面板 ----------
  private renderSheetPane(): TemplateResult {
    const t = (ic: IconName, title: string, fn?: () => void, on = false) => html`
      <button class="tool ${on ? 'on' : ''}" title=${title} @click=${fn ?? (() => toast(`${title}（演示）`))}>${sxIcon(ic, 13)}</button>`
    const cellVal = this.sheetValue(this.cfg.sheetCell)
    return html`
      <section class="pane">
        <div class="pane-head sheet">${sxIcon('tableStyle', 15)} Spreadsheet 模式 · 电子表格 <span class="tag">适合数据分析与复杂计算</span></div>
        <div class="toolbar">
          ${t('undo', '撤销')}${t('redo', '重做')}
          <span class="tool-sep"></span>
          <select class="mini-sel" @change=${() => toast('字体已切换')}>
            <option ?selected=${this.cfg.sheetFont === '微软雅黑'}>微软雅黑</option>
            <option ?selected=${this.cfg.sheetFont === '黑体'}>黑体</option>
          </select>
          <select class="mini-sel" @change=${(e: Event) => { this.patch({ sheetSize: Number((e.target as HTMLSelectElement).value) }); toast('字号已切换') }}>
            ${[12, 14, 16, 18].map((n) => html`<option value=${n} ?selected=${n === this.cfg.sheetSize}>${n}</option>`)}
          </select>
          <span class="tool-sep"></span>
          ${t('bold', '加粗', () => this.patch({ sheetBold: !this.cfg.sheetBold }), this.cfg.sheetBold)}
          ${t('italic', '斜体', () => this.patch({ sheetItalic: !this.cfg.sheetItalic }), this.cfg.sheetItalic)}
          ${t('underline', '下划线', () => this.patch({ sheetUnderline: !this.cfg.sheetUnderline }), this.cfg.sheetUnderline)}
          ${t('fontColor', '字体颜色')}${t('fill', '填充')}
          <span class="tool-sep"></span>
          ${t('alignLeft', '左对齐', () => this.patch({ align: 'left' }), this.cfg.align === 'left')}
          ${t('alignCenter', '居中', () => this.patch({ align: 'center' }), this.cfg.align === 'center')}
          ${t('alignRight', '右对齐', () => this.patch({ align: 'right' }), this.cfg.align === 'right')}
          ${t('gridView', '边框')}
          <button class="tool" @click=${() => toast('更多格式（演示）')}>更多 ${sxIcon('chevronDown', 9)}</button>
        </div>
        <div class="formula-bar">
          <span class="cell-addr">${this.cfg.sheetCell}</span>
          <span class="fx">fx</span>
          <input class="formula-input" .value=${cellVal} @change=${(e: Event) => this.commitFormula(e)} />
        </div>
        <div class="tbl-wrap">
          <table class="sheet-table">
            <thead><tr><th class="col"></th>${SHEET_COLUMNS.map((c) => html`<th>${c}</th>`)}</tr></thead>
            <tbody>
              <tr class="sheet-title-row"><td class="rownum">1</td><td colspan="5">销售报表</td></tr>
              ${SHEET_ROWS.map((r, i) => html`
                ${i === 0 ? html`<tr><td class="rownum">2</td>${SHEET_HEADERS.map((h) => html`<td class="cell" style="background:var(--sx-bg-hover);font-weight:600">${h}</td>`)}</tr>` : nothing}
                <tr>
                  <td class="rownum">${i + 3}</td>
                  ${[r.month, fmt(r.revenue), fmt(r.cost), fmt(r.profit), r.margin].map((v, ci) => {
                    const addr = `${SHEET_COLUMNS[ci]}${i + 3}`
                    return html`<td class="cell ${ci > 0 ? 'num' : ''} ${this.cfg.sheetCell === addr ? 'sel' : ''}" style="text-align:${ci > 0 ? 'right' : this.cfg.align};font-weight:${this.cfg.sheetBold ? 700 : 400};font-style:${this.cfg.sheetItalic ? 'italic' : 'normal'};text-decoration:${this.cfg.sheetUnderline ? 'underline' : 'none'};font-size:${this.cfg.sheetSize}px" @click=${() => this.selectSheetCell(addr)}>${v}</td>`
                  })}
                </tr>`)}
              <tr class="sheet-total">
                <td class="rownum">8</td>
                <td class="cell ${this.cfg.sheetCell === 'A8' ? 'sel' : ''}" @click=${() => this.selectSheetCell('A8')}>合计</td>
                ${[fmt(SHEET_TOTAL.revenue), fmt(SHEET_TOTAL.cost), fmt(SHEET_TOTAL.profit), SHEET_TOTAL.margin].map((v, ci) => {
                  const addr = `${SHEET_COLUMNS[ci + 1]}8`
                  return html`<td class="cell num ${this.cfg.sheetCell === addr ? 'sel' : ''}" @click=${() => this.selectSheetCell(addr)}>${v}</td>`
                })}
              </tr>
            </tbody>
          </table>
        </div>
        ${this.renderSheetChart()}
        ${this.renderAdvantage('sheet', SHEET_ADVANTAGES)}
      </section>`
  }

  private sheetValue(addr: string): string {
    if (addr === 'A1') return '销售报表'
    const m = /^([A-E])(\d+)$/.exec(addr)
    if (!m) return ''
    const ci = SHEET_COLUMNS.indexOf(m[1] as typeof SHEET_COLUMNS[number])
    const row = Number(m[2])
    if (row === 2) return SHEET_HEADERS[ci] ?? ''
    if (row >= 3 && row <= 7) {
      const r = SHEET_ROWS[row - 3]
      return [r.month, String(r.revenue), String(r.cost), String(r.profit), r.margin][ci] ?? ''
    }
    if (row === 8) return [SHEET_TOTAL.month, String(SHEET_TOTAL.revenue), String(SHEET_TOTAL.cost), String(SHEET_TOTAL.profit), SHEET_TOTAL.margin][ci] ?? ''
    return ''
  }

  /** 混合图：HTML div 画柱/网格（WebKit shadow DOM 下 SVG rect/line 不渲染），SVG 只画折线/圆点/标签 */
  private renderSheetChart(): TemplateResult {
    const W = 400, H = 90, PAD = 4
    const max = 200000
    const bw = W / SHEET_ROWS.length
    const y = (v: number) => H - PAD - (v / max) * (H - PAD * 2)
    return html`
      <div class="chart-box">
        <div class="chart-title">销售趋势分析</div>
        <div class="chart-holder">
          <div class="y-axis">${[200, 150, 100, 50, 0].map((n) => html`<span>${n}k</span>`)}</div>
          <div class="chart-plot">
            ${[0, 1, 2, 3, 4].map((i) => {
              const gy = PAD + (i * (H - PAD * 2)) / 4
              return html`<div class="grid-line" style="top:${(gy / H) * 100}%"></div>`
            })}
            ${SHEET_ROWS.map((r, i) => {
              const left = ((i * bw + bw * 0.24) / W) * 100
              const width = ((bw * 0.52) / W) * 100
              const height = ((H - PAD - y(r.revenue)) / H) * 100
              return html`<div class="bar" style="left:${left}%;width:${width}%;height:${height}%"></div>`
            })}
            <svg class="chart-svg" viewBox="0 0 ${W} ${H}" aria-label="销售趋势图">
              ${SHEET_ROWS.map((r, i) => {
                const cx = i * bw + bw * 0.5
                return html`
                  <text x=${cx} y=${H - 1} text-anchor="middle" style="font-size:9px;fill:var(--sx-text-hint)">${r.month}</text>
                  <circle cx=${cx} cy=${y(r.profit)} r="3" style="fill:#f59e0b;stroke:#fff;stroke-width:1" />`
              })}
              <polyline points=${SHEET_ROWS.map((r, i) => `${i * bw + bw * 0.5},${y(r.profit)}`).join(' ')} style="fill:none;stroke:#f59e0b;stroke-width:2" />
            </svg>
          </div>
        </div>
        <div class="chart-legend"><span><i style="background:#3b82f6"></i>销售额</span><span><i style="background:#f59e0b"></i>利润</span></div>
      </div>`
  }

  private renderAdvantage(kind: 'grid' | 'sheet', list: readonly string[]): TemplateResult {
    const isGrid = kind === 'grid'
    return html`
      <div class="adv ${kind}">
        <div class="adv-body">
          <h4>${isGrid ? 'Grid 模式优势' : 'Spreadsheet 模式优势'}</h4>
          <ul>${list.map((a) => html`<li>${sxIcon('checkCircle', 12)} ${a}</li>`)}</ul>
        </div>
        <div class="adv-thumb">${isGrid ? this.gridThumb() : this.sheetThumb()}</div>
      </div>`
  }

  private gridThumb(): TemplateResult {
    return html`<svg width="92" height="60" viewBox="0 0 92 60">
      <rect width="92" height="60" fill="var(--sx-bg-surface)" />
      <rect x="4" y="6" width="84" height="9" rx="2" fill="var(--sx-brand-soft)" />
      ${[0, 1, 2, 3, 4].map((i) => html`<g>
        <rect x="5" y=${19 + i * 8} width="82" height="6" rx="1" fill="${i === 1 ? 'var(--sx-brand-soft)' : 'var(--sx-bg-hover)'}" />
        <rect x="8" y=${20 + i * 8} width="22" height="4" rx="1" fill="var(--sx-text-hint)" opacity="0.35" />
        <rect x="66" y=${20 + i * 8} width="14" height="4" rx="2" fill="${i % 2 ? '#16a34a' : '#d97706'}" opacity="0.6" />
      </g>`)}
    </svg>`
  }

  private sheetThumb(): TemplateResult {
    return html`<svg width="92" height="60" viewBox="0 0 92 60">
      <rect width="92" height="60" fill="var(--sx-bg-surface)" />
      <rect x="4" y="5" width="84" height="8" rx="2" fill="#059669" opacity="0.18" />
      ${[0, 1, 2, 3].map((i) => html`<line x1="6" y1=${18 + i * 7} x2="86" y2=${18 + i * 7} stroke="var(--sx-border)" />`)}
      ${[0, 1, 2, 3].map((i) => html`<rect x="8" y=${49 - i * 5} width="14" height=${i * 5 + 4} fill="#3b82f6" opacity="0.7" />`)}
      <polyline points="14,44 32,38 50,30 68,22 82,14" fill="none" stroke="#16a34a" stroke-width="1.8" />
    </svg>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'dual-mode-app': DualModeApp
  }
}
