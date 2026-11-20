/**
 * SheetX 第 36 张 · API 文档中心 — 样式
 * 顶部文档菜单 / 左侧分组导航 / 中间文档正文 / 右侧在线示例与完整代码。
 */
import { css } from 'lit'

export const apiDocStyles = css`
  :host { display: block; }
  .app {
    display: flex; flex-direction: column; min-height: calc(100vh - 42px);
    background: var(--sx-bg-app); color: var(--sx-text-primary);
    font-family: 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
  }
  .menu-bar { height: 48px; flex: 0 0 48px; display: flex; align-items: center; gap: 16px; padding: 0 16px; background: var(--sx-bg-surface); border-bottom: 1px solid var(--sx-border); }
  .brand { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; }
  .menu-list { display: flex; gap: 2px; }
  .menu-item { padding: 6px 12px; border: 0; border-radius: 6px; background: transparent; color: var(--sx-text-secondary); font-size: 13px; cursor: pointer; }
  .menu-item:hover { background: var(--sx-bg-hover); color: var(--sx-text-primary); }
  .menu-item.active { color: var(--sx-brand); background: var(--sx-brand-soft); font-weight: 600; }
  .search-box { margin-left: auto; display: flex; align-items: center; gap: 6px; height: 30px; padding: 0 10px; border: 1px solid var(--sx-border); border-radius: 6px; color: var(--sx-text-hint); font-size: 11.5px; min-width: 168px; }
  .search-box input { flex: 1; min-width: 0; height: 100%; border: 0; outline: 0; background: transparent; color: var(--sx-text-primary); font: inherit; }
  .icon-btn { width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; border: 0; border-radius: 6px; background: transparent; color: var(--sx-text-secondary); }
  .icon-btn:hover { background: var(--sx-bg-hover); color: var(--sx-brand); }
  .avatar { width: 28px; height: 28px; border-radius: 50%; background: var(--sx-brand); color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; }

  .shell { display: flex; flex: 1; min-height: 0; }
  .sidebar { width: 152px; flex: 0 0 152px; padding: 15px 9px; background: var(--sx-bg-surface); border-right: 1px solid var(--sx-border); overflow-y: auto; }
  .side-title { font-size: 12.5px; font-weight: 700; padding: 0 9px 12px; }
  .group-title { display: flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 600; color: var(--sx-text-secondary); padding: 11px 9px 5px; }
  .group-title .arrow { margin-left: auto; color: var(--sx-text-hint); }
  .doc-item { display: block; width: 100%; padding: 7px 9px 7px 20px; border: 0; border-radius: 6px; background: transparent; color: var(--sx-text-secondary); font-size: 11.5px; text-align: left; }
  .doc-item:hover { background: var(--sx-bg-hover); color: var(--sx-text-primary); }
  .doc-item.active { background: var(--sx-brand-soft); color: var(--sx-brand); font-weight: 600; }
  .doc-item.child { padding-left: 30px; border-left: 2px solid transparent; border-radius: 0 6px 6px 0; }
  .doc-item.child.active { border-left-color: var(--sx-brand); }
  .side-cta { margin-top: 16px; padding: 11px; border-radius: 7px; background: var(--sx-brand-soft); border: 1px solid var(--sx-border); display: flex; align-items: center; gap: 8px; cursor: pointer; }
  .side-cta .ic { color: var(--sx-brand); }
  .side-cta .t { font-size: 11.5px; font-weight: 600; color: var(--sx-brand); }
  .side-cta .d { font-size: 9.5px; color: var(--sx-text-hint); margin-top: 2px; }

  .main { flex: 1; min-width: 0; padding: 16px 20px; overflow-y: auto; }
  .crumb { display: flex; align-items: center; gap: 6px; font-size: 10.5px; color: var(--sx-text-hint); margin-bottom: 12px; }
  .content-grid { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 14px; align-items: start; }
  .doc-main { min-width: 0; }
  .doc-head { display: flex; align-items: flex-start; gap: 11px; margin-bottom: 13px; }
  .head-icon { width: 44px; height: 44px; border-radius: 10px; background: var(--sx-brand); color: #fff; display: inline-flex; align-items: center; justify-content: center; flex: none; }
  .doc-head h2 { margin: 0 0 5px; font-size: 20px; }
  .doc-head p { margin: 0; font-size: 12px; color: var(--sx-text-hint); }
  .notice { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 7px; background: var(--sx-brand-soft); color: var(--sx-text-secondary); font-size: 11.5px; margin-bottom: 18px; }
  .notice .ic { color: var(--sx-brand); flex: none; }
  .sec { margin-bottom: 22px; }
  .sec-title { display: flex; align-items: center; gap: 9px; font-size: 14.5px; font-weight: 700; margin-bottom: 7px; }
  .sec-num { width: 22px; height: 22px; border-radius: 50%; background: var(--sx-brand); color: #fff; font-size: 11px; display: inline-flex; align-items: center; justify-content: center; flex: none; }
  .sec-desc { font-size: 11.5px; color: var(--sx-text-hint); margin: 0 0 11px 31px; }
  .intro-tabs { display: flex; gap: 20px; border-bottom: 1px solid var(--sx-border); margin: 0 0 11px 31px; }
  .intro-tab { height: 32px; padding: 0 2px; border: 0; border-bottom: 2px solid transparent; background: transparent; color: var(--sx-text-secondary); font-size: 12px; }
  .intro-tab.active { color: var(--sx-brand); border-bottom-color: var(--sx-brand); font-weight: 600; }
  .code-card { margin-left: 31px; position: relative; border: 1px solid var(--sx-border); border-radius: 7px; background: var(--sx-bg-app); overflow: hidden; }
  .code-card .copy { position: absolute; top: 8px; right: 8px; z-index: 2; height: 25px; padding: 0 8px; border: 1px solid var(--sx-border); border-radius: 5px; background: var(--sx-bg-surface); color: var(--sx-text-secondary); font-size: 10px; display: inline-flex; align-items: center; gap: 4px; cursor: pointer; }
  .code-card .copy:hover { border-color: var(--sx-brand); color: var(--sx-brand); }
  .code-lines { padding: 10px 0; overflow-x: auto; }
  .code-line { display: flex; font: 10.8px/1.85 'SF Mono', Menlo, Consolas, monospace; white-space: pre; padding: 0 12px; }
  .code-line:hover { background: var(--sx-bg-hover); }
  .code-line .ln { width: 24px; flex: none; text-align: right; padding-right: 12px; color: var(--sx-text-hint); user-select: none; }
  /* token 着色由 Lit 模板逐段渲染（安全：不做 innerHTML 二次解析） */
  .t-com { color: #64748b; }
  .t-str { color: #16a34a; }
  .t-kw { color: #9333ea; }
  .t-tag { color: #2563eb; }
  .t-num { color: #ea580c; }
  .t-attr { color: #0891b2; }

  .opt-table { width: calc(100% - 31px); margin-left: 31px; border-collapse: collapse; font-size: 11px; }
  .opt-table th, .opt-table td { border: 1px solid var(--sx-border); padding: 8px 10px; text-align: left; }
  .opt-table th { background: var(--sx-bg-app); color: var(--sx-text-secondary); font-weight: 600; }
  .opt-table td code { color: var(--sx-brand); font-family: 'SF Mono', Menlo, monospace; }
  .opt-table td.def { color: var(--sx-text-hint); }
  .points { margin: 0 0 11px 31px; padding-left: 18px; font-size: 11.5px; line-height: 1.9; color: var(--sx-text-secondary); }

  /* 右侧 */
  .side-col { display: flex; flex-direction: column; gap: 13px; }
  .panel { background: var(--sx-bg-surface); border: 1px solid var(--sx-border); border-radius: 8px; overflow: hidden; }
  .panel-head { display: flex; align-items: center; gap: 8px; padding: 11px 13px; border-bottom: 1px solid var(--sx-border); font-size: 12.5px; font-weight: 600; }
  .panel-head .link { margin-left: auto; font-size: 10px; color: var(--sx-brand); background: transparent; border: 0; display: inline-flex; align-items: center; gap: 4px; }
  .mini-toolbar { display: flex; align-items: center; gap: 4px; padding: 6px 8px; background: var(--sx-bg-app); font-size: 10px; color: var(--sx-text-secondary); overflow-x: auto; scrollbar-width: none; }
  .mini-toolbar::-webkit-scrollbar { display: none; }
  .mini-btn { min-width: 20px; height: 21px; display: inline-flex; align-items: center; justify-content: center; border: 0; border-radius: 4px; background: transparent; color: var(--sx-text-secondary); }
  .mini-btn:hover { color: var(--sx-brand); }
  .demo-table { width: 100%; border-collapse: collapse; font-size: 10.5px; table-layout: fixed; }
  .demo-table th, .demo-table td { border-bottom: 1px solid var(--sx-border); border-right: 1px solid var(--sx-border); padding: 6px 7px; text-align: left; }
  .demo-table th { background: var(--sx-brand); color: #fff; font-weight: 600; }
  .demo-table tr.total td { background: var(--sx-brand-soft); font-weight: 700; }
  .col-head { display: flex; background: var(--sx-bg-app); border-bottom: 1px solid var(--sx-border); font-size: 9.5px; color: var(--sx-text-hint); }
  .col-head span { flex: 1; text-align: center; padding: 3px 0; border-right: 1px solid var(--sx-border); }
  .col-head span:first-child { flex: 0 0 30px; background: var(--sx-bg-hover); }
  .resource-card { padding: 12px; border-radius: 8px; background: var(--sx-success-soft); border: 1px solid var(--sx-border); display: flex; align-items: center; gap: 9px; }
  .resource-card .ic { color: var(--sx-success); flex: none; }
  .resource-card .t { font-size: 12px; font-weight: 600; }
  .resource-card .d { font-size: 10.5px; color: var(--sx-text-secondary); margin-top: 3px; line-height: 1.5; }
  .resource-card .arrow { margin-left: auto; color: var(--sx-success); }

  @media (max-width: 1200px) {
    .content-grid { grid-template-columns: 1fr; }
    .side-col { flex-direction: row; flex-wrap: wrap; }
    .side-col > * { flex: 1; min-width: 260px; }
  }
  @media (max-width: 860px) {
    .sidebar { width: 100%; flex-basis: auto; flex-direction: row; flex-wrap: wrap; gap: 2px; }
    .side-title, .group-title, .side-cta { display: none; }
    .doc-item { width: auto; }
    .code-card, .sec-desc, .intro-tabs, .points, .opt-table { margin-left: 0; }
    .opt-table { width: 100%; }
  }
`
