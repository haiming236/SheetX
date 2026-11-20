/**
 * SheetX 第 44 张 · AI 助手与智能数据分析 — 样式
 * 顶栏 / 左侧导航 / 中间表格工作区+双图表 / 右侧AI面板 / 底部状态栏 / Provider与预览弹窗。
 */
import { css } from 'lit'

export const aiAssistantStyles = css`
  :host { display: block; }
  .app {
    display: flex; flex-direction: column; height: calc(100vh - 42px); min-height: 640px;
    background: var(--sx-bg-app); color: var(--sx-text-primary);
    font-family: 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif; overflow: hidden;
  }

  /* 顶栏 */
  .topbar { height: 48px; flex: 0 0 48px; display: flex; align-items: center; gap: 14px; padding: 0 14px; background: var(--sx-bg-surface); border-bottom: 1px solid var(--sx-border); }
  .brand { display: flex; align-items: center; }
  .crumb { font-size: 11px; color: var(--sx-text-hint); display: flex; align-items: center; gap: 5px; }
  .top-search { margin-left: auto; display: flex; align-items: center; gap: 6px; height: 30px; padding: 0 11px; border: 1px solid var(--sx-border); border-radius: 15px; background: var(--sx-bg-hover); color: var(--sx-text-hint); font-size: 10.5px; width: 210px; }
  .top-search input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--sx-text-primary); font: inherit; }
  .icon-btn { width: 29px; height: 29px; border: 0; border-radius: 6px; background: transparent; color: var(--sx-text-secondary); display: inline-flex; align-items: center; justify-content: center; position: relative; }
  .icon-btn:hover { background: var(--sx-bg-hover); }
  .icon-btn .rd { position: absolute; top: 4px; right: 4px; width: 6px; height: 6px; border-radius: 50%; background: #ef4444; }
  .avatar { width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg, #f59e0b, #ec4899); color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; }

  /* 主体 */
  .body { flex: 1; display: grid; grid-template-columns: 152px minmax(0, 1fr) 300px; min-height: 0; }
  @media (max-width: 1080px) { .body { grid-template-columns: 120px minmax(0, 1fr); } .ai-panel { display: none; } }

  /* 左侧导航 */
  .sidebar { border-right: 1px solid var(--sx-border); background: var(--sx-bg-surface); padding: 12px 8px; display: flex; flex-direction: column; }
  .side-item { width: 100%; height: 34px; display: flex; align-items: center; gap: 8px; padding: 0 10px; margin-bottom: 3px; border: 0; border-radius: 6px; background: transparent; color: var(--sx-text-secondary); font-size: 11px; text-align: left; }
  .side-item:hover { background: var(--sx-bg-hover); }
  .side-item.active { background: #e7f7ed; color: #059669; font-weight: 700; border-left: 3px solid #059669; padding-left: 7px; }
  .side-item .ai-dot { width: 6px; height: 6px; border-radius: 50%; background: #8b5cf6; margin-left: auto; }
  .side-cta { margin-top: auto; padding: 11px 10px; border-radius: 8px; background: var(--sx-brand-soft); }
  .side-cta .t { font-size: 13px; font-weight: 800; }
  .side-cta .d { font-size: 9.5px; color: var(--sx-text-secondary); margin-top: 4px; line-height: 1.5; }
  .side-cta svg { color: var(--sx-brand); margin-top: 6px; }

  /* 中间工作区 */
  .work { min-width: 0; display: flex; flex-direction: column; overflow: hidden; }
  .tabs { height: 36px; flex: 0 0 36px; display: flex; align-items: center; gap: 4px; padding: 0 8px; background: var(--sx-bg-surface); border-bottom: 1px solid var(--sx-border); }
  .ftab { height: 26px; padding: 0 10px; display: inline-flex; align-items: center; gap: 6px; border: 0; border-radius: 5px; background: var(--sx-bg-hover); color: var(--sx-text-secondary); font-size: 10.5px; }
  .ftab.active { background: #e7f7ed; color: #059669; font-weight: 600; }
  .ftab .x { color: var(--sx-text-hint); }
  .add-tab { width: 24px; height: 24px; border: 0; border-radius: 5px; background: transparent; color: var(--sx-text-hint); }
  .toolbar { height: 38px; flex: 0 0 38px; display: flex; align-items: center; gap: 3px; padding: 0 8px; background: var(--sx-bg-surface); border-bottom: 1px solid var(--sx-border); overflow-x: auto; scrollbar-width: none; }
  .toolbar::-webkit-scrollbar { display: none; }
  .tb { height: 25px; min-width: 25px; padding: 0 5px; border: 1px solid transparent; border-radius: 4px; background: transparent; color: var(--sx-text-secondary); display: inline-flex; align-items: center; justify-content: center; gap: 3px; font-size: 10px; }
  .tb:hover { background: var(--sx-bg-hover); border-color: var(--sx-border); }
  .tb.on { color: var(--sx-brand); background: var(--sx-brand-soft); }
  .tb-sel { height: 24px; border: 1px solid var(--sx-border); border-radius: 4px; background: var(--sx-bg-surface); color: var(--sx-text-secondary); font-size: 10px; padding: 0 4px; }
  .tb-sep { width: 1px; height: 15px; background: var(--sx-border); margin: 0 3px; }

  /* 表格区 */
  .sheet-scroll { flex: 1; overflow: auto; min-height: 0; }
  .grid { border-collapse: collapse; font-size: 10.5px; min-width: 560px; }
  .grid th, .grid td { border: 1px solid var(--sx-border); padding: 6px 9px; text-align: left; white-space: nowrap; }
  .grid thead th { background: var(--sx-bg-hover); color: var(--sx-text-hint); font-weight: 500; font-size: 9.5px; text-align: center; width: 38px; }
  .grid .title-row td { background: #16a34a; color: #fff; font-size: 14px; font-weight: 800; padding: 10px 12px; }
  .grid .title-row .gen-time { float: right; font-size: 9px; font-weight: 400; opacity: .9; }
  .grid .col-head td { background: #dcfce7; color: #15803d; font-weight: 700; font-size: 10px; }
  .grid td.num { text-align: right; font-variant-numeric: tabular-nums; }
  .grid td.grow { color: #16a34a; font-weight: 600; }
  .grid td.grow.down { color: #dc2626; }
  .grid td.changed { background: #fef3c7; outline: 1px dashed #f59e0b; }
  .share-bar { display: inline-block; width: 46px; height: 5px; border-radius: 3px; background: var(--sx-bg-hover); margin-right: 5px; vertical-align: middle; overflow: hidden; }
  .share-bar i { display: block; height: 100%; border-radius: 3px; }

  /* 双图表 */
  .charts { display: grid; grid-template-columns: 1.15fr 1fr; gap: 10px; padding: 10px; }
  @media (max-width: 900px) { .charts { grid-template-columns: 1fr; } }
  .chart-card { border: 1px solid var(--sx-border); border-radius: 8px; padding: 10px 11px; background: var(--sx-bg-surface); min-width: 0; }
  .chart-card h4 { margin: 0 0 2px; font-size: 11px; display: flex; align-items: center; gap: 6px; }
  .chart-legend { display: flex; gap: 10px; font-size: 8.5px; color: var(--sx-text-hint); }
  .chart-legend i { display: inline-block; width: 7px; height: 7px; border-radius: 50%; margin-right: 3px; vertical-align: middle; }
  .trend-box { display: flex; height: 104px; margin-top: 6px; }
  .trend-y { width: 32px; flex: none; display: flex; flex-direction: column; justify-content: space-between; font-size: 8px; color: var(--sx-text-hint); text-align: right; padding-bottom: 12px; }
  .trend-plot { position: relative; flex: 1; min-width: 0; }
  .trend-plot .gl { position: absolute; left: 0; right: 0; height: 1px; background: var(--sx-border); }
  .trend-plot svg { position: absolute; inset: 0; width: 100%; height: 100%; }
  .trend-x { position: absolute; left: 0; right: 0; bottom: 0; display: flex; justify-content: space-between; font-size: 8px; color: var(--sx-text-hint); }
  .pie-box { display: flex; align-items: center; gap: 14px; margin-top: 8px; height: 104px; }
  .pie-donut { width: 86px; height: 86px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; flex: none; position: relative; }
  .pie-donut::after { content: ''; position: absolute; width: 52px; height: 52px; border-radius: 50%; background: var(--sx-bg-surface); }
  .pie-donut span { position: relative; z-index: 1; font-size: 13px; font-weight: 800; }
  .pie-legend { display: flex; flex-direction: column; gap: 5px; font-size: 9px; flex: 1; min-width: 0; }
  .pie-legend .lr { display: flex; align-items: center; gap: 5px; }
  .pie-legend .lr i { width: 7px; height: 7px; border-radius: 50%; flex: none; }
  .pie-legend .lr .p { margin-left: auto; color: var(--sx-text-hint); }

  /* AI 助手面板 */
  .ai-panel { border-left: 1px solid var(--sx-border); background: var(--sx-bg-surface); display: flex; flex-direction: column; min-height: 0; }
  .ai-head { height: 40px; flex: 0 0 40px; display: flex; align-items: center; gap: 6px; padding: 0 11px; border-bottom: 1px solid var(--sx-border); font-size: 12px; font-weight: 700; }
  .ai-head .on { margin-left: auto; font-size: 9px; color: #059669; display: inline-flex; align-items: center; gap: 4px; font-weight: 400; }
  .ai-head .on i { width: 6px; height: 6px; border-radius: 50%; background: #059669; }
  .ai-head button { width: 20px; height: 20px; border: 0; background: transparent; color: var(--sx-text-hint); display: inline-flex; align-items: center; justify-content: center; }
  .ai-content { flex: 1; overflow-y: auto; padding: 10px; min-height: 0; }
  .ai-hello { display: flex; gap: 8px; align-items: flex-start; }
  .ai-bot { width: 34px; height: 34px; border-radius: 9px; flex: none; background: linear-gradient(135deg, #8b5cf6, #2563eb); display: inline-flex; align-items: center; justify-content: center; color: #fff; }
  .bubble { padding: 8px 10px; border: 1px solid var(--sx-border); border-radius: 8px; font-size: 10px; line-height: 1.55; background: var(--sx-bg-app); }
  .quick-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin: 10px 0; }
  .quick { height: 30px; display: flex; align-items: center; gap: 5px; padding: 0 8px; border: 1px solid var(--sx-border); border-radius: 6px; background: var(--sx-bg-surface); color: var(--sx-text-secondary); font-size: 9.5px; }
  .quick:hover { border-color: #8b5cf6; color: #8b5cf6; }
  .quick svg { color: #8b5cf6; flex: none; }
  .ai-msg { margin: 8px 0; padding: 8px 10px; border-radius: 8px; font-size: 10px; line-height: 1.6; }
  .ai-msg.user { background: var(--sx-brand-soft); margin-left: 24px; }
  .ai-msg.bot { background: var(--sx-bg-app); border: 1px solid var(--sx-border); }
  .summary { border: 1px solid #a7f3d0; border-radius: 8px; background: #f0fdf4; padding: 10px; margin-top: 8px; }
  .summary .sh { display: flex; align-items: center; gap: 5px; color: #059669; font-size: 10.5px; font-weight: 700; }
  .summary .sb { font-size: 9.5px; color: #166534; line-height: 1.65; margin-top: 6px; }
  .summary .sl { display: inline-flex; align-items: center; gap: 3px; color: #059669; font-size: 9px; margin-top: 6px; cursor: pointer; }
  .ai-input { flex: 0 0 auto; padding: 9px 10px; border-top: 1px solid var(--sx-border); }
  .input-box { display: flex; align-items: center; gap: 6px; border: 1px solid var(--sx-border); border-radius: 7px; padding: 5px 6px 5px 9px; }
  .input-box textarea { flex: 1; min-width: 0; height: 38px; resize: none; border: 0; outline: 0; background: transparent; color: var(--sx-text-primary); font: 10px/1.5 inherit; }
  .send-btn { width: 28px; height: 28px; border: 0; border-radius: 6px; background: #059669; color: #fff; display: inline-flex; align-items: center; justify-content: center; flex: none; }
  .ai-foot { display: flex; gap: 6px; margin-top: 7px; }
  .ai-foot button { flex: 1; height: 24px; border: 1px solid var(--sx-border); border-radius: 5px; background: var(--sx-bg-surface); color: var(--sx-text-secondary); font-size: 9px; display: inline-flex; align-items: center; justify-content: center; gap: 3px; }
  .ai-foot button:hover { border-color: #8b5cf6; color: #8b5cf6; }
  .provider-chip { display: inline-flex; align-items: center; gap: 4px; font-size: 8.5px; color: var(--sx-text-hint); padding: 3px 7px; border: 1px dashed var(--sx-border); border-radius: 9px; margin-top: 7px; cursor: pointer; }
  .provider-chip:hover { border-color: #8b5cf6; color: #8b5cf6; }

  /* 底部状态栏 */
  .statusbar { height: 26px; flex: 0 0 26px; display: flex; align-items: center; gap: 14px; padding: 0 12px; border-top: 1px solid var(--sx-border); background: var(--sx-bg-surface); font-size: 9.5px; color: var(--sx-text-secondary); }
  .statusbar .ready { display: inline-flex; align-items: center; gap: 5px; }
  .statusbar .ready i { width: 6px; height: 6px; border-radius: 50%; background: #059669; }
  .statusbar .stats { margin-left: auto; display: flex; gap: 16px; }

  /* 弹窗 */
  .mask { position: fixed; inset: 0; z-index: 50; background: rgba(0,0,0,.38); display: flex; align-items: center; justify-content: center; padding: 20px; }
  .modal { width: 480px; max-width: 100%; max-height: 86vh; overflow-y: auto; border-radius: 11px; background: var(--sx-bg-surface); border: 1px solid var(--sx-border); }
  .modal-head { display: flex; align-items: center; gap: 8px; padding: 14px 16px; border-bottom: 1px solid var(--sx-border); font-size: 13px; font-weight: 700; }
  .modal-head button { margin-left: auto; width: 24px; height: 24px; border: 0; background: transparent; color: var(--sx-text-hint); }
  .modal-body { padding: 14px 16px; }
  .modal-desc { font-size: 10.5px; color: var(--sx-text-secondary); line-height: 1.6; margin: 0 0 12px; }
  .provider-opt { display: flex; gap: 10px; align-items: center; padding: 11px; border: 1px solid var(--sx-border); border-radius: 8px; margin-bottom: 8px; cursor: pointer; }
  .provider-opt:hover { border-color: #8b5cf6; }
  .provider-opt.on { border-color: #8b5cf6; background: var(--sx-brand-soft); }
  .provider-opt .pi { width: 32px; height: 32px; flex: none; border-radius: 8px; color: #fff; display: inline-flex; align-items: center; justify-content: center; }
  .provider-opt .pn { font-size: 11.5px; font-weight: 700; }
  .provider-opt .pd { font-size: 9.5px; color: var(--sx-text-hint); margin-top: 3px; line-height: 1.5; }
  .provider-opt .badge { margin-left: auto; font-size: 8.5px; padding: 2px 7px; border-radius: 8px; background: var(--sx-bg-hover); color: var(--sx-text-hint); white-space: nowrap; }
  .field { margin-top: 10px; }
  .field label { display: block; font-size: 9.5px; color: var(--sx-text-secondary); margin-bottom: 4px; }
  .field input { width: 100%; height: 30px; border: 1px solid var(--sx-border); border-radius: 6px; padding: 0 9px; background: var(--sx-bg-app); color: var(--sx-text-primary); font-size: 10.5px; outline: 0; }
  .diff-table { width: 100%; border-collapse: collapse; font-size: 10px; }
  .diff-table th, .diff-table td { border: 1px solid var(--sx-border); padding: 7px 8px; text-align: left; }
  .diff-table th { background: var(--sx-bg-hover); font-size: 9px; color: var(--sx-text-hint); }
  .diff-before { color: #dc2626; text-decoration: line-through; }
  .diff-after { color: #16a34a; font-weight: 600; }
  .principle-note { display: flex; gap: 7px; padding: 9px 10px; border-radius: 7px; background: #fef3c7; color: #92400e; font-size: 9.5px; line-height: 1.6; margin-top: 12px; }
  .modal-foot { display: flex; gap: 8px; justify-content: flex-end; padding: 12px 16px; border-top: 1px solid var(--sx-border); }
  .btn { height: 30px; padding: 0 13px; border: 1px solid var(--sx-border); border-radius: 6px; background: var(--sx-bg-surface); color: var(--sx-text-secondary); font-size: 10.5px; }
  .btn.primary { background: #059669; color: #fff; border-color: #059669; font-weight: 600; }
  .btn:hover { opacity: .9; }
`
