/**
 * SheetX 第 34 张 · 开发者调试与性能监控 — 样式
 * 左侧导航 / 指标卡+趋势图 / 事件日志 / 组件状态 / API 统计。无 glow/shadow。
 */
import { css } from 'lit'

export const debugStyles = css`
  :host { display: block; }
  .app {
    display: flex; flex-direction: column; min-height: calc(100vh - 42px);
    background: var(--sx-bg-app); color: var(--sx-text-primary);
    font-family: 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
  }
  .menu-bar { height: 48px; flex: 0 0 48px; display: flex; align-items: center; gap: 16px; padding: 0 16px; background: var(--sx-bg-surface); border-bottom: 1px solid var(--sx-border); }
  .brand { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; }
  .menu-list { display: flex; gap: 2px; }
  .menu-item { padding: 6px 12px; border: 0; border-radius: 6px; background: transparent; color: var(--sx-text-secondary); font-size: 13px; }
  .menu-item:hover { background: var(--sx-bg-hover); color: var(--sx-text-primary); }
  .menu-item.active { color: var(--sx-brand); background: var(--sx-brand-soft); font-weight: 600; }
  .search-box { margin-left: auto; display: flex; align-items: center; gap: 6px; height: 30px; padding: 0 10px; border: 1px solid var(--sx-border); border-radius: 6px; color: var(--sx-text-hint); font-size: 11.5px; min-width: 168px; }
  .search-box input { flex: 1; min-width: 0; height: 100%; border: 0; outline: 0; background: transparent; color: var(--sx-text-primary); font: inherit; }
  .icon-btn { width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; border: 0; border-radius: 6px; background: transparent; color: var(--sx-text-secondary); }
  .icon-btn:hover { background: var(--sx-bg-hover); color: var(--sx-brand); }
  .avatar { width: 28px; height: 28px; border-radius: 50%; background: var(--sx-brand); color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; }

  .shell { display: flex; flex: 1; min-height: 0; }
  .sidebar { width: 132px; flex: 0 0 132px; padding: 16px 8px; background: var(--sx-bg-surface); border-right: 1px solid var(--sx-border); }
  .side-title { font-size: 11px; font-weight: 600; color: var(--sx-text-hint); padding: 0 10px 11px; }
  .side-item { display: flex; align-items: center; gap: 8px; width: 100%; height: 36px; padding: 0 10px; border: 0; border-radius: 6px; background: transparent; color: var(--sx-text-secondary); font-size: 12.5px; text-align: left; }
  .side-item:hover { background: var(--sx-bg-hover); color: var(--sx-text-primary); }
  .side-item.active { background: var(--sx-brand-soft); color: var(--sx-brand); font-weight: 600; }

  .main { flex: 1; min-width: 0; padding: 16px 18px; overflow-y: auto; }
  .head { display: flex; align-items: flex-start; gap: 11px; margin-bottom: 15px; }
  .head-icon { width: 42px; height: 42px; border-radius: 10px; background: var(--sx-brand); color: #fff; display: inline-flex; align-items: center; justify-content: center; flex: none; }
  .head h2 { margin: 0 0 4px; font-size: 18px; }
  .head p { margin: 0; font-size: 11.5px; color: var(--sx-text-hint); }
  .head-right { margin-left: auto; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
  .live { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; color: var(--sx-success); }
  .live .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--sx-success); animation: pulse 1.6s infinite; }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .35; } }
  .select { height: 30px; padding: 0 8px; border: 1px solid var(--sx-border-input); border-radius: 6px; background: var(--sx-bg-surface); color: var(--sx-text-primary); font-size: 11px; outline: none; }
  .btn { height: 30px; padding: 0 11px; border: 1px solid var(--sx-border-input); border-radius: 6px; background: var(--sx-bg-surface); color: var(--sx-text-primary); font-size: 11px; display: inline-flex; align-items: center; gap: 5px; }
  .btn:hover { border-color: var(--sx-brand); }
  .btn.primary { background: var(--sx-brand); border-color: var(--sx-brand); color: #fff; }

  .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 11px; margin-bottom: 12px; }
  .metric { padding: 13px 14px; border: 1px solid var(--sx-border); border-radius: 8px; background: var(--sx-bg-surface); display: flex; align-items: center; gap: 11px; }
  .metric .ic { width: 36px; height: 36px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; flex: none; }
  .metric .val { font-size: 21px; font-weight: 700; line-height: 1.1; }
  .metric .lbl { font-size: 10.5px; color: var(--sx-text-hint); margin-top: 3px; }
  .metric .delta { margin-left: auto; font-size: 10.5px; display: inline-flex; align-items: center; gap: 2px; }
  .delta.up { color: var(--sx-success); }
  .delta.down { color: var(--sx-danger); }

  .grid { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 12px; align-items: start; }
  .panel { background: var(--sx-bg-surface); border: 1px solid var(--sx-border); border-radius: 8px; overflow: hidden; }
  .panel-head { display: flex; align-items: center; gap: 8px; padding: 11px 14px; border-bottom: 1px solid var(--sx-border); font-size: 12.5px; font-weight: 600; }
  .panel-head .right { margin-left: auto; display: flex; gap: 5px; }
  .ranges { display: flex; gap: 3px; }
  .range { padding: 4px 9px; border: 0; border-radius: 5px; background: transparent; color: var(--sx-text-hint); font-size: 10.5px; }
  .range:hover { background: var(--sx-bg-hover); color: var(--sx-text-primary); }
  .range.on { background: var(--sx-brand-soft); color: var(--sx-brand); font-weight: 600; }

  /* 趋势图 */
  .chart-area { position: relative; padding: 12px 14px 8px; }
  .legend { display: flex; gap: 14px; justify-content: center; font-size: 10.5px; color: var(--sx-text-secondary); margin-bottom: 6px; }
  .legend span { display: inline-flex; align-items: center; gap: 5px; }
  .legend i { width: 7px; height: 7px; border-radius: 50%; display: inline-block; }
  .chart-svg { width: 100%; height: 186px; display: block; touch-action: none; }
  /* SVG text 的 fill 用 CSS 变量在部分引擎不继承，显式设色避免刻度消失 */
  .axis-label { font-size: 11px; fill: #9aa1ad; }
  html[data-theme='dark'] .axis-label { fill: #6f7683; }
  .grid-line { stroke: var(--sx-border); stroke-width: .5; stroke-dasharray: 3 3; }
  .tooltip {
    position: absolute; z-index: 5; pointer-events: none; padding: 8px 10px; border-radius: 6px;
    background: var(--sx-bg-app); border: 1px solid var(--sx-border); font-size: 10.5px; line-height: 1.7;
    color: var(--sx-text-primary); min-width: 120px;
  }
  .tooltip .tt { font-weight: 600; margin-bottom: 3px; }
  .tooltip .row { display: flex; align-items: center; gap: 5px; }
  .tooltip i { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }

  /* 事件日志 */
  .log-panel { margin-top: 12px; }
  .log-tools { display: flex; align-items: center; gap: 8px; padding: 9px 14px; }
  .log-search { flex: 1; max-width: 220px; display: flex; align-items: center; gap: 5px; height: 28px; padding: 0 9px; border: 1px solid var(--sx-border-input); border-radius: 5px; color: var(--sx-text-hint); }
  .log-search input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--sx-text-primary); font-size: 11px; }
  .log-filters { display: flex; gap: 5px; }
  .log-filter { padding: 4px 9px; border: 1px solid var(--sx-border-input); border-radius: 5px; background: var(--sx-bg-surface); color: var(--sx-text-secondary); font-size: 10.5px; }
  .log-filter.on { background: var(--sx-brand); border-color: var(--sx-brand); color: #fff; }
  .log-list { padding: 0 14px 10px; }
  .log-item { display: flex; align-items: center; gap: 9px; padding: 6px 0; border-bottom: 1px solid var(--sx-border); font-size: 11px; }
  .log-item:last-child { border-bottom: 0; }
  .log-item .time { color: var(--sx-text-hint); font-variant-numeric: tabular-nums; width: 60px; flex: none; }
  .log-item .dot { width: 7px; height: 7px; border-radius: 50%; flex: none; }
  .log-item .msg { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .log-item .src { color: var(--sx-text-hint); font-size: 10px; flex: none; width: 62px; text-align: right; }

  /* 右侧 */
  .side { display: flex; flex-direction: column; gap: 12px; }
  .comp-list { padding: 4px 14px 10px; }
  .comp-row { display: flex; align-items: center; gap: 8px; padding: 9px 0; border-bottom: 1px solid var(--sx-border); font-size: 11.5px; }
  .comp-row:last-child { border-bottom: 0; }
  .comp-row .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--sx-success); flex: none; }
  .comp-row .st { margin-left: auto; font-size: 10.5px; color: var(--sx-text-secondary); }
  .badge { padding: 2px 8px; border-radius: 9px; font-size: 10px; background: var(--sx-success-soft); color: var(--sx-success); }
  .badge.blue { background: var(--sx-brand-soft); color: var(--sx-brand); }
  .api-table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
  .api-table th, .api-table td { border-bottom: 1px solid var(--sx-border); padding: 7px 10px; text-align: left; }
  .api-table th { color: var(--sx-text-hint); font-weight: 600; }
  .api-table td.num { font-variant-numeric: tabular-nums; }
  .api-table .ok { color: var(--sx-success); }
  .api-head-extra { margin-left: auto; font-size: 10px; color: var(--sx-text-hint); font-weight: 400; }
  .tip-card { margin: 0; padding: 12px 14px; border-radius: 8px; background: var(--sx-brand-soft); border: 1px solid var(--sx-border); display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--sx-text-secondary); }
  .tip-card .ic { color: var(--sx-brand); flex: none; }
  .tip-card b { color: var(--sx-brand); }

  /* 其它导航视图 */
  .placeholder { padding: 20px; font-size: 12px; color: var(--sx-text-secondary); line-height: 1.8; }
  .placeholder h3 { margin: 0 0 10px; font-size: 14px; color: var(--sx-text-primary); }
  .placeholder code { color: var(--sx-brand); font-family: 'SF Mono', Menlo, monospace; }

  @media (max-width: 1200px) {
    .grid { grid-template-columns: 1fr; }
    .metrics { grid-template-columns: repeat(2, 1fr); }
    .side { flex-direction: row; flex-wrap: wrap; }
    .side .panel, .tip-card { flex: 1; min-width: 260px; }
  }
  @media (max-width: 860px) {
    .sidebar { width: 100%; flex-basis: auto; flex-direction: row; flex-wrap: wrap; gap: 3px; }
    .side-title { display: none; }
    .side-item { width: auto; }
  }
`
