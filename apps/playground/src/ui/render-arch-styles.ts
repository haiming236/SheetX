/**
 * SheetX 第 40 张 · 技术选型与底层渲染架构 — 样式
 * 顶部导航 / 标题 / 三tab / Canvas+DOM混合表格演示 / 协同机制 / 三tab内容 / 底部四卡。
 */
import { css } from 'lit'

export const renderArchStyles = css`
  :host { display: block; }
  .app {
    display: flex; flex-direction: column; min-height: calc(100vh - 42px);
    background: var(--sx-bg-app); color: var(--sx-text-primary);
    font-family: 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
  }

  /* 顶部导航 */
  .menu-bar { height: 46px; flex: 0 0 46px; display: flex; align-items: center; gap: 14px; padding: 0 16px; background: var(--sx-bg-surface); border-bottom: 1px solid var(--sx-border); }
  .brand { display: flex; align-items: center; }
  .menu-items { display: flex; align-items: center; gap: 2px; }
  .menu-item { height: 30px; padding: 0 11px; border: 0; border-radius: 5px; background: transparent; color: var(--sx-text-secondary); font-size: 12px; }
  .menu-item:hover { background: var(--sx-bg-hover); color: var(--sx-text-primary); }
  .menu-item.active { color: var(--sx-brand); font-weight: 700; }
  .search-box { margin-left: auto; display: flex; align-items: center; gap: 6px; height: 30px; padding: 0 10px; border: 1px solid var(--sx-border); border-radius: 6px; color: var(--sx-text-hint); font-size: 11.5px; min-width: 140px; }
  .search-box input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--sx-text-primary); font: inherit; }
  .icon-btn { width: 30px; height: 30px; border: 0; border-radius: 6px; background: transparent; color: var(--sx-text-secondary); display: inline-flex; align-items: center; justify-content: center; }
  .icon-btn:hover { background: var(--sx-bg-hover); }
  .avatar { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--sx-text-secondary); }
  .avatar .face { width: 27px; height: 27px; border-radius: 50%; background: var(--sx-brand); color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; }

  /* 标题 */
  .hero { padding: 18px 26px 8px; display: flex; gap: 12px; align-items: flex-start; }
  .hero-ico { width: 46px; height: 46px; flex: none; border-radius: 10px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: #fff; display: inline-flex; align-items: center; justify-content: center; }
  .hero h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -.4px; }
  .hero p { margin: 6px 0 0; font-size: 12px; color: var(--sx-text-secondary); }

  /* 三 tab */
  .tabs { display: flex; justify-content: center; gap: 4px; margin: 6px 0 14px; }
  .tab { height: 32px; padding: 0 16px; border: 0; border-radius: 7px 7px 7px 7px; background: transparent; color: var(--sx-text-secondary); font-size: 11.5px; display: inline-flex; align-items: center; gap: 6px; }
  .tab:hover { background: var(--sx-bg-hover); }
  .tab.active { background: var(--sx-brand); color: #fff; font-weight: 600; }

  /* ===== 主体 ===== */
  .shell { flex: 1; display: grid; grid-template-columns: minmax(0, 1fr) 250px; gap: 14px; padding: 0 18px; align-items: start; }
  @media (max-width: 1020px) { .shell { grid-template-columns: 1fr; } }

  /* Canvas + DOM 混合演示窗口 */
  .demo-wrap { position: relative; }
  .window { border: 1px solid var(--sx-border); border-radius: 9px; overflow: hidden; background: var(--sx-bg-surface); }
  .win-bar { height: 30px; display: flex; align-items: center; gap: 6px; padding: 0 10px; background: var(--sx-bg-hover); border-bottom: 1px solid var(--sx-border); }
  .dot { width: 9px; height: 9px; border-radius: 50%; }
  .dot.r { background: #ff5f57; } .dot.y { background: #febc2e; } .dot.g { background: #28c840; }

  /* 工具栏（DOM 层） */
  .sheet-toolbar { height: 30px; display: flex; align-items: center; gap: 5px; padding: 0 8px; border-bottom: 1px solid var(--sx-border); background: var(--sx-bg-surface); }
  .addr { min-width: 48px; height: 22px; padding: 0 6px; border: 1px solid var(--sx-border); border-radius: 4px; font-size: 10px; display: inline-flex; align-items: center; justify-content: space-between; gap: 3px; }
  .fx { color: var(--sx-text-hint); font-size: 10px; font-style: italic; padding: 0 2px; }
  .formula { flex: 1; min-width: 0; height: 22px; display: flex; align-items: center; font-size: 10.5px; padding: 0 6px; color: var(--sx-text-secondary); }
  .tbtn { width: 22px; height: 22px; border: 0; border-radius: 4px; background: transparent; color: var(--sx-text-secondary); display: inline-flex; align-items: center; justify-content: center; }
  .tbtn:hover { background: var(--sx-bg-hover); }

  /* 表格：底层 canvas + 上层 DOM 浮层 */
  .sheet-stage { position: relative; height: 250px; }
  .sheet-canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
  .dom-layer { position: absolute; inset: 0; pointer-events: none; }
  .dom-layer > * { pointer-events: auto; }
  .dropdown {
    position: absolute; width: 132px; border: 1px solid var(--sx-brand); border-radius: 5px;
    background: var(--sx-bg-surface); box-shadow: 0 4px 14px rgba(0,0,0,.12); z-index: 5; overflow: hidden;
  }
  .dropdown .opt { height: 27px; display: flex; align-items: center; gap: 6px; padding: 0 9px; font-size: 10.5px; cursor: pointer; }
  .dropdown .opt:hover { background: var(--sx-bg-hover); }
  .dropdown .opt.sel { background: var(--sx-brand-soft); color: var(--sx-brand); font-weight: 600; }
  .dropdown .opt svg { color: var(--sx-brand); }
  .cell-marker { position: absolute; border: 2px solid var(--sx-brand); border-radius: 2px; pointer-events: none; z-index: 3; }

  /* 区域标注气泡 */
  .callout { position: absolute; z-index: 8; padding: 7px 10px; border: 1px solid var(--sx-border); border-radius: 7px; background: var(--sx-bg-surface); font-size: 10px; box-shadow: 0 3px 12px rgba(0,0,0,.1); }
  .callout .ct { font-weight: 700; }
  .callout .cd { color: var(--sx-text-hint); margin-top: 2px; }
  .callout.canvas { left: -6px; top: 118px; border-left: 3px solid #2563eb; }
  .callout.dom { right: 4px; top: 8px; border-left: 3px solid #7c3aed; }
  .callout::after { content: ''; position: absolute; width: 1.5px; height: 26px; background: var(--sx-brand); }
  .callout.canvas::after { right: -14px; top: 50%; transform: rotate(-42deg); transform-origin: top; }
  .callout.dom::after { left: 46px; bottom: -26px; background: #7c3aed; }

  /* 协同机制卡 */
  .side-card { border: 1px solid var(--sx-border); border-radius: 9px; overflow: hidden; background: var(--sx-bg-surface); }
  .side-head { height: 34px; display: flex; align-items: center; gap: 6px; padding: 0 12px; font-size: 12px; font-weight: 700; background: var(--sx-brand-soft); color: var(--sx-brand); }
  .syn-list { padding: 9px; display: flex; flex-direction: column; gap: 7px; }
  .syn { display: flex; gap: 9px; align-items: flex-start; padding: 8px; border: 1px solid var(--sx-border); border-radius: 7px; }
  .syn .sn { width: 20px; height: 20px; flex: none; border-radius: 50%; background: var(--sx-brand); color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; }
  .syn .si { width: 22px; height: 22px; flex: none; border-radius: 5px; background: var(--sx-brand-soft); color: var(--sx-brand); display: inline-flex; align-items: center; justify-content: center; }
  .syn .st { font-size: 10.5px; font-weight: 600; }
  .syn .sd { font-size: 9.5px; color: var(--sx-text-hint); margin-top: 3px; line-height: 1.4; }

  /* 渲染流程 tab */
  .flow { display: grid; grid-template-columns: minmax(0, 1fr) 56px minmax(0, 1fr); gap: 10px; align-items: center; }
  .flow-col { display: flex; flex-direction: column; gap: 9px; }
  .flow-col h3 { margin: 0 0 2px; font-size: 12px; display: flex; align-items: center; gap: 6px; }
  .flow-col.main h3 { color: #2563eb; }
  .flow-col.worker h3 { color: #059669; }
  .flow-step { display: flex; gap: 9px; align-items: center; padding: 10px 11px; border: 1px solid var(--sx-border); border-radius: 7px; background: var(--sx-bg-surface); }
  .flow-step:hover { border-color: var(--fc); }
  .flow-step .fi { width: 30px; height: 30px; flex: none; border-radius: 7px; display: inline-flex; align-items: center; justify-content: center; color: #fff; }
  .flow-step.main .fi { background: #2563eb; }
  .flow-step.worker .fi { background: #059669; }
  .flow-step .ft { font-size: 11px; font-weight: 600; }
  .flow-step .fd { font-size: 9.5px; color: var(--sx-text-hint); margin-top: 2px; }
  .flow-step .tag { margin-left: auto; font-size: 8.5px; padding: 2px 6px; border-radius: 8px; background: var(--sx-bg-hover); color: var(--sx-text-hint); white-space: nowrap; }
  .flow-mid { text-align: center; color: var(--sx-text-hint); font-size: 10px; }
  .flow-mid .chan { writing-mode: vertical-rl; letter-spacing: 2px; margin: 6px auto; font-size: 9px; }
  .flow-note { margin-top: 12px; padding: 9px 12px; border: 1px solid var(--sx-border); border-radius: 7px; background: var(--sx-bg-hover); font-size: 10px; color: var(--sx-text-secondary); line-height: 1.6; }

  /* 关键技术点 tab */
  .tech-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .tech-card { display: flex; gap: 10px; align-items: flex-start; padding: 12px; border: 1px solid var(--sx-border); border-radius: 8px; background: var(--sx-bg-surface); cursor: pointer; }
  .tech-card:hover { border-color: var(--tc); transform: translateY(-1px); }
  .tech-card .ti { width: 34px; height: 34px; flex: none; border-radius: 8px; color: #fff; display: inline-flex; align-items: center; justify-content: center; }
  .tech-card .tn { font-size: 12px; font-weight: 700; }
  .tech-card .tc { font-size: 9.5px; color: var(--tc); margin: 2px 0 4px; }
  .tech-card .td { font-size: 10px; color: var(--sx-text-secondary); line-height: 1.5; }
  .tech-card .layer-tag { margin-left: auto; font-size: 8.5px; padding: 2px 6px; border-radius: 8px; color: #fff; background: var(--lc); white-space: nowrap; }
  .tech-summary { margin-bottom: 12px; padding: 10px 12px; border: 1px solid var(--sx-border); border-radius: 8px; background: var(--sx-bg-hover); font-size: 10.5px; color: var(--sx-text-secondary); line-height: 1.6; }

  /* 底部四卡 */
  .bottom-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin: 14px 18px 18px; }
  @media (max-width: 1100px) { .bottom-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  .bcard { border: 1px solid var(--sx-border); border-top: 3px solid var(--bc); border-radius: 8px; padding: 11px 12px; background: var(--sx-bg-surface); }
  .bcard h4 { margin: 0 0 8px; font-size: 11.5px; display: flex; align-items: center; gap: 6px; color: var(--bc); }
  .bcard ul { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 5px; }
  .bcard li { display: flex; align-items: center; gap: 5px; font-size: 9.5px; color: var(--sx-text-secondary); }
  .bcard li svg { color: var(--bc); flex: none; }
  .fps { display: flex; align-items: center; gap: 9px; margin-top: 8px; }
  .fps .num { font-size: 19px; font-weight: 800; color: var(--bc); }
  .fps .unit { font-size: 9px; color: var(--sx-text-hint); }
  .mini-bars { display: flex; align-items: flex-end; gap: 3px; height: 34px; margin-top: 8px; }
  .mini-bars i { width: 9px; background: var(--bc); border-radius: 2px 2px 0 0; opacity: .82; }
`
