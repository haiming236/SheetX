/**
 * SheetX 第 32 张 · 快捷键与键盘操作管理
 *
 * 展示 Excel/WPS 快捷键兼容、自定义录入、冲突检测与键盘帮助，体现高效编辑体验。
 * 边界：本页是配置管理 UI，不重复劫持全局键盘（演示壳 main.ts 已有 Alt+1..9 / Ctrl+F）。
 */
import { LitElement, html, nothing, type TemplateResult } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { baseStyles, lightTokens } from './tokens.js'
import { bindPageTheme, type ResolvedTheme } from './theme.js'
import { keyboardStyles } from './keyboard-styles.js'
import { sxIcon, sxLogo } from './icons.js'
import { toast } from './toast.js'
import {
  SETTING_NAV, SHORTCUT_TABS, COMMON_SHORTCUTS, CATEGORY_SHORTCUTS,
  CUSTOM_ACTIONS, INITIAL_CONFLICTS, TIPS, KEYBOARD_CONTRACT, DEFAULT_CONFIG,
  type Shortcut, type FullConfig,
} from './keyboard-data.js'

const TOP_MENUS = ['文件', '开始', '插入', '数据', '公式', '视图', '设置']
const STORE_KEY = 'sx:keyboard-config'

@customElement('keyboard-app')
export class KeyboardApp extends LitElement {
  static styles = [baseStyles, lightTokens, keyboardStyles]

  @state() private theme: ResolvedTheme = 'light'
  @state() private activeMenu = '设置'
  @state() private nav = 'shortcut'
  @state() private cfg: FullConfig = this.load()
  @state() private customAction = CUSTOM_ACTIONS[0]!
  @state() private customKeys = ['Ctrl', 'Shift', 'E']
  @state() private liveConflict: string | null = null
  @state() private showContract = false

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

  private get shortcuts(): Shortcut[] {
    const base = this.cfg.activeTab === '常用快捷键'
      ? COMMON_SHORTCUTS
      : CATEGORY_SHORTCUTS[this.cfg.activeTab] ?? []
    // 自定义覆盖：功能名匹配则替换键位
    return base.map((s) => {
      const override = Object.entries(this.cfg.custom).find(([name]) => name === s.name)
      return override ? { ...s, keys: override[1] } : s
    })
  }

  /** 冲突检测：与内置键位或浏览器保留键冲突 */
  private detectConflict(keys: string[]): string | null {
    const sig = keys.join('+')
    const existing = [...COMMON_SHORTCUTS, ...Object.values(CATEGORY_SHORTCUTS).flat()]
      .find((s) => s.keys.join('+') === sig)
    if (existing) return `与内置快捷键「${existing.name}（${existing.keys.join('+')}）」冲突`
    if (sig === 'Ctrl+P' || sig === 'Ctrl+W' || sig === 'Ctrl+T' || sig === 'Ctrl+N') {
      return `${sig} 是浏览器保留键，建议更换`
    }
    if (keys.length < 2) return '快捷键至少需要两个键（修饰键 + 主键）'
    return null
  }

  private setKeyAt(index: number, value: string): void {
    const next = [...this.customKeys]
    next[index] = value.replace(/\s/g, '') || '?'
    this.customKeys = next
    this.liveConflict = this.detectConflict(next)
  }

  private addKey(): void {
    if (this.customKeys.length >= 4) { toast('最多支持 4 个键位'); return }
    this.customKeys = [...this.customKeys, '?']
    this.liveConflict = this.detectConflict(this.customKeys)
  }

  private removeKey(index: number): void {
    if (this.customKeys.length <= 2) { toast('至少保留两个键位'); return }
    this.customKeys = this.customKeys.filter((_, i) => i !== index)
    this.liveConflict = this.detectConflict(this.customKeys)
  }

  private saveCustom(): void {
    const conflict = this.detectConflict(this.customKeys)
    if (conflict) { this.liveConflict = conflict; toast(`保存失败：${conflict}`); return }
    this.patch('custom', { ...this.cfg.custom, [this.customAction]: [...this.customKeys] })
    this.liveConflict = null
    toast(`已保存：${this.customAction} → ${this.customKeys.join(' + ')}`)
  }

  private cancelCustom(): void {
    this.customKeys = ['Ctrl', 'Shift', 'E']
    this.liveConflict = null
    toast('已取消自定义设置')
  }

  private resolveConflict(): void {
    this.patch('resolvedConflicts', [...this.cfg.resolvedConflicts, 'Ctrl+P'])
    toast('已忽略冲突（演示环境保留 Ctrl+P；生产环境建议更换为 Ctrl+Shift+P）')
  }

  private resetAll(): void {
    this.cfg = structuredClone(DEFAULT_CONFIG)
    this.save()
    this.customKeys = ['Ctrl', 'Shift', 'E']
    this.liveConflict = null
    toast('已恢复全部默认快捷键')
  }

  private toggleEnabled(): void {
    this.patch('enabled', !this.cfg.enabled)
    toast(this.cfg.enabled ? '快捷键已启用' : '快捷键已禁用（仅演示开关，不影响页面本身）')
  }

  private chooseSide(key: string): void {
    this.nav = key
    if (key !== 'shortcut') toast(`${SETTING_NAV.find((n) => n.key === key)?.label}（本页聚焦快捷键演示）`)
  }

  /* ================= 渲染 ================= */

  private renderTop(): TemplateResult {
    return html`
      <div class="menu-bar">
        <div class="brand">${sxLogo(22)}</div>
        <nav class="menu-list">
          ${TOP_MENUS.map((m) => html`
            <button class="menu-item ${m === this.activeMenu ? 'active' : ''}" @click=${() => { this.activeMenu = m }}>${m}</button>`)}
        </nav>
        <div class="search-box">${sxIcon('search', 14)}<input placeholder="搜索功能..." /></div>
        <button class="icon-btn" title="帮助" @click=${() => { this.showContract = !this.showContract; toast('键盘系统契约已切换') }}>${sxIcon('help', 16)}</button>
        <button class="icon-btn" title="设置" @click=${() => this.chooseSide('shortcut')}>${sxIcon('settings', 16)}</button>
        <div class="user-chip"><span class="avatar">张</span><span>张三</span>${sxIcon('chevronDown', 11)}</div>
      </div>`
  }

  private renderSidebar(): TemplateResult {
    return html`
      <aside class="sidebar">
        <div class="side-title">设置中心</div>
        ${SETTING_NAV.map((item) => html`
          <button class="side-item ${this.nav === item.key ? 'active' : ''}" @click=${() => this.chooseSide(item.key)}>
            ${sxIcon(item.icon, 15)} ${item.label}
          </button>`)}
      </aside>`
  }

  private renderTable(): TemplateResult {
    if (!this.cfg.enabled) {
      return html`<div class="disabled-note">快捷键已禁用 —— 开启右上角「启用快捷键」后查看配置</div>`
    }
    return html`
      <div class="table-wrap">
        <table class="shortcut-table">
          <thead><tr><th>功能</th><th>快捷键</th><th>说明</th></tr></thead>
          <tbody>
            ${this.shortcuts.map((s) => html`
              <tr>
                <td><span class="fn-name"><span class="ic">${sxIcon(s.icon, 14)}</span>${s.name}${s.excel ? html`<span class="excel-badge">Excel/WPS</span>` : ''}</span></td>
                <td><span class="keys">${s.keys.map((k, i) => html`${i > 0 ? html`<span class="plus">+</span>` : ''}<span class="key">${k}</span>`)}</span></td>
                <td><span class="desc">${s.desc}</span></td>
              </tr>`)}
          </tbody>
        </table>
      </div>`
  }

  private renderMain(): TemplateResult {
    return html`
      <div class="panel">
        <div class="tabs" role="tablist">
          ${SHORTCUT_TABS.map((t) => html`
            <button class="tab ${this.cfg.activeTab === t ? 'active' : ''}" @click=${() => this.patch('activeTab', t)}>${t}</button>`)}
        </div>
        ${this.renderTable()}
      </div>`
  }

  private renderCustom(): TemplateResult {
    return html`
      <div class="card">
        <h3>${sxIcon('edit', 15)} 自定义快捷键</h3>
        <div class="info-box">
          <span class="ic">${sxIcon('infoCircle', 15)}</span>
          <span>支持自定义快捷键，避免与其他应用冲突。保存前自动检测与内置键位及浏览器保留键的冲突。</span>
        </div>
        <span class="field-label">选择功能</span>
        <select class="full-select" .value=${this.customAction} @change=${(e: Event) => { this.customAction = (e.target as HTMLSelectElement).value; this.liveConflict = this.detectConflict(this.customKeys) }}>
          ${CUSTOM_ACTIONS.map((a) => html`<option>${a}</option>`)}
        </select>
        <span class="field-label" style="margin-top:13px">设置快捷键</span>
        <div class="key-input-row">
          ${this.customKeys.map((k, i) => html`
            ${i > 0 ? html`<span class="key-plus">+</span>` : ''}
            <input class="key-input ${i < 2 ? 'mod' : ''}" .value=${k} @change=${(e: Event) => this.setKeyAt(i, (e.target as HTMLInputElement).value)} />
            ${i > 1 ? html`<button class="key-remove" title="移除键位" @click=${() => this.removeKey(i)}>${sxIcon('close', 12)}</button>` : ''}
          `)}
          <button class="key-remove" title="添加键位" @click=${() => this.addKey()}>${sxIcon('plus', 13)}</button>
        </div>
        ${this.liveConflict ? html`<div class="conflict-live">⚠ ${this.liveConflict}</div>` : nothing}
        <div class="custom-actions">
          <button class="btn primary" @click=${() => this.saveCustom()}>${sxIcon('check', 13)} 保存设置</button>
          <button class="btn" @click=${() => this.cancelCustom()}>取消</button>
        </div>
      </div>`
  }

  private renderConflicts(): TemplateResult {
    const pending = INITIAL_CONFLICTS.filter((c) => !this.cfg.resolvedConflicts.includes(c.keys.join('+')))
    if (pending.length === 0) {
      return html`
        <div class="card">
          <h3>${sxIcon('checkCircle', 15)} 快捷冲突检测</h3>
          <div style="font-size:11.5px;color:var(--sx-success)">✓ 未检测到快捷键冲突</div>
        </div>`
    }
    return html`
      <div class="card conflict-card">
        <h3>${sxIcon('warnTriangle', 15)} 快捷冲突检测</h3>
        <p>检测到以下快捷键与系统或其他功能冲突：</p>
        ${pending.map((c) => html`
          <div class="conflict-row">
            <span class="warn">${sxIcon('warnTriangle', 14)}</span>
            <span class="txt"><b>${c.title}</b><br />${c.detail}<br />建议更换为：${c.suggest.join(' + ')}</span>
            <button class="btn" @click=${() => this.resolveConflict()}>忽略冲突</button>
          </div>`)}
      </div>`
  }

  private renderTips(): TemplateResult {
    return html`
      <div class="tips">
        <span class="tips-title">${sxIcon('bulb', 16)} 快捷键使用小贴士</span>
        ${TIPS.map((t) => html`<span class="tip-item"><span class="ok">${sxIcon('checkCircle', 12)}</span>${t.text}</span>`)}
        <button class="tips-link" @click=${() => { this.showContract = !this.showContract }}>查看完整快捷键列表 ${sxIcon('arrowRight', 12)}</button>
      </div>
      ${this.showContract ? html`<div class="card" style="margin-top:14px"><h3>${sxIcon('code', 15)} 键盘系统契约</h3><div class="doc-box" style="font:10.5px/1.65 'SF Mono',Menlo,monospace;white-space:pre-wrap;padding:12px;border:1px solid var(--sx-border);border-radius:6px;background:var(--sx-bg-app);color:var(--sx-text-secondary);overflow-x:auto">${KEYBOARD_CONTRACT}</div></div>` : nothing}`
  }

  render(): TemplateResult {
    return html`
      <div class="app" data-keyboard-theme=${this.theme}>
        ${this.renderTop()}
        <div class="shell">
          ${this.renderSidebar()}
          <div class="content">
            <div class="head">
              <span class="head-icon">${sxIcon('gridView', 22)}</span>
              <div><h2>快捷键与键盘操作</h2><p>支持 Excel / WPS 快捷键，提升您的操作效率</p></div>
              <div class="head-right">
                <span class="enable-row">启用快捷键
                  <button class="switch ${this.cfg.enabled ? 'on' : ''}" @click=${() => this.toggleEnabled()}><span class="knob"></span></button>
                </span>
                <button class="btn" @click=${() => this.resetAll()}>${sxIcon('refresh', 13)} 恢复默认</button>
              </div>
            </div>
            <div class="main-grid">
              ${this.renderMain()}
              <div class="side-col">${this.renderCustom()}${this.renderConflicts()}</div>
            </div>
            ${this.renderTips()}
          </div>
        </div>
      </div>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'keyboard-app': KeyboardApp
  }
}
