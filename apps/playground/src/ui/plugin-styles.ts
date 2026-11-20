/**
 * SheetX 第 24 张 · 插件中心与扩展生态 — 样式
 * 纪律：无 glow / shadow；卡片背景用 var(--sx-bg-subtle)；提示文字调淡；深色跟随主题。
 */
import { css } from 'lit'

export const pluginStyles = css`
  :host { display:block; height:100%; background:var(--sx-bg-app); color:var(--sx-text-primary); font-family:'PingFang SC','Microsoft YaHei',sans-serif; font-size:13px; }
  * { box-sizing:border-box; }
  button,input,select { font-family:inherit; font-size:inherit; color:inherit; }
  button { cursor:pointer; }
  .app { display:flex; flex-direction:column; height:100%; overflow:hidden; }

  /* ---------- 顶栏 ---------- */
  .topbar { height:50px; flex:0 0 auto; display:flex; align-items:center; gap:14px; padding:0 16px; border-bottom:1px solid var(--sx-border); background:var(--sx-bg-surface); }
  .traffic { display:flex; gap:7px; flex:none; }
  .traffic i { width:11px; height:11px; border-radius:50%; }
  .traffic i:nth-child(1){background:#f56c6c} .traffic i:nth-child(2){background:#f7ba2a} .traffic i:nth-child(3){background:#67c23a}
  .brand { display:flex; align-items:center; gap:7px; font-weight:700; font-size:14px; flex:none; }
  .top-menus { display:flex; gap:1px; }
  .top-menu { border:0; background:transparent; padding:6px 10px; border-radius:6px; color:var(--sx-text-secondary); font-size:12.5px; }
  .top-menu:hover { background:var(--sx-bg-hover); }
  .top-menu.active { color:var(--sx-brand); font-weight:600; }
  .top-right { margin-left:auto; display:flex; align-items:center; gap:10px; position:relative; }
  .search-box { display:flex; align-items:center; gap:7px; width:190px; height:29px; padding:0 10px; border:1px solid var(--sx-border-input); border-radius:7px; background:var(--sx-bg-subtle); color:var(--sx-text-hint); font-size:12px; }
  .search-box input { flex:1; min-width:0; border:0; outline:0; background:transparent; font-size:12px; }
  .avatar { width:27px; height:27px; border-radius:50%; background:#64748b; color:#fff; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:600; border:0; }
  .feature-results { position:absolute; top:35px; right:36px; width:270px; z-index:40; border:1px solid var(--sx-border-strong); border-radius:8px; background:var(--sx-bg-surface); padding:5px; }
  .feature-result { display:flex; align-items:center; gap:8px; width:100%; border:0; background:transparent; padding:7px 8px; border-radius:5px; font-size:12px; text-align:left; color:var(--sx-text-secondary); }
  .feature-result:hover { background:var(--sx-bg-hover); color:var(--sx-text-primary); }
  .feature-result .fr-go { margin-left:auto; color:var(--sx-text-hint); }

  /* ---------- 主体 ---------- */
  .body { flex:1; display:flex; min-height:0; background:var(--sx-bg-app); }
  .sidebar { width:186px; flex:0 0 auto; border-right:1px solid var(--sx-border); background:var(--sx-bg-surface); padding:14px 9px; overflow:auto; }
  .side-title { padding:0 9px; margin:0 0 7px; font-size:14px; font-weight:700; color:var(--sx-text-primary); }
  .side-item { width:100%; min-height:32px; display:flex; align-items:center; gap:9px; padding:7px 9px; border:0; border-radius:6px; background:transparent; color:var(--sx-text-secondary); font-size:12px; text-align:left; }
  .side-item:hover { background:var(--sx-bg-hover); }
  .side-item.active { background:var(--sx-brand-soft); color:var(--sx-brand); font-weight:600; }
  .side-badge { margin-left:auto; min-width:19px; height:17px; padding:0 5px; border-radius:9px; background:var(--sx-bg-hover); color:var(--sx-text-secondary); display:inline-flex; align-items:center; justify-content:center; font-size:10px; font-variant-numeric:tabular-nums; }
  .side-item.active .side-badge { background:var(--sx-bg-surface); color:var(--sx-brand); }
  .side-caret { margin-left:auto; transition:transform .14s ease; }
  .side-caret.open { transform:rotate(90deg); }
  .side-sub { padding-left:25px; font-size:11.5px; min-height:29px; }
  .side-div { height:1px; background:var(--sx-border); margin:11px 7px; }
  .side-art { margin:22px 7px 10px; height:94px; border-radius:10px; background:linear-gradient(140deg,#dbeafe,#eef2ff); display:flex; align-items:center; justify-content:center; }
  .app[data-theme='dark'] .side-art { background:linear-gradient(140deg,#26365c,#2b2a46); }
  .side-art svg { opacity:.9; }
  .side-art-text { margin:0 9px; font-size:11.5px; line-height:1.6; color:var(--sx-text-hint); }

  .main { flex:1; min-width:0; overflow:auto; padding:18px 20px 22px; }
  .page-head { display:flex; align-items:flex-start; gap:11px; margin-bottom:14px; }
  .page-icon { width:36px; height:36px; flex:none; border-radius:9px; background:var(--sx-brand); color:#fff; display:flex; align-items:center; justify-content:center; }
  .page-title { font-size:18px; font-weight:700; line-height:1.3; }
  .page-sub { margin-top:3px; font-size:12px; color:var(--sx-text-hint); }
  .market-search { margin-left:auto; width:270px; height:31px; display:flex; align-items:center; gap:8px; padding:0 11px; border:1px solid var(--sx-border-input); border-radius:7px; background:var(--sx-bg-surface); color:var(--sx-text-hint); font-size:12px; }
  .market-search:focus-within { border-color:var(--sx-brand); }
  .market-search input { flex:1; min-width:0; border:0; outline:0; background:transparent; font-size:12px; }
  .clear-btn { border:0; background:transparent; color:var(--sx-text-hint); display:inline-flex; padding:2px; }

  /* ---------- 轮播 ---------- */
  .hero { position:relative; height:112px; border:1px solid var(--sx-border); border-radius:10px; overflow:hidden; background:linear-gradient(110deg,#eef4ff 0%,#f5f1ff 58%,#eaf4ff 100%); display:flex; align-items:center; padding:0 24px; margin-bottom:14px; }
  .app[data-theme='dark'] .hero { background:linear-gradient(110deg,#25304a 0%,#2b2946 58%,#223b4a 100%); }
  .hero-copy { position:relative; z-index:2; max-width:62%; }
  .hero-copy h2 { margin:0 0 6px; font-size:19px; font-weight:700; color:#1e3a8a; }
  .app[data-theme='dark'] .hero-copy h2 { color:#cfe0ff; }
  .hero-copy p { margin:0; font-size:12px; color:#5b6b8c; }
  .app[data-theme='dark'] .hero-copy p { color:#aeb9d4; }
  .hero-art { position:absolute; right:30px; top:8px; opacity:.95; }
  .hero-dots { position:absolute; left:24px; bottom:9px; display:flex; gap:5px; }
  .hero-dot { width:5px; height:5px; padding:0; border:0; border-radius:50%; background:#a9bce8; }
  .hero-dot.active { width:14px; border-radius:3px; background:#3b82f6; }

  /* ---------- 分类与卡片 ---------- */
  .cat-row { display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-bottom:12px; }
  .cat { height:29px; padding:0 12px; border:1px solid var(--sx-border-input); border-radius:6px; background:var(--sx-bg-surface); color:var(--sx-text-secondary); font-size:11.5px; }
  .cat:hover { background:var(--sx-bg-hover); }
  .cat.active { background:var(--sx-brand); border-color:var(--sx-brand); color:#fff; font-weight:600; }
  .sort-wrap { margin-left:auto; }
  .sort-select { height:29px; padding:0 26px 0 10px; border:1px solid var(--sx-border-input); border-radius:6px; background:var(--sx-bg-surface); color:var(--sx-text-secondary); font-size:11.5px; }
  .plugin-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:11px; }
  @media (max-width:1180px){ .plugin-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
  @media (max-width:780px){ .plugin-grid { grid-template-columns:1fr; } .market-search { width:190px; } }
  .plugin-card { position:relative; min-height:139px; border:1px solid var(--sx-border); border-radius:9px; background:var(--sx-bg-surface); padding:11px 12px 10px; display:flex; flex-direction:column; gap:8px; cursor:pointer; transition:border-color .14s ease; }
  .plugin-card:hover { border-color:var(--sx-brand); }
  .plugin-card.more-card { background:var(--sx-bg-subtle); align-items:center; justify-content:center; gap:8px; }
  .p-head { display:flex; align-items:center; gap:9px; }
  .p-icon { width:34px; height:34px; flex:none; border-radius:8px; color:#fff; display:flex; align-items:center; justify-content:center; }
  .p-name { display:flex; align-items:center; gap:6px; min-width:0; }
  .p-name b { font-size:13px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .p-ver { color:var(--sx-text-hint); font-size:10.5px; white-space:nowrap; }
  .p-rec { padding:1px 5px; border-radius:4px; background:#fff3d6; color:#a16207; font-size:9.5px; font-weight:600; }
  .app[data-theme='dark'] .p-rec { background:#3d3317; color:#f0c46a; }
  .p-more { margin-left:auto; border:0; background:transparent; color:var(--sx-text-hint); padding:2px; display:inline-flex; }
  .p-desc { margin:0; font-size:11.5px; line-height:1.55; color:var(--sx-text-secondary); display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; min-height:35px; }
  .p-points { display:flex; gap:4px; flex-wrap:wrap; }
  .p-point { padding:1px 6px; border-radius:4px; background:var(--sx-bg-subtle); color:var(--sx-text-hint); font-size:9.5px; }
  .p-foot { margin-top:auto; display:flex; align-items:center; gap:8px; }
  .p-rating { display:inline-flex; align-items:center; gap:4px; font-size:11.5px; font-weight:600; color:#d97706; }
  .p-rating em { font-style:normal; font-weight:400; color:var(--sx-text-hint); font-size:10.5px; }
  .p-install { margin-left:auto; height:26px; padding:0 11px; display:inline-flex; align-items:center; gap:5px; border:1px solid var(--sx-brand); border-radius:5px; background:var(--sx-bg-surface); color:var(--sx-brand); font-size:11.5px; }
  .p-install:hover { background:var(--sx-brand-soft); }
  .p-install.done { background:var(--sx-success-soft); border-color:var(--sx-success); color:var(--sx-success); }
  .p-install.done:hover { background:var(--sx-bg-hover); }
  .card-menu { position:absolute; right:8px; top:44px; z-index:12; width:132px; padding:4px; border:1px solid var(--sx-border-strong); border-radius:7px; background:var(--sx-bg-surface); }
  .card-menu button { width:100%; border:0; background:transparent; text-align:left; padding:6px 7px; border-radius:4px; font-size:11.5px; color:var(--sx-text-secondary); }
  .card-menu button:hover { background:var(--sx-bg-hover); }
  .more-title { font-size:13px; font-weight:600; }
  .more-desc { font-size:11.5px; line-height:1.6; color:var(--sx-text-hint); text-align:center; }
  .more-btn { height:28px; padding:0 12px; border:1px solid var(--sx-brand); border-radius:5px; background:var(--sx-bg-surface); color:var(--sx-brand); font-size:11.5px; display:inline-flex; align-items:center; gap:5px; }
  .empty { grid-column:1/-1; padding:48px 16px; text-align:center; color:var(--sx-text-hint); border:1px dashed var(--sx-border-strong); border-radius:9px; }

  /* ---------- 分区标题 ---------- */
  .section-head { display:flex; align-items:center; gap:8px; margin:18px 0 10px; font-size:13px; font-weight:700; }
  .section-head .st { font-weight:400; color:var(--sx-text-hint); font-size:11.5px; }
  .section-head .right { margin-left:auto; display:flex; gap:6px; }
  .mini-btn { height:27px; padding:0 10px; border:1px solid var(--sx-border-input); border-radius:5px; background:var(--sx-bg-surface); color:var(--sx-text-secondary); font-size:11.5px; display:inline-flex; align-items:center; gap:5px; }
  .mini-btn:hover { border-color:var(--sx-brand); color:var(--sx-brand); }
  .mini-btn.primary { background:var(--sx-brand); border-color:var(--sx-brand); color:#fff; }

  /* ---------- 已安装 ---------- */
  .installed-panel { border:1px solid var(--sx-border); border-radius:9px; background:var(--sx-bg-surface); overflow:hidden; }
  .ins-head, .ins-row { display:grid; grid-template-columns:minmax(0,2fr) 1fr 100px 80px 148px; gap:10px; align-items:center; padding:9px 13px; }
  .ins-head { background:var(--sx-grid-header-bg); color:var(--sx-grid-header-text); font-size:11.5px; font-weight:600; }
  .ins-row { border-top:1px solid var(--sx-border); font-size:11.5px; }
  .ins-name { display:flex; align-items:center; gap:8px; min-width:0; }
  .ins-name .p-icon { width:27px; height:27px; border-radius:6px; }
  .ins-name b { font-size:12px; font-weight:600; }
  .ins-meta { color:var(--sx-text-hint); font-size:10.5px; }
  .ins-actions { display:flex; gap:5px; justify-content:flex-end; }
  .switch { width:32px; height:18px; border-radius:10px; border:0; background:#cbd5e1; position:relative; display:inline-flex; align-items:center; padding:2px; }
  .switch::after { content:''; width:14px; height:14px; border-radius:50%; background:#fff; transition:transform .14s ease; }
  .switch.on { background:var(--sx-brand); }
  .switch.on::after { transform:translateX(14px); }
  .status-tag { display:inline-flex; align-items:center; gap:4px; padding:2px 7px; border-radius:9px; font-size:10.5px; background:var(--sx-success-soft); color:var(--sx-success); }
  .status-tag.off { background:var(--sx-bg-hover); color:var(--sx-text-hint); }
  .progress-line { height:4px; border-radius:2px; background:var(--sx-progress-track); overflow:hidden; margin-top:7px; }
  .progress-line i { display:block; height:100%; background:var(--sx-brand); }

  /* ---------- 扩展架构 ---------- */
  .arch-flow { display:flex; align-items:stretch; gap:8px; padding:14px; border:1px solid var(--sx-border); border-radius:9px; background:var(--sx-bg-surface); }
  .arch-box { flex:1; min-width:0; border:1px solid var(--sx-border); border-radius:8px; background:var(--sx-bg-subtle); padding:11px; }
  .arch-box.runtime { border-color:var(--sx-brand); background:var(--sx-brand-soft); }
  .arch-box .at { font-size:12px; font-weight:700; display:flex; align-items:center; gap:6px; }
  .arch-box .ad { margin-top:5px; font-size:10.5px; color:var(--sx-text-hint); line-height:1.5; }
  .arch-arrow { display:flex; align-items:center; color:var(--sx-text-hint); flex:none; }
  .arch-tags { display:flex; flex-wrap:wrap; gap:4px; margin-top:8px; }
  .arch-tag { padding:2px 6px; border-radius:4px; background:var(--sx-bg-surface); color:var(--sx-text-secondary); font-size:10px; }
  .ep-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:9px; }
  @media (max-width:1100px){ .ep-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
  .ep-card { border:1px solid var(--sx-border); border-radius:8px; background:var(--sx-bg-surface); padding:11px; cursor:pointer; }
  .ep-card:hover { border-color:var(--sx-brand); }
  .ep-card.active { border-color:var(--sx-brand); background:var(--sx-brand-soft); }
  .ep-top { display:flex; align-items:center; gap:7px; }
  .ep-icon { width:25px; height:25px; border-radius:6px; color:#fff; display:flex; align-items:center; justify-content:center; flex:none; }
  .ep-name { font-size:12px; font-weight:700; }
  .ep-count { margin-left:auto; font-size:10.5px; color:var(--sx-text-hint); }
  .ep-desc { margin-top:7px; font-size:10.5px; line-height:1.55; color:var(--sx-text-hint); min-height:32px; }
  .ep-detail { margin-top:10px; display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:10px; }
  .ep-detail-box { border:1px solid var(--sx-border); border-radius:8px; background:var(--sx-bg-subtle); padding:11px; }
  .ep-detail-title { font-size:11.5px; font-weight:700; margin-bottom:7px; }
  .ep-code { margin:0; white-space:pre-wrap; word-break:break-word; font-family:'SF Mono',Menlo,monospace; font-size:10.5px; line-height:1.65; color:var(--sx-text-secondary); }
  .ep-plugin-list { display:flex; flex-direction:column; gap:5px; }
  .ep-plugin { display:flex; align-items:center; gap:6px; padding:5px 7px; border:1px solid var(--sx-border); border-radius:5px; background:var(--sx-bg-surface); font-size:11px; }
  .ep-plugin .dot { width:6px; height:6px; border-radius:50%; background:var(--sx-brand); flex:none; }
  .order-list { display:flex; flex-wrap:wrap; gap:6px; align-items:center; }
  .order-step { display:inline-flex; align-items:center; gap:5px; padding:4px 8px; border:1px solid var(--sx-border); border-radius:5px; background:var(--sx-bg-surface); font-size:11px; }
  .order-step b { color:var(--sx-brand); font-size:10px; }
  .order-arrow { color:var(--sx-text-hint); display:inline-flex; }
  .log-line { font-family:'SF Mono',Menlo,monospace; font-size:10.5px; line-height:1.7; color:var(--sx-text-secondary); }
  .log-line.ok { color:var(--sx-success); }
  .log-line.err { color:var(--sx-danger); }

  /* ---------- 集成 ---------- */
  .int-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(212px,1fr)); gap:9px; }
  .int-card { border:1px solid var(--sx-border); border-radius:8px; background:var(--sx-bg-surface); padding:10px 11px; display:flex; flex-direction:column; gap:7px; }
  .int-top { display:flex; align-items:center; gap:8px; }
  .int-icon { width:29px; height:29px; border-radius:7px; color:#fff; display:flex; align-items:center; justify-content:center; flex:none; }
  .int-name { font-size:12px; font-weight:700; }
  .int-cat { margin-left:auto; font-size:10px; color:var(--sx-text-hint); }
  .int-desc { margin:0; font-size:10.5px; color:var(--sx-text-hint); line-height:1.5; min-height:31px; }
  .int-foot { display:flex; align-items:center; gap:6px; }
  .int-state { display:inline-flex; align-items:center; gap:4px; font-size:10.5px; color:var(--sx-text-hint); }
  .int-state.on { color:var(--sx-success); }
  .int-connect { margin-left:auto; height:25px; padding:0 9px; border:1px solid var(--sx-border-input); border-radius:5px; background:var(--sx-bg-surface); font-size:11px; color:var(--sx-text-secondary); }
  .int-connect:hover { border-color:var(--sx-brand); color:var(--sx-brand); }
  .int-connect.connected { border-color:var(--sx-success); color:var(--sx-success); }

  /* ---------- 弹窗 ---------- */
  .mask { position:fixed; inset:0; z-index:100; background:rgba(15,23,42,.3); display:flex; align-items:center; justify-content:center; padding:24px; }
  .modal { width:min(680px,100%); max-height:min(82vh,760px); display:flex; flex-direction:column; border:1px solid var(--sx-border-strong); border-radius:11px; background:var(--sx-bg-surface); overflow:hidden; }
  .modal.wide { width:min(860px,100%); }
  .modal-head { height:46px; flex:none; display:flex; align-items:center; gap:9px; padding:0 15px; border-bottom:1px solid var(--sx-border); font-size:14px; font-weight:700; }
  .modal-head .close { margin-left:auto; border:0; background:transparent; color:var(--sx-text-hint); display:inline-flex; padding:3px; }
  .modal-tabs { height:38px; flex:none; display:flex; gap:3px; padding:0 14px; border-bottom:1px solid var(--sx-border); }
  .modal-tab { border:0; border-bottom:2px solid transparent; background:transparent; padding:0 11px; font-size:11.5px; color:var(--sx-text-secondary); }
  .modal-tab.active { border-bottom-color:var(--sx-brand); color:var(--sx-brand); font-weight:600; }
  .modal-body { flex:1; overflow:auto; padding:14px 15px; }
  .modal-foot { flex:none; display:flex; justify-content:flex-end; gap:8px; padding:11px 15px; border-top:1px solid var(--sx-border); }
  .btn { height:30px; padding:0 13px; border:1px solid var(--sx-border-input); border-radius:6px; background:var(--sx-bg-surface); font-size:11.5px; }
  .btn:hover { border-color:var(--sx-brand); }
  .btn.primary { background:var(--sx-brand); border-color:var(--sx-brand); color:#fff; }
  .detail-hero { display:flex; align-items:center; gap:12px; padding-bottom:12px; border-bottom:1px solid var(--sx-border); }
  .detail-hero .p-icon { width:43px; height:43px; }
  .detail-title { font-size:16px; font-weight:700; }
  .detail-sub { margin-top:3px; font-size:11px; color:var(--sx-text-hint); }
  .detail-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin:12px 0; }
  .detail-cell { border:1px solid var(--sx-border); border-radius:7px; background:var(--sx-bg-subtle); padding:9px 10px; }
  .detail-cell .k { font-size:10.5px; color:var(--sx-text-hint); }
  .detail-cell .v { margin-top:3px; font-size:13px; font-weight:700; }
  .detail-section { margin-top:12px; }
  .detail-section h4 { margin:0 0 7px; font-size:12px; }
  .detail-section p { margin:0; font-size:11.5px; line-height:1.7; color:var(--sx-text-secondary); }
  .chip-row { display:flex; flex-wrap:wrap; gap:5px; }
  .chip { padding:3px 8px; border-radius:5px; background:var(--sx-bg-subtle); color:var(--sx-text-secondary); font-size:10.5px; }
  .guide-steps { display:flex; flex-direction:column; gap:8px; }
  .guide-step { display:flex; gap:10px; padding:9px 11px; border:1px solid var(--sx-border); border-radius:7px; background:var(--sx-bg-subtle); }
  .guide-step .no { color:var(--sx-brand); font-weight:700; font-size:12px; }
  .guide-step b { font-size:12px; }
  .guide-step p { margin:3px 0 0; font-size:11px; color:var(--sx-text-hint); line-height:1.55; }
  .code-box { background:var(--sx-bg-subtle); border:1px solid var(--sx-border); border-radius:7px; padding:11px; }
  .api-row { display:grid; grid-template-columns:150px minmax(0,1fr); gap:10px; padding:7px 0; border-bottom:1px solid var(--sx-border); font-size:11px; }
  .api-row:last-child { border-bottom:0; }
  .api-row code { color:var(--sx-brand); font-family:'SF Mono',Menlo,monospace; }
  .api-row span { color:var(--sx-text-hint); }
  .check-line { display:flex; align-items:center; gap:7px; padding:6px 0; font-size:11.5px; color:var(--sx-text-secondary); }
  .check-line .ok { color:var(--sx-success); display:inline-flex; }
  .demo-editor { display:flex; align-items:center; gap:4px; padding:9px; border:1px solid var(--sx-border); border-radius:7px; background:var(--sx-bg-subtle); }
  .star-btn { border:0; background:transparent; font-size:18px; color:#cbd5e1; padding:0 2px; line-height:1; }
  .star-btn.on { color:#f59e0b; }
  .toast-host { position:fixed; left:50%; bottom:24px; transform:translateX(-50%); z-index:200; display:flex; flex-direction:column; gap:6px; align-items:center; pointer-events:none; }
  .toast-item { padding:7px 13px; border:1px solid var(--sx-border-strong); border-radius:6px; background:var(--sx-bg-surface); color:var(--sx-text-primary); font-size:11.5px; }
`
