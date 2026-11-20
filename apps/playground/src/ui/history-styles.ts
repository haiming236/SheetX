/**
 * SheetX 第 20 张 · 撤销重做与历史版本管理 — 样式
 * 纪律：无 glow / shadow；卡片用 var(--sx-bg-subtle)；提示文字调淡；深色跟随主题。
 */
import { css } from 'lit'

export const historyStyles = css`
  :host { display:block; height:100%; background:var(--sx-bg-surface); color:var(--sx-text-primary); font-family:'PingFang SC','Microsoft YaHei',sans-serif; font-size:14px; }
  * { box-sizing:border-box; }
  button,input,select { font-family:inherit; font-size:inherit; color:inherit; }
  button { cursor:pointer; }
  .app { display:flex; flex-direction:column; height:100%; overflow:hidden; }

  .topbar { height:50px; flex-shrink:0; display:flex; align-items:center; gap:14px; padding:0 18px; border-bottom:1px solid var(--sx-border); }
  .traffic { display:flex; gap:7px; } .traffic i { width:11px; height:11px; border-radius:50%; }
  .traffic i:nth-child(1){background:#f56c6c} .traffic i:nth-child(2){background:#f7ba2a} .traffic i:nth-child(3){background:#67c23a}
  .brand { display:flex; align-items:center; gap:7px; font-weight:700; font-size:15px; }
  .top-menus { display:flex; gap:2px; }
  .top-menu { border:0; background:transparent; padding:6px 12px; border-radius:6px; color:var(--sx-text-secondary); font-size:13.5px; }
  .top-menu:hover { background:var(--sx-bg-hover); } .top-menu.active { color:var(--sx-brand); font-weight:600; }
  .top-right { margin-left:auto; display:flex; align-items:center; gap:12px; }
  .search { display:flex; align-items:center; gap:7px; width:200px; height:30px; padding:0 11px; border:1px solid var(--sx-border-input); border-radius:7px; background:var(--sx-bg-subtle); color:var(--sx-text-hint); font-size:12.5px; }
  .search input { flex:1; min-width:0; border:0; outline:0; background:transparent; font-size:12.5px; }
  .avatar { width:28px; height:28px; border-radius:50%; background:#64748b; color:#fff; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:600; }

  .toolbar { height:44px; flex-shrink:0; display:flex; align-items:center; gap:5px; padding:0 14px; border-bottom:1px solid var(--sx-border); }
  .tb { height:28px; min-width:28px; padding:0 8px; display:inline-flex; align-items:center; gap:5px; border:1px solid transparent; border-radius:5px; background:transparent; color:var(--sx-text-secondary); font-size:12.5px; }
  .tb:hover { background:var(--sx-bg-hover); color:var(--sx-text-primary); }
  .tb.active { border-color:var(--sx-brand); color:var(--sx-brand); background:var(--sx-brand-soft); }
  .tb:disabled { opacity:.4; cursor:not-allowed; }
  .tb-select { height:28px; padding:0 6px; border:1px solid var(--sx-border-input); border-radius:5px; background:var(--sx-bg-surface); font-size:12.5px; }
  .tb-sep { width:1px; height:18px; background:var(--sx-border); margin:0 5px; }
  .kv { font-size:11px; color:var(--sx-text-hint); } .kv b { color:var(--sx-text-secondary); }

  .body { flex:1; display:flex; min-height:0; background:var(--sx-bg-app); }
  .sheet-side { flex:1; min-width:0; position:relative; overflow:auto; padding:14px 16px; }

  .grid { border-collapse:collapse; table-layout:fixed; background:var(--sx-bg-surface); width:100%; max-width:640px; }
  .grid th { background:var(--sx-grid-header-bg); color:var(--sx-grid-header-text); font-size:12px; font-weight:600; height:28px; border:1px solid var(--sx-border); padding:0 8px; text-align:left; }
  .grid th.rowhead { width:34px; font-size:11px; font-weight:500; text-align:center; }
  .grid td { border:1px solid var(--sx-border); padding:0 8px; height:30px; font-size:12.5px; }
  .grid td.num { text-align:right; font-variant-numeric:tabular-nums; }
  .grid td.total { font-weight:600; background:var(--sx-grid-header-bg); }
  .grid td.changed { background:#dcfce7 !important; color:#15803d; }

  /* 撤销菜单浮层 */
  .undo-menu {
    position:absolute; left:16px; top:6px; width:212px; z-index:8;
    border:1px solid var(--sx-border-strong); border-radius:8px; background:var(--sx-bg-surface); padding:5px;
  }
  .undo-menu button { display:flex; align-items:center; gap:9px; width:100%; border:0; border-radius:5px; background:transparent; padding:8px 9px; font-size:12.5px; text-align:left; color:var(--sx-text-secondary); }
  .undo-menu button:hover:not(:disabled) { background:var(--sx-bg-hover); color:var(--sx-text-primary); }
  .undo-menu button:disabled { opacity:.38; cursor:not-allowed; }
  .undo-menu .shortcut { margin-left:auto; font-size:10.5px; color:var(--sx-text-hint); }
  .undo-menu .sep { height:1px; background:var(--sx-border); margin:4px 2px; }
  .undo-menu .active-item { color:var(--sx-brand); background:var(--sx-brand-soft); }

  /* 右侧历史面板 */
  .panel { width:352px; flex-shrink:0; display:flex; flex-direction:column; border-left:1px solid var(--sx-border); background:var(--sx-bg-surface); overflow:hidden; }
  .panel-head { height:48px; flex-shrink:0; display:flex; align-items:center; justify-content:space-between; padding:0 14px; border-bottom:1px solid var(--sx-border); font-size:14px; font-weight:600; }
  .panel-tabs { height:38px; flex-shrink:0; display:flex; border-bottom:1px solid var(--sx-border); }
  .panel-tab { flex:1; border:0; border-bottom:2px solid transparent; background:transparent; color:var(--sx-text-secondary); font-size:12.5px; }
  .panel-tab.active { color:var(--sx-brand); border-bottom-color:var(--sx-brand); font-weight:600; }
  .panel-body { flex:1; min-height:0; overflow:auto; padding:12px; }

  .timeline { position:relative; padding-left:18px; }
  .timeline::before { content:''; position:absolute; left:5px; top:8px; bottom:8px; width:1px; background:var(--sx-border-strong); }
  .tl-item { position:relative; padding:0 0 14px; }
  .tl-item::before { content:''; position:absolute; left:-16px; top:5px; width:9px; height:9px; border-radius:50%; background:var(--sx-brand); border:2px solid var(--sx-bg-surface); }
  .tl-item.muted::before { background:var(--sx-text-hint); }
  .tl-card { border:1px solid var(--sx-border); border-radius:7px; background:var(--sx-bg-subtle); padding:9px 10px; }
  .tl-card.current { border-color:var(--sx-brand); background:var(--sx-brand-soft); }
  .tl-row { display:flex; align-items:center; gap:7px; }
  .tl-title { font-size:12.5px; font-weight:600; }
  .tl-time { font-size:10.5px; color:var(--sx-text-hint); margin-top:4px; }
  .tl-badge { margin-left:auto; font-size:10px; padding:2px 6px; border-radius:4px; background:var(--sx-brand-soft); color:var(--sx-brand); }
  .btn-xs { height:24px; padding:0 8px; border:1px solid var(--sx-border-input); border-radius:5px; background:var(--sx-bg-surface); font-size:11px; }
  .btn-xs:hover { background:var(--sx-bg-hover); }
  .restore-all { width:100%; height:32px; display:flex; align-items:center; justify-content:center; gap:6px; border:1px solid var(--sx-brand); border-radius:6px; background:var(--sx-bg-surface); color:var(--sx-brand); font-size:12px; font-weight:600; }
  .restore-all:hover { background:var(--sx-brand-soft); }

  .version-card { display:flex; align-items:center; gap:9px; padding:9px; border:1px solid var(--sx-border); border-radius:7px; background:var(--sx-bg-subtle); margin-bottom:8px; }
  .version-card .meta { flex:1; min-width:0; }
  .version-card .meta b { display:block; font-size:12px; }
  .version-card .meta span { font-size:10.5px; color:var(--sx-text-hint); }
  .tag-auto { font-size:10px; padding:1px 5px; border-radius:4px; background:var(--sx-bg-hover); color:var(--sx-text-hint); }
  .safety { margin-top:14px; border:1px solid var(--sx-border); border-radius:7px; padding:10px; background:var(--sx-bg-subtle); }
  .safety b { display:flex; align-items:center; gap:6px; font-size:12px; color:var(--sx-brand); margin-bottom:6px; }
  .safety p { margin:4px 0; font-size:11px; color:var(--sx-text-hint); line-height:1.6; }
  .safety code { font-size:10.5px; color:var(--sx-text-secondary); }

  /* 版本对比弹层 */
  .modal-mask { position:fixed; inset:0; background:rgba(15,23,42,.28); display:flex; align-items:center; justify-content:center; z-index:20; }
  .modal { width:620px; max-height:78vh; overflow:auto; border:1px solid var(--sx-border-strong); border-radius:10px; background:var(--sx-bg-surface); }
  .modal-head { height:44px; display:flex; align-items:center; justify-content:space-between; padding:0 14px; border-bottom:1px solid var(--sx-border); font-size:14px; font-weight:600; }
  .modal-body { padding:14px; }
  .compare-grid { display:grid; grid-template-columns:1fr 38px 1fr; gap:8px; align-items:start; }
  .compare-col h4 { margin:0 0 8px; font-size:12px; color:var(--sx-text-secondary); }
  .compare-arrow { display:flex; align-items:center; justify-content:center; height:100%; color:var(--sx-brand); }
  .mini-table { width:100%; border-collapse:collapse; font-size:11px; }
  .mini-table th { background:var(--sx-grid-header-bg); color:var(--sx-grid-header-text); padding:6px; border:1px solid var(--sx-border); text-align:left; }
  .mini-table td { padding:6px; border:1px solid var(--sx-border); }
  .mini-table td.num { text-align:right; font-variant-numeric:tabular-nums; }
  .mini-table tr.total td { font-weight:600; background:var(--sx-grid-header-bg); }
  .mini-table td.changed { background:#dcfce7; color:#15803d; font-weight:600; }
  .mini-table td.removed { background:#fee2e2; color:#dc2626; }
  .legend { display:flex; gap:14px; margin-top:12px; font-size:11px; color:var(--sx-text-hint); }
  .legend i { display:inline-block; width:9px; height:9px; border-radius:2px; margin-right:5px; vertical-align:middle; }
  .modal-foot { display:flex; justify-content:flex-end; gap:8px; padding:0 14px 14px; }
  .btn { height:32px; padding:0 14px; border:1px solid var(--sx-border-input); border-radius:6px; background:var(--sx-bg-surface); font-size:12.5px; }
  .btn-primary { background:var(--sx-brand); color:#fff; border-color:var(--sx-brand); }
  .btn-primary:hover { background:var(--sx-brand-hover); }

  .sheet-tabs { height:36px; flex-shrink:0; display:flex; align-items:center; gap:3px; padding:0 16px; border-top:1px solid var(--sx-border); }
  .sheet-tab { height:100%; padding:0 14px; border:0; border-bottom:2px solid transparent; background:transparent; color:var(--sx-text-secondary); font-size:12.5px; }
  .sheet-tab.active { color:var(--sx-brand); border-bottom-color:var(--sx-brand); font-weight:600; }
  .statusbar { height:30px; flex-shrink:0; display:flex; align-items:center; gap:18px; padding:0 16px; border-top:1px solid var(--sx-border); color:var(--sx-text-hint); font-size:11.5px; }
  .statusbar .right { margin-left:auto; display:flex; gap:12px; }
`
