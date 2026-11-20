/**
 * SheetX 第 28 张 · 数据编辑与事务提交 — 样式
 * 布局：顶部菜单/工具栏/公式栏 + 表格 + 右侧批量编辑面板 + 底部操作日志 + toast。
 */
import { css } from 'lit'

export const editStyles = css`
  :host { display: block; }
  .app {
    display: flex; flex-direction: column; min-height: calc(100vh - 42px);
    background: var(--sx-bg-app); color: var(--sx-text-primary);
    font-family: 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
  }
  .menu-bar, .toolbar, .formula-bar {
    display: flex; align-items: center; background: var(--sx-bg-surface);
  }
  .menu-bar { height: 46px; padding: 0 16px; gap: 16px; border-bottom: 1px solid var(--sx-border); }
  .brand { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; }
  .brand-logo { width: 24px; height: 24px; border-radius: 6px; background: var(--sx-brand); color: #fff; display: inline-flex; align-items: center; justify-content: center; }
  .brand-logo svg { display: block; }
  .menu-list { display: flex; gap: 2px; }
  .menu-item { padding: 6px 12px; border: 0; border-radius: 6px; background: transparent; color: var(--sx-text-secondary); font-size: 13px; }
  .menu-item:hover { background: var(--sx-bg-hover); color: var(--sx-text-primary); }
  .menu-item.active { color: var(--sx-brand); background: var(--sx-brand-soft); font-weight: 600; }
  .search-box { margin-left: auto; display: flex; align-items: center; gap: 6px; height: 30px; padding: 0 10px; border: 1px solid var(--sx-border); border-radius: 6px; color: var(--sx-text-hint); font-size: 11.5px; min-width: 168px; }
  .search-box input { flex: 1; min-width: 0; height: 100%; border: 0; outline: 0; background: transparent; color: var(--sx-text-primary); font: inherit; }
  .icon-btn { width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; border: 0; border-radius: 6px; background: transparent; color: var(--sx-text-secondary); }
  .icon-btn:hover { background: var(--sx-bg-hover); color: var(--sx-brand); }
  .avatar { width: 28px; height: 28px; border-radius: 50%; background: var(--sx-brand); color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; }

  .toolbar { height: 42px; padding: 0 12px; gap: 5px; border-bottom: 1px solid var(--sx-border); overflow-x: auto; scrollbar-width: none; }
  .toolbar::-webkit-scrollbar { display: none; }
  .tool-group { display: flex; align-items: center; gap: 2px; padding-right: 7px; margin-right: 3px; border-right: 1px solid var(--sx-border); }
  .tool-btn { height: 28px; min-width: 28px; padding: 0 6px; border: 1px solid transparent; border-radius: 5px; background: transparent; color: var(--sx-text-secondary); display: inline-flex; align-items: center; justify-content: center; gap: 4px; font-size: 12px; }
  .tool-btn:hover { background: var(--sx-bg-hover); color: var(--sx-text-primary); }
  .tool-btn.on { border-color: var(--sx-border); background: var(--sx-bg-subtle); color: var(--sx-brand); }
  .mini-select { height: 28px; padding: 0 6px; border: 1px solid var(--sx-border-input); border-radius: 5px; background: var(--sx-bg-surface); color: var(--sx-text-primary); font-size: 12px; outline: none; }
  .mini-select.fmt { width: 78px; }
  .mini-select.size { width: 52px; }
  .mini-select.merge { width: 92px; }
  .color-cell { position: relative; }
  .color-cell::after { content: ''; position: absolute; left: 4px; right: 4px; bottom: 3px; height: 3px; border-radius: 2px; background: var(--mark, var(--sx-brand)); pointer-events: none; }

  .formula-bar { height: 34px; border-bottom: 1px solid var(--sx-border); font-size: 12px; }
  .addr { width: 62px; height: 100%; display: flex; align-items: center; padding: 0 12px; border-right: 1px solid var(--sx-border); font-weight: 600; }
  .fx { width: 40px; text-align: center; color: var(--sx-text-hint); font-family: Georgia, serif; font-style: italic; }
  .formula-input { flex: 1; height: 100%; border: 0; outline: 0; background: transparent; color: var(--sx-text-primary); font: inherit; padding: 0 8px; }

  .workspace { display: flex; flex: 1; min-height: 0; }
  .sheet-area { flex: 1; min-width: 0; padding: 12px 14px; overflow: auto; }
  .grid-wrap { border: 1px solid var(--sx-border); border-radius: 7px; overflow: hidden; background: var(--sx-bg-surface); }
  .data-table { width: 100%; border-collapse: collapse; font-size: 12px; table-layout: fixed; }
  .data-table th, .data-table td { border-bottom: 1px solid var(--sx-grid-line); border-right: 1px solid var(--sx-grid-line); padding: 7px 10px; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .data-table th:last-child, .data-table td:last-child { border-right: 0; }
  .data-table thead th { background: var(--sx-brand); color: #fff; font-weight: 600; padding: 9px 10px; }
  .data-table thead th:first-child { width: 40px; text-align: center; padding: 0; }
  .data-table tbody td:first-child { width: 40px; text-align: center; padding: 0; }
  .data-table tbody tr:hover { background: var(--sx-bg-hover); }
  .data-table tbody tr.selected { background: var(--sx-brand-soft); }
  .data-table td.cell-active { outline: 2px solid var(--sx-brand); outline-offset: -2px; background: var(--sx-bg-surface); }
  .data-table td.cell-editing { padding: 0; }
  .cell-input { width: 100%; height: 30px; border: 2px solid var(--sx-brand); outline: 0; padding: 0 8px; background: var(--sx-bg-surface); color: var(--sx-text-primary); font: inherit; }
  .select-box { width: 15px; height: 15px; accent-color: var(--sx-brand); cursor: pointer; vertical-align: middle; }
  .status-tag { display: inline-block; padding: 2px 8px; border-radius: 9px; font-size: 10px; }
  .pending-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #e5a23c; margin-left: 6px; vertical-align: middle; }
  .col-letter { background: var(--sx-bg-subtle); color: var(--sx-text-hint); font-size: 10.5px; text-align: center; padding: 3px 0 !important; font-weight: 600; }

  /* 右侧批量编辑 */
  .batch-panel { width: 268px; flex: 0 0 268px; background: var(--sx-bg-surface); border-left: 1px solid var(--sx-border); display: flex; flex-direction: column; }
  .batch-head { display: flex; align-items: center; gap: 8px; height: 48px; padding: 0 14px; border-bottom: 1px solid var(--sx-border); font-size: 13.5px; font-weight: 600; }
  .batch-head .close { margin-left: auto; }
  .batch-body { flex: 1; padding: 16px 14px; display: flex; flex-direction: column; gap: 18px; overflow-y: auto; }
  .field-label { display: block; font-size: 12px; font-weight: 600; margin-bottom: 8px; }
  .field-label .clear { float: right; color: var(--sx-brand); font-size: 11px; font-weight: 400; cursor: pointer; }
  .range-box { padding: 10px 12px; border-radius: 6px; background: var(--sx-bg-app); border: 1px solid var(--sx-border); font-size: 12px; display: flex; align-items: center; }
  .range-box .num { font-weight: 700; color: var(--sx-brand); }
  .full-select { width: 100%; height: 32px; padding: 0 9px; border: 1px solid var(--sx-border-input); border-radius: 6px; background: var(--sx-bg-surface); color: var(--sx-text-primary); font-size: 12px; outline: none; }
  .full-select:focus { border-color: var(--sx-brand); }
  .value-row { display: flex; align-items: center; gap: 6px; margin-top: 8px; }
  .value-row input { flex: 1; height: 32px; padding: 0 9px; border: 1px solid var(--sx-border-input); border-radius: 6px; background: var(--sx-bg-surface); color: var(--sx-text-primary); font-size: 12px; outline: none; }
  .value-ok { width: 26px; height: 26px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background: var(--sx-success-soft); color: var(--sx-success); }
  .check-row { display: flex; align-items: center; gap: 8px; font-size: 11.5px; color: var(--sx-text-secondary); }
  .check-box { width: 15px; height: 15px; border: 1px solid var(--sx-border-strong); border-radius: 3px; display: inline-flex; align-items: center; justify-content: center; background: var(--sx-bg-surface); color: #fff; flex: none; }
  .check-box.on { background: var(--sx-brand); border-color: var(--sx-brand); }
  .info-box { padding: 11px 12px; border-radius: 7px; background: var(--sx-brand-soft); font-size: 11px; line-height: 1.6; color: var(--sx-text-secondary); display: flex; gap: 8px; }
  .info-box .ic { color: var(--sx-brand); flex: none; }
  .batch-actions { margin-top: auto; padding: 12px 14px; border-top: 1px solid var(--sx-border); }
  .btn { height: 34px; padding: 0 14px; border-radius: 6px; border: 1px solid var(--sx-border-input); background: var(--sx-bg-surface); color: var(--sx-text-primary); font-size: 12px; display: inline-flex; align-items: center; gap: 6px; }
  .btn:hover { border-color: var(--sx-brand); }
  .btn.primary { width: 100%; background: var(--sx-brand); border-color: var(--sx-brand); color: #fff; justify-content: center; }
  .btn.small { height: 28px; padding: 0 10px; font-size: 11px; }
  .btn.danger { border-color: var(--sx-danger); color: var(--sx-danger); }

  /* 底部操作日志 */
  .log-panel { border-top: 1px solid var(--sx-border); background: var(--sx-bg-surface); }
  .log-tabs { display: flex; align-items: center; height: 36px; padding: 0 14px; gap: 4px; border-bottom: 1px solid var(--sx-border); }
  .log-tab { height: 36px; padding: 0 12px; border: 0; border-bottom: 2px solid transparent; background: transparent; color: var(--sx-text-secondary); font-size: 12px; }
  .log-tab.active { color: var(--sx-brand); border-bottom-color: var(--sx-brand); font-weight: 600; }
  .log-tabs .close { margin-left: auto; }
  .log-table { width: 100%; border-collapse: collapse; font-size: 11px; }
  .log-table th, .log-table td { border-bottom: 1px solid var(--sx-border); padding: 7px 14px; text-align: left; }
  .log-table th { color: var(--sx-text-hint); font-weight: 600; background: var(--sx-bg-app); }
  .log-table td.time { font-variant-numeric: tabular-nums; color: var(--sx-text-secondary); width: 90px; }
  .log-table td.op { width: 80px; }
  .log-table td.st { width: 100px; }
  .log-table td.note { width: 100px; color: var(--sx-text-hint); }
  .log-ok { display: inline-flex; align-items: center; gap: 4px; color: var(--sx-success); }
  .log-warn { display: inline-flex; align-items: center; gap: 4px; color: #e5a23c; }
  .log-bad { display: inline-flex; align-items: center; gap: 4px; color: var(--sx-danger); }
  .log-foot { display: flex; align-items: center; justify-content: flex-end; gap: 5px; padding: 8px 14px; font-size: 11px; color: var(--sx-text-hint); }
  .pg { min-width: 24px; height: 24px; padding: 0 5px; border: 1px solid var(--sx-border-input); border-radius: 4px; background: var(--sx-bg-surface); color: var(--sx-text-secondary); font-size: 10.5px; }
  .pg.on { background: var(--sx-brand); border-color: var(--sx-brand); color: #fff; }
  .pg.disabled { opacity: .4; }

  /* 弹层 */
  .modal-mask { position: fixed; inset: 0; background: rgba(12,16,28,.42); z-index: 600; display: flex; align-items: center; justify-content: center; padding: 18px; }
  .modal { width: min(400px, 94vw); background: var(--sx-bg-surface); border: 1px solid var(--sx-border); border-radius: 10px; padding: 20px; }
  .modal-head { display: flex; align-items: center; gap: 10px; font-size: 15px; font-weight: 600; }
  .modal-head .close { margin-left: auto; }
  .modal p { margin: 16px 0 20px; font-size: 12.5px; line-height: 1.7; color: var(--sx-text-secondary); }
  .modal-actions { display: flex; justify-content: flex-end; gap: 8px; }
  .conflict-box { display: flex; flex-direction: column; gap: 10px; margin-top: 14px; }
  .conflict-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .conflict-col { padding: 10px; border: 1px solid var(--sx-border); border-radius: 6px; background: var(--sx-bg-app); }
  .conflict-col.local { border-color: var(--sx-brand); }
  .conflict-col h5 { margin: 0 0 6px; font-size: 11px; color: var(--sx-text-hint); font-weight: 600; }
  .conflict-col .val { font-size: 13px; font-weight: 600; }

  /* toast */
  .toast {
    position: fixed; left: 18px; bottom: 18px; z-index: 700;
    display: flex; align-items: center; gap: 9px; padding: 11px 14px;
    border-radius: 8px; font-size: 12px; max-width: 460px;
  }
  .toast.ok { background: var(--sx-success-soft); color: var(--sx-success); border: 1px solid var(--sx-success); }
  .toast.bad { background: var(--sx-danger); color: #fff; border: 1px solid var(--sx-danger); }
  .toast.warn { background: #fef3c7; color: #92400e; border: 1px solid #e5a23c; }
  .toast .close { margin-left: 8px; opacity: .7; }

  @media (max-width: 1100px) {
    .batch-panel { width: 232px; flex-basis: 232px; }
    .data-table { font-size: 11px; }
  }
  @media (max-width: 860px) {
    .workspace { flex-direction: column; }
    .batch-panel { width: 100%; flex-basis: auto; border-left: 0; border-top: 1px solid var(--sx-border); }
  }
`
