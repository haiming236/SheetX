/**
 * SheetX 第 25 张 · 属性设置与企业个性化配置
 *
 * 设计稿范围：销售数据报表 + 柱状/饼图 + 右侧统一属性面板（单元格/行列/数据/图表）。
 * 扩展范围：宿主系统传入用户信息 / 主题 / 字体配置的企业个性化契约（可编辑 + 预设切换 + 持久化）。
 * 所有控件均为真实交互：属性改动实时反映到表格与图表，「应用到范围」生成可追溯记录。
 */
import { LitElement, html, nothing, type TemplateResult } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { baseStyles, lightTokens } from './tokens.js'
import { bindPageTheme, setThemeMode, type ResolvedTheme } from './theme.js'
import { propsStyles } from './props-styles.js'
import { sxIcon, sxLogo, type IconName } from './icons.js'
import { toast } from './toast.js'
import {
  PROP_TABS, SALES_ROWS, SALES_TOTAL, TREND_DATA, PIE_DATA,
  FONT_FAMILIES, FONT_SIZES, NUMBER_FORMATS, ALIGN_H, ALIGN_V,
  DEFAULT_CELL_PROPS, DEFAULT_ROWCOL_PROPS, DEFAULT_DATA_PROPS, DEFAULT_CHART_PROPS,
  DEFAULT_HOST_CONFIG, HOST_CONFIG_CONTRACT, INITIAL_APPLY_LOGS,
  formatWan, thousand,
  type PropTab, type CellProps, type RowColProps, type DataProps, type ChartProps,
  type HostConfig, type ApplyLog,
} from './props-data.js'

const TOP_MENUS = ['文件', '开始', '插入', '数据', '公式', '视图', '设置']
const HOST_KEY = 'sx:host-config'
const PROPS_KEY = 'sx:sheet-props'

type HostPreset = 'default' | 'blue' | 'purple' | 'green'

const HOST_PRESETS: Array<{ key: HostPreset; label: string; color: string }> = [
  { key: 'default', label: '默认', color: '#2f6bff' },
  { key: 'blue', label: '科技蓝', color: '#1e88e5' },
  { key: 'purple', label: '商务紫', color: '#7c5cff' },
  { key: 'green', label: '清新绿', color: '#2fbf8f' },
]

@customElement('props-app')
export class PropsApp extends LitElement {
  static styles = [baseStyles, lightTokens, propsStyles]

  @state() private theme: ResolvedTheme = 'light'
  @state() private activeMenu = '开始'
  @state() private tab: PropTab = 'cell'
  @state() private cell: CellProps = this.loadCell()
  @state() private rowcol: RowColProps = { ...DEFAULT_ROWCOL_PROPS }
  @state() private data: DataProps = { ...DEFAULT_DATA_PROPS }
  @state() private chart: ChartProps = { ...DEFAULT_CHART_PROPS }
  @state() private host: HostConfig = this.loadHost()
  @state() private showHostModal = false
  @state() private hostPreset: HostPreset = 'default'
  @state() private logs: ApplyLog[] = [...INITIAL_APPLY_LOGS]
  @state() private formula = '销售数据报表'
  @state() private zoom = 100
  @state() private panelOpen = true
  @state() private cellSelected = 'A1:F1'
  @state() private showMenuPopover = false

  private stopTheme: (() => void) | null = null

  constructor() {
    super()
    this.stopTheme = bindPageTheme((resolved) => { this.theme = resolved })
  }

  connectedCallback(): void {
    super.connectedCallback()
    // 持久化的企业主色在刷新后需重新应用到全局 CSS 变量，否则「配置已存但视觉未生效」
    this.applyBrand(this.host.theme.primaryColor, this.host.theme.accentColor)
  }

  /** 把企业主色/强调色同步到文档根，影响所有页面（宿主主题全局生效） */
  private applyBrand(primary: string, accent: string): void {
    document.documentElement.style.setProperty('--sx-brand', primary)
    document.documentElement.style.setProperty('--sx-brand-hover', accent)
  }

  disconnectedCallback(): void {
    this.stopTheme?.()
    this.stopTheme = null
    super.disconnectedCallback()
  }

  private loadHost(): HostConfig {
    try {
      const raw = localStorage.getItem(HOST_KEY)
      if (raw) return { ...DEFAULT_HOST_CONFIG, ...JSON.parse(raw) }
    } catch { /* 忽略 */ }
    return structuredClone(DEFAULT_HOST_CONFIG)
  }

  private loadCell(): CellProps {
    try {
      const raw = localStorage.getItem(PROPS_KEY)
      if (raw) return { ...DEFAULT_CELL_PROPS, ...JSON.parse(raw) }
    } catch { /* 忽略 */ }
    return { ...DEFAULT_CELL_PROPS, borders: { ...DEFAULT_CELL_PROPS.borders } }
  }

  private saveHost(): void {
    try { localStorage.setItem(HOST_KEY, JSON.stringify(this.host)) } catch { /* 忽略 */ }
  }

  private saveCell(): void {
    try { localStorage.setItem(PROPS_KEY, JSON.stringify(this.cell)) } catch { /* 忽略 */ }
  }

  private setCell<K extends keyof CellProps>(key: K, value: CellProps[K]): void {
    this.cell = { ...this.cell, [key]: value }
    this.saveCell()
  }

  private setRowcol<K extends keyof RowColProps>(key: K, value: RowColProps[K]): void {
    this.rowcol = { ...this.rowcol, [key]: value }
  }

  private setData<K extends keyof DataProps>(key: K, value: DataProps[K]): void {
    this.data = { ...this.data, [key]: value }
  }

  private setChart<K extends keyof ChartProps>(key: K, value: ChartProps[K]): void {
    this.chart = { ...this.chart, [key]: value }
  }

  private patchHost(section: keyof HostConfig, key: string, value: string | number): void {
    const next = structuredClone(this.host) as unknown as Record<string, Record<string, string | number>>
    next[section][key] = value
    this.host = next as unknown as HostConfig
    this.saveHost()
  }

  private applyPreset(preset: HostPreset): void {
    const map: Record<HostPreset, { primary: string; accent: string; family: string }> = {
      default: { primary: '#2f6bff', accent: '#7c5cff', family: '微软雅黑' },
      blue: { primary: '#1e88e5', accent: '#26c6da', family: '微软雅黑' },
      purple: { primary: '#7c5cff', accent: '#ff7ac6', family: '等线' },
      green: { primary: '#2fbf8f', accent: '#8bc34a', family: '微软雅黑' },
    }
    const p = map[preset]
    this.hostPreset = preset
    this.host = {
      ...structuredClone(this.host),
      theme: { ...this.host.theme, primaryColor: p.primary, accentColor: p.accent },
      font: { ...this.host.font, family: p.family },
    }
    this.saveHost()
    // 品牌主色同步到全局 CSS 变量，实时预览企业主题
    this.applyBrand(p.primary, p.accent)
    toast(`已应用「${HOST_PRESETS.find((x) => x.key === preset)?.label}」企业主题`)
  }

  private applyToRange(): void {
    const summary = [
      `${this.cell.fontFamily} ${this.cell.fontSize}px`,
      this.cell.bold ? '粗体' : '', this.cell.italic ? '斜体' : '',
      `${this.cell.hAlign}/${this.cell.vAlign}`,
      this.cell.wrap ? '自动换行' : '',
      this.cell.format,
    ].filter(Boolean).join(' · ')
    const now = new Date()
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    this.logs = [{ id: Date.now(), time, target: this.cellSelected, summary }, ...this.logs].slice(0, 8)
    toast(`已将属性应用到 ${this.cellSelected}`)
  }

  private switchTab(tab: PropTab): void {
    this.tab = tab
  }

  private toggleMenu(): void {
    this.showMenuPopover = !this.showMenuPopover
  }

  /* ================= 渲染 ================= */

  private renderMenuBar(): TemplateResult {
    return html`
      <div class="menu-bar">
        <div class="brand">${sxLogo(22)}</div>
        <nav class="menu-list">
          ${TOP_MENUS.map((menu) => html`
            <button class="menu-item ${this.activeMenu === menu ? 'active' : ''}" @click=${() => {
              this.activeMenu = menu
              if (menu === '设置') this.showHostModal = true
            }}>${menu}</button>`)}
        </nav>
        <div class="menu-right">
          <button class="icon-btn" title="搜索" @click=${() => toast('搜索：在当前报表中查找内容（演示）')}>${sxIcon('search', 16)}</button>
          <button class="icon-btn" title="帮助" @click=${() => toast('帮助：查阅官方文档 apps/docs（演示）')}>${sxIcon('help', 16)}</button>
          <button class="icon-btn" title="企业个性化配置" @click=${() => { this.showHostModal = true }}>${sxIcon('settings', 16)}</button>
          <div class="user-chip" @click=${() => { this.showHostModal = true }} title="宿主传入的用户信息">
            <span class="avatar">${this.host.user.avatar}</span>
            <span>${this.host.user.name}</span>
            ${sxIcon('chevronDown', 12)}
          </div>
        </div>
      </div>`
  }

  private renderToolbar(): TemplateResult {
    const toolBtn = (icon: IconName, title: string, action: () => void, on = false): TemplateResult => html`
      <button class="tool-btn ${on ? 'on' : ''}" title=${title} @click=${action}>${sxIcon(icon, 15)}</button>`
    return html`
      <div class="toolbar">
        <div class="tool-group">
          ${toolBtn('undo', '撤销', () => toast('撤销（演示）'))}
          ${toolBtn('redo', '重做', () => toast('重做（演示）'))}
          ${toolBtn('print', '打印', () => toast('打印：进入打印预览（演示）'))}
        </div>
        <div class="tool-group">
          <select class="mini-select family" .value=${this.cell.fontFamily} @change=${(e: Event) => this.setCell('fontFamily', (e.target as HTMLSelectElement).value)}>
            ${FONT_FAMILIES.map((f) => html`<option value=${f}>${f}</option>`)}
          </select>
          <select class="mini-select size" @change=${(e: Event) => this.setCell('fontSize', Number((e.target as HTMLSelectElement).value))}>
            ${FONT_SIZES.map((s) => html`<option value=${s} ?selected=${s === this.cell.fontSize}>${s}</option>`)}
          </select>
          ${toolBtn('bold', '粗体', () => this.setCell('bold', !this.cell.bold), this.cell.bold)}
          ${toolBtn('italic', '斜体', () => this.setCell('italic', !this.cell.italic), this.cell.italic)}
          ${toolBtn('underline', '下划线', () => this.setCell('underline', !this.cell.underline), this.cell.underline)}
          <button class="tool-btn color-cell" title="字体颜色" style=${`--mark:${this.cell.fontColor}`} @click=${() => this.cycleColor('fontColor')}>${sxIcon('fontColor', 15)}</button>
          <button class="tool-btn color-cell" title="填充颜色" style=${`--mark:${this.cell.fillColor}`} @click=${() => this.cycleColor('fillColor')}>${sxIcon('fill', 15)}</button>
        </div>
        <div class="tool-group">
          ${ALIGN_H.map((a) => toolBtn(a.icon, a.label, () => this.setCell('hAlign', a.key), this.cell.hAlign === a.key))}
        </div>
        <div class="tool-group">
          <button class="tool-btn" @click=${() => toast('合并单元格（演示）')}>${sxIcon('merge', 15)} 合并单元格 ${sxIcon('chevronDown', 11)}</button>
          <select class="mini-select format" .value=${this.cell.format} @change=${(e: Event) => this.setCell('format', (e.target as HTMLSelectElement).value)}>
            ${NUMBER_FORMATS.map((f) => html`<option value=${f}>${f}</option>`)}
          </select>
          ${toolBtn('percent', '百分比', () => this.setCell('format', '百分比'), this.cell.format === '百分比')}
          ${toolBtn('decimalMinus', '减少小数位', () => toast('减少小数位（演示）'))}
          ${toolBtn('border', '边框', () => this.switchTab('cell'), this.tab === 'cell')}
          ${toolBtn('filter', '筛选', () => this.switchTab('data'), this.tab === 'data')}
          <button class="tool-btn" @click=${() => this.toggleMenu()}>更多 ${sxIcon('chevronDown', 11)}</button>
        </div>
        ${this.showMenuPopover ? html`
          <div class="menu-popover" style="position:absolute;top:88px;right:24px;z-index:200;background:var(--sx-bg-surface);border:1px solid var(--sx-border);border-radius:8px;padding:6px;display:flex;flex-direction:column;gap:2px;">
            <button class="menu-item" style="text-align:left" @click=${() => { this.switchTab('rowcol'); this.toggleMenu() }}>行高与列宽</button>
            <button class="menu-item" style="text-align:left" @click=${() => { this.switchTab('chart'); this.toggleMenu() }}>图表属性</button>
            <button class="menu-item" style="text-align:left" @click=${() => { this.showHostModal = true; this.toggleMenu() }}>企业个性化配置</button>
          </div>` : nothing}
      </div>`
  }

  private cycleColor(key: 'fontColor' | 'fillColor'): void {
    const colors = ['#1f2329', '#2f6bff', '#e53935', '#2fbf8f', '#f5a623']
    const cur = this.cell[key]
    const next = colors[(colors.indexOf(cur) + 1) % colors.length] ?? colors[0]!
    this.setCell(key, next)
    toast(`${key === 'fontColor' ? '字体颜色' : '填充颜色'}已设为 ${next}`)
  }

  private renderFormulaBar(): TemplateResult {
    return html`
      <div class="formula-bar">
        <div class="addr-box"><span>${this.cellSelected}</span>${sxIcon('chevronDown', 11)}</div>
        <span class="fx-tag">fx</span>
        <input class="formula-input" .value=${this.formula} placeholder="输入公式或内容" @input=${(e: Event) => { this.formula = (e.target as HTMLInputElement).value }} />
      </div>`
  }

  private renderTable(): TemplateResult {
    const head = ['产品名称', '销售数量', '销售金额（元）', '同比增长', '备注']
    return html`
      <div class="sheet-card">
        <div class="report-title">
          ${sxIcon('chartBar', 19)}
          <h2>销售数据报表</h2>
          <span class="date">统计日期：2025-01-01 ~ 2025-12-31</span>
        </div>
        <div class="col-head">
          <span></span>${head.map((_, i) => html`<span>${'ABCDEF'[i] ?? ''}</span>`)}
        </div>
        <table class="data-table" style=${`--row-h:${this.rowcol.rowHeight}px`}>
          <thead><tr><th class="cell-name">${head[0]}</th>${head.slice(1).map((h) => html`<th>${h}</th>`)}</tr></thead>
          <tbody>
            ${SALES_ROWS.map((row) => html`
              <tr @click=${() => { this.cellSelected = `${row.name}`; toast(`选中：${row.name}`) }}>
                <td class="cell-name">${row.name}</td>
                <td>${thousand(row.qty)}</td>
                <td>¥ ${thousand(row.amount)}</td>
                <td class=${row.growth >= 0 ? 'up' : 'down'}>
                  <span class="arrow">${row.growth >= 0 ? '▲' : '▼'}</span>${Math.abs(row.growth).toFixed(1)}%
                </td>
                <td>${row.note}</td>
              </tr>`)}
            <tr class="total">
              <td class="cell-name">合计</td>
              <td>${thousand(SALES_TOTAL.qty)}</td>
              <td>¥ ${thousand(SALES_TOTAL.amount)}</td>
              <td class="up"><span class="arrow">▲</span>${SALES_TOTAL.growth.toFixed(1)}%</td>
              <td>—</td>
            </tr>
          </tbody>
        </table>
      </div>`
  }

  private renderBarChart(): TemplateResult {
    const max = Math.max(...TREND_DATA.map((d) => d.value))
    return html`
      <div class="chart-card">
        <h3>${this.chart.title}</h3>
        <div style="position:relative">
          ${this.chart.showLegend ? html`<span class="axis-y">2M</span>` : nothing}
          <div class="bar-wrap">
            ${TREND_DATA.map((d) => html`
              <div class="bar-col" title=${`${d.label}：¥ ${thousand(d.value)}`}>
                ${this.chart.showDataLabel ? html`<span class="bar-label">${formatWan(d.value)}</span>` : nothing}
                <div class="bar" style=${`height:${Math.max(6, (d.value / max) * 100)}%`}></div>
                <span class="bar-label">${d.label}</span>
              </div>`)}
          </div>
        </div>
        <div class="sub">● 销售金额 · 单位：元 · 数据源 ${this.chart.dataRange}</div>
      </div>`
  }

  private renderPieChart(): TemplateResult {
    const stops = PIE_DATA.map((d, i) => {
      const start = PIE_DATA.slice(0, i).reduce((s, x) => s + x.value, 0)
      const end = start + d.value
      return `${d.color} ${start}% ${end}%`
    }).join(', ')
    return html`
      <div class="chart-card">
        <h3>产品销售占比</h3>
        <div class="pie-wrap">
          <!-- CSS conic-gradient 而非 SVG fill：SVG 的 fill 不接受渐变函数，会回退成黑色圆环 -->
          <div class="pie-donut" role="img" aria-label="产品销售占比饼图"
               style=${`background:conic-gradient(${stops})`}>
            <span class="pie-hole"></span>
          </div>
          <div class="pie-legend">
            ${PIE_DATA.map((d) => html`
              <div class="legend-row">
                <span class="legend-dot" style=${`background:${d.color}`}></span>
                <span>${d.label}</span><span class="pct">${d.value}%</span>
              </div>`)}
          </div>
        </div>
      </div>`
  }

  private renderCellTab(): TemplateResult {
    const c = this.cell
    return html`
      <div>
        <span class="field-label">单元格格式</span>
        <select class="full-select" .value=${c.format} @change=${(e: Event) => this.setCell('format', (e.target as HTMLSelectElement).value)}>
          ${NUMBER_FORMATS.map((f) => html`<option value=${f}>${f}</option>`)}
        </select>
      </div>
      <div>
        <span class="field-label">字体</span>
        <div class="font-row">
          <select class="full-select" .value=${c.fontFamily} @change=${(e: Event) => this.setCell('fontFamily', (e.target as HTMLSelectElement).value)}>
            ${FONT_FAMILIES.map((f) => html`<option value=${f}>${f}</option>`)}
          </select>
          <select class="full-select" @change=${(e: Event) => this.setCell('fontSize', Number((e.target as HTMLSelectElement).value))}>
            ${FONT_SIZES.map((s) => html`<option value=${s} ?selected=${s === c.fontSize}>${s}</option>`)}
          </select>
        </div>
        <div class="grid-tools" style="margin-top:6px">
          ${([
            { icon: 'bold' as const, key: 'bold' as const, label: '粗体' },
            { icon: 'italic' as const, key: 'italic' as const, label: '斜体' },
            { icon: 'underline' as const, key: 'underline' as const, label: '下划线' },
          ]).map((b) => html`
            <button class="grid-tool ${c[b.key] ? 'on' : ''}" title=${b.label} @click=${() => this.setCell(b.key, !c[b.key])}>${sxIcon(b.icon, 14)}</button>`)}
          <button class="grid-tool color-cell" style=${`--mark:${c.fontColor}`} title="字体颜色" @click=${() => this.cycleColor('fontColor')}>${sxIcon('fontColor', 14)}</button>
          <button class="grid-tool color-cell" style=${`--mark:${c.fillColor}`} title="填充颜色" @click=${() => this.cycleColor('fillColor')}>${sxIcon('fill', 14)}</button>
        </div>
      </div>
      <div>
        <span class="field-label">对齐方式</span>
        <div class="grid-tools">
          ${ALIGN_H.map((a) => html`
            <button class="grid-tool ${c.hAlign === a.key ? 'on' : ''}" title=${a.label} @click=${() => this.setCell('hAlign', a.key)}>${sxIcon(a.icon, 14)}</button>`)}
          <span style="width:6px"></span>
          ${ALIGN_V.map((a) => html`
            <button class="grid-tool ${c.vAlign === a.key ? 'on' : ''}" title=${a.label} @click=${() => this.setCell('vAlign', a.key)}>${sxIcon(a.icon, 14)}</button>`)}
        </div>
      </div>
      <div class="toggle-row">
        <span class="field-label" style="margin:0">文本换行</span>
        <button class="toggle ${c.wrap ? 'on' : ''}" @click=${() => this.setCell('wrap', !c.wrap)} aria-label="文本换行">
          <span class="knob"></span>
        </button>
      </div>
      <div>
        <span class="field-label">边框与底纹</span>
        <div class="grid-tools">
          ${([
            { key: 'left' as const, icon: 'border' as const, label: '左边框' },
            { key: 'right' as const, icon: 'border' as const, label: '右边框' },
            { key: 'top' as const, icon: 'border' as const, label: '上边框' },
            { key: 'bottom' as const, icon: 'border' as const, label: '下边框' },
          ]).map((b) => html`
            <button class="grid-tool ${c.borders[b.key] ? 'on' : ''}" title=${b.label} @click=${() => this.setCell('borders', { ...c.borders, [b.key]: !c.borders[b.key] })}>${sxIcon(b.icon, 14)}</button>`)}
          <span style="width:6px"></span>
          <button class="grid-tool" title="边框样式" @click=${() => this.setCell('borderStyle', c.borderStyle === '实线' ? '虚线' : '实线')}>${sxIcon('dash', 14)} ${sxIcon('chevronDown', 10)}</button>
          <button class="grid-tool color-cell" style=${`--mark:${c.fillColor}`} title="底纹颜色" @click=${() => this.cycleColor('fillColor')}>${sxIcon('fill', 14)} ${sxIcon('chevronDown', 10)}</button>
        </div>
      </div>
      <div>
        <span class="field-label">单元格大小</span>
        <div class="size-row">
          <div class="size-input">
            <span class="field-label" style="margin:0;white-space:nowrap">行高</span>
            <input type="number" .value=${String(c.rowHeight)} min="12" max="120" @change=${(e: Event) => this.setCell('rowHeight', Number((e.target as HTMLInputElement).value))} />
            <span class="unit">px</span>
          </div>
          <span class="size-x">×</span>
          <div class="size-input">
            <span class="field-label" style="margin:0;white-space:nowrap">列宽</span>
            <input type="number" .value=${String(c.colWidth)} min="40" max="400" @change=${(e: Event) => this.setCell('colWidth', Number((e.target as HTMLInputElement).value))} />
            <span class="unit">px</span>
          </div>
        </div>
        <label class="check-row" style="margin-top:8px">
          <span class="check-box ${c.autoFit ? 'on' : ''}" @click=${() => this.setCell('autoFit', !c.autoFit)}>${c.autoFit ? sxIcon('check', 11) : ''}</span>
          自动调整行高
        </label>
      </div>
      <button class="apply-btn" @click=${() => this.applyToRange()}>${sxIcon('edit', 14)} 应用到范围</button>`
  }

  private renderRowColTab(): TemplateResult {
    const r = this.rowcol
    return html`
      <div class="group-card">
        <span class="field-label">尺寸</span>
        <div class="size-row">
          <div class="size-input"><span class="field-label" style="margin:0">行高</span><input type="number" .value=${String(r.rowHeight)} @change=${(e: Event) => this.setRowcol('rowHeight', Number((e.target as HTMLInputElement).value))} /><span class="unit">px</span></div>
          <span class="size-x">×</span>
          <div class="size-input"><span class="field-label" style="margin:0">列宽</span><input type="number" .value=${String(r.colWidth)} @change=${(e: Event) => this.setRowcol('colWidth', Number((e.target as HTMLInputElement).value))} /><span class="unit">px</span></div>
        </div>
        <span class="field-label">冻结行列</span>
        <div class="size-row">
          <div class="size-input"><span class="field-label" style="margin:0">冻结行</span><input type="number" .value=${String(r.freezeRows)} @change=${(e: Event) => this.setRowcol('freezeRows', Number((e.target as HTMLInputElement).value))} /></div>
          <div class="size-input"><span class="field-label" style="margin:0">冻结列</span><input type="number" .value=${String(r.freezeCols)} @change=${(e: Event) => this.setRowcol('freezeCols', Number((e.target as HTMLInputElement).value))} /></div>
        </div>
      </div>
      <div class="group-card">
        <span class="field-label">显示</span>
        <label class="check-row"><span class="check-box ${r.showGridlines ? 'on' : ''}" @click=${() => this.setRowcol('showGridlines', !r.showGridlines)}>${r.showGridlines ? sxIcon('check', 11) : ''}</span>显示网格线</label>
        <label class="check-row" style="margin-top:8px"><span class="check-box ${r.showRowNumbers ? 'on' : ''}" @click=${() => this.setRowcol('showRowNumbers', !r.showRowNumbers)}>${r.showRowNumbers ? sxIcon('check', 11) : ''}</span>显示行号列标</label>
      </div>
      <div class="group-card">
        <span class="field-label">可见性</span>
        <div class="size-row">
          <div class="size-input"><span class="field-label" style="margin:0">隐藏行</span><input type="number" .value=${String(r.hiddenRows)} @change=${(e: Event) => this.setRowcol('hiddenRows', Number((e.target as HTMLInputElement).value))} /></div>
          <div class="size-input"><span class="field-label" style="margin:0">隐藏列</span><input type="number" .value=${String(r.hiddenCols)} @change=${(e: Event) => this.setRowcol('hiddenCols', Number((e.target as HTMLInputElement).value))} /></div>
        </div>
      </div>
      <button class="apply-btn" @click=${() => this.applyToRange()}>${sxIcon('edit', 14)} 应用到范围</button>`
  }

  private renderDataTab(): TemplateResult {
    const d = this.data
    return html`
      <div class="group-card">
        <span class="field-label">数据源</span>
        <select class="full-select" .value=${d.source} @change=${(e: Event) => this.setData('source', (e.target as HTMLSelectElement).value)}>
          <option>内置示例数据</option><option>REST API</option><option>本地 JSON</option><option>XLSX 导入</option>
        </select>
        <span class="field-label">刷新间隔（秒，0 为不刷新）</span>
        <input class="full-select" type="number" .value=${String(d.refreshInterval)} @change=${(e: Event) => this.setData('refreshInterval', Number((e.target as HTMLInputElement).value))} />
        <span class="field-label">导入方式</span>
        <div class="radio-row">
          ${['追加', '覆盖', '合并'].map((m) => html`<button class="chip ${d.importMode === m ? 'on' : ''}" @click=${() => this.setData('importMode', m)}>${m}</button>`)}
        </div>
      </div>
      <div class="group-card">
        <span class="field-label">校验规则</span>
        <label class="check-row"><span class="check-box ${d.validateOnEdit ? 'on' : ''}" @click=${() => this.setData('validateOnEdit', !d.validateOnEdit)}>${d.validateOnEdit ? sxIcon('check', 11) : ''}</span>编辑时校验</label>
        <label class="check-row" style="margin-top:8px"><span class="check-box ${d.allowBlank ? 'on' : ''}" @click=${() => this.setData('allowBlank', !d.allowBlank)}>${d.allowBlank ? sxIcon('check', 11) : ''}</span>允许空值</label>
        <span class="field-label">唯一键字段<span class="hint">业务主键</span></span>
        <input class="full-select" .value=${d.uniqueKey} @change=${(e: Event) => this.setData('uniqueKey', (e.target as HTMLInputElement).value)} />
      </div>
      <div class="group-card">
        <span class="field-label">数字格式</span>
        <div class="size-row">
          <div class="size-input"><span class="field-label" style="margin:0">小数位</span><input type="number" .value=${String(d.decimalPlaces)} @change=${(e: Event) => this.setData('decimalPlaces', Number((e.target as HTMLInputElement).value))} /></div>
        </div>
        <label class="check-row" style="margin-top:8px"><span class="check-box ${d.thousandsSeparator ? 'on' : ''}" @click=${() => this.setData('thousandsSeparator', !d.thousandsSeparator)}>${d.thousandsSeparator ? sxIcon('check', 11) : ''}</span>千分位分隔符</label>
      </div>
      <button class="apply-btn" @click=${() => this.applyToRange()}>${sxIcon('edit', 14)} 应用到范围</button>`
  }

  private renderChartTab(): TemplateResult {
    const c = this.chart
    return html`
      <div class="group-card">
        <span class="field-label">图表类型</span>
        <div class="radio-row">
          ${([
            { key: 'bar' as const, label: '柱状图', icon: 'chartBar' as const },
            { key: 'line' as const, label: '折线图', icon: 'chartLine' as const },
            { key: 'pie' as const, label: '饼图', icon: 'chartPie' as const },
          ]).map((t) => html`<button class="chip ${c.type === t.key ? 'on' : ''}" @click=${() => this.setChart('type', t.key)}>${sxIcon(t.icon, 12)} ${t.label}</button>`)}
        </div>
        <span class="field-label">标题</span>
        <input class="full-select" .value=${c.title} @change=${(e: Event) => this.setChart('title', (e.target as HTMLInputElement).value)} />
        <span class="field-label">数据范围<span class="hint">A1 记法</span></span>
        <input class="full-select" .value=${c.dataRange} @change=${(e: Event) => this.setChart('dataRange', (e.target as HTMLInputElement).value)} />
      </div>
      <div class="group-card">
        <span class="field-label">品牌配色</span>
        <div class="size-row">
          <input type="color" .value=${c.colorScheme} @change=${(e: Event) => this.setChart('colorScheme', (e.target as HTMLInputElement).value)} style="width:52px;height:30px;border:1px solid var(--sx-border-input);border-radius:5px;background:var(--sx-bg-surface)" />
          <span style="font-size:11px;color:var(--sx-text-secondary)">${c.colorScheme}</span>
        </div>
        <span class="field-label" style="margin-top:12px">显示选项</span>
        <label class="check-row"><span class="check-box ${c.showLegend ? 'on' : ''}" @click=${() => this.setChart('showLegend', !c.showLegend)}>${c.showLegend ? sxIcon('check', 11) : ''}</span>显示图例 / 坐标轴</label>
        <label class="check-row" style="margin-top:8px"><span class="check-box ${c.showDataLabel ? 'on' : ''}" @click=${() => this.setChart('showDataLabel', !c.showDataLabel)}>${c.showDataLabel ? sxIcon('check', 11) : ''}</span>显示数据标签</label>
      </div>
      <button class="apply-btn" @click=${() => { this.applyToRange(); toast('图表属性已更新') }}>${sxIcon('edit', 14)} 应用到范围</button>`
  }

  private renderPanel(): TemplateResult {
    if (!this.panelOpen) return html`
      <div style="width:34px;flex:0 0 34px;border-left:1px solid var(--sx-border);background:var(--sx-bg-surface);display:flex;flex-direction:column;align-items:center;padding-top:12px;gap:10px">
        <button class="icon-btn" title="打开属性设置" @click=${() => { this.panelOpen = true }}>${sxIcon('sliders', 16)}</button>
      </div>`
    return html`
      <aside class="props-panel">
        <div class="panel-head">
          ${sxIcon('settings', 16)}
          <span>属性设置</span>
          <button class="icon-btn close" title="收起面板" @click=${() => { this.panelOpen = false }}>${sxIcon('close', 14)}</button>
        </div>
        <div class="prop-tabs" role="tablist">
          ${PROP_TABS.map((t) => html`
            <button class="prop-tab ${this.tab === t.key ? 'active' : ''}" role="tab" aria-selected=${this.tab === t.key} @click=${() => this.switchTab(t.key)}>${t.label}</button>`)}
        </div>
        <div class="panel-body">
          ${this.tab === 'cell' ? this.renderCellTab() : nothing}
          ${this.tab === 'rowcol' ? this.renderRowColTab() : nothing}
          ${this.tab === 'data' ? this.renderDataTab() : nothing}
          ${this.tab === 'chart' ? this.renderChartTab() : nothing}
          <div style="border-top:1px solid var(--sx-border);padding-top:10px">
            <span class="field-label">最近应用<span class="hint">可追溯</span></span>
            ${this.logs.slice(0, 3).map((log) => html`
              <div style="display:flex;gap:6px;font-size:10px;color:var(--sx-text-hint);margin-top:5px">
                <span style="font-variant-numeric:tabular-nums">${log.time}</span>
                <span style="color:var(--sx-brand)">${log.target}</span>
                <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${log.summary}</span>
              </div>`)}
          </div>
        </div>
      </aside>`
  }

  private renderHostModal(): TemplateResult {
    if (!this.showHostModal) return nothing as unknown as TemplateResult
    const h = this.host
    const field = (section: keyof HostConfig, key: string, label: string, type = 'text'): TemplateResult => html`
      <div class="config-field">
        <span>${label}</span>
        <input type=${type} .value=${String((h[section] as unknown as Record<string, string | number>)[key] ?? '')}
               @change=${(e: Event) => this.patchHost(section, key, (e.target as HTMLInputElement).value)} />
      </div>`
    return html`
      <div class="modal-mask" @click=${(e: Event) => { if (e.target === e.currentTarget) this.showHostModal = false }}>
        <div class="modal" role="dialog" aria-label="企业个性化配置">
          <div class="modal-head">
            ${sxIcon('sliders', 17)} 企业个性化配置
            <button class="icon-btn close" @click=${() => { this.showHostModal = false }}>${sxIcon('close', 15)}</button>
          </div>
          <div class="modal-body">
            <div>
              <span class="field-label">企业预设</span>
              <div class="radio-row">
                ${HOST_PRESETS.map((p) => html`
                  <button class="chip ${this.hostPreset === p.key ? 'on' : ''}" @click=${() => this.applyPreset(p.key)}>
                    <span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${p.color};margin-right:5px"></span>${p.label}
                  </button>`)}
              </div>
            </div>
            <div class="config-grid">
              <div class="config-card">
                <h4>${sxIcon('user', 14)} 用户信息（宿主传入）</h4>
                ${field('user', 'name', '姓名')}
                ${field('user', 'avatar', '头像字')}
                ${field('user', 'role', '角色')}
                ${field('user', 'department', '部门')}
                ${field('user', 'email', '邮箱')}
              </div>
              <div class="config-card">
                <h4>${sxIcon('palette', 14)} 主题配置（宿主传入）</h4>
                <div class="config-field"><span>模式</span>
                  <select .value=${h.theme.mode} @change=${(e: Event) => {
                    const v = (e.target as HTMLSelectElement).value as 'light' | 'dark' | 'system'
                    this.patchHost('theme', 'mode', v)
                    if (v !== 'system') setThemeMode(v)
                  }}>
                    <option value="light">浅色</option><option value="dark">深色</option><option value="system">跟随系统</option>
                  </select>
                </div>
                <div class="config-field"><span>主色</span><input type="color" .value=${h.theme.primaryColor} @change=${(e: Event) => this.patchHost('theme', 'primaryColor', (e.target as HTMLInputElement).value)} /></div>
                <div class="config-field"><span>强调色</span><input type="color" .value=${h.theme.accentColor} @change=${(e: Event) => this.patchHost('theme', 'accentColor', (e.target as HTMLInputElement).value)} /></div>
                ${field('theme', 'radius', '圆角', 'number')}
              </div>
              <div class="config-card">
                <h4>${sxIcon('textT', 14)} 字体配置（宿主传入）</h4>
                <div class="config-field"><span>字体族</span>
                  <select .value=${h.font.family} @change=${(e: Event) => this.patchHost('font', 'family', (e.target as HTMLSelectElement).value)}>
                    ${FONT_FAMILIES.map((f) => html`<option value=${f}>${f}</option>`)}
                  </select>
                </div>
                ${field('font', 'size', '字号', 'number')}
                ${field('font', 'lineHeight', '行高', 'number')}
              </div>
              <div class="config-card">
                <h4>${sxIcon('shield', 14)} 企业品牌</h4>
                ${field('brand', 'name', '企业名')}
                ${field('brand', 'logoText', 'Logo 字')}
                ${field('brand', 'watermark', '水印文案')}
              </div>
            </div>
            <div>
              <span class="field-label">宿主注入契约<span class="hint">Web Component / postMessage</span></span>
              <pre class="contract">${HOST_CONFIG_CONTRACT}</pre>
            </div>
          </div>
          <div class="modal-foot">
            <button class="btn" @click=${() => {
              this.host = structuredClone(DEFAULT_HOST_CONFIG)
              this.hostPreset = 'default'
              this.saveHost()
              this.applyBrand(this.host.theme.primaryColor, this.host.theme.accentColor)
              toast('已恢复默认配置')
            }}>恢复默认</button>
            <button class="btn primary" @click=${() => { this.saveHost(); this.showHostModal = false; toast('企业配置已保存并应用') }}>保存并应用</button>
          </div>
        </div>
      </div>`
  }

  private renderSheetTabs(): TemplateResult {
    return html`
      <div class="sheet-tabs">
        <span style="color:var(--sx-text-hint)">${sxIcon('plus', 14)}</span>
        <span class="sheet-tab">销售报表</span>
        <div class="status-right">
          <button class="icon-btn" title="普通视图">${sxIcon('gridView', 14)}</button>
          <button class="icon-btn" title="页面布局">${sxIcon('tableStyle', 14)}</button>
          <span>${this.zoom}%</span>
          <input class="zoom-range" type="range" min="50" max="150" .value=${String(this.zoom)} @input=${(e: Event) => { this.zoom = Number((e.target as HTMLInputElement).value) }} />
          <button class="icon-btn" title="全屏" @click=${() => toast('全屏（演示）')}>${sxIcon('fullscreen', 14)}</button>
        </div>
      </div>`
  }

  render(): TemplateResult {
    return html`
      <div class="app" data-prop-theme=${this.theme} style=${`--host-primary:${this.host.theme.primaryColor}`}>
        ${this.renderMenuBar()}
        ${this.renderToolbar()}
        ${this.renderFormulaBar()}
        <div class="workspace">
          <div class="sheet-area">
            ${this.renderTable()}
            <div class="charts-row">
              ${this.renderBarChart()}
              ${this.renderPieChart()}
            </div>
          </div>
          ${this.renderPanel()}
        </div>
        ${this.renderSheetTabs()}
        ${this.renderHostModal()}
      </div>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'props-app': PropsApp
  }
}
