/**
 * SheetX 第 40 张 · 技术选型与底层渲染架构
 *
 * Canvas 2D + DOM 混合渲染：底层 canvas 画网格/数据，上层 DOM 叠加编辑器/下拉/浮层。
 * 三个 tab：混合渲染架构 / 渲染流程（主线程 vs Worker）/ 关键技术点。
 */
import { LitElement, html, nothing, type TemplateResult } from 'lit'
import { customElement, state, query } from 'lit/decorators.js'
import { baseStyles, lightTokens } from './tokens.js'
import { bindPageTheme, type ResolvedTheme } from './theme.js'
import { renderArchStyles } from './render-arch-styles.js'
import { sxIcon, sxLogo, type IconName } from './icons.js'
import { toast } from './toast.js'
import {
  ARCH_NAV, ARCH_TABS, SYNERGY, TABLE_ROWS, DROPDOWN_OPTIONS,
  MAIN_THREAD_STEPS, WORKER_STEPS, TECH_STACK, TECH_LAYERS, BOTTOM_CARDS,
  type ArchTab,
} from './render-arch-data.js'

const STORE_KEY = 'sx:render-arch-config'

@customElement('render-arch-app')
export class RenderArchApp extends LitElement {
  static styles = [baseStyles, lightTokens, renderArchStyles]

  @state() private theme: ResolvedTheme = 'light'
  @state() private activeNav = '渲染架构'
  @state() private tab: ArchTab = '混合渲染架构'
  @state() private dropdownOpen = false
  @state() private selectedOption: string = DROPDOWN_OPTIONS[0]
  @query('.sheet-canvas') private canvas!: HTMLCanvasElement

  private stopTheme: (() => void) | null = null

  constructor() {
    super()
    this.stopTheme = bindPageTheme((resolved) => { this.theme = resolved })
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY) || '{}')
      if (saved.tab) this.tab = saved.tab
      if (saved.selectedOption) this.selectedOption = saved.selectedOption
    } catch { /* 忽略 */ }
  }

  connectedCallback(): void { super.connectedCallback() }
  disconnectedCallback(): void {
    this.stopTheme?.()
    this.stopTheme = null
  }

  firstUpdated(): void { this.drawCanvas() }
  updated(changed: Map<string, unknown>): void {
    if (changed.has('theme') || changed.has('tab') || changed.has('selectedOption')) {
      if (this.tab === '混合渲染架构') this.drawCanvas()
    }
  }

  private save(): void {
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ tab: this.tab, selectedOption: this.selectedOption })) } catch { /* 忽略 */ }
  }

  private setTab(tab: ArchTab): void {
    this.tab = tab
    this.save()
    if (tab === '混合渲染架构') requestAnimationFrame(() => this.drawCanvas())
  }

  private chooseNav(nav: string): void {
    this.activeNav = nav
    if (nav !== '渲染架构') toast(`${nav}（本页聚焦底层渲染架构）`)
  }

  /** 用真实 Canvas 2D 绘制网格与数据 —— 体现「Canvas 负责大规模数据渲染」 */
  private drawCanvas(): void {
    if (!this.canvas) return
    const dpr = window.devicePixelRatio || 1
    const rect = this.canvas.getBoundingClientRect()
    if (rect.width === 0) return
    const W = rect.width, H = rect.height
    this.canvas.width = W * dpr
    this.canvas.height = H * dpr
    const ctx = this.canvas.getContext('2d')!
    ctx.scale(dpr, dpr)

    const cs = getComputedStyle(this.canvas)
    const isDark = this.theme === 'dark'
    const textPrimary = isDark ? '#e5e7eb' : '#1f2937'
    const textHint = isDark ? '#9ca3af' : '#9aa1ad'
    const grid = isDark ? '#3a3f4a' : '#e6e8ed'
    const headerBg = isDark ? '#2a2f3a' : '#f5f6fa'
    const selBg = isDark ? 'rgba(59,130,246,.18)' : 'rgba(59,130,246,.10)'
    void cs

    const COL_W = (W - 30) / 5
    const ROW_H = 34
    const X0 = 30
    const cols = 5
    const rows = 7

    // 背景
    ctx.fillStyle = isDark ? '#1c1f26' : '#ffffff'
    ctx.fillRect(0, 0, W, H)

    // 表头列标 A-E + 行号列背景
    ctx.fillStyle = headerBg
    ctx.fillRect(0, 0, COL_W * cols + X0, ROW_H)
    ctx.fillRect(0, 0, X0, ROW_H * rows)
    ctx.strokeStyle = grid
    ctx.lineWidth = 1
    ctx.font = '10px -apple-system, system-ui, sans-serif'
    ctx.fillStyle = textHint
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (let c = 0; c < cols; c++) {
      const cx = X0 + c * COL_W + COL_W / 2
      ctx.fillText(String.fromCharCode(65 + c), cx, ROW_H / 2)
    }
    for (let r = 0; r < rows - 1; r++) {
      ctx.fillText(String(r + 1), X0 / 2, (r + 1) * ROW_H + ROW_H / 2)
    }

    // 网格线
    ctx.beginPath()
    for (let c = 0; c <= cols; c++) {
      const x = X0 + c * COL_W + 0.5
      ctx.moveTo(x, 0); ctx.lineTo(x, ROW_H * rows)
    }
    for (let r = 0; r <= rows; r++) {
      const y = r * ROW_H + 0.5
      ctx.moveTo(0, y); ctx.lineTo(X0 + cols * COL_W, y)
    }
    ctx.stroke()

    // A1 选中高亮底色（选中框本身用 DOM 覆盖）
    ctx.fillStyle = selBg
    ctx.fillRect(X0, ROW_H, COL_W, ROW_H)

    // 单元格数据（canvas 绘制）
    ctx.textAlign = 'left'
    ctx.font = '600 11px "PingFang SC", system-ui, sans-serif'
    ctx.fillStyle = textPrimary
    const dataRows = TABLE_ROWS
    ctx.fillText('SheetX 表格组件', X0 + 7, ROW_H + ROW_H / 2)
    for (let i = 0; i < dataRows.length; i++) {
      ctx.font = '11px "PingFang SC", system-ui, sans-serif'
      ctx.fillText(dataRows[i].label, X0 + 7, (i + 2) * ROW_H + ROW_H / 2)
    }
    ctx.textAlign = 'left'
    ctx.font = '11px "PingFang SC", system-ui, sans-serif'
    ctx.fillStyle = textHint
    ctx.fillText('100%', X0 + COL_W + 7, ROW_H + ROW_H / 2)
    for (let i = 0; i < dataRows.length; i++) {
      ctx.fillText(dataRows[i].value, X0 + COL_W + 7, (i + 2) * ROW_H + ROW_H / 2)
    }
    // C 列（下拉列）当前值
    ctx.fillStyle = textPrimary
    ctx.fillText(this.selectedOption, X0 + COL_W * 2 + 7, ROW_H + ROW_H / 2)
  }

  render(): TemplateResult {
    return html`
      <div class="app" data-ra-theme=${this.theme}>
        ${this.renderTop()}
        ${this.renderHero()}
        ${this.renderTabs()}
        <div class="shell">
          <div>
            ${this.tab === '混合渲染架构' ? this.renderHybrid() : nothing}
            ${this.tab === '渲染流程' ? this.renderFlow() : nothing}
            ${this.tab === '关键技术点' ? this.renderTech() : nothing}
          </div>
          ${this.renderSynergy()}
        </div>
        ${this.renderBottom()}
      </div>`
  }

  private renderTop(): TemplateResult {
    return html`
      <div class="menu-bar">
        <div class="brand">${sxLogo(24)}</div>
        <div class="menu-items">
          ${ARCH_NAV.map((n) => html`<button class="menu-item ${n === this.activeNav ? 'active' : ''}" @click=${() => this.chooseNav(n)}>${n}</button>`)}
        </div>
        <div class="search-box">${sxIcon('search', 14)}<input placeholder="搜索技术文档..." @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') toast(`搜索：${(e.target as HTMLInputElement).value || 'Canvas 渲染'}`) }} /></div>
        <button class="icon-btn" title="主题" @click=${() => { document.dispatchEvent(new CustomEvent('sx-toggle-theme')); toast('已切换深浅主题') }}>${sxIcon('sun', 15)}</button>
        <span class="avatar"><span class="face">张</span>张</span>
      </div>`
  }

  private renderHero(): TemplateResult {
    return html`
      <div class="hero">
        <span class="hero-ico">${sxIcon('gridView', 24)}</span>
        <div><h1>Canvas 与 DOM 混合渲染细节</h1><p>Canvas 负责大规模数据渲染，DOM 处理交互编辑，协同工作，兼顾性能与体验。</p></div>
      </div>`
  }

  private renderTabs(): TemplateResult {
    const ic: Record<ArchTab, IconName> = { '混合渲染架构': 'gridView', '渲染流程': 'settings', '关键技术点': 'bulb' }
    return html`
      <div class="tabs">
        ${ARCH_TABS.map((t) => html`<button class="tab ${t === this.tab ? 'active' : ''}" @click=${() => this.setTab(t)}>${sxIcon(ic[t], 13)} ${t}</button>`)}
      </div>`
  }

  /** 混合渲染架构：真实 canvas + DOM 浮层 */
  private renderHybrid(): TemplateResult {
    return html`
      <div class="demo-wrap">
        <div class="window">
          <div class="sheet-toolbar">
            <span class="addr">A1 ${sxIcon('chevronDown', 10)}</span>
            <span class="fx">fx</span>
            <span class="formula">SheetX 表格组件</span>
            <button class="tbtn" title="左对齐" @click=${() => toast('左对齐（DOM 工具栏）')}>${sxIcon('alignLeft', 13)}</button>
            <button class="tbtn" title="居中" @click=${() => toast('居中（DOM 工具栏）')}>${sxIcon('alignCenter', 13)}</button>
            <button class="tbtn" title="右对齐" @click=${() => toast('右对齐（DOM 工具栏）')}>${sxIcon('alignRight', 13)}</button>
            <button class="tbtn" title="网格" @click=${() => toast('显示网格（Canvas 绘制）')}>${sxIcon('gridView', 13)}</button>
            <button class="tbtn" title="全屏" @click=${() => toast('全屏（DOM 控制）')}>${sxIcon('fullscreen', 13)}</button>
          </div>
          <div class="sheet-stage">
            <canvas class="sheet-canvas"></canvas>
            <div class="dom-layer">
              <!-- A1 选中框（DOM 浮层，精准覆盖 canvas 中的 A1 单元格） -->
              <span class="cell-marker" style="left:30px;top:34px;width:calc((100% - 30px) / 5);height:34px"></span>
              <!-- C1 下拉触发器 -->
              <button class="addr" style="position:absolute;left:calc(30px + (100% - 30px) * 2 / 5);top:35px;width:calc((100% - 30px) / 5);justify-content:space-between" @click=${() => { this.dropdownOpen = !this.dropdownOpen }}>
                ${this.selectedOption} ${sxIcon('chevronDown', 10)}
              </button>
              <!-- DOM 下拉浮层 -->
              ${this.dropdownOpen ? html`
                <div class="dropdown" style="left:calc(30px + (100% - 30px) * 2 / 5);top:60px">
                  ${DROPDOWN_OPTIONS.map((o) => html`
                    <div class="opt ${o === this.selectedOption ? 'sel' : ''}" @click=${() => { this.selectedOption = o; this.dropdownOpen = false; this.save(); toast(`已选择：${o}`) }}>
                      ${o === this.selectedOption ? sxIcon('check', 12) : html`<span style="width:12px"></span>`} ${o}
                    </div>`)}
                </div>` : nothing}
            </div>
          </div>
        </div>
        <div class="callout canvas"><div class="ct">Canvas 区域</div><div class="cd">网格 / 数据渲染</div></div>
        <div class="callout dom"><div class="ct">DOM 区域</div><div class="cd">编辑器 / 菜单 / 浮层</div></div>
      </div>`
  }

  /** 渲染流程：主线程 vs 后台线程 */
  private renderFlow(): TemplateResult {
    const step = (s: typeof MAIN_THREAD_STEPS[number]) => html`
      <div class="flow-step ${s.side}" style=${`--fc:${s.side === 'main' ? '#2563eb' : '#059669'}`}>
        <span class="fi">${sxIcon(s.icon, 15)}</span>
        <span><div class="ft">${s.title}</div><div class="fd">${s.desc}</div></span>
        <span class="tag">${s.tag}</span>
      </div>`
    return html`
      <div>
        <div class="flow">
          <div class="flow-col main">
            <h3>${sxIcon('laptop', 14)} 主线程（UI Thread）</h3>
            ${MAIN_THREAD_STEPS.map(step)}
          </div>
          <div class="flow-mid">
            <div>⇄</div><div class="chan">DrawCommand · Stats</div><div>⇄</div>
          </div>
          <div class="flow-col worker">
            <h3>${sxIcon('settings', 14)} 后台线程（Worker）</h3>
            ${WORKER_STEPS.map(step)}
          </div>
        </div>
        <div class="flow-note">
          ${sxIcon('infoCircle', 13)} 渲染指令（DrawCommand）是纯数据判别联合，天然可序列化传给 Worker；Worker 完成计算/绘制后通过 revision 版本协议回传统计。
          环境不支持 OffscreenCanvas 或 Worker 时自动降级到主线程 Canvas2DRenderer，行为不变。
        </div>
      </div>`
  }

  /** 关键技术点：技术栈卡片 */
  private renderTech(): TemplateResult {
    const layerLabel = (l: string) => TECH_LAYERS.find((x) => x.key === l)?.label ?? l
    const layerColor = (l: string) => TECH_LAYERS.find((x) => x.key === l)?.color ?? '#6b7280'
    return html`
      <div>
        <div class="tech-summary">${sxIcon('bulb', 13)} SheetX 以 TypeScript 编写、Web Components 封装，Canvas 2D + DOM 混合渲染，Web Worker / OffscreenCanvas 承担后台加速，Vite + pnpm 完成工程构建——各技术各司其职，零运行时第三方依赖。</div>
        <div class="tech-grid">
          ${TECH_STACK.map((t) => html`
            <div class="tech-card" style=${`--tc:${t.color};--lc:${layerColor(t.layer)}`} @click=${() => toast(`${t.name}：${t.desc}`)}>
              <span class="ti" style="background:${t.color}">${sxIcon(t.icon, 17)}</span>
              <span style="flex:1;min-width:0">
                <div class="tn">${t.name}</div>
                <div class="tc">${t.category}</div>
                <div class="td">${t.desc}</div>
              </span>
              <span class="layer-tag">${layerLabel(t.layer)}</span>
            </div>`)}
        </div>
      </div>`
  }

  private renderSynergy(): TemplateResult {
    return html`
      <aside class="side-card">
        <div class="side-head">${sxIcon('link', 14)} 协同机制</div>
        <div class="syn-list">
          ${SYNERGY.map((s, i) => html`
            <div class="syn">
              <span class="sn">${i + 1}</span>
              <span class="si">${sxIcon(s.icon, 14)}</span>
              <span><div class="st">${s.title}</div><div class="sd">${s.desc}</div></span>
            </div>`)}
        </div>
      </aside>`
  }

  private renderBottom(): TemplateResult {
    const s = BOTTOM_CARDS.strategy, p = BOTTOM_CARDS.perf, sc = BOTTOM_CARDS.scene, h = BOTTOM_CARDS.highlight
    const li = (items: readonly string[]) => items.map((t) => html`<li>${sxIcon('checkCircle', 11)} ${t}</li>`)
    return html`
      <div class="bottom-grid">
        <div class="bcard" style=${`--bc:${s.color}`}>
          <h4>${sxIcon(s.icon, 14)} ${s.title}</h4>
          <ul>${li(s.items)}</ul>
        </div>
        <div class="bcard" style=${`--bc:${p.color}`}>
          <h4>${sxIcon(p.icon, 14)} ${p.title}</h4>
          <ul>${li(p.items)}</ul>
          <div class="fps"><span class="num">60</span><span class="unit">FPS · 流畅运行</span></div>
        </div>
        <div class="bcard" style=${`--bc:${sc.color}`}>
          <h4>${sxIcon(sc.icon, 14)} ${sc.title}</h4>
          <ul>${li(sc.items)}</ul>
          <div class="mini-bars">${[14, 22, 28, 34].map((hh) => html`<i style="height:${hh}px"></i>`)}</div>
        </div>
        <div class="bcard" style=${`--bc:${h.color}`}>
          <h4>${sxIcon(h.icon, 14)} ${h.title}</h4>
          <ul>${li(h.items)}</ul>
        </div>
      </div>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'render-arch-app': RenderArchApp
  }
}
