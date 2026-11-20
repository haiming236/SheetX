/**
 * SheetX 第 11 张 · 工作簿与多工作表管理
 *
 * 展示：左侧多工作簿切换、底部多工作表标签、右键菜单（插入/删除/重命名/
 * 复制/移动/隐藏/颜色/保护等 11 项 + 颜色子菜单）、右侧工作表属性面板
 * （常规/保护/高级三 Tab，名称实时同步底部标签）、嵌入柱状趋势图。
 */
import { LitElement, html, nothing, type TemplateResult } from 'lit'
import { customElement } from 'lit/decorators/custom-element.js'
import { state } from 'lit/decorators/state.js'
import { sxIcon, sxLogo } from './icons.js'
import { lightTokens, baseStyles } from './tokens.js'
import { workbookStyles } from './workbook-styles.js'
import {
  WORKBOOKS, SHEET_MENU_ITEMS, SHEET_COLORS, TAG_COLORS, PROP_TABS, TOP_MENUS, COL_WIDTHS,
  type WorkbookDef, type SheetState,
} from './workbook-data.js'
import { toast } from './toast.js'

/** "¥128,000" → 128000 */
function parseNum(s: string): number {
  const n = Number(s.replace(/[¥,%\s]/g, '').replace(/,/g, ''))
  return Number.isFinite(n) ? n : 0
}

function fmtThousand(n: number): string {
  return n.toLocaleString('en-US')
}

@customElement('workbook-app')
export class WorkbookApp extends LitElement {
  static styles = [baseStyles, lightTokens, workbookStyles]

  @state() private workbooks: WorkbookDef[] = WORKBOOKS.map((w) => ({
    ...w, sheets: w.sheets.map((s) => ({ ...s })),
  }))
  @state() private activeWbKey = 'sales'
  @state() private activeSheet: Record<string, number> = { sales: 0, stock: 0, customer: 0, finance: 0 }
  @state() private propsOpen = true
  @state() private propTab = '常规'
  @state() private ctxMenu: { x: number; y: number } | null = null
  @state() private colorSubOpen = false
  @state() private tagColorOpen = false
  @state() private protectOn = false
  @state() private password = ''
  @state() private advFreeze = true
  @state() private advAutoCalc = true
  @state() private toast = ''

  private toastTimer: ReturnType<typeof setTimeout> | null = null

  disconnectedCallback(): void {
    super.disconnectedCallback()
    if (this.toastTimer) clearTimeout(this.toastTimer)
  }

  private get activeWb(): WorkbookDef {
    return this.workbooks.find((w) => w.key === this.activeWbKey) ?? this.workbooks[0]
  }

  private get curSheet(): SheetState {
    const wb = this.activeWb
    const idx = this.activeSheet[wb.key] ?? 0
    return wb.sheets[Math.min(idx, wb.sheets.length - 1)]
  }

  private get curSheetIdx(): number {
    const wb = this.activeWb
    return Math.min(this.activeSheet[wb.key] ?? 0, wb.sheets.length - 1)
  }

  /* ---------------- 交互 ---------------- */

  private showToast(msg: string): void {
    this.toast = msg
    if (this.toastTimer) clearTimeout(this.toastTimer)
    this.toastTimer = setTimeout(() => { this.toast = '' }, 2200)
  }

  private switchWorkbook = (key: string): void => {
    this.activeWbKey = key
    this.colorSubOpen = false
    this.tagColorOpen = false
  }

  private switchSheet = (idx: number): void => {
    this.activeSheet = { ...this.activeSheet, [this.activeWbKey]: idx }
  }

  private openCtx = (e: Event): void => {
    e.preventDefault()
    const me = e as MouseEvent
    const menuW = 168
    const menuH = 396
    const x = Math.min(me.clientX, window.innerWidth - menuW - 8)
    const y = Math.min(me.clientY, window.innerHeight - menuH - 8)
    this.ctxMenu = { x: Math.max(8, x), y: Math.max(8, y) }
    this.colorSubOpen = false
  }

  private closeCtx = (): void => {
    this.ctxMenu = null
    this.colorSubOpen = false
  }

  private handleMenuAction = (action: string, e: Event): void => {
    e.stopPropagation()
    const wb = this.activeWb
    const idx = this.curSheetIdx
    const sheets = wb.sheets
    switch (action) {
      case 'insert': {
        let n = sheets.length + 1
        while (sheets.some((s) => s.name === `工作表${n}`)) n += 1
        sheets.splice(idx + 1, 0, { name: `工作表${n}`, color: '', hidden: false })
        this.activeSheet = { ...this.activeSheet, [wb.key]: idx + 1 }
        this.showToast(`已插入工作表「工作表${n}」`)
        break
      }
      case 'delete': {
        if (sheets.length <= 1) { this.showToast('至少保留一个工作表'); break }
        const name = sheets[idx].name
        sheets.splice(idx, 1)
        this.activeSheet = { ...this.activeSheet, [wb.key]: Math.min(idx, sheets.length - 1) }
        this.showToast(`已删除工作表「${name}」`)
        break
      }
      case 'rename': {
        this.propsOpen = true
        this.propTab = '常规'
        this.closeCtx()
        requestAnimationFrame(() => {
          this.shadowRoot?.querySelector<HTMLInputElement>('.pp-input')?.focus()
        })
        return
      }
      case 'copy': {
        const src = sheets[idx]
        let n = 2
        while (sheets.some((s) => s.name === `${src.name}(${n})`)) n += 1
        sheets.splice(idx + 1, 0, { ...src, name: `${src.name}(${n})` })
        this.activeSheet = { ...this.activeSheet, [wb.key]: idx + 1 }
        this.showToast(`已复制为「${src.name}(${n})」`)
        break
      }
      case 'move':
        this.showToast('移动或复制：可在弹出对话框中选择目标工作簿（演示）')
        break
      case 'hide': {
        const visibleCount = sheets.filter((s) => !s.hidden).length
        if (!sheets[idx].hidden && visibleCount <= 1) { this.showToast('至少保留一个可见工作表'); break }
        sheets[idx].hidden = true
        this.showToast(`已隐藏「${sheets[idx].name}」`)
        break
      }
      case 'unhide': {
        const hidden = sheets.filter((s) => s.hidden).length
        if (hidden === 0) { this.showToast('没有已隐藏的工作表'); break }
        sheets.forEach((s) => { s.hidden = false })
        this.showToast(`已取消隐藏 ${hidden} 个工作表`)
        break
      }
      case 'color':
        this.colorSubOpen = !this.colorSubOpen
        return
      case 'protect':
        this.propsOpen = true
        this.propTab = '保护'
        this.closeCtx()
        return
      case 'selectAll':
        this.showToast('已选定全部工作表（演示）')
        break
      case 'manage':
        this.propsOpen = true
        this.propTab = '常规'
        break
    }
    this.requestUpdate()
    this.closeCtx()
  }

  private pickSheetColor = (color: string, e: Event): void => {
    e.stopPropagation()
    this.curSheet.color = color
    this.colorSubOpen = false
    this.ctxMenu = null
    this.requestUpdate()
  }

  private setSheetName = (name: string): void => {
    this.curSheet.name = name
    this.requestUpdate()
  }

  private toggleVisibility = (): void => {
    const sheets = this.activeWb.sheets
    const visibleCount = sheets.filter((s) => !s.hidden).length
    if (!this.curSheet.hidden && visibleCount <= 1) { this.showToast('至少保留一个可见工作表'); return }
    this.curSheet.hidden = !this.curSheet.hidden
    this.requestUpdate()
  }

  private pickTagColor = (color: string, e: Event): void => {
    e.stopPropagation()
    this.curSheet.color = color
    this.tagColorOpen = false
    this.requestUpdate()
  }

  /* ---------------- 渲染 ---------------- */

  render(): TemplateResult {
    const wb = this.activeWb
    return html`
      <div class="app" @click=${this.closeCtx}>
        ${this.renderTopbar()}
        ${this.renderToolbar()}
        <div class="body">
          ${this.renderWorkbookPanel()}
          <div class="grid-area" @contextmenu=${this.openCtx}>
            ${this.renderFormulaBar()}
            <div class="grid-scroll">${this.renderSheet(wb)}</div>
            <div class="h-scrollbar"><span class="track"></span><span class="thumb"></span></div>
          </div>
          ${this.propsOpen ? this.renderPropsPanel(wb) : ''}
        </div>
        ${this.renderSheetTabs()}
        ${this.renderStatusbar(wb)}
        ${this.ctxMenu ? this.renderCtxMenu() : ''}
        ${this.toast ? html`<div class="toast">${this.toast}</div>` : nothing}
      </div>
    `
  }

  private renderTopbar(): TemplateResult {
    return html`
      <header class="topbar">
        <span class="brand">${sxLogo()}</span>
        <nav class="top-menus">
          ${TOP_MENUS.map((m, i) => html`
            <button class="top-menu ${i === 1 ? 'active' : ''}" @click=${() => toast(`菜单：${m}`)}>${m}</button>
          `)}
        </nav>
        <div class="top-right">
          <label class="search">
            ${sxIcon('search', 15)}
            <input placeholder="搜索功能..." />
          </label>
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
      </div>
    `
  }

  private renderWorkbookPanel(): TemplateResult {
    return html`
      <aside class="wb-panel">
        <div class="wb-head">
          <span>工作簿</span>
          <button class="wb-add" title="新建工作簿" @click=${() => this.showToast('新建工作簿（演示）')}>${sxIcon('plus', 15)}</button>
        </div>
        ${this.workbooks.map((w) => html`
          <button
            class="wb-item ${this.activeWbKey === w.key ? 'active' : ''}"
            @click=${() => this.switchWorkbook(w.key)}
            title="${w.name}"
          >
            <span class="wb-icon">X</span>
            <span class="wb-name">${w.name}</span>
          </button>
        `)}
      </aside>
    `
  }

  private renderFormulaBar(): TemplateResult {
    return html`
      <div class="formula-bar">
        <span class="fx-badge">fx</span>
        <span class="fx-badge">fx</span>
        <span class="formula-input">${this.curSheet.name}统计</span>
      </div>
    `
  }

  private renderSheet(wb: WorkbookDef): TemplateResult {
    const widths = [36, ...COL_WIDTHS]
    const letters = ['A', 'B', 'C', 'D', 'E', 'F']
    return html`
      <table class="sheet">
        <colgroup>${widths.map((w) => html`<col style="width:${w}px" />`)}</colgroup>
        <tbody>
          <tr>
            <th class="corner"></th>
            ${letters.map((c) => html`<th class="col-head">${c}</th>`)}
          </tr>
          <tr>
            <th class="row-head">1</th>
            <td class="banner" .colSpan=${5}>
              <span class="bi">${sxIcon('chartBar', 18)}</span>${wb.title}
            </td>
            <td></td>
          </tr>
          <tr>
            <th class="row-head">2</th>
            ${wb.columns.map((c) => html`<th class="h2">${c}</th>`)}
            <td></td>
          </tr>
          ${wb.rows.map((row, i) => html`
            <tr>
              <th class="row-head">${i + 3}</th>
              ${row.map((v) => html`<td>${v}</td>`)}
              <td></td>
            </tr>
          `)}
          <tr>
            <th class="row-head">8</th>
            ${wb.totalRow.map((v) => html`
              <td class="total">${v === '—' ? html`<span class="dash">—</span>` : v}</td>
            `)}
            <td></td>
          </tr>
          <tr>
            <th class="row-head">9</th>
            <td class="chart-cell" .colSpan=${5} .rowSpan=${8}>
              <div class="chart-title">${wb.chartTitle}</div>
              <div class="chart-wrap">${this.renderChart(wb)}</div>
            </td>
            <td></td>
          </tr>
          ${Array.from({ length: 7 }, (_, i) => html`
            <tr><th class="row-head">${i + 10}</th><td></td></tr>
          `)}
        </tbody>
      </table>
    `
  }

  /** 手写 SVG 柱状趋势图（零依赖） */
  private renderChart(wb: WorkbookDef): TemplateResult {
    const values = wb.rows.map((r) => parseNum(String(r[wb.chartValueCol])))
    const labels = wb.rows.map((r) => String(r[0]))
    const step = 50000
    const maxV = Math.max(step, Math.ceil(Math.max(...values) * 1.2 / step) * step)
    const W = 470
    const H = 168
    const plotL = 58
    const plotR = W - 14
    const plotT = 14
    const plotB = H - 26
    const band = (plotR - plotL) / values.length
    const barW = 42
    const yOf = (v: number) => plotB - (v / maxV) * (plotB - plotT)
    const bars = values.map((v, i) => {
      const x = plotL + band * i + (band - barW) / 2
      const y = yOf(v)
      return { x, y, v, label: labels[i], cx: plotL + band * i + band / 2 }
    })
    return html`
      <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
        ${Array.from({ length: 6 }, (_, i) => {
          const v = (maxV / 5) * i
          const y = yOf(v)
          return html`
            <line x1="${plotL}" y1="${y}" x2="${plotR}" y2="${y}" style="stroke:var(--sx-grid-line)" stroke-width="1" />
            <text x="${plotL - 8}" y="${y + 3.5}" text-anchor="end" font-size="10" style="fill:var(--sx-text-hint)">${fmtThousand(v)}</text>
          `
        })}
        ${bars.map((b) => html`
          <rect x="${b.x}" y="${b.y}" width="${barW}" height="${plotB - b.y}" rx="3" fill="#3b82f6" />
          <text x="${b.cx}" y="${b.y - 5}" text-anchor="middle" font-size="9.5" font-weight="600" style="fill:var(--sx-text-primary)">${fmtThousand(b.v)}</text>
          <text x="${b.cx}" y="${plotB + 15}" text-anchor="middle" font-size="11" style="fill:var(--sx-text-secondary)">${b.label}</text>
        `)}
      </svg>
    `
  }

  private renderPropsPanel(wb: WorkbookDef): TemplateResult {
    const sheet = this.curSheet
    return html`
      <aside class="props-panel" @click=${(e: Event) => e.stopPropagation()} @contextmenu=${(e: Event) => e.preventDefault()}>
        <div class="pp-head">
          <span class="ic">${sxIcon('tableStyle', 17)}</span>
          <span class="tt">工作表属性</span>
          <button class="pp-close" title="关闭" @click=${() => { this.propsOpen = false }}>${sxIcon('close', 16)}</button>
        </div>
        <div class="pp-tabs">
          ${PROP_TABS.map((t) => html`
            <button class="pp-tab ${this.propTab === t ? 'on' : ''}" @click=${() => { this.propTab = t }}>${t}</button>
          `)}
        </div>
        ${this.propTab === '常规' ? this.renderPropGeneral(sheet) : ''}
        ${this.propTab === '保护' ? this.renderPropProtect() : ''}
        ${this.propTab === '高级' ? this.renderPropAdvanced(wb) : ''}
        <button class="pp-help" @click=${() => this.showToast('查看使用帮助（演示）')}>
          ${sxIcon('help', 14)} 查看使用帮助
        </button>
      </aside>
    `
  }

  private renderPropGeneral(sheet: SheetState): TemplateResult {
    return html`
      <div class="pp-field">
        <label class="pp-label">工作表名称</label>
        <input class="pp-input" .value=${sheet.name} @input=${(e: InputEvent) => this.setSheetName((e.target as HTMLInputElement).value)} />
      </div>
      <div class="pp-field pp-row">
        <label class="pp-label">标签颜色</label>
        <div class="sel-wrap" @click=${(e: Event) => e.stopPropagation()}>
          <button class="color-dot-btn" @click=${() => { this.tagColorOpen = !this.tagColorOpen }}>
            <span class="color-dot ${sheet.color ? '' : 'none'}" style="background:${sheet.color || 'transparent'}"></span>
            <span class="caret">${sxIcon('chevronDown', 11)}</span>
          </button>
          ${this.tagColorOpen ? html`
            <div class="color-sub" style="position:absolute; right:16px; margin-top:4px;">
              ${TAG_COLORS.map((c) => html`
                <button class="color-opt" @click=${(e: Event) => this.pickTagColor(c.value, e)}>
                  <span class="ck">${sheet.color === c.value ? sxIcon('check', 12) : ''}</span>
                  <span class="color-dot ${c.value ? '' : 'none'}" style="background:${c.value || 'transparent'}"></span>
                  ${c.label}
                </button>
              `)}
            </div>
          ` : ''}
        </div>
      </div>
      <div class="pp-field pp-row">
        <label class="pp-label">可见性</label>
        <span class="pp-visible">
          <button class="switch ${sheet.hidden ? '' : 'on'}" role="switch" @click=${this.toggleVisibility}><span class="knob"></span></button>
          ${sheet.hidden ? '隐藏' : '可见'}
        </span>
      </div>
      <div class="pp-field">
        <label class="pp-label">保护工作表</label>
        <p class="pp-hint">防止编辑此工作表</p>
        <div class="protect-row">
          <span class="pr-ic">${sxIcon('lock', 14)}</span>
          <button class="pr-btn" @click=${() => { this.propTab = '保护' }}>设置密码</button>
          <input class="pp-input pwd-input" type="password" placeholder="请输入密码..." .value=${this.password}
            @input=${(e: InputEvent) => { this.password = (e.target as HTMLInputElement).value }} />
        </div>
      </div>
      <div class="pp-info">
        <label class="pp-label">工作表信息</label>
        <div class="info-line"><span class="k">行数:</span><span class="v">${this.activeWb.info.rows}</span></div>
        <div class="info-line"><span class="k">列数:</span><span class="v">${this.activeWb.info.cols}</span></div>
        <div class="info-line"><span class="k">大小:</span><span class="v">${this.activeWb.info.size}</span></div>
      </div>
    `
  }

  private renderPropProtect(): TemplateResult {
    return html`
      <div class="pp-field pp-row">
        <label class="pp-label">保护工作表</label>
        <button class="switch ${this.protectOn ? 'on' : ''}" role="switch" @click=${() => { this.protectOn = !this.protectOn }}>
          <span class="knob"></span>
        </button>
      </div>
      <p class="pp-hint" style="margin-bottom:14px">开启后，除明确授权的用户外，其他用户无法修改单元格内容或格式。</p>
      <div class="pp-field">
        <label class="pp-label">保护密码</label>
        <input class="pp-input" type="password" placeholder="请输入密码..." .value=${this.password}
          @input=${(e: InputEvent) => { this.password = (e.target as HTMLInputElement).value }} />
      </div>
      <div class="pp-field">
        <label class="pp-label">允许此用户编辑</label>
        <p class="pp-hint">逗号分隔的用户名，留空表示仅管理员可编辑</p>
        <input class="pp-input" placeholder="例如：JD, admin" />
      </div>
    `
  }

  private renderPropAdvanced(wb: WorkbookDef): TemplateResult {
    return html`
      <div class="pp-field">
        <label class="pp-label">工作表信息</label>
        <div class="info-line"><span class="k">工作簿:</span><span class="v">${wb.name}</span></div>
        <div class="info-line"><span class="k">行数:</span><span class="v">${wb.info.rows}</span></div>
        <div class="info-line"><span class="k">列数:</span><span class="v">${wb.info.cols}</span></div>
        <div class="info-line"><span class="k">大小:</span><span class="v">${wb.info.size}</span></div>
      </div>
      <div class="pp-field pp-row">
        <label class="pp-label">冻结首行</label>
        <button class="switch ${this.advFreeze ? 'on' : ''}" role="switch" @click=${() => { this.advFreeze = !this.advFreeze }}><span class="knob"></span></button>
      </div>
      <div class="pp-field pp-row">
        <label class="pp-label">自动重算公式</label>
        <button class="switch ${this.advAutoCalc ? 'on' : ''}" role="switch" @click=${() => { this.advAutoCalc = !this.advAutoCalc }}><span class="knob"></span></button>
      </div>
    `
  }

  private renderSheetTabs(): TemplateResult {
    const wb = this.activeWb
    return html`
      <div class="sheet-tabs">
        <button class="tab-add" title="插入工作表" @click=${(e: Event) => this.handleMenuAction('insert', e)}>${sxIcon('plus', 15)}</button>
        ${wb.sheets.map((s, i) => html`
          <button
            class="sheet-tab ${i === this.curSheetIdx ? 'on' : ''} ${s.hidden ? 'hidden-sheet' : ''}"
            @click=${() => this.switchSheet(i)}
            title="${s.name}${s.hidden ? '（已隐藏）' : ''}"
          >
            ${s.color ? html`<span class="tab-color" style="background:${s.color}"></span>` : ''}
            ${s.name}
            ${s.hidden ? html`<span class="tab-eye">${sxIcon('eye', 12)}</span>` : ''}
          </button>
        `)}
        <button class="tab-add" title="更多" style="width:auto;padding:0 8px" @click=${() => this.showToast('更多工作表操作请右键表格区域')}>${sxIcon('more', 15)}</button>
      </div>
    `
  }

  private renderStatusbar(wb: WorkbookDef): TemplateResult {
    return html`
      <footer class="statusbar">
        <div class="status-stats">
          <span>平均值: ${wb.stats.avg}</span>
          <span>计数: ${wb.stats.count}</span>
          <span>求和: ${wb.stats.sum}</span>
        </div>
        <div class="zoom">
          <button title="缩小" @click=${() => toast('缩小视图')} >${sxIcon('zoomOut', 14)}</button>
          <span>100%</span>
          <button title="放大" @click=${() => toast('放大视图')} >${sxIcon('zoomIn', 14)}</button>
        </div>
        <button class="tab-add" title="全屏" @click=${() => toast('全屏')} >${sxIcon('fullscreen', 14)}</button>
      </footer>
    `
  }

  private renderCtxMenu(): TemplateResult {
    const { x, y } = this.ctxMenu!
    const sheet = this.curSheet
    return html`
      <div
        class="ctx-menu"
        style="left:${x}px; top:${y}px"
        @click=${(e: Event) => e.stopPropagation()}
        @contextmenu=${(e: Event) => e.preventDefault()}
      >
        ${SHEET_MENU_ITEMS.map((item) => html`
          <button
            class="ctx-item ${item.action === 'color' && this.colorSubOpen ? 'active' : ''}"
            @click=${(e: Event) => this.handleMenuAction(item.action, e)}
          >
            <span class="ci">${sxIcon(item.icon, 15)}</span>
            <span>${item.label}</span>
            ${item.submenu ? html`<span class="arr">${sxIcon('chevronRight', 13)}</span>` : ''}
          </button>
        `)}
      </div>
      ${this.colorSubOpen ? html`
        <div
          class="color-sub"
          style="left:${x + 170}px; top:${y + 216}px"
          @click=${(e: Event) => e.stopPropagation()}
        >
          ${SHEET_COLORS.map((c) => html`
            <button class="color-opt" @click=${(e: Event) => this.pickSheetColor(c.value, e)}>
              <span class="ck">${sheet.color === c.value ? sxIcon('check', 12) : ''}</span>
              <span class="color-dot" style="background:${c.value}"></span>
              ${c.label}
            </button>
          `)}
          <div class="more-colors">更多颜色...</div>
        </div>
      ` : ''}
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'workbook-app': WorkbookApp
  }
}
