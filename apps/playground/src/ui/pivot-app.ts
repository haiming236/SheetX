/**
 * SheetX 第 13 张 · 数据透视表（Pivot Table）
 *
 * 展示：左侧源数据表（20 行，字段列可勾选显隐）、中间透视表分析卡
 * （报表筛选下拉、地区×产品交叉表 + 行列汇总、分组柱状图）、右侧
 * 数据透视表面板（字段列表/搜索/拖拽区域/数据设置）。
 *
 * 透视完全基于源数据真实计算：切换行/列维度、筛选地区/产品、
 * 聚合方式（求和/平均/计数/最大/最小）、显示格式、空值显示、
 * 汇总行列开关、表头配色/字号/斑马纹均实时生效。
 */
import { LitElement, html, svg, nothing, type TemplateResult } from 'lit'
import { customElement } from 'lit/decorators/custom-element.js'
import { state } from 'lit/decorators/state.js'
import { sxIcon, sxLogo } from './icons.js'
import { lightTokens, baseStyles } from './tokens.js'
import { pivotStyles } from './pivot-styles.js'
import {
  TOP_MENUS, SOURCE_RECORDS, FIELD_LIST, REGION_ORDER, PRODUCT_ORDER,
  ROW_FIELD_OPTIONS, COL_FIELD_OPTIONS,
  AGG_OPTIONS, FORMAT_OPTIONS, PANEL_TABS, SHEET_TABS, DROP_ICONS,
  type SourceRecord,
} from './pivot-data.js'
import { toast } from './toast.js'

const fmtInt = (n: number): string => Math.round(n).toLocaleString('en-US')

function dimVal(r: SourceRecord, field: string): string {
  if (field === '日期') return r.date
  if (field === '地区') return r.region
  return r.product
}

function orderedKeys(rs: SourceRecord[], field: string): string[] {
  const set = new Set(rs.map((r) => dimVal(r, field)))
  if (field === '日期') return [...set].sort()
  const order = field === '地区' ? REGION_ORDER : PRODUCT_ORDER
  const keys = order.filter((k) => set.has(k))
  for (const k of set) if (!keys.includes(k)) keys.push(k)
  return keys
}

function aggregate(vals: number[], agg: string): number {
  if (vals.length === 0) return NaN
  switch (agg) {
    case '平均值': return vals.reduce((a, b) => a + b, 0) / vals.length
    case '计数': return vals.length
    case '最大值': return Math.max(...vals)
    case '最小值': return Math.min(...vals)
    default: return vals.reduce((a, b) => a + b, 0)
  }
}

/** 取「好看」的坐标轴上限：42300 → 50000 */
function niceMax(v: number): number {
  if (v <= 0) return 1000
  const pow = Math.pow(10, Math.floor(Math.log10(v)))
  const n = v / pow
  const f = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10
  return f * pow
}

const PRODUCT_COLORS: Record<string, string> = {
  笔记本: '#3b82f6',
  显示器: '#22c55e',
  键盘: '#f59e0b',
  鼠标: '#a855f7',
}
const SERIES_PALETTE = ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#38bdf8', '#94a3b8', '#f97316', '#14b8a6']
const HEADER_BG_OPTIONS = ['#e8f1fd', '#dcfce7', '#fef3c7', '#f3e8ff', '#f1f5f9']

interface PivotData {
  rowKeys: string[]
  colKeys: string[]
  cell: (rk: string, ck: string) => number
  rowTotal: (rk: string) => number
  colTotal: (ck: string) => number
  grand: number
}

@customElement('pivot-app')
export class PivotApp extends LitElement {
  static styles = [baseStyles, lightTokens, pivotStyles]

  @state() private fields: Record<string, boolean> = { 日期: true, 地区: true, 产品: true, 销售额: true }
  @state() private fieldSearch = ''
  @state() private rowField = '地区'
  @state() private colField = '产品'
  @state() private regionFilter = '全部'
  @state() private productFilter = '全部'
  @state() private agg = '求和'
  @state() private fmtMode = '无小数'
  @state() private panelTab = '分析'
  @state() private settingsOpen = true
  @state() private activeSheetTab = '数据透视表'
  @state() private openMenu: string | null = null
  @state() private showTotalCol = true
  @state() private showTotalRow = true
  @state() private emptyDisplay = '-'
  @state() private headerBg = '#e8f1fd'
  @state() private pvFontSize = 12
  @state() private zebraOn = false
  @state() private toast = ''

  private toastTimer: ReturnType<typeof setTimeout> | null = null
  private docClick = (): void => { if (this.openMenu) this.openMenu = null }

  connectedCallback(): void {
    super.connectedCallback()
    window.addEventListener('click', this.docClick)
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    window.removeEventListener('click', this.docClick)
    if (this.toastTimer) clearTimeout(this.toastTimer)
  }

  /* ---------------- 计算 ---------------- */

  private get visibleCols(): string[] {
    return FIELD_LIST.filter((f) => this.fields[f])
  }

  private get filteredRecords(): SourceRecord[] {
    let rs = SOURCE_RECORDS
    if (this.regionFilter !== '全部') rs = rs.filter((r) => r.region === this.regionFilter)
    if (this.productFilter !== '全部') rs = rs.filter((r) => r.product === this.productFilter)
    return rs
  }

  private get pivot(): PivotData {
    const rs = this.filteredRecords
    const rowKeys = orderedKeys(rs, this.rowField)
    const colKeys = orderedKeys(rs, this.colField)
    const cellVals = new Map<string, number[]>()
    const rowVals = new Map<string, number[]>()
    const colVals = new Map<string, number[]>()
    const all: number[] = []
    for (const r of rs) {
      const rk = dimVal(r, this.rowField)
      const ck = dimVal(r, this.colField)
      const ck2 = (m: Map<string, number[]>, k: string): number[] => {
        const arr = m.get(k) ?? []
        arr.push(r.sales)
        m.set(k, arr)
        return arr
      }
      ck2(cellVals, `${rk}|${ck}`)
      ck2(rowVals, rk)
      ck2(colVals, ck)
      all.push(r.sales)
    }
    const cache = new Map<Map<string, number[]>, Map<string, number>>()
    const aggOf = (m: Map<string, number[]>, k: string): number => {
      let inner = cache.get(m)
      if (!inner) { inner = new Map(); cache.set(m, inner) }
      if (!inner.has(k)) inner.set(k, aggregate(m.get(k) ?? [], this.agg))
      return inner.get(k)!
    }
    return {
      rowKeys,
      colKeys,
      cell: (rk, ck) => aggOf(cellVals, `${rk}|${ck}`),
      rowTotal: (rk) => aggOf(rowVals, rk),
      colTotal: (ck) => aggOf(colVals, ck),
      grand: aggregate(all, this.agg),
    }
  }

  private fmtNum(v: number): string {
    if (Number.isNaN(v)) return ''
    if (this.fmtMode === '两位小数') {
      return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }
    if (this.fmtMode === '纯数字') return String(Math.round(v * 100) / 100)
    return fmtInt(v)
  }

  private fmtCell(v: number): TemplateResult {
    if (Number.isNaN(v)) {
      if (this.emptyDisplay === '0') return html`0`
      if (this.emptyDisplay === '空白') return html``
      return html`<span class="dash">-</span>`
    }
    return html`${this.fmtNum(v)}`
  }

  /* ---------------- 交互 ---------------- */

  private showToast(msg: string): void {
    this.toast = msg
    if (this.toastTimer) clearTimeout(this.toastTimer)
    this.toastTimer = setTimeout(() => { this.toast = '' }, 2200)
  }

  private toggleMenu(name: string): void {
    this.openMenu = this.openMenu === name ? null : name
  }

  private toggleField = (f: string): void => {
    if (f === '销售额' && this.fields['销售额']) {
      this.showToast('「销售额」是值字段，需保留勾选')
      return
    }
    const next = { ...this.fields, [f]: !this.fields[f] }
    this.fields = next
    const dims = ['地区', '产品', '日期'].filter((x) => next[x])
    if (!next[this.rowField]) this.rowField = dims[0] ?? '地区'
    if (!next[this.colField] || this.colField === this.rowField) {
      this.colField = dims.find((x) => x !== this.rowField) ?? this.colField
    }
    if (!next['地区']) this.regionFilter = '全部'
    if (!next['产品']) this.productFilter = '全部'
  }

  private setRowField = (v: string): void => {
    if (v === this.colField) this.colField = this.rowField // 与列维度互换
    this.rowField = v
  }
  private setColField = (v: string): void => {
    if (v === this.rowField) this.rowField = this.colField
    this.colField = v
  }

  /* ---------------- Chrome ---------------- */

  private renderTopbar(): TemplateResult {
    return html`
      <header class="topbar">
        <span class="brand">${sxLogo()}</span>
        <nav class="top-menus">
          ${TOP_MENUS.map((m, i) => html`
            <button class="top-menu ${i === 4 ? 'active' : ''}" @click=${() => toast(`菜单：${m}`)}>${m}</button>`)}
        </nav>
        <div class="top-right">
          <label class="search">
            ${sxIcon('search', 15)}
            <input placeholder="搜索功能..." />
          </label>
          <span class="avatar">JD</span>
        </div>
      </header>`
  }

  private renderToolbar(): TemplateResult {
    return html`
      <div class="toolbar">
        <button class="tool-btn" title="撤销" @click=${() => toast('撤销')} >${sxIcon('undo', 16)}</button>
        <button class="tool-btn" title="重做" @click=${() => toast('重做')} >${sxIcon('redo', 16)}</button>
        <button class="tool-btn" title="打印" @click=${() => toast('打印预览')} >${sxIcon('print', 16)}</button>
        <span class="v-sep"></span>
        <button class="font-select" @click=${() => toast('思源黑体')}><span>思源黑体</span><span class="caret">${sxIcon('chevronDown', 11)}</span></button>
        <button class="font-select"><span>12</span><span class="caret">${sxIcon('chevronDown', 11)}</span></button>
        <span class="v-sep"></span>
        <button class="tool-btn" title="加粗" @click=${() => toast('加粗')} ><b>B</b></button>
        <button class="tool-btn" title="斜体" @click=${() => toast('斜体')} ><i>I</i></button>
        <button class="tool-btn" title="下划线" @click=${() => toast('下划线')} ><u>U</u></button>
        <button class="tool-btn" title="字体颜色" @click=${() => toast('选择字体颜色')} ><span class="fc-red">A</span></button>
        <button class="tool-btn" title="填充颜色" @click=${() => toast('选择填充颜色')} ><span class="fc-yellow">A</span></button>
        <span class="v-sep"></span>
        <button class="tool-btn" title="左对齐" @click=${() => toast('左对齐')} >${sxIcon('alignLeft', 15)}</button>
        <button class="tool-btn" title="居中" @click=${() => toast('居中')} >${sxIcon('alignCenter', 15)}</button>
        <button class="tool-btn" title="右对齐" @click=${() => toast('右对齐')} >${sxIcon('alignRight', 15)}</button>
        <span class="v-sep"></span>
        <button class="font-select" @click=${() => toast('合并单元格')}><span class="merge-label">${sxIcon('merge', 14)} 合并单元格</span><span class="caret">${sxIcon('chevronDown', 11)}</span></button>
        <span class="v-sep"></span>
        <button class="font-select" @click=${() => toast('常规')}><span>常规</span><span class="caret">${sxIcon('chevronDown', 11)}</span></button>
        <span class="v-sep"></span>
        <button class="tool-btn" title="百分比" @click=${() => toast('百分比格式')} >${sxIcon('percent', 15)}</button>
        <button class="tool-btn" title="千分位" @click=${() => toast('千分位格式')} >${sxIcon('currency', 15)}</button>
        <button class="tool-btn" title="小数位" style="font-size:12px" @click=${() => toast('调整小数位')} >.00</button>
        <button class="tool-btn" title="边框" @click=${() => toast('应用边框')} >${sxIcon('border', 15)}</button>
        <button class="tool-btn" title="筛选" @click=${() => toast('打开筛选')} >${sxIcon('filter', 15)}</button>
        <button class="tool-btn" title="排序" @click=${() => toast('打开排序')} >${sxIcon('sort', 15)}</button>
        <button class="tool-btn" title="求和" @click=${() => toast('自动求和')} >${sxIcon('sigma', 15)}</button>
      </div>`
  }

  private renderFormulaBar(): TemplateResult {
    return html`
      <div class="formula-bar">
        <span class="cell-ref">A1<span class="caret">${sxIcon('chevronDown', 10)}</span></span>
        <span class="fx-badge">fx</span>
        <span class="formula-input">销售数据源</span>
      </div>`
  }

  private renderSheetTabs(): TemplateResult {
    return html`
      <div class="sheet-tabs">
        <button class="tab-add" title="新建工作表" @click=${() => this.showToast('新建工作表（演示）')}>${sxIcon('plus', 15)}</button>
        ${SHEET_TABS.map((t) => html`
          <button class="sheet-tab ${this.activeSheetTab === t ? 'on' : ''}"
            @click=${() => { this.activeSheetTab = t; this.showToast(`已切换到「${t}」（演示）`) }}>${t}</button>`)}
        <button class="tab-add" title="更多" @click=${() => this.showToast('更多工作表（演示）')}>${sxIcon('more', 15)}</button>
      </div>`
  }

  private renderStatusbar(): TemplateResult {
    const rs = this.filteredRecords
    const sum = rs.reduce((a, b) => a + b.sales, 0)
    const avg = rs.length ? sum / rs.length : 0
    const f2 = (n: number): string => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    return html`
      <div class="statusbar">
        <span class="status-ok">${sxIcon('checkCircle', 14)} 就绪</span>
        <div class="status-stats">
          <span>平均值: ${f2(avg)}</span>
          <span>计数: ${rs.length}</span>
          <span>求和: ${f2(sum)}</span>
        </div>
        <div class="zoom">
          <button title="缩小" @click=${() => toast('缩小视图')} >${sxIcon('zoomOut', 14)}</button>
          <span>100%</span>
          <button title="放大" @click=${() => toast('放大视图')} >${sxIcon('zoomIn', 14)}</button>
          <button title="全屏" @click=${() => toast('全屏')} >${sxIcon('fullscreen', 14)}</button>
        </div>
      </div>`
  }

  /* ---------------- 源数据表 ---------------- */

  private colWidth(f: string): number {
    return f === '日期' ? 92 : f === '销售额' ? 68 : 64
  }

  private renderSourceTable(): TemplateResult {
    const cols = this.visibleCols
    const letters = 'ABCDEFGHIJ'
    return html`
      <section class="source-area">
        <div class="src-col-headers">
          <span class="src-corner"></span>
          ${cols.map((c, i) => html`
            <span class="src-col-head" style="width:${this.colWidth(c)}px">${letters[i]}</span>`)}
        </div>
        <div class="src-body">
          <div class="src-row">
            <span class="src-row-head"></span>
            ${cols.map((c) => html`
              <span class="src-cell head" style="width:${this.colWidth(c)}px">${c}</span>`)}
          </div>
          ${SOURCE_RECORDS.map((r, ri) => html`
            <div class="src-row">
              <span class="src-row-head">${ri + 1}</span>
              ${cols.map((c) => {
                const v = c === '日期' ? r.date : c === '地区' ? r.region : c === '产品' ? r.product : r.sales
                return html`<span class="src-cell ${c === '销售额' ? 'num' : ''}" style="width:${this.colWidth(c)}px">${
                  c === '销售额' ? this.fmtNum(v as number) : v}</span>`
              })}
            </div>`)}
        </div>
      </section>`
  }

  /* ---------------- 透视表 + 柱状图 ---------------- */

  private renderPivotCard(): TemplateResult {
    const p = this.pivot
    const zebraBg = 'background:var(--sx-bg-subtle)'
    return html`
      <div class="p-card">
        <div class="p-banner"><span class="bi">${sxIcon('pivot', 17)}</span>数据透视表分析</div>
        <div class="p-filters">
          <div class="opt-wrap">
            <button class="p-filter-chip ${this.regionFilter !== '全部' ? 'set' : ''}"
              @click=${(e: Event) => { e.stopPropagation(); this.toggleMenu('topRegion') }}>
              地区${this.regionFilter !== '全部' ? html`<span class="fv">${this.regionFilter}</span>` : nothing}
              <span class="caret">${sxIcon('chevronDown', 11)}</span>
            </button>
            ${this.menu('topRegion', this.regionFilter, ['全部', ...REGION_ORDER], (v) => { this.regionFilter = v })}
          </div>
          <div class="opt-wrap">
            <button class="p-filter-chip ${this.productFilter !== '全部' ? 'set' : ''}"
              @click=${(e: Event) => { e.stopPropagation(); this.toggleMenu('topProduct') }}>
              产品${this.productFilter !== '全部' ? html`<span class="fv">${this.productFilter}</span>` : nothing}
              <span class="caret">${sxIcon('chevronDown', 11)}</span>
            </button>
            ${this.menu('topProduct', this.productFilter, ['全部', ...PRODUCT_ORDER], (v) => { this.productFilter = v })}
          </div>
        </div>
        <div class="pv-scroll">
          <table class="pv-table" style="font-size:${this.pvFontSize}px">
            <tr>
              <th style="width:64px;background:${this.headerBg}"></th>
              <th colSpan=${Math.max(1, p.colKeys.length)} style="background:${this.headerBg}">${this.colField}</th>
              ${this.showTotalCol ? html`<th rowSpan=${2} class="total" style="width:76px;background:${this.headerBg}">汇总</th>` : nothing}
            </tr>
            <tr>
              <th style="width:64px;background:${this.headerBg}">${this.rowField}</th>
              ${p.colKeys.map((c) => html`<th style="width:84px;background:${this.headerBg}">${c}</th>`)}
            </tr>
            ${p.rowKeys.map((rk, ri) => html`
              <tr>
                <td class="rowhead">${rk}</td>
                ${p.colKeys.map((ck) => html`
                  <td class="num" style=${this.zebraOn && ri % 2 === 1 ? zebraBg : nothing}>${this.fmtCell(p.cell(rk, ck))}</td>`)}
                ${this.showTotalCol ? html`<td class="num total">${this.fmtCell(p.rowTotal(rk))}</td>` : nothing}
              </tr>`)}
            ${this.showTotalRow ? html`
              <tr>
                <td class="rowhead total">汇总</td>
                ${p.colKeys.map((ck) => html`<td class="num total">${this.fmtCell(p.colTotal(ck))}</td>`)}
                ${this.showTotalCol ? html`<td class="num total">${this.fmtCell(p.grand)}</td>` : nothing}
              </tr>` : nothing}
            ${p.rowKeys.length === 0 ? html`<tr><td colSpan=${p.colKeys.length + 2} style="color:var(--sx-text-hint)">暂无数据</td></tr>` : nothing}
          </table>
        </div>
      </div>`
  }

  private renderChartCard(): TemplateResult {
    const p = this.pivot
    const groups = p.rowKeys
    const series = p.colKeys
    const colorOf = (ck: string, ci: number): string =>
      PRODUCT_COLORS[ck] ?? SERIES_PALETTE[ci % SERIES_PALETTE.length]
    const W = Math.max(460, groups.length * 96 + 56)
    const H = 176, L = 46, R = 10, T = 10, B = 24
    const pw = W - L - R
    const ph = H - T - B
    let maxV = 0
    for (const rk of groups) for (const ck of series) {
      const v = p.cell(rk, ck)
      if (!Number.isNaN(v)) maxV = Math.max(maxV, v)
    }
    const yMax = niceMax(maxV)
    const y = (v: number): number => T + ph * (1 - v / yMax)
    const slot = groups.length ? pw / groups.length : pw
    const barW = Math.max(6, Math.min(15, slot / (series.length + 2)))
    const ticks = [0, 1, 2, 3, 4, 5].map((i) => (yMax / 5) * i)
    return html`
      <div class="p-card">
        <div class="pc-head">
          <span class="ic">${sxIcon('chartBar', 15)}</span>
          <span class="tt">销售额按${this.rowField}统计</span>
          <div class="pc-legend">
            ${series.map((ck, ci) => html`
              <span class="lg"><span class="dot" style="background:${colorOf(ck, ci)}"></span>${ck}</span>`)}
          </div>
        </div>
        <svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
          ${ticks.map((t) => svg`<line x1=${L} y1=${y(t)} x2=${L + pw} y2=${y(t)} stroke=${t === 0 ? '#cbd5e1' : '#e8edf3'} stroke-width="1" />`)}
          ${ticks.map((t) => svg`<text x=${L - 5} y=${y(t) + 3} text-anchor="end" font-size="8.5" fill="#94a3b8">${fmtInt(t)}</text>`)}
          ${groups.map((rk, gi) => {
            const x0 = L + gi * slot + (slot - series.length * (barW + 3)) / 2
            const label = this.rowField === '日期' ? rk.slice(5) : rk
            return svg`
              ${series.map((ck, si) => {
                const v = p.cell(rk, ck)
                if (Number.isNaN(v)) return nothing
                const barH = (v / yMax) * ph
                return svg`<rect x=${(x0 + si * (barW + 3)).toFixed(1)} y=${(T + ph - barH).toFixed(1)} width=${barW.toFixed(1)} height=${barH.toFixed(1)} rx="2" fill=${colorOf(ck, si)} />`
              })}
              <text x=${(L + gi * slot + slot / 2).toFixed(1)} y=${H - 8} text-anchor="middle" font-size="9.5" fill="#94a3b8">${label}</text>`
          })}
        </svg>
      </div>`
  }

  /* ---------------- 右侧面板 ---------------- */

  private menu(name: string, current: string, options: string[], onPick: (v: string) => void, right = false): TemplateResult {
    if (this.openMenu !== name) return html``
    return html`
      <div class="opt-menu ${right ? 'right' : ''}" @click=${(e: Event) => e.stopPropagation()}>
        ${options.map((o) => html`
          <button class="opt-item ${o === current ? 'on' : ''}"
            @click=${(e: Event) => { e.stopPropagation(); this.openMenu = null; onPick(o) }}>
            ${o}${o === current ? html`<span class="ck">${sxIcon('check', 12)}</span>` : nothing}
          </button>`)}
      </div>`
  }

  private renderDropCard(name: string, menuName: string, current: string, options: string[], onPick: (v: string) => void): TemplateResult {
    return html`
      <div class="drop-card">
        <div class="dc-title"><span class="ic">${sxIcon(DROP_ICONS[name], 13)}</span>${name}<span class="dc-grip">${sxIcon('drag', 13)}</span></div>
        <div class="opt-wrap">
          <button class="drop-opt" @click=${(e: Event) => { e.stopPropagation(); this.toggleMenu(menuName) }}>
            ${current}<span class="caret">${sxIcon('chevronDown', 11)}</span>
          </button>
          ${this.menu(menuName, current, options, onPick)}
        </div>
      </div>`
  }

  private renderTabAnalysis(): TemplateResult {
    const kw = this.fieldSearch.trim()
    const shown = FIELD_LIST.filter((f) => !kw || f.includes(kw))
    const dims = ['地区', '产品', '日期'].filter((x) => this.fields[x])
    return html`
      <div class="pp-section">
        <div class="field-head">
          <span class="pp-label">字段列表</span>
          <span class="fic">${sxIcon('filter', 13)}</span>
        </div>
        <label class="field-search">
          ${sxIcon('search', 13)}
          <input placeholder="搜索字段..." .value=${this.fieldSearch}
            @input=${(e: Event) => { this.fieldSearch = (e.target as HTMLInputElement).value }} />
        </label>
        ${shown.map((f) => html`
          <div class="field-item ${this.fields[f] ? 'checked' : ''}" @click=${() => this.toggleField(f)}>
            <span class="fbox">${this.fields[f] ? sxIcon('check', 10) : nothing}</span>${f}
          </div>`)}
        ${shown.length === 0 ? html`<div class="field-empty">未找到匹配字段</div>` : nothing}
      </div>
      <div class="pp-section">
        <span class="pp-label">拖拽区域</span>
        <div class="drop-grid">
          ${this.renderDropCard('筛选器', 'filterCard', this.regionFilter === '全部' ? '地区' : `地区·${this.regionFilter}`,
            ['全部', ...REGION_ORDER], (v) => { this.regionFilter = v })}
          ${this.renderDropCard('列', 'col', this.colField, COL_FIELD_OPTIONS.filter((x) => dims.includes(x)), this.setColField)}
          ${this.renderDropCard('行', 'row', this.rowField, ROW_FIELD_OPTIONS.filter((x) => dims.includes(x)), this.setRowField)}
          ${this.renderDropCard('值', 'value', '销售额', ['销售额'], () => {})}
        </div>
      </div>
      <div class="pp-section">
        <button class="settings-toggle" @click=${() => { this.settingsOpen = !this.settingsOpen }}>
          <span class="caret ${this.settingsOpen ? 'open' : ''}">${sxIcon('chevronDown', 12)}</span>数据设置
        </button>
        ${this.settingsOpen ? html`
          <div class="set-row">
            <span class="sk">值字段设置:</span>
            <div class="opt-wrap">
              <button class="set-opt" @click=${(e: Event) => { e.stopPropagation(); this.toggleMenu('agg') }}>
                ${this.agg}<span class="caret">${sxIcon('chevronDown', 11)}</span>
              </button>
              ${this.menu('agg', this.agg, AGG_OPTIONS, (v) => { this.agg = v }, true)}
            </div>
          </div>
          <div class="set-row">
            <span class="sk">显示方式:</span>
            <div class="opt-wrap">
              <button class="set-opt" @click=${(e: Event) => { e.stopPropagation(); this.toggleMenu('fmt') }}>
                ${this.fmtMode}<span class="caret">${sxIcon('chevronDown', 11)}</span>
              </button>
              ${this.menu('fmt', this.fmtMode, FORMAT_OPTIONS, (v) => { this.fmtMode = v }, true)}
            </div>
          </div>` : nothing}
      </div>`
  }

  private renderTabDesign(): TemplateResult {
    return html`
      <div class="pp-section">
        <span class="pp-label">汇总</span>
        <div class="set-row"><span class="sk">显示汇总列</span>
          <button class="set-opt" style="justify-content:flex-end" @click=${() => { this.showTotalCol = !this.showTotalCol }}>
            ${this.showTotalCol ? '显示' : '隐藏'}</button>
        </div>
        <div class="set-row"><span class="sk">显示汇总行</span>
          <button class="set-opt" style="justify-content:flex-end" @click=${() => { this.showTotalRow = !this.showTotalRow }}>
            ${this.showTotalRow ? '显示' : '隐藏'}</button>
        </div>
      </div>
      <div class="pp-section">
        <span class="pp-label">空值显示</span>
        <div class="opt-wrap">
          <button class="set-opt" @click=${(e: Event) => { e.stopPropagation(); this.toggleMenu('empty') }}>
            ${this.emptyDisplay === '-' ? '短横线 (-)' : this.emptyDisplay === '0' ? '零 (0)' : '空白'}
            <span class="caret">${sxIcon('chevronDown', 11)}</span>
          </button>
          ${this.menu('empty', this.emptyDisplay, ['-', '0', '空白'], (v) => { this.emptyDisplay = v })}
        </div>
      </div>
      <div class="pp-section">
        <span class="pp-label">透视表样式</span>
        <div class="opt-wrap">
          <button class="set-opt" @click=${(e: Event) => { e.stopPropagation(); this.toggleMenu('pvstyle') }}>
            经典蓝<span class="caret">${sxIcon('chevronDown', 11)}</span>
          </button>
          ${this.menu('pvstyle', '经典蓝', ['经典蓝', '简约灰', '商务黑'], () => this.showToast('透视表样式（演示）'))}
        </div>
      </div>`
  }

  private renderTabStyle(): TemplateResult {
    return html`
      <div class="pp-section">
        <span class="pp-label">表头底色</span>
        <div style="display:flex;gap:8px">
          ${HEADER_BG_OPTIONS.map((c) => html`
            <button style="width:26px;height:26px;border-radius:7px;cursor:pointer;border:2px solid ${this.headerBg === c ? 'var(--sx-text-primary)' : 'transparent'};background:${c}"
              @click=${() => { this.headerBg = c }}></button>`)}
        </div>
      </div>
      <div class="pp-section">
        <span class="pp-label">正文字号</span>
        <div class="opt-wrap">
          <button class="set-opt" @click=${(e: Event) => { e.stopPropagation(); this.toggleMenu('fs') }}>
            ${this.pvFontSize}px<span class="caret">${sxIcon('chevronDown', 11)}</span>
          </button>
          ${this.menu('fs', `${this.pvFontSize}px`, ['12px', '13px', '14px'], (v) => { this.pvFontSize = parseInt(v, 10) })}
        </div>
      </div>
      <div class="pp-section">
        <span class="pp-label">斑马纹</span>
        <button class="set-opt" @click=${() => { this.zebraOn = !this.zebraOn }}>
          ${this.zebraOn ? '已开启' : '已关闭'}<span class="caret">${sxIcon('chevronDown', 11)}</span>
        </button>
      </div>`
  }

  private renderPanel(): TemplateResult {
    return html`
      <aside class="pivot-panel">
        <div class="pp-head">
          <span class="ic">${sxIcon('pivot', 16)}</span>
          <span class="tt">数据透视表</span>
          <button class="pp-close" title="关闭" @click=${() => this.showToast('面板已收起（演示）')}>${sxIcon('close', 15)}</button>
        </div>
        <div class="pp-tabs">
          ${PANEL_TABS.map((t) => html`
            <button class="pp-tab ${this.panelTab === t ? 'on' : ''}" @click=${() => { this.panelTab = t }}>${t}</button>`)}
        </div>
        ${this.panelTab === '分析' ? this.renderTabAnalysis()
          : this.panelTab === '设计' ? this.renderTabDesign()
          : this.renderTabStyle()}
      </aside>`
  }

  /* ---------------- 页面 ---------------- */

  render(): TemplateResult {
    const letters = 'EFGHIJKLMN'
    return html`
      <div class="app">
        ${this.renderTopbar()}
        ${this.renderToolbar()}
        <div class="body">
          <div style="flex:1;min-width:0;display:flex;flex-direction:column">
            ${this.renderFormulaBar()}
            <div style="flex:1;min-height:0;display:flex">
              ${this.renderSourceTable()}
              <div class="pivot-area">
                <div class="p-col-headers">
                  ${[...letters].map((c) => html`<span class="p-col-head">${c}</span>`)}
                  <span class="p-col-fill"></span>
                </div>
                <div class="p-grid">
                  ${this.renderPivotCard()}
                  ${this.renderChartCard()}
                </div>
              </div>
            </div>
          </div>
          ${this.renderPanel()}
        </div>
        ${this.renderSheetTabs()}
        ${this.renderStatusbar()}
        ${this.toast ? html`<div class="toast">${this.toast}</div>` : nothing}
      </div>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pivot-app': PivotApp
  }
}
