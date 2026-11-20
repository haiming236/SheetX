/**
 * SheetX 第 35 张 · 嵌入式集成示例
 *
 * 展示 CDN / npm / Web Components 三种集成方式，分别嵌入 Vue / React / 原生 HTML，
 * 以及初始化配置、数据绑定与事件回调。
 */
import { LitElement, html, nothing, type TemplateResult } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { baseStyles, lightTokens } from './tokens.js'
import { bindPageTheme, type ResolvedTheme } from './theme.js'
import { embedStyles } from './embed-styles.js'
import { sxIcon, sxLogo } from './icons.js'
import { toast } from './toast.js'
import {
  DOC_NAV, GUIDE_NAV, FRAMEWORKS, FRAMEWORK_CODE, DEMO_ROWS, DEMO_TOTAL,
  INTEGRATIONS, EVENT_CODE, EVENTS, DEFAULT_CONFIG,
  type Framework, type FullConfig,
} from './embed-data.js'

const STORE_KEY = 'sx:embed-config'

@customElement('embed-app')
export class EmbedApp extends LitElement {
  static styles = [baseStyles, lightTokens, embedStyles]

  @state() private theme: ResolvedTheme = 'light'
  @state() private activeDoc = '开发者文档'
  @state() private guide = 'embed'
  @state() private subGuide = 'Vue 集成示例'
  @state() private cfg: FullConfig = this.load()
  @state() private eventLog: string[] = [
    '[SheetX] 初始化完成 · 50 行虚拟滚动已就绪',
    '[SheetX] 数据绑定成功 · 3 条记录',
  ]

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

  private patch(key: keyof FullConfig, value: unknown): void {
    this.cfg = { ...this.cfg, [key]: value }
    try { localStorage.setItem(STORE_KEY, JSON.stringify(this.cfg)) } catch { /* 忽略 */ }
  }

  private chooseFramework(key: Framework): void {
    this.patch('framework', key)
    this.subGuide = FRAMEWORKS.find((f) => f.key === key)!.name
    this.pushLog(`[Demo] 切换到 ${FRAMEWORKS.find((f) => f.key === key)!.label}`)
  }

  private pushLog(line: string): void {
    this.eventLog = [...this.eventLog, line].slice(-6)
  }

  private chooseGuide(key: string): void {
    this.guide = key
    if (key !== 'embed') toast(`${GUIDE_NAV.find((n) => n.key === key)?.label}（本页聚焦嵌入式集成）`)
  }

  private async copyCode(): Promise<void> {
    const code = FRAMEWORK_CODE[this.cfg.framework]
    try { await navigator.clipboard.writeText(code) } catch { /* 忽略 */ }
    this.patch('copied', true)
    toast('代码已复制到剪贴板')
    window.setTimeout(() => this.patch('copied', false), 1500)
  }

  private runDemo(): void {
    this.pushLog('[onChange] row=2 field=qty old=10 new=11')
    this.pushLog('[onSave] POST /api/data/update · 200 OK')
    toast('在线体验：已模拟一次编辑与保存（查看运行日志）')
  }

  private cellEdit(name: string, field: string, oldValue: number): void {
    const newValue = oldValue + 1
    this.pushLog(`[onChange] ${name}.${field} ${oldValue} → ${newValue}`)
    toast(`${name} · ${field} 已改为 ${newValue}（触发 onChange 回调）`)
  }

  /**
   * 代码行渲染：交给 Lit 的文本插值自动转义（安全且正确）。
   * 不做正则着色 —— 手工 innerHTML 拼接会二次转义导致乱码（已踩坑），
   * 正确显示优先于花哨高亮。
   */
  private highlight(line: string): TemplateResult {
    const comment = line.trim().startsWith('//') || line.trim().startsWith('<!--')
    return html`<span class="src ${comment ? 'tok-com' : ''}">${line}</span>`
  }

  private renderCode(): TemplateResult {
    const code = FRAMEWORK_CODE[this.cfg.framework]
    const lines = code.split('\n')
    return html`
      <div class="panel">
        <div class="panel-head">
          ${sxIcon('code', 15)} ${FRAMEWORKS.find((f) => f.key === this.cfg.framework)!.name}
          <div class="right">
            <button class="btn sm" @click=${() => void this.copyCode()}>
              ${this.cfg.copied ? sxIcon('check', 11) : sxIcon('copy', 11)} ${this.cfg.copied ? '已复制' : '复制代码'}
            </button>
          </div>
        </div>
        <div class="code-box">
          ${lines.map((line, i) => html`
            <div class="code-line"><span class="ln">${i + 1}</span>${this.highlight(line)}</div>`)}
        </div>
      </div>`
  }

  private renderRun(): TemplateResult {
    return html`
      <div class="panel">
        <div class="panel-head">
          ${sxIcon('chartBar', 15)} 运行效果
          <div class="right">
            <button class="btn sm" @click=${() => toast('全屏预览（演示）')}>${sxIcon('fullscreen', 11)} 全屏预览</button>
          </div>
        </div>
        <div class="run-grid">
          <div class="mini-toolbar">
            ${(['undo', 'redo', 'print'] as const).map((ic) => html`<button class="mini-btn">${sxIcon(ic, 12)}</button>`)}
            <span>100%</span>
            ${(['bold', 'italic', 'underline', 'fontColor'] as const).map((ic) => html`<button class="mini-btn">${sxIcon(ic, 12)}</button>`)}
            <span class="mini-sep"></span>
            ${(['alignLeft', 'alignCenter', 'alignRight'] as const).map((ic) => html`<button class="mini-btn">${sxIcon(ic, 12)}</button>`)}
            <span class="mini-sep"></span>
            <span>更多</span>
          </div>
          <div class="col-head"><span></span><span>A</span><span>B</span><span>C</span><span>D</span></div>
          <table class="demo-table">
            <thead><tr><th style="width:34%">产品名称</th><th>数量</th><th>单价</th><th>金额</th></tr></thead>
            <tbody>
              ${DEMO_ROWS.map((row, i) => html`
                <tr>
                  <td class="${i === 0 ? 'active' : ''}">${row.name}</td>
                  <td @click=${() => this.cellEdit(row.name, 'qty', row.qty)} style="cursor:pointer">${row.qty}</td>
                  <td @click=${() => this.cellEdit(row.name, 'price', row.price)} style="cursor:pointer">${row.price.toLocaleString('zh-CN')}</td>
                  <td>${row.total.toLocaleString('zh-CN')}</td>
                </tr>`)}
              <tr class="total-row"><td>合计</td><td>${DEMO_TOTAL.qty}</td><td>—</td><td>${DEMO_TOTAL.total.toLocaleString('zh-CN')}</td></tr>
            </tbody>
          </table>
          <div class="sheet-strip"><span class="tab">Sheet1</span><span class="add">＋</span></div>
          <div class="event-log">
            ${this.eventLog.map((l) => html`<div>${l.includes('onChange') || l.includes('200 OK') ? html`<span class="hit">${l}</span>` : l}</div>`)}
          </div>
        </div>
      </div>`
  }

  private renderIntegrations(): TemplateResult {
    return html`
      <div class="panel">
        <div class="panel-head">${sxIcon('package', 15)} 多种集成方式</div>
        <div class="integration-grid">
          ${INTEGRATIONS.map((it) => html`
            <div class="int-card">
              <h4><span class="ic">${sxIcon(it.icon, 14)}</span>${it.title}</h4>
              <p>${it.desc}</p>
              <code>${it.code}</code>
              <button class="link" @click=${() => {
                if (it.key === 'cdn') this.chooseFramework('html')
                else if (it.key === 'npm') this.chooseFramework('react')
                else this.chooseFramework('vue')
                toast(`已切换到对应示例：${it.title}`)
              }}>查看示例 →</button>
            </div>`)}
        </div>
      </div>`
  }

  private renderEvents(): TemplateResult {
    return html`
      <div class="panel">
        <div class="panel-head">${sxIcon('bolt', 15)} 事件回调
          <div class="right"><button class="btn sm" @click=${() => this.patch('showEventHelp', !this.cfg.showEventHelp)}>说明</button></div>
        </div>
        <div class="event-body">
          <p>监听各种事件，获取更丰富的交互体验。</p>
          <div class="event-code">${EVENT_CODE}</div>
          ${this.cfg.showEventHelp ? html`
            <div class="event-items">
              ${EVENTS.map((e) => html`<div class="event-item"><code>${e.name}</code><span class="d">${e.desc}</span></div>`)}
            </div>` : nothing}
          <button class="btn primary" style="margin-top:11px;width:100%;justify-content:center" @click=${() => this.runDemo()}>${sxIcon('play', 12)} 触发示例事件</button>
        </div>
      </div>`
  }

  private renderSidebar(): TemplateResult {
    return html`
      <aside class="sidebar">
        <div class="side-title">开发者指南</div>
        ${GUIDE_NAV.map((n) => html`
          <button class="side-item ${this.guide === n.key ? 'active' : ''}" @click=${() => this.chooseGuide(n.key)}>
            ${sxIcon(n.icon, 15)} ${n.label}
            ${n.children ? html`<span class="arrow">${sxIcon('chevronDown', 10)}</span>` : nothing}
          </button>
          ${n.children && this.guide === 'embed' ? n.children.map((c) => html`
            <button class="sub-item ${this.subGuide === c ? 'active' : ''}" @click=${() => {
              this.subGuide = c
              const f = c.includes('Vue') ? 'vue' : c.includes('React') ? 'react' : 'html'
              this.chooseFramework(f as Framework)
            }}>${c}</button>`) : nothing}
        `)}
      </aside>`
  }

  render(): TemplateResult {
    return html`
      <div class="app" data-embed-theme=${this.theme}>
        <div class="menu-bar">
          <div class="brand">${sxLogo(22)}</div>
          <nav class="menu-list">
            ${DOC_NAV.map((m) => html`
              <button class="menu-item ${m === this.activeDoc ? 'active' : ''}" @click=${() => { this.activeDoc = m; if (m !== '开发者文档') toast(`${m}（本页聚焦开发者文档）`) }}>${m}</button>`)}
          </nav>
          <div class="search-box">${sxIcon('search', 14)}<input placeholder="搜索文档..." /></div>
          <button class="icon-btn" title="主题" @click=${() => toast('主题由全局导航切换')}>${sxIcon('sun', 15)}</button>
          <span class="avatar" title="宿主用户">张</span>
        </div>
        <div class="shell">
          ${this.renderSidebar()}
          <div class="main">
            <div class="head">
              <span class="head-icon">${sxIcon('link', 22)}</span>
              <div><h2>SheetX 嵌入式集成示例</h2>
                <p>通过简单的配置，快速将 SheetX 嵌入到您的项目中，支持 Vue、React 和原生 HTML。</p>
              </div>
              <div class="head-actions">
                <button class="btn primary" @click=${() => this.runDemo()}>${sxIcon('play', 12)} 在线体验</button>
                <button class="btn" @click=${() => toast('GitHub 仓库（演示）')}>GitHub ${sxIcon('arrowRight', 11)}</button>
              </div>
            </div>
            <div class="fw-tabs">
              ${FRAMEWORKS.map((f) => {
                const color = f.key === 'vue' ? '#42b883' : f.key === 'react' ? '#61dafb' : '#e34f26'
                const mark = f.key === 'vue' ? 'V' : f.key === 'react' ? 'R' : 'H'
                return html`
                  <button class="fw-tab ${this.cfg.framework === f.key ? 'active' : ''}" @click=${() => this.chooseFramework(f.key)}>
                    <span class="fw-mark" style=${`background:${color}`}>${mark}</span>${f.label}
                  </button>`
              })}
            </div>
            <div class="demo-grid">${this.renderCode()}${this.renderRun()}</div>
            <div class="bottom-grid">${this.renderIntegrations()}${this.renderEvents()}</div>
          </div>
        </div>
      </div>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'embed-app': EmbedApp
  }
}
