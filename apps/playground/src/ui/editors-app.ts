/**
 * SheetX 单元格编辑与业务下拉界面（第 04 张设计稿）
 *
 * 纯 UI 外壳：mock 数据 + DOM，引擎接入后由 @sheetx/editors 替换。
 */
import { LitElement, html, type TemplateResult } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { baseStyles, lightTokens } from './tokens.js'
import { editorsStyles } from './editors-styles.js'
import { sxIcon, sxLogo, type IconName } from './icons.js'
import {
  purchaseRows, productResults, statusOptions, customerResults, calendarDays,
  type PurchaseRow,
} from './editors-data.js'
import { toast } from './toast.js'
import { toggleTheme as toggleGlobalTheme } from './theme.js'

@customElement('editors-app')
export class EditorsApp extends LitElement {
  static styles = [baseStyles, lightTokens, editorsStyles]

  @state() private activeMenu = '开始'
  @state() private activeSheet = '销售数据'
  @state() private numValue = 1234.56
  @state() private selectedDate = 5
  @state() private statusIndex = 0
  @state() private productDropdownOpen = true
  @state() private productSearch = '笔记本'
  @state() private hoveredProduct = 0

  render() {
    return html`
      <div class="app">
        ${this.renderTopbar()}
        ${this.renderToolbar()}
        ${this.renderFormulaBar()}
        <div class="body">
          <div class="grid-area">
            ${this.renderTable()}
            ${this.productDropdownOpen ? this.renderProductDropdown() : ''}
          </div>
          ${this.renderEditors()}
        </div>
        ${this.renderSheetTabs()}
        ${this.renderStatusBar()}
      </div>
    `
  }

  private renderTopbar(): TemplateResult {
    const menus = ['开始', '插入', '数据', '公式', '视图', '设置']
    return html`
      <div class="topbar">
        <div class="brand">${sxLogo()}</div>
        <nav class="nav">
          ${menus.map(m => html`
            <button class="nav-item ${m === this.activeMenu ? 'active' : ''}" @click=${() => { this.activeMenu = m }}>${m}</button>
          `)}
        </nav>
        <div class="topbar-right">
          <div class="search-box">${sxIcon('search', 14)}<input placeholder="搜索商品、客户、单据..." /></div>
          <button class="icon-btn" @click=${() => toast('帮助中心（F1）')}>${sxIcon('help', 17)}</button>
          <button class="icon-btn" @click=${() => toggleGlobalTheme()}>${sxIcon('sun', 17)}</button>
          <span class="avatar">张</span>
        </div>
      </div>
    `
  }

  private renderToolbar(): TemplateResult {
    const t = (n: IconName, title: string, cls = '') => html`<button class="tool-btn ${cls}" title=${title} @click=${() => toast(title)}>${sxIcon(n, 16)}</button>`
    return html`
      <div class="toolbar">
        ${t('undo', '撤销')}${t('redo', '重做')}${t('undo', '重做')}
        <button class="tool-select font" @click=${() => toast('更多选项')}>思源黑体 <span class="caret">${sxIcon('chevronDown', 12)}</span></button>
        <button class="tool-select size" @click=${() => toast('更多选项')}>12 <span class="caret">${sxIcon('chevronDown', 12)}</span></button>
        <span class="sep"></span>
        ${t('bold', '加粗')}${t('italic', '斜体')}${t('underline', '下划线')}${t('fontColor', '颜色', 'fcolor')}
        <span class="sep"></span>
        ${t('alignLeft', '左对齐')}${t('alignCenter', '居中')}${t('alignRight', '右对齐')}${t('alignJustify', '两端对齐')}
        <button class="tool-select format" @click=${() => toast('更多选项')}>合并居中 <span class="caret">${sxIcon('chevronDown', 12)}</span></button>
        <button class="tool-select format" @click=${() => toast('更多选项')}>常规 <span class="caret">${sxIcon('chevronDown', 12)}</span></button>
        ${t('currency', '货币')}${t('percent', '百分比')}${t('decimalMinus', '减小数位')}${t('decimalPlus', '加小数位')}
        <span class="sep"></span>
        <button class="tool-action" @click=${() => toast('筛选')}>${sxIcon('filter', 16)}<span>筛选</span></button>
        <button class="tool-action" @click=${() => toast('排序')}>${sxIcon('sort', 16)}<span>排序</span></button>
        <button class="tool-action" @click=${() => toast('冻结')}>${sxIcon('freeze', 16)}<span>冻结</span></button>
        <button class="tool-action" @click=${() => toast('更多')}>${sxIcon('more', 16)}<span>更多</span></button>
      </div>
    `
  }

  private renderFormulaBar(): TemplateResult {
    return html`
      <div class="formula-bar">
        <div class="cell-address">C2 <span class="caret">${sxIcon('chevronDown', 11)}</span></div>
        <div class="fx-box">fx</div>
        <input class="formula-input" value="笔记本电脑" aria-label="公式输入框" />
      </div>
    `
  }

  private renderTable(): TemplateResult {
    return html`
      <table class="grid-table">
        <colgroup><col style="width:32px" />${['56px','100px','150px','110px','74px','92px','100px','120px','88px'].map(w => html`<col style="width:${w}" />`)}</colgroup>
        <thead><tr><th></th>${['序号','商品编码','商品名称','规格型号','数量','单价(元)','金额(元)','交货日期','状态'].map(h => html`<th>${h}</th>`)}</tr></thead>
        <tbody>
          ${purchaseRows.map((r, i) => this.renderRow(r, i))}
        </tbody>
      </table>
    `
  }

  private renderRow(row: PurchaseRow, i: number): TemplateResult {
    const editing = i === 0
    return html`
      <tr>
        <th class="row-h ${editing ? 'hl' : ''}">${editing ? '2' : ''}</th>
        <td class="center">${row.no}</td>
        <td>${row.code}</td>
        <td class="${editing ? 'editing' : ''}">
          ${editing ? html`
            <span class="edit-input">${row.name}<span style="color:var(--sx-text-hint);display:inline-flex">${sxIcon('chevronDown', 13)}</span></span>
          ` : row.name}
        </td>
        <td>${row.spec}</td>
        <td class="center">${row.qty}</td>
        <td class="right">${row.price.toFixed(2)}</td>
        <td class="right">${row.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        <td>${this.renderDateCell(row.date)}</td>
        <td>${this.renderBadge(row.status)}</td>
      </tr>
    `
  }

  private renderDateCell(date: string): TemplateResult {
    return html`<span class="date-cell">${date}<span class="cal">${sxIcon('calendar', 14)}</span></span>`
  }

  private renderBadge(status: PurchaseRow['status']): TemplateResult {
    const map: Record<string, { bg: string; fg: string }> = {
      正常: { bg: '#e6f4ea', fg: '#1e7a4d' },
      待发货: { bg: '#e8f1ff', fg: '#2563eb' },
      缺货: { bg: '#fff2e3', fg: '#e08a1e' },
    }
    const c = map[status]
    return html`<span class="badge" style="background:${c.bg};color:${c.fg}"><span class="dot" style="background:${c.fg}"></span>${status}</span>`
  }

  /** 商品远程搜索下拉 */
  private renderProductDropdown(): TemplateResult {
    return html`
      <div class="product-dropdown">
        <div class="product-search">
          ${sxIcon('search', 14)}
          <input .value=${this.productSearch} @input=${(e: Event) => { this.productSearch = (e.target as HTMLInputElement).value }} aria-label="搜索商品" />
          <button class="icon-btn" style="width:20px;height:20px" @click=${() => { this.productDropdownOpen = false }}>${sxIcon('close', 13)}</button>
        </div>
        ${productResults.map((p, i) => html`
          <div class="product-item ${this.hoveredProduct === i ? 'hl' : ''}"
            @mouseenter=${() => { this.hoveredProduct = i }}
            @click=${() => { this.productDropdownOpen = false }}
          >
            <span class="thumb">${sxIcon('laptop', 18)}</span>
            <span>
              <span class="pt" style="display:block">${p.title}</span>
              <span class="ps" style="display:block">${p.code} · ${p.spec}</span>
            </span>
          </div>
        `)}
        <div class="product-footer"><span>共 3 条结果</span><a href="javascript:void(0)">查看更多...</a></div>
      </div>
    `
  }

  /** 四个编辑器演示卡片 */
  private renderEditors(): TemplateResult {
    return html`
      <div class="editors">
        ${this.renderNumberEditor()}
        ${this.renderDateEditor()}
        ${this.renderSelectEditor()}
        ${this.renderCustomerEditor()}
      </div>
    `
  }

  private renderNumberEditor(): TemplateResult {
    const steps = (delta: number) => { this.numValue = Math.round((this.numValue + delta) * 100) / 100 }
    return html`
      <div class="panel">
        <h4>数字 / 金额编辑器</h4>
        <div class="num-input">
          <input .value=${String(this.numValue)} @input=${(e: Event) => { this.numValue = Number((e.target as HTMLInputElement).value) || 0 }} aria-label="金额" />
          <span class="steps">
            <button @click=${() => steps(1)}>${sxIcon('chevronUp', 10)}</button>
            <button @click=${() => steps(-1)}>${sxIcon('chevronDown', 10)}</button>
          </span>
        </div>
        <div class="quick-btns">
          <button @click=${() => steps(100)}>+100</button>
          <button @click=${() => steps(1000)}>+1000</button>
          <button @click=${() => steps(-100)}>-100</button>
          <button @click=${() => steps(-1000)}>-1000</button>
        </div>
        <div class="range-hint"><span class="check">${sxIcon('check', 13)}</span>范围：0 ~ 999999.99</div>
      </div>
    `
  }

  private renderDateEditor(): TemplateResult {
    const wk = ['一', '二', '三', '四', '五', '六', '日']
    return html`
      <div class="panel">
        <h4>日期选择器</h4>
        <div class="date-input">
          ${sxIcon('calendar', 14)}<span>2025-12-${String(this.selectedDate).padStart(2, '0')}</span>
          <span class="caret">${sxIcon('chevronDown', 13)}</span>
        </div>
        <div class="calendar">
          <div class="cal-head">
            <button @click=${() => toast('上一个月')}>${sxIcon('chevronLeft', 13)}</button>
            <span>2025年十二月</span>
            <button @click=${() => toast('下一个月')}>${sxIcon('chevronRight', 13)}</button>
          </div>
          <div class="cal-grid">
            ${wk.map(d => html`<span class="wd">${d}</span>`)}
            ${calendarDays.map(d => html`
              <span class="day ${d === this.selectedDate ? 'sel' : ''}" @click=${() => { this.selectedDate = d }}>${d}</span>
            `)}
          </div>
        </div>
      </div>
    `
  }

  private renderSelectEditor(): TemplateResult {
    const cur = statusOptions[this.statusIndex]
    return html`
      <div class="panel">
        <h4>下拉选择</h4>
        <div class="select-box">${cur.label}<span class="caret">${sxIcon('chevronDown', 13)}</span></div>
        <div class="select-menu">
          ${statusOptions.map((o, i) => html`
            <div class="select-option ${i === this.statusIndex ? 'active' : ''}" @click=${() => { this.statusIndex = i }}>
              <span class="st"><span class="dot" style="background:${o.color}"></span>${o.label}</span>
              ${i === this.statusIndex ? html`<span class="check">${sxIcon('check', 13)}</span>` : ''}
            </div>
          `)}
        </div>
      </div>
    `
  }

  private renderCustomerEditor(): TemplateResult {
    return html`
      <div class="panel">
        <h4>远程搜索选择（客户）</h4>
        <div class="cust-search">${sxIcon('search', 14)}<span>搜索客户名称...</span></div>
        <div class="cust-list">
          ${customerResults.map(c => html`
            <div class="cust-item">
              <span class="cavatar" style="background:${c.color}">${c.name[0]}</span>
              <span><span class="cn" style="display:block">${c.name}</span><span class="cc" style="display:block">${c.company}</span></span>
            </div>
          `)}
        </div>
      </div>
    `
  }

  private renderSheetTabs(): TemplateResult {
    const tabs = ['销售数据', '库存统计', '利润分析']
    return html`
      <div class="sheet-tabs">
        <button class="tab-add" @click=${() => toast('已新增工作表')}>${sxIcon('plus', 14)}</button>
        ${tabs.map(t => html`<button class="sheet-tab ${this.activeSheet === t ? 'active' : ''}" @click=${() => { this.activeSheet = t }}>${t}</button>`)}
        <button class="tab-add" @click=${() => toast('已新增工作表')}>${sxIcon('plus', 14)}</button>
      </div>
    `
  }

  private renderStatusBar(): TemplateResult {
    return html`
      <div class="statusbar">
        <span class="status-ready"><span class="dot"></span>就绪</span>
        <span class="status-stats"><span>平均值: 2,499.50</span><span>计数: 6</span><span>求和: 149,970.00</span></span>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'editors-app': EditorsApp
  }
}
