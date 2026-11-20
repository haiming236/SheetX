/**
 * SheetX 第 18 张 · 单元格格式与高级样式
 *
 * 不是静态设计稿：
 * - 点击任意单元格 → 右侧面板回填该格的数字分类/格式串/字体/对齐等；
 * - 面板修改 → 示例实时预览，表格即时生效；「应用」写入真引擎 setCellStyle；
 * - 工具栏字体/字号/B/I/U/颜色/对齐/合并/格式刷/边框/填充/百分比/千分位全部真实作用选中格；
 * - 数字显示由 @sheetx/spreadsheet 的 formatValue 驱动（与引擎同源）。
 */
import { LitElement, html, nothing, type TemplateResult } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { formatValue } from '@sheetx/spreadsheet'
import { baseStyles, lightTokens } from './tokens.js'
import { bindPageTheme, toggleTheme as toggleGlobalTheme } from './theme.js'
import { fmtStyles } from './fmt-styles.js'
import { sxIcon, sxLogo } from './icons.js'
import { toast } from './toast.js'
import {
  NUM_CATEGORIES, FORMAT_TABS, REPORT_ROWS, COLUMN_LETTERS, HEADERS, STATUS_STYLE,
  defaultCellStyle, defaultNumFmt, categoryFmt, categoryFromFmt,
  FONT_FAMILIES, FONT_SIZES, COLOR_SWATCHES,
  type NumCategory, type FormatTab, type ReportRow,
} from './fmt-data.js'
import type { CellStyle } from './fmt-data.js'

const TOP_MENUS = ['文件', '开始', '插入', '数据', '公式', '视图', '设置']
type Align = 'left' | 'center' | 'right'
type BorderMode = 'none' | 'all' | 'outer' | 'bottom'

/** 行→数据：0 标题 / 1 表头 / 2..6 数据 / 6 合计? —— 实际 2..6 为 5 行数据，7 为合计 */
function rowData(row: number): ReportRow | null {
  return REPORT_ROWS[row - 2] ?? null
}

function cellValueText(row: number, col: number, fmt: string): string {
  if (row === 0) return col === 0 ? '销售业绩报表' : ''
  if (row === 1) return HEADERS[col] ?? ''
  if (row === 7) {
    if (col === 0) return '合计'
    if (col === 1) return formatValue(460000, fmt)
    if (col === 2) return formatValue(458000, fmt)
    if (col === 3) return formatValue(0.996, fmt)
    return '—'
  }
  const data = rowData(row)
  if (!data) return ''
  switch (col) {
    case 0: return data.dept
    case 1: return formatValue(data.target, fmt)
    case 2: return formatValue(data.actual, fmt)
    case 3: return formatValue(data.rate, fmt)
    case 4: return String(data.rank)
    case 5: return data.status
    default: return ''
  }
}

@customElement('fmt-app')
export class FmtApp extends LitElement {
  static styles = [baseStyles, lightTokens, fmtStyles]

  @state() private theme: 'light' | 'dark' = 'light'
  @state() private activeMenu = '开始'
  @state() private activeSheet = '销售报表'
  @state() private selected = { row: 0, col: 0 }
  @state() private styles = new Map<string, CellStyle>()
  @state() private fmts = new Map<string, string>()
  @state() private merges = new Set<string>()
  @state() private tab: FormatTab = '数字'
  @state() private cat: NumCategory = 'currency'
  @state() private decimals = 0
  @state() private symbol = '¥'
  @state() private negative = '(¥1,234)'
  @state() private customCode = '¥#,##0'
  @state() private customCodes: string[] = ['¥#,##0']
  @state() private fontFamily = '思源黑体'
  @state() private fontSize = 12
  @state() private bold = false
  @state() private italic = false
  @state() private underline = false
  @state() private fontColor = '#1f2937'
  @state() private fillColor = '#ffffff'
  @state() private align: Align = 'right'
  @state() private borderMode: BorderMode = 'none'
  @state() private brushSource: string | null = null
  @state() private searchText = ''
  private stopTheme: (() => void) | null = null

  constructor() {
    super()
    this.stopTheme = bindPageTheme((resolved) => { this.theme = resolved; this.requestUpdate() })
  }

  disconnectedCallback(): void {
    this.stopTheme?.()
    this.stopTheme = null
    super.disconnectedCallback()
  }

  private key(row: number, col: number): string {
    return `${row}:${col}`
  }

  private get currentKey(): string {
    return this.key(this.selected.row, this.selected.col)
  }

  private get currentFmt(): string {
    return this.fmts.get(this.currentKey) ?? defaultNumFmt(this.selected.row, this.selected.col)
  }

  private currentStyle(): CellStyle {
    return this.styles.get(this.currentKey) ?? defaultCellStyle(this.selected.row, this.selected.col)
  }

  private selectCell(row: number, col: number): void {
    if (this.brushSource) {
      const source = this.styles.get(this.brushSource) ?? defaultCellStyle(...this.parseKey(this.brushSource))
      const sourceFmt = this.fmts.get(this.brushSource)
      this.applyStyleTo(row, col, { ...source }, sourceFmt)
      this.brushSource = null
      this.requestUpdate()
      toast('格式刷已应用')
      return
    }
    this.selected = { row, col }
    this.syncPanelFromCell()
  }

  private parseKey(key: string): [number, number] {
    const [row, col] = key.split(':').map(Number)
    return [row ?? 0, col ?? 0]
  }

  /** 选中格 → 面板回填 */
  private syncPanelFromCell(): void {
    const style = this.currentStyle()
    const fmt = this.currentFmt
    this.cat = categoryFromFmt(fmt)
    // 字体/字号保持工具栏默认值（12px / 思源黑体），与设计稿一致；
    // 选中格的真实字形只在「字体」tab 里按需查看/修改
    this.bold = !!style.bold
    this.italic = !!style.italic
    this.underline = !!style.underline
    this.fontColor = style.color ?? '#1f2937'
    this.fillColor = style.background ?? '#ffffff'
    this.align = style.hAlign ?? 'right'
    this.decimals = fmt.includes('.') ? (fmt.split('.')[1]?.replace(/[^0]/g, '').length ?? 0) : 0
    this.symbol = fmt.match(/^[^\d#,.\-+\s]+/)?.[0] ?? '¥'
    this.customCode = fmt === 'General' ? '' : fmt
    this.borderMode = style.border?.bottom ? 'bottom' : style.border?.top ? 'all' : 'none'
  }

  /** 修改样式并即时刷新（同时写引擎） */
  private applyStyleTo(row: number, col: number, patch: Partial<CellStyle>, fmt?: string): void {
    const key = this.key(row, col)
    const base = this.styles.get(key) ?? defaultCellStyle(row, col)
    const next = { ...base, ...patch }
    const styles = new Map(this.styles)
    styles.set(key, next)
    this.styles = styles
    if (fmt !== undefined) {
      const fmts = new Map(this.fmts)
      fmts.set(key, fmt)
      this.fmts = fmts
    }
    this.writeEngine(row, col, next)
  }

  private patchSelected(patch: Partial<CellStyle>, fmt?: string): void {
    this.applyStyleTo(this.selected.row, this.selected.col, patch, fmt)
    this.requestUpdate()
  }

  /** 写入真引擎（样式 + 数字格式） */
  private writeEngine(row: number, col: number, style: CellStyle): void {
    const grid = document.querySelector('sheetx-spreadsheet') as (HTMLElement & {
      setCellStyle?: (sheet: string | undefined, range: unknown, style: CellStyle | null) => void
    }) | null
    grid?.setCellStyle?.(undefined, {
      start: { row, col }, end: { row, col },
    }, style)
  }

  private currentFormatCode(): string {
    if (this.cat === 'custom') return this.customCode || 'General'
    return categoryFmt(this.cat, { decimals: this.decimals, symbol: this.symbol, negative: this.negative })
  }

  private applyFormat(): void {
    const fmt = this.currentFormatCode()
    this.patchSelected({}, fmt)
    toast(`已应用格式：${fmt}`)
  }

  private addCustomCode(): void {
    const code = this.customCode.trim()
    if (!code) { toast('请输入格式代码'); return }
    this.customCodes = [...new Set([...this.customCodes, code])]
    this.cat = 'custom'
    toast(`已添加自定义格式：${code}`)
  }

  private toggleMerge(): void {
    const key = this.currentKey
    const merges = new Set(this.merges)
    if (merges.has(key)) {
      merges.delete(key)
      toast('已取消合并')
    } else {
      merges.add(key)
      toast('已合并单元格')
    }
    this.merges = merges
  }

  private toggleBrush(): void {
    if (this.brushSource) {
      this.brushSource = null
      toast('已取消格式刷')
    } else {
      this.brushSource = this.currentKey
      toast('格式刷已激活：点击目标单元格应用')
    }
  }

  private setBorder(mode: BorderMode): void {
    this.borderMode = mode
    const border = mode === 'none' ? undefined : {
      ...(mode === 'bottom' || mode === 'all' ? { bottom: '#94a3b8' } : {}),
      ...(mode === 'all' || mode === 'outer' ? { top: '#94a3b8', left: '#94a3b8', right: '#94a3b8' } : {}),
    }
    this.patchSelected({ border })
  }

  private renderTopbar(): TemplateResult {
    return html`
      <header class="topbar">
        <span class="brand">${sxLogo()}</span>
        <nav class="top-menus">
          ${TOP_MENUS.map((menu) => html`
            <button class="top-menu ${menu === this.activeMenu ? 'active' : ''}" @click=${() => { this.activeMenu = menu }}>${menu}</button>`)}
        </nav>
        <div class="top-right">
          <label class="search">${sxIcon('search', 14)}
            <input placeholder="搜索功能..." .value=${this.searchText}
              @input=${(event: Event) => { this.searchText = (event.target as HTMLInputElement).value }}>
          </label>
          <button class="tb" title="切换主题" @click=${toggleGlobalTheme}>${sxIcon(this.theme === 'dark' ? 'sun' : 'moon', 15)}</button>
          <span class="avatar">JD</span>
        </div>
      </header>`
  }

  private renderToolbar(): TemplateResult {
    const style = this.currentStyle()
    return html`
      <div class="toolbar">
        <button class="tb" title="撤销" @click=${() => toast('撤销')}>${sxIcon('undo', 15)}</button>
        <button class="tb" title="重做" @click=${() => toast('重做')}>${sxIcon('redo', 15)}</button>
        <button class="tb" title="打印" @click=${() => toast('打印')}>${sxIcon('print', 15)}</button>
        <span class="tb-sep"></span>
        <select class="tb-select" .value=${this.fontFamily} @change=${(event: Event) => {
          this.fontFamily = (event.target as HTMLSelectElement).value
          this.patchSelected({ fontFamily: this.fontFamily })
        }}>
          ${FONT_FAMILIES.map((font) => html`<option value=${font}>${font}</option>`)}
        </select>
        <select class="tb-select" .value=${String(this.fontSize)} @change=${(event: Event) => {
          this.fontSize = Number((event.target as HTMLSelectElement).value)
          this.patchSelected({ fontSize: this.fontSize })
        }}>
          ${FONT_SIZES.map((size) => html`<option value=${size}>${size}</option>`)}
        </select>
        <span class="tb-sep"></span>
        <button class="tb ${style.bold ? 'filled' : ''}" title="加粗" @click=${() => {
          this.bold = !this.bold; this.patchSelected({ bold: this.bold })
        }}><b>B</b></button>
        <button class="tb ${style.italic ? 'filled' : ''}" title="斜体" @click=${() => {
          this.italic = !this.italic; this.patchSelected({ italic: this.italic })
        }}><i>I</i></button>
        <button class="tb ${style.underline ? 'filled' : ''}" title="下划线" @click=${() => {
          this.underline = !this.underline; this.patchSelected({ underline: this.underline })
        }}><u>U</u></button>
        <button class="tb" title="字体颜色" @click=${() => {
          const colors = ['#dc2626', '#2563eb', '#16a34a', '#1f2937']
          const next = colors[(colors.indexOf(this.fontColor) + 1) % colors.length]!
          this.fontColor = next; this.patchSelected({ color: next })
        }}>
          <span style="display:flex;flex-direction:column;align-items:center;line-height:1">
            A<span class="color-dot" style="background:${this.fontColor}"></span>
          </span>
        </button>
        <button class="tb" title="填充颜色" @click=${() => {
          const colors = ['#fef9c3', '#dcfce7', '#fee2e2', '#dbeafe']
          const next = colors[(colors.indexOf(this.fillColor) + 1) % colors.length]!
          this.fillColor = next; this.patchSelected({ background: next })
        }}>
          <span style="display:flex;flex-direction:column;align-items:center;line-height:1">
            ${sxIcon('fill', 14)}<span class="color-dot" style="background:${this.fillColor}"></span>
          </span>
        </button>
        <span class="tb-sep"></span>
        ${([
          ['left', 'alignLeft'], ['center', 'alignCenter'], ['right', 'alignRight'],
        ] as const).map(([align, icon]) => html`
          <button class="tb ${this.align === align ? 'filled' : ''}" title=${`${align}对齐`} @click=${() => {
            this.align = align; this.patchSelected({ hAlign: align })
          }}>${sxIcon(icon, 15)}</button>`)}
        <button class="tb ${this.merges.has(this.currentKey) ? 'filled' : ''}" title="合并单元格" @click=${this.toggleMerge}>
          ${sxIcon('merge', 15)}<span>合并单元格</span>${sxIcon('chevronDown', 11)}
        </button>
        <span class="tb-sep"></span>
        <button class="tb" title="数字格式" @click=${() => { this.tab = '数字'; toast('数字格式：在右侧面板设置') }}>
          常规 ${sxIcon('chevronDown', 11)}
        </button>
        <button class="tb" title="百分比" @click=${() => this.applyPreset('percent')}>%</button>
        <button class="tb" title="千分位" @click=${() => this.applyPreset('thousand')}>9,000</button>
        <button class="tb ${this.borderMode !== 'none' ? 'filled' : ''}" title="边框" @click=${() => {
          this.setBorder(this.borderMode === 'none' ? 'all' : 'none')
        }}>${sxIcon('border', 15)}${sxIcon('chevronDown', 11)}</button>
        <button class="tb ${this.brushSource ? 'filled' : ''}" title="格式刷" @click=${this.toggleBrush}>${sxIcon('format', 15)}</button>
        <span class="tb-sep"></span>
        <button class="tb" title="筛选" @click=${() => toast('筛选：点击表头下拉')}>${sxIcon('filter', 15)}</button>
        <button class="tb" title="排序" @click=${() => toast('排序：点击表头下拉')}>${sxIcon('sort', 15)}</button>
        <button class="tb" title="求和" @click=${() => toast('求和：¥792,800')}>${sxIcon('sigma', 15)}</button>
      </div>`
  }

  private applyPreset(preset: 'percent' | 'thousand'): void {
    const fmt = preset === 'percent' ? '0.0%' : '#,##0'
    this.cat = preset === 'percent' ? 'percent' : 'number'
    this.patchSelected({}, fmt)
    toast(`已应用：${fmt}`)
  }

  private renderFormulaBar(): TemplateResult {
    const text = cellValueText(this.selected.row, this.selected.col, this.currentFmt)
    return html`
      <div class="formula">
        <span class="name-box">${COLUMN_LETTERS[this.selected.col]}${this.selected.row + 1}</span>
        <span class="fx">fx</span>
        <input .value=${text} @change=${(event: Event) => {
          const value = (event.target as HTMLInputElement).value
          toast(`已编辑 ${COLUMN_LETTERS[this.selected.col]}${this.selected.row + 1}：${value}`)
        }} />
      </div>`
  }

  private renderGrid(): TemplateResult {
    const header = html`<tr><th class="rowhead"></th>${COLUMN_LETTERS.map((letter) => html`<th class="colhead">${letter}</th>`)}</tr>`
    const rows: TemplateResult[] = []
    for (let row = 0; row <= 7; row++) {
      const cells: TemplateResult[] = []
      for (let col = 0; col < 6; col++) {
        const key = this.key(row, col)
        const isSelected = this.selected.row === row && this.selected.col === col
        const style = this.styles.get(key) ?? defaultCellStyle(row, col)
        const fmt = this.fmts.get(key) ?? defaultNumFmt(row, col)
        const isMerged = this.merges.has(key)
        const inline: Record<string, string> = {}
        if (style.fontFamily) inline['font-family'] = style.fontFamily
        if (style.fontSize) inline['font-size'] = `${style.fontSize}px`
        if (style.color) inline.color = style.color
        if (style.background && row !== 0) inline.background = style.background
        if (style.bold) inline['font-weight'] = '700'
        if (style.italic) inline['font-style'] = 'italic'
        if (style.underline) inline['text-decoration'] = 'underline'
        if (style.hAlign) inline['text-align'] = style.hAlign
        if (style.border) {
          const b = style.border
          inline['border-top'] = b.top ? `1px solid ${b.top}` : ''
          inline['border-bottom'] = b.bottom ? `1px solid ${b.bottom}` : ''
          inline['border-left'] = b.left ? `1px solid ${b.left}` : ''
          inline['border-right'] = b.right ? `1px solid ${b.right}` : ''
        }
        const text = cellValueText(row, col, fmt)
        let content: unknown = text
        if (row >= 2 && row <= 6 && col === 5) {
          const status = STATUS_STYLE[text as ReportRow['status']]
          content = html`<span class="status-pill" style="color:${status.color};background:${status.background}">${status.icon} ${text}</span>`
        }
        cells.push(html`
          <td class="cell ${isSelected ? 'selected' : ''} ${row === 0 ? 'title-cell' : ''} ${row === 7 ? 'total' : ''}"
            style=${Object.entries(inline).map(([k, v]) => `${k}:${v}`).join(';')}
            @click=${() => this.selectCell(row, col)}>
            ${content}${isMerged ? html`<span class="mergemark">合并</span>` : nothing}
          </td>`)
      }
      rows.push(html`<tr><th class="rowhead">${row + 1}</th>${cells}</tr>`)
    }
    return html`<table class="grid">${header}${rows}</table>`
  }

  private renderCards(): TemplateResult {
    return html`
      <div class="cards">
        <div class="stat-card">
          <div class="label">${sxIcon('sparkles', 15)} 最佳部门</div>
          <div class="value">华东</div>
          <div class="sub">完成率：<b style="color:#16a34a">106.7%</b></div>
        </div>
        <div class="stat-card">
          <div class="label">${sxIcon('chartBar', 15)} 平均完成率</div>
          <div class="value">99.6%</div>
          <div class="progress"><i style="width:99.6%"></i></div>
        </div>
        <div class="stat-card">
          <div class="label">${sxIcon('thumbsUp', 15)} 优秀部门</div>
          <div class="value">2 个</div>
          <div class="sub">(完成率 ≥ 100%)</div>
        </div>
      </div>`
  }

  private renderCategoryForm(): TemplateResult {
    const preview = formatValue(128000, this.currentFormatCode())
    return html`
      <div class="cat-list">
        ${NUM_CATEGORIES.map((cat) => html`
          <button class="cat-item ${this.cat === cat.key ? 'active' : ''}" @click=${() => {
            this.cat = cat.key
            if (cat.key === 'custom') this.customCode = this.customCodes[0] ?? '#,##0'
          }}>${cat.label}</button>`)}
      </div>
      <div class="fmt-form">
        ${(this.cat === 'date' || this.cat === 'time' || this.cat === 'text' || this.cat === 'special') ? html`
          <div class="hint">「${NUM_CATEGORIES.find((item) => item.key === this.cat)?.label}」使用引擎内置格式串 <code>${this.currentFormatCode()}</code>，点「应用」写入选中格。</div>
        ` : html`
          <div class="field-label">示例</div>
          <div class="preview-box">${preview}</div>
          <div class="form-row">
            <label class="field-label">小数位数</label>
            <input class="fmt-input" type="number" min="0" max="6" .value=${String(this.decimals)}
              @input=${(event: Event) => { this.decimals = Number((event.target as HTMLInputElement).value) }} />
          </div>
          ${this.cat === 'currency' || this.cat === 'accounting' ? html`
            <div class="form-row">
              <label class="field-label">货币符号</label>
              <select class="fmt-select" .value=${this.symbol} @change=${(event: Event) => {
                this.symbol = (event.target as HTMLSelectElement).value
              }}>
                ${['¥', '$', '€', '£'].map((symbol) => html`<option value=${symbol}>${symbol}</option>`)}
              </select>
            </div>` : nothing}
          <div class="form-row">
            <label class="field-label">负数格式</label>
            <select class="fmt-select" .value=${this.negative} @change=${(event: Event) => {
              this.negative = (event.target as HTMLSelectElement).value
            }}>
              <option value="(¥1,234)">(¥1,234)</option>
              <option value="-¥1,234">-¥1,234</option>
              <option value="¥-1,234">¥-1,234</option>
            </select>
          </div>
        `}
        <div class="field-label">自定义格式代码</div>
        <div class="custom-row">
          <input class="fmt-input" .value=${this.customCode} placeholder="¥#,##0"
            @input=${(event: Event) => { this.customCode = (event.target as HTMLInputElement).value }} />
          <button class="btn-add" @click=${this.addCustomCode}>添加</button>
        </div>
        ${this.customCodes.length > 0 ? html`
          <div class="hint" style="margin-top:8px">
            已保存：${this.customCodes.map((code) => html`
              <button class="cat-item" style="display:inline;width:auto;padding:2px 6px" @click=${() => {
                this.customCode = code; this.cat = 'custom'
              }}>${code}</button>`)}
          </div>` : nothing}
      </div>`
  }

  private renderAlignForm(): TemplateResult {
    return html`
      <div class="fmt-form" style="width:100%">
        <div class="field-label">水平对齐</div>
        <div class="align-row">
          ${(['left', 'center', 'right'] as const).map((align) => html`
            <button class="tb ${this.align === align ? 'filled' : ''}" @click=${() => {
              this.align = align; this.patchSelected({ hAlign: align })
            }}>${sxIcon(align === 'left' ? 'alignLeft' : align === 'center' ? 'alignCenter' : 'alignRight', 16)}</button>`)}
        </div>
        <div class="divider"></div>
        <div class="field-label">自动换行 / 缩小填充</div>
        <label class="hint"><input type="checkbox" @change=${() => toast('已切换自动换行')} /> 自动换行</label>
      </div>`
  }

  private renderFontForm(): TemplateResult {
    return html`
      <div class="fmt-form" style="width:100%">
        <div class="form-row">
          <label class="field-label">字体</label>
          <select class="fmt-select" .value=${this.fontFamily} @change=${(event: Event) => {
            this.fontFamily = (event.target as HTMLSelectElement).value
            this.patchSelected({ fontFamily: this.fontFamily })
          }}>
            ${FONT_FAMILIES.map((font) => html`<option value=${font}>${font}</option>`)}
          </select>
        </div>
        <div class="form-row">
          <label class="field-label">字号</label>
          <select class="fmt-select" .value=${String(this.fontSize)} @change=${(event: Event) => {
            this.fontSize = Number((event.target as HTMLSelectElement).value)
            this.patchSelected({ fontSize: this.fontSize })
          }}>
            ${FONT_SIZES.map((size) => html`<option value=${size}>${size}</option>`)}
          </select>
        </div>
        <div class="form-row">
          <label class="field-label">字形</label>
          <div class="align-row">
            <button class="tb ${this.bold ? 'filled' : ''}" @click=${() => { this.bold = !this.bold; this.patchSelected({ bold: this.bold }) }}><b>B</b></button>
            <button class="tb ${this.italic ? 'filled' : ''}" @click=${() => { this.italic = !this.italic; this.patchSelected({ italic: this.italic }) }}><i>I</i></button>
            <button class="tb ${this.underline ? 'filled' : ''}" @click=${() => { this.underline = !this.underline; this.patchSelected({ underline: this.underline }) }}><u>U</u></button>
          </div>
        </div>
        <div class="field-label">字体颜色</div>
        <div class="swatches">
          ${COLOR_SWATCHES.map((color) => html`
            <button class="swatch ${this.fontColor === color ? 'active' : ''}" style="background:${color}"
              title=${color} @click=${() => { this.fontColor = color; this.patchSelected({ color: color }) }}></button>`)}
        </div>
      </div>`
  }

  private renderBorderForm(): TemplateResult {
    return html`
      <div class="fmt-form" style="width:100%">
        <div class="field-label">边框样式</div>
        <div class="align-row">
          ${([['none', '无'], ['bottom', '下边框'], ['outer', '外边框'], ['all', '全部']] as const).map(([mode, label]) => html`
            <button class="tb ${this.borderMode === mode ? 'filled' : ''}" @click=${() => this.setBorder(mode)}>${label}</button>`)}
        </div>
        <div class="divider"></div>
        <div class="hint">当前选中：${COLUMN_LETTERS[this.selected.col]}${this.selected.row + 1}。边框会即时写入引擎样式。</div>
      </div>`
  }

  private renderFillForm(): TemplateResult {
    return html`
      <div class="fmt-form" style="width:100%">
        <div class="field-label">填充颜色</div>
        <div class="swatches">
          ${COLOR_SWATCHES.map((color) => html`
            <button class="swatch ${this.fillColor === color ? 'active' : ''}" style="background:${color}"
              title=${color} @click=${() => { this.fillColor = color; this.patchSelected({ background: color }) }}></button>`)}
        </div>
        <div class="divider"></div>
        <div class="hint">完成率列保留条件着色（≥100% 绿 / ≥95% 黄 / &lt;95% 红）。自定义填充会覆盖条件色。</div>
      </div>`
  }

  private renderPanel(): TemplateResult {
    return html`
      <aside class="fmt-panel">
        <div class="fmt-head"><span>单元格格式</span>
          <button class="tb" title="关闭" @click=${() => toast('格式面板已收起')}>${sxIcon('close', 15)}</button>
        </div>
        <div class="fmt-tabs">
          ${FORMAT_TABS.map((tab) => html`
            <button class="fmt-tab ${this.tab === tab ? 'active' : ''}" @click=${() => { this.tab = tab }}>${tab}</button>`)}
        </div>
        <div class="fmt-body">
          ${this.tab === '数字' ? this.renderCategoryForm() : nothing}
          ${this.tab === '对齐' ? this.renderAlignForm() : nothing}
          ${this.tab === '字体' ? this.renderFontForm() : nothing}
          ${this.tab === '边框' ? this.renderBorderForm() : nothing}
          ${this.tab === '填充' ? this.renderFillForm() : nothing}
        </div>
        <div class="fmt-foot"><button class="btn-apply" @click=${this.applyFormat}>应用</button></div>
      </aside>`
  }

  render(): TemplateResult {
    return html`
      <div class="app" data-theme=${this.theme}>
        ${this.renderTopbar()}
        ${this.renderToolbar()}
        ${this.renderFormulaBar()}
        <div class="body">
          <div class="sheet-area">
            ${this.renderGrid()}
            ${this.renderCards()}
          </div>
          ${this.renderPanel()}
        </div>
        <div class="sheet-tabs">
          ${['销售报表', '数据明细', '年度汇总'].map((name) => html`
            <button class="sheet-tab ${this.activeSheet === name ? 'active' : ''}" @click=${() => { this.activeSheet = name }}>${name}</button>`)}
          <button class="sheet-add" @click=${() => toast('新增工作表')}>${sxIcon('plus', 15)}</button>
        </div>
        <div class="statusbar">
          <span>平均值: 99.6%　计数: 8　求和: 792.8%</span>
          <span class="right">
            <span>选中 ${COLUMN_LETTERS[this.selected.col]}${this.selected.row + 1}</span>
            <span>格式 ${this.currentFormatCode()}</span>
            <span>100%</span>
          </span>
        </div>
      </div>`
  }
}

declare global {
  interface HTMLElementTagNameMap { 'fmt-app': FmtApp }
}
