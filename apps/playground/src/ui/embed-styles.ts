/**
 * SheetX 第 35 张 · 嵌入式集成示例 — 样式
 * 顶部文档菜单 / 左侧指南 / 代码示例 + 运行效果 / 底部集成方式与回调。无 glow/shadow。
 */
import { css } from 'lit'

export const embedStyles = css`
  :host { display: block; }
  .app {
    display: flex; flex-direction: column; min-height: calc(100vh - 42px);
    background: var(--sx-bg-app); color: var(--sx-text-primary);
    font-family: 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
  }
  .menu-bar { height: 48px; flex: 0 0 48px; display: flex; align-items: center; gap: 16px; padding: 0 16px; background: var(--sx-bg-surface); border-bottom: 1px solid var(--sx-border); }
  .brand { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; }
  .menu-list { display: flex; gap: 2px; }
  .menu-item { padding: 6px 12px; border: 0; border-radius: 6px; background: transparent; color: var(--sx-text-secondary); font-size: 13px; text-decoration: none; cursor: pointer; }
  .menu-item:hover { background: var(--sx-bg-hover); color: var(--sx-text-primary); }
  .menu-item.active { color: var(--sx-brand); background: var(--sx-brand-soft); font-weight: 600; }
  .search-box { margin-left: auto; display: flex; align-items: center; gap: 6px; height: 30px; padding: 0 10px; border: 1px solid var(--sx-border); border-radius: 6px; color: var(--sx-text-hint); font-size: 11.5px; min-width: 168px; }
  .search-box input { flex: 1; min-width: 0; height: 100%; border: 0; outline: 0; background: transparent; color: var(--sx-text-primary); font: inherit; }
  .icon-btn { width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; border: 0; border-radius: 6px; background: transparent; color: var(--sx-text-secondary); }
  .icon-btn:hover { background: var(--sx-bg-hover); color: var(--sx-brand); }
  .avatar { width: 28px; height: 28px; border-radius: 50%; background: var(--sx-brand); color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; }

  .shell { display: flex; flex: 1; min-height: 0; }
  .sidebar { width: 158px; flex: 0 0 158px; padding: 16px 9px; background: var(--sx-bg-surface); border-right: 1px solid var(--sx-border); }
  .side-title { font-size: 12px; font-weight: 700; padding: 0 10px 12px; }
  .side-item { display: flex; align-items: center; gap: 8px; width: 100%; height: 34px; padding: 0 10px; border: 0; border-radius: 6px; background: transparent; color: var(--sx-text-secondary); font-size: 12.5px; text-align: left; }
  .side-item:hover { background: var(--sx-bg-hover); color: var(--sx-text-primary); }
  .side-item.active { background: var(--sx-brand-soft); color: var(--sx-brand); font-weight: 600; }
  .side-item .arrow { margin-left: auto; font-size: 10px; }
  .sub-item { display: block; width: 100%; padding: 7px 10px 7px 30px; border: 0; background: transparent; color: var(--sx-text-hint); font-size: 11.5px; text-align: left; border-left: 2px solid transparent; }
  .sub-item:hover { color: var(--sx-text-primary); }
  .sub-item.active { color: var(--sx-brand); border-left-color: var(--sx-brand); font-weight: 600; }

  .main { flex: 1; min-width: 0; padding: 18px 20px; overflow-y: auto; }
  .head { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 16px; }
  .head-icon { width: 44px; height: 44px; border-radius: 10px; background: var(--sx-brand); color: #fff; display: inline-flex; align-items: center; justify-content: center; flex: none; }
  .head h2 { margin: 0 0 5px; font-size: 19px; }
  .head p { margin: 0; font-size: 12px; color: var(--sx-text-hint); }
  .head-actions { margin-left: auto; display: flex; gap: 8px; }
  .btn { height: 32px; padding: 0 12px; border: 1px solid var(--sx-border-input); border-radius: 6px; background: var(--sx-bg-surface); color: var(--sx-text-primary); font-size: 11.5px; display: inline-flex; align-items: center; gap: 6px; }
  .btn:hover { border-color: var(--sx-brand); }
  .btn.primary { background: var(--sx-brand); border-color: var(--sx-brand); color: #fff; }

  .fw-tabs { display: flex; gap: 7px; margin-bottom: 13px; }
  .fw-tab { display: inline-flex; align-items: center; gap: 7px; height: 36px; padding: 0 16px; border: 1px solid var(--sx-border); border-radius: 7px; background: var(--sx-bg-surface); color: var(--sx-text-secondary); font-size: 12.5px; }
  .fw-tab:hover { border-color: var(--sx-brand); }
  .fw-tab.active { border-color: var(--sx-brand); background: var(--sx-brand-soft); color: var(--sx-brand); font-weight: 600; }
  .fw-mark { width: 18px; height: 18px; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; color: #fff; font-size: 10px; font-weight: 700; flex: none; }

  .demo-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 13px; align-items: stretch; }
  .panel { background: var(--sx-bg-surface); border: 1px solid var(--sx-border); border-radius: 8px; overflow: hidden; }
  .panel-head { display: flex; align-items: center; gap: 8px; padding: 11px 14px; border-bottom: 1px solid var(--sx-border); font-size: 12.5px; font-weight: 600; }
  .panel-head .right { margin-left: auto; display: flex; gap: 6px; }

  /* 代码区 */
  .code-box { padding: 10px 0; overflow: auto; max-height: 316px; background: var(--sx-bg-app); }
  .code-line { display: flex; font: 10.8px/1.85 'SF Mono', Menlo, Consolas, monospace; white-space: pre; padding: 0 12px; }
  .code-line:hover { background: var(--sx-bg-hover); }
  .code-line .ln { width: 26px; flex: none; text-align: right; padding-right: 12px; color: var(--sx-text-hint); user-select: none; }
  .code-line .src { color: var(--sx-text-secondary); }
  .tok-tag { color: #2563eb; }
  .tok-attr { color: #e5a23c; }
  .tok-str { color: #16a34a; }
  .tok-kw { color: #9333ea; }
  .tok-com { color: var(--sx-text-hint); }

  /* 运行效果表格 */
  .run-grid { padding: 11px 12px; }
  .mini-toolbar { display: flex; align-items: center; gap: 5px; padding: 6px 8px; border: 1px solid var(--sx-border); border-radius: 6px 6px 0 0; background: var(--sx-bg-app); font-size: 10.5px; overflow-x: auto; scrollbar-width: none; }
  .mini-toolbar::-webkit-scrollbar { display: none; }
  .mini-btn { min-width: 22px; height: 22px; padding: 0 5px; display: inline-flex; align-items: center; justify-content: center; border: 0; border-radius: 4px; background: transparent; color: var(--sx-text-secondary); }
  .mini-btn:hover { background: var(--sx-bg-hover); color: var(--sx-brand); }
  .mini-sep { width: 1px; height: 14px; background: var(--sx-border); margin: 0 3px; }
  .demo-table { width: 100%; border-collapse: collapse; font-size: 11px; table-layout: fixed; }
  .demo-table th, .demo-table td { border-bottom: 1px solid var(--sx-border); border-right: 1px solid var(--sx-border); padding: 7px 9px; text-align: left; }
  .demo-table th { background: var(--sx-brand); color: #fff; font-weight: 600; }
  .demo-table td { background: var(--sx-bg-surface); }
  .demo-table td.active { outline: 2px solid var(--sx-brand); outline-offset: -2px; background: var(--sx-brand-soft); }
  .demo-table tr.total-row td { background: var(--sx-brand-soft); font-weight: 700; }
  .col-head { display: flex; background: var(--sx-bg-app); border: 1px solid var(--sx-border); border-top: 0; font-size: 10px; color: var(--sx-text-hint); }
  .col-head span { flex: 1; text-align: center; padding: 3px 0; border-right: 1px solid var(--sx-border); }
  .col-head span:first-child { flex: 0 0 34px; background: var(--sx-bg-hover); }
  .sheet-strip { display: flex; align-items: center; gap: 4px; padding: 5px 8px; border: 1px solid var(--sx-border); border-top: 0; border-radius: 0 0 6px 6px; font-size: 10px; color: var(--sx-brand); }
  .sheet-strip .tab { padding: 2px 8px; border-radius: 4px 4px 0 0; background: var(--sx-brand-soft); }
  .sheet-strip .add { color: var(--sx-text-hint); cursor: pointer; }
  .event-log { margin-top: 10px; padding: 9px 10px; border: 1px solid var(--sx-border); border-radius: 6px; background: var(--sx-bg-app); font: 10px/1.7 'SF Mono', Menlo, monospace; color: var(--sx-text-hint); max-height: 72px; overflow: auto; }
  .event-log .hit { color: var(--sx-success); }

  /* 底部 */
  .bottom-grid { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(0, 0.75fr); gap: 13px; margin-top: 13px; align-items: start; }
  .integration-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; padding: 13px; }
  .int-card { padding: 12px; border: 1px solid var(--sx-border); border-radius: 7px; background: var(--sx-bg-app); }
  .int-card h4 { margin: 0 0 5px; font-size: 12px; display: flex; align-items: center; gap: 6px; }
  .int-card .ic { color: var(--sx-brand); flex: none; }
  .int-card p { margin: 0 0 9px; font-size: 10.5px; color: var(--sx-text-hint); }
  .int-card code { display: block; padding: 7px 8px; border-radius: 5px; background: var(--sx-bg-surface); border: 1px solid var(--sx-border); font: 9.8px/1.5 'SF Mono', Menlo, monospace; color: var(--sx-text-secondary); word-break: break-all; min-height: 34px; }
  .int-card .link { margin-top: 9px; font-size: 10.5px; color: var(--sx-brand); background: transparent; border: 0; padding: 0; display: inline-flex; align-items: center; gap: 4px; }
  .event-body { padding: 13px; }
  .event-body p { margin: 0 0 9px; font-size: 10.5px; color: var(--sx-text-hint); }
  .event-code { padding: 9px 10px; border: 1px solid var(--sx-border); border-radius: 6px; background: var(--sx-bg-app); font: 10.5px/1.7 'SF Mono', Menlo, monospace; color: var(--sx-text-secondary); white-space: pre-wrap; }
  .event-items { display: flex; flex-direction: column; gap: 5px; margin-top: 9px; }
  .event-item { display: flex; gap: 8px; font-size: 10.5px; }
  .event-item code { color: var(--sx-brand); font-family: 'SF Mono', Menlo, monospace; }
  .event-item .d { color: var(--sx-text-hint); }

  @media (max-width: 1200px) {
    .demo-grid, .bottom-grid { grid-template-columns: 1fr; }
    .integration-grid { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 860px) {
    .sidebar { width: 100%; flex-basis: auto; flex-direction: row; flex-wrap: wrap; gap: 3px; }
    .side-title, .sub-item { display: none; }
    .side-item { width: auto; }
  }
`
