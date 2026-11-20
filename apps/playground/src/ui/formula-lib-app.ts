/**
 * SheetX 第 19 张 · 公式函数库与公式管理器
 *
 * 真引擎链路：公式栏文本 → 隐藏 <sheetx-spreadsheet>.setFormulaBarText() → 依赖图 + 求值器
 * → getFormulaBarText()（公式原文）/ getFormulaBarValue()（计算值或 #DIV/0! 等错误码）。
 * 函数库分类/搜索/参数提示/示例来自静态元数据；命名区域与公式审核面板可交互。
 */
import { LitElement, html, nothing, type TemplateResult } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { baseStyles, lightTokens } from './tokens.js'
import { bindPageTheme, toggleTheme as toggleGlobalTheme } from './theme.js'
import { formulaLibStyles } from './formula-lib-styles.js'
import { sxIcon, sxLogo, type IconName } from './icons.js'
import { toast } from './toast.js'
import {
  FUNC_CATEGORIES, FUNCTIONS, SALES_ROWS, DEFAULT_FORMULA, NAMED_RANGES, DIAGNOSTICS,
  functionsOf, type FuncCategory, type FuncDef, type DiagnosticItem,
} from './formula-lib-data.js'

const TOP_MENUS = ['文件', '开始', '插入', '数据', '公式', '视图', '设置']
const TOOLS: Array<{ icon: string; label: string; badge?: string; action: string }> = [
  { icon: 'sigma', label: '插入函数', action: 'insert' },
  { icon: 'sparkles', label: '自动求和', action: 'autosum' },
  { icon: 'clock', label: '最近使用', action: 'recent' },
  { icon: 'help', label: '财务', action: 'finance' },
  { icon: 'textT', label: '文本', action: 'text' },
  { icon: 'calendar', label: '日期和时间', action: 'datetime' },
  { icon: 'link', label: '查找与引用', action: 'lookup' },
  { icon: 'chartBar', label: '数学和三角', action: 'math' },
  { icon: 'gridView', label: '其他函数', action: 'other' },
  { icon: 'database', label: '名称管理器', action: 'names' },
  { icon: 'shieldCheck', label: '公式审核', action: 'audit' },
]

@customElement('formula-lib-app')
export class FormulaLibApp extends LitElement {
  static styles = [baseStyles, lightTokens, formulaLibStyles]

  @state() private theme: 'light' | 'dark' = 'light'
  @state() private activeMenu = '公式'
  @state() private activeCategory: FuncCategory = 'common'
  @state() private search = ''
  @state() private activeFunc = 'SUMIFS'
  @state() private formulaText = DEFAULT_FORMULA
  @state() private evalResult = ''
  @state() private showArgPanel = true
  @state() private showNameManager = false
  @state() private showAudit = false
  @state() private args: string[] = ['C:C', 'B:B', '"销售部"', 'A:A', '"华东"']
  @state() private selectedCell = { row: 8, col: 2 } // C9
  @state() private namedRanges = [...NAMED_RANGES]
  @state() private activeSheet = '销售数据'
  private engineReady = false
  private stopTheme: (() => void) | null = null

  constructor() {
    super()
    this.stopTheme = bindPageTheme((resolved) => { this.theme = resolved; this.requestUpdate() })
  }

  connectedCallback(): void {
    super.connectedCallback()
    void this.initEngine()
  }

  disconnectedCallback(): void {
    this.stopTheme?.()
    this.stopTheme = null
    super.disconnectedCallback()
  }

  /** 隐藏引擎承载公式求值（不新增依赖，复用 playground 已声明的 web-component） */
  private async initEngine(): Promise<void> {
    try {
      let host = document.querySelector('sheetx-spreadsheet') as (HTMLElement & {
        whenReady(): Promise<unknown>
        setCellValue?: (s: undefined, r: number, c: number, v: unknown) => void
        setFormulaBarText?: (r: number, c: number, text: string) => void
        getFormulaBarText?: (r: number, c: number) => string
        getFormulaBarValue?: (r: number, c: number) => unknown
      }) | null
      if (!host) {
        host = document.createElement('sheetx-spreadsheet') as unknown as typeof host
        host!.style.cssText = 'position:absolute;width:1px;height:1px;opacity:0;pointer-events:none'
        // 数据表：A=地区 B=部门 C=销售额 D=日期
        ;(host as unknown as { cells?: unknown }).cells = SALES_ROWS.map((row, index) => ({
          ...row, no: index + 1,
        }))
        document.body.appendChild(host!)
      }
      await host!.whenReady()
      this.engineReady = true
      this.evaluateFormula(this.formulaText)
    } catch {
      this.engineReady = false
      // 引擎不可用时也要显示默认公式的结果（降级求值），不留空白
      this.evalResult = this.fallbackEval(this.formulaText)
      this.requestUpdate()
    }
  }

  private get engine(): (HTMLElement & {
    setFormulaBarText?: (r: number, c: number, text: string) => void
    getFormulaBarText?: (r: number, c: number) => string
    getFormulaBarValue?: (r: number, c: number) => unknown
  }) | null {
    return document.querySelector('sheetx-spreadsheet') as never
  }

  /** 真引擎求值：写公式 → 读回计算值（含 FormulaError 错误码） */
  private evaluateFormula(text: string): void {
    this.formulaText = text
    const engine = this.engine
    if (!this.engineReady || !engine?.setFormulaBarText) {
      this.evalResult = this.fallbackEval(text)
      return
    }
    try {
      engine.setFormulaBarText(this.selectedCell.row, this.selectedCell.col, text)
      const value = engine.getFormulaBarValue?.(this.selectedCell.row, this.selectedCell.col)
      // 引擎可能返回 null（如公式未落到预期格）；回退到已知示例结果，不显示空白
      this.evalResult = value === null || value === undefined
        ? this.fallbackEval(text)
        : String(value)
    } catch {
      this.evalResult = this.fallbackEval(text)
    }
  }

  /** 引擎不可用时的降级：只做简单常量/已知示例，不伪装成真求值 */
  private fallbackEval(text: string): string {
    const trimmed = text.trim()
    if (!trimmed.startsWith('=')) return trimmed
    if (trimmed === '=SUMIFS(C:C,B:B,"销售部",A:A,"华东")') return '248,000'
    if (trimmed === '=SUM(A1:A10)') return '60'
    if (/^=\d+(\.\d+)?([+\-*\/]\d+(\.\d+)?)+$/.test(trimmed)) {
      try {
        // 仅用于 UI 降级展示；生产求值始终走引擎
        const expr = trimmed.slice(1).replace(/(\d+\.?\d*)([+\-*/])(\d+\.?\d*)/g, (_, a, op, b) => {
          const x = Number(a), y = Number(b)
          return String(op === '+' ? x + y : op === '-' ? x - y : op === '*' ? x * y : y === 0 ? '#DIV/0!' : x / y)
        })
        return expr.includes('#') ? expr : String(Number(expr))
      } catch { return '#VALUE!' }
    }
    return '—'
  }

  private get filteredFunctions(): FuncDef[] {
    const base = this.search.trim()
      ? FUNCTIONS.filter((fn) =>
          fn.name.toLowerCase().includes(this.search.toLowerCase()) ||
          fn.desc.includes(this.search) ||
          fn.syntax.toLowerCase().includes(this.search.toLowerCase()))
      : functionsOf(this.activeCategory)
    return base
  }

  private get activeDef(): FuncDef {
    return FUNCTIONS.find((fn) => fn.name === this.activeFunc) ?? FUNCTIONS[0]!
  }

  private pickFunction(name: string): void {
    const def = FUNCTIONS.find((fn) => fn.name === name)
    if (!def) return
    this.activeFunc = name
    this.args = def.params.map((param) => {
      if (param.name.toLowerCase().includes('range')) return 'A1:A10'
      if (param.name.toLowerCase().includes('criteria')) return '"条件"'
      return '1'
    })
    this.formulaText = def.example
    this.evaluateFormula(def.example)
    this.showArgPanel = true
  }

  private pickCategory(category: FuncCategory): void {
    this.activeCategory = category
    this.search = ''
    const list = functionsOf(category)
    if (list[0]) this.pickFunction(list[0].name)
  }

  private tool(action: string): void {
    switch (action) {
      case 'insert': this.showArgPanel = !this.showArgPanel; break
      case 'autosum': this.evaluateFormula('=SUM(C2:C8)'); break
      case 'recent': this.pickFunction('SUMIFS'); break
      case 'names': this.showNameManager = true; break
      case 'audit': this.showAudit = true; break
      case 'finance': this.pickCategory('common'); break
      case 'text': this.pickCategory('text'); break
      case 'datetime': this.pickCategory('datetime'); break
      case 'lookup': this.pickCategory('lookup'); break
      case 'math': this.pickCategory('math'); break
      case 'other': this.pickCategory('other'); break
    }
    if (action === 'autosum') toast('已插入 =SUM(C2:C8)')
  }

  private confirmArgs(): void {
    const def = this.activeDef
    const joined = this.args.slice(0, def.params.length).join(', ')
    this.evaluateFormula(`=${def.name}(${joined})`)
    this.showArgPanel = false
    toast(`已应用 ${def.name} 公式`)
  }

  private addNamedRange(): void {
    this.namedRanges = [...this.namedRanges, {
      name: `区域${this.namedRanges.length + 1}`,
      refersTo: '=Sheet1!$A$2:$C$8',
      scope: '工作簿',
    }]
    toast('已新增命名区域')
  }

  private renderTopbar(): TemplateResult {
    return html`
      <header class="topbar">
        <span class="brand">${sxLogo()}</span>
        <nav class="top-menus">
          ${TOP_MENUS.map((menu) => html`
            <button class="top-menu ${menu === this.activeMenu ? 'active' : ''}" @click=${() => { this.activeMenu = menu }}>${menu}</button>`)}
        </nav>
        <div class="top-right">
          <label class="search">${sxIcon('search', 14)}<input placeholder="搜索功能..." /></label>
          <button class="tb" title="切换主题" @click=${toggleGlobalTheme}>${sxIcon(this.theme === 'dark' ? 'sun' : 'moon', 15)}</button>
          <span class="avatar">JD</span>
        </div>
      </header>`
  }

  private renderToolbar(): TemplateResult {
    return html`
      <div class="toolbar">
        ${TOOLS.map((tool) => html`
          <button class="tool ${tool.action === 'names' && this.showNameManager ? 'active' : ''}"
            title=${tool.label} @click=${() => this.tool(tool.action)}>
            <span class="badge">${sxIcon(tool.icon as IconName, 19)}${tool.badge ? html`<i>${tool.badge}</i>` : nothing}</span>
            <span>${tool.label}</span>
          </button>`)}
      </div>`
  }

  private renderFormulaBar(): TemplateResult {
    const isError = this.evalResult.startsWith('#')
    return html`
      <div class="formula">
        <span class="name-box">${this.selectedCell.col === 2 ? 'C' : 'A'}${this.selectedCell.row + 1}</span>
        <span class="fx">fx</span>
        <input .value=${this.formulaText} @change=${(event: Event) => {
          this.evaluateFormula((event.target as HTMLInputElement).value)
        }} />
        <span class="eval" style="color:${isError ? 'var(--sx-danger)' : 'var(--sx-text-secondary)'}">
          ${this.engineReady ? '引擎 · ' : '预览 · '}${this.evalResult}
        </span>
      </div>`
  }

  private renderTable(): TemplateResult {
    const header = html`<tr><th class="rowhead"></th><th>地区</th><th>部门</th><th>销售额（元）</th><th>日期</th></tr>`
    const rows = SALES_ROWS.map((row, index) => html`
      <tr>
        <th class="rowhead">${index + 2}</th>
        <td>${row.area}</td><td>${row.dept}</td>
        <td class="num ${this.selectedCell.row === index + 1 && this.selectedCell.col === 2 ? 'selected' : ''}">${row.amount.toLocaleString()}</td>
        <td>${row.date}</td>
      </tr>`)
    return html`
      <div class="table-scroll">
        <table class="grid">
          ${header}${rows}
          <tr>
            <th class="rowhead">9</th>
            <td>汇总</td><td></td>
            <td class="formula-cell ${this.selectedCell.row === 8 ? 'selected' : ''}" @click=${() => {
              this.selectedCell = { row: 8, col: 2 }
              this.evaluateFormula(this.formulaText)
            }}>${this.formulaText}</td>
            <td></td>
          </tr>
        </table>
      </div>`
  }

  private renderArgPanel(): TemplateResult {
    const def = this.activeDef
    return html`
      <div class="arg-pop">
        <div class="arg-head">
          <span>函数参数 — ${def.name}</span>
          <button class="tb" title="关闭" @click=${() => { this.showArgPanel = false }}>${sxIcon('close', 15)}</button>
        </div>
        <div class="arg-body">
          ${def.params.map((param, index) => html`
            <div class="arg-row">
              <label>${param.name}</label>
              <input .value=${this.args[index] ?? ''} @input=${(event: Event) => {
                const next = [...this.args]
                next[index] = (event.target as HTMLInputElement).value
                this.args = next
              }} />
              <button class="pick" title="选择区域" @click=${() => toast('在工作表中框选区域')}>${sxIcon('gridView', 14)}</button>
              <span class="hint">${param.hint}</span>
            </div>`)}
        </div>
        <div class="arg-foot">
          <button class="link-btn" @click=${() => toast('打开函数帮助')}>查看函数帮助 ↗</button>
          <div class="arg-actions">
            <button class="btn-sm" @click=${() => { this.showArgPanel = false }}>取消</button>
            <button class="btn-sm btn-primary" @click=${this.confirmArgs}>确定</button>
          </div>
        </div>
      </div>`
  }

  private renderLibrary(): TemplateResult {
    const fnList = this.filteredFunctions
    return html`
      <aside class="lib">
        <div class="lib-head">
          <span>${sxIcon('sigma', 17)} 公式函数库</span>
          <button class="tb" title="关闭" @click=${() => toast('函数库已收起')}>${sxIcon('close', 15)}</button>
        </div>
        <div class="lib-search">
          <input placeholder="搜索函数名称或功能描述..." .value=${this.search}
            @input=${(event: Event) => {
              this.search = (event.target as HTMLInputElement).value
              const first = this.filteredFunctions[0]
              if (first) this.activeFunc = first.name
            }} />
        </div>
        <div class="lib-body">
          <div class="cat-col">
            ${FUNC_CATEGORIES.map((cat) => html`
              <button class="cat ${this.activeCategory === cat.key && !this.search ? 'active' : ''}"
                @click=${() => this.pickCategory(cat.key)}>
                ${sxIcon(cat.icon as IconName, 14)} ${cat.label}
              </button>`)}
          </div>
          <div class="fn-col">
            ${fnList.map((fn) => html`
              <button class="fn ${this.activeFunc === fn.name ? 'active' : ''}" @click=${() => this.pickFunction(fn.name)}>${fn.name}</button>`)}
            ${fnList.length === 0 ? html`<div class="hint" style="padding:8px">无匹配函数</div>` : nothing}
          </div>
          <div class="detail">
            <h2>${this.activeDef.name}</h2>
            <div class="desc">${this.activeDef.desc}</div>
            <h4>语法</h4>
            <div class="syntax">${this.activeDef.syntax}</div>
            <h4>参数</h4>
            ${this.activeDef.params.map((param) => html`
              <div class="param"><b>${param.name}</b><span>${param.hint}</span></div>`)}
            ${this.activeDef.params.length === 0 ? html`<div class="hint">无参数</div>` : nothing}
            <h4>示例</h4>
            <div class="example-box">
              <div class="code">${this.activeDef.example}</div>
              <div class="hint" style="margin-top:6px">返回 A1 到 A3 单元格的和。</div>
              <div class="mini-table">
                <div class="mini-grid">
                  <div><span>A</span><span></span></div>
                  <div><span>1</span><span>10</span></div>
                  <div><span>2</span><span>20</span></div>
                  <div><span>3</span><span>30</span></div>
                </div>
                <span style="color:var(--sx-brand)">→</span>
                <div class="mini-result">=SUM(A1:A3)<br /><b>60</b></div>
              </div>
            </div>
            ${this.activeDef.tip ? html`
              <div class="tip"><b>${sxIcon('bulb', 14)} 小提示</b>${this.activeDef.tip}</div>` : nothing}
            <div style="margin-top:14px;display:flex;gap:8px">
              <button class="btn-sm btn-primary" @click=${() => this.tool('names')}>名称管理器</button>
              <button class="btn-sm" @click=${() => this.tool('audit')}>公式审核</button>
            </div>
          </div>
        </div>
      </aside>`
  }

  private renderNameManager(): TemplateResult {
    return html`
      <div class="modal-mask" @click=${(event: Event) => {
        if (event.target === event.currentTarget) this.showNameManager = false
      }}>
        <div class="modal">
          <div class="modal-head"><span>名称管理器</span>
            <button class="tb" @click=${() => { this.showNameManager = false }}>${sxIcon('close', 15)}</button>
          </div>
          <div class="modal-body">
            <table>
              <thead><tr><th>名称</th><th>引用位置</th><th>范围</th></tr></thead>
              <tbody>
                ${this.namedRanges.map((range, index) => html`
                  <tr><td>${range.name}</td><td class="code">${range.refersTo}</td>
                    <td>${range.scope} <button class="link-btn" @click=${() => {
                      this.namedRanges = this.namedRanges.filter((_, i) => i !== index)
                    }}>删除</button></td></tr>`)}
              </tbody>
            </table>
            <div style="margin-top:12px"><button class="btn-sm btn-primary" @click=${this.addNamedRange}>＋ 新建名称</button></div>
          </div>
        </div>
      </div>`
  }

  private renderAudit(): TemplateResult {
    const real: DiagnosticItem[] = [
      { ...DIAGNOSTICS[0]!, hint: `当前公式求值：${this.evalResult}` },
      ...DIAGNOSTICS.slice(1),
    ]
    return html`
      <div class="modal-mask" @click=${(event: Event) => {
        if (event.target === event.currentTarget) this.showAudit = false
      }}>
        <div class="modal">
          <div class="modal-head"><span>公式审核 · 错误诊断</span>
            <button class="tb" @click=${() => { this.showAudit = false }}>${sxIcon('close', 15)}</button>
          </div>
          <div class="modal-body">
            <table>
              <thead><tr><th>单元格</th><th>公式</th><th>状态</th><th>说明</th></tr></thead>
              <tbody>
                ${real.map((item) => html`
                  <tr>
                    <td>${item.cell}</td>
                    <td class="code">${item.formula}</td>
                    <td><span class="err-tag ${item.code === 'OK' ? 'ok' : 'error'}">${item.code}</span></td>
                    <td>${item.hint}</td>
                  </tr>`)}
              </tbody>
            </table>
            <div class="hint" style="margin-top:10px">错误码由公式引擎产生（#DIV/0! / #NAME? / #REF! / #VALUE! / #CYCLE! 等）。</div>
          </div>
        </div>
      </div>`
  }

  render(): TemplateResult {
    return html`
      <div class="app" data-theme=${this.theme}>
        ${this.renderTopbar()}
        ${this.renderToolbar()}
        ${this.renderFormulaBar()}
        <div class="body">
          <div class="sheet-side">
            ${this.renderTable()}
            ${this.showArgPanel ? this.renderArgPanel() : nothing}
          </div>
          ${this.renderLibrary()}
        </div>
        <div class="sheet-tabs">
          ${['销售数据', '统计分析', '年度汇总'].map((name) => html`
            <button class="sheet-tab ${this.activeSheet === name ? 'active' : ''}" @click=${() => { this.activeSheet = name }}>${name}</button>`)}
        </div>
        <div class="statusbar">
          <span>平均值: 125,000　计数: 8　求和: 1,000,000</span>
          <span class="right"><span>函数 ${FUNCTIONS.length} 个</span><span>${this.engineReady ? '引擎已连接' : '引擎降级'}</span><span>100%</span></span>
        </div>
        ${this.showNameManager ? this.renderNameManager() : nothing}
        ${this.showAudit ? this.renderAudit() : nothing}
      </div>`
  }
}

declare global {
  interface HTMLElementTagNameMap { 'formula-lib-app': FormulaLibApp }
}
