/**
 * SheetX 第 22 张 · 多维数据筛选与高级查询
 *
 * 筛选逻辑与 @sheetx/data-adapter 的 evaluateGroup 同构：
 * 条件组内 AND/OR、组间 AND、条件可禁用；真实过滤表格并显示命中数/条件贡献度。
 * 方案可保存与快速切换（序列化到 localStorage）。
 */
import { LitElement, html, nothing, type TemplateResult } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { baseStyles, lightTokens } from './tokens.js'
import { bindPageTheme, toggleTheme as toggleGlobalTheme } from './theme.js'
import { advFilterStyles } from './advfilter-styles.js'
import { sxIcon, sxLogo } from './icons.js'
import { toast } from './toast.js'
import {
  CUSTOMER_ROWS, COLUMNS, FIELD_OPTIONS, OPERATOR_LABELS, DEFAULT_GROUPS, DEFAULT_SCHEMES,
  STATUS_STYLE, matchCondition, matchAll, countBy,
  type CustomerRow, type FieldKey, type Operator, type Condition, type ConditionGroup, type SavedScheme,
} from './advfilter-data.js'

const TOP_MENUS = ['文件', '开始', '插入', '数据', '公式', '视图', '设置']
const SCHEME_KEY = 'sx:filter-schemes'
const VALUE_PRESETS: Record<FieldKey, string[]> = {
  region: ['华东', '华南', '华北', '西南', '华中'],
  category: ['笔记本电脑', '平板电脑', '智能手机', '显示器'],
  amount: ['100000', '120000', '80000', '150000'],
  status: ['已完成', '进行中', '未开始'],
  name: ['华东科技', '创新电子', '智联网络'],
  date: ['2025-01-15', '2025-01-20', '2025-01-25'],
}

@customElement('advfilter-app')
export class AdvFilterApp extends LitElement {
  static styles = [baseStyles, lightTokens, advFilterStyles]

  @state() private theme: 'light' | 'dark' = 'light'
  @state() private activeMenu = '数据'
  @state() private tab: 'combine' | 'quick' | 'schemes' = 'combine'
  @state() private groups: ConditionGroup[] = this.cloneGroups(DEFAULT_GROUPS)
  @state() private schemes: SavedScheme[] = this.loadSchemes()
  @state() private activeScheme: string | null = null
  @state() private schemeName = ''
  @state() private includeHeader = true
  @state() private applied = false
  @state() private facets: Record<string, Set<string>> = {
    region: new Set(), category: new Set(), status: new Set(),
  }
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

  private cloneGroups(groups: ReadonlyArray<ConditionGroup>): ConditionGroup[] {
    return groups.map((group) => ({ ...group, conditions: group.conditions.map((condition) => ({ ...condition })) }))
  }

  private loadSchemes(): SavedScheme[] {
    try {
      const parsed = JSON.parse(localStorage.getItem(SCHEME_KEY) ?? 'null')
      return Array.isArray(parsed) && parsed.length > 0 ? parsed as SavedScheme[] : DEFAULT_SCHEMES
    } catch {
      return DEFAULT_SCHEMES
    }
  }

  private persistSchemes(): void {
    try { localStorage.setItem(SCHEME_KEY, JSON.stringify(this.schemes)) } catch { /* 存储不可用时忽略 */ }
  }

  private get activeConditions(): Condition[] {
    return this.groups.flatMap((group) => group.conditions.filter((condition) => condition.enabled))
  }

  private get filteredRows(): CustomerRow[] {
    if (!this.applied) return CUSTOMER_ROWS
    return CUSTOMER_ROWS.filter((row) => matchAll(row, this.groups)).filter((row) => {
      for (const [field, selected] of Object.entries(this.facets)) {
        if (selected.size > 0 && !selected.has(String(row[field as FieldKey]))) return false
      }
      return true
    })
  }

  private get total(): number {
    return this.filteredRows.reduce((sum, row) => sum + row.amount, 0)
  }

  private patchCondition(groupId: string, conditionId: string, patch: Partial<Condition>): void {
    this.groups = this.groups.map((group) => group.id !== groupId ? group : {
      ...group,
      conditions: group.conditions.map((condition) =>
        condition.id === conditionId ? { ...condition, ...patch } : condition),
    })
    this.activeScheme = null
  }

  private addCondition(groupId: string): void {
    this.groups = this.groups.map((group) => group.id !== groupId ? group : {
      ...group,
      conditions: [...group.conditions, {
        id: `c${Date.now().toString(36)}`, field: 'region', op: 'eq', value: '', enabled: true,
      }],
    })
    this.activeScheme = null
  }

  private removeCondition(groupId: string, conditionId: string): void {
    this.groups = this.groups.map((group) => group.id !== groupId ? group : {
      ...group, conditions: group.conditions.filter((condition) => condition.id !== conditionId),
    })
    this.activeScheme = null
  }

  private toggleGroupLogic(groupId: string): void {
    this.groups = this.groups.map((group) => group.id === groupId
      ? { ...group, logic: group.logic === 'and' ? 'or' : 'and' }
      : group)
    this.activeScheme = null
  }

  private removeGroup(groupId: string): void {
    this.groups = this.groups.filter((group) => group.id !== groupId)
    this.activeScheme = null
  }

  private addGroup(): void {
    const index = this.groups.length + 1
    this.groups = [...this.groups, {
      id: `g${Date.now().toString(36)}`,
      logic: 'or',
      label: `条件组 ${index}（满足以下任一条件）`,
      conditions: [{ id: `c${Date.now().toString(36)}`, field: 'status', op: 'eq', value: '已完成', enabled: true }],
    }]
  }

  private apply(): void {
    this.applied = true
    toast(`筛选已应用：命中 ${this.filteredRows.length} / ${CUSTOMER_ROWS.length} 行`)
  }

  private reset(): void {
    this.groups = this.cloneGroups(DEFAULT_GROUPS)
    this.applied = false
    this.facets = { region: new Set(), category: new Set(), status: new Set() }
    this.activeScheme = null
    toast('筛选条件已重置')
  }

  private saveScheme(): void {
    const name = this.schemeName.trim() || `筛选方案 ${this.schemes.length + 1}`
    const scheme: SavedScheme = {
      id: `s${Date.now().toString(36)}`,
      name,
      groups: this.cloneGroups(this.groups),
    }
    this.schemes = [scheme, ...this.schemes]
    this.activeScheme = scheme.id
    this.schemeName = ''
    this.persistSchemes()
    toast(`已保存方案：${name}`)
  }

  private applyScheme(scheme: SavedScheme): void {
    this.groups = this.cloneGroups(scheme.groups)
    this.activeScheme = scheme.id
    this.applied = true
    toast(`已切换方案：${scheme.name}`)
  }

  private deleteScheme(id: string): void {
    this.schemes = this.schemes.filter((scheme) => scheme.id !== id)
    if (this.activeScheme === id) this.activeScheme = null
    this.persistSchemes()
    toast('方案已删除')
  }

  private toggleFacet(field: string, value: string): void {
    const next = new Set(this.facets[field] ?? [])
    if (next.has(value)) next.delete(value)
    else next.add(value)
    this.facets = { ...this.facets, [field]: next }
    this.applied = true
  }

  private clearFacets(): void {
    this.facets = { region: new Set(), category: new Set(), status: new Set() }
    this.applied = false
    toast('筛选已清除')
  }

  private conditionHits(condition: Condition): number {
    return CUSTOMER_ROWS.filter((row) => matchCondition(row, condition)).length
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
        <button class="tb active" title="筛选" @click=${() => toast('高级筛选')}>${sxIcon('filter', 15)} 筛选 ${sxIcon('chevronDown', 11)}</button>
        <button class="tb" title="排序" @click=${() => toast('排序')}>${sxIcon('sort', 15)} 排序</button>
        <button class="tb" title="条件格式" @click=${() => toast('条件格式')}>${sxIcon('conditional', 15)} 条件格式 ${sxIcon('chevronDown', 11)}</button>
        <button class="tb" title="数据验证" @click=${() => toast('数据验证')}>${sxIcon('validation', 15)} 数据验证</button>
        <button class="tb" title="数据透视表" @click=${() => toast('数据透视表')}>${sxIcon('pivot', 15)} 数据透视表 ${sxIcon('chevronDown', 11)}</button>
        <button class="tb" title="查找替换" @click=${() => toast('查找替换')}>${sxIcon('search', 15)} 查找替换</button>
      </div>
      <div class="formula"><span class="name-box">A1</span><span class="v">客户名称</span></div>`
  }

  private renderConditionRow(group: ConditionGroup, condition: Condition): TemplateResult {
    return html`
      <div class="cond-row ${condition.enabled ? '' : 'disabled'}">
        <input type="checkbox" class="chk" title="启用条件" ?checked=${condition.enabled}
          @change=${(event: Event) => this.patchCondition(group.id, condition.id, {
            enabled: (event.target as HTMLInputElement).checked,
          })} />
        <select .value=${condition.field} @change=${(event: Event) => this.patchCondition(group.id, condition.id, {
          field: (event.target as HTMLSelectElement).value as FieldKey,
        })}>
          ${FIELD_OPTIONS.map((field) => html`<option value=${field.key}>${field.label}</option>`)}
        </select>
        <select .value=${condition.op} @change=${(event: Event) => this.patchCondition(group.id, condition.id, {
          op: (event.target as HTMLSelectElement).value as Operator,
        })}>
          ${(Object.keys(OPERATOR_LABELS) as Operator[]).map((op) => html`<option value=${op}>${OPERATOR_LABELS[op]}</option>`)}
        </select>
        ${condition.op === 'notEmpty' ? html`<span class="hint" style="font-size:11px;color:var(--sx-text-hint)">无需输入</span>` : html`
          <div class="tag-input">
            ${condition.value ? html`<span>${condition.value}<b style="cursor:pointer;margin-left:3px"
              @click=${() => this.patchCondition(group.id, condition.id, { value: '' })}>×</b></span>` : nothing}
            <input .value=${''} placeholder=${condition.value ? '' : '输入值'}
              @change=${(event: Event) => this.patchCondition(group.id, condition.id, {
                value: (event.target as HTMLInputElement).value,
              })} />
            <button class="icon-btn" title="可选值" @click=${() => toast(`可选：${(VALUE_PRESETS[condition.field] ?? []).join(' / ')}`)}>${sxIcon('chevronDown', 12)}</button>
          </div>`}
        <button class="icon-btn" title="删除条件" @click=${() => this.removeCondition(group.id, condition.id)}>${sxIcon('close', 13)}</button>
      </div>`
  }

  private renderCombineTab(): TemplateResult {
    return html`
      ${this.groups.map((group) => html`
        <div style="margin-bottom:14px">
          <div class="group-head">
            <b>${group.label}</b>
            <div class="logic">
              <button class="${group.logic === 'and' ? 'active' : ''}" @click=${() => group.logic !== 'and' && this.toggleGroupLogic(group.id)}>AND</button>
              <button class="${group.logic === 'or' ? 'active' : ''}" @click=${() => group.logic !== 'or' && this.toggleGroupLogic(group.id)}>OR</button>
            </div>
            <button class="icon-btn" title="删除条件组" @click=${() => this.removeGroup(group.id)}>${sxIcon('trash', 14)}</button>
          </div>
          ${group.conditions.map((condition) => this.renderConditionRow(group, condition))}
          <button class="add-cond" @click=${() => this.addCondition(group.id)}>＋ 添加条件</button>
        </div>`)}
      <button class="add-cond" @click=${this.addGroup}>＋ 添加条件组</button>
      <div class="divider"></div>
      <div class="inline-row">
        <select class="select" .value=${'当前工作表'} @change=${() => toast('选择范围')}>
          <option>当前工作表</option><option>整个工作簿</option><option>选定区域</option>
        </select>
        <label class="check-label">
          <input type="checkbox" ?checked=${this.includeHeader} @change=${(event: Event) => {
            this.includeHeader = (event.target as HTMLInputElement).checked
          }} /> 包含标题行
        </label>
      </div>
      <div style="margin-top:8px;font-size:11px;color:var(--sx-text-hint)">
        命中 <b style="color:var(--sx-brand)">${this.filteredRows.length}</b> / ${CUSTOMER_ROWS.length} 行 ·
        条件贡献：${this.activeConditions.map((condition) => `${condition.field}=${this.conditionHits(condition)}`).join('，') || '无'}
      </div>`
  }

  private renderQuickTab(): TemplateResult {
    const quick: Array<{ label: string; icon: string; apply: () => void }> = [
      { label: '仅看华东地区', icon: 'filter', apply: () => {
        this.groups = [{ id: 'gq', logic: 'and', label: '快速筛选', conditions: [
          { id: 'cq', field: 'region', op: 'eq', value: '华东', enabled: true },
        ] }]
        this.applied = true
      } },
      { label: '销售额 ≥ 120,000', icon: 'trendUp', apply: () => {
        this.groups = [{ id: 'gq', logic: 'and', label: '快速筛选', conditions: [
          { id: 'cq', field: 'amount', op: 'gte', value: '120000', enabled: true },
        ] }]
        this.applied = true
      } },
      { label: '已完成订单', icon: 'checkCircle', apply: () => {
        this.groups = [{ id: 'gq', logic: 'and', label: '快速筛选', conditions: [
          { id: 'cq', field: 'status', op: 'eq', value: '已完成', enabled: true },
        ] }]
        this.applied = true
      } },
      { label: '清除全部筛选', icon: 'refresh', apply: () => this.clearFacets() },
    ]
    return html`
      <div class="field-label">常用快速筛选</div>
      ${quick.map((item) => html`
        <div class="quick-item" @click=${() => { item.apply(); toast(`已应用：${item.label}`) }}>
          ${sxIcon(item.icon as never, 14)} ${item.label}
        </div>`)}
      <div class="divider"></div>
      <div class="field-label">按地区多选</div>
      ${VALUE_PRESETS.region.map((value) => html`
        <label class="facet-row">
          <input type="checkbox" ?checked=${this.facets.region?.has(value) ?? false}
            @change=${() => this.toggleFacet('region', value)} />
          ${value} <span class="count">(${countBy(CUSTOMER_ROWS, 'region').get(value) ?? 0})</span>
        </label>`)}`
  }

  private renderSchemesTab(): TemplateResult {
    return html`
      <div class="field-label">保存当前筛选为方案</div>
      <div class="inline-row">
        <input class="select" placeholder="方案名称" .value=${this.schemeName}
          @input=${(event: Event) => { this.schemeName = (event.target as HTMLInputElement).value }} />
        <button class="btn btn-primary" @click=${this.saveScheme}>保存</button>
      </div>
      <div class="divider"></div>
      <div class="field-label">已保存方案（本地持久化 · 点击即切换）</div>
      ${this.schemes.map((scheme) => html`
        <div class="scheme-item ${this.activeScheme === scheme.id ? 'active' : ''}" @click=${() => this.applyScheme(scheme)}>
          <span style="color:var(--sx-brand);display:flex">${sxIcon('filter', 15)}</span>
          <div class="meta"><b>${scheme.name}</b><span>${scheme.groups.reduce((s, g) => s + g.conditions.length, 0)} 个条件</span></div>
          <button class="icon-btn" title="删除方案" @click=${(event: Event) => {
            event.stopPropagation()
            this.deleteScheme(scheme.id)
          }}>${sxIcon('close', 13)}</button>
        </div>`)}`
  }

  private renderDialog(): TemplateResult {
    return html`
      <div class="dialog">
        <div class="dlg-head"><span>${sxIcon('filter', 17)} 高级筛选</span>
          <button class="tb" title="关闭" @click=${() => toast('高级筛选已收起')}>${sxIcon('close', 15)}</button>
        </div>
        <div class="dlg-tabs">
          <button class="dlg-tab ${this.tab === 'combine' ? 'active' : ''}" @click=${() => { this.tab = 'combine' }}>条件组合</button>
          <button class="dlg-tab ${this.tab === 'quick' ? 'active' : ''}" @click=${() => { this.tab = 'quick' }}>快速筛选</button>
          <button class="dlg-tab ${this.tab === 'schemes' ? 'active' : ''}" @click=${() => { this.tab = 'schemes' }}>保存方案</button>
        </div>
        <div class="dlg-body">
          ${this.tab === 'combine' ? this.renderCombineTab() : nothing}
          ${this.tab === 'quick' ? this.renderQuickTab() : nothing}
          ${this.tab === 'schemes' ? this.renderSchemesTab() : nothing}
        </div>
        <div class="dlg-foot">
          <button class="btn" @click=${this.reset}>重置</button>
          <button class="btn" @click=${() => toast('已取消')}>取消</button>
          <button class="btn btn-primary" @click=${this.apply}>确定</button>
        </div>
      </div>`
  }

  private renderFacetPanel(): TemplateResult {
    const facetDefs: Array<{ key: 'region' | 'category' | 'status'; label: string }> = [
      { key: 'region', label: '地区' },
      { key: 'category', label: '产品类别' },
      { key: 'status', label: '状态' },
    ]
    return html`
      <aside class="filter-panel">
        <div class="fp-head"><span>${sxIcon('filter', 16)} 筛选面板</span>
          <button class="tb" title="关闭" @click=${() => toast('筛选面板已收起')}>${sxIcon('close', 15)}</button>
        </div>
        <div class="fp-body">
          ${facetDefs.map((facet) => {
            const values = [...countBy(CUSTOMER_ROWS, facet.key).keys()]
            const selected = this.facets[facet.key] ?? new Set<string>()
            return html`
              <div class="facet">
                <div class="facet-head">
                  <span>${facet.label}</span>
                  <button @click=${() => {
                    this.facets = { ...this.facets, [facet.key]: new Set() }
                  }}>全部 ${selected.size === 0 ? '✓' : ''}</button>
                </div>
                ${values.map((value) => html`
                  <label class="facet-row">
                    <input type="checkbox" ?checked=${selected.has(value)} @change=${() => this.toggleFacet(facet.key, value)} />
                    ${value} <span class="count">(${countBy(CUSTOMER_ROWS, facet.key).get(value) ?? 0})</span>
                  </label>`)}
              </div>`
          })}
        </div>
        <div class="fp-actions">
          <button class="btn btn-primary" @click=${this.apply}>${sxIcon('filter', 14)} 应用筛选</button>
          <button class="btn" @click=${this.clearFacets}>${sxIcon('refresh', 14)} 清除筛选</button>
        </div>
      </aside>`
  }

  private renderTable(): TemplateResult {
    const rows = this.filteredRows
    return html`
      <table class="grid">
        <thead><tr><th class="rowhead"></th>${COLUMNS.map((column) => html`<th>${column}</th>`)}</tr></thead>
        <tbody>
          ${CUSTOMER_ROWS.map((row, index) => {
            const hit = rows.some((item) => item.id === row.id)
            const style = STATUS_STYLE[row.status]
            return html`
              <tr class="${hit ? '' : 'dimmed'}">
                <th class="rowhead">${index + 2}</th>
                <td class="${hit ? '' : 'dim'}">${row.name}</td>
                <td class="${hit ? '' : 'dim'}">${row.region}</td>
                <td class="${hit ? '' : 'dim'}">${row.category}</td>
                <td class="num ${hit ? '' : 'dim'}">${row.amount.toLocaleString()}</td>
                <td class="${hit ? '' : 'dim'}">${row.date}</td>
                <td class="${hit ? '' : 'dim'}"><span class="status-pill" style="color:${style.color};background:${style.background}">${row.status}</span></td>
              </tr>`
          })}
          <tr class="total">
            <th class="rowhead"></th><td>合计</td><td></td><td></td>
            <td class="num">${this.total.toLocaleString()}</td><td></td><td></td>
          </tr>
        </tbody>
      </table>`
  }

  render(): TemplateResult {
    return html`
      <div class="app" data-theme=${this.theme}>
        ${this.renderTopbar()}
        ${this.renderToolbar()}
        <div class="body">
          <div class="sheet-side">${this.renderTable()}</div>
          ${this.renderDialog()}
          ${this.renderFacetPanel()}
        </div>
        <div class="sheet-tabs">
          ${['销售数据', '数据分析', '年度汇总'].map((name) => html`
            <button class="sheet-tab ${this.activeSheet === name ? 'active' : ''}" @click=${() => { this.activeSheet = name }}>${name}</button>`)}
        </div>
        <div class="statusbar">
          <span>筛选结果：${this.filteredRows.length} / ${CUSTOMER_ROWS.length} 行　合计：${this.total.toLocaleString()}</span>
          <span class="right"><span>条件 ${this.activeConditions.length} 条</span><span>方案 ${this.schemes.length} 个</span><span>100%</span></span>
        </div>
      </div>`
  }
}

declare global {
  interface HTMLElementTagNameMap { 'advfilter-app': AdvFilterApp }
}
