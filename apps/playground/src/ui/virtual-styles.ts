/**
 * SheetX 大数据量与虚拟滚动界面样式（第 05 张设计稿）
 */
import { css } from 'lit'

export const virtualStyles = css`
  :host {
    display: block; width: 100%; height: 100%;
    background: var(--sx-bg-app); overflow: hidden;
  }
  .app {
    display: grid; grid-template-rows: 42px 44px 30px 1fr 30px 28px;
    height: 100%; min-width: 1040px;
  }

  /* 顶部 */
  .topbar {
    display: flex; align-items: center; gap: 22px; padding: 0 16px;
    background: var(--sx-bg-surface); border-bottom: 1px solid var(--sx-border);
  }
  .nav { display: flex; gap: 1px; height: 100%; align-items: stretch; }
  .nav-item {
    position: relative; padding: 0 13px; border: none; background: transparent;
    color: var(--sx-text-secondary); font-size: 13px;
  }
  .nav-item.active { color: var(--sx-brand); font-weight: 500; }
  .nav-item.active::after {
    content: ''; position: absolute; left: 11px; right: 11px; bottom: 0;
    height: 2px; background: var(--sx-brand); border-radius: 2px 2px 0 0;
  }
  .topbar-right { margin-left: auto; display: flex; align-items: center; gap: 10px; }
  .search-box {
    display: flex; align-items: center; gap: 7px; width: 252px; height: 27px;
    padding: 0 10px; background: var(--sx-bg-subtle); border: 1px solid var(--sx-border);
    border-radius: 6px; color: var(--sx-text-hint); font-size: 11px;
  }
  .icon-btn {
    width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center;
    border: none; border-radius: 6px; background: transparent; color: var(--sx-text-secondary);
  }
  .avatar {
    width: 27px; height: 27px; border-radius: 50%; background: var(--sx-brand);
    color: #fff; font-size: 12px; display: inline-flex; align-items: center; justify-content: center;
  }

  /* 工具栏 */
  .toolbar {
    display: flex; align-items: center; gap: 4px; padding: 0 14px;
    background: var(--sx-bg-surface); border-bottom: 1px solid var(--sx-border);
  }
  .tool-btn {
    width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center;
    border: 1px solid transparent; border-radius: 5px; background: transparent; color: var(--sx-text-secondary); flex: none;
  }
  .tool-btn:hover { background: var(--sx-bg-hover); }
  .tool-select {
    display: inline-flex; align-items: center; gap: 6px; height: 27px; padding: 0 9px;
    border: 1px solid var(--sx-border-input); border-radius: 5px; background: var(--sx-bg-surface);
    font-size: 12px; color: var(--sx-text-secondary); white-space: nowrap; flex: none;
  }
  .tool-select .caret { color: var(--sx-text-hint); display: inline-flex; }
  .tool-action {
    display: inline-flex; align-items: center; gap: 5px; height: 28px; padding: 0 9px;
    border: none; border-radius: 5px; background: transparent; color: var(--sx-text-secondary); font-size: 12px; flex: none;
  }
  .tool-action:hover { background: var(--sx-bg-hover); }
  .tool-action.active { background: var(--sx-brand-soft); color: var(--sx-brand); }
  .mode-badge {
    margin-left: auto; display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 10px; border: 1px solid #bfe6d0; border-radius: 14px;
    background: #e9f7ef; color: #1e7a4d; font-size: 11px; white-space: nowrap;
  }
  .mode-badge .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--sx-success); }

  /* 公式栏 */
  .formula-bar {
    display: flex; align-items: center; padding: 0 10px;
    background: var(--sx-bg-surface); border-bottom: 1px solid var(--sx-border); gap: 0;
  }
  .cell-address {
    display: inline-flex; align-items: center; justify-content: space-between;
    width: 68px; height: 22px; padding: 0 8px; border: 1px solid var(--sx-border-input);
    border-radius: 4px 0 0 4px; font-size: 12px; font-weight: 500; flex: none;
  }
  .cell-address .caret { color: var(--sx-text-hint); display: inline-flex; }
  .fx-box {
    width: 30px; height: 22px; display: inline-flex; align-items: center; justify-content: center;
    border: 1px solid var(--sx-border-input); border-left: none; border-right: none;
    color: var(--sx-text-secondary); font-style: italic; font-family: Georgia, serif; flex: none;
  }
  .formula-input {
    flex: 1; height: 22px; padding: 0 10px; border: 1px solid var(--sx-border-input);
    border-radius: 0 4px 4px 0; background: var(--sx-bg-surface); color: var(--sx-text-primary);
    font-size: 12px; outline: none;
  }

  /* 主区 */
  .body { display: flex; min-height: 0; }
  .grid-area { flex: 1; min-width: 0; overflow: auto; background: var(--sx-bg-surface); }

  .grid-table { border-collapse: separate; border-spacing: 0; table-layout: fixed; width: 100%; font-size: 12px; }
  .grid-table th, .grid-table td {
    height: 30px; border-right: 1px solid var(--sx-grid-line); border-bottom: 1px solid var(--sx-grid-line);
    padding: 0 10px; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .grid-table thead th {
    background: var(--sx-bg-subtle); color: var(--sx-text-hint); font-weight: 400;
    text-align: center; width: 28px; position: sticky; top: 0; z-index: 2;
  }
  .grid-table tbody th.row-h {
    background: var(--sx-bg-subtle); color: var(--sx-text-hint); font-weight: 400;
    text-align: center; width: 28px; position: sticky; left: 0; z-index: 1;
  }
  .grid-table tbody th.row-h.hl { background: var(--sx-bg-active); color: var(--sx-brand); }
  .grid-table td { color: var(--sx-text-primary); background: var(--sx-bg-surface); }
  .grid-table td.center { text-align: center; }
  .grid-table td.right { text-align: right; font-variant-numeric: tabular-nums; }
  .grid-table tr.row-active td { background: var(--sx-row-selected-bg); }
  .grid-table td.selected {
    outline: 2px solid var(--sx-cell-selected); outline-offset: -2px;
    background: var(--sx-bg-surface); z-index: 3; position: relative;
  }
  .head-inner { display: flex; align-items: center; gap: 6px; }
  .head-inner .filter-icon { color: var(--sx-text-hint); display: inline-flex; margin-left: auto; }
  .cat-tag { display: inline-flex; padding: 2px 8px; border-radius: 4px; font-size: 11px; }
  .edit-cell {
    display: inline-flex; align-items: center; justify-content: space-between; gap: 6px;
    width: 100%; height: 24px; border: 1px solid var(--sx-brand); border-radius: 3px; padding: 0 6px;
  }
  .edit-cell .caret { color: var(--sx-text-hint); display: inline-flex; }

  /* 性能监控面板 */
  .perf-panel {
    width: 256px; flex: none; background: var(--sx-bg-surface);
    border-left: 1px solid var(--sx-border); overflow-y: auto;
  }
  .perf-head {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 13px 8px; font-size: 13px; font-weight: 600;
  }
  .perf-tabs { display: flex; gap: 14px; padding: 0 13px; border-bottom: 1px solid var(--sx-border); }
  .perf-tab {
    position: relative; padding: 7px 0 9px; border: none; background: transparent;
    color: var(--sx-text-secondary); font-size: 12px;
  }
  .perf-tab.active { color: var(--sx-brand); font-weight: 500; }
  .perf-tab.active::after {
    content: ''; position: absolute; left: 0; right: 0; bottom: -1px; height: 2px;
    background: var(--sx-brand); border-radius: 2px 2px 0 0;
  }
  .perf-body { padding: 12px 13px; display: flex; flex-direction: column; gap: 12px; }
  .metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .metric {
    border: 1px solid var(--sx-border); border-radius: 8px; padding: 10px;
    display: flex; flex-direction: column; gap: 6px;
  }
  .metric .micon { display: inline-flex; }
  .metric .micon.green { color: var(--sx-success); }
  .metric .micon.purple { color: #8b5cf6; }
  .metric .mvalue { font-size: 18px; font-weight: 600; color: var(--sx-text-primary); line-height: 1; }
  .metric .mlabel { font-size: 10px; color: var(--sx-text-hint); }
  .chart-title { display: flex; align-items: center; justify-content: space-between; font-size: 12px; font-weight: 500; }
  .chart-title .range {
    display: inline-flex; align-items: center; gap: 4px; padding: 3px 7px;
    border: 1px solid var(--sx-border-input); border-radius: 4px; font-size: 10px;
    color: var(--sx-text-secondary); font-weight: 400;
  }
  .chart-box {
    border: 1px solid var(--sx-border); border-radius: 8px; padding: 8px 6px 4px;
    background: var(--sx-bg-surface);
  }
  .status-list { display: flex; flex-direction: column; gap: 8px; }
  .status-item { display: flex; align-items: center; gap: 7px; font-size: 11px; color: var(--sx-text-secondary); }
  .status-item .check { color: var(--sx-success); display: inline-flex; }
  .status-item .ok { color: var(--sx-text-hint); }
  .tip-box {
    display: flex; gap: 8px; padding: 10px; border-radius: 8px;
    background: var(--sx-brand-soft); border: 1px solid #d5e4ff;
  }
  .tip-box .bulb { color: var(--sx-brand); flex: none; display: inline-flex; margin-top: 1px; }
  .tip-box .tip-title { font-size: 11px; font-weight: 500; color: var(--sx-brand); display: flex; align-items: center; gap: 5px; }
  .tip-box .tip-desc { font-size: 10px; color: var(--sx-text-secondary); line-height: 1.5; margin-top: 3px; }

  /* 工作表 */
  .sheet-tabs {
    display: flex; align-items: center; gap: 2px; background: var(--sx-bg-surface);
    border-top: 1px solid var(--sx-border); padding: 0 12px;
  }
  .tab-add { width: 26px; height: 26px; display: inline-flex; align-items: center; justify-content: center; border: none; background: transparent; color: var(--sx-text-secondary); }
  .sheet-tab { position: relative; height: 100%; padding: 0 13px; border: none; background: transparent; color: var(--sx-text-secondary); font-size: 12px; }
  .sheet-tab.active { color: var(--sx-brand); font-weight: 500; }
  .sheet-tab.active::after { content: ''; position: absolute; left: 10px; right: 10px; bottom: 0; height: 2px; background: var(--sx-brand); border-radius: 2px 2px 0 0; }

  /* 状态栏 */
  .statusbar {
    display: flex; align-items: center; gap: 14px; background: var(--sx-bg-surface);
    border-top: 1px solid var(--sx-border); padding: 0 12px; font-size: 11px; color: var(--sx-text-secondary);
  }
  .status-ready { display: flex; align-items: center; gap: 6px; }
  .status-ready .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--sx-success); }
  .status-stats { display: flex; gap: 16px; }
  .status-right { margin-left: auto; display: flex; align-items: center; gap: 10px; }
  .status-right .tool-btn { width: 22px; height: 22px; }
  .status-right .tool-btn.active { color: var(--sx-brand); }
  .zoom input[type='range'] { width: 64px; accent-color: var(--sx-brand); }
`
