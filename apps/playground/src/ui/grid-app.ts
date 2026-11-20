/**
 * SheetX Grid 业务数据网格界面（第 02 张设计稿 · 库存管理）
 *
 * 纯 UI 外壳：mock 数据 + DOM 表格，引擎接入后由 @sheetx/grid 替换。
 */
import { LitElement, html, nothing, type TemplateResult } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { baseStyles, lightTokens } from './tokens.js'
import { gridStyles } from './grid-styles.js'
import { sxIcon, sxLogo, type IconName } from './icons.js'
import {
  inventoryRows, inventoryColumns, categoryColors, sideMenus,
  type InventoryRow,
} from './grid-data.js'
import { toast } from './toast.js'
import { store, useStore } from './store.js'

@customElement('grid-app')
export class GridApp extends LitElement {
  static styles = [baseStyles, lightTokens, gridStyles]

  @state() private activeMenu = 'inventory'
  @state() private selectedRows = new Set<number>([8])
  @state() private selectedCell: { row: number; col: string } | null = { row: 8, col: 'price' }
  @state() private currentPage = 1
  @state() private activeTool = ''
  constructor() {
    super()
    // 库存数据来自全局 store（02 业务网格与 09 筛选共享同一份；首页统计同步）
    useStore(this)
  }

  /** 库存明细（全局唯一数据源） */
  private get rows(): InventoryRow[] {
    return store.snapshot().inventory
  }

  private toggleRow(no: number): void {
    const next = new Set(this.selectedRows)
    if (next.has(no)) next.delete(no)
    else next.add(no)
    this.selectedRows = next
  }

  private toggleAll(): void {
    if (this.selectedRows.size === this.rows.length) {
      this.selectedRows = new Set()
    } else {
      this.selectedRows = new Set(this.rows.map((row) => row.no))
    }
  }

  render() {
    return html`
      <div class="layout">
        ${this.renderSidebar()}
        <div class="main">
          ${this.renderTopbar()}
          ${this.renderToolbar()}
          <div class="table-wrap">
            ${this.renderTable()}
            ${this.selectedRows.size > 0 ? this.renderBatchPopover() : nothing}
          </div>
          ${this.renderFooter()}
        </div>
      </div>
    `
  }

  // ---------- 左侧导航 ----------
  private renderSidebar(): TemplateResult {
    return html`
      <aside class="sidebar">
        <div class="sidebar-brand">${sxLogo()}</div>
        <nav class="side-nav">
          ${sideMenus.map(item => html`
            <button
              class="side-item ${this.activeMenu === item.key ? 'active' : ''}"
              @click=${() => { this.activeMenu = item.key }}
            >${sxIcon(item.icon, 16)}<span>${item.label}</span></button>
          `)}
        </nav>
      </aside>
    `
  }

  // ---------- 顶部 ----------
  private renderTopbar(): TemplateResult {
    return html`
      <header class="topbar">
        <div class="breadcrumb">
          <span>首页</span>
          ${sxIcon('chevronRight', 13)}
          <strong>库存管理</strong>
        </div>
        <div class="topbar-right">
          <div class="search-box">${sxIcon('search', 14)}<input placeholder="搜索商品、编码、供应商..." /></div>
          <span class="bell">${sxIcon('bell', 18)}<span class="dot">1</span></span>
          <span class="avatar">张</span>
        </div>
      </header>
    `
  }

  // ---------- 工具栏 ----------
  private renderToolbar(): TemplateResult {
    const btn = (icon: IconName, label: string, key: string, primary = false) => html`
      <button
        class="btn ${primary ? 'primary' : ''} ${this.activeTool === key ? 'active' : ''}"
        @click=${() => this.runTool(key, label)}
      >${sxIcon(icon, 15)}<span>${label}</span></button>
    `
    return html`
      <div class="toolbar">
        <button class="btn primary" @click=${() => this.addRow()}>
          ${sxIcon('plus', 15)}<span>新增</span><span class="divider"></span>${sxIcon('chevronDown', 12)}
        </button>
        ${btn('trash', '删除', 'delete')}
        ${btn('upload', '导入', 'import')}
        ${btn('download', '导出', 'export')}
        <button class="btn ${this.activeTool === 'batch' ? 'active' : ''}" @click=${() => this.runTool('batch', '批量修改')}>
          ${sxIcon('edit', 15)}<span>批量修改</span>${sxIcon('chevronDown', 12)}
        </button>
        ${btn('filter', '筛选', 'filter')}
        ${btn('sort', '排序', 'sort')}
        ${btn('freeze', '冻结列', 'freeze')}
        ${btn('more', '更多', 'more')}
      </div>
    `
  }

  // ---------- 数据表格 ----------
  private renderTable(): TemplateResult {
    const allSelected = this.selectedRows.size === this.rows.length && this.rows.length > 0
    return html`
      <table class="grid-table">
        <colgroup>
          <col style="width:38px" />
          ${inventoryColumns.map(c => html`<col style="width:${c.width}px" />`)}
        </colgroup>
        <thead>
          <tr>
            <th class="center">
              <span class="check ${allSelected ? 'checked' : ''}" @click=${this.toggleAll}>
                ${sxIcon(allSelected ? 'checkboxChecked' : 'checkbox', 15)}
              </span>
            </th>
            ${inventoryColumns.map(c => html`
              <th>
                <span class="th-inner"><span>${c.title}</span><span class="filter-icon" @click=${() => toast(`列筛选：${c.title}`)}>${sxIcon('chevronDown', 11)}</span></span>
              </th>
            `)}
          </tr>
        </thead>
        <tbody>
          ${this.rows.map(row => this.renderRow(row, allSelected))}
        </tbody>
      </table>
    `
  }

  private renderRow(row: InventoryRow, allSelected: boolean): TemplateResult {
    const checked = allSelected || this.selectedRows.has(row.no)
    const selected = (col: string) => this.selectedCell?.row === row.no && this.selectedCell?.col === col ? 'cell-selected' : ''
    const pick = (col: string) => { this.selectedCell = { row: row.no, col } }
    return html`
      <tr class="${checked ? 'row-selected' : ''}">
        <td class="center">
          <span class="check ${checked ? 'checked' : ''}" @click=${() => this.toggleRow(row.no)}>
            ${sxIcon(checked ? 'checkboxChecked' : 'checkbox', 15)}
          </span>
        </td>
        <td class="center">${row.no}</td>
        <td>${row.code}</td>
        <td>${row.name}</td>
        <td>${this.renderCategory(row.category)}</td>
        <td>${row.spec}</td>
        <td class="${selected('stock')}" @click=${() => pick('stock')}>${this.renderStepper(String(row.stock))}</td>
        <td class="center">${row.unit}</td>
        <td class="num ${selected('price')}" @click=${() => pick('price')}>${row.price.toFixed(2)}</td>
        <td class="num">${row.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        <td>${this.renderStatus(row.status)}</td>
        <td>
          <span class="op-links">
            <button @click=${() => this.editRow(row)}>编辑</button>
            <button @click=${() => this.deleteRow(row.no)}>删除</button>
          </span>
        </td>
      </tr>
    `
  }

  private renderCategory(category: string): TemplateResult {
    const c = categoryColors[category] ?? { bg: '#eef0f5', fg: '#5b6472' }
    return html`<span class="tag" style="background:${c.bg};color:${c.fg}">${category}</span>`
  }

  private renderStatus(status: InventoryRow['status']): TemplateResult {
    return html`<span class="status ${status === '正常' ? 'ok' : 'warn'}"><span class="sdot"></span>${status}</span>`
  }

  private renderStepper(value: string): TemplateResult {
    return html`
      <span class="num-stepper">${value}<span class="stepper">${sxIcon('chevronDown', 10)}${sxIcon('chevronDown', 10)}</span></span>
    `
  }

  // ---------- 批量修改浮层 ----------
  private renderBatchPopover(): TemplateResult {
    return html`
      <div class="batch-popover">
        <span class="batch-title">
          ${sxIcon('checkboxChecked', 15)}
          <span>批量修改</span>
          <span class="muted">已选中 ${this.selectedRows.size} 行</span>
        </span>
        <span class="batch-field">分类:
          <span class="batch-select">电脑配件 <span class="caret">${sxIcon('chevronDown', 12)}</span></span>
        </span>
        <span class="batch-field">状态:
          <span class="batch-select"><span class="status ok"><span class="sdot"></span>正常</span><span class="caret">${sxIcon('chevronDown', 12)}</span></span>
        </span>
        <button class="btn-primary-sm" @click=${() => this.applyBatch()}>确定</button>
        <button class="btn-text-sm" @click=${() => { this.selectedRows = new Set(); this.activeTool = ''; toast('已取消批量修改') }}>取消</button>
      </div>
    `
  }

  // ---------- 底部 ----------
  private renderFooter(): TemplateResult {
    const pages = [1, 2, 3, 4, 5]
    return html`
      <footer class="footer">
        <span>共 <strong>1,248</strong> 条数据</span>
        <span class="muted" style="margin-left:14px">已选择 ${this.selectedRows.size} 条</span>
        <span class="pager">
          <span>每页显示:</span>
          <span class="batch-select" style="min-width:52px;height:24px">10 ${sxIcon('chevronDown', 11)}</span>
          <button class="page-nav" @click=${() => { this.currentPage = Math.max(1, this.currentPage - 1) }}>${sxIcon('chevronLeft', 13)}</button>
          ${pages.map(p => html`
            <button class="page-btn ${this.currentPage === p ? 'current' : ''}" @click=${() => { this.currentPage = p }}>${p}</button>
          `)}
          <span class="muted">...</span>
          <button class="page-btn" @click=${() => { this.currentPage = 125 }}>125</button>
          <button class="page-nav" @click=${() => { this.currentPage = Math.min(125, this.currentPage + 1) }}>${sxIcon('chevronRight', 13)}</button>
        </span>
      </footer>
    `
  }
  // ---------- 业务动作（工具栏/行内操作真实生效） ----------
  @state() private filterWarningOnly = false

  private runTool(key: string, label: string): void {
    this.activeTool = this.activeTool === key ? '' : key
    switch (key) {
      case 'delete':
        this.deleteSelected()
        break
      case 'export':
        this.exportCsv()
        break
      case 'import':
        toast('导入：请选择 Excel / CSV 文件')
        break
      case 'batch':
        if (this.selectedRows.size === 0) toast('请先勾选要批量修改的行')
        break
      case 'sort':
        this.sortByAmount()
        break
      case 'filter':
        this.filterWarning()
        break
      case 'freeze':
        toast('已冻结「商品编码」列')
        break
      default:
        toast(label)
    }
  }

  private addRow(): void {
    const nextNo = this.rows.reduce((max, row) => Math.max(max, row.no), 0) + 1
    const row: InventoryRow = {
      no: nextNo,
      code: `SKU-${String(nextNo).padStart(4, '0')}`,
      name: '新增商品',
      category: '办公用品',
      spec: '—',
      stock: 0,
      unit: '件',
      price: 0,
      amount: 0,
      status: '正常',
    }
    store.addInventory(row)
    this.selectedRows = new Set([nextNo])
    this.selectedCell = { row: nextNo, col: 'name' }
    toast(`已新增 1 行（共 ${this.rows.length} 行）`)
  }

  private deleteRow(no: number): void {
    store.removeInventory(no)
    const next = new Set(this.selectedRows)
    next.delete(no)
    this.selectedRows = next
    toast(`已删除第 ${no} 行（剩余 ${this.rows.length} 行）`)
  }

  private deleteSelected(): void {
    if (this.selectedRows.size === 0) {
      toast('请先勾选要删除的行')
      return
    }
    const count = this.selectedRows.size
    store.replaceInventory(this.rows.filter((row) => !this.selectedRows.has(row.no)))
    this.selectedRows = new Set()
    toast(`已删除 ${count} 行（剩余 ${this.rows.length} 行）`)
  }

  private applyBatch(): void {
    if (this.selectedRows.size === 0) {
      toast('请先勾选要修改的行')
      return
    }
    const count = this.selectedRows.size
    store.replaceInventory(
      this.rows.map((row) => (this.selectedRows.has(row.no) ? { ...row, category: '电脑配件', status: '正常' } : row)),
    )
    this.selectedRows = new Set()
    this.activeTool = ''
    toast(`已批量修改 ${count} 行：分类=电脑配件、状态=正常`)
  }

  private editRow(row: InventoryRow): void {
    this.selectedRows = new Set([row.no])
    this.selectedCell = { row: row.no, col: 'name' }
    toast(`编辑：${row.code} ${row.name}`)
  }

  private sortByAmount(): void {
    store.replaceInventory([...this.rows].sort((a, b) => b.amount - a.amount))
    toast('已按金额降序排列')
  }

  private filterWarning(): void {
    this.filterWarningOnly = !this.filterWarningOnly
    store.replaceInventory(
      this.filterWarningOnly
        ? inventoryRows.filter((row) => row.status === '预警').map((row) => ({ ...row }))
        : inventoryRows.map((row) => ({ ...row })),
    )
    this.selectedRows = new Set()
    toast(this.filterWarningOnly ? '仅显示预警商品' : '已显示全部商品')
  }

  private exportCsv(): void {
    const header = ['序号', '商品编码', '商品名称', '分类', '规格型号', '库存数量', '单位', '单价', '金额', '状态']
    const lines = this.rows.map((row) =>
      [row.no, row.code, row.name, row.category, row.spec, row.stock, row.unit, row.price, row.amount, row.status].join(','),
    )
    const csv = '\uFEFF' + [header.join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = '库存数据.csv'
    link.click()
    URL.revokeObjectURL(url)
    toast(`已导出 ${this.rows.length} 行到「库存数据.csv」`)
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'grid-app': GridApp
  }
}
