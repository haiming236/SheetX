/**
 * SheetX 第 09 张 · 数据筛选与排序
 *
 * 展示：多字段筛选（条件组合可增删）、C 列筛选面板（排序/分类勾选/搜索）、
 * 升降序排列、筛选结果统计（应用后按当前条件真实计算）。
 */
import { LitElement, html, type TemplateResult } from 'lit'
import { customElement } from 'lit/decorators/custom-element.js'
import { state } from 'lit/decorators/state.js'
import { sxIcon, sxLogo } from './icons.js'
import { lightTokens, darkVarMap, baseStyles } from './tokens.js'
import { filterStyles } from './filter-styles.js'
import {
  FILTER_ROWS, FILTER_COLUMNS, colSortActions, colMoreActions,
  categoryInit, conditionFields, conditionOps, sortDirections,
  conditionsInit, filterSheetTabs, statsSnapshot, fmtAmount,
  type FilterRow, type FilterCondition,
} from './filter-data.js'
import { toast } from './toast.js'

@customElement('filter-app')
export class FilterApp extends LitElement {
  static styles = [baseStyles, lightTokens, filterStyles]

  /** 展示行（应用筛选/排序后更新） */
  @state() private displayedRows: FilterRow[] = [...FILTER_ROWS]
  /** 多条件筛选 */
  @state() private conditions: FilterCondition[] = conditionsInit.map((c) => ({ ...c }))
  /** 分类勾选（C 列面板） */
  @state() private categoryChecks: Record<string, boolean> = { ...categoryInit }
  /** C 列面板搜索关键字 */
  @state() private keyword = ''
  /** 排序设置 */
  @state() private sortField = '金额'
  @state() private sortDir = '降序'
  /** 统计（初始为设计稿快照，应用后为真实计算值） */
  @state() private stats = { ...statsSnapshot }
  /** 面板开关 */
  @state() private panelOpen = true
  @state() private colPanelOpen = true
  /** 当前展开的下拉标识 */
  @state() private openDrop: string | null = null
  /** 选中的单元格 */
  @state() private selected: { r: number; c: number } | null = null
  /** 状态栏提示 */
  @state() private statusText = '就绪'
  /** 主题 */
  @state() private dark = false

  private readonly totalRows = 16

  private toggleTheme = (): void => {
    this.dark = !this.dark
    for (const [key, value] of Object.entries(darkVarMap)) {
      if (this.dark) this.style.setProperty(key, value)
      else this.style.removeProperty(key)
    }
  }

  /* ---------------- 交互 ---------------- */

  private togglePanel = (): void => {
    this.panelOpen = !this.panelOpen
  }

  private toggleColPanel = (): void => {
    this.colPanelOpen = !this.colPanelOpen
  }

  private selectCell = (r: number, c: number): void => {
    this.selected = { r, c }
  }

  private toggleCategory = (label: string): void => {
    this.categoryChecks = { ...this.categoryChecks, [label]: !this.categoryChecks[label] }
  }

  private get allChecked(): boolean {
    return Object.values(this.categoryChecks).every(Boolean)
  }

  private toggleAllCategories = (): void => {
    const next = !this.allChecked
    const checks: Record<string, boolean> = {}
    for (const key of Object.keys(this.categoryChecks)) checks[key] = next
    this.categoryChecks = checks
  }

  private toggleDrop = (id: string, e: Event): void => {
    e.stopPropagation()
    this.openDrop = this.openDrop === id ? null : id
  }

  private closeDrops = (): void => {
    this.openDrop = null
    this.colPanelOpen = false
  }

  private setCondition = (idx: number, patch: Partial<FilterCondition>): void => {
    this.conditions = this.conditions.map((c, i) => (i === idx ? { ...c, ...patch } : c))
  }

  private addCondition = (e: Event): void => {
    e.stopPropagation()
    this.conditions = [...this.conditions, { field: '订单编号', op: '包含', value: '' }]
  }

  private removeCondition = (idx: number, e: Event): void => {
    e.stopPropagation()
    this.conditions = this.conditions.filter((_, i) => i !== idx)
  }

  /** 条件匹配 */
  private matchCondition(row: FilterRow, cond: FilterCondition): boolean {
    const map: Record<string, string | number> = {
      订单编号: row.order, 客户名称: row.customer, 产品分类: row.category,
      产品名称: row.product, 数量: row.qty, 金额: row.amount,
    }
    const actual = map[cond.field]
    const target = cond.value.trim()
    if (target === '') return true
    const asNum = Number(actual)
    const targetNum = Number(target)
    const numeric = !Number.isNaN(asNum) && !Number.isNaN(targetNum) && target !== ''
    switch (cond.op) {
      case '包含': return String(actual).includes(target)
      case '不包含': return !String(actual).includes(target)
      case '等于': return numeric ? asNum === targetNum : String(actual) === target
      case '大于': return numeric ? asNum > targetNum : String(actual) > target
      case '小于': return numeric ? asNum < targetNum : String(actual) < target
      default: return true
    }
  }

  /** 点击"应用"：条件 + 分类勾选 + 排序 综合生效，统计卡实时计算 */
  private applyAll = (e: Event): void => {
    e.stopPropagation()
    let rows = FILTER_ROWS.filter((r) => this.conditions.every((c) => this.matchCondition(r, c)))
    const picked = Object.entries(this.categoryChecks).filter(([, v]) => v).map(([k]) => k)
    const totalCats = Object.keys(this.categoryChecks).length
    if (picked.length > 0 && picked.length < totalCats) {
      rows = rows.filter((r) => picked.includes(r.category))
    }
    const dir = this.sortDir === '升序' ? 1 : -1
    const fieldMap: Record<string, (r: FilterRow) => string | number> = {
      订单编号: (r) => r.order, 客户名称: (r) => r.customer, 产品分类: (r) => r.category,
      产品名称: (r) => r.product, 数量: (r) => r.qty, 金额: (r) => r.amount,
    }
    const getter = fieldMap[this.sortField] ?? fieldMap['金额']
    rows = [...rows].sort((a, b) => {
      const va = getter(a); const vb = getter(b)
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir
      return String(va).localeCompare(String(vb), 'zh-CN') * dir
    })
    this.displayedRows = rows
    const sum = rows.reduce((acc, r) => acc + r.amount, 0)
    this.stats = { count: rows.length, sum, avg: rows.length ? Math.round(sum / rows.length) : 0 }
    this.statusText = `已应用筛选 · ${rows.length} 条结果`
    this.openDrop = null
  }

  /** 重置为设计稿初始态 */
  private resetAll = (e: Event): void => {
    e.stopPropagation()
    this.conditions = conditionsInit.map((c) => ({ ...c }))
    this.categoryChecks = { ...categoryInit }
    this.sortField = '金额'
    this.sortDir = '降序'
    this.displayedRows = [...FILTER_ROWS]
    this.stats = { ...statsSnapshot }
    this.statusText = '就绪'
    this.openDrop = null
  }

  /** C 列面板：立即按产品分类排序 */
  private quickSort = (dir: 'asc' | 'desc'): void => {
    const mul = dir === 'asc' ? 1 : -1
    this.displayedRows = [...this.displayedRows].sort((a, b) => a.category.localeCompare(b.category, 'zh-CN') * mul)
    this.sortField = '产品分类'
    this.sortDir = dir === 'asc' ? '升序' : '降序'
    this.colPanelOpen = false
    this.statusText = `已按 产品分类 ${dir === 'asc' ? '升序' : '降序'} 排列`
  }

  /** C 列面板：确定（应用分类勾选） */
  private confirmColumn = (): void => {
    this.applyAll(new Event('apply'))
    this.colPanelOpen = false
  }

  private cancelColumn = (): void => {
    this.categoryChecks = { ...categoryInit }
    this.keyword = ''
    this.colPanelOpen = false
  }

  /* ---------------- 渲染 ---------------- */

  render(): TemplateResult {
    return html`
      <div class="app">
        ${this.renderTopbar()}
        ${this.renderToolbar()}
        ${this.renderFormulaBar()}
        <div class="body" @click=${this.closeDrops}>
          <div class="grid-area" @click=${() => { this.selected = null }}>
            ${this.renderSheet()}
          </div>
          ${this.colPanelOpen ? this.renderColPanel() : ''}
          ${this.panelOpen ? this.renderFilterPanel() : ''}
        </div>
        ${this.renderTabs()}
        ${this.renderStatusbar()}
      </div>
    `
  }

  private renderTopbar(): TemplateResult {
    const menus = ['文件', '开始', '插入', '数据', '公式', '视图', '设置']
    return html`
      <header class="topbar">
        <span class="brand">${sxLogo()}</span>
        <nav class="nav">
          ${menus.map((m, i) => html`
            <button class="nav-item ${i === 1 ? 'active' : ''}" @click=${() => toast(`菜单：${m}`)}>${m}</button>
          `)}
        </nav>
        <div class="topbar-right">
          <button class="icon-btn" title="搜索" @click=${() => toast('搜索')} >${sxIcon('search', 16)}</button>
          <button class="icon-btn" title="切换主题" @click=${this.toggleTheme}>${sxIcon(this.dark ? 'sun' : 'moon', 16)}</button>
          <button class="icon-btn" title="帮助" @click=${() => toast('帮助中心（F1）')} >${sxIcon('help', 16)}</button>
          <span class="avatar">JD</span>
        </div>
      </header>
    `
  }

  private renderToolbar(): TemplateResult {
    return html`
      <div class="toolbar">
        <button class="tool-btn" title="撤销" @click=${() => toast('撤销')} >${sxIcon('undo', 16)}</button>
        <button class="tool-btn" title="重做" @click=${() => toast('重做')} >${sxIcon('redo', 16)}</button>
        <button class="tool-btn" title="打印" @click=${() => toast('打印预览')} >${sxIcon('print', 16)}</button>
        <span class="v-sep"></span>
        <button class="font-select wide" @click=${() => toast('思源黑体')}><span>思源黑体</span><span class="caret">${sxIcon('chevronDown', 12)}</span></button>
        <button class="font-select"><span>12</span><span class="caret">${sxIcon('chevronDown', 12)}</span></button>
        <span class="v-sep"></span>
        <button class="tool-btn" title="加粗" @click=${() => toast('加粗')} >${sxIcon('bold', 15)}</button>
        <button class="tool-btn" title="斜体" @click=${() => toast('斜体')} >${sxIcon('italic', 15)}</button>
        <button class="tool-btn" title="下划线" @click=${() => toast('下划线')} >${sxIcon('underline', 15)}</button>
        <button class="tool-btn" title="字体颜色" @click=${() => toast('选择字体颜色')} >${sxIcon('fontColor', 15)}</button>
        <button class="tool-btn" title="填充颜色" @click=${() => toast('选择填充颜色')} ><span class="text-demo hl-mark">A</span></button>
        <span class="v-sep"></span>
        <button class="tool-btn" title="左对齐" @click=${() => toast('左对齐')} >${sxIcon('alignLeft', 15)}</button>
        <button class="tool-btn" title="居中" @click=${() => toast('居中')} >${sxIcon('alignCenter', 15)}</button>
        <button class="tool-btn" title="右对齐" @click=${() => toast('右对齐')} >${sxIcon('alignRight', 15)}</button>
        <button class="tool-btn" title="合并单元格" @click=${() => toast('合并单元格')} ><span style="display:inline-flex;align-items:center;gap:3px">${sxIcon('merge', 15)}<span class="caret">${sxIcon('chevronDown', 10)}</span></span></button>
        <span class="v-sep"></span>
        <button class="font-select" @click=${() => toast('常规')}><span>常规</span><span class="caret">${sxIcon('chevronDown', 12)}</span></button>
        <span class="v-sep"></span>
        <button class="tool-btn" title="百分比" @click=${() => toast('百分比格式')} >${sxIcon('percent', 15)}</button>
        <button class="tool-btn" title="千分位" @click=${() => toast('千分位格式')} >${sxIcon('currency', 15)}</button>
        <button class="tool-btn" title="小数位" @click=${() => toast('调整小数位')} ><span class="text-demo" style="font-size:12px">.00</span></button>
        <button class="tool-btn" title="边框" @click=${() => toast('应用边框')} >${sxIcon('border', 15)}</button>
        <span class="v-sep"></span>
        <button class="tool-btn active" title="筛选" @click=${this.togglePanel}>${sxIcon('filter', 15)}</button>
        <button class="tool-btn" title="排序" @click=${() => toast('打开排序')} >${sxIcon('sort', 15)}</button>
        <button class="tool-btn" title="求和" @click=${() => toast('自动求和')} >${sxIcon('sigma', 15)}</button>
      </div>
    `
  }

  private renderFormulaBar(): TemplateResult {
    return html`
      <div class="formula-bar">
        <span class="cell-address"><span>A1</span><span class="caret">${sxIcon('chevronDown', 12)}</span></span>
        <span class="fx-box">fx</span>
        <div class="formula-input">订单编号</div>
      </div>
    `
  }

  private renderSheet(): TemplateResult {
    const colWidths = [150, 150, 126, 126, 88, 104]
    const emptyCount = Math.max(0, this.totalRows - this.displayedRows.length)
    return html`
      <table class="sheet">
        <colgroup>
          <col style="width:36px" />
          ${colWidths.map((w) => html`<col style="width:${w}px" />`)}
        </colgroup>
        <thead>
          <tr>
            <th class="corner"></th>
            ${FILTER_COLUMNS.map((name, i) => html`
              <th class="col-head ${i === 2 && this.colPanelOpen ? 'filtering' : ''}">
                <span class="head-wrap">
                  <span>${name}</span>
                  <button class="th-filter" title="筛选" @click=${(e: Event) => { e.stopPropagation(); if (i === 2) this.toggleColPanel() }}>
                    ${sxIcon('filter', 12)}
                  </button>
                </span>
              </th>
            `)}
          </tr>
        </thead>
        <tbody>
          ${this.displayedRows.map((row, ri) => html`
            <tr>
              <th class="row-head">${ri + 1}</th>
              ${[row.order, row.customer, row.category, row.product, String(row.qty), fmtAmount(row.amount)].map((val, ci) => html`
                <td
                  class="cell ${ci >= 4 ? 'num' : ''} ${this.selected && this.selected.r === ri && this.selected.c === ci ? 'selected' : ''}"
                  @click=${(e: Event) => { e.stopPropagation(); this.selectCell(ri, ci) }}
                >${val}</td>
              `)}
            </tr>
          `)}
          ${Array.from({ length: emptyCount }, (_, i) => html`
            <tr>
              <th class="row-head">${this.displayedRows.length + i + 1}</th>
              ${colWidths.map(() => html`<td class="cell"></td>`)}
            </tr>
          `)}
        </tbody>
      </table>
    `
  }

  /** C 列（产品分类）筛选面板 */
  private renderColPanel(): TemplateResult {
    const kw = this.keyword.trim()
    const entries = Object.entries(this.categoryChecks)
    const visible = kw ? entries.filter(([label]) => label.includes(kw)) : entries
    return html`
      <div class="col-panel" @click=${(e: Event) => e.stopPropagation()}>
        ${colSortActions.map((a) => html`
          <button class="cp-row" @click=${() => this.quickSort(a.icon === 'sortAZ' ? 'asc' : 'desc')}>
            <span class="cp-icon">${sxIcon(a.icon, 15)}</span>
            <span class="cp-label">${a.label}</span>
          </button>
        `)}
        ${colMoreActions.map((label) => html`
          <button class="cp-row" @click=${() => toast('编辑筛选条件')}>
            <span class="cp-icon">${sxIcon('blankCell', 14)}</span>
            <span class="cp-label">${label}</span>
            <span class="cp-arr">${sxIcon('chevronRight', 13)}</span>
          </button>
        `)}
        <label class="cp-search">
          ${sxIcon('search', 13)}
          <input placeholder="搜索..." .value=${this.keyword} @input=${(e: InputEvent) => { this.keyword = (e.target as HTMLInputElement).value }} />
        </label>
        ${kw === '' ? html`
          <button class="cp-check ${this.allChecked ? 'on' : ''}" @click=${this.toggleAllCategories}>
            <span class="box">${this.allChecked ? sxIcon('check', 11) : ''}</span>
            <span class="cp-label">全选</span>
            <span class="cnt">(${entries.length})</span>
          </button>
        ` : ''}
        ${visible.map(([label, checked]) => html`
          <button class="cp-check ${checked ? 'on' : ''}" @click=${() => this.toggleCategory(label)}>
            <span class="box">${checked ? sxIcon('check', 11) : ''}</span>
            <span class="cp-label">${label}</span>
          </button>
        `)}
        ${visible.length === 0 ? html`<div class="cp-empty">无匹配分类</div>` : ''}
        <div class="cp-actions">
          <button class="btn-sm primary" @click=${this.confirmColumn}>确定</button>
          <button class="btn-sm" @click=${this.cancelColumn}>取消</button>
        </div>
      </div>
    `
  }

  /** 右侧筛选设置面板 */
  private renderFilterPanel(): TemplateResult {
    return html`
      <aside class="filter-panel" @click=${(e: Event) => e.stopPropagation()}>
        <div class="fp-head">
          <span class="funnel">${sxIcon('filter', 16)}</span>
          <span>筛选设置</span>
          <button class="icon-btn" title="关闭" @click=${this.togglePanel}>${sxIcon('close', 15)}</button>
        </div>

        <button class="fp-mode" @click=${() => toast('切换筛选模式')}>
          多条件筛选（满足所有条件）
          <span class="caret">${sxIcon('chevronDown', 12)}</span>
        </button>

        ${this.conditions.map((cond, i) => html`
          <div class="cond-row">
            ${this.renderSelect(`cond-${i}-field`, cond.field, [...conditionFields], (v) => this.setCondition(i, { field: v }))}
            ${this.renderSelect(`cond-${i}-op`, cond.op, [...conditionOps], (v) => this.setCondition(i, { op: v }))}
            <input
              class="cond-value"
              placeholder="输入值"
              .value=${cond.value}
              @input=${(e: InputEvent) => this.setCondition(i, { value: (e.target as HTMLInputElement).value })}
            />
            <button class="cond-del" title="删除条件" @click=${(e: Event) => this.removeCondition(i, e)}>${sxIcon('minusCircle', 15)}</button>
          </div>
        `)}

        <button class="add-cond" @click=${this.addCondition}>${sxIcon('plus', 13)} 添加条件</button>

        <div class="fp-divider"></div>

        <div class="sort-head">
          <span class="ic">${sxIcon('sort', 15)}</span>
          <span>排序设置</span>
        </div>
        <div class="sort-row">
          <span>按</span>
          ${this.renderSelect('sort-field', this.sortField, [...conditionFields], (v) => { this.sortField = v })}
          ${this.renderSelect('sort-dir', this.sortDir, [...sortDirections], (v) => { this.sortDir = v })}
        </div>

        <div class="fp-actions">
          <button class="btn-main primary" @click=${this.applyAll}>应用</button>
          <button class="btn-main" @click=${this.resetAll}>重置</button>
        </div>

        <div class="stat-card">
          <div class="stat-head">
            <span class="ic">${sxIcon('chartBar', 15)}</span>
            <span>筛选结果统计</span>
          </div>
          <div class="stat-line">共 <strong>${this.stats.count}</strong> 条数据</div>
          <div class="stat-line">合计金额：<strong>${fmtAmount(this.stats.sum)}</strong></div>
        </div>
      </aside>
    `
  }

  /** 通用自绘下拉（条件字段/运算符、排序字段/方向） */
  private renderSelect(
    id: string,
    current: string,
    options: readonly string[],
    onPick: (v: string) => void,
  ): TemplateResult {
    const open = this.openDrop === id
    return html`
      <div class="cond-select">
        <button class="cs-btn" @click=${(e: Event) => this.toggleDrop(id, e)}>
          <span class="txt">${current}</span>
          <span class="caret">${sxIcon('chevronDown', 11)}</span>
        </button>
        ${open ? html`
          <div class="cs-menu">
            ${options.map((opt) => html`
              <button class="cs-opt ${opt === current ? 'on' : ''}" @click=${(e: Event) => { e.stopPropagation(); onPick(opt); this.openDrop = null }}>
                ${opt}
              </button>
            `)}
          </div>
        ` : ''}
      </div>
    `
  }

  private renderTabs(): TemplateResult {
    return html`
      <div class="sheet-tabs">
        <button class="tab-add" title="新增工作表" @click=${() => toast('已新增工作表')} >${sxIcon('plus', 15)}</button>
        ${filterSheetTabs.map((t, i) => html`
          <button class="sheet-tab ${i === 0 ? 'active' : ''}">${t}</button>
        `)}
        <button class="tab-add" title="更多" style="width:auto;padding:0 8px" @click=${() => toast('更多操作')} >${sxIcon('more', 15)}</button>
      </div>
    `
  }

  private renderStatusbar(): TemplateResult {
    return html`
      <footer class="statusbar">
        <span class="status-ready"><span class="dot"></span>${this.statusText}</span>
        <div class="status-stats">
          <span>平均值: ${fmtAmount(this.stats.avg)}</span>
          <span>计数: ${this.stats.count}</span>
          <span>求和: ${fmtAmount(this.stats.sum)}</span>
        </div>
        <div class="zoom">
          <button class="icon-btn" title="缩小" @click=${() => toast('缩小视图')} >${sxIcon('zoomOut', 14)}</button>
          <span class="zoom-value">100%</span>
          <button class="icon-btn" title="放大" @click=${() => toast('放大视图')} >${sxIcon('zoomIn', 14)}</button>
        </div>
        <button class="icon-btn" title="全屏" style="margin-left:14px" @click=${() => toast('全屏')} >${sxIcon('fullscreen', 14)}</button>
      </footer>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'filter-app': FilterApp
  }
}
