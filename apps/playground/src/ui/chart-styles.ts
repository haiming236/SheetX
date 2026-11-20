/**
 * SheetX 第 12 张 · 图表与数据可视化 — 样式
 *
 * 风格约束：无 glow / shadow，简洁清爽，提示文字调淡。
 */
import { css } from 'lit'

export const chartStyles = css`
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
  .merge-label { font-size: 13px; display: inline-flex; align-items: center; gap: 5px; }

  /* ============ 主体 ============ */
  .body { flex: 1; display: flex; min-height: 0; }
  .main-col { flex: 1; min-width: 0; display: flex; flex-direction: column; }

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

  /* ---- 画布（网格 + 悬浮图表） ---- */
  .canvas { flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: auto; }
  .col-headers { display: flex; flex-shrink: 0; }
  .col-corner {
    width: 44px; height: 26px; flex-shrink: 0;
    border-right: 1px solid var(--sx-grid-line);
    border-bottom: 1px solid var(--sx-grid-line);
    background: var(--sx-bg-subtle);
  }
  .col-head {
    width: 64px; height: 26px; flex-shrink: 0;
    display: inline-flex; align-items: center; justify-content: center;
    border-right: 1px solid var(--sx-grid-line);
    border-bottom: 1px solid var(--sx-grid-line);
    background: var(--sx-bg-subtle);
    color: var(--sx-text-secondary);
    font-size: 12px; font-weight: 500;
  }
  .col-fill {
    flex: 1; height: 26px;
    background: var(--sx-bg-subtle);
    border-bottom: 1px solid var(--sx-grid-line);
  }
  .canvas-body { display: flex; flex: 1; min-height: 0; }
  .row-headers { width: 44px; flex-shrink: 0; }
  .row-head {
    height: 32px;
    display: flex; align-items: center; justify-content: center;
    border-right: 1px solid var(--sx-grid-line);
    border-bottom: 1px solid var(--sx-grid-line);
    background: var(--sx-bg-subtle);
    color: var(--sx-text-secondary);
    font-size: 12px; font-weight: 500;
    box-sizing: border-box;
  }
  .grid-area {
    flex: 1; min-width: 950px; position: relative;
    background-image:
      linear-gradient(to right, var(--sx-grid-line) 1px, transparent 1px),
      linear-gradient(to bottom, var(--sx-grid-line) 1px, transparent 1px);
    background-size: 64px 32px;
  }

  /* ---- 数据块（标题横幅 + 表格） ---- */
  .data-block { position: absolute; left: 0; top: 0; width: 320px; }
  .banner {
    height: 30px; margin: 1px 2px;
    border-radius: 6px;
    background: linear-gradient(135deg, #60a5fa, #3b82f6 55%, #2f6fe4);
    color: #fff;
    display: flex; align-items: center; gap: 8px;
    padding: 0 10px;
    font-size: 14.5px; font-weight: 700; letter-spacing: 0.5px;
  }
  .banner .bi { display: inline-flex; }
  .data-grid { display: grid; grid-template-columns: repeat(5, 64px); }
  .data-cell {
    height: 32px; box-sizing: border-box;
    border-right: 1px solid var(--sx-grid-line);
    border-bottom: 1px solid var(--sx-grid-line);
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; color: var(--sx-text-primary);
    padding: 0 4px;
    white-space: nowrap; overflow: hidden;
  }
  .data-cell.h {
    background: var(--sx-grid-header-bg);
    font-weight: 600; color: var(--sx-text-primary);
  }
  .data-cell.num { font-variant-numeric: tabular-nums; }

  /* ---- 图表卡片 ---- */
  .hero-card {
    position: absolute; left: 336px; top: 4px;
    width: 430px; height: 252px;
    background: var(--sx-bg-surface);
    border: 1px solid var(--sx-border);
    border-radius: 10px;
    padding: 10px 14px 6px;
    box-sizing: border-box;
  }
  .hero-title { display: flex; align-items: center; gap: 7px; font-size: 14px; font-weight: 700; }
  .hero-title .ic { color: var(--sx-brand); display: inline-flex; }
  .legend { display: flex; justify-content: center; gap: 16px; margin-top: 2px; }
  .legend .lg { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--sx-text-secondary); }
  .legend .sq { width: 10px; height: 10px; border-radius: 2.5px; }
  .legend .ln { display: inline-flex; align-items: center; }
  .hero-svg { display: flex; justify-content: center; margin-top: 2px; }

  .cards-row { position: absolute; left: 0; top: 268px; display: flex; gap: 12px; }
  .chart-card {
    background: var(--sx-bg-surface);
    border: 1px solid var(--sx-border);
    border-radius: 10px;
    padding: 10px 12px;
    box-sizing: border-box;
  }
  .chart-card .cc-title { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; margin-bottom: 4px; }
  .chart-card .cc-title .ic { color: var(--sx-brand); display: inline-flex; }
  .cc-body { display: flex; align-items: center; gap: 10px; }
  .donut-wrap { position: relative; flex-shrink: 0; }
  .donut-center {
    position: absolute; inset: 0;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    pointer-events: none;
  }
  .donut-center b { font-size: 16px; font-weight: 700; }
  .donut-center span { font-size: 10px; color: var(--sx-text-hint); margin-top: 1px; }
  .v-legend { display: flex; flex-direction: column; gap: 9px; }
  .v-legend .li { display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: var(--sx-text-secondary); white-space: nowrap; }
  .v-legend .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .v-legend .pct { margin-left: 2px; font-weight: 600; color: var(--sx-text-primary); }

  /* ---- 面板关闭后的悬浮按钮 ---- */
  .panel-fab {
    position: absolute; right: 10px; top: 8px; z-index: 20;
    display: inline-flex; align-items: center; gap: 6px;
    height: 30px; padding: 0 11px;
    border: 1px solid var(--sx-border);
    border-radius: 8px;
    background: var(--sx-bg-surface);
    cursor: pointer;
    font-size: 12.5px; color: var(--sx-text-primary);
  }
  .panel-fab:hover { background: var(--sx-bg-hover); }
  .panel-fab .ic { color: var(--sx-brand); display: inline-flex; }

  /* ============ 右侧图表设置面板 ============ */
  .chart-panel {
    width: 262px; flex-shrink: 0;
    border-left: 1px solid var(--sx-border);
    background: var(--sx-bg-surface);
    padding: 13px 15px;
    display: flex; flex-direction: column;
    overflow-y: auto;
  }
  .cp-head { display: flex; align-items: center; gap: 8px; }
  .cp-head .ic { color: var(--sx-brand); display: inline-flex; }
  .cp-head .tt { font-size: 14px; font-weight: 700; flex: 1; }
  .cp-close {
    border: none; background: transparent; cursor: pointer;
    color: var(--sx-text-hint); padding: 4px; border-radius: 5px;
    display: inline-flex;
  }
  .cp-close:hover { background: var(--sx-bg-hover); color: var(--sx-text-primary); }
  .cp-tabs { display: flex; gap: 16px; border-bottom: 1px solid var(--sx-border); margin: 11px 0 13px; }
  .cp-tab {
    border: none; background: transparent; cursor: pointer;
    padding: 6px 2px; font-size: 13px; color: var(--sx-text-secondary);
    border-bottom: 2px solid transparent;
  }
  .cp-tab.on { color: var(--sx-brand); font-weight: 600; border-bottom-color: var(--sx-brand); }
  .cp-label { display: block; font-size: 12.5px; color: var(--sx-text-primary); margin: 0 0 8px; }
  .cp-section { margin-bottom: 15px; }

  .type-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .type-card {
    display: flex; flex-direction: column; align-items: center; gap: 4px;
    padding: 9px 0 7px;
    border: 1px solid var(--sx-border-input);
    border-radius: 8px;
    background: var(--sx-bg-surface);
    cursor: pointer;
    color: var(--sx-text-secondary);
    font-size: 11.5px;
  }
  .type-card:hover { background: var(--sx-bg-hover); }
  .type-card .ic { display: inline-flex; color: var(--sx-text-secondary); }
  .type-card.on {
    border-color: var(--sx-brand);
    background: var(--sx-brand-soft);
    color: var(--sx-brand); font-weight: 600;
  }
  .type-card.on .ic { color: var(--sx-brand); }

  .preset-row { display: flex; gap: 8px; }
  .preset-thumb {
    flex: 1; padding: 4px;
    border: 1px solid var(--sx-border-input);
    border-radius: 8px;
    background: var(--sx-bg-surface);
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
  }
  .preset-thumb:hover { background: var(--sx-bg-hover); }
  .preset-thumb.on { border-color: var(--sx-brand); }
  .more-styles {
    display: flex; align-items: center; justify-content: center; gap: 4px;
    width: 100%; margin-top: 7px;
    border: none; background: transparent; cursor: pointer;
    font-size: 12px; color: var(--sx-brand);
  }
  .more-styles:hover { text-decoration: underline; }

  .series-btn {
    display: flex; align-items: center; gap: 7px;
    width: 100%; height: 32px; padding: 0 10px;
    border: 1px solid var(--sx-border-input);
    border-radius: 7px;
    background: var(--sx-bg-surface);
    cursor: pointer;
    font-size: 13px; color: var(--sx-text-primary);
  }
  .series-btn:hover { background: var(--sx-bg-hover); }
  .series-btn .dot { width: 9px; height: 9px; border-radius: 50%; }
  .series-btn .caret { margin-left: auto; color: var(--sx-text-hint); display: inline-flex; }
  .series-menu {
    margin-top: 5px;
    border: 1px solid var(--sx-border);
    border-radius: 7px;
    overflow: hidden;
  }
  .series-opt {
    display: flex; align-items: center; gap: 7px;
    width: 100%; padding: 7px 10px;
    border: none; background: var(--sx-bg-surface); cursor: pointer;
    font-size: 12.5px; color: var(--sx-text-primary); text-align: left;
  }
  .series-opt:hover { background: var(--sx-bg-hover); }
  .series-opt.on { background: var(--sx-brand-soft); color: var(--sx-brand); font-weight: 600; }
  .series-opt .dot { width: 8px; height: 8px; border-radius: 50%; }
  .series-opt .ck { margin-left: auto; display: inline-flex; }
  .add-series {
    display: flex; align-items: center; justify-content: center; gap: 5px;
    width: 100%; height: 30px; margin-top: 7px;
    border: 1px dashed var(--sx-border-input);
    border-radius: 7px;
    background: transparent; cursor: pointer;
    font-size: 12.5px; color: var(--sx-brand);
  }
  .add-series:hover { background: var(--sx-brand-soft); }

  .cp-input {
    width: 100%; height: 32px; padding: 0 10px;
    border: 1px solid var(--sx-border-input);
    border-radius: 7px;
    font-size: 13px; color: var(--sx-text-primary);
    background: var(--sx-bg-surface);
    outline: none; box-sizing: border-box;
  }
  .cp-input:focus { border-color: var(--sx-brand); }

  .cp-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .cp-row .cp-label { margin-bottom: 0; }

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

  .cp-select {
    display: flex; align-items: center; justify-content: space-between;
    width: 100%; height: 32px; padding: 0 10px;
    border: 1px solid var(--sx-border-input);
    border-radius: 7px;
    font-size: 13px; color: var(--sx-text-primary);
    cursor: default;
  }
  .cp-select .caret { color: var(--sx-text-hint); display: inline-flex; }
  .cp-btn {
    width: 100%; height: 32px;
    border: 1px solid var(--sx-border-input);
    border-radius: 7px;
    background: var(--sx-bg-surface); cursor: pointer;
    font-size: 13px; color: var(--sx-text-primary);
  }
  .cp-btn:hover { background: var(--sx-bg-hover); }
  .cp-btn.primary {
    border-color: var(--sx-brand);
    background: var(--sx-brand); color: #fff; font-weight: 600;
  }
  .cp-btn.primary:hover { filter: brightness(1.06); }
  .palette-dots { display: flex; gap: 8px; }
  .palette-dots button {
    width: 26px; height: 26px; border-radius: 7px;
    border: 2px solid transparent; cursor: pointer; padding: 0;
  }
  .palette-dots button.on { border-color: var(--sx-text-primary); }

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
    display: flex; align-items: center;
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

  /* ============ 状态栏 ============ */
  .statusbar {
    height: 34px; flex-shrink: 0;
    display: flex; align-items: center; gap: 18px;
    padding: 0 16px;
    border-top: 1px solid var(--sx-border);
    font-size: 12px; color: var(--sx-text-secondary);
    background: var(--sx-bg-surface);
  }
  .status-ok { display: flex; align-items: center; gap: 6px; color: #16a34a; }
  .status-stats { display: flex; gap: 16px; margin-left: auto; }
  .zoom { display: flex; align-items: center; gap: 8px; }
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
