/** SheetX 第 47 张 · AI 公式助手 — 样式 */
import { css } from 'lit'

export const aiFormulaStyles = css`
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
  .work { min-width: 0; display: flex; flex-direction: column; position: relative; overflow: hidden; }

  .tabs, .toolbar, .formula { height: 34px; flex: 0 0 34px; display: flex; align-items: center; gap: 4px; padding: 0 9px; background: var(--sx-bg-surface); border-bottom: 1px solid var(--sx-border); }
  .toolbar { overflow-x: auto; scrollbar-width: none; gap: 2px; }
  .toolbar::-webkit-scrollbar { display: none; }
  .menu-item { padding: 0 9px; height: 24px; border: 0; border-radius: 4px; background: transparent; color: var(--sx-text-secondary); font-size: 10.5px; cursor: pointer; }
  .menu-item:hover, .menu-item.active { background: var(--sx-brand-soft); color: var(--sx-brand); font-weight: 600; }
  .sep { width: 1px; height: 16px; background: var(--sx-border); margin: 0 4px; }
  .tb { height: 24px; min-width: 24px; padding: 0 5px; border: 1px solid transparent; border-radius: 4px; background: transparent; color: var(--sx-text-secondary); display: inline-flex; align-items: center; gap: 4px; font-size: 10px; cursor: pointer; }
  .tb:hover { background: var(--sx-bg-hover); }
  .tb.ai { color: #059669; background: #e7f7ed; }
  .formula { gap: 6px; }
  .addr { width: 66px; height: 23px; border: 1px solid var(--sx-border); border-radius: 4px; background: var(--sx-bg-surface); color: var(--sx-text-primary); font-size: 10.5px; padding: 0 6px; outline: none; }
  .fx { color: var(--sx-text-hint); font-size: 11px; font-style: italic; }
  .formula input.value { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--sx-text-primary); font-size: 11px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }

  .grid-scroll { flex: 1; min-height: 0; overflow: auto; padding: 8px 10px; }
  .grid { border-collapse: separate; border-spacing: 0; table-layout: fixed; width: 100%; font-size: 11px; }
  .grid th, .grid td { border: 1px solid var(--sx-border); height: 28px; padding: 0 9px; text-align: center; }
  .grid thead th { background: #059669; color: #fff; font-weight: 700; }
  .grid td { background: var(--sx-bg-surface); }
  .grid td.num { font-variant-numeric: tabular-nums; }
  .grid td.selected { outline: 2px solid #059669; outline-offset: -2px; background: #fff; }
  .grid td.editable { cursor: text; }
  .grid td input { width: 100%; border: 0; outline: 2px solid #059669; background: #fff; color: #111; font: inherit; text-align: center; }
  .grid tr.total td { background: #ecfdf5; font-weight: 800; color: #065f46; }
  .grid tr.total td:first-child { text-align: right; }

  /* 浮动 AI 公式推荐卡 */
  .float-card {
    position: absolute; left: 50%; top: 46%; transform: translateX(-50%);
    width: min(430px, 68%); background: var(--sx-bg-surface); border: 1px solid var(--sx-border);
    border-radius: 10px; box-shadow: 0 12px 36px rgba(0,0,0,.14); padding: 11px; z-index: 20;
  }
  .float-head { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 800; margin-bottom: 9px; }
  .float-head svg { color: #059669; }
  .float-head .ref { margin-left: auto; width: 24px; height: 24px; }
  .suggest { display: flex; align-items: center; gap: 8px; padding: 7px 9px; border-radius: 6px; cursor: pointer; margin-bottom: 5px; border: 1px solid transparent; }
  .suggest:hover { border-color: #a7f3d0; }
  .suggest.active { background: #f0fdf4; border-color: #a7f3d0; }
  .suggest .ico { width: 17px; height: 17px; color: #94a3b8; flex: none; }
  .suggest.active .ico { color: #059669; }
  .suggest code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 10.5px; font-weight: 700; }
  .suggest .desc { font-size: 9.5px; color: var(--sx-text-hint); margin-top: 2px; }

  /* AI 面板 */
  .ai-panel { border-left: 1px solid var(--sx-border); background: var(--sx-bg-surface); display: flex; flex-direction: column; min-height: 0; }
  .ai-head { height: 42px; flex: 0 0 42px; display: flex; align-items: center; gap: 7px; padding: 0 12px; border-bottom: 1px solid var(--sx-border); font-size: 12px; font-weight: 800; }
  .ai-head svg { color: #059669; }
  .ai-head button { margin-left: auto; }
  .ai-scroll { flex: 1; min-height: 0; overflow: auto; padding: 12px; display: flex; flex-direction: column; gap: 10px; }
  .msg.user { align-self: flex-end; max-width: 88%; background: #059669; color: #fff; border-radius: 10px 10px 2px 10px; padding: 8px 10px; font-size: 11px; line-height: 1.5; }
  .msg.bot { align-self: flex-start; max-width: 96%; width: 100%; background: var(--sx-bg-hover); border-radius: 10px 10px 10px 2px; padding: 10px; font-size: 11px; line-height: 1.6; }
  .formula-card { display: flex; align-items: center; gap: 7px; padding: 7px 9px; border-radius: 6px; background: #f0fdf4; margin-top: 7px; }
  .formula-card code { flex: 1; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 10.5px; font-weight: 700; color: #065f46; word-break: break-all; }
  .formula-card button { border: 0; background: transparent; color: #059669; cursor: pointer; display: inline-flex; }
  .metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; margin-top: 11px; }
  .metric { background: #f0fdf4; border-radius: 8px; padding: 10px; }
  .metric .t { display: flex; align-items: center; gap: 5px; font-size: 10px; color: #065f46; font-weight: 600; }
  .metric b { display: block; margin-top: 5px; color: #059669; font-size: 19px; letter-spacing: -.5px; }
  .metric b small { font-size: 10px; font-weight: 500; margin-left: 2px; }
  .explain { margin-top: 11px; padding: 10px; border: 1px solid var(--sx-border); border-radius: 8px; }
  .explain h4 { margin: 0 0 6px; font-size: 11px; display: flex; align-items: center; gap: 5px; }
  .explain p { margin: 0; font-size: 10.5px; line-height: 1.6; color: var(--sx-text-secondary); }
  .diag { margin-top: 8px; padding: 8px; border-radius: 6px; font-size: 10px; }
  .diag.ok { background: #f0fdf4; color: #065f46; }
  .diag.bad { background: #fff7ed; color: #9a3412; }
  .diag button { margin-left: 6px; border: 0; background: #059669; color: #fff; border-radius: 4px; padding: 2px 6px; font-size: 9px; cursor: pointer; }
  .ai-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 11px; }
  .ai-actions .btn { justify-content: center; padding: 0 5px; }
  .ai-actions .wide { grid-column: 1 / -1; }
  .ai-input { flex: 0 0 auto; border-top: 1px solid var(--sx-border); padding: 9px; }
  .input-row { display: flex; gap: 6px; align-items: center; border: 1px solid var(--sx-border); border-radius: 8px; padding: 5px 5px 5px 9px; }
  .input-row input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--sx-text-primary); font-size: 10.5px; }
  .send { width: 28px; height: 28px; border: 0; border-radius: 6px; background: #059669; color: #fff; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }
  .quick { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 7px; }
  .quick button { border: 1px solid var(--sx-border); background: transparent; border-radius: 10px; padding: 3px 7px; font-size: 9px; color: var(--sx-text-secondary); cursor: pointer; }
  .quick button:hover { background: var(--sx-brand-soft); }

  .statusbar { height: 30px; flex: 0 0 30px; display: flex; align-items: center; gap: 10px; padding: 0 10px; border-top: 1px solid var(--sx-border); background: var(--sx-bg-surface); font-size: 10px; color: var(--sx-text-secondary); }
  .sheet-tab { height: 23px; padding: 0 10px; border: 0; border-bottom: 2px solid #059669; background: transparent; color: #059669; font-weight: 700; font-size: 10.5px; }
  .status-right { margin-left: auto; display: flex; align-items: center; gap: 8px; }
`
