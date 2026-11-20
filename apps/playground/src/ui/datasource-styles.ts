/**
 * SheetX 第 27 张 · 数据源适配与远程数据加载 — 样式
 * 三栏：数据源管理 / 接口配置与预览 / 高级配置。无 glow/shadow。
 */
import { css } from 'lit'

export const datasourceStyles = css`
  :host { display: block; }
  .app {
    display: flex; flex-direction: column; min-height: calc(100vh - 42px);
    background: var(--sx-bg-app); color: var(--sx-text-primary);
    font-family: 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
  }
  .menu-bar {
    height: 50px; flex: 0 0 50px; display: flex; align-items: center; gap: 14px;
    padding: 0 18px; background: var(--sx-bg-surface); border-bottom: 1px solid var(--sx-border);
  }
  .brand { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; }
  .brand-logo { width: 24px; height: 24px; border-radius: 6px; background: var(--sx-brand); color: #fff; display: inline-flex; align-items: center; justify-content: center; }
  .brand-logo svg { display: block; }
  .menu-list { display: flex; align-items: center; gap: 2px; margin-left: 12px; }
  .menu-item {
    height: 32px; padding: 0 12px; border: 0; border-radius: 6px; background: transparent;
    color: var(--sx-text-secondary); font-size: 13px; display: inline-flex; align-items: center; gap: 6px;
  }
  .menu-item:hover { background: var(--sx-bg-hover); color: var(--sx-text-primary); }
  .menu-item.active { color: var(--sx-brand); background: var(--sx-brand-soft); font-weight: 600; }
  .menu-right { margin-left: auto; display: flex; align-items: center; gap: 10px; }
  .icon-btn { width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; border: 0; border-radius: 6px; background: transparent; color: var(--sx-text-secondary); }
  .icon-btn:hover { background: var(--sx-bg-hover); color: var(--sx-brand); }
  .avatar { width: 28px; height: 28px; border-radius: 50%; background: var(--sx-brand); color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; }

  .shell { display: flex; flex: 1; min-height: 0; }
  .sidebar {
    width: 176px; flex: 0 0 176px; padding: 16px 10px; background: var(--sx-bg-surface);
    border-right: 1px solid var(--sx-border); display: flex; flex-direction: column;
  }
  .side-title { font-size: 11px; font-weight: 600; color: var(--sx-text-hint); padding: 0 10px 10px; }
  .side-item {
    display: flex; align-items: center; gap: 10px; width: 100%; height: 36px; padding: 0 10px;
    border: 0; border-radius: 6px; background: transparent; color: var(--sx-text-secondary); font-size: 12.5px; text-align: left;
  }
  .side-item:hover { background: var(--sx-bg-hover); color: var(--sx-text-primary); }
  .side-item.active { background: var(--sx-brand-soft); color: var(--sx-brand); font-weight: 600; }
  .no-db-card { margin-top: 20px; padding: 13px 12px; border-radius: 8px; background: var(--sx-bg-app); border: 1px solid var(--sx-border); }
  .no-db-card h4 { margin: 0 0 7px; font-size: 12.5px; display: flex; align-items: center; gap: 6px; color: var(--sx-brand); }
  .no-db-card p { margin: 0 0 10px; font-size: 11px; line-height: 1.55; color: var(--sx-text-hint); }
  .link-btn { font-size: 11px; color: var(--sx-brand); background: transparent; border: 0; padding: 0; display: inline-flex; align-items: center; gap: 4px; }

  .center { flex: 1; min-width: 0; padding: 14px; display: flex; flex-direction: column; gap: 12px; }
  .source-tabs { display: flex; gap: 8px; }
  .source-tab {
    height: 38px; padding: 0 16px; border: 1px solid var(--sx-border); border-radius: 7px;
    background: var(--sx-bg-surface); color: var(--sx-text-secondary); font-size: 12.5px;
    display: inline-flex; align-items: center; gap: 7px;
  }
  .source-tab:hover { border-color: var(--sx-brand); }
  .source-tab.active { background: var(--sx-brand); border-color: var(--sx-brand); color: #fff; font-weight: 600; }

  .panel { background: var(--sx-bg-surface); border: 1px solid var(--sx-border); border-radius: 8px; overflow: hidden; }
  .conn-head { display: flex; align-items: center; gap: 12px; padding: 15px 18px; }
  .conn-icon { width: 44px; height: 44px; flex: none; border-radius: 10px; background: var(--sx-brand); color: #fff; display: inline-flex; align-items: center; justify-content: center; }
  .conn-head h3 { margin: 0 0 4px; font-size: 15px; display: flex; align-items: center; gap: 8px; }
  .conn-head p { margin: 0; font-size: 11.5px; color: var(--sx-text-hint); }
  .pill { display: inline-flex; align-items: center; gap: 5px; height: 22px; padding: 0 9px; border-radius: 11px; font-size: 10.5px; background: var(--sx-success-soft); color: var(--sx-success); font-weight: 500; }
  .pill .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--sx-success); }
  .conn-actions { margin-left: auto; display: flex; gap: 8px; }
  .btn {
    height: 32px; padding: 0 12px; border-radius: 6px; border: 1px solid var(--sx-border-input);
    background: var(--sx-bg-surface); color: var(--sx-text-primary); font-size: 11.5px;
    display: inline-flex; align-items: center; gap: 6px;
  }
  .btn:hover { border-color: var(--sx-brand); }
  .btn.outline { border-color: var(--sx-brand); color: var(--sx-brand); }
  .btn.outline:hover { background: var(--sx-brand-soft); }
  .btn.primary { background: var(--sx-brand); border-color: var(--sx-brand); color: #fff; }

  .detail-tabs { display: flex; gap: 2px; padding: 0 18px; border-bottom: 1px solid var(--sx-border); }
  .detail-tab { height: 38px; padding: 0 14px; border: 0; border-bottom: 2px solid transparent; background: transparent; color: var(--sx-text-secondary); font-size: 12px; }
  .detail-tab:hover { color: var(--sx-text-primary); }
  .detail-tab.active { color: var(--sx-brand); border-bottom-color: var(--sx-brand); font-weight: 600; }
  .detail-body { padding: 18px; }
  .form-row { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
  .form-row > label { width: 74px; flex: none; padding-top: 8px; font-size: 12px; }
  .form-main { flex: 1; min-width: 0; }
  .input, .select {
    height: 34px; padding: 0 10px; border: 1px solid var(--sx-border-input); border-radius: 6px;
    background: var(--sx-bg-surface); color: var(--sx-text-primary); font-size: 12px; outline: none;
  }
  .input:focus, .select:focus { border-color: var(--sx-brand); }
  .input.full { width: 100%; }
  .form-hint { margin-top: 5px; font-size: 10.5px; color: var(--sx-text-hint); }
  .inline-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .inline-field { display: flex; align-items: center; gap: 8px; }
  .inline-field label { font-size: 12px; color: var(--sx-text-secondary); white-space: nowrap; }
  .inline-field .input, .inline-field .select { flex: 1; min-width: 0; }
  .param-box { position: relative; }
  textarea.params {
    width: 100%; min-height: 84px; padding: 10px 96px 10px 10px; border: 1px solid var(--sx-border-input);
    border-radius: 6px; background: var(--sx-bg-surface); color: var(--sx-text-primary);
    font: 11.5px/1.6 'SF Mono', Menlo, monospace; outline: none; resize: vertical;
  }
  textarea.params:focus { border-color: var(--sx-brand); }
  .param-assist { position: absolute; top: 8px; right: 8px; }
  .save-row { display: flex; justify-content: center; margin-top: 4px; }

  /* 数据预览 */
  .preview-head { display: flex; align-items: center; gap: 8px; padding: 12px 14px; border-bottom: 1px solid var(--sx-border); font-size: 12.5px; font-weight: 600; }
  .preview-head .count { margin-left: auto; font-size: 11px; font-weight: 400; color: var(--sx-text-hint); }
  .table-wrap { overflow-x: auto; }
  .preview-table { width: 100%; border-collapse: collapse; font-size: 11.5px; table-layout: fixed; }
  .preview-table th, .preview-table td { border-bottom: 1px solid var(--sx-grid-line); border-right: 1px solid var(--sx-grid-line); padding: 8px 10px; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .preview-table th:last-child, .preview-table td:last-child { border-right: 0; }
  .preview-table thead th { background: var(--sx-bg-app); color: var(--sx-text-secondary); font-weight: 600; }
  .preview-table tbody tr:hover { background: var(--sx-bg-hover); }
  .status-pill-small { display: inline-block; padding: 2px 8px; border-radius: 9px; font-size: 10px; }
  .row-link { color: var(--sx-brand); border: 0; background: transparent; font-size: 11px; }
  .pager { display: flex; align-items: center; justify-content: center; gap: 5px; padding: 12px; }
  .pg {
    min-width: 28px; height: 28px; padding: 0 6px; border: 1px solid var(--sx-border-input); border-radius: 5px;
    background: var(--sx-bg-surface); color: var(--sx-text-secondary); font-size: 11.5px;
  }
  .pg:hover { border-color: var(--sx-brand); color: var(--sx-brand); }
  .pg.on { background: var(--sx-brand); border-color: var(--sx-brand); color: #fff; font-weight: 600; }
  .pg.disabled { opacity: .4; cursor: not-allowed; }

  .doc-box { padding: 14px; font: 11px/1.7 'SF Mono', Menlo, Consolas, monospace; white-space: pre-wrap; word-break: keep-all; overflow-wrap: break-word; color: var(--sx-text-secondary); background: var(--sx-bg-app); border: 1px solid var(--sx-border); border-radius: 6px; }

  /* 右侧高级配置 */
  .right { width: 300px; flex: 0 0 300px; margin: 14px 14px 14px 0; padding: 15px; background: var(--sx-bg-surface); border: 1px solid var(--sx-border); border-radius: 8px; align-self: flex-start; max-height: calc(100vh - 42px - 50px - 28px); overflow-y: auto; }
  .right-title { display: flex; align-items: center; gap: 8px; font-size: 13.5px; font-weight: 600; padding-bottom: 12px; border-bottom: 1px solid var(--sx-border); }
  .adv-section { margin-top: 15px; }
  .adv-section h4 { margin: 0 0 10px; font-size: 12px; font-weight: 600; }
  .radio-row { display: flex; align-items: flex-start; gap: 8px; padding: 7px 0; cursor: pointer; }
  .radio { width: 15px; height: 15px; border-radius: 50%; border: 1px solid var(--sx-border-strong); display: inline-flex; align-items: center; justify-content: center; flex: none; margin-top: 1px; }
  .radio.on { border-color: var(--sx-brand); }
  .radio.on::after { content: ''; width: 7px; height: 7px; border-radius: 50%; background: var(--sx-brand); }
  .radio-row .txt { font-size: 11.5px; }
  .radio-row .desc { display: block; font-size: 10px; color: var(--sx-text-hint); margin-top: 2px; }
  .switch-row { display: flex; align-items: center; padding: 7px 0; font-size: 11.5px; }
  .switch { margin-left: auto; width: 34px; height: 19px; border-radius: 10px; border: 0; padding: 2px; background: var(--sx-border-strong); display: inline-flex; align-items: center; }
  .switch.on { background: var(--sx-brand); }
  .switch .knob { width: 15px; height: 15px; border-radius: 50%; background: #fff; transition: transform .15s; }
  .switch.on .knob { transform: translateX(15px); }
  .adv-field { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 6px 0; font-size: 11.5px; }
  .adv-field .input { width: 80px; flex: none; }
  .check-line { display: flex; align-items: center; gap: 8px; padding: 6px 0; font-size: 11.5px; cursor: pointer; }
  .check-box { width: 15px; height: 15px; border: 1px solid var(--sx-border-strong); border-radius: 3px; display: inline-flex; align-items: center; justify-content: center; background: var(--sx-bg-surface); color: #fff; flex: none; }
  .check-box.on { background: var(--sx-brand); border-color: var(--sx-brand); }
  .open-card { margin-top: 15px; padding: 12px; border-radius: 8px; background: var(--sx-brand-soft); border: 1px solid var(--sx-border); }
  .open-card h4 { margin: 0 0 6px; font-size: 12px; display: flex; align-items: center; gap: 6px; }
  .open-card p { margin: 0 0 8px; font-size: 10.5px; line-height: 1.55; color: var(--sx-text-secondary); }

  .popover {
    position: absolute; z-index: 300; width: 200px; padding: 6px; border-radius: 7px;
    background: var(--sx-bg-surface); border: 1px solid var(--sx-border);
  }
  .popover button { display: block; width: 100%; text-align: left; padding: 7px 9px; border: 0; border-radius: 5px; background: transparent; color: var(--sx-text-secondary); font-size: 11px; }
  .popover button:hover { background: var(--sx-bg-hover); color: var(--sx-brand); }

  @media (max-width: 1200px) {
    .right { width: 264px; flex-basis: 264px; }
    .inline-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 980px) {
    .shell { flex-direction: column; }
    .sidebar { width: 100%; flex-basis: auto; flex-direction: row; flex-wrap: wrap; gap: 4px; }
    .side-title, .no-db-card { display: none; }
    .side-item { width: auto; }
    .right { width: auto; flex-basis: auto; margin: 0 14px 14px; max-height: none; }
  }
`
