/**
 * SheetX 数据导入与导出界面（第 07 张设计稿）
 *
 * 纯 UI 外壳：展示 Excel/CSV/JSON 文件导入、字段映射、预览、格式选择与导出配置。
 * 引擎接入后由 @sheetx/io 驱动真实解析、映射与导出。
 */
import { LitElement, html, type TemplateResult } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { baseStyles, lightTokens } from './tokens.js'
import { bindPageTheme, toggleTheme as toggleGlobalTheme } from './theme.js'
import { ioStyles } from './io-styles.js'
import { sxIcon, sxLogo } from './icons.js'
import {
  ioNavMenus, ioToolbar, fileTypes, importSteps, filePool,
  defaultImportOptions, defaultMapping, mappingTargets, previewRows,
  exportFormats, exportScopes, bgColumns, bgRows, ioStats, ioSheetTabs,
  type ImportOption, type MappingRow,
} from './io-data.js'
import { toast } from './toast.js'

@customElement('io-app')
export class IoApp extends LitElement {
  static styles = [baseStyles, lightTokens, ioStyles]

  @state() private theme: 'light' | 'dark' = 'light'
  @state() private activeMenu = '数据'
  @state() private activeSheet = '销售数据'
  @state() private modalOpen = true
  @state() private activeStep = 0
  @state() private activeFileType = 'excel'
  @state() private pickedIndex = 0
  @state() private pickedVisible = true
  @state() private importOptions: ImportOption[] = defaultImportOptions.map(o => ({ ...o }))
  @state() private mapping: MappingRow[] = defaultMapping.map(m => ({ ...m }))
  @state() private openMapIndex: number | null = null
  @state() private selectedFormat = 'xlsx'
  @state() private selectedScope = '当前工作表'
  @state() private advOpen = false
  @state() private advKeepHeader = true
  @state() private advUtf8 = true
  @state() private selectedCell: { row: number; col: number } | null = null
  @state() private zoom = 100
  @state() private viewMode: 'grid' | 'list' = 'grid'

  render() {
    return html`
      <div class="app" data-theme=${this.theme}>
        ${this.renderTopbar()}
        ${this.renderToolbar()}
        <div class="body">
          <div class="grid-area">
            ${this.renderSheet()}
            ${this.modalOpen ? this.renderModal() : ''}
          </div>
          ${this.renderExportPanel()}
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
          ${ioNavMenus.map(menu => html`
            <button
              class="nav-item ${menu === this.activeMenu ? 'active' : ''}"
              @click=${() => { this.activeMenu = menu }}
            >${menu}</button>
          `)}
        </nav>
        <div class="topbar-right">
          <div class="search-box">
            ${sxIcon('search', 14)}
            <input placeholder="搜索数据..." />
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

  // ---------- 工具栏 ----------
  private renderToolbar(): TemplateResult {
    return html`
      <div class="toolbar">
        ${ioToolbar.map(item => html`
          <button
            class="tool-item ${item.active ? 'active' : ''}"
            @click=${() => this.handleToolbar(item)}
          >
            ${sxIcon(item.icon, 15)}
            <span>${item.label}</span>
            ${item.caret ? html`<span class="caret">${sxIcon('chevronDown', 11)}</span>` : ''}
          </button>
        `)}
      </div>
    `
  }

  private handleToolbar(item: (typeof ioToolbar)[number]): void {
    if (item.action === 'openImport') this.modalOpen = true
  }

  // ---------- 背景表格 ----------
  private renderSheet(): TemplateResult {
    return html`
      <table class="bg-sheet" style="transform:scale(${this.zoom / 100});transform-origin:top left">
        <colgroup>
          <col style="width:40px" />
          ${bgColumns.map(col => html`<col style="width:${col.width}px" />`)}
        </colgroup>
        <thead>
          <tr>
            <th class="corner"></th>
            ${bgColumns.map((_, i) => html`<th>${String.fromCharCode(65 + i)}</th>`)}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th class="row-head">1</th>
            ${bgColumns.map(col => html`
              <td class="cell head-cell ${col.accent ? 'accent' : ''}">${col.title}</td>
            `)}
          </tr>
          ${bgRows.map((row, ri) => html`
            <tr>
              <th class="row-head">${ri + 2}</th>
              <td class="cell">${ri + 1}</td>
              <td class="cell ${this.isSelected(ri, 1) ? 'selected' : ''}"
                  @click=${() => { this.selectedCell = { row: ri, col: 1 } }}>${row.id}</td>
              <td class="cell ${this.isSelected(ri, 2) ? 'selected' : ''}"
                  @click=${() => { this.selectedCell = { row: ri, col: 2 } }}>${row.customer}</td>
              <td class="cell ${this.isSelected(ri, 3) ? 'selected' : ''}"
                  @click=${() => { this.selectedCell = { row: ri, col: 3 } }}>${row.date}</td>
              <td class="cell num ${this.isSelected(ri, 4) ? 'selected' : ''}"
                  @click=${() => { this.selectedCell = { row: ri, col: 4 } }}>${row.amount}</td>
              <td class="cell ${this.isSelected(ri, 5) ? 'selected' : ''}"
                  @click=${() => { this.selectedCell = { row: ri, col: 5 } }}>
                <span class="tag ${row.status === '已发货' ? 'shipped' : 'pending'}">${row.status}</span>
              </td>
            </tr>
          `)}
        </tbody>
      </table>
    `
  }

  private isSelected(ri: number, ci: number): boolean {
    const sel = this.selectedCell
    return !!sel && sel.row === ri && sel.col === ci
  }

  // ---------- 数据导入弹窗 ----------
  private renderModal(): TemplateResult {
    const pickedName = filePool[this.pickedIndex]
    return html`
      <div class="modal">
        <div class="modal-head">
          <span class="cloud">${sxIcon('cloudUpload', 21)}</span>
          <span class="title">数据导入</span>
          <button class="icon-btn" title="关闭" @click=${() => { this.modalOpen = false }}>${sxIcon('close', 15)}</button>
        </div>
        <div class="modal-body">
          ${this.renderFileTypes()}
          <div class="modal-main">
            <div class="modal-row">
              <div class="upload-col">
                ${this.renderSteps()}
                ${this.renderUploadZone()}
                ${this.pickedVisible ? this.renderPickedFile(pickedName) : ''}
              </div>
              ${this.renderMappingCard()}
            </div>
            <div class="modal-row">
              ${this.renderImportOptions()}
              ${this.renderPreviewCard()}
            </div>
            <div class="modal-foot">
              <button class="btn" @click=${() => { this.modalOpen = false }}>取消</button>
              <button class="btn primary" @click=${this.startImport}>${sxIcon('upload', 14)}开始导入</button>
            </div>
          </div>
        </div>
      </div>
    `
  }

  private renderFileTypes(): TemplateResult {
    return html`
      <div class="file-list">
        ${fileTypes.map(ft => html`
          <button
            class="file-type ${this.activeFileType === ft.key ? 'active' : ''}"
            @click=${() => { this.activeFileType = ft.key }}
          >
            ${ft.badge ? html`<span class="badge ${ft.badge}">${this.badgeText(ft.badge)}</span>` : ''}
            ${ft.icon ? html`<span class="linear-icon">${sxIcon(ft.icon, 20)}</span>` : ''}
            <span class="ft-text">
              <span class="ft-name">${ft.name}</span>
              ${ft.sub ? html`<span class="ft-sub">${ft.sub}</span>` : ''}
            </span>
          </button>
        `)}
      </div>
    `
  }

  private badgeText(badge: string): string {
    if (badge === 'excel') return 'X'
    if (badge === 'csv') return 'CSV'
    if (badge === 'json') return '{ }'
    if (badge === 'pdf') return 'PDF'
    return ''
  }

  private renderSteps(): TemplateResult {
    return html`
      <div class="steps">
        ${importSteps.map((label, i) => html`
          ${i > 0 ? html`<span class="step-link"></span>` : ''}
          <button
            class="step ${i === this.activeStep ? 'active' : ''}"
            @click=${() => { this.activeStep = i }}
          >
            <span class="step-dot">${i + 1}</span>${label}
          </button>
        `)}
      </div>
    `
  }

  private renderUploadZone(): TemplateResult {
    return html`
      <div class="upload-zone">
        <span class="badge excel lg">X</span>
        <div class="uz-main">拖拽文件到此处，或<span class="link" @click=${this.pickFile}>点击选择文件</span></div>
        <div class="uz-sub">支持 Excel、CSV、JSON 格式，文件大小不超过 10MB</div>
        <button class="pick-btn" @click=${this.pickFile}>${sxIcon('folder', 14)}选择文件</button>
      </div>
    `
  }

  private renderPickedFile(name: string): TemplateResult {
    return html`
      <div class="picked-file">
        <span class="ok">${sxIcon('checkCircle', 15)}</span>
        <span class="name">${name}</span>
        <span class="size">245 KB</span>
        <button class="remove" title="移除文件" @click=${() => { this.pickedVisible = false }}>${sxIcon('close', 13)}</button>
      </div>
    `
  }

  private renderMappingCard(): TemplateResult {
    return html`
      <div class="mapping-card">
        <div class="card-head">
          <span class="title">字段映射</span>
          <button class="smart-btn" title="智能匹配字段" @click=${() => toast('智能匹配字段')} >${sxIcon('sparkles', 13)}智能匹配</button>
        </div>
        <table class="map-table">
          <colgroup>
            <col style="width:27%" />
            <col style="width:34%" />
            <col style="width:39%" />
          </colgroup>
          <thead>
            <tr><th>字段列</th><th>示例值</th><th>映射到字段</th></tr>
          </thead>
          <tbody>
            ${this.mapping.map((row, i) => html`
              <tr>
                <td>${row.field}</td>
                <td>${row.sample}</td>
                <td>
                  <div
                    class="map-select"
                    @click=${() => { this.openMapIndex = this.openMapIndex === i ? null : i }}
                  >
                    <span class="mi">${sxIcon(row.icon, 12)}</span>
                    <span class="mt">${row.target}</span>
                    <span class="caret">${sxIcon('chevronDown', 11)}</span>
                    ${this.openMapIndex === i ? this.renderMapMenu(i) : ''}
                  </div>
                </td>
              </tr>
            `)}
          </tbody>
        </table>
      </div>
    `
  }

  private renderMapMenu(i: number): TemplateResult {
    return html`
      <div class="map-menu">
        ${mappingTargets.map(t => html`
          <div
            class="opt ${this.mapping[i].target === t ? 'selected' : ''}"
            @click=${(e: Event) => {
              e.stopPropagation()
              this.mapping = this.mapping.map((m, mi) => mi === i ? { ...m, target: t } : m)
              this.openMapIndex = null
            }}
          >${t}</div>
        `)}
      </div>
    `
  }

  private renderImportOptions(): TemplateResult {
    return html`
      <div class="import-opts">
        <div class="opts-title" style="margin-bottom:6px">导入选项</div>
        ${this.importOptions.map((opt, i) => html`
          <button
            class="opt-row ${opt.checked ? 'checked' : ''}"
            @click=${() => {
              this.importOptions = this.importOptions.map((o, oi) =>
                oi === i ? { ...o, checked: !o.checked } : o)
            }}
          >
            <span class="box">${opt.checked ? sxIcon('check', 11) : ''}</span>${opt.label}
          </button>
        `)}
      </div>
    `
  }

  private renderPreviewCard(): TemplateResult {
    return html`
      <div class="preview-card">
        <div class="preview-head">
          <span class="title">数据预览（前 5 行）</span>
          <button class="view-all" @click=${() => toast('查看全部映射字段')}>查看全部 ${sxIcon('arrowRight', 12)}</button>
        </div>
        <table class="pv-table">
          <colgroup>
            <col style="width:20%" />
            <col style="width:24%" />
            <col style="width:19%" />
            <col style="width:16%" />
            <col style="width:21%" />
          </colgroup>
          <thead>
            <tr>
              <th>订单编号</th><th>客户名称</th><th>订单日期</th><th style="text-align:right">金额</th><th>状态</th>
            </tr>
          </thead>
          <tbody>
            ${previewRows.map(row => html`
              <tr>
                <td>${row.id}</td>
                <td>${row.customer}</td>
                <td>${row.date}</td>
                <td class="num">${row.amount}</td>
                <td><span class="tag ${row.status === '已发货' ? 'shipped' : 'pending'}">${row.status}</span></td>
              </tr>
            `)}
          </tbody>
        </table>
      </div>
    `
  }

  private pickFile(): void {
    this.pickedIndex = (this.pickedIndex + 1) % filePool.length
    this.pickedVisible = true
  }

  private startImport(): void {
    // UI 外壳：引擎接入后由 @sheetx/io 执行解析 → 映射 → 写入
    this.activeStep = 2
  }

  // ---------- 右侧数据导出面板 ----------
  private renderExportPanel(): TemplateResult {
    return html`
      <aside class="export-panel">
        <div class="export-head">
          <span class="dl">${sxIcon('download', 17)}</span>
          <span class="title">数据导出</span>
          <button class="icon-btn" title="关闭" @click=${() => toast('关闭')} >${sxIcon('close', 14)}</button>
        </div>
        <div class="sec-label">导出格式</div>
        <div class="fmt-list">
          ${exportFormats.map(fmt => html`
            <button
              class="fmt-card ${this.selectedFormat === fmt.key ? 'active' : ''}"
              @click=${() => { this.selectedFormat = fmt.key }}
            >
              ${fmt.badge === 'img'
                ? html`<span class="badge img">${sxIcon('image', 14)}</span>`
                : html`<span class="badge ${fmt.badge}">${this.badgeText(fmt.badge)}</span>`}
              <span class="fmt-text">
                <span class="fmt-name">${fmt.name}</span>
                <span class="fmt-sub">${fmt.sub}</span>
              </span>
            </button>
          `)}
        </div>
        <div class="sec-label">导出范围</div>
        ${exportScopes.map(scope => html`
          <button
            class="radio-row ${this.selectedScope === scope ? 'checked' : ''}"
            @click=${() => { this.selectedScope = scope }}
          >
            <span class="radio"></span>${scope}
          </button>
        `)}
        <button class="adv-row ${this.advOpen ? 'open' : ''}" @click=${() => { this.advOpen = !this.advOpen }}>
          高级设置
          <span class="caret">${sxIcon('chevronDown', 13)}</span>
        </button>
        ${this.advOpen ? html`
          <div class="adv-body">
            <button
              class="opt-row ${this.advKeepHeader ? 'checked' : ''}"
              @click=${() => { this.advKeepHeader = !this.advKeepHeader }}
            ><span class="box">${this.advKeepHeader ? sxIcon('check', 11) : ''}</span>包含表头行</button>
            <button
              class="opt-row ${this.advUtf8 ? 'checked' : ''}"
              @click=${() => { this.advUtf8 = !this.advUtf8 }}
            ><span class="box">${this.advUtf8 ? sxIcon('check', 11) : ''}</span>使用 UTF-8 编码</button>
          </div>
        ` : ''}
        <button class="export-btn" title="导出文件" @click=${() => this.doExport()}>${sxIcon('download', 15)}导出文件</button>
      </aside>
    `
  }

  // ---------- 真实导出 ----------
  private doExport(): void {
    const header = this.advKeepHeader ? ['订单号', '客户', '日期', '金额', '状态'] : []
    const lines = previewRows.map((row) => [row.id, row.customer, row.date, row.amount, row.status].join(','))
    const content = (this.advUtf8 ? '\uFEFF' : '') + [...header, ...lines].join('\n')
    const ext = this.selectedFormat === 'xlsx' ? 'csv' : this.selectedFormat
    const blob = new Blob([content], { type: `text/${ext === 'csv' ? 'csv' : 'plain'};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `销售数据-${this.selectedScope}.${ext}`
    link.click()
    URL.revokeObjectURL(url)
    toast(`已导出 ${previewRows.length} 行 · ${this.selectedFormat.toUpperCase()} · ${this.selectedScope}${this.advKeepHeader ? ' · 含表头' : ''}`)
  }

  // ---------- 工作表标签 ----------
  private renderSheetTabs(): TemplateResult {
    return html`
      <div class="sheet-tabs">
        <button class="tab-add" title="添加工作表" @click=${() => toast('已添加工作表')} >${sxIcon('plus', 15)}</button>
        ${ioSheetTabs.map(name => html`
          <button
            class="sheet-tab ${this.activeSheet === name ? 'active' : ''}"
            @click=${() => { this.activeSheet = name }}
          >${name}</button>
        `)}
      </div>
    `
  }

  // ---------- 状态栏 ----------
  private renderStatusBar(): TemplateResult {
    return html`
      <div class="statusbar">
        <span class="status-ready"><span class="dot"></span>就绪</span>
        <span class="status-count">共 <strong>${ioStats.total}</strong> 条数据</span>
        <span class="status-stats">
          <span>平均值: ${ioStats.avg}</span>
          <span>计数: ${ioStats.count}</span>
          <span>求和: ${ioStats.sum}</span>
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
          <input type="range" min="50" max="150" step="10" .value=${String(this.zoom)} @input=${(e: Event) => { this.zoom = Number((e.target as HTMLInputElement).value) }} />
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
    'io-app': IoApp
  }
}
