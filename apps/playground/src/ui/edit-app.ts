/**
 * SheetX 第 28 张 · 数据编辑与事务提交
 *
 * 核心原则：SheetX 管理编辑过程（暂存 / 批量 / 确认 / 回滚 / 冲突），
 * 宿主系统负责最终数据持久化（提交时调用 DataAdapter.save）。
 * 本页把「编辑 → 暂存 → 确认 → 接口响应 → 成功/失败回滚/版本冲突」做成真实可交互链路。
 */
import { LitElement, html, nothing, type TemplateResult } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { baseStyles, lightTokens } from './tokens.js'
import { bindPageTheme, type ResolvedTheme } from './theme.js'
import { editStyles } from './edit-styles.js'
import { sxIcon, sxLogo } from './icons.js'
import { toast } from './toast.js'
import {
  INITIAL_ROWS, COLUMNS, INITIAL_LOGS, LOG_TABS, BATCH_MODES, BATCH_FIELDS,
  STATUS_CHOICES, STATUS_STYLE, OUTCOMES,
  type EditRow, type PendingChange, type OpLog, type LogTab, type BatchMode,
  type SubmitOutcome, type Conflict,
  fmtAmount, nowTime,
} from './edit-data.js'

const TOP_MENUS = ['文件', '开始', '插入', '数据', '公式', '视图', '设置']
const STORE_KEY = 'sx:edit-transaction'

interface ToastState { kind: 'ok' | 'bad' | 'warn'; text: string }

@customElement('edit-app')
export class EditApp extends LitElement {
  static styles = [baseStyles, lightTokens, editStyles]

  @state() private theme: ResolvedTheme = 'light'
  @state() private activeMenu = '开始'
  @state() private rows: EditRow[] = this.loadRows()
  @state() private pending: PendingChange[] = []
  @state() private selected = new Set<string>()
  @state() private activeCell: { rowId: string; field: keyof EditRow } | null = null
  @state() private editing = false
  @state() private editValue = ''
  @state() private batchMode: BatchMode = '设置为固定值'
  @state() private batchField: keyof EditRow = 'status'
  @state() private batchValue = '已发货'
  @state() private batchSyncDate = true
  @state() private showConfirm = false
  @state() private submitting = false
  @state() private outcome: SubmitOutcome = 'success'
  @state() private conflict: Conflict | null = null
  @state() private logs: OpLog[] = [...INITIAL_LOGS]
  @state() private logTab: LogTab = '操作日志'
  @state() private toastState: ToastState | null = null
  @state() private showOutcomeMenu = false

  private stopTheme: (() => void) | null = null
  private seq = 100
  private timer: number | null = null

  constructor() {
    super()
    this.stopTheme = bindPageTheme((resolved) => { this.theme = resolved })
  }

  disconnectedCallback(): void {
    this.stopTheme?.()
    this.stopTheme = null
    if (this.timer !== null) window.clearTimeout(this.timer)
    super.disconnectedCallback()
  }

  private loadRows(): EditRow[] {
    try {
      const raw = localStorage.getItem(STORE_KEY)
      if (raw) return JSON.parse(raw).rows ?? INITIAL_ROWS.map((r) => ({ ...r }))
    } catch { /* 忽略 */ }
    return INITIAL_ROWS.map((r) => ({ ...r }))
  }

  private saveRows(): void {
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ rows: this.rows })) } catch { /* 忽略 */ }
  }

  private showToast(kind: ToastState['kind'], text: string): void {
    this.toastState = { kind, text }
  }

  private fieldDisplay(row: EditRow, field: keyof EditRow): string {
    const v = row[field]
    if (field === 'amount') return fmtAmount(v as number)
    return String(v)
  }

  /** 选中单元格 */
  private selectCell(rowId: string, field: keyof EditRow): void {
    this.activeCell = { rowId, field }
    const row = this.rows.find((r) => r.id === rowId)
    if (row) this.editValue = String(row[field])
  }

  /** 双击进入编辑 */
  private startEdit(): void {
    if (!this.activeCell) return
    const row = this.rows.find((r) => r.id === this.activeCell!.rowId)
    if (row) this.editValue = String(row[this.activeCell.field])
    this.editing = true
  }

  /** 提交单元格编辑 → 进入暂存（不落库） */
  private commitCellEdit(): void {
    if (!this.activeCell || !this.editing) return
    const { rowId, field } = this.activeCell
    const row = this.rows.find((r) => r.id === rowId)
    if (!row) return
    const oldValue = row[field]
    let newValue: string | number = this.editValue
    if (field === 'amount') newValue = Number(this.editValue)
    if (String(oldValue) === String(newValue)) { this.editing = false; return }
    // 暂存：先更新 UI 显示，同时记录 mutation（source='cell'）
    this.rows = this.rows.map((r) => r.id === rowId ? { ...r, [field]: newValue } : r)
    this.pending = [...this.pending, {
      id: ++this.seq, rowId, field, oldValue, newValue, time: nowTime(), source: 'cell',
    }]
    this.editing = false
    this.showToast('warn', `已暂存修改：${row.no} ${String(field)} → ${String(newValue)}（尚未提交到后端）`)
  }

  /** 行选择 */
  private toggleRow(id: string): void {
    const next = new Set(this.selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    this.selected = next
  }

  private clearSelection(): void {
    this.selected = new Set()
  }

  /** 批量应用 → 暂存多条变更 */
  private applyBatch(): void {
    if (this.selected.size === 0) { toast('请先勾选要编辑的行'); return }
    const changes: PendingChange[] = []
    const updated = this.rows.map((row) => {
      if (!this.selected.has(row.id)) return row
      const oldValue = row[this.batchField]
      let newValue: string | number = this.batchValue
      if (this.batchField === 'amount') {
        const base = Number(this.batchValue)
        newValue = this.batchMode === '递增数值' ? row.amount + base : base
      }
      if (String(oldValue) === String(newValue)) return row
      changes.push({ id: ++this.seq, rowId: row.id, field: this.batchField, oldValue, newValue, time: nowTime(), source: 'batch' })
      const patch: Partial<EditRow> = { [this.batchField]: newValue }
      if (this.batchSyncDate && this.batchField === 'status') patch.date = nowTime().slice(0, 5).replace(/:/, '-')
      return { ...row, ...patch }
    })
    if (changes.length === 0) { toast('所选记录没有实际变化'); return }
    this.rows = updated
    this.pending = [...this.pending, ...changes]
    this.logs = [{
      id: ++this.seq, time: nowTime(), operator: '张三',
      action: `批量更新${BATCH_FIELDS.find((f) => f.key === this.batchField)?.label}: → ${this.batchValue}（共 ${changes.length} 条）`,
      status: '暂存', note: '等待提交', count: changes.length,
    }, ...this.logs]
    this.showToast('warn', `已暂存 ${changes.length} 条批量修改，请确认提交`)
  }

  /** 打开确认提交 */
  private openConfirm(): void {
    if (this.pending.length === 0) { toast('暂无待提交的暂存修改'); return }
    this.showConfirm = true
  }

  /** 真正提交 → 调用"宿主 API"（模拟三种响应） */
  private async confirmSubmit(): Promise<void> {
    if (this.submitting) return
    this.submitting = true
    const changes = [...this.pending]
    await new Promise((r) => { this.timer = window.setTimeout(r, 620) })

    if (this.outcome === 'fail') {
      // 失败回滚：把 rows 恢复到暂存前的 oldValue
      const rollback = new Map<string, Partial<EditRow>>()
      for (const c of changes) {
        const patch = (rollback.get(c.rowId) ?? {}) as Record<string, string | number>
        patch[c.field] = c.oldValue
        rollback.set(c.rowId, patch as Partial<EditRow>)
      }
      this.rows = this.rows.map((r) => rollback.has(r.id) ? { ...r, ...rollback.get(r.id) } : r)
      this.logs = [{ id: ++this.seq, time: nowTime(), operator: '张三', action: `提交失败：${changes.length} 条修改已自动回滚`, status: '已回滚', note: 'API 500', count: changes.length }, ...this.logs]
      this.pending = []
      this.showToast('bad', `提交失败（宿主 API 500），${changes.length} 条修改已自动回滚`)
    } else if (this.outcome === 'conflict') {
      // 版本冲突：构造冲突信息（服务端版本 +1，值被他人改过）
      const first = changes[0]!
      const row = this.rows.find((r) => r.id === first.rowId)!
      this.conflict = {
        rowId: first.rowId, field: first.field,
        localValue: first.newValue,
        serverValue: first.field === 'amount' ? Number(row.amount) + 500 : '他人已修改',
        serverVersion: row.version + 1,
      }
      this.logs = [{ id: ++this.seq, time: nowTime(), operator: '张三', action: `提交冲突：${row.no} 版本号不匹配`, status: '冲突待处理', note: '等待解决' }, ...this.logs]
      this.showToast('warn', '检测到版本冲突，请选择保留本地或使用服务端值')
    } else {
      // 成功：写入版本号 + 日志 + 清空暂存
      this.rows = this.rows.map((r) => changes.some((c) => c.rowId === r.id) ? { ...r, version: r.version + 1 } : r)
      const submitted: OpLog[] = changes.map((c, i) => ({
        id: ++this.seq + i, time: nowTime(), operator: '张三',
        action: `提交修改：${c.rowId} ${String(c.field)} ${String(c.oldValue)} → ${String(c.newValue)}`,
        status: '已提交', note: '提交成功', count: 1,
      }))
      this.logs = submitted.concat(this.logs)
      this.pending = []
      this.saveRows()
      this.showToast('ok', `数据已成功提交到后端系统，更新时间：${nowTime()}`)
    }
    this.showConfirm = false
    this.submitting = false
    this.timer = null
  }

  /** 冲突处理：保留本地（强制覆盖）或采用服务端（放弃本地） */
  private resolveConflict(keepLocal: boolean): void {
    if (!this.conflict) return
    const c = this.conflict
    if (keepLocal) {
      this.rows = this.rows.map((r) => r.id === c.rowId ? { ...r, version: c.serverVersion + 1 } : r)
      this.logs = [{ id: ++this.seq, time: nowTime(), operator: '张三', action: `冲突已解决：保留本地值（${String(c.localValue)}）`, status: '已提交', note: '强制覆盖' }, ...this.logs]
      this.showToast('ok', '已保留本地修改并提交（强制覆盖服务端）')
    } else {
      this.rows = this.rows.map((r) => r.id === c.rowId ? { ...r, [c.field]: c.serverValue, version: c.serverVersion } : r)
      this.logs = [{ id: ++this.seq, time: nowTime(), operator: '张三', action: `冲突已解决：采用服务端值（${String(c.serverValue)}）`, status: '已回滚', note: '放弃本地' }, ...this.logs]
      this.showToast('warn', '已采用服务端最新值，本地修改已放弃')
    }
    this.conflict = null
    this.pending = []
    this.saveRows()
  }

  private chooseOutcome(key: SubmitOutcome): void {
    this.outcome = key
    this.showOutcomeMenu = false
    toast(`模拟响应已切换为：${OUTCOMES.find((o) => o.key === key)?.label}`)
  }

  private hasPending(rowId: string): boolean {
    return this.pending.some((c) => c.rowId === rowId)
  }

  /* ================= 渲染 ================= */

  private renderTop(): TemplateResult {
    return html`
      <div class="menu-bar">
        <div class="brand">${sxLogo(22)}</div>
        <nav class="menu-list">
          ${TOP_MENUS.map((m) => html`
            <button class="menu-item ${m === this.activeMenu ? 'active' : ''}" @click=${() => { this.activeMenu = m }}>${m}</button>`)}
        </nav>
        <div class="search-box">${sxIcon('search', 14)}<input placeholder="搜索功能..." /></div>
        <button class="icon-btn" title="帮助" @click=${() => toast('查看 apps/docs 官方文档')}>${sxIcon('help', 16)}</button>
        <span class="avatar" title="宿主用户">张</span>
      </div>`
  }

  private renderToolbar(): TemplateResult {
    const tb = (icon: Parameters<typeof sxIcon>[0], title: string, action: () => void): TemplateResult => html`
      <button class="tool-btn" title=${title} @click=${action}>${sxIcon(icon, 15)}</button>`
    return html`
      <div class="toolbar">
        <div class="tool-group">${tb('undo', '撤销', () => toast('撤销（演示）'))}${tb('redo', '重做', () => toast('重做（演示）'))}${tb('print', '打印', () => toast('打印（演示）'))}</div>
        <div class="tool-group">
          <select class="mini-select fmt"><option>常规</option><option>货币</option><option>数值</option></select>
          <select class="mini-select size"><option>12</option><option>11</option><option>14</option></select>
          ${tb('bold', '粗体', () => toast('粗体（演示）'))}${tb('italic', '斜体', () => toast('斜体（演示）'))}${tb('underline', '下划线', () => toast('下划线（演示）'))}
          <button class="tool-btn color-cell" title="字体颜色" style="--mark:#d97706">${sxIcon('fontColor', 15)}</button>
          <button class="tool-btn color-cell" title="填充颜色" style="--mark:#e5a23c">${sxIcon('fill', 15)}</button>
        </div>
        <div class="tool-group">
          ${(['alignLeft', 'alignCenter', 'alignRight', 'alignJustify'] as const).map((ic) => tb(ic, '对齐', () => toast('对齐（演示）')))}
          <select class="mini-select merge"><option>合并居中</option><option>合并单元格</option><option>取消合并</option></select>
          <button class="tool-btn" @click=${() => toast('自动换行（演示）')}>自动换行</button>
          ${tb('percent', '百分比', () => toast('百分比（演示）'))}${tb('decimalMinus', '减少小数位', () => toast('减少小数位（演示）'))}
          ${tb('link', '链接', () => toast('链接（演示）'))}${tb('cloudUpload', '云同步', () => toast('云同步由宿主提供'))}
          <button class="tool-btn" @click=${() => toast('更多格式（演示）')}>更多</button>
        </div>
      </div>`
  }

  private renderFormula(): TemplateResult {
    const active = this.activeCell
    const value = active ? this.fieldDisplay(this.rows.find((r) => r.id === active.rowId)!, active.field) : ''
    return html`
      <div class="formula-bar">
        <div class="addr">${active ? active.field === 'amount' ? 'E3' : 'B3' : 'B3'} ${sxIcon('chevronDown', 11)}</div>
        <span class="fx">fx</span>
        <input class="formula-input" .value=${value} @change=${(e: Event) => {
          if (!active) return
          this.activeCell = active
          this.editValue = (e.target as HTMLInputElement).value
          this.editing = true
          this.commitCellEdit()
        }} />
      </div>`
  }

  private renderTable(): TemplateResult {
    const allSelected = this.selected.size === this.rows.length && this.rows.length > 0
    return html`
      <div class="grid-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th><input type="checkbox" class="select-box" .checked=${allSelected} @change=${() => { this.selected = allSelected ? new Set() : new Set(this.rows.map((r) => r.id)) }} /></th>
              <th>${sxIcon('cart', 13)} 订单编号</th>
              <th>${sxIcon('calendar', 13)} 订单日期</th>
              <th>${sxIcon('box', 13)} 客户名称</th>
              <th>${sxIcon('currency', 13)} 订单金额</th>
              <th>${sxIcon('checkCircle', 13)} 订单状态</th>
            </tr>
          </thead>
          <tbody>
            <tr><td class="col-letter"></td>${COLUMNS.map((c) => html`<td class="col-letter">${c.key === 'no' ? 'B' : c.key === 'date' ? 'C' : c.key === 'customer' ? 'D' : c.key === 'amount' ? 'E' : 'F'}</td>`)}</tr>
            ${this.rows.map((row) => html`
              <tr class="${this.selected.has(row.id) ? 'selected' : ''}">
                <td><input type="checkbox" class="select-box" .checked=${this.selected.has(row.id)} @change=${() => this.toggleRow(row.id)} /></td>
                ${COLUMNS.map((c) => {
                  const active = this.activeCell?.rowId === row.id && this.activeCell.field === c.key
                  const isEditing = active && this.editing
                  return html`
                    <td class="${active ? 'cell-active' : ''} ${isEditing ? 'cell-editing' : ''}"
                        @click=${() => this.selectCell(row.id, c.key)}
                        @dblclick=${() => this.startEdit()}>
                      ${isEditing
                        ? html`<input class="cell-input" .value=${this.editValue} @input=${(e: Event) => { this.editValue = (e.target as HTMLInputElement).value }} @keydown=${(e: KeyboardEvent) => {
                            if (e.key === 'Enter') this.commitCellEdit()
                            if (e.key === 'Escape') { this.editing = false }
                          }} @blur=${() => { if (this.editing) this.commitCellEdit() }} autofocus />`
                        : c.key === 'status'
                          ? html`<span class="status-tag" style=${`background:${STATUS_STYLE[row.status]?.bg};color:${STATUS_STYLE[row.status]?.color}`}>${row.status}</span>${this.hasPending(row.id) ? html`<span class="pending-dot" title="暂存未提交"></span>` : ''}`
                          : this.fieldDisplay(row, c.key)}
                    </td>`
                })}
              </tr>`)}
          </tbody>
        </table>
      </div>`
  }

  private renderBatch(): TemplateResult {
    const fieldLabel = BATCH_FIELDS.find((f) => f.key === this.batchField)?.label ?? ''
    return html`
      <aside class="batch-panel">
        <div class="batch-head">${sxIcon('edit', 15)} 批量编辑
          <button class="icon-btn close" title="收起" @click=${() => toast('批量编辑面板已保留在右侧')}>${sxIcon('close', 14)}</button>
        </div>
        <div class="batch-body">
          <div>
            <span class="field-label">编辑范围<span class="clear" @click=${() => this.clearSelection()}>清除</span></span>
            <div class="range-box">已选择 <span class="num">${this.selected.size}</span> 行 × 1 列</div>
          </div>
          <div>
            <span class="field-label">编辑内容</span>
            <select class="full-select" .value=${this.batchMode} @change=${(e: Event) => { this.batchMode = (e.target as HTMLSelectElement).value as BatchMode }}>
              ${BATCH_MODES.map((m) => html`<option>${m}</option>`)}
            </select>
            <select class="full-select" style="margin-top:8px" .value=${this.batchField} @change=${(e: Event) => {
              this.batchField = (e.target as HTMLSelectElement).value as keyof EditRow
              this.batchValue = this.batchField === 'status' ? '已发货' : this.batchField === 'amount' ? '1000' : ''
            }}>
              ${BATCH_FIELDS.map((f) => html`<option value=${f.key}>${f.label}</option>`)}
            </select>
            <div class="value-row">
              ${this.batchField === 'status'
                ? html`<select class="full-select" .value=${this.batchValue} @change=${(e: Event) => { this.batchValue = (e.target as HTMLSelectElement).value }}>${STATUS_CHOICES.map((s) => html`<option>${s}</option>`)}</select>`
                : html`<input .value=${this.batchValue} @input=${(e: Event) => { this.batchValue = (e.target as HTMLInputElement).value }} />`}
              <span class="value-ok">${sxIcon('check', 13)}</span>
            </div>
          </div>
          <label class="check-row" @click=${() => { this.batchSyncDate = !this.batchSyncDate }}>
            <span class="check-box ${this.batchSyncDate ? 'on' : ''}">${this.batchSyncDate ? sxIcon('check', 10) : ''}</span>
            同时更新订单状态和发货日期
          </label>
          <div class="info-box">
            <span class="ic">${sxIcon('infoCircle', 15)}</span>
            <span>将对 <b>${this.selected.size}</b> 条记录进行批量更新（${fieldLabel}：${this.batchValue}）。修改先进入暂存区，确认后才提交到宿主系统。</span>
          </div>
        </div>
        <div class="batch-actions">
          <button class="btn primary" @click=${() => this.applyBatch()}>${sxIcon('edit', 13)} 应用修改</button>
          ${this.pending.length > 0 ? html`
            <button class="btn small" style="width:100%;margin-top:8px;border-color:var(--sx-brand);color:var(--sx-brand)" @click=${() => this.openConfirm()}>
              提交 ${this.pending.length} 条暂存修改
            </button>` : nothing}
        </div>
      </aside>`
  }

  private renderLog(): TemplateResult {
    const filtered = this.logTab === '提交记录'
      ? this.logs.filter((l) => l.status === '已提交' || l.status === '已回滚' || l.status === '冲突待处理')
      : this.logTab === '数据变更'
        ? this.logs.filter((l) => l.count && l.count > 1)
        : this.logs
    return html`
      <div class="log-panel">
        <div class="log-tabs">
          ${LOG_TABS.map((t) => html`
            <button class="log-tab ${this.logTab === t ? 'active' : ''}" @click=${() => { this.logTab = t }}>${t}</button>`)}
          <button class="icon-btn close" title="收起" @click=${() => toast('操作日志面板')}>${sxIcon('close', 13)}</button>
        </div>
        <table class="log-table">
          <thead><tr><th>时间</th><th>操作人</th><th>操作内容</th><th>状态</th><th>备注</th></tr></thead>
          <tbody>
            ${filtered.map((l) => html`
              <tr>
                <td class="time">${l.time}</td><td class="op">${l.operator}</td><td>${l.action}</td>
                <td class="st">${l.status === '已提交'
                  ? html`<span class="log-ok">${sxIcon('checkCircle', 12)} 已提交</span>`
                  : l.status === '已回滚'
                    ? html`<span class="log-bad">${sxIcon('refresh', 12)} 已回滚</span>`
                    : l.status === '冲突待处理'
                      ? html`<span class="log-warn">${sxIcon('warnTriangle', 12)} 冲突待处理</span>`
                      : html`<span class="log-warn">${sxIcon('clock', 12)} 暂存</span>`}</td>
                <td class="note">${l.note}</td>
              </tr>`)}
          </tbody>
        </table>
        <div class="log-foot">
          <button class="pg disabled">‹</button>
          <button class="pg on">1</button><button class="pg">2</button><button class="pg">3</button>
          <span>…</span><button class="pg">10</button><button class="pg">›</button>
          <span>共 28 条</span>
        </div>
      </div>`
  }

  private renderModals(): TemplateResult {
    const confirmModal = this.showConfirm ? html`
      <div class="modal-mask" @click=${(e: Event) => { if (e.target === e.currentTarget) this.showConfirm = false }}>
        <div class="modal" role="dialog" aria-label="确认提交">
          <div class="modal-head">
            <span style="width:28px;height:28px;border-radius:50%;background:var(--sx-brand);color:#fff;display:inline-flex;align-items:center;justify-content:center">${sxIcon('check', 15)}</span>
            确认提交
            <button class="icon-btn close" @click=${() => { this.showConfirm = false }}>${sxIcon('close', 14)}</button>
          </div>
          <p>您确定要提交 <b>${this.pending.length}</b> 条修改记录吗？<br />提交后将同步到后端系统。</p>
          <div class="modal-actions">
            <button class="btn" @click=${() => { this.showConfirm = false }}>取消</button>
            <button class="btn primary" style="width:auto" @click=${() => void this.confirmSubmit()}>${this.submitting ? '提交中…' : '确定'}</button>
          </div>
          <div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--sx-border);display:flex;align-items:center;gap:8px;font-size:11px;color:var(--sx-text-hint)">
            模拟宿主 API 响应：
            <button class="btn small" @click=${() => { this.showOutcomeMenu = !this.showOutcomeMenu }}>
              ${OUTCOMES.find((o) => o.key === this.outcome)?.label} ${sxIcon('chevronDown', 10)}
            </button>
            ${this.showOutcomeMenu ? html`<div class="popover" style="position:absolute;z-index:700;width:200px;padding:5px;background:var(--sx-bg-surface);border:1px solid var(--sx-border);border-radius:6px">
              ${OUTCOMES.map((o) => html`<button style="display:block;width:100%;text-align:left;padding:7px 9px;border:0;border-radius:5px;background:transparent;color:var(--sx-text-secondary);font-size:11px" @click=${() => this.chooseOutcome(o.key)}>
                <b style="color:${o.color}">${o.label}</b> · ${o.desc}</button>`)}
            </div>` : nothing}
          </div>
        </div>
      </div>` : nothing

    const conflictModal = this.conflict ? html`
      <div class="modal-mask">
        <div class="modal" role="dialog" aria-label="版本冲突">
          <div class="modal-head">${sxIcon('warnTriangle', 17)} 检测到版本冲突
            <button class="icon-btn close" @click=${() => { this.conflict = null }}>${sxIcon('close', 14)}</button>
          </div>
          <p>该记录已被其他用户修改（服务端版本 v${this.conflict.serverVersion}），请选择如何处理。</p>
          <div class="conflict-box">
            <div class="conflict-row">
              <div class="conflict-col local"><h5>本地修改</h5><div class="val">${String(this.conflict.localValue)}</div></div>
              <div class="conflict-col"><h5>服务端最新</h5><div class="val">${String(this.conflict.serverValue)}</div></div>
            </div>
          </div>
          <div class="modal-actions" style="margin-top:18px">
            <button class="btn" @click=${() => this.resolveConflict(false)}>使用服务端值</button>
            <button class="btn primary" style="width:auto" @click=${() => this.resolveConflict(true)}>保留本地并覆盖</button>
          </div>
        </div>
      </div>` : nothing

    return html`${confirmModal}${conflictModal}`
  }

  private renderToast(): TemplateResult {
    if (!this.toastState) return nothing as unknown as TemplateResult
    const t = this.toastState
    return html`
      <div class="toast ${t.kind}">
        ${sxIcon(t.kind === 'ok' ? 'checkCircle' : t.kind === 'bad' ? 'warnTriangle' : 'infoCircle', 16)}
        <span>${t.text}</span>
        <button class="icon-btn close" @click=${() => { this.toastState = null }}>${sxIcon('close', 12)}</button>
      </div>`
  }

  render(): TemplateResult {
    return html`
      <div class="app" data-edit-theme=${this.theme}>
        ${this.renderTop()}
        ${this.renderToolbar()}
        ${this.renderFormula()}
        <div class="workspace">
          ${this.renderTable()}
          ${this.renderBatch()}
        </div>
        ${this.renderLog()}
        ${this.renderModals()}
        ${this.renderToast()}
      </div>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edit-app': EditApp
  }
}
