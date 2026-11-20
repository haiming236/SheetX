/**
 * SheetX 第 24 张 · 插件中心与扩展生态
 *
 * 设计稿范围：插件市场 / 分类 / 搜索排序 / 安装管理 / 开发者工具，
 * 并向下展开真实架构：自定义编辑器、渲染扩展、数据适配器与第三方集成。
 * 数据逻辑与 @sheetx/core/plugin-runtime 同构，安装状态与集成状态持久化。
 */
import { LitElement, html, nothing, type TemplateResult } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { baseStyles, lightTokens } from './tokens.js'
import { bindPageTheme } from './theme.js'
import { pluginStyles } from './plugin-styles.js'
import { sxIcon, sxLogo, type IconName } from './icons.js'
import { toast } from './toast.js'
import {
  PLUGINS, COMMUNITY_PLUGINS, PLUGIN_CATEGORIES, SORT_OPTIONS, EXTENSION_POINTS,
  INTEGRATIONS, DEV_GUIDE_STEPS, DEV_API_ITEMS, DEV_EXAMPLE, EP_LABELS,
  filterPlugins, resolveInstallOrder, initialPluginStates, installedCount,
  type PluginItem, type PluginState, type PluginCategory, type PluginSort,
  type ExtensionPoint,
} from './plugin-data.js'

const TOP_MENUS = ['文件', '开始', '插入', '数据', '公式', '视图', '扩展', '设置']
const STATE_KEY = 'sx:plugin-states'
const CUSTOM_KEY = 'sx:custom-plugins'
const INTEGRATION_KEY = 'sx:plugin-integrations'

type Section = 'market' | 'installed' | 'architecture'
type DevTab = 'guide' | 'example' | 'api' | 'debug'

interface FeatureCommand {
  label: string
  hint: string
  icon: IconName
  action: string
}

const FEATURE_COMMANDS: FeatureCommand[] = [
  { label: '搜索插件', hint: '插件中心', icon: 'search', action: 'focus-plugin' },
  { label: '查看已安装插件', hint: '安装管理', icon: 'package', action: 'installed' },
  { label: '扩展管理', hint: '架构视图', icon: 'puzzle', action: 'architecture' },
  { label: '插件开发指南', hint: '开发者工具', icon: 'code', action: 'dev-guide' },
  { label: 'API 参考', hint: '开发者工具', icon: 'terminal', action: 'dev-api' },
  { label: '调试与预览', hint: '开发者工具', icon: 'play', action: 'dev-debug' },
  { label: '自定义编辑器', hint: '扩展点', icon: 'edit', action: 'ep-editor' },
  { label: '渲染扩展', hint: '扩展点', icon: 'palette', action: 'ep-renderer' },
  { label: '数据适配器', hint: '扩展点', icon: 'database', action: 'ep-dataAdapter' },
]

const HERO_SLIDES = [
  { title: '扩展无限可能', desc: '通过插件快速集成更多功能：数据连接、AI 助手、专业图表、业务组件等' },
  { title: '自定义每一步', desc: '编辑器 / 渲染器 / 格式化器注册即生效，核心引擎保持零依赖' },
  { title: '连接你的业务', desc: 'ERP、OA、数据库与大模型通过统一适配器接入，数据可拉取也可回写' },
]

@customElement('plugin-app')
export class PluginApp extends LitElement {
  static styles = [baseStyles, lightTokens, pluginStyles]

  @state() private theme: 'light' | 'dark' = 'light'
  @state() private activeMenu = '扩展'
  @state() private section: Section = 'market'
  @state() private query = ''
  @state() private featureQuery = ''
  @state() private category: '全部插件' | PluginCategory = '全部插件'
  @state() private sort: PluginSort = 'recommended'
  @state() private states: Record<string, PluginState> = this.loadStates()
  @state() private customPlugins: PluginItem[] = this.loadCustomPlugins()
  @state() private integrations: Record<string, boolean> = this.loadIntegrations()
  @state() private heroIndex = 0
  @state() private cardMenu: string | null = null
  @state() private detailId: string | null = null
  @state() private showCommunity = false
  @state() private devOpen = false
  @state() private devExpanded = false
  @state() private devTab: DevTab = 'guide'
  @state() private showNewPlugin = false
  @state() private newName = ''
  @state() private newPoint: ExtensionPoint = 'editor'
  @state() private epKey: ExtensionPoint = 'editor'
  @state() private diagnosticLines: string[] = []
  @state() private rating = 0
  @state() private updateProgress = 0

  private stopTheme: (() => void) | null = null
  private updateTimer: number | null = null

  constructor() {
    super()
    this.stopTheme = bindPageTheme((resolved) => { this.theme = resolved; this.requestUpdate() })
  }

  disconnectedCallback(): void {
    if (this.updateTimer !== null) window.clearInterval(this.updateTimer)
    this.updateTimer = null
    this.stopTheme?.()
    this.stopTheme = null
    super.disconnectedCallback()
  }

  /* ---------------- 数据 ---------------- */

  private get allPlugins(): PluginItem[] {
    return [...PLUGINS, ...this.customPlugins]
  }

  private get installedIds(): Set<string> {
    return new Set(Object.entries(this.states).filter(([, state]) => state.installed).map(([id]) => id))
  }

  private get enabledIds(): Set<string> {
    return new Set(Object.entries(this.states)
      .filter(([, state]) => state.installed && state.enabled)
      .map(([id]) => id))
  }

  private get visiblePlugins(): PluginItem[] {
    return filterPlugins(this.allPlugins, { query: this.query, category: this.category, sort: this.sort })
  }

  private get installedPlugins(): PluginItem[] {
    const installed = this.installedIds
    return this.allPlugins.filter((plugin) => installed.has(plugin.id))
  }

  private get detailPlugin(): PluginItem | undefined {
    return [...this.allPlugins, ...COMMUNITY_PLUGINS].find((plugin) => plugin.id === this.detailId)
  }

  private get featureResults(): FeatureCommand[] {
    const keyword = this.featureQuery.trim().toLocaleLowerCase()
    if (!keyword) return []
    return FEATURE_COMMANDS.filter((command) =>
      `${command.label} ${command.hint}`.toLocaleLowerCase().includes(keyword)).slice(0, 6)
  }

  private get extensionCounts(): Map<ExtensionPoint, number> {
    const counts = new Map<ExtensionPoint, number>()
    for (const plugin of this.installedPlugins) {
      const state = this.states[plugin.id]
      if (!state?.enabled) continue
      for (const point of plugin.extensionPoints) counts.set(point, (counts.get(point) ?? 0) + 1)
    }
    return counts
  }

  private get activationOrder(): ReturnType<typeof resolveInstallOrder> {
    return resolveInstallOrder(this.allPlugins, this.enabledIds)
  }

  private loadStates(): Record<string, PluginState> {
    const base = initialPluginStates()
    try {
      const parsed = JSON.parse(localStorage.getItem(STATE_KEY) ?? 'null') as Record<string, PluginState> | null
      if (parsed && typeof parsed === 'object') {
        for (const [id, state] of Object.entries(parsed)) {
          if (state && typeof state.installed === 'boolean' && typeof state.enabled === 'boolean') {
            base[id] = { installed: state.installed, enabled: state.installed && state.enabled, installedAt: state.installedAt }
          }
        }
      }
    } catch { /* 存储不可用就用默认状态 */ }
    return base
  }

  private loadCustomPlugins(): PluginItem[] {
    try {
      const parsed = JSON.parse(localStorage.getItem(CUSTOM_KEY) ?? '[]')
      return Array.isArray(parsed) ? parsed as PluginItem[] : []
    } catch {
      return []
    }
  }

  private loadIntegrations(): Record<string, boolean> {
    const base: Record<string, boolean> = {}
    for (const item of INTEGRATIONS) base[item.id] = item.status === 'connected'
    try {
      const parsed = JSON.parse(localStorage.getItem(INTEGRATION_KEY) ?? 'null') as Record<string, boolean> | null
      if (parsed && typeof parsed === 'object') return { ...base, ...parsed }
    } catch { /* 忽略 */ }
    return base
  }

  private persistStates(): void {
    try { localStorage.setItem(STATE_KEY, JSON.stringify(this.states)) } catch { /* 忽略 */ }
  }

  private persistCustom(): void {
    try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(this.customPlugins)) } catch { /* 忽略 */ }
  }

  private persistIntegrations(): void {
    try { localStorage.setItem(INTEGRATION_KEY, JSON.stringify(this.integrations)) } catch { /* 忽略 */ }
  }

  /* ---------------- 交互 ---------------- */

  private setSection(section: Section): void {
    this.section = section
    this.cardMenu = null
  }

  private runFeature(command: FeatureCommand): void {
    this.featureQuery = ''
    switch (command.action) {
      case 'focus-plugin':
        this.setSection('market')
        requestAnimationFrame(() => {
          const input = this.renderRoot.querySelector<HTMLInputElement>('.market-search input')
          input?.focus()
        })
        break
      case 'installed': this.setSection('installed'); break
      case 'architecture': this.setSection('architecture'); break
      case 'dev-guide': this.openDev('guide'); break
      case 'dev-api': this.openDev('api'); break
      case 'dev-debug': this.openDev('debug'); break
      default:
        if (command.action.startsWith('ep-')) {
          this.epKey = command.action.slice(3) as ExtensionPoint
          this.setSection('architecture')
        }
    }
  }

  private openDev(tab: DevTab): void {
    this.devOpen = true
    this.devTab = tab
  }

  private installPlugin(id: string): void {
    const plugin = this.allPlugins.find((item) => item.id === id)
    if (!plugin) return
    const next = { ...this.states }
    const auto: string[] = []
    for (const dep of plugin.dependencies ?? []) {
      if (!next[dep]?.installed) {
        const depPlugin = this.allPlugins.find((item) => item.id === dep)
        next[dep] = { installed: true, enabled: true, installedAt: new Date().toISOString().slice(0, 10) }
        auto.push(depPlugin?.name ?? dep)
      }
    }
    next[id] = { installed: true, enabled: true, installedAt: new Date().toISOString().slice(0, 10) }
    this.states = next
    this.persistStates()
    toast(auto.length > 0 ? `已安装 ${plugin.name}，并自动安装依赖：${auto.join('、')}` : `已安装 ${plugin.name}`)
  }

  private toggleInstall(id: string): void {
    const plugin = this.allPlugins.find((item) => item.id === id)
    if (!plugin) return
    if (this.states[id]?.installed) {
      this.detailId = id
      this.cardMenu = null
      return
    }
    this.installPlugin(id)
  }

  private uninstallPlugin(id: string): void {
    if (!this.states[id]?.installed) return
    const dependent = this.installedPlugins.find((plugin) => plugin.dependencies?.includes(id))
    if (dependent) {
      toast(`无法卸载：${dependent.name} 依赖此插件`)
      return
    }
    this.states = { ...this.states, [id]: { installed: false, enabled: false } }
    this.persistStates()
    this.detailId = null
    toast('插件已卸载，扩展注册已同步移除')
  }

  private toggleEnabled(id: string): void {
    const state = this.states[id]
    if (!state?.installed) return
    this.states = { ...this.states, [id]: { ...state, enabled: !state.enabled } }
    this.persistStates()
    toast(`${this.allPlugins.find((item) => item.id === id)?.name ?? id} 已${state.enabled ? '停用' : '启用'}`)
  }

  private updateAll(): void {
    if (this.updateTimer !== null) return
    if (this.installedPlugins.length === 0) { toast('暂无已安装插件'); return }
    this.updateProgress = 4
    this.updateTimer = window.setInterval(() => {
      this.updateProgress = Math.min(100, this.updateProgress + 8)
      if (this.updateProgress >= 100) {
        if (this.updateTimer !== null) window.clearInterval(this.updateTimer)
        this.updateTimer = null
        toast(`已检查 ${this.installedPlugins.length} 个插件，均为最新版本`)
      }
    }, 110)
  }

  private connectIntegration(id: string): void {
    const next = { ...this.integrations, [id]: !this.integrations[id] }
    this.integrations = next
    this.persistIntegrations()
    const item = INTEGRATIONS.find((entry) => entry.id === id)
    toast(`${item?.name ?? id} ${next[id] ? '已连接' : '已断开'}`)
  }

  private async copyCode(code: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(code)
      toast('代码已复制到剪贴板')
    } catch {
      toast('当前环境不支持剪贴板，请手动选择复制')
    }
  }

  private runDiagnostic(): void {
    const counts = this.extensionCounts
    const lines: string[] = []
    for (const plugin of this.installedPlugins) {
      const state = this.states[plugin.id]
      const points = plugin.extensionPoints.map((point) => EP_LABELS[point]).join(' / ') || '无'
      lines.push(`${state?.enabled ? '[OK]  ' : '[SKIP]'} ${plugin.name} · ${points} · ${state?.enabled ? 'steady' : 'disabled'}`)
    }
    const total = [...counts.values()].reduce((sum, count) => sum + count, 0)
    lines.push(`[INFO] 扩展点 ${counts.size} 类 / 注册 ${total} 项`)
    lines.push(`[INFO] 加载顺序：${this.activationOrder.map((item) => item.name).join(' → ') || '无'}`)
    this.diagnosticLines = lines
    toast(lines.some((line) => line.startsWith('[SKIP]')) ? '诊断完成：存在已停用插件' : '诊断完成：全部已启用插件就绪')
  }

  private createPlugin(): void {
    const name = this.newName.trim() || `我的插件 ${this.customPlugins.length + 1}`
    const plugin: PluginItem = {
      id: `custom_${Date.now().toString(36)}`,
      name,
      version: '0.1.0',
      category: '效率工具',
      desc: '本地创建的插件脚手架，可在开发者工具中继续编辑 manifest 与生命周期。',
      rating: 0,
      downloads: 0,
      icon: 'code',
      accent: '#6366f1',
      installed: true,
      publisher: '我',
      extensionPoints: [this.newPoint],
      permissions: ['仅本地调试'],
      changelog: '初始脚手架版本。',
      updatedAt: new Date().toISOString().slice(0, 10),
    }
    this.customPlugins = [...this.customPlugins, plugin]
    this.states = {
      ...this.states,
      [plugin.id]: { installed: true, enabled: true, installedAt: plugin.updatedAt },
    }
    this.persistCustom()
    this.persistStates()
    this.showNewPlugin = false
    this.newName = ''
    this.setSection('installed')
    toast(`已创建插件脚手架：${name}`)
  }

  private installFromCommunity(id: string): void {
    if (this.allPlugins.some((plugin) => plugin.id === id)) {
      this.installPlugin(id)
      return
    }
    const source = COMMUNITY_PLUGINS.find((plugin) => plugin.id === id)
    if (!source) return
    const plugin = { ...source, installed: true, installedAt: new Date().toISOString().slice(0, 10) } as PluginItem & { installedAt?: string }
    this.customPlugins = [...this.customPlugins, plugin]
    this.states = { ...this.states, [id]: { installed: true, enabled: true } }
    this.persistCustom()
    this.persistStates()
    toast(`已安装社区插件：${plugin.name}`)
  }

  /* ---------------- 渲染 ---------------- */

  private renderTopbar(): TemplateResult {
    return html`
      <header class="topbar">
        <span class="brand">${sxLogo()}</span>
        <nav class="top-menus">
          ${TOP_MENUS.map((menu) => html`
            <button class="top-menu ${menu === this.activeMenu ? 'active' : ''}" @click=${() => {
              this.activeMenu = menu
              if (menu === '扩展') this.setSection('market')
              else if (menu === '视图') this.setSection('architecture')
              else toast(`已切换到「${menu}」菜单`)
            }}>${menu}</button>`)}
        </nav>
        <div class="top-right">
          <label class="search-box">
            ${sxIcon('search', 14)}
            <input placeholder="搜索功能..." .value=${this.featureQuery}
              @input=${(event: Event) => { this.featureQuery = (event.target as HTMLInputElement).value }}
              @keydown=${(event: KeyboardEvent) => { if (event.key === 'Escape') this.featureQuery = '' }} />
          </label>
          <button class="avatar" title="账户与帮助" @click=${() => toast('当前为本地演示账户 · ID')}>ID</button>
          ${this.featureResults.length > 0 ? html`
            <div class="feature-results">
              ${this.featureResults.map((command) => html`
                <button class="feature-result" @click=${() => this.runFeature(command)}>
                  ${sxIcon(command.icon, 14)} ${command.label}
                  <span class="fr-go">${command.hint}</span>
                </button>`)}
            </div>` : nothing}
        </div>
      </header>`
  }

  private renderSidebar(): TemplateResult {
    const count = installedCount(this.states)
    return html`
      <aside class="sidebar">
        <div class="side-title">扩展与插件</div>
        <button class="side-item ${this.section === 'market' ? 'active' : ''}" @click=${() => this.setSection('market')}>
          ${sxIcon('puzzle', 15)} 插件中心
        </button>
        <button class="side-item ${this.section === 'installed' ? 'active' : ''}" @click=${() => this.setSection('installed')}>
          ${sxIcon('package', 15)} 已安装插件 <span class="side-badge">${count}</span>
        </button>
        <button class="side-item ${this.devOpen ? 'active' : ''}" @click=${() => { this.devExpanded = !this.devExpanded }}>
          ${sxIcon('code', 15)} 开发者工具
          <span class="side-caret ${this.devExpanded ? 'open' : ''}">${sxIcon('chevronRight', 12)}</span>
        </button>
        ${this.devExpanded ? html`
          <button class="side-item side-sub" @click=${() => this.openDev('guide')}>插件开发指南</button>
          <button class="side-item side-sub" @click=${() => this.openDev('example')}>示例工程</button>
          <button class="side-item side-sub" @click=${() => this.openDev('api')}>API 参考</button>
          <button class="side-item side-sub" @click=${() => this.openDev('debug')}>调试与预览</button>
        ` : nothing}
        <div class="side-div"></div>
        <button class="side-item ${this.section === 'architecture' ? 'active' : ''}" @click=${() => this.setSection('architecture')}>
          ${sxIcon('sliders', 15)} 扩展管理
        </button>
        <div class="side-art">
          <svg width="118" height="76" viewBox="0 0 118 76" fill="none" aria-hidden="true">
            <rect x="8" y="12" width="52" height="52" rx="9" fill="#3b82f6" opacity=".16"/>
            <rect x="18" y="22" width="35" height="32" rx="6" fill="#3b82f6" opacity=".28"/>
            <path d="M60 35h9M69 35v10h9" stroke="#94a3b8" stroke-width="2" stroke-dasharray="3 3"/>
            <path d="M82 21a6 6 0 0 1 12 0h7a4 4 0 0 1 4 4v7h-4a5 5 0 0 0 0 10h4v10a4 4 0 0 1-4 4h-8v-4a5 5 0 0 0-10 0v4H77a4 4 0 0 1-4-4v-8h4a5 5 0 0 0 0-10h-4v-9a4 4 0 0 1 4-4h5z" fill="#3b82f6" opacity=".55"/>
          </svg>
        </div>
        <div class="side-art-text">扩展 SheetX 的能力<br />通过插件与扩展，快速接入更多数据源、函数、渲染与业务功能。</div>
      </aside>`
  }

  private renderHero(): TemplateResult {
    const slide = HERO_SLIDES[this.heroIndex]!
    return html`
      <div class="hero">
        <div class="hero-copy">
          <h2>${slide.title}</h2>
          <p>${slide.desc}</p>
        </div>
        <svg class="hero-art" width="248" height="96" viewBox="0 0 248 96" fill="none" aria-hidden="true">
          <rect x="8" y="10" width="118" height="76" rx="9" fill="#ffffff" fill-opacity=".76" stroke="#bfd0f5"/>
          <rect x="8" y="10" width="118" height="16" rx="9" fill="#e8efff"/>
          <circle cx="21" cy="18" r="2.4" fill="#f87171"/><circle cx="30" cy="18" r="2.4" fill="#fbbf24"/><circle cx="39" cy="18" r="2.4" fill="#34d399"/>
          <rect x="20" y="36" width="46" height="6" rx="3" fill="#93b4f7"/><rect x="20" y="49" width="74" height="5" rx="2.5" fill="#d8e3f8"/>
          <rect x="20" y="61" width="62" height="5" rx="2.5" fill="#d8e3f8"/><rect x="20" y="73" width="70" height="5" rx="2.5" fill="#d8e3f8"/>
          <path d="M132 48h19" stroke="#9ab4e8" stroke-width="2" stroke-dasharray="4 4"/>
          <path d="M178 24a8 8 0 0 1 16 0h9a5 5 0 0 1 5 5v9h-5a7 7 0 0 0 0 14h5v11a5 5 0 0 1-5 5h-10v-5a7 7 0 0 0-14 0v5h-10a5 5 0 0 1-5-5V52h5a7 7 0 0 0 0-14h-5V29a5 5 0 0 1 5-5h9z" fill="#3b82f6" fill-opacity=".85"/>
          <path d="m191 41-4 8 7-1-2 8 9-11-7 1 3-6z" fill="#fff"/>
        </svg>
        <div class="hero-dots">
          ${HERO_SLIDES.map((_, index) => html`
            <button class="hero-dot ${index === this.heroIndex ? 'active' : ''}" title="第 ${index + 1} 张"
              @click=${() => { this.heroIndex = index }}></button>`)}
        </div>
      </div>`
  }

  private renderPluginCard(plugin: PluginItem): TemplateResult {
    const installed = Boolean(this.states[plugin.id]?.installed)
    return html`
      <article class="plugin-card" @click=${() => { this.detailId = plugin.id }}>
        <div class="p-head">
          <span class="p-icon" style="background:${plugin.accent}">${sxIcon(plugin.icon, 19)}</span>
          <div class="p-name">
            <b>${plugin.name}</b>
            ${plugin.recommended ? html`<span class="p-rec">推荐</span>` : nothing}
            <span class="p-ver">v${plugin.version}</span>
          </div>
          <button class="p-more" title="更多操作" @click=${(event: Event) => {
            event.stopPropagation()
            this.cardMenu = this.cardMenu === plugin.id ? null : plugin.id
          }}>${sxIcon('more', 15)}</button>
        </div>
        <p class="p-desc">${plugin.desc}</p>
        <div class="p-points">
          ${plugin.extensionPoints.slice(0, 3).map((point) => html`<span class="p-point">${EP_LABELS[point]}</span>`)}
        </div>
        <div class="p-foot">
          <span class="p-rating">★ ${plugin.rating.toFixed(1)} <em>(${plugin.downloads.toLocaleString()})</em></span>
          <button class="p-install ${installed ? 'done' : ''}" @click=${(event: Event) => {
            event.stopPropagation()
            this.toggleInstall(plugin.id)
          }}>
            ${installed ? html`${sxIcon('check', 13)} 已安装` : html`${sxIcon('download', 13)} 安装`}
          </button>
        </div>
        ${this.cardMenu === plugin.id ? html`
          <div class="card-menu" @click=${(event: Event) => event.stopPropagation()}>
            <button @click=${() => { this.detailId = plugin.id; this.cardMenu = null }}>查看详情</button>
            <button @click=${() => { this.epKey = plugin.extensionPoints[0] ?? 'command'; this.setSection('architecture'); toast('已定位到扩展点') }}>查看扩展点</button>
            <button @click=${() => { this.copyCode(`import { ${plugin.id.replace(/-/g, '_')} } from '@sheetx/plugins'`); this.cardMenu = null }}>复制引入代码</button>
            <button @click=${() => { this.uninstallPlugin(plugin.id); this.cardMenu = null }}>卸载插件</button>
          </div>` : nothing}
      </article>`
  }

  private renderMarket(): TemplateResult {
    return html`
      <div class="page-head">
        <span class="page-icon">${sxIcon('puzzle', 20)}</span>
        <div>
          <div class="page-title">插件中心</div>
          <div class="page-sub">发现并安装扩展插件，增强 SheetX 的数据处理、可视化与业务集成能力。</div>
        </div>
        <label class="market-search">
          ${sxIcon('search', 14)}
          <input placeholder="搜索插件（如：图表、数据库、AI...）" .value=${this.query}
            @input=${(event: Event) => { this.query = (event.target as HTMLInputElement).value }} />
          ${this.query ? html`<button class="clear-btn" title="清空" @click=${() => { this.query = '' }}>${sxIcon('close', 12)}</button>` : nothing}
        </label>
      </div>
      ${this.renderHero()}
      <div class="cat-row">
        ${PLUGIN_CATEGORIES.map((category) => html`
          <button class="cat ${this.category === category ? 'active' : ''}" @click=${() => { this.category = category }}>
            ${category}
          </button>`)}
        <span class="sort-wrap">
          <select class="sort-select" .value=${this.sort} @change=${(event: Event) => {
            this.sort = (event.target as HTMLSelectElement).value as PluginSort
          }}>
            ${SORT_OPTIONS.map((option) => html`<option value=${option.key}>${option.label}</option>`)}
          </select>
        </span>
      </div>
      <div class="plugin-grid">
        ${this.visiblePlugins.map((plugin) => this.renderPluginCard(plugin))}
        ${this.visiblePlugins.length === PLUGINS.length + this.customPlugins.length ? html`
          <article class="plugin-card more-card" @click=${() => { this.showCommunity = true }}>
            <span class="p-icon" style="background:linear-gradient(135deg,#60a5fa,#a78bfa)">${sxIcon('puzzle', 19)}</span>
            <div class="more-title">更多插件</div>
            <div class="more-desc">浏览更多社区插件与第三方扩展，<br />或发布你自己的插件到 SheetX 生态。</div>
            <button class="more-btn" @click=${(event: Event) => { event.stopPropagation(); this.showCommunity = true }}>
              前往社区插件市场 ${sxIcon('arrowRight', 13)}
            </button>
          </article>` : nothing}
        ${this.visiblePlugins.length === 0 ? html`
          <div class="empty">没有匹配的插件，试试其它关键词或切换分类。</div>` : nothing}
      </div>
      ${this.renderIntegrations()}
    `
  }

  private renderIntegrations(): TemplateResult {
    return html`
      <div class="section-head">
        ${sxIcon('plug', 15)} 第三方功能集成
        <span class="st">通过已安装插件连接外部系统，凭据由宿主托管，插件只拿到受限调用句柄</span>
        <span class="right"><button class="mini-btn" @click=${() => this.setSection('architecture')}>查看架构 ${sxIcon('arrowRight', 12)}</button></span>
      </div>
      <div class="int-grid">
        ${INTEGRATIONS.map((item) => {
          const connected = Boolean(this.integrations[item.id])
          return html`
            <div class="int-card">
              <div class="int-top">
                <span class="int-icon" style="background:${item.color}">${sxIcon(item.icon, 16)}</span>
                <span class="int-name">${item.name}</span>
                <span class="int-cat">${item.category}</span>
              </div>
              <p class="int-desc">${item.desc}</p>
              <div class="int-foot">
                <span class="int-state ${connected ? 'on' : ''}">${sxIcon(connected ? 'checkCircle' : 'link', 12)} ${connected ? '已连接' : '未连接'}</span>
                <button class="int-connect ${connected ? 'connected' : ''}" @click=${() => this.connectIntegration(item.id)}>
                  ${connected ? '断开' : '连接'}
                </button>
              </div>
            </div>`
        })}
      </div>
    `
  }

  private renderInstalled(): TemplateResult {
    const plugins = this.installedPlugins
    return html`
      <div class="page-head">
        <span class="page-icon">${sxIcon('package', 20)}</span>
        <div>
          <div class="page-title">已安装插件</div>
          <div class="page-sub">共 ${plugins.length} 个插件 · 停用只移除扩展注册，不删除插件文件。</div>
        </div>
        <span class="right" style="margin-left:auto;display:flex;gap:6px">
          <button class="mini-btn" @click=${() => this.setSection('market')}>${sxIcon('plus', 13)} 安装更多</button>
          <button class="mini-btn primary" @click=${this.updateAll}>${sxIcon('refresh', 13)} 检查更新</button>
        </span>
      </div>
      ${this.updateProgress > 0 && this.updateProgress < 100 ? html`
        <div class="progress-line"><i style="width:${this.updateProgress}%"></i></div>` : nothing}
      <div class="installed-panel">
        <div class="ins-head">
          <span>插件</span><span>扩展点</span><span>状态</span><span>启用</span><span style="text-align:right">操作</span>
        </div>
        ${plugins.map((plugin) => {
          const state = this.states[plugin.id]!
          return html`
            <div class="ins-row">
              <div class="ins-name">
                <span class="p-icon" style="background:${plugin.accent}">${sxIcon(plugin.icon, 15)}</span>
                <div><b>${plugin.name}</b><div class="ins-meta">v${plugin.version} · ${plugin.publisher} · ${state.installedAt ?? '—'}</div></div>
              </div>
              <div class="ins-meta">${plugin.extensionPoints.map((point) => EP_LABELS[point]).join(' / ')}</div>
              <div><span class="status-tag ${state.enabled ? '' : 'off'}">${state.enabled ? '运行中' : '已停用'}</span></div>
              <div><button class="switch ${state.enabled ? 'on' : ''}" title="${state.enabled ? '停用' : '启用'}" @click=${() => this.toggleEnabled(plugin.id)}></button></div>
              <div class="ins-actions">
                <button class="mini-btn" @click=${() => { this.detailId = plugin.id }}>详情</button>
                <button class="mini-btn" @click=${() => this.uninstallPlugin(plugin.id)}>卸载</button>
              </div>
            </div>`
        })}
        ${plugins.length === 0 ? html`<div class="empty">还没有安装插件，前往插件中心挑选扩展吧。</div>` : nothing}
      </div>
      <div class="section-head">${sxIcon('shieldCheck', 15)} 安全边界</div>
      <div class="arch-tags">
        <span class="chip">权限清单：插件只申请必要能力</span>
        <span class="chip">凭据托管：宿主代理外部请求</span>
        <span class="chip">依赖校验：缺失 / 循环依赖拒绝加载</span>
        <span class="chip">错误隔离：单插件失败不影响表格</span>
      </div>
    `
  }

  private renderArchitecture(): TemplateResult {
    const counts = this.extensionCounts
    const selected = EXTENSION_POINTS.find((point) => point.key === this.epKey) ?? EXTENSION_POINTS[0]!
    const pointPlugins = this.installedPlugins.filter((plugin) => plugin.extensionPoints.includes(selected.key))
    return html`
      <div class="page-head">
        <span class="page-icon">${sxIcon('sliders', 20)}</span>
        <div>
          <div class="page-title">扩展管理</div>
          <div class="page-sub">宿主只依赖契约层，插件通过扩展点注入能力；加载顺序由依赖拓扑决定。</div>
        </div>
        <span class="right" style="margin-left:auto;display:flex;gap:6px">
          <button class="mini-btn" @click=${() => this.openDev('api')}>${sxIcon('code', 13)} API 参考</button>
          <button class="mini-btn primary" @click=${this.runDiagnostic}>${sxIcon('play', 13)} 运行诊断</button>
        </span>
      </div>
      <div class="arch-flow">
        <div class="arch-box">
          <div class="at">${sxIcon('laptop', 15)} 宿主应用</div>
          <div class="ad">Grid / Spreadsheet / Web Component<br />只认识契约，不直接依赖插件实现</div>
          <div class="arch-tags"><span class="arch-tag">Lit UI</span><span class="arch-tag">Web Components</span></div>
        </div>
        <span class="arch-arrow">${sxIcon('arrowRight', 18)}</span>
        <div class="arch-box runtime">
          <div class="at">${sxIcon('puzzle', 15)} 插件运行时</div>
          <div class="ad">目录 / 安装状态 / 依赖排序 / 生命周期<br />错误隔离与扩展点账本</div>
          <div class="arch-tags"><span class="arch-tag">IPlugin</span><span class="arch-tag">PluginRuntime</span></div>
        </div>
        <span class="arch-arrow">${sxIcon('arrowRight', 18)}</span>
        <div class="arch-box">
          <div class="at">${sxIcon('batch', 15)} 扩展点</div>
          <div class="ad">命令 / 编辑器 / 格式化器 / 渲染器<br />数据适配器 / 主题 / 菜单 / 函数</div>
          <div class="arch-tags">${EXTENSION_POINTS.map((point) => html`<span class="arch-tag">${EP_LABELS[point.key]}</span>`)}</div>
        </div>
        <span class="arch-arrow">${sxIcon('arrowRight', 18)}</span>
        <div class="arch-box">
          <div class="at">${sxIcon('package', 15)} 已安装插件</div>
          <div class="ad">${this.installedPlugins.length} 个插件 · ${this.enabledIds.size} 个启用<br />可热停用，不改动核心代码</div>
          <div class="arch-tags">${this.installedPlugins.slice(0, 3).map((plugin) => html`<span class="arch-tag">${plugin.name}</span>`)}</div>
        </div>
      </div>

      <div class="section-head">${sxIcon('bolt', 15)} 扩展点注册
        <span class="st">点击卡片查看契约与已注册插件</span>
      </div>
      <div class="ep-grid">
        ${EXTENSION_POINTS.map((point) => html`
          <div class="ep-card ${this.epKey === point.key ? 'active' : ''}" @click=${() => { this.epKey = point.key }}>
            <div class="ep-top">
              <span class="ep-icon" style="background:${point.color}">${sxIcon(point.icon, 15)}</span>
              <span class="ep-name">${point.title}</span>
              <span class="ep-count">${counts.get(point.key) ?? 0} 项</span>
            </div>
            <div class="ep-desc">${point.desc}</div>
          </div>`)}
      </div>
      <div class="ep-detail">
        <div class="ep-detail-box">
          <div class="ep-detail-title">${selected.title} · ${selected.api}</div>
          <pre class="ep-code">${selected.code}</pre>
          <div style="margin-top:9px;display:flex;gap:6px">
            <button class="mini-btn" @click=${() => this.copyCode(selected.code)}>${sxIcon('copy', 12)} 复制代码</button>
            <button class="mini-btn" @click=${() => this.openDev('example')}>${sxIcon('code', 12)} 完整示例</button>
          </div>
        </div>
        <div class="ep-detail-box">
          <div class="ep-detail-title">已注册插件（${pointPlugins.length}）</div>
          <div class="ep-plugin-list">
            ${pointPlugins.map((plugin) => html`
              <div class="ep-plugin"><span class="dot"></span><b>${plugin.name}</b>
                <span style="margin-left:auto;color:var(--sx-text-hint)">v${plugin.version}</span></div>`)}
            ${pointPlugins.length === 0 ? html`<div class="ins-meta">暂无插件注册到该扩展点，安装后会自动出现在这里。</div>` : nothing}
          </div>
          <div class="ep-detail-title" style="margin-top:12px">加载顺序（依赖优先）</div>
          <div class="order-list">
            ${this.activationOrder.map((item, index) => html`
              ${index > 0 ? html`<span class="order-arrow">${sxIcon('arrowRight', 12)}</span>` : nothing}
              <span class="order-step"><b>${index + 1}</b> ${item.name}</span>`)}
            ${this.activationOrder.length === 0 ? html`<span class="ins-meta">暂无启用插件</span>` : nothing}
          </div>
        </div>
      </div>

      ${this.diagnosticLines.length > 0 ? html`
        <div class="ep-detail-box" style="margin-top:10px">
          <div class="ep-detail-title">最近一次诊断</div>
          ${this.diagnosticLines.map((line) => html`
            <div class="log-line ${line.startsWith('[OK]') ? 'ok' : line.startsWith('[ERR]') || line.startsWith('[SKIP]') ? 'err' : ''}">${line}</div>`)}
        </div>` : nothing}
    `
  }

  private renderDetailModal(): TemplateResult | typeof nothing {
    const plugin = this.detailPlugin
    if (!plugin) return nothing
    const state = this.states[plugin.id]
    const installed = Boolean(state?.installed)
    return html`
      <div class="mask" @click=${(event: Event) => { if (event.target === event.currentTarget) this.detailId = null }}>
        <div class="modal">
          <div class="modal-head">
            ${sxIcon(plugin.icon, 17)} 插件详情
            <button class="close" @click=${() => { this.detailId = null }}>${sxIcon('close', 15)}</button>
          </div>
          <div class="modal-body">
            <div class="detail-hero">
              <span class="p-icon" style="background:${plugin.accent}">${sxIcon(plugin.icon, 22)}</span>
              <div>
                <div class="detail-title">${plugin.name} <span class="p-ver">v${plugin.version}</span></div>
                <div class="detail-sub">${plugin.publisher} · 更新于 ${plugin.updatedAt}</div>
              </div>
              <span class="p-rating" style="margin-left:auto">★ ${plugin.rating.toFixed(1)} <em>(${plugin.downloads.toLocaleString()} 次下载)</em></span>
            </div>
            <p class="p-desc" style="margin-top:12px;-webkit-line-clamp:unset">${plugin.desc}</p>
            <div class="detail-grid">
              <div class="detail-cell"><div class="k">分类</div><div class="v">${plugin.category}</div></div>
              <div class="detail-cell"><div class="k">扩展点</div><div class="v">${plugin.extensionPoints.length} 个</div></div>
              <div class="detail-cell"><div class="k">依赖</div><div class="v">${plugin.dependencies?.length ?? 0} 个</div></div>
              <div class="detail-cell"><div class="k">权限</div><div class="v">${plugin.permissions.length} 项</div></div>
            </div>
            <div class="detail-section"><h4>扩展点</h4><div class="chip-row">
              ${plugin.extensionPoints.map((point) => html`<span class="chip">${EP_LABELS[point]}</span>`)}
            </div></div>
            <div class="detail-section"><h4>依赖插件</h4><div class="chip-row">
              ${(plugin.dependencies ?? []).map((dep) => html`<span class="chip">${this.allPlugins.find((item) => item.id === dep)?.name ?? dep}</span>`)}
              ${(plugin.dependencies ?? []).length === 0 ? html`<span class="chip">无</span>` : nothing}
            </div></div>
            <div class="detail-section"><h4>申请权限</h4><div class="chip-row">
              ${plugin.permissions.map((permission) => html`<span class="chip">${permission}</span>`)}
            </div></div>
            <div class="detail-section"><h4>更新日志</h4><p>${plugin.changelog}</p></div>
          </div>
          <div class="modal-foot">
            ${installed ? html`
              <button class="btn" @click=${() => this.toggleEnabled(plugin.id)}>${state?.enabled ? '停用' : '启用'}</button>
              <button class="btn" @click=${() => this.uninstallPlugin(plugin.id)}>卸载</button>
            ` : html`<button class="btn primary" @click=${() => this.installPlugin(plugin.id)}>${sxIcon('download', 13)} 安装插件</button>`}
            <button class="btn" @click=${() => { this.detailId = null }}>关闭</button>
          </div>
        </div>
      </div>`
  }

  private renderCommunityModal(): TemplateResult | typeof nothing {
    if (!this.showCommunity) return nothing
    return html`
      <div class="mask" @click=${(event: Event) => { if (event.target === event.currentTarget) this.showCommunity = false }}>
        <div class="modal">
          <div class="modal-head">${sxIcon('market', 17)} 社区插件市场
            <button class="close" @click=${() => { this.showCommunity = false }}>${sxIcon('close', 15)}</button>
          </div>
          <div class="modal-body">
            <p class="ins-meta" style="margin:0 0 10px">以下插件来自社区生态，安装后同样进入统一扩展点账本与权限审计。</p>
            ${COMMUNITY_PLUGINS.map((plugin) => html`
              <div class="ins-row" style="grid-template-columns:minmax(0,2fr) 90px 1fr 80px">
                <div class="ins-name">
                  <span class="p-icon" style="background:${plugin.accent};width:27px;height:27px;border-radius:6px">${sxIcon(plugin.icon, 15)}</span>
                  <div><b>${plugin.name}</b><div class="ins-meta">v${plugin.version} · ★ ${plugin.rating.toFixed(1)}</div></div>
                </div>
                <div class="ins-meta">${plugin.category}</div>
                <div class="ins-meta">${plugin.desc}</div>
                <button class="mini-btn" @click=${() => this.installFromCommunity(plugin.id)}>
                  ${this.states[plugin.id]?.installed ? '已安装' : '安装'}
                </button>
              </div>`)}
          </div>
          <div class="modal-foot"><button class="btn primary" @click=${() => { this.showCommunity = false }}>完成</button></div>
        </div>
      </div>`
  }

  private renderDevModal(): TemplateResult | typeof nothing {
    if (!this.devOpen) return nothing
    const tabs: Array<{ key: DevTab; label: string }> = [
      { key: 'guide', label: '开发指南' }, { key: 'example', label: '示例工程' },
      { key: 'api', label: 'API 参考' }, { key: 'debug', label: '调试与预览' },
    ]
    return html`
      <div class="mask" @click=${(event: Event) => { if (event.target === event.currentTarget) this.devOpen = false }}>
        <div class="modal wide">
          <div class="modal-head">${sxIcon('code', 17)} 开发者工具
            <button class="close" @click=${() => { this.devOpen = false }}>${sxIcon('close', 15)}</button>
          </div>
          <div class="modal-tabs">
            ${tabs.map((tab) => html`
              <button class="modal-tab ${this.devTab === tab.key ? 'active' : ''}" @click=${() => { this.devTab = tab.key }}>${tab.label}</button>`)}
          </div>
          <div class="modal-body">
            ${this.devTab === 'guide' ? html`
              <div class="guide-steps">
                ${DEV_GUIDE_STEPS.map((step) => html`
                  <div class="guide-step"><span class="no">${step.no}</span><div><b>${step.title}</b><p>${step.desc}</p></div></div>`)}
              </div>
              <div style="margin-top:12px;display:flex;gap:7px">
                <button class="btn primary" @click=${() => { this.devOpen = false; this.showNewPlugin = true }}>
                  ${sxIcon('plus', 13)} 新建插件
                </button>
                <button class="btn" @click=${() => { this.devTab = 'example' }}>查看示例工程</button>
              </div>` : nothing}
            ${this.devTab === 'example' ? html`
              <div class="code-box">
                <pre class="ep-code" style="font-size:11px">${DEV_EXAMPLE}</pre>
              </div>
              <div style="margin-top:9px;display:flex;gap:7px">
                <button class="btn" @click=${() => this.copyCode(DEV_EXAMPLE)}>${sxIcon('copy', 13)} 复制代码</button>
                <button class="btn primary" @click=${() => { this.devOpen = false; this.showNewPlugin = true }}>用此模板创建</button>
              </div>` : nothing}
            ${this.devTab === 'api' ? html`
              <div class="api-row" style="border-bottom:1px solid var(--sx-border);font-weight:600">
                <span>方法</span><span>说明 / 签名</span>
              </div>
              ${DEV_API_ITEMS.map((item) => html`
                <div class="api-row">
                  <code>${item.name}</code>
                  <span>${item.desc} · <code>${item.sign}</code></span>
                </div>`)}` : nothing}
            ${this.devTab === 'debug' ? html`
              <div class="ep-detail-title">自定义编辑器预览 · registerEditor('rating')</div>
              <div class="demo-editor">
                ${[1, 2, 3, 4, 5].map((star) => html`
                  <button class="star-btn ${star <= this.rating ? 'on' : ''}" title="${star} 星"
                    @click=${() => { this.rating = star; toast(`编辑器返回值：${star}`) }}>★</button>`)}
                <span class="ins-meta" style="margin-left:8px">当前值：${this.rating || '未选择'}</span>
              </div>
              <div class="ep-detail-title" style="margin-top:13px">运行时检查</div>
              <div class="check-line"><span class="ok">${sxIcon('checkCircle', 14)}</span> manifest 校验：id / version / extensionPoints 完整</div>
              <div class="check-line"><span class="ok">${sxIcon('checkCircle', 14)}</span> 依赖拓扑：${this.activationOrder.length} 个插件可加载</div>
              <div class="check-line"><span class="ok">${sxIcon('checkCircle', 14)}</span> 权限审计：${this.installedPlugins.reduce((sum, plugin) => sum + plugin.permissions.length, 0)} 项已申报</div>
              <div style="margin-top:10px"><button class="btn primary" @click=${this.runDiagnostic}>${sxIcon('play', 13)} 运行诊断</button></div>
              ${this.diagnosticLines.length > 0 ? html`
                <div class="code-box" style="margin-top:10px">
                  ${this.diagnosticLines.map((line) => html`<div class="log-line">${line}</div>`)}
                </div>` : nothing}` : nothing}
          </div>
          <div class="modal-foot"><button class="btn primary" @click=${() => { this.devOpen = false }}>完成</button></div>
        </div>
      </div>`
  }

  private renderNewPluginModal(): TemplateResult | typeof nothing {
    if (!this.showNewPlugin) return nothing
    return html`
      <div class="mask" @click=${(event: Event) => { if (event.target === event.currentTarget) this.showNewPlugin = false }}>
        <div class="modal">
          <div class="modal-head">${sxIcon('plus', 17)} 新建插件脚手架
            <button class="close" @click=${() => { this.showNewPlugin = false }}>${sxIcon('close', 15)}</button>
          </div>
          <div class="modal-body">
            <div class="guide-step"><span class="no">01</span><div><b>插件名称</b>
              <input style="width:100%;height:30px;margin-top:7px;padding:0 9px;border:1px solid var(--sx-border-input);border-radius:5px;background:var(--sx-bg-surface)"
                placeholder="例如：批量打印标签" .value=${this.newName}
                @input=${(event: Event) => { this.newName = (event.target as HTMLInputElement).value }} />
            </div></div>
            <div class="guide-step" style="margin-top:9px"><span class="no">02</span><div><b>首个扩展点</b>
              <select style="width:100%;height:30px;margin-top:7px;padding:0 8px;border:1px solid var(--sx-border-input);border-radius:5px;background:var(--sx-bg-surface)"
                .value=${this.newPoint} @change=${(event: Event) => {
                  this.newPoint = (event.target as HTMLSelectElement).value as ExtensionPoint
                }}>
                ${EXTENSION_POINTS.map((point) => html`<option value=${point.key}>${point.title}</option>`)}
              </select>
            </div></div>
            <p class="ins-meta" style="margin:10px 0 0">创建后会立即出现在「已安装插件」，可继续在开发者工具中编辑实现。</p>
          </div>
          <div class="modal-foot">
            <button class="btn" @click=${() => { this.showNewPlugin = false }}>取消</button>
            <button class="btn primary" @click=${this.createPlugin}>创建插件</button>
          </div>
        </div>
      </div>`
  }

  render(): TemplateResult {
    return html`
      <div class="app" data-theme=${this.theme}>
        ${this.renderTopbar()}
        <div class="body">
          ${this.renderSidebar()}
          <main class="main">
            ${this.section === 'market' ? this.renderMarket() : nothing}
            ${this.section === 'installed' ? this.renderInstalled() : nothing}
            ${this.section === 'architecture' ? this.renderArchitecture() : nothing}
          </main>
        </div>
        ${this.detailPlugin ? this.renderDetailModal() : nothing}
        ${this.renderCommunityModal()}
        ${this.renderDevModal()}
        ${this.renderNewPluginModal()}
      </div>`
  }
}

declare global {
  interface HTMLElementTagNameMap { 'plugin-app': PluginApp }
}
