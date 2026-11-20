/**
 * SheetX 公式编辑与函数助手界面（第 06 张设计稿）
 *
 * 纯 UI 外壳：展示公式输入、函数提示、参数说明、引用高亮和计算结果。
 * 引擎接入后由 @sheetx/spreadsheet 驱动真实公式与增量重算。
 */
import { LitElement, html, type TemplateResult } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { unsafeSVG } from 'lit/directives/unsafe-svg.js'
import { baseStyles, lightTokens } from './tokens.js'
import { bindPageTheme, toggleTheme as toggleGlobalTheme } from './theme.js'
import { formulaStyles } from './formula-styles.js'
import { sxIcon, sxLogo, type IconName } from './icons.js'
import {
  formulaNavMenus, formulaSheetTabs, functionCategories, editingFormula, formulaSegments,
  functionSuggestions, formulaRows, formulaColumns, summaryRows,
  trendSeries, trendXLabels, trendYTicks, assistantDoc,
  functionCategoriesDoc, functionExamples, formulaStats,
} from './formula-data.js'
import { toast } from './toast.js'

type AssistantTab = '函数搜索' | '函数分类' | '使用示例'

@customElement('formula-app')
export class FormulaApp extends LitElement {
  static styles = [baseStyles, lightTokens, formulaStyles]

  @state() private theme: 'light' | 'dark' = 'light'
  @state() private activeMenu = '公式'
  @state() private activeSheet = '销售数据'
  @state() private activeCat = '插入函数'
  @state() private activeFn = 0
  @state() private activeAssistantTab: AssistantTab = '函数搜索'
  @state() private searchText = 'SUMIF'
  @state() private selectedCell: { row: number; col: number } | null = null
  @state() private zoom = 100
  @state() private viewMode: 'grid' | 'list' = 'grid'

  render() {
    return html`
      <div class="app" data-theme=${this.theme}>
        ${this.renderTopbar()}
        ${this.renderToolbar()}
        ${this.renderFormulaBar()}
        <div class="body">
          <div class="grid-area">
            ${this.renderSheet()}
            ${this.renderFnDropdown()}
            ${this.renderCards()}
          </div>
          ${this.renderAssistant()}
        </div>
        ${this.renderSheetTabs()}
        ${this.renderStatusBar()}
      </div>
    `
  }

  // ---------- 顶部导航 ----------
  private renderTopbar(): TemplateResult {
    return html`
      <div class="topbar">
        <div class="brand">${sxLogo()}</div>
        <nav class="nav">
          ${formulaNavMenus.map(menu => html`
            <button
              class="nav-item ${menu === this.activeMenu ? 'active' : ''}"
              @click=${() => { this.activeMenu = menu }}
            >${menu}</button>
          `)}
        </nav>
        <div class="topbar-right">
          <div class="search-box">
            ${sxIcon('search', 14)}
            <input placeholder="搜索函数、帮助文档..." />
          </div>
          <button class="icon-btn" title="帮助" @click=${() => toast('帮助中心（F1）')} >${sxIcon('help', 17)}</button>
          <button
            class="icon-btn"
            title=${this.theme === 'light' ? '切换深色' : '切换浅色'}
            @click=${this.toggleTheme}
          >${sxIcon(this.theme === 'light' ? 'sun' : 'moon', 17)}</button>
          <span class="avatar">张</span>
        </div>
      </div>
    `
  }

  // ---------- 函数分类工具栏 ----------
  private renderToolbar(): TemplateResult {
    return html`
      <div class="toolbar">
        <button class="tool-btn" title="撤销" @click=${() => toast('撤销')} >${sxIcon('undo', 16)}<span class="caret">${sxIcon('chevronDown', 10)}</span></button>
        <button class="tool-btn" title="重做" @click=${() => toast('重做')} >${sxIcon('redo', 16)}<span class="caret">${sxIcon('chevronDown', 10)}</span></button>
        <span style="width:6px"></span>
        ${functionCategories.map(cat => {
          const active = this.activeCat === cat.label
          return html`
            <button
              class="tool-cat ${cat.bordered ? 'bordered' : ''} ${active ? 'active' : ''}"
              style=${active && !cat.bordered ? 'background:var(--sx-bg-active);color:var(--sx-brand)' : ''}
              @click=${() => { this.activeCat = cat.label }}
            >
              ${cat.icon ? html`<span class="cat-icon">${sxIcon(cat.icon as IconName, 14)}</span>` : ''}
              <span>${cat.label}</span>
              <span class="caret">${sxIcon('chevronDown', 12)}</span>
            </button>
          `
        })}
      </div>
    `
  }

  // ---------- 公式栏 ----------
  private renderFormulaBar(): TemplateResult {
    return html`
      <div class="formula-bar">
        <div class="cell-address">F2 <span class="caret">${sxIcon('chevronDown', 12)}</span></div>
        <div class="fx-box">fx</div>
        <div class="formula-input" aria-label="公式输入框">
          ${formulaSegments.map(seg => html`<span class="seg-${seg.kind}">${seg.text}</span>`)}
        </div>
      </div>
    `
  }

  // ---------- 表格 ----------
  private renderSheet(): TemplateResult {
    return html`
      <table class="sheet" style="transform:scale(${this.zoom / 100});transform-origin:top left">
        <colgroup>
          <col style="width:40px" />
          ${formulaColumns.map(col => html`<col style="width:${col.width}px" />`)}
        </colgroup>
        <thead>
          <tr>
            <th class="corner"></th>
            ${formulaColumns.map((_, i) => html`<th class="col-head">${String.fromCharCode(65 + i)}</th>`)}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th class="row-head">1</th>
            ${formulaColumns.map(col => html`
              <td class="cell head-cell ${'highlight' in col && col.highlight ? 'hl' : ''} ${'accent' in col && col.accent ? 'accent' : ''}">${col.title}</td>
            `)}
          </tr>
          ${formulaRows.map((row, ri) => this.renderDataRow(row, ri))}
        </tbody>
      </table>
    `
  }

  private renderDataRow(row: (typeof formulaRows)[number], ri: number): TemplateResult {
    const cells = [row.date, row.category, row.amount, row.region]
    return html`
      <tr>
        <th class="row-head">${ri + 2}</th>
        ${cells.map((value, ci) => html`
          <td
            class="cell ${ci === 2 ? 'num' : ''} ${this.isSelected(ri, ci) ? 'selected' : ''}"
            @click=${() => { this.selectedCell = { row: ri, col: ci } }}
          >${value}</td>
        `)}
        ${this.renderHelperCell(row, ri)}
        ${this.renderFormulaCell(ri)}
      </tr>
    `
  }

  private renderHelperCell(row: (typeof formulaRows)[number], ri: number): TemplateResult {
    return html`
      <td
        class="cell ${this.isSelected(ri, 4) ? 'selected' : ''}"
        @click=${() => { this.selectedCell = { row: ri, col: 4 } }}
      >
        ${row.helper
          ? html`<span class="mini-select">${row.helper}<span class="caret">${sxIcon('chevronDown', 12)}</span></span>`
          : ''}
      </td>
    `
  }

  private renderFormulaCell(ri: number): TemplateResult {
    if (ri === 0) {
      return html`<td class="cell editing"><div class="edit-box">${editingFormula}</div></td>`
    }
    return html`<td class="cell"></td>`
  }

  private isSelected(ri: number, ci: number): boolean {
    const sel = this.selectedCell
    return !!sel && sel.row === ri && sel.col === ci
  }

  // ---------- 函数自动补全下拉 ----------
  private renderFnDropdown(): TemplateResult {
    return html`
      <div class="fn-dropdown">
        ${functionSuggestions.map((fn, i) => html`
          <div
            class="fn-row ${i === this.activeFn ? 'active' : ''}"
            @click=${() => { this.activeFn = i }}
          >
            <span class="fx">fx</span>
            <span class="name">${fn.name}</span>
            <span class="desc">${fn.desc}</span>
          </div>
        `)}
        <div class="fn-more">
          查看更多函数
          ${sxIcon('chevronRight', 12)}
        </div>
      </div>
    `
  }

  // ---------- 底部卡片：销售汇总 + 趋势图 ----------
  private renderCards(): TemplateResult {
    return html`
      <div class="cards-row">
        <div class="card summary">
          <div class="summary-head"><span class="c1">产品类别</span><span class="c2">销售额</span></div>
          ${summaryRows.map(row => html`
            <div class="summary-row ${row.highlight ? 'hl' : ''}">
              <span class="c1">${row.category}</span>
              <span class="c2">${row.amount}</span>
            </div>
          `)}
        </div>
        <div class="card trend">
          <div class="trend-title">各产品销售趋势</div>
          <div class="trend-legend">
            ${trendSeries.map(s => html`
              <span class="item"><span class="dot" style="background:${s.color}"></span>${s.name}</span>
            `)}
          </div>
          <div class="trend-chart">${unsafeSVG(this.buildTrendSvg())}</div>
        </div>
      </div>
    `
  }

  /** 折线图（原生 SVG 整段注入，零依赖、矢量清晰） */
  private buildTrendSvg(): string {
    const w = 340
    const h = 150
    const plotLeft = 34
    const plotRight = w - 8
    const plotTop = 8
    const plotBottom = 124
    const xStep = (plotRight - plotLeft) / (trendXLabels.length - 1)
    const yOf = (v: number): number => plotBottom - (v / 30000) * (plotBottom - plotTop)
    const xOf = (i: number): number => plotLeft + i * xStep

    const gridLines = trendYTicks.map(tick => {
      const y = yOf(tick).toFixed(1)
      const label = tick === 0 ? '0' : `${tick / 1000}k`
      return `<line x1="${plotLeft}" y1="${y}" x2="${plotRight}" y2="${y}" stroke="var(--sx-grid-line)" stroke-width="1"></line>` +
        `<text x="${plotLeft - 5}" y="${y}" text-anchor="end" dominant-baseline="middle" font-size="9" fill="var(--sx-text-hint)">${label}</text>`
    }).join('')

    const xLabels = trendXLabels.map((label, i) =>
      `<text x="${xOf(i)}" y="${h - 8}" text-anchor="middle" font-size="9.5" fill="var(--sx-text-hint)">${label}</text>`,
    ).join('')

    const lines = trendSeries.map(series => {
      const pts = series.values.map((v, i) => `${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`).join(' ')
      const dots = series.values.map((v, i) =>
        `<circle cx="${xOf(i).toFixed(1)}" cy="${yOf(v).toFixed(1)}" r="2.6" fill="${series.color}"></circle>`,
      ).join('')
      return `<polyline points="${pts}" fill="none" stroke="${series.color}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"></polyline>${dots}`
    }).join('')

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" height="150" preserveAspectRatio="xMidYMid meet">${gridLines}${xLabels}${lines}</svg>`
  }

  // ---------- 右侧函数助手 ----------
  private renderAssistant(): TemplateResult {
    const tabs: AssistantTab[] = ['函数搜索', '函数分类', '使用示例']
    return html`
      <aside class="assistant">
        <div class="assistant-head">
          <span class="fx-badge">fx</span>
          <span class="title">函数助手</span>
          <button class="icon-btn" title="关闭" @click=${() => toast('关闭')} >${sxIcon('close', 15)}</button>
        </div>
        <div class="assistant-tabs">
          ${tabs.map(tab => html`
            <button
              class="assistant-tab ${this.activeAssistantTab === tab ? 'active' : ''}"
              @click=${() => { this.activeAssistantTab = tab }}
            >${tab}</button>
          `)}
        </div>
        <div class="assistant-body">
          ${this.activeAssistantTab === '函数搜索' ? this.renderDocSearch() : ''}
          ${this.activeAssistantTab === '函数分类' ? this.renderDocCategories() : ''}
          ${this.activeAssistantTab === '使用示例' ? this.renderDocExamples() : ''}
        </div>
      </aside>
    `
  }

  private renderDocSearch(): TemplateResult {
    return html`
      <div class="doc-search">
        ${sxIcon('search', 13)}
        <input
          .value=${this.searchText}
          placeholder="搜索函数"
          @input=${(e: Event) => { this.searchText = (e.target as HTMLInputElement).value }}
        />
        <button class="clear" title="清空" @click=${() => { this.searchText = '' }}>${sxIcon('close', 12)}</button>
      </div>
      <div>
        <div class="doc-name">${assistantDoc.name}</div>
        <div class="doc-desc" style="margin-top:3px">${assistantDoc.desc}</div>
      </div>
      <div class="doc-syntax">${assistantDoc.syntax}</div>
      <div class="doc-section">参数说明</div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:-6px">
        ${assistantDoc.params.map(param => html`
          <div class="param-row">
            <span class="param-pill" style="background:${param.soft};color:${param.color}">${param.name}</span>
            <span class="pdesc">${param.desc}</span>
          </div>
        `)}
      </div>
      <div class="doc-section">示例</div>
      <div class="example-card">
        <span class="code">${assistantDoc.example}</span>
        <span class="note">${assistantDoc.exampleDesc}</span>
      </div>
    `
  }

  private renderDocCategories(): TemplateResult {
    return html`
      <div class="doc-list">
        ${functionCategoriesDoc.map(cat => html`
          <div class="doc-list-row">
            <span>${cat.name}</span>
            <span class="count">${cat.count} 个函数</span>
          </div>
        `)}
      </div>
    `
  }

  private renderDocExamples(): TemplateResult {
    return html`
      <div style="display:flex;flex-direction:column;gap:10px">
        ${functionExamples.map(ex => html`
          <div class="example-card">
            <span class="code">${ex.formula}</span>
            <span class="note">${ex.desc}</span>
          </div>
        `)}
      </div>
    `
  }

  // ---------- 工作表标签 ----------
  private renderSheetTabs(): TemplateResult {
    return html`
      <div class="sheet-tabs">
        <button class="tab-add" title="添加工作表" @click=${() => toast('已添加工作表')} >${sxIcon('plus', 15)}</button>
        ${formulaSheetTabs.map(name => html`
          <button
            class="sheet-tab ${this.activeSheet === name ? 'active' : ''}"
            @click=${() => { this.activeSheet = name }}
          >${name}</button>
        `)}
        <button class="tab-add" title="添加工作表" @click=${() => toast('已添加工作表')} >${sxIcon('plus', 15)}</button>
      </div>
    `
  }

  // ---------- 状态栏 ----------
  private renderStatusBar(): TemplateResult {
    return html`
      <div class="statusbar">
        <span class="status-ready"><span class="dot"></span>就绪</span>
        <span class="status-count">共 <strong>${formulaStats.total}</strong> 条数据</span>
        <span class="status-stats">
          <span>平均值: ${formulaStats.avg}</span>
          <span>计数: ${formulaStats.count}</span>
          <span>求和: ${formulaStats.sum}</span>
        </span>
        <span class="status-view">
          <button
            class="tool-btn ${this.viewMode === 'grid' ? 'active' : ''}"
            title="网格视图"
            @click=${() => { this.viewMode = 'grid' }}
          >${sxIcon('gridView', 14)}</button>
          <button
            class="tool-btn ${this.viewMode === 'list' ? 'active' : ''}"
            title="列表视图"
            @click=${() => { this.viewMode = 'list' }}
          >${sxIcon('listView', 14)}</button>
        </span>
        <span class="zoom">
          <button class="tool-btn" title="缩小" @click=${() => { this.zoom = Math.max(50, this.zoom - 10) }}>${sxIcon('zoomOut', 14)}</button>
          <input type="range" min="50" max="150" step="10" .value=${String(this.zoom)} @input=${(e: Event) => { this.zoom = Number((e.target as HTMLInputElement).value) }} />
          <button class="tool-btn" title="放大" @click=${() => { this.zoom = Math.min(150, this.zoom + 10) }}>${sxIcon('zoomIn', 14)}</button>
          <span class="zoom-value">${this.zoom}%</span>
        </span>
        <button class="tool-btn" title="全屏" style="margin-left:8px" @click=${() => toast('全屏')} >${sxIcon('fullscreen', 14)}</button>
      </div>
    `
  }

  // ---------- 交互 ----------
  private stopTheme: (() => void) | null = null

  connectedCallback(): void {
    super.connectedCallback()
    // 主题由全局管理：切换后同步本页 state，使 `[data-theme='dark']` 局部规则生效
    this.stopTheme = bindPageTheme((resolved) => {
      this.theme = resolved
      this.requestUpdate()
    })
  }

  disconnectedCallback(): void {
    this.stopTheme?.()
    this.stopTheme = null
    super.disconnectedCallback()
  }

  private toggleTheme(): void {
    toggleGlobalTheme()
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'formula-app': FormulaApp
  }
}
