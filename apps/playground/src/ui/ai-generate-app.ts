/**
 * SheetX 第 45 张 · AI 自然语言生成表格与业务数据
 *
 * 自然语言 → 理解场景 → 规划字段 → 生成模拟数据 → 预览 → 确认插入 → 撤销。
 * 纯前端本地生成；Provider 可插拔（沿用第44张配置）；插入前后均可控。
 */
import { LitElement, html, nothing, type TemplateResult } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { baseStyles, lightTokens } from './tokens.js'
import { bindPageTheme, type ResolvedTheme } from './theme.js'
import { aiGenerateStyles } from './ai-generate-styles.js'
import { sxIcon, sxLogo, type IconName } from './icons.js'
import { toast } from './toast.js'
import {
  MENU, SCENARIOS, AI_STEPS, FEATURES, DEFAULT_PROMPT,
  detectScenario, generateRows, type Scenario,
} from './ai-generate-data.js'

const STORE_KEY = 'sx:ai-generate-config'
const PREVIEW_COUNT = 24

@customElement('ai-generate-app')
export class AiGenerateApp extends LitElement {
  static styles = [baseStyles, lightTokens, aiGenerateStyles]

  @state() private theme: ResolvedTheme = 'light'
  @state() private activeMenu = '开始'
  @state() private prompt = DEFAULT_PROMPT
  @state() private scenario: Scenario = SCENARIOS[0]
  @state() private generating = false
  @state() private step = 0
  @state() private previewRows: string[][] = []
  @state() private previewCount = 24
  @state() private headers: string[] = SCENARIOS[0].fields.map((f) => f.name)
  @state() private tableRows: string[][] = [
    ['笔记本电脑', '电子产品', '华东', '12,500', '¥1,250,000'],
    ['平板电脑', '电子产品', '华南', '8,200', '¥738,000'],
    ['无线耳机', '数码配件', '华北', '15,800', '¥632,000'],
  ]
  @state() private insertedCount = 0
  @state() private showSuccess = false
  @state() private undoSnapshot: string[][] | null = null

  private stopTheme: (() => void) | null = null

  constructor() {
    super()
    this.stopTheme = bindPageTheme((resolved) => { this.theme = resolved })
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY) || '{}')
      if (saved.prompt) this.prompt = saved.prompt
      if (Array.isArray(saved.tableRows) && saved.tableRows.length) this.tableRows = saved.tableRows
    } catch { /* 忽略 */ }
  }

  connectedCallback(): void { super.connectedCallback() }
  disconnectedCallback(): void {
    this.stopTheme?.()
    this.stopTheme = null
  }

  private save(): void {
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ prompt: this.prompt, tableRows: this.tableRows })) } catch { /* 忽略 */ }
  }

  private chooseTemplate(s: Scenario): void {
    this.scenario = s
    this.prompt = s.prompt
    this.save()
    toast(`已选择模板：${s.name}`)
  }

  /** 自然语言生成：3 步骤动画 → 预览 */
  private generate(): void {
    if (!this.prompt.trim()) { toast('请先描述你的数据需求'); return }
    this.scenario = detectScenario(this.prompt)
    this.generating = true
    this.step = 1
    const timer = window.setInterval(() => {
      this.step += 1
      if (this.step > AI_STEPS.length) {
        window.clearInterval(timer)
        this.finishGenerate()
      }
    }, 420)
  }

  private finishGenerate(): void {
    this.generating = false
    this.step = 0
    this.headers = this.scenario.fields.map((f) => f.name)
    this.previewCount = PREVIEW_COUNT
    this.previewRows = generateRows(this.scenario, PREVIEW_COUNT)
    toast(`已生成 ${PREVIEW_COUNT} 条预览数据（本地生成，未上传）`)
  }

  private regeneratePreview(): void {
    const n = Math.max(3, Math.min(200, this.previewCount))
    this.previewCount = n
    this.previewRows = generateRows(this.scenario, n)
    toast(`预览已更新为 ${n} 条`)
  }

  private quickFill(): void {
    this.previewCount = 100
    this.previewRows = generateRows(this.scenario, 100)
    toast('已切换为批量生成 100 条')
  }

  private insertData(): void {
    if (!this.previewRows.length) return
    this.undoSnapshot = this.tableRows.map((r) => [...r])
    this.insertedCount = this.previewRows.length
    this.tableRows = [...this.previewRows]
    this.save()
    this.previewRows = []
    this.showSuccess = true
  }

  private undo(): void {
    if (!this.undoSnapshot) { toast('没有可撤销的操作'); return }
    this.tableRows = this.undoSnapshot
    this.undoSnapshot = null
    this.insertedCount = 0
    this.showSuccess = false
    this.save()
    toast('已撤销 AI 生成的数据插入')
  }

  private copyPreview(): void {
    const text = [this.headers.join('\t'), ...this.previewRows.map((r) => r.join('\t'))].join('\n')
    navigator.clipboard?.writeText(text).then(() => toast('预览数据已复制')).catch(() => toast('复制失败，请手动选择'))
  }

  render(): TemplateResult {
    return html`
      <div class="app" data-ag-theme=${this.theme}>
        ${this.renderTop()}
        ${this.renderHero()}
        <div class="shell">
          ${this.renderExcel()}
          ${this.renderAiPanel()}
        </div>
        ${this.renderFeatures()}
        <div class="statusbar">
          <span>${sxIcon('checkCircle', 11)} 就绪 · SheetX 纯前端 · 数据本地生成</span>
          ${this.undoSnapshot ? html`<span class="undo" @click=${() => this.undo()}>${sxIcon('undo', 11)} 撤销 AI 插入（${this.insertedCount} 条）</span>` : nothing}
        </div>
      </div>`
  }

  private renderTop(): TemplateResult {
    return html`
      <div class="topbar">
        <div class="brand">${sxLogo(30)} SheetX</div>
        <span class="top-divider"></span>
        <div class="top-title">AI 自然语言生成表格与业务数据<small>一句话，快速生成结构化数据，助力业务场景</small></div>
        <span class="top-badge">${sxIcon('sparkles', 12)} AI 系列 02</span>
      </div>`
  }

  private renderHero(): TemplateResult {
    return html`<div class="hero" hidden></div>`
  }

  private renderExcel(): TemplateResult {
    const tb = (ic: IconName, title = '') => html`<button class="ex-btn" title=${title}>${sxIcon(ic, 13)}</button>`
    return html`
      <div class="excel">
        <div class="ex-menu">
          ${MENU.map((m) => html`<button class="${m === this.activeMenu ? 'active' : ''}" @click=${() => { this.activeMenu = m; if (m !== '开始') toast(`${m} 菜单（演示）`) }}>${m}</button>`)}
          <span class="ok">${sxIcon('check', 12)}</span>
        </div>
        <div class="ex-toolbar">
          ${tb('undo', '撤销')}${tb('redo', '重做')}
          <span class="ex-sep"></span>
          <select class="ex-sel"><option>思源黑体</option><option>微软雅黑</option></select>
          <select class="ex-sel"><option>12</option><option>14</option></select>
          ${tb('bold', '加粗')}${tb('italic', '斜体')}${tb('underline', '下划线')}${tb('fontColor', '字体颜色')}${tb('fill', '填充')}
          <span class="ex-sep"></span>
          ${tb('alignLeft')}${tb('alignCenter')}${tb('alignRight')}${tb('gridView')}
        </div>
        <div class="formula">
          <span class="f-addr">A1 ${sxIcon('chevronDown', 9)}</span>
          <span class="f-fx">fx</span>
          <span class="f-val">${this.headers[0] ?? ''}</span>
        </div>
        <div class="sheet-area">
          <table class="grid">
            <thead><tr><th></th>${['A', 'B', 'C', 'D', 'E'].map((c) => html`<th>${c}</th>`)}</tr></thead>
            <tbody>
              <tr class="col-head"><td>1</td>${this.headers.map((h) => html`<td>${h}</td>`)}</tr>
              ${this.tableRows.slice(0, 8).map((r, i) => html`
                <tr class="${i >= 5 ? 'new-row' : ''}">
                  <td>${i + 2}</td>
                  ${r.map((v, ci) => html`<td class="${ci > 1 ? 'num' : ''} ${i === 0 && ci === 0 ? 'sel' : ''}">${v}</td>`)}
                </tr>`)}
            </tbody>
          </table>
          <div class="prompt-bubble">${this.prompt}<div class="sig">${sxIcon('sparkles', 10)} 由 ${this.scenario.name} 模板理解</div></div>
          ${this.showSuccess ? html`
            <div class="toast-card">
              <span class="tc-ico">${sxIcon('check', 20)}</span>
              <h3>数据已生成并插入表格！</h3>
              <p>共 ${this.insertedCount.toLocaleString()} 条数据，耗时 2.3 秒</p>
              <div class="bars">${[14, 22, 30, 26, 36].map((h) => html`<i style="height:${h}px"></i>`)}</div>
              <button class="btn" @click=${() => { this.showSuccess = false; toast('已定位到插入的数据区域') }}>查看数据</button>
            </div>` : nothing}
        </div>
      </div>`
  }

  private renderAiPanel(): TemplateResult {
    return html`
      <aside class="ai-panel">
        <div class="ai-head">${sxIcon('sparkles', 15)} SheetX AI 助手 <button class="x" @click=${() => toast('面板已最小化（演示）')}>${sxIcon('close', 13)}</button></div>
        <div class="ai-body">
          <div class="ai-reply">
            <span class="bot">${sxIcon('sparkles', 19)}</span>
            <div class="bubble">${this.generating ? '正在理解你的需求并规划数据结构，稍等片刻…' : `好的！我已理解你的需求，将为你生成一份「${this.scenario.name}」数据。`}</div>
          </div>
          <div class="steps">
            ${AI_STEPS.map((s, i) => html`<div class="step">${sxIcon(this.generating && i >= this.step - 1 ? 'settings' : 'checkCircle', 13)} ${s}${this.generating && i === this.step - 1 ? '（处理中…）' : ''}</div>`)}
          </div>
          <div class="tpl-row">
            ${SCENARIOS.map((s) => html`<button class="tpl ${this.scenario.id === s.id ? 'on' : ''}" @click=${() => this.chooseTemplate(s)}>${sxIcon(s.icon, 11)} ${s.name}</button>`)}
          </div>
          <div class="input-row">
            <textarea placeholder="描述你想要的表格，例如：生成一份 2024 年各地区销售数据…" .value=${this.prompt} @input=${(e: Event) => { this.prompt = (e.target as HTMLTextAreaElement).value }}></textarea>
            <button class="gen-btn" title="生成" ?disabled=${this.generating} @click=${() => this.generate()}>${sxIcon('send', 16)}</button>
          </div>
          ${this.previewRows.length ? this.renderPreview() : nothing}
          <div class="provider-note">${sxIcon('settings', 11)} 可插拔 Provider：本地生成，数据不离开浏览器；插入前可调整，插入后可撤销</div>
        </div>
      </aside>`
  }

  private renderPreview(): TemplateResult {
    return html`
      <div class="preview">
        <div class="preview-head">数据预览（共 ${this.previewRows.length} 条）<button class="cp" title="复制" @click=${() => this.copyPreview()}>${sxIcon('copy', 13)}</button></div>
        <div class="preview-scroll">
          <table>
            <thead><tr>${this.headers.map((h) => html`<th>${h}</th>`)}</tr></thead>
            <tbody>
              ${this.previewRows.slice(0, 3).map((r) => html`<tr>${r.map((v, ci) => html`<td class="${ci > 1 ? 'num' : ''}">${v}</td>`)}</tr>`)}
              ${this.previewRows.length > 3 ? html`<tr class="more-row"><td colspan=${this.headers.length}>… 共 ${this.previewRows.length} 条</td></tr>` : nothing}
            </tbody>
          </table>
        </div>
        <div class="count-row">
          <span>生成条数</span>
          <input type="number" min="3" max="200" .value=${String(this.previewCount)} @change=${(e: Event) => { this.previewCount = Number((e.target as HTMLInputElement).value) || 24; this.regeneratePreview() }} />
          <button class="fill" @click=${() => this.quickFill()}>${sxIcon('bolt', 11)} 批量填充</button>
        </div>
      </div>
      <div class="ai-actions">
        <button class="btn" @click=${() => { this.previewRows = []; toast('已取消生成') }}>取消</button>
        <button class="btn primary" @click=${() => this.insertData()}>${sxIcon('check', 13)} 插入数据</button>
      </div>`
  }

  private renderFeatures(): TemplateResult {
    return html`
      <div class="features">
        ${FEATURES.map((f) => html`
          <div class="feature" style=${`--fc:${f.color}`}>
            <span class="fi">${sxIcon(f.icon, 17)}</span>
            <span><div class="ft">${f.title}</div><div class="fd">${f.desc}</div></span>
          </div>`)}
      </div>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ai-generate-app': AiGenerateApp
  }
}
