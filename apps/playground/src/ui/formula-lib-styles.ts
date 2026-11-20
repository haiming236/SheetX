/**
 * SheetX 第 19 张 · 公式函数库与公式管理器 — 样式
 * 纪律：无 glow / shadow；卡片用 var(--sx-bg-subtle)；提示文字调淡；深色跟随主题。
 */
import { css } from 'lit'

export const formulaLibStyles = css`
  :host { display:block; height:100%; background:var(--sx-bg-surface); color:var(--sx-text-primary); font-family:'PingFang SC','Microsoft YaHei',sans-serif; font-size:14px; }
  * { box-sizing:border-box; }
  button,input,select { font-family:inherit; font-size:inherit; color:inherit; }
  button { cursor:pointer; }
  .app { display:flex; flex-direction:column; height:100%; overflow:hidden; }

  /* 顶栏 */
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

  /* 工具栏 */
  .toolbar { height:66px; flex-shrink:0; display:flex; align-items:center; gap:3px; padding:0 14px; border-bottom:1px solid var(--sx-border); }
  .tool { min-width:62px; height:52px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; border:0; border-radius:6px; background:transparent; color:var(--sx-text-secondary); font-size:11px; padding:0 6px; }
  .tool:hover { background:var(--sx-bg-hover); color:var(--sx-text-primary); }
  .tool .badge { position:relative; }
  .tool .badge i { position:absolute; right:-6px; top:-6px; font-style:normal; font-size:9px; color:var(--sx-brand); }
  .tool-sep { width:1px; height:30px; background:var(--sx-border); margin:0 5px; }

  /* 公式栏 */
  .formula { height:36px; flex-shrink:0; display:flex; align-items:center; border-bottom:1px solid var(--sx-border); font-size:12.5px; }
  .name-box { width:80px; height:100%; padding:0 10px; border-right:1px solid var(--sx-border); display:flex; align-items:center; font-weight:600; color:var(--sx-text-secondary); }
  .fx { padding:0 12px; color:var(--sx-text-hint); font-style:italic; }
  .formula input { flex:1; height:100%; border:0; outline:0; padding:0 6px; background:transparent; color:var(--sx-text-primary); }
  .formula .eval { padding:0 14px; font-size:12px; color:var(--sx-text-hint); border-left:1px solid var(--sx-border); min-width:110px; text-align:right; }

  /* 主体 */
  .body { flex:1; display:flex; min-height:0; background:var(--sx-bg-app); }
  .sheet-side { flex:1; min-width:0; display:flex; flex-direction:column; position:relative; overflow:hidden; }
  .table-scroll { flex:1; overflow:auto; padding:14px 16px; }

  .grid { border-collapse:collapse; table-layout:fixed; background:var(--sx-bg-surface); width:100%; max-width:620px; }
  .grid th { background:var(--sx-grid-header-bg); color:var(--sx-grid-header-text); font-size:12px; font-weight:600; height:28px; border:1px solid var(--sx-border); padding:0 8px; text-align:left; }
  .grid th.rowhead { width:34px; font-size:11px; font-weight:500; text-align:center; }
  .grid td { border:1px solid var(--sx-border); padding:0 8px; height:30px; font-size:12.5px; cursor:cell; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .grid td.num { text-align:right; font-variant-numeric:tabular-nums; }
  .grid td.total-row { font-weight:600; background:var(--sx-grid-header-bg); }
  .grid td.formula-cell { font-family:Consolas,'SF Mono',monospace; font-size:11px; color:var(--sx-brand); }
  .grid td.selected { outline:2px solid var(--sx-brand); outline-offset:-2px; }

  /* 函数参数浮层 */
  .arg-pop {
    position:absolute; left:20px; bottom:56px; width:520px; z-index:6;
    border:1px solid var(--sx-border-strong); border-radius:8px; background:var(--sx-bg-surface);
  }
  .arg-head { height:36px; display:flex; align-items:center; justify-content:space-between; padding:0 12px; border-bottom:1px solid var(--sx-border); font-size:13px; font-weight:600; }
  .arg-body { padding:10px 12px; }
  .arg-row { display:flex; align-items:center; gap:8px; margin-bottom:7px; font-size:12px; }
  .arg-row label { width:84px; flex-shrink:0; color:var(--sx-text-secondary); }
  .arg-row input { flex:1; height:28px; padding:0 8px; border:1px solid var(--sx-border-input); border-radius:5px; background:var(--sx-bg-surface); font-size:12px; }
  .arg-row .pick { width:28px; height:28px; border:1px solid var(--sx-border-input); border-radius:5px; background:var(--sx-bg-surface); display:flex; align-items:center; justify-content:center; }
  .arg-row .hint { width:150px; flex-shrink:0; color:var(--sx-text-hint); font-size:11px; }
  .arg-foot { display:flex; justify-content:space-between; align-items:center; padding:8px 12px; border-top:1px solid var(--sx-border); }
  .link-btn { border:0; background:transparent; color:var(--sx-brand); font-size:11.5px; padding:0; }
  .arg-actions { display:flex; gap:8px; }
  .btn-sm { height:28px; padding:0 12px; border:1px solid var(--sx-border-input); border-radius:5px; background:var(--sx-bg-surface); font-size:12px; }
  .btn-primary { background:var(--sx-brand); color:#fff; border-color:var(--sx-brand); }
  .btn-primary:hover { background:var(--sx-brand-hover); }

  /* 右侧函数库 */
  .lib { width:500px; flex-shrink:0; display:flex; flex-direction:column; border-left:1px solid var(--sx-border); background:var(--sx-bg-surface); overflow:hidden; }
  .lib-head { height:46px; flex-shrink:0; display:flex; align-items:center; justify-content:space-between; padding:0 14px; border-bottom:1px solid var(--sx-border); font-size:14px; font-weight:600; }
  .lib-search { padding:10px 12px; border-bottom:1px solid var(--sx-border); }
  .lib-search input { width:100%; height:32px; padding:0 10px; border:1px solid var(--sx-border-input); border-radius:6px; background:var(--sx-bg-subtle); font-size:12.5px; outline:0; }
  .lib-body { flex:1; display:flex; min-height:0; }
  .cat-col { width:118px; flex-shrink:0; border-right:1px solid var(--sx-border); padding:7px 5px; overflow:auto; }
  .cat { width:100%; display:flex; align-items:center; gap:6px; border:0; border-radius:5px; background:transparent; padding:7px 8px; font-size:11.5px; color:var(--sx-text-secondary); text-align:left; }
  .cat:hover { background:var(--sx-bg-hover); }
  .cat.active { background:var(--sx-brand-soft); color:var(--sx-brand); font-weight:600; }
  .fn-col { width:126px; flex-shrink:0; border-right:1px solid var(--sx-border); padding:6px 4px; overflow:auto; }
  .fn { display:block; width:100%; border:0; border-radius:5px; background:transparent; padding:6px 9px; font-size:12px; text-align:left; color:var(--sx-text-secondary); }
  .fn:hover { background:var(--sx-bg-hover); }
  .fn.active { background:var(--sx-brand-soft); color:var(--sx-brand); font-weight:600; }
  .detail { flex:1; min-width:0; padding:12px; overflow:auto; }
  .detail h2 { margin:0 0 6px; font-size:19px; font-weight:700; }
  .detail .desc { font-size:12.5px; color:var(--sx-text-secondary); line-height:1.6; }
  .detail h4 { margin:14px 0 6px; font-size:12px; color:var(--sx-brand); font-weight:600; }
  .syntax { padding:9px 10px; border:1px solid var(--sx-border); border-radius:6px; background:var(--sx-bg-subtle); font-family:Consolas,'SF Mono',monospace; font-size:11.5px; line-height:1.5; word-break:break-all; }
  .param { padding:6px 0; border-bottom:1px solid var(--sx-border); font-size:11.5px; }
  .param b { color:var(--sx-text-primary); } .param span { color:var(--sx-text-hint); margin-left:6px; }
  .example-box { border:1px solid var(--sx-border); border-radius:6px; padding:10px; background:var(--sx-bg-subtle); }
  .mini-table { display:flex; align-items:center; gap:8px; margin-top:8px; }
  .mini-grid { border:1px solid var(--sx-border-strong); font-size:10px; }
  .mini-grid div { display:flex; border-bottom:1px solid var(--sx-border); }
  .mini-grid div:last-child { border-bottom:0; }
  .mini-grid span { width:22px; height:19px; display:flex; align-items:center; justify-content:center; border-right:1px solid var(--sx-border); }
  .mini-grid span:last-child { border-right:0; }
  .mini-result { padding:6px 8px; border:1px solid var(--sx-border-strong); border-radius:4px; font-family:monospace; font-size:11px; }
  .tip { margin-top:14px; padding:10px; border:1px solid var(--sx-border); border-radius:6px; background:var(--sx-bg-subtle); font-size:11.5px; color:var(--sx-text-secondary); line-height:1.6; }
  .tip b { display:flex; align-items:center; gap:5px; color:var(--sx-brand); margin-bottom:4px; }

  /* 浮层：名称管理器 / 公式审核 */
  .modal-mask { position:fixed; inset:0; background:rgba(15,23,42,.28); display:flex; align-items:center; justify-content:center; z-index:20; }
  .modal { width:560px; max-height:70vh; overflow:auto; border:1px solid var(--sx-border-strong); border-radius:10px; background:var(--sx-bg-surface); }
  .modal-head { height:44px; display:flex; align-items:center; justify-content:space-between; padding:0 14px; border-bottom:1px solid var(--sx-border); font-weight:600; font-size:14px; }
  .modal-body { padding:12px 14px; }
  .modal table { width:100%; border-collapse:collapse; font-size:12px; }
  .modal th, .modal td { border:1px solid var(--sx-border); padding:7px 9px; text-align:left; }
  .modal th { background:var(--sx-grid-header-bg); color:var(--sx-grid-header-text); }
  .code { font-family:Consolas,'SF Mono',monospace; font-size:11px; }
  .err-tag { display:inline-block; padding:2px 7px; border-radius:4px; font-size:10.5px; font-weight:600; }
  .err-tag.error { background:#fee2e2; color:#dc2626; }
  .err-tag.ok { background:#dcfce7; color:#16a34a; }

  /* 底部 */
  .sheet-tabs { height:36px; flex-shrink:0; display:flex; align-items:center; gap:3px; padding:0 16px; border-top:1px solid var(--sx-border); }
  .sheet-tab { height:100%; padding:0 14px; border:0; border-bottom:2px solid transparent; background:transparent; color:var(--sx-text-secondary); font-size:12.5px; }
  .sheet-tab.active { color:var(--sx-brand); border-bottom-color:var(--sx-brand); font-weight:600; }
  .statusbar { height:30px; flex-shrink:0; display:flex; align-items:center; gap:18px; padding:0 16px; border-top:1px solid var(--sx-border); color:var(--sx-text-hint); font-size:11.5px; }
  .statusbar .right { margin-left:auto; display:flex; gap:12px; }
`
