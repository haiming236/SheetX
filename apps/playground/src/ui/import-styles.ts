/**
 * SheetX 第 21 张 · 大数据导入与批量处理 — 样式
 * 纪律：无 glow / shadow；卡片用 var(--sx-bg-subtle)；提示文字调淡；深色跟随主题。
 */
import { css } from 'lit'

export const importStyles = css`
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
  .tb:hover { background:var(--sx-bg-hover); }
  .tb-select { height:28px; padding:0 6px; border:1px solid var(--sx-border-input); border-radius:5px; background:var(--sx-bg-surface); font-size:12.5px; }
  .tb-sep { width:1px; height:18px; background:var(--sx-border); margin:0 5px; }

  .body { flex:1; display:flex; min-height:0; background:var(--sx-bg-app); }
  .left { flex:1; min-width:0; display:flex; flex-direction:column; overflow:hidden; }
  .formula { height:34px; flex-shrink:0; display:flex; align-items:center; border-bottom:1px solid var(--sx-border); font-size:12.5px; }
  .name-box { width:70px; height:100%; padding:0 10px; border-right:1px solid var(--sx-border); display:flex; align-items:center; font-weight:600; color:var(--sx-text-secondary); }
  .formula .hint { padding:0 12px; color:var(--sx-text-hint); }
  .table-area { flex:1; overflow:auto; padding:12px 14px; }

  .grid { border-collapse:collapse; table-layout:fixed; background:var(--sx-bg-surface); width:100%; max-width:760px; }
  .grid th { background:var(--sx-grid-header-bg); color:var(--sx-grid-header-text); font-size:12px; font-weight:600; height:28px; border:1px solid var(--sx-border); padding:0 8px; text-align:left; }
  .grid th.rowhead { width:32px; font-size:11px; font-weight:500; text-align:center; }
  .grid td { border:1px solid var(--sx-border); padding:0 8px; height:29px; font-size:12.5px; }
  .grid td.num { text-align:right; font-variant-numeric:tabular-nums; }

  /* 中间导入向导 */
  .wizard { width:470px; flex-shrink:0; display:flex; flex-direction:column; border-right:1px solid var(--sx-border); background:var(--sx-bg-surface); }
  .wiz-head { height:52px; flex-shrink:0; display:flex; align-items:center; justify-content:space-between; padding:0 14px; border-bottom:1px solid var(--sx-border); font-size:14px; font-weight:600; }
  .wiz-body { flex:1; overflow:auto; padding:14px; }
  .steps { display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; }
  .step { display:flex; flex-direction:column; align-items:center; gap:5px; flex:1; font-size:11px; color:var(--sx-text-hint); }
  .step .num { width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:1px solid var(--sx-border-strong); background:var(--sx-bg-surface); font-size:12px; }
  .step.active { color:var(--sx-brand); font-weight:600; }
  .step.active .num { background:var(--sx-brand); border-color:var(--sx-brand); color:#fff; }
  .step.done .num { background:var(--sx-success-soft); border-color:var(--sx-success); color:var(--sx-success); }
  .step-line { height:1px; background:var(--sx-border-strong); flex:1; margin:0 4px; margin-top:-14px; }

  .source-row { display:flex; gap:8px; }
  .file-types { width:120px; flex-shrink:0; border-right:1px solid var(--sx-border); padding-right:8px; }
  .file-type { display:flex; align-items:center; gap:7px; width:100%; border:0; border-radius:6px; background:transparent; padding:8px; font-size:12px; color:var(--sx-text-secondary); text-align:left; }
  .file-type:hover { background:var(--sx-bg-hover); }
  .file-type.active { background:var(--sx-brand-soft); color:var(--sx-brand); font-weight:600; }
  .file-card { flex:1; min-width:0; }
  .file-info { display:flex; align-items:center; gap:9px; padding:10px; border:1px solid var(--sx-border); border-radius:7px; background:var(--sx-bg-subtle); }
  .file-info .name { font-size:12px; font-weight:600; }
  .file-info .size { font-size:10.5px; color:var(--sx-text-hint); margin-top:3px; }
  .btn-sm { height:28px; padding:0 10px; border:1px solid var(--sx-border-input); border-radius:5px; background:var(--sx-bg-surface); font-size:11.5px; white-space:nowrap; }
  .btn-sm:hover { background:var(--sx-bg-hover); }

  .section-title { font-size:12px; font-weight:600; margin:16px 0 8px; }
  .map-table { width:100%; border-collapse:collapse; font-size:11.5px; }
  .map-table th { background:var(--sx-grid-header-bg); color:var(--sx-grid-header-text); padding:6px 8px; border:1px solid var(--sx-border); text-align:left; font-weight:600; }
  .map-table td { padding:5px 6px; border:1px solid var(--sx-border); }
  .map-table select { width:100%; height:26px; padding:0 5px; border:1px solid var(--sx-border-input); border-radius:4px; background:var(--sx-bg-surface); font-size:11.5px; }
  .type-tag { font-size:10px; color:var(--sx-text-hint); }
  .link-add { border:0; background:transparent; color:var(--sx-brand); font-size:11.5px; padding:8px 0 0; }
  .check-row { display:flex; align-items:center; gap:7px; margin-top:12px; font-size:12px; color:var(--sx-text-secondary); }
  .check-row input { accent-color:var(--sx-brand); }
  .preview-link { margin-left:auto; display:inline-flex; align-items:center; gap:4px; border:0; background:transparent; color:var(--sx-brand); font-size:11.5px; }
  .wiz-foot { height:56px; flex-shrink:0; display:flex; align-items:center; justify-content:flex-end; gap:8px; padding:0 14px; border-top:1px solid var(--sx-border); }
  .btn { height:32px; padding:0 14px; border:1px solid var(--sx-border-input); border-radius:6px; background:var(--sx-bg-surface); font-size:12.5px; }
  .btn-primary { background:var(--sx-brand); border-color:var(--sx-brand); color:#fff; }
  .btn-primary:hover { background:var(--sx-brand-hover); }

  /* 数据预览浮层 */
  .preview-pop { margin-top:10px; border:1px solid var(--sx-border); border-radius:7px; background:var(--sx-bg-subtle); padding:9px; }
  .preview-pop table { width:100%; border-collapse:collapse; font-size:11px; }
  .preview-pop th, .preview-pop td { border:1px solid var(--sx-border); padding:5px 7px; text-align:left; }
  .preview-pop th { background:var(--sx-grid-header-bg); color:var(--sx-grid-header-text); }

  /* 右侧进度面板 */
  .progress-panel { width:330px; flex-shrink:0; display:flex; flex-direction:column; border-left:1px solid var(--sx-border); background:var(--sx-bg-surface); overflow:hidden; }
  .pp-head { height:48px; flex-shrink:0; display:flex; align-items:center; justify-content:space-between; padding:0 14px; border-bottom:1px solid var(--sx-border); font-size:14px; font-weight:600; }
  .pp-body { flex:1; overflow:auto; padding:14px; }
  .ring-row { display:flex; align-items:center; gap:16px; }
  .ring { width:96px; height:96px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; position:relative; }
  .ring span { position:absolute; font-size:17px; font-weight:700; }
  .ring-meta .title { font-size:12.5px; font-weight:600; }
  .ring-meta .count { margin-top:6px; font-size:11.5px; color:var(--sx-text-secondary); }
  .ring-meta .eta { margin-top:4px; font-size:11px; color:var(--sx-text-hint); }
  .bar { height:6px; border-radius:3px; background:var(--sx-progress-track); margin:16px 0 12px; overflow:hidden; }
  .bar i { display:block; height:100%; background:var(--sx-brand); transition:width .2s; }
  .stats { display:flex; flex-direction:column; gap:8px; padding:11px; border:1px solid var(--sx-border); border-radius:7px; background:var(--sx-bg-subtle); }
  .stat-row { display:flex; align-items:center; gap:8px; font-size:12px; }
  .stat-row .val { margin-left:auto; color:var(--sx-text-hint); font-size:11.5px; }
  .detail-link { margin-top:10px; border:0; background:transparent; color:var(--sx-brand); font-size:11.5px; padding:0; }
  .divider { height:1px; background:var(--sx-border); margin:16px 0; }
  .result-card { display:flex; align-items:center; gap:9px; padding:11px; border:1px solid var(--sx-border); border-radius:7px; background:var(--sx-bg-subtle); }
  .result-card b { display:block; font-size:12.5px; }
  .result-card span { font-size:11px; color:var(--sx-text-hint); }
  .result-actions { display:flex; gap:8px; margin-top:10px; }
  .result-actions .btn { flex:1; }
  .log-title { font-size:12px; font-weight:600; margin:16px 0 8px; }
  .log-list { display:flex; flex-direction:column; gap:8px; }
  .log-item { display:flex; gap:8px; font-size:11px; color:var(--sx-text-secondary); }
  .log-item time { color:var(--sx-text-hint); flex-shrink:0; font-variant-numeric:tabular-nums; }
  .log-item i { width:6px; height:6px; border-radius:50%; background:var(--sx-success); margin-top:5px; flex-shrink:0; }
  .log-item.error i { background:var(--sx-danger); }
  .log-item.warn i { background:#f59e0b; }

  /* 错误行定位弹层 */
  .modal-mask { position:fixed; inset:0; background:rgba(15,23,42,.28); display:flex; align-items:center; justify-content:center; z-index:20; }
  .modal { width:620px; max-height:76vh; overflow:auto; border:1px solid var(--sx-border-strong); border-radius:10px; background:var(--sx-bg-surface); }
  .modal-head { height:44px; display:flex; align-items:center; justify-content:space-between; padding:0 14px; border-bottom:1px solid var(--sx-border); font-size:14px; font-weight:600; }
  .modal-body { padding:14px; }
  .modal table { width:100%; border-collapse:collapse; font-size:11.5px; }
  .modal th, .modal td { border:1px solid var(--sx-border); padding:7px 9px; text-align:left; }
  .modal th { background:var(--sx-grid-header-bg); color:var(--sx-grid-header-text); }
  .sev { padding:2px 7px; border-radius:4px; font-size:10px; font-weight:600; }
  .sev.error { background:#fee2e2; color:#dc2626; }
  .sev.warning { background:#fef9c3; color:#a16207; }
  .jump { border:0; background:transparent; color:var(--sx-brand); font-size:11px; padding:0; }
  .modal-foot { display:flex; justify-content:flex-end; padding:0 14px 14px; }

  .sheet-tabs { height:36px; flex-shrink:0; display:flex; align-items:center; gap:3px; padding:0 16px; border-top:1px solid var(--sx-border); }
  .sheet-tab { height:100%; padding:0 14px; border:0; border-bottom:2px solid transparent; background:transparent; color:var(--sx-text-secondary); font-size:12.5px; }
  .sheet-tab.active { color:var(--sx-brand); border-bottom-color:var(--sx-brand); font-weight:600; }
  .statusbar { height:30px; flex-shrink:0; display:flex; align-items:center; gap:18px; padding:0 16px; border-top:1px solid var(--sx-border); color:var(--sx-text-hint); font-size:11.5px; }
  .statusbar .right { margin-left:auto; display:flex; gap:12px; }
`
