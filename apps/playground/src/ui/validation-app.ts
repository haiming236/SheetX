/**
 * SheetX 第 15 张 · 数据验证与智能输入
 *
 * 展示：蓝底白字表头员工信息表、部门列下拉选项（点击展开）、双击编辑
 * + 实时校验（必填/序列/整数范围/日期限制/文本长度）、自定义错误弹窗
 * （样式/标题/内容可配置）、左下功能亮点卡、右侧「数据验证」面板
 * （设置/输入提示/出错提示三 Tab + 应用）、批量校验。
 *
 * 校验完全真实：每列独立规则，非法输入弹错误窗且不落盘并标红，
 * 修正后恢复；面板修改规则后「应用」即刻生效；「校验全部」扫描全表。
 */
import { LitElement, html, nothing, type TemplateResult } from 'lit'
import { customElement } from 'lit/decorators/custom-element.js'
import { state } from 'lit/decorators/state.js'
import { sxIcon, sxLogo } from './icons.js'
import { lightTokens, baseStyles } from './tokens.js'
import { validationStyles } from './validation-styles.js'
import {
  TOP_MENUS, EMP_ROWS, ALLOW_TYPES, ERROR_STYLES,
  SHEET_TABS, HIGHLIGHTS, PANEL_TABS, defaultRules,
  type ValidationRule, type ErrorStyle, type AllowType,
} from './validation-data.js'
import { toast } from './toast.js'

const fmtInt = (n: number): string => Math.round(n).toLocaleString('en-US')

const COLS = ['A', 'B', 'C', 'D', 'E'] as const
const COL_WIDTHS = [110, 96, 140, 140, 120]
const ROWNUM_W = 44
const HEADER_H = 40
const ROW_H = 34
const DATA_ROWS = 5
const BLANK_ROWS = 7
const TOTAL_ROWS = DATA_ROWS + BLANK_ROWS

const COL_HEADERS: Record<string, string> = { A: '员工编号', B: '姓名', C: '部门', D: '入职日期', E: '月薪（元）' }

function colX(letter: string): number {
  const i = COLS.indexOf(letter as (typeof COLS)[number])
  return ROWNUM_W + COL_WIDTHS.slice(0, i).reduce((a, b) => a + b, 0)
}

function rowY(row: number): number {
  return HEADER_H + (row - 1) * ROW_H
}

interface CellPos { row: number; col: string }
interface ErrorDialog { title: string; content: string; style: ErrorStyle }

@customElement('validation-app')
export class ValidationApp extends LitElement {
  static styles = [baseStyles, lightTokens, validationStyles]

  @state() private rules: Record<string, ValidationRule> = defaultRules()
  @state() private cellValues = new Map<string, string>()
  @state() private selected: CellPos = { row: 4, col: 'C' }
  @state() private editing: CellPos | null = null
  @state() private draft = ''
  @state() private dropdownOpen = false
  @state() private errorDialog: ErrorDialog | null = null
  @state() private invalid = new Set<string>()
  @state() private panelTab = '设置'
  @state() private draftRule: ValidationRule = defaultRules().C
  @state() private errorStyle: ErrorStyle = '停止'
  @state() private typeMenuOpen = false
  @state() private styleMenuOpen = false
  @state() private activeSheetTab = '员工信息'
  @state() private toast = ''

  private toastTimer: ReturnType<typeof setTimeout> | null = null

  disconnectedCallback(): void {
    super.disconnectedCallback()
    if (this.toastTimer) clearTimeout(this.toastTimer)
  }

  connectedCallback(): void {
    super.connectedCallback()
    // 初始数据填充
    EMP_ROWS.forEach((r, i) => {
      const row = i + 1
      this.cellValues.set(`A${row}`, r.id)
      this.cellValues.set(`B${row}`, r.name)
      this.cellValues.set(`C${row}`, r.dept)
      this.cellValues.set(`D${row}`, r.hireDate)
      this.cellValues.set(`E${row}`, String(r.salary))
    })
    this.loadDraft('C')
    this.dropdownOpen = true
  }

  /* ---------------- 校验引擎 ---------------- */

  private validate(col: string, raw: string): { ok: boolean; msg: string } {
    const rule = this.rules[col]
    const v = raw.trim()
    if (v === '') {
      return rule.allowBlank ? { ok: true, msg: '' } : { ok: false, msg: rule.errorContent }
    }
    switch (rule.type) {
      case '序列（下拉列表）':
        if (!rule.options.includes(v)) return { ok: false, msg: rule.errorContent }
        return { ok: true, msg: '' }
      case '整数': {
        if (!/^-?\d+$/.test(v)) return { ok: false, msg: rule.errorContent }
        const n = Number(v)
        if (n < rule.min || n > rule.max) return { ok: false, msg: rule.errorContent }
        return { ok: true, msg: '' }
      }
      case '小数': {
        const n = Number(v)
        if (Number.isNaN(n) || n < rule.min || n > rule.max) return { ok: false, msg: rule.errorContent }
        return { ok: true, msg: '' }
      }
      case '日期': {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v))) return { ok: false, msg: rule.errorContent }
        if (v < rule.minDate || v > rule.maxDate) return { ok: false, msg: rule.errorContent }
        return { ok: true, msg: '' }
      }
      case '文本长度': {
        if (v.length < rule.min || v.length > rule.max) return { ok: false, msg: rule.errorContent }
        return { ok: true, msg: '' }
      }
      default:
        return { ok: true, msg: '' }
    }
  }

  private cellKey(row: number, col: string): string {
    return `${col}${row}`
  }

  private cellValue(row: number, col: string): string {
    return this.cellValues.get(this.cellKey(row, col)) ?? ''
  }

  private displayValue(row: number, col: string): string {
    const v = this.cellValue(row, col)
    if (col === 'E' && v !== '') return fmtInt(Number(v))
    return v
  }

  /* ---------------- 交互 ---------------- */

  private showToast(msg: string): void {
    this.toast = msg
    if (this.toastTimer) clearTimeout(this.toastTimer)
    this.toastTimer = setTimeout(() => { this.toast = '' }, 2200)
  }

  private loadDraft(col: string): void {
    const r = this.rules[col]
    this.draftRule = { ...r, options: [...r.options] }
  }

  private selectCell(row: number, col: string, again = false): void {
    if (this.editing && (this.editing.row !== row || this.editing.col !== col)) {
      this.commitEdit()
    }
    const same = this.selected.row === row && this.selected.col === col
    this.selected = { row, col }
    this.dropdownOpen = false
    if (same && again && !this.editing) {
      const rule = this.rules[col]
      if (rule.type !== '序列（下拉列表）') {
        this.beginEdit()
        return
      }
      this.dropdownOpen = true
      return
    }
    if (!same) this.loadDraft(col)
    const rule = this.rules[col]
    if (rule.type === '序列（下拉列表）' && rule.dropdownArrow) {
      this.dropdownOpen = true
    }
  }

  private beginEdit(): void {
    const { row, col } = this.selected
    this.draft = this.cellValue(row, col)
    this.editing = { row, col }
    this.dropdownOpen = false
  }

  private commitEdit(): void {
    if (!this.editing) return
    const { row, col } = this.editing
    const key = this.cellKey(row, col)
    const res = this.validate(col, this.draft)
    if (!res.ok) {
      this.invalid = new Set([...this.invalid, key])
      this.errorDialog = { title: this.rules[col].errorTitle, content: res.msg, style: this.errorStyle }
    } else {
      this.cellValues = new Map(this.cellValues)
      this.cellValues.set(key, this.draft.trim())
      const next = new Set(this.invalid)
      next.delete(key)
      this.invalid = next
    }
    this.editing = null
  }

  private cancelEdit(): void {
    this.editing = null
  }

  private pickOption(opt: string): void {
    const { row, col } = this.selected
    const key = this.cellKey(row, col)
    this.cellValues = new Map(this.cellValues)
    this.cellValues.set(key, opt)
    const next = new Set(this.invalid)
    next.delete(key)
    this.invalid = next
    this.dropdownOpen = false
    this.showToast(`已选择：${opt}`)
  }

  private validateAll(): void {
    const next = new Set<string>()
    for (let row = 1; row <= TOTAL_ROWS; row++) {
      // 整行全空（未录入）跳过
      if (COLS.every((c) => this.cellValue(row, c) === '')) continue
      for (const col of COLS) {
        const v = this.cellValue(row, col)
        if (!this.validate(col, v).ok) next.add(this.cellKey(row, col))
      }
    }
    this.invalid = next
    if (next.size === 0) {
      this.showToast('校验通过：数据验证已生效')
    } else {
      this.showToast(`批量校验完成：${next.size} 项不符合规则`)
    }
  }

  private applyPanel(): void {
    const col = this.selected.col
    if (this.panelTab === '设置') {
      const d = this.draftRule
      this.rules = {
        ...this.rules,
        [col]: {
          ...d,
          options: d.type === '序列（下拉列表）'
            ? d.options.join(',').split(/[,，]/).map((s) => s.trim()).filter(Boolean)
            : [],
        },
      }
      this.showToast(`已应用验证规则到 ${col} 列`)
    } else if (this.panelTab === '输入提示') {
      const cur = this.rules[col]
      this.rules = { ...this.rules, [col]: { ...cur, promptTitle: this.draftRule.promptTitle, promptContent: this.draftRule.promptContent } }
      this.showToast(`已更新 ${col} 列输入提示`)
    } else {
      const cur = this.rules[col]
      this.rules = { ...this.rules, [col]: { ...cur, errorTitle: this.draftRule.errorTitle, errorContent: this.draftRule.errorContent } }
      this.showToast('已更新出错提示')
    }
    this.loadDraft(col)
  }

  private onDraftInput(field: 'promptTitle' | 'promptContent' | 'errorTitle' | 'errorContent' | 'minDate' | 'maxDate', e: Event): void {
    this.draftRule = { ...this.draftRule, [field]: (e.target as HTMLInputElement).value }
  }

  private onSourceInput(e: Event): void {
    this.draftRule = { ...this.draftRule, options: (e.target as HTMLInputElement).value.split(/[,，]/) }
  }

  private onDraftNumber(field: 'min' | 'max', e: Event): void {
    this.draftRule = { ...this.draftRule, [field]: Number((e.target as HTMLInputElement).value) }
  }

  private toggleCheck(field: 'allowBlank' | 'dropdownArrow'): void {
    this.draftRule = { ...this.draftRule, [field]: !this.draftRule[field] }
  }

  /* ---------------- 渲染：chrome ---------------- */

  private renderTopbar(): TemplateResult {
    return html`
      <header class="topbar">
        <span class="brand">${sxLogo()}</span>
        <nav class="top-menus">
          ${TOP_MENUS.map((m) => html`
            <button class="top-menu ${m === '开始' ? 'active' : ''}" @click=${() => toast(`菜单：${m}`)}>${m}</button>
          `)}
        </nav>
        <div class="top-right">
          <label class="search">${sxIcon('search', 15)}<input placeholder="搜索功能..." /></label>
          <span class="avatar">JD</span>
        </div>
      </header>`
  }

  private renderToolbar(): TemplateResult {
    return html`
      <div class="toolbar">
        <button class="tool-btn" title="撤销" @click=${() => toast('撤销')} >${sxIcon('undo', 15)}</button>
        <button class="tool-btn" title="重做" @click=${() => toast('重做')} >${sxIcon('redo', 15)}</button>
        <button class="tool-btn" title="打印" @click=${() => toast('打印预览')} >${sxIcon('print', 15)}</button>
        <span class="v-sep"></span>
        <span class="font-select">思源黑体<span class="caret">${sxIcon('chevronDown', 11)}</span></span>
        <span class="font-select">12<span class="caret">${sxIcon('chevronDown', 11)}</span></span>
        <button class="tool-btn" @click=${() => toast('加粗')}><b>B</b></button>
        <button class="tool-btn" @click=${() => toast('斜体')}><i>I</i></button>
        <button class="tool-btn" @click=${() => toast('下划线')}><u>U</u></button>
        <button class="tool-btn"><span class="fc-red">A</span></button>
        <button class="tool-btn"><span class="fc-yellow">A</span></button>
        <span class="v-sep"></span>
        <button class="tool-btn" @click=${() => toast('左对齐')}>${sxIcon('alignLeft', 15)}</button>
        <button class="tool-btn" @click=${() => toast('居中')}>${sxIcon('alignCenter', 15)}</button>
        <button class="tool-btn" @click=${() => toast('右对齐')}>${sxIcon('alignRight', 15)}</button>
        <span class="v-sep"></span>
        <span class="font-select">${sxIcon('merge', 14)}合并单元格<span class="caret">${sxIcon('chevronDown', 11)}</span></span>
        <span class="font-select">常规<span class="caret">${sxIcon('chevronDown', 11)}</span></span>
        <span class="v-sep"></span>
        <button class="tool-btn" title="百分比" @click=${() => toast('百分比格式')} >%</button>
        <span class="num-badge">9</span>
        <span class="num-badge">,<small>00</small></span>
        <button class="tool-btn" @click=${() => toast('应用边框')}>${sxIcon('border', 15)}</button>
        <span class="v-sep"></span>
        <button class="tool-btn" title="筛选" @click=${() => toast('打开筛选')} >${sxIcon('filter', 15)}</button>
        <button class="tool-btn" title="排序" @click=${() => toast('打开排序')} >${sxIcon('arrowDown', 14)}${sxIcon('arrowUp', 14)}</button>
        <button class="tool-btn" title="求和" @click=${() => toast('自动求和')} >${sxIcon('sigma', 15)}</button>
      </div>`
  }

  private renderFormulaBar(): TemplateResult {
    const show = this.editing ? this.draft : this.cellValue(this.selected.row, this.selected.col)
    return html`
      <div class="formula-bar">
        <span class="cell-ref">${this.cellKey(this.selected.row, this.selected.col)}<span class="caret">${sxIcon('chevronDown', 10)}</span></span>
        <span class="fx-badge">fx</span>
        <span class="formula-input">${show}</span>
      </div>`
  }

  /* ---------------- 渲染：表格 ---------------- */

  private renderTable(): TemplateResult {
    const widths = [ROWNUM_W, ...COL_WIDTHS]
    return html`
      <table class="sheet-table">
        <colgroup>
          ${widths.map((w) => html`<col style="width:${w}px" />`)}
        </colgroup>
        <tbody>
          <tr>
            <th class="rownum"></th>
            ${COLS.map((c) => html`<th>${COL_HEADERS[c]}</th>`)}
          </tr>
          ${this.renderDataRow(1)}${this.renderDataRow(2)}${this.renderDataRow(3)}
          ${this.renderDataRow(4)}${this.renderDataRow(5)}
          ${this.renderBlankRows()}
        </tbody>
      </table>`
  }

  private renderDataRow(row: number): TemplateResult {
    return html`
      <tr>
        <td class="rownum">${row}</td>
        ${COLS.map((c) => this.renderTd(row, c))}
      </tr>`
  }

  private renderBlankRows(): TemplateResult[] {
    const out: TemplateResult[] = []
    for (let row = DATA_ROWS + 1; row <= TOTAL_ROWS; row++) {
      out.push(html`
        <tr>
          <td class="rownum">${row}</td>
          ${COLS.map((c) => this.renderTd(row, c))}
        </tr>`)
    }
    return out
  }

  private renderTd(row: number, col: string): TemplateResult {
    const key = this.cellKey(row, col)
    const isSel = this.selected.row === row && this.selected.col === col
    const isEditing = this.editing?.row === row && this.editing?.col === col
    const isInvalid = this.invalid.has(key)
    const cls = col === 'E' ? 'num' : ''
    const rule = this.rules[col]
    const showTip = isSel && !isEditing && !this.dropdownOpen && rule.promptTitle !== ''
    const y = rowY(row)
    const x = colX(col)
    return html`
      <td class="${cls} ${isSel && !isEditing ? 'sel-cell' : ''} ${isInvalid ? 'invalid-cell' : ''} ${isEditing ? 'editing' : ''}"
        @click=${(e: Event) => { e.stopPropagation(); this.selectCell(row, col, true) }}
        @dblclick=${(e: Event) => { e.stopPropagation(); this.selected = { row, col }; this.loadDraft(col); this.beginEdit() }}>
        ${isEditing
          ? html`<input class="cell-input" .value=${this.draft}
              @input=${(e: Event) => { this.draft = (e.target as HTMLInputElement).value }}
              @keydown=${(e: KeyboardEvent) => {
                if (e.key === 'Enter') this.commitEdit()
                else if (e.key === 'Escape') this.cancelEdit()
              }}
              @click=${(e: Event) => e.stopPropagation()} />`
          : html`${this.displayValue(row, col)}`}
        ${showTip ? html`
          <div class="prompt-tip" style="left:${x + 2}px; top:${y + ROW_H + 3}px;">
            <div class="pt-title">${sxIcon('infoCircle', 13)}${rule.promptTitle}</div>
            <div class="pt-content">${rule.promptContent}</div>
          </div>` : nothing}
      </td>`
  }

  private renderCellDropdown(): TemplateResult {
    const { row, col } = this.selected
    const rule = this.rules[col]
    if (!(this.dropdownOpen && rule.type === '序列（下拉列表）')) return html``
    const cur = this.cellValue(row, col)
    const x = colX(col)
    const y = rowY(row)
    const w = COL_WIDTHS[COLS.indexOf(col as (typeof COLS)[number])]
    return html`
      <div class="cell-dropdown" style="left:${x}px; top:${y + ROW_H - 1}px; width:${Math.max(w, 150)}px;"
        @click=${(e: Event) => e.stopPropagation()}>
        ${rule.options.map((o) => html`
          <button class="cd-item ${o === cur ? 'current' : ''}" @click=${() => this.pickOption(o)}>
            ${o}${o === cur ? sxIcon('check', 13) : nothing}
          </button>
        `)}
      </div>`
  }

  /* ---------------- 渲染：错误弹窗 ---------------- */

  private renderErrorDialog(): TemplateResult {
    const d = this.errorDialog
    if (!d) return html``
    const icon = d.style === '警告' ? sxIcon('warnTriangle', 22)
      : d.style === '信息' ? sxIcon('infoCircle', 22)
      : sxIcon('alertCircle', 22)
    return html`
      <div class="dialog-mask" @click=${() => { this.errorDialog = null }}>
        <div class="error-dialog" @click=${(e: Event) => e.stopPropagation()}>
          <div class="ed-icon ${d.style === '警告' ? 'warning' : d.style === '信息' ? 'info' : 'stop'}">${icon}</div>
          <div class="ed-title">${d.title}</div>
          <div class="ed-content">${d.content}</div>
          <button class="ed-btn" @click=${() => { this.errorDialog = null }}>确定</button>
        </div>
      </div>`
  }

  /* ---------------- 渲染：亮点卡 ---------------- */

  private renderHighlight(): TemplateResult {
    return html`
      <div class="highlight-card">
        <div class="hc-title"><span class="hc-ic">${sxIcon('check', 12)}</span>数据验证功能亮点</div>
        ${HIGHLIGHTS.map((h) => html`
          <div class="hc-item"><span class="tick">${sxIcon('checkCircle', 14)}</span>${h}</div>
        `)}
      </div>`
  }

  /* ---------------- 渲染：右侧面板 ---------------- */

  private renderPanel(): TemplateResult {
    return html`
      <aside class="panel">
        <div class="panel-head">
          <span class="ph-icon">${sxIcon('shieldCheck', 16)}</span>
          <span class="panel-title">数据验证</span>
          <button class="panel-close" @click=${() => this.showToast('面板收起（演示）')}>${sxIcon('close', 16)}</button>
        </div>
        <div class="panel-tabs">
          ${PANEL_TABS.map((t) => html`
            <button class="panel-tab ${this.panelTab === t ? 'active' : ''}" @click=${() => { this.panelTab = t }}>${t}</button>
          `)}
        </div>
        <div class="panel-body">
          ${this.panelTab === '设置' ? this.renderSettingsTab() : nothing}
          ${this.panelTab === '输入提示' ? this.renderPromptTab() : nothing}
          ${this.panelTab === '出错提示' ? this.renderErrorTab() : nothing}
        </div>
        <div class="panel-foot">
          ${this.panelTab === '设置' ? html`<button class="pf-btn" @click=${() => this.validateAll()}>校验全部</button>` : nothing}
          <button class="pf-btn primary" @click=${() => this.applyPanel()}>应用</button>
        </div>
      </aside>`
  }

  private renderSettingsTab(): TemplateResult {
    const d = this.draftRule
    const col = this.selected.col
    const isList = d.type === '序列（下拉列表）'
    const hasRange = d.type === '整数' || d.type === '小数' || d.type === '文本长度'
    const isDate = d.type === '日期'
    return html`
      <div class="sec-label">验证条件 · ${COL_HEADERS[col]}（${col} 列）</div>
      <div class="field-row">
        <span class="field-label">允许类型:</span>
        <span class="opt-wrap" style="position:relative; flex:1; display:flex;">
          <span class="field-select" @click=${(e: Event) => { e.stopPropagation(); this.typeMenuOpen = !this.typeMenuOpen }}>
            ${d.type}<span class="caret">${sxIcon('chevronDown', 11)}</span>
          </span>
          ${this.typeMenuOpen ? html`
            <div class="fs-menu" style="bottom:auto; top:calc(100% + 4px);">
              ${ALLOW_TYPES.map((t) => html`
                <button class="fs-item ${t === d.type ? 'sel' : ''}"
                  @click=${() => { this.draftRule = { ...this.draftRule, type: t as AllowType }; this.typeMenuOpen = false }}>
                  ${t}${t === d.type ? sxIcon('check', 12) : nothing}
                </button>
              `)}
            </div>` : nothing}
        </span>
      </div>
      ${isList ? html`
        <div class="field-row">
          <span class="field-label">来源:</span>
          <input class="field-input" style="font-size:11px;" .value=${d.options.join(',')}
            @input=${(e: Event) => this.onSourceInput(e)} />
          <span class="fs-icon" style="display:inline-flex; color:var(--sx-text-hint);">${sxIcon('gridView', 15)}</span>
        </div>` : nothing}
      ${hasRange ? html`
        <div class="field-row">
          <span class="field-label">${d.type === '文本长度' ? '长度:' : '范围:'}</span>
          <span class="range-inputs">
            <input class="field-input" .value=${String(d.min)} @input=${(e: Event) => this.onDraftNumber('min', e)} />
            <span class="dash">—</span>
            <input class="field-input" .value=${String(d.max)} @input=${(e: Event) => this.onDraftNumber('max', e)} />
          </span>
        </div>` : nothing}
      ${isDate ? html`
        <div class="field-row">
          <span class="field-label">日期范围:</span>
          <span class="range-inputs">
            <input class="field-input" .value=${d.minDate} @input=${(e: Event) => this.onDraftInput('minDate', e)} />
            <span class="dash">—</span>
            <input class="field-input" .value=${d.maxDate} @input=${(e: Event) => this.onDraftInput('maxDate', e)} />
          </span>
        </div>` : nothing}
      <button class="check-row ${d.allowBlank ? 'on' : ''}" @click=${() => this.toggleCheck('allowBlank')}>
        <span class="cbox">${d.allowBlank ? sxIcon('check', 11) : nothing}</span>忽略空值
      </button>
      ${isList ? html`
        <button class="check-row ${d.dropdownArrow ? 'on' : ''}" @click=${() => this.toggleCheck('dropdownArrow')}>
          <span class="cbox">${d.dropdownArrow ? sxIcon('check', 11) : nothing}</span>提供下拉箭头
        </button>` : nothing}
      <div class="sec-label" style="margin-top:14px;">出错提示</div>
      ${this.renderErrorFields()}`
  }

  private renderPromptTab(): TemplateResult {
    const d = this.draftRule
    return html`
      <div class="sec-label">选中单元格时显示输入提示</div>
      <div class="field-row">
        <span class="field-label">标题:</span>
        <input class="field-input" .value=${d.promptTitle} @input=${(e: Event) => this.onDraftInput('promptTitle', e)} />
      </div>
      <div class="field-row">
        <span class="field-label">内容:</span>
        <input class="field-input" .value=${d.promptContent} @input=${(e: Event) => this.onDraftInput('promptContent', e)} />
      </div>
      <div class="err-preview" style="background:var(--sx-bg-active); border-color:#bfdbfe;">
        <span class="ep-icon" style="background:var(--sx-brand);">${sxIcon('infoCircle', 13)}</span>
        <div>
          <div class="ep-title" style="color: var(--sx-grid-header-text);">${d.promptTitle || '（标题）'}</div>
          <div class="ep-content" style="color:#3b6fb5;">${d.promptContent || '（内容）'}</div>
        </div>
      </div>`
  }

  private renderErrorFields(): TemplateResult {
    const d = this.draftRule
    const dotCls = this.errorStyle === '警告' ? 'warning' : this.errorStyle === '信息' ? 'info' : 'stop'
    return html`
      <div class="field-row">
        <span class="field-label">样式:</span>
        <span class="opt-wrap" style="position:relative; flex:1; display:flex;">
          <span class="field-select" @click=${(e: Event) => { e.stopPropagation(); this.styleMenuOpen = !this.styleMenuOpen }}>
            <span style="display:inline-flex; align-items:center; gap:6px;">
              <span class="style-dot ${dotCls}">!</span>${this.errorStyle}
            </span>
            <span class="caret">${sxIcon('chevronDown', 11)}</span>
          </span>
          ${this.styleMenuOpen ? html`
            <div class="fs-menu" style="bottom:auto; top:calc(100% + 4px);">
              ${ERROR_STYLES.map((s) => html`
                <button class="fs-item ${s === this.errorStyle ? 'sel' : ''}"
                  @click=${() => { this.errorStyle = s as ErrorStyle; this.styleMenuOpen = false }}>
                  <span class="style-dot ${s === '警告' ? 'warning' : s === '信息' ? 'info' : 'stop'}">!</span>${s}
                </button>
              `)}
            </div>` : nothing}
        </span>
      </div>
      <div class="field-row">
        <span class="field-label">标题:</span>
        <input class="field-input" .value=${d.errorTitle} @input=${(e: Event) => this.onDraftInput('errorTitle', e)} />
      </div>
      <div class="field-row">
        <span class="field-label">内容:</span>
        <input class="field-input" .value=${d.errorContent} @input=${(e: Event) => this.onDraftInput('errorContent', e)} />
      </div>
      <div class="err-preview">
        <span class="ep-icon">!</span>
        <div>
          <div class="ep-title">${d.errorTitle || '（标题）'}</div>
          <div class="ep-content">${d.errorContent || '（内容）'}</div>
        </div>
      </div>`
  }

  private renderErrorTab(): TemplateResult {
    return this.renderErrorFields()
  }

  /* ---------------- 渲染：底部 ---------------- */

  private renderBottom(): TemplateResult {
    let sum = 0, count = 0
    for (let row = 1; row <= TOTAL_ROWS; row++) {
      const v = this.cellValue(row, 'E')
      if (v !== '' && !Number.isNaN(Number(v))) { sum += Number(v); count++ }
    }
    const avg = count ? fmtInt(sum / count) : '0'
    const allOk = this.invalid.size === 0
    return html`
      <div class="sheet-tabs-bar">
        <button class="tab-add" @click=${() => this.showToast('新建工作表（演示）')}>+</button>
        ${SHEET_TABS.map((t) => html`
          <button class="sheet-tab ${this.activeSheetTab === t ? 'active' : ''}"
            @click=${() => { this.activeSheetTab = t; this.showToast(`切换到「${t}」（演示）`) }}>${t}</button>
        `)}
        <button class="tabs-more" @click=${() => this.showToast('更多工作表（演示）')}>•••</button>
      </div>
      <div class="statusbar">
        <span class="vstatus ${allOk ? 'ok' : 'bad'}">
          ${allOk ? sxIcon('checkCircle', 14) : sxIcon('alertCircle', 14)}
          ${allOk ? '数据验证已生效' : `${this.invalid.size} 项校验失败`}
        </span>
        <span>平均值: <span class="sb-val">${avg}</span></span>
        <span>计数: <span class="sb-val">${count}</span></span>
        <span>求和: <span class="sb-val">${fmtInt(sum)}</span></span>
        <span class="right">
          <span class="zoom-ctl">
            <button @click=${() => this.showToast('缩小（演示）')}>−</button>
            <span class="zoom-val">100%</span>
            <button @click=${() => this.showToast('放大（演示）')}>+</button>
          </span>
          <span style="display:inline-flex">${sxIcon('fullscreen', 14)}</span>
        </span>
      </div>`
  }

  /* ---------------- 总渲染 ---------------- */

  render(): TemplateResult {
    return html`
      <div class="app" @click=${() => { if (this.dropdownOpen) this.dropdownOpen = false }}>
        ${this.renderTopbar()}
        ${this.renderToolbar()}
        <div class="body">
          <div class="main">
            ${this.renderFormulaBar()}
            <div class="sheet-scroll" @click=${() => { this.typeMenuOpen = false; this.styleMenuOpen = false }}>
              <div class="sheet-canvas">
                ${this.renderTable()}
                ${this.renderCellDropdown()}
                ${this.renderHighlight()}
              </div>
            </div>
          </div>
          ${this.renderPanel()}
        </div>
        ${this.renderBottom()}
        ${this.renderErrorDialog()}
        ${this.toast ? html`<div class="toast">${this.toast}</div>` : nothing}
      </div>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'validation-app': ValidationApp
  }
}
