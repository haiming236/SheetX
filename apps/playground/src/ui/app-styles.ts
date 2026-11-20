/**
 * SheetX 主工作界面样式（第 01 张设计稿）
 * 集中管理所有区域样式，供 sheetx-app 组件使用。
 */
import { css } from 'lit'

export const appStyles = css`
  :host {
    display: block;
    width: 100%;
    height: 100%;
    background: var(--sx-bg-app);
    overflow: hidden;
  }

  .app {
    display: grid;
    grid-template-rows: 44px 44px 34px 1fr 34px 30px;
    height: 100%;
    min-width: 960px;
  }

  /* ============ 顶部导航 ============ */
  .topbar {
    display: flex;
    align-items: center;
    background: var(--sx-bg-surface);
    border-bottom: 1px solid var(--sx-border);
    padding: 0 14px;
    gap: 22px;
  }
  .brand { flex: none; }
  .nav {
    display: flex;
    align-items: stretch;
    height: 100%;
    gap: 2px;
  }
  .nav-item {
    position: relative;
    display: inline-flex;
    align-items: center;
    padding: 0 13px;
    background: transparent;
    border: none;
    color: var(--sx-text-secondary);
    font-size: 16px;
    white-space: nowrap;
    transition: color .13s ease, background .13s ease;
  }
  .nav-item:hover { color: var(--sx-text-primary); background: var(--sx-bg-hover); }
  .nav-item:focus-visible { outline: 2px solid var(--sx-brand); outline-offset: -2px; }
  .nav-item.active {
    color: var(--sx-brand);
    font-weight: 500;
  }
  .nav-item.active::after {
    content: '';
    position: absolute;
    left: 12px;
    right: 12px;
    bottom: 0;
    height: 2px;
    background: var(--sx-brand);
    border-radius: 2px 2px 0 0;
  }
  .topbar-right {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .search-box {
    display: flex;
    align-items: center;
    gap: 7px;
    width: 190px;
    height: 27px;
    padding: 0 10px;
    margin-right: 8px;
    background: var(--sx-bg-subtle);
    border: 1px solid var(--sx-border);
    border-radius: 6px;
    color: var(--sx-text-hint);
    font-size: 16px;
  }
  .icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--sx-text-secondary);
  }
  .icon-btn:hover { background: var(--sx-bg-hover); color: var(--sx-text-primary); }
  .avatar {
    width: 27px;
    height: 27px;
    margin-left: 4px;
    border-radius: 50%;
    background: var(--sx-brand);
    color: #fff;
    font-size: 16px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
  }

  /* 图标随系统默认字号放大（思源黑体 16px 对应图标约 18px） */
  .sx-icon svg { width: 18px; height: 18px; }
  .sheet-tabs .sx-icon svg, .toolbar .sx-icon svg { width: 18px; height: 18px; }

  /* ============ WPS 式 Ribbon 功能区 ============ */
  .ribbon {
    display: flex;
    align-items: stretch;
    background: var(--sx-bg-surface);
    border-bottom: 1px solid var(--sx-border);
    padding: 4px 12px 2px;
    gap: 4px;
    min-height: 74px;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .ribbon::-webkit-scrollbar { display: none; }
  .ribbon-group {
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--sx-border);
    padding: 0 12px 0 0;
    margin-right: 4px;
    flex: none;
  }
  .ribbon-group:last-child { border-right: 0; }
  .ribbon-group-body { display: flex; align-items: flex-start; gap: 3px; flex: 1; }
  .ribbon-item {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 2px; min-width: 54px; max-width: 88px; height: 52px; padding: 3px 5px;
    border: 1px solid transparent; border-radius: 5px; background: transparent;
    color: var(--sx-text-secondary); cursor: pointer; font-size: 11px;
  }
  .ribbon-item:hover { background: var(--sx-bg-hover); color: var(--sx-text-primary); }
  .ribbon-item.active { background: var(--sx-bg-active); color: var(--sx-brand); border-color: var(--sx-brand-soft); }
  .ribbon-item:disabled { opacity: .4; cursor: default; }
  .ribbon-item span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
  .ribbon-group-label { text-align: center; font-size: 10px; color: var(--sx-text-hint); line-height: 14px; }

  /* ============ 工具栏 ============ */
  .toolbar {
    display: flex;
    align-items: center;
    background: var(--sx-bg-surface);
    border-bottom: 1px solid var(--sx-border);
    padding: 0 12px;
    gap: 3px;
    overflow: hidden;
  }
  .tool-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: 1px solid transparent;
    border-radius: 4px;
    background: transparent;
    color: var(--sx-text-secondary);
    flex: none;
    transition: background .13s ease, color .13s ease, border-color .13s ease, transform .08s ease;
  }
  .tool-btn:hover { background: var(--sx-bg-hover); color: var(--sx-text-primary); border-color: var(--sx-border); }
  .tool-btn:active { transform: scale(.93); background: var(--sx-bg-active); }
  .tool-btn:focus-visible { outline: 2px solid var(--sx-brand); outline-offset: 1px; }
  .tool-btn.active { background: var(--sx-bg-active); color: var(--sx-brand); border-color: var(--sx-brand-soft); }
  .tool-btn.fcolor { color: var(--sx-danger); }
  .tool-select {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    height: 27px;
    padding: 0 7px;
    border: 1px solid var(--sx-border-input);
    border-radius: 5px;
    background: var(--sx-bg-surface);
    color: var(--sx-text-primary);
    font-size: 16px;
    white-space: nowrap;
    flex: none;
  }
  .tool-select.font { width: 92px; }
  .tool-select.size { width: 52px; }
  .tool-select.format { width: 68px; }
  .tool-select:hover { border-color: var(--sx-brand); background: var(--sx-bg-hover); }
  .tool-select:focus-within { border-color: var(--sx-brand); outline: 2px solid var(--sx-brand-soft); outline-offset: -1px; }
  .tool-select .caret { color: var(--sx-text-hint); display: inline-flex; }
  .sep {
    width: 1px;
    height: 20px;
    background: var(--sx-border);
    margin: 0 5px;
    flex: none;
  }
  .tool-action {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    min-width: 52px;
    height: 34px;
    padding: 0 6px;
    border: none;
    border-radius: 5px;
    background: transparent;
    color: var(--sx-text-secondary);
    font-size: 11px;
    white-space: nowrap;
    flex: none;
  }
  .tool-action:hover { background: var(--sx-bg-hover); color: var(--sx-text-primary); }
  .tool-action .badge { color: var(--sx-brand); }

  /* ============ 公式栏 ============ */
  .formula-bar {
    display: flex;
    align-items: center;
    background: var(--sx-bg-surface);
    border-bottom: 1px solid var(--sx-border);
    padding: 0 10px;
    gap: 0;
  }
  .cell-address {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    width: 88px;
    height: 24px;
    padding: 0 8px;
    border: 1px solid var(--sx-border-input);
    border-radius: 4px 0 0 4px;
    background: var(--sx-bg-surface);
    font-size: 16px;
    font-weight: 500;
    flex: none;
  }
  .cell-address .caret { color: var(--sx-text-hint); display: inline-flex; }
  .fx-box {
    width: 38px;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--sx-border-input);
    border-left: none;
    border-right: none;
    color: var(--sx-text-secondary);
    font-style: italic;
    font-family: Georgia, serif;
    font-size: 14px;
    flex: none;
  }
  .formula-input {
    flex: 1;
    height: 24px;
    padding: 0 10px;
    border: 1px solid var(--sx-border-input);
    border-radius: 0 4px 4px 0;
    background: var(--sx-bg-surface);
    color: var(--sx-text-primary);
    font-size: 16px;
    outline: none;
  }
  .formula-input:focus { border-color: var(--sx-brand); }

  /* ============ 主体区 ============ */
  .body {
    display: flex;
    min-height: 0;
  }
  .grid-area {
    flex: 1;
    min-width: 0;
    overflow: auto;
    background: var(--sx-bg-surface);
    position: relative;
  }

  /* 表格 */
  .sheet {
    border-collapse: separate;
    border-spacing: 0;
    table-layout: fixed;
    font-size: var(--sheet-font, 16px);
    /* 按列宽总和展开（列多时可横向滚动），列少时至少铺满容器 */
    width: max-content;
    min-width: 100%;
  }
  .sheet th, .sheet td {
    border-right: 1px solid var(--sx-grid-line);
    border-bottom: 1px solid var(--sx-grid-line);
    padding: 0;
    height: var(--sheet-row-h, 30px);
    text-align: left;
    overflow: hidden;
  }
  .sheet thead th.corner {
    width: 40px;
    background: var(--sx-bg-subtle);
    border-top: 1px solid var(--sx-grid-line);
    border-left: 1px solid var(--sx-grid-line);
  }
  .sheet thead th.col-head {
    background: var(--sx-bg-subtle);
    color: var(--sx-text-secondary);
    font-weight: 500;
    text-align: center;
    border-top: 1px solid var(--sx-grid-line);
    position: sticky;
    top: 0;
    z-index: 2;
  }
  .sheet thead th.col-head.hl { background: var(--sx-bg-active); color: var(--sx-brand); }
  /* 列头：点击=选列（可横拖多选），左侧小抓取柄才用于移动列 */
  .sheet thead th.col-head {
    cursor: pointer;
    padding: 0 2px;
  }
  .sheet thead th.col-head .col-label { pointer-events: none; }
  .sheet thead th.col-head .col-drag-handle {
    position: absolute;
    left: 1px;
    top: 50%;
    transform: translateY(-50%);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 12px;
    height: 18px;
    cursor: grab;
    color: var(--sx-text-hint);
    opacity: .28;
    z-index: 5;
    transition: opacity 0.12s ease;
  }
  .sheet thead th.col-head:hover .col-drag-handle { opacity: .75; }
  .sheet thead th.col-head .col-drag-handle:hover { opacity: 1; color: var(--sx-brand); }
  .sheet thead th.col-head .col-drag-handle:active { cursor: grabbing; }
  /* 列宽拖拽手柄：列头右边缘 6px 热区 */
  .sheet .col-resizer {
    position: absolute;
    top: 0;
    right: -3px;
    width: 6px;
    height: 100%;
    cursor: col-resize;
    z-index: 4;
  }
  .sheet .col-resizer:hover { background: var(--sx-brand); opacity: .5; }
  /* 行高拖拽手柄：行号下边缘 6px 热区 */
  .sheet .row-resizer {
    position: absolute;
    left: 0;
    bottom: -3px;
    width: 100%;
    height: 6px;
    cursor: row-resize;
    z-index: 4;
  }
  .sheet .row-resizer:hover { background: var(--sx-brand); opacity: .5; }
  /* 列拖拽重排：可抓取 + 拖拽中/目标列反馈 */
  .sheet thead th.col-head { cursor: pointer; user-select: none; }
  .sheet thead th.col-head.dragging { opacity: .4; }
  .sheet thead th.col-head.drag-over { background: var(--sx-brand); color: #fff; box-shadow: inset 3px 0 0 var(--sx-brand-hover); }
  /* 合并单元格：内容居中并替换右侧边框 */
  .sheet td.cell.merged { text-align: center; }
  .sheet td.cell.merged > span { text-align: center !important; }
  .sheet .tool-btn:disabled { opacity: .35; cursor: default; }
  .sheet tbody th.row-head {
    background: var(--sx-bg-subtle);
    color: var(--sx-text-secondary);
    font-weight: 400;
    text-align: center;
    border-left: 1px solid var(--sx-grid-line);
    position: sticky;
    left: 0;
    z-index: 1;
    width: 40px;
  }
  .sheet tbody th.row-head.hl { background: var(--sx-bg-active); color: var(--sx-brand); }
  .sheet tbody tr:hover td { background: var(--sx-bg-hover); }
  .sheet td.cell {
    background: var(--sx-bg-surface);
    /* Excel 式紧凑内边距：左右只留 4px，上下由行高控制 */
    padding: 0 4px;
    white-space: nowrap;
    text-overflow: ellipsis;
    color: var(--sx-text-primary);
  }
  .sheet tbody tr.row-active th.row-head,
  .sheet tbody tr.row-active td { background: var(--sx-row-selected-bg); }
  .sheet td.head-cell {
    background: var(--sx-grid-header-bg);
    color: var(--sx-grid-header-text);
    font-weight: 500;
  }
  .sheet td.center { text-align: center; }
  .sheet td.right { text-align: right; }
  .sheet td.selected {
    position: relative;
    outline: 2px solid var(--sx-cell-selected);
    outline-offset: -2px;
    background: var(--sx-bg-surface);
    z-index: 3;
  }
  /* 区域选择：选区浅蓝底；焦点单元格白底 + 蓝框（Excel 式） */
  .sheet td.cell.in-sel {
    background: var(--sx-sel-range);
  }
  .sheet td.cell.active-cell {
    background: var(--sx-bg-surface);
    outline: 2px solid var(--sx-cell-selected);
    outline-offset: -2px;
    z-index: 3;
  }
  .sheet td.cell.in-sel.active-cell {
    background: var(--sx-bg-surface);
  }
  /* 选区蓝框（Excel 式四边）+ 右下填充柄 */
  .sheet td.cell.sel-top { border-top: 2px solid var(--sx-brand); }
  .sheet td.cell.sel-bottom { border-bottom: 2px solid var(--sx-brand); }
  .sheet td.cell.sel-left { border-left: 2px solid var(--sx-brand); }
  .sheet td.cell.sel-right { border-right: 2px solid var(--sx-brand); }
  .sheet td.cell { position: relative; }
  .sheet .fill-handle {
    position: absolute;
    right: -4px;
    bottom: -4px;
    width: 7px;
    height: 7px;
    background: var(--sx-brand);
    border: 1px solid #fff;
    border-radius: 1px;
    cursor: crosshair;
    z-index: 6;
  }
  .status-sel {
    flex: 0 0 auto;
    font-size: 16px;
    color: var(--sx-text-secondary);
    padding: 0 10px;
    border-left: 1px solid var(--sx-border);
    border-right: 1px solid var(--sx-border);
  }
  .status-sel b { color: var(--sx-brand); font-weight: 600; }
  /* 行号/列头被选中时高亮 */
  .sheet tbody th.row-head.hl { background: var(--sx-bg-active); color: var(--sx-brand); font-weight: 600; }
  .sheet thead th.col-head.hl { background: var(--sx-bg-active); color: var(--sx-brand); font-weight: 600; }
  .sheet thead th.corner { cursor: pointer; }
  .cell-with-dropdown {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
  }
  .cell-with-dropdown .caret { color: var(--sx-text-hint); }

  /* 完成率进度条 */
  .rate {
    display: flex;
    align-items: center;
    gap: 7px;
  }
  .rate .track {
    display: inline-block;
    width: 62px;
    height: 7px;
    border-radius: 4px;
    background: var(--sx-progress-track);
    overflow: hidden;
    flex: none;
  }
  .rate .fill {
    display: block;
    height: 100%;
    background: var(--sx-success);
    border-radius: 4px;
  }
  .rate .num { color: var(--sx-text-secondary); font-size: 11px; min-width: 30px; }

  /* ============ 右侧属性面板 ============ */
  .inspector {
    width: 224px;
    flex: none;
    background: var(--sx-bg-surface);
    border-left: 1px solid var(--sx-border);
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }
  .inspector.collapsed { display: none; }
  .inspector-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px 8px;
    font-size: 16px;
    font-weight: 500;
  }
  .inspector-tabs {
    display: flex;
    gap: 18px;
    padding: 0 14px;
    border-bottom: 1px solid var(--sx-border);
  }
  .inspector-tab {
    position: relative;
    padding: 8px 0 10px;
    border: none;
    background: transparent;
    color: var(--sx-text-secondary);
    font-size: 16px;
    cursor: pointer;
    transition: color .13s ease;
  }
  .inspector-tab:hover { color: var(--sx-text-primary); }
  .inspector-tab:focus-visible { outline: 2px solid var(--sx-brand); outline-offset: -2px; }
  .inspector-tab.active { color: var(--sx-brand); font-weight: 600; }
  .inspector-tab.active::after {
    content: '';
    position: absolute;
    left: 0; right: 0; bottom: -1px;
    height: 2px;
    background: var(--sx-brand);
    border-radius: 2px 2px 0 0;
  }
  .inspector-body { padding: 14px; display: flex; flex-direction: column; gap: 12px; }
  .field-label { font-size: 11px; color: var(--sx-text-hint); margin-bottom: 5px; display: block; }
  .field-select {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 30px;
    padding: 0 9px;
    border: 1px solid var(--sx-border-input);
    border-radius: 5px;
    background: var(--sx-bg-surface);
    font-size: 16px;
  }
  .field-select .caret { color: var(--sx-text-hint); }
  .field-row { display: flex; gap: 8px; }
  .field-row > * { flex: 1; }
  .btn-group { display: flex; gap: 2px; }
  .btn-group .tool-btn { width: 30px; height: 28px; border: 1px solid var(--sx-border-input); border-radius: 4px; }
  .btn-group .tool-btn.active { border-color: var(--sx-brand); }
  .inspector-divider { height: 1px; background: var(--sx-border); }
  .border-row { display: flex; align-items: center; gap: 6px; }
  .border-row .tool-btn { border: 1px solid var(--sx-border-input); border-radius: 4px; width: 28px; height: 26px; }
  .swatch-label { display: flex; align-items: center; gap: 6px; margin-left: auto; font-size: 11px; color: var(--sx-text-secondary); }
  .swatch { width: 26px; height: 20px; border-radius: 4px; border: 1px solid var(--sx-border); }
  .swatch.fill { background: var(--sx-grid-header-bg); }
  .swatch.color { background: #6b7280; }
  .clear-format {
    margin-top: auto;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 5px;
    padding: 10px 14px 14px;
    border: none;
    background: transparent;
    color: var(--sx-brand);
    font-size: 16px;
  }
  .inspector-reopen {
    position: absolute;
    top: 128px;
    right: 10px;
    z-index: 5;
  }

  /* ============ 工作表标签 ============ */
  .sheet-tabs {
    display: flex;
    align-items: center;
    gap: 2px;
    background: var(--sx-bg-surface);
    border-top: 1px solid var(--sx-border);
    padding: 0 10px;
  }
  .tab-add {
    width: 26px; height: 26px;
    display: inline-flex; align-items: center; justify-content: center;
    border: none; background: transparent; color: var(--sx-text-secondary);
    border-radius: 4px;
  }
  .tab-add { transition: background .13s ease, color .13s ease; }
  .tab-add:hover { background: var(--sx-bg-hover); color: var(--sx-brand); }
  .sheet-tab {
    position: relative;
    min-height: 34px;
    padding: 0 16px;
    border: none;
    background: transparent;
    color: var(--sx-text-secondary);
    font-size: 16px;
    cursor: pointer;
    transition: color .13s ease, background .13s ease;
  }
  .sheet-tab:hover { color: var(--sx-text-primary); background: var(--sx-bg-hover); }
  .sheet-tab:focus-visible { outline: 2px solid var(--sx-brand); outline-offset: -2px; }
  .sheet-tab.active { color: var(--sx-brand); font-weight: 600; }
  .sheet-tab.active::after {
    content: '';
    position: absolute;
    left: 12px; right: 12px; bottom: 0;
    height: 2px;
    background: var(--sx-brand);
    border-radius: 2px 2px 0 0;
  }

  /* ============ 状态栏 ============ */
  .statusbar {
    display: flex;
    align-items: center;
    background: var(--sx-bg-surface);
    border-top: 1px solid var(--sx-border);
    padding: 0 12px;
    font-size: 11px;
    color: var(--sx-text-secondary);
  }
  .status-ready { display: flex; align-items: center; gap: 6px; }
  .status-ready .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--sx-success); }
  .status-stats { margin-left: auto; display: flex; gap: 22px; }
  .status-view { display: flex; align-items: center; gap: 2px; margin-left: 22px; }
  .status-view .tool-btn { width: 24px; height: 24px; }
  .status-view .tool-btn.active { color: var(--sx-brand); }
  .zoom { display: flex; align-items: center; gap: 6px; margin-left: 14px; }
  .zoom input[type='range'] { width: 64px; accent-color: var(--sx-brand); }
  .zoom-value { min-width: 34px; text-align: right; }

  /* ============ 冻结表头（视图菜单）：列头之下再钉住首行标题 ============ */
  .sheet thead.frozen + tbody tr:first-child td,
  .sheet thead.frozen + tbody tr:first-child th {
    position: sticky;
    top: 30px;
    z-index: 1;
    background: var(--sx-grid-header-bg);
  }

  /* ============ 单元格内联编辑器（双击进入） ============ */
  .cell-editor {
    display: block;
    width: calc(100% + 18px);
    height: calc(100% + 2px);
    margin: -1px -9px;
    padding: 0 9px;
    border: 0;
    outline: 2px solid var(--sx-cell-selected);
    outline-offset: -2px;
    background: var(--sx-bg-surface);
    font: inherit;
    color: inherit;
  }

  /* ============ 卡片视图（状态栏/视图菜单切换） ============ */
  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 12px;
    padding: 14px;
  }
  .data-card {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 12px;
    border: 1px solid var(--sx-border);
    border-radius: 8px;
    background: var(--sx-bg-surface);
  }
  .data-card .dc-head { display: flex; align-items: center; justify-content: space-between; }
  .data-card .dc-rate { color: var(--sx-brand); font-weight: 600; font-size: 16px; }
  .data-card .dc-row { display: flex; justify-content: space-between; font-size: 16px; color: var(--sx-text-secondary); }
  .data-card .dc-row b { color: var(--sx-text-primary); font-weight: 500; }
  .data-card .dc-note {
    padding-top: 6px;
    border-top: 1px dashed var(--sx-border);
    font-size: 11px;
    color: var(--sx-text-hint);
  }
`
