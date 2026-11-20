/**
 * SheetX 第 29 张 · 数据权限与安全控制
 *
 * 核心边界：SheetX 只提供权限控制接口（canEdit / canView / rowScope），
 * 前端权限仅用于 UX；最终权限判断与数据安全由宿主 ERP 后端在 API 层强制校验。
 * 本页把列级权限 / 单元格只读 / 行级范围 / 编辑回调 / 脱敏做成真实可交互链路。
 */
import { LitElement, html, nothing, type TemplateResult } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { baseStyles, lightTokens } from './tokens.js'
import { bindPageTheme, type ResolvedTheme } from './theme.js'
import { permissionStyles } from './permission-styles.js'
import { sxIcon, sxLogo } from './icons.js'
import { toast } from './toast.js'
import {
  PERM_NAV, ROLES, SECURE_ROWS, INITIAL_CALLBACKS, PERM_CONTRACT, CONTRACT_STEPS,
  RESULT_STYLE, DEFAULT_CONFIG, maskValue, inRowScope,
  type ColumnPerm, type CallbackLog, type FullConfig,
} from './permission-data.js'

const TOP_MENUS = ['文件', '开始', '数据', '安全', '视图', '设置']
const STORE_KEY = 'sx:permission-config'

@customElement('permission-app')
export class PermissionApp extends LitElement {
  static styles = [baseStyles, lightTokens, permissionStyles]

  @state() private theme: ResolvedTheme = 'light'
  @state() private activeMenu = '安全'
  @state() private nav = 'overview'
  @state() private cfg: FullConfig = this.load()
  @state() private logs: CallbackLog[] = [...INITIAL_CALLBACKS]
  @state() private testing = false
  @state() private lastTest: { action: string; detail: string; result: string; allow: boolean } | null = null
  @state() private showContract = false
  @state() private deniedAttempt: string | null = null

  private stopTheme: (() => void) | null = null
  private timer: number | null = null
  private seq = 100

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

  private load(): FullConfig {
    try {
      const raw = localStorage.getItem(STORE_KEY)
      if (raw) return { ...structuredClone(DEFAULT_CONFIG), ...JSON.parse(raw) }
    } catch { /* 忽略 */ }
    return structuredClone(DEFAULT_CONFIG)
  }

  private save(): void {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(this.cfg)) } catch { /* 忽略 */ }
  }

  private patch(key: keyof FullConfig, value: unknown): void {
    this.cfg = { ...this.cfg, [key]: value }
    this.save()
  }

  private chooseNav(key: string): void {
    this.nav = key
    if (key === 'callback') this.showContract = false
  }

  private chooseRole(key: string): void {
    const role = ROLES.find((r) => r.key === key)!
    this.patch('role', key)
    // 不同角色由宿主下发不同 scope（前端只投影展示）
    const scope = key === 'admin' ? { dept: '全部', owner: '' }
      : key === 'sales' ? { dept: '销售运营部', owner: '张三' }
      : { dept: '财务部', owner: '' }
    this.patch('rowScope', scope)
    this.addLog('setPermissionCallback', `role=${role.label}`, 'allow', '宿主 ERP 后端')
    toast(`已切换角色：${role.label}（权限由宿主后端下发）`)
  }

  private toggleColumn(key: string, field: 'visible' | 'editable' | 'mask'): void {
    const columns = this.cfg.columns.map((c) => c.key === key ? { ...c, [field]: !c[field] } : c)
    this.patch('columns', columns)
    const label = field === 'visible' ? '可见性' : field === 'editable' ? '可编辑' : '脱敏'
    this.addLog('setColumnPermission', `${key}.${field}`, 'allow', '宿主 ERP 后端')
    toast(`列权限已更新：${label}`)
  }

  private toggleReadonly(key: string): void {
    const set = new Set(this.cfg.readonlyCells)
    if (set.has(key)) set.delete(key)
    else set.add(key)
    this.patch('readonlyCells', [...set])
    this.addLog('setCellReadOnly', key, set.has(key) ? 'deny' : 'allow', '宿主 ERP 后端')
  }

  private isReadonly(rowId: string, colKey: string, col: ColumnPerm): boolean {
    if (!col.editable) return true
    return this.cfg.readonlyCells.includes(`${rowId}|${colKey}`)
  }

  private visibleRows() {
    return SECURE_ROWS.filter((r) => inRowScope(r, this.cfg.rowScope))
  }

  private cellValue(row: (typeof SECURE_ROWS)[number], col: ColumnPerm): string {
    const raw = (row as unknown as Record<string, string | number>)[col.key] ?? ''
    if (col.mask && !this.cfg.revealSensitive) {
      const kind = col.key === 'phone' ? 'phone' : col.key === 'idcard' ? 'idcard' : col.key === 'amount' ? 'amount' : 'none'
      return maskValue(raw, kind)
    }
    if (col.key === 'amount') return `¥ ${Number(raw).toLocaleString('zh-CN')}`
    return String(raw)
  }

  private addLog(action: string, detail: string, result: CallbackLog['result'], source: string): void {
    const d = new Date()
    const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
    this.logs = [{ id: ++this.seq, time, action, detail, result, source }, ...this.logs].slice(0, 20)
  }

  /** 模拟宿主回调：编辑被拒 / 脱敏 / 放行 */
  private async runCallback(kind: 'edit' | 'view'): Promise<void> {
    this.testing = true
    await new Promise((r) => { this.timer = window.setTimeout(r, 520) })
    const firstVisible = this.visibleRows()[0]
    const target = firstVisible ? `${firstVisible.id}|customer` : 'r1|customer'
    if (kind === 'edit') {
      const denied = this.cfg.readonlyCells.includes(target) || !this.cfg.columns.find((c) => c.key === 'customer')?.editable
      const result = denied ? 'deny' : 'allow'
      this.lastTest = { action: 'canEdit()', detail: target, result, allow: !denied }
      this.addLog('canEdit()', target, result, '宿主 ERP 后端')
      if (denied) {
        this.deniedAttempt = target
        toast(`编辑被拒绝：宿主返回 allow=false（${target}）`)
      } else {
        this.deniedAttempt = null
        toast('宿主返回 allow=true，允许进入编辑')
      }
    } else {
      const idcol = this.cfg.columns.find((c) => c.key === 'idcard')
      const masked = !!(idcol?.mask && !this.cfg.revealSensitive)
      const result = masked ? 'masked' : 'allow'
      this.lastTest = { action: 'canView()', detail: 'column idcard', result, allow: !masked }
      this.addLog('canView()', 'column idcard', result, '宿主 ERP 后端')
      toast(masked ? '宿主返回 masked：身份证号已脱敏' : '宿主返回 full：展示完整字段')
    }
    this.testing = false
    this.timer = null
  }

  private attemptEdit(rowId: string, col: ColumnPerm): void {
    if (this.isReadonly(rowId, col.key, col)) {
      this.deniedAttempt = `${rowId}|${col.key}`
      this.addLog('canEdit()', `${rowId}|${col.key}`, 'deny', '宿主 ERP 后端')
      toast(`只读单元格：宿主 canEdit 返回 false（${col.title}）`)
      return
    }
    this.deniedAttempt = null
    this.addLog('canEdit()', `${rowId}|${col.key}`, 'allow', '宿主 ERP 后端')
    toast(`允许编辑：${col.title}（宿主已授权）`)
  }

  /* ================= 渲染 ================= */

  private renderTop(): TemplateResult {
    return html`
      <div class="menu-bar">
        <div class="brand">${sxLogo(22)}</div>
        <nav class="menu-list">
          ${TOP_MENUS.map((m) => html`
            <button class="menu-item ${m === this.activeMenu ? 'active' : ''}" @click=${() => {
              this.activeMenu = m
              if (m === '设置') this.chooseNav('callback')
            }}>${m}</button>`)}
        </nav>
        <div class="menu-right">
          <button class="icon-btn" title="权限说明" @click=${() => { this.showContract = !this.showContract; this.chooseNav('callback') }}>${sxIcon('help', 16)}</button>
          <span class="avatar" title="宿主用户">张</span>
        </div>
      </div>`
  }

  private renderToolbar(): TemplateResult {
    return html`
      <div class="toolbar">
        <span class="tool-tag on">${sxIcon('shield', 12)} 权限接口已注入</span>
        <span class="sep"></span>
        <span>当前角色：<b style="color:var(--sx-text-primary)">${ROLES.find((r) => r.key === this.cfg.role)?.label}</b></span>
        <span class="sep"></span>
        <span>${sxIcon('lock', 12)} 只读格 ${this.cfg.readonlyCells.length}</span>
        <span>${sxIcon('eye', 12)} 脱敏列 ${this.cfg.columns.filter((c) => c.mask).length}</span>
        <span style="margin-left:auto">最终判断由宿主 ERP 后端负责</span>
      </div>`
  }

  private renderSidebar(): TemplateResult {
    return html`
      <aside class="sidebar">
        <div class="side-title">数据安全</div>
        ${PERM_NAV.map((item) => html`
          <button class="side-item ${this.nav === item.key ? 'active' : ''}" @click=${() => this.chooseNav(item.key)}>
            ${sxIcon(item.icon, 15)} ${item.label}
          </button>`)}
        <div class="boundary-card">
          <h4>${sxIcon('shield', 15)} 职责边界</h4>
          <p>SheetX 只提供权限接口与 UX 拦截，不自行判断权限。</p>
          <div class="owner">● 最终判断与数据安全：宿主 ERP 后端</div>
          <button class="link-btn" style="margin-top:9px;font-size:11px;color:var(--sx-brand);background:transparent;border:0;padding:0;display:inline-flex;align-items:center;gap:4px;cursor:pointer" @click=${() => { this.showContract = true; this.chooseNav('callback') }}>查看接口契约 →</button>
        </div>
      </aside>`
  }

  private renderOverview(): TemplateResult {
    const vis = this.visibleRows()
    return html`
      <div class="sec">
        <div class="section-title">${sxIcon('users', 15)} 当前用户角色（宿主注入）</div>
        <div class="role-row">
          ${ROLES.map((r) => html`
            <button class="role-chip ${this.cfg.role === r.key ? 'on' : ''}" @click=${() => this.chooseRole(r.key)}>
              <span class="role-dot" style=${`background:${r.color}`}></span>
              <div><div class="name">${r.label}</div><div class="meta">${r.dept} · ${r.desc}</div></div>
            </button>`)}
        </div>
      </div>
      <div class="sec">
        <div class="section-title">${sxIcon('filter', 15)} 行级数据范围（宿主下发）</div>
        <div class="field-row"><label>可见部门</label>
          <select class="select" .value=${this.cfg.rowScope.dept} @change=${(e: Event) => {
            const v = (e.target as HTMLSelectElement).value
            this.patch('rowScope', { ...this.cfg.rowScope, dept: v })
            this.addLog('rowScope()', `dept=${v}`, 'allow', '宿主 ERP 后端')
          }}>
            <option>全部</option><option>销售运营部</option><option>华南分公司</option><option>华东分公司</option><option>财务部</option>
          </select>
        </div>
        <div class="field-row"><label>负责人</label>
          <input class="input" .value=${this.cfg.rowScope.owner} @change=${(e: Event) => this.patch('rowScope', { ...this.cfg.rowScope, owner: (e.target as HTMLInputElement).value })} />
        </div>
        <div class="field-row"><label>命中记录</label><span style="font-size:12px;color:var(--sx-brand);font-weight:600">${vis.length} / ${SECURE_ROWS.length} 条</span></div>
      </div>
      <div class="sec">
        <div class="section-title">${sxIcon('tableStyle', 15)} 数据视图（当前角色 + 范围投影）</div>
        ${this.renderTable()}
      </div>`
  }

  private renderTable(): TemplateResult {
    const visible = this.cfg.columns.filter((c) => c.visible)
    const rows = this.visibleRows()
    return html`
      <div style="overflow-x:auto;border:1px solid var(--sx-border);border-radius:6px">
        <table class="data-table">
          <thead><tr>${visible.map((c) => html`<th style="width:${c.key === 'idcard' ? '20%' : '16%'}">${c.title}</th>`)}</tr></thead>
          <tbody>
            ${rows.length === 0 ? html`<tr><td colspan=${visible.length} style="text-align:center;padding:18px;color:var(--sx-text-hint)">当前行范围无可见数据（由宿主 scope 决定）</td></tr>` : nothing}
            ${rows.map((row) => html`
              <tr>${visible.map((c) => {
                const ro = this.isReadonly(row.id, c.key, c)
                const masked = c.mask && !this.cfg.revealSensitive
                return html`
                  <td class="${ro ? 'ro' : ''} ${masked ? 'masked' : ''}" @click=${() => this.attemptEdit(row.id, c)} title=${ro ? '只读（宿主 canEdit=false）' : '点击请求编辑权限'}>
                    ${this.cellValue(row, c)}
                    ${ro ? html`<span class="ro-badge">${sxIcon('lock', 9)} 只读</span>` : ''}
                  </td>`
              })}</tr>`)}
          </tbody>
        </table>
      </div>`
  }

  private renderColumnPerm(): TemplateResult {
    return html`
      <div class="sec">
        <div class="section-title">${sxIcon('tableStyle', 15)} 列级权限矩阵（宿主下发）</div>
        <table class="perm-table">
          <thead><tr><th>字段</th><th>可见</th><th>可编辑</th><th>脱敏</th><th>权限来源</th></tr></thead>
          <tbody>
            ${this.cfg.columns.map((c) => html`
              <tr>
                <td class="name-col">${c.title}${c.sensitive ? html`<span class="tag-sensitive">敏感</span>` : ''}</td>
                <td><button class="toggle-sm ${c.visible ? 'on' : ''}" @click=${() => this.toggleColumn(c.key, 'visible')}><span class="knob"></span></button></td>
                <td><button class="toggle-sm ${c.editable ? 'on' : ''}" @click=${() => this.toggleColumn(c.key, 'editable')}><span class="knob"></span></button></td>
                <td><button class="toggle-sm ${c.mask ? 'on' : ''}" @click=${() => this.toggleColumn(c.key, 'mask')}><span class="knob"></span></button></td>
                <td style="font-size:10px;color:var(--sx-success)">宿主 ERP 后端</td>
              </tr>`)}
          </tbody>
        </table>
        <div class="tip" style="margin-top:12px">
          <span class="ic">${sxIcon('infoCircle', 15)}</span>
          <span>列级权限矩阵由宿主接口下发，SheetX 只按结果控制 <b>显示 / 编辑 / 脱敏</b> 的 UX；即使前端隐藏了字段，后端 API 仍必须独立校验。</span>
        </div>
      </div>
      <div class="sec">${this.renderTable()}</div>`
  }

  private renderCellPerm(): TemplateResult {
    return html`
      <div class="sec">
        <div class="section-title">${sxIcon('lock', 15)} 单元格只读例外（canEdit 返回 false）</div>
        <div style="font-size:11.5px;color:var(--sx-text-hint)">点击切换只读状态；只读格点击时引擎会先调用宿主 canEdit 回调，返回 false 则拒绝进入编辑。</div>
        <div style="display:flex;flex-wrap:wrap;gap:7px;margin-top:11px">
          ${SECURE_ROWS.flatMap((r) => ['customer', 'amount', 'phone'].map((k) => {
            const key = `${r.id}|${k}`
            const on = this.cfg.readonlyCells.includes(key)
            return html`<button class="chip ${on ? 'on' : ''}" style="padding:5px 9px;border:1px solid var(--sx-border-input);border-radius:5px;background:var(--sx-bg-surface);color:${on ? 'var(--sx-brand)' : 'var(--sx-text-secondary)'};font-size:10.5px;cursor:pointer" @click=${() => this.toggleReadonly(key)}>${key}</button>`
          }))}
        </div>
      </div>
      <div class="sec">
        <div class="section-title">数据视图（灰底 = 只读）</div>
        ${this.renderTable()}
      </div>`
  }

  private renderRowPerm(): TemplateResult {
    return html`
      <div class="sec">
        <div class="section-title">${sxIcon('filter', 15)} 行级数据范围</div>
        <div class="field-row"><label>可见部门</label>
          <select class="select" .value=${this.cfg.rowScope.dept} @change=${(e: Event) => {
            this.patch('rowScope', { ...this.cfg.rowScope, dept: (e.target as HTMLSelectElement).value })
            this.addLog('rowScope()', `dept=${(e.target as HTMLSelectElement).value}`, 'allow', '宿主 ERP 后端')
          }}>
            <option>全部</option><option>销售运营部</option><option>华南分公司</option><option>华东分公司</option><option>财务部</option>
          </select>
        </div>
        <div class="field-row"><label>负责人</label>
          <input class="input" .value=${this.cfg.rowScope.owner} @change=${(e: Event) => this.patch('rowScope', { ...this.cfg.rowScope, owner: (e.target as HTMLInputElement).value })} />
        </div>
        <div class="tip" style="margin-top:12px">
          <span class="ic">${sxIcon('infoCircle', 15)}</span>
          <span>行范围由宿主 <b>rowScope(user)</b> 返回（如部门 / 负责人 / 租户）；前端只做投影展示，真实的行过滤必须在宿主 API 查询时执行。</span>
        </div>
      </div>
      <div class="sec">${this.renderTable()}</div>`
  }

  private renderMask(): TemplateResult {
    return html`
      <div class="sec">
        <div class="section-title">${sxIcon('eye', 15)} 敏感字段脱敏</div>
        <label class="check-row" @click=${() => {
          this.patch('revealSensitive', !this.cfg.revealSensitive)
          this.addLog('canView()', this.cfg.revealSensitive ? 'restore mask' : 'reveal sensitive', this.cfg.revealSensitive ? 'masked' : 'allow', '宿主 ERP 后端')
        }}>
          <span class="check-box ${this.cfg.revealSensitive ? 'on' : ''}">${this.cfg.revealSensitive ? sxIcon('check', 10) : ''}</span>
          显示完整敏感字段（需宿主 canView 返回 full）
        </label>
        <div class="tip" style="margin-top:12px">
          <span class="ic">${sxIcon('warnTriangle', 15)}</span>
          <span>前端脱敏只防"肩窥"，<b>不是安全措施</b>。真正的敏感数据保护必须由宿主后端在 API 响应层完成，前端拿到的就不应是明文。</span>
        </div>
      </div>
      <div class="sec">${this.renderTable()}</div>`
  }

  private renderCallback(): TemplateResult {
    return html`
      <div class="sec">
        <div class="section-title">${sxIcon('terminal', 15)} 权限接口契约</div>
        <div class="doc-box">${PERM_CONTRACT}</div>
        <button class="btn" style="margin-top:11px;height:32px;padding:0 12px;border:1px solid var(--sx-border-input);border-radius:6px;background:var(--sx-bg-surface);color:var(--sx-text-primary);font-size:11.5px" @click=${() => { this.showContract = !this.showContract }}>
          ${this.showContract ? '收起' : '查看完整调用示例'}
        </button>
        ${this.showContract ? html`<div class="doc-box" style="margin-top:10px">${CONTRACT_STEPS}</div>` : nothing}
      </div>
      <div class="sec">
        <div class="section-title">${sxIcon('shield', 15)} 决策来源</div>
        <div class="tip">
          <span class="ic">${sxIcon('checkCircle', 15)}</span>
          <span>本页所有 allow / deny / masked 结果均标注来源为 <b>宿主 ERP 后端</b>；SheetX 不内置权限表、不自行裁决。</span>
        </div>
      </div>`
  }

  private renderCenter(): TemplateResult {
    const body =
      this.nav === 'column' ? this.renderColumnPerm() :
      this.nav === 'cell' ? this.renderCellPerm() :
      this.nav === 'row' ? this.renderRowPerm() :
      this.nav === 'mask' ? this.renderMask() :
      this.nav === 'callback' ? this.renderCallback() : this.renderOverview()
    return html`
      <div class="center">
        <div class="panel">
          <div class="panel-head">
            <span class="head-icon">${sxIcon('shield', 20)}</span>
            <div><h3>数据权限与安全控制</h3><p>列级 / 单元格 / 行级 / 脱敏 / 编辑回调，全部由宿主授权</p></div>
            <span class="pill"><span class="dot"></span>接口已注入</span>
          </div>
          ${body}
        </div>
      </div>`
  }

  private renderRight(): TemplateResult {
    return html`
      <aside class="right">
        <div class="right-head">${sxIcon('terminal', 16)} 权限回调调试
          <span class="online">● 宿主在线</span>
        </div>
        <button class="test-btn" ?disabled=${this.testing} @click=${() => void this.runCallback('edit')}>
          ${this.testing ? '调用中…' : html`${sxIcon('play', 11)} 模拟 canEdit（编辑权限）`}
        </button>
        <button class="test-btn" style="margin-top:0" ?disabled=${this.testing} @click=${() => void this.runCallback('view')}>
          ${this.testing ? '调用中…' : html`${sxIcon('play', 11)} 模拟 canView（脱敏决策）`}
        </button>
        ${this.lastTest ? html`
          <div class="panel" style="padding:10px;margin-bottom:10px;border-color:${this.lastTest.allow ? 'var(--sx-success)' : 'var(--sx-danger)'}">
            <div style="font-size:11.5px;font-weight:600">${this.lastTest.action}</div>
            <div style="font:10px/1.6 'SF Mono',Menlo,monospace;color:var(--sx-text-hint);margin-top:4px">${this.lastTest.detail}</div>
            <div style="margin-top:6px;font-size:11px">宿主返回：<b style="color:${this.lastTest.allow ? 'var(--sx-success)' : 'var(--sx-danger)'}">${this.lastTest.result}</b></div>
          </div>` : nothing}
        <div style="font-size:11.5px;font-weight:600;margin-bottom:6px">调用日志（最近 8 条）</div>
        ${this.logs.slice(0, 8).map((log) => {
          const st = RESULT_STYLE[log.result]!
          return html`
            <div class="log-row">
              <div class="log-top">
                <span class="time">${log.time}</span>
                <span class="act">${log.action}</span>
                <span class="res" style="background:${st.bg};color:${st.color}">${st.label}</span>
              </div>
              <div class="log-detail">${log.detail}</div>
              <div class="log-source">← ${log.source}</div>
            </div>`
        })}
      </aside>`
  }

  render(): TemplateResult {
    return html`
      <div class="app" data-perm-theme=${this.theme}>
        ${this.renderTop()}
        ${this.renderToolbar()}
        <div class="shell">
          ${this.renderSidebar()}
          ${this.renderCenter()}
          ${this.renderRight()}
        </div>
        ${this.deniedAttempt ? html`
          <div class="toast" style="position:fixed;left:18px;bottom:18px;z-index:700;display:flex;align-items:center;gap:9px;padding:11px 14px;border-radius:8px;background:var(--sx-danger);color:#fff;font-size:12px">
            ${sxIcon('lock', 16)} <span>编辑已拦截：宿主 canEdit 拒绝 ${this.deniedAttempt}（只读 / 无权限）</span>
            <button class="icon-btn" style="color:#fff" @click=${() => { this.deniedAttempt = null }}>${sxIcon('close', 12)}</button>
          </div>` : nothing}
      </div>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'permission-app': PermissionApp
  }
}
