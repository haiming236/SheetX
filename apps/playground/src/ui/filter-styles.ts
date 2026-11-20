/**
 * SheetX 样式（第 09 张设计稿 · 数据筛选与排序）
 * 复用系列骨架类名与令牌，新增表头筛选图标 / C 列筛选面板 / 右侧筛选设置面板。
 */
import { css } from 'lit'

export const filterStyles = css`
  :host {
    display: block;
    width: 100%;
    height: 100%;
    background: var(--sx-bg-app);
    overflow: hidden;
  }

  .app {
    display: grid;
    grid-template-rows: 44px 44px 38px 1fr 34px 30px;
    height: 100%;
    min-width: 980px;
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
  .nav { display: flex; align-items: stretch; height: 100%; gap: 2px; }
  .nav-item {
    position: relative;
    display: inline-flex;
    align-items: center;
    padding: 0 13px;
    background: transparent;
    border: none;
    color: var(--sx-text-secondary);
    font-size: 13px;
    white-space: nowrap;
  }
  .nav-item:hover { color: var(--sx-text-primary); }
  .nav-item.active { color: var(--sx-brand); font-weight: 500; }
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
  .topbar-right { margin-left: auto; display: flex; align-items: center; gap: 4px; }
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
    font-size: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
  }

  /* ============ 格式工具栏 ============ */
  .toolbar {
    display: flex;
    align-items: center;
    background: var(--sx-bg-surface);
    border-bottom: 1px solid var(--sx-border);
    padding: 0 12px;
    gap: 2px;
    overflow: hidden;
  }
  .tool-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 28px;
    height: 28px;
    border: 1px solid transparent;
    border-radius: 5px;
    background: transparent;
    color: var(--sx-text-secondary);
    flex: none;
    padding: 0 4px;
  }
  .tool-btn:hover { background: var(--sx-bg-hover); color: var(--sx-text-primary); }
  .tool-btn.active {
    color: var(--sx-brand);
    background: var(--sx-brand-soft);
  }
  .tool-btn:disabled { color: var(--sx-border-strong); cursor: default; }
  .tool-btn:disabled:hover { background: transparent; }
  .tool-btn .caret { color: var(--sx-text-hint); display: inline-flex; margin-left: 1px; }
  .v-sep { width: 1px; height: 18px; background: var(--sx-border); margin: 0 6px; flex: none; }
  .font-select {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 28px;
    padding: 0 8px;
    border: 1px solid transparent;
    border-radius: 5px;
    background: transparent;
    color: var(--sx-text-primary);
    font-size: 12px;
    white-space: nowrap;
    flex: none;
  }
  .font-select:hover { background: var(--sx-bg-hover); }
  .font-select .caret { color: var(--sx-text-hint); display: inline-flex; }
  .font-select.wide { min-width: 96px; justify-content: space-between; }
  .text-demo {
    font-size: 14px;
    font-weight: 600;
    line-height: 1;
    color: var(--sx-text-primary);
  }
  .text-demo.strike { position: relative; }
  .text-demo.strike::after {
    content: '';
    position: absolute;
    left: -2px;
    right: -2px;
    top: 50%;
    height: 1.6px;
    background: var(--sx-danger);
    transform: rotate(-14deg);
  }
  .text-demo.hl-mark {
    background: #fde68a;
    border-radius: 2px;
    padding: 1px 3px;
    font-weight: 500;
  }

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
    height: 26px;
    padding: 0 8px;
    border: 1px solid var(--sx-border-input);
    border-radius: 4px 0 0 4px;
    background: var(--sx-bg-surface);
    font-size: 12px;
    font-weight: 500;
    flex: none;
  }
  .cell-address .caret { color: var(--sx-text-hint); display: inline-flex; }
  .fx-box {
    width: 38px;
    height: 26px;
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
    height: 26px;
    padding: 0 10px;
    border: 1px solid var(--sx-border-input);
    border-radius: 0 4px 4px 0;
    background: var(--sx-bg-surface);
    color: var(--sx-text-primary);
    font-size: 12.5px;
    outline: none;
    display: flex;
    align-items: center;
    white-space: nowrap;
    overflow: hidden;
  }

  /* ============ 主体区 ============ */
  .body {
    display: flex;
    min-height: 0;
    position: relative;
  }
  .grid-area {
    flex: 1;
    min-width: 0;
    overflow: auto;
    background: var(--sx-bg-surface);
    position: relative;
  }

  /* 表格（列宽总和 36+150+150+126+126+88+104 = 780，固定宽度保证面板定位稳定） */
  .sheet {
    border-collapse: separate;
    border-spacing: 0;
    table-layout: fixed;
    font-size: 12px;
    width: 780px;
  }
  .sheet th, .sheet td {
    border-right: 1px solid var(--sx-grid-line);
    border-bottom: 1px solid var(--sx-grid-line);
    padding: 0;
    height: 30px;
    text-align: left;
    overflow: hidden;
  }
  .sheet thead th.corner,
  .sheet thead th.col-head {
    background: var(--sx-bg-subtle);
    color: var(--sx-text-hint);
    font-weight: 400;
    text-align: center;
    border-top: 1px solid var(--sx-grid-line);
    position: sticky;
    top: 0;
    z-index: 2;
  }
  .sheet thead th.corner { width: 36px; border-left: 1px solid var(--sx-grid-line); }
  .sheet thead th.col-head {
    background: var(--sx-grid-header-bg);
    color: var(--sx-grid-header-text);
    font-weight: 500;
    padding: 0 10px;
  }
  .sheet thead th.col-head .head-wrap {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    width: 100%;
  }
  .sheet thead th.col-head.filtering {
    background: var(--sx-bg-active);
    color: var(--sx-brand);
    box-shadow: inset 0 -2px 0 var(--sx-brand);
  }
  .th-filter {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--sx-brand);
    flex: none;
    padding: 0;
  }
  .th-filter:hover { background: var(--sx-brand-soft); }
  .sheet tbody th.row-head {
    background: var(--sx-bg-subtle);
    color: var(--sx-text-secondary);
    font-weight: 400;
    text-align: center;
    border-left: 1px solid var(--sx-grid-line);
    position: sticky;
    left: 0;
    z-index: 1;
    width: 36px;
  }
  .sheet tbody tr:hover td { background: var(--sx-bg-hover); }
  .sheet td.cell {
    background: var(--sx-bg-surface);
    padding: 0 10px;
    white-space: nowrap;
    text-overflow: ellipsis;
    color: var(--sx-text-primary);
    cursor: cell;
  }
  .sheet td.cell.num { font-variant-numeric: tabular-nums; }
  .sheet td.selected {
    position: relative;
    outline: 1.5px solid var(--sx-cell-selected);
    outline-offset: -1.5px;
    z-index: 3;
  }

  /* ============ C 列筛选面板 ============ */
  .col-panel {
    position: absolute;
    left: 336px;
    top: 30px;
    width: 178px;
    background: var(--sx-bg-surface);
    border: 1px solid var(--sx-border-strong);
    border-radius: 8px;
    padding: 5px;
    z-index: 30;
  }
  .cp-row {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 28px;
    padding: 0 8px;
    border: none;
    border-radius: 5px;
    background: transparent;
    color: var(--sx-text-primary);
    font-size: 12.5px;
    width: 100%;
    cursor: pointer;
    white-space: nowrap;
  }
  .cp-row:hover { background: var(--sx-bg-hover); }
  .cp-row .cp-icon { display: inline-flex; color: var(--sx-text-secondary); flex: none; }
  .cp-row .cp-label { flex: 1; min-width: 0; text-align: left; }
  .cp-row .cp-arr { display: inline-flex; color: var(--sx-text-hint); flex: none; }
  .cp-search {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 26px;
    margin: 4px 4px 2px;
    padding: 0 8px;
    border: 1px solid var(--sx-border-input);
    border-radius: 5px;
    color: var(--sx-text-hint);
    background: var(--sx-bg-surface);
  }
  .cp-search input {
    flex: 1;
    min-width: 0;
    border: none;
    outline: none;
    background: transparent;
    font-size: 12px;
    color: var(--sx-text-primary);
    font-family: inherit;
  }
  .cp-search input::placeholder { color: var(--sx-text-hint); }
  .cp-check {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 27px;
    padding: 0 8px;
    border: none;
    border-radius: 5px;
    background: transparent;
    color: var(--sx-text-primary);
    font-size: 12.5px;
    width: 100%;
    cursor: pointer;
  }
  .cp-check:hover { background: var(--sx-bg-hover); }
  .cp-check .box {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    border: 1.4px solid var(--sx-border-strong);
    border-radius: 3px;
    background: var(--sx-bg-surface);
    color: #fff;
    flex: none;
  }
  .cp-check.on .box { background: var(--sx-brand); border-color: var(--sx-brand); }
  .cp-check .cnt { color: var(--sx-text-hint); font-size: 11.5px; }
  .cp-empty {
    padding: 10px 8px;
    text-align: center;
    font-size: 12px;
    color: var(--sx-text-hint);
  }
  .cp-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 6px 4px 2px;
  }
  .btn-sm {
    height: 27px;
    padding: 0 14px;
    border-radius: 5px;
    font-size: 12px;
    border: 1px solid var(--sx-border-input);
    background: var(--sx-bg-surface);
    color: var(--sx-text-primary);
  }
  .btn-sm:hover { background: var(--sx-bg-hover); }
  .btn-sm.primary {
    background: var(--sx-brand);
    border-color: var(--sx-brand);
    color: #fff;
  }
  .btn-sm.primary:hover { background: var(--sx-brand-hover); }

  /* ============ 右侧筛选设置面板 ============ */
  .filter-panel {
    position: absolute;
    right: 5px;
    top: 6px;
    width: 286px;
    background: var(--sx-bg-surface);
    border: 1px solid var(--sx-border);
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(31, 41, 55, 0.08);
    padding: 13px 15px 15px;
    z-index: 20;
    max-height: calc(100% - 16px);
    overflow: auto;
  }
  .fp-head {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: var(--sx-text-primary);
  }
  .fp-head .funnel { display: inline-flex; color: var(--sx-brand); }
  .fp-head .icon-btn { margin-left: auto; width: 26px; height: 26px; }
  .fp-mode {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin-top: 12px;
    font-size: 12px;
    color: var(--sx-text-secondary);
    border: none;
    background: transparent;
    padding: 0;
  }
  .fp-mode .caret { display: inline-flex; color: var(--sx-brand); }
  .cond-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 9px;
  }
  .cond-select {
    position: relative;
    flex: none;
  }
  .cond-select.field { flex: 1.15; min-width: 0; }
  .cond-select.op { flex: 1; min-width: 0; }
  .cs-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 5px;
    width: 100%;
    height: 30px;
    padding: 0 8px;
    border: 1px solid var(--sx-border-input);
    border-radius: 5px;
    background: var(--sx-bg-surface);
    color: var(--sx-text-primary);
    font-size: 12px;
    cursor: pointer;
    white-space: nowrap;
  }
  .cs-btn:hover { border-color: var(--sx-brand); }
  .cs-btn .txt { overflow: hidden; text-overflow: ellipsis; }
  .cs-btn .caret { display: inline-flex; color: var(--sx-text-hint); flex: none; }
  .cs-menu {
    position: absolute;
    left: 0;
    top: 33px;
    min-width: 100%;
    background: var(--sx-bg-surface);
    border: 1px solid var(--sx-border-strong);
    border-radius: 6px;
    padding: 3px;
    z-index: 40;
    box-shadow: 0 6px 16px rgba(31, 41, 55, 0.1);
  }
  .cs-opt {
    display: block;
    width: 100%;
    height: 27px;
    padding: 0 9px;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--sx-text-primary);
    font-size: 12px;
    text-align: left;
    white-space: nowrap;
    cursor: pointer;
  }
  .cs-opt:hover { background: var(--sx-bg-hover); }
  .cs-opt.on { background: var(--sx-brand-soft); color: var(--sx-brand); }
  .cond-value {
    flex: 1;
    min-width: 0;
    height: 30px;
    padding: 0 9px;
    border: 1px solid var(--sx-border-input);
    border-radius: 5px;
    background: var(--sx-bg-surface);
    color: var(--sx-text-primary);
    font-size: 12px;
    font-family: inherit;
    outline: none;
  }
  .cond-value:focus { border-color: var(--sx-brand); }
  .cond-del {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border: none;
    border-radius: 50%;
    background: var(--sx-bg-subtle);
    color: var(--sx-text-secondary);
    flex: none;
    padding: 0;
  }
  .cond-del:hover { background: var(--sx-bg-hover); color: var(--sx-danger); }
  .add-cond {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin-top: 10px;
    height: 27px;
    padding: 0 11px;
    border: none;
    border-radius: 5px;
    background: var(--sx-brand-soft);
    color: var(--sx-brand);
    font-size: 12px;
    cursor: pointer;
  }
  .add-cond:hover { background: var(--sx-bg-active); }
  .fp-divider { height: 1px; background: var(--sx-grid-line); margin: 13px 0 11px; }
  .sort-head {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 13px;
    font-weight: 600;
    color: var(--sx-text-primary);
  }
  .sort-head .ic { display: inline-flex; color: var(--sx-text-secondary); }
  .sort-row {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-top: 10px;
    font-size: 12px;
    color: var(--sx-text-secondary);
  }
  .sort-row .cond-select { flex: 1; min-width: 0; }
  .fp-actions {
    display: flex;
    gap: 9px;
    margin-top: 13px;
  }
  .btn-main {
    flex: 1;
    height: 31px;
    border: 1px solid var(--sx-border-input);
    border-radius: 6px;
    background: var(--sx-bg-surface);
    color: var(--sx-text-primary);
    font-size: 12.5px;
    cursor: pointer;
  }
  .btn-main:hover { background: var(--sx-bg-hover); }
  .btn-main.primary {
    background: var(--sx-brand);
    border-color: var(--sx-brand);
    color: #fff;
  }
  .btn-main.primary:hover { background: var(--sx-brand-hover); }
  .stat-card {
    margin-top: 13px;
    background: var(--sx-brand-soft);
    border-radius: 8px;
    padding: 11px 13px 12px;
  }
  .stat-head {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--sx-text-primary);
  }
  .stat-head .ic { display: inline-flex; color: var(--sx-brand); }
  .stat-line {
    margin-top: 8px;
    font-size: 12px;
    color: var(--sx-text-secondary);
  }
  .stat-line strong {
    color: var(--sx-text-primary);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  .panel-closed-tip {
    position: absolute;
    right: 5px;
    top: 6px;
    z-index: 20;
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
  .tab-add:hover { background: var(--sx-bg-hover); }
  .sheet-tab {
    position: relative;
    height: 100%;
    padding: 0 14px;
    border: none;
    background: transparent;
    color: var(--sx-text-secondary);
    font-size: 12px;
  }
  .sheet-tab:hover { color: var(--sx-text-primary); }
  .sheet-tab.active { color: var(--sx-brand); font-weight: 500; }
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
  .status-stats { margin-left: auto; display: flex; gap: 20px; }
  .zoom { display: flex; align-items: center; gap: 6px; margin-left: 20px; }
  .zoom-value { min-width: 34px; text-align: center; color: var(--sx-text-primary); }
`
