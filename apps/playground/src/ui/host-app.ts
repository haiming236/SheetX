/**
 * SheetX 第 26 张 · 宿主系统集成与开放 API 调试中心
 *
 * 展示如何接入不同 ERP：数据接口 / 用户上下文 / 权限回调 / 主题配置 / 自定义字体。
 * 左侧 8 项导航切换配置视图，中间 6 标签覆盖全部集成维度，右侧 API 调试中心可真实"运行测试"。
 * 配置持久化到 sx:host-integration；主题主色同步到全局 CSS 变量。
 */
import { LitElement, html, nothing, type TemplateResult } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { baseStyles, lightTokens } from './tokens.js'
import { bindPageTheme, setThemeMode, type ResolvedTheme } from './theme.js'
import { hostStyles } from './host-styles.js'
import { sxIcon, sxLogo } from './icons.js'
import { toast } from './toast.js'
import {
  INTEGRATION_NAV, CONFIG_TABS, MODES, FEATURE_TOGGLES, ERP_PRESETS,
  THEME_PRESETS, FONT_CHOICES, PERM_MODULES, PERM_ACTIONS, API_EXAMPLES, API_TABS, ERROR_LOGS,
  DEFAULT_CONFIG,
  type ConfigTab, type ApiTab, type IntegrationConfig, type HostPlugin,
} from './host-data.js'

const TOP_MENUS = ['表格设计', '数据处理', '插件扩展', '集成配置', '关于']
const STORE_KEY = 'sx:host-integration'

@customElement('host-app')
export class HostApp extends LitElement {
  static styles = [baseStyles, lightTokens, hostStyles]

  @state() private theme: ResolvedTheme = 'light'
  @state() private activeMenu = '集成配置'
  @state() private nav = 'basic'
  @state() private tab: ConfigTab = '基本配置'
  @state() private cfg: IntegrationConfig = this.load()
  @state() private apiTab: ApiTab = '调用示例'
  @state() private running = ''
  @state() private lastResponse: { code: string; response: string; ms: number } | null = null
  @state() private copied = ''
  @state() private editingMap: Record<string, string> = {}
  @state() private newFont = ''

  private stopTheme: (() => void) | null = null
  private timer: number | null = null

  constructor() {
    super()
    this.stopTheme = bindPageTheme((resolved) => { this.theme = resolved })
  }

  connectedCallback(): void {
    super.connectedCallback()
    this.applyBrand()
  }

  disconnectedCallback(): void {
    this.stopTheme?.()
    this.stopTheme = null
    if (this.timer !== null) window.clearTimeout(this.timer)
    super.disconnectedCallback()
  }

  private load(): IntegrationConfig {
    try {
      const raw = localStorage.getItem(STORE_KEY)
      if (raw) return { ...structuredClone(DEFAULT_CONFIG), ...JSON.parse(raw) }
    } catch { /* 忽略 */ }
    return structuredClone(DEFAULT_CONFIG)
  }

  private save(): void {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(this.cfg)) } catch { /* 忽略 */ }
  }

  private patch(key: keyof IntegrationConfig, value: unknown): void {
    this.cfg = { ...this.cfg, [key]: value }
    this.save()
  }

  private applyBrand(): void {
    document.documentElement.style.setProperty('--sx-brand', this.cfg.themeCfg.primary)
    document.documentElement.style.setProperty('--sx-brand-hover', this.cfg.themeCfg.primary)
  }

  private chooseNav(key: string): void {
    this.nav = key
    const tabMap: Record<string, ConfigTab> = {
      basic: '基本配置', data: '数据接口', context: '用户上下文',
      perm: '权限配置', theme: '主题定制', api: '基本配置',
      i18n: '高级选项', plugins: '高级选项',
    }
    if (tabMap[key]) this.tab = tabMap[key]
    if (key === 'api') {
      setTimeout(() => {
        const debug = this.renderRoot.querySelector('.debug') as HTMLElement | null
        debug?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 0)
    }
  }

  private chooseTab(tab: ConfigTab): void {
    this.tab = tab
    const navMap: Partial<Record<ConfigTab, string>> = {
      '数据接口': 'data', '用户上下文': 'context', '权限配置': 'perm', '主题定制': 'theme',
    }
    if (navMap[tab]) this.nav = navMap[tab]!
  }

  private chooseErp(key: string): void {
    const preset = ERP_PRESETS.find((p) => p.key === key) ?? ERP_PRESETS[0]!
    this.cfg = {
      ...this.cfg,
      erp: preset.key,
      baseUrl: preset.baseUrl,
      auth: preset.auth,
    }
    this.save()
    toast(`已切换 ERP 适配器：${preset.name}`)
  }

  private toggleFeature(name: string): void {
    this.patch('features', { ...this.cfg.features, [name]: !this.cfg.features[name] })
  }

  private togglePerm(key: string): void {
    this.patch('perms', { ...this.cfg.perms, [key]: !this.cfg.perms[key] })
  }

  private setUser(key: string, value: string): void {
    this.patch('user', { ...this.cfg.user, [key]: value })
  }

  private setThemeCfg(key: string, value: string | number): void {
    const next = { ...this.cfg.themeCfg, [key]: value } as IntegrationConfig['themeCfg']
    this.cfg = { ...this.cfg, themeCfg: next }
    this.save()
    if (key === 'primary') this.applyBrand()
  }

  private applyThemePreset(key: string): void {
    const p = THEME_PRESETS.find((x) => x.key === key) ?? THEME_PRESETS[0]!
    this.cfg = {
      ...this.cfg,
      theme: p.label,
      themeCfg: { ...this.cfg.themeCfg, preset: p.key, primary: p.primary, fontFamily: p.font },
    }
    this.save()
    this.applyBrand()
    toast(`已应用主题预设：${p.label}`)
  }

  private setI18n(key: string, value: string): void {
    this.patch('i18n', { ...this.cfg.i18n, [key]: value })
  }

  private togglePlugin(name: string): void {
    const plugins = this.cfg.plugins.map((p) => p.name === name ? { ...p, enabled: !p.enabled } : p)
    this.patch('plugins', plugins)
  }

  private reset(): void {
    this.cfg = structuredClone(DEFAULT_CONFIG)
    this.save()
    this.applyBrand()
    toast('已重置全部集成配置')
  }

  private apply(): void {
    this.save()
    this.applyBrand()
    if (this.cfg.themeCfg.preset) setThemeMode(this.theme)
    toast('集成配置已应用到宿主系统')
  }

  private async runExample(key: string): Promise<void> {
    const ex = API_EXAMPLES.find((e) => e.key === key)
    if (!ex) return
    this.running = key
    this.apiTab = '响应结果'
    await new Promise((resolve) => { this.timer = window.setTimeout(resolve, 380) })
    this.lastResponse = { code: ex.code, response: ex.response, ms: ex.ms }
    this.running = ''
    this.timer = null
    if (key === 'setTheme') this.applyThemePreset('modern')
    toast(`运行成功 · ${ex.ms}ms`)
  }

  private async copy(code: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = code
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    this.copied = code
    toast('代码已复制到剪贴板')
    window.setTimeout(() => { this.copied = '' }, 1500)
  }

  /* ================= 渲染 ================= */

  private renderTop(): TemplateResult {
    return html`
      <div class="menu-bar">
        <div class="brand">
          ${sxLogo(22)}
        </div>
        <nav class="menu-list">
          ${TOP_MENUS.map((m) => html`
            <button class="menu-item ${m === this.activeMenu ? 'active' : ''}" @click=${() => {
              this.activeMenu = m
              if (m === '关于') toast('SheetX v1.0.0 · 嵌入式表格引擎')
            }}>
              ${m === '表格设计' ? sxIcon('tableStyle', 14) : m === '数据处理' ? sxIcon('database', 14) :
                m === '插件扩展' ? sxIcon('puzzle', 14) : m === '集成配置' ? sxIcon('settings', 14) : sxIcon('help', 14)}
              ${m}
            </button>`)}
        </nav>
        <div class="menu-right">
          <button class="icon-btn" title="帮助" @click=${() => toast('查看 apps/docs 官方文档')}>${sxIcon('help', 16)}</button>
          <button class="icon-btn" title="设置" @click=${() => this.chooseNav('theme')}>${sxIcon('settings', 16)}</button>
          <div style="display:flex;align-items:center;gap:6px" title="宿主传入的用户上下文">
            <span class="avatar">${this.cfg.user.name.slice(0, 1)}</span>
            <span style="font-size:12px">${this.cfg.user.name}</span>${sxIcon('chevronDown', 12)}
          </div>
        </div>
      </div>`
  }

  private renderSidebar(): TemplateResult {
    return html`
      <aside class="sidebar">
        <div class="side-title">集成方案</div>
        ${INTEGRATION_NAV.map((item) => html`
          <button class="side-item ${this.nav === item.key ? 'active' : ''}" @click=${() => this.chooseNav(item.key)}>
            ${sxIcon(item.icon, 15)} ${item.label}
          </button>`)}
        <div class="guide-card">
          <h4>${sxIcon('help', 15)} 集成指南</h4>
          <p>快速了解如何将 SheetX 集成到您的系统中</p>
          <button class="guide-link" @click=${() => toast('打开集成文档（演示）')}>查看文档 ${sxIcon('arrowRight', 12)}</button>
        </div>
        <div class="side-version">◎ SheetX v1.0.0</div>
      </aside>`
  }

  private renderMode(): TemplateResult {
    return html`
      <div class="section-title">集成模式</div>
      <div class="mode-grid">
        ${MODES.map((m) => html`
          <div class="mode-card ${this.cfg.mode === m.key ? 'on' : ''}" @click=${() => this.patch('mode', m.key)}>
            ${this.cfg.mode === m.key ? html`<span class="badge">${sxIcon('check', 11)}</span>` : nothing}
            <span class="mode-icon">${sxIcon(m.icon, 20)}</span>
            <h4>${m.title}</h4><p>${m.desc}</p>
          </div>`)}
      </div>`
  }

  private renderBasic(): TemplateResult {
    return html`
      ${this.renderMode()}
      <div class="section-title">基本参数</div>
      <div class="param-grid">
        <div>
          <div class="field-row">
            <label>容器选择器</label>
            <input class="input" .value=${this.cfg.selector} @change=${(e: Event) => this.patch('selector', (e.target as HTMLInputElement).value)} />
          </div>
          <div class="field-hint">指定表格容器元素的 CSS 选择器</div>
        </div>
        <div>
          <div class="field-row">
            <label>默认主题</label>
            <select class="select" .value=${this.cfg.theme} @change=${(e: Event) => {
              const v = (e.target as HTMLSelectElement).value
              this.patch('theme', v)
              const p = THEME_PRESETS.find((x) => x.label === v)
              if (p) { this.setThemeCfg('primary', p.primary); this.setThemeCfg('fontFamily', p.font) }
            }}>
              ${THEME_PRESETS.map((p) => html`<option value=${p.label}>${p.label}</option>`)}
            </select>
          </div>
          <div class="field-hint">切换后全局主色同步生效</div>
        </div>
        <div>
          <div class="field-row">
            <label>默认字体</label>
            <select class="select" .value=${this.cfg.font} @change=${(e: Event) => {
              const v = (e.target as HTMLSelectElement).value
              this.patch('font', v)
              this.setThemeCfg('fontFamily', v)
            }}>
              ${FONT_CHOICES.map((f) => html`<option value=${f}>${f}</option>`)}
            </select>
          </div>
        </div>
      </div>
      <div class="section-title">功能开关</div>
      <div class="toggle-grid">
        ${FEATURE_TOGGLES.map((f) => html`
          <label class="check-row">
            <span class="check-box ${this.cfg.features[f] ? 'on' : ''}" @click=${() => this.toggleFeature(f)}>
              ${this.cfg.features[f] ? sxIcon('check', 11) : ''}
            </span>${f}
          </label>`)}
      </div>
      <div class="tip">
        <span class="tip-icon">${sxIcon('bulb', 17)}</span>
        <div><b>集成提示</b><br>SheetX 提供完整的开放 API，支持从宿主系统传入用户信息、数据、权限等，打造无缝的企业级体验。</div>
      </div>`
  }

  private renderData(): TemplateResult {
    const preset = ERP_PRESETS.find((p) => p.key === this.cfg.erp) ?? ERP_PRESETS[0]!
    return html`
      <div class="section-title">目标 ERP 系统</div>
      <div class="erp-grid">
        ${ERP_PRESETS.map((p) => html`
          <div class="erp-card ${this.cfg.erp === p.key ? 'on' : ''}" @click=${() => this.chooseErp(p.key)}>
            <div class="erp-head">
              <span class="erp-logo" style=${`background:${p.color}`}>${p.name.slice(0, 1)}</span>
              <div><h4>${p.name}</h4><span class="vendor">${p.vendor}</span></div>
            </div>
            <div class="endpoint-list">
              <span>GET  ${p.endpoints.list}</span>
              <span>POST ${p.endpoints.save}</span>
              <span>GET  ${p.endpoints.user}</span>
            </div>
          </div>`)}
      </div>
      <div class="section-title">接口参数</div>
      <div class="param-grid">
        <div class="field-row"><label>Base URL</label><input class="input" .value=${this.cfg.baseUrl} @change=${(e: Event) => this.patch('baseUrl', (e.target as HTMLInputElement).value)} /></div>
        <div class="field-row"><label>鉴权方式</label><input class="input" .value=${this.cfg.auth} @change=${(e: Event) => this.patch('auth', (e.target as HTMLInputElement).value)} /></div>
      </div>
      <div class="section-title">字段映射 · ${preset.name}</div>
      <table class="map-table">
        <thead><tr><th style="width:34%">SheetX 字段</th><th>ERP 字段</th></tr></thead>
        <tbody>
          ${preset.fieldMap.map((m) => html`
            <tr><td>${m.sheet}</td><td><input .value=${this.editingMap[m.sheet] ?? m.erp} @change=${(e: Event) => { this.editingMap = { ...this.editingMap, [m.sheet]: (e.target as HTMLInputElement).value }; toast(`字段映射已更新：${m.sheet}`) }} /></td></tr>`)}
        </tbody>
      </table>`
  }

  private renderContext(): TemplateResult {
    const u = this.cfg.user
    const fields: Array<[string, string]> = [
      ['id', '用户 ID'], ['name', '姓名'], ['department', '部门'], ['role', '角色'],
      ['tenant', '租户'], ['locale', '语言'], ['token', '访问令牌'],
    ]
    return html`
      <div class="section-title">宿主用户上下文（SheetX.getUser）</div>
      <div class="param-grid">
        ${fields.map(([key, label]) => html`
          <div class="field-row">
            <label>${label}</label>
            <input class="input" .value=${(u as unknown as Record<string, string>)[key] ?? ''} @change=${(e: Event) => this.setUser(key, (e.target as HTMLInputElement).value)} />
          </div>`)}
      </div>
      <div class="tip">
        <span class="tip-icon">${sxIcon('infoCircle', 17)}</span>
        <div><b>用户上下文契约</b><br>宿主通过 <code>SheetX.setUser(user)</code> 注入；引擎不内置账户系统，权限判定通过回调交给宿主。</div>
      </div>`
  }

  private renderPerm(): TemplateResult {
    return html`
      <div class="section-title">权限回调矩阵（canEdit / canDelete）</div>
      <table class="perm-table">
        <thead><tr><th>模块</th>${PERM_ACTIONS.map((a) => html`<th>${a}</th>`)}</tr></thead>
        <tbody>
          ${PERM_MODULES.map((m) => html`
            <tr>
              <td>${m}</td>
              ${PERM_ACTIONS.map((a) => {
                const key = `${m}|${a}`
                return html`<td><button class="perm-toggle ${this.cfg.perms[key] ? 'on' : ''}" @click=${() => this.togglePerm(key)} aria-label=${`${m} ${a}`}><span class="knob"></span></button></td>`
              })}
            </tr>`)}
        </tbody>
      </table>
      <div class="tip">
        <span class="tip-icon">${sxIcon('lock', 17)}</span>
        <div><b>权限回调</b><br>每次写操作前引擎调用宿主 <code>can('单元格编辑','写')</code>；返回 false 时阻止进入编辑并触发 validation-error。</div>
      </div>`
  }

  private renderTheme(): TemplateResult {
    const t = this.cfg.themeCfg
    return html`
      <div class="section-title">主题预设</div>
      <div class="erp-grid">
        ${THEME_PRESETS.map((p) => html`
          <div class="erp-card ${t.preset === p.key ? 'on' : ''}" @click=${() => this.applyThemePreset(p.key)}>
            <div class="erp-head">
              <span class="erp-logo" style=${`background:${p.primary}`}>Aa</span>
              <div><h4>${p.label}</h4><span class="vendor">${p.primary}</span></div>
            </div>
          </div>`)}
      </div>
      <div class="section-title">主题参数</div>
      <div class="param-grid">
        <div class="field-row"><label>主色调</label><input class="input" type="color" .value=${t.primary} @change=${(e: Event) => this.setThemeCfg('primary', (e.target as HTMLInputElement).value)} style="width:64px;flex:none" /></div>
        <div class="field-row"><label>圆角</label><input class="input" type="number" .value=${String(t.radius)} @change=${(e: Event) => this.setThemeCfg('radius', Number((e.target as HTMLInputElement).value))} /></div>
        <div class="field-row"><label>字体族</label>
          <select class="select" .value=${t.fontFamily} @change=${(e: Event) => this.setThemeCfg('fontFamily', (e.target as HTMLSelectElement).value)}>
            ${FONT_CHOICES.map((f) => html`<option value=${f}>${f}</option>`)}
          </select>
        </div>
        <div class="field-row"><label>字号</label><input class="input" type="number" .value=${String(t.fontSize)} @change=${(e: Event) => this.setThemeCfg('fontSize', Number((e.target as HTMLInputElement).value))} /></div>
      </div>
      <div class="section-title">自定义字体</div>
      <div class="field-row">
        <input class="input" placeholder="输入字体名称，如 SheetX Sans" .value=${this.newFont} @input=${(e: Event) => { this.newFont = (e.target as HTMLInputElement).value }} />
        <button class="btn" @click=${() => {
          if (!this.newFont.trim()) { toast('请输入字体名称'); return }
          this.setThemeCfg('customFont', this.newFont.trim())
          this.setThemeCfg('fontFamily', this.newFont.trim())
          toast(`已加载自定义字体：${this.newFont.trim()}`)
        }}>加载字体</button>
      </div>
      <div class="field-hint" style="padding-left:0">当前自定义字体：${t.customFont}</div>`
  }

  private renderAdvanced(): TemplateResult {
    const i = this.cfg.i18n
    return html`
      <div class="section-title">国际化配置</div>
      <div class="param-grid">
        <div class="field-row"><label>语言</label><select class="select" .value=${i.locale} @change=${(e: Event) => this.setI18n('locale', (e.target as HTMLSelectElement).value)}><option value="zh-CN">简体中文</option><option value="en-US">English</option><option value="ja-JP">日本語</option></select></div>
        <div class="field-row"><label>时区</label><select class="select" .value=${i.timezone} @change=${(e: Event) => this.setI18n('timezone', (e.target as HTMLSelectElement).value)}><option value="Asia/Shanghai">Asia/Shanghai</option><option value="Europe/Brussels">Europe/Brussels</option><option value="America/New_York">America/New_York</option></select></div>
        <div class="field-row"><label>日期格式</label><select class="select" .value=${i.dateFormat} @change=${(e: Event) => this.setI18n('dateFormat', (e.target as HTMLSelectElement).value)}><option>YYYY-MM-DD</option><option>DD/MM/YYYY</option><option>MM/DD/YYYY</option></select></div>
        <div class="field-row"><label>货币</label><select class="select" .value=${i.currency} @change=${(e: Event) => this.setI18n('currency', (e.target as HTMLSelectElement).value)}><option>CNY (¥)</option><option>EUR (€)</option><option>USD ($)</option></select></div>
        <div class="field-row"><label>周起始</label><select class="select" .value=${i.weekStart} @change=${(e: Event) => this.setI18n('weekStart', (e.target as HTMLSelectElement).value)}><option>周一</option><option>周日</option></select></div>
      </div>
      <div class="section-title">自定义插件</div>
      ${this.cfg.plugins.map((p: HostPlugin) => html`
        <div class="plugin-row">
          <span class="name">${p.name}</span>
          <span class="meta">扩展点 ${p.point} · v${p.version}</span>
          <button class="perm-toggle ${p.enabled ? 'on' : ''} switch" @click=${() => this.togglePlugin(p.name)}><span class="knob"></span></button>
        </div>`)}
      <div class="tip">
        <span class="tip-icon">${sxIcon('puzzle', 17)}</span>
        <div><b>开放扩展</b><br>自定义插件通过 8 类扩展点注入；MIT 核心与商业扩展边界清晰，宿主可覆盖内置适配器。</div>
      </div>`
  }

  private renderMain(): TemplateResult {
    const content =
      this.tab === '基本配置' ? this.renderBasic() :
      this.tab === '数据接口' ? this.renderData() :
      this.tab === '用户上下文' ? this.renderContext() :
      this.tab === '权限配置' ? this.renderPerm() :
      this.tab === '主题定制' ? this.renderTheme() : this.renderAdvanced()
    return html`
      <main class="main">
        <div class="main-head">
          <span class="head-icon">${sxIcon('link', 21)}</span>
          <div>
            <h2>宿主系统集成</h2>
            <p>通过开放的集成接口，轻松将 SheetX 嵌入到您的业务系统中</p>
          </div>
          <span class="status-pill"><span class="dot"></span>集成状态：已就绪</span>
        </div>
        <div class="config-tabs" role="tablist">
          ${CONFIG_TABS.map((t) => html`
            <button class="config-tab ${this.tab === t ? 'active' : ''}" role="tab" aria-selected=${this.tab === t} @click=${() => this.chooseTab(t)}>${t}</button>`)}
        </div>
        ${content}
        <div class="main-actions">
          <button class="btn" @click=${() => this.reset()}>${sxIcon('refresh', 14)} 重置配置</button>
          <button class="btn primary" @click=${() => this.apply()}>${sxIcon('play', 13)} 应用配置</button>
        </div>
      </main>`
  }

  private renderDebug(): TemplateResult {
    return html`
      <aside class="debug">
        <div class="debug-head">${sxIcon('terminal', 17)} API 调试中心
          <span class="online"><span class="dot"></span>在线</span>
        </div>
        <div class="api-tabs" role="tablist">
          ${API_TABS.map((t) => html`
            <button class="api-tab ${this.apiTab === t ? 'active' : ''}" @click=${() => { this.apiTab = t }}>${t}</button>`)}
        </div>
        ${this.apiTab === '调用示例' ? API_EXAMPLES.map((ex) => html`
          <div class="api-card">
            <div class="api-card-head">
              <h4>${ex.title}</h4>
              <button class="run-btn" @click=${() => void this.runExample(ex.key)}>
                ${this.running === ex.key ? '运行中…' : '运行测试'} ${sxIcon('play', 10)}
              </button>
            </div>
            <p>${ex.desc}</p>
            <div class="code-box">
              <button class="code-copy" title="复制代码" @click=${() => void this.copy(ex.code)}>${this.copied === ex.code ? sxIcon('check', 12) : sxIcon('copy', 12)}</button>${ex.code}
            </div>
          </div>`) : nothing}
        ${this.apiTab === '响应结果' ? (this.lastResponse
          ? html`<div class="api-card">
              <div class="api-card-head"><h4>最近一次响应</h4><span style="margin-left:auto;font-size:10px;color:var(--sx-text-hint)">${this.lastResponse.ms}ms</span></div>
              <pre class="resp-box">${this.lastResponse.response}</pre>
              <button class="run-btn" style="margin-top:10px" @click=${() => void this.copy(this.lastResponse!.response)}>${sxIcon('copy', 11)} 复制响应</button>
            </div>`
          : html`<div class="api-card"><p>暂无响应，请先在「调用示例」中运行测试。</p></div>`) : nothing}
        ${this.apiTab === '错误日志' ? ERROR_LOGS.map((log) => html`
          <div class="log-row">
            <span class="time">${log.time}</span>
            <span class="level ${log.level}">${log.level}</span>
            <span class="msg">${log.msg}</span>
          </div>`) : nothing}
        ${this.apiTab === '调用示例' ? html`
          <div class="success-card">
            ${sxIcon('checkCircle', 18)}
            <div><div class="txt">测试成功</div><div class="sub">响应时间：${this.lastResponse?.ms ?? 82}ms</div></div>
            <a class="detail" href="#" @click=${(e: Event) => { e.preventDefault(); this.apiTab = '响应结果' }}>查看详情 →</a>
          </div>` : nothing}
      </aside>`
  }

  render(): TemplateResult {
    return html`
      <div class="app" data-host-theme=${this.theme}>
        ${this.renderTop()}
        <div class="shell">
          ${this.renderSidebar()}
          ${this.renderMain()}
          ${this.renderDebug()}
        </div>
      </div>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'host-app': HostApp
  }
}
