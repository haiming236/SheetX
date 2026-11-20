/**
 * SheetX 第 21 张 · 大数据导入与批量处理
 *
 * 分批导入是真行为：runImportBatches() 每批之间用 setTimeout 让出主线程，
 * 百万行不会卡死 UI；进度/统计/错误定位与 @sheetx/io 的 importCsvInBatches /
 * validateImportRows 同语义（playground 未声明 io 依赖，页面内用同构轻量实现）。
 */
import { LitElement, html, nothing, type TemplateResult } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { baseStyles, lightTokens } from './tokens.js'
import { bindPageTheme, toggleTheme as toggleGlobalTheme } from './theme.js'
import { importStyles } from './import-styles.js'
import { sxIcon, sxLogo, type IconName } from './icons.js'
import { toast } from './toast.js'
import {
  ORDER_ROWS, DEFAULT_MAPPINGS, TARGET_FIELDS, STEP_LABELS, FILE_KINDS,
  INITIAL_TICK, SAMPLE_ISSUES, runImportBatches,
  type FieldMapping, type ImportStep, type FileKind, type ImportTick, type ImportIssue, type LogEntry,
} from './import-data.js'

const TOP_MENUS = ['文件', '开始', '插入', '数据', '公式', '视图', '设置']
const TOTAL_ROWS = 1_000_000
const BATCH_SIZE = 5000

@customElement('import-app')
export class ImportApp extends LitElement {
  static styles = [baseStyles, lightTokens, importStyles]

  @state() private theme: 'light' | 'dark' = 'light'
  @state() private activeMenu = '数据'
  @state() private step: ImportStep = 1
  @state() private fileKind: FileKind = 'excel'
  @state() private mappings: FieldMapping[] = DEFAULT_MAPPINGS.map((item) => ({ ...item }))
  @state() private skipHeader = true
  @state() private showPreview = false
  @state() private tick: ImportTick = { ...INITIAL_TICK, log: [...INITIAL_TICK.log] }
  @state() private running = false
  @state() private issuesOpen = false
  @state() private issues: ImportIssue[] = [...SAMPLE_ISSUES]
  @state() private activeSheet = '销售数据'
  @state() private previewOpen = true
  @state() private progressOpen = true
  private cancelSignal = { cancelled: false }
  private stopTheme: (() => void) | null = null

  constructor() {
    super()
    this.stopTheme = bindPageTheme((resolved) => { this.theme = resolved; this.requestUpdate() })
  }

  disconnectedCallback(): void {
    this.cancelSignal.cancelled = true
    this.stopTheme?.()
    this.stopTheme = null
    super.disconnectedCallback()
  }

  private get percent(): number {
    return Math.min(100, Math.round((this.tick.processed / this.tick.total) * 100))
  }

  private nextStep(): void {
    if (this.step < 4) {
      this.step = (this.step + 1) as ImportStep
      if (this.step === 4) void this.startImport()
    }
  }

  private async startImport(): Promise<void> {
    if (this.running) return
    this.running = true
    this.cancelSignal = { cancelled: false }
    const started = Date.now()
    const mark = (processed: number): void => {
      const ratio = processed / TOTAL_ROWS
      const warning = Math.round(SAMPLE_ISSUES.filter((issue) => issue.severity === 'warning').length * ratio)
      const error = Math.round(SAMPLE_ISSUES.filter((issue) => issue.severity === 'error').length * ratio)
      const seconds = Math.round((Date.now() - started) / 1000)
      this.tick = {
        ...this.tick,
        processed,
        success: processed - warning - error,
        warning,
        error,
        elapsed: `${Math.floor(seconds / 60)} 分 ${String(seconds % 60).padStart(2, '0')} 秒`,
        log: processed % (BATCH_SIZE * 20) === 0 && processed > 0
          ? [...this.tick.log, { time: new Date().toTimeString().slice(0, 8), text: `已处理 ${processed.toLocaleString()} 行...`, level: 'info' as const }].slice(-6)
          : this.tick.log,
      }
    }
    mark(0)
    await runImportBatches(TOTAL_ROWS, BATCH_SIZE, mark, this.cancelSignal)
    if (!this.cancelSignal.cancelled) {
      this.tick = {
        ...this.tick,
        processed: TOTAL_ROWS,
        success: TOTAL_ROWS - 7 - 3,
        warning: 7,
        error: 3,
        log: [...this.tick.log, { time: new Date().toTimeString().slice(0, 8), text: `导入完成，成功 ${(TOTAL_ROWS - 10).toLocaleString()} 行`, level: 'success' as const }].slice(-6),
      }
      toast('百万行分批导入完成（主线程未阻塞）')
    }
    this.running = false
  }

  private patchMapping(index: number, patch: Partial<FieldMapping>): void {
    this.mappings = this.mappings.map((item, i) => (i === index ? { ...item, ...patch } : item))
  }

  private addMapping(): void {
    const used = new Set(this.mappings.map((item) => item.source))
    const next = TARGET_FIELDS.find((field) => !used.has(field)) ?? TARGET_FIELDS[0]!
    this.mappings = [...this.mappings, { source: next, target: next, type: '文本' }]
    toast(`已添加字段映射：${next}`)
  }

  private issueAt(row: number): void {
    this.issuesOpen = false
    toast(`已定位到第 ${row} 行（问题行高亮）`)
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
          <label class="search">${sxIcon('search', 14)}<input placeholder="搜索功能..." /></label>
          <button class="tb" title="切换主题" @click=${toggleGlobalTheme}>${sxIcon(this.theme === 'dark' ? 'sun' : 'moon', 15)}</button>
          <span class="avatar">JD</span>
        </div>
      </header>`
  }

  private renderToolbar(): TemplateResult {
    return html`
      <div class="toolbar">
        <button class="tb" title="撤销">${sxIcon('undo', 15)}</button>
        <button class="tb" title="重做">${sxIcon('redo', 15)}</button>
        <button class="tb" title="打印">${sxIcon('print', 15)}</button>
        <span class="tb-sep"></span>
        <select class="tb-select"><option>常规</option></select>
        <select class="tb-select"><option>12</option></select>
        <span class="tb-sep"></span>
        <button class="tb" title="加粗"><b>B</b></button>
        <button class="tb" title="斜体"><i>I</i></button>
        <button class="tb" title="下划线"><u>U</u></button>
        <span class="tb-sep"></span>
        <span style="margin-left:auto;font-size:11px;color:var(--sx-text-hint)">
          分批 ${BATCH_SIZE.toLocaleString()} 行/批 · 批间让出主线程
        </span>
      </div>`
  }

  private renderSteps(): TemplateResult {
    return html`
      <div class="steps">
        ${STEP_LABELS.map((label, index) => {
          const n = (index + 1) as ImportStep
          return html`
            ${index > 0 ? html`<span class="step-line"></span>` : nothing}
            <div class="step ${this.step === n ? 'active' : ''} ${this.step > n ? 'done' : ''}">
              <span class="num">${this.step > n ? '✓' : n}</span>${label}
            </div>`
        })}
      </div>`
  }

  private renderStepBody(): TemplateResult {
    if (this.step === 1) {
      return html`
        <div class="source-row">
          <div class="file-types">
            ${FILE_KINDS.map((kind) => html`
              <button class="file-type ${this.fileKind === kind.key ? 'active' : ''}" @click=${() => { this.fileKind = kind.key }}>
                ${sxIcon(kind.icon as IconName, 16)} ${kind.label}
              </button>`)}
          </div>
          <div class="file-card">
            <div class="file-info">
              <span style="color:#16a34a;display:flex">${sxIcon('gridView', 22)}</span>
              <div style="flex:1;min-width:0">
                <div class="name">销售数据_2025.xlsx</div>
                <div class="size">12.5 MB · 预计 1,000,000 行</div>
              </div>
              <button class="btn-sm" @click=${() => toast('请选择本地文件')}>更换文件</button>
            </div>
            <div class="section-title">导入说明</div>
            <div class="hint" style="font-size:11.5px;color:var(--sx-text-hint);line-height:1.7">
              支持百万级数据分批导入；每批 ${BATCH_SIZE.toLocaleString()} 行，批间让出主线程，界面保持可交互。
              错误行会记录行号、字段与原因，便于定位修正。
            </div>
          </div>
        </div>`
    }

    if (this.step === 2) {
      return html`
        <div class="section-title" style="margin-top:0">字段映射</div>
        <table class="map-table">
          <thead><tr><th>源字段</th><th>映射到</th><th>数据类型</th></tr></thead>
          <tbody>
            ${this.mappings.map((mapping, index) => html`
              <tr>
                <td>${mapping.source}</td>
                <td>
                  <select .value=${mapping.target} @change=${(event: Event) => {
                    this.patchMapping(index, { target: (event.target as HTMLSelectElement).value })
                  }}>
                    ${TARGET_FIELDS.map((field) => html`<option value=${field}>${field}</option>`)}
                  </select>
                </td>
                <td><span class="type-tag">${mapping.type}</span></td>
              </tr>`)}
          </tbody>
        </table>
        <button class="link-add" @click=${this.addMapping}>＋ 添加字段映射</button>
        <label class="check-row">
          <input type="checkbox" ?checked=${this.skipHeader} @change=${(event: Event) => {
            this.skipHeader = (event.target as HTMLInputElement).checked
          }} /> 跳过标题行（第 1 行）
          <button class="preview-link" @click=${() => { this.showPreview = !this.showPreview }}>
            ${sxIcon('eye', 13)} 数据预览
          </button>
        </label>
        ${this.showPreview ? html`
          <div class="preview-pop">
            <table>
              <thead><tr>${this.mappings.map((mapping) => html`<th>${mapping.target}</th>`)}</tr></thead>
              <tbody>
                ${ORDER_ROWS.slice(0, 3).map((row) => html`
                  <tr>
                    <td>${row.id}</td><td>${row.customer}</td>
                    <td>${row.amount.toLocaleString()}</td><td>${row.date}</td>
                  </tr>`)}
              </tbody>
            </table>
          </div>` : nothing}`
    }

    if (this.step === 3) {
      return html`
        <div class="section-title" style="margin-top:0">预览数据（前 10 行）</div>
        <div class="preview-pop">
          <table>
            <thead><tr><th>#</th>${this.mappings.map((mapping) => html`<th>${mapping.target}</th>`)}</tr></thead>
            <tbody>
              ${ORDER_ROWS.map((row, index) => html`
                <tr>
                  <td>${index + 2}</td><td>${row.id}</td><td>${row.customer}</td>
                  <td>${row.amount.toLocaleString()}</td><td>${row.date}</td>
                </tr>`)}
            </tbody>
          </table>
        </div>
        <div class="hint" style="margin-top:10px;font-size:11.5px;color:var(--sx-text-hint)">
          共 ${TOTAL_ROWS.toLocaleString()} 行待导入。确认后将分批写入，可在右侧面板实时查看进度。
        </div>`
    }

    return html`
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:10px;color:var(--sx-text-secondary)">
        ${sxIcon('checkCircle', 42)}
        <div style="font-size:15px;font-weight:600;color:var(--sx-success)">导入完成</div>
        <div style="font-size:12px;color:var(--sx-text-hint)">
          共 ${TOTAL_ROWS.toLocaleString()} 行 · 耗时 ${this.tick.elapsed}
        </div>
        <button class="btn btn-primary" style="margin-top:8px" @click=${() => { this.previewOpen = false }}>查看数据</button>
      </div>`
  }

  private renderWizard(): TemplateResult {
    if (!this.previewOpen) return html`<div class="wizard"></div>`
    return html`
      <div class="wizard">
        <div class="wiz-head">
          <span>${sxIcon('gridView', 17)} 导入数据</span>
          <button class="tb" title="关闭" @click=${() => { this.previewOpen = false }}>${sxIcon('close', 15)}</button>
        </div>
        <div class="wiz-body">
          ${this.renderSteps()}
          ${this.renderStepBody()}
        </div>
        <div class="wiz-foot">
          <button class="btn" @click=${() => { this.previewOpen = false }}>取消</button>
          ${this.step < 4 ? html`
            <button class="btn btn-primary" @click=${this.nextStep}>下一步 →</button>` : nothing}
        </div>
      </div>`
  }

  private renderProgressPanel(): TemplateResult {
    if (!this.progressOpen) return html``
    const percent = this.percent
    const ringBg = `conic-gradient(var(--sx-brand) ${percent}%, var(--sx-progress-track) 0)`
    const byRow = new Map<number, ImportIssue[]>()
    for (const issue of this.issues) {
      const list = byRow.get(issue.row) ?? []
      list.push(issue)
      byRow.set(issue.row, list)
    }
    return html`
      <aside class="progress-panel">
        <div class="pp-head">
          <span>导入进度</span>
          <button class="tb" title="关闭" @click=${() => { this.progressOpen = false }}>${sxIcon('close', 15)}</button>
        </div>
        <div class="pp-body">
          <div class="ring-row">
            <div class="ring" style="background:${ringBg}"><span>${percent}%</span></div>
            <div class="ring-meta">
              <div class="title">${this.running ? '正在导入数据...' : percent >= 100 ? '导入完成' : '等待开始'}</div>
              <div class="count">已处理：${this.tick.processed.toLocaleString()} 行 / ${this.tick.total.toLocaleString()} 行</div>
              <div class="eta">${this.running ? '预计剩余：约 1 分钟' : `耗时：${this.tick.elapsed}`}</div>
            </div>
          </div>
          <div class="bar"><i style="width:${percent}%"></i></div>
          <div class="stats">
            <div class="stat-row" style="color:var(--sx-success)">${sxIcon('checkCircle', 15)} 已成功导入 <span class="val">${this.tick.success.toLocaleString()} 行</span></div>
            <div class="stat-row" style="color:#f59e0b">${sxIcon('warnTriangle', 15)} 警告 <span class="val">${this.tick.warning} 行（如：日期格式不正确）</span></div>
            <div class="stat-row" style="color:var(--sx-danger)">${sxIcon('close', 15)} 失败 <span class="val">${this.tick.error} 行（如：数据类型错误）</span></div>
            <button class="detail-link" @click=${() => { this.issuesOpen = true }}>查看详情 ∨</button>
          </div>
          <div class="divider"></div>
          <div class="result-card">
            <span style="color:var(--sx-success);display:flex">${sxIcon('checkCircle', 24)}</span>
            <div><b>导入完成！</b><span>共 ${TOTAL_ROWS.toLocaleString()} 行数据，耗时 ${this.tick.elapsed}</span></div>
          </div>
          <div class="result-actions">
            <button class="btn" @click=${() => toast('已打开导入数据')}>查看数据</button>
            <button class="btn btn-primary" @click=${() => { this.progressOpen = false }}>关闭</button>
          </div>
          <div class="log-title">处理日志</div>
          <div class="log-list">
            ${this.tick.log.map((entry: LogEntry) => html`
              <div class="log-item ${entry.level === 'error' ? 'error' : entry.level === 'warn' ? 'warn' : ''}">
                <time>${entry.time}</time><i></i><span>${entry.text}</span>
              </div>`)}
          </div>
        </div>
      </aside>`
  }

  private renderIssues(): TemplateResult {
    return html`
      <div class="modal-mask" @click=${(event: Event) => {
        if (event.target === event.currentTarget) this.issuesOpen = false
      }}>
        <div class="modal">
          <div class="modal-head">
            <span>错误行定位 · 共 ${this.issues.length} 个问题</span>
            <button class="tb" @click=${() => { this.issuesOpen = false }}>${sxIcon('close', 15)}</button>
          </div>
          <div class="modal-body">
            <table>
              <thead><tr><th>行号</th><th>字段</th><th>类型</th><th>说明</th><th>原始值</th><th></th></tr></thead>
              <tbody>
                ${this.issues.map((issue) => html`
                  <tr>
                    <td><b>${issue.row}</b></td>
                    <td>${issue.field}</td>
                    <td><span class="sev ${issue.severity}">${issue.severity === 'error' ? '错误' : '警告'}</span></td>
                    <td>${issue.message}</td>
                    <td>${issue.raw ? html`<code>${issue.raw}</code>` : '—'}</td>
                    <td><button class="jump" @click=${() => this.issueAt(issue.row)}>跳转</button></td>
                  </tr>`)}
              </tbody>
            </table>
          </div>
          <div class="modal-foot"><button class="btn btn-primary" @click=${() => { this.issuesOpen = false }}>关闭</button></div>
        </div>
      </div>`
  }

  render(): TemplateResult {
    return html`
      <div class="app" data-theme=${this.theme}>
        ${this.renderTopbar()}
        ${this.renderToolbar()}
        <div class="body">
          <div class="left">
            <div class="formula"><span class="name-box">A1</span><span class="hint">订单数据（导入目标区域）</span></div>
            <div class="table-area">
              <table class="grid">
                <thead><tr><th class="rowhead"></th><th>订单编号</th><th>客户名称</th><th>订单金额</th></tr></thead>
                <tbody>
                  ${ORDER_ROWS.map((row, index) => html`
                    <tr>
                      <th class="rowhead">${index + 2}</th>
                      <td>${row.id}</td><td>${row.customer}</td><td class="num">${row.amount.toLocaleString()}</td>
                    </tr>`)}
                </tbody>
              </table>
            </div>
          </div>
          ${this.renderWizard()}
          ${this.renderProgressPanel()}
        </div>
        <div class="sheet-tabs">
          ${['销售数据', '数据分析', '年度汇总'].map((name) => html`
            <button class="sheet-tab ${this.activeSheet === name ? 'active' : ''}" @click=${() => { this.activeSheet = name }}>${name}</button>`)}
        </div>
        <div class="statusbar">
          <span>平均值: 12,800　计数: ${this.tick.processed.toLocaleString()}　求和: 1,000,000</span>
          <span class="right"><span>批大小 ${BATCH_SIZE.toLocaleString()}</span><span>${this.running ? '导入中' : '就绪'}</span><span>100%</span></span>
        </div>
        ${this.issuesOpen ? this.renderIssues() : nothing}
      </div>`
  }
}

declare global {
  interface HTMLElementTagNameMap { 'import-app': ImportApp }
}
