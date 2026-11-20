/**
 * SheetX Grid 业务数据网格界面样式（第 02 张设计稿）
 */
import { css } from 'lit'

export const gridStyles = css`
  :host {
    display: block;
    width: 100%;
    height: 100%;
    background: var(--sx-bg-app);
    overflow: hidden;
  }

  .layout {
    display: grid;
    grid-template-columns: 148px 1fr;
    height: 100%;
    min-width: 1080px;
  }

  /* ============ 左侧导航 ============ */
  .sidebar {
    background: var(--sx-bg-surface);
    border-right: 1px solid var(--sx-border);
    display: flex;
    flex-direction: column;
    padding-top: 2px;
  }
  .sidebar-brand {
    height: 52px;
    display: flex;
    align-items: center;
    padding: 0 16px;
    border-bottom: 1px solid var(--sx-border);
  }
  .side-nav {
    padding: 10px 8px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .side-item {
    display: flex;
    align-items: center;
    gap: 9px;
    height: 34px;
    padding: 0 11px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--sx-text-secondary);
    font-size: 12px;
    text-align: left;
    white-space: nowrap;
  }
  .side-item:hover { background: var(--sx-bg-hover); }
  .side-item.active {
    background: var(--sx-brand-soft);
    color: var(--sx-brand);
    font-weight: 500;
  }

  /* ============ 主区 ============ */
  .main {
    display: grid;
    grid-template-rows: 52px 50px 1fr 32px;
    min-width: 0;
    min-height: 0;
  }
  .topbar {
    display: flex;
    align-items: center;
    background: var(--sx-bg-surface);
    border-bottom: 1px solid var(--sx-border);
    padding: 0 20px;
  }
  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--sx-text-hint);
  }
  .breadcrumb strong { color: var(--sx-text-primary); font-weight: 500; }
  .topbar-right { margin-left: auto; display: flex; align-items: center; gap: 14px; }
  .search-box {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 232px;
    height: 30px;
    padding: 0 11px;
    background: var(--sx-bg-subtle);
    border: 1px solid var(--sx-border);
    border-radius: 6px;
    color: var(--sx-text-hint);
    font-size: 12px;
  }
  .bell { position: relative; display: inline-flex; }
  .bell .dot {
    position: absolute;
    top: -3px;
    right: -4px;
    min-width: 15px;
    height: 15px;
    padding: 0 3px;
    border-radius: 8px;
    background: var(--sx-danger);
    color: #fff;
    font-size: 10px;
    line-height: 15px;
    text-align: center;
  }
  .avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #0f9b96;
    color: #fff;
    font-size: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  /* ============ 工具栏 ============ */
  .toolbar {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 0 18px;
    background: var(--sx-bg-surface);
    border-bottom: 1px solid var(--sx-border);
  }
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 29px;
    padding: 0 10px;
    border: 1px solid var(--sx-border-input);
    border-radius: 5px;
    background: var(--sx-bg-surface);
    color: var(--sx-text-secondary);
    font-size: 12px;
    white-space: nowrap;
  }
  .btn:hover { background: var(--sx-bg-hover); }
  .btn.primary {
    background: var(--sx-brand);
    border-color: var(--sx-brand);
    color: #fff;
    padding-right: 6px;
  }
  .btn.primary .divider { width: 1px; height: 14px; background: rgba(255,255,255,.45); margin: 0 6px 0 3px; }
  .btn.active { border-color: var(--sx-brand); color: var(--sx-brand); }

  /* ============ 数据区 ============ */
  .table-wrap {
    overflow: auto;
    background: var(--sx-bg-surface);
    margin: 0;
    position: relative;
  }
  .grid-table {
    border-collapse: separate;
    border-spacing: 0;
    table-layout: fixed;
    width: 100%;
    font-size: 12px;
  }
  .grid-table th, .grid-table td {
    height: 38px;
    border-right: 1px solid var(--sx-grid-line);
    border-bottom: 1px solid var(--sx-grid-line);
    padding: 0 10px;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .grid-table thead th {
    background: var(--sx-bg-subtle);
    color: var(--sx-text-secondary);
    font-weight: 500;
    position: sticky;
    top: 0;
    z-index: 2;
  }
  .grid-table thead th .th-inner {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .grid-table thead th .filter-icon { color: var(--sx-text-hint); display: inline-flex; margin-left: auto; }
  .grid-table td { color: var(--sx-text-primary); }
  .grid-table tbody tr:hover td { background: var(--sx-bg-hover); }
  .grid-table tbody tr.row-selected td { background: var(--sx-bg-active); }
  .grid-table td.center, .grid-table th.center { text-align: center; }
  .grid-table td.num { font-variant-numeric: tabular-nums; }

  .check { display: inline-flex; color: var(--sx-text-hint); cursor: pointer; }
  .check.checked { color: var(--sx-brand); }

  .tag {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    line-height: 16px;
  }
  .status {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
  }
  .status .sdot { width: 6px; height: 6px; border-radius: 50%; }
  .status.ok { color: var(--sx-success); }
  .status.ok .sdot { background: var(--sx-success); }
  .status.warn { color: #e08a1e; }
  .status.warn .sdot { background: #e08a1e; }

  .cell-selected {
    outline: 2px solid var(--sx-cell-selected);
    outline-offset: -2px;
    background: var(--sx-bg-surface) !important;
  }
  .num-stepper { display: flex; align-items: center; justify-content: space-between; gap: 4px; }
  .num-stepper .stepper { display: inline-flex; flex-direction: column; color: var(--sx-text-hint); line-height: 0; }
  .op-links { display: flex; gap: 10px; }
  .op-links button {
    border: none;
    background: transparent;
    color: var(--sx-brand);
    font-size: 12px;
    padding: 0;
  }
  .op-links button:hover { text-decoration: underline; }

  /* 批量修改浮层 */
  .batch-popover {
    position: absolute;
    left: 18px;
    bottom: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 14px;
    background: var(--sx-bg-surface);
    border: 1px solid var(--sx-border);
    border-radius: 8px;
    box-shadow: 0 4px 14px rgba(0,0,0,.08);
    z-index: 6;
    font-size: 12px;
  }
  .batch-title { display: flex; align-items: center; gap: 6px; color: var(--sx-text-primary); }
  .batch-title .muted { color: var(--sx-text-hint); }
  .batch-field { display: flex; align-items: center; gap: 6px; color: var(--sx-text-secondary); }
  .batch-select {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    min-width: 96px;
    height: 28px;
    padding: 0 8px;
    border: 1px solid var(--sx-border-input);
    border-radius: 5px;
    color: var(--sx-text-primary);
  }
  .batch-select .caret { color: var(--sx-text-hint); display: inline-flex; }
  .btn-primary-sm {
    height: 28px;
    padding: 0 14px;
    border: none;
    border-radius: 5px;
    background: var(--sx-brand);
    color: #fff;
    font-size: 12px;
  }
  .btn-text-sm { border: none; background: transparent; color: var(--sx-text-secondary); font-size: 12px; }

  /* ============ 底部 ============ */
  .footer {
    display: flex;
    align-items: center;
    background: var(--sx-bg-surface);
    border-top: 1px solid var(--sx-border);
    padding: 0 18px;
    font-size: 12px;
    color: var(--sx-text-secondary);
  }
  .footer .muted { color: var(--sx-text-hint); }
  .pager { margin-left: auto; display: flex; align-items: center; gap: 6px; }
  .page-btn {
    min-width: 26px;
    height: 24px;
    padding: 0 6px;
    border: 1px solid var(--sx-border-input);
    border-radius: 4px;
    background: var(--sx-bg-surface);
    color: var(--sx-text-secondary);
    font-size: 12px;
  }
  .page-btn.current { background: var(--sx-brand); border-color: var(--sx-brand); color: #fff; }
  .page-nav { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border: none; background: transparent; color: var(--sx-text-secondary); }
`
