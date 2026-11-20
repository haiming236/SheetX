/**
 * SheetX Spreadsheet 完整模式界面样式（第 03 张设计稿）
 */
import { css } from 'lit'

export const fullStyles = css`
  :host {
    display: block;
    width: 100%;
    height: 100%;
    background: var(--sx-bg-app);
    overflow: hidden;
  }

  .app {
    display: grid;
    grid-template-rows: 42px 44px 30px 1fr 30px 28px;
    height: 100%;
    min-width: 1040px;
  }

  /* 顶部导航 */
  .topbar {
    display: flex;
    align-items: center;
    background: var(--sx-bg-surface);
    border-bottom: 1px solid var(--sx-border);
    padding: 0 16px;
    gap: 20px;
  }
  .file-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 28px;
    padding: 0 9px;
    border: none;
    background: transparent;
    color: var(--sx-text-secondary);
    font-size: 12px;
  }
  .nav { display: flex; gap: 1px; height: 100%; align-items: stretch; }
  .nav-item {
    position: relative;
    padding: 0 12px;
    border: none;
    background: transparent;
    color: var(--sx-text-secondary);
    font-size: 13px;
  }
  .nav-item.active { color: var(--sx-brand); font-weight: 500; }
  .nav-item.active::after {
    content: ''; position: absolute; left: 10px; right: 10px; bottom: 0;
    height: 2px; background: var(--sx-brand); border-radius: 2px 2px 0 0;
  }
  .topbar-right { margin-left: auto; display: flex; align-items: center; gap: 10px; }
  .search-box {
    display: flex; align-items: center; gap: 7px;
    width: 240px; height: 27px; padding: 0 10px;
    background: var(--sx-bg-subtle); border: 1px solid var(--sx-border);
    border-radius: 6px; color: var(--sx-text-hint); font-size: 11px;
  }
  .icon-btn {
    width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center;
    border: none; border-radius: 6px; background: transparent; color: var(--sx-text-secondary);
  }
  .icon-btn:hover { background: var(--sx-bg-hover); }
  .avatar {
    width: 27px; height: 27px; border-radius: 50%; background: var(--sx-brand);
    color: #fff; font-size: 12px; display: inline-flex; align-items: center; justify-content: center;
  }

  /* 工具栏 */
  .toolbar {
    display: flex; align-items: center; gap: 3px;
    padding: 0 14px; background: var(--sx-bg-surface);
    border-bottom: 1px solid var(--sx-border); overflow: hidden;
  }
  .tool-btn {
    width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center;
    border: 1px solid transparent; border-radius: 5px; background: transparent; color: var(--sx-text-secondary);
    flex: none;
  }
  .tool-btn:hover { background: var(--sx-bg-hover); }
  .tool-btn.active { background: var(--sx-bg-active); color: var(--sx-brand); }
  .tool-btn.fcolor { color: var(--sx-danger); }
  .tool-select {
    display: inline-flex; align-items: center; justify-content: space-between; gap: 6px;
    height: 26px; padding: 0 7px; border: 1px solid var(--sx-border-input);
    border-radius: 5px; background: var(--sx-bg-surface); font-size: 12px;
    white-space: nowrap; flex: none;
  }
  .tool-select.font { width: 84px; }
  .tool-select.size { width: 46px; }
  .tool-select.format { width: 62px; }
  .tool-select .caret { color: var(--sx-text-hint); display: inline-flex; }
  .tool-action {
    display: inline-flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 1px; min-width: 48px; height: 34px; padding: 0 4px; border: none; border-radius: 5px;
    background: transparent; color: var(--sx-text-secondary); font-size: 10px; white-space: nowrap; flex: none;
  }
  .tool-action:hover { background: var(--sx-bg-hover); }
  .sep { width: 1px; height: 20px; background: var(--sx-border); margin: 0 4px; flex: none; }

  /* 公式栏 */
  .formula-bar {
    display: flex; align-items: center; padding: 0 10px;
    background: var(--sx-bg-surface); border-bottom: 1px solid var(--sx-border); gap: 0;
  }
  .cell-address {
    display: inline-flex; align-items: center; justify-content: space-between;
    width: 76px; height: 22px; padding: 0 8px; border: 1px solid var(--sx-border-input);
    border-radius: 4px 0 0 4px; font-size: 12px; font-weight: 500; flex: none;
  }
  .cell-address .caret { color: var(--sx-text-hint); display: inline-flex; }
  .fx-box {
    width: 32px; height: 22px; display: inline-flex; align-items: center; justify-content: center;
    border: 1px solid var(--sx-border-input); border-left: none; border-right: none;
    color: var(--sx-text-secondary); font-style: italic; font-family: Georgia, serif; flex: none;
  }
  .formula-input {
    flex: 1; height: 22px; padding: 0 10px; border: 1px solid var(--sx-border-input);
    border-radius: 0 4px 4px 0; background: var(--sx-bg-surface); color: var(--sx-text-primary);
    font-size: 12px; font-family: var(--font-mono, monospace); outline: none;
  }

  /* 主体 */
  .body { display: flex; min-height: 0; }
  .content { flex: 1; min-width: 0; display: flex; flex-direction: column; overflow: auto; background: var(--sx-bg-surface); }

  /* 表格 */
  .sheet { border-collapse: separate; border-spacing: 0; table-layout: fixed; width: 100%; font-size: 12px; }
  .sheet th, .sheet td {
    border-right: 1px solid var(--sx-grid-line); border-bottom: 1px solid var(--sx-grid-line);
    padding: 0; height: 30px; overflow: hidden;
  }
  .sheet thead th {
    width: 26px; background: var(--sx-bg-subtle); color: var(--sx-text-hint);
    font-weight: 400; text-align: center; border-top: 1px solid var(--sx-grid-line);
    position: sticky; top: 0; z-index: 2;
  }
  .sheet thead th.col-h { width: auto; }
  .sheet tbody th.row-h {
    background: var(--sx-bg-subtle); color: var(--sx-text-hint); font-weight: 400;
    text-align: center; width: 26px; position: sticky; left: 0; z-index: 1;
  }
  .sheet td { padding: 0 9px; white-space: nowrap; text-overflow: ellipsis; color: var(--sx-text-primary); background: var(--sx-bg-surface); }
  .sheet td.title-bar {
    background: var(--sx-brand); color: #fff; font-weight: 500; font-size: 14px;
    padding-left: 14px; white-space: nowrap;
  }
  .sheet td.title-bar .date { float: right; font-size: 11px; font-weight: 400; opacity: .9; padding-right: 8px; }
  .sheet td.hdr {
    background: var(--sx-grid-header-bg); color: var(--sx-grid-header-text); font-weight: 500; text-align: center;
  }
  .sheet td.subhdr { background: var(--sx-bg-subtle); color: var(--sx-text-secondary); text-align: center; font-weight: 500; }
  .sheet td.center { text-align: center; }
  .sheet td.right { text-align: right; font-variant-numeric: tabular-nums; }
  .sheet td.selected { outline: 2px solid var(--sx-cell-selected); outline-offset: -2px; background: var(--sx-bg-surface); z-index: 3; }
  .sheet td.total { background: #e6f4ea; color: #1e7a4d; font-weight: 600; text-align: center; }
  .sheet td.total.right { text-align: right; }
  .spark { display: inline-flex; align-items: center; height: 20px; width: 100%; }

  /* 图表区 */
  .charts { display: flex; gap: 12px; padding: 12px 14px; align-items: stretch; }
  .card {
    background: var(--sx-bg-surface); border: 1px solid var(--sx-border);
    border-radius: 8px; padding: 10px 12px;
  }
  .card h4 { margin: 0 0 8px; font-size: 12px; font-weight: 500; color: var(--sx-text-primary); }
  .pie-card { flex: 0 0 250px; }
  .pie-row { display: flex; align-items: center; gap: 12px; }
  .pie-legend { display: flex; flex-direction: column; gap: 6px; font-size: 11px; color: var(--sx-text-secondary); }
  .pie-legend .li { display: flex; align-items: center; gap: 6px; }
  .pie-legend .dot { width: 8px; height: 8px; border-radius: 2px; flex: none; }
  .pie-center { font-size: 11px; fill: var(--sx-text-secondary); }
  .trend-card { flex: 1; min-width: 260px; }
  .kpi-cards { flex: 0 0 168px; display: flex; flex-direction: column; gap: 10px; }
  .kpi {
    flex: 1; display: flex; align-items: center; gap: 9px;
    border: 1px solid var(--sx-border); border-radius: 8px; padding: 9px 11px;
  }
  .kpi .kicon { width: 30px; height: 30px; border-radius: 7px; display: inline-flex; align-items: center; justify-content: center; flex: none; }
  .kpi .kicon.blue { background: #e8f1ff; color: var(--sx-brand); }
  .kpi .kicon.purple { background: #f2e9ff; color: #8b5cf6; }
  .kpi .klabel { font-size: 10px; color: var(--sx-text-hint); }
  .kpi .kvalue { font-size: 15px; font-weight: 600; color: var(--sx-text-primary); }
  .kpi .kdelta { font-size: 10px; color: var(--sx-success); }

  /* 右侧面板 */
  .inspector {
    width: 200px; flex: none; background: var(--sx-bg-surface);
    border-left: 1px solid var(--sx-border); display: flex; flex-direction: column; overflow-y: auto;
  }
  .inspector-head {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 12px 8px; font-size: 13px; font-weight: 500;
  }
  .inspector-tabs { display: flex; justify-content: space-between; gap: 4px; padding: 0 12px; border-bottom: 1px solid var(--sx-border); }
  .inspector-tab {
    position: relative; padding: 7px 0 9px; border: none; background: transparent;
    color: var(--sx-text-secondary); font-size: 12px; white-space: nowrap;
  }
  .inspector-tab.active { color: var(--sx-brand); font-weight: 500; }
  .inspector-tab.active::after {
    content: ''; position: absolute; left: 0; right: 0; bottom: -1px; height: 2px;
    background: var(--sx-brand); border-radius: 2px 2px 0 0;
  }
  .inspector-body { padding: 12px; display: flex; flex-direction: column; gap: 10px; }
  .field-label { font-size: 11px; color: var(--sx-text-hint); margin-bottom: 5px; display: block; }
  .field-select {
    display: flex; align-items: center; justify-content: space-between; height: 29px;
    padding: 0 9px; border: 1px solid var(--sx-border-input); border-radius: 5px;
    background: var(--sx-bg-surface); font-size: 12px;
  }
  .field-select .caret { color: var(--sx-text-hint); display: inline-flex; }
  .check-row { display: flex; align-items: center; gap: 7px; font-size: 12px; color: var(--sx-text-secondary); }
  .check-row .check { color: var(--sx-brand); display: inline-flex; }
  .preview-box {
    border: 1px solid var(--sx-border-input); border-radius: 5px; min-height: 40px;
    padding: 9px; font-size: 13px; color: var(--sx-text-primary);
  }

  /* 工作表标签 */
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
    display: flex; align-items: center; background: var(--sx-bg-surface);
    border-top: 1px solid var(--sx-border); padding: 0 12px;
    font-size: 11px; color: var(--sx-text-secondary);
  }
  .status-ready { display: flex; align-items: center; gap: 6px; }
  .status-ready .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--sx-success); }
  .status-stats { margin-left: auto; display: flex; gap: 20px; }
  .status-view { display: flex; gap: 2px; margin-left: 18px; }
  .status-view .tool-btn { width: 22px; height: 22px; }
  .status-view .tool-btn.active { color: var(--sx-brand); }
  .zoom { display: flex; align-items: center; gap: 5px; margin-left: 12px; }
  .zoom input[type='range'] { width: 64px; accent-color: var(--sx-brand); }
`
