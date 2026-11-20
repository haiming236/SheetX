/**
 * SheetX 第 13 张 · 数据透视表 — 样式
 *
 * 风格约束：无 glow / shadow，简洁清爽，提示文字调淡。
 */
import { css } from 'lit'

export const pivotStyles = css`
  :host {
    display: block;
    height: 100%;
    background: var(--sx-bg-surface);
    color: var(--sx-text-primary);
    font-family: 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif;
    font-size: 14px;
  }

  .app { display: flex; flex-direction: column; height: 100%; overflow: hidden; }

  /* ============ 顶栏 ============ */
  .topbar {
    height: 50px; flex-shrink: 0;
    display: flex; align-items: center; gap: 14px;
    padding: 0 18px;
    border-bottom: 1px solid var(--sx-border);
    background: var(--sx-bg-surface);
  }
  .traffic { display: flex; gap: 7px; }
  .traffic i { width: 11px; height: 11px; border-radius: 50%; }
  .traffic i:nth-child(1) { background: #f56c6c; }
  .traffic i:nth-child(2) { background: #f7ba2a; }
  .traffic i:nth-child(3) { background: #67c23a; }
  .brand { display: flex; align-items: center; }
  .top-menus { display: flex; gap: 4px; }
  .top-menu {
    border: none; background: transparent; cursor: pointer;
    padding: 6px 12px; border-radius: 6px;
    font-size: 14px; color: var(--sx-text-secondary);
  }
  .top-menu:hover { background: var(--sx-bg-hover); }
  .top-menu.active { color: var(--sx-brand); font-weight: 600; }
  .top-right { margin-left: auto; display: flex; align-items: center; gap: 12px; }
  .search {
    display: flex; align-items: center; gap: 8px;
    width: 200px; height: 32px; padding: 0 12px;
    border: 1px solid var(--sx-border-input);
    border-radius: 8px; color: var(--sx-text-hint);
  }
  .search input {
    flex: 1; min-width: 0; border: none; outline: none; background: transparent;
    font-size: 13px; color: var(--sx-text-primary);
  }
  .search input::placeholder { color: var(--sx-text-hint); }
  .avatar {
    width: 32px; height: 32px; border-radius: 50%;
    background: #334155; color: #fff;
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 600; flex-shrink: 0;
  }

  /* ============ 工具栏 ============ */
  .toolbar {
    height: 40px; flex-shrink: 0;
    display: flex; align-items: center; gap: 6px;
    padding: 0 14px;
    border-bottom: 1px solid var(--sx-border);
    background: var(--sx-bg-surface);
  }
  .tool-btn {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 28px; height: 28px; padding: 0 5px;
    border: none; background: transparent; cursor: pointer;
    border-radius: 6px; color: var(--sx-text-secondary);
  }
  .tool-btn:hover { background: var(--sx-bg-hover); color: var(--sx-text-primary); }
  .tool-btn b { font-weight: 700; font-size: 14px; }
  .tool-btn i { font-style: italic; font-family: Georgia, serif; font-size: 14px; }
  .tool-btn u { text-decoration: underline; font-size: 14px; }
  .tool-btn .fc-red { color: #ef4444; text-decoration: underline; text-underline-offset: 2px; font-size: 14px; }
  .tool-btn .fc-yellow { color: #f7ba2a; text-decoration: underline; text-underline-offset: 2px; font-size: 14px; }
  .v-sep { width: 1px; height: 18px; background: var(--sx-border); margin: 0 3px; flex-shrink: 0; }
  .font-select {
    display: flex; align-items: center; gap: 6px;
    height: 28px; padding: 0 9px;
    border: 1px solid var(--sx-border-input);
    border-radius: 6px;
    font-size: 13px; color: var(--sx-text-primary);
    cursor: default; white-space: nowrap; background: var(--sx-bg-surface);
  }
  .font-select .caret { color: var(--sx-text-hint); display: inline-flex; }
  .merge-label { font-size: 13px; display: inline-flex; align-items: center; gap: 5px; }

  /* ============ 主体 ============ */
  .body { flex: 1; display: flex; min-height: 0; }

  .formula-bar {
    height: 34px; flex-shrink: 0;
    display: flex; align-items: center; gap: 8px;
    padding: 0 10px;
    border-bottom: 1px solid var(--sx-border);
  }
  .cell-ref {
    display: inline-flex; align-items: center; gap: 4px;
    height: 24px; padding: 0 8px;
    border: 1px solid var(--sx-border-input);
    border-radius: 5px;
    font-size: 12.5px; color: var(--sx-text-primary);
  }
  .cell-ref .caret { color: var(--sx-text-hint); display: inline-flex; }
  .fx-badge {
    font-size: 11px; font-style: italic; font-weight: 600;
    color: var(--sx-text-hint);
    border: 1px solid var(--sx-border);
    border-radius: 4px; padding: 1px 5px;
  }
  .formula-input { flex: 1; font-size: 13px; color: var(--sx-text-primary); overflow: hidden; white-space: nowrap; }

  /* ---- 左侧源数据表 ---- */
  .source-area {
    width: 330px; flex-shrink: 0;
    display: flex; flex-direction: column;
    border-right: 1px solid var(--sx-border);
    background: var(--sx-bg-surface);
  }
  .src-col-headers { display: flex; flex-shrink: 0; }
  .src-corner {
    width: 36px; height: 26px; flex-shrink: 0;
    border-right: 1px solid var(--sx-grid-line);
    border-bottom: 1px solid var(--sx-grid-line);
    background: var(--sx-bg-subtle);
  }
  .src-col-head {
    height: 26px; flex-shrink: 0;
    display: inline-flex; align-items: center; justify-content: center;
    border-right: 1px solid var(--sx-grid-line);
    border-bottom: 1px solid var(--sx-grid-line);
    background: var(--sx-bg-subtle);
    color: var(--sx-text-secondary);
    font-size: 12px; font-weight: 500;
  }
  .src-body { flex: 1; min-height: 0; overflow: auto; }
  .src-row { display: flex; }
  .src-row-head {
    width: 36px; height: 27px; flex-shrink: 0;
    display: inline-flex; align-items: center; justify-content: center;
    border-right: 1px solid var(--sx-grid-line);
    border-bottom: 1px solid var(--sx-grid-line);
    background: var(--sx-bg-subtle);
    color: var(--sx-text-secondary);
    font-size: 11.5px; font-weight: 500;
    box-sizing: border-box;
  }
  .src-cell {
    height: 27px; flex-shrink: 0;
    display: inline-flex; align-items: center;
    border-right: 1px solid var(--sx-grid-line);
    border-bottom: 1px solid var(--sx-grid-line);
    font-size: 12px; color: var(--sx-text-primary);
    padding: 0 8px;
    box-sizing: border-box;
    white-space: nowrap; overflow: hidden;
  }
  .src-cell.head {
    background: var(--sx-bg-active);
    color: var(--sx-text-primary); font-weight: 600;
  }
  .src-cell.num { justify-content: flex-end; font-variant-numeric: tabular-nums; }

  /* ---- 右侧透视区 ---- */
  .pivot-area { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .p-col-headers { display: flex; flex-shrink: 0; }
  .p-col-head {
    width: 64px; height: 26px; flex-shrink: 0;
    display: inline-flex; align-items: center; justify-content: center;
    border-right: 1px solid var(--sx-grid-line);
    border-bottom: 1px solid var(--sx-grid-line);
    background: var(--sx-bg-subtle);
    color: var(--sx-text-secondary);
    font-size: 12px; font-weight: 500;
  }
  .p-col-fill {
    flex: 1; height: 26px;
    background: var(--sx-bg-subtle);
    border-bottom: 1px solid var(--sx-grid-line);
  }
  .p-grid {
    flex: 1; min-height: 0;
    position: relative;
    padding: 8px;
    overflow: auto;
    background-image:
      linear-gradient(to right, var(--sx-grid-line) 1px, transparent 1px),
      linear-gradient(to bottom, var(--sx-grid-line) 1px, transparent 1px);
    background-size: 64px 32px;
    display: flex; flex-direction: column; gap: 10px;
  }

  .p-card {
    background: var(--sx-bg-surface);
    border: 1px solid var(--sx-border);
    border-radius: 10px;
    padding: 9px 12px;
    box-sizing: border-box;
    width: max-content;
    min-width: 520px;
    max-width: 100%;
  }
  .p-banner {
    height: 32px; border-radius: 7px;
    background: linear-gradient(135deg, #60a5fa, #3b82f6 55%, #2f6fe4);
    color: #fff;
    display: flex; align-items: center; gap: 8px;
    padding: 0 13px;
    font-size: 14px; font-weight: 700; letter-spacing: 0.5px;
  }
  .p-banner .bi { display: inline-flex; }

  .p-filters { display: flex; gap: 8px; margin: 7px 0; }
  .p-filter-chip {
    display: inline-flex; align-items: center; gap: 6px;
    height: 26px; padding: 0 10px;
    border: 1px solid var(--sx-border-input);
    border-radius: 7px;
    background: var(--sx-bg-surface);
    cursor: pointer;
    font-size: 12.5px; color: var(--sx-text-primary);
    position: relative;
  }
  .p-filter-chip:hover { background: var(--sx-bg-hover); }
  .p-filter-chip .fv { color: var(--sx-brand); font-weight: 600; }
  .p-filter-chip .caret { color: var(--sx-text-hint); display: inline-flex; }
  .p-filter-chip.set { border-color: var(--sx-brand); }

  /* ---- 透视表 ---- */
  .pv-scroll { overflow-x: auto; }
  .pv-table { border-collapse: collapse; table-layout: fixed; }
  .pv-table th, .pv-table td {
    border: 1px solid var(--sx-border);
    height: 25px;
    font-size: 12px;
    text-align: center;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    padding: 0 8px;
    color: var(--sx-text-primary);
  }
  .pv-table th {
    background: var(--sx-bg-active);
    font-weight: 600;
  }
  .pv-table td.rowhead {
    background: #f4f7fb;
    font-weight: 600; text-align: left;
  }
  .pv-table td.total, .pv-table th.total {
    background: var(--sx-grid-header-bg); font-weight: 700;
  }
  .pv-table td .dash { color: var(--sx-text-hint); }
  .pv-table td.num { font-variant-numeric: tabular-nums; }

  /* ---- 柱状图卡 ---- */
  .pc-head { display: flex; align-items: center; gap: 7px; margin-bottom: 0; }
  .pc-head .ic { color: var(--sx-brand); display: inline-flex; }
  .pc-head .tt { font-size: 13.5px; font-weight: 700; flex: 1; }
  .pc-legend { display: flex; gap: 12px; flex-wrap: wrap; }
  .pc-legend .lg { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; color: var(--sx-text-secondary); white-space: nowrap; }
  .pc-legend .dot { width: 9px; height: 9px; border-radius: 2.5px; }

  /* ============ 右侧面板 ============ */
  .pivot-panel {
    width: 262px; flex-shrink: 0;
    border-left: 1px solid var(--sx-border);
    background: var(--sx-bg-surface);
    padding: 13px 15px;
    display: flex; flex-direction: column;
    overflow-y: auto;
  }
  .pp-head { display: flex; align-items: center; gap: 8px; }
  .pp-head .ic { color: var(--sx-brand); display: inline-flex; }
  .pp-head .tt { font-size: 14px; font-weight: 700; flex: 1; }
  .pp-close {
    border: none; background: transparent; cursor: pointer;
    color: var(--sx-text-hint); padding: 4px; border-radius: 5px;
    display: inline-flex;
  }
  .pp-close:hover { background: var(--sx-bg-hover); color: var(--sx-text-primary); }
  .pp-tabs { display: flex; gap: 18px; border-bottom: 1px solid var(--sx-border); margin: 11px 0 13px; }
  .pp-tab {
    border: none; background: transparent; cursor: pointer;
    padding: 6px 2px; font-size: 13px; color: var(--sx-text-secondary);
    border-bottom: 2px solid transparent;
  }
  .pp-tab.on { color: var(--sx-brand); font-weight: 600; border-bottom-color: var(--sx-brand); }
  .pp-label { display: block; font-size: 12.5px; color: var(--sx-text-primary); margin: 0 0 8px; }
  .pp-section { margin-bottom: 14px; }

  .field-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
  .field-head .pp-label { margin-bottom: 0; }
  .field-head .fic { color: var(--sx-text-secondary); display: inline-flex; }
  .field-search {
    display: flex; align-items: center; gap: 7px;
    height: 30px; padding: 0 10px;
    border: 1px solid var(--sx-border-input);
    border-radius: 7px;
    color: var(--sx-text-hint);
    margin-bottom: 8px;
  }
  .field-search input {
    flex: 1; min-width: 0; border: none; outline: none; background: transparent;
    font-size: 12.5px; color: var(--sx-text-primary);
  }
  .field-search input::placeholder { color: var(--sx-text-hint); }
  .field-item {
    display: flex; align-items: center; gap: 8px;
    padding: 5px 2px;
    font-size: 12.5px; color: var(--sx-text-primary);
    cursor: pointer; user-select: none;
  }
  .field-item:hover { color: var(--sx-brand); }
  .field-item .fbox {
    width: 15px; height: 15px; border-radius: 4px;
    border: 1.5px solid var(--sx-border-input);
    display: inline-flex; align-items: center; justify-content: center;
    color: #fff; flex-shrink: 0;
  }
  .field-item.checked .fbox { background: var(--sx-brand); border-color: var(--sx-brand); }
  .field-empty { font-size: 12px; color: var(--sx-text-hint); padding: 6px 2px; }

  .drop-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .drop-card {
    border: 1px solid var(--sx-border-input);
    border-radius: 8px;
    padding: 8px 9px;
    background: var(--sx-bg-surface);
    cursor: grab;
  }
  .drop-card:hover { background: var(--sx-bg-hover); }
  .drop-card .dc-title {
    display: flex; align-items: center; gap: 5px;
    font-size: 12px; color: var(--sx-text-secondary);
    margin-bottom: 6px;
  }
  .drop-card .dc-title .ic { display: inline-flex; color: var(--sx-text-secondary); }
  .drop-card .dc-grip { margin-left: auto; display: inline-flex; color: var(--sx-text-hint); }
  .drop-opt {
    display: flex; align-items: center; justify-content: space-between; gap: 6px;
    height: 28px; padding: 0 8px;
    border: 1px solid var(--sx-border);
    border-radius: 6px;
    background: var(--sx-bg-surface);
    cursor: pointer;
    font-size: 12px; color: var(--sx-text-primary);
    position: relative;
  }
  .drop-opt:hover { background: var(--sx-bg-hover); }
  .drop-opt .caret { color: var(--sx-text-hint); display: inline-flex; }
  .drop-opt .oic { display: inline-flex; color: var(--sx-brand); }

  .settings-toggle {
    display: flex; align-items: center; gap: 5px;
    border: none; background: transparent; cursor: pointer;
    padding: 2px 0; margin-bottom: 8px;
    font-size: 12.5px; color: var(--sx-text-primary);
  }
  .settings-toggle .caret { color: var(--sx-text-hint); display: inline-flex; transition: transform 0.15s; }
  .settings-toggle .caret.open { transform: rotate(180deg); }
  .set-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
  .set-row .sk { font-size: 12px; color: var(--sx-text-secondary); flex-shrink: 0; }
  .set-opt {
    display: flex; align-items: center; justify-content: space-between; gap: 6px;
    flex: 1; height: 28px; padding: 0 8px;
    border: 1px solid var(--sx-border-input);
    border-radius: 6px;
    background: var(--sx-bg-surface);
    cursor: pointer;
    font-size: 12px; color: var(--sx-text-primary);
    position: relative;
  }
  .set-opt:hover { background: var(--sx-bg-hover); }
  .set-opt .caret { color: var(--sx-text-hint); display: inline-flex; }

  /* ---- 下拉菜单 ---- */
  .opt-wrap { position: relative; flex: 1; min-width: 0; }
  .opt-wrap .drop-opt, .opt-wrap .set-opt { width: 100%; }
  .p-filters .opt-wrap { flex: none; }
  .opt-menu {
    position: absolute; z-index: 40;
    top: calc(100% + 4px); left: 0;
    min-width: 118px;
    background: var(--sx-bg-surface);
    border: 1px solid var(--sx-border);
    border-radius: 8px;
    padding: 4px;
  }
  .opt-menu.right { left: auto; right: 0; }
  .opt-item {
    display: flex; align-items: center; gap: 7px;
    width: 100%; padding: 6px 8px;
    border: none; border-radius: 5px; background: transparent; cursor: pointer;
    font-size: 12px; color: var(--sx-text-primary); text-align: left;
  }
  .opt-item:hover { background: var(--sx-bg-hover); }
  .opt-item.on { background: var(--sx-brand-soft); color: var(--sx-brand); font-weight: 600; }
  .opt-item .ck { margin-left: auto; display: inline-flex; }
  .opt-sep { height: 1px; background: var(--sx-border); margin: 4px 6px; }
  .menu-group-label { font-size: 11px; color: var(--sx-text-hint); padding: 4px 8px 2px; }

  /* ============ 底部标签栏 ============ */
  .sheet-tabs {
    height: 38px; flex-shrink: 0;
    display: flex; align-items: center; gap: 2px;
    padding: 0 10px;
    border-top: 1px solid var(--sx-border);
    background: var(--sx-bg-surface);
  }
  .tab-add {
    width: 28px; height: 28px;
    border: none; border-radius: 6px;
    background: transparent; cursor: pointer;
    color: var(--sx-text-secondary);
    display: inline-flex; align-items: center; justify-content: center;
  }
  .tab-add:hover { background: var(--sx-bg-hover); color: var(--sx-brand); }
  .sheet-tab {
    position: relative;
    display: flex; align-items: center;
    height: 38px; padding: 0 16px;
    border: none; background: transparent; cursor: pointer;
    font-size: 13px; color: var(--sx-text-secondary);
  }
  .sheet-tab:hover { color: var(--sx-text-primary); }
  .sheet-tab.on { color: var(--sx-brand); font-weight: 600; }
  .sheet-tab.on::after {
    content: '';
    position: absolute; left: 12px; right: 12px; bottom: 0;
    height: 2.5px; border-radius: 1px;
    background: var(--sx-brand);
  }

  /* ============ 状态栏 ============ */
  .statusbar {
    height: 34px; flex-shrink: 0;
    display: flex; align-items: center; gap: 18px;
    padding: 0 16px;
    border-top: 1px solid var(--sx-border);
    font-size: 12px; color: var(--sx-text-secondary);
    background: var(--sx-bg-surface);
  }
  .status-ok { display: flex; align-items: center; gap: 6px; color: #16a34a; }
  .status-stats { display: flex; gap: 16px; margin-left: auto; }
  .zoom { display: flex; align-items: center; gap: 8px; }
  .zoom button {
    border: none; background: transparent; cursor: pointer;
    color: var(--sx-text-secondary); padding: 3px; border-radius: 4px;
    display: inline-flex;
  }
  .zoom button:hover { background: var(--sx-bg-hover); }

  /* ============ Toast ============ */
  .toast {
    position: fixed; left: 50%; bottom: 60px; transform: translateX(-50%);
    background: #1f2937; color: #fff;
    font-size: 13px;
    padding: 9px 18px; border-radius: 8px;
    z-index: 99;
    animation: toast-in 0.2s ease-out;
  }
  @keyframes toast-in {
    from { opacity: 0; transform: translate(-50%, 8px); }
    to { opacity: 1; transform: translate(-50%, 0); }
  }
`
