/**
 * SheetX 第 41 张 · 虚拟滚动与百万级数据性能设计
 *
 * 真实虚拟滚动：100 万行数据只渲染可视区域 ~15 行（按需生成，不做全量数组）。
 * 可视区域计算 / 动态行高 / 缓存复用 / 增量渲染 / 滚动保持 60 FPS。
 */
import { LitElement, html, nothing, type TemplateResult } from 'lit'
import { customElement, state, query } from 'lit/decorators.js'
import { baseStyles, lightTokens } from './tokens.js'
import { bindPageTheme, type ResolvedTheme } from './theme.js'
import { virtualScrollStyles } from './virtual-scroll-styles.js'
import { sxIcon, sxLogo } from './icons.js'
import { toast } from './toast.js'
import {
  PERF_NAV, METRICS, COLS, TOTAL_ROWS, ROW_HEIGHT, makeRow,
  PRINCIPLES, STRATEGIES, PERF_STATS, SCENES, PERF_CURVE,
  type DataRow,
} from './virtual-scroll-data.js'

const STORE_KEY = 'sx:virtual-scroll-config'
const OVERSCAN = 3

@customElement('virtual-scroll-app')
export class VirtualScrollApp extends LitElement {
  static styles = [baseStyles, lightTokens, virtualScrollStyles]

  @state() private theme: ResolvedTheme = 'light'
  @state() private activeNav = '性能优化'
  @state() private scrollOffset = 0
  @state() private checked = new Set<number>()
  @state() private dynamicHeight = false
  @state() private rowHeight = ROW_HEIGHT
  @query('.vscroll') private scroller!: HTMLDivElement

  private stopTheme: (() => void) | null = null
  private rafPending = false

  constructor() {
    super()
    this.stopTheme = bindPageTheme((resolved) => { this.theme = resolved })
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY) || '{}')
      if (typeof saved.dynamicHeight === 'boolean') this.dynamicHeight = saved.dynamicHeight
    } catch { /* 忽略 */ }
  }

  connectedCallback(): void { super.connectedCallback() }
  disconnectedCallback(): void {
    this.stopTheme?.()
    this.stopTheme = null
  }

  private save(): void {
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ dynamicHeight: this.dynamicHeight })) } catch { /* 忽略 */ }
  }

  private chooseNav(nav: string): void {
    this.activeNav = nav
    if (nav !== '性能优化') toast(`${nav}（本页聚焦性能优化）`)
  }

  /** 可视区域计算：scrollTop → 起始行，只取可视行 + overscan */
  private get startIndex(): number {
    return Math.max(0, Math.floor(this.scrollOffset / this.rowHeight) - OVERSCAN)
  }
  private get visibleCount(): number {
    const viewport = 286
    return Math.ceil(viewport / this.rowHeight) + OVERSCAN * 2 + 1
  }
  private get endIndex(): number {
    return Math.min(TOTAL_ROWS, this.startIndex + this.visibleCount)
  }
  private get visibleRows(): Array<{ index: number; row: DataRow }> {
    const out: Array<{ index: number; row: DataRow }> = []
    for (let i = this.startIndex; i < this.endIndex; i++) out.push({ index: i, row: makeRow(i) })
    return out
  }

  /** rAF 节流滚动，保持滚动流畅 */
  private onScroll(e: Event): void {
    const top = (e.target as HTMLDivElement).scrollTop
    if (this.rafPending) return
    this.rafPending = true
    requestAnimationFrame(() => {
      this.scrollOffset = top
      this.rafPending = false
    })
  }

  private toggleDynamic(): void {
    this.dynamicHeight = !this.dynamicHeight
    this.rowHeight = this.dynamicHeight ? 30 : ROW_HEIGHT
    this.save()
    toast(this.dynamicHeight ? '已启用动态行高（30px）' : '已恢复标准行高（26px）')
  }

  private toggleCheck(id: number): void {
    const next = new Set(this.checked)
    next.has(id) ? next.delete(id) : next.add(id)
    this.checked = next
  }

  private jumpTo(index: number): void {
    if (!this.scroller) return
    this.scroller.scrollTop = index * this.rowHeight
    this.scrollOffset = this.scroller.scrollTop
    toast(`已跳转到第 ${index.toLocaleString()} 行`)
  }

  render(): TemplateResult {
    return html`
      <div class="app" data-vs-theme=${this.theme}>
        ${this.renderTop()}
        ${this.renderHero()}
        <div class="shell">
          ${this.renderDemo()}
          ${this.renderPrinciple()}
        </div>
        ${this.renderBottom()}
      </div>`
  }

  private renderTop(): TemplateResult {
    return html`
      <div class="menu-bar">
        <div class="brand">${sxLogo(24)}</div>
        <div class="menu-items">
          ${PERF_NAV.map((n) => html`<button class="menu-item ${n === this.activeNav ? 'active' : ''}" @click=${() => this.chooseNav(n)}>${n}</button>`)}
        </div>
        <div class="search-box">${sxIcon('search', 14)}<input placeholder="搜索技术文档..." @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') toast(`搜索：${(e.target as HTMLInputElement).value || '虚拟滚动'}`) }} /></div>
        <button class="icon-btn" title="主题" @click=${() => { document.dispatchEvent(new CustomEvent('sx-toggle-theme')); toast('已切换深浅主题') }}>${sxIcon('sun', 15)}</button>
        <span class="avatar"><span class="face">张</span>张</span>
      </div>`
  }

  private renderHero(): TemplateResult {
    return html`
      <div class="hero-row">
        <div class="hero">
          <span class="hero-ico">${sxIcon('rocket', 24)}</span>
          <div>
            <h1>SheetX 虚拟滚动与百万级数据性能设计</h1>
            <p>通过行列虚拟化、动态渲染和智能缓存，实现百万级数据的流畅展示与高效交互。</p>
          </div>
        </div>
        <div class="hero-metrics">
          ${METRICS.map((m) => html`
            <div class="mcard" style=${`--mc:${m.color}`}>
              <span class="mi">${sxIcon(m.icon, 15)}</span>
              <span><div class="mv">${m.value}</div><div class="ml">${m.label}</div></span>
            </div>`)}
        </div>
      </div>`
  }

  /** 真实虚拟滚动演示 */
  private renderDemo(): TemplateResult {
    const totalHeight = TOTAL_ROWS * this.rowHeight
    const colW = (c: typeof COLS[number]) => `${c.width}px`
    return html`
      <div class="demo">
        <div class="demo-head">
          ${sxIcon('gridView', 15)} 百万级数据表格 · 虚拟滚动演示
          <span class="stat">总数据：1,000,000 行 ｜ 当前渲染：${this.visibleRows.length} 行</span>
        </div>
        <div class="table-wrap">
          <div class="thead">
            ${COLS.map((c) => html`<span class="th" style=${`width:${colW(c)}`}>${c.label}</span>`)}
          </div>
          <div class="vscroll" @scroll=${(e: Event) => this.onScroll(e)}>
            <div class="vspacer" style=${`height:${totalHeight}px`}>
              ${this.visibleRows.map(({ index, row }) => html`
                <div class="vrow" style=${`top:${index * this.rowHeight}px;height:${this.rowHeight}px`}>
                  ${COLS.map((c) => html`<span class="td ${c.key === 'id' || c.key === 'salary' ? 'num' : ''} ${c.key === 'check' ? 'cb' : ''}" style=${`width:${colW(c)}`}>
                    ${c.key === 'check' ? html`<input class="cbx" type="checkbox" .checked=${this.checked.has(row.id)} @change=${() => this.toggleCheck(row.id)} />` : nothingSafe(c.key, row)}
                  </span>`)}
                </div>`)}
            </div>
          </div>
          <div class="hint-bubble"><div class="t">虚拟渲染</div>只渲染可视区域数据行</div>
        </div>
        <div class="demo-foot">
          <span>${sxIcon('eye', 12)} 可视行 ${this.startIndex.toLocaleString()} – ${this.endIndex.toLocaleString()}</span>
          <button class="btn-mini" @click=${() => this.toggleDynamic()}>${this.dynamicHeight ? '标准行高' : '动态行高'}</button>
          <button class="btn-mini" @click=${() => this.jumpTo(500000)}>跳至 50 万行</button>
          <span class="range">6 列 × ${this.visibleRows.length} 行 = ${(6 * this.visibleRows.length)} 单元格</span>
        </div>
      </div>`
  }

  private renderPrinciple(): TemplateResult {
    return html`
      <aside class="principle">
        <div class="principle-head">${sxIcon('settings', 14)} 虚拟滚动工作原理</div>
        <div class="psteps">
          ${PRINCIPLES.map((p, i) => html`
            ${i > 0 ? html`<div class="parrow"></div>` : nothing}
            <div class="pstep" style=${`--pc:${p.tone === 'green' ? '#059669' : '#2563eb'}`}>
              <span class="pi">${sxIcon(p.icon, 14)}</span>
              <span><div class="pt">${p.title}</div><div class="pd">${p.desc}</div></span>
            </div>`)}
        </div>
        <div class="pfinish">${sxIcon('checkCircle', 14)} 大数据下依然保持 60 FPS+</div>
      </aside>`
  }

  private renderBottom(): TemplateResult {
    return html`
      <div class="bottom-grid">
        ${this.renderPerfChart()}
        <div class="bcard" style=${`--bc:#2563eb`}>
          <h4>${sxIcon('settings', 14)} 核心优化策略</h4>
          <ul>${STRATEGIES.map((s) => html`<li>${sxIcon('checkCircle', 11)} ${s}</li>`)}</ul>
        </div>
        <div class="bcard">
          <h4>${sxIcon('chartLine', 14)} 性能指标</h4>
          <div class="stat-grid">
            ${PERF_STATS.map((s) => html`
              <div class="stat" style=${`--sc:${s.color}`}>
                <div class="sv">${sxIcon(s.icon, 12)} ${s.value}</div>
                <div class="sl">${s.label}</div>
              </div>`)}
          </div>
        </div>
        <div class="bcard" style=${`--bc:#059669`}>
          <h4>${sxIcon('rocket', 14)} 适用场景</h4>
          <ul>${SCENES.map((s) => html`<li>${sxIcon('checkCircle', 11)} ${s}</li>`)}</ul>
        </div>
      </div>`
  }

  /** 性能对比折线：HTML div 网格线 + SVG polyline（避开 SVG rect/line 在 shadow DOM 不渲染的坑） */
  private renderPerfChart(): TemplateResult {
    const W = 200, H = 66
    const yFps = (fps: number) => H - (fps / 80) * H
    const pts = (key: 'traditional' | 'virtual') =>
      PERF_CURVE.map((d, i) => `${(i / (PERF_CURVE.length - 1)) * W},${yFps(d[key])}`).join(' ')
    return html`
      <div class="bcard">
        <h4>${sxIcon('chartLine', 14)} 性能对比测试</h4>
        <div class="chart-legend">
          <span><i style="background:#9aa1ad"></i>传统渲染</span>
          <span><i style="background:#2563eb"></i>虚拟渲染 (SheetX)</span>
        </div>
        <div class="perf-chart">
          <div class="ylabels">${[80, 60, 40, 20, 0].map((n) => html`<span>${n}</span>`)}</div>
          <div class="plot">
            ${[0, 1, 2, 3, 4].map((i) => html`<div class="gline" style=${`top:${(i / 4) * 100}%`}></div>`)}
            <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-label="性能对比折线图">
              <polyline points=${pts('traditional')} style="fill:none;stroke:#9aa1ad;stroke-width:2;stroke-dasharray:4 3" />
              <polyline points=${pts('virtual')} style="fill:none;stroke:#2563eb;stroke-width:2.5" />
              ${PERF_CURVE.map((d, i) => html`
                <circle cx=${(i / (PERF_CURVE.length - 1)) * W} cy=${yFps(d.virtual)} r="3" style="fill:#2563eb;stroke:#fff;stroke-width:1" />
                <circle cx=${(i / (PERF_CURVE.length - 1)) * W} cy=${yFps(d.traditional)} r="2.5" style="fill:#9aa1ad;stroke:#fff;stroke-width:1" />`)}
            </svg>
          </div>
          <div class="xlabels">${PERF_CURVE.map((d) => html`<span>${d.x}</span>`)}</div>
        </div>
        <div class="chart-note">1,000,000 行依然保持 60 FPS+</div>
      </div>`
  }
}

/** 单元格内容（null → nothing），避免模板里直接返回 undefined */
function nothingSafe(key: string, row: DataRow): TemplateResult | string {
  switch (key) {
    case 'id': return String(row.id)
    case 'name': return row.name
    case 'dept': return row.dept
    case 'title': return row.title
    case 'date': return row.date
    case 'salary': return row.salary.toLocaleString('zh-CN')
    case 'status': {
      const cls = row.status === '在职' ? 'status-on' : row.status === '试用' ? 'status-trial' : 'status-off'
      return html`<span class="status-tag ${cls}">${row.status}</span>`
    }
    case 'note': return row.note
    default: return ''
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'virtual-scroll-app': VirtualScrollApp
  }
}
