/**
 * SheetX 第 46 张 · AI 数据分析 — 样式
 * 头部 / 表格工作区 / 洞察卡 / SVG 图表 / AI 面板 / 报告弹窗 / 底部状态栏
 */
import { css } from 'lit'

export const aiAnalysisStyles = css`
  :host { display: block; }
  .app {
    display: flex; flex-direction: column; height: calc(100vh - 42px); min-height: 620px;
    background: var(--sx-bg-app); color: var(--sx-text-primary);
    font-family: 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif; overflow: hidden;
  }

  /* 头部 */
  .header {
    height: 62px; flex: 0 0 62px; display: flex; align-items: center; gap: 14px;
    padding: 0 18px; background: var(--sx-bg-surface); border-bottom: 1px solid var(--sx-border);
  }
  .header .brand { display: flex; align-items: center; }
  .header .divider { width: 1px; height: 34px; background: var(--sx-border); }
  .header h1 { margin: 0; font-size: 17px; font-weight: 800; letter-spacing: -.2px; }
  .header .sub { margin-top: 3px; font-size: 10.5px; color: var(--sx-text-secondary); }
  .header-actions { margin-left: auto; display: flex; align-items: center; gap: 8px; }
  .btn {
    height: 32px; padding: 0 11px; border: 1px solid var(--sx-border); border-radius: 7px;
    background: var(--sx-bg-surface); color: var(--sx-text-primary); cursor: pointer;
    display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600;
  }
  .btn:hover { background: var(--sx-bg-hover); }
  .btn.primary { background: #059669; border-color: #059669; color: #fff; }
  .btn.primary:hover { background: #047857; }
  .btn.ghost { background: transparent; }
  .btn.sm { height: 28px; padding: 0 9px; font-size: 10px; }

  /* 主体两栏 */
  .body { flex: 1; display: grid; grid-template-columns: minmax(0, 1fr) 320px; min-height: 0; }
  @media (max-width: 1080px) { .body { grid-template-columns: minmax(0, 1fr); } .ai-panel { display: none; } }
  .work { min-width: 0; display: flex; flex-direction: column; overflow: hidden; }

  /* 表格工具条 */
  .tabs, .toolbar, .formula {
    height: 34px; flex: 0 0 34px; display: flex; align-items: center; gap: 4px;
    padding: 0 9px; background: var(--sx-bg-surface); border-bottom: 1px solid var(--sx-border);
  }
  .toolbar { overflow-x: auto; scrollbar-width: none; gap: 2px; }
  .toolbar::-webkit-scrollbar { display: none; }
  .menu-item { padding: 0 9px; height: 24px; border: 0; border-radius: 4px; background: transparent; color: var(--sx-text-secondary); font-size: 10.5px; cursor: pointer; }
  .menu-item:hover, .menu-item.active { background: var(--sx-brand-soft); color: var(--sx-brand); font-weight: 600; }
  .sep { width: 1px; height: 16px; background: var(--sx-border); margin: 0 4px; }
  .tb { height: 24px; min-width: 24px; padding: 0 5px; border: 1px solid transparent; border-radius: 4px; background: transparent; color: var(--sx-text-secondary); display: inline-flex; align-items: center; gap: 4px; font-size: 10px; cursor: pointer; }
  .tb:hover { background: var(--sx-bg-hover); }
  .tb.ai { color: #059669; background: #e7f7ed; }
  .formula { gap: 6px; }
  .addr { width: 62px; height: 23px; border: 1px solid var(--sx-border); border-radius: 4px; background: var(--sx-bg-surface); color: var(--sx-text-primary); font-size: 10.5px; padding: 0 6px; outline: none; }
  .fx { color: var(--sx-text-hint); font-size: 11px; font-style: italic; }
  .formula input.value { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--sx-text-primary); font-size: 11px; }

  /* 数据网格 */
  .grid-scroll { flex: 0 0 auto; max-height: 270px; overflow: auto; padding: 8px 10px; }
  .grid { border-collapse: separate; border-spacing: 0; table-layout: fixed; width: 100%; font-size: 11px; }
  .grid th, .grid td { border: 1px solid var(--sx-border); height: 26px; padding: 0 8px; text-align: center; }
  .grid thead th { background: #059669; color: #fff; font-weight: 700; }
  .grid td { background: var(--sx-bg-surface); }
  .grid td.editable { cursor: text; }
  .grid td.editable:hover { background: #f0fdf4; }
  .grid td input { width: 100%; border: 0; outline: 2px solid #059669; background: #fff; color: #111; font: inherit; text-align: center; }
  .grid td.num { font-variant-numeric: tabular-nums; }
  .grid td.pos { color: #059669; font-weight: 600; }
  .grid td.neg { color: #dc2626; font-weight: 600; }
  .grid caption { text-align: left; font-size: 16px; font-weight: 800; color: #065f46; padding: 2px 0 9px; }
  .grid caption .cap-icon { display: inline-flex; vertical-align: -3px; margin-right: 5px; color: #059669; }

  /* 下方卡片区 */
  .cards { flex: 1; min-height: 0; overflow: auto; display: grid; grid-template-columns: minmax(230px, .95fr) minmax(320px, 1.35fr) minmax(210px, .9fr); gap: 10px; padding: 0 10px 10px; align-content: start; }
  @media (max-width: 1280px) { .cards { grid-template-columns: 1fr 1fr; } .cards .donut-card { grid-column: 1 / -1; } }
  .card { background: var(--sx-bg-surface); border: 1px solid var(--sx-border); border-radius: 9px; padding: 12px; min-width: 0; }
  .card h3 { margin: 0 0 10px; font-size: 12px; font-weight: 800; display: flex; align-items: center; gap: 6px; }
  .card h3 svg { color: #059669; }
  .insight { display: flex; align-items: flex-start; gap: 7px; padding: 7px 8px; margin-bottom: 7px; border-radius: 6px; font-size: 11px; line-height: 1.5; background: #f0fdf4; color: #065f46; }
  .insight.warn { background: #fff7ed; color: #9a3412; }
  .insight.info { background: var(--sx-bg-hover); color: var(--sx-text-secondary); }
  .insight svg { flex: none; margin-top: 1px; }
  .chart-wrap { width: 100%; }
  .chart-wrap svg { display: block; width: 100%; height: auto; }
  .legend { display: flex; gap: 14px; justify-content: center; margin-top: 5px; font-size: 10px; color: var(--sx-text-secondary); }
  .legend i { display: inline-block; width: 8px; height: 8px; border-radius: 2px; margin-right: 4px; }
  .donut-wrap { display: flex; align-items: center; justify-content: center; gap: 14px; }
  .donut-center { font-size: 19px; font-weight: 800; fill: #065f46; }
  .donut-sub { font-size: 8px; fill: var(--sx-text-hint); }
  .channel-legend { display: flex; flex-direction: column; gap: 9px; font-size: 11px; }
  .channel-legend div { display: flex; align-items: center; gap: 6px; }
  .channel-legend i { width: 9px; height: 9px; border-radius: 50%; }
  .channel-legend b { margin-left: auto; }

  /* AI 面板 */
  .ai-panel { border-left: 1px solid var(--sx-border); background: var(--sx-bg-surface); display: flex; flex-direction: column; min-height: 0; }
  .ai-head { height: 42px; flex: 0 0 42px; display: flex; align-items: center; gap: 7px; padding: 0 12px; border-bottom: 1px solid var(--sx-border); font-size: 12px; font-weight: 800; }
  .ai-head svg { color: #059669; }
  .ai-head button { margin-left: auto; }
  .ai-scroll { flex: 1; min-height: 0; overflow: auto; padding: 12px; display: flex; flex-direction: column; gap: 10px; }
  .msg.user { align-self: flex-end; max-width: 88%; background: #059669; color: #fff; border-radius: 10px 10px 2px 10px; padding: 8px 10px; font-size: 11px; line-height: 1.5; }
  .msg.bot { align-self: flex-start; max-width: 94%; background: var(--sx-bg-hover); border-radius: 10px 10px 10px 2px; padding: 10px; font-size: 11px; line-height: 1.6; }
  .done { display: flex; align-items: center; gap: 6px; color: #059669; font-weight: 700; margin-bottom: 5px; }
  .metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-top: 10px; }
  .metric { background: #f0fdf4; border-radius: 7px; padding: 8px 6px; text-align: center; }
  .metric b { display: block; color: #059669; font-size: 13px; }
  .metric span { font-size: 9px; color: var(--sx-text-secondary); }
  .ai-insights { margin-top: 10px; border-top: 1px solid var(--sx-border); padding-top: 9px; }
  .ai-insights h4 { margin: 0 0 7px; font-size: 11px; }
  .ai-insights li { font-size: 10.5px; line-height: 1.6; margin-bottom: 5px; color: var(--sx-text-secondary); }
  .ai-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 11px; }
  .ai-actions .btn { justify-content: center; padding: 0 5px; }
  .ai-actions .wide { grid-column: 1 / -1; }
  .ai-input { flex: 0 0 auto; border-top: 1px solid var(--sx-border); padding: 9px; }
  .input-row { display: flex; gap: 6px; align-items: center; border: 1px solid var(--sx-border); border-radius: 8px; padding: 5px 5px 5px 9px; }
  .input-row input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--sx-text-primary); font-size: 10.5px; }
  .send { width: 28px; height: 28px; border: 0; border-radius: 6px; background: #059669; color: #fff; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }
  .send:hover { background: #047857; }
  .quick { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 7px; }
  .quick button { border: 1px solid var(--sx-border); background: transparent; border-radius: 10px; padding: 3px 7px; font-size: 9px; color: var(--sx-text-secondary); cursor: pointer; }
  .quick button:hover { background: var(--sx-brand-soft); }
  .thinking { color: var(--sx-text-hint); font-size: 10.5px; font-style: italic; }

  /* 底部 */
  .statusbar { height: 30px; flex: 0 0 30px; display: flex; align-items: center; gap: 10px; padding: 0 10px; border-top: 1px solid var(--sx-border); background: var(--sx-bg-surface); font-size: 10px; color: var(--sx-text-secondary); }
  .sheet-tab { height: 23px; padding: 0 10px; border: 0; border-bottom: 2px solid #059669; background: transparent; color: #059669; font-weight: 700; font-size: 10.5px; }
  .status-right { margin-left: auto; display: flex; align-items: center; gap: 8px; }

  /* 报告弹窗 */
  .modal-mask { position: fixed; inset: 0; background: rgba(15,23,42,.4); display: flex; align-items: center; justify-content: center; z-index: 500; }
  .modal { width: min(680px, 92vw); max-height: 82vh; display: flex; flex-direction: column; background: var(--sx-bg-surface); border-radius: 12px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,.2); }
  .modal-head { height: 46px; flex: 0 0 46px; display: flex; align-items: center; padding: 0 14px; border-bottom: 1px solid var(--sx-border); font-weight: 800; font-size: 13px; }
  .modal-head button { margin-left: auto; }
  .modal-body { flex: 1; min-height: 0; overflow: auto; padding: 14px; }
  .modal-body pre { margin: 0; white-space: pre-wrap; word-break: break-word; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; line-height: 1.7; color: var(--sx-text-primary); }
  .modal-foot { padding: 10px 14px; border-top: 1px solid var(--sx-border); display: flex; justify-content: flex-end; gap: 7px; }
`
