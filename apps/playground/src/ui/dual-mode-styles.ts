/**
 * SheetX 第 38 张 · Grid 与 Spreadsheet 双模式对比 — 样式
 * 顶部文档菜单 / 左侧功能导航 / 双栏对比（Grid 业务网格 + Spreadsheet 电子表格）/ 优势卡。
 */
import { css } from 'lit'

export const dualModeStyles = css`
  :host { display: block; }
  .app {
    display: flex; flex-direction: column; min-height: calc(100vh - 42px);
    background: var(--sx-bg-app); color: var(--sx-text-primary);
    font-family: 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
  }

  /* ===== 顶部文档菜单 ===== */
  .menu-bar { height: 46px; flex: 0 0 46px; display: flex; align-items: center; gap: 14px; padding: 0 16px; background: var(--sx-bg-surface); border-bottom: 1px solid var(--sx-border); }
  .brand { display: flex; align-items: center; }
  .menu-items { display: flex; align-items: center; gap: 2px; }
  .menu-item { height: 30px; padding: 0 11px; border: 0; border-radius: 5px; background: transparent; color: var(--sx-text-secondary); font-size: 12px; display: inline-flex; align-items: center; gap: 5px; }
  .menu-item:hover { background: var(--sx-bg-hover); color: var(--sx-text-primary); }
  .menu-item.active { color: var(--sx-brand); font-weight: 600; }
  .menu-item.active::after { content: ''; position: absolute; }
  .search-box { margin-left: auto; display: flex; align-items: center; gap: 6px; height: 30px; padding: 0 10px; border: 1px solid var(--sx-border); border-radius: 6px; color: var(--sx-text-hint); font-size: 11.5px; min-width: 148px; }
  .search-box input { flex: 1; min-width: 0; height: 100%; border: 0; outline: 0; background: transparent; color: var(--sx-text-primary); font: inherit; }
  .icon-btn { width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; border: 0; border-radius: 6px; background: transparent; color: var(--sx-text-secondary); }
  .icon-btn:hover { background: var(--sx-bg-hover); color: var(--sx-brand); }
  .avatar { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--sx-text-secondary); }
  .avatar .face { width: 27px; height: 27px; border-radius: 50%; background: var(--sx-brand); color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; }

  /* ===== 主体三栏 ===== */
  .shell { flex: 1; display: grid; grid-template-columns: 168px minmax(0, 1fr); align-items: start; }
  .sidebar { border-right: 1px solid var(--sx-border); background: var(--sx-bg-surface); padding: 14px 10px; min-height: calc(100vh - 46px); }
  .side-title { font-size: 10.5px; color: var(--sx-text-hint); padding: 4px 8px 8px; font-weight: 600; letter-spacing: .3px; }
  .side-title.spaced { margin-top: 16px; }
  .side-item { width: 100%; height: 32px; display: flex; align-items: center; gap: 8px; padding: 0 9px; margin-bottom: 2px; border: 0; border-radius: 6px; background: transparent; color: var(--sx-text-secondary); font-size: 11.5px; text-align: left; }
  .side-item:hover { background: var(--sx-bg-hover); color: var(--sx-text-primary); }
  .side-item.active { background: var(--sx-brand-soft); color: var(--sx-brand); font-weight: 600; }
  .side-cta { margin-top: 18px; padding: 12px; border-radius: 8px; background: linear-gradient(145deg, var(--sx-brand-soft), transparent); border: 1px solid var(--sx-border); }
  .side-cta .t { font-size: 12px; font-weight: 700; }
  .side-cta .d { font-size: 10px; color: var(--sx-text-hint); margin: 4px 0 9px; line-height: 1.5; }
  .btn-link { height: 26px; padding: 0 10px; border: 0; border-radius: 5px; background: var(--sx-brand); color: #fff; font-size: 10.5px; }

  /* ===== 主区 ===== */
  .main { padding: 16px 18px; min-width: 0; }
  .head { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 14px; }
  .head-icon { width: 34px; height: 34px; border-radius: 8px; background: var(--sx-brand-soft); color: var(--sx-brand); display: inline-flex; align-items: center; justify-content: center; flex: none; }
  .head h1 { margin: 0; font-size: 19px; font-weight: 700; }
  .head p { margin: 4px 0 0; font-size: 11.5px; color: var(--sx-text-secondary); }
  .head-actions { margin-left: auto; display: flex; gap: 7px; flex: none; }
  .btn { height: 30px; padding: 0 12px; border: 1px solid var(--sx-border); border-radius: 6px; background: var(--sx-bg-surface); color: var(--sx-text-secondary); font-size: 11.5px; display: inline-flex; align-items: center; gap: 5px; }
  .btn:hover { border-color: var(--sx-brand); color: var(--sx-brand); }
  .btn.active { background: var(--sx-brand); color: #fff; border-color: var(--sx-brand); font-weight: 600; }

  /* ===== 双栏对比 ===== */
  .compare { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 14px; }
  .compare.single { grid-template-columns: minmax(0, 1fr); max-width: 980px; }
  .pane { min-width: 0; border: 1px solid var(--sx-border); border-radius: 9px; overflow: hidden; background: var(--sx-bg-surface); }

  /* 面板标题条 */
  .pane-head { height: 34px; display: flex; align-items: center; gap: 7px; padding: 0 12px; font-size: 12px; font-weight: 700; }
  .pane-head.grid { background: linear-gradient(90deg, #2563eb, #4f8cff); color: #fff; }
  .pane-head.sheet { background: linear-gradient(90deg, #059669, #34b886); color: #fff; }
  .pane-head .tag { margin-left: auto; font-size: 10px; font-weight: 400; opacity: .92; }

  /* 通用工具条 */
  .toolbar { display: flex; align-items: center; gap: 3px; padding: 6px 8px; border-bottom: 1px solid var(--sx-border); overflow-x: auto; scrollbar-width: none; }
  .toolbar::-webkit-scrollbar { display: none; }
  .tool { height: 24px; min-width: 24px; padding: 0 6px; border: 0; border-radius: 4px; background: transparent; color: var(--sx-text-secondary); display: inline-flex; align-items: center; justify-content: center; gap: 3px; font-size: 10.5px; white-space: nowrap; }
  .tool:hover { background: var(--sx-bg-hover); color: var(--sx-brand); }
  .tool.on { background: var(--sx-brand-soft); color: var(--sx-brand); font-weight: 600; }
  .tool-sep { width: 1px; height: 16px; background: var(--sx-border); margin: 0 4px; flex: none; }
  .mini-sel { height: 24px; border: 1px solid var(--sx-border); border-radius: 4px; background: var(--sx-bg-surface); color: var(--sx-text-secondary); font-size: 10.5px; padding: 0 4px; outline: 0; }

  /* Grid 过滤条 */
  .filter-bar { display: flex; align-items: center; gap: 7px; padding: 7px 9px; border-bottom: 1px solid var(--sx-border); }
  .search-sm { height: 26px; flex: 1; min-width: 0; display: flex; align-items: center; gap: 5px; padding: 0 8px; border: 1px solid var(--sx-border); border-radius: 5px; color: var(--sx-text-hint); font-size: 10.5px; }
  .search-sm input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--sx-text-primary); font: inherit; }

  /* 表格 */
  .tbl-wrap { overflow: auto; }
  table.grid-table, table.sheet-table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
  .grid-table th, .grid-table td, .sheet-table th, .sheet-table td { border-bottom: 1px solid var(--sx-border); border-right: 1px solid var(--sx-border); padding: 6px 8px; text-align: left; white-space: nowrap; }
  .grid-table th, .sheet-table th { background: var(--sx-bg-hover); color: var(--sx-text-secondary); font-weight: 600; font-size: 10px; }
  .grid-table tr.sel td { background: var(--sx-brand-soft); }
  .grid-table tr { cursor: pointer; }
  .grid-table tr:hover td { background: var(--sx-bg-hover); }
  .grid-table tr.sel:hover td { background: var(--sx-brand-soft); }
  .status-tag { display: inline-block; padding: 2px 8px; border-radius: 9px; font-size: 9.5px; font-weight: 600; cursor: pointer; }
  .cbx { width: 13px; height: 13px; accent-color: var(--sx-brand); cursor: pointer; }
  .op-link { color: var(--sx-brand); cursor: pointer; margin-right: 7px; }

  /* 分页 */
  .pager { display: flex; align-items: center; gap: 8px; padding: 8px 10px; font-size: 10.5px; color: var(--sx-text-secondary); }
  .pager .pgs { margin-left: auto; display: flex; align-items: center; gap: 4px; }
  .pg { min-width: 24px; height: 24px; padding: 0 5px; border: 1px solid var(--sx-border); border-radius: 4px; background: var(--sx-bg-surface); color: var(--sx-text-secondary); font-size: 10.5px; }
  .pg.on { background: var(--sx-brand); color: #fff; border-color: var(--sx-brand); }
  .pg:disabled { opacity: .45; }

  /* 公式栏 + 电子表格 */
  .formula-bar { display: flex; align-items: center; gap: 6px; padding: 5px 8px; border-bottom: 1px solid var(--sx-border); font-size: 10.5px; }
  .cell-addr { min-width: 44px; height: 24px; padding: 0 6px; border: 1px solid var(--sx-border); border-radius: 4px; text-align: center; color: var(--sx-text-secondary); display: inline-flex; align-items: center; justify-content: center; }
  .fx { color: var(--sx-text-hint); font-style: italic; }
  .formula-input { flex: 1; min-width: 0; height: 24px; border: 1px solid var(--sx-border); border-radius: 4px; padding: 0 8px; background: var(--sx-bg-surface); color: var(--sx-text-primary); font-size: 10.5px; outline: 0; }
  .sheet-table th.col { width: 34px; text-align: center; background: var(--sx-bg-hover); }
  .sheet-table td.rownum { width: 30px; text-align: center; background: var(--sx-bg-hover); color: var(--sx-text-hint); font-size: 9.5px; }
  .sheet-table td.cell { cursor: pointer; }
  .sheet-table td.cell.sel { outline: 2px solid var(--sx-brand); outline-offset: -2px; background: var(--sx-brand-soft); }
  .sheet-table td.cell.num { text-align: right; font-variant-numeric: tabular-nums; }
  .sheet-title-row td { background: var(--sx-brand); color: #fff; font-weight: 700; font-size: 12px; text-align: center; padding: 7px; }
  .sheet-total td { font-weight: 700; background: var(--sx-bg-hover); }

  /* 混合图表（柱状 + 折线） */
  .chart-box { padding: 9px 10px 10px; border-top: 1px solid var(--sx-border); }
  .chart-title { font-size: 10.5px; font-weight: 600; color: var(--sx-text-secondary); margin-bottom: 5px; }
  .chart-legend { display: flex; gap: 12px; justify-content: flex-end; font-size: 9px; color: var(--sx-text-hint); margin-top: 2px; }
  .chart-legend i { display: inline-block; width: 8px; height: 8px; border-radius: 2px; margin-right: 3px; vertical-align: middle; }
  .chart-holder { display: flex; gap: 6px; height: 96px; }
  .y-axis { width: 34px; flex: none; display: flex; flex-direction: column; justify-content: space-between; font-size: 8.5px; color: var(--sx-text-hint); text-align: right; padding-bottom: 2px; }
  .chart-plot { position: relative; flex: 1; min-width: 0; height: 100%; }
  .chart-plot .grid-line { position: absolute; left: 0; right: 0; height: 1px; background: var(--sx-border); }
  .chart-plot .bar { position: absolute; bottom: 0; background: #3b82f6; opacity: .82; border-radius: 2px 2px 0 0; }
  .chart-svg { position: absolute; inset: 0; width: 100%; height: 100%; }

  /* 优势卡 */
  .adv { margin-top: 10px; padding: 11px 12px; border-radius: 8px; background: var(--sx-bg-surface); border: 1px solid var(--sx-border); display: flex; gap: 10px; align-items: center; }
  .adv.grid { border-left: 3px solid #2563eb; }
  .adv.sheet { border-left: 3px solid #059669; }
  .adv-body { flex: 1; min-width: 0; }
  .adv h4 { margin: 0 0 7px; font-size: 11.5px; }
  .adv ul { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 5px; }
  .adv li { display: flex; align-items: center; gap: 6px; font-size: 10px; color: var(--sx-text-secondary); }
  .adv li svg { color: var(--sx-brand); flex: none; }
  .adv-thumb { width: 92px; height: 60px; flex: none; border: 1px solid var(--sx-border); border-radius: 5px; background: var(--sx-bg-hover); overflow: hidden; }

  @media (max-width: 1040px) {
    .shell { grid-template-columns: 1fr; }
    .sidebar { display: none; }
    .compare { grid-template-columns: minmax(0, 1fr); }
  }
`
