/**
 * SheetX 第 36 张 · 完整 API 文档中心
 *
 * 实例创建 / 数据接口 / 列配置 / 事件系统 / 编辑器扩展 / 渲染器扩展 / TypeScript 类型。
 * 代码高亮采用「结构化 token + Lit 文本插值」渲染，安全不二次解析（规避上一页 innerHTML 乱码坑）。
 */
import { LitElement, html, nothing, type TemplateResult } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { baseStyles, lightTokens } from './tokens.js'
import { bindPageTheme, type ResolvedTheme } from './theme.js'
import { apiDocStyles } from './api-doc-styles.js'
import { sxIcon, sxLogo } from './icons.js'
import { toast } from './toast.js'
import {
  DOC_NAV, NAV_GROUPS, DOC_META, INTRO_TABS, INTRO_CODE, CREATE_CODE, FULL_CODE,
  CONFIG_OPTIONS, DEMO_ROWS, DOC_BODY, DEFAULT_CONFIG,
  type FullConfig,
} from './api-doc-data.js'

const STORE_KEY = 'sx:api-doc-config'

interface Token { text: string; cls: string }

/** 轻量词法着色：返回 token 数组，由 Lit 逐段安全渲染（不使用 innerHTML） */
function tokenize(line: string): Token[] {
  const tokens: Token[] = []
  const re = /(\/\/.*$|\/\*.*?\*\/|<[A-Za-z][\w-]*|\/?>|'[^']*'|"[^"]*"|\b\d+(?:\.\d+)?\b|\b(?:import|from|const|let|new|function|return|export|default|async|await|type|interface)\b|[A-Za-z_$][\w$]*(?=\s*=))/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) tokens.push({ text: line.slice(last, m.index), cls: '' })
    const t = m[0]
    let cls = ''
    if (t.startsWith('//') || t.startsWith('/*')) cls = 't-com'
    else if (t.startsWith('<') || t === '>' || t === '/>') cls = 't-tag'
    else if (t.startsWith("'") || t.startsWith('"')) cls = 't-str'
    else if (/^\d/.test(t)) cls = 't-num'
    else if (/^(import|from|const|let|new|function|return|export|default|async|await|type|interface)$/.test(t)) cls = 't-kw'
    else cls = 't-attr'
    tokens.push({ text: t, cls })
    last = m.index + t.length
  }
  if (last < line.length) tokens.push({ text: line.slice(last), cls: '' })
  return tokens
}

@customElement('api-doc-app')
export class ApiDocApp extends LitElement {
  static styles = [baseStyles, lightTokens, apiDocStyles]

  @state() private theme: ResolvedTheme = 'light'
  @state() private activeDoc = '开发者文档'
  @state() private cfg: FullConfig = this.load()
  @state() private showFullCode = false

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

  private chooseDoc(key: string): void {
    this.patch('doc', key)
    toast(`已切换文档：${DOC_META[key]?.title ?? key}`)
  }

  private async copy(code: string, tag: string): Promise<void> {
    try { await navigator.clipboard.writeText(code) } catch { /* 忽略 */ }
    this.patch('copied', tag)
    toast('代码已复制到剪贴板')
    window.setTimeout(() => this.patch('copied', ''), 1500)
  }

  /** 结构化 token 渲染：每个 token 用 Lit 文本插值，绝不拼 innerHTML */
  private renderCode(code: string, tag: string, copyable = true): TemplateResult {
    return html`
      <div class="code-card">
        ${copyable ? html`
          <button class="copy" @click=${() => void this.copy(code, tag)}>
            ${this.cfg.copied === tag ? sxIcon('check', 11) : sxIcon('copy', 11)}
            ${this.cfg.copied === tag ? '已复制' : '复制'}
          </button>` : nothing}
        <div class="code-lines">
          ${code.split('\n').map((line, i) => html`
            <div class="code-line">
              <span class="ln">${i + 1}</span><span>${line ? tokenize(line).map((t) => html`<span class=${t.cls}>${t.text}</span>`) : ''}</span>
            </div>`)}
        </div>
      </div>`
  }

  private renderNav(): TemplateResult {
    return html`
      <aside class="sidebar">
        <div class="side-title">API 文档</div>
        ${NAV_GROUPS.map((g) => html`
          <div class="group-title">${sxIcon('chevronDown', 11)} ${g.title}</div>
          ${g.items.map((it) => html`
            <button class="doc-item ${it.child ? 'child' : ''} ${this.cfg.doc === it.key ? 'active' : ''}" @click=${() => this.chooseDoc(it.key)}>${it.label}</button>`)}
        `)}
        <div class="side-cta" @click=${() => this.patch('doc', 'create')}>
          <span class="ic">${sxIcon('bolt', 17)}</span>
          <div><div class="t">在线示例</div><div class="d">体验更多功能示例</div></div>
          ${sxIcon('arrowRight', 12)}
        </div>
      </aside>`
  }

  private renderCreateDoc(): TemplateResult {
    return html`
      <!-- 1 引入方式 -->
      <div class="sec">
        <div class="sec-title"><span class="sec-num">1</span>引入方式</div>
        <div class="intro-tabs">
          ${INTRO_TABS.map((t) => html`
            <button class="intro-tab ${this.cfg.introTab === t ? 'active' : ''}" @click=${() => this.patch('introTab', t)}>${t}</button>`)}
        </div>
        ${this.renderCode(INTRO_CODE[this.cfg.introTab], 'intro')}
      </div>
      <!-- 2 创建实例 -->
      <div class="sec">
        <div class="sec-title"><span class="sec-num">2</span>创建实例</div>
        <p class="sec-desc">在容器元素中初始化 SheetX 实例，并配置基本选项。</p>
        ${this.renderCode(CREATE_CODE, 'create')}
      </div>
      <!-- 3 配置选项 -->
      <div class="sec">
        <div class="sec-title"><span class="sec-num">3</span>配置选项</div>
        <p class="sec-desc">以下是常用配置选项：</p>
        <table class="opt-table">
          <thead><tr><th>参数</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead>
          <tbody>
            ${CONFIG_OPTIONS.map((o) => html`
              <tr><td><code>${o.param}</code></td><td>${o.type}</td><td class="def">${o.def}</td><td>${o.desc}</td></tr>`)}
          </tbody>
        </table>
      </div>`
  }

  private renderGenericDoc(): TemplateResult {
    const key = this.cfg.doc
    const body = DOC_BODY[key] ?? DOC_BODY.basic!
    return html`
      <div class="sec">
        <div class="sec-title"><span class="sec-num">1</span>核心说明</div>
        <ul class="points">${body.points.map((p) => html`<li>${p}</li>`)}</ul>
        ${this.renderCode(body.code, key)}
      </div>
      <div class="sec">
        <div class="sec-title"><span class="sec-num">2</span>接入提示</div>
        <div class="notice"><span class="ic">${sxIcon('infoCircle', 15)}</span>SheetX 提供稳定的公共 API，内部实现可自由重构；业务数据通过 DataAdapter 与宿主交换。</div>
      </div>`
  }

  private renderDoc(): TemplateResult {
    const meta = DOC_META[this.cfg.doc] ?? DOC_META.create!
    // 必须包成单一根元素作为 grid 第一列，否则多个平级元素会被 grid 拆散导致错位
    return html`
      <div class="doc-main">
        <div class="crumb">
          ${sxIcon('gridView', 12)} 开发者文档 ${sxIcon('chevronRight', 11)} ${meta.group} ${sxIcon('chevronRight', 11)} ${meta.title}
        </div>
        <div class="doc-head">
          <span class="head-icon">${sxIcon('code', 22)}</span>
          <div><h2>${meta.title}</h2><p>${meta.sub}</p></div>
        </div>
        <div class="notice"><span class="ic">${sxIcon('infoCircle', 15)}</span>SheetX 提供多种引入方式，推荐使用 ES 模块化方式进行开发。</div>
        ${this.cfg.doc === 'create' ? this.renderCreateDoc() : this.renderGenericDoc()}
      </div>`
  }

  private renderSideCol(): TemplateResult {
    return html`
      <div class="side-col">
        <div class="panel">
          <div class="panel-head">${sxIcon('chartBar', 15)} 在线示例
            <button class="link" @click=${() => toast('已在新窗口打开在线示例（演示）')}>在新窗口打开 ${sxIcon('arrowRight', 10)}</button>
          </div>
          <div style="padding:10px">
            <div class="mini-toolbar">
              ${(['undo', 'redo', 'print'] as const).map((ic) => html`<button class="mini-btn">${sxIcon(ic, 12)}</button>`)}
              <span>100%</span>
              ${(['bold', 'italic', 'underline', 'fontColor'] as const).map((ic) => html`<button class="mini-btn">${sxIcon(ic, 12)}</button>`)}
              <span>${sxIcon('chevronDown', 9)}</span>
              ${(['alignLeft', 'alignCenter', 'alignRight'] as const).map((ic) => html`<button class="mini-btn">${sxIcon(ic, 12)}</button>`)}
              <button class="mini-btn">${sxIcon('gridView', 12)}</button>
              <span>更多</span>
            </div>
            <div class="col-head"><span></span><span>A</span><span>B</span><span>C</span><span>D</span></div>
            <table class="demo-table">
              <thead><tr><th style="width:36%">产品名称</th><th>数量</th><th>单价</th><th>金额</th></tr></thead>
              <tbody>
                ${DEMO_ROWS.map((r) => html`
                  <tr><td>${r.name}</td><td>${r.qty}</td><td>${r.price.toLocaleString('zh-CN')}</td><td>${r.total.toLocaleString('zh-CN')}</td></tr>`)}
                <tr class="total"><td>合计</td><td>60</td><td>—</td><td>248,000</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="panel">
          <div class="panel-head">${sxIcon('code', 15)} 完整示例代码
            <button class="link" @click=${() => { this.showFullCode = !this.showFullCode }}>${this.showFullCode ? '收起' : '查看更多示例'} ${sxIcon('arrowRight', 10)}</button>
          </div>
          ${this.renderCode(FULL_CODE, 'full')}
          ${this.showFullCode ? html`<div style="padding:10px 13px;font-size:10.5px;color:var(--sx-text-hint);border-top:1px solid var(--sx-border)">更多示例：远程搜索编辑器 / 公式联动 / 插件注册，见「示例中心」。</div>` : nothing}
        </div>
        <div class="resource-card">
          <span class="ic">${sxIcon('checkCircle', 17)}</span>
          <div><div class="t">更多资源</div><div class="d">访问完整的 API 文档、示例代码和开发指南，开启您的 SheetX 开发之旅！</div></div>
          <span class="arrow">${sxIcon('arrowRight', 14)}</span>
        </div>
      </div>`
  }

  render(): TemplateResult {
    return html`
      <div class="app" data-apidoc-theme=${this.theme}>
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
          ${this.renderNav()}
          <div class="main">
            <div class="content-grid">${this.renderDoc()}${this.renderSideCol()}</div>
          </div>
        </div>
      </div>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'api-doc-app': ApiDocApp
  }
}
