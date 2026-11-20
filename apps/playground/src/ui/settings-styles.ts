/**
 * SheetX 第 10 张 · 主题与个性化设置 — 样式
 *
 * 风格约束：无 glow / shadow，简洁清爽；预览窗口通过 --pv-* 局部变量响应设置项。
 */
import { css } from 'lit'

export const settingsStyles = css`
  :host {
    display: block;
    min-height: 100%;
    background: var(--sx-bg-surface);
    color: var(--sx-text-primary);
    font-family: 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif;
    font-size: 14px;
  }

  .app { display: flex; flex-direction: column; min-height: 100%; }

  /* ============ 顶栏 ============ */
  .topbar {
    height: 52px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 20px;
    border-bottom: 1px solid var(--sx-border);
    background: var(--sx-bg-surface);
  }
  .traffic { display: flex; gap: 7px; }
  .traffic i { width: 11px; height: 11px; border-radius: 50%; }
  .traffic i:nth-child(1) { background: #f56c6c; }
  .traffic i:nth-child(2) { background: #f7ba2a; }
  .traffic i:nth-child(3) { background: #67c23a; }
  .brand {
    display: flex; align-items: center; gap: 7px;
    font-size: 17px; font-weight: 700; color: var(--sx-text-primary);
  }
  .brand svg { color: var(--sx-brand); }
  .topbar-right { margin-left: auto; display: flex; align-items: center; gap: 12px; }
  .search {
    display: flex; align-items: center; gap: 8px;
    width: 220px; height: 32px; padding: 0 12px;
    border: 1px solid var(--sx-border-input);
    border-radius: 8px;
    color: var(--sx-text-hint);
    background: var(--sx-bg-surface);
  }
  .search input {
    flex: 1; border: none; outline: none; background: transparent;
    font-size: 13px; color: var(--sx-text-primary); min-width: 0;
  }
  .search input::placeholder { color: var(--sx-text-hint); }
  .avatar {
    width: 32px; height: 32px; border-radius: 50%;
    background: #334155; color: #fff;
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 600; flex-shrink: 0;
  }

  /* ============ 主体 ============ */
  .layout { flex: 1; display: flex; min-height: 0; }

  .sidenav {
    width: 150px; flex-shrink: 0;
    background: var(--sx-bg-subtle);
    border-right: 1px solid var(--sx-border);
    padding: 14px 10px;
    display: flex; flex-direction: column; gap: 4px;
  }
  .back-link {
    display: flex; align-items: center; gap: 6px;
    padding: 8px 10px; margin-bottom: 12px;
    border: none; background: transparent; cursor: pointer;
    font-size: 13px; color: var(--sx-text-secondary);
    border-radius: 8px; text-align: left;
  }
  .back-link:hover { background: var(--sx-bg-hover); }
  .nav-item {
    position: relative;
    display: flex; align-items: center; gap: 9px;
    width: 100%; padding: 9px 10px;
    border: none; background: transparent; cursor: pointer;
    font-size: 13px; color: var(--sx-text-secondary);
    border-radius: 8px; text-align: left;
  }
  .nav-item:hover { background: var(--sx-bg-hover); }
  .nav-item.active {
    background: var(--sx-brand-soft);
    color: var(--sx-brand);
    font-weight: 600;
  }
  .nav-item.active::before {
    content: '';
    position: absolute; left: 0; top: 8px; bottom: 8px;
    width: 3px; border-radius: 2px;
    background: var(--sx-brand);
  }

  .main { flex: 1; display: flex; gap: 28px; padding: 22px 26px; min-width: 0; }
  .content { flex: 1; min-width: 0; }
  .aside { width: 430px; flex-shrink: 0; display: flex; flex-direction: column; gap: 22px; }

  h1 { margin: 0; font-size: 19px; font-weight: 700; color: var(--sx-text-primary); }
  .page-sub { margin: 6px 0 0; font-size: 13px; color: var(--sx-text-hint); }

  h2 { margin: 0; font-size: 15px; font-weight: 600; color: var(--sx-text-primary); }
  .sec-sub { margin: 5px 0 0; font-size: 12px; color: var(--sx-text-hint); }
  section { margin-top: 24px; }

  /* ============ 主题选择卡片 ============ */
  .theme-row { display: flex; gap: 14px; margin-top: 14px; }
  .theme-card {
    flex: 1; max-width: 158px;
    display: flex; flex-direction: column; align-items: center; gap: 9px;
    padding: 0 0 10px; border: none; background: transparent; cursor: pointer;
  }
  .thumb {
    width: 100%; height: 92px;
    border-radius: 10px;
    border: 2px solid var(--sx-border);
    overflow: hidden; position: relative;
    padding: 8px;
    transition: border-color 0.15s;
  }
  .theme-card:hover .thumb { border-color: var(--sx-border-strong); }
  .theme-card.on .thumb { border-color: var(--sx-brand); }
  .thumb-logo { display: block; width: 26px; height: 5px; border-radius: 3px; margin-bottom: 6px; }
  .thumb-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3px; }
  .thumb-grid span { height: 9px; border-radius: 2px; }
  .thumb-grid span.h { height: 11px; }

  .thumb-light { background: var(--sx-bg-surface); border-color: var(--sx-border); }
  .thumb-light .thumb-logo { background: var(--sx-brand); }
  .thumb-light .thumb-grid span { background: var(--sx-bg-subtle); border: 1px solid #e2e8f0; }
  .thumb-light .thumb-grid span.h { background: #bfdbfe; border-color: #93c5fd; }

  .thumb-dark { background: #1e2530; border-color: #313a48; }
  .thumb-dark .thumb-logo { background: #60a5fa; }
  .thumb-dark .thumb-grid span { background: #2a3444; border: 1px solid #3b4759; }
  .thumb-dark .thumb-grid span.h { background: #1d4ed8; border-color: #3b82f6; }

  .thumb-system {
    background: linear-gradient(135deg, #ffffff 0 49.6%, #1e2530 50.4% 100%);
    border-color: var(--sx-border);
  }
  .thumb-system .thumb-logo { background: linear-gradient(135deg, var(--sx-brand) 50%, #60a5fa 50%); }
  .thumb-system .thumb-grid span { background: rgba(100, 116, 139, 0.22); border: 1px solid rgba(100, 116, 139, 0.35); }
  .thumb-system .thumb-grid span.h { background: rgba(59, 130, 246, 0.55); border-color: rgba(59, 130, 246, 0.7); }

  .radio {
    width: 16px; height: 16px; border-radius: 50%;
    border: 1.5px solid var(--sx-border-strong);
    display: inline-flex; align-items: center; justify-content: center;
    flex-shrink: 0; background: var(--sx-bg-surface);
  }
  .radio .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--sx-brand); }
  .radio.on { border-color: var(--sx-brand); }
  .theme-label {
    display: flex; align-items: center; gap: 7px;
    font-size: 13px; color: var(--sx-text-primary);
  }

  /* ============ 表格配色 ============ */
  .palette-row { display: flex; gap: 12px; margin-top: 14px; flex-wrap: wrap; }
  .swatch {
    position: relative;
    width: 88px;
    display: flex; flex-direction: column; align-items: center; gap: 7px;
    padding: 9px 9px 8px;
    border: 1.5px solid var(--sx-border);
    border-radius: 10px;
    background: var(--sx-bg-surface);
    cursor: pointer;
    transition: border-color 0.15s;
  }
  .swatch:hover { border-color: var(--sx-border-strong); }
  .swatch.on { border-color: var(--sx-brand); }
  .swatch-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px;
    width: 100%;
  }
  .swatch-grid span { height: 13px; border-radius: 3px; border: 1px solid rgba(15, 23, 42, 0.08); }
  .swatch-label { font-size: 12px; color: var(--sx-text-secondary); }
  .swatch-badge {
    position: absolute; right: -7px; bottom: 18px;
    width: 18px; height: 18px; border-radius: 50%;
    background: var(--sx-brand); color: #fff;
    display: inline-flex; align-items: center; justify-content: center;
    border: 2px solid var(--sx-bg-surface);
  }

  /* ============ 界面布局 / 功能面板 ============ */
  .duo { display: flex; gap: 28px; align-items: flex-start; }
  .duo .layout-sec { flex: 1.5; min-width: 0; }
  .duo .panel-sec { flex: 1; min-width: 0; }

  .layout-row { display: flex; gap: 10px; margin-top: 14px; }
  .layout-card {
    flex: 1;
    display: flex; flex-direction: column; align-items: center; gap: 8px;
    padding: 0 0 9px; border: none; background: transparent; cursor: pointer;
  }
  .layout-thumb {
    width: 100%; height: 64px;
    border: 2px solid var(--sx-border);
    border-radius: 8px;
    background: var(--sx-bg-subtle);
    overflow: hidden;
    display: flex; flex-direction: column;
    transition: border-color 0.15s;
  }
  .layout-card:hover .layout-thumb { border-color: var(--sx-border-strong); }
  .layout-card.on .layout-thumb { border-color: var(--sx-brand); }
  .lt-top { height: 10px; background: var(--sx-brand-soft); border-bottom: 1px solid var(--sx-border); display: flex; align-items: center; gap: 3px; padding: 0 5px; }
  .lt-top i { width: 8px; height: 3px; border-radius: 2px; background: var(--sx-brand); opacity: 0.55; }
  .lt-body { flex: 1; display: flex; }
  .lt-side { width: 22%; background: var(--sx-brand-soft); border-right: 1px solid var(--sx-border); }
  .lt-main { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 3px; padding: 4px; }
  .lt-main span { border-radius: 2px; background: var(--sx-bg-surface); border: 1px solid var(--sx-border); }
  .layout-compact .lt-top { height: 7px; }
  .layout-compact .lt-main { gap: 2px; padding: 3px; }
  .layout-compact .lt-main span { height: 8px; }
  .lt-main span { height: auto; }
  .layout-label { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--sx-text-primary); }

  .check-list { display: flex; flex-direction: column; gap: 12px; margin-top: 16px; }
  .check-item {
    display: flex; align-items: center; gap: 9px;
    border: none; background: transparent; padding: 0; cursor: pointer;
    font-size: 13px; color: var(--sx-text-primary); text-align: left;
  }
  .checkbox {
    width: 16px; height: 16px; border-radius: 4px;
    border: 1.5px solid var(--sx-border-strong);
    display: inline-flex; align-items: center; justify-content: center;
    color: #fff; flex-shrink: 0; background: var(--sx-bg-surface);
  }
  .checkbox.on { background: var(--sx-brand); border-color: var(--sx-brand); }

  /* ============ 开关 ============ */
  .switch-list { display: flex; flex-direction: column; gap: 14px; margin-top: 14px; }
  .switch-row {
    display: flex; align-items: center; justify-content: space-between; gap: 14px;
    font-size: 13px; color: var(--sx-text-primary);
  }
  .switch {
    position: relative; width: 40px; height: 22px;
    border: none; border-radius: 11px; cursor: pointer;
    background: #cbd5e1; flex-shrink: 0;
    transition: background 0.18s;
    padding: 0;
  }
  .switch .knob {
    position: absolute; top: 2px; left: 2px;
    width: 18px; height: 18px; border-radius: 50%;
    background: var(--sx-bg-surface);
    transition: transform 0.18s;
  }
  .switch.on { background: var(--sx-brand); }
  .switch.on .knob { transform: translateX(18px); }

  /* ============ 字体设置 ============ */
  .font-row { display: flex; align-items: center; gap: 8px; margin-top: 14px; flex-wrap: wrap; }
  .font-label { font-size: 12px; color: var(--sx-text-secondary); flex-shrink: 0; }

  .sel { position: relative; }
  .sel-btn {
    display: flex; align-items: center; justify-content: space-between; gap: 6px;
    min-width: 88px; height: 32px; padding: 0 9px;
    border: 1px solid var(--sx-border-input);
    border-radius: 8px;
    background: var(--sx-bg-surface);
    font-size: 13px; color: var(--sx-text-primary);
    cursor: pointer;
  }
  .sel-btn:hover { border-color: var(--sx-border-strong); }
  .sel-btn .txt { white-space: nowrap; }
  .sel-btn .caret { color: var(--sx-text-hint); display: inline-flex; }
  .sel-menu {
    position: absolute; top: calc(100% + 4px); left: 0; z-index: 30;
    min-width: 100%;
    background: var(--sx-bg-surface);
    border: 1px solid var(--sx-border);
    border-radius: 8px;
    padding: 4px;
    display: flex; flex-direction: column;
  }
  .sel-opt {
    border: none; background: transparent; cursor: pointer;
    padding: 6px 10px; border-radius: 6px;
    font-size: 13px; color: var(--sx-text-primary); text-align: left;
    white-space: nowrap;
  }
  .sel-opt:hover { background: var(--sx-bg-hover); }
  .sel-opt.on { color: var(--sx-brand); background: var(--sx-brand-soft); }

  /* ============ 预览窗口 ============ */
  .preview {
    --pv-bg: #ffffff;
    --pv-panel: #f8fafc;
    --pv-border: var(--sx-border);
    --pv-text: #1f2937;
    --pv-text-2: #8a93a3;
    --pv-head-text: #ffffff;
    --pv-cell-alt: #f0f6ff;
    --pv-header: #3b82f6;
    --pv-border-strong: #c9dcfb;

    border: 1px solid var(--sx-border);
    border-radius: 12px;
    background: var(--pv-bg);
    color: var(--pv-text);
    overflow: hidden;
  }
  .preview.dark {
    --pv-bg: #1e2029;
    --pv-panel: #262833;
    --pv-border: #31343f;
    --pv-text: #e8eaed;
    --pv-text-2: #8f96a5;
    --pv-cell-alt: rgba(148, 163, 184, 0.09);
    --pv-border-strong: #3d414e;
    /* 预览内嵌品牌文字（sxLogo 内联引用 --sx-text-primary）在深色下翻转为浅色 */
    --sx-text-primary: #e8eaed;
  }
  .pv-chrome {
    display: flex; align-items: center; gap: 8px;
    height: 38px; padding: 0 10px;
    background: var(--pv-panel);
    border-bottom: 1px solid var(--pv-border);
  }
  .pv-menu { display: flex; gap: 10px; margin-left: 4px; }
  .pv-menu span { font-size: 12px; color: var(--pv-text-2); cursor: default; white-space: nowrap; }
  .pv-menu span.on { color: var(--sx-brand); font-weight: 600; }
  .pv-brand { display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 700; flex-shrink: 0; }
  .pv-brand svg { color: var(--sx-brand); }

  .pv-toolbar {
    display: flex; align-items: center; gap: 4px;
    padding: 6px 8px;
    border-bottom: 1px solid var(--pv-border);
    background: var(--pv-bg);
  }
  .pv-tool {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 22px; height: 24px;
    border: none; background: transparent; cursor: pointer;
    border-radius: 5px; color: var(--pv-text-2);
    font-size: 12px; padding: 0 3px;
  }
  .pv-tool:hover { background: var(--pv-cell-alt); color: var(--pv-text); }
  .pv-tool b { font-weight: 700; }
  .pv-tool i { font-style: italic; font-family: Georgia, serif; }
  .pv-tool u { text-decoration: underline; }
  .pv-tool .fc { color: #ef4444; text-decoration: underline; text-underline-offset: 2px; }
  .pv-sep { width: 1px; height: 16px; background: var(--pv-border); margin: 0 2px; flex-shrink: 0; }
  .pv-select {
    display: flex; align-items: center; gap: 4px;
    height: 24px; padding: 0 6px;
    border: 1px solid var(--pv-border);
    border-radius: 5px;
    font-size: 12px; color: var(--pv-text);
    cursor: default; white-space: nowrap;
  }
  .pv-select .caret { color: var(--pv-text-2); display: inline-flex; }

  .pv-formula {
    display: flex; align-items: center; gap: 8px;
    padding: 5px 10px;
    border-bottom: 1px solid var(--pv-border);
    background: var(--pv-bg);
  }
  .pv-fx {
    font-size: 11px; font-style: italic; font-weight: 600;
    color: var(--pv-text-2);
    border: 1px solid var(--pv-border);
    border-radius: 4px; padding: 1px 5px;
  }
  .pv-formula-input { flex: 1; height: 18px; }

  .pv-body { overflow: hidden; }
  .preview.smooth .pv-body { scroll-behavior: smooth; }

  .pv-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .pv-table th, .pv-table td {
    border: 1px solid var(--pv-border);
    font-size: inherit;
    text-align: center;
    padding: 0 6px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .preview.no-grid .pv-table th, .preview.no-grid .pv-table td { border-color: transparent; }
  .pv-table thead th {
    background: var(--pv-panel);
    color: var(--pv-text-2);
    font-weight: 500; font-size: 11px;
    height: 22px;
  }
  .pv-table .pv-rowhead {
    background: var(--pv-panel);
    color: var(--pv-text-2);
    font-weight: 500; font-size: 11px;
    width: 30px;
  }
  .pv-table td.head-cell {
    background: var(--pv-header);
    color: var(--pv-head-text);
    font-weight: 600;
    height: 30px;
  }
  .pv-table td { height: 30px; background: var(--pv-bg); }
  .pv-table td.num { text-align: right; }
  .pv-table td.hl-row { background: var(--pv-cell-alt); }
  .pv-table td.hl-col { background: var(--pv-cell-alt); }
  .pv-table td.head-cell.hl-row, .pv-table td.head-cell.hl-col { background: var(--pv-header); }
  .pv-table td.hl-cell { outline: 2px solid var(--sx-brand); outline-offset: -2px; }

  .pv-tabs {
    display: flex; align-items: center; gap: 4px;
    padding: 5px 10px;
    border-top: 1px solid var(--pv-border);
    background: var(--pv-panel);
  }
  .pv-tab {
    display: flex; align-items: center; gap: 4px;
    height: 24px; padding: 0 12px;
    border: none; background: transparent; cursor: pointer;
    font-size: 12px; color: var(--pv-text-2);
    border-radius: 5px;
    position: relative;
  }
  .pv-tab.on { color: var(--sx-brand); font-weight: 600; }
  .pv-tab.on::after {
    content: '';
    position: absolute; left: 10px; right: 10px; bottom: 0;
    height: 2px; border-radius: 1px;
    background: var(--sx-brand);
  }
  .pv-zoom { margin-left: auto; display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--pv-text-2); }

  /* ============ 操作按钮 ============ */
  .actions { display: flex; gap: 12px; margin-top: 30px; }
  .btn {
    height: 36px; padding: 0 22px;
    border-radius: 8px; cursor: pointer;
    font-size: 13px; font-weight: 600;
    border: 1px solid transparent;
  }
  .btn-primary { background: var(--sx-brand); color: #fff; }
  .btn-primary:hover { background: var(--sx-brand-hover); }
  .btn-ghost {
    background: var(--sx-bg-surface); color: var(--sx-text-secondary);
    border-color: var(--sx-border-input);
  }
  .btn-ghost:hover { border-color: var(--sx-border-strong); color: var(--sx-text-primary); }

  /* ============ 占位页（非外观主题导航） ============ */
  .placeholder {
    margin-top: 60px;
    display: flex; flex-direction: column; align-items: center; gap: 12px;
    color: var(--sx-text-hint);
  }
  .placeholder .ph-icon {
    width: 56px; height: 56px; border-radius: 14px;
    background: var(--sx-bg-subtle);
    display: flex; align-items: center; justify-content: center;
    color: var(--sx-text-hint);
  }

  /* ============ Toast ============ */
  .toast {
    position: fixed; left: 50%; bottom: 34px; transform: translateX(-50%);
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
