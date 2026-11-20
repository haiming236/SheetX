/**
 * SheetX 第 25 张 · 属性设置与企业个性化配置 — 样式
 * 约束：无 glow / shadow；组件卡片用 #f3f4f8 背景；提示文字调淡；浅深双主题。
 */
import { css } from 'lit'

export const propsStyles = css`
  :host { display: block; }

  /* ============ 整体骨架 ============ */
  .app {
    display: flex;
    flex-direction: column;
    min-height: calc(100vh - 42px);
    background: var(--sx-bg-app);
    font-family: 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
    color: var(--sx-text-primary);
  }
  .menu-bar, .toolbar, .formula-bar, .sheet-tabs {
    display: flex;
    align-items: center;
    background: var(--sx-bg-surface);
  }
  .menu-bar {
    height: 46px;
    padding: 0 16px;
    gap: 18px;
    border-bottom: 1px solid var(--sx-border);
  }
  .brand { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; }
  .brand-logo {
    width: 24px; height: 24px; border-radius: 6px; background: var(--sx-brand);
    display: inline-flex; align-items: center; justify-content: center; color: #fff;
  }
  .brand-logo svg { display: block; }
  .menu-list { display: flex; align-items: center; gap: 2px; flex: 1; }
  .menu-item {
    padding: 6px 11px; border: 0; border-radius: 6px; background: transparent;
    color: var(--sx-text-secondary); font-size: 13px;
  }
  .menu-item:hover { background: var(--sx-bg-hover); color: var(--sx-text-primary); }
  .menu-item.active { color: var(--sx-brand); font-weight: 600; background: var(--sx-brand-soft); }
  .menu-right { display: flex; align-items: center; gap: 10px; margin-left: auto; }
  .icon-btn {
    width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center;
    border: 0; border-radius: 6px; background: transparent; color: var(--sx-text-secondary);
  }
  .icon-btn:hover { background: var(--sx-bg-hover); color: var(--sx-brand); }
  .icon-btn.on { background: var(--sx-brand-soft); color: var(--sx-brand); }
  .avatar {
    width: 28px; height: 28px; border-radius: 50%; background: var(--sx-brand); color: #fff;
    display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600;
  }
  .user-chip { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--sx-text-primary); cursor: pointer; }

  /* ============ 工具栏 ============ */
  .toolbar {
    height: 42px; padding: 0 12px; gap: 6px; border-bottom: 1px solid var(--sx-border);
    overflow-x: auto; scrollbar-width: none;
  }
  .toolbar::-webkit-scrollbar { display: none; }
  .tool-group { display: flex; align-items: center; gap: 2px; padding-right: 8px; margin-right: 4px; border-right: 1px solid var(--sx-border); }
  .tool-group:last-child { border-right: 0; }
  .tool-btn {
    height: 28px; min-width: 28px; padding: 0 6px; border: 1px solid transparent; border-radius: 5px;
    background: transparent; color: var(--sx-text-secondary); display: inline-flex; align-items: center;
    justify-content: center; gap: 4px; font-size: 12px;
  }
  .tool-btn:hover { background: var(--sx-bg-hover); color: var(--sx-text-primary); }
  .tool-btn.on { border-color: var(--sx-border); background: var(--sx-bg-subtle); color: var(--sx-brand); }
  .tool-btn.square { border-color: var(--sx-border-strong); }
  .mini-select {
    height: 28px; padding: 0 6px; border: 1px solid var(--sx-border-input); border-radius: 5px;
    background: var(--sx-bg-surface); color: var(--sx-text-primary); font-size: 12px; outline: none;
  }
  .mini-select:focus { border-color: var(--sx-brand); }
  .mini-select.family { width: 104px; }
  .mini-select.size { width: 52px; }
  .mini-select.format { width: 96px; }
  .color-cell { position: relative; display: inline-flex; }
  .color-cell::after {
    content: ''; position: absolute; left: 5px; right: 5px; bottom: 4px; height: 3px; border-radius: 2px;
    background: var(--mark, var(--sx-brand)); pointer-events: none;
  }

  /* ============ 公式栏 ============ */
  .formula-bar { height: 36px; border-bottom: 1px solid var(--sx-border); font-size: 12px; }
  .addr-box {
    width: 62px; height: 100%; display: flex; align-items: center; justify-content: space-between;
    padding: 0 12px; border-right: 1px solid var(--sx-border); color: var(--sx-text-primary); font-weight: 600;
  }
  .fx-tag { width: 40px; text-align: center; color: var(--sx-text-hint); font-style: italic; font-family: Georgia, serif; }
  .formula-input { flex: 1; height: 100%; border: 0; outline: 0; background: transparent; color: var(--sx-text-primary); font: inherit; padding: 0 8px; }
  .formula-input::placeholder { color: var(--sx-text-hint); }

  /* ============ 主体：工作区 + 属性面板 ============ */
  .workspace { display: flex; flex: 1; min-height: 0; }

  /* ---- 左侧表格区 ---- */
  .sheet-area { flex: 1; min-width: 0; padding: 14px 16px; overflow: auto; }
  .sheet-card { background: var(--sx-bg-surface); border: 1px solid var(--sx-border); border-radius: 8px; overflow: hidden; }
  .report-title {
    background: var(--sx-brand); color: #fff; padding: 12px 16px;
    display: flex; align-items: center; gap: 10px;
  }
  .report-title h2 { margin: 0; font-size: 17px; font-weight: 600; letter-spacing: .5px; }
  .report-title .date { margin-left: auto; font-size: 11px; opacity: .9; }
  .data-table { width: 100%; border-collapse: collapse; font-size: 12px; table-layout: fixed; }
  .data-table th, .data-table td {
    border-bottom: 1px solid var(--sx-grid-line); border-right: 1px solid var(--sx-grid-line);
    padding: 7px 10px; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .data-table th:last-child, .data-table td:last-child { border-right: 0; }
  .data-table thead th { background: var(--sx-grid-header-bg); color: var(--sx-grid-header-text); font-weight: 600; }
  .data-table tbody tr:hover { background: var(--sx-bg-hover); }
  .data-table tr.total td { background: var(--sx-brand-soft); font-weight: 700; }
  .data-table tr.total td:first-child { color: var(--sx-brand); }
  .cell-name { text-align: left !important; padding-left: 14px; }
  .up { color: var(--sx-success); }
  .down { color: var(--sx-danger); }
  .arrow { font-size: 10px; margin-right: 2px; }
  .col-head {
    display: flex; background: var(--sx-bg-subtle); border-bottom: 1px solid var(--sx-border);
    font-size: 11px; color: var(--sx-text-hint);
  }
  .col-head span { flex: 1; text-align: center; padding: 4px 0; border-right: 1px solid var(--sx-grid-line); }
  .col-head span:first-child { flex: 0 0 40px; background: var(--sx-bg-hover); }
  .row-head {
    flex: 0 0 40px; background: var(--sx-bg-subtle); border-right: 1px solid var(--sx-grid-line);
  }

  /* ---- 图表区 ---- */
  .charts-row { display: grid; grid-template-columns: 1.15fr 1fr; gap: 12px; margin-top: 12px; }
  .chart-card { background: var(--sx-bg-surface); border: 1px solid var(--sx-border); border-radius: 8px; padding: 12px 14px; }
  .chart-card h3 { margin: 0 0 8px; font-size: 13px; font-weight: 600; }
  .chart-card .sub { font-size: 10px; color: var(--sx-text-hint); margin-top: 6px; }
  .bar-wrap { display: flex; height: 132px; align-items: flex-end; gap: 8px; padding: 4px 2px 0; }
  .bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; justify-content: flex-end; }
  .bar { width: 60%; max-width: 30px; background: var(--sx-brand); border-radius: 3px 3px 0 0; transition: height .3s ease; min-height: 4px; }
  .bar-label { font-size: 10px; color: var(--sx-text-hint); }
  .axis-y { font-size: 9px; color: var(--sx-text-hint); position: absolute; left: 6px; top: 0; }
  .pie-wrap { display: flex; align-items: center; gap: 16px; }
  .pie-donut {
    width: 112px; height: 112px; border-radius: 50%; flex: none;
    display: flex; align-items: center; justify-content: center;
  }
  .pie-hole { width: 52px; height: 52px; border-radius: 50%; background: var(--sx-bg-surface); }
  .pie-legend { flex: 1; display: flex; flex-direction: column; gap: 7px; font-size: 11px; }
  .legend-row { display: flex; align-items: center; gap: 7px; }
  .legend-dot { width: 9px; height: 9px; border-radius: 2px; flex: none; }
  .legend-row .pct { margin-left: auto; color: var(--sx-text-secondary); font-variant-numeric: tabular-nums; }

  /* ============ 右侧属性面板 ============ */
  .props-panel {
    width: 268px; flex: 0 0 268px; border-left: 1px solid var(--sx-border); background: var(--sx-bg-surface);
    display: flex; flex-direction: column; max-height: calc(100vh - 42px - 46px - 42px - 36px - 36px);
    position: sticky; top: 0;
  }
  .panel-head {
    display: flex; align-items: center; gap: 8px; height: 48px; padding: 0 14px;
    border-bottom: 1px solid var(--sx-border); font-size: 14px; font-weight: 600;
  }
  .panel-head .close { margin-left: auto; }
  .prop-tabs { display: flex; border-bottom: 1px solid var(--sx-border); padding: 0 8px; }
  .prop-tab {
    flex: 1; height: 38px; border: 0; border-bottom: 2px solid transparent; background: transparent;
    color: var(--sx-text-secondary); font-size: 12px;
  }
  .prop-tab:hover { color: var(--sx-text-primary); }
  .prop-tab.active { color: var(--sx-brand); border-bottom-color: var(--sx-brand); font-weight: 600; }
  .panel-body { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 15px; }
  .field-label { display: block; font-size: 11px; color: var(--sx-text-secondary); margin-bottom: 6px; font-weight: 600; }
  .field-label .hint { font-weight: 400; color: var(--sx-text-hint); margin-left: 4px; }
  .full-select {
    width: 100%; height: 30px; padding: 0 8px; border: 1px solid var(--sx-border-input); border-radius: 5px;
    background: var(--sx-bg-surface); color: var(--sx-text-primary); font-size: 12px; outline: none;
  }
  .full-select:focus { border-color: var(--sx-brand); }
  .font-row { display: flex; gap: 6px; }
  .font-row .full-select:first-child { flex: 1; }
  .font-row .full-select:nth-child(2) { width: 56px; flex: none; }
  .toggle-row { display: flex; align-items: center; justify-content: space-between; }
  .toggle {
    width: 36px; height: 20px; border-radius: 10px; border: 0; padding: 2px; background: var(--sx-border-strong);
    display: inline-flex; align-items: center; transition: background .15s ease;
  }
  .toggle.on { background: var(--sx-brand); }
  .toggle .knob { width: 16px; height: 16px; border-radius: 50%; background: #fff; transition: transform .15s ease; }
  .toggle.on .knob { transform: translateX(16px); }
  .grid-tools { display: flex; gap: 5px; flex-wrap: wrap; }
  .grid-tool {
    width: 34px; height: 30px; display: inline-flex; align-items: center; justify-content: center;
    border: 1px solid var(--sx-border-input); border-radius: 5px; background: var(--sx-bg-surface);
    color: var(--sx-text-secondary);
  }
  .grid-tool.on { border-color: var(--sx-brand); color: var(--sx-brand); background: var(--sx-brand-soft); }
  .size-row { display: flex; align-items: center; gap: 8px; }
  .size-input { flex: 1; min-width: 0; display: flex; align-items: center; gap: 4px; }
  .size-input input {
    width: 100%; height: 30px; padding: 0 8px; border: 1px solid var(--sx-border-input); border-radius: 5px;
    background: var(--sx-bg-surface); color: var(--sx-text-primary); font-size: 12px; outline: none;
  }
  .size-input input:focus { border-color: var(--sx-brand); }
  .size-input .unit { font-size: 10px; color: var(--sx-text-hint); flex: none; }
  .size-x { color: var(--sx-text-hint); font-size: 12px; }
  .check-row { display: flex; align-items: center; gap: 7px; font-size: 12px; color: var(--sx-text-secondary); }
  .check-box {
    width: 15px; height: 15px; border: 1px solid var(--sx-border-strong); border-radius: 3px;
    display: inline-flex; align-items: center; justify-content: center; background: var(--sx-bg-surface); color: #fff;
  }
  .check-box.on { background: var(--sx-brand); border-color: var(--sx-brand); }
  .apply-btn {
    width: 100%; height: 36px; border: 0; border-radius: 6px; background: var(--sx-brand); color: #fff;
    font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  }
  .apply-btn:hover { background: var(--sx-brand-hover); }
  .group-card { background: var(--sx-bg-app); border: 1px solid var(--sx-border); border-radius: 8px; padding: 11px; }
  .group-card .field-label { margin-top: 0; }
  .group-card .field-label:not(:first-child) { margin-top: 12px; }
  .radio-row { display: flex; gap: 6px; flex-wrap: wrap; }
  .chip {
    padding: 5px 10px; border: 1px solid var(--sx-border-input); border-radius: 5px; background: var(--sx-bg-surface);
    color: var(--sx-text-secondary); font-size: 11px;
  }
  .chip.on { border-color: var(--sx-brand); color: var(--sx-brand); background: var(--sx-brand-soft); }
  .range-input { width: 100%; }

  /* ============ 宿主配置弹窗 ============ */
  .modal-mask {
    position: fixed; inset: 0; background: rgba(12, 16, 28, .42); z-index: 500;
    display: flex; align-items: center; justify-content: center; padding: 18px;
  }
  .modal {
    width: min(760px, 96vw); max-height: 88vh; overflow: auto; background: var(--sx-bg-surface);
    border: 1px solid var(--sx-border); border-radius: 12px;
  }
  .modal-head {
    display: flex; align-items: center; gap: 8px; padding: 15px 18px; border-bottom: 1px solid var(--sx-border);
    font-size: 15px; font-weight: 600;
  }
  .modal-head .close { margin-left: auto; }
  .modal-body { padding: 18px; display: flex; flex-direction: column; gap: 16px; }
  .config-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .config-card {
    background: var(--sx-bg-app); border: 1px solid var(--sx-border); border-radius: 8px; padding: 13px;
  }
  .config-card h4 { margin: 0 0 10px; font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
  .config-field { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 8px; font-size: 12px; }
  .config-field span { color: var(--sx-text-secondary); }
  .config-field input, .config-field select {
    width: 60%; height: 28px; padding: 0 8px; border: 1px solid var(--sx-border-input); border-radius: 5px;
    background: var(--sx-bg-surface); color: var(--sx-text-primary); font-size: 12px; outline: none;
  }
  .config-field input:focus, .config-field select:focus { border-color: var(--sx-brand); }
  .config-field input[type='color'] { width: 40px; padding: 2px; cursor: pointer; }
  .contract {
    margin: 0; padding: 12px; border: 1px solid var(--sx-border); border-radius: 8px;
    background: var(--sx-bg-app); color: var(--sx-text-secondary); font: 11px/1.65 'SF Mono', Menlo, Consolas, monospace;
    white-space: pre-wrap; overflow-x: auto;
  }
  .modal-foot { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 18px; border-top: 1px solid var(--sx-border); }
  .btn {
    height: 32px; padding: 0 14px; border-radius: 6px; border: 1px solid var(--sx-border-input);
    background: var(--sx-bg-surface); color: var(--sx-text-primary); font-size: 12px;
  }
  .btn.primary { background: var(--sx-brand); border-color: var(--sx-brand); color: #fff; }
  .btn:hover { border-color: var(--sx-brand); }

  /* ============ 底部状态栏 ============ */
  .sheet-tabs {
    height: 36px; padding: 0 12px; gap: 10px; border-top: 1px solid var(--sx-border); font-size: 12px;
  }
  .sheet-tab {
    padding: 5px 14px; border-radius: 5px 5px 0 0; border-bottom: 2px solid var(--sx-brand);
    color: var(--sx-brand); font-weight: 600;
  }
  .status-right { margin-left: auto; display: flex; align-items: center; gap: 10px; color: var(--sx-text-secondary); }
  .zoom-range { width: 76px; accent-color: var(--sx-brand); }

  @media (max-width: 1100px) {
    .charts-row { grid-template-columns: 1fr; }
    .props-panel { width: 240px; flex-basis: 240px; }
    .config-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 860px) {
    .workspace { flex-direction: column; }
    .props-panel { width: 100%; flex-basis: auto; max-height: none; border-left: 0; border-top: 1px solid var(--sx-border); }
  }

  /* ============ 深色适配（局部规则，变量来自文档根） ============ */
  html[data-theme='dark'] .report-title { background: var(--sx-brand); }
  html[data-theme='dark'] .data-table tr.total td { background: var(--sx-brand-soft); }
`
