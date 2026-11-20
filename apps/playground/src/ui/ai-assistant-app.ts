/**
 * SheetX 第 44 张 · AI 助手与智能数据分析
 *
 * AI 正式纳入产品体系。核心原则：
 * - 纯前端嵌入式 SDK，不强制搭建 AI 云端服务器
 * - 可插拔 Provider（自定义云端 API / 本地模型 / 企业 AI 服务）
 * - AI 生成/修改数据提供预览、确认和撤销
 */
import { LitElement, html, nothing, type TemplateResult } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { baseStyles, lightTokens } from './tokens.js'
import { bindPageTheme, type ResolvedTheme } from './theme.js'
import { aiAssistantStyles } from './ai-assistant-styles.js'
import { sxIcon, sxLogo, type IconName } from './icons.js'
import { toast } from './toast.js'
import {
  SIDE_NAV, SALE_ROWS, TREND, PROVIDERS, QUICK_ACTIONS, AI_REPLIES,
  PREVIEW_PLANS, DEFAULT_CONFIG, fmtMoney, fmtNum, SALE_TOTAL,
  type FullConfig, type PreviewPlan, type SaleRow,
} from './ai-assistant-data.js'

const STORE_KEY = 'sx:ai-assistant-config'

interface ChatMsg { role: 'user' | 'bot'; text: string }

@customElement('ai-assistant-app')
export class AiAssistantApp extends LitElement {
  static styles = [baseStyles, lightTokens, aiAssistantStyles]

  @state() private theme: ResolvedTheme = 'light'
  @state() private cfg: FullConfig = this.load()
  @state() private rows: SaleRow[] = SALE_ROWS.map((r) => ({ ...r }))
  @state() private activeNav = '首页'
  @state() private activeTab = '销售数据分析'
  @state() private input = ''
  @state() private chat: ChatMsg[] = []
  @state() private thinking = false
  @state() private showProvider = false
  @state() private previewPlan: PreviewPlan | null = null
  @state() private undoStack: Array<{ label: string; rows: SaleRow[] }> = []
  @state() private changedCells = new Set<string>()

  private stopTheme: (() => void) | null = null

  constructor() {
    super()
    this.stopTheme = bindPageTheme((resolved) => { this.theme = resolved })
  }

  connectedCallback(): void { super.connectedCallback() }
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
  private patch(p: Partial<FullConfig>): void { this.cfg = { ...this.cfg, ...p }; this.save() }

  private get provider(): typeof PROVIDERS[number] {
    return PROVIDERS.find((p) => p.id === this.cfg.provider) ?? PROVIDERS[1]
  }

  // ===== AI 对话（模拟，不调用真实服务） =====
  private ask(prompt: string): void {
    if (!prompt.trim()) return
    if (!this.cfg.aiEnabled) { toast('AI 助手已停用，请在 Provider 设置中启用'); return }
    this.chat = [...this.chat, { role: 'user', text: prompt.trim() }]
    this.input = ''
    this.thinking = true
    const reply = this.makeReply(prompt)
    setTimeout(() => {
      this.chat = [...this.chat, { role: 'bot', text: reply }]
      this.thinking = false
    }, 620)
  }

  private makeReply(prompt: string): string {
    for (const r of AI_REPLIES) {
      if (r.match.some((m) => prompt.includes(m))) return r.reply
    }
    const provider = this.provider
    return `🤖 已收到你的问题「${prompt}」。当前由 ${provider.name} 处理（纯前端接入，数据不经过 SheetX 服务器）。这是演示回复，实际结果由你配置的 Provider 返回。`
  }

  // ===== 预览 → 确认 → 撤销 =====
  private requestPreview(kind: 'generate' | 'clean'): void {
    if (!this.cfg.aiEnabled) { toast('AI 助手已停用'); return }
    this.previewPlan = PREVIEW_PLANS[kind]
  }

  private confirmPreview(): void {
    if (!this.previewPlan) return
    const plan = this.previewPlan
    // 保存撤销快照
    this.undoStack = [...this.undoStack, { label: plan.title, rows: this.rows.map((r) => ({ ...r })) }]
    if (plan.id === 'clean') {
      const next = this.rows.map((r) => ({ ...r }))
      next[4].share = 9.0 // E7 占比 8.9% → 9.0%
      this.rows = next
    } else if (plan.id === 'generate') {
      // AI 生成：把建议数据真正写入表格第 9 行（A9-E9）
      this.rows = [...this.rows, {
        product: 'MagSafe 充电器', qty: 1420, amount: 426000,
        growth: 15.2, share: 6.0, color: '#ec4899',
      }]
    }
    this.changedCells = new Set(plan.changes.map((c) => c.cell))
    this.chat = [...this.chat, { role: 'bot', text: `✅ 已应用「${plan.title}」，${plan.changes.length} 处变更。可点击底部「撤销上次」恢复。` }]
    this.previewPlan = null
    toast('已应用 AI 建议，可撤销')
  }

  private undo(): void {
    const last = this.undoStack[this.undoStack.length - 1]
    if (!last) { toast('没有可撤销的操作'); return }
    this.rows = last.rows
    this.undoStack = this.undoStack.slice(0, -1)
    this.changedCells = new Set()
    toast(`已撤销：${last.label}`)
  }

  private chooseNav(label: string): void {
    this.activeNav = label
    if (label === 'AI 助手') {
      toast('AI 助手面板已在右侧展开')
      return
    }
    toast(`${label}（本页聚焦 AI 助手与数据分析）`)
  }

  render(): TemplateResult {
    return html`
      <div class="app" data-ai-theme=${this.theme}>
        ${this.renderTop()}
        <div class="body">
          ${this.renderSidebar()}
          ${this.renderWork()}
          ${this.cfg.showAiPanel ? this.renderAiPanel() : nothing}
        </div>
        ${this.renderStatus()}
        ${this.showProvider ? this.renderProviderModal() : nothing}
        ${this.previewPlan ? this.renderPreviewModal() : nothing}
      </div>`
  }

  private renderTop(): TemplateResult {
    return html`
      <div class="topbar">
        <div class="brand">${sxLogo(26)}</div>
        <div class="crumb">${sxIcon('gridView', 12)} 工作台 ${sxIcon('chevronRight', 11)} 电子表格</div>
        <div class="top-search">${sxIcon('search', 13)}<input placeholder="搜索功能或示例..." /></div>
        <button class="icon-btn" title="主题" @click=${() => { document.dispatchEvent(new CustomEvent('sx-toggle-theme')); toast('已切换深浅主题') }}>${sxIcon('sun', 15)}</button>
        <button class="icon-btn" title="通知" @click=${() => toast('暂无新通知')}>${sxIcon('bell', 15)}<span class="rd"></span></button>
        <span class="avatar">李</span>
      </div>`
  }

  private renderSidebar(): TemplateResult {
    return html`
      <aside class="sidebar">
        ${SIDE_NAV.map((n) => html`
          <button class="side-item ${n.label === this.activeNav ? 'active' : ''}" @click=${() => this.chooseNav(n.label)}>
            ${sxIcon(n.icon, 14)} ${n.label}
            ${n.label === 'AI 助手' ? html`<span class="ai-dot"></span>` : nothing}
          </button>`)}
        <div class="side-cta">
          <div class="t">SheetX</div>
          <div class="d">专业的表格与电子表格解决方案</div>
          ${sxIcon('gridView', 26)}
        </div>
      </aside>`
  }

  private renderWork(): TemplateResult {
    const tb = (ic: IconName, title: string, fn?: () => void) => html`<button class="tb" title=${title} @click=${fn ?? (() => toast(`${title}（演示）`))}>${sxIcon(ic, 13)}</button>`
    return html`
      <div class="work">
        <div class="tabs">
          <button class="ftab active">${sxIcon('gridView', 12)} ${this.activeTab} <span class="x">${sxIcon('close', 10)}</span></button>
          <button class="add-tab" title="新建" @click=${() => toast('新建工作表（演示）')}>${sxIcon('plus', 13)}</button>
        </div>
        <div class="toolbar">
          ${tb('undo', '撤销')}${tb('redo', '重做')}
          <span class="tb-sep"></span>
          <select class="tb-sel"><option>思源黑体</option><option>微软雅黑</option></select>
          <select class="tb-sel"><option>12</option><option>14</option></select>
          ${tb('bold', '加粗')}${tb('italic', '斜体')}${tb('underline', '下划线')}${tb('fontColor', '字体颜色')}${tb('fill', '填充')}
          <span class="tb-sep"></span>
          ${tb('alignLeft', '左对齐')}${tb('alignCenter', '居中')}${tb('alignRight', '右对齐')}${tb('gridView', '边框')}
          <span class="tb-sep"></span>
          ${tb('filter', '筛选')}${tb('sort', '排序')}${tb('sigma', '求和')}${tb('chartBar', '插入图表')}${tb('more', '更多')}
        </div>
        <div class="sheet-scroll">
          ${this.renderGrid()}
          ${this.renderCharts()}
        </div>
      </div>`
  }

  private renderGrid(): TemplateResult {
    return html`
      <table class="grid">
        <thead><tr><th></th><th>A</th><th>B</th><th>C</th><th>D</th><th>E</th></tr></thead>
        <tbody>
          <tr class="title-row"><td>1</td><td colspan="5">${sxIcon('tableStyle', 13)} 销售数据分析报告 <span class="gen-time">生成时间：2025-11-20</span></td></tr>
          <tr class="col-head"><td>2</td><td>产品名称</td><td>销售数量</td><td>销售金额</td><td>同比增长</td><td>占比</td></tr>
          ${this.rows.map((r, i) => {
            const rowNo = i < 5 ? i + 3 : i + 4 // 第 8 行留给 AI 提示，新增数据从第 9 行起
            return html`
            <tr>
              <td>${rowNo}</td>
              <td class="${this.changedCells.has(`A${rowNo}`) ? 'changed' : ''}">${r.product}</td>
              <td class="num ${this.changedCells.has(`B${rowNo}`) ? 'changed' : ''}">${fmtNum(r.qty)}</td>
              <td class="num ${this.changedCells.has(`C${rowNo}`) ? 'changed' : ''}">${fmtMoney(r.amount)}</td>
              <td class="grow ${r.growth < 0 ? 'down' : ''} ${this.changedCells.has(`D${rowNo}`) ? 'changed' : ''}">▲ ${r.growth}%</td>
              <td class="${this.changedCells.has(`E${rowNo}`) ? 'changed' : ''}"><span class="share-bar"><i style="width:${r.share * 2.4}px;background:${r.color}"></i></span>${r.share}%</td>
            </tr>`
          })}
          ${this.rows.length <= 5 ? html`<tr><td>8</td><td colspan="5" style="color:var(--sx-text-hint);font-size:9px">${sxIcon('sparkles', 11)} AI 可在此区域生成更多数据（需预览确认）</td></tr>` : nothing}
        </tbody>
      </table>`
  }

  private renderCharts(): TemplateResult {
    return html`
      <div class="charts">
        <div class="chart-card">
          <h4>${sxIcon('chartLine', 13)} 销售趋势分析</h4>
          <div class="chart-legend"><span><i style="background:#16a34a"></i>销售额</span><span><i style="background:#2563eb"></i>销售数量</span></div>
          ${this.renderTrendChart()}
        </div>
        <div class="chart-card">
          <h4>${sxIcon('chartPie', 13)} 产品销售占比</h4>
          ${this.renderPieChart()}
        </div>
      </div>`
  }

  /** 纯 SVG 折线 + HTML 网格线（避开 SVG line/rect 在 shadow DOM 不渲染的坑） */
  private renderTrendChart(): TemplateResult {
    const W = 300, H = 76
    const y = (v: number) => H - (v / 150) * H
    const pts = (key: 'revenue' | 'qty') => TREND.map((d, i) => `${(i / (TREND.length - 1)) * W},${y(d[key])}`).join(' ')
    return html`
      <div class="trend-box">
        <div class="trend-y">${[150, 100, 50, 0].map((n) => html`<span>${n}万</span>`)}</div>
        <div class="trend-plot">
          ${[0, 1, 2, 3].map((i) => html`<div class="gl" style=${`top:${(i / 3) * 100}%`}></div>`)}
          <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-label="销售趋势图">
            <polyline points=${pts('revenue')} style="fill:none;stroke:#16a34a;stroke-width:2" />
            <polyline points=${pts('qty')} style="fill:none;stroke:#2563eb;stroke-width:2" />
            ${TREND.map((d, i) => html`
              <circle cx=${(i / (TREND.length - 1)) * W} cy=${y(d.revenue)} r="2.8" style="fill:#16a34a;stroke:#fff;stroke-width:1" />
              <circle cx=${(i / (TREND.length - 1)) * W} cy=${y(d.qty)} r="2.8" style="fill:#2563eb;stroke:#fff;stroke-width:1" />`)}
          </svg>
          <div class="trend-x">${TREND.map((d) => html`<span>${d.month}</span>`)}</div>
        </div>
      </div>`
  }

  /** CSS conic-gradient 环形图（不用 SVG fill=conic-gradient，避免画黑） */
  private renderPieChart(): TemplateResult {
    const stops: string[] = []
    let acc = 0
    for (const r of this.rows) {
      const end = acc + r.share
      stops.push(`${r.color} ${acc}% ${end}%`)
      acc = end
    }
    stops.push(`#cbd5e1 ${acc}% 100%`)
    return html`
      <div class="pie-box">
        <div class="pie-donut" style=${`background:conic-gradient(${stops.join(', ')})`}><span>100%</span></div>
        <div class="pie-legend">
          ${this.rows.map((r) => html`<div class="lr"><i style="background:${r.color}"></i>${r.product}<span class="p">${r.share}%</span></div>`)}
          <div class="lr"><i style="background:#cbd5e1"></i>其他<span class="p">${(100 - acc).toFixed(1)}%</span></div>
        </div>
      </div>`
  }

  private renderAiPanel(): TemplateResult {
    return html`
      <aside class="ai-panel">
        <div class="ai-head">
          ${sxIcon('sparkles', 15)} AI 助手
          <span class="on"><i></i>在线</span>
          <button title="最小化" @click=${() => this.patch({ showAiPanel: false })}>${sxIcon('close', 12)}</button>
        </div>
        <div class="ai-content">
          <div class="ai-hello">
            <span class="ai-bot">${sxIcon('sparkles', 18)}</span>
            <div class="bubble">你好！我是 SheetX AI 助手<br />有什么可以帮助你的吗？</div>
          </div>
          <div class="quick-grid">
            ${QUICK_ACTIONS.map((q) => html`
              <button class="quick" @click=${() => this.ask(q.prompt)}>${sxIcon(q.icon, 13)} ${q.label}</button>`)}
          </div>
          <div class="summary">
            <div class="sh">${sxIcon('checkCircle', 13)} 已为你生成数据分析摘要</div>
            <div class="sb">本月销售额达到 ${fmtMoney(SALE_TOTAL)}，同比增长 8.6%。MacBook Pro 销售表现最佳，占比 28.4%，建议加大该产品的市场推广力度。</div>
            <span class="sl" @click=${() => this.ask('分析本月数据的趋势和异常')}>查看详情 ${sxIcon('chevronRight', 10)}</span>
          </div>
          ${this.chat.map((m) => html`<div class="ai-msg ${m.role}">${m.text}</div>`)}
          ${this.thinking ? html`<div class="ai-msg bot">${sxIcon('sparkles', 11)} 正在思考…</div>` : nothing}
        </div>
        <div class="ai-input">
          <div class="input-box">
            <textarea placeholder="请输入你的问题，例如：帮我分析一下本季度的销售趋势..." .value=${this.input} @input=${(e: Event) => { this.input = (e.target as HTMLTextAreaElement).value }} @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.ask(this.input) } }}></textarea>
            <button class="send-btn" title="发送" @click=${() => this.ask(this.input)}>${sxIcon('send', 14)}</button>
          </div>
          <div class="ai-foot">
            <button @click=${() => this.requestPreview('generate')}>${sxIcon('sparkles', 11)} AI 生成数据</button>
            <button @click=${() => this.ask('分析本月数据的趋势和异常')}>${sxIcon('chartLine', 11)} 智能分析</button>
            <button @click=${() => this.ask('根据数据自动创建合适的图表')}>${sxIcon('chartBar', 11)} 生成图表</button>
          </div>
          <div class="provider-chip" @click=${() => { this.showProvider = true }}>${sxIcon(this.provider.icon, 11)} Provider：${this.provider.name} · 可插拔 ${sxIcon('chevronRight', 9)}</div>
        </div>
      </aside>`
  }

  private renderStatus(): TemplateResult {
    const avg = Math.round(SALE_TOTAL / this.rows.length)
    return html`
      <div class="statusbar">
        <span class="ready"><i></i>就绪</span>
        <span>SheetX AI · ${this.provider.name}</span>
        <span class="stats">
          <span>平均值：${fmtMoney(avg)}</span>
          <span>计数：${this.rows.length}</span>
          <span>求和：${fmtMoney(this.rows.reduce((a, r) => a + r.amount, 0))}</span>
          <span>${this.undoStack.length ? html`<a style="color:#059669;cursor:pointer" @click=${() => this.undo()}>撤销上次 AI 操作</a>` : nothing}</span>
          <span>100% +</span>
        </span>
      </div>`
  }

  /** Provider 配置弹窗：可插拔，纯前端，无需强制云端 */
  private renderProviderModal(): TemplateResult {
    return html`
      <div class="mask" @click=${(e: Event) => { if (e.target === e.currentTarget) this.showProvider = false }}>
        <div class="modal">
          <div class="modal-head">${sxIcon('settings', 15)} AI Provider 配置 <button @click=${() => { this.showProvider = false }}>${sxIcon('close', 14)}</button></div>
          <div class="modal-body">
            <p class="modal-desc">SheetX 是纯前端嵌入式表格 SDK，<b>不强制搭建 AI 云端服务器</b>。AI 层采用可插拔 Provider 架构，你可选择自己的云端 API、本地模型或企业 AI 服务。</p>
            ${PROVIDERS.map((p) => html`
              <div class="provider-opt ${this.cfg.provider === p.id ? 'on' : ''}" @click=${() => { this.patch({ provider: p.id }); toast(`已切换 Provider：${p.name}`) }}>
                <span class="pi" style="background:${p.color}">${sxIcon(p.icon, 16)}</span>
                <span><div class="pn">${p.name}</div><div class="pd">${p.desc}</div></span>
                <span class="badge">${p.badge}</span>
              </div>`)}
            ${this.cfg.provider === 'cloud' ? html`
              <div class="field"><label>API Endpoint</label><input .value=${this.cfg.apiEndpoint} @input=${(e: Event) => this.patch({ apiEndpoint: (e.target as HTMLInputElement).value })} /></div>
              <div class="field"><label>模型名称</label><input .value=${this.cfg.modelName} @input=${(e: Event) => this.patch({ modelName: (e.target as HTMLInputElement).value })} /></div>
            ` : nothing}
            <div class="field" style="display:flex;align-items:center;gap:8px">
              <input type="checkbox" .checked=${this.cfg.aiEnabled} @change=${(e: Event) => this.patch({ aiEnabled: (e.target as HTMLInputElement).checked })} style="width:auto;height:auto" />
              <label style="margin:0">启用 AI 助手（关闭后 Provider 不参与任何请求）</label>
            </div>
            <div class="principle-note">${sxIcon('infoCircle' as IconName, 13)} 密钥与端点仅保存在浏览器本地。AI 生成/修改数据时一律先预览、经你确认后应用，并支持一键撤销。</div>
          </div>
          <div class="modal-foot"><button class="btn primary" @click=${() => { this.showProvider = false; toast('Provider 配置已保存') }}>完成</button></div>
        </div>
      </div>`
  }

  /** 预览 → 确认弹窗：AI 变更 diff */
  private renderPreviewModal(): TemplateResult {
    const plan = this.previewPlan!
    return html`
      <div class="mask" @click=${(e: Event) => { if (e.target === e.currentTarget) this.previewPlan = null }}>
        <div class="modal">
          <div class="modal-head">${sxIcon('eye', 15)} AI 变更预览 <button @click=${() => { this.previewPlan = null }}>${sxIcon('close', 14)}</button></div>
          <div class="modal-body">
            <p class="modal-desc"><b>${plan.title}</b><br />${plan.desc}</p>
            <table class="diff-table">
              <thead><tr><th>单元格</th><th>字段</th><th>修改前</th><th>修改后</th></tr></thead>
              <tbody>
                ${plan.changes.map((c) => html`<tr><td>${c.cell}</td><td>${c.field}</td><td class="diff-before">${c.before}</td><td class="diff-after">${c.after}</td></tr>`)}
              </tbody>
            </table>
            <div class="principle-note">${sxIcon('shieldCheck', 13)} 所有 AI 变更都需要你确认后才会写入表格；应用后可随时一键撤销，SheetX 不会自动提交任何数据到服务器。</div>
          </div>
          <div class="modal-foot">
            <button class="btn" @click=${() => { this.previewPlan = null; toast('已取消 AI 建议') }}>取消</button>
            <button class="btn primary" @click=${() => this.confirmPreview()}>确认应用 ${plan.changes.length} 处变更</button>
          </div>
        </div>
      </div>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ai-assistant-app': AiAssistantApp
  }
}
