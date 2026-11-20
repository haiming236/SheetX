/**
 * SheetX 第 39 张 · 核心引擎架构可视化
 *
 * 8 个核心模块（Data/Formula/Interaction/Render/Worker/Plugin/Adapter/State）+ 中心引擎，
 * 3×3 网格可视化它们如何共同支撑 Grid 与 Spreadsheet 双模式。
 */
import { LitElement, html, type TemplateResult } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { baseStyles, lightTokens } from './tokens.js'
import { bindPageTheme, type ResolvedTheme } from './theme.js'
import { engineArchStyles } from './engine-arch-styles.js'
import { sxIcon, sxLogo, type IconName } from './icons.js'
import { toast } from './toast.js'
import {
  ARCH_NAV, FEATURES, CORE_MODULES, ECO_ITEMS, APP_ITEMS, TONE_COLOR,
  type ModuleKey, type CoreModule,
} from './engine-arch-data.js'

const STORE_KEY = 'sx:engine-arch-config'

@customElement('engine-arch-app')
export class EngineArchApp extends LitElement {
  static styles = [baseStyles, lightTokens, engineArchStyles]

  @state() private theme: ResolvedTheme = 'light'
  @state() private activeNav = '核心架构'
  @state() private activeModule: ModuleKey | null = null

  private stopTheme: (() => void) | null = null

  constructor() {
    super()
    this.stopTheme = bindPageTheme((resolved) => { this.theme = resolved })
    try {
      const saved = localStorage.getItem(STORE_KEY)
      if (saved) this.activeModule = JSON.parse(saved).activeModule ?? null
    } catch { /* 忽略 */ }
  }

  connectedCallback(): void { super.connectedCallback() }
  disconnectedCallback(): void {
    this.stopTheme?.()
    this.stopTheme = null
  }

  private selectModule(key: ModuleKey): void {
    this.activeModule = this.activeModule === key ? null : key
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ activeModule: this.activeModule })) } catch { /* 忽略 */ }
  }

  private chooseNav(nav: string): void {
    this.activeNav = nav
    if (nav !== '核心架构') toast(`${nav}（本页聚焦核心架构图）`)
  }

  render(): TemplateResult {
    return html`
      <div class="app" data-arch-theme=${this.theme}>
        ${this.renderTop()}
        <div class="hero">
          <h1>SheetX 核心引擎架构</h1>
          <p>基于统一的高性能引擎，支持 Grid 和 Spreadsheet 双模式，提供强大的数据处理、渲染和扩展能力</p>
        </div>
        <div class="shell">
          ${this.renderFeatures()}
          ${this.renderArch()}
          ${this.renderEco()}
        </div>
        ${this.renderApps()}
      </div>`
  }

  private renderTop(): TemplateResult {
    return html`
      <div class="menu-bar">
        <div class="brand">${sxLogo(24)}</div>
        <div class="menu-items">
          ${ARCH_NAV.map((n) => html`<button class="menu-item ${n === this.activeNav ? 'active' : ''}" @click=${() => this.chooseNav(n)}>${n}</button>`)}
        </div>
        <div class="search-box">${sxIcon('search', 14)}<input placeholder="搜索架构文档..." @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') toast(`搜索：${(e.target as HTMLInputElement).value || '核心架构'}`) }} /></div>
        <button class="icon-btn" title="主题" @click=${() => { document.dispatchEvent(new CustomEvent('sx-toggle-theme')); toast('已切换深浅主题') }}>${sxIcon('sun', 15)}</button>
        <span class="avatar"><span class="face">张</span>张</span>
      </div>`
  }

  private renderFeatures(): TemplateResult {
    return html`
      <aside class="card side">
        <div class="card-head star">${sxIcon('star', 14)} 产品特性</div>
        <div class="card-body">
          ${FEATURES.map((f) => html`
            <div class="feat" @click=${() => toast(`${f.title}：${f.desc}`)}>
              <span class="fi" style="background:${f.color}1a;color:${f.color}">${sxIcon(f.icon, 15)}</span>
              <span><div class="ft">${f.title}</div><div class="fd">${f.desc}</div></span>
            </div>`)}
        </div>
      </aside>`
  }

  private renderEco(): TemplateResult {
    return html`
      <aside class="card eco">
        <div class="card-head eco">${sxIcon('rocket', 14)} 扩展生态</div>
        <div class="card-body">
          ${ECO_ITEMS.map((e) => html`
            <div class="eco-item" @click=${() => toast(`${e.title}：${e.desc}`)}>
              <span class="ei">${sxIcon(e.icon, 14)}</span>
              <span><div class="et">${e.title}</div><div class="ed">${e.desc}</div></span>
            </div>`)}
        </div>
      </aside>`
  }

  /** 3×3 架构图：8 模块围绕中心引擎，箭头用绝对定位 div */
  private renderArch(): TemplateResult {
    const detail = CORE_MODULES.find((m) => m.key === this.activeModule)
    return html`
      <section class="arch">
        <div class="arch-head">${sxIcon('settings', 17)} SheetX 核心引擎</div>
        <div class="arch-grid">
          ${CORE_MODULES.map((m) => this.renderModule(m))}
          ${this.renderCore()}
          ${this.renderArrows()}
        </div>
        ${detail ? html`
          <div class="detail" style=${`--dc:${TONE_COLOR[detail.tone]}`}>
            <h4>${sxIcon(detail.icon, 13)} ${detail.cn} · ${detail.en}</h4>
            <p>${detail.detail}</p>
            <code>${detail.api}</code>
          </div>` : html`
          <div class="detail">
            <p style="color:var(--sx-text-hint)">${sxIcon('infoCircle', 12)} 点击任意模块查看职责说明与开放 API</p>
          </div>`}
      </section>`
  }

  private renderModule(m: CoreModule): TemplateResult {
    const color = TONE_COLOR[m.tone]
    return html`
      <div class="mod ${this.activeModule === m.key ? 'active' : ''}" style=${`--mc:${color};grid-row:${m.row + 1};grid-column:${m.col + 1}`} @click=${() => this.selectModule(m.key)}>
        <div class="mod-top">
          <span class="mod-ico" style="background:${color}">${sxIcon(m.icon, 15)}</span>
          <span><div class="mod-name">${m.cn}</div><div class="mod-en">${m.en}</div></span>
        </div>
        <ul class="mod-points">
          ${m.points.map((p) => html`<li>${sxIcon('check', 11)} ${p}</li>`)}
        </ul>
      </div>`
  }

  private renderCore(): TemplateResult {
    return html`
      <div class="core" style="grid-row:2;grid-column:2">
        <span class="ci">${sxIcon('gridView', 20)}</span>
        <span class="ct">SheetX<br />核心引擎</span>
        <span class="cd">统一架构 · 双模式驱动</span>
      </div>`
  }

  /**
   * 连接箭头：网格 3 列间距约 (100%-2*gap)/3。用 left/top 百分比定位在格子间隙。
   * 水平箭头位于每行三列之间（33.3% / 66.7%），垂直箭头位于每列两行之间（约 33.3% / 66.7%）。
   */
  private renderArrows(): TemplateResult {
    const hs = [0, 1, 2].flatMap((row) => [34.2, 67.5].map((left) => ({ row, left })))
    const vs = [0, 1, 2].flatMap((col) => [34.2, 67.5].map((top) => ({ col, top })))
    return html`
      ${hs.map((h) => html`<span class="arrow-h" style=${`left:${h.left}%;top:${16.7 + h.row * 33.3}%`}></span>`)}
      ${vs.map((v) => html`<span class="arrow-v" style=${`left:${v.col * 33.3 + 16.7}%;top:${v.top}%`}></span>`)}
    `
  }

  private renderApps(): TemplateResult {
    return html`
      <section class="apps">
        <div class="apps-title">${sxIcon('box', 14)} 应用支持</div>
        <div class="apps-row">
          ${APP_ITEMS.map((a) => html`
            <div class="app-item" style=${`--ac:${a.color}`} @click=${() => toast(`${a.name}：${a.sub}`)}>
              <span class="ai" style="background:${a.color}">${sxIcon(a.icon as IconName, 15)}</span>
              <span><div class="an">${a.name}</div><div class="as">${a.sub}</div></span>
            </div>`)}
        </div>
      </section>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'engine-arch-app': EngineArchApp
  }
}
