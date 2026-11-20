/**
 * SheetX 第 18 张 · 单元格格式与高级样式 — 样式
 * 纪律：无 glow / shadow；卡片用 var(--sx-bg-subtle)；提示文字调淡；深色跟随主题。
 */
import { css } from 'lit'

export const fmtStyles = css`
  :host { display:block; height:100%; background:var(--sx-bg-surface); color:var(--sx-text-primary); font-family:'PingFang SC','Microsoft YaHei',sans-serif; font-size:14px; }
  * { box-sizing:border-box; }
  button,input,select { font-family:inherit; font-size:inherit; color:inherit; }
  button { cursor:pointer; }
  .app { display:flex; flex-direction:column; height:100%; overflow:hidden; }

  /* 顶栏 */
  .topbar { height:50px; flex-shrink:0; display:flex; align-items:center; gap:14px; padding:0 18px; border-bottom:1px solid var(--sx-border); background:var(--sx-bg-surface); }
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

  /* 工具栏 */
  .toolbar { height:44px; flex-shrink:0; display:flex; align-items:center; gap:5px; padding:0 14px; border-bottom:1px solid var(--sx-border); background:var(--sx-bg-surface); }
  .tb { height:28px; min-width:28px; padding:0 7px; display:inline-flex; align-items:center; justify-content:center; gap:4px; border:1px solid transparent; border-radius:5px; background:transparent; color:var(--sx-text-secondary); font-size:12.5px; }
  .tb:hover { background:var(--sx-bg-hover); color:var(--sx-text-primary); }
  .tb.active { border-color:var(--sx-brand); color:var(--sx-brand); background:var(--sx-brand-soft); }
  .tb.filled { background:var(--sx-brand-soft); color:var(--sx-brand); }
  .tb-select { height:28px; padding:0 6px; border:1px solid var(--sx-border-input); border-radius:5px; background:var(--sx-bg-surface); font-size:12.5px; }
  .tb-sep { width:1px; height:18px; background:var(--sx-border); margin:0 4px; flex-shrink:0; }
  .color-dot { width:14px; height:3px; border-radius:2px; }

  /* 公式栏 */
  .formula { height:34px; flex-shrink:0; display:flex; align-items:center; border-bottom:1px solid var(--sx-border); background:var(--sx-bg-surface); font-size:12.5px; }
  .name-box { width:80px; height:100%; padding:0 10px; border-right:1px solid var(--sx-border); display:flex; align-items:center; font-weight:600; color:var(--sx-text-secondary); }
  .fx { padding:0 12px; color:var(--sx-text-hint); font-style:italic; }
  .formula input { flex:1; height:100%; border:0; outline:0; padding:0 6px; background:transparent; }

  /* 主体 */
  .body { flex:1; display:flex; min-height:0; background:var(--sx-bg-app); }
  .sheet-area { flex:1; min-width:0; overflow:auto; padding:16px 18px; }

  /* 表格 */
  .grid { border:1px solid var(--sx-border-strong); background:var(--sx-bg-surface); width:100%; border-collapse:collapse; table-layout:fixed; }
  .grid th.colhead { background:var(--sx-grid-header-bg); color:var(--sx-grid-header-text); font-weight:600; font-size:12px; height:26px; border-right:1px solid var(--sx-border); border-bottom:1px solid var(--sx-border); }
  .grid th.rowhead { width:40px; background:var(--sx-grid-header-bg); color:var(--sx-grid-header-text); font-size:11px; font-weight:500; border-right:1px solid var(--sx-border); border-bottom:1px solid var(--sx-border); }
  .grid td.cell { height:34px; padding:0 10px; border-right:1px solid var(--sx-border); border-bottom:1px solid var(--sx-border); cursor:cell; font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; position:relative; }
  .grid td.selected { outline:2px solid var(--sx-brand); outline-offset:-2px; z-index:2; }
  .grid td.title-cell { height:52px; font-size:22px; font-weight:700; color:#fff; background:#2563eb !important; }
  .grid td.title-cell small { float:right; font-size:11px; font-weight:400; opacity:.85; }
  .grid td.total { font-weight:700; }
  .status-pill { display:inline-flex; align-items:center; gap:5px; padding:3px 9px; border-radius:12px; font-size:12px; font-weight:600; }
  .mergemark { position:absolute; right:4px; bottom:2px; font-size:9px; color:#fff; opacity:.75; }

  /* 下方统计卡 */
  .cards { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-top:14px; }
  .stat-card { border:1px solid var(--sx-border); border-radius:8px; background:var(--sx-bg-subtle); padding:13px 16px; min-height:100px; }
  .stat-card .label { display:flex; align-items:center; gap:7px; font-size:12px; color:var(--sx-text-secondary); }
  .stat-card .value { margin-top:7px; font-size:26px; font-weight:700; color:var(--sx-brand); line-height:1.1; }
  .stat-card .sub { margin-top:6px; font-size:11px; color:var(--sx-text-hint); }
  .progress { height:6px; margin-top:9px; border-radius:3px; background:var(--sx-progress-track); overflow:hidden; }
  .progress i { display:block; height:100%; background:var(--sx-brand); }

  /* 工作表标签 */
  .sheet-tabs { height:38px; flex-shrink:0; display:flex; align-items:center; gap:3px; padding:0 16px; border-top:1px solid var(--sx-border); background:var(--sx-bg-surface); }
  .sheet-tab { height:100%; padding:0 14px; border:0; border-bottom:2px solid transparent; background:transparent; color:var(--sx-text-secondary); font-size:12.5px; }
  .sheet-tab.active { color:var(--sx-brand); border-bottom-color:var(--sx-brand); font-weight:600; }
  .sheet-add { width:26px; height:26px; border:0; background:transparent; color:var(--sx-text-hint); border-radius:5px; }
  .sheet-add:hover { background:var(--sx-bg-hover); }
  .statusbar { height:30px; flex-shrink:0; display:flex; align-items:center; gap:18px; padding:0 16px; background:var(--sx-bg-surface); border-top:1px solid var(--sx-border); color:var(--sx-text-hint); font-size:11.5px; }
  .statusbar .right { margin-left:auto; display:flex; align-items:center; gap:12px; }

  /* 右侧格式面板 */
  .fmt-panel { width:300px; flex-shrink:0; display:flex; flex-direction:column; border-left:1px solid var(--sx-border); background:var(--sx-bg-surface); overflow:hidden; }
  .fmt-head { height:48px; flex-shrink:0; display:flex; align-items:center; justify-content:space-between; padding:0 14px; border-bottom:1px solid var(--sx-border); font-size:14px; font-weight:600; }
  .fmt-tabs { height:38px; flex-shrink:0; display:flex; border-bottom:1px solid var(--sx-border); }
  .fmt-tab { flex:1; border:0; border-bottom:2px solid transparent; background:transparent; color:var(--sx-text-secondary); font-size:12.5px; }
  .fmt-tab.active { color:var(--sx-brand); border-bottom-color:var(--sx-brand); font-weight:600; }
  .fmt-body { flex:1; display:flex; min-height:0; overflow:auto; }
  .cat-list { width:104px; flex-shrink:0; border-right:1px solid var(--sx-border); padding:8px 5px; }
  .cat-item { display:block; width:100%; text-align:left; border:0; border-radius:5px; background:transparent; padding:6px 9px; font-size:12px; color:var(--sx-text-secondary); }
  .cat-item:hover { background:var(--sx-bg-hover); }
  .cat-item.active { background:var(--sx-brand-soft); color:var(--sx-brand); font-weight:600; }
  .fmt-form { flex:1; min-width:0; padding:12px; }
  .field-label { display:block; font-size:11.5px; color:var(--sx-text-secondary); margin-bottom:5px; }
  .fmt-input, .fmt-select { width:100%; height:30px; padding:0 8px; border:1px solid var(--sx-border-input); border-radius:6px; background:var(--sx-bg-surface); font-size:12.5px; }
  .form-row { margin-bottom:12px; }
  .preview-box { padding:10px; border:1px solid var(--sx-border); border-radius:6px; background:var(--sx-bg-subtle); font-size:18px; font-weight:600; text-align:right; color:var(--sx-text-primary); margin-bottom:12px; }
  .custom-row { display:flex; gap:6px; }
  .custom-row .fmt-input { flex:1; }
  .btn-add { height:30px; padding:0 10px; border:1px solid var(--sx-border-input); border-radius:6px; background:var(--sx-bg-surface); font-size:12px; }
  .btn-add:hover { background:var(--sx-bg-hover); }
  .fmt-foot { padding:12px; border-top:1px solid var(--sx-border); }
  .btn-apply { width:100%; height:34px; border:1px solid var(--sx-brand); border-radius:6px; background:var(--sx-bg-surface); color:var(--sx-brand); font-size:13px; font-weight:600; }
  .btn-apply:hover { background:var(--sx-brand-soft); }
  .swatches { display:flex; flex-wrap:wrap; gap:6px; }
  .swatch { width:22px; height:22px; border-radius:5px; border:1px solid var(--sx-border-strong); }
  .swatch.active { outline:2px solid var(--sx-brand); outline-offset:1px; }
  .align-row { display:flex; gap:6px; }
  .align-row .tb { flex:1; border:1px solid var(--sx-border-input); }
  .hint { font-size:11px; color:var(--sx-text-hint); line-height:1.6; }
  .divider { height:1px; background:var(--sx-border); margin:12px 0; }
`
