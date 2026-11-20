/**
 * SheetX 样式（第 06 张设计稿 · 公式编辑与函数助手）
 * 复用第 01 张的骨架类名与令牌，新增公式编辑态 / 函数补全 / 函数助手样式。
 */
import { css } from 'lit'

export const formulaStyles = css`
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
    width: 240px;
    height: 28px;
    padding: 0 10px;
    margin-right: 8px;
    background: var(--sx-bg-subtle);
    border: 1px solid var(--sx-border);
    border-radius: 6px;
    color: var(--sx-text-hint);
    font-size: 12px;
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
    font-size: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
  }

  /* ============ 函数分类工具栏 ============ */
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
    width: 28px;
    height: 28px;
    border: 1px solid transparent;
    border-radius: 5px;
    background: transparent;
    color: var(--sx-text-secondary);
    flex: none;
  }
  .tool-btn:hover { background: var(--sx-bg-hover); }
  .tool-btn .caret { color: var(--sx-text-hint); display: inline-flex; margin-left: -2px; }
  .tool-cat {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 28px;
    padding: 0 9px;
    border: 1px solid transparent;
    border-radius: 5px;
    background: transparent;
    color: var(--sx-text-primary);
    font-size: 12px;
    white-space: nowrap;
    flex: none;
  }
  .tool-cat:hover { background: var(--sx-bg-hover); }
  .tool-cat.bordered { border-color: var(--sx-border-input); }
  .tool-cat .caret { color: var(--sx-text-hint); display: inline-flex; }
  .tool-cat .cat-icon { color: var(--sx-text-secondary); display: inline-flex; }

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
    font-family: 'Segoe UI', 'PingFang SC', system-ui, sans-serif;
  }
  .formula-input .seg-ref { color: var(--sx-brand); }
  .formula-input .seg-criteria { color: #0f9d8f; }
  .formula-input .seg-fn { font-weight: 500; }

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
  /* 表格（列宽总和 40+108+100+96+88+116+170 = 718，固定宽度保证编辑框/补全下拉对齐列边界） */
  .sheet {
    border-collapse: separate;
    border-spacing: 0;
    table-layout: fixed;
    font-size: 12px;
    width: 718px;
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
  .sheet thead th.corner { width: 40px; border-left: 1px solid var(--sx-grid-line); }
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
  .sheet tbody tr:hover td { background: var(--sx-bg-hover); }
  .sheet td.cell {
    background: var(--sx-bg-surface);
    padding: 0 10px;
    white-space: nowrap;
    text-overflow: ellipsis;
    color: var(--sx-text-primary);
  }
  .sheet td.cell.num { color: var(--sx-text-primary); }
  .sheet td.head-cell {
    background: var(--sx-grid-header-bg);
    color: var(--sx-grid-header-text);
    font-weight: 500;
  }
  /* E 列辅助列表头：浅蓝高亮 */
  .sheet td.head-cell.hl { background: var(--sx-bg-active); color: var(--sx-brand); }
  /* F 列公式列表头：品牌蓝底白字 */
  .sheet td.head-cell.accent {
    background: var(--sx-brand);
    color: #ffffff;
    font-weight: 500;
  }
  .sheet tbody tr.row-active th.row-head,
  .sheet tbody tr.row-active td { background: var(--sx-row-selected-bg); }
  .sheet td.selected {
    outline: 1.5px solid var(--sx-cell-selected);
    outline-offset: -1.5px;
  }

  /* E2 辅助下拉（迷你选择框） */
  .mini-select {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-width: 78px;
    height: 24px;
    padding: 0 8px;
    border: 1px solid var(--sx-border-strong);
    border-radius: 4px;
    background: var(--sx-bg-surface);
    font-size: 12px;
    color: var(--sx-text-primary);
    vertical-align: middle;
  }
  .mini-select .caret { color: var(--sx-text-hint); display: inline-flex; }

  /* F2 公式编辑态：白色编辑框越出列宽，蓝色描边 */
  .sheet td.editing {
    position: relative;
    overflow: visible;
    z-index: 4;
  }
  .edit-box {
    position: absolute;
    left: -1px;
    top: -1px;
    bottom: -1px;
    width: 242px;
    display: flex;
    align-items: center;
    padding: 0 9px;
    background: var(--sx-bg-surface);
    border: 2px solid var(--sx-brand);
    border-radius: 4px;
    color: #1d4ed8;
    font-size: 11px;
    white-space: nowrap;
    overflow: hidden;
    pointer-events: none;
  }
  [data-theme='dark'] .edit-box { color: var(--sx-brand); }

  /* 函数自动补全下拉 */
  .fn-dropdown {
    position: absolute;
    left: 548px;
    top: 92px;
    width: 242px;
    background: var(--sx-bg-surface);
    border: 1px solid var(--sx-border-strong);
    border-radius: 8px;
    z-index: 20;
    overflow: hidden;
  }
  .fn-row {
    display: flex;
    align-items: center;
    gap: 9px;
    height: 32px;
    padding: 0 12px;
    border-bottom: 1px solid var(--sx-grid-line);
    cursor: pointer;
    background: var(--sx-bg-surface);
  }
  .fn-row:last-of-type { border-bottom: none; }
  .fn-row:hover { background: var(--sx-bg-hover); }
  .fn-row .fx { color: var(--sx-text-hint); font-style: italic; font-family: Georgia, serif; font-size: 13px; width: 16px; text-align: center; flex: none; }
  .fn-row .name { font-weight: 600; font-size: 12.5px; color: var(--sx-text-primary); flex: none; }
  .fn-row .desc { margin-left: auto; font-size: 11px; color: var(--sx-text-hint); white-space: nowrap; }
  .fn-row.active { background: var(--sx-brand-soft); }
  .fn-row.active .fx, .fn-row.active .name { color: var(--sx-brand); }
  .fn-more {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 3px;
    height: 30px;
    background: var(--sx-bg-subtle);
    border-top: 1px solid var(--sx-grid-line);
    color: var(--sx-text-secondary);
    font-size: 11.5px;
    cursor: pointer;
  }
  .fn-more:hover { color: var(--sx-brand); }

  /* ============ 底部卡片 ============ */
  .cards-row {
    display: flex;
    align-items: stretch;
    gap: 16px;
    padding: 14px 16px 18px;
  }
  .card {
    background: var(--sx-bg-surface);
    border: 1px solid var(--sx-border);
    border-radius: 8px;
    overflow: hidden;
  }
  .card.summary { width: 252px; flex: none; }
  .card.trend { flex: 1; min-width: 0; padding: 12px 14px; }
  .summary-head {
    display: flex;
    align-items: center;
    height: 32px;
    background: var(--sx-brand);
    color: #ffffff;
    font-size: 12px;
    font-weight: 500;
  }
  .summary-head .c1 { flex: 1; padding-left: 14px; }
  .summary-head .c2 { width: 96px; text-align: center; }
  .summary-row {
    display: flex;
    align-items: center;
    height: 32px;
    border-top: 1px solid var(--sx-grid-line);
    font-size: 12px;
  }
  .summary-row .c1 { flex: 1; padding-left: 14px; color: var(--sx-text-primary); }
  .summary-row .c2 { width: 96px; text-align: center; color: var(--sx-text-primary); }
  .summary-row.hl { background: var(--sx-brand-soft); }
  .summary-row.hl .c1, .summary-row.hl .c2 { color: var(--sx-brand); font-weight: 500; }

  .trend-title { font-size: 13px; font-weight: 600; color: var(--sx-text-primary); }
  .trend-legend {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-top: 8px;
  }
  .trend-legend .item { display: flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--sx-text-secondary); }
  .trend-legend .dot { width: 8px; height: 8px; border-radius: 50%; flex: none; }
  .trend-chart { margin-top: 4px; }

  /* ============ 右侧函数助手 ============ */
  .assistant {
    width: 236px;
    flex: none;
    background: var(--sx-bg-surface);
    border-left: 1px solid var(--sx-border);
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }
  .assistant-head {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 14px 6px;
  }
  .assistant-head .fx-badge {
    width: 24px;
    height: 24px;
    border-radius: 6px;
    background: var(--sx-brand-soft);
    color: var(--sx-brand);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-style: italic;
    font-family: Georgia, serif;
    font-size: 13px;
    font-weight: 600;
    flex: none;
  }
  .assistant-head .title { font-size: 13.5px; font-weight: 600; color: var(--sx-text-primary); }
  .assistant-head .icon-btn { margin-left: auto; width: 26px; height: 26px; }
  .assistant-tabs {
    display: flex;
    gap: 16px;
    padding: 2px 14px 0;
    border-bottom: 1px solid var(--sx-border);
  }
  .assistant-tab {
    position: relative;
    padding: 7px 0 9px;
    border: none;
    background: transparent;
    color: var(--sx-text-secondary);
    font-size: 12px;
    white-space: nowrap;
  }
  .assistant-tab.active { color: var(--sx-brand); font-weight: 500; }
  .assistant-tab.active::after {
    content: '';
    position: absolute;
    left: 0; right: 0; bottom: -1px;
    height: 2px;
    background: var(--sx-brand);
    border-radius: 2px 2px 0 0;
  }
  .assistant-body { padding: 12px 14px 16px; display: flex; flex-direction: column; gap: 10px; }
  .doc-search {
    display: flex;
    align-items: center;
    gap: 7px;
    height: 30px;
    padding: 0 10px;
    border: 1px solid var(--sx-border-input);
    border-radius: 6px;
    background: var(--sx-bg-surface);
    color: var(--sx-text-primary);
    font-size: 12px;
  }
  .doc-search input {
    flex: 1;
    min-width: 0;
    border: none;
    outline: none;
    background: transparent;
    color: var(--sx-text-primary);
    font-size: 12px;
  }
  .doc-search .clear { display: inline-flex; border: none; background: transparent; color: var(--sx-text-hint); padding: 2px; border-radius: 4px; }
  .doc-search .clear:hover { color: var(--sx-text-primary); background: var(--sx-bg-hover); }
  .doc-name { font-size: 19px; font-weight: 700; color: var(--sx-text-primary); line-height: 1.2; }
  .doc-desc { font-size: 12px; color: var(--sx-text-secondary); margin-top: -6px; }
  .doc-syntax {
    background: var(--sx-brand-soft);
    color: var(--sx-brand);
    font-family: 'SF Mono', Menlo, Consolas, monospace;
    font-size: 11px;
    border-radius: 6px;
    padding: 8px 10px;
    white-space: normal;
    word-break: break-all;
    line-height: 1.55;
  }
  .doc-section { font-size: 13px; font-weight: 600; color: var(--sx-text-primary); }
  .param-row {
    display: flex;
    align-items: center;
    gap: 9px;
    font-size: 12px;
  }
  .param-pill {
    display: inline-block;
    padding: 2px 7px;
    border-radius: 4px;
    font-family: 'SF Mono', Menlo, Consolas, monospace;
    font-size: 11px;
    font-weight: 500;
    flex: none;
  }
  .param-row .pdesc { color: var(--sx-text-secondary); }
  .example-card {
    background: var(--sx-brand-soft);
    border-radius: 6px;
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .example-card .code {
    color: var(--sx-brand);
    font-family: 'SF Mono', Menlo, Consolas, monospace;
    font-size: 11px;
    white-space: normal;
    word-break: break-all;
    line-height: 1.55;
  }
  .example-card .note { font-size: 11px; color: var(--sx-text-secondary); }
  .doc-list { display: flex; flex-direction: column; gap: 2px; }
  .doc-list-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 30px;
    padding: 0 8px;
    border-radius: 5px;
    font-size: 12px;
    color: var(--sx-text-primary);
    cursor: pointer;
  }
  .doc-list-row:hover { background: var(--sx-bg-hover); }
  .doc-list-row .count { color: var(--sx-text-hint); font-size: 11px; }

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
  .status-count { margin-left: 16px; }
  .status-count strong { color: var(--sx-text-primary); font-weight: 500; }
  .status-stats { margin-left: auto; display: flex; gap: 20px; }
  .status-view { display: flex; align-items: center; gap: 2px; margin-left: 20px; }
  .status-view .tool-btn { width: 24px; height: 24px; }
  .status-view .tool-btn.active { color: var(--sx-brand); }
  .zoom { display: flex; align-items: center; gap: 6px; margin-left: 14px; }
  .zoom input[type='range'] { width: 64px; accent-color: var(--sx-brand); }
  .zoom-value { min-width: 34px; text-align: right; }
`
