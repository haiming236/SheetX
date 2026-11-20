/**
 * SheetX 第 27 张 · 数据源适配与远程数据加载
 *
 * 核心立场：SheetX 不管理数据库 / 不内置后端，只通过标准 DataAdapter 与宿主交换数据。
 * 本页把远程分页、排序、筛选、懒加载、数据更新与错误处理做成真实可交互的配置与预览。
 */
import { LitElement, html, nothing, type TemplateResult } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { baseStyles, lightTokens } from './tokens.js'
import { bindPageTheme, type ResolvedTheme } from './theme.js'
import { datasourceStyles } from './datasource-styles.js'
import { sxIcon, sxLogo } from './icons.js'
import { toast } from './toast.js'
import {
  SOURCE_NAV, SOURCE_TYPES, DETAIL_TABS, ORDERS, TOTAL_ROWS, TOTAL_PAGES,
  PARAM_SNIPPETS, STATUS_STYLE, DEFAULT_CONFIG,
  type DetailTab, type ApiConfig, type AdvancedConfig,
} from './datasource-data.js'

const TOP_MENUS = ['工作表', '数据源', '公式', '图表', '视图', '设置']
const STORE_KEY = 'sx:datasource-config'

@customElement('datasource-app')
export class DatasourceApp extends LitElement {
  static styles = [baseStyles, lightTokens, datasourceStyles]

  @state() private theme: ResolvedTheme = 'light'
  @state() private activeMenu = '数据源'
  @state() private sideNav = 'remote'
  @state() private sourceType = 'api'
  @state() private detailTab: DetailTab = '接口配置'
  @state() private api: ApiConfig = this.loadApi()
  @state() private advanced: AdvancedConfig = this.loadAdvanced()
  @state() private connected = true
  @state() private testing = false
  @state() private refreshing = false
  @state() private page = 1
  @state() private pageSize = 10
  @state() private showParamMenu = false
  @state() private viewed: string | null = null
  @state() private savedAt = ''

  private stopTheme: (() => void) | null = null

  constructor() {
    super()
    this.stopTheme = bindPageTheme((resolved) => { this.theme = resolved })
  }

  disconnectedCallback(): void {
    this.stopTheme?.()
    this.stopTheme = null
    super.disconnectedCallback()
  }

  private loadApi(): ApiConfig {
    try {
      const raw = localStorage.getItem(STORE_KEY)
      if (raw) return { ...DEFAULT_CONFIG.api, ...JSON.parse(raw).api }
    } catch { /* 忽略 */ }
    return { ...DEFAULT_CONFIG.api }
  }

  private loadAdvanced(): AdvancedConfig {
    try {
      const raw = localStorage.getItem(STORE_KEY)
      if (raw) return { ...DEFAULT_CONFIG.advanced, ...JSON.parse(raw).advanced }
    } catch { /* 忽略 */ }
    return { ...DEFAULT_CONFIG.advanced }
  }

  private save(): void {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ api: this.api, advanced: this.advanced, sourceType: this.sourceType }))
    } catch { /* 忽略 */ }
    const now = new Date()
    this.savedAt = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  }

  private setApi(key: keyof ApiConfig, value: string | number): void {
    this.api = { ...this.api, [key]: value }
  }

  private setAdv(key: keyof AdvancedConfig, value: boolean | number | string): void {
    this.advanced = { ...this.advanced, [key]: value }
  }

  private chooseSide(key: string): void {
    this.sideNav = key
    if (key === 'remote') { this.sourceType = 'api'; this.detailTab = '接口配置' }
    else if (key === 'local') { this.sourceType = 'file'; this.detailTab = '接口配置' }
    else if (key === 'transform') this.detailTab = '参数设置'
    else if (key === 'cache') this.detailTab = '数据预览'
    else if (key === 'binding') this.detailTab = '使用说明'
  }

  private chooseSource(key: string): void {
    this.sourceType = key
    toast(`已切换数据源类型：${SOURCE_TYPES.find((t) => t.key === key)?.label ?? key}`)
  }

  private async testConnection(): Promise<void> {
    this.testing = true
    await new Promise((r) => window.setTimeout(r, 620))
    this.connected = true
    this.testing = false
    toast(`连接成功 · GET ${this.api.url} · 响应 68ms`)
  }

  private async refresh(): Promise<void> {
    this.refreshing = true
    await new Promise((r) => window.setTimeout(r, 520))
    this.page = 1
    this.refreshing = false
    toast(`数据已刷新 · 共 ${TOTAL_ROWS.toLocaleString('zh-CN')} 条`)
  }

  private insertSnippet(value: string): void {
    let params = this.api.params.trim()
    if (!params.startsWith('{')) params = '{}'
    const inner = params.slice(1, params.lastIndexOf('}')).trim()
    const next = inner ? `${inner},\n  ${value}` : `  ${value}`
    this.setApi('params', `{\n  ${next}\n}`)
    this.showParamMenu = false
    toast('参数已插入')
  }

  private viewOrder(id: string): void {
    this.viewed = id
  }

  /* ================= 渲染 ================= */

  private renderTop(): TemplateResult {
    return html`
      <div class="menu-bar">
        <div class="brand">${sxLogo(22)}</div>
        <nav class="menu-list">
          ${TOP_MENUS.map((m) => html`
            <button class="menu-item ${m === this.activeMenu ? 'active' : ''}" @click=${() => {
              this.activeMenu = m
              if (m === '设置') this.detailTab = '使用说明'
            }}>${m}</button>`)}
        </nav>
        <div class="menu-right">
          <button class="icon-btn" title="搜索" @click=${() => toast('搜索数据源（演示）')}>${sxIcon('search', 16)}</button>
          <button class="icon-btn" title="帮助" @click=${() => toast('查看 apps/docs 官方文档')}>${sxIcon('help', 16)}</button>
          <button class="icon-btn" title="设置" @click=${() => { this.sideNav = 'remote'; this.sourceType = 'api' }}>${sxIcon('settings', 16)}</button>
          <span class="avatar" title="宿主传入用户">张</span>
        </div>
      </div>`
  }

  private renderSidebar(): TemplateResult {
    return html`
      <aside class="sidebar">
        <div class="side-title">数据源管理</div>
        ${SOURCE_NAV.map((item) => html`
          <button class="side-item ${this.sideNav === item.key ? 'active' : ''}" @click=${() => this.chooseSide(item.key)}>
            ${sxIcon(item.icon, 15)} ${item.label}
          </button>`)}
        <div class="no-db-card">
          <h4>${sxIcon('bulb', 15)} SheetX 不内置数据库</h4>
          <p>完全依赖宿主系统提供数据接口，仅通过标准 DataAdapter 交换数据。</p>
          <button class="link-btn" @click=${() => { this.detailTab = '使用说明'; this.sideNav = 'binding' }}>了解更多 ${sxIcon('arrowRight', 11)}</button>
        </div>
      </aside>`
  }

  private renderConfigForm(): TemplateResult {
    const a = this.api
    return html`
      <div class="form-row">
        <label>接口地址</label>
        <div class="form-main">
          <input class="input full" .value=${a.url} @change=${(e: Event) => this.setApi('url', (e.target as HTMLInputElement).value)} />
          <div class="form-hint">支持相对路径或完整 URL，例如: https://api.xxx.com/orders</div>
        </div>
      </div>
      <div class="form-row">
        <label>请求方法</label>
        <div class="form-main inline-grid">
          <div class="inline-field">
            <select class="select" .value=${a.method} @change=${(e: Event) => this.setApi('method', (e.target as HTMLSelectElement).value)}>
              <option>GET</option><option>POST</option><option>PUT</option>
            </select>
          </div>
          <div class="inline-field">
            <label>数据格式</label>
            <select class="select" .value=${a.format} @change=${(e: Event) => this.setApi('format', (e.target as HTMLSelectElement).value)}>
              <option>JSON</option><option>XML</option><option>CSV</option>
            </select>
          </div>
        </div>
      </div>
      <div class="form-row">
        <label>分页参数</label>
        <div class="form-main inline-grid">
          <div class="inline-field">
            <select class="select" .value=${a.pageParam} @change=${(e: Event) => this.setApi('pageParam', (e.target as HTMLSelectElement).value)}>
              <option>page</option><option>offset</option><option>cursor</option>
            </select>
          </div>
          <div class="inline-field">
            <label>每页数量</label>
            <input class="input" type="number" .value=${String(a.pageSize)} @change=${(e: Event) => { this.setApi('pageSize', Number((e.target as HTMLInputElement).value)); this.pageSize = Number((e.target as HTMLInputElement).value) }} />
          </div>
          <div class="inline-field">
            <label>总条数字段</label>
            <input class="input" .value=${a.totalField} @change=${(e: Event) => this.setApi('totalField', (e.target as HTMLInputElement).value)} />
          </div>
        </div>
      </div>
      <div class="form-row">
        <label>请求参数</label>
        <div class="form-main param-box">
          <textarea class="params" .value=${a.params} @change=${(e: Event) => this.setApi('params', (e.target as HTMLTextAreaElement).value)}></textarea>
          <button class="btn outline param-assist" @click=${() => { this.showParamMenu = !this.showParamMenu }}>
            ${sxIcon('edit', 12)} 参数助手
          </button>
          ${this.showParamMenu ? html`
            <div class="popover" style="top:42px;right:0">
              ${PARAM_SNIPPETS.map((s) => html`<button @click=${() => this.insertSnippet(s.value)}>${s.label}</button>`)}
            </div>` : nothing}
        </div>
      </div>
      <div class="save-row"><button class="btn primary" @click=${() => { this.save(); toast(`配置已保存${this.savedAt ? ` · ${this.savedAt}` : ''}`) }}>${sxIcon('database', 13)} 保存配置</button></div>`
  }

  private renderParams(): TemplateResult {
    return html`
      <div class="adv-section" style="margin-top:0">
        <h4>请求头（Headers）</h4>
        <div class="doc-box">{
  "Authorization": "Bearer {token}",
  "Content-Type": "application/json",
  "X-Tenant": "{user.tenant}"
}</div>
      </div>
      <div class="adv-section">
        <h4>字段映射</h4>
        <div class="doc-box">{
  "id": "orderNo",
  "customer": "customerName",
  "date": "orderDate",
  "amount": "orderAmount",
  "status": "orderStatus"
}</div>
      </div>
      <div class="adv-section">
        <h4>响应结构约定</h4>
        <div class="doc-box">{
  "list": [ ... ],       // 当前页记录
  "total": 12580,        // 由「总条数字段」指定
  "page": 1,
  "pageSize": 100
}</div>
      </div>`
  }

  private renderPreview(): TemplateResult {
    const start = (this.page - 1) * this.pageSize
    const rows = ORDERS.map((row, i) => ({ ...row, displayId: `${row.id.slice(0, 10)}${String(start + i + 1).padStart(3, '0')}` }))
    const pages = Array.from({ length: Math.min(6, TOTAL_PAGES) }, (_, i) => i + 1)
    return html`
      <div class="preview-head">
        <span class="pill" style="background:var(--sx-success-soft);color:var(--sx-success)"><span class="dot"></span>数据预览（前 10 条）</span>
        <span class="count">共 ${TOTAL_ROWS.toLocaleString('zh-CN')} 条数据</span>
        <button class="icon-btn" title="刷新数据" @click=${() => void this.refresh()} style="margin-left:6px">${sxIcon('refresh', 14)}</button>
      </div>
      <div class="table-wrap">
        <table class="preview-table">
          <thead><tr><th style="width:6%">#</th><th>订单编号</th><th>客户名称</th><th>订单日期</th><th>订单金额</th><th>订单状态</th><th style="width:10%">操作</th></tr></thead>
          <tbody>
            ${rows.map((row, i) => html`
              <tr>
                <td>${start + i + 1}</td>
                <td>${row.displayId}</td>
                <td>${row.customer}</td>
                <td>${row.date}</td>
                <td>¥ ${row.amount.toLocaleString('zh-CN')}.00</td>
                <td><span class="status-pill-small" style=${`background:${STATUS_STYLE[row.status]?.bg};color:${STATUS_STYLE[row.status]?.color}`}>${row.status}</span></td>
                <td><button class="row-link" @click=${() => this.viewOrder(row.displayId)}>查看</button></td>
              </tr>`)}
          </tbody>
        </table>
      </div>
      <div class="pager">
        <button class="pg ${this.page === 1 ? 'disabled' : ''}" @click=${() => { if (this.page > 1) this.page-- }}>‹</button>
        ${pages.map((p) => html`<button class="pg ${this.page === p ? 'on' : ''}" @click=${() => { this.page = p }}>${p}</button>`)}
        <span style="color:var(--sx-text-hint)">…</span>
        <button class="pg" @click=${() => { this.page = TOTAL_PAGES }}>${TOTAL_PAGES}</button>
        <button class="pg" @click=${() => { if (this.page < TOTAL_PAGES) this.page++ }}>›</button>
        <select class="select" style="width:88px;margin-left:8px" .value=${String(this.pageSize)} @change=${(e: Event) => { this.pageSize = Number((e.target as HTMLSelectElement).value); this.page = 1 }}>
          <option value="10">每页 10 条</option><option value="20">每页 20 条</option><option value="50">每页 50 条</option>
        </select>
      </div>`
  }

  private renderUsage(): TemplateResult {
    return html`
      <div class="adv-section" style="margin-top:0">
        <h4>DataAdapter 接入契约 —— 不传整表，只交换增量</h4>
        <div class="doc-box">${`// SheetX 不内置数据库 —— 宿主注入 DataAdapter 即可
SheetX.registerDataAdapter({
  async load({ page, pageSize, sort, filters }) {
    const res = await fetch('/api/sales/orders?' + new URLSearchParams({
      page, pageSize, sort: JSON.stringify(sort), filters: JSON.stringify(filters)
    }))
    const data = await res.json()
    return { rows: data.list, total: data.total }   // 分页 + 总数
  },
  async save(transaction) { /* 增量写回，不传整表 */ },
  getUser() { return currentUser },                  // 用户上下文
  can(action) { return permissions[action] },        // 权限回调
})

// 约定：只传变更补丁 + revision，永不传整表快照`}</div>
      </div>
      <div class="tip-box" style="margin-top:14px;padding:12px;border-radius:7px;background:var(--sx-brand-soft);font-size:11.5px;line-height:1.6">
        分页 / 排序 / 筛选参数由引擎生成，宿主适配器负责把它翻译成后端 API 的查询参数；引擎不感知数据库类型。
      </div>`
  }

  private renderCenter(): TemplateResult {
    const body =
      this.detailTab === '接口配置' ? this.renderConfigForm() :
      this.detailTab === '参数设置' ? this.renderParams() :
      this.detailTab === '数据预览' ? this.renderPreview() : this.renderUsage()
    return html`
      <div class="center">
        <div class="source-tabs">
          ${SOURCE_TYPES.map((t) => html`
            <button class="source-tab ${this.sourceType === t.key ? 'active' : ''}" @click=${() => this.chooseSource(t.key)}>
              ${sxIcon(t.icon, 15)} ${t.label}
            </button>`)}
        </div>
        <div class="panel">
          <div class="conn-head">
            <span class="conn-icon">${sxIcon('terminal', 22)}</span>
            <div>
              <h3>ERP 业务数据接口 ${this.connected ? html`<span class="pill"><span class="dot"></span>已连接</span>` : html`<span class="pill" style="background:var(--sx-bg-app);color:var(--sx-text-hint)">未连接</span>`}</h3>
              <p>通过 REST API 获取企业业务数据</p>
            </div>
            <div class="conn-actions">
              <button class="btn outline" @click=${() => void this.testConnection()}>${this.testing ? '测试中…' : html`${sxIcon('play', 12)} 测试连接`}</button>
              <button class="btn outline" @click=${() => void this.refresh()}>${this.refreshing ? '刷新中…' : html`${sxIcon('refresh', 12)} 刷新数据`}</button>
            </div>
          </div>
          <div class="detail-tabs" role="tablist">
            ${DETAIL_TABS.map((t) => html`
              <button class="detail-tab ${this.detailTab === t ? 'active' : ''}" @click=${() => { this.detailTab = t }}>${t}</button>`)}
          </div>
          <div class="detail-body">${body}</div>
        </div>
      </div>`
  }

  private renderRight(): TemplateResult {
    const adv = this.advanced
    const check = (key: keyof AdvancedConfig, label: string): TemplateResult => html`
      <label class="check-line" @click=${() => this.setAdv(key, !adv[key])}>
        <span class="check-box ${adv[key] ? 'on' : ''}">${adv[key] ? sxIcon('check', 10) : ''}</span>${label}
      </label>`
    return html`
      <aside class="right">
        <div class="right-title">${sxIcon('settings', 15)} 高级配置</div>
        <div class="adv-section">
          <h4>数据加载方式</h4>
          <label class="radio-row" @click=${() => this.setAdv('loadMode', 'paged')}>
            <span class="radio ${adv.loadMode === 'paged' ? 'on' : ''}"></span>
            <span class="txt">分页加载（推荐）<span class="desc">按需加载数据，性能更优</span></span>
          </label>
          <label class="radio-row" @click=${() => this.setAdv('loadMode', 'all')}>
            <span class="radio ${adv.loadMode === 'all' ? 'on' : ''}"></span>
            <span class="txt">一次性加载<span class="desc">一次加载全部数据，适合小数据量</span></span>
          </label>
        </div>
        <div class="adv-section">
          <h4>数据处理</h4>
          <div class="switch-row">自动刷新<button class="switch ${adv.autoRefresh ? 'on' : ''}" @click=${() => this.setAdv('autoRefresh', !adv.autoRefresh)}><span class="knob"></span></button></div>
          <div class="switch-row">支持筛选排序<button class="switch ${adv.serverSort ? 'on' : ''}" @click=${() => this.setAdv('serverSort', !adv.serverSort)}><span class="knob"></span></button></div>
          <div class="switch-row">懒加载<button class="switch ${adv.lazyLoad ? 'on' : ''}" @click=${() => this.setAdv('lazyLoad', !adv.lazyLoad)}><span class="knob"></span></button></div>
        </div>
        <div class="adv-section">
          <h4>错误处理</h4>
          <div class="adv-field"><span>重试次数</span><input class="input" type="number" .value=${String(adv.retry)} @change=${(e: Event) => this.setAdv('retry', Number((e.target as HTMLInputElement).value))} /></div>
          <div class="adv-field"><span>超时时间（秒）</span><input class="input" type="number" .value=${String(adv.timeout)} @change=${(e: Event) => this.setAdv('timeout', Number((e.target as HTMLInputElement).value))} /></div>
        </div>
        <div class="adv-section">
          <h4>高级特性</h4>
          ${check('complexQuery', '支持复杂查询条件')}
          ${check('crud', '支持数据更新（增删改）')}
          ${check('cache', '启用数据缓存（IndexedDB）')}
        </div>
        <div class="open-card">
          <h4>${sxIcon('infoCircle', 14)} 开放集成</h4>
          <p>SheetX 提供标准 DataAdapter 接口，可轻松对接各种企业系统。</p>
          <button class="link-btn" @click=${() => { this.detailTab = '使用说明'; this.sideNav = 'binding' }}>查看 API 文档 →</button>
        </div>
      </aside>`
  }

  render(): TemplateResult {
    return html`
      <div class="app" data-ds-theme=${this.theme}>
        ${this.renderTop()}
        <div class="shell">
          ${this.renderSidebar()}
          ${this.renderCenter()}
          ${this.renderRight()}
        </div>
        ${this.viewed ? html`
          <div class="modal-mask" style="position:fixed;inset:0;background:rgba(12,16,28,.42);z-index:500;display:flex;align-items:center;justify-content:center"
               @click=${(e: Event) => { if (e.target === e.currentTarget) this.viewed = null }}>
            <div style="width:min(420px,92vw);background:var(--sx-bg-surface);border:1px solid var(--sx-border);border-radius:10px;padding:18px">
              <div style="display:flex;align-items:center;font-size:14px;font-weight:600">订单详情
                <button class="icon-btn" style="margin-left:auto" @click=${() => { this.viewed = null }}>${sxIcon('close', 14)}</button>
              </div>
              <div style="margin-top:14px;font-size:12.5px;line-height:2">
                <div>订单编号：<b>${this.viewed}</b></div>
                <div>数据来源：${this.api.url}</div>
                <div>加载方式：${this.advanced.loadMode === 'paged' ? '分页加载' : '一次性加载'}</div>
                <div>分页参数：${this.api.pageParam} · 每页 ${this.pageSize} 条</div>
              </div>
              <div style="margin-top:14px;font-size:11px;color:var(--sx-text-hint)">此数据来自宿主 API，SheetX 不持有数据库。</div>
            </div>
          </div>` : nothing}
      </div>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'datasource-app': DatasourceApp
  }
}
