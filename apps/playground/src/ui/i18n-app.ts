/**
 * SheetX 第 30 张 · 国际化与多语言配置
 *
 * 核心立场：SheetX 自带 i18n（语言包 / 格式本地化 / RTL 布局），不依赖宿主 UI 框架。
 * 8 种语言切换实时改变全部 UI 文案、表格标题与列头；RTL 真正镜像布局；格式配置驱动预览。
 */
import { LitElement, html, nothing, type TemplateResult } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { baseStyles, lightTokens } from './tokens.js'
import { bindPageTheme, type ResolvedTheme } from './theme.js'
import { i18nStyles } from './i18n-styles.js'
import { sxIcon, sxLogo } from './icons.js'
import { toast } from './toast.js'
import {
  LANGS, DATE_FORMATS, TIME_FORMATS, NUMBER_FORMATS, CURRENCY_FORMATS, RIGHT_TABS,
  PREVIEW_CARDS, I18N_CONTRACT, DEFAULT_CONFIG,
  type RightTab, type FullConfig, type PreviewCard,
} from './i18n-data.js'

const STORE_KEY = 'sx:i18n-config'
const MENU_KEYS = ['file', 'home', 'insert', 'data', 'formula', 'view', 'settings'] as const

@customElement('i18n-app')
export class I18nApp extends LitElement {
  static styles = [baseStyles, lightTokens, i18nStyles]

  @state() private theme: ResolvedTheme = 'light'
  @state() private cfg: FullConfig = this.load()
  @state() private rightTab: RightTab = '语言设置'
  @state() private showLangMenu = false
  @state() private showMoreLangs = false
  @state() private activeMenu = '开始'

  private stopTheme: (() => void) | null = null

  constructor() {
    super()
    this.stopTheme = bindPageTheme((resolved) => { this.theme = resolved })
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

  private patch(key: keyof FullConfig, value: unknown): void {
    this.cfg = { ...this.cfg, [key]: value }
    this.save()
  }

  private get currentLang() {
    return LANGS.find((l) => l.code === this.cfg.lang) ?? LANGS[0]!
  }

  private get msg() {
    return this.currentLang.msg
  }

  private setLang(code: string): void {
    const next = LANGS.find((l) => l.code === code)!
    this.patch('lang', code)
    this.patch('rtl', next.dir === 'rtl')
    this.showLangMenu = false
    toast(`界面语言已切换：${next.label}（SheetX 内置语言包）`)
  }

  private toggleRtl(): void {
    this.patch('rtl', !this.cfg.rtl)
    toast(this.cfg.rtl ? 'RTL 已开启：布局已从右向左镜像' : 'RTL 已关闭：恢复从左向右布局')
  }

  private updateTerm(index: number, translated: string): void {
    const terms = this.cfg.terms.map((t, i) => i === index ? { ...t, translated } : t)
    this.patch('terms', terms)
  }

  /* ================= 渲染 ================= */

  private renderTop(): TemplateResult {
    const m = this.msg
    return html`
      <div class="menu-bar">
        <div class="brand">${sxLogo(22)}</div>
        <nav class="menu-list">
          ${MENU_KEYS.map((k) => html`
            <button class="menu-item ${this.activeMenu === k ? 'active' : ''}" @click=${() => { this.activeMenu = k }}>${m[k]}</button>`)}
        </nav>
        <div class="search-box">${sxIcon('search', 14)}<input placeholder=${m.search} /></div>
        <button class="icon-btn" title="帮助" @click=${() => toast('SheetX 自带 i18n，不依赖宿主 UI 框架')}>${sxIcon('help', 16)}</button>
        <button class="icon-btn" title="设置" @click=${() => { this.rightTab = '语言设置' }}>${sxIcon('settings', 16)}</button>
        <div class="user-chip"><span class="avatar">张</span><span>张三</span>${sxIcon('chevronDown', 11)}</div>
        <div class="lang-btn">
          <button class="icon-btn" title="语言切换" @click=${() => { this.showLangMenu = !this.showLangMenu }}>
            ${sxIcon('globe', 16)}
          </button>
          ${this.showLangMenu ? html`
            <div class="lang-popover">
              <div class="title">${sxIcon('globe', 13)} 语言切换</div>
              ${LANGS.slice(0, 7).map((l) => html`
                <button class="lang-option ${l.code === this.cfg.lang ? 'on' : ''}" @click=${() => this.setLang(l.code)}>
                  <span>${l.flag}</span><span>${l.label}</span>
                  ${l.code === this.cfg.lang ? html`<span class="check">${sxIcon('check', 12)}</span>` : ''}
                </button>`)}
              <button class="lang-option more" @click=${() => { this.showMoreLangs = !this.showMoreLangs }}>
                ${sxIcon('globe', 13)} 更多语言… ${sxIcon('chevronDown', 11)}
              </button>
              ${this.showMoreLangs ? LANGS.slice(7).map((l) => html`
                <button class="lang-option ${l.code === this.cfg.lang ? 'on' : ''}" @click=${() => this.setLang(l.code)}>
                  <span>${l.flag}</span><span>${l.label} (RTL)</span>
                  ${l.code === this.cfg.lang ? html`<span class="check">${sxIcon('check', 12)}</span>` : ''}
                </button>`) : nothing}
            </div>` : nothing}
        </div>
      </div>`
  }

  private renderToolbar(): TemplateResult {
    const tb = (icon: Parameters<typeof sxIcon>[0], title: string): TemplateResult => html`
      <button class="tool-btn" title=${title}>${sxIcon(icon, 15)}</button>`
    return html`
      <div class="toolbar">
        <div class="tool-group">${tb('undo', 'Undo')}${tb('redo', 'Redo')}${tb('print', 'Print')}</div>
        <div class="tool-group">
          <select class="mini-select fmt"><option>微软雅黑</option><option>PingFang SC</option><option>Arial</option></select>
          <select class="mini-select size"><option>12</option><option>14</option></select>
          ${tb('bold', 'Bold')}${tb('italic', 'Italic')}${tb('underline', 'Underline')}
          <button class="tool-btn color-cell" style="--mark:#e5a23c">${sxIcon('fontColor', 15)}</button>
          <button class="tool-btn color-cell" style="--mark:#22a06b">${sxIcon('fill', 15)}</button>
        </div>
        <div class="tool-group">
          ${(['alignLeft', 'alignCenter', 'alignRight', 'alignJustify'] as const).map((ic) => tb(ic, 'Align'))}
          <select class="mini-select merge"><option>合并居中</option><option>合并单元格</option></select>
          <select class="mini-select fmt"><option>常规</option><option>货币</option></select>
          ${tb('percent', 'Percent')}${tb('decimalMinus', 'Decimal')}${tb('gridView', 'Grid')}${tb('filter', 'Filter')}
          <button class="tool-btn">更多</button>
        </div>
      </div>`
  }

  private renderFormula(): TemplateResult {
    return html`
      <div class="formula-bar">
        <div class="addr">A1 ${sxIcon('chevronDown', 11)}</div>
        <span class="fx">fx</span>
        <input class="formula-input" .value=${this.msg.reportTitle} readonly />
      </div>`
  }

  private renderGrid(): TemplateResult {
    const m = this.msg
    const rows = [
      ['笔记本电脑', 1250, 1892500], ['平板电脑', 980, 784000], ['智能手机', 1860, 2976000],
      ['显示器', 720, 576000], ['路由器', 640, 416000], ['耳机', 920, 552000],
    ]
    return html`
      <div class="grid-wrap">
        <div class="report-title">${sxIcon('chartBar', 18)} ${m.reportTitle}</div>
        <table class="data-table">
          <thead><tr><th style="width:30%">${m.colProduct}</th><th style="width:22%">${m.colQty}</th><th style="width:24%">${m.colAmount}</th><th style="width:24%">${m.trend}</th></tr></thead>
          <tbody>
            ${rows.map(([name, qty, amount], i) => html`
              <tr><td>${name}</td><td>${Number(qty).toLocaleString('en-US')}</td><td>¥ ${Number(amount).toLocaleString('en-US')}</td>
              <td style="color:${i % 3 === 2 ? 'var(--sx-success)' : 'var(--sx-text-hint)'}">${i % 3 === 2 ? '▲' : '—'}</td></tr>`)}
            <tr class="total"><td>${m.total}</td><td>6,370</td><td>¥ 7,196,500</td><td>—</td></tr>
          </tbody>
        </table>
      </div>`
  }

  private renderCharts(): TemplateResult {
    const bars = [920, 1280, 1540, 1380, 1710, 1892]
    const labels = ['1月', '2月', '3月', '4月', '5月', '6月']
    const stops = ['#4f7cff 0% 32%', '#f5a623 32% 50%', '#2fbf8f 50% 78%', '#9b7bf0 78% 100%'].join(', ')
    return html`
      <div class="charts-row">
        <div class="chart-card">
          <h3>${this.msg.trend}</h3>
          <div class="bar-wrap">
            ${bars.map((v, i) => html`
              <div class="bar-col"><div class="bar" style=${`height:${(v / 2000) * 100}%`}></div><span class="bar-label">${labels[i]}</span></div>`)}
          </div>
        </div>
        <div class="chart-card">
          <h3>${this.msg.pie}</h3>
          <div class="pie-wrap">
            <div class="pie-donut" style=${`background:conic-gradient(${stops})`}><span class="pie-hole"></span></div>
            <div class="pie-legend">
              ${[['笔记本', '32%', '#4f7cff'], ['平板', '18%', '#f5a623'], ['手机', '28%', '#2fbf8f'], ['其他', '22%', '#9b7bf0']].map(([n, p, c]) => html`
                <div class="legend-row"><span class="legend-dot" style=${`background:${c}`}></span><span>${n}</span><span class="pct">${p}</span></div>`)}
            </div>
          </div>
        </div>
      </div>`
  }

  private renderRightLang(): TemplateResult {
    const m = this.msg
    return html`
      <div>
        <span class="field-label">${m.langSelect}</span>
        <select class="full-select" .value=${this.cfg.lang} @change=${(e: Event) => this.setLang((e.target as HTMLSelectElement).value)}>
          ${LANGS.map((l) => html`<option value=${l.code}>${l.flag} ${l.label}</option>`)}
        </select>
        <div class="hint">${m.langHint}</div>
      </div>
      <div>
        <span class="field-label">${m.regionFormat}</span>
        <div class="field-row"><label>${m.dateFormat}</label>
          <select class="select" .value=${this.cfg.dateFormat} @change=${(e: Event) => this.patch('dateFormat', (e.target as HTMLSelectElement).value)}>
            ${DATE_FORMATS.map((f) => html`<option>${f}</option>`)}
          </select>
        </div>
        <div class="field-row"><label>${m.timeFormat}</label>
          <select class="select" .value=${this.cfg.timeFormat} @change=${(e: Event) => this.patch('timeFormat', (e.target as HTMLSelectElement).value)}>
            ${TIME_FORMATS.map((f) => html`<option>${f}</option>`)}
          </select>
        </div>
        <div class="field-row"><label>${m.numberFormat}</label>
          <select class="select" .value=${this.cfg.numberFormat} @change=${(e: Event) => this.patch('numberFormat', (e.target as HTMLSelectElement).value)}>
            ${NUMBER_FORMATS.map((f) => html`<option>${f}</option>`)}
          </select>
        </div>
        <div class="field-row"><label>${m.currencyFormat}</label>
          <select class="select" .value=${this.cfg.currencyFormat} @change=${(e: Event) => this.patch('currencyFormat', (e.target as HTMLSelectElement).value)}>
            ${CURRENCY_FORMATS.map((f) => html`<option>${f}</option>`)}
          </select>
        </div>
      </div>
      <div class="switch-row">
        <span>${m.rtl}</span>
        <button class="switch ${this.cfg.rtl ? 'on' : ''}" @click=${() => this.toggleRtl()}><span class="knob"></span></button>
      </div>
      <div class="hint">${m.rtlHint}</div>
      <div class="tip"><span class="ic">${sxIcon('infoCircle', 15)}</span><span>${m.tip}</span></div>`
  }

  private renderRightFormat(): TemplateResult {
    return html`
      <div>
        <span class="field-label">当前语言区域：${this.currentLang.flag} ${this.currentLang.label}</span>
        <div class="field-row"><label>日期</label><span style="font-size:12px;color:var(--sx-brand);font-weight:600">${this.cfg.dateFormat}</span></div>
        <div class="field-row"><label>时间</label><span style="font-size:12px;color:var(--sx-brand);font-weight:600">${this.cfg.timeFormat}</span></div>
        <div class="field-row"><label>数字</label><span style="font-size:12px;color:var(--sx-brand);font-weight:600">${this.cfg.numberFormat}</span></div>
        <div class="field-row"><label>货币</label><span style="font-size:12px;color:var(--sx-brand);font-weight:600">${this.cfg.currencyFormat}</span></div>
      </div>
      <div class="tip"><span class="ic">${sxIcon('infoCircle', 15)}</span><span>格式由 SheetX 内置 <b>Intl</b> 本地化层驱动，同一份数据在不同 locale 下自动呈现对应格式，无需宿主参与。</span></div>
      <div>
        <span class="field-label">格式化 API</span>
        <div class="doc-box">sheet.i18n.formatDate(d)      // ${this.cfg.dateFormat}
sheet.i18n.formatNumber(1234.56) // ${this.cfg.numberFormat}
sheet.i18n.formatCurrency(1234.56) // ${this.cfg.currencyFormat}</div>
      </div>`
  }

  private renderRightTranslate(): TemplateResult {
    return html`
      <div>
        <span class="field-label">业务词条翻译（可覆盖内置语言包）</span>
        <div class="term-row" style="font-weight:600;color:var(--sx-text-hint)"><span>源文本</span><span>译文（${this.currentLang.label}）</span></div>
        ${this.cfg.terms.map((t, i) => html`
          <div class="term-row"><span>${t.source}</span><input .value=${t.translated} @change=${(e: Event) => this.updateTerm(i, (e.target as HTMLInputElement).value)} /></div>`)}
      </div>
      <div class="tip"><span class="ic">${sxIcon('infoCircle', 15)}</span><span><b>registerTranslations()</b> 可注入业务术语；缺失词条自动回退到 fallback 语言，不依赖宿主 UI 框架。</span></div>`
  }

  private renderRightRtl(): TemplateResult {
    return html`
      <div class="switch-row">
        <span>从右向左布局（RTL）</span>
        <button class="switch ${this.cfg.rtl ? 'on' : ''}" @click=${() => this.toggleRtl()}><span class="knob"></span></button>
      </div>
      <div>
        <span class="field-label">布局方向实时预览</span>
        <div class="rtl-demo ${this.cfg.rtl ? 'rtl' : 'ltr'}">
          <span class="box">工具栏</span><span class="box">画布</span><span class="box">属性面板</span>
        </div>
        <div class="hint">当前：${this.cfg.rtl ? 'RTL（右→左）' : 'LTR（左→右）'} · 由 SheetX 根容器 dir 属性驱动</div>
      </div>
      <div class="tip"><span class="ic">${sxIcon('infoCircle', 15)}</span><span>开启后整个工作台（菜单 / 工具栏 / 表格对齐 / 面板顺序）自动镜像，支持阿拉伯语、希伯来语等 RTL 语言。</span></div>
      <div>
        <span class="field-label">i18n 接入契约</span>
        <div class="doc-box">${I18N_CONTRACT}</div>
      </div>`
  }

  private renderRight(): TemplateResult {
    const body =
      this.rightTab === '格式设置' ? this.renderRightFormat() :
      this.rightTab === '文本翻译' ? this.renderRightTranslate() :
      this.rightTab === 'RTL 支持' ? this.renderRightRtl() : this.renderRightLang()
    return html`
      <aside class="right">
        <div class="right-head">${sxIcon('globe', 17)} 国际化设置
          <button class="icon-btn close" title="收起" @click=${() => toast('设置面板保留在右侧')}>${sxIcon('close', 14)}</button>
        </div>
        <div class="right-tabs" role="tablist">
          ${RIGHT_TABS.map((t) => html`
            <button class="right-tab ${this.rightTab === t ? 'active' : ''}" @click=${() => { this.rightTab = t }}>${t}</button>`)}
        </div>
        <div class="right-body">${body}</div>
      </aside>`
  }

  private renderPreview(): TemplateResult {
    const cards: PreviewCard[] = PREVIEW_CARDS.map((c) => c.code === this.cfg.lang
      ? { ...c, date: this.cfg.dateFormat, time: this.cfg.timeFormat, number: this.cfg.numberFormat, currency: this.cfg.currencyFormat }
      : c)
    return html`
      <div class="preview-panel">
        <div class="preview-head">${sxIcon('chartBar', 15)} ${this.msg.preview}</div>
        <div class="preview-grid">
          ${cards.map((c) => html`
            <div class="preview-card ${c.code === this.cfg.lang ? 'active' : ''}">
              <div class="lang"><span>${c.flag}</span><span>${c.label}</span></div>
              <div class="line"><span class="k">日期</span><span class="v">${c.date}</span></div>
              <div class="line"><span class="k">时间</span><span class="v">${c.time}</span></div>
              <div class="line"><span class="k">数字</span><span class="v">${c.number}</span></div>
              <div class="line"><span class="k">货币</span><span class="v">${c.currency}</span></div>
            </div>`)}
        </div>
      </div>`
  }

  render(): TemplateResult {
    return html`
      <div class="app" dir=${this.currentLang.dir === 'rtl' && this.cfg.rtl ? 'rtl' : 'ltr'} data-i18n-theme=${this.theme}>
        ${this.renderTop()}
        ${this.renderToolbar()}
        ${this.renderFormula()}
        <div class="workspace">
          <div class="sheet-area">${this.renderGrid()}${this.renderCharts()}</div>
          ${this.renderRight()}
        </div>
        ${this.renderPreview()}
      </div>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'i18n-app': I18nApp
  }
}
