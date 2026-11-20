/**
 * SheetX 第 32 张 · 快捷键与键盘操作管理 — 样式
 * 设置中心布局：左侧导航 / 中间快捷键表 / 右侧自定义与冲突检测。无 glow/shadow。
 */
import { css } from 'lit'

export const keyboardStyles = css`
  :host { display: block; }
  .app {
    display: flex; flex-direction: column; min-height: calc(100vh - 42px);
    background: var(--sx-bg-app); color: var(--sx-text-primary);
    font-family: 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
  }
  .menu-bar { height: 48px; flex: 0 0 48px; display: flex; align-items: center; gap: 16px; padding: 0 16px; background: var(--sx-bg-surface); border-bottom: 1px solid var(--sx-border); }
  .brand { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; }
  .menu-list { display: flex; gap: 2px; }
  .menu-item { padding: 6px 12px; border: 0; border-radius: 6px; background: transparent; color: var(--sx-text-secondary); font-size: 13px; }
  .menu-item:hover { background: var(--sx-bg-hover); color: var(--sx-text-primary); }
  .menu-item.active { color: var(--sx-brand); background: var(--sx-brand-soft); font-weight: 600; }
  .search-box { margin-left: auto; display: flex; align-items: center; gap: 6px; height: 30px; padding: 0 10px; border: 1px solid var(--sx-border); border-radius: 6px; color: var(--sx-text-hint); font-size: 11.5px; min-width: 168px; }
  .search-box input { flex: 1; min-width: 0; height: 100%; border: 0; outline: 0; background: transparent; color: var(--sx-text-primary); font: inherit; }
  .icon-btn { width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; border: 0; border-radius: 6px; background: transparent; color: var(--sx-text-secondary); }
  .icon-btn:hover { background: var(--sx-bg-hover); color: var(--sx-brand); }
  .avatar { width: 28px; height: 28px; border-radius: 50%; background: var(--sx-brand); color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; }
  .user-chip { display: flex; align-items: center; gap: 6px; font-size: 12px; }

  .shell { display: flex; flex: 1; min-height: 0; }
  .sidebar { width: 148px; flex: 0 0 148px; padding: 16px 9px; background: var(--sx-bg-surface); border-right: 1px solid var(--sx-border); }
  .side-title { font-size: 11px; font-weight: 600; color: var(--sx-text-hint); padding: 0 10px 11px; }
  .side-item { display: flex; align-items: center; gap: 9px; width: 100%; height: 36px; padding: 0 10px; border: 0; border-radius: 6px; background: transparent; color: var(--sx-text-secondary); font-size: 12.5px; text-align: left; }
  .side-item:hover { background: var(--sx-bg-hover); color: var(--sx-text-primary); }
  .side-item.active { background: var(--sx-brand-soft); color: var(--sx-brand); font-weight: 600; }

  .content { flex: 1; min-width: 0; padding: 18px 20px; overflow-y: auto; }
  .head { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 16px; }
  .head-icon { width: 44px; height: 44px; border-radius: 10px; background: var(--sx-brand); color: #fff; display: inline-flex; align-items: center; justify-content: center; flex: none; }
  .head h2 { margin: 0 0 4px; font-size: 19px; }
  .head p { margin: 0; font-size: 12px; color: var(--sx-text-hint); }
  .head-right { margin-left: auto; display: flex; align-items: center; gap: 14px; }
  .enable-row { display: flex; align-items: center; gap: 8px; font-size: 12px; }
  .switch { width: 36px; height: 20px; border-radius: 10px; border: 0; padding: 2px; background: var(--sx-border-strong); display: inline-flex; align-items: center; }
  .switch.on { background: var(--sx-brand); }
  .switch .knob { width: 16px; height: 16px; border-radius: 50%; background: #fff; transition: transform .15s; }
  .switch.on .knob { transform: translateX(16px); }
  .btn { height: 32px; padding: 0 13px; border: 1px solid var(--sx-border-input); border-radius: 6px; background: var(--sx-bg-surface); color: var(--sx-text-primary); font-size: 11.5px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
  .btn:hover { border-color: var(--sx-brand); }
  .btn.primary { background: var(--sx-brand); border-color: var(--sx-brand); color: #fff; }
  .btn.ghost { background: transparent; }

  .main-grid { display: grid; grid-template-columns: minmax(0, 1fr) 296px; gap: 16px; align-items: start; }
  .panel { background: var(--sx-bg-surface); border: 1px solid var(--sx-border); border-radius: 8px; overflow: hidden; }
  .tabs { display: flex; border-bottom: 1px solid var(--sx-border); overflow-x: auto; scrollbar-width: none; }
  .tabs::-webkit-scrollbar { display: none; }
  .tab { flex: 0 0 auto; height: 40px; padding: 0 14px; border: 0; border-bottom: 2px solid transparent; background: transparent; color: var(--sx-text-secondary); font-size: 12px; white-space: nowrap; }
  .tab:hover { color: var(--sx-text-primary); }
  .tab.active { color: var(--sx-brand); border-bottom-color: var(--sx-brand); font-weight: 600; }
  .table-wrap { max-height: 430px; overflow-y: auto; }
  .shortcut-table { width: 100%; border-collapse: collapse; font-size: 12px; }
  .shortcut-table th, .shortcut-table td { border-bottom: 1px solid var(--sx-border); padding: 8px 14px; text-align: left; }
  .shortcut-table th { background: var(--sx-bg-app); color: var(--sx-text-secondary); font-weight: 600; position: sticky; top: 0; z-index: 2; }
  .shortcut-table th:first-child { width: 32%; }
  .shortcut-table th:nth-child(2) { width: 32%; }
  .shortcut-table tbody tr:hover { background: var(--sx-bg-hover); }
  .fn-name { display: flex; align-items: center; gap: 8px; }
  .fn-name .ic { color: var(--sx-brand); }
  .excel-badge { display: inline-block; margin-left: 6px; padding: 1px 6px; border-radius: 8px; font-size: 9px; background: var(--sx-success-soft); color: var(--sx-success); }
  .keys { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
  .key {
    display: inline-flex; align-items: center; justify-content: center; min-width: 26px; height: 24px; padding: 0 7px;
    border: 1px solid var(--sx-border-strong); border-bottom-width: 2px; border-radius: 5px;
    background: var(--sx-bg-app); color: var(--sx-text-primary); font: 11px 'SF Mono', Menlo, monospace;
  }
  .plus { color: var(--sx-text-hint); font-size: 10px; }
  .desc { color: var(--sx-text-hint); font-size: 11px; }
  .disabled-note { padding: 26px; text-align: center; color: var(--sx-text-hint); font-size: 12px; }

  .side-col { display: flex; flex-direction: column; gap: 14px; }
  .card { padding: 15px; border: 1px solid var(--sx-border); border-radius: 8px; background: var(--sx-bg-surface); }
  .card h3 { margin: 0 0 11px; font-size: 13.5px; display: flex; align-items: center; gap: 7px; }
  .info-box { display: flex; gap: 8px; padding: 10px 11px; border-radius: 6px; background: var(--sx-brand-soft); font-size: 10.5px; line-height: 1.55; color: var(--sx-text-secondary); margin-bottom: 13px; }
  .info-box .ic { color: var(--sx-brand); flex: none; }
  .field-label { display: block; font-size: 11.5px; font-weight: 600; margin-bottom: 6px; }
  .full-select { width: 100%; height: 32px; padding: 0 9px; border: 1px solid var(--sx-border-input); border-radius: 6px; background: var(--sx-bg-surface); color: var(--sx-text-primary); font-size: 11.5px; outline: none; }
  .full-select:focus { border-color: var(--sx-brand); }
  .key-input-row { display: flex; align-items: center; gap: 5px; }
  .key-input {
    height: 30px; min-width: 54px; padding: 0 8px; border: 1px solid var(--sx-border-input); border-radius: 5px;
    background: var(--sx-bg-surface); color: var(--sx-text-primary); font: 11.5px 'SF Mono', Menlo, monospace; text-align: center; outline: none;
  }
  .key-input:focus { border-color: var(--sx-brand); }
  .key-input.mod { width: 64px; }
  .key-plus { font-size: 11px; color: var(--sx-text-hint); }
  .key-remove { width: 26px; height: 26px; display: inline-flex; align-items: center; justify-content: center; border: 0; border-radius: 5px; background: transparent; color: var(--sx-text-hint); }
  .key-remove:hover { color: var(--sx-danger); background: var(--sx-bg-hover); }
  .custom-actions { display: flex; gap: 8px; margin-top: 13px; }
  .custom-actions .btn { flex: 1; height: 33px; }
  .conflict-card { border-color: #fcd9a4; background: rgba(245, 158, 11, 0.08); }
  .conflict-card h3 { color: #b45309; }
  .conflict-card p { margin: 0 0 7px; font-size: 11px; line-height: 1.6; color: var(--sx-text-secondary); }
  .conflict-row { display: flex; align-items: center; gap: 8px; padding: 8px 0; border-top: 1px solid rgba(180, 83, 9, 0.15); }
  .conflict-row .warn { color: #b45309; }
  .conflict-row .txt { flex: 1; font-size: 10.5px; line-height: 1.5; }
  .conflict-row .txt b { color: #b45309; }
  .conflict-row .btn { height: 26px; padding: 0 9px; font-size: 10px; }
  .conflict-live { margin-top: 10px; padding: 9px 10px; border-radius: 6px; background: var(--sx-danger); color: #fff; font-size: 10.5px; line-height: 1.5; }

  .tips { margin-top: 16px; padding: 13px 16px; border: 1px solid var(--sx-border); border-radius: 8px; background: var(--sx-bg-surface); display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .tips-title { display: flex; align-items: center; gap: 7px; font-size: 12.5px; font-weight: 600; }
  .tips-title .ic { color: var(--sx-brand); }
  .tip-item { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; color: var(--sx-text-secondary); }
  .tip-item .ok { color: var(--sx-success); }
  .tips-link { margin-left: auto; font-size: 11px; color: var(--sx-brand); background: transparent; border: 0; display: inline-flex; align-items: center; gap: 4px; }

  @media (max-width: 1200px) {
    .main-grid { grid-template-columns: 1fr; }
    .side-col { flex-direction: row; flex-wrap: wrap; }
    .card { flex: 1; min-width: 260px; }
  }
  @media (max-width: 860px) {
    .sidebar { width: 100%; flex-basis: auto; flex-direction: row; flex-wrap: wrap; gap: 3px; }
    .side-title { display: none; }
    .side-item { width: auto; }
  }
`
