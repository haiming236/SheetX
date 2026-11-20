/**
 * SheetX Spreadsheet 完整模式界面（第 03 张设计稿 · 销售数据统计报表）
 *
 * 纯 UI 外壳：mock 数据 + DOM/SVG，引擎接入后由 @sheetx/spreadsheet 替换。
 * 图表用原生 SVG 绘制（零依赖、矢量清晰）。
 */
import { LitElement, html, type TemplateResult } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { unsafeSVG } from 'lit/directives/unsafe-svg.js'
import { baseStyles, lightTokens } from './tokens.js'
import { fullStyles } from './full-styles.js'
import { sxIcon, sxLogo, type IconName } from './icons.js'
import {
  salesRows, salesTotal, pieSlices, monthlyTrend, monthLabels,
  fullMenus, fullSheetTabs, type SalesRow,
} from './full-data.js'
import { toast } from './toast.js'
import { toggleTheme as toggleGlobalTheme } from './theme.js'

@customElement('full-app')
export class FullApp extends LitElement {
  static styles = [baseStyles, lightTokens, fullStyles]

  @state() private activeMenu = '开始'
  @state() private activeSheet = '销售报表'
  @state() private formatTab: '数字' | '对齐' | '字体' | '边框' | '填充' = '数字'
  @state() private selectedCell = { row: 0, col: 1 }
  @state() private zoom = 100

  render() {
    return html`
      <div class="app">
        ${this.renderTopbar()}
        ${this.renderToolbar()}
        ${this.renderFormulaBar()}
        <div class="body">
          <div class="content">${this.renderSheet()}${this.renderCharts()}</div>
          ${this.renderInspector()}
        </div>
        ${this.renderSheetTabs()}
        ${this.renderStatusBar()}
      </div>
    `
  }

  // ---------- 顶部 ----------
  private renderTopbar(): TemplateResult {
    return html`
      <div class="topbar">
        <div class="brand">${sxLogo()}</div>
        <button class="file-btn">${sxIcon('file', 15)} 文件 ${sxIcon('chevronDown', 11)}</button>
        <nav class="nav">
          ${fullMenus.map(m => html`
            <button class="nav-item ${m === this.activeMenu ? 'active' : ''}" @click=${() => { this.activeMenu = m }}>${m}</button>
          `)}
        </nav>
        <div class="topbar-right">
          <div class="search-box">${sxIcon('search', 14)}<input placeholder="搜索功能、函数或帮助 (Ctrl + F)" /></div>
          <button class="icon-btn" @click=${() => toast('帮助中心（F1）')}>${sxIcon('help', 17)}</button>
          <button class="icon-btn" @click=${() => toggleGlobalTheme()}>${sxIcon('sun', 17)}</button>
          <span class="avatar">张</span>
        </div>
      </div>
    `
  }

  // ---------- 工具栏 ----------
  private renderToolbar(): TemplateResult {
    const t = (n: IconName, title: string, cls = '') => html`<button class="tool-btn ${cls}" title=${title} @click=${() => toast(title)}>${sxIcon(n, 16)}</button>`
    return html`
      <div class="toolbar">
        ${t('undo', '撤销')}${t('redo', '重做')}
        <button class="tool-select font" @click=${() => toast('更多选项')}>思源黑体 <span class="caret">${sxIcon('chevronDown', 12)}</span></button>
        <button class="tool-select size" @click=${() => toast('更多选项')}>11 <span class="caret">${sxIcon('chevronDown', 12)}</span></button>
        <span class="sep"></span>
        ${t('bold', '加粗')}${t('italic', '斜体')}${t('underline', '下划线')}${t('fontColor', '颜色', 'fcolor')}
        <span class="sep"></span>
        ${t('alignLeft', '左对齐')}${t('alignCenter', '居中')}${t('alignRight', '右对齐')}
        <button class="tool-select format" @click=${() => toast('更多选项')}>合并居中 <span class="caret">${sxIcon('chevronDown', 12)}</span></button>
        <span class="sep"></span>
        <button class="tool-select format" @click=${() => toast('更多选项')}>常规 <span class="caret">${sxIcon('chevronDown', 12)}</span></button>
        ${t('currency', '货币')}${t('percent', '百分比')}${t('decimalMinus', '减小数位')}${t('decimalPlus', '加小数位')}
        <span class="sep"></span>
        <button class="tool-action" @click=${() => toast('条件格式')}>${sxIcon('conditional', 16)}<span>条件格式</span></button>
        <button class="tool-action" @click=${() => toast('表格样式')}>${sxIcon('tableStyle', 16)}<span>表格样式</span></button>
        <button class="tool-action" @click=${() => toast('筛选')}>${sxIcon('filter', 16)}<span>筛选</span></button>
        <button class="tool-action" @click=${() => toast('筛选')}>${sxIcon('filter', 16)}<span>筛选</span></button>
        <button class="tool-action" @click=${() => toast('排序')}>${sxIcon('sort', 16)}<span>排序</span></button>
      </div>
    `
  }

  // ---------- 公式栏 ----------
  private renderFormulaBar(): TemplateResult {
    const addr = `B2`
    return html`
      <div class="formula-bar">
        <div class="cell-address">${addr} <span class="caret">${sxIcon('chevronDown', 11)}</span></div>
        <div class="fx-box">fx</div>
        <input class="formula-input" value="=SUM(B2:B100)" aria-label="公式输入框" />
      </div>
    `
  }

  // ---------- 表格 ----------
  private renderSheet(): TemplateResult {
    const cols = '28px 90px 100px 90px 120px 80px 240px'
    return html`
      <table class="sheet" style="grid-template-columns:${cols}">
        <colgroup><col style="width:28px" />${['90px','100px','90px','120px','80px','240px'].map(w => html`<col style="width:${w}" />`)}</colgroup>
        <thead><tr><th></th>${['A','B','C','D','E','F'].map(c => html`<th class="col-h">${c}</th>`)}</tr></thead>
        <tbody>
          <tr><th class="row-h">1</th><td class="title-bar" colspan="6">
            <span>▦ &nbsp;销售数据统计报表</span><span class="date">统计日期：2025年1月1日 - 12月31日</span>
          </td></tr>
          <tr><th class="row-h">2</th>
            <td class="subhdr">「 产品编码 」</td><td class="subhdr">产品名称</td>
            <td class="subhdr">销售数量</td><td class="subhdr">销售金额</td>
            <td class="subhdr">毛利率</td><td class="subhdr">销售趋势</td>
          </tr>
          ${salesRows.map((r, i) => this.renderSalesRow(r, i))}
          <tr><th class="row-h">8</th>
            <td class="total" colspan="2">合计</td>
            <td class="total right">${salesTotal.qty.toLocaleString()}</td>
            <td class="total right">${salesTotal.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            <td class="total right">${salesTotal.margin}%</td>
            <td class="total"></td>
          </tr>
        </tbody>
      </table>
    `
  }

  private renderSalesRow(row: SalesRow, i: number): TemplateResult {
    const no = i + 3
    const sel = (col: number) => this.selectedCell.row === i && this.selectedCell.col === col ? 'selected' : ''
    const pick = (col: number) => { this.selectedCell = { row: i, col } }
    return html`
      <tr>
        <th class="row-h">${no}</th>
        <td class="${sel(0)}" @click=${() => pick(0)}>${row.code}</td>
        <td class="${sel(1)}" @click=${() => pick(1)}>${row.name}</td>
        <td class="right ${sel(2)}" @click=${() => pick(2)}>${row.qty.toLocaleString()}</td>
        <td class="right ${sel(3)}" @click=${() => pick(3)}>${row.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        <td class="right ${sel(4)}" @click=${() => pick(4)}>${row.margin}%</td>
        <td class="${sel(5)}" @click=${() => pick(5)}>${this.sparkline(row.trend)}</td>
      </tr>
    `
  }

  /** 迷你折线（Sparkline，整段 unsafeSVG 注入） */
  private sparkline(values: number[]): TemplateResult {
    const w = 200, h = 18
    const min = Math.min(...values), max = Math.max(...values)
    const pts = values.map((v, i) => {
      const x = (i / (values.length - 1)) * w
      const y = h - ((v - min) / (max - min || 1)) * (h - 3) - 1.5
      return `${x.toFixed(1)},${y.toFixed(1)}`
    }).join(' ')
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" height="20" preserveAspectRatio="none" style="display:block"><polyline points="${pts}" fill="none" stroke="var(--sx-brand)" stroke-width="1.6" vector-effect="non-scaling-stroke"></polyline></svg>`
    return html`${unsafeSVG(svg)}`
  }

  // ---------- 图表区 ----------
  private renderCharts(): TemplateResult {
    return html`
      <div class="charts">
        ${this.renderPieCard()}
        ${this.renderTrendCard()}
        ${this.renderKpiCards()}
      </div>
    `
  }

  /** 甜甜圈图（原生 SVG，整段以 unsafeSVG 注入，确保 SVG 命名空间正确） */
  private renderPieCard(): TemplateResult {
    const r = 38, c = 2 * Math.PI * r
    let offset = 0
    const arcs = pieSlices.map(s => {
      const len = (s.value / 100) * c
      const arc = `<circle cx="50" cy="50" r="${r}" fill="none" stroke="${s.color}" stroke-width="16" stroke-dasharray="${len.toFixed(2)} ${(c - len).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 50 50)"></circle>`
      offset += len
      return arc
    }).join('')
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="94" height="94">${arcs}<text x="50" y="54" text-anchor="middle" font-size="12" fill="var(--sx-text-secondary)">100%</text></svg>`
    return html`
      <div class="card pie-card">
        <h4>产品销售占比</h4>
        <div class="pie-row">
          ${unsafeSVG(svg)}
          <div class="pie-legend">
            ${pieSlices.map(s => html`
              <span class="li"><span class="dot" style="background:${s.color}"></span>${s.label} &nbsp;${s.value}%</span>
            `)}
          </div>
        </div>
      </div>
    `
  }

  /** 月度趋势折线图 */
  private renderTrendCard(): TemplateResult {
    const w = 360, h = 92, pad = 8
    const min = 0, max = 100
    const pts = monthlyTrend.map((v, i) => {
      const x = pad + (i / (monthlyTrend.length - 1)) * (w - pad * 2)
      const y = h - pad - ((v - min) / (max - min)) * (h - pad * 2)
      return { x, y }
    })
    const line = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
    const area = `${pad},${h - pad} ${line} ${w - pad},${h - pad}`
    const gridLines = [25, 50, 75].map(v => {
      const y = h - pad - (v / max) * (h - pad * 2)
      return `<line x1="${pad}" y1="${y}" x2="${w - pad}" y2="${y}" stroke="var(--sx-grid-line)" stroke-width="1"></line>`
    }).join('')
    const dots = pts.map(p => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="2.2" fill="var(--sx-brand)"></circle>`).join('')
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" height="92" preserveAspectRatio="none">${gridLines}<polygon points="${area}" fill="var(--sx-brand-soft)" opacity="0.55"></polygon><polyline points="${line}" fill="none" stroke="var(--sx-brand)" stroke-width="1.8"></polyline>${dots}</svg>`
    return html`
      <div class="card trend-card">
        <h4>月度销售趋势</h4>
        ${unsafeSVG(svg)}
        <div style="display:flex;justify-content:space-between;font-size:9px;color:var(--sx-text-hint);margin-top:2px">
          ${monthLabels.map(m => html`<span>${m}</span>`)}
        </div>
      </div>
    `
  }

  /** 数据卡片 */
  private renderKpiCards(): TemplateResult {
    return html`
      <div class="kpi-cards">
        <div class="kpi">
          <span class="kicon blue">${sxIcon('cart', 17)}</span>
          <span><span class="klabel">总销售额</span><br /><span class="kvalue">¥ 312.87万</span><br /><span class="kdelta">↑ 12.5%</span></span>
        </div>
        <div class="kpi">
          <span class="kicon purple">${sxIcon('box', 17)}</span>
          <span><span class="klabel">总订单数</span><br /><span class="kvalue">1,248</span><br /><span class="kdelta">↑ 8.3%</span></span>
        </div>
      </div>
    `
  }

  // ---------- 右侧格式面板 ----------
  private renderInspector(): TemplateResult {
    const tabs = ['数字', '对齐', '字体', '边框', '填充'] as const
    return html`
      <aside class="inspector">
        <div class="inspector-head"><span>单元格格式</span><button class="icon-btn" style="width:22px;height:22px" @click=${() => toast('关闭')}>${sxIcon('close', 14)}</button></div>
        <div class="inspector-tabs">
          ${tabs.map(t => html`
            <button class="inspector-tab ${this.formatTab === t ? 'active' : ''}" @click=${() => { this.formatTab = t }}>${t}</button>
          `)}
        </div>
        <div class="inspector-body">
          <div>
            <span class="field-label">分类</span>
            <div class="field-select">货币 <span class="caret">${sxIcon('chevronDown', 12)}</span></div>
          </div>
          <div>
            <span class="field-label">小数位数</span>
            <div class="field-select">2 <span class="caret">${sxIcon('chevronDown', 12)}</span></div>
          </div>
          <div>
            <span class="field-label">货币符号</span>
            <div class="field-select">¥ <span class="caret">${sxIcon('chevronDown', 12)}</span></div>
          </div>
          <label class="check-row"><span class="check">${sxIcon('checkboxChecked', 15)}</span>使用千分位分隔符</label>
          <div>
            <span class="field-label">预览</span>
            <div class="preview-box">¥ 1,234,567.00</div>
          </div>
        </div>
      </aside>
    `
  }

  // ---------- 工作表标签 ----------
  private renderSheetTabs(): TemplateResult {
    return html`
      <div class="sheet-tabs">
        <button class="tab-add" @click=${() => toast('已新增工作表')}>${sxIcon('plus', 14)}</button>
        ${fullSheetTabs.map(name => html`
          <button class="sheet-tab ${this.activeSheet === name ? 'active' : ''}" @click=${() => { this.activeSheet = name }}>${name}</button>
        `)}
        <button class="tab-add" @click=${() => toast('已新增工作表')}>${sxIcon('plus', 14)}</button>
      </div>
    `
  }

  // ---------- 状态栏 ----------
  private renderStatusBar(): TemplateResult {
    return html`
      <div class="statusbar">
        <span class="status-ready"><span class="dot"></span>就绪</span>
        <span class="status-stats">
          <span>平均值: 622,736.00</span><span>计数: 5</span><span>求和: 3,113,680.00</span>
        </span>
        <span class="status-view">
          <button class="tool-btn active" @click=${() => toast('网格视图')}>${sxIcon('gridView', 13)}</button>
          <button class="tool-btn" @click=${() => toast('卡片视图')}>${sxIcon('listView', 13)}</button>
        </span>
        <span class="zoom">
          <button class="tool-btn" @click=${() => { this.zoom = Math.max(50, this.zoom - 10) }}>${sxIcon('zoomOut', 13)}</button>
          <input type="range" min="50" max="150" step="10" .value=${String(this.zoom)} @input=${(e: Event) => { this.zoom = Number((e.target as HTMLInputElement).value) }} />
          <button class="tool-btn" @click=${() => { this.zoom = Math.min(150, this.zoom + 10) }}>${sxIcon('zoomIn', 13)}</button>
          <span>${this.zoom}%</span>
        </span>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'full-app': FullApp
  }
}
