/**
 * SheetX 第 15 张 · 数据验证与智能输入 — 样式
 *
 * 风格约束：无 glow / shadow，简洁清爽，提示文字调淡。
 */
import { css } from 'lit'

export const validationStyles = css`
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
  .num-badge {
    min-width: 22px; height: 22px; padding: 0 3px;
    display: inline-flex; align-items: center; justify-content: center;
    border: 1px solid var(--sx-border-input); border-radius: 5px;
    font-size: 12px; color: var(--sx-text-secondary);
  }
  .num-badge small { font-size: 8px; vertical-align: super; }

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
  .sheet-canvas { position: relative; padding: 0 0 60px 0; }

  .sheet-table { border-collapse: collapse; table-layout: fixed; }
  .sheet-table th, .sheet-table td {
    border: 1px solid var(--sx-grid-line, var(--sx-border));
    height: 33px;
    font-size: 12.5px;
    color: var(--sx-text-primary);
    padding: 0 10px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    position: relative;
    background: var(--sx-bg-surface);
    box-sizing: border-box;
    cursor: default;
  }
  .sheet-table td.rownum, .sheet-table th.rownum {
    width: 44px; text-align: center;
    color: var(--sx-text-hint);
    background: var(--sx-bg-subtle);
    font-size: 11px; padding: 0;
  }
  .sheet-table td.num { text-align: right; }
  .sheet-table td.ctr { text-align: center; }

  .sheet-table th {
    background: #3b82f6;
    color: #fff;
    font-weight: 600;
    text-align: center;
    height: 39px;
    font-size: 13px;
  }

  .sheet-table td.sel-cell {
    outline: 2px solid var(--sx-brand);
    outline-offset: -2px;
  }
  .sheet-table td.invalid-cell {
    outline: 2px solid #ef4444;
    outline-offset: -2px;
    background: #fef2f2;
  }
  .sheet-table td.editing { padding: 0; overflow: visible; }
  .cell-input {
    width: 100%; height: 100%; box-sizing: border-box;
    border: 2px solid var(--sx-brand);
    outline: none; padding: 0 8px;
    font-size: 12.5px; font-family: inherit;
    color: var(--sx-text-primary);
    background: var(--sx-bg-surface);
  }

  /* 部门下拉展开 */
  .cell-dropdown {
    position: absolute; z-index: 30;
    min-width: 150px;
    background: var(--sx-bg-surface);
    border: 1px solid var(--sx-border);
    border-radius: 0 0 8px 8px;
    padding: 4px;
    box-sizing: border-box;
  }
  .cell-dropdown .cd-item {
    display: flex; align-items: center; justify-content: space-between;
    width: 100%; border: none; background: transparent; cursor: pointer;
    padding: 7px 10px; border-radius: 5px;
    font-size: 12.5px; color: var(--sx-text-primary); text-align: left;
  }
  .cell-dropdown .cd-item:hover { background: var(--sx-bg-active); color: var(--sx-brand); }
  .cell-dropdown .cd-item.current { color: var(--sx-brand); font-weight: 600; }

  /* 输入提示气泡 */
  .prompt-tip {
    position: absolute; z-index: 20;
    max-width: 240px;
    background: var(--sx-bg-active);
    border: 1px solid #bfdbfe;
    border-radius: 8px;
    padding: 8px 11px;
    box-sizing: border-box;
  }
  .prompt-tip .pt-title { font-size: 12px; font-weight: 700; color: var(--sx-grid-header-text); display: flex; align-items: center; gap: 5px; }
  .prompt-tip .pt-content { font-size: 11.5px; color: #3b6fb5; margin-top: 3px; line-height: 1.5; }

  /* ============ 错误弹窗 ============ */
  .dialog-mask {
    position: fixed; inset: 0; z-index: 80;
    background: rgba(15, 23, 42, 0.28);
    display: flex; align-items: center; justify-content: center;
  }
  .error-dialog {
    width: 260px;
    background: var(--sx-bg-surface);
    border: 1px solid var(--sx-border);
    border-radius: 12px;
    padding: 22px 20px 18px;
    box-sizing: border-box;
    text-align: center;
  }
  .error-dialog .ed-icon {
    width: 44px; height: 44px; border-radius: 50%;
    margin: 0 auto 12px;
    display: flex; align-items: center; justify-content: center;
    color: #fff;
  }
  .error-dialog .ed-icon.stop { background: #ef4444; }
  .error-dialog .ed-icon.warning { background: #f59e0b; }
  .error-dialog .ed-icon.info { background: #3b82f6; }
  .error-dialog .ed-title { font-size: 15px; font-weight: 700; }
  .error-dialog .ed-content { font-size: 12.5px; color: var(--sx-text-secondary); margin: 8px 0 16px; line-height: 1.55; }
  .error-dialog .ed-btn {
    min-width: 96px; height: 32px;
    border: none; border-radius: 7px; cursor: pointer;
    background: var(--sx-brand); color: #fff;
    font-size: 13px; font-weight: 600;
  }
  .error-dialog .ed-btn:hover { background: #2f6fe4; }

  /* ============ 亮点卡 ============ */
  .highlight-card {
    position: absolute; z-index: 10;
    left: 90px; bottom: 24px;
    width: 320px;
    background: var(--sx-bg-surface);
    border: 1px solid var(--sx-border);
    border-radius: 10px;
    padding: 13px 16px;
    box-sizing: border-box;
  }
  .highlight-card .hc-title {
    display: flex; align-items: center; gap: 7px;
    font-size: 13.5px; font-weight: 700; margin-bottom: 9px;
  }
  .highlight-card .hc-title .hc-ic {
    width: 20px; height: 20px; border-radius: 50%;
    background: var(--sx-brand); color: #fff;
    display: inline-flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .highlight-card .hc-item {
    display: flex; align-items: flex-start; gap: 7px;
    font-size: 12px; color: var(--sx-text-secondary);
    padding: 3.5px 0; line-height: 1.5;
  }
  .highlight-card .hc-item .tick { color: #22c55e; display: inline-flex; flex-shrink: 0; margin-top: 1px; }

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
    padding: 8px 12px 9px;
    font-size: 13px; color: var(--sx-text-secondary);
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    white-space: nowrap;
  }
  .panel-tab.active { color: var(--sx-brand); font-weight: 600; border-bottom-color: var(--sx-brand); }

  .panel-body { flex: 1; min-height: 0; overflow-y: auto; padding: 12px 14px 14px; box-sizing: border-box; }

  .sec-label { font-size: 12.5px; font-weight: 700; margin: 2px 0 9px; }
  .field-row { display: flex; align-items: center; gap: 8px; margin-bottom: 9px; }
  .field-label { font-size: 12.5px; color: var(--sx-text-secondary); flex-shrink: 0; width: 62px; }
  .field-input {
    flex: 1; min-width: 0; height: 30px; padding: 0 9px;
    border: 1px solid var(--sx-border-input);
    border-radius: 7px;
    font-size: 12.5px; color: var(--sx-text-primary);
    background: var(--sx-bg-surface);
    outline: none; box-sizing: border-box;
  }
  .field-input:focus { border-color: var(--sx-brand); }
  .field-select {
    flex: 1; min-width: 0;
    display: flex; align-items: center; justify-content: space-between; gap: 6px;
    height: 30px; padding: 0 9px;
    border: 1px solid var(--sx-border-input);
    border-radius: 7px;
    font-size: 12.5px; color: var(--sx-text-primary);
    cursor: pointer; box-sizing: border-box;
    position: relative;
  }
  .field-select:hover { border-color: var(--sx-brand); }
  .field-select .caret { color: var(--sx-text-hint); display: inline-flex; }
  .field-select .fs-icon { display: inline-flex; color: var(--sx-text-hint); }
  .range-inputs { display: flex; align-items: center; gap: 6px; flex: 1; }
  .range-inputs .field-input { text-align: center; }
  .range-inputs .dash { color: var(--sx-text-hint); }

  .check-row {
    display: flex; align-items: center; gap: 8px;
    padding: 5px 0; cursor: pointer;
    font-size: 12.5px; color: var(--sx-text-primary);
    border: none; background: transparent; width: 100%; text-align: left;
  }
  .check-row .cbox {
    width: 16px; height: 16px; border-radius: 4px; flex-shrink: 0;
    border: 1.5px solid var(--sx-border-input);
    display: inline-flex; align-items: center; justify-content: center;
    color: #fff; background: var(--sx-bg-surface);
  }
  .check-row.on .cbox { background: var(--sx-brand); border-color: var(--sx-brand); }

  .style-dot {
    width: 18px; height: 18px; border-radius: 50%; flex-shrink: 0;
    display: inline-flex; align-items: center; justify-content: center;
    color: #fff; font-size: 11px; font-weight: 700;
  }
  .style-dot.stop { background: #ef4444; }
  .style-dot.warning { background: #f59e0b; }
  .style-dot.info { background: #3b82f6; }

  .err-preview {
    margin-top: 12px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    padding: 10px 12px;
    display: flex; gap: 8px;
  }
  .err-preview .ep-icon {
    width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0;
    background: #ef4444; color: #fff;
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700;
  }
  .err-preview .ep-title { font-size: 12.5px; font-weight: 700; color: #b91c1c; }
  .err-preview .ep-content { font-size: 11.5px; color: #c26a6a; margin-top: 2px; line-height: 1.5; }

  .panel-foot {
    display: flex; justify-content: flex-end; gap: 8px;
    padding: 10px 14px;
    border-top: 1px solid var(--sx-border);
  }
  .pf-btn {
    height: 30px; padding: 0 16px;
    border: 1px solid var(--sx-border-input);
    border-radius: 7px; cursor: pointer;
    background: var(--sx-bg-surface);
    font-size: 12.5px; color: var(--sx-text-primary);
  }
  .pf-btn:hover { background: var(--sx-bg-hover); }
  .pf-btn.primary {
    background: var(--sx-brand); border-color: var(--sx-brand); color: #fff;
    font-weight: 600;
  }
  .pf-btn.primary:hover { background: #2f6fe4; }

  /* 面板下拉菜单 */
  .fs-menu {
    position: absolute; z-index: 50;
    bottom: calc(100% + 4px); left: 0;
    min-width: 100%;
    background: var(--sx-bg-surface);
    border: 1px solid var(--sx-border);
    border-radius: 8px;
    padding: 4px;
    box-sizing: border-box;
  }
  .fs-menu .fs-item {
    display: flex; align-items: center; gap: 6px;
    width: 100%; border: none; background: transparent; cursor: pointer;
    padding: 6px 8px; border-radius: 5px;
    font-size: 12.5px; color: var(--sx-text-primary); text-align: left; white-space: nowrap;
  }
  .fs-menu .fs-item:hover { background: var(--sx-bg-hover); }
  .fs-menu .fs-item.sel { color: var(--sx-brand); font-weight: 600; }

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
  .statusbar .vstatus { display: inline-flex; align-items: center; gap: 5px; }
  .statusbar .vstatus.ok { color: #16a34a; }
  .statusbar .vstatus.bad { color: #ef4444; }
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
`
