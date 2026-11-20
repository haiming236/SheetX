/**
 * SheetX 第 46 张 · AI 数据分析：智能洞察与可视化
 *
 * 核心原则：
 * - 所有指标都由表格当前数据计算，编辑单元格后 AI 洞察与图表实时联动；
 * - 图表为原生 SVG 手写（零依赖、矢量清晰）；
 * - AI 为离线规则式模拟，不调用任何外部服务，但交互链路完整（追问/生成报告/插入图表/再分析）。
 */
import { LitElement, html, svg, nothing, type TemplateResult } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { baseStyles, lightTokens } from './tokens.js'
import { bindPageTheme, type ResolvedTheme } from './theme.js'
import { aiAnalysisStyles } from './ai-analysis-styles.js'
import { sxIcon, sxLogo } from './icons.js'
import { toast } from './toast.js'
import {
  SALE_ROWS, CHANNELS, QUICK_PROMPTS, analyze, replyTo, buildReport, fmtNum,
  type SaleRow, type AnalysisResult, type ChannelSlice,
} from './ai-analysis-data.js'

const STORE_KEY = 'sx:ai-analysis-rows'

interface ChatMsg { role: 'user' | 'bot'; text: string }
type EditTarget = { row: number; field: keyof SaleRow } | null

@customElement('ai-analysis-app')
export class AiAnalysisApp extends LitElement {
  static styles = [baseStyles, lightTokens, aiAnalysisStyles]

  @state() private theme: ResolvedTheme = 'light'
  @state() private rows: SaleRow[] = this.load()
  @state() private editing: EditTarget = null
  @state() private editValue = ''
  @state() private input = ''
  @state() private thinking = false
  @state() private chat: ChatMsg[] = []
  @state() private showReport = false
  @state() private reportText = ''
  @state() private insertedCharts = 0
  @state() private analyzeTick = 0
  @state() private zoom = 100

  private stopTheme: (() => void) | null = null

  constructor() {
    super()
    this.stopTheme = bindPageTheme((resolved) => { this.theme = resolved })
  }

  connectedCallback(): void {
    super.connectedCallback()
    this.refreshChat()
  }

  disconnectedCallback(): void {
    this.stopTheme?.()
    this.stopTheme = null
    super.disconnectedCallback()
  }

  private load(): SaleRow[] {
    try {
      const raw = localStorage.getItem(STORE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as SaleRow[]
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.every((r) => typeof r.amount === 'number')) return parsed
      }
    } catch { /* 忽略 */ }
    return SALE_ROWS.map((row) => ({ ...row }))
  }

  private save(): void {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(this.rows)) } catch { /* 忽略 */ }
  }

  private get data(): AnalysisResult {
    void this.analyzeTick
    return analyze(this.rows)
  }

  /** 依据当前数据重建 bot 摘要消息 */
  private refreshChat(): void {
    const d = this.data
    this.chat = [
      { role: 'user', text: QUICK_PROMPTS[0]! },
      {
        role: 'bot',
        text: `已完成数据分析：${d.total.toFixed(1)} 万元销售额，平均同比 ${d.avgYoy.toFixed(1)}%，${d.streak} 个月持续增长。` +
          `${d.peak ? `${d.peak.month}为增速高点。整体趋势稳中有升。` : ''}`,
      },
    ]
  }

  // ---------- 表格编辑 ----------

  private beginEdit(row: number, field: keyof SaleRow): void {
    this.editing = { row, field }
    this.editValue = String(this.rows[row]?.[field] ?? '')
    void this.updateComplete.then(() => {
      const input = this.renderRoot.querySelector('.grid input') as HTMLInputElement | null
      input?.focus()
      input?.select()
    })
  }

  private commitEdit(): void {
    const target = this.editing
    if (!target) return
    const row = this.rows[target.row]
    if (!row) { this.editing = null; return }
    const value = target.field === 'month' ? this.editValue.trim() : Number(this.editValue)
    if (target.field !== 'month' && !Number.isFinite(value as number)) {
      toast('请输入有效数字')
      this.editing = null
      return
    }
    const next = this.rows.map((item, index) =>
      index === target.row ? { ...item, [target.field]: value } : item,
    )
    this.rows = next
    this.editing = null
    this.analyzeTick++
    this.save()
    this.refreshChat()
    toast('数据已更新，洞察与图表已重新计算')
  }

  // ---------- AI 操作 ----------

  private ask(prompt = this.input): void {
    const text = prompt.trim()
    if (!text) { toast('请输入问题'); return }
    this.chat = [...this.chat, { role: 'user', text }]
    this.input = ''
    this.thinking = true
    window.setTimeout(() => {
      this.chat = [...this.chat, { role: 'bot', text: replyTo(text, this.data) }]
      this.thinking = false
    }, 420)
  }

  private reanalyze(): void {
    this.analyzeTick++
    this.chat = [
      ...this.chat,
      { role: 'user', text: '再分析一次' },
      {
        role: 'bot',
        text: `重新分析完成：基于 ${this.rows.length} 个月数据，销售额 ${this.data.total.toFixed(1)} 万元，` +
          `累计增长 ${this.data.growth.toFixed(1)}%，${this.data.insights[0]?.text ?? ''}`,
      },
    ]
    toast('已根据当前数据重新分析')
  }

  private generateReport(): void {
    this.reportText = buildReport(this.rows, this.data)
    this.showReport = true
  }

  private downloadReport(): void {
    const blob = new Blob([this.reportText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'SheetX-销售数据分析报告.txt'
    anchor.click()
    URL.revokeObjectURL(url)
    toast('报告已下载')
  }

  private async copyReport(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.reportText)
      toast('报告已复制到剪贴板')
    } catch {
      toast('复制失败，请手动选择文本')
    }
  }

  private insertChart(): void {
    this.insertedCharts++
    toast(`已在工作区插入第 ${this.insertedCharts} 张趋势图`)
  }

  // ---------- SVG 图表 ----------

  /** 组合图：绿色柱=销售额（左轴），折线=同比（右轴）。必须用 svg 模板，html 模板会把 rect 解析成 HTML 元素 */
  private renderTrendChart(): TemplateResult {
    const rows = this.rows
    const W = 420
    const H = 190
    const padL = 34
    const padR = 34
    const padT = 14
    const padB = 26
    const innerW = W - padL - padR
    const innerH = H - padT - padB
    const maxAmount = Math.max(100, ...rows.map((row) => row.amount)) * 1.15
    const maxYoy = Math.max(20, ...rows.map((row) => row.yoy)) * 1.15
    const slot = innerW / Math.max(1, rows.length)
    const barW = Math.min(26, slot * 0.5)
    const yAmount = (v: number) => padT + innerH - (v / maxAmount) * innerH
    const yYoy = (v: number) => padT + innerH - (v / maxYoy) * innerH
    const points = rows.map((row, i) => `${padL + slot * (i + 0.5)},${yYoy(row.yoy)}`).join(' ')

    const grids = Array.from({ length: 5 }, (_, i) => {
      const y = padT + (innerH * i) / 4
      const amountLabel = Math.round(maxAmount * (1 - i / 4))
      const yoyLabel = Math.round(maxYoy * (1 - i / 4))
      return svg`
        <line x1=${padL} y1=${y} x2=${W - padR} y2=${y} stroke="#e5e7eb" stroke-width="1" />
        <text x=${padL - 5} y=${y + 3} text-anchor="end" font-size="8" fill="#94a3b8">${amountLabel}</text>
        <text x=${W - padR + 5} y=${y + 3} font-size="8" fill="#94a3b8">${yoyLabel}%</text>
      `
    })

    const bars = rows.map((row, i) => {
      const x = padL + slot * (i + 0.5) - barW / 2
      const y = yAmount(row.amount)
      const h = padT + innerH - y
      return svg`
        <rect x=${x} y=${y} width=${barW} height=${h} rx="2" fill="#10b981" opacity="0.85">
          <title>${row.month}：${row.amount} 万元</title>
        </rect>
        <text x=${x + barW / 2} y=${H - 9} text-anchor="middle" font-size="9" fill="#64748b">${row.month}</text>
      `
    })

    const dots = rows.map((row, i) => svg`
      <circle cx=${padL + slot * (i + 0.5)} cy=${yYoy(row.yoy)} r="3" fill="#fff" stroke="#059669" stroke-width="2">
        <title>${row.month}同比 ${row.yoy}%</title>
      </circle>
    `)

    const chart = svg`
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="销售趋势组合图">
        ${grids}
        ${bars}
        <polyline points=${points} fill="none" stroke="#059669" stroke-width="2" />
        ${dots}
        <line x1=${padL} y1=${padT + innerH} x2=${W - padR} y2=${padT + innerH} stroke="#cbd5e1" />
      </svg>
    `

    return html`
      <div class="chart-wrap">
        ${chart}
        <div class="legend">
          <span><i style="background:#10b981"></i>销售额（万元）</span>
          <span><i style="background:#059669"></i>同比增长</span>
        </div>
      </div>
    `
  }

  /** 环形图：SVG stroke-dasharray，零依赖 */
  private renderDonut(slices: ChannelSlice[]): TemplateResult {
    const total = slices.reduce((sum, item) => sum + item.value, 0) || 1
    const R = 46
    const C = 2 * Math.PI * R
    let offset = 0
    const arcs = slices.map((slice) => {
      const length = (slice.value / total) * C
      const dash = `${length} ${C - length}`
      const arc = svg`
        <circle
          cx="60" cy="60" r=${R} fill="none" stroke=${slice.color}
          stroke-width="16" stroke-dasharray=${dash}
          stroke-dashoffset=${-offset} transform="rotate(-90 60 60)"
        ><title>${slice.name} ${slice.value}%</title></circle>
      `
      offset += length
      return arc
    })
    const primary = slices[0]
    const chart = svg`
      <svg viewBox="0 0 120 120" style="width:120px;height:120px;flex:none" role="img" aria-label="销售渠道占比">
        <circle cx="60" cy="60" r=${R} fill="none" stroke="#f1f5f9" stroke-width="16" />
        ${arcs}
        <text x="60" y="58" text-anchor="middle" class="donut-center">${primary?.value ?? 0}%</text>
        <text x="60" y="72" text-anchor="middle" class="donut-sub">${primary?.name ?? ''}销售</text>
      </svg>
    `
    return html`
      <div class="donut-wrap">
        ${chart}
        <div class="channel-legend">
          ${slices.map((slice) => html`
            <div><i style="background:${slice.color}"></i>${slice.name}<b>${slice.value}%</b></div>
          `)}
        </div>
      </div>
    `
  }

  // ---------- 渲染 ----------

  render(): TemplateResult {
    const d = this.data
    return html`
      <div class="app" data-theme=${this.theme}>
        <header class="header">
          <div class="brand">${sxLogo(30)}</div>
          <div class="divider"></div>
          <div>
            <h1>AI 数据分析：智能洞察与可视化</h1>
            <div class="sub">一键分析数据，发现业务趋势，生成专业图表与分析报告</div>
          </div>
          <div class="header-actions">
            <button class="btn" @click=${() => toast('AI 助手面板已在右侧打开')}>
              ${sxIcon('sparkles', 14)} AI 助手
            </button>
            <button class="btn" @click=${() => this.copyReport().then(() => undefined)}>
              ${sxIcon('link', 14)} 分享
            </button>
            <button class="btn primary" @click=${() => this.generateReport()}>
              ${sxIcon('download', 14)} 导出
            </button>
          </div>
        </header>

        <div class="body">
          <main class="work">
            <div class="tabs">
              <button class="menu-item active">开始</button>
              ${['插入', '页面布局', '公式', '数据', '视图', '帮助'].map((name) => html`
                <button class="menu-item" @click=${() => toast(`${name} 菜单`)}>${name}</button>
              `)}
            </div>

            <div class="toolbar">
              <button class="tb" title="撤销" @click=${() => toast('暂无可撤销的操作')}>${sxIcon('undo', 15)}</button>
              <button class="tb" title="重做" @click=${() => toast('暂无可重做的操作')}>${sxIcon('redo', 15)}</button>
              <span class="sep"></span>
              <button class="tb" @click=${() => toast('字体：思源黑体')}>思源黑体 ${sxIcon('chevronDown', 11)}</button>
              <button class="tb" @click=${() => toast('字号：12')}>12 ${sxIcon('chevronDown', 11)}</button>
              <span class="sep"></span>
              <button class="tb" @click=${() => toast('已加粗')}>${sxIcon('bold', 15)}</button>
              <button class="tb" @click=${() => toast('已设为斜体')}>${sxIcon('italic', 15)}</button>
              <button class="tb" @click=${() => toast('已加下划线')}>${sxIcon('underline', 15)}</button>
              <button class="tb" @click=${() => toast('字体颜色')}>${sxIcon('fontColor', 15)}</button>
              <span class="sep"></span>
              <button class="tb" @click=${() => toast('左对齐')}>${sxIcon('alignLeft', 15)}</button>
              <button class="tb" @click=${() => toast('居中对齐')}>${sxIcon('alignCenter', 15)}</button>
              <button class="tb" @click=${() => toast('右对齐')}>${sxIcon('alignRight', 15)}</button>
              <span class="sep"></span>
              <button class="tb ai" title="一键 AI 分析" @click=${() => this.reanalyze()}>
                ${sxIcon('sparkles', 15)} AI 分析
              </button>
              <button class="tb" title="筛选" @click=${() => toast('筛选面板')}>${sxIcon('filter', 15)}</button>
            </div>

            <div class="formula">
              <input class="addr" value="A1" readonly />
              <span class="fx">fx</span>
              <input class="value" .value=${'销售数据分析报表'} readonly />
            </div>

            <div class="grid-scroll">
              <table class="grid" style=${this.zoom !== 100 ? `width:${this.zoom}%` : ''}>
                <caption><span class="cap-icon">${sxIcon('chartBar', 20)}</span>销售数据分析报表</caption>
                <thead>
                  <tr>
                    <th style="width:19%">月份</th>
                    <th style="width:27%">销售额（万元）</th>
                    <th style="width:27%">订单量</th>
                    <th style="width:27%">同比增长</th>
                  </tr>
                </thead>
                <tbody>
                  ${this.rows.map((row, ri) => html`
                    <tr>
                      ${(['month', 'amount', 'orders', 'yoy'] as const).map((field) => {
                        const isEditing = this.editing?.row === ri && this.editing.field === field
                        const numeric = field !== 'month'
                        const className = numeric
                          ? `num ${field === 'yoy' ? (row.yoy >= 10 ? 'pos' : row.yoy < 5 ? 'neg' : '') : ''}`
                          : ''
                        return html`
                          <td class="editable ${className}" @dblclick=${() => this.beginEdit(ri, field)}>
                            ${isEditing
                              ? html`<input
                                  .value=${this.editValue}
                                  @input=${(e: Event) => { this.editValue = (e.target as HTMLInputElement).value }}
                                  @blur=${() => this.commitEdit()}
                                  @keydown=${(e: KeyboardEvent) => {
                                    if (e.key === 'Enter') this.commitEdit()
                                    if (e.key === 'Escape') this.editing = null
                                  }}
                                />`
                              : field === 'amount' ? row.amount.toFixed(1)
                              : field === 'yoy' ? `${row.yoy.toFixed(1)}%`
                              : field === 'orders' ? fmtNum(row.orders)
                              : row.month}
                          </td>
                        `
                      })}
                    </tr>
                  `)}
                </tbody>
              </table>
            </div>

            <div class="cards">
              <section class="card">
                <h3>${sxIcon('bulb', 15)} 关键洞察</h3>
                ${d.insights.map((item) => html`
                  <div class="insight ${item.tone}">
                    ${sxIcon(item.tone === 'good' ? 'checkCircle' : item.tone === 'warn' ? 'warnTriangle' : 'infoCircle', 13)}
                    <span>${item.text}</span>
                  </div>
                `)}
              </section>

              <section class="card">
                <h3>${sxIcon('chartCombo', 15)} 销售趋势分析</h3>
                ${this.renderTrendChart()}
                ${this.insertedCharts > 0
                  ? html`<div class="sub" style="text-align:center;color:var(--sx-text-hint);font-size:9px;margin-top:4px">
                      已插入 ${this.insertedCharts} 张趋势图
                    </div>`
                  : nothing}
              </section>

              <section class="card donut-card">
                <h3>${sxIcon('chartPie', 15)} 销售渠道占比</h3>
                ${this.renderDonut(CHANNELS)}
              </section>
            </div>
          </main>

          <aside class="ai-panel">
            <div class="ai-head">
              ${sxIcon('sparkles', 16)} AI 助手
              <button class="btn ghost" title="关闭" @click=${() => toast('AI 助手面板可随时通过顶部按钮唤起')}>
                ${sxIcon('close', 14)}
              </button>
            </div>
            <div class="ai-scroll">
              ${this.chat.map((msg) => html`
                <div class="msg ${msg.role}">${msg.text}</div>
              `)}
              ${this.thinking ? html`<div class="thinking">正在分析当前表格数据…</div>` : nothing}

              <div class="msg bot">
                <div class="done">${sxIcon('checkCircle', 14)} 已完成数据分析</div>
                <div>上半年销售额 ${d.total.toFixed(1)} 万元，平均同比增长 ${d.avgYoy.toFixed(1)}%，整体稳中有升。</div>
                <div class="metrics">
                  <div class="metric"><b>${(d.total / 10000).toFixed(2)}亿</b><span>上半年销售额</span></div>
                  <div class="metric"><b>${d.avgYoy.toFixed(1)}%</b><span>平均同比增长</span></div>
                  <div class="metric"><b>${fmtNum(d.orders)}</b><span>订单总量</span></div>
                </div>
                <div class="ai-insights">
                  <h4>趋势分析</h4>
                  <ul>${d.insights.slice(0, 3).map((item) => html`<li>${item.text}</li>`)}</ul>
                </div>
                <div class="ai-actions">
                  <button class="btn primary" @click=${() => this.generateReport()}>${sxIcon('file', 13)} 生成详细报告</button>
                  <button class="btn" @click=${() => this.insertChart()}>${sxIcon('chartBar', 13)} 插入图表</button>
                  <button class="btn wide" @click=${() => this.reanalyze()}>${sxIcon('refresh', 13)} 再分析一次</button>
                </div>
              </div>
            </div>
            <div class="ai-input">
              <div class="input-row">
                <input
                  .value=${this.input}
                  placeholder="输入你的问题，例如：生成销售趋势图…"
                  @input=${(e: Event) => { this.input = (e.target as HTMLInputElement).value }}
                  @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this.ask() }}
                />
                <button class="send" title="发送" @click=${() => this.ask()}>${sxIcon('send', 14)}</button>
              </div>
              <div class="quick">
                ${['有没有异常月份？', '渠道占比如何？'].map((prompt) => html`
                  <button @click=${() => this.ask(prompt)}>${prompt}</button>
                `)}
              </div>
            </div>
          </aside>
        </div>

        <footer class="statusbar">
          <button class="sheet-tab">销售分析</button>
          <span>就绪 · 共 ${this.rows.length} 个月数据</span>
          <span class="status-right">
            <button class="tb" title="缩小" @click=${() => { this.zoom = Math.max(60, this.zoom - 10) }}>${sxIcon('zoomOut', 13)}</button>
            <span>${this.zoom}%</span>
            <button class="tb" title="放大" @click=${() => { this.zoom = Math.min(160, this.zoom + 10) }}>${sxIcon('zoomIn', 13)}</button>
          </span>
        </footer>

        ${this.showReport ? html`
          <div class="modal-mask" @click=${(e: MouseEvent) => { if (e.target === e.currentTarget) this.showReport = false }}>
            <div class="modal">
              <div class="modal-head">
                ${sxIcon('file', 15)} 销售数据分析报告
                <button class="btn ghost" @click=${() => { this.showReport = false }}>${sxIcon('close', 14)}</button>
              </div>
              <div class="modal-body"><pre>${this.reportText}</pre></div>
              <div class="modal-foot">
                <button class="btn" @click=${() => this.copyReport()}>${sxIcon('copy', 13)} 复制</button>
                <button class="btn primary" @click=${() => this.downloadReport()}>${sxIcon('download', 13)} 下载 TXT</button>
              </div>
            </div>
          </div>
        ` : nothing}
      </div>
    `
  }
}
