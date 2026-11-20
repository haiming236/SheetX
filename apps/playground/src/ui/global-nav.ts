/**
 * SheetX Playground · 全局顶部导航
 *
 * 17 个视图（首页 + 16 张设计稿）常驻顶部，任何页面一键切换。
 * 交互约定：
 * - 点击 tab → 改 hash，main.ts 的 hashchange 负责换页（本组件只做高亮）
 * - 当前 tab 自动 scrollIntoView（tab 多于一屏时可横向滚动）
 * - ←/→ 键切换上一个/下一个视图，输入态下不拦截
 * - 右侧太阳/月亮按钮：全局主题切换（浅色 ↔ 深色，持久化）
 */
import { LitElement, html, css, type TemplateResult } from 'lit'
import { customElement } from 'lit/decorators/custom-element.js'
import { state } from 'lit/decorators/state.js'
import { sxIcon, sxLogo } from './icons.js'
import { PAGE_ENTRIES } from './home-data.js'
import { getResolvedTheme, onThemeChange, toggleTheme, type ResolvedTheme } from './theme.js'

/** 顶部 tab 的短名（长 title 会挤爆一行；完整标题在右侧显示） */
const SHORT_TITLE: Record<string, string> = {
  spreadsheet: '主界面',
  grid: '业务网格',
  'sheet-full': '完整表格',
  editors: '编辑器',
  virtual: '虚拟滚动',
  formula: '公式',
  data: '导入导出',
  context: '右键菜单',
  filter: '筛选排序',
  settings: '主题',
  workbook: '工作簿',
  charts: '图表',
  pivot: '透视表',
  review: '批阅',
  validate: '数据验证',
  engine: '引擎',
  print: '打印',
  format: '格式',
  'formula-lib': '函数库',
  history: '历史',
  import: '导入',
  'adv-filter': '高级筛选',
  'multi-view': '多视图',
  plugins: '插件',
  properties: '属性',
  host: '宿主集成',
  datasource: '数据源',
  edit: '事务提交',
  permission: '权限安全',
  i18n: '国际化',
  keyboard: '快捷键',
  'plugin-dev': '插件开发',
  debug: '性能监控',
  embed: '集成示例',
  'api-doc': 'API 文档',
  'playground-all': '综合体验',
  'dual-mode': '双模式对比',
  'engine-arch': '引擎架构',
  'render-arch': '渲染架构',
  'virtual-scroll': '虚拟滚动',
  'ai-assistant': 'AI 助手',
  'ai-generate': 'AI 生成',
}

/** 分组：基础视图 / 进阶能力 / 高级能力 / 引擎演示 */
const GROUPS = [
  PAGE_ENTRIES.filter((entry) => Number(entry.no) <= 5),
  PAGE_ENTRIES.filter((entry) => Number(entry.no) > 5 && Number(entry.no) <= 10),
  PAGE_ENTRIES.filter((entry) => Number(entry.no) > 10 && Number(entry.no) <= 15),
  PAGE_ENTRIES.filter((entry) => Number(entry.no) > 15),
]

@customElement('global-nav')
export class GlobalNav extends LitElement {
  static styles = css`
    :host {
      display: block;
      flex: 0 0 auto;
      width: 100%;
      z-index: 300;
    }
    .bar {
      height: 42px;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 10px 0 12px;
      background: var(--sx-bg-surface);
      border-bottom: 1px solid var(--sx-border);
      font-family: 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
      color: var(--sx-text-primary);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 7px;
      flex: 0 0 auto;
      padding-right: 10px;
      border-right: 1px solid var(--sx-border);
      color: var(--sx-text-primary);
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.2px;
      cursor: pointer;
      text-decoration: none;
    }
    .brand .logo {
      width: 22px;
      height: 22px;
      border-radius: 5px;
      background: var(--sx-brand);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: none;
    }
    .brand .logo svg {
      display: block;
    }
    .brand .tag {
      color: var(--sx-text-hint);
      font-weight: 500;
    }
    .tabs {
      display: flex;
      align-items: center;
      gap: 1px;
      flex: 1 1 auto;
      min-width: 0;
      overflow-x: auto;
      scrollbar-width: none;
    }
    .tabs::-webkit-scrollbar {
      display: none;
    }
    .tab {
      flex: 0 0 auto;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      height: 26px;
      padding: 0 8px;
      border-radius: 6px;
      color: var(--sx-text-secondary);
      font-size: 12px;
      text-decoration: none;
      white-space: nowrap;
      transition: background 0.12s ease, color 0.12s ease;
    }
    .tab:hover {
      background: var(--sx-bg-hover);
      color: var(--sx-text-primary);
    }
    .tab .no {
      font-size: 10px;
      font-weight: 600;
      color: var(--sx-text-hint);
      font-variant-numeric: tabular-nums;
    }
    .tab.active {
      background: var(--sx-brand-soft);
      color: var(--sx-brand);
      font-weight: 600;
    }
    .tab.active .no {
      color: var(--sx-brand);
    }
    .sep {
      flex: 0 0 auto;
      width: 1px;
      height: 15px;
      margin: 0 4px;
      background: var(--sx-border);
    }
    .right {
      flex: 0 0 auto;
      display: flex;
      align-items: center;
      gap: 8px;
      padding-left: 8px;
      border-left: 1px solid var(--sx-border);
      color: var(--sx-text-secondary);
      font-size: 12px;
      max-width: 260px;
    }
    .right .cur {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--sx-text-primary);
    }
    .hint {
      flex: 0 0 auto;
      color: var(--sx-text-hint);
      font-size: 11px;
      font-variant-numeric: tabular-nums;
    }
    .theme-btn {
      flex: 0 0 auto;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 26px;
      height: 26px;
      padding: 0;
      border: 1px solid var(--sx-border);
      border-radius: 6px;
      background: var(--sx-bg-surface);
      color: var(--sx-text-secondary);
      cursor: pointer;
      transition: border-color 0.12s ease, color 0.12s ease;
    }
    .theme-btn:hover {
      border-color: var(--sx-brand);
      color: var(--sx-brand);
    }
    .zoom-ctl {
      flex: 0 0 auto;
      display: inline-flex;
      align-items: center;
      gap: 3px;
    }
    .zoom-ctl .zoom-btn {
      width: 22px;
      height: 22px;
      border-radius: 4px;
    }
    .zoom-val {
      flex: 0 0 auto;
      min-width: 38px;
      height: 22px;
      padding: 0 4px;
      border: 1px solid var(--sx-border);
      border-radius: 4px;
      background: var(--sx-bg-surface);
      color: var(--sx-text-secondary);
      font: 11px/1 inherit;
      font-variant-numeric: tabular-nums;
      cursor: pointer;
      transition: border-color 0.12s ease, color 0.12s ease;
    }
    .zoom-val:hover { border-color: var(--sx-brand); color: var(--sx-brand); }
    button:focus-visible { outline: 2px solid var(--sx-brand); outline-offset: 1px; }
  `

  @state() private current = 'home'
  @state() private themeResolved: ResolvedTheme = getResolvedTheme()
  @state() private zoom = 100

  private stopTheme: (() => void) | null = null

  connectedCallback(): void {
    super.connectedCallback()
    this.sync()
    // 恢复全局等比缩放（zoom 作用于文档根，所有页面与图表同步等比重排）
    try {
      const saved = Number(localStorage.getItem('sx:global-zoom'))
      if (saved >= 60 && saved <= 150) this.applyZoom(saved)
    } catch { /* 忽略 */ }
    window.addEventListener('hashchange', this.sync)
    this.stopTheme = onThemeChange((_mode, resolved) => {
      this.themeResolved = resolved
    })
  }

  disconnectedCallback(): void {
    window.removeEventListener('hashchange', this.sync)
    this.stopTheme?.()
    this.stopTheme = null
    super.disconnectedCallback()
  }

  /** 等比缩放：zoom 让整页布局与图表按同一比例缩放并保持填满，无留白 */
  private applyZoom(value: number): void {
    const next = Math.max(60, Math.min(150, Math.round(value)))
    this.zoom = next
    document.documentElement.style.zoom = String(next / 100)
    try { localStorage.setItem('sx:global-zoom', String(next)) } catch { /* 忽略 */ }
  }

  private zoomBy(delta: number): void { this.applyZoom(this.zoom + delta) }

  /** 适应屏幕：根据窗口宽度自动计算最佳比例（小屏缩小、大屏放大） */
  private fitScreen(): void {
    const w = window.innerWidth
    const target = w < 900 ? 75 : w < 1200 ? 90 : w > 1800 ? 125 : 100
    this.applyZoom(target)
  }

  private toggleFullscreen(): void {
    if (document.fullscreenElement) {
      document.exitFullscreen?.()
    } else {
      document.documentElement.requestFullscreen?.().catch(() => { /* 浏览器拒绝时忽略 */ })
    }
  }

  private sync = (): void => {
    this.current = location.hash.replace('#', '') || 'home'
    // 换页后把当前 tab 滚进可视区（tab 条可能横向溢出）
    requestAnimationFrame(() => {
      const active = this.renderRoot.querySelector('.tab.active') as HTMLElement | null
      active?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    })
  }

  /** 键盘左右切换（输入态不抢键） */
  private handleKey = (event: KeyboardEvent): void => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    const target = event.target as HTMLElement | null
    const tag = target?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) return
    if (event.metaKey || event.ctrlKey || event.altKey) return
    const routes = ['home', ...PAGE_ENTRIES.map((entry) => entry.route)]
    const index = routes.indexOf(this.current)
    if (index < 0) return
    const next = (index + (event.key === 'ArrowRight' ? 1 : -1) + routes.length) % routes.length
    location.hash = `#${routes[next]}`
    event.preventDefault()
  }

  protected firstUpdated(): void {
    window.addEventListener('keydown', this.handleKey)
  }

  private tab(entry: (typeof PAGE_ENTRIES)[number]): TemplateResult {
    const active = this.current === entry.route
    return html`
      <a
        class="tab ${active ? 'active' : ''}"
        href="#${entry.route}"
        title="${entry.no} · ${entry.title}"
        aria-current=${active ? 'page' : 'false'}
      >
        <span class="no">${entry.no}</span>${SHORT_TITLE[entry.route] ?? entry.title}
      </a>
    `
  }

  private get currentTitle(): string {
    if (this.current === 'home') return '设计稿导航中心'
    return PAGE_ENTRIES.find((entry) => entry.route === this.current)?.title ?? this.current
  }

  render(): TemplateResult {
    return html`
      <div class="bar">
        <a class="brand" href="#home" title="回到首页">${sxLogo(22)}</a>
        <nav class="tabs" role="tablist" aria-label="视图切换">
          <a
            class="tab ${this.current === 'home' ? 'active' : ''}"
            href="#home"
            title="首页 · 设计稿导航中心"
            aria-current=${this.current === 'home' ? 'page' : 'false'}
            >首页</a
          >
          ${GROUPS.map(
            (group) => html`
              ${group.length > 0 ? html`<span class="sep"></span>` : ''}
              ${group.map((entry) => this.tab(entry))}
            `,
          )}
        </nav>
        <div class="right">
          <span class="cur">${this.currentTitle}</span>
          <span class="hint">← →</span>
          <div class="zoom-ctl" role="group" aria-label="视图缩放">
            <button class="theme-btn zoom-btn" title="缩小" @click=${() => this.zoomBy(-10)}>${sxIcon('zoomOut', 14)}</button>
            <button class="zoom-val" title="重置为 100%" @click=${() => this.applyZoom(100)}>${this.zoom}%</button>
            <button class="theme-btn zoom-btn" title="放大" @click=${() => this.zoomBy(10)}>${sxIcon('zoomIn', 14)}</button>
            <button class="theme-btn zoom-btn" title="适应屏幕（等比）" @click=${() => this.fitScreen()}>${sxIcon('refresh', 13)}</button>
          </div>
          <button class="theme-btn" title="全屏 / 退出全屏" @click=${() => this.toggleFullscreen()}>${sxIcon('fullscreen', 14)}</button>
          <button
            class="theme-btn"
            title=${this.themeResolved === 'dark' ? '切换到浅色主题' : '切换到深色主题'}
            @click=${() => { toggleTheme() }}
          >
            ${sxIcon(this.themeResolved === 'dark' ? 'sun' : 'moon', 15)}
          </button>
        </div>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'global-nav': GlobalNav
  }
}
