/**
 * SheetX 第 17 张 · 打印预览与页面布局 — 样式
 *
 * 纪律：无 glow / shadow；设置项卡片用 var(--sx-bg-subtle)（浅色 #f8fafc / 深色适配）；
 * 提示文字用 --sx-text-hint；纸张本身保持白色（打印语义），不跟随主题。
 */
import { css } from 'lit'

export const printStyles = css`
  :host {
    display: block;
    height: 100%;
    background: var(--sx-bg-surface);
    color: var(--sx-text-primary);
    font-family: 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif;
    font-size: 14px;
  }
  * { box-sizing: border-box; }
  button, input, select { font-family: inherit; font-size: inherit; color: inherit; }
  button { cursor: pointer; }

  .app { display: flex; flex-direction: column; height: 100%; overflow: hidden; }

  /* ============ 顶栏 ============ */
  .topbar {
    height: 50px; flex-shrink: 0;
    display: flex; align-items: center; gap: 14px;
    padding: 0 18px; border-bottom: 1px solid var(--sx-border);
    background: var(--sx-bg-surface);
  }
  .traffic { display: flex; gap: 7px; }
  .traffic i { width: 11px; height: 11px; border-radius: 50%; }
  .traffic i:nth-child(1) { background: #f56c6c; }
  .traffic i:nth-child(2) { background: #f7ba2a; }
  .traffic i:nth-child(3) { background: #67c23a; }
  .brand { display: flex; align-items: center; color: var(--sx-text-primary); font-weight: 700; font-size: 15px; gap: 7px; }
  .top-menus { display: flex; gap: 2px; }
  .top-menu {
    border: 0; background: transparent; padding: 6px 12px; border-radius: 6px;
    color: var(--sx-text-secondary); font-size: 13.5px;
  }
  .top-menu:hover { background: var(--sx-bg-hover); }
  .top-menu.active { color: var(--sx-brand); font-weight: 600; }
  .top-right { margin-left: auto; display: flex; align-items: center; gap: 12px; }
  .search {
    display: flex; align-items: center; gap: 7px;
    width: 200px; height: 30px; padding: 0 11px;
    border: 1px solid var(--sx-border-input); border-radius: 7px;
    background: var(--sx-bg-subtle); color: var(--sx-text-hint); font-size: 12.5px;
  }
  .search input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; font-size: 12.5px; }
  .avatar {
    width: 28px; height: 28px; border-radius: 50%; background: #64748b; color: #fff;
    display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600;
  }

  /* ============ 工具栏 ============ */
  .toolbar {
    height: 46px; flex-shrink: 0; display: flex; align-items: center; gap: 8px;
    padding: 0 16px; border-bottom: 1px solid var(--sx-border);
    background: var(--sx-bg-surface);
  }
  .tb-btn {
    display: inline-flex; align-items: center; gap: 6px;
    height: 30px; padding: 0 10px; border: 1px solid transparent; border-radius: 6px;
    background: transparent; color: var(--sx-text-secondary); font-size: 13px;
  }
  .tb-btn:hover { background: var(--sx-bg-hover); color: var(--sx-text-primary); }
  .tb-btn.active { color: var(--sx-brand); background: var(--sx-brand-soft); font-weight: 600; }
  .tb-sep { width: 1px; height: 18px; background: var(--sx-border); margin: 0 4px; }
  .zoom-select {
    height: 28px; padding: 0 6px; border: 1px solid var(--sx-border-input);
    border-radius: 6px; background: var(--sx-bg-surface); font-size: 12.5px;
  }
  .page-nav { display: flex; align-items: center; gap: 6px; margin-left: auto; }
  .page-nav button {
    width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
    border: 1px solid var(--sx-border-input); border-radius: 6px; background: var(--sx-bg-surface);
  }
  .page-nav button:hover { background: var(--sx-bg-hover); }
  .page-indicator {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 0 8px; height: 28px; border: 1px solid var(--sx-border-input); border-radius: 6px;
    font-size: 12.5px; color: var(--sx-text-secondary);
  }
  .page-indicator input { width: 26px; border: 0; outline: 0; background: transparent; text-align: center; color: var(--sx-text-primary); }

  /* ============ 主体 ============ */
  .body { flex: 1; display: flex; min-height: 0; background: var(--sx-bg-app); }

  /* --- 左侧设置 --- */
  .settings {
    width: 268px; flex-shrink: 0; overflow-y: auto;
    padding: 16px 14px 20px; border-right: 1px solid var(--sx-border);
    background: var(--sx-bg-surface);
  }
  .settings-head { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
  .settings-head .ico {
    width: 36px; height: 36px; border-radius: 8px; background: var(--sx-brand-soft); color: var(--sx-brand);
    display: flex; align-items: center; justify-content: center;
  }
  .settings-head h2 { margin: 0; font-size: 15px; font-weight: 600; }
  .settings-head p { margin: 2px 0 0; font-size: 11.5px; color: var(--sx-text-hint); }

  .field { margin-bottom: 15px; }
  .field-title {
    font-size: 12px; font-weight: 600; color: var(--sx-text-secondary);
    margin-bottom: 8px; letter-spacing: 0.2px;
  }
  .card {
    border: 1px solid var(--sx-border); border-radius: 8px;
    background: var(--sx-bg-subtle); padding: 10px;
  }
  .printer-row { display: flex; gap: 6px; }
  .printer-row select { flex: 1; min-width: 0; }
  .select, .input {
    height: 30px; padding: 0 8px; border: 1px solid var(--sx-border-input);
    border-radius: 6px; background: var(--sx-bg-surface); font-size: 12.5px; width: 100%;
  }
  .btn-sm {
    height: 30px; padding: 0 10px; border: 1px solid var(--sx-border-input);
    border-radius: 6px; background: var(--sx-bg-surface); font-size: 12.5px; white-space: nowrap;
  }
  .btn-sm:hover { background: var(--sx-bg-hover); }

  .radio-row { display: flex; align-items: center; gap: 8px; padding: 5px 2px; font-size: 12.5px; cursor: pointer; }
  .radio-row input { accent-color: var(--sx-brand); margin: 0; }
  .range-input { display: flex; align-items: center; gap: 6px; margin-top: 4px; padding-left: 22px; }
  .range-input .input { flex: 1; }

  .orient-row { display: flex; gap: 8px; }
  .orient-btn {
    flex: 1; height: 52px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
    border: 1px solid var(--sx-border-input); border-radius: 7px; background: var(--sx-bg-surface);
    font-size: 12px; color: var(--sx-text-secondary);
  }
  .orient-btn.active { border-color: var(--sx-brand); color: var(--sx-brand); background: var(--sx-brand-soft); }
  .orient-btn .paper-ico { border: 1.5px solid currentColor; border-radius: 2px; }
  .orient-btn .paper-ico.portrait { width: 16px; height: 22px; }
  .orient-btn .paper-ico.landscape { width: 22px; height: 16px; }

  .check-row { display: flex; align-items: center; gap: 8px; padding: 5px 2px; font-size: 12.5px; cursor: pointer; }
  .check-row input { accent-color: var(--sx-brand); margin: 0; }

  .print-btn {
    width: 100%; height: 38px; margin-top: 4px;
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    border: 0; border-radius: 7px; background: var(--sx-brand); color: #fff;
    font-size: 13.5px; font-weight: 600;
  }
  .print-btn:hover { background: var(--sx-brand-hover); }

  /* --- 预览区 --- */
  .preview {
    flex: 1; min-width: 0; overflow: auto;
    padding: 18px 22px 28px;
    display: flex; gap: 22px; align-items: flex-start; justify-content: center;
  }
  .preview.single { justify-content: center; }
  .paper {
    position: relative; flex-shrink: 0; background: #fff; color: #1f2937;
    border: 1px solid #d7dce5; overflow: hidden;
    transform-origin: top center;
  }
  .paper-inner {
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    color: #1f2937; font-size: 11px;
  }
  .paper-head {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 16px 8px; border-bottom: 2px solid #dbeafe;
    color: #334155; font-size: 10px;
  }
  .paper-head .logo { display: flex; align-items: center; gap: 6px; color: #2563eb; font-weight: 700; font-size: 12px; }
  .paper-title { padding: 12px 16px 4px; }
  .paper-title h1 { margin: 0; font-size: 17px; letter-spacing: 0.3px; color: #0f172a; }
  .paper-title p { margin: 4px 0 0; font-size: 10px; color: #64748b; }
  .paper-body { flex: 1; padding: 10px 16px; min-height: 0; }
  .paper-foot {
    display: flex; justify-content: space-between; align-items: center;
    padding: 8px 16px; border-top: 1px solid #e2e8f0;
    font-size: 9px; color: #94a3b8;
  }

  /* 报告内容 */
  .rep-section-title {
    display: flex; align-items: center; gap: 6px; margin: 10px 0 8px;
    font-size: 11px; font-weight: 600; color: #1e293b;
  }
  .rep-section-title .dot { width: 3px; height: 12px; border-radius: 2px; background: #3b82f6; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  .kpi {
    border: 1px solid #e2e8f0; border-radius: 6px; background: #f8fafc;
    padding: 9px; display: flex; flex-direction: column; gap: 4px;
  }
  .kpi .k-label { font-size: 9px; color: #64748b; }
  .kpi .k-value { font-size: 16px; font-weight: 700; color: #0f172a; }
  .kpi .k-delta { font-size: 9px; color: #16a34a; display: flex; align-items: center; gap: 3px; }

  .chart-row { display: flex; gap: 8px; }
  .chart-card {
    flex: 1; min-width: 0; border: 1px solid #e2e8f0; border-radius: 6px;
    padding: 8px; background: #fff;
  }
  .chart-card h3 { margin: 0 0 6px; font-size: 10px; color: #334155; font-weight: 600; }
  .chart-card svg { display: block; width: 100%; height: auto; }
  .chart-card .legend { display: flex; flex-wrap: wrap; gap: 4px 8px; margin-top: 4px; font-size: 8px; color: #64748b; }
  .chart-card .legend span { display: inline-flex; align-items: center; gap: 3px; }
  .chart-card .legend i { width: 6px; height: 6px; border-radius: 50%; }

  .rep-table { width: 100%; border-collapse: collapse; font-size: 9.5px; }
  .rep-table th {
    background: #eff6ff; color: #1e40af; font-weight: 600; text-align: left;
    padding: 6px 8px; border-bottom: 1px solid #dbeafe;
  }
  .rep-table td { padding: 6px 8px; border-bottom: 1px solid #eef2f7; color: #334155; }
  .rep-table tr:nth-child(even) td { background: #f8fafc; }
  .rep-table .num { text-align: right; font-variant-numeric: tabular-nums; }

  .conclusion {
    border: 1px solid #bfdbfe; background: #eff6ff; border-radius: 6px;
    padding: 10px 12px; font-size: 10px; color: #1e3a5f; line-height: 1.7;
  }
  .conclusion b { display: flex; align-items: center; gap: 5px; color: #1d4ed8; }

  /* 单色打印：整页去色 */
  .paper.mono, .paper.mono * { filter: grayscale(1) !important; }

  /* ============ 底部状态栏 ============ */
  .statusbar {
    height: 42px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; gap: 14px;
    border-top: 1px solid var(--sx-border); background: var(--sx-bg-surface);
    font-size: 12.5px; color: var(--sx-text-secondary);
  }
  .statusbar button {
    display: inline-flex; align-items: center; gap: 6px;
    height: 28px; padding: 0 10px; border: 1px solid var(--sx-border-input);
    border-radius: 6px; background: var(--sx-bg-surface); font-size: 12px;
  }
  .statusbar button.active { border-color: var(--sx-brand); color: var(--sx-brand); background: var(--sx-brand-soft); }
  .statusbar .sep { width: 1px; height: 18px; background: var(--sx-border); }
  .fit-badge { color: var(--sx-text-hint); font-size: 11.5px; }

  /* 自定义页边距弹层 */
  .margin-pop {
    margin-top: 8px; padding: 10px; border: 1px solid var(--sx-border);
    border-radius: 7px; background: var(--sx-bg-surface);
  }
  .margin-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
  .margin-grid label { font-size: 11px; color: var(--sx-text-hint); display: flex; flex-direction: column; gap: 3px; }
  .margin-grid input { width: 100%; }
`
