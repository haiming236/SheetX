/**
 * SheetX 右键菜单与快捷操作界面（第 08 张设计稿）
 *
 * 纯 UI 外壳：展示单元格/行列/区域选择时的上下文菜单，
 * 以及复制、粘贴、插入、删除、填充等快捷操作。
 * 引擎接入后由 @sheetx/spreadsheet 的 interaction 模块驱动真实菜单与填充行为。
 */
import { LitElement, html, type TemplateResult } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { baseStyles, lightTokens } from './tokens.js'
import { bindPageTheme, toggleTheme as toggleGlobalTheme } from './theme.js'
import { contextStyles } from './context-styles.js'
import { sxIcon, sxLogo, type IconName } from './icons.js'
import {
  contextNavMenus, contextSheetTabs, contextStats, formulaBarText,
  contextColumns, contextRows, contextTotalRows,
  contextMenuSections, contextMenuMore, fillSubmenuSections, quickTips,
  type MenuItem, type ContextRow,
} from './context-data.js'
import { toast } from './toast.js'

interface CellPos { row: number; col: number }

@customElement('context-app')
export class ContextApp extends LitElement {
  static styles = [baseStyles, lightTokens, contextStyles]

  @state() private theme: 'light' | 'dark' = 'light'
  @state() private activeMenu = '开始'
  @state() private activeSheet = '订单数据'
  @state() private selectedCell: CellPos = { row: 2, col: 1 } // B3（表头行后第 3 行 · B 列）
  @state() private menuOpen = true
  @state() private submenuOpen = true
  @state() private lastAction = '就绪'
  @state() private zoom = 100

  render() {
    return html`
      <div class="app" data-theme=${this.theme}>
        ${this.renderTopbar()}
        ${this.renderToolbar()}
        ${this.renderFormulaBar()}
        <div class="body">
          <div class="grid-area" @click=${this.onGridClick} @contextmenu=${this.onGridContext}>
            ${this.renderSheet()}
          </div>
          ${this.menuOpen ? this.renderContextMenu() : ''}
          ${this.menuOpen && this.submenuOpen ? this.renderFillSubmenu() : ''}
          ${this.renderQuickCard()}
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
          ${contextNavMenus.map(menu => html`
            <button
              class="nav-item ${menu === this.activeMenu ? 'active' : ''}"
              @click=${() => { this.activeMenu = menu }}
            >${menu}</button>
          `)}
        </nav>
        <div class="topbar-right">
          <button class="icon-btn" title="搜索" @click=${() => toast('搜索')} >${sxIcon('search', 17)}</button>
          <button class="icon-btn" title="帮助" style="font-size:14px;font-weight:600" @click=${() => toast('帮助中心（F1）')} >中</button>
          <button
            class="icon-btn"
            title=${this.theme === 'light' ? '切换深色' : '切换浅色'}
            @click=${this.toggleTheme}
          >${sxIcon(this.theme === 'light' ? 'sun' : 'moon', 17)}</button>
          <span class="avatar">JD</span>
        </div>
      </div>
    `
  }

  // ---------- 格式工具栏 ----------
  private renderToolbar(): TemplateResult {
    return html`
      <div class="toolbar">
        <button class="tool-btn" title="撤销" @click=${() => toast('撤销')} >${sxIcon('undo', 16)}</button>
        <button class="tool-btn" title="重做" @click=${() => toast('重做')} >${sxIcon('redo', 16)}</button>
        <button class="tool-btn" title="打印" @click=${() => toast('打印预览')} >${sxIcon('print', 16)}</button>
        <span class="v-sep"></span>
        <button class="font-select wide" @click=${() => toast('思源黑体')}><span>思源黑体</span><span class="caret">${sxIcon('chevronDown', 12)}</span></button>
        <button class="font-select"><span>12</span><span class="caret">${sxIcon('chevronDown', 12)}</span></button>
        <span class="v-sep"></span>
        <button class="tool-btn" title="加粗" @click=${() => toast('加粗')} >${sxIcon('bold', 15)}</button>
        <button class="tool-btn" title="斜体" @click=${() => toast('斜体')} >${sxIcon('italic', 15)}</button>
        <button class="tool-btn" title="下划线" @click=${() => toast('下划线')} >${sxIcon('underline', 15)}</button>
        <button class="tool-btn" title="删除线" @click=${() => toast('删除线')} ><span class="text-demo strike">A</span></button>
        <button class="tool-btn" title="高亮颜色" @click=${() => toast('高亮颜色')} ><span class="text-demo hl-mark">A</span></button>
        <span class="v-sep"></span>
        <button class="tool-btn" title="左对齐" @click=${() => toast('左对齐')} >${sxIcon('alignLeft', 15)}</button>
        <button class="tool-btn" title="水平居中" @click=${() => toast('水平居中')} >${sxIcon('alignCenter', 15)}</button>
        <button class="tool-btn" title="右对齐" @click=${() => toast('右对齐')} >${sxIcon('alignRight', 15)}</button>
        <button class="font-select" @click=${() => toast('合并单元格')}><span style="display:inline-flex;align-items:center;gap:4px">${sxIcon('merge', 14)}合并单元格</span><span class="caret">${sxIcon('chevronDown', 12)}</span></button>
        <button class="font-select" @click=${() => toast('常规')}><span>常规</span><span class="caret">${sxIcon('chevronDown', 12)}</span></button>
        <span class="v-sep"></span>
        <button class="tool-btn" title="百分比" @click=${() => toast('百分比格式')} >${sxIcon('percent', 15)}</button>
        <button class="tool-btn" title="千分位分隔符" @click=${() => toast('千分位分隔符')} >${sxIcon('decimalMinus', 15)}</button>
        <button class="tool-btn" title="小数位" @click=${() => toast('调整小数位')} >${sxIcon('decimalPlus', 15)}</button>
        <button class="font-select"><span style="display:inline-flex;align-items:center;gap:4px">${sxIcon('border', 14)}边框</span><span class="caret">${sxIcon('chevronDown', 12)}</span></button>
        <span class="v-sep"></span>
        <button class="tool-btn" title="筛选" @click=${() => toast('打开筛选')} >${sxIcon('filter', 15)}</button>
        <button class="tool-btn" title="排序" @click=${() => toast('打开排序')} >${sxIcon('sort', 15)}</button>
        <button class="tool-btn" title="求和" @click=${() => toast('自动求和')} >${sxIcon('sigma', 15)}</button>
      </div>
    `
  }

  // ---------- 公式栏 ----------
  private renderFormulaBar(): TemplateResult {
    return html`
      <div class="formula-bar">
        <div class="cell-address">B3 <span class="caret">${sxIcon('chevronDown', 12)}</span></div>
        <div class="fx-box">fx</div>
        <div class="formula-input" aria-label="单元格内容">${formulaBarText}</div>
      </div>
    `
  }

  // ---------- 表格 ----------
  private renderSheet(): TemplateResult {
    return html`
      <table class="sheet" style="transform:scale(${this.zoom / 100});transform-origin:top left">
        <colgroup>
          <col style="width:40px" />
          ${contextColumns.map(col => html`<col style="width:${col.width}px" />`)}
        </colgroup>
        <thead>
          <tr>
            <th class="corner"></th>
            ${contextColumns.map((_, i) => html`<th class="col-head">${String.fromCharCode(65 + i)}</th>`)}
          </tr>
        </thead>
        <tbody>
          ${Array.from({ length: contextTotalRows }, (_, r) => this.renderRow(r))}
        </tbody>
      </table>
    `
  }

  private renderRow(r: number): TemplateResult {
    // r=0 为表头行（订单号/客户名称/...），r>=1 对应 contextRows[r-1]
    const data = r === 0 ? undefined : contextRows[r - 1]
    const rowActive = this.selectedCell.row === r
    return html`
      <tr class=${rowActive ? 'row-active' : ''}>
        <th class="row-head">${r + 1}</th>
        ${contextColumns.map((col, c) => {
          const value = data ? data[col.key as keyof ContextRow] : ''
          const selected = this.isSelected(r, c)
          return html`
            <td
              class="cell ${col.num ? 'num' : ''} ${col.highlight ? 'col-hl' : ''} ${r === 0 ? 'head-cell' : ''} ${col.highlight && r === 0 ? 'hl' : ''} ${selected ? 'selected' : ''}"
              @click=${() => { this.selectedCell = { row: r, col: c } }}
              @contextmenu=${(e: MouseEvent) => this.onCellContext(e, r, c)}
            >${value}${selected ? html`<span class="fill-handle"></span>` : ''}</td>
          `
        })}
      </tr>
    `
  }

  private isSelected(r: number, c: number): boolean {
    return this.selectedCell.row === r && this.selectedCell.col === c
  }

  // ---------- 右键菜单定位 ----------
  /** 菜单锚点：选中单元格右下角附近（设计稿位于 B3 下方） */
  private menuPos(): { left: number; top: number } {
    const { row, col } = this.selectedCell
    let left = 40 + contextColumns.slice(0, col + 1).reduce((sum, c) => sum + c.width, 0) - 18
    let top = 30 + (row + 1) * 30 + 2
    // 粗略夹取，防止菜单溢出可视区（grid 高度按 720 基准估算）
    left = Math.max(8, Math.min(left, 1080 - 216))
    top = Math.max(8, Math.min(top, 520))
    return { left, top }
  }

  private renderContextMenu(): TemplateResult {
    const pos = this.menuPos()
    return html`
      <div class="ctx-menu" style="left:${pos.left}px;top:${pos.top}px" @click=${(e: Event) => e.stopPropagation()}>
        ${contextMenuSections.map((section, si) => html`
          ${si > 0 ? html`<div class="menu-divider"></div>` : ''}
          ${section.map(item => this.renderMenuItem(item))}
        `)}
        <div class="menu-divider"></div>
        <button class="mi-more" @click=${() => this.runAction({ label: contextMenuMore })}>${contextMenuMore}</button>
      </div>
    `
  }

  private renderFillSubmenu(): TemplateResult {
    const pos = this.menuPos()
    const left = pos.left + 208
    // 默认与"填充"行对齐向下展开；下方空间不足时整体上移，保证 7 项完整可见。
    // bodyTop = 顶部导航 44 + 工具栏 44 + 公式栏 38（render 期间 DOM 未挂载，用布局常量）
    const subHeight = 190
    const bodyTop = 126
    const maxTop = window.innerHeight - subHeight - 6 - bodyTop
    const top = Math.max(8, Math.min(pos.top + 282, maxTop))
    return html`
      <div class="fill-submenu" style="left:${left}px;top:${top}px" @click=${(e: Event) => e.stopPropagation()}>
        ${fillSubmenuSections.map((section, si) => html`
          ${si > 0 ? html`<div class="menu-divider"></div>` : ''}
          ${section.map(item => this.renderMenuItem(item, true))}
        `)}
      </div>
    `
  }

  private renderMenuItem(item: MenuItem, isSub = false): TemplateResult {
    return html`
      <button
        class="mi ${item.active && !isSub ? 'active' : ''}"
        @click=${() => this.runAction(item, isSub)}
      >
        ${item.icon ? html`<span class="mi-icon">${sxIcon(item.icon as IconName, 15)}</span>` : html`<span class="mi-icon"></span>`}
        <span class="mi-label">${item.label}</span>
        ${item.shortcut ? html`<span class="sc">${item.shortcut}</span>` : ''}
        ${item.arrow ? html`<span class="arr">${sxIcon('chevronRight', 13)}</span>` : ''}
      </button>
    `
  }

  // ---------- 快捷操作提示卡 ----------
  private renderQuickCard(): TemplateResult {
    return html`
      <div class="quick-card" @click=${(e: Event) => e.stopPropagation()}>
        <div class="quick-head"><span class="bolt">${sxIcon('bolt', 17)}</span>快捷操作</div>
        <div class="quick-list">
          ${quickTips.map(tip => html`
            <div class="quick-item"><span class="ck">${sxIcon('checkCircle', 15)}</span>${tip}</div>
          `)}
        </div>
      </div>
    `
  }

  // ---------- 工作表标签 ----------
  private renderSheetTabs(): TemplateResult {
    return html`
      <div class="sheet-tabs">
        <button class="tab-add" title="添加工作表" @click=${() => toast('已添加工作表')} >${sxIcon('plus', 15)}</button>
        ${contextSheetTabs.map(name => html`
          <button
            class="sheet-tab ${this.activeSheet === name ? 'active' : ''}"
            @click=${() => { this.activeSheet = name }}
          >${name}</button>
        `)}
        <button class="tab-add" title="更多工作表" @click=${() => toast('更多工作表')} >${sxIcon('more', 15)}</button>
      </div>
    `
  }

  // ---------- 状态栏 ----------
  private renderStatusBar(): TemplateResult {
    return html`
      <div class="statusbar">
        <span class="status-ready"><span class="dot"></span>${this.lastAction}</span>
        <span class="status-stats">
          <span>平均值: ${contextStats.avg}</span>
          <span>计数: ${contextStats.count}</span>
          <span>求和: ${contextStats.sum}</span>
        </span>
        <span class="zoom">
          <button class="tool-btn" title="缩小" @click=${() => { this.zoom = Math.max(50, this.zoom - 10) }}>${sxIcon('zoomOut', 14)}</button>
          <span class="zoom-value">${this.zoom}%</span>
          <button class="tool-btn" title="放大" @click=${() => { this.zoom = Math.min(150, this.zoom + 10) }}>${sxIcon('zoomIn', 14)}</button>
        </span>
        <button class="tool-btn" title="全屏" style="margin-left:10px" @click=${() => toast('全屏')} >${sxIcon('fullscreen', 14)}</button>
      </div>
    `
  }

  // ---------- 交互 ----------
  private onCellContext(e: MouseEvent, row: number, col: number): void {
    e.preventDefault()
    e.stopPropagation()
    this.selectedCell = { row, col }
    this.menuOpen = true
    this.submenuOpen = false
  }

  private onGridContext(e: MouseEvent): void {
    // 空白区右键：仅阻止浏览器默认菜单
    e.preventDefault()
  }

  private onGridClick(): void {
    if (this.menuOpen || this.submenuOpen) {
      this.menuOpen = false
      this.submenuOpen = false
    }
  }

  private runAction(item: MenuItem, isSub = false): void {
    if (!isSub && item.submenu) {
      this.submenuOpen = !this.submenuOpen
      return
    }
    this.lastAction = `已执行：${item.label}`
    this.menuOpen = false
    this.submenuOpen = false
  }

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
    'context-app': ContextApp
  }
}
