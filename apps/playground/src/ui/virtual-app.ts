/**
 * SheetX 大数据量与虚拟滚动界面（第 05 张设计稿）
 *
 * 纯 UI 外壳：mock 数据 + DOM/SVG，引擎接入后由 @sheetx/grid 替换。
 * 性能折线图用 unsafeSVG 整段注入（确保 SVG 命名空间正确）。
 */
import { LitElement, html, type TemplateResult } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { unsafeSVG } from 'lit/directives/unsafe-svg.js'
import { baseStyles, lightTokens } from './tokens.js'
import { virtualStyles } from './virtual-styles.js'
import { sxIcon, sxLogo, type IconName } from './icons.js'
import {
  bigDataRows, categoryColors, fpsSeries, perfStatuses, type BigDataRow,
} from './virtual-data.js'
import { toast } from './toast.js'
import { toggleTheme as toggleGlobalTheme } from './theme.js'

@customElement('virtual-app')
export class VirtualApp extends LitElement {
  static styles = [baseStyles, lightTokens, virtualStyles]

  @state() private activeMenu = '开始'
  @state() private activeSheet = '销售数据'
  @state() private perfTab: '性能概览' | '内存分析' | '渲染统计' = '性能概览'
  @state() private zoom = 100

  render() {
    return html`
      <div class="app">
        ${this.renderTopbar()}
        ${this.renderToolbar()}
        ${this.renderFormulaBar()}
        <div class="body">
          <div class="grid-area">${this.renderTable()}</div>
          ${this.renderPerfPanel()}
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
          <div class="search-box">${sxIcon('search', 14)}<input placeholder="搜索数据..." /></div>
          <button class="icon-btn" @click=${() => toast('帮助中心（F1）')}>${sxIcon('help', 17)}</button>
          <button class="icon-btn" @click=${() => toggleGlobalTheme()}>${sxIcon('sun', 17)}</button>
          <span class="avatar">张</span>
        </div>
      </div>
    `
  }

  private renderToolbar(): TemplateResult {
    const action = (icon: IconName, label: string, active = false) => html`
      <button class="tool-action ${active ? 'active' : ''}" @click=${() => toast(label)}>${sxIcon(icon, 15)}<span>${label}</span></button>
    `
    return html`
      <div class="toolbar">
        <button class="tool-btn" @click=${() => toast('撤销')}>${sxIcon('undo', 16)}</button>
        <button class="tool-btn" @click=${() => toast('重做')}>${sxIcon('redo', 16)}</button>
        <button class="tool-btn" @click=${() => toast('更多选项')}>${sxIcon('chevronDown', 12)}</button>
        <button class="tool-select" @click=${() => toast('更多选项')}>100% <span class="caret">${sxIcon('chevronDown', 12)}</span></button>
        <button class="tool-btn" @click=${() => toast('网格视图')}>${sxIcon('gridView', 15)}</button>
        <button class="tool-btn" @click=${() => toast('更多选项')}>${sxIcon('chevronDown', 12)}</button>
        ${action('freeze', '冻结', true)}
        ${action('filter', '筛选')}
        ${action('sort', '排序')}
        ${action('group', '分组')}
        ${action('batch', '批量操作')}
        ${action('more', '更多')}
        <span class="mode-badge"><span class="dot"></span>大数据模式</span>
      </div>
    `
  }

  private renderFormulaBar(): TemplateResult {
    return html`
      <div class="formula-bar">
        <div class="cell-address">B2 <span class="caret">${sxIcon('chevronDown', 11)}</span></div>
        <div class="fx-box">fx</div>
        <input class="formula-input" value="上海分公司" aria-label="公式输入框" />
      </div>
    `
  }

  private renderTable(): TemplateResult {
    const heads = ['序号', '分公司', '客户名称', '产品类别', '销售数量', '销售金额', '订单日期']
    return html`
      <table class="grid-table">
        <colgroup><col style="width:28px" />${['52px','110px','230px','96px','92px','112px','110px'].map(w => html`<col style="width:${w}" />`)}</colgroup>
        <thead>
          <tr>
            <th></th>
            ${heads.map(h => html`
              <th><span class="head-inner">${h}<span class="filter-icon">${sxIcon('chevronDown', 11)}</span></span></th>
            `)}
          </tr>
        </thead>
        <tbody>
          ${bigDataRows.map((r, i) => this.renderRow(r, i))}
        </tbody>
      </table>
    `
  }

  private renderRow(row: BigDataRow, i: number): TemplateResult {
    const active = i === 0
    return html`
      <tr class="${active ? 'row-active' : ''}">
        <th class="row-h ${active ? 'hl' : ''}">${i + 1}</th>
        <td class="center">${row.no}</td>
        <td class="${active ? 'selected' : ''}">
          ${active ? html`<span class="edit-cell">${row.branch}<span class="caret">${sxIcon('chevronDown', 13)}</span></span>` : row.branch}
        </td>
        <td>${row.customer}</td>
        <td>${this.renderCategory(row.category)}</td>
        <td class="right">${row.qty.toLocaleString()}</td>
        <td class="right">${row.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        <td>${row.date}</td>
      </tr>
    `
  }

  private renderCategory(category: string): TemplateResult {
    const c = categoryColors[category] ?? { bg: '#eef0f5', fg: '#5b6472' }
    return html`<span class="cat-tag" style="background:${c.bg};color:${c.fg}">${category}</span>`
  }

  /** 性能监控面板 */
  private renderPerfPanel(): TemplateResult {
    const tabs = ['性能概览', '内存分析', '渲染统计'] as const
    return html`
      <aside class="perf-panel">
        <div class="perf-head">
          <span>性能监控</span>
          <button class="icon-btn" style="width:22px;height:22px" @click=${() => toast('关闭')}>${sxIcon('close', 14)}</button>
        </div>
        <div class="perf-tabs">
          ${tabs.map(t => html`
            <button class="perf-tab ${this.perfTab === t ? 'active' : ''}" @click=${() => { this.perfTab = t }}>${t}</button>
          `)}
        </div>
        ${this.perfTab === '性能概览' ? this.renderPerfOverview() : html`
          <div class="perf-body"><div class="status-item">${tabs.indexOf(this.perfTab) >= 0 ? '' : ''}${this.perfTab} · 演示占位</div></div>
        `}
      </aside>
    `
  }

  private renderPerfOverview(): TemplateResult {
    return html`
      <div class="perf-body">
        <div class="metrics">
          <div class="metric">
            <span class="micon green">${sxIcon('bolt', 18)}</span>
            <span class="mvalue">60 <span style="font-size:11px;font-weight:400">FPS</span></span>
            <span class="mlabel">当前帧率</span>
          </div>
          <div class="metric">
            <span class="micon purple">${sxIcon('clock', 18)}</span>
            <span class="mvalue">12.3 <span style="font-size:11px;font-weight:400">ms</span></span>
            <span class="mlabel">渲染耗时</span>
          </div>
        </div>

        <div>
          <div class="chart-title">
            <span>滚动性能</span>
            <span class="range">最近 30 秒 ${sxIcon('chevronDown', 10)}</span>
          </div>
          <div class="chart-box">${this.renderFpsChart()}</div>
        </div>

        <div class="status-list">
          ${perfStatuses.map(s => html`
            <div class="status-item">
              <span class="check">${sxIcon('checkboxChecked', 14)}</span>
              <span>${s}：</span><span class="ok">已启用</span>
            </div>
          `)}
        </div>

        <div class="tip-box">
          <span class="bulb">${sxIcon('bulb', 16)}</span>
          <span>
            <span class="tip-title">技术亮点 ${sxIcon('rocket', 13)}</span>
            <span class="tip-desc" style="display:block">支持百万级数据，依然流畅滚动。仅渲染可见区域，性能更优！</span>
          </span>
        </div>
      </div>
    `
  }

  /** 滚动性能折线图（整段 unsafeSVG 注入，避免 SVG 命名空间陷阱） */
  private renderFpsChart(): TemplateResult {
    const w = 228, h = 92, pad = 4
    const min = 0, max = 60
    const pts = fpsSeries.map((v, i) => {
      const x = pad + (i / (fpsSeries.length - 1)) * (w - pad * 2)
      const y = h - pad - ((v - min) / (max - min)) * (h - pad * 2)
      return { x, y }
    })
    const line = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
    const area = `${pad},${h - pad} ${line} ${w - pad},${h - pad}`
    const grid = [0, 30, 60].map(v => {
      const y = h - pad - (v / max) * (h - pad * 2)
      return `<line x1="18" y1="${y}" x2="${w - pad}" y2="${y}" stroke="var(--sx-grid-line)" stroke-width="1"></line><text x="2" y="${y + 3}" font-size="8" fill="var(--sx-text-hint)">${v}</text>`
    }).join('')
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" height="92" preserveAspectRatio="none">${grid}<polygon points="${area}" fill="var(--sx-brand-soft)" opacity="0.7"></polygon><polyline points="${line}" fill="none" stroke="var(--sx-brand)" stroke-width="1.5" vector-effect="non-scaling-stroke"></polyline></svg>`
    return html`${unsafeSVG(svg)}`
  }

  private renderSheetTabs(): TemplateResult {
    const tabs = ['销售数据', '库存数据', '客户信息']
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
        <span>共 1,248 条数据&nbsp; 已加载 1,248 条</span>
        <span class="status-stats">
          <span>平均值: 623.45</span><span>计数: 1,248</span><span>求和: 777,567.80</span>
        </span>
        <span class="status-right">
          <button class="tool-btn active" @click=${() => toast('网格视图')}>${sxIcon('gridView', 13)}</button>
          <button class="tool-btn" @click=${() => toast('卡片视图')}>${sxIcon('listView', 13)}</button>
          <span class="zoom">
            <input type="range" min="50" max="150" step="10" .value=${String(this.zoom)} @input=${(e: Event) => { this.zoom = Number((e.target as HTMLInputElement).value) }} />
            <span>${this.zoom}%</span>
          </span>
          <button class="tool-btn" @click=${() => toast('全屏')}>${sxIcon('fullscreen', 13)}</button>
        </span>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'virtual-app': VirtualApp
  }
}
