/**
 * SheetX 第 33 张 · 插件开发与扩展 API
 *
 * 面向第三方开发者的扩展能力：插件注册 / 生命周期钩子 / 自定义编辑器 / 渲染器 /
 * 工具栏按钮 / 事件订阅 / 调试。市场 + 详情代码运行 + 管理启停 + 开发者工具。
 */
import { LitElement, html, nothing, type TemplateResult } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { baseStyles, lightTokens } from './tokens.js'
import { bindPageTheme, type ResolvedTheme } from './theme.js'
import { pluginDevStyles } from './plugin-dev-styles.js'
import { sxIcon, sxLogo } from './icons.js'
import { toast } from './toast.js'
import {
  LEFT_NAV, CATEGORIES, PLUGINS, DETAIL_TABS, BOTTOM_TABS,
  PLUGIN_CODE, RUN_OUTPUT, DEBUG_LOGS, LIFECYCLE_HOOKS, EXTENSION_POINTS, DEFAULT_CONFIG,
  type Category, type Plugin, type FullConfig, type InstalledPlugin,
} from './plugin-dev-data.js'

const TOP_MENUS = ['文件', '开始', '插入', '数据', '公式', '视图', '设置', '扩展']
const STORE_KEY = 'sx:plugin-dev-config'

@customElement('plugin-dev-app')
export class PluginDevApp extends LitElement {
  static styles = [baseStyles, lightTokens, pluginDevStyles]

  @state() private theme: ResolvedTheme = 'light'
  @state() private activeMenu = '扩展'
  @state() private nav = 'market'
  @state() private cfg: FullConfig = this.load()
  @state() private running = false
  @state() private runOutput: string | null = null
  @state() private copied = false
  @state() private showDemo = false

  private stopTheme: (() => void) | null = null
  private timer: number | null = null

  constructor() {
    super()
    this.stopTheme = bindPageTheme((resolved) => { this.theme = resolved })
  }

  disconnectedCallback(): void {
    this.stopTheme?.()
    this.stopTheme = null
    if (this.timer !== null) window.clearTimeout(this.timer)
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

  private get selected(): Plugin {
    return PLUGINS.find((p) => p.id === this.cfg.selected) ?? PLUGINS[0]!
  }

  private isInstalled(id: string): boolean {
    return this.cfg.installed.some((p) => p.id === id)
  }

  private filtered(): Plugin[] {
    const q = this.cfg.query.trim().toLowerCase()
    return PLUGINS.filter((p) =>
      (this.cfg.category === '全部' || p.category === this.cfg.category) &&
      (!q || p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)))
  }

  private chooseNav(key: string): void {
    this.nav = key
    if (key === 'market') this.cfg.category = '全部'
    if (key === 'manage') this.patch('bottomTab', '插件管理')
    if (key === 'devtools') { this.patch('bottomTab', '开发者工具'); toast('开发者工具已展开') }
    if (key === 'apidoc') { this.patch('bottomTab', '开发者工具'); toast('API 文档见下方开发者工具') }
    if (key === 'mine' || key === 'center') toast(`${LEFT_NAV.find((n) => n.key === key)?.label}（已安装 ${this.cfg.installed.length} 个插件）`)
  }

  private install(p: Plugin): void {
    if (this.isInstalled(p.id)) { toast(`${p.name} 已安装`); return }
    const installed: InstalledPlugin[] = [...this.cfg.installed, {
      id: p.id, version: p.version, enabled: true,
      installedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    }]
    this.patch('installed', installed)
    this.patch('selected', p.id)
    toast(`已安装：${p.name} v${p.version}（生命周期 install → activate 已执行）`)
  }

  private togglePlugin(id: string): void {
    const installed = this.cfg.installed.map((p) => p.id === id ? { ...p, enabled: !p.enabled } : p)
    this.patch('installed', installed)
    toast(installed.find((p) => p.id === id)?.enabled ? '插件已启用' : '插件已停用')
  }

  private uninstall(id: string): void {
    this.patch('installed', this.cfg.installed.filter((p) => p.id !== id))
    toast('插件已卸载（uninstall 钩子已执行）')
  }

  private async runExample(): Promise<void> {
    if (this.running) return
    this.running = true
    this.runOutput = null
    await new Promise((r) => { this.timer = window.setTimeout(r, 560) })
    this.runOutput = RUN_OUTPUT
    this.running = false
    this.timer = null
    toast('示例代码运行成功 · 插件已注册')
  }

  private async copyCode(): Promise<void> {
    try { await navigator.clipboard.writeText(PLUGIN_CODE) } catch { /* 忽略 */ }
    this.copied = true
    toast('示例代码已复制')
    window.setTimeout(() => { this.copied = false }, 1500)
  }

  /* ================= 渲染 ================= */

  private renderTop(): TemplateResult {
    return html`
      <div class="menu-bar">
        <div class="brand">${sxLogo(22)}</div>
        <nav class="menu-list">
          ${TOP_MENUS.map((m) => html`
            <button class="menu-item ${m === this.activeMenu ? 'active' : ''}" @click=${() => { this.activeMenu = m; if (m === '扩展') this.chooseNav('market') }}>${m}</button>`)}
        </nav>
        <div class="search-box">${sxIcon('search', 14)}<input placeholder="搜索功能..." /></div>
        <button class="icon-btn" title="帮助" @click=${() => { this.patch('bottomTab', '开发者工具'); toast('开发者工具已展开') }}>${sxIcon('help', 16)}</button>
        <button class="icon-btn" title="设置" @click=${() => this.chooseNav('manage')}>${sxIcon('settings', 16)}</button>
        <span class="avatar" title="宿主用户">张</span>
      </div>`
  }

  private renderSidebar(): TemplateResult {
    return html`
      <aside class="sidebar">
        ${LEFT_NAV.map((item) => html`
          <button class="side-item ${this.nav === item.key ? 'active' : ''}" @click=${() => this.chooseNav(item.key)}>
            ${sxIcon(item.icon, 15)} ${item.label}
          </button>`)}
      </aside>`
  }

  private renderMarket(): TemplateResult {
    const list = this.filtered()
    return html`
      <div class="panel market">
        <div class="search-row">
          <input class="search-input" placeholder="搜索插件名称或功能..." .value=${this.cfg.query} @input=${(e: Event) => this.patch('query', (e.target as HTMLInputElement).value)} />
          <select class="select" .value=${this.cfg.category} @change=${(e: Event) => this.patch('category', (e.target as HTMLSelectElement).value as Category)}>
            ${CATEGORIES.map((c) => html`<option>${c}</option>`)}
          </select>
        </div>
        <div class="cats">
          ${CATEGORIES.map((c) => html`
            <button class="cat ${this.cfg.category === c ? 'on' : ''}" @click=${() => this.patch('category', c)}>${c}</button>`)}
        </div>
        <div class="plugin-list">
          ${list.length === 0 ? html`<div style="padding:20px;text-align:center;color:var(--sx-text-hint);font-size:11px">未找到匹配的插件</div>` : nothing}
          ${list.map((p) => html`
            <div class="plugin-item ${this.cfg.selected === p.id ? 'active' : ''}" @click=${() => this.patch('selected', p.id)}>
              <span class="p-icon" style=${`background:${p.color}`}>${sxIcon(p.icon, 19)}</span>
              <div class="p-info">
                <h4>${p.name}</h4><p>${p.desc}</p>
                <div class="p-meta"><span class="star">★ ${p.rating}</span> · ${p.installs}</div>
              </div>
              <button class="btn ${this.isInstalled(p.id) ? '' : 'primary'} sm" @click=${(e: Event) => { e.stopPropagation(); this.install(p) }}>
                ${this.isInstalled(p.id) ? '已安装' : '安装'}
              </button>
            </div>`)}
        </div>
      </div>`
  }

  private renderDetailBody(): TemplateResult {
    const p = this.selected
    switch (this.cfg.detailTab) {
      case '功能特性': return html`
        <div class="intro">${p.detail}</div>
        <div class="ability-box"><h4>插件能力（扩展点）</h4>
          ${p.abilities.map((a) => html`<div class="ability-row"><span class="ok">${sxIcon('checkCircle', 12)}</span>${a}</div>`)}
        </div>`
      case '使用说明': return html`
        <div class="intro">${p.detail}</div>
        <div class="info-table" style="display:grid;gap:6px">
          <div class="hook-row"><code>1. 安装插件</code><span class="d">在插件市场点击「安装插件」</span></div>
          <div class="hook-row"><code>2. 启用插件</code><span class="d">在插件管理中确认状态为「已启用」</span></div>
          <div class="hook-row"><code>3. 使用扩展</code><span class="d">工具栏出现新按钮，或单元格编辑器已注册</span></div>
          <div class="hook-row"><code>4. 调试</code><span class="d">在开发者工具 / 运行日志查看钩子执行情况</span></div>
        </div>`
      case '版本历史': return html`
        <div class="version-item"><div class="v">v${p.version} · 当前版本</div><div class="d">2025-01-16 · 初始发布，支持核心扩展点</div></div>
        <div class="version-item"><div class="v">v0.9.0-beta</div><div class="d">2024-12-20 · 内部测试版本</div></div>`
      default: return html`
        <div class="intro">${p.detail}</div>
        <div class="code-head">
          ${sxIcon('code', 14)} 插件开发示例
          <span class="actions">
            <button class="btn sm" @click=${() => void this.copyCode()}>${this.copied ? sxIcon('check', 11) : sxIcon('copy', 11)} ${this.copied ? '已复制' : '复制代码'}</button>
            <button class="btn primary sm" @click=${() => void this.runExample()} ?disabled=${this.running}>${sxIcon('play', 10)} ${this.running ? '运行中…' : '运行示例'}</button>
          </span>
        </div>
        <pre class="code-box">${PLUGIN_CODE}</pre>
        ${this.runOutput ? html`<pre class="output">${this.runOutput}</pre>` : nothing}
        <div class="ability-box"><h4>插件能力</h4>
          ${p.abilities.map((a) => html`<div class="ability-row"><span class="ok">${sxIcon('checkCircle', 12)}</span>${a}</div>`)}
        </div>`
    }
  }

  private renderDetail(): TemplateResult {
    const p = this.selected
    return html`
      <div class="panel detail">
        <div class="detail-head">
          <span class="p-icon" style=${`background:${p.color}`}>${sxIcon(p.icon, 22)}</span>
          <div><h3>${p.name}</h3><p>${p.desc}</p>
            <div class="meta"><span class="star">★ ${p.rating}</span> · ${p.installs} · 开发者：${p.author}</div>
          </div>
          <div class="detail-actions">
            <button class="btn primary" @click=${() => this.install(p)}>${this.isInstalled(p.id) ? '已安装' : '安装插件'}</button>
            <button class="btn" @click=${() => { this.showDemo = !this.showDemo; toast(this.showDemo ? '效果预览已展开' : '效果预览已收起') }}>${sxIcon('play', 11)} 预览效果</button>
          </div>
        </div>
        <div class="detail-tabs">
          ${DETAIL_TABS.map((t) => html`
            <button class="detail-tab ${this.cfg.detailTab === t ? 'active' : ''}" @click=${() => this.patch('detailTab', t)}>${t}</button>`)}
        </div>
        ${this.showDemo ? html`<div style="padding:10px 14px;background:var(--sx-brand-soft);font-size:11px;color:var(--sx-brand)">效果预览：插件「${p.name}」已注入工具栏按钮与单元格编辑器（演示）</div>` : nothing}
        <div class="detail-body">${this.renderDetailBody()}</div>
      </div>`
  }

  private renderDevTools(): TemplateResult {
    return html`
      <div class="dev-grid">
        <div class="dev-card">
          <h4>${sxIcon('code', 14)} 生命周期钩子</h4>
          ${LIFECYCLE_HOOKS.map((h) => html`
            <div class="hook-row"><code>${h.hook}</code><span class="d">${h.desc}</span></div>`)}
        </div>
        <div class="dev-card">
          <h4>${sxIcon('puzzle', 14)} 扩展点（8 类）</h4>
          ${EXTENSION_POINTS.map((e) => html`
            <div class="hook-row"><code>${e.key}</code><span class="d">${e.desc}</span></div>`)}
        </div>
        <div class="dev-card" style="grid-column:1/-1">
          <h4>${sxIcon('terminal', 14)} 运行日志</h4>
          ${DEBUG_LOGS.map((l) => html`
            <div class="log-line"><span class="t">${l.time}</span><span class="lvl ${l.level}">${l.level}</span><span>${l.msg}</span></div>`)}
        </div>
      </div>`
  }

  private renderRunLogs(): TemplateResult {
    return html`
      <div style="padding:13px">
        ${DEBUG_LOGS.map((l) => html`
          <div class="log-line"><span class="t">${l.time}</span><span class="lvl ${l.level}">${l.level}</span><span>${l.msg}</span></div>`)}
        ${this.runOutput ? html`<div class="output" style="margin-top:10px">${this.runOutput}</div>` : nothing}
      </div>`
  }

  private renderManageTable(): TemplateResult {
    return html`
      <div style="display:flex">
        <table class="manage-table">
          <thead><tr><th style="width:22%">插件名称</th><th style="width:10%">版本</th><th style="width:14%">状态</th><th style="width:20%">安装时间</th><th>操作</th></tr></thead>
          <tbody>
            ${this.cfg.installed.length === 0 ? html`<tr><td colspan="5" style="text-align:center;color:var(--sx-text-hint);padding:18px">暂无已安装插件</td></tr>` : nothing}
            ${this.cfg.installed.map((it) => {
              const p = PLUGINS.find((x) => x.id === it.id)!
              return html`
                <tr>
                  <td><span class="nm"><span class="p-icon" style=${`background:${p.color};width:20px;height:20px;border-radius:5px`}>${sxIcon(p.icon, 11)}</span>${p.name}</span></td>
                  <td>${it.version}</td>
                  <td>${it.enabled ? html`<span class="status-on">${sxIcon('checkCircle', 12)} 已启用</span>` : html`<span class="status-off">${sxIcon('close', 12)} 已停用</span>`}</td>
                  <td style="color:var(--sx-text-hint)">${it.installedAt}</td>
                  <td><div class="ops">
                    <button class="btn sm" @click=${() => this.togglePlugin(it.id)}>${it.enabled ? '禁用' : '启用'}</button>
                    <button class="btn sm" @click=${() => this.uninstall(it.id)}>卸载</button>
                    <button class="btn sm" @click=${() => { this.patch('selected', it.id); toast('已选中 ' + p.name + ' 的设置') }}>设置</button>
                  </div></td>
                </tr>`
            })}
          </tbody>
        </table>
        <div class="dev-tip">
          <h4>${sxIcon('bulb', 15)} 开发者提示</h4>
          <p>SheetX 提供完整的插件开发 API，您可以使用前端技术轻松扩展更多功能。</p>
          <button class="link" @click=${() => this.patch('bottomTab', '开发者工具')}>查看开发文档 →</button>
        </div>
      </div>`
  }

  private renderBottom(): TemplateResult {
    const body = this.cfg.bottomTab === '开发者工具'
      ? this.renderDevTools()
      : this.cfg.bottomTab === '运行日志'
        ? this.renderRunLogs()
        : this.renderManageTable()
    return html`
      <div class="panel bottom">
        <div class="bottom-tabs">
          ${BOTTOM_TABS.map((t) => html`
            <button class="bottom-tab ${this.cfg.bottomTab === t ? 'active' : ''}" @click=${() => this.patch('bottomTab', t)}>${t}</button>`)}
        </div>
        <div class="bottom-body">${body}</div>
      </div>`
  }

  render(): TemplateResult {
    return html`
      <div class="app" data-pdev-theme=${this.theme}>
        ${this.renderTop()}
        <div class="shell">
          ${this.renderSidebar()}
          <div class="main">
            <div class="top-grid">${this.renderMarket()}${this.renderDetail()}</div>
            ${this.renderBottom()}
          </div>
        </div>
      </div>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'plugin-dev-app': PluginDevApp
  }
}
