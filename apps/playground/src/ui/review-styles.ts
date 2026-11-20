/**
 * SheetX 第 14 张 · 单元格批注与协作审阅 — 样式
 *
 * 风格约束：无 glow / shadow，简洁清爽，提示文字调淡。
 */
import { css } from 'lit'

export const reviewStyles = css`
  :host {
    display: block;
    height: 100%;
    background: var(--sx-bg-surface);
    color: var(--sx-text-primary);
    font-family: 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif;
    font-size: 14px;
  }

  .app { display: flex; flex-direction: column; height: 100%; overflow: hidden; }

  /* ============ 顶栏 ============ */
  .topbar {
    height: 50px; flex-shrink: 0;
    display: flex; align-items: center; gap: 14px;
    padding: 0 18px;
    border-bottom: 1px solid var(--sx-border);
    background: var(--sx-bg-surface);
  }
  .traffic { display: flex; gap: 7px; }
  .traffic i { width: 11px; height: 11px; border-radius: 50%; }
  .traffic i:nth-child(1) { background: #f56c6c; }
  .traffic i:nth-child(2) { background: #f7ba2a; }
  .traffic i:nth-child(3) { background: #67c23a; }
  .brand { display: flex; align-items: center; }
  .top-menus { display: flex; gap: 4px; }
  .top-menu {
    border: none; background: transparent; cursor: pointer;
    padding: 6px 12px; border-radius: 6px;
    font-size: 14px; color: var(--sx-text-secondary);
  }
  .top-menu:hover { background: var(--sx-bg-hover); }
  .top-menu.active { color: var(--sx-brand); font-weight: 600; }
  .top-right { margin-left: auto; display: flex; align-items: center; gap: 12px; }
  .search {
    display: flex; align-items: center; gap: 8px;
    width: 200px; height: 32px; padding: 0 12px;
    border: 1px solid var(--sx-border-input);
    border-radius: 8px; color: var(--sx-text-hint);
  }
  .search input {
    flex: 1; min-width: 0; border: none; outline: none; background: transparent;
    font-size: 13px; color: var(--sx-text-primary);
  }
  .search input::placeholder { color: var(--sx-text-hint); }
  .avatar {
    width: 32px; height: 32px; border-radius: 50%;
    background: #334155; color: #fff;
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 600; flex-shrink: 0;
  }

  /* ============ 工具栏 ============ */
  .toolbar {
    height: 40px; flex-shrink: 0;
    display: flex; align-items: center; gap: 6px;
    padding: 0 14px;
    border-bottom: 1px solid var(--sx-border);
    background: var(--sx-bg-surface);
  }
  .tool-btn {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 28px; height: 28px; padding: 0 5px;
    border: none; background: transparent; cursor: pointer;
    border-radius: 6px; color: var(--sx-text-secondary);
  }
  .tool-btn:hover { background: var(--sx-bg-hover); color: var(--sx-text-primary); }
  .tool-btn b { font-weight: 700; font-size: 14px; }
  .tool-btn i { font-style: italic; font-family: Georgia, serif; font-size: 14px; }
  .tool-btn u { text-decoration: underline; font-size: 14px; }
  .tool-btn .fc-red { color: #ef4444; text-decoration: underline; text-underline-offset: 2px; font-size: 14px; }
  .tool-btn .fc-yellow { color: #f7ba2a; text-decoration: underline; text-underline-offset: 2px; font-size: 14px; }
  .v-sep { width: 1px; height: 18px; background: var(--sx-border); margin: 0 3px; flex-shrink: 0; }
  .font-select {
    display: flex; align-items: center; gap: 6px;
    height: 28px; padding: 0 9px;
    border: 1px solid var(--sx-border-input);
    border-radius: 6px;
    font-size: 13px; color: var(--sx-text-primary);
    cursor: default; white-space: nowrap; background: var(--sx-bg-surface);
  }
  .font-select .caret { color: var(--sx-text-hint); display: inline-flex; }
  .tool-pill {
    display: inline-flex; align-items: center; gap: 6px;
    height: 28px; padding: 0 10px;
    border: 1px solid var(--sx-border-input);
    border-radius: 6px;
    background: var(--sx-bg-surface);
    cursor: pointer;
    font-size: 13px; color: var(--sx-text-primary);
    white-space: nowrap;
  }
  .tool-pill:hover { background: var(--sx-bg-hover); }
  .tool-pill .ic { display: inline-flex; color: var(--sx-text-secondary); }
  .tool-pill .caret { color: var(--sx-text-hint); display: inline-flex; }
  .tool-pill.menu-open { border-color: var(--sx-brand); color: var(--sx-brand); }
  .tool-pill.menu-open .ic, .tool-pill.menu-open .caret { color: var(--sx-brand); }

  /* ============ 主体 ============ */
  .body { flex: 1; display: flex; min-height: 0; }

  .formula-bar {
    height: 34px; flex-shrink: 0;
    display: flex; align-items: center; gap: 8px;
    padding: 0 10px;
    border-bottom: 1px solid var(--sx-border);
  }
  .cell-ref {
    display: inline-flex; align-items: center; gap: 4px;
    height: 24px; padding: 0 8px;
    border: 1px solid var(--sx-border-input);
    border-radius: 5px;
    font-size: 12.5px; color: var(--sx-text-primary);
  }
  .cell-ref .caret { color: var(--sx-text-hint); display: inline-flex; }
  .fx-badge {
    font-size: 11px; font-style: italic; font-weight: 600;
    color: var(--sx-text-hint);
    border: 1px solid var(--sx-border);
    border-radius: 4px; padding: 1px 5px;
  }
  .formula-input { flex: 1; font-size: 13px; color: var(--sx-text-primary); overflow: hidden; white-space: nowrap; }

  /* ---- 表格画布 ---- */
  .main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .sheet-scroll {
    flex: 1; min-height: 0; overflow: auto; position: relative;
    background-image:
      linear-gradient(to right, var(--sx-grid-line, var(--sx-border)) 1px, transparent 1px),
      linear-gradient(to bottom, var(--sx-grid-line, var(--sx-border)) 1px, transparent 1px);
    background-size: 64px 32px;
  }
  .sheet-canvas { position: relative; padding: 0 0 40px 0; }

  .sheet-table { border-collapse: collapse; table-layout: fixed; }
  .sheet-table th, .sheet-table td {
    border: 1px solid var(--sx-grid-line, var(--sx-border));
    height: 31px;
    font-size: 12.5px;
    color: var(--sx-text-primary);
    padding: 0 10px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    position: relative;
    background: var(--sx-bg-surface);
  }
  .sheet-table td.rownum, .sheet-table th.rownum {
    width: 44px; text-align: center;
    color: var(--sx-text-hint);
    background: var(--sx-bg-subtle);
    font-size: 11px; padding: 0;
  }
  .sheet-table td.num { text-align: right; }
  .sheet-table td.ctr { text-align: center; }

  .banner-cell {
    background: linear-gradient(135deg, #60a5fa, #3b82f6 55%, #2f6fe4);
    color: #fff !important;
    font-size: 15px; font-weight: 700; letter-spacing: 0.5px;
    height: 43px;
  }
  .banner-inner { display: flex; align-items: center; gap: 8px; }
  .banner-inner .bi { display: inline-flex; }
  .banner-deadline { margin-left: auto; font-size: 11.5px; font-weight: 400; opacity: 0.92; }

  .sheet-table th {
    background: var(--sx-grid-header-bg);
    color: var(--sx-grid-header-text);
    font-weight: 600;
    text-align: center;
    height: 33px;
  }
  .sheet-table tr.total td {
    background: var(--sx-grid-header-bg);
    color: var(--sx-grid-header-text);
    font-weight: 700;
  }
  .sheet-table td.sel-cell {
    outline: 2px solid var(--sx-brand);
    outline-offset: -2px;
  }

  /* 批注角标（右上三角） */
  .cmark {
    position: absolute; top: 0; right: 0;
    width: 0; height: 0;
    border-top: 9px solid #f59e0b;
    border-left: 9px solid transparent;
  }
  .cmark.resolved { border-top-color: #22c55e; }

  /* ============ 批注弹出卡 ============ */
  .comment-pop {
    position: absolute; z-index: 30;
    width: 250px;
    background: var(--sx-bg-surface);
    border: 1px solid var(--sx-border);
    border-radius: 10px;
    padding: 10px 12px;
    box-sizing: border-box;
  }
  .cp-head { display: flex; align-items: center; gap: 8px; }
  .cp-avatar {
    width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
    color: #fff; font-size: 11px; font-weight: 600;
    display: inline-flex; align-items: center; justify-content: center;
  }
  .cp-name { font-size: 13px; font-weight: 600; }
  .cp-time { font-size: 11px; color: var(--sx-text-hint); margin-top: 1px; }
  .cp-more {
    margin-left: auto; border: none; background: transparent; cursor: pointer;
    color: var(--sx-text-hint); padding: 2px 4px; border-radius: 4px;
    display: inline-flex; position: relative;
  }
  .cp-more:hover { background: var(--sx-bg-hover); color: var(--sx-text-primary); }
  .cp-text { font-size: 12.5px; line-height: 1.55; margin: 8px 0; color: var(--sx-text-primary); }
  .cp-text .mention { color: var(--sx-brand); font-weight: 600; }
  .cp-reply-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 8px; }
  .cp-reply { display: flex; gap: 6px; }
  .cp-reply .cp-avatar { width: 20px; height: 20px; font-size: 9px; }
  .cp-reply-body { flex: 1; min-width: 0; }
  .cp-reply-meta { font-size: 11px; color: var(--sx-text-hint); }
  .cp-reply-meta b { color: var(--sx-text-primary); font-weight: 600; margin-right: 4px; }
  .cp-reply-text { font-size: 12px; line-height: 1.5; }
  .cp-reply-text .mention { color: var(--sx-brand); font-weight: 600; }
  .cp-input-wrap { position: relative; }
  .cp-input {
    width: 100%; box-sizing: border-box;
    height: 30px; padding: 0 10px;
    border: 1px solid var(--sx-border-input);
    border-radius: 7px;
    font-size: 12px; color: var(--sx-text-primary);
    background: var(--sx-bg-surface);
    outline: none;
  }
  .cp-input:focus { border-color: var(--sx-brand); }
  .cp-input::placeholder { color: var(--sx-text-hint); }
  .cp-send {
    position: absolute; right: 4px; top: 3px;
    width: 24px; height: 24px;
    border: none; border-radius: 6px; cursor: pointer;
    background: var(--sx-brand); color: #fff;
    display: inline-flex; align-items: center; justify-content: center;
  }
  .cp-send:disabled { background: var(--sx-border); cursor: default; }
  .cp-foot { display: flex; align-items: center; gap: 4px; margin-top: 8px; }
  .cp-act {
    display: inline-flex; align-items: center; gap: 4px;
    border: none; background: transparent; cursor: pointer;
    color: var(--sx-text-hint); font-size: 12px;
    padding: 3px 6px; border-radius: 5px;
  }
  .cp-act:hover { background: var(--sx-bg-hover); color: var(--sx-text-primary); }
  .cp-act.liked { color: var(--sx-brand); }
  .cp-act.resolved-act { color: #22c55e; }
  .cp-foot .spacer { flex: 1; }

  /* @提及候选下拉 */
  .mention-menu {
    position: absolute; z-index: 50;
    bottom: calc(100% + 4px); left: 0;
    min-width: 140px;
    background: var(--sx-bg-surface);
    border: 1px solid var(--sx-border);
    border-radius: 8px;
    padding: 4px;
  }
  .mention-item {
    display: flex; align-items: center; gap: 7px;
    width: 100%; border: none; background: transparent; cursor: pointer;
    padding: 6px 8px; border-radius: 5px;
    font-size: 12.5px; color: var(--sx-text-primary); text-align: left;
  }
  .mention-item:hover { background: var(--sx-bg-hover); }
  .mention-item .mi-avatar {
    width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0;
    color: #fff; font-size: 9px; font-weight: 600;
    display: inline-flex; align-items: center; justify-content: center;
  }

  /* 更多菜单（...） */
  .more-menu {
    position: absolute; z-index: 50;
    top: calc(100% + 2px); right: 0;
    min-width: 128px;
    background: var(--sx-bg-surface);
    border: 1px solid var(--sx-border);
    border-radius: 8px;
    padding: 4px;
  }
  .more-item {
    display: flex; align-items: center; gap: 7px;
    width: 100%; border: none; background: transparent; cursor: pointer;
    padding: 6px 8px; border-radius: 5px;
    font-size: 12.5px; color: var(--sx-text-primary); text-align: left;
    white-space: nowrap;
  }
  .more-item:hover { background: var(--sx-bg-hover); }
  .more-item.danger { color: #ef4444; }
  .more-item .mic { display: inline-flex; color: inherit; }

  /* ============ 右侧面板 ============ */
  .panel {
    width: 300px; flex-shrink: 0;
    border-left: 1px solid var(--sx-border);
    background: var(--sx-bg-surface);
    display: flex; flex-direction: column;
    min-height: 0;
  }
  .panel-head {
    display: flex; align-items: center; gap: 9px;
    padding: 13px 14px 9px;
  }
  .panel-head .ph-icon {
    width: 28px; height: 28px; border-radius: 50%;
    background: var(--sx-brand); color: #fff;
    display: inline-flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .panel-title { font-size: 15px; font-weight: 700; }
  .panel-close {
    margin-left: auto; border: none; background: transparent; cursor: pointer;
    color: var(--sx-text-hint); padding: 4px; border-radius: 5px;
    display: inline-flex;
  }
  .panel-close:hover { background: var(--sx-bg-hover); color: var(--sx-text-primary); }

  .panel-tabs { display: flex; border-bottom: 1px solid var(--sx-border); padding: 0 8px; }
  .panel-tab {
    border: none; background: transparent; cursor: pointer;
    padding: 8px 10px 9px;
    font-size: 13px; color: var(--sx-text-secondary);
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    white-space: nowrap;
  }
  .panel-tab.active { color: var(--sx-brand); font-weight: 600; border-bottom-color: var(--sx-brand); }

  .panel-body { flex: 1; min-height: 0; overflow-y: auto; padding: 12px 14px; box-sizing: border-box; }

  /* 评论卡 */
  .cmt-card { padding: 4px 0 14px; }
  .cmt-head { display: flex; align-items: center; gap: 8px; }
  .cmt-avatar {
    width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
    color: #fff; font-size: 12px; font-weight: 600;
    display: inline-flex; align-items: center; justify-content: center;
  }
  .cmt-name { font-size: 13.5px; font-weight: 600; }
  .cmt-time { font-size: 11px; color: var(--sx-text-hint); margin-top: 1px; }
  .cmt-more {
    margin-left: auto; border: none; background: transparent; cursor: pointer;
    color: var(--sx-text-hint); padding: 3px 5px; border-radius: 5px;
    display: inline-flex; position: relative;
  }
  .cmt-more:hover { background: var(--sx-bg-hover); color: var(--sx-text-primary); }
  .cmt-cell-tag {
    display: inline-flex; align-items: center;
    margin-left: 6px; padding: 1px 6px;
    border-radius: 4px; font-size: 10.5px; font-weight: 600;
    background: var(--sx-bg-active); color: var(--sx-brand);
  }
  .cmt-cell-tag.resolved { background: #dcfce7; color: #16a34a; }
  .cmt-text { font-size: 12.5px; line-height: 1.6; margin: 8px 0 6px; color: var(--sx-text-primary); }
  .cmt-text .mention { color: var(--sx-brand); font-weight: 600; }
  .cmt-replies { margin: 6px 0 0 38px; display: flex; flex-direction: column; gap: 7px; }
  .cmt-reply { display: flex; gap: 6px; }
  .cmt-reply .cmt-avatar { width: 20px; height: 20px; font-size: 9px; }
  .cmt-reply-body { flex: 1; min-width: 0; }
  .cmt-reply-meta { font-size: 11px; color: var(--sx-text-hint); }
  .cmt-reply-meta b { color: var(--sx-text-primary); font-weight: 600; margin-right: 4px; }
  .cmt-reply-text { font-size: 12px; line-height: 1.5; }
  .cmt-reply-text .mention { color: var(--sx-brand); font-weight: 600; }
  .cmt-reply-btn {
    border: none; background: transparent; cursor: pointer;
    color: var(--sx-brand); font-size: 12.5px; padding: 2px 0;
  }
  .cmt-reply-btn:hover { text-decoration: underline; }

  /* 审阅统计 */
  .stats-block { border-top: 1px solid var(--sx-border); padding-top: 12px; margin-top: 2px; }
  .stats-title { font-size: 13px; font-weight: 700; margin-bottom: 9px; }
  .stats-row { display: flex; align-items: center; gap: 8px; padding: 3.5px 0; font-size: 12.5px; color: var(--sx-text-secondary); }
  .stats-row .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .stats-row .val { margin-left: auto; color: var(--sx-text-primary); font-weight: 600; }

  /* 修订时间线 */
  .rev-item { display: flex; gap: 10px; padding: 7px 0; }
  .rev-rail { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; }
  .rev-dot { width: 9px; height: 9px; border-radius: 50%; background: var(--sx-brand); margin-top: 4px; }
  .rev-dot.green { background: #22c55e; }
  .rev-dot.amber { background: #f59e0b; }
  .rev-dot.gray { background: #94a3b8; }
  .rev-line { flex: 1; width: 1px; background: var(--sx-border); margin-top: 3px; }
  .rev-body { flex: 1; min-width: 0; padding-bottom: 9px; }
  .rev-action { font-size: 12.5px; color: var(--sx-text-primary); }
  .rev-action b { font-weight: 600; }
  .rev-detail { font-size: 12px; color: var(--sx-text-secondary); margin-top: 2px; line-height: 1.5; }
  .rev-time { font-size: 11px; color: var(--sx-text-hint); margin-top: 3px; display: inline-flex; align-items: center; gap: 4px; }

  /* 审阅状态 */
  .flow-title { font-size: 13px; font-weight: 700; margin-bottom: 12px; }
  .flow-step { display: flex; gap: 10px; }
  .flow-rail { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; }
  .flow-node {
    width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0;
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700;
    background: var(--sx-bg-subtle); color: var(--sx-text-hint);
    border: 1px solid var(--sx-border);
    box-sizing: border-box;
  }
  .flow-node.done { background: #22c55e; border-color: #22c55e; color: #fff; }
  .flow-node.active { background: var(--sx-brand); border-color: var(--sx-brand); color: #fff; }
  .flow-line { flex: 1; width: 1px; background: var(--sx-border); margin: 2px 0; }
  .flow-body { padding-bottom: 14px; min-width: 0; flex: 1; }
  .flow-name { font-size: 13px; font-weight: 600; }
  .flow-name.dim { color: var(--sx-text-hint); }
  .flow-owner { font-size: 11.5px; color: var(--sx-text-hint); margin-top: 2px; }
  .flow-badge {
    display: inline-block; margin-left: 6px; padding: 1px 7px;
    border-radius: 999px; font-size: 10.5px; font-weight: 600; vertical-align: 1px;
  }
  .flow-badge.done { background: #dcfce7; color: #16a34a; }
  .flow-badge.active { background: var(--sx-bg-active); color: var(--sx-brand); }
  .flow-badge.todo { background: var(--sx-bg-subtle); color: var(--sx-text-hint); }
  .progress-wrap { margin: 4px 0 14px; }
  .progress-label { display: flex; justify-content: space-between; font-size: 11.5px; color: var(--sx-text-secondary); margin-bottom: 5px; }
  .progress-track { height: 6px; border-radius: 999px; background: var(--sx-bg-subtle); overflow: hidden; }
  .progress-fill { height: 100%; border-radius: 999px; background: var(--sx-brand); }

  /* ============ 底部 ============ */
  .sheet-tabs-bar {
    height: 36px; flex-shrink: 0;
    display: flex; align-items: stretch;
    border-top: 1px solid var(--sx-border);
    background: var(--sx-bg-subtle);
  }
  .tab-add {
    width: 40px; border: none; background: transparent; cursor: pointer;
    color: var(--sx-text-secondary); font-size: 16px;
  }
  .tab-add:hover { background: var(--sx-bg-hover); }
  .sheet-tab {
    border: none; background: transparent; cursor: pointer;
    padding: 0 16px; font-size: 13px; color: var(--sx-text-secondary);
    border-bottom: 2px solid transparent;
  }
  .sheet-tab.active {
    background: var(--sx-bg-surface);
    color: var(--sx-brand); font-weight: 600;
    border-bottom-color: var(--sx-brand);
  }
  .sheet-tab:hover:not(.active) { background: var(--sx-bg-hover); }
  .tabs-more {
    margin-left: auto; border: none; background: transparent; cursor: pointer;
    color: var(--sx-text-secondary); padding: 0 14px; font-size: 15px;
  }

  .statusbar {
    height: 30px; flex-shrink: 0;
    display: flex; align-items: center; gap: 18px;
    padding: 0 16px;
    border-top: 1px solid var(--sx-border);
    font-size: 12px; color: var(--sx-text-secondary);
    background: var(--sx-bg-surface);
  }
  .statusbar .sb-val { color: var(--sx-text-primary); }
  .statusbar .right { margin-left: auto; display: flex; align-items: center; gap: 14px; }
  .zoom-ctl { display: flex; align-items: center; gap: 8px; }
  .zoom-ctl button {
    border: none; background: transparent; cursor: pointer;
    color: var(--sx-text-secondary); font-size: 14px; padding: 0 2px;
  }
  .zoom-ctl .zoom-val { min-width: 42px; text-align: center; color: var(--sx-text-primary); }

  /* toast */
  .toast {
    position: fixed; left: 50%; bottom: 52px; transform: translateX(-50%);
    background: #1f2937; color: #fff;
    font-size: 13px; padding: 8px 18px; border-radius: 8px;
    z-index: 99; white-space: nowrap;
  }

  /* 工具栏下拉菜单 */
  .tool-menu {
    position: absolute; z-index: 60;
    top: 34px; left: 0;
    min-width: 132px;
    background: var(--sx-bg-surface);
    border: 1px solid var(--sx-border);
    border-radius: 8px;
    padding: 4px;
  }
  .tool-menu-item {
    display: flex; align-items: center; gap: 7px;
    width: 100%; border: none; background: transparent; cursor: pointer;
    padding: 6px 8px; border-radius: 5px;
    font-size: 12.5px; color: var(--sx-text-primary); text-align: left;
    white-space: nowrap;
  }
  .tool-menu-item:hover { background: var(--sx-bg-hover); }
  .tool-menu-item .tmic { display: inline-flex; color: var(--sx-text-secondary); }

  /* ============ 多人协作模拟 ============ */
  .online-peers {
    display: inline-flex; align-items: center; position: relative; margin-right: 2px;
  }
  .online-peers .peer-avatar {
    width: 22px; height: 22px; border-radius: 50%;
    display: inline-flex; align-items: center; justify-content: center;
    color: #fff; font-size: 9.5px; font-weight: 600;
    border: 2px solid var(--sx-bg-surface);
    margin-left: -6px;
  }
  .online-peers .peer-avatar:first-child { margin-left: 0; }
  .online-peers .peer-online-dot {
    position: absolute; right: -1px; top: -1px;
    width: 7px; height: 7px; border-radius: 50%;
    background: #22c55e; border: 1.5px solid var(--sx-bg-surface);
  }
  td.peer-cell { position: relative; }
  .peer-tag {
    position: absolute; top: -8px; left: -1px;
    padding: 0 4px; height: 14px; border-radius: 3px 3px 3px 0;
    color: #fff; font-size: 9px; line-height: 14px; font-weight: 600;
    pointer-events: none; z-index: 4; white-space: nowrap;
  }
`
