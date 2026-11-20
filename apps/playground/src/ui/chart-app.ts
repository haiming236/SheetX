/**
 * SheetX 第 12 张 · 图表与数据可视化
 *
 * 展示：左侧销售数据表 + 悬浮图表区（销售额趋势组合图、客户分布环形图、
 * 销售额占比饼图、季度对比折线图）+ 右侧图表设置面板（类型/数据/样式/其他）。
 * 图表均为原生 SVG 手绘（零依赖）。切换图表类型/样式预设/数据系列/
 * 标题/网格线/数据标签/坐标轴等设置会真实重渲染主图表。
 */
import { LitElement, html, svg, nothing, type TemplateResult } from 'lit'
import { customElement } from 'lit/decorators/custom-element.js'
import { state } from 'lit/decorators/state.js'
import { sxIcon, sxLogo } from './icons.js'
import { lightTokens, baseStyles } from './tokens.js'
import { chartStyles } from './chart-styles.js'
import {
  TOP_MENUS, COL_LETTERS, ROW_COUNT, TABLE_HEADERS, TABLE_ROWS,
  MONTHS, SALES, ORDERS,
  CUSTOMER_SPLIT, CUSTOMER_TOTAL, REGION_SPLIT, QUARTERS, Y2024, Y2025,
  CHART_TYPES, STYLE_PRESETS, SERIES_OPTIONS, PANEL_TABS, SHEET_TABS,
  type ChartTypeKey,
} from './chart-data.js'
import { toast } from './toast.js'

const fmtInt = (n: number): string => n.toLocaleString('en-US')

/** 极角 → 坐标（deg: 0 = 12 点钟方向，顺时针） */
function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const rad = ((deg - 90) * Math.PI) / 180
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]
}

function pieSlice(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const [x0, y0] = polar(cx, cy, r, a0)
  const [x1, y1] = polar(cx, cy, r, a1)
  const la = a1 - a0 > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${la} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`
}

function donutSeg(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number): string {
  const [x0, y0] = polar(cx, cy, r0, a0)
  const [x1, y1] = polar(cx, cy, r0, a1)
  const [x2, y2] = polar(cx, cy, r1, a1)
  const [x3, y3] = polar(cx, cy, r1, a0)
  const la = a1 - a0 > 180 ? 1 : 0
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r0} ${r0} 0 ${la} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`
    + ` L ${x2.toFixed(2)} ${y2.toFixed(2)} A ${r1} ${r1} 0 ${la} 0 ${x3.toFixed(2)} ${y3.toFixed(2)} Z`
}

/* 主图表几何（viewBox 402×172） */
const HW = 402, HH = 172, HL = 36, HR = 42, HT = 8, HB = 22
const PW = HW - HL - HR
const PH = HH - HT - HB

type Palette = { key: string; label: string; primary: string; secondary: string }

@customElement('chart-app')
export class ChartApp extends LitElement {
  static styles = [baseStyles, lightTokens, chartStyles]

  @state() private heroType: ChartTypeKey = 'combo'
  @state() private presetKey = 'classic'
  @state() private seriesName = '销售额'
  @state() private seriesMenuOpen = false
  @state() private chartTitle = '销售额趋势图'
  @state() private showTitle = true
  @state() private panelOpen = true
  @state() private panelTab = '类型'
  @state() private activeSheetTab = '销售分析'
  @state() private gridlinesOn = true
  @state() private dataLabelsOn = true
  @state() private axesOn = true
  @state() private heroTransparent = false
  @state() private barRounded = true
  @state() private toast = ''

  private toastTimer: ReturnType<typeof setTimeout> | null = null

  disconnectedCallback(): void {
    super.disconnectedCallback()
    if (this.toastTimer) clearTimeout(this.toastTimer)
  }

  private get palette(): Palette {
    return STYLE_PRESETS.find((p) => p.key === this.presetKey) ?? STYLE_PRESETS[0]
  }
  private get isSales(): boolean { return this.seriesName === '销售额' }
  private get seriesVals(): number[] { return this.isSales ? SALES : ORDERS }
  private get maxV(): number { return this.isSales ? 250000 : 2000 }
  private get vTicks(): number[] {
    return this.isSales ? [0, 50000, 100000, 150000, 200000, 250000] : [0, 500, 1000, 1500, 2000]
  }
  private fmtVal(v: number): string {
    return this.isSales ? (v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`) : fmtInt(v)
  }

  /* ---------------- 交互 ---------------- */

  private showToast(msg: string): void {
    this.toast = msg
    if (this.toastTimer) clearTimeout(this.toastTimer)
    this.toastTimer = setTimeout(() => { this.toast = '' }, 2200)
  }

  private setType = (key: ChartTypeKey): void => { this.heroType = key }
  private setPreset = (key: string): void => { this.presetKey = key }
  private setSeries = (name: string): void => {
    this.seriesName = name
    this.seriesMenuOpen = false
  }
  private onTitleInput = (e: Event): void => {
    this.chartTitle = (e.target as HTMLInputElement).value
  }

  /* ---------------- 主图表（响应设置） ---------------- */

  private heroXs(): number[] {
    const slot = PW / this.seriesVals.length
    return this.seriesVals.map((_, i) => HL + slot * i + slot / 2)
  }

  private heroFrame(yTicks: number[], yFn: (v: number) => number, xLabels: string[], xs: number[]): TemplateResult {
    const y0 = yFn(0)
    return svg`
      ${this.gridlinesOn
        ? yTicks.map((t) => svg`<line x1=${HL} y1=${yFn(t)} x2=${HL + PW} y2=${yFn(t)} stroke=${t === 0 ? '#cbd5e1' : '#e8edf3'} stroke-width="1" />`)
        : svg`<line x1=${HL} y1=${y0} x2=${HL + PW} y2=${y0} stroke="#cbd5e1" stroke-width="1" />`}
      ${this.axesOn
        ? svg`
          ${yTicks.map((t) => svg`<text x=${HL - 6} y=${yFn(t) + 3} text-anchor="end" font-size="9" fill="#94a3b8">${this.fmtVal(t)}</text>`)}
          ${xLabels.map((m, i) => svg`<text x=${xs[i]} y=${HT + PH + 14} text-anchor="middle" font-size="9.5" fill="#94a3b8">${m}</text>`)}
        `
        : nothing}
    `
  }

  private heroBar(): TemplateResult {
    const P = this.palette
    const vals = this.seriesVals
    const xs = this.heroXs()
    const bw = 24
    const yL = (v: number) => HT + PH * (1 - v / this.maxV)
    const y0 = yL(0)
    const rx = this.barRounded ? 3 : 0
    return svg`
      <svg viewBox="0 0 ${HW} ${HH}" width="${HW}" height="${HH}">
        ${this.heroFrame(this.vTicks, yL, MONTHS, xs)}
        ${vals.map((v, i) => svg`<rect x=${xs[i] - bw / 2} y=${yL(v)} width=${bw} height=${Math.max(0, y0 - yL(v))} rx=${rx} fill=${P.primary} />`)}
        ${this.dataLabelsOn
          ? vals.map((v, i) => svg`<text x=${xs[i]} y=${yL(v) - 5} text-anchor="middle" font-size="9" fill="#64748b">${this.fmtVal(v)}</text>`)
          : nothing}
      </svg>`
  }

  private heroLine(): TemplateResult {
    const P = this.palette
    const vals = this.seriesVals
    const xs = this.heroXs()
    const yL = (v: number) => HT + PH * (1 - v / this.maxV)
    const pts = vals.map((v, i) => `${xs[i].toFixed(1)},${yL(v).toFixed(1)}`).join(' ')
    return svg`
      <svg viewBox="0 0 ${HW} ${HH}" width="${HW}" height="${HH}">
        ${this.heroFrame(this.vTicks, yL, MONTHS, xs)}
        <polyline points=${pts} fill="none" stroke=${P.primary} stroke-width="2" />
        ${vals.map((v, i) => svg`<circle cx=${xs[i]} cy=${yL(v)} r="3.2" fill=${P.primary} />`)}
        ${this.dataLabelsOn
          ? vals.map((v, i) => svg`<text x=${xs[i]} y=${yL(v) - 7} text-anchor="middle" font-size="9" fill="#64748b">${this.fmtVal(v)}</text>`)
          : nothing}
      </svg>`
  }

  private heroArea(): TemplateResult {
    const P = this.palette
    const vals = this.seriesVals
    const xs = this.heroXs()
    const yL = (v: number) => HT + PH * (1 - v / this.maxV)
    const y0 = yL(0)
    const pts = vals.map((v, i) => `${xs[i].toFixed(1)},${yL(v).toFixed(1)}`).join(' ')
    const area = `M ${xs[0].toFixed(1)},${y0.toFixed(1)} L ${pts.replace(/ /g, ' L ')} L ${xs[xs.length - 1].toFixed(1)},${y0.toFixed(1)} Z`
    return svg`
      <svg viewBox="0 0 ${HW} ${HH}" width="${HW}" height="${HH}">
        ${this.heroFrame(this.vTicks, yL, MONTHS, xs)}
        <path d=${area} fill=${P.primary} opacity="0.18" />
        <polyline points=${pts} fill="none" stroke=${P.primary} stroke-width="2" />
        ${vals.map((v, i) => svg`<circle cx=${xs[i]} cy=${yL(v)} r="3" fill=${P.primary} />`)}
        ${this.dataLabelsOn
          ? vals.map((v, i) => svg`<text x=${xs[i]} y=${yL(v) - 7} text-anchor="middle" font-size="9" fill="#64748b">${this.fmtVal(v)}</text>`)
          : nothing}
      </svg>`
  }

  private heroCombo(): TemplateResult {
    const P = this.palette
    const vals = this.seriesVals
    const xs = this.heroXs()
    const bw = 24
    const yL = (v: number) => HT + PH * (1 - v / this.maxV)
    const y0 = yL(0)
    const rx = this.barRounded ? 3 : 0
    const lineVals = this.isSales ? ORDERS : SALES
    const maxR = this.isSales ? 2000 : 250000
    const rTicks = this.isSales ? [0, 500, 1000, 1500, 2000] : [0, 50000, 100000, 150000, 200000, 250000]
    const yR = (v: number) => HT + PH * (1 - v / maxR)
    const linePts = lineVals.map((v, i) => `${xs[i].toFixed(1)},${yR(v).toFixed(1)}`).join(' ')
    const fmtR = (v: number) => (this.isSales ? fmtInt(v) : this.fmtVal(v))
    return svg`
      <svg viewBox="0 0 ${HW} ${HH}" width="${HW}" height="${HH}">
        ${this.heroFrame(this.vTicks, yL, MONTHS, xs)}
        ${this.axesOn
          ? rTicks.map((t) => svg`<text x=${HL + PW + 6} y=${yR(t) + 3} font-size="9" fill="#94a3b8">${fmtR(t)}</text>`)
          : nothing}
        ${vals.map((v, i) => svg`<rect x=${xs[i] - bw / 2} y=${yL(v)} width=${bw} height=${Math.max(0, y0 - yL(v))} rx=${rx} fill=${P.primary} />`)}
        <polyline points=${linePts} fill="none" stroke=${P.secondary} stroke-width="2" />
        ${lineVals.map((v, i) => svg`<circle cx=${xs[i]} cy=${yR(v)} r="3.2" fill=${P.secondary} />`)}
        ${this.dataLabelsOn
          ? vals.map((v, i) => svg`<text x=${xs[i]} y=${yR(lineVals[i]) - 7} text-anchor="middle" font-size="9" fill="#64748b">${this.fmtVal(v)}</text>`)
          : nothing}
      </svg>`
  }

  private heroHBar(): TemplateResult {
    const P = this.palette
    const vals = this.seriesVals
    const L = 42, R = 12, T = 8, B = 22
    const pw = HW - L - R
    const ph = HH - T - B
    const slot = ph / vals.length
    const bh = 16
    const x = (v: number) => L + pw * (v / this.maxV)
    const yc = (i: number) => T + slot * i + slot / 2
    return svg`
      <svg viewBox="0 0 ${HW} ${HH}" width="${HW}" height="${HH}">
        ${this.gridlinesOn
          ? this.vTicks.map((t) => svg`<line x1=${x(t)} y1=${T} x2=${x(t)} y2=${T + ph} stroke=${t === 0 ? '#cbd5e1' : '#e8edf3'} stroke-width="1" />`)
          : svg`<line x1=${L} y1=${T} x2=${L} y2=${T + ph} stroke="#cbd5e1" stroke-width="1" />`}
        ${this.axesOn
          ? svg`
            ${this.vTicks.map((t) => svg`<text x=${x(t)} y=${HH - 7} text-anchor="middle" font-size="9" fill="#94a3b8">${this.fmtVal(t)}</text>`)}
            ${MONTHS.map((m, i) => svg`<text x=${L - 6} y=${yc(i) + 3} text-anchor="end" font-size="9.5" fill="#94a3b8">${m}</text>`)}
          `
          : nothing}
        ${vals.map((v, i) => svg`<rect x=${L} y=${yc(i) - bh / 2} width=${Math.max(0, x(v) - L)} height=${bh} rx=${this.barRounded ? 3 : 0} fill=${P.primary} />`)}
        ${this.dataLabelsOn
          ? vals.map((v, i) => svg`<text x=${x(v) + 5} y=${yc(i) + 3} font-size="9" fill="#64748b">${this.fmtVal(v)}</text>`)
          : nothing}
      </svg>`
  }

  private heroPie(): TemplateResult {
    const P = this.palette
    const vals = this.seriesVals
    const total = vals.reduce((a, b) => a + b, 0)
    const colors = [P.primary, P.secondary, '#38bdf8', '#94a3b8', '#e2e8f0']
    let cum = 0
    const slices = vals.map((v, i) => {
      const a0 = cum
      const a1 = cum + (v / total) * 360
      cum = a1
      return { d: pieSlice(75, 75, 64, a0, a1), pct: (v / total) * 100, mid: (a0 + a1) / 2, color: colors[i % colors.length] }
    })
    return html`
      <div class="cc-body" style="justify-content:center; margin-top:6px">
        <svg viewBox="0 0 150 150" width="150" height="150">
          ${slices.map((s) => svg`<path d=${s.d} fill=${s.color} />`)}
          ${this.dataLabelsOn
            ? slices.filter((s) => s.pct >= 8).map((s) => {
                const [tx, ty] = polar(75, 75, 38, s.mid)
                return svg`<text x=${tx.toFixed(1)} y=${ty.toFixed(1)} text-anchor="middle" font-size="10" font-weight="600" fill="#fff">${s.pct.toFixed(1)}%</text>`
              })
            : nothing}
        </svg>
        <div class="v-legend">
          ${vals.map((v, i) => html`
            <div class="li">
              <span class="dot" style="background:${colors[i % colors.length]}"></span>
              ${MONTHS[i]}<span class="pct">${((v / total) * 100).toFixed(1)}%</span>
            </div>`)}
        </div>
      </div>`
  }

  private renderHeroChart(): TemplateResult {
    switch (this.heroType) {
      case 'line': return this.heroLine()
      case 'pie': return this.heroPie()
      case 'hbar': return this.heroHBar()
      case 'area': return this.heroArea()
      case 'combo': return this.heroCombo()
      default: return this.heroBar()
    }
  }

  private renderHeroLegend(): TemplateResult {
    if (this.heroType === 'pie') return html``
    const P = this.palette
    const items: { label: string; color: string; line: boolean }[] = []
    if (this.heroType === 'combo') {
      items.push({ label: this.seriesName, color: P.primary, line: false })
      items.push({ label: this.isSales ? '订单数' : '销售额', color: P.secondary, line: true })
    } else {
      items.push({ label: this.seriesName, color: P.primary, line: this.heroType === 'line' })
    }
    return html`
      <div class="legend">
        ${items.map((it) => html`
          <span class="lg">
            ${it.line
              ? svg`<svg class="ln" width="20" height="10" viewBox="0 0 20 10"><line x1="1" y1="5" x2="15" y2="5" stroke=${it.color} stroke-width="2"/><circle cx="15" cy="5" r="3" fill=${it.color}/></svg>`
              : html`<span class="sq" style="background:${it.color}"></span>`}
            ${it.label}
          </span>`)}
      </div>`
  }

  /* ---------------- 静态小图表 ---------------- */

  private renderDonutCard(): TemplateResult {
    let cum = 0
    const segs = CUSTOMER_SPLIT.map((s) => {
      const a0 = cum + 2
      cum += s.pct * 3.6
      const a1 = cum - 2
      return { d: donutSeg(66, 66, 52, 33, a0, a1), color: s.color }
    })
    return html`
      <div class="chart-card" style="width:300px;height:222px">
        <div class="cc-title"><span class="ic">${sxIcon('chartPie', 15)}</span>客户分布</div>
        <div class="cc-body" style="margin-top:14px;justify-content:center">
          <div class="donut-wrap">
            <svg viewBox="0 0 132 132" width="132" height="132">
              ${segs.map((s) => svg`<path d=${s.d} fill=${s.color} />`)}
            </svg>
            <div class="donut-center"><b>${CUSTOMER_TOTAL}</b><span>客户总数</span></div>
          </div>
          <div class="v-legend">
            ${CUSTOMER_SPLIT.map((s) => html`
              <div class="li"><span class="dot" style="background:${s.color}"></span>${s.name}<span class="pct">${s.pct}%</span></div>`)}
          </div>
        </div>
      </div>`
  }

  private renderPieCard(): TemplateResult {
    let cum = 0
    const slices = REGION_SPLIT.map((s) => {
      const a0 = cum
      cum += s.pct * 3.6
      const a1 = cum
      const [tx, ty] = polar(59, 59, 33, (a0 + a1) / 2)
      return { d: pieSlice(59, 59, 54, a0, a1), color: s.color, pct: s.pct, tx, ty }
    })
    return html`
      <div class="chart-card" style="width:240px;height:222px">
        <div class="cc-title"><span class="ic">${sxIcon('chartPie', 15)}</span>销售额占比</div>
        <div class="cc-body" style="margin-top:16px;justify-content:center">
          <svg viewBox="0 0 118 118" width="118" height="118">
            ${slices.map((s) => svg`<path d=${s.d} fill=${s.color} />`)}
            ${slices.map((s) => svg`<text x=${s.tx.toFixed(1)} y=${(s.ty + 3.5).toFixed(1)} text-anchor="middle" font-size="10" font-weight="600" fill="#fff">${s.pct}%</text>`)}
          </svg>
          <div class="v-legend">
            ${REGION_SPLIT.map((s) => html`
              <div class="li"><span class="dot" style="background:${s.color}"></span>${s.name}</div>`)}
          </div>
        </div>
      </div>`
  }

  private renderLineCard(): TemplateResult {
    const L = 34, R = 8, T = 8, B = 20
    const w = 236, h = 150
    const pw = w - L - R
    const ph = h - T - B
    const maxY = 300000
    const y = (v: number) => T + ph * (1 - v / maxY)
    const cx = (i: number) => L + (pw / QUARTERS.length) * i + pw / QUARTERS.length / 2
    const line = (vals: number[]) => vals.map((v, i) => `${cx(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
    const ticks = [0, 100000, 200000, 300000]
    return html`
      <div class="chart-card" style="width:264px;height:222px">
        <div class="cc-title"><span class="ic">${sxIcon('chartLine', 15)}</span>季度对比</div>
        <div class="legend" style="justify-content:flex-start;gap:12px;margin:2px 0 0 4px">
          <span class="lg"><span class="dot" style="width:8px;height:8px;border-radius:50%;background:#3b82f6"></span>2024年</span>
          <span class="lg"><span class="dot" style="width:8px;height:8px;border-radius:50%;background:#a855f7"></span>2025年</span>
        </div>
        <svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="margin-top:2px">
          ${ticks.map((t) => svg`<line x1=${L} y1=${y(t)} x2=${L + pw} y2=${y(t)} stroke=${t === 0 ? '#cbd5e1' : '#e8edf3'} stroke-width="1" />`)}
          ${ticks.map((t) => svg`<text x=${L - 5} y=${y(t) + 3} text-anchor="end" font-size="9" fill="#94a3b8">${t === 0 ? '0' : `${t / 1000}k`}</text>`)}
          ${QUARTERS.map((q, i) => svg`<text x=${cx(i)} y=${h - 5} text-anchor="middle" font-size="9" fill="#94a3b8">${q}</text>`)}
          <polyline points=${line(Y2024)} fill="none" stroke="#3b82f6" stroke-width="2" />
          ${Y2024.map((v, i) => svg`<circle cx=${cx(i)} cy=${y(v)} r="2.8" fill="#3b82f6" stroke="#fff" stroke-width="1" />`)}
          <polyline points=${line(Y2025)} fill="none" stroke="#a855f7" stroke-width="2" />
          ${Y2025.map((v, i) => svg`<circle cx=${cx(i)} cy=${y(v)} r="2.8" fill="#a855f7" stroke="#fff" stroke-width="1" />`)}
        </svg>
      </div>`
  }

  /* ---------------- Chrome ---------------- */

  private renderTopbar(): TemplateResult {
    return html`
      <header class="topbar">
        <span class="brand">${sxLogo()}</span>
        <nav class="top-menus">
          ${TOP_MENUS.map((m, i) => html`
            <button class="top-menu ${i === 1 ? 'active' : ''}" @click=${() => toast(`菜单：${m}`)}>${m}</button>`)}
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
        <span class="formula-input">销售数据分析</span>
      </div>`
  }

  private renderSheetTabs(): TemplateResult {
    return html`
      <div class="sheet-tabs">
        <button class="tab-add" title="新建工作表" @click=${() => this.showToast('新建工作表（演示）')}>${sxIcon('plus', 15)}</button>
        ${SHEET_TABS.map((t) => html`
          <button class="sheet-tab ${this.activeSheetTab === t ? 'on' : ''}"
            @click=${() => { this.activeSheetTab = t; this.showToast(`已切换到「${t}」（演示）`) }}>${t}</button>`)}
        <button class="tab-add" title="新建工作表" @click=${() => this.showToast('新建工作表（演示）')}>${sxIcon('plus', 15)}</button>
      </div>`
  }

  private renderStatusbar(): TemplateResult {
    const sum = SALES.reduce((a, b) => a + b, 0)
    const avg = Math.round(sum / SALES.length)
    return html`
      <div class="statusbar">
        <span class="status-ok">${sxIcon('checkCircle', 14)} 就绪</span>
        <div class="status-stats">
          <span>平均值: ${fmtInt(avg)}</span>
          <span>计数: ${SALES.length}</span>
          <span>求和: ${fmtInt(sum)}</span>
        </div>
        <div class="zoom">
          <button title="缩小" @click=${() => toast('缩小视图')} >${sxIcon('zoomOut', 14)}</button>
          <span>100%</span>
          <button title="放大" @click=${() => toast('放大视图')} >${sxIcon('zoomIn', 14)}</button>
          <button title="全屏" @click=${() => toast('全屏')} >${sxIcon('fullscreen', 14)}</button>
        </div>
      </div>`
  }

  /* ---------------- 设置面板 ---------------- */

  private presetThumb(p: Palette): TemplateResult {
    return svg`
      <svg width="54" height="30" viewBox="0 0 54 30">
        <rect x="6" y="14" width="7" height="12" rx="1.5" fill=${p.primary}/>
        <rect x="17" y="9" width="7" height="17" rx="1.5" fill=${p.primary} opacity="0.72"/>
        <rect x="28" y="4" width="7" height="22" rx="1.5" fill=${p.secondary}/>
        <rect x="39" y="11" width="7" height="15" rx="1.5" fill=${p.primary} opacity="0.5"/>
      </svg>`
  }

  private renderTabType(): TemplateResult {
    const P = this.palette
    return html`
      <div class="cp-section">
        <span class="cp-label">图表类型</span>
        <div class="type-grid">
          ${CHART_TYPES.map((t) => html`
            <button class="type-card ${this.heroType === t.key ? 'on' : ''}" @click=${() => this.setType(t.key)}>
              <span class="ic">${sxIcon(t.icon, 17)}</span>${t.label}
            </button>`)}
        </div>
      </div>
      <div class="cp-section">
        <span class="cp-label">样式预设</span>
        <div class="preset-row">
          ${STYLE_PRESETS.map((p) => html`
            <button class="preset-thumb ${this.presetKey === p.key ? 'on' : ''}" title=${p.label} @click=${() => this.setPreset(p.key)}>
              ${this.presetThumb(p)}
            </button>`)}
        </div>
        <button class="more-styles" @click=${() => this.showToast('更多样式（演示）')}>更多样式 ${sxIcon('chevronDown', 12)}</button>
      </div>
      <div class="cp-section">
        <span class="cp-label">数据系列</span>
        <button class="series-btn" @click=${() => { this.seriesMenuOpen = !this.seriesMenuOpen }}>
          <span class="dot" style="background:${P.primary}"></span>${this.seriesName}
          <span class="caret">${sxIcon('chevronDown', 12)}</span>
        </button>
        ${this.seriesMenuOpen
          ? html`
            <div class="series-menu">
              ${SERIES_OPTIONS.map((s) => html`
                <button class="series-opt ${this.seriesName === s ? 'on' : ''}" @click=${() => this.setSeries(s)}>
                  <span class="dot" style="background:${s === '销售额' ? P.primary : P.secondary}"></span>${s}
                  ${this.seriesName === s ? html`<span class="ck">${sxIcon('check', 13)}</span>` : nothing}
                </button>`)}
            </div>`
          : nothing}
        <button class="add-series" @click=${() => this.showToast('添加系列（演示）')}>${sxIcon('plus', 13)} 添加系列</button>
      </div>
      <div class="cp-section">
        <span class="cp-label">图表标题</span>
        <input class="cp-input" .value=${this.chartTitle} @input=${this.onTitleInput} placeholder="输入图表标题" />
      </div>
      <div class="cp-section cp-row">
        <span class="cp-label">显示标题</span>
        <button class="switch ${this.showTitle ? 'on' : ''}" @click=${() => { this.showTitle = !this.showTitle }}><span class="knob"></span></button>
      </div>`
  }

  private renderTabData(): TemplateResult {
    const P = this.palette
    return html`
      <div class="cp-section">
        <span class="cp-label">数据源</span>
        <div class="cp-select"><span>销售分析!$B$2:$B$6</span><span class="caret">${sxIcon('chevronDown', 12)}</span></div>
      </div>
      <div class="cp-section">
        <span class="cp-label">系列列表</span>
        ${SERIES_OPTIONS.map((s) => html`
          <button class="series-btn" style="margin-bottom:7px" @click=${() => this.setSeries(s)}>
            <span class="dot" style="background:${s === '销售额' ? P.primary : P.secondary}"></span>${s}
            ${this.seriesName === s ? html`<span class="caret" style="color:var(--sx-brand)">${sxIcon('check', 13)}</span>` : nothing}
          </button>`)}
      </div>
      <div class="cp-section cp-row">
        <span class="cp-label">系列按行切换</span>
        <button class="switch" @click=${() => this.showToast('系列按行切换（演示）')}><span class="knob"></span></button>
      </div>
      <div class="cp-section">
        <span class="cp-label">空单元格显示</span>
        <div class="cp-select"><span>显示为空值</span><span class="caret">${sxIcon('chevronDown', 12)}</span></div>
      </div>`
  }

  private renderTabStyle(): TemplateResult {
    return html`
      <div class="cp-section">
        <span class="cp-label">配色方案</span>
        <div class="palette-dots">
          ${STYLE_PRESETS.map((p) => html`
            <button class="${this.presetKey === p.key ? 'on' : ''}" title=${p.label}
              style="background:${p.primary}" @click=${() => this.setPreset(p.key)}></button>`)}
        </div>
      </div>
      <div class="cp-section">
        <span class="cp-label">图例位置</span>
        <div class="cp-select"><span>顶部</span><span class="caret">${sxIcon('chevronDown', 12)}</span></div>
      </div>
      <div class="cp-section cp-row">
        <span class="cp-label">显示网格线</span>
        <button class="switch ${this.gridlinesOn ? 'on' : ''}" @click=${() => { this.gridlinesOn = !this.gridlinesOn }}><span class="knob"></span></button>
      </div>
      <div class="cp-section cp-row">
        <span class="cp-label">柱状圆角</span>
        <button class="switch ${this.barRounded ? 'on' : ''}" @click=${() => { this.barRounded = !this.barRounded }}><span class="knob"></span></button>
      </div>`
  }

  private renderTabOther(): TemplateResult {
    return html`
      <div class="cp-section cp-row">
        <span class="cp-label">显示数据标签</span>
        <button class="switch ${this.dataLabelsOn ? 'on' : ''}" @click=${() => { this.dataLabelsOn = !this.dataLabelsOn }}><span class="knob"></span></button>
      </div>
      <div class="cp-section cp-row">
        <span class="cp-label">显示坐标轴</span>
        <button class="switch ${this.axesOn ? 'on' : ''}" @click=${() => { this.axesOn = !this.axesOn }}><span class="knob"></span></button>
      </div>
      <div class="cp-section cp-row">
        <span class="cp-label">透明背景</span>
        <button class="switch ${this.heroTransparent ? 'on' : ''}" @click=${() => { this.heroTransparent = !this.heroTransparent }}><span class="knob"></span></button>
      </div>
      <div class="cp-section">
        <button class="cp-btn primary" @click=${() => this.showToast('图表已导出为 PNG（演示）')}>导出图表</button>
      </div>`
  }

  private renderPanel(): TemplateResult {
    if (!this.panelOpen) return html``
    return html`
      <aside class="chart-panel">
        <div class="cp-head">
          <span class="ic">${sxIcon('chartBar', 16)}</span>
          <span class="tt">图表设置</span>
          <button class="cp-close" title="关闭" @click=${() => { this.panelOpen = false }}>${sxIcon('close', 15)}</button>
        </div>
        <div class="cp-tabs">
          ${PANEL_TABS.map((t) => html`
            <button class="cp-tab ${this.panelTab === t ? 'on' : ''}" @click=${() => { this.panelTab = t }}>${t}</button>`)}
        </div>
        ${this.panelTab === '类型' ? this.renderTabType()
          : this.panelTab === '数据' ? this.renderTabData()
          : this.panelTab === '样式' ? this.renderTabStyle()
          : this.renderTabOther()}
      </aside>`
  }

  /* ---------------- 页面 ---------------- */

  render(): TemplateResult {
    const heroStyle = this.heroTransparent ? 'background:transparent;border-color:transparent' : ''
    return html`
      <div class="app">
        ${this.renderTopbar()}
        ${this.renderToolbar()}
        <div class="body">
          <div class="main-col">
            ${this.renderFormulaBar()}
            <div class="canvas">
              <div class="col-headers">
                <span class="col-corner"></span>
                ${COL_LETTERS.map((c) => html`<span class="col-head">${c}</span>`)}
                <span class="col-fill"></span>
              </div>
              <div class="canvas-body">
                <div class="row-headers">
                  ${Array.from({ length: ROW_COUNT }, (_, i) => html`<div class="row-head">${i + 1}</div>`)}
                </div>
                <div class="grid-area">
                  <div class="data-block">
                    <div class="banner"><span class="bi">${sxIcon('chartBar', 16)}</span>销售数据分析</div>
                    <div class="data-grid">
                      ${TABLE_HEADERS.map((h) => html`<div class="data-cell h">${h}</div>`)}
                      ${TABLE_ROWS.map((row) => row.map((cell, ci) => html`
                        <div class="data-cell ${ci > 0 ? 'num' : ''}">${cell}</div>`))}
                    </div>
                  </div>

                  <div class="hero-card" style=${heroStyle}>
                    ${this.showTitle
                      ? html`<div class="hero-title"><span class="ic">${sxIcon('chartBar', 15)}</span>${this.chartTitle || '未命名图表'}</div>`
                      : nothing}
                    ${this.renderHeroLegend()}
                    <div class="hero-svg">${this.renderHeroChart()}</div>
                  </div>

                  <div class="cards-row">
                    ${this.renderDonutCard()}
                    ${this.renderPieCard()}
                    ${this.renderLineCard()}
                  </div>

                  ${this.panelOpen ? nothing : html`
                    <button class="panel-fab" @click=${() => { this.panelOpen = true }}>
                      <span class="ic">${sxIcon('chartBar', 14)}</span>图表设置
                    </button>`}
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
    'chart-app': ChartApp
  }
}
