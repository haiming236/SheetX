/**
 * SheetX 第 23 张 · 多视图与视图管理
 *
 * 同一份数据（SALES_ROWS）在表格/卡片/看板/分组视图之间切换；
 * 视图配置（名称/类型/分组字段/看板列/卡片大小）可保存为个人视图并持久化。
 * 与 @sheetx/core 的 ViewManager / groupRows 同构（playground 不额外加依赖）。
 */
import { LitElement, html, nothing, type TemplateResult } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { baseStyles, lightTokens } from './tokens.js'
import { bindPageTheme, toggleTheme as toggleGlobalTheme } from './theme.js'
import { multiViewStyles } from './multiview-styles.js'
import { sxIcon, sxLogo, type IconName } from './icons.js'
import { toast } from './toast.js'
import {
  SALES_ROWS, VIEW_TYPES, INITIAL_VIEWS, VIEW_KEY, KANBAN_COLUMNS, STATUS_STYLE,
  PRODUCT_ICONS, CARD_SIZES, groupRows,
  type ViewDef, type ViewType, type SalesRow,
} from './multiview-data.js'

const TOP_MENUS = ['文件', '开始', '插入', '数据', '公式', '视图', '设置']
const TYPE_OF: Record<ViewType, string> = { table: 'gridView', card: 'listView', kanban: 'colsV', group: 'group' }

@customElement('multiview-app')
export class MultiViewApp extends LitElement {
  static styles = [baseStyles, lightTokens, multiViewStyles]

  @state() private theme: 'light' | 'dark' = 'light'
  @state() private activeMenu = '视图'
  @state() private views: ViewDef[] = this.loadViews()
  @state() private currentId = 'v1'
  @state() private cardSize: 'small' | 'medium' | 'large' = 'medium'
  @state() private expandedGroups = new Set<string>()
  @state() private showSettings = false
  @state() private showNewView = false
  @state() private newName = ''
  @state() private newType: ViewType = 'table'
  @state() private newGroupBy = 'region'
  @state() private activeSheet = '销售数据'
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

  private loadViews(): ViewDef[] {
    try {
      const parsed = JSON.parse(localStorage.getItem(VIEW_KEY) ?? 'null')
      return Array.isArray(parsed) && parsed.length > 0 ? parsed as ViewDef[] : INITIAL_VIEWS
    } catch {
      return INITIAL_VIEWS
    }
  }

  private persist(): void {
    try { localStorage.setItem(VIEW_KEY, JSON.stringify(this.views)) } catch { /* 忽略 */ }
  }

  private get current(): ViewDef {
    return this.views.find((view) => view.id === this.currentId) ?? this.views[0]!
  }

  private switchView(id: string): void {
    this.currentId = id
    const view = this.get(id)
    if (view?.cardSize) this.cardSize = view.cardSize
    toast(`已切换视图：${view?.name ?? ''}`)
  }

  private get(id: string): ViewDef | undefined {
    return this.views.find((view) => view.id === id)
  }

  private switchType(type: ViewType): void {
    const view = this.current
    this.views = this.views.map((item) => item.id === view.id ? { ...item, type } : item)
    this.persist()
    toast(`当前视图切换为：${VIEW_TYPES.find((item) => item.key === type)?.label}`)
  }

  private createView(): void {
    const name = this.newName.trim() || `新视图 ${this.views.length + 1}`
    const view: ViewDef = {
      id: `v${Date.now().toString(36)}`,
      name,
      type: this.newType,
      personal: true,
      groupBy: this.newType === 'group' ? this.newGroupBy : undefined,
      boardBy: this.newType === 'kanban' ? 'status' : undefined,
      cardSize: this.newType === 'card' ? this.cardSize : undefined,
    }
    this.views = [...this.views, view]
    this.currentId = view.id
    this.showNewView = false
    this.newName = ''
    this.persist()
    toast(`已创建个人视图：${name}`)
  }

  private deleteView(id: string): void {
    if (this.views.length <= 1) { toast('至少保留一个视图'); return }
    this.views = this.views.filter((view) => view.id !== id)
    if (this.currentId === id) this.currentId = this.views[0]!.id
    this.persist()
    toast('视图已删除')
  }

  private toggleGroup(key: string): void {
    const next = new Set(this.expandedGroups)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    this.expandedGroups = next
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
        <button class="tb" title="撤销">${sxIcon('undo', 16)}</button>
        <button class="tb" title="重做">${sxIcon('redo', 16)}</button>
        <span class="tb-sep"></span>
        <button class="tb border" @click=${() => toast('多视图')}>${sxIcon('gridView', 15)} 多视图 ${sxIcon('chevronDown', 11)}</button>
        <button class="tb border" @click=${() => { toast('数据已刷新'); this.requestUpdate() }}>${sxIcon('refresh', 15)} 刷新</button>
        <button class="tb border" @click=${() => toast('导出当前视图')}>${sxIcon('download', 15)} 导出 ${sxIcon('chevronDown', 11)}</button>
        <button class="tb border" @click=${() => toast('分享视图链接')}>${sxIcon('link', 15)} 分享</button>
        <button class="tb border" @click=${() => toast('已收藏当前视图')}>${sxIcon('checkCircle', 15)} 收藏视图</button>
        <button class="tb border right" @click=${() => { this.showSettings = true }}>${sxIcon('settings', 15)} 视图管理 ${sxIcon('chevronDown', 11)}</button>
        <button class="tb primary" @click=${() => { this.showNewView = true }}>＋ 新建视图</button>
      </div>`
  }

  private renderSidebar(): TemplateResult {
    return html`
      <aside class="sidebar">
        <div class="side-title">视图类型</div>
        ${VIEW_TYPES.map((type) => html`
          <button class="side-item ${this.current.type === type.key ? 'active' : ''}" @click=${() => this.switchType(type.key)}>
            ${sxIcon(type.icon as IconName, 15)} ${type.label}
          </button>`)}
        <div class="side-div"></div>
        <div class="side-title">我的视图</div>
        ${this.views.filter((view) => view.personal).map((view) => html`
          <button class="side-item ${this.currentId === view.id ? 'active' : ''}" @click=${() => this.switchView(view.id)}>
            ${sxIcon(TYPE_OF[view.type] as IconName, 15)} ${view.name}
            <span class="star">★</span>
          </button>`)}
        <div class="side-title">共享视图</div>
        ${this.views.filter((view) => !view.personal).map((view) => html`
          <button class="side-item ${this.currentId === view.id ? 'active' : ''}" @click=${() => this.switchView(view.id)}>
            ${sxIcon(TYPE_OF[view.type] as IconName, 15)} ${view.name}
          </button>`)}
        <div class="side-div"></div>
        <button class="side-item" @click=${() => { this.showSettings = true }}>${sxIcon('settings', 15)} 管理视图设置...</button>
      </aside>`
  }

  private renderTabs(): TemplateResult {
    return html`
      <div class="tabs">
        ${VIEW_TYPES.map((type) => html`
          <button class="view-tab ${this.current.type === type.key ? 'active' : ''}" @click=${() => this.switchType(type.key)}>
            ${sxIcon(type.icon as IconName, 15)} ${type.label}
          </button>`)}
      </div>`
  }

  private renderTablePanel(): TemplateResult {
    const total = SALES_ROWS.reduce((sum, row) => sum + row.amount, 0)
    return html`
      <div class="panel">
        <div class="panel-head">${sxIcon('gridView', 15)} 表格视图 — 销售数据明细
          <span class="right">共 ${(1250).toLocaleString()} 条数据</span>
        </div>
        <div class="panel-body">
          <table class="grid">
            <thead><tr><th>#</th><th>地区</th><th>产品名称</th><th>销售额（元）</th><th>订单日期</th><th>状态</th></tr></thead>
            <tbody>
              ${SALES_ROWS.map((row, index) => {
                const style = STATUS_STYLE[row.status]
                return html`
                  <tr>
                    <td>${index + 1}</td><td>${row.region}</td><td>${row.product}</td>
                    <td class="num">${row.amount.toLocaleString()}</td><td>${row.date}</td>
                    <td><span class="status-pill" style="color:${style.color};background:${style.background}">${row.status}</span></td>
                  </tr>`
              })}
              <tr class="foot"><td></td><td>共 ${SALES_ROWS.length} 条</td><td></td><td class="num">${total.toLocaleString()}</td><td></td><td></td></tr>
            </tbody>
          </table>
        </div>
      </div>`
  }

  private renderCardPanel(): TemplateResult {
    const width = this.cardSize === 'small' ? 150 : this.cardSize === 'large' ? 260 : 200
    return html`
      <div class="panel">
        <div class="panel-head">${sxIcon('listView', 15)} 卡片视图 — 销售订单
          <span class="right">卡片大小
            <select style="height:24px;border:1px solid var(--sx-border-input);border-radius:4px;background:var(--sx-bg-surface);font-size:11px"
              .value=${this.cardSize} @change=${(event: Event) => {
                this.cardSize = (event.target as HTMLSelectElement).value as typeof this.cardSize
                this.views = this.views.map((view) => view.id === this.currentId ? { ...view, cardSize: this.cardSize } : view)
                this.persist()
              }}>
              ${CARD_SIZES.map((size) => html`<option value=${size.key}>${size.label}</option>`)}
            </select>
          </span>
        </div>
        <div class="panel-body">
          <div class="card-grid" style="--card-w:${width}px">
            ${SALES_ROWS.map((row) => {
              const style = STATUS_STYLE[row.status]
              return html`
                <div class="order-card">
                  <button class="more" title="更多" @click=${() => toast('卡片操作')}>⋮</button>
                  <div class="thumb">${PRODUCT_ICONS[row.product] ?? '📦'}</div>
                  <div class="title">${row.product}</div>
                  <div class="amount">¥${row.amount.toLocaleString()}</div>
                  <div class="meta"><span>${row.region} · ${row.date}</span>
                    <span class="status-pill" style="color:${style.color};background:${style.background}">${row.status}</span>
                  </div>
                </div>`
            })}
          </div>
        </div>
      </div>`
  }

  private renderKanbanPanel(): TemplateResult {
    return html`
      <div class="panel">
        <div class="panel-head">${sxIcon('colsV', 15)} 看板视图 — 订单状态
          <span class="right">按状态分列 · 共 ${SALES_ROWS.length} 条</span>
        </div>
        <div class="panel-body">
          <div class="kanban">
            ${KANBAN_COLUMNS.map((column) => {
              const rows = SALES_ROWS.filter((row) => row.status === column.key)
              return html`
                <div class="kanban-col">
                  <div class="kanban-head" style="background:${column.background}">
                    <span>${column.key}</span><span class="count">${rows.length}</span>
                  </div>
                  <div class="kanban-body">
                    ${rows.map((row) => html`
                      <div class="kanban-card">
                        <div class="name">${row.product}</div>
                        <div class="amount">¥${row.amount.toLocaleString()}</div>
                        <div class="owner">👤 ${row.owner} · ${row.date}</div>
                      </div>`)}
                    <button class="add-card" @click=${() => toast(`在「${column.key}」添加卡片`)}>＋ 添加卡片</button>
                  </div>
                </div>`
            })}
          </div>
        </div>
      </div>`
  }

  private renderGroupPanel(): TemplateResult {
    const field = (this.current.groupBy ?? 'region') as keyof SalesRow
    const label = field === 'region' ? '地区' : field === 'product' ? '产品' : '字段'
    const buckets = groupRows(SALES_ROWS, field)
    const sum = buckets.reduce((acc, bucket) => acc + bucket.total, 0)
    return html`
      <div class="panel">
        <div class="panel-head">${sxIcon('group', 15)} 分组视图 — 按${label}统计
          <span class="right">
            <select style="height:24px;border:1px solid var(--sx-border-input);border-radius:4px;background:var(--sx-bg-surface);font-size:11px"
              .value=${field} @change=${(event: Event) => {
                const next = (event.target as HTMLSelectElement).value
                this.views = this.views.map((view) => view.id === this.currentId ? { ...view, groupBy: next } : view)
                this.persist()
              }}>
              <option value="region">按地区</option><option value="product">按产品</option><option value="status">按状态</option>
            </select>
            　展开全部
            <button class="tb" style="height:22px" @click=${() => {
              this.expandedGroups = new Set(buckets.map((bucket) => bucket.key))
            }}>▾</button>
          </span>
        </div>
        <div class="panel-body">
          <table class="grid group-table">
            <thead><tr><th>${label}</th><th>销售额（元）</th><th>订单数</th><th>占比</th></tr></thead>
            <tbody>
              ${buckets.flatMap((bucket) => {
                const expanded = this.expandedGroups.has(bucket.key)
                return [
                  html`
                    <tr class="group-row" @click=${() => this.toggleGroup(bucket.key)}>
                      <td><span class="caret">${expanded ? '▾' : '▸'}</span>${bucket.key}</td>
                      <td class="num">${bucket.total.toLocaleString()}</td>
                      <td class="num">${bucket.rows.length}</td>
                      <td class="num">${((bucket.total / (sum || 1)) * 100).toFixed(1)}%</td>
                    </tr>`,
                  ...(expanded ? bucket.rows.map((row) => html`
                    <tr class="child">
                      <td>　└ ${row.product}</td><td class="num">${row.amount.toLocaleString()}</td>
                      <td class="num">1</td><td></td>
                    </tr>`) : []),
                ]
              })}
              <tr class="sum"><td>合计</td><td class="num">${sum.toLocaleString()}</td><td class="num">${SALES_ROWS.length}</td><td class="num">100%</td></tr>
            </tbody>
          </table>
        </div>
      </div>`
  }

  private renderContent(): TemplateResult {
    switch (this.current.type) {
      case 'card': return this.renderCardPanel()
      case 'kanban': return this.renderKanbanPanel()
      case 'group': return this.renderGroupPanel()
      default: return this.renderTablePanel()
    }
  }

  private renderSettings(): TemplateResult {
    return html`
      <div class="modal-mask" @click=${(event: Event) => {
        if (event.target === event.currentTarget) this.showSettings = false
      }}>
        <div class="modal">
          <div class="modal-head"><span>管理视图设置</span>
            <button class="tb" @click=${() => { this.showSettings = false }}>${sxIcon('close', 15)}</button>
          </div>
          <div class="modal-body">
            <table class="grid">
              <thead><tr><th>视图名称</th><th>类型</th><th>范围</th><th></th></tr></thead>
              <tbody>
                ${this.views.map((view) => html`
                  <tr>
                    <td>${view.name}</td>
                    <td>${VIEW_TYPES.find((item) => item.key === view.type)?.label}</td>
                    <td>${view.personal ? '个人' : '共享'}</td>
                    <td><button class="tb" title="删除" @click=${() => this.deleteView(view.id)}>${sxIcon('trash', 13)}</button></td>
                  </tr>`)}
              </tbody>
            </table>
            <div style="margin-top:10px;font-size:11px;color:var(--sx-text-hint)">
              视图配置保存在 localStorage（<code>${VIEW_KEY}</code>），刷新后保留；生产环境可同步到服务器。
            </div>
          </div>
          <div class="modal-foot"><button class="btn btn-primary" @click=${() => { this.showSettings = false }}>完成</button></div>
        </div>
      </div>`
  }

  private renderNewView(): TemplateResult {
    return html`
      <div class="modal-mask" @click=${(event: Event) => {
        if (event.target === event.currentTarget) this.showNewView = false
      }}>
        <div class="modal">
          <div class="modal-head"><span>新建视图</span>
            <button class="tb" @click=${() => { this.showNewView = false }}>${sxIcon('close', 15)}</button>
          </div>
          <div class="modal-body">
            <div class="view-form">
              <div class="form-row"><label>视图名称</label>
                <input placeholder="例如：重点客户看板" .value=${this.newName}
                  @input=${(event: Event) => { this.newName = (event.target as HTMLInputElement).value }} />
              </div>
              <div class="form-row"><label>视图类型</label>
                <select .value=${this.newType} @change=${(event: Event) => {
                  this.newType = (event.target as HTMLSelectElement).value as ViewType
                }}>
                  ${VIEW_TYPES.map((type) => html`<option value=${type.key}>${type.label}</option>`)}
                </select>
              </div>
              ${this.newType === 'group' ? html`
                <div class="form-row"><label>分组字段</label>
                  <select .value=${this.newGroupBy} @change=${(event: Event) => {
                    this.newGroupBy = (event.target as HTMLSelectElement).value
                  }}>
                    <option value="region">地区</option><option value="product">产品</option><option value="status">状态</option>
                  </select>
                </div>` : nothing}
              <label class="check-line"><input type="checkbox" checked /> 保存为个人视图</label>
            </div>
          </div>
          <div class="modal-foot">
            <button class="btn" @click=${() => { this.showNewView = false }}>取消</button>
            <button class="btn btn-primary" @click=${this.createView}>创建</button>
          </div>
        </div>
      </div>`
  }

  render(): TemplateResult {
    return html`
      <div class="app" data-theme=${this.theme}>
        ${this.renderTopbar()}
        ${this.renderToolbar()}
        <div class="body">
          ${this.renderSidebar()}
          <div class="main">
            ${this.renderTabs()}
            <div class="content">${this.renderContent()}</div>
          </div>
        </div>
        <div class="sheet-tabs">
          ${['销售数据', '数据分析', '季度报表'].map((name) => html`
            <button class="sheet-tab ${this.activeSheet === name ? 'active' : ''}" @click=${() => { this.activeSheet = name }}>${name}</button>`)}
        </div>
        <div class="statusbar">
          <span>平均值: 125,000　计数: 1,250　求和: 1,530,000</span>
          <span class="right"><span>${this.current.name}</span><span>视图 ${this.views.length} 个</span><span>100%</span></span>
        </div>
        ${this.showSettings ? this.renderSettings() : nothing}
        ${this.showNewView ? this.renderNewView() : nothing}
      </div>`
  }
}

declare global {
  interface HTMLElementTagNameMap { 'multiview-app': MultiViewApp }
}
