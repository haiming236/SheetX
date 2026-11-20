/**
 * SheetX 第 37 张 · 综合功能 Playground — 样式
 * 顶部模式工具栏 / 左侧功能导航 / 中间表格+图表 / 右侧配置面板 / 底部功能卡。
 */
import { css } from 'lit'

export const playgroundAllStyles = css`
  :host { display: block; }
  .app {
    display: flex; flex-direction: column; min-height: calc(100vh - 42px);
    background: var(--sx-bg-app); color: var(--sx-text-primary);
    font-family: 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
  }
  .menu-bar { height: 46px; flex: 0 0 46px; display: flex; align-items: center; gap: 16px; padding: 0 16px; background: var(--sx-bg-surface); border-bottom: 1px solid var(--sx-border); }
  .brand { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; }
  .page-title { font-size: 15.5px; font-weight: 700; }
  .live-badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 10px; background: var(--sx-success-soft); color: var(--sx-success); font-size: 10.5px; }
  .live-badge .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--sx-success); }
  .search-box { margin-left: auto; display: flex; align-items: center; gap: 6px; height: 30px; padding: 0 10px; border: 1px solid var(--sx-border); border-radius: 6px; color: var(--sx-text-hint); font-size: 11.5px; min-width: 160px; }
  .search-box input { flex: 1; min-width: 0; height: 100%; border: 0; outline: 0; background: transparent; color: var(--sx-text-primary); font: inherit; }
  .icon-btn { width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; border: 0; border-radius: 6px; background: transparent; color: var(--sx-text-secondary); }
  .icon-btn:hover { background: var(--sx-bg-hover); color: var(--sx-brand); }
  .avatar { width: 28px; height: 28px; border-radius: 50%; background: var(--sx-brand); color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; }

  .mode-bar { height: 40px; flex: 0 0 40px; display: flex; align-items: center; gap: 6px; padding: 0 12px; background: var(--sx-bg-surface); border-bottom: 1px solid var(--sx-border); overflow-x: auto; scrollbar-width: none; }
  .mode-bar::-webkit-scrollbar { display: none; }
  .mode-btn { height: 28px; padding: 0 12px; border: 0; border-radius: 5px; background: transparent; color: var(--sx-text-secondary); font-size: 11.5px; }
  .mode-btn.active { background: var(--sx-brand); color: #fff; font-weight: 600; }
  .tool-group { display: flex; align-items: center; gap: 2px; padding: 0 6px; margin: 0 3px; border-left: 1px solid var(--sx-border); }
  .tool-btn { height: 26px; min-width: 26px; padding: 0 5px; border: 0; border-radius: 4px; background: transparent; color: var(--sx-text-secondary); display: inline-flex; align-items: center; justify-content: center; font-size: 11px; }
  .tool-btn:hover { background: var(--sx-bg-hover); color: var(--sx-brand); }
  .mini-select { height: 26px; padding: 0 6px; border: 1px solid var(--sx-border-input); border-radius: 5px; background: var(--sx-bg-surface); color: var(--sx-text-primary); font-size: 11px; outline: none; }
  .mini-select.fmt { width: 80px; }
  .mini-select.size { width: 50px; }
  .mode-bar .right { margin-left: auto; display: flex; gap: 6px; }
  .btn { height: 28px; padding: 0 11px; border: 1px solid var(--sx-brand); border-radius: 5px; background: var(--sx-brand); color: #fff; font-size: 11px; display: inline-flex; align-items: center; gap: 5px; white-space: nowrap; }
  .btn.ghost { background: transparent; color: var(--sx-brand); }

  .formula-bar { height: 30px; flex: 0 0 30px; display: flex; align-items: center; background: var(--sx-bg-surface); border-bottom: 1px solid var(--sx-border); font-size: 11.5px; }
  .addr { width: 66px; height: 100%; display: flex; align-items: center; padding: 0 10px; border-right: 1px solid var(--sx-border); font-weight: 600; }
  .fx { width: 34px; text-align: center; color: var(--sx-text-hint); font-family: Georgia, serif; font-style: italic; }
  .formula-input { flex: 1; height: 100%; border: 0; outline: 0; background: transparent; color: var(--sx-text-primary); font: inherit; padding: 0 8px; }

  .shell { display: flex; flex: 1; min-height: 0; }
  .sidebar { width: 128px; flex: 0 0 128px; padding: 12px 8px; background: var(--sx-bg-surface); border-right: 1px solid var(--sx-border); }
  .side-item { display: flex; align-items: center; gap: 8px; width: 100%; height: 34px; padding: 0 9px; border: 0; border-radius: 6px; background: transparent; color: var(--sx-text-secondary); font-size: 12px; text-align: left; }
  .side-item:hover { background: var(--sx-bg-hover); color: var(--sx-text-primary); }
  .side-item.active { background: var(--sx-brand-soft); color: var(--sx-brand); font-weight: 600; }
  .side-cta { margin-top: 16px; padding: 11px 10px; border-radius: 7px; background: var(--sx-brand-soft); border: 1px solid var(--sx-border); }
  .side-cta h4 { margin: 0 0 5px; font-size: 12px; display: flex; align-items: center; gap: 5px; }
  .side-cta p { margin: 0 0 8px; font-size: 10px; line-height: 1.5; color: var(--sx-text-hint); }
  .side-cta .link { font-size: 10px; color: #fff; background: var(--sx-brand); border: 0; border-radius: 5px; padding: 4px 9px; }

  .workspace { flex: 1; min-width: 0; padding: 12px; overflow-y: auto; }
  .sheet-panel { background: var(--sx-bg-surface); border: 1px solid var(--sx-border); border-radius: 7px; overflow: hidden; }
  .report-title { background: var(--sx-brand); color: #fff; padding: 9px 13px; display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; }
  .report-title .sub { margin-left: auto; font-size: 10px; font-weight: 400; opacity: .9; }
  .data-table { width: 100%; border-collapse: collapse; font-size: 11px; table-layout: fixed; }
  .data-table th, .data-table td { border-bottom: 1px solid var(--sx-grid-line); border-right: 1px solid var(--sx-grid-line); padding: 7px 9px; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .data-table th:last-child, .data-table td:last-child { border-right: 0; }
  .col-letter { background: var(--sx-bg-subtle); color: var(--sx-text-hint); font-size: 10px; text-align: center; padding: 3px 0 !important; }
  .data-table thead th { background: var(--sx-bg-app); color: var(--sx-text-secondary); font-weight: 600; }
  .data-table td.cell { cursor: text; }
  .data-table td.cell:hover { background: var(--sx-bg-hover); }
  .data-table td.selected { outline: 2px solid var(--sx-brand); outline-offset: -2px; background: var(--sx-bg-surface); }
  .data-table td input.cell-input { width: 100%; border: 0; outline: 0; background: transparent; color: var(--sx-text-primary); font: inherit; }
  .data-table tr.total td { background: var(--sx-brand-soft); font-weight: 700; }
  .status-tag { display: inline-block; padding: 2px 8px; border-radius: 9px; font-size: 10px; }
  .cond-hot { background: #dcfce7 !important; }
  .cond-warm { background: #fef3c7 !important; }
  .sort-caret { color: var(--sx-brand); font-size: 9px; margin-left: 3px; }

  .charts { display: grid; grid-template-columns: 1.15fr 1fr; gap: 11px; margin-top: 11px; }
  .chart-card { background: var(--sx-bg-surface); border: 1px solid var(--sx-border); border-radius: 7px; padding: 11px 13px; }
  .chart-card h3 { margin: 0 0 8px; font-size: 12.5px; display: flex; align-items: center; gap: 6px; }
  .line-svg { width: 100%; height: 104px; display: block; }
  .pie-wrap { display: flex; align-items: center; gap: 14px; height: 104px; }
  .pie-donut { width: 90px; height: 90px; border-radius: 50%; flex: none; display: flex; align-items: center; justify-content: center; }
  .pie-hole { width: 44px; height: 44px; border-radius: 50%; background: var(--sx-bg-surface); display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; line-height: 1.2; text-align: center; }
  .pie-legend { flex: 1; display: flex; flex-direction: column; gap: 7px; font-size: 10.5px; }
  .legend-row { display: flex; align-items: center; gap: 6px; }
  .legend-dot { width: 8px; height: 8px; border-radius: 2px; flex: none; }
  .legend-row .pct { margin-left: auto; color: var(--sx-text-secondary); }

  .config { width: 218px; flex: 0 0 218px; margin: 12px 12px 12px 0; padding: 13px; background: var(--sx-bg-surface); border: 1px solid var(--sx-border); border-radius: 8px; align-self: flex-start; max-height: calc(100vh - 42px - 46px - 40px - 30px - 24px); overflow-y: auto; }
  .config-head { display: flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 700; padding-bottom: 10px; border-bottom: 1px solid var(--sx-border); }
  .sec-title { font-size: 11.5px; font-weight: 700; margin: 14px 0 9px; }
  .radio-row { display: flex; align-items: center; gap: 7px; padding: 5px 0; font-size: 11px; cursor: pointer; }
  .radio { width: 14px; height: 14px; border-radius: 50%; border: 1px solid var(--sx-border-strong); display: inline-flex; align-items: center; justify-content: center; flex: none; }
  .radio.on { border-color: var(--sx-brand); }
  .radio.on::after { content: ''; width: 7px; height: 7px; border-radius: 50%; background: var(--sx-brand); }
  .field-label { display: block; font-size: 10.5px; color: var(--sx-text-hint); margin: 10px 0 5px; }
  .full-select { width: 100%; height: 29px; padding: 0 8px; border: 1px solid var(--sx-border-input); border-radius: 5px; background: var(--sx-bg-surface); color: var(--sx-text-primary); font-size: 11px; outline: none; }
  .switch-row { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; font-size: 11px; }
  .switch { width: 30px; height: 17px; border-radius: 9px; border: 0; padding: 2px; background: var(--sx-border-strong); display: inline-flex; align-items: center; flex: none; }
  .switch.on { background: var(--sx-brand); }
  .switch .knob { width: 13px; height: 13px; border-radius: 50%; background: #fff; transition: transform .15s; }
  .switch.on .knob { transform: translateX(13px); }
  .chip-row { display: flex; gap: 5px; }
  .chip { flex: 1; padding: 5px 4px; border: 1px solid var(--sx-border-input); border-radius: 5px; background: var(--sx-bg-surface); color: var(--sx-text-secondary); font-size: 10px; }
  .chip.on { border-color: var(--sx-brand); color: var(--sx-brand); background: var(--sx-brand-soft); font-weight: 600; }
  .config-tip { display: flex; gap: 6px; padding: 9px 10px; border-radius: 6px; background: var(--sx-brand-soft); font-size: 10px; line-height: 1.5; color: var(--sx-text-secondary); margin-top: 13px; }
  .config-tip .ic { color: var(--sx-brand); flex: none; }

  .bottom { margin: 0 12px 12px; }
  .bottom-head { display: flex; align-items: center; font-size: 12px; font-weight: 700; margin-bottom: 9px; }
  .bottom-head .link { margin-left: auto; font-size: 10.5px; color: var(--sx-brand); background: transparent; border: 0; }
  .cards { display: grid; grid-template-columns: repeat(8, 1fr); gap: 8px; }
  .feature-card { padding: 11px 6px; border: 1px solid var(--sx-border); border-radius: 7px; background: var(--sx-bg-surface); text-align: center; cursor: pointer; }
  .feature-card:hover { border-color: var(--sx-brand); }
  .feature-card.active { border-color: var(--sx-brand); background: var(--sx-brand-soft); }
  .feature-card .thumb { height: 34px; border-radius: 4px; background: var(--sx-bg-app); display: flex; align-items: center; justify-content: center; color: var(--sx-brand); margin-bottom: 6px; }
  .feature-card .name { font-size: 10.5px; font-weight: 600; }
  .feature-card .hint { font-size: 9px; color: var(--sx-text-hint); margin-top: 2px; }

  @media (max-width: 1200px) {
    .config { width: 196px; flex-basis: 196px; }
    .cards { grid-template-columns: repeat(4, 1fr); }
    .charts { grid-template-columns: 1fr; }
  }
  @media (max-width: 900px) {
    .shell { flex-direction: column; }
    .sidebar { width: 100%; flex-basis: auto; flex-direction: row; flex-wrap: wrap; gap: 3px; }
    .side-cta { display: none; }
    .side-item { width: auto; }
    .config { width: auto; flex-basis: auto; margin: 0 12px 12px; max-height: none; }
  }
`
