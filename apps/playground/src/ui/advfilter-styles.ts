/**
 * SheetX 第 22 张 · 多维数据筛选与高级查询 — 样式
 * 纪律：无 glow / shadow；卡片用 var(--sx-bg-subtle)；提示文字调淡；深色跟随主题。
 */
import { css } from 'lit'

export const advFilterStyles = css`
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

  .toolbar { height:44px; flex-shrink:0; display:flex; align-items:center; gap:4px; padding:0 14px; border-bottom:1px solid var(--sx-border); }
  .tb { height:28px; padding:0 9px; display:inline-flex; align-items:center; gap:5px; border:1px solid transparent; border-radius:5px; background:transparent; color:var(--sx-text-secondary); font-size:12.5px; }
  .tb:hover { background:var(--sx-bg-hover); }
  .tb.active { color:var(--sx-brand); background:var(--sx-brand-soft); border-color:var(--sx-brand); }
  .tb-sep { width:1px; height:18px; background:var(--sx-border); margin:0 4px; }
  .formula { height:34px; flex-shrink:0; display:flex; align-items:center; border-bottom:1px solid var(--sx-border); font-size:12.5px; }
  .name-box { width:70px; height:100%; padding:0 10px; border-right:1px solid var(--sx-border); display:flex; align-items:center; font-weight:600; color:var(--sx-text-secondary); }
  .formula .v { padding:0 12px; }

  .body { flex:1; display:flex; min-height:0; background:var(--sx-bg-app); }
  .sheet-side { flex:1; min-width:0; overflow:auto; padding:12px 14px; }
  .grid { border-collapse:collapse; table-layout:fixed; background:var(--sx-bg-surface); width:100%; }
  .grid th { background:var(--sx-grid-header-bg); color:var(--sx-grid-header-text); font-size:12px; font-weight:600; height:28px; border:1px solid var(--sx-border); padding:0 8px; text-align:left; white-space:nowrap; }
  .grid th.rowhead { width:32px; font-size:11px; font-weight:500; text-align:center; }
  .grid td { border:1px solid var(--sx-border); padding:0 8px; height:29px; font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .grid td.num { text-align:right; font-variant-numeric:tabular-nums; }
  .grid td.dim { color:var(--sx-text-hint); text-decoration:line-through; opacity:.45; }
  .grid tr.total td { font-weight:600; background:var(--sx-grid-header-bg); }
  .status-pill { display:inline-block; padding:2px 8px; border-radius:10px; font-size:10.5px; font-weight:600; }

  /* 中间高级筛选弹窗 */
  .dialog { width:480px; flex-shrink:0; display:flex; flex-direction:column; border-right:1px solid var(--sx-border); background:var(--sx-bg-surface); }
  .dlg-head { height:48px; flex-shrink:0; display:flex; align-items:center; justify-content:space-between; padding:0 14px; border-bottom:1px solid var(--sx-border); font-size:14px; font-weight:600; }
  .dlg-tabs { height:38px; flex-shrink:0; display:flex; border-bottom:1px solid var(--sx-border); }
  .dlg-tab { flex:1; border:0; border-bottom:2px solid transparent; background:transparent; color:var(--sx-text-secondary); font-size:12px; }
  .dlg-tab.active { color:var(--sx-brand); border-bottom-color:var(--sx-brand); font-weight:600; }
  .dlg-body { flex:1; overflow:auto; padding:12px; }

  .group-head { display:flex; align-items:center; gap:8px; margin:4px 0 9px; }
  .group-head b { font-size:12px; }
  .group-head .logic { margin-left:auto; display:inline-flex; border:1px solid var(--sx-border-input); border-radius:5px; overflow:hidden; }
  .group-head .logic button { border:0; background:transparent; padding:3px 8px; font-size:10.5px; color:var(--sx-text-secondary); }
  .group-head .logic button.active { background:var(--sx-brand); color:#fff; }
  .icon-btn { width:24px; height:24px; border:0; border-radius:5px; background:transparent; color:var(--sx-text-hint); display:flex; align-items:center; justify-content:center; }
  .icon-btn:hover { background:var(--sx-bg-hover); color:var(--sx-danger); }

  .cond-row { display:grid; grid-template-columns:16px 1fr 1fr 1.25fr 20px; gap:5px; align-items:center; margin-bottom:6px; }
  .cond-row select, .cond-row input { height:28px; min-width:0; padding:0 6px; border:1px solid var(--sx-border-input); border-radius:5px; background:var(--sx-bg-surface); font-size:11.5px; }
  .cond-row .chk { width:15px; height:15px; accent-color:var(--sx-brand); cursor:pointer; }
  .cond-row.disabled { opacity:.5; }
  .tag-input { display:flex; align-items:center; gap:4px; padding:2px 5px; border:1px solid var(--sx-border-input); border-radius:5px; background:var(--sx-bg-surface); height:28px; }
  .tag-input span { display:inline-flex; align-items:center; gap:3px; padding:2px 5px; border-radius:4px; background:var(--sx-brand-soft); color:var(--sx-brand); font-size:10.5px; white-space:nowrap; }
  .tag-input input { flex:1; min-width:30px; border:0 !important; height:22px; padding:0 !important; }
  .add-cond { border:0; background:transparent; color:var(--sx-brand); font-size:11.5px; padding:6px 0; }
  .divider { height:1px; background:var(--sx-border); margin:12px 0; }
  .field-label { font-size:11.5px; color:var(--sx-text-secondary); margin-bottom:5px; }
  .select { height:30px; padding:0 8px; border:1px solid var(--sx-border-input); border-radius:6px; background:var(--sx-bg-surface); font-size:12px; width:100%; }
  .inline-row { display:flex; align-items:center; gap:8px; }
  .inline-row .select { flex:1; }
  .check-label { display:flex; align-items:center; gap:6px; font-size:11.5px; color:var(--sx-text-secondary); white-space:nowrap; }
  .check-label input { accent-color:var(--sx-brand); }
  .dlg-foot { height:56px; flex-shrink:0; display:flex; align-items:center; justify-content:flex-end; gap:8px; padding:0 12px; border-top:1px solid var(--sx-border); }
  .btn { height:32px; padding:0 13px; border:1px solid var(--sx-border-input); border-radius:6px; background:var(--sx-bg-surface); font-size:12px; }
  .btn-primary { background:var(--sx-brand); border-color:var(--sx-brand); color:#fff; }
  .btn-primary:hover { background:var(--sx-brand-hover); }

  .scheme-item { display:flex; align-items:center; gap:8px; padding:10px; border:1px solid var(--sx-border); border-radius:7px; background:var(--sx-bg-subtle); margin-bottom:7px; cursor:pointer; }
  .scheme-item:hover { border-color:var(--sx-brand); }
  .scheme-item.active { border-color:var(--sx-brand); background:var(--sx-brand-soft); }
  .scheme-item .meta { flex:1; }
  .scheme-item .meta b { font-size:12px; }
  .scheme-item .meta span { font-size:10.5px; color:var(--sx-text-hint); }
  .quick-item { display:flex; align-items:center; gap:8px; padding:9px 10px; border:1px solid var(--sx-border); border-radius:7px; background:var(--sx-bg-subtle); margin-bottom:7px; font-size:12px; cursor:pointer; }
  .quick-item:hover { border-color:var(--sx-brand); }

  /* 右侧筛选面板 */
  .filter-panel { width:240px; flex-shrink:0; display:flex; flex-direction:column; border-left:1px solid var(--sx-border); background:var(--sx-bg-surface); }
  .fp-head { height:48px; flex-shrink:0; display:flex; align-items:center; justify-content:space-between; padding:0 12px; border-bottom:1px solid var(--sx-border); font-size:13.5px; font-weight:600; }
  .fp-body { flex:1; overflow:auto; padding:12px; }
  .facet { margin-bottom:16px; }
  .facet-head { display:flex; align-items:center; justify-content:space-between; font-size:12px; font-weight:600; margin-bottom:8px; }
  .facet-head button { border:0; background:transparent; color:var(--sx-brand); font-size:11px; }
  .facet-row { display:flex; align-items:center; gap:7px; padding:4px 2px; font-size:11.5px; cursor:pointer; color:var(--sx-text-secondary); }
  .facet-row input { accent-color:var(--sx-brand); margin:0; }
  .facet-row .count { margin-left:auto; color:var(--sx-text-hint); font-size:10.5px; }
  .fp-actions { padding:10px 12px; border-top:1px solid var(--sx-border); }
  .fp-actions .btn { width:100%; margin-bottom:7px; }

  .sheet-tabs { height:36px; flex-shrink:0; display:flex; align-items:center; gap:3px; padding:0 16px; border-top:1px solid var(--sx-border); }
  .sheet-tab { height:100%; padding:0 14px; border:0; border-bottom:2px solid transparent; background:transparent; color:var(--sx-text-secondary); font-size:12.5px; }
  .sheet-tab.active { color:var(--sx-brand); border-bottom-color:var(--sx-brand); font-weight:600; }
  .statusbar { height:30px; flex-shrink:0; display:flex; align-items:center; gap:18px; padding:0 16px; border-top:1px solid var(--sx-border); color:var(--sx-text-hint); font-size:11.5px; }
  .statusbar .right { margin-left:auto; display:flex; gap:12px; }
`
