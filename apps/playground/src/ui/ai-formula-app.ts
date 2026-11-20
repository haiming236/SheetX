/**
 * SheetX 第 47 张 · AI 公式助手：智能生成与解释公式
 *
 * - 自然语言 → 公式（规则式离线生成，覆盖 SUM/AVERAGE/SUMIF/COUNT/MAX/MIN）
 * - 公式求值走真实 @sheetx/formula 引擎（Lexer→AST→Evaluator），预览结果真实
 * - 公式解释、错误诊断与一键修复
 * - 一键复制 / 插入到表格 / 诊断修复全部可点
 */
import { LitElement, html, nothing, type TemplateResult } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { baseStyles, lightTokens } from './tokens.js'
import { bindPageTheme, type ResolvedTheme } from './theme.js'
import { aiFormulaStyles } from './ai-formula-styles.js'
import { sxIcon, sxLogo, type IconName } from './icons.js'
import { toast } from './toast.js'
import {
  PRODUCT_ROWS, SHEET, QUICK_PROMPTS, createEngine, evalFormula, fmt,
  generateFormula, explain, diagnose,
  type ProductRow, type FormulaSuggestion,
} from './ai-formula-data.js'

const STORE_KEY = 'sx:ai-formula-rows'

interface ChatMsg { role: 'user' | 'bot'; text: string; formulas?: FormulaSuggestion[] }
type EditTarget = { row: number; field: 'name' | 'price' | 'qty' } | null

@customElement('ai-formula-app')
export class AiFormulaApp extends LitElement {
  static styles = [baseStyles, lightTokens, aiFormulaStyles]

  @state() private theme: ResolvedTheme = 'light'
  @state() private rows: ProductRow[] = this.load()
  @state() private selected = { row: 1, col: 3 }
  @state() private editing: EditTarget = null
  @state() private editValue = ''
  @state() private formulaInput = '=SUM(C2:C6)'
  @state() private input = ''
  @state() private chat: ChatMsg[] = []
  @state() private showSuggest = true
  @state() private suggestionIndex = 0
  @state() private activeSuggestion = 0
  @state() private zoom = 100
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

  private load(): ProductRow[] {
    try {
      const raw = localStorage.getItem(STORE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as ProductRow[]
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.every((r) => typeof r.price === 'number')) return parsed
      }
    } catch { /* 忽略 */ }
    return PRODUCT_ROWS.map((row) => ({ ...row }))
  }

  private save(): void {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(this.rows)) } catch { /* 忽略 */ }
  }

  private get engine() {
    void this.tick
    return createEngine(this.rows)
  }

  private get totalSales(): number | string {
    return evalFormula(this.engine, '=SUM(D2:D6)')
  }

  private get avgSales(): number | string {
    return evalFormula(this.engine, '=AVERAGE(D2:D6)')
  }

  private seedChat(): void {
    this.chat = [
      { role: 'user', text: QUICK_PROMPTS[0]! },
      {
        role: 'bot',
        text: '好的！我来为你生成公式。',
        formulas: [
          { formula: '=SUM(D2:D6)', desc: '计算总销售额', icon: 'chartBar' },
          { formula: '=AVERAGE(D2:D6)', desc: '计算平均销售额', icon: 'sigma' },
        ],
      },
    ]
  }

  // ---------- 表格交互 ----------

  private selectCell(row: number, col: number): void {
    this.selected = { row, col }
    if (row > 0 && col < 4) {
      const item = this.rows[row - 1]
      if (item) {
        this.formulaInput = col === 3 ? item.formula : col === 1 ? String(item.price) : col === 2 ? String(item.qty) : item.name
      }
    }
  }

  private beginEdit(row: number, field: 'name' | 'price' | 'qty'): void {
    // row 是 0-based 数据行索引（与 tbody map 的 ri 一致）
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
    const value = target.field === 'name' ? this.editValue.trim() : Number(this.editValue)
    if (target.field !== 'name' && !Number.isFinite(value as number)) {
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
    toast('数据已更新，公式结果已重算')
  }

  // ---------- AI 公式 ----------

  private ask(prompt = this.input): void {
    const text = prompt.trim()
    if (!text) { toast('请输入计算需求'); return }
    const formulas = generateFormula(text)
    this.chat = [
      ...this.chat,
      { role: 'user', text },
      { role: 'bot', text: `已根据你的描述生成 ${formulas.length} 条公式，点击公式可预览结果：`, formulas },
    ]
    this.input = ''
    this.formulaInput = formulas[0]?.formula ?? this.formulaInput
    this.suggestions = formulas
    this.suggestionIndex = 0
    this.activeSuggestion = 0
    this.showSuggest = true
  }

  @state() private suggestions: FormulaSuggestion[] = []

  private chooseFormula(formula: string): void {
    this.formulaInput = formula
    const index = this.suggestions.findIndex((item) => item.formula === formula)
    if (index >= 0) this.activeSuggestion = index
    toast(`已选择公式：${formula}`)
  }

  private get currentResult(): number | string {
    return evalFormula(this.engine, this.formulaInput)
  }

  private get currentDiagnosis() {
    return diagnose(this.formulaInput)
  }

  private async copyFormula(formula = this.formulaInput): Promise<void> {
    try {
      await navigator.clipboard.writeText(formula)
      toast('公式已复制到剪贴板')
    } catch {
      toast('复制失败，请手动选择')
    }
  }

  private insertFormula(): void {
    const diagnosis = this.currentDiagnosis
    if (!diagnosis.ok) { toast(`公式有误：${diagnosis.message}`); return }
    const { row, col } = this.selected
    if (row === 0 || col !== 3) {
      // 默认写回当前行的「小计」列
      this.rows = this.rows.map((item, index) =>
        index === row - 1 ? { ...item, formula: this.formulaInput } : item,
      )
      this.selected = { row: Math.max(1, row), col: 3 }
    } else {
      this.rows = this.rows.map((item, index) =>
        index === row - 1 ? { ...item, formula: this.formulaInput } : item,
      )
    }
    this.tick++
    this.save()
    this.seedChat()
    toast(`已将 ${this.formulaInput} 插入表格，结果：${fmt(this.currentResult)}`)
  }

  private applyFix(): void {
    const fixed = this.currentDiagnosis.fixed
    if (!fixed) { toast('没有可用的修复建议'); return }
    this.formulaInput = fixed
    toast(`已修复为 ${fixed}`)
  }

  private refreshSuggestions(): void {
    if (this.suggestions.length === 0) this.suggestions = QUICK_PROMPTS.length > 0 ? generateFormula(QUICK_PROMPTS[0]!) : []
    this.suggestionIndex = (this.suggestionIndex + 1) % Math.max(1, this.suggestions.length)
    this.activeSuggestion = this.suggestionIndex
    toast('已切换推荐公式')
  }

  private feedback(helpful: boolean): void {
    toast(helpful ? '感谢反馈，已记录这条公式有帮助' : '感谢反馈，我们会继续优化')
  }

  // ---------- 渲染 ----------

  render(): TemplateResult {
    const suggestions = this.suggestions.length > 0 ? this.suggestions : generateFormula(QUICK_PROMPTS[0]!)
    const diag = this.currentDiagnosis
    return html`
      <div class="app" data-theme=${this.theme}>
        <header class="header">
          <div class="brand">${sxLogo(30)}</div>
          <div class="divider"></div>
          <div>
            <h1>AI 公式助手：智能生成与解释公式</h1>
            <div class="sub">用自然语言描述需求，AI 帮你生成公式、解释公式、修复错误</div>
          </div>
          <div class="header-actions">
            <button class="btn" @click=${() => this.copyFormula()}>${sxIcon('link', 14)} 分享</button>
            <button class="btn primary" @click=${() => this.copyFormula()}>${sxIcon('download', 14)} 导出</button>
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
            </div>

            <div class="formula">
              <input
                class="addr"
                .value=${`${String.fromCharCode(65 + this.selected.col)}${this.selected.row + 1}`}
                @change=${(e: Event) => {
                  const text = (e.target as HTMLInputElement).value.toUpperCase()
                  const match = /^([A-Z]+)(\d+)$/.exec(text.trim())
                  if (!match) { toast('地址格式应为如 D2'); return }
                  const col = match[1]!.split('').reduce((sum, ch) => sum * 26 + (ch.charCodeAt(0) - 64), 0) - 1
                  const row = Number(match[2]) - 1
                  if (col >= 0 && col < 4 && row >= 0) this.selectCell(row, col)
                  else toast('该地址不在当前数据区域')
                }}
              />
              <span class="fx">fx</span>
              <input
                class="value"
                .value=${this.formulaInput}
                @input=${(e: Event) => { this.formulaInput = (e.target as HTMLInputElement).value }}
                @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') toast(`结果：${fmt(this.currentResult)}`) }}
              />
            </div>

            <div class="grid-scroll">
              <table class="grid">
                <thead>
                  <tr>
                    <th style="width:34%">A　产品名称</th>
                    <th style="width:22%">B　单价（元）</th>
                    <th style="width:20%">C　数量</th>
                    <th style="width:24%">D　小计</th>
                  </tr>
                </thead>
                <tbody>
                  ${this.rows.map((item, ri) => html`
                    <tr>
                      <td
                        class="${this.selected.row === ri + 1 && this.selected.col === 0 ? 'selected' : ''} ${this.editing?.row === ri && this.editing.field === 'name' ? 'editable' : ''}"
                        @click=${() => this.selectCell(ri + 1, 0)}
                        @dblclick=${() => this.beginEdit(ri, 'name')}
                      >${this.editing?.row === ri && this.editing.field === 'name'
                        ? html`<input .value=${this.editValue} @input=${(e: Event) => { this.editValue = (e.target as HTMLInputElement).value }} @blur=${() => this.commitEdit()} @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this.commitEdit() }} />`
                        : item.name}</td>
                      <td
                        class="num ${this.selected.row === ri + 1 && this.selected.col === 1 ? 'selected' : ''}"
                        @click=${() => this.selectCell(ri + 1, 1)}
                        @dblclick=${() => this.beginEdit(ri, 'price')}
                      >${this.editing?.row === ri && this.editing.field === 'price'
                        ? html`<input .value=${this.editValue} @input=${(e: Event) => { this.editValue = (e.target as HTMLInputElement).value }} @blur=${() => this.commitEdit()} @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this.commitEdit() }} />`
                        : fmt(item.price)}</td>
                      <td
                        class="num ${this.selected.row === ri + 1 && this.selected.col === 2 ? 'selected' : ''}"
                        @click=${() => this.selectCell(ri + 1, 2)}
                        @dblclick=${() => this.beginEdit(ri, 'qty')}
                      >${this.editing?.row === ri && this.editing.field === 'qty'
                        ? html`<input .value=${this.editValue} @input=${(e: Event) => { this.editValue = (e.target as HTMLInputElement).value }} @blur=${() => this.commitEdit()} @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this.commitEdit() }} />`
                        : item.qty}</td>
                      <td
                        class="num ${this.selected.row === ri + 1 && this.selected.col === 3 ? 'selected' : ''}"
                        @click=${() => this.selectCell(ri + 1, 3)}
                      >${fmt(evalFormula(this.engine, item.formula))}</td>
                    </tr>
                  `)}
                  <tr class="total">
                    <td>合计</td>
                    <td class="num">—</td>
                    <td class="num">${fmt(evalFormula(this.engine, '=SUM(C2:C6)'))}</td>
                    <td class="num">${fmt(this.totalSales)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            ${this.showSuggest ? html`
              <div class="float-card">
                <div class="float-head">
                  ${sxIcon('sparkles', 15)} AI 公式推荐
                  <button class="tb ref" title="换一批" @click=${() => this.refreshSuggestions()}>${sxIcon('refresh', 14)}</button>
                  <button class="tb ref" title="关闭" @click=${() => { this.showSuggest = false }}>${sxIcon('close', 14)}</button>
                </div>
                ${suggestions.map((item, index) => html`
                  <div
                    class="suggest ${index === this.activeSuggestion ? 'active' : ''}"
                    @click=${() => this.chooseFormula(item.formula)}
                  >
                    <span class="ico">${sxIcon(item.icon as IconName, 15)}</span>
                    <span>
                      <code>${item.formula}</code>
                      <div class="desc">${item.desc}</div>
                    </span>
                  </div>
                `)}
              </div>
            ` : html`<button class="btn sm" style="position:absolute;left:12px;bottom:44px" @click=${() => { this.showSuggest = true }}>${sxIcon('sparkles', 13)} 打开公式推荐</button>`}
          </main>

          <aside class="ai-panel">
            <div class="ai-head">
              ${sxIcon('sparkles', 16)} AI 公式助手
              <button class="btn ghost" title="关闭" @click=${() => toast('可通过「AI 公式推荐」重新打开')}>${sxIcon('close', 14)}</button>
            </div>
            <div class="ai-scroll">
              ${this.chat.map((msg) => html`
                <div class="msg ${msg.role}">
                  ${msg.text}
                  ${msg.formulas?.map((item) => html`
                    <div class="formula-card">
                      ${sxIcon('checkCircle', 14)}
                      <code>${item.formula}</code>
                      <button title="复制" @click=${() => this.copyFormula(item.formula)}>${sxIcon('copy', 14)}</button>
                      <button title="使用" @click=${() => this.chooseFormula(item.formula)}>${sxIcon('arrowRight', 14)}</button>
                    </div>
                  `)}
                </div>
              `)}

              <div class="msg bot">
                <div class="metrics">
                  <div class="metric">
                    <div class="t">${sxIcon('chartBar', 13)} 总销售额</div>
                    <b>${fmt(this.totalSales)}<small>元</small></b>
                  </div>
                  <div class="metric">
                    <div class="t">${sxIcon('sigma', 13)} 平均销售额</div>
                    <b>${fmt(this.avgSales)}<small>元</small></b>
                  </div>
                </div>
                <div class="explain">
                  <h4>${sxIcon('bulb', 14)} 公式说明</h4>
                  <p>${explain(this.formulaInput)}</p>
                  <p style="margin-top:6px;color:var(--sx-brand)">当前公式 <b>${this.formulaInput}</b> 的计算结果：<b>${fmt(this.currentResult)}</b></p>
                </div>
                <div class="diag ${diag.ok ? 'ok' : 'bad'}">
                  ${diag.ok ? sxIcon('checkCircle', 13) : sxIcon('warnTriangle', 13)}
                  ${diag.message}
                  ${diag.fixed ? html`<button @click=${() => this.applyFix()}>应用修复</button>` : nothing}
                </div>
                <div class="ai-actions">
                  <button class="btn" @click=${() => this.feedback(true)}>${sxIcon('thumbsUp', 13)} 有帮助</button>
                  <button class="btn" @click=${() => this.feedback(false)}>${sxIcon('warnTriangle', 13)} 没帮助</button>
                  <button class="btn primary wide" @click=${() => this.insertFormula()}>${sxIcon('plus', 13)} 插入到表格</button>
                </div>
              </div>
            </div>
            <div class="ai-input">
              <div class="input-row">
                <input
                  .value=${this.input}
                  placeholder="描述你的计算需求…"
                  @input=${(e: Event) => { this.input = (e.target as HTMLInputElement).value }}
                  @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this.ask() }}
                />
                <button class="send" title="发送" @click=${() => this.ask()}>${sxIcon('send', 14)}</button>
              </div>
              <div class="quick">
                ${QUICK_PROMPTS.map((prompt) => html`<button @click=${() => this.ask(prompt)}>${prompt.slice(0, 12)}…</button>`)}
              </div>
            </div>
          </aside>
        </div>

        <footer class="statusbar">
          <button class="sheet-tab">${SHEET}</button>
          <button class="sheet-tab" style="border:0;color:var(--sx-text-secondary)" @click=${() => toast('产品统计工作表')}>产品统计</button>
          <span class="status-right">
            <button class="tb" @click=${() => { this.zoom = Math.max(60, this.zoom - 10) }}>${sxIcon('zoomOut', 13)}</button>
            <span>${this.zoom}%</span>
            <button class="tb" @click=${() => { this.zoom = Math.min(160, this.zoom + 10) }}>${sxIcon('zoomIn', 13)}</button>
          </span>
        </footer>
      </div>
    `
  }
}
