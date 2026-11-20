/**
 * SheetX 第 29 张 · 数据权限与安全控制 — 样式
 * 三栏：权限导航 / 权限配置与数据预览 / 回调调试。无 glow/shadow。
 */
import { css } from 'lit'

export const permissionStyles = css`
  :host { display: block; }
  .app {
    display: flex; flex-direction: column; min-height: calc(100vh - 42px);
    background: var(--sx-bg-app); color: var(--sx-text-primary);
    font-family: 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
  }
  .menu-bar, .toolbar {
    display: flex; align-items: center; background: var(--sx-bg-surface);
  }
  .menu-bar { height: 48px; padding: 0 16px; gap: 16px; border-bottom: 1px solid var(--sx-border); }
  .brand { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; }
  .menu-list { display: flex; gap: 2px; }
  .menu-item { padding: 6px 12px; border: 0; border-radius: 6px; background: transparent; color: var(--sx-text-secondary); font-size: 13px; }
  .menu-item:hover { background: var(--sx-bg-hover); color: var(--sx-text-primary); }
  .menu-item.active { color: var(--sx-brand); background: var(--sx-brand-soft); font-weight: 600; }
  .menu-right { margin-left: auto; display: flex; align-items: center; gap: 10px; }
  .icon-btn { width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; border: 0; border-radius: 6px; background: transparent; color: var(--sx-text-secondary); }
  .icon-btn:hover { background: var(--sx-bg-hover); color: var(--sx-brand); }
  .avatar { width: 28px; height: 28px; border-radius: 50%; background: var(--sx-brand); color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; }
  .toolbar { height: 40px; padding: 0 14px; gap: 8px; border-bottom: 1px solid var(--sx-border); font-size: 11.5px; color: var(--sx-text-hint); }
  .toolbar .sep { width: 1px; height: 16px; background: var(--sx-border); margin: 0 4px; }
  .tool-tag { display: inline-flex; align-items: center; gap: 5px; padding: 3px 8px; border-radius: 5px; background: var(--sx-bg-app); border: 1px solid var(--sx-border); }
  .tool-tag.on { color: var(--sx-brand); border-color: var(--sx-brand); }

  .shell { display: flex; flex: 1; min-height: 0; }
  .sidebar {
    width: 178px; flex: 0 0 178px; padding: 16px 10px; background: var(--sx-bg-surface);
    border-right: 1px solid var(--sx-border); display: flex; flex-direction: column;
  }
  .side-title { font-size: 11px; font-weight: 600; color: var(--sx-text-hint); padding: 0 10px 10px; }
  .side-item {
    display: flex; align-items: center; gap: 10px; width: 100%; height: 36px; padding: 0 10px;
    border: 0; border-radius: 6px; background: transparent; color: var(--sx-text-secondary); font-size: 12.5px; text-align: left;
  }
  .side-item:hover { background: var(--sx-bg-hover); color: var(--sx-text-primary); }
  .side-item.active { background: var(--sx-brand-soft); color: var(--sx-brand); font-weight: 600; }
  .boundary-card {
    margin-top: 20px; padding: 13px 12px; border-radius: 8px;
    background: var(--sx-bg-app); border: 1px solid var(--sx-border);
  }
  .boundary-card h4 { margin: 0 0 7px; font-size: 12.5px; display: flex; align-items: center; gap: 6px; color: var(--sx-brand); }
  .boundary-card p { margin: 0 0 8px; font-size: 11px; line-height: 1.55; color: var(--sx-text-hint); }
  .boundary-card .owner { font-size: 10px; color: var(--sx-success); font-weight: 600; }

  .center { flex: 1; min-width: 0; padding: 14px; display: flex; flex-direction: column; gap: 12px; }
  .panel { background: var(--sx-bg-surface); border: 1px solid var(--sx-border); border-radius: 8px; overflow: hidden; }
  .panel-head { display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-bottom: 1px solid var(--sx-border); }
  .head-icon { width: 36px; height: 36px; border-radius: 8px; background: var(--sx-brand); color: #fff; display: inline-flex; align-items: center; justify-content: center; flex: none; }
  .panel-head h3 { margin: 0 0 3px; font-size: 14.5px; }
  .panel-head p { margin: 0; font-size: 11.5px; color: var(--sx-text-hint); }
  .panel-head .pill { margin-left: auto; }
  .pill { display: inline-flex; align-items: center; gap: 5px; height: 24px; padding: 0 10px; border-radius: 12px; font-size: 10.5px; background: var(--sx-brand-soft); color: var(--sx-brand); white-space: nowrap; }
  .pill .dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

  .section-title { font-size: 12.5px; font-weight: 600; margin: 0 0 9px; display: flex; align-items: center; gap: 7px; }
  .sec { padding: 15px 16px; border-bottom: 1px solid var(--sx-border); }
  .sec:last-child { border-bottom: 0; }
  .role-row { display: flex; gap: 8px; flex-wrap: wrap; }
  .role-chip {
    display: flex; align-items: center; gap: 7px; padding: 8px 11px; border-radius: 7px;
    border: 1px solid var(--sx-border-input); background: var(--sx-bg-app); cursor: pointer;
  }
  .role-chip:hover { border-color: var(--sx-brand); }
  .role-chip.on { border-color: var(--sx-brand); background: var(--sx-brand-soft); }
  .role-dot { width: 8px; height: 8px; border-radius: 50%; flex: none; }
  .role-chip .name { font-size: 12px; font-weight: 600; }
  .role-chip .meta { font-size: 10px; color: var(--sx-text-hint); }

  .perm-table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
  .perm-table th, .perm-table td { border: 1px solid var(--sx-border); padding: 7px 10px; text-align: center; }
  .perm-table th { background: var(--sx-bg-app); color: var(--sx-text-secondary); font-weight: 600; }
  .perm-table td:first-child { text-align: left; font-weight: 600; }
  .perm-table td.name-col { text-align: left; font-weight: 600; }
  .tag-sensitive { display: inline-block; margin-left: 6px; padding: 1px 6px; border-radius: 8px; font-size: 9px; background: #fef3c7; color: #a16207; }
  .toggle-sm { width: 32px; height: 18px; border-radius: 9px; border: 0; padding: 2px; background: var(--sx-border-strong); display: inline-flex; align-items: center; }
  .toggle-sm.on { background: var(--sx-brand); }
  .toggle-sm .knob { width: 14px; height: 14px; border-radius: 50%; background: #fff; transition: transform .15s; }
  .toggle-sm.on .knob { transform: translateX(14px); }

  .data-table { width: 100%; border-collapse: collapse; font-size: 11px; table-layout: fixed; }
  .data-table th, .data-table td { border-bottom: 1px solid var(--sx-grid-line); border-right: 1px solid var(--sx-grid-line); padding: 7px 9px; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .data-table th { background: var(--sx-bg-app); color: var(--sx-text-secondary); font-weight: 600; }
  .data-table td.ro { background: var(--sx-bg-subtle); color: var(--sx-text-hint); cursor: not-allowed; }
  .data-table td.hidden-col { opacity: .35; text-decoration: line-through; }
  .data-table td.masked { color: var(--sx-text-hint); font-family: 'SF Mono', Menlo, monospace; }
  .data-table tr:hover td:not(.ro) { background: var(--sx-bg-hover); }
  .lock-mark { color: var(--sx-text-hint); margin-left: 4px; }
  .ro-badge { display: inline-flex; align-items: center; gap: 3px; font-size: 9px; color: var(--sx-text-hint); }

  .field-row { display: flex; align-items: center; gap: 9px; margin-top: 9px; font-size: 11.5px; }
  .field-row label { width: 86px; flex: none; color: var(--sx-text-secondary); }
  .input, .select { height: 30px; padding: 0 9px; border: 1px solid var(--sx-border-input); border-radius: 6px; background: var(--sx-bg-surface); color: var(--sx-text-primary); font-size: 11.5px; outline: none; flex: 1; min-width: 0; }
  .input:focus, .select:focus { border-color: var(--sx-brand); }
  .check-row { display: inline-flex; align-items: center; gap: 7px; font-size: 11.5px; color: var(--sx-text-secondary); cursor: pointer; }
  .check-box { width: 15px; height: 15px; border: 1px solid var(--sx-border-strong); border-radius: 3px; display: inline-flex; align-items: center; justify-content: center; background: var(--sx-bg-surface); color: #fff; flex: none; }
  .check-box.on { background: var(--sx-brand); border-color: var(--sx-brand); }

  .doc-box { padding: 13px; border-radius: 6px; background: var(--sx-bg-app); border: 1px solid var(--sx-border); font: 10.5px/1.65 'SF Mono', Menlo, Consolas, monospace; color: var(--sx-text-secondary); white-space: pre-wrap; word-break: keep-all; overflow-wrap: break-word; overflow-x: auto; }
  .tip { display: flex; gap: 8px; padding: 11px 12px; border-radius: 7px; background: var(--sx-brand-soft); font-size: 11px; line-height: 1.6; color: var(--sx-text-secondary); }
  .tip .ic { color: var(--sx-brand); flex: none; }
  .tip b { color: var(--sx-brand); }

  /* 右侧回调调试 */
  .right { width: 300px; flex: 0 0 300px; margin: 14px 14px 14px 0; padding: 15px; background: var(--sx-bg-surface); border: 1px solid var(--sx-border); border-radius: 8px; align-self: flex-start; max-height: calc(100vh - 42px - 48px - 40px - 28px); overflow-y: auto; }
  .right-head { display: flex; align-items: center; gap: 8px; font-size: 13.5px; font-weight: 600; padding-bottom: 12px; border-bottom: 1px solid var(--sx-border); }
  .right-head .online { margin-left: auto; font-size: 10px; color: var(--sx-success); font-weight: 400; }
  .test-btn { width: 100%; height: 32px; margin: 12px 0; border: 1px solid var(--sx-brand); border-radius: 6px; background: var(--sx-bg-surface); color: var(--sx-brand); font-size: 11.5px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
  .test-btn:hover { background: var(--sx-brand-soft); }
  .test-btn:disabled { opacity: .6; cursor: wait; }
  .log-row { padding: 9px 0; border-bottom: 1px solid var(--sx-border); }
  .log-row:last-child { border-bottom: 0; }
  .log-top { display: flex; align-items: center; gap: 6px; font-size: 10.5px; }
  .log-top .time { color: var(--sx-text-hint); font-variant-numeric: tabular-nums; }
  .log-top .act { font-weight: 600; color: var(--sx-text-primary); }
  .log-top .res { margin-left: auto; padding: 1px 7px; border-radius: 8px; font-size: 9.5px; font-weight: 600; }
  .log-detail { margin-top: 4px; font: 10px/1.5 'SF Mono', Menlo, monospace; color: var(--sx-text-hint); }
  .log-source { margin-top: 2px; font-size: 9.5px; color: var(--sx-success); }
  .empty { padding: 20px 0; text-align: center; font-size: 11px; color: var(--sx-text-hint); }

  @media (max-width: 1200px) { .right { width: 264px; flex-basis: 264px; } }
  @media (max-width: 980px) {
    .shell { flex-direction: column; }
    .sidebar { width: 100%; flex-basis: auto; flex-direction: row; flex-wrap: wrap; gap: 4px; }
    .side-title, .boundary-card { display: none; }
    .side-item { width: auto; }
    .right { width: auto; flex-basis: auto; margin: 0 14px 14px; max-height: none; }
  }
`
