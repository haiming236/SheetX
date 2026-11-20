/** SheetX 第 48 张 · AI 智能图表生成与可视化 — 样式 */
import { css } from 'lit'

export const aiChartStyles = css`
  :host { display: block; }
  .app {
    display: flex; flex-direction: column; height: calc(100vh - 42px); min-height: 620px;
    background: var(--sx-bg-app); color: var(--sx-text-primary);
    font-family: 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif; overflow: hidden;
  }
  .header { height: 62px; flex: 0 0 62px; display: flex; align-items: center; gap: 14px; padding: 0 18px; background: var(--sx-bg-surface); border-bottom: 1px solid var(--sx-border); }
  .header .divider { width: 1px; height: 34px; background: var(--sx-border); }
  .header h1 { margin: 0; font-size: 17px; font-weight: 800; letter-spacing: -.2px; }
  .header .sub { margin-top: 3px; font-size: 10.5px; color: var(--sx-text-secondary); }
  .header-actions { margin-left: auto; display: flex; gap: 8px; }
  .btn { height: 32px; padding: 0 11px; border: 1px solid var(--sx-border); border-radius: 7px; background: var(--sx-bg-surface); color: var(--sx-text-primary); cursor: pointer; display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; }
  .btn:hover { background: var(--sx-bg-hover); }
  .btn.primary { background: #059669; border-color: #059669; color: #fff; }
  .btn.primary:hover { background: #047857; }
  .btn.sm { height: 27px; padding: 0 8px; font-size: 10px; }
  .btn.ghost { background: transparent; }

  .body { flex: 1; display: grid; grid-template-columns: minmax(0, 1fr) 320px; min-height: 0; }
  @media (max-width: 1080px) { .body { grid-template-columns: minmax(0, 1fr); } .ai-panel { display: none; } }
  .work { min-width: 0; display: flex; flex-direction: column; overflow: hidden; }

  .tabs, .toolbar, .formula { height: 34px; flex: 0 0 34px; display: flex; align-items: center; gap: 4px; padding: 0 9px; background: var(--sx-bg-surface); border-bottom: 1px solid var(--sx-border); }
  .toolbar { overflow-x: auto; scrollbar-width: none; gap: 2px; }
  .toolbar::-webkit-scrollbar { display: none; }
  .menu-item { padding: 0 9px; height: 24px; border: 0; border-radius: 4px; background: transparent; color: var(--sx-text-secondary); font-size: 10.5px; cursor: pointer; }
  .menu-item:hover, .menu-item.active { background: var(--sx-brand-soft); color: var(--sx-brand); font-weight: 600; }
  .sep { width: 1px; height: 16px; background: var(--sx-border); margin: 0 4px; }
  .tb { height: 24px; min-width: 24px; padding: 0 5px; border: 1px solid transparent; border-radius: 4px; background: transparent; color: var(--sx-text-secondary); display: inline-flex; align-items: center; gap: 4px; font-size: 10px; cursor: pointer; }
  .tb:hover { background: var(--sx-bg-hover); }
  .tb.insert { color: #059669; background: #e7f7ed; }
  .formula { gap: 6px; }
  .addr { width: 60px; height: 23px; border: 1px solid var(--sx-border); border-radius: 4px; background: var(--sx-bg-surface); color: var(--sx-text-primary); font-size: 10.5px; padding: 0 6px; }
  .fx { color: var(--sx-text-hint); font-size: 11px; font-style: italic; }
  .formula input.value { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--sx-text-primary); font-size: 11px; }

  /* 网格 + 浮动图表（覆盖在表格之上，带选中框） */
  .canvas { flex: 1; min-height: 0; position: relative; overflow: auto; padding: 8px 10px; }
  .grid { border-collapse: separate; border-spacing: 0; table-layout: fixed; width: 100%; max-width: 620px; font-size: 11px; }
  .grid th, .grid td { border: 1px solid var(--sx-border); height: 26px; padding: 0 8px; text-align: center; }
  .grid thead th { background: #059669; color: #fff; font-weight: 700; }
  .grid td { background: var(--sx-bg-surface); }
  .grid td.num { font-variant-numeric: tabular-nums; }
  .grid td.selected { outline: 2px solid #059669; outline-offset: -2px; }
  .grid td.editable { cursor: text; }
  .grid td input { width: 100%; border: 0; outline: 2px solid #059669; background: #fff; color: #111; font: inherit; text-align: center; }

  /* 图表浮层：可拖拽感 + 8 个选中控点 */
  .chart-float {
    position: absolute; top: 66px; left: 300px; width: min(440px, 62%);
    background: var(--sx-bg-surface); border: 2px solid #059669; border-radius: 3px;
    box-shadow: 0 8px 26px rgba(5,150,105,.12); padding: 11px 12px; z-index: 10;
  }
  .chart-float.selected { box-shadow: 0 0 0 1px #059669, 0 10px 30px rgba(5,150,105,.16); }
  .handle { position: absolute; width: 7px; height: 7px; background: #fff; border: 2px solid #059669; border-radius: 50%; z-index: 3; }
  .handle.tl { left: -5px; top: -5px; } .handle.tm { left: 50%; top: -5px; transform: translateX(-50%); }
  .handle.tr { right: -5px; top: -5px; } .handle.ml { left: -5px; top: 50%; transform: translateY(-50%); }
  .handle.mr { right: -5px; top: 50%; transform: translateY(-50%); }
  .handle.bl { left: -5px; bottom: -5px; } .handle.bm { left: 50%; bottom: -5px; transform: translateX(-50%); }
  .handle.br { right: -5px; bottom: -5px; }
  .chart-head { display: flex; align-items: center; gap: 7px; margin-bottom: 8px; }
  .chart-title { flex: 1; border: 0; border-bottom: 1px dashed transparent; background: transparent; color: var(--sx-text-primary); font-size: 13px; font-weight: 800; outline: none; padding: 2px 0; }
  .chart-title:hover, .chart-title:focus { border-bottom-color: #a7f3d0; }
  .chart-tool { width: 25px; height: 25px; border: 1px solid var(--sx-border); border-radius: 5px; background: var(--sx-bg-surface); color: var(--sx-text-secondary); display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }
  .chart-tool:hover, .chart-tool.active { background: #e7f7ed; color: #059669; border-color: #a7f3d0; }
  .chart-tools { display: flex; gap: 4px; }
  .chart-wrap svg { display: block; width: 100%; height: auto; }
  .legend { display: flex; gap: 14px; justify-content: center; margin-top: 5px; font-size: 9px; color: var(--sx-text-secondary); }
  .legend i { display: inline-block; width: 8px; height: 8px; border-radius: 2px; margin-right: 4px; }

  /* 下方卡片 */
  .cards { flex: 0 0 auto; display: grid; grid-template-columns: minmax(260px, 1fr) minmax(240px, .85fr); gap: 10px; padding: 10px; border-top: 1px solid var(--sx-border); }
  .card { background: var(--sx-bg-surface); border: 1px solid var(--sx-border); border-radius: 9px; padding: 11px; }
  .card h3 { margin: 0 0 9px; font-size: 12px; font-weight: 800; display: flex; align-items: center; gap: 6px; }
  .card h3 svg { color: #059669; }
  .insight { display: flex; align-items: flex-start; gap: 7px; padding: 6px 8px; margin-bottom: 6px; border-radius: 6px; background: #f0fdf4; color: #065f46; font-size: 10.5px; line-height: 1.5; }
  .insight svg { flex: none; margin-top: 1px; }
  .donut-wrap { display: flex; align-items: center; justify-content: center; gap: 13px; }
  .donut-center { font-size: 17px; font-weight: 800; fill: #065f46; }
  .donut-sub { font-size: 7.5px; fill: var(--sx-text-hint); }
  .channel-legend { display: flex; flex-direction: column; gap: 8px; font-size: 10.5px; }
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
  .msg.bot { align-self: flex-start; width: 100%; background: var(--sx-bg-hover); border-radius: 10px 10px 10px 2px; padding: 10px; font-size: 11px; line-height: 1.6; }
  .mini-chart { margin-top: 8px; border: 1px solid #d1fae5; border-radius: 7px; background: #fff; padding: 6px; }
  .mini-chart .mini-title { font-size: 10px; font-weight: 700; margin-bottom: 3px; }
  .points { margin-top: 10px; }
  .points h4 { margin: 0 0 6px; font-size: 11px; display: flex; align-items: center; gap: 5px; }
  .points li { font-size: 10.5px; line-height: 1.6; margin-bottom: 5px; color: var(--sx-text-secondary); }
  .ai-actions { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 5px; margin-top: 11px; }
  .ai-actions .btn { justify-content: center; padding: 0 4px; font-size: 9.5px; }
  .ai-input { flex: 0 0 auto; border-top: 1px solid var(--sx-border); padding: 9px; }
  .input-row { display: flex; gap: 6px; align-items: center; border: 1px solid var(--sx-border); border-radius: 8px; padding: 5px 5px 5px 9px; }
  .input-row input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--sx-text-primary); font-size: 10.5px; }
  .send { width: 28px; height: 28px; border: 0; border-radius: 6px; background: #059669; color: #fff; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }
  .quick { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 7px; }
  .quick button { border: 1px solid var(--sx-border); background: transparent; border-radius: 10px; padding: 3px 7px; font-size: 9px; color: var(--sx-text-secondary); cursor: pointer; }
  .quick button:hover { background: var(--sx-brand-soft); }

  .statusbar { height: 30px; flex: 0 0 30px; display: flex; align-items: center; gap: 10px; padding: 0 10px; border-top: 1px solid var(--sx-border); background: var(--sx-bg-surface); font-size: 10px; color: var(--sx-text-secondary); }
  .sheet-tab { height: 23px; padding: 0 10px; border: 0; border-bottom: 2px solid #059669; background: transparent; color: #059669; font-weight: 700; font-size: 10.5px; }
  .sheet-tab.plain { border: 0; color: var(--sx-text-secondary); }
  .status-right { margin-left: auto; display: flex; align-items: center; gap: 8px; }

  .modal-mask { position: fixed; inset: 0; background: rgba(15,23,42,.4); display: flex; align-items: center; justify-content: center; z-index: 500; }
  .modal { width: min(680px, 92vw); max-height: 82vh; display: flex; flex-direction: column; background: var(--sx-bg-surface); border-radius: 12px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,.2); }
  .modal-head { height: 46px; flex: 0 0 46px; display: flex; align-items: center; padding: 0 14px; border-bottom: 1px solid var(--sx-border); font-weight: 800; font-size: 13px; }
  .modal-head button { margin-left: auto; }
  .modal-body { flex: 1; min-height: 0; overflow: auto; padding: 14px; }
  .modal-body pre { margin: 0; white-space: pre-wrap; word-break: break-word; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; line-height: 1.7; }
  .modal-foot { padding: 10px 14px; border-top: 1px solid var(--sx-border); display: flex; justify-content: flex-end; gap: 7px; }
`
