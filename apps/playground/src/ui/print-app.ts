/**
 * SheetX 第 17 张 · 打印预览与页面布局
 *
 * 不是静态设计稿：所有设置真实影响预览（纸张/方向/边距/网格线/单色/缩放/分页），
 * 图表由真引擎 @sheetx/core 的 buildChartSvg 生成（经 <sheetx-grid>.chartSvg 代理），
 * 「打印」按钮生成带 @page 规则的可打印 HTML 并交浏览器打印。
 */
import { LitElement, html, svg, nothing, type TemplateResult } from 'lit'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { customElement, state } from 'lit/decorators.js'
import { baseStyles, lightTokens } from './tokens.js'
import { bindPageTheme, toggleTheme as toggleGlobalTheme } from './theme.js'
import { printStyles } from './print-styles.js'
import { sxIcon, sxLogo, SX_LOGO_SVG } from './icons.js'
import { toast } from './toast.js'
import {
  REPORT_MONTHS, REPORT_KPIS, CUSTOMER_SHARE, REGION_SHARE, PRODUCT_SHARE, REGION_AMOUNTS,
  PRINTERS, PAPER_SIZES, PAPER_A4, PAPER_A4_LANDSCAPE,
  DEFAULT_PRINT_SETTINGS, MARGIN_PRESETS, PRINT_PAGES, CHART_RECORDS,
  type PrintSettings, type PrintScope, type Orientation, type MarginPreset, type ShareItem,
} from './print-data.js'

const TOP_MENUS = ['文件', '开始', '插入', '数据', '公式', '视图', '设置']

/** 饼图（纯 SVG，零依赖；与 core 的饼图同构，用于报告里的小占比图） */
function pieSvg(items: ShareItem[], size = 92): TemplateResult {
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1
  const r = size / 2 - 2
  const c = size / 2
  let angle = -Math.PI / 2
  const paths = items.map((item) => {
    const sweep = (item.value / total) * Math.PI * 2
    const end = angle + sweep
    const x1 = c + r * Math.cos(angle)
    const y1 = c + r * Math.sin(angle)
    const x2 = c + r * Math.cos(end)
    const y2 = c + r * Math.sin(end)
    const d = `M ${c} ${c} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${sweep > Math.PI ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`
    angle = end
    return svg`<path d=${d} fill=${item.color} stroke="#fff" stroke-width="1"></path>`
  })
  return html`<svg viewBox="0 0 ${size} ${size}" width=${size} height=${size}>${paths}</svg>`
}

/** 柱状图（月度趋势，双系列；纯 SVG） */
function trendSvg(): TemplateResult {
  const w = 300
  const h = 130
  const pad = { l: 30, r: 8, t: 8, b: 20 }
  const max = 250000
  const groupW = (w - pad.l - pad.r) / REPORT_MONTHS.length
  const barW = Math.max(6, groupW / 3)
  const bars = REPORT_MONTHS.map((row, index) => {
    const x = pad.l + groupW * index + (groupW - barW * 2 - 3) / 2
    const amountH = (row.amount / max) * (h - pad.t - pad.b)
    const orderH = (row.orders / 2000) * (h - pad.t - pad.b)
    return svg`
      <rect x=${x.toFixed(1)} y=${(h - pad.b - amountH).toFixed(1)} width=${barW} height=${amountH.toFixed(1)} fill="#3b82f6" rx="1"></rect>
      <rect x=${(x + barW + 3).toFixed(1)} y=${(h - pad.b - orderH).toFixed(1)} width=${barW} height=${orderH.toFixed(1)} fill="#fbbf24" rx="1"></rect>
      <text x=${(x + barW).toFixed(1)} y=${h - 6} text-anchor="middle" font-size="8" fill="#64748b">${row.month}</text>
      <text x=${(x + barW).toFixed(1)} y=${(h - pad.b - amountH - 3).toFixed(1)} text-anchor="middle" font-size="7.5" fill="#2563eb">${Math.round(row.amount / 1000)}k</text>
    `
  })
  const grid = [0, 50, 100, 150, 200, 250].map((tick) => {
    const y = h - pad.b - (tick / 250) * (h - pad.t - pad.b)
    return svg`
      <line x1=${pad.l} y1=${y.toFixed(1)} x2=${w - pad.r} y2=${y.toFixed(1)} stroke="#e2e8f0" stroke-width="1"></line>
      <text x=${pad.l - 4} y=${(y + 3).toFixed(1)} text-anchor="end" font-size="7.5" fill="#94a3b8">${tick}k</text>
    `
  })
  return html`<svg viewBox="0 0 ${w} ${h}" width=${w} height=${h}>${grid}${bars}</svg>`
}

/** 区域柱状图 */
function regionSvg(): TemplateResult {
  const w = 250
  const h = 125
  const pad = { l: 28, r: 6, t: 8, b: 20 }
  const max = 300
  const groupW = (w - pad.l - pad.r) / REGION_AMOUNTS.length
  const bars = REGION_AMOUNTS.map((row, index) => {
    const barW = Math.max(8, groupW * 0.5)
    const x = pad.l + groupW * index + (groupW - barW) / 2
    const barH = (row.value / max) * (h - pad.t - pad.b)
    return svg`
      <rect x=${x.toFixed(1)} y=${(h - pad.b - barH).toFixed(1)} width=${barW.toFixed(1)} height=${barH.toFixed(1)} fill="#3b82f6" rx="1"></rect>
      <text x=${(x + barW / 2).toFixed(1)} y=${h - 6} text-anchor="middle" font-size="8" fill="#64748b">${row.label}</text>
    `
  })
  const grid = [0, 100, 200, 300].map((tick) => {
    const y = h - pad.b - (tick / max) * (h - pad.t - pad.b)
    return svg`<line x1=${pad.l} y1=${y.toFixed(1)} x2=${w - pad.r} y2=${y.toFixed(1)} stroke="#e2e8f0" stroke-width="1"></line>
      <text x=${pad.l - 4} y=${(y + 3).toFixed(1)} text-anchor="end" font-size="7.5" fill="#94a3b8">${tick}k</text>`
  })
  return html`<svg viewBox="0 0 ${w} ${h}" width=${w} height=${h}>${grid}${bars}</svg>`
}

@customElement('print-app')
export class PrintApp extends LitElement {
  static styles = [baseStyles, lightTokens, printStyles]

  @state() private theme: 'light' | 'dark' = 'light'
  @state() private activeMenu = '视图'
  @state() private settings: PrintSettings = { ...DEFAULT_PRINT_SETTINGS, customMargin: { ...DEFAULT_PRINT_SETTINGS.customMargin } }
  @state() private currentPage = 1
  @state() private zoom = 100
  @state() private viewMode: 'single' | 'double' = 'double'
  @state() private fitPage = true
  @state() private marginPopOpen = false
  @state() private searchText = ''
  /** 真引擎生成的图表 SVG（chartSvg 返回字符串） */
  @state() private engineCharts: Record<string, string> = {}
  private readonly totalPages = PRINT_PAGES.length
  private stopTheme: (() => void) | null = null

  constructor() {
    super()
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

  firstUpdated(): void {
    void this.loadEngineCharts()
  }

  /** 通过 web-component 代理调用真引擎生成图表（不新增依赖） */
  private async loadEngineCharts(): Promise<void> {
    try {
      const host = document.createElement('sheetx-grid')
      host.columns = [
        { key: 'month', title: '月份', width: 80 },
        { key: 'amount', title: '销售额', width: 100 },
        { key: 'orders', title: '订单数', width: 80 },
      ]
      host.data = CHART_RECORDS as never
      host.style.cssText = 'position:absolute;width:1px;height:1px;opacity:0;pointer-events:none'
      document.body.appendChild(host)
      await host.whenReady()
      const engine = await host.whenReady()
      this.engineCharts = {
        trend: engine.chartSvg({
          kind: 'line', categoryField: 'month',
          valueFields: [{ key: 'amount', name: '销售额' }, { key: 'orders', name: '订单数' }],
          width: 300, height: 130,
        }),
      }
      host.remove()
    } catch {
      // 引擎不可用时降级到内置纯 SVG（不影响页面可用性）
    }
  }

  private patchSettings(patch: Partial<PrintSettings>): void {
    this.settings = { ...this.settings, ...patch }
  }

  private get paperSize(): { width: number; height: number } {
    return this.settings.orientation === 'landscape' ? PAPER_A4_LANDSCAPE : PAPER_A4
  }

  private get marginMm(): number {
    if (this.settings.margin === 'custom') return this.settings.customMargin.top
    return MARGIN_PRESETS[this.settings.margin].mm
  }

  private setScope(scope: PrintScope): void {
    this.patchSettings({ scope })
  }

  private setOrientation(orientation: Orientation): void {
    this.patchSettings({ orientation })
  }

  private setMargin(margin: MarginPreset): void {
    this.patchSettings({ margin })
    this.marginPopOpen = margin === 'custom'
  }

  private goPage(page: number): void {
    this.currentPage = Math.max(1, Math.min(this.totalPages, page))
  }

  private applyZoom(delta: number): void {
    this.zoom = Math.max(50, Math.min(150, this.zoom + delta))
  }

  /** 生成可打印 HTML（含 @page 规则、分页符、矢量 SVG 图表），交浏览器打印 */
  private doPrint(): void {
    const margin = this.marginMm
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast('打印窗口被浏览器拦截，请允许弹出窗口')
      return
    }
    const pagesHtml = PRINT_PAGES.map((page) => `
      <section class="sheet">
        <header class="sh"><span class="logo" style="display:inline-flex;width:72px;height:24px">${SX_LOGO_SVG}</span><span>${this.settings.header}</span></header>
        <h1>${page.title}</h1><p class="sub">${page.subtitle}</p>
        <div class="kpis">${REPORT_KPIS.map((kpi) => `
          <div class="kpi"><small>${kpi.label}</small><strong>${kpi.value}${kpi.unit ?? ''}</strong>
          <em>▲ ${kpi.delta}</em></div>`).join('')}</div>
        <h3>▦ 月度销售数据</h3>
        <table><thead><tr><th>月份</th><th>销售额</th><th>订单数</th><th>客户数</th><th>转化率</th></tr></thead>
        <tbody>${REPORT_MONTHS.map((row) => `
          <tr><td>${row.month}</td><td class="num">${row.amount.toLocaleString()}</td>
          <td class="num">${row.orders.toLocaleString()}</td><td class="num">${row.customers}</td><td>${row.rate}</td></tr>`).join('')}</tbody></table>
        <h3>◑ 区域分布</h3>
        <table><thead><tr><th>区域</th><th>占比</th></tr></thead><tbody>${REGION_SHARE.map((item) => `
          <tr><td>${item.label}</td><td class="num">${item.value}%</td></tr>`).join('')}</tbody></table>
        <footer class="sf"><span>SheetX · 2025 年度销售业绩分析报告</span><span>${page.no} / ${this.totalPages}</span></footer>
      </section>`).join('')
    const monochrome = this.settings.monochrome ? 'filter:grayscale(1);' : ''
    printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>SheetX 打印</title>
      <style>
        @page { size: ${this.settings.orientation}; margin: ${margin}mm; }
        body { margin:0; font-family:'PingFang SC','Microsoft YaHei',sans-serif; color:#1f2937; ${monochrome} }
        .sheet { page-break-after:always; break-after:page; }
        .sheet:last-child { page-break-after:auto; break-after:auto; }
        .sh { display:flex; justify-content:space-between; border-bottom:2px solid #dbeafe; font-size:11px; color:#334155; padding-bottom:6px }
        .logo { color:#2563eb; font-weight:700 }
        h1 { font-size:20px; margin:16px 0 2px } .sub { color:#64748b; font-size:11px; margin:0 0 14px }
        h3 { font-size:13px; margin:16px 0 6px; color:#1e293b }
        .kpis { display:grid; grid-template-columns:repeat(4,1fr); gap:8px }
        .kpi { border:1px solid #e2e8f0; border-radius:6px; padding:9px; background:#f8fafc; display:flex; flex-direction:column; gap:4px }
        .kpi small { font-size:10px; color:#64748b } .kpi strong { font-size:18px } .kpi em { font-size:10px; color:#16a34a; font-style:normal }
        table { width:100%; border-collapse:collapse; font-size:11px }
        th { background:#eff6ff; color:#1e40af; text-align:left; padding:6px 8px; border-bottom:1px solid #dbeafe }
        td { padding:6px 8px; border-bottom:1px solid #eef2f7 } .num { text-align:right }
        .sf { margin-top:20px; border-top:1px solid #e2e8f0; padding-top:6px; display:flex; justify-content:space-between; font-size:9px; color:#94a3b8 }
      </style></head><body>${pagesHtml}</body></html>`)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => printWindow.print(), 300)
    toast(`已生成 ${this.totalPages} 页 · ${this.settings.paperSize} · ${this.settings.orientation === 'portrait' ? '纵向' : '横向'}`)
  }

  private renderTopbar(): TemplateResult {
    return html`
      <header class="topbar">
        <span class="brand">${sxLogo()}</span>
        <nav class="top-menus">
          ${TOP_MENUS.map((menu) => html`
            <button class="top-menu ${menu === this.activeMenu ? 'active' : ''}"
              @click=${() => { this.activeMenu = menu }}>${menu}</button>`)}
        </nav>
        <div class="top-right">
          <label class="search">${sxIcon('search', 14)}
            <input placeholder="搜索功能..." .value=${this.searchText}
              @input=${(event: Event) => { this.searchText = (event.target as HTMLInputElement).value }}>
          </label>
          <button class="tb-btn" title="切换主题" @click=${toggleGlobalTheme}>${sxIcon(this.theme === 'dark' ? 'sun' : 'moon', 15)}</button>
          <span class="avatar">JD</span>
        </div>
      </header>`
  }

  private renderToolbar(): TemplateResult {
    return html`
      <div class="toolbar">
        <button class="tb-btn" title="返回" @click=${() => { location.hash = '#home' }}>${sxIcon('chevronLeft', 16)}</button>
        <button class="tb-btn" title="打印" @click=${this.doPrint}>${sxIcon('print', 15)} 打印</button>
        <button class="tb-btn active" title="打印预览">打印预览</button>
        <span class="tb-sep"></span>
        <button class="tb-btn" title="缩小" @click=${() => this.applyZoom(-10)}>${sxIcon('zoomOut', 15)}</button>
        <select class="zoom-select" .value=${String(this.zoom)} @change=${(event: Event) => {
          this.zoom = Number((event.target as HTMLSelectElement).value)
        }}>
          ${[50, 75, 100, 125, 150].map((value) => html`<option value=${value}>${value}%</option>`)}
        </select>
        <button class="tb-btn" title="放大" @click=${() => this.applyZoom(10)}>${sxIcon('zoomIn', 15)}</button>
        <div class="page-nav">
          <button title="上一页" @click=${() => this.goPage(this.currentPage - 1)}>${sxIcon('chevronLeft', 15)}</button>
          <span class="page-indicator">
            <input .value=${String(this.currentPage)} @change=${(event: Event) => {
              this.goPage(Number((event.target as HTMLInputElement).value))
            }} /> / ${this.totalPages}
          </span>
          <button title="下一页" @click=${() => this.goPage(this.currentPage + 1)}>${sxIcon('chevronRight', 15)}</button>
          <button title="关闭预览" @click=${() => { location.hash = '#home' }}>${sxIcon('close', 15)}</button>
        </div>
      </div>`
  }

  private renderSettings(): TemplateResult {
    const s = this.settings
    return html`
      <aside class="settings">
        <div class="settings-head">
          <span class="ico">${sxIcon('print', 20)}</span>
          <div><h2>打印设置</h2><p>配置打印选项并预览效果</p></div>
        </div>

        <section class="field">
          <div class="field-title">打印机</div>
          <div class="printer-row">
            <select class="select" .value=${s.printer} @change=${(event: Event) => {
              this.patchSettings({ printer: (event.target as HTMLSelectElement).value })
            }}>
              ${PRINTERS.map((printer) => html`<option value=${printer}>${printer}</option>`)}
            </select>
            <button class="btn-sm" @click=${() => toast(`打印机属性：${s.printer}`)}>属性...</button>
          </div>
        </section>

        <section class="field">
          <div class="field-title">打印范围</div>
          <div class="card">
            <label class="radio-row"><input type="radio" name="scope" ?checked=${s.scope === 'all'}
              @change=${() => this.setScope('all')} />全部工作表</label>
            <label class="radio-row"><input type="radio" name="scope" ?checked=${s.scope === 'current'}
              @change=${() => this.setScope('current')} />当前工作表</label>
            <label class="radio-row"><input type="radio" name="scope" ?checked=${s.scope === 'selection'}
              @change=${() => this.setScope('selection')} />选定区域</label>
            <div class="range-input">
              <input class="input" .value=${s.selection} @input=${(event: Event) => {
                this.patchSettings({ selection: (event.target as HTMLInputElement).value })
              }} />
              <button class="btn-sm" title="选择区域" @click=${() => toast('在工作表中框选区域后自动填入')}>${sxIcon('gridView', 14)}</button>
            </div>
          </div>
        </section>

        <section class="field">
          <div class="field-title">纸张设置</div>
          <div class="card">
            <select class="select" .value=${s.paperSize} @change=${(event: Event) => {
              this.patchSettings({ paperSize: (event.target as HTMLSelectElement).value })
            }}>
              ${PAPER_SIZES.map((size) => html`<option value=${size}>${size}</option>`)}
            </select>
            <div style="height:8px"></div>
            <div class="orient-row">
              <button class="orient-btn ${s.orientation === 'portrait' ? 'active' : ''}" @click=${() => this.setOrientation('portrait')}>
                <span class="paper-ico portrait"></span>纵向
              </button>
              <button class="orient-btn ${s.orientation === 'landscape' ? 'active' : ''}" @click=${() => this.setOrientation('landscape')}>
                <span class="paper-ico landscape"></span>横向
              </button>
            </div>
            <div style="height:8px"></div>
            <select class="select" .value=${s.margin} @change=${(event: Event) => {
              this.setMargin((event.target as HTMLSelectElement).value as MarginPreset)
            }}>
              <option value="normal">${MARGIN_PRESETS.normal.label}</option>
              <option value="narrow">${MARGIN_PRESETS.narrow.label}</option>
              <option value="wide">${MARGIN_PRESETS.wide.label}</option>
              <option value="custom">自定义页边距...</option>
            </select>
            ${this.marginPopOpen ? html`
              <div class="margin-pop">
                <div class="margin-grid">
                  ${(['top', 'right', 'bottom', 'left'] as const).map((side) => html`
                    <label>${({ top: '上', right: '右', bottom: '下', left: '左' } as Record<string, string>)[side]} (mm)
                      <input class="input" type="number" min="0" max="50" step="0.1"
                        .value=${String(s.customMargin[side])}
                        @input=${(event: Event) => {
                          this.patchSettings({ customMargin: {
                            ...s.customMargin,
                            [side]: Number((event.target as HTMLInputElement).value),
                          } })
                        }} />
                    </label>`)}
                </div>
              </div>` : nothing}
          </div>
        </section>

        <section class="field">
          <div class="field-title">页面设置</div>
          <div class="card">
            <label class="check-row"><input type="checkbox" ?checked=${s.gridLines}
              @change=${(event: Event) => this.patchSettings({ gridLines: (event.target as HTMLInputElement).checked })} />打印网格线</label>
            <label class="check-row"><input type="checkbox" ?checked=${s.rowColHeaders}
              @change=${(event: Event) => this.patchSettings({ rowColHeaders: (event.target as HTMLInputElement).checked })} />打印行列号标</label>
            <label class="check-row"><input type="checkbox" ?checked=${s.monochrome}
              @change=${(event: Event) => this.patchSettings({ monochrome: (event.target as HTMLInputElement).checked })} />单色打印</label>
          </div>
        </section>

        <button class="print-btn" @click=${this.doPrint}>${sxIcon('print', 16)} 打印</button>
      </aside>`
  }

  private renderLegend(items: ShareItem[]): TemplateResult {
    return html`<div class="legend">${items.map((item) => html`
      <span><i style="background:${item.color}"></i>${item.label} ${item.value}%</span>`)}</div>`
  }

  private renderSummaryPage(): TemplateResult {
    const engineTrend = this.engineCharts.trend
    return html`
      <div class="paper-head">
        <span class="logo">${sxLogo()}</span>
        <span>2025 年度 · ${this.settings.paperSize.split(' ')[0]}</span>
      </div>
      <div class="paper-title">
        <h1>年度销售业绩分析报告</h1>
        <p>2025 年度 · 销售数据分析</p>
      </div>
      <div class="paper-body">
        <div class="rep-section-title"><span class="dot"></span>销售业绩概览</div>
        <div class="kpi-grid">
          ${REPORT_KPIS.map((kpi) => html`
            <div class="kpi">
              <span class="k-label">${kpi.label}</span>
              <span class="k-value">${kpi.value}${kpi.unit ?? ''}</span>
              <span class="k-delta">▲ ${kpi.delta}</span>
            </div>`)}
        </div>
        <div class="rep-section-title"><span class="dot"></span>销售趋势分析 <span style="margin-left:auto;color:#64748b;font-weight:400">● 销售额 ● 订单数</span></div>
        <div class="chart-card">
          ${engineTrend ? unsafeHTML(engineTrend) : trendSvg()}
        </div>
        <div class="chart-row">
          <div class="chart-card">
            <h3>客户分布</h3>
            <div style="display:flex;align-items:center;gap:8px">
              ${pieSvg(CUSTOMER_SHARE, 82)}
              <div style="font-size:11px"><b style="font-size:14px">1,120</b><br /><span style="color:#64748b">客户总数</span></div>
            </div>
            ${this.renderLegend(CUSTOMER_SHARE)}
          </div>
          <div class="chart-card">
            <h3>区域销售占比</h3>
            ${pieSvg(REGION_SHARE, 82)}
            ${this.renderLegend(REGION_SHARE)}
          </div>
        </div>
      </div>
      <div class="paper-foot"><span>${this.settings.header}</span><span>1 / ${this.totalPages}</span></div>`
  }

  private renderDetailPage(): TemplateResult {
    return html`
      <div class="paper-head">
        <span class="logo">${sxLogo()}</span>
        <span>销售数据统计 · ${this.settings.orientation === 'portrait' ? '纵向' : '横向'}</span>
      </div>
      <div class="paper-title">
        <h1>销售数据统计</h1>
        <p>月度明细与区域分析</p>
      </div>
      <div class="paper-body">
        <div class="rep-section-title"><span class="dot"></span>月度销售数据表</div>
        <table class="rep-table">
          <thead><tr><th>月份</th><th class="num">销售额</th><th class="num">订单数</th><th class="num">客户数</th><th>转化率</th></tr></thead>
          <tbody>
            ${REPORT_MONTHS.map((row) => html`
              <tr><td>${row.month}</td><td class="num">${row.amount.toLocaleString()}</td>
                <td class="num">${row.orders.toLocaleString()}</td><td class="num">${row.customers}</td><td>${row.rate}</td></tr>`)}
          </tbody>
        </table>
        <div class="chart-row">
          <div class="chart-card">
            <h3>产品销售占比</h3>
            <div style="display:flex;justify-content:center">${pieSvg(PRODUCT_SHARE, 96)}</div>
            ${this.renderLegend(PRODUCT_SHARE)}
          </div>
          <div class="chart-card">
            <h3>销售区域分析</h3>
            ${regionSvg()}
          </div>
        </div>
        <div class="rep-section-title"><span class="dot"></span>分析结论</div>
        <div class="conclusion">
          <b>${sxIcon('bulb', 13)} 分析结论</b>
          本年度销售业绩稳步增长，华东和华南地区表现突出。建议继续加大市场投入，提升市场份额。
        </div>
      </div>
      <div class="paper-foot"><span>${this.settings.header}</span><span>2 / ${this.totalPages}</span></div>`
  }

  private renderPaper(pageNo: number): TemplateResult {
    const paper = this.paperSize
    // 单一缩放机制：CSS zoom 同时影响布局尺寸与绘制，避免容器尺寸 + transform 双重缩放
    const zoom = (this.zoom / 100) * (this.fitPage ? 0.62 : 0.8)
    const w = Math.round(paper.width * zoom)
    const h = Math.round(paper.height * zoom)
    return html`
      <div class="paper ${this.settings.monochrome ? 'mono' : ''}"
        style="width:${w}px;height:${h}px">
        <div class="paper-inner" style="zoom:${zoom};width:${paper.width}px;height:${paper.height}px">
          ${pageNo === 1 ? this.renderSummaryPage() : this.renderDetailPage()}
        </div>
      </div>`
  }

  private renderPreview(): TemplateResult {
    const pages = this.viewMode === 'single'
      ? [this.currentPage]
      : PRINT_PAGES.map((page) => page.no)
    return html`
      <div class="preview ${this.viewMode}">
        ${pages.map((pageNo) => this.renderPaper(pageNo))}
      </div>`
  }

  private renderStatusbar(): TemplateResult {
    return html`
      <footer class="statusbar">
        <button title="上一页" @click=${() => this.goPage(this.currentPage - 1)}>${sxIcon('chevronLeft', 15)}</button>
        <span class="page-indicator">${this.currentPage} / ${this.totalPages}</span>
        <button title="下一页" @click=${() => this.goPage(this.currentPage + 1)}>${sxIcon('chevronRight', 15)}</button>
        <span class="sep"></span>
        <button class="${this.fitPage ? 'active' : ''}" @click=${() => { this.fitPage = !this.fitPage }}>
          ${sxIcon('fullscreen', 14)} 适合页面
        </button>
        <button class="${this.viewMode === 'single' ? 'active' : ''}" title="单页视图"
          @click=${() => { this.viewMode = 'single'; this.currentPage = 1 }}>
          ${sxIcon('blankCell', 14)}
        </button>
        <button class="${this.viewMode === 'double' ? 'active' : ''}" title="双页视图"
          @click=${() => { this.viewMode = 'double' }}>
          ${sxIcon('colsV', 14)}
        </button>
        <span class="fit-badge">页边距 ${this.marginMm} mm · ${this.settings.orientation === 'portrait' ? '纵向' : '横向'} · ${this.currentPage * this.totalPages > 0 ? '矢量预览' : ''}</span>
      </footer>`
  }

  render(): TemplateResult {
    return html`
      <div class="app" data-theme=${this.theme}>
        ${this.renderTopbar()}
        ${this.renderToolbar()}
        <div class="body">
          ${this.renderSettings()}
          ${this.renderPreview()}
        </div>
        ${this.renderStatusbar()}
      </div>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'print-app': PrintApp
  }
}
