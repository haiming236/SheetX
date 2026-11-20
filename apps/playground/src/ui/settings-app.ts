/**
 * SheetX 第 10 张 · 主题与个性化设置
 *
 * 展示：浅色/深色/跟随系统主题、6 种表格配色、字体/字号/行高、
 * 界面布局、功能面板复选框、其他设置开关；右侧预览窗口实时响应全部设置项。
 */
import { LitElement, html, nothing, type TemplateResult } from 'lit'
import { customElement } from 'lit/decorators/custom-element.js'
import { state } from 'lit/decorators/state.js'
import { sxIcon, sxLogo } from './icons.js'
import { lightTokens, baseStyles } from './tokens.js'
import { getThemeMode, setThemeMode } from './theme.js'
import { settingsStyles } from './settings-styles.js'
import {
  THEME_OPTIONS, PALETTE_OPTIONS, LAYOUT_OPTIONS, PANEL_OPTIONS, MISC_OPTIONS,
  FONT_FAMILIES, FONT_SIZES, LINE_HEIGHTS, SETTINGS_NAV,
  PREVIEW_COLUMNS, PREVIEW_ROWS, DEFAULT_PANELS, DEFAULT_MISC,
  type ThemeMode,
} from './settings-data.js'
import { toast } from './toast.js'

@customElement('settings-app')
export class SettingsApp extends LitElement {
  static styles = [baseStyles, lightTokens, settingsStyles]

  @state() private activeNav = 'appearance'
  @state() private theme: ThemeMode = 'light'
  @state() private palette = 'default'
  @state() private layout = 'classic'
  @state() private panels: Record<string, boolean> = { ...DEFAULT_PANELS }
  @state() private misc: Record<string, boolean> = { ...DEFAULT_MISC }
  @state() private fontFamily = '思源黑体'
  @state() private fontSize = '12'
  @state() private lineHeight = '28px'
  @state() private openDrop: string | null = null
  @state() private toast = ''
  @state() private systemDark = false

  private media: MediaQueryList | null = null
  private toastTimer: ReturnType<typeof setTimeout> | null = null

  connectedCallback(): void {
    super.connectedCallback()
    this.media = window.matchMedia('(prefers-color-scheme: dark)')
    this.systemDark = this.media.matches
    this.media.addEventListener('change', this.onSystemChange)
    this.restore()
  }

  /** 设置持久化键（刷新/切页后保留用户的主题、配色与开关） */
  private static readonly STORE_KEY = 'sx:settings'

  private restore(): void {
    try {
      const saved = JSON.parse(localStorage.getItem(SettingsApp.STORE_KEY) ?? 'null') as
        | Partial<{
            theme: ThemeMode
            palette: string
            layout: string
            fontFamily: string
            fontSize: string
            lineHeight: string
            panels: Record<string, boolean>
            misc: Record<string, boolean>
          }>
        | null
      if (!saved) return
      this.theme = saved.theme ?? this.theme
      this.palette = saved.palette ?? this.palette
      this.layout = saved.layout ?? this.layout
      this.fontFamily = saved.fontFamily ?? this.fontFamily
      this.fontSize = saved.fontSize ?? this.fontSize
      this.lineHeight = saved.lineHeight ?? this.lineHeight
      this.panels = { ...this.panels, ...(saved.panels ?? {}) }
      this.misc = { ...this.misc, ...(saved.misc ?? {}) }
      // 主题以全局存储为准（顶部导航/各页按钮都写同一个 key）
      this.theme = getThemeMode()
    } catch {
      /* 存储不可用（隐私模式）时使用默认值 */
    }
  }

  protected updated(): void {
    try {
      localStorage.setItem(
        SettingsApp.STORE_KEY,
        JSON.stringify({
          theme: this.theme,
          palette: this.palette,
          layout: this.layout,
          fontFamily: this.fontFamily,
          fontSize: this.fontSize,
          lineHeight: this.lineHeight,
          panels: this.panels,
          misc: this.misc,
        }),
      )
    } catch {
      /* 忽略写入失败 */
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    this.media?.removeEventListener('change', this.onSystemChange)
    if (this.toastTimer) clearTimeout(this.toastTimer)
  }

  private onSystemChange = (e: MediaQueryListEvent): void => {
    this.systemDark = e.matches
  }

  private get previewDark(): boolean {
    return this.theme === 'dark' || (this.theme === 'system' && this.systemDark)
  }

  private get paletteOption() {
    return PALETTE_OPTIONS.find((p) => p.key === this.palette) ?? PALETTE_OPTIONS[0]
  }

  /* ---------------- 交互 ---------------- */

  private closeDrops = (): void => {
    this.openDrop = null
  }

  private toggleDrop = (id: string, e: Event): void => {
    e.stopPropagation()
    this.openDrop = this.openDrop === id ? null : id
  }

  private showToast(msg: string): void {
    this.toast = msg
    if (this.toastTimer) clearTimeout(this.toastTimer)
    this.toastTimer = setTimeout(() => { this.toast = '' }, 2200)
  }

  private saveSettings = (e: Event): void => {
    e.stopPropagation()
    this.showToast('设置已保存')
  }

  private resetSettings = (e: Event): void => {
    e.stopPropagation()
    this.theme = 'light'
    this.palette = 'default'
    this.layout = 'classic'
    this.panels = { ...DEFAULT_PANELS }
    this.misc = { ...DEFAULT_MISC }
    this.fontFamily = '思源黑体'
    this.fontSize = '12'
    this.lineHeight = '28px'
    this.showToast('已恢复默认设置')
  }

  private setTheme = (key: ThemeMode): void => {
    this.theme = key
    // 全局生效：所有页面（含 shadow DOM 内的变量）同时换肤，并持久化
    setThemeMode(key)
  }

  private togglePanel = (key: string): void => {
    this.panels = { ...this.panels, [key]: !this.panels[key] }
  }

  private toggleMisc = (key: string): void => {
    this.misc = { ...this.misc, [key]: !this.misc[key] }
  }

  /* ---------------- 渲染 ---------------- */

  render(): TemplateResult {
    return html`
      <div class="app" @click=${this.closeDrops}>
        ${this.renderTopbar()}
        <div class="layout">
          ${this.renderSidenav()}
          <div class="main">
            ${this.activeNav === 'appearance' ? this.renderContent() : this.renderPlaceholder()}
            ${this.renderAside()}
          </div>
        </div>
        ${this.toast ? html`<div class="toast">${this.toast}</div>` : nothing}
      </div>
    `
  }

  private renderTopbar(): TemplateResult {
    return html`
      <header class="topbar">
        <span class="brand">${sxLogo()}</span>
        <div class="topbar-right">
          <label class="search">
            ${sxIcon('search', 15)}
            <input placeholder="搜索或输入..." @click=${(e: Event) => e.stopPropagation()} />
          </label>
          <span class="avatar">JD</span>
        </div>
      </header>
    `
  }

  private renderSidenav(): TemplateResult {
    return html`
      <nav class="sidenav">
        <button class="back-link" title="返回工作台" @click=${() => { location.hash = '#home' }}>
          ${sxIcon('chevronLeft', 15)}
          <span>返回工作台</span>
        </button>
        ${SETTINGS_NAV.map((item) => html`
          <button
            class="nav-item ${this.activeNav === item.key ? 'active' : ''}"
            @click=${() => { this.activeNav = item.key }}
          >
            ${sxIcon(item.icon, 16)}
            <span>${item.label}</span>
          </button>
        `)}
      </nav>
    `
  }

  private renderContent(): TemplateResult {
    return html`
      <section class="content">
        <h1>外观主题</h1>
        <p class="page-sub">选择您喜欢的主题和界面风格，打造舒适的使用体验</p>
        ${this.renderThemeCards()}
        ${this.renderPalettes()}
        ${this.renderDuo()}
        <div class="actions">
          <button class="btn btn-primary" @click=${this.saveSettings}>保存设置</button>
          <button class="btn btn-ghost" @click=${this.resetSettings}>恢复默认</button>
        </div>
      </section>
    `
  }

  private renderThemeCards(): TemplateResult {
    return html`
      <section>
        <div class="theme-row">
          ${THEME_OPTIONS.map((t) => {
            const on = this.theme === t.key
            return html`
              <button class="theme-card ${on ? 'on' : ''}" @click=${() => this.setTheme(t.key)}>
                <span class="thumb ${t.key === 'light' ? 'thumb-light' : t.key === 'dark' ? 'thumb-dark' : 'thumb-system'}">
                  <span class="thumb-logo"></span>
                  <span class="thumb-grid">
                    ${Array.from({ length: 12 }, (_, i) => html`<span class="${i < 4 ? 'h' : ''}"></span>`)}
                  </span>
                </span>
                <span class="theme-label">
                  <span class="radio ${on ? 'on' : ''}">${on ? html`<span class="dot"></span>` : ''}</span>
                  ${t.label}
                </span>
              </button>
            `
          })}
        </div>
      </section>
    `
  }

  private renderPalettes(): TemplateResult {
    return html`
      <section>
        <h2>表格配色</h2>
        <p class="sec-sub">选择表格的配色方案，让数据更清晰易读</p>
        <div class="palette-row">
          ${PALETTE_OPTIONS.map((p) => {
            const on = this.palette === p.key
            return html`
              <button class="swatch ${on ? 'on' : ''}" @click=${() => { this.palette = p.key }}>
                <span class="swatch-grid">
                  <span style="background:${p.header}"></span><span style="background:${p.header}"></span><span style="background:${p.header}"></span>
                  <span style="background:${p.cellB}"></span><span style="background:${p.cellB}"></span><span style="background:${p.cellB}"></span>
                  <span style="background:var(--sx-bg-surface)"></span><span style="background:var(--sx-bg-surface)"></span><span style="background:var(--sx-bg-surface)"></span>
                </span>
                <span class="swatch-label">${p.label}</span>
                ${on ? html`<span class="swatch-badge">${sxIcon('check', 10)}</span>` : ''}
              </button>
            `
          })}
        </div>
      </section>
    `
  }

  private renderDuo(): TemplateResult {
    return html`
      <div class="duo">
        <section class="layout-sec">
          <h2>界面布局</h2>
          <p class="sec-sub">自定义工具栏和面板布局，满足不同使用习惯</p>
          <div class="layout-row">
            ${LAYOUT_OPTIONS.map((l) => {
              const on = this.layout === l.key
              return html`
                <button class="layout-card ${on ? 'on' : ''}" @click=${() => { this.layout = l.key }}>
                  <span class="layout-thumb ${l.key === 'compact' ? 'layout-compact' : ''}">
                    <span class="lt-top"><i></i><i></i><i></i></span>
                    <span class="lt-body">
                      ${l.key === 'classic' ? html`<span class="lt-side"></span>` : ''}
                      <span class="lt-main"><span></span><span></span><span></span><span></span></span>
                    </span>
                  </span>
                  <span class="layout-label">
                    <span class="radio ${on ? 'on' : ''}">${on ? html`<span class="dot"></span>` : ''}</span>
                    ${l.label}
                  </span>
                </button>
              `
            })}
          </div>
        </section>

        <section class="panel-sec">
          <h2>功能面板</h2>
          <p class="sec-sub">选择显示的功能面板，或自定义面板顺序</p>
          <div class="check-list">
            ${PANEL_OPTIONS.map((p) => {
              const on = this.panels[p.key]
              return html`
                <button class="check-item" @click=${() => this.togglePanel(p.key)}>
                  <span class="checkbox ${on ? 'on' : ''}">${on ? sxIcon('check', 11) : ''}</span>
                  <span>${p.label}</span>
                </button>
              `
            })}
          </div>
        </section>
      </div>
    `
  }

  private renderAside(): TemplateResult {
    return html`
      <aside class="aside">
        ${this.renderPreview()}
        ${this.renderFontSettings()}
        ${this.renderMiscSettings()}
      </aside>
    `
  }

  /** 预览窗口：响应主题 / 配色 / 字体 / 字号 / 行高 / 网格线 / 行列号 / 高亮行列 */
  private renderPreview(): TemplateResult {
    const p = this.paletteOption
    const dark = this.previewDark
    const vars: string[] = [`--pv-header:${p.header}`]
    if (!dark) {
      vars.push(`--pv-cell-alt:${p.cellB}`, `--pv-border-strong:${p.border}`)
    }
    const cls = [
      'preview',
      dark ? 'dark' : '',
      this.misc.gridlines ? '' : 'no-grid',
      this.misc.smooth ? 'smooth' : '',
    ].filter(Boolean).join(' ')

    return html`
      <div class="${cls}" style="${vars.join(';')}; font-family:'${this.fontFamily}','PingFang SC',sans-serif; font-size:${this.fontSize}px; line-height:${this.lineHeight}">
        <div class="pv-chrome">
          <span class="pv-brand">${sxLogo()}</span>
          <span class="pv-menu">
            ${['文件', '开始', '插入', '数据', '视图', '设置'].map((m, i) => html`
              <span class="${i === 1 ? 'on' : ''}">${m}</span>
            `)}
          </span>
        </div>
        <div class="pv-toolbar">
          <button class="pv-tool" title="撤销" @click=${() => toast('撤销')} >${sxIcon('undo', 14)}</button>
          <button class="pv-tool" title="重做" @click=${() => toast('重做')} >${sxIcon('redo', 14)}</button>
          <button class="pv-tool" title="格式刷" @click=${() => toast('格式刷')} >${sxIcon('format', 14)}</button>
          <span class="pv-sep"></span>
          <span class="pv-select"><span>思源黑体</span><span class="caret">${sxIcon('chevronDown', 11)}</span></span>
          <span class="pv-select"><span>12</span><span class="caret">${sxIcon('chevronDown', 11)}</span></span>
          <span class="pv-sep"></span>
          <button class="pv-tool" @click=${() => toast('加粗')}><b>B</b></button>
          <button class="pv-tool" @click=${() => toast('斜体')}><i>I</i></button>
          <button class="pv-tool" @click=${() => toast('下划线')}><u>U</u></button>
          <button class="pv-tool"><span class="fc">A</span></button>
          <span class="pv-sep"></span>
          <button class="pv-tool" @click=${() => toast('左对齐')}>${sxIcon('alignLeft', 14)}</button>
          <button class="pv-tool" @click=${() => toast('居中')}>${sxIcon('alignCenter', 14)}</button>
          <button class="pv-tool" @click=${() => toast('右对齐')}>${sxIcon('alignRight', 14)}</button>
          <button class="pv-tool" @click=${() => toast('两端对齐')}>${sxIcon('alignJustify', 14)}</button>
          <span class="pv-sep"></span>
          <button class="pv-tool" @click=${() => toast('更多')}>${sxIcon('menu', 14)}</button>
        </div>
        <div class="pv-formula">
          <span class="pv-fx">fx</span>
          <span class="pv-formula-input"></span>
        </div>
        <div class="pv-body">
          <table class="pv-table">
            ${this.misc.coords ? html`
              <colgroup><col style="width:30px" />${PREVIEW_COLUMNS.map(() => html`<col />`)}</colgroup>
              <thead>
                <tr>
                  <th></th>
                  ${['A', 'B', 'C', 'D'].map((c) => html`<th>${c}</th>`)}
                </tr>
              </thead>
            ` : ''}
            <tbody>
              <tr>
                ${this.misc.coords ? html`<th class="pv-rowhead">1</th>` : ''}
                ${PREVIEW_COLUMNS.map((name, ci) => html`
                  <td class="head-cell ${this.hlClass(0, ci)}" style="text-align:center">${name}</td>
                `)}
              </tr>
              ${PREVIEW_ROWS.map((row, ri) => html`
                <tr>
                  ${this.misc.coords ? html`<th class="pv-rowhead">${ri + 2}</th>` : ''}
                  ${row.map((val, ci) => html`
                    <td class="${ci > 0 ? 'num' : ''} ${this.hlClass(ri + 1, ci)}">${val}</td>
                  `)}
                </tr>
              `)}
            </tbody>
          </table>
        </div>
        <div class="pv-tabs">
          <button class="pv-tool" title="新增工作表" @click=${() => toast('已新增工作表')} >${sxIcon('plus', 13)}</button>
          <button class="pv-tab on">Sheet1</button>
          <button class="pv-tool" title="更多" @click=${() => toast('更多操作')} >${sxIcon('plus', 13)}</button>
          <span class="pv-zoom">
            ${sxIcon('zoomOut', 13)}
            <span>100%</span>
            ${sxIcon('zoomIn', 13)}
          </span>
        </div>
      </div>
    `
  }

  /** 高亮行列：固定选中 B2（表头下第 1 行 · 第 2 列） */
  private hlClass(r: number, c: number): string {
    if (!this.misc.highlight) return ''
    const selRow = 1
    const selCol = 1
    if (r === selRow && c === selCol) return 'hl-cell hl-row hl-col'
    if (r === selRow) return 'hl-row'
    if (c === selCol) return 'hl-col'
    return ''
  }

  private renderFontSettings(): TemplateResult {
    return html`
      <section style="margin-top:0">
        <h2>字体设置</h2>
        <p class="sec-sub">调整字体和行高，获得更好的阅读体验</p>
        <div class="font-row">
          <span class="font-label">字体：</span>
          ${this.renderSelect('font-family', this.fontFamily, FONT_FAMILIES, (v) => { this.fontFamily = v })}
          <span class="font-label">字号：</span>
          ${this.renderSelect('font-size', this.fontSize, FONT_SIZES, (v) => { this.fontSize = v })}
          <span class="font-label">行高：</span>
          ${this.renderSelect('line-height', this.lineHeight, LINE_HEIGHTS, (v) => { this.lineHeight = v })}
        </div>
      </section>
    `
  }

  private renderMiscSettings(): TemplateResult {
    return html`
      <section style="margin-top:0">
        <h2>其他设置</h2>
        <div class="switch-list">
          ${MISC_OPTIONS.map((m) => {
            const on = this.misc[m.key]
            return html`
              <div class="switch-row">
                <span>${m.label}</span>
                <button
                  class="switch ${on ? 'on' : ''}"
                  role="switch"
                  aria-checked=${on ? 'true' : 'false'}
                  title="${m.label}"
                  @click=${() => this.toggleMisc(m.key)}
                ><span class="knob"></span></button>
              </div>
            `
          })}
        </div>
      </section>
    `
  }

  /** 通用自绘下拉（字体 / 字号 / 行高） */
  private renderSelect(
    id: string,
    current: string,
    options: readonly string[],
    onPick: (v: string) => void,
  ): TemplateResult {
    const open = this.openDrop === id
    return html`
      <div class="sel" @click=${(e: Event) => e.stopPropagation()}>
        <button class="sel-btn" @click=${(e: Event) => this.toggleDrop(id, e)}>
          <span class="txt">${current}</span>
          <span class="caret">${sxIcon('chevronDown', 12)}</span>
        </button>
        ${open ? html`
          <div class="sel-menu">
            ${options.map((opt) => html`
              <button
                class="sel-opt ${opt === current ? 'on' : ''}"
                @click=${() => { onPick(opt); this.openDrop = null }}
              >${opt}</button>
            `)}
          </div>
        ` : ''}
      </div>
    `
  }

  private renderPlaceholder(): TemplateResult {
    const item = SETTINGS_NAV.find((n) => n.key === this.activeNav)
    return html`
      <section class="content">
        <h1>${item?.label ?? '设置'}</h1>
        <p class="page-sub">该设置模块正在建设中，敬请期待</p>
        <div class="placeholder">
          <span class="ph-icon">${sxIcon(item?.icon ?? 'settings', 26)}</span>
          <span>「${item?.label ?? ''}」即将上线</span>
        </div>
      </section>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'settings-app': SettingsApp
  }
}
