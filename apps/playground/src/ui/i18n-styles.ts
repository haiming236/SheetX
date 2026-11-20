/**
 * SheetX 第 30 张 · 国际化与多语言配置 — 样式
 * 布局：顶部菜单/工具栏/公式栏 + 表格/图表 + 右侧国际化设置 + 底部本地化预览。
 * RTL：在根 .app[dir='rtl'] 上镜像三段式布局，体现 SheetX 自带 RTL 能力。
 */
import { css } from 'lit'

export const i18nStyles = css`
  :host { display: block; }
  .app {
    display: flex; flex-direction: column; min-height: calc(100vh - 42px);
    background: var(--sx-bg-app); color: var(--sx-text-primary);
    font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
  }
  .menu-bar, .toolbar, .formula-bar { display: flex; align-items: center; background: var(--sx-bg-surface); }
  .menu-bar { height: 48px; padding: 0 16px; gap: 16px; border-bottom: 1px solid var(--sx-border); position: relative; z-index: 30; }
  .brand { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; }
  .menu-list { display: flex; gap: 2px; }
  .menu-item { padding: 6px 12px; border: 0; border-radius: 6px; background: transparent; color: var(--sx-text-secondary); font-size: 13px; }
  .menu-item:hover { background: var(--sx-bg-hover); color: var(--sx-text-primary); }
  .menu-item.active { color: var(--sx-brand); background: var(--sx-brand-soft); font-weight: 600; }
  .search-box { margin-left: auto; display: flex; align-items: center; gap: 6px; height: 30px; padding: 0 10px; border: 1px solid var(--sx-border); border-radius: 6px; color: var(--sx-text-hint); font-size: 11.5px; min-width: 172px; }
  .search-box input { flex: 1; min-width: 0; height: 100%; border: 0; outline: 0; background: transparent; color: var(--sx-text-primary); font: inherit; }
  .icon-btn { width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; border: 0; border-radius: 6px; background: transparent; color: var(--sx-text-secondary); }
  .icon-btn:hover { background: var(--sx-bg-hover); color: var(--sx-brand); }
  .avatar { width: 28px; height: 28px; border-radius: 50%; background: var(--sx-brand); color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; }
  .user-chip { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--sx-text-primary); }
  .lang-btn { position: relative; }
  .lang-popover {
    position: absolute; top: 36px; right: 0; width: 186px; padding: 6px; z-index: 400;
    background: var(--sx-bg-surface); border: 1px solid var(--sx-border); border-radius: 8px;
  }
  .lang-popover .title { display: flex; align-items: center; gap: 6px; padding: 7px 9px; font-size: 11.5px; font-weight: 600; color: var(--sx-text-secondary); }
  .lang-option { display: flex; align-items: center; gap: 8px; width: 100%; height: 30px; padding: 0 9px; border: 0; border-radius: 5px; background: transparent; color: var(--sx-text-secondary); font-size: 12px; text-align: left; }
  .lang-option:hover { background: var(--sx-bg-hover); color: var(--sx-text-primary); }
  .lang-option.on { background: var(--sx-brand-soft); color: var(--sx-brand); font-weight: 600; }
  .lang-option .check { margin-left: auto; color: var(--sx-brand); }
  .lang-option.more { border-top: 1px solid var(--sx-border); border-radius: 0; margin-top: 3px; padding-top: 3px; }

  .toolbar { height: 42px; padding: 0 12px; gap: 5px; border-bottom: 1px solid var(--sx-border); overflow-x: auto; scrollbar-width: none; }
  .toolbar::-webkit-scrollbar { display: none; }
  .tool-group { display: flex; align-items: center; gap: 2px; padding-right: 7px; margin-right: 3px; border-right: 1px solid var(--sx-border); }
  .tool-btn { height: 28px; min-width: 28px; padding: 0 6px; border: 1px solid transparent; border-radius: 5px; background: transparent; color: var(--sx-text-secondary); display: inline-flex; align-items: center; justify-content: center; gap: 4px; font-size: 12px; }
  .tool-btn:hover { background: var(--sx-bg-hover); color: var(--sx-text-primary); }
  .mini-select { height: 28px; padding: 0 6px; border: 1px solid var(--sx-border-input); border-radius: 5px; background: var(--sx-bg-surface); color: var(--sx-text-primary); font-size: 12px; outline: none; }
  .mini-select.fmt { width: 78px; }
  .mini-select.size { width: 48px; }
  .mini-select.merge { width: 86px; }
  .color-cell { position: relative; }
  .color-cell::after { content: ''; position: absolute; left: 4px; right: 4px; bottom: 3px; height: 3px; border-radius: 2px; background: var(--mark, var(--sx-brand)); pointer-events: none; }

  .formula-bar { height: 34px; border-bottom: 1px solid var(--sx-border); font-size: 12px; }
  .addr { width: 62px; height: 100%; display: flex; align-items: center; padding: 0 12px; border-right: 1px solid var(--sx-border); font-weight: 600; }
  .fx { width: 40px; text-align: center; color: var(--sx-text-hint); font-family: Georgia, serif; font-style: italic; }
  .formula-input { flex: 1; height: 100%; border: 0; outline: 0; background: transparent; color: var(--sx-text-primary); font: inherit; padding: 0 8px; }

  .workspace { display: flex; flex: 1; min-height: 0; }
  .sheet-area { flex: 1; min-width: 0; padding: 12px 14px; overflow: auto; }
  .grid-wrap { border: 1px solid var(--sx-border); border-radius: 7px; overflow: hidden; background: var(--sx-bg-surface); }
  .report-title { background: var(--sx-brand); color: #fff; padding: 10px 14px; display: flex; align-items: center; gap: 9px; font-size: 16px; font-weight: 600; }
  .data-table { width: 100%; border-collapse: collapse; font-size: 12px; table-layout: fixed; }
  .data-table th, .data-table td { border-bottom: 1px solid var(--sx-grid-line); border-right: 1px solid var(--sx-grid-line); padding: 7px 10px; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .data-table th:last-child, .data-table td:last-child { border-right: 0; }
  .data-table thead th { background: var(--sx-bg-app); color: var(--sx-text-secondary); font-weight: 600; }
  .data-table tbody tr:hover { background: var(--sx-bg-hover); }
  .data-table tr.total td { background: var(--sx-brand-soft); font-weight: 700; }
  .col-letter { background: var(--sx-bg-subtle); color: var(--sx-text-hint); font-size: 10.5px; text-align: center; padding: 3px 0 !important; font-weight: 600; }

  .charts-row { display: grid; grid-template-columns: 1.15fr 1fr; gap: 12px; margin-top: 12px; }
  .chart-card { background: var(--sx-bg-surface); border: 1px solid var(--sx-border); border-radius: 8px; padding: 12px 14px; }
  .chart-card h3 { margin: 0 0 8px; font-size: 13px; font-weight: 600; }
  .bar-wrap { display: flex; height: 120px; align-items: flex-end; gap: 8px; padding: 4px 2px 0; }
  .bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; justify-content: flex-end; }
  .bar { width: 60%; max-width: 28px; background: var(--sx-brand); border-radius: 3px 3px 0 0; min-height: 4px; opacity: .85; }
  .bar-label { font-size: 10px; color: var(--sx-text-hint); }
  .pie-wrap { display: flex; align-items: center; gap: 16px; }
  .pie-donut { width: 104px; height: 104px; border-radius: 50%; flex: none; display: flex; align-items: center; justify-content: center; }
  .pie-hole { width: 48px; height: 48px; border-radius: 50%; background: var(--sx-bg-surface); }
  .pie-legend { flex: 1; display: flex; flex-direction: column; gap: 7px; font-size: 11px; }
  .legend-row { display: flex; align-items: center; gap: 7px; }
  .legend-dot { width: 9px; height: 9px; border-radius: 2px; flex: none; }
  .legend-row .pct { margin-left: auto; color: var(--sx-text-secondary); font-variant-numeric: tabular-nums; }

  /* 右侧国际化设置 */
  .right { width: 292px; flex: 0 0 292px; margin: 12px 12px 12px 0; padding: 15px; background: var(--sx-bg-surface); border: 1px solid var(--sx-border); border-radius: 8px; align-self: flex-start; max-height: calc(100vh - 42px - 48px - 42px - 34px - 24px); overflow-y: auto; }
  .right-head { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; padding-bottom: 12px; border-bottom: 1px solid var(--sx-border); }
  .right-head .close { margin-left: auto; }
  .right-tabs { display: flex; border-bottom: 1px solid var(--sx-border); margin: 0 -15px; padding: 0 15px; }
  .right-tab { flex: 1; height: 35px; padding: 0 3px; border: 0; border-bottom: 2px solid transparent; background: transparent; color: var(--sx-text-secondary); font-size: 11px; white-space: nowrap; }
  .right-tab:hover { color: var(--sx-text-primary); }
  .right-tab.active { color: var(--sx-brand); border-bottom-color: var(--sx-brand); font-weight: 600; }
  .right-body { padding-top: 14px; display: flex; flex-direction: column; gap: 14px; }
  .field-label { display: block; font-size: 12px; font-weight: 600; margin-bottom: 7px; }
  .full-select { width: 100%; height: 32px; padding: 0 9px; border: 1px solid var(--sx-border-input); border-radius: 6px; background: var(--sx-bg-surface); color: var(--sx-text-primary); font-size: 12px; outline: none; }
  .full-select:focus { border-color: var(--sx-brand); }
  .hint { margin-top: 5px; font-size: 10.5px; color: var(--sx-text-hint); line-height: 1.5; }
  .field-row { display: flex; align-items: center; gap: 9px; font-size: 11.5px; }
  .field-row label { width: 74px; flex: none; color: var(--sx-text-secondary); }
  .field-row .select { flex: 1; min-width: 0; height: 30px; padding: 0 8px; border: 1px solid var(--sx-border-input); border-radius: 6px; background: var(--sx-bg-surface); color: var(--sx-text-primary); font-size: 11.5px; outline: none; }
  .field-row .select:focus { border-color: var(--sx-brand); }
  .switch-row { display: flex; align-items: center; justify-content: space-between; font-size: 12px; }
  .switch { width: 34px; height: 19px; border-radius: 10px; border: 0; padding: 2px; background: var(--sx-border-strong); display: inline-flex; align-items: center; }
  .switch.on { background: var(--sx-brand); }
  .switch .knob { width: 15px; height: 15px; border-radius: 50%; background: #fff; transition: transform .15s; }
  .switch.on .knob { transform: translateX(15px); }
  .tip { display: flex; gap: 8px; padding: 11px 12px; border-radius: 7px; background: var(--sx-brand-soft); font-size: 11px; line-height: 1.6; color: var(--sx-text-secondary); }
  .tip .ic { color: var(--sx-brand); flex: none; }
  .term-row { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; align-items: center; font-size: 11px; padding: 6px 0; border-bottom: 1px solid var(--sx-border); }
  .term-row input { width: 100%; height: 27px; padding: 0 7px; border: 1px solid var(--sx-border-input); border-radius: 5px; background: var(--sx-bg-surface); color: var(--sx-text-primary); font-size: 11px; outline: none; }
  .term-row input:focus { border-color: var(--sx-brand); }
  .doc-box { padding: 11px; border-radius: 6px; background: var(--sx-bg-app); border: 1px solid var(--sx-border); font: 10px/1.6 'SF Mono', Menlo, Consolas, monospace; color: var(--sx-text-secondary); white-space: pre-wrap; word-break: keep-all; overflow-wrap: break-word; }
  .rtl-demo { display: flex; gap: 7px; padding: 9px; border: 1px solid var(--sx-border); border-radius: 6px; background: var(--sx-bg-app); font-size: 11px; }
  .rtl-demo.ltr { flex-direction: row; }
  .rtl-demo.rtl { flex-direction: row-reverse; }
  .rtl-demo .box { padding: 5px 9px; border-radius: 5px; background: var(--sx-brand-soft); color: var(--sx-brand); }

  /* 底部本地化预览 */
  .preview-panel { margin: 0 14px 14px; padding: 14px 16px; background: var(--sx-bg-surface); border: 1px solid var(--sx-border); border-radius: 8px; }
  .preview-head { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; margin-bottom: 12px; }
  .preview-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
  .preview-card { padding: 12px; border: 1px solid var(--sx-border); border-radius: 7px; background: var(--sx-bg-app); }
  .preview-card.active { border-color: var(--sx-brand); background: var(--sx-brand-soft); }
  .preview-card .lang { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; padding-bottom: 8px; border-bottom: 1px solid var(--sx-border); margin-bottom: 8px; }
  .preview-card .line { display: flex; justify-content: space-between; gap: 8px; font-size: 10.5px; padding: 3px 0; }
  .preview-card .line .k { color: var(--sx-text-hint); flex: none; }
  .preview-card .line .v { color: var(--sx-text-primary); font-variant-numeric: tabular-nums; text-align: right; }

  /* RTL 镜像：三段式布局整体翻转（SheetX 自带能力，不依赖宿主框架） */
  .app[dir='rtl'] .menu-bar,
  .app[dir='rtl'] .toolbar,
  .app[dir='rtl'] .formula-bar,
  .app[dir='rtl'] .workspace { direction: rtl; }
  .app[dir='rtl'] .search-box { margin-left: 0; margin-right: auto; }
  .app[dir='rtl'] .tool-group { padding-right: 0; padding-left: 7px; margin-right: 0; margin-left: 3px; border-right: 0; border-left: 1px solid var(--sx-border); }
  .app[dir='rtl'] .data-table th,
  .app[dir='rtl'] .data-table td { text-align: right; }
  .app[dir='rtl'] .addr { border-right: 0; border-left: 1px solid var(--sx-border); }
  .app[dir='rtl'] .lang-popover { right: auto; left: 0; }

  @media (max-width: 1200px) {
    .right { width: 268px; flex-basis: 268px; }
    .preview-grid { grid-template-columns: repeat(3, 1fr); }
  }
  @media (max-width: 980px) {
    .workspace { flex-direction: column; }
    .right { width: auto; flex-basis: auto; margin: 0 12px 12px; max-height: none; }
    .preview-grid { grid-template-columns: repeat(2, 1fr); }
  }
`
