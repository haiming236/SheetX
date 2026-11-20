/**
 * SheetX 第 48 张 · AI 智能图表生成与可视化
 *
 * 自然语言 → 图表类型/数据范围 → 可编辑 SVG 图表 → 分析洞察/报告/插入。
 * 图表为原生 SVG（零依赖），指标全部由数据计算，交互链路完整。
 */
import { LitElement, html, svg, nothing, type TemplateResult } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { baseStyles, lightTokens } from './tokens.js'
import { bindPageTheme, type ResolvedTheme } from './theme.js'
import { aiChartStyles } from './ai-chart-styles.js'
import { sxIcon, sxLogo } from './icons.js'
import { toast } from './toast.js'
import {
  MONTH_ROWS, CHANNELS, CHART_KINDS, DEFAULT_PROMPT,
  analyze, understandPrompt, replyTo, buildReport,
  type MonthRow, type ChartSpec, type ChartKind, type Analysis,
} from './ai-chart-data.js'

const STORE_KEY = 'sx:ai-chart-rows'

interface ChatMsg { role: 'user' | 'bot'; text: string; spec?: ChartSpec }
type EditTarget = { row: number; field: 'month' | 'amount' | 'yoy' } | null

@customElement('ai-chart-app')
export class AiChartApp extends LitElement {
  static styles = [baseStyles, lightTokens, aiChartStyles]

  @state() private theme: ResolvedTheme = 'light'
  @state() private rows: MonthRow[] = this.load()
  @state() private spec: ChartSpec = this.defaultSpec()
  @state() private chartSelected = true
  @state() private editing: EditTarget = null
  @state() private editValue = ''
  @state() private input = ''
  @state() private chat: ChatMsg[] = []
  @state() private insertedCharts = 0
  @state() private showReport = false
  @state() private reportText = ''
  @state() private tick = 0

  private stopTheme: (() => void) | null = null

  constructor() {
    super()
    this.stopTheme = bindPageTheme((resolved) => { this.theme = resolved })
  }

  connectedCallback(): void {
    super.connectedCallback()
    this.seedChat()
  }

  disconnectedCallback(): void {
    this.stopTheme?.()
    this.stopTheme = null
    super.disconnectedCallback()
  }

  private defaultSpec(): ChartSpec {
    return { kind: 'combo', title: '上半年销售趋势分析', from: 0, to: MONTH_ROWS.length - 1, fields: ['amount', 'yoy'], anchorCol: 'D' }
  }

  private load(): MonthRow[] {
    try {
      const raw = localStorage.getItem(STORE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as MonthRow[]
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.every((r) => typeof r.amount === 'number')) return parsed
      }
    } catch { /* 忽略 */ }
    return MONTH_ROWS.map((row) => ({ ...row }))
  }

  private save(): void {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(this.rows)) } catch { /* 忽略 */ }
  }

  private get data(): Analysis {
    void this.tick
    return analyze(this.rows)
  }

  /** 当前图表实际使用的数据（尊重 spec.from/to） */
  private get chartRows(): MonthRow[] {
    return this.rows.slice(this.spec.from, this.spec.to + 1)
  }

  private seedChat(): void {
    this.chat = [
      { role: 'user', text: DEFAULT_PROMPT },
      { role: 'bot', text: '已为您生成专业的图表，并提供分析：', spec: this.spec },
    ]
  }

  // ---------- 表格编辑 ----------

  private beginEdit(row: number, field: 'month' | 'amount' | 'yoy'): void {
    const item = this.rows[row]
    if (!item) return
    this.editing = { row, field }
    this.editValue = String(item[field])
    void this.updateComplete.then(() => {
      const input = this.renderRoot.querySelector('.grid input') as HTMLInputElement | null
      input?.focus()
      input?.select()
    })
  }

  private commitEdit(): void {
    const target = this.editing
    if (!target) return
    const value = target.field === 'month' ? this.editValue.trim() : Number(this.editValue)
    if (target.field !== 'month' && !Number.isFinite(value as number)) {
      toast('请输入有效数字')
      this.editing = null
      return
    }
    this.rows = this.rows.map((item, index) =>
      index === target.row ? { ...item, [target.field]: value } : item,
    )
    this.editing = null
    this.tick++
    this.save()
    this.seedChat()
    toast('数据已更新，图表与洞察已重新生成')
  }

  // ---------- 图表操作 ----------

  private ask(prompt = this.input): void {
    const text = prompt.trim()
    if (!text) { toast('请描述你的分析目标'); return }
    const spec = understandPrompt(text)
    spec.title = spec.title || this.spec.title
    this.spec = spec
    this.chartSelected = true
    this.chat = [
      ...this.chat,
      { role: 'user', text },
      { role: 'bot', text: `${replyTo(text, this.data)} 已生成对应图表：`, spec },
    ]
    this.input = ''
    toast(`已生成${CHART_KINDS.find((item) => item.kind === spec.kind)?.label ?? '图表'}：第 ${spec.from + 1}-${spec.to + 2} 行数据`)
  }

  private setKind(kind: ChartKind): void {
    this.spec = { ...this.spec, kind }
    this.chartSelected = true
    toast(`已切换为${CHART_KINDS.find((item) => item.kind === kind)?.label ?? kind}`)
  }

  private shiftRange(delta: number): void {
    const len = this.rows.length
    let from = this.spec.from + delta
    let to = this.spec.to + delta
    if (from < 0) { from = 0; to = Math.min(len - 1, to - this.spec.from) }
    if (to > len - 1) { to = len - 1; from = Math.max(0, from - (to - this.spec.to)) }
    if (from > to) from = to
    this.spec = { ...this.spec, from, to }
    toast(`数据范围：第 ${from + 1}-${to + 2} 行`)
  }

  private insertChart(): void {
    this.insertedCharts++
    toast(`已将「${this.spec.title}」插入表格（第 ${this.insertedCharts} 张）`)
  }

  private generateReport(): void {
    this.reportText = buildReport(this.rows, this.data)
    this.showReport = true
  }

  private async downloadReport(): Promise<void> {
    const blob = new Blob([this.reportText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'SheetX-AI图表分析报告.txt'
    anchor.click()
    URL.revokeObjectURL(url)
    toast('报告已下载')
  }

  private regenerate(): void {
    this.tick++
    this.chat = [
      ...this.chat,
      { role: 'user', text: '重新生成图表' },
      { role: 'bot', text: '已重新生成图表并更新分析要点：', spec: this.spec },
    ]
    toast('已根据当前数据重新生成')
  }

  // ---------- SVG 图表（必须用 svg 模板） ----------

  private renderCartesian(rows: MonthRow[], kind: ChartKind, showYoy: boolean): TemplateResult {
    const W = 420
    const H = 180
    const padL = 34
    const padR = 34
    const padT = 12
    const padB = 24
    const innerW = W - padL - padR
    const innerH = H - padT - padB
    const maxAmount = Math.max(100, ...rows.map((row) => row.amount)) * 1.15
    const maxYoy = Math.max(20, ...rows.map((row) => row.yoy)) * 1.15
    const slot = innerW / Math.max(1, rows.length)
    const yA = (v: number) => padT + innerH - (v / maxAmount) * innerH
    const yY = (v: number) => padT + innerH - (v / maxYoy) * innerH

    const grids = Array.from({ length: 5 }, (_, i) => {
      const y = padT + (innerH * i) / 4
      return svg`
        <line x1=${padL} y1=${y} x2=${W - padR} y2=${y} stroke="#e5e7eb" stroke-width="1" />
        <text x=${padL - 5} y=${y + 3} text-anchor="end" font-size="8" fill="#94a3b8">${Math.round(maxAmount * (1 - i / 4))}</text>
        <text x=${W - padR + 5} y=${y + 3} font-size="8" fill="#94a3b8">${Math.round(maxYoy * (1 - i / 4))}%</text>
      `
    })

    // 面积图：填充区域
    const areaPath = rows.length > 0
      ? `M ${padL + slot * 0.5} ${padT + innerH} ` +
        rows.map((row, i) => `L ${padL + slot * (i + 0.5)} ${yA(row.amount)}`).join(' ') +
        ` L ${padL + slot * (rows.length - 0.5)} ${padT + innerH} Z`
      : ''

    const bars = (kind === 'bar' || kind === 'combo') ? rows.map((row, i) => {
      const barW = Math.min(26, slot * 0.5)
      const x = padL + slot * (i + 0.5) - barW / 2
      const y = yA(row.amount)
      const h = padT + innerH - y
      return svg`
        <rect x=${x} y=${y} width=${barW} height=${h} rx="2" fill="#10b981" opacity="0.85">
          <title>${row.month}：${row.amount} 万元</title>
        </rect>
        <text x=${x + barW / 2} y=${y - 4} text-anchor="middle" font-size="8" fill="#065f46">${row.amount}</text>
        <text x=${x + barW / 2} y=${H - 8} text-anchor="middle" font-size="9" fill="#64748b">${row.month}</text>
      `
    }) : rows.map((row, i) => svg`
      <text x=${padL + slot * (i + 0.5)} y=${H - 8} text-anchor="middle" font-size="9" fill="#64748b">${row.month}</text>
    `)

    const linePoints = rows.map((row, i) => `${padL + slot * (i + 0.5)},${yA(row.amount)}`).join(' ')
    const yoyPoints = rows.map((row, i) => `${padL + slot * (i + 0.5)},${yY(row.yoy)}`).join(' ')

    return svg`
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="销售趋势图">
        ${grids}
        ${kind === 'area' ? svg`<path d=${areaPath} fill="#10b981" opacity="0.28" />` : nothing}
        ${bars}
        ${(kind === 'line' || kind === 'combo') ? svg`<polyline points=${linePoints} fill="none" stroke="#059669" stroke-width="2" />` : nothing}
        ${(kind === 'line' || kind === 'combo') ? rows.map((row, i) => svg`
          <circle cx=${padL + slot * (i + 0.5)} cy=${yA(row.amount)} r="2.8" fill="#fff" stroke="#059669" stroke-width="2">
            <title>${row.month} ${row.amount} 万元</title>
          </circle>
        `) : nothing}
        ${showYoy ? svg`<polyline points=${yoyPoints} fill="none" stroke="#059669" stroke-width="2" stroke-dasharray="4 3" opacity="0.75" />` : nothing}
        ${showYoy ? rows.map((row, i) => svg`
          <circle cx=${padL + slot * (i + 0.5)} cy=${yY(row.yoy)} r="2.6" fill="#fff" stroke="#059669" stroke-width="1.5">
            <title>${row.month}同比 ${row.yoy}%</title>
          </circle>
        `) : nothing}
        <line x1=${padL} y1=${padT + innerH} x2=${W - padR} y2=${padT + innerH} stroke="#cbd5e1" />
      </svg>
    `
  }

  private renderPie(rows: MonthRow[]): TemplateResult {
    const R = 52
    const C = 2 * Math.PI * R
    const total = rows.reduce((sum, row) => sum + row.amount, 0) || 1
    let offset = 0
    const colors = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#059669', '#047857']
    const arcs = rows.slice(0, 6).map((row, i) => {
      const length = (row.amount / total) * C
      const arc = svg`
        <circle cx="80" cy="80" r=${R} fill="none" stroke=${colors[i % colors.length]!}
          stroke-width="22" stroke-dasharray=${`${length} ${C - length}`}
          stroke-dashoffset=${-offset} transform="rotate(-90 80 80)">
          <title>${row.month} ${row.amount} 万元</title>
        </circle>
      `
      offset += length
      return arc
    })
    const chart = svg`
      <svg viewBox="0 0 160 160" style="max-width:190px;height:auto" role="img" aria-label="销售额占比饼图">
        <circle cx="80" cy="80" r=${R} fill="none" stroke="#f1f5f9" stroke-width="22" />
        ${arcs}
        <text x="80" y="78" text-anchor="middle" font-size="16" font-weight="800" fill="#065f46">${rows.length}</text>
        <text x="80" y="93" text-anchor="middle" font-size="8" fill="#94a3b8">个月</text>
      </svg>
    `
    return html`<div style="display:flex;align-items:center;justify-content:center;gap:16px">
      ${chart}
      <div style="font-size:10px;line-height:1.8;color:var(--sx-text-secondary)">
        ${rows.slice(0, 6).map((row, i) => html`<div><i style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${colors[i % colors.length]};margin-right:5px"></i>${row.month} ${((row.amount / total) * 100).toFixed(1)}%</div>`)}
      </div>
    </div>`
  }

  private renderDonut(): TemplateResult {
    const total = CHANNELS.reduce((sum, item) => sum + item.value, 0) || 1
    const R = 46
    const C = 2 * Math.PI * R
    let offset = 0
    const arcs = CHANNELS.map((slice) => {
      const length = (slice.value / total) * C
      const arc = svg`
        <circle cx="60" cy="60" r=${R} fill="none" stroke=${slice.color}
          stroke-width="16" stroke-dasharray=${`${length} ${C - length}`}
          stroke-dashoffset=${-offset} transform="rotate(-90 60 60)">
          <title>${slice.name} ${slice.value}%</title>
        </circle>
      `
      offset += length
      return arc
    })
    const chart = svg`
      <svg viewBox="0 0 120 120" style="width:118px;height:118px;flex:none" role="img" aria-label="销售渠道占比">
        <circle cx="60" cy="60" r=${R} fill="none" stroke="#f1f5f9" stroke-width="16" />
        ${arcs}
        <text x="60" y="58" text-anchor="middle" class="donut-center">${CHANNELS[0]!.value}%</text>
        <text x="60" y="72" text-anchor="middle" class="donut-sub">${CHANNELS[0]!.name}销售</text>
      </svg>
    `
    return html`<div class="donut-wrap">
      ${chart}
      <div class="channel-legend">
        ${CHANNELS.map((item) => html`<div><i style="background:${item.color}"></i>${item.name}<b>${item.value}%</b></div>`)}
      </div>
    </div>`
  }

  private renderMiniChart(): TemplateResult {
    const rows = this.chartRows
    const chart = rows.length > 0 && this.spec.kind !== 'pie'
      ? this.renderCartesian(rows.slice(0, 6), 'combo', false)
      : this.renderPie(rows.slice(0, 6))
    return html`<div class="mini-chart">
      <div class="mini-title">${this.spec.title}</div>
      ${chart}
    </div>`
  }

  // ---------- 渲染 ----------

  render(): TemplateResult {
    const rows = this.rows
    const data = this.data
    const chartRows = this.chartRows
    const chart = this.spec.kind === 'pie'
      ? this.renderPie(chartRows)
      : this.renderCartesian(chartRows, this.spec.kind, this.spec.fields.includes('yoy'))

    return html`
      <div class="app" data-theme=${this.theme}>
        <header class="header">
          <div class="brand">${sxLogo(30)}</div>
          <div class="divider"></div>
          <div>
            <h1>AI 智能图表生成与可视化</h1>
            <div class="sub">一句话生成专业图表，智能分析数据，助力业务洞察</div>
          </div>
          <div class="header-actions">
            <button class="btn" @click=${() => this.insertChart()}>${sxIcon('link', 14)} 分享</button>
            <button class="btn primary" @click=${() => this.generateReport()}>${sxIcon('download', 14)} 导出</button>
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
              <button class="tb" @click=${() => toast('撤销')}>${sxIcon('undo', 15)}</button>
              <button class="tb" @click=${() => toast('重做')}>${sxIcon('redo', 15)}</button>
              <span class="sep"></span>
              <button class="tb" @click=${() => toast('字体')}>思源黑体 ${sxIcon('chevronDown', 11)}</button>
              <button class="tb" @click=${() => toast('字号')}>12 ${sxIcon('chevronDown', 11)}</button>
              <span class="sep"></span>
              <button class="tb" @click=${() => toast('加粗')}>${sxIcon('bold', 15)}</button>
              <button class="tb" @click=${() => toast('斜体')}>${sxIcon('italic', 15)}</button>
              <button class="tb" @click=${() => toast('下划线')}>${sxIcon('underline', 15)}</button>
              <button class="tb" @click=${() => toast('字体颜色')}>${sxIcon('fontColor', 15)}</button>
              <span class="sep"></span>
              <button class="tb" @click=${() => toast('左对齐')}>${sxIcon('alignLeft', 15)}</button>
              <button class="tb" @click=${() => toast('居中')}>${sxIcon('alignCenter', 15)}</button>
              <button class="tb" @click=${() => toast('右对齐')}>${sxIcon('alignRight', 15)}</button>
              <span class="sep"></span>
              <button class="tb" @click=${() => toast('合并居中')}>合并居中</button>
              <button class="tb insert" @click=${() => this.insertChart()}>${sxIcon('chartCombo', 15)} 插入图表 ${sxIcon('chevronDown', 11)}</button>
              <button class="tb" @click=${() => toast('更多图表选项')}>${sxIcon('image', 15)} 更多 ${sxIcon('chevronDown', 11)}</button>
            </div>
            <div class="formula">
              <input class="addr" value="A1" readonly />
              <span class="fx">fx</span>
              <input class="value" value="" readonly />
            </div>

            <div class="canvas">
              <table class="grid">
                <thead><tr>
                  <th style="width:19%">A　月份</th>
                  <th style="width:25%">B　销售额（万元）</th>
                  <th style="width:22%">C　同比增长</th>
                  <th style="width:17%">D</th>
                  <th style="width:17%">E</th>
                </tr></thead>
                <tbody>
                  ${rows.map((row, ri) => html`
                    <tr>
                      <td @dblclick=${() => this.beginEdit(ri, 'month')}>
                        ${this.editing?.row === ri && this.editing.field === 'month'
                          ? html`<input .value=${this.editValue} @input=${(e: Event) => { this.editValue = (e.target as HTMLInputElement).value }} @blur=${() => this.commitEdit()} @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this.commitEdit() }} />`
                          : row.month}
                      </td>
                      <td class="num" @dblclick=${() => this.beginEdit(ri, 'amount')}>
                        ${this.editing?.row === ri && this.editing.field === 'amount'
                          ? html`<input .value=${this.editValue} @input=${(e: Event) => { this.editValue = (e.target as HTMLInputElement).value }} @blur=${() => this.commitEdit()} @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this.commitEdit() }} />`
                          : row.amount.toFixed(1)}
                      </td>
                      <td class="num" @dblclick=${() => this.beginEdit(ri, 'yoy')}>
                        ${this.editing?.row === ri && this.editing.field === 'yoy'
                          ? html`<input .value=${this.editValue} @input=${(e: Event) => { this.editValue = (e.target as HTMLInputElement).value }} @blur=${() => this.commitEdit()} @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this.commitEdit() }} />`
                          : `${row.yoy.toFixed(1)}%`}
                      </td>
                      <td></td><td></td>
                    </tr>
                  `)}
                  ${Array.from({ length: Math.max(10, 16 - rows.length) }, () => html`
                    <tr><td></td><td></td><td></td><td></td><td></td></tr>
                  `)}
                </tbody>
              </table>

              <!-- 可编辑图表浮层 -->
              <div class="chart-float ${this.chartSelected ? 'selected' : ''}" @click=${() => { this.chartSelected = true }}>
                ${['tl', 'tm', 'tr', 'ml', 'mr', 'bl', 'bm', 'br'].map((pos) => html`<span class="handle ${pos}"></span>`)}
                <div class="chart-head">
                  <input
                    class="chart-title"
                    .value=${this.spec.title}
                    @click=${(e: Event) => e.stopPropagation()}
                    @change=${(e: Event) => {
                      this.spec = { ...this.spec, title: (e.target as HTMLInputElement).value.trim() || this.spec.title }
                      toast('图表标题已更新')
                    }}
                  />
                  <div class="chart-tools">
                    ${CHART_KINDS.map((item) => html`
                      <button
                        class="chart-tool ${this.spec.kind === item.kind ? 'active' : ''}"
                        title=${item.label}
                        @click=${(e: Event) => { e.stopPropagation(); this.setKind(item.kind) }}
                      >${sxIcon(item.icon, 13)}</button>
                    `)}
                    <button class="chart-tool" title="上移数据范围" @click=${(e: Event) => { e.stopPropagation(); this.shiftRange(-1) }}>${sxIcon('chevronLeft', 13)}</button>
                    <button class="chart-tool" title="下移数据范围" @click=${(e: Event) => { e.stopPropagation(); this.shiftRange(1) }}>${sxIcon('chevronRight', 13)}</button>
                  </div>
                </div>
                <div class="chart-wrap">${chart}</div>
                ${this.spec.kind !== 'pie' ? html`
                  <div class="legend">
                    <span><i style="background:#10b981"></i>销售额（万元）</span>
                    <span><i style="background:#059669"></i>同比增长</span>
                  </div>
                ` : nothing}
              </div>
            </div>

            <div class="cards">
              <section class="card">
                <h3>${sxIcon('bulb', 15)} AI 分析洞察</h3>
                ${data.insights.map((text) => html`
                  <div class="insight">${sxIcon('checkCircle', 13)}<span>${text}</span></div>
                `)}
                ${this.insertedCharts > 0 ? html`<div style="font-size:9.5px;color:var(--sx-text-hint);margin-top:6px">已插入 ${this.insertedCharts} 张图表</div>` : nothing}
              </section>
              <section class="card">
                <h3>${sxIcon('chartPie', 15)} 销售渠道占比</h3>
                ${this.renderDonut()}
              </section>
            </div>
          </main>

          <aside class="ai-panel">
            <div class="ai-head">
              ${sxIcon('sparkles', 16)} AI 图表助手
              <button class="btn ghost" title="关闭" @click=${() => toast('可继续在输入框提问唤起图表')}>${sxIcon('close', 14)}</button>
            </div>
            <div class="ai-scroll">
              ${this.chat.map((msg) => html`
                <div class="msg ${msg.role}">
                  ${msg.text}
                  ${msg.spec ? this.renderMiniChart() : nothing}
                </div>
              `)}
              <div class="msg bot">
                <div class="points">
                  <h4>${sxIcon('sparkles', 14)} 分析要点</h4>
                  <ul>${data.insights.map((text) => html`<li>${text}</li>`)}</ul>
                </div>
                <div class="ai-actions">
                  <button class="btn primary" @click=${() => this.insertChart()}>${sxIcon('plus', 13)} 插入图表</button>
                  <button class="btn" @click=${() => this.generateReport()}>${sxIcon('file', 13)} 生成报告</button>
                  <button class="btn" @click=${() => this.regenerate()}>${sxIcon('refresh', 13)} 重新生成</button>
                </div>
              </div>
            </div>
            <div class="ai-input">
              <div class="input-row">
                <input
                  .value=${this.input}
                  placeholder="继续提问，例如：分析各产品表现…"
                  @input=${(e: Event) => { this.input = (e.target as HTMLInputElement).value }}
                  @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this.ask() }}
                />
                <button class="send" title="发送" @click=${() => this.ask()}>${sxIcon('send', 14)}</button>
              </div>
              <div class="quick">
                ${['生成上半年销售趋势图，并分析销售情况', '分析渠道占比', '预测下半年销售额'].map((prompt) => html`
                  <button @click=${() => this.ask(prompt)}>${prompt.slice(0, 10)}…</button>
                `)}
              </div>
            </div>
          </aside>
        </div>

        <footer class="statusbar">
          <button class="sheet-tab">销售数据</button>
          <button class="sheet-tab plain" @click=${() => toast('产品统计工作表')}>产品统计</button>
          <button class="sheet-tab plain" @click=${() => toast('市场分析工作表')}>市场分析</button>
          <button class="tb" title="新增工作表" @click=${() => toast('已新增工作表')}>${sxIcon('plus', 13)}</button>
          <span class="status-right">
            <button class="tb" @click=${() => toast('缩小')}>${sxIcon('zoomOut', 13)}</button>
            <span>100%</span>
            <button class="tb" @click=${() => toast('放大')}>${sxIcon('zoomIn', 13)}</button>
          </span>
        </footer>

        ${this.showReport ? html`
          <div class="modal-mask" @click=${(e: MouseEvent) => { if (e.target === e.currentTarget) this.showReport = false }}>
            <div class="modal">
              <div class="modal-head">${sxIcon('file', 15)} AI 图表分析报告
                <button class="btn ghost" @click=${() => { this.showReport = false }}>${sxIcon('close', 14)}</button>
              </div>
              <div class="modal-body"><pre>${this.reportText}</pre></div>
              <div class="modal-foot">
                <button class="btn primary" @click=${() => this.downloadReport()}>${sxIcon('download', 13)} 下载报告</button>
              </div>
            </div>
          </div>
        ` : nothing}
      </div>
    `
  }
}
