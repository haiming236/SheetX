/**
 * SheetX 第 23 张 · 多视图与视图管理 — 样式
 * 纪律：无 glow / shadow；卡片用 var(--sx-bg-subtle)；提示文字调淡；深色跟随主题。
 */
import { css } from 'lit'

export const multiViewStyles = css`
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

  .toolbar { height:48px; flex-shrink:0; display:flex; align-items:center; gap:6px; padding:0 14px; border-bottom:1px solid var(--sx-border); }
  .tb { height:30px; padding:0 9px; display:inline-flex; align-items:center; gap:6px; border:1px solid transparent; border-radius:5px; background:transparent; color:var(--sx-text-secondary); font-size:12.5px; }
  .tb:hover { background:var(--sx-bg-hover); }
  .tb.border { border-color:var(--sx-border-input); background:var(--sx-bg-surface); }
  .tb.primary { background:var(--sx-brand); color:#fff; border-color:var(--sx-brand); }
  .tb.primary:hover { background:var(--sx-brand-hover); }
  .tb-sep { width:1px; height:18px; background:var(--sx-border); margin:0 4px; }
  .tb.right { margin-left:auto; }

  .body { flex:1; display:flex; min-height:0; background:var(--sx-bg-app); }
  .sidebar { width:178px; flex-shrink:0; border-right:1px solid var(--sx-border); background:var(--sx-bg-surface); padding:12px 8px; overflow:auto; }
  .side-title { font-size:11px; color:var(--sx-text-hint); padding:0 8px; margin:12px 0 6px; }
  .side-title:first-child { margin-top:0; }
  .side-item { display:flex; align-items:center; gap:8px; width:100%; border:0; border-radius:6px; background:transparent; padding:8px; font-size:12px; color:var(--sx-text-secondary); text-align:left; }
  .side-item:hover { background:var(--sx-bg-hover); }
  .side-item.active { background:var(--sx-brand-soft); color:var(--sx-brand); font-weight:600; }
  .side-item .star { margin-left:auto; color:#f59e0b; }
  .side-div { height:1px; background:var(--sx-border); margin:12px 6px; }

  .main { flex:1; min-width:0; display:flex; flex-direction:column; overflow:hidden; }
  .tabs { height:44px; flex-shrink:0; display:flex; align-items:center; gap:6px; padding:0 14px; border-bottom:1px solid var(--sx-border); background:var(--sx-bg-surface); }
  .view-tab { height:30px; padding:0 14px; display:flex; align-items:center; gap:6px; border:1px solid transparent; border-radius:6px; background:transparent; color:var(--sx-text-secondary); font-size:12.5px; }
  .view-tab:hover { background:var(--sx-bg-hover); }
  .view-tab.active { color:var(--sx-brand); border-color:var(--sx-brand); background:var(--sx-brand-soft); font-weight:600; }
  .content { flex:1; overflow:auto; padding:12px 14px; }

  .panel { border:1px solid var(--sx-border); border-radius:8px; background:var(--sx-bg-surface); margin-bottom:12px; }
  .panel-head { height:40px; display:flex; align-items:center; gap:8px; padding:0 12px; border-bottom:1px solid var(--sx-border); font-size:12.5px; font-weight:600; }
  .panel-head .right { margin-left:auto; display:flex; align-items:center; gap:8px; font-size:11px; color:var(--sx-text-hint); font-weight:400; }
  .panel-body { padding:10px 12px; }

  .grid { width:100%; max-width:720px; border-collapse:collapse; font-size:12px; table-layout:fixed; }
  .grid th:first-child, .grid td:first-child { width:40px; }
  .grid th { background:var(--sx-grid-header-bg); color:var(--sx-grid-header-text); font-weight:600; padding:7px 9px; border:1px solid var(--sx-border); text-align:left; }
  .grid td { padding:7px 9px; border:1px solid var(--sx-border); }
  .grid td.num { text-align:right; font-variant-numeric:tabular-nums; }
  .grid .foot td { font-weight:600; background:var(--sx-grid-header-bg); }
  .status-pill { display:inline-block; padding:2px 8px; border-radius:10px; font-size:10.5px; font-weight:600; }

  .card-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(var(--card-w,200px),1fr)); gap:10px; }
  .order-card { position:relative; border:1px solid var(--sx-border); border-radius:8px; background:var(--sx-bg-subtle); padding:10px; display:flex; flex-direction:column; gap:7px; }
  .order-card .thumb { height:52px; border-radius:6px; background:linear-gradient(135deg,#dbeafe,#eff6ff); display:flex; align-items:center; justify-content:center; font-size:26px; }
  .order-card .title { font-size:12.5px; font-weight:600; }
  .order-card .amount { font-size:16px; font-weight:700; color:var(--sx-brand); }
  .order-card .meta { font-size:10.5px; color:var(--sx-text-hint); display:flex; align-items:center; justify-content:space-between; }
  .order-card .more { position:absolute; right:7px; top:7px; border:0; background:transparent; color:var(--sx-text-hint); }

  .kanban { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; align-items:start; }
  .kanban-col { border:1px solid var(--sx-border); border-radius:8px; overflow:hidden; }
  .kanban-head { display:flex; align-items:center; justify-content:space-between; padding:8px 10px; font-size:12px; font-weight:600; border-bottom:1px solid var(--sx-border); }
  .kanban-head .count { padding:1px 6px; border-radius:9px; background:var(--sx-bg-hover); color:var(--sx-text-secondary); font-size:10px; }
  .kanban-body { padding:8px; display:flex; flex-direction:column; gap:7px; min-height:90px; }
  .kanban-card { border:1px solid var(--sx-border); border-radius:6px; padding:8px; background:var(--sx-bg-surface); font-size:11.5px; }
  .kanban-card .name { font-weight:600; }
  .kanban-card .amount { color:var(--sx-brand); font-weight:600; margin-top:3px; }
  .kanban-card .owner { margin-top:5px; font-size:10px; color:var(--sx-text-hint); }
  .add-card { border:1px dashed var(--sx-border-strong); border-radius:6px; background:transparent; padding:7px; font-size:11px; color:var(--sx-text-hint); }

  .group-table .group-row td { cursor:pointer; }
  .group-table .caret { display:inline-block; width:12px; color:var(--sx-text-hint); }
  .group-table .child td { background:var(--sx-bg-subtle); color:var(--sx-text-secondary); font-size:11.5px; }
  .group-table .sum td { font-weight:600; background:var(--sx-grid-header-bg); }

  .view-form { display:flex; flex-direction:column; gap:12px; padding:4px 0; }
  .form-row label { display:block; font-size:11.5px; color:var(--sx-text-secondary); margin-bottom:5px; }
  .form-row input, .form-row select { width:100%; height:32px; padding:0 9px; border:1px solid var(--sx-border-input); border-radius:6px; background:var(--sx-bg-surface); font-size:12.5px; }
  .check-line { display:flex; align-items:center; gap:7px; font-size:12px; color:var(--sx-text-secondary); }
  .check-line input { accent-color:var(--sx-brand); }
  .modal-mask { position:fixed; inset:0; background:rgba(15,23,42,.28); display:flex; align-items:center; justify-content:center; z-index:20; }
  .modal { width:460px; border:1px solid var(--sx-border-strong); border-radius:10px; background:var(--sx-bg-surface); }
  .modal-head { height:44px; display:flex; align-items:center; justify-content:space-between; padding:0 14px; border-bottom:1px solid var(--sx-border); font-size:14px; font-weight:600; }
  .modal-body { padding:14px; }
  .modal-foot { display:flex; justify-content:flex-end; gap:8px; padding:0 14px 14px; }
  .btn { height:32px; padding:0 14px; border:1px solid var(--sx-border-input); border-radius:6px; background:var(--sx-bg-surface); font-size:12.5px; }
  .btn-primary { background:var(--sx-brand); border-color:var(--sx-brand); color:#fff; }

  .sheet-tabs { height:36px; flex-shrink:0; display:flex; align-items:center; gap:3px; padding:0 16px; border-top:1px solid var(--sx-border); }
  .sheet-tab { height:100%; padding:0 14px; border:0; border-bottom:2px solid transparent; background:transparent; color:var(--sx-text-secondary); font-size:12.5px; }
  .sheet-tab.active { color:var(--sx-brand); border-bottom-color:var(--sx-brand); font-weight:600; }
  .statusbar { height:30px; flex-shrink:0; display:flex; align-items:center; gap:18px; padding:0 16px; border-top:1px solid var(--sx-border); color:var(--sx-text-hint); font-size:11.5px; }
  .statusbar .right { margin-left:auto; display:flex; gap:12px; }
`
