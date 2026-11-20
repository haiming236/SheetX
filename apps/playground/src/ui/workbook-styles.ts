/**
 * SheetX 第 11 张 · 工作簿与多工作表管理 — 样式
 *
 * 风格约束：无 glow / shadow，简洁清爽，提示文字调淡。
 */
import { css } from 'lit'

export const workbookStyles = css`
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
  .merge-label { font-size: 13px; }

  /* ============ 主体 ============ */
  .body { flex: 1; display: flex; min-height: 0; }

  /* ---- 左侧工作簿栏 ---- */
  .wb-panel {
    width: 148px; flex-shrink: 0;
    border-right: 1px solid var(--sx-border);
    background: var(--sx-bg-surface);
    padding: 10px 8px;
    display: flex; flex-direction: column; gap: 2px;
  }
  .wb-head {
    display: flex; align-items: center; justify-content: space-between;
    padding: 2px 6px 8px;
    font-size: 12px; font-weight: 600; color: var(--sx-text-secondary);
  }
  .wb-add {
    width: 22px; height: 22px; border: none; border-radius: 5px;
    background: transparent; cursor: pointer; color: var(--sx-text-secondary);
    display: inline-flex; align-items: center; justify-content: center;
  }
  .wb-add:hover { background: var(--sx-bg-hover); color: var(--sx-brand); }
  .wb-item {
    display: flex; align-items: center; gap: 8px;
    width: 100%; padding: 8px 9px;
    border: none; border-radius: 7px;
    background: transparent; cursor: pointer;
    font-size: 12.5px; color: var(--sx-text-primary);
    text-align: left;
  }
  .wb-item:hover { background: var(--sx-bg-hover); }
  .wb-item.active { background: var(--sx-brand-soft); color: var(--sx-brand); font-weight: 600; }
  .wb-icon {
    width: 20px; height: 20px; flex-shrink: 0;
    border-radius: 4px; background: #22a06b; color: #fff;
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 700;
  }
  .wb-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  /* ---- 中间表格区 ---- */
  .grid-area { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .formula-bar {
    height: 34px; flex-shrink: 0;
    display: flex; align-items: center; gap: 8px;
    padding: 0 10px;
    border-bottom: 1px solid var(--sx-border);
  }
  .fx-badge {
    font-size: 11px; font-style: italic; font-weight: 600;
    color: var(--sx-text-hint);
    border: 1px solid var(--sx-border);
    border-radius: 4px; padding: 1px 5px;
  }
  .formula-input { flex: 1; font-size: 13px; color: var(--sx-text-primary); overflow: hidden; white-space: nowrap; }

  .grid-scroll { flex: 1; overflow: auto; }
  .sheet { border-collapse: collapse; table-layout: fixed; }
  .sheet th, .sheet td {
    border: 1px solid var(--sx-grid-line);
    padding: 0 8px;
    height: 27px;
    font-size: 12.5px;
    text-align: center;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .sheet .corner { background: var(--sx-bg-subtle); }
  .sheet .col-head {
    background: var(--sx-bg-subtle);
    color: var(--sx-text-secondary);
    font-weight: 500; font-size: 12px;
  }
  .sheet .row-head {
    background: var(--sx-bg-subtle);
    color: var(--sx-text-secondary);
    font-weight: 500; font-size: 12px;
    width: 36px;
  }
  .sheet td.banner {
    background: var(--sx-brand);
    color: #fff;
    font-size: 16px; font-weight: 700;
    height: 42px;
    letter-spacing: 1px;
  }
  .sheet td.banner .bi { display: inline-flex; vertical-align: -3px; margin-right: 8px; }
  .sheet th.h2 {
    background: var(--sx-grid-header-bg);
    color: var(--sx-text-primary);
    font-weight: 600;
  }
  .sheet td.total {
    background: var(--sx-grid-header-bg);
    font-weight: 700;
  }
  .sheet td.total .dash { color: var(--sx-text-hint); }
  .sheet td.chart-cell {
    background: var(--sx-bg-surface);
    padding: 12px 18px 6px;
  }
  .chart-title { text-align: center; font-size: 14px; font-weight: 700; margin-bottom: 4px; }
  .chart-wrap { display: flex; justify-content: center; }
  .h-scrollbar {
    height: 10px; flex-shrink: 0;
    margin: 0 10px 6px;
    position: relative;
  }
  .h-scrollbar .track {
    position: absolute; left: 0; right: 0; top: 3px; height: 5px;
    border-radius: 3px; background: var(--sx-bg-subtle);
  }
  .h-scrollbar .thumb {
    position: absolute; left: 0; top: 3px; height: 5px; width: 46%;
    border-radius: 3px; background: var(--sx-border-strong);
  }

  /* ---- 右侧工作表属性面板 ---- */
  .props-panel {
    width: 262px; flex-shrink: 0;
    border-left: 1px solid var(--sx-border);
    background: var(--sx-bg-surface);
    padding: 14px 16px;
    display: flex; flex-direction: column;
    overflow-y: auto;
  }
  .pp-head { display: flex; align-items: center; gap: 8px; }
  .pp-head .ic { color: var(--sx-brand); display: inline-flex; }
  .pp-head .tt { font-size: 14px; font-weight: 700; flex: 1; }
  .pp-close {
    border: none; background: transparent; cursor: pointer;
    color: var(--sx-text-hint); padding: 4px; border-radius: 5px;
    display: inline-flex;
  }
  .pp-close:hover { background: var(--sx-bg-hover); color: var(--sx-text-primary); }
  .pp-tabs { display: flex; gap: 18px; border-bottom: 1px solid var(--sx-border); margin: 12px 0 14px; }
  .pp-tab {
    border: none; background: transparent; cursor: pointer;
    padding: 6px 2px; font-size: 13px; color: var(--sx-text-secondary);
    border-bottom: 2px solid transparent;
  }
  .pp-tab.on { color: var(--sx-brand); font-weight: 600; border-bottom-color: var(--sx-brand); }
  .pp-field { margin-bottom: 14px; }
  .pp-label { display: block; font-size: 12.5px; color: var(--sx-text-primary); margin-bottom: 7px; }
  .pp-hint { font-size: 11.5px; color: var(--sx-text-hint); margin: -3px 0 7px; }
  .pp-input {
    width: 100%; height: 32px; padding: 0 10px;
    border: 1px solid var(--sx-border-input);
    border-radius: 7px;
    font-size: 13px; color: var(--sx-text-primary);
    background: var(--sx-bg-surface);
    outline: none; box-sizing: border-box;
  }
  .pp-input:focus { border-color: var(--sx-brand); }
  .pp-input::placeholder { color: var(--sx-text-hint); }
  .pp-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .pp-row .pp-label { margin-bottom: 0; }
  .pp-visible { display: flex; align-items: center; gap: 7px; font-size: 12px; color: var(--sx-text-secondary); }

  .switch {
    position: relative; width: 38px; height: 21px;
    border: none; border-radius: 11px; cursor: pointer;
    background: #cbd5e1; flex-shrink: 0; padding: 0;
    transition: background 0.18s;
  }
  .switch .knob {
    position: absolute; top: 2px; left: 2px;
    width: 17px; height: 17px; border-radius: 50%;
    background: var(--sx-bg-surface); transition: transform 0.18s;
  }
  .switch.on { background: var(--sx-brand); }
  .switch.on .knob { transform: translateX(17px); }

  .color-dot-btn {
    display: flex; align-items: center; gap: 7px;
    border: 1px solid var(--sx-border-input);
    border-radius: 7px; background: var(--sx-bg-surface);
    padding: 5px 10px; cursor: pointer;
  }
  .color-dot { width: 14px; height: 14px; border-radius: 50%; border: 1px solid rgba(15,23,42,0.12); }
  .color-dot.none { background: var(--sx-bg-surface); }

  .protect-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
  .protect-row .pr-ic { color: var(--sx-text-secondary); display: inline-flex; }
  .protect-row .pr-btn {
    border: none; background: transparent; cursor: pointer;
    font-size: 12.5px; color: var(--sx-text-primary);
    padding: 2px 4px; border-radius: 4px;
  }
  .protect-row .pr-btn:hover { background: var(--sx-bg-hover); }
  .pwd-input { flex: 1; }

  .pp-info { margin: 4px 0 0; }
  .pp-info .pp-label { margin-bottom: 8px; }
  .info-line { display: flex; font-size: 12.5px; margin-bottom: 6px; }
  .info-line .k { color: var(--sx-text-hint); width: 52px; flex-shrink: 0; }
  .info-line .v { color: var(--sx-text-primary); font-weight: 600; }

  .pp-help {
    margin-top: auto;
    display: flex; align-items: center; justify-content: center; gap: 7px;
    height: 34px;
    border: 1px solid var(--sx-border-input);
    border-radius: 8px;
    background: var(--sx-bg-surface);
    cursor: pointer;
    font-size: 12.5px; color: var(--sx-text-secondary);
  }
  .pp-help:hover { background: var(--sx-bg-hover); }

  /* ============ 右键菜单 ============ */
  .ctx-menu {
    position: fixed; z-index: 60;
    min-width: 158px;
    background: var(--sx-bg-surface);
    border: 1px solid var(--sx-border);
    border-radius: 9px;
    padding: 5px;
  }
  .ctx-item {
    display: flex; align-items: center; gap: 9px;
    width: 100%; padding: 7px 9px;
    border: none; border-radius: 6px;
    background: transparent; cursor: pointer;
    font-size: 12.5px; color: var(--sx-text-primary);
    text-align: left; position: relative;
  }
  .ctx-item:hover { background: var(--sx-bg-hover); }
  .ctx-item.active { background: var(--sx-brand-soft); color: var(--sx-brand); font-weight: 600; }
  .ctx-item .ci { color: var(--sx-text-secondary); display: inline-flex; width: 16px; justify-content: center; }
  .ctx-item.active .ci { color: var(--sx-brand); }
  .ctx-item .arr { margin-left: auto; color: var(--sx-text-hint); display: inline-flex; }
  .ctx-sep { height: 1px; background: var(--sx-border); margin: 4px 6px; }

  .color-sub {
    position: fixed; z-index: 61;
    min-width: 96px;
    background: var(--sx-bg-surface);
    border: 1px solid var(--sx-border);
    border-radius: 9px;
    padding: 5px;
  }
  .color-opt {
    display: flex; align-items: center; gap: 8px;
    width: 100%; padding: 6px 8px;
    border: none; border-radius: 6px; background: transparent; cursor: pointer;
    font-size: 12px; color: var(--sx-text-primary); text-align: left;
  }
  .color-opt:hover { background: var(--sx-bg-hover); }
  .color-opt .ck { color: var(--sx-brand); display: inline-flex; width: 14px; }
  .more-colors { font-size: 11.5px; color: var(--sx-text-hint); padding: 4px 8px 2px; }

  /* ============ 底部标签栏 ============ */
  .sheet-tabs {
    height: 38px; flex-shrink: 0;
    display: flex; align-items: center; gap: 2px;
    padding: 0 10px;
    border-top: 1px solid var(--sx-border);
    background: var(--sx-bg-surface);
  }
  .tab-add {
    width: 28px; height: 28px;
    border: none; border-radius: 6px;
    background: transparent; cursor: pointer;
    color: var(--sx-text-secondary);
    display: inline-flex; align-items: center; justify-content: center;
  }
  .tab-add:hover { background: var(--sx-bg-hover); color: var(--sx-brand); }
  .sheet-tab {
    position: relative;
    display: flex; align-items: center; gap: 6px;
    height: 38px; padding: 0 16px;
    border: none; background: transparent; cursor: pointer;
    font-size: 13px; color: var(--sx-text-secondary);
  }
  .sheet-tab:hover { color: var(--sx-text-primary); }
  .sheet-tab.on { color: var(--sx-brand); font-weight: 600; }
  .sheet-tab.on::after {
    content: '';
    position: absolute; left: 12px; right: 12px; bottom: 0;
    height: 2.5px; border-radius: 1px;
    background: var(--sx-brand);
  }
  .sheet-tab .tab-color { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .sheet-tab.hidden-sheet { color: var(--sx-text-hint); font-style: italic; }
  .sheet-tab .tab-eye { display: inline-flex; color: var(--sx-text-hint); }

  /* ============ 状态栏 ============ */
  .statusbar {
    height: 34px; flex-shrink: 0;
    display: flex; align-items: center; gap: 18px;
    padding: 0 16px;
    border-top: 1px solid var(--sx-border);
    font-size: 12px; color: var(--sx-text-secondary);
    background: var(--sx-bg-surface);
  }
  .status-stats { display: flex; gap: 16px; }
  .zoom { margin-left: auto; display: flex; align-items: center; gap: 8px; }
  .zoom button {
    border: none; background: transparent; cursor: pointer;
    color: var(--sx-text-secondary); padding: 3px; border-radius: 4px;
    display: inline-flex;
  }
  .zoom button:hover { background: var(--sx-bg-hover); }

  /* ============ Toast ============ */
  .toast {
    position: fixed; left: 50%; bottom: 60px; transform: translateX(-50%);
    background: #1f2937; color: #fff;
    font-size: 13px;
    padding: 9px 18px; border-radius: 8px;
    z-index: 99;
    animation: toast-in 0.2s ease-out;
  }
  @keyframes toast-in {
    from { opacity: 0; transform: translate(-50%, 8px); }
    to { opacity: 1; transform: translate(-50%, 0); }
  }
`
