/**
 * SheetX 第 33 张 · 插件开发与扩展 API — 样式
 * 左侧导航 / 插件市场列表 / 插件详情+代码 / 底部管理表。无 glow/shadow。
 */
import { css } from 'lit'

export const pluginDevStyles = css`
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

  .shell { display: flex; flex: 1; min-height: 0; }
  .sidebar { width: 132px; flex: 0 0 132px; padding: 16px 8px; background: var(--sx-bg-surface); border-right: 1px solid var(--sx-border); }
  .side-item { display: flex; align-items: center; gap: 8px; width: 100%; height: 36px; padding: 0 10px; border: 0; border-radius: 6px; background: transparent; color: var(--sx-text-secondary); font-size: 12.5px; text-align: left; }
  .side-item:hover { background: var(--sx-bg-hover); color: var(--sx-text-primary); }
  .side-item.active { background: var(--sx-brand-soft); color: var(--sx-brand); font-weight: 600; }

  .main { flex: 1; min-width: 0; padding: 14px; display: flex; flex-direction: column; gap: 12px; }
  .top-grid { display: grid; grid-template-columns: minmax(320px, 0.9fr) minmax(0, 1.1fr); gap: 12px; align-items: start; }
  .panel { background: var(--sx-bg-surface); border: 1px solid var(--sx-border); border-radius: 8px; overflow: hidden; }
  .market { padding: 13px; }
  .search-row { display: flex; gap: 8px; margin-bottom: 11px; }
  .search-input { flex: 1; height: 32px; padding: 0 10px; border: 1px solid var(--sx-border-input); border-radius: 6px; background: var(--sx-bg-surface); color: var(--sx-text-primary); font-size: 11.5px; outline: none; }
  .search-input:focus { border-color: var(--sx-brand); }
  .select { height: 32px; padding: 0 8px; border: 1px solid var(--sx-border-input); border-radius: 6px; background: var(--sx-bg-surface); color: var(--sx-text-primary); font-size: 11.5px; outline: none; }
  .cats { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 11px; }
  .cat { padding: 5px 10px; border: 1px solid var(--sx-border-input); border-radius: 6px; background: var(--sx-bg-surface); color: var(--sx-text-secondary); font-size: 11px; }
  .cat:hover { border-color: var(--sx-brand); }
  .cat.on { background: var(--sx-brand); border-color: var(--sx-brand); color: #fff; }
  .plugin-list { display: flex; flex-direction: column; gap: 6px; max-height: 424px; overflow-y: auto; }
  .plugin-item { display: flex; align-items: center; gap: 10px; padding: 10px; border: 1px solid var(--sx-border); border-radius: 7px; cursor: pointer; }
  .plugin-item:hover { border-color: var(--sx-brand); }
  .plugin-item.active { border-color: var(--sx-brand); background: var(--sx-brand-soft); }
  .p-icon { width: 38px; height: 38px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; color: #fff; flex: none; }
  .p-info { flex: 1; min-width: 0; }
  .p-info h4 { margin: 0 0 3px; font-size: 12.5px; }
  .p-info p { margin: 0 0 4px; font-size: 10.5px; color: var(--sx-text-hint); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .p-meta { font-size: 10px; color: var(--sx-text-hint); }
  .p-meta .star { color: #e5a23c; }
  .btn { height: 28px; padding: 0 10px; border: 1px solid var(--sx-border-input); border-radius: 5px; background: var(--sx-bg-surface); color: var(--sx-text-primary); font-size: 11px; display: inline-flex; align-items: center; justify-content: center; gap: 5px; white-space: nowrap; }
  .btn:hover { border-color: var(--sx-brand); }
  .btn.primary { background: var(--sx-brand); border-color: var(--sx-brand); color: #fff; }
  .btn.sm { height: 26px; padding: 0 8px; font-size: 10px; }

  /* 详情 */
  .detail { padding: 0; }
  .detail-head { display: flex; align-items: center; gap: 11px; padding: 14px; }
  .detail-head .p-icon { width: 48px; height: 48px; border-radius: 10px; }
  .detail-head h3 { margin: 0 0 4px; font-size: 15px; }
  .detail-head p { margin: 0; font-size: 11.5px; color: var(--sx-text-hint); }
  .detail-head .meta { margin-top: 5px; font-size: 10.5px; color: var(--sx-text-hint); }
  .detail-head .meta .star { color: #e5a23c; }
  .detail-actions { margin-left: auto; display: flex; flex-direction: column; gap: 6px; }
  .detail-tabs { display: flex; padding: 0 14px; border-bottom: 1px solid var(--sx-border); }
  .detail-tab { height: 34px; padding: 0 12px; border: 0; border-bottom: 2px solid transparent; background: transparent; color: var(--sx-text-secondary); font-size: 11.5px; }
  .detail-tab.active { color: var(--sx-brand); border-bottom-color: var(--sx-brand); font-weight: 600; }
  .detail-body { padding: 14px; }
  .intro { font-size: 11.5px; line-height: 1.7; color: var(--sx-text-secondary); margin-bottom: 14px; }
  .code-head { display: flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 600; margin-bottom: 8px; }
  .code-head .actions { margin-left: auto; display: flex; gap: 6px; }
  .code-box {
    margin: 0; padding: 11px 12px; border: 1px solid var(--sx-border); border-radius: 6px; background: var(--sx-bg-app);
    font: 10.5px/1.6 'SF Mono', Menlo, Consolas, monospace; color: var(--sx-text-secondary);
    white-space: pre-wrap; word-break: keep-all; overflow-wrap: break-word; max-height: 232px; overflow: auto;
  }
  .ability-box { margin-top: 12px; padding: 11px 12px; border: 1px solid var(--sx-border); border-radius: 6px; background: var(--sx-bg-app); }
  .ability-box h4 { margin: 0 0 8px; font-size: 11.5px; }
  .ability-row { display: flex; align-items: center; gap: 6px; font-size: 10.5px; padding: 3px 0; color: var(--sx-text-secondary); }
  .ability-row .ok { color: var(--sx-success); }
  .output { margin-top: 10px; padding: 10px; border: 1px solid var(--sx-success); border-radius: 6px; background: var(--sx-success-soft); color: var(--sx-success); font: 10.5px/1.6 'SF Mono', Menlo, monospace; white-space: pre-wrap; }

  .info-table { width: 100%; border-collapse: collapse; font-size: 11px; }
  .info-table th, .info-table td { border: 1px solid var(--sx-border); padding: 7px 10px; text-align: left; }
  .info-table th { background: var(--sx-bg-app); color: var(--sx-text-secondary); }
  .version-item { padding: 9px 0; border-bottom: 1px solid var(--sx-border); font-size: 11px; }
  .version-item .v { font-weight: 600; }
  .version-item .d { color: var(--sx-text-hint); font-size: 10.5px; margin-top: 2px; }

  /* 底部 */
  .bottom { flex: 0 0 auto; }
  .bottom-tabs { display: flex; border-bottom: 1px solid var(--sx-border); }
  .bottom-tab { height: 34px; padding: 0 14px; border: 0; border-bottom: 2px solid transparent; background: transparent; color: var(--sx-text-secondary); font-size: 11.5px; }
  .bottom-tab.active { color: var(--sx-brand); border-bottom-color: var(--sx-brand); font-weight: 600; }
  .bottom-body { padding: 0; }
  .manage-table { width: 100%; border-collapse: collapse; font-size: 11px; }
  .manage-table th, .manage-table td { border-bottom: 1px solid var(--sx-border); padding: 8px 14px; text-align: left; }
  .manage-table th { background: var(--sx-bg-app); color: var(--sx-text-secondary); font-weight: 600; }
  .manage-table td .nm { display: flex; align-items: center; gap: 7px; }
  .status-on { display: inline-flex; align-items: center; gap: 4px; color: var(--sx-success); }
  .status-off { display: inline-flex; align-items: center; gap: 4px; color: var(--sx-text-hint); }
  .ops { display: flex; gap: 5px; }
  .dev-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 13px; }
  .dev-card { padding: 12px; border: 1px solid var(--sx-border); border-radius: 7px; background: var(--sx-bg-app); }
  .dev-card h4 { margin: 0 0 9px; font-size: 12px; }
  .hook-row { display: flex; gap: 9px; padding: 5px 0; font-size: 10.5px; border-bottom: 1px solid var(--sx-border); }
  .hook-row code { color: var(--sx-brand); font-family: 'SF Mono', Menlo, monospace; }
  .hook-row .d { color: var(--sx-text-hint); }
  .log-line { display: flex; gap: 8px; padding: 5px 0; font: 10.5px 'SF Mono', Menlo, monospace; border-bottom: 1px solid var(--sx-border); }
  .log-line .t { color: var(--sx-text-hint); }
  .log-line .lvl { color: var(--sx-brand); }
  .log-line .lvl.OK { color: var(--sx-success); }
  .log-line .lvl.WARN { color: #e5a23c; }
  .dev-tip { margin-left: auto; width: 240px; padding: 12px; border-radius: 8px; background: var(--sx-brand-soft); border: 1px solid var(--sx-border); }
  .dev-tip h4 { margin: 0 0 6px; font-size: 12px; display: flex; align-items: center; gap: 6px; }
  .dev-tip p { margin: 0 0 8px; font-size: 10.5px; line-height: 1.6; color: var(--sx-text-secondary); }
  .dev-tip .link { font-size: 10.5px; color: var(--sx-brand); background: transparent; border: 0; padding: 0; display: inline-flex; align-items: center; gap: 4px; }

  @media (max-width: 1200px) {
    .top-grid { grid-template-columns: 1fr; }
    .dev-grid { grid-template-columns: 1fr; }
    .dev-tip { width: 100%; }
  }
  @media (max-width: 860px) {
    .sidebar { width: 100%; flex-basis: auto; flex-direction: row; flex-wrap: wrap; gap: 3px; }
    .side-item { width: auto; }
  }
`
