/**
 * SheetX 第 39 张 · 核心引擎架构可视化 — 样式
 * 顶部导航 / 左侧产品特性 / 中间 3×3 模块架构图 / 右侧扩展生态 / 底部应用支持。
 */
import { css } from 'lit'

export const engineArchStyles = css`
  :host { display: block; }
  .app {
    display: flex; flex-direction: column; min-height: calc(100vh - 42px);
    background: var(--sx-bg-app); color: var(--sx-text-primary);
    font-family: 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
  }

  /* ===== 顶部导航 ===== */
  .menu-bar { height: 48px; flex: 0 0 48px; display: flex; align-items: center; gap: 16px; padding: 0 18px; background: var(--sx-bg-surface); border-bottom: 1px solid var(--sx-border); }
  .brand { display: flex; align-items: center; }
  .menu-items { display: flex; align-items: center; gap: 2px; }
  .menu-item { height: 32px; padding: 0 12px; border: 0; border-radius: 5px; background: transparent; color: var(--sx-text-secondary); font-size: 12px; }
  .menu-item:hover { background: var(--sx-bg-hover); color: var(--sx-text-primary); }
  .menu-item.active { color: var(--sx-brand); font-weight: 700; background: var(--sx-brand-soft); }
  .search-box { margin-left: auto; display: flex; align-items: center; gap: 6px; height: 30px; padding: 0 10px; border: 1px solid var(--sx-border); border-radius: 6px; color: var(--sx-text-hint); font-size: 11.5px; min-width: 150px; }
  .search-box input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--sx-text-primary); font: inherit; }
  .icon-btn { width: 30px; height: 30px; border: 0; border-radius: 6px; background: transparent; color: var(--sx-text-secondary); display: inline-flex; align-items: center; justify-content: center; }
  .icon-btn:hover { background: var(--sx-bg-hover); }
  .avatar { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--sx-text-secondary); }
  .avatar .face { width: 27px; height: 27px; border-radius: 50%; background: var(--sx-brand); color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; }

  /* ===== 标题 ===== */
  .hero { padding: 20px 26px 14px; }
  .hero h1 { margin: 0; font-size: 25px; font-weight: 800; letter-spacing: -.4px; }
  .hero p { margin: 6px 0 0; font-size: 12px; color: var(--sx-text-secondary); }

  /* ===== 三栏主体 ===== */
  .shell { flex: 1; display: grid; grid-template-columns: 178px minmax(0, 1fr) 158px; gap: 13px; padding: 0 18px 18px; align-items: start; }
  @media (max-width: 1180px) { .shell { grid-template-columns: 1fr; } .side, .eco { display: none; } }

  /* 侧栏卡片 */
  .card { border: 1px solid var(--sx-border); border-radius: 9px; background: var(--sx-bg-surface); overflow: hidden; }
  .card-head { height: 34px; display: flex; align-items: center; gap: 6px; padding: 0 12px; font-size: 12px; font-weight: 700; }
  .card-head.star { background: var(--sx-brand-soft); color: var(--sx-brand); }
  .card-head.eco { background: #e7f7ed; color: #059669; }
  .card-body { padding: 7px 8px; display: flex; flex-direction: column; gap: 2px; }
  .feat { display: flex; gap: 9px; align-items: center; padding: 8px 7px; border-radius: 6px; cursor: pointer; }
  .feat:hover { background: var(--sx-bg-hover); }
  .feat .fi { width: 26px; height: 26px; flex: none; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; }
  .feat .ft { font-size: 11px; font-weight: 600; line-height: 1.3; }
  .feat .fd { font-size: 9.5px; color: var(--sx-text-hint); margin-top: 2px; }

  .eco-item { display: flex; gap: 8px; align-items: center; padding: 8px 7px; border: 1px solid var(--sx-border); border-radius: 7px; background: var(--sx-bg-surface); margin-bottom: 6px; cursor: pointer; }
  .eco-item:hover { border-color: #059669; }
  .eco-item .ei { width: 25px; height: 25px; flex: none; border-radius: 6px; background: #e7f7ed; color: #059669; display: inline-flex; align-items: center; justify-content: center; }
  .eco-item .et { font-size: 10.5px; font-weight: 600; line-height: 1.3; }
  .eco-item .ed { font-size: 9px; color: var(--sx-text-hint); margin-top: 2px; }

  /* ===== 架构图 ===== */
  .arch { border: 1px solid var(--sx-border); border-radius: 10px; overflow: hidden; background: var(--sx-bg-surface); }
  .arch-head { height: 40px; display: flex; align-items: center; justify-content: center; gap: 8px; color: #fff; font-size: 14px; font-weight: 700; background: linear-gradient(90deg, #2563eb, #4f7cff, #2563eb); }
  .arch-grid { padding: 14px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 9px; position: relative; }

  .mod { position: relative; border: 1px solid var(--sx-border); border-radius: 8px; padding: 10px 10px 9px; background: var(--sx-bg-surface); cursor: pointer; transition: transform .12s, border-color .12s; min-height: 92px; }
  .mod:hover { transform: translateY(-2px); border-color: var(--mc); }
  .mod.active { border-color: var(--mc); box-shadow: inset 0 0 0 1px var(--mc); }
  .mod-top { display: flex; align-items: center; gap: 7px; }
  .mod-ico { width: 28px; height: 28px; flex: none; border-radius: 7px; display: inline-flex; align-items: center; justify-content: center; color: #fff; }
  .mod-name { font-size: 12px; font-weight: 700; }
  .mod-en { font-size: 9px; color: var(--sx-text-hint); margin-top: 1px; }
  .mod-points { margin: 8px 0 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 4px; }
  .mod-points li { display: flex; align-items: center; gap: 5px; font-size: 9.5px; color: var(--sx-text-secondary); }
  .mod-points li svg { color: #16a34a; flex: none; }

  /* 中心引擎 */
  .core { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; border: 0; border-radius: 9px; padding: 8px; min-height: 92px; color: #fff; background: linear-gradient(135deg, #2563eb, #4f7cff); text-align: center; }
  .core .ci { width: 34px; height: 34px; border-radius: 9px; background: rgba(255,255,255,.18); display: inline-flex; align-items: center; justify-content: center; }
  .core .ct { font-size: 14px; font-weight: 800; line-height: 1.2; }
  .core .cd { font-size: 9.5px; opacity: .9; margin-top: 3px; }

  /* 连接箭头：绝对定位 div + 品牌色圆底，避开 SVG shadow DOM 渲染问题 */
  .arch-grid .arrow-h, .arch-grid .arrow-v { position: absolute; display: inline-flex; align-items: center; justify-content: center; color: var(--sx-brand); background: var(--sx-brand-soft); border: 1px solid var(--sx-border); border-radius: 50%; font-size: 12px; font-weight: 700; line-height: 1; pointer-events: none; z-index: 2; }
  .arch-grid .arrow-h { width: 18px; height: 18px; transform: translate(-50%, -50%); }
  .arch-grid .arrow-v { width: 18px; height: 18px; transform: translate(-50%, -50%); }
  .arch-grid .arrow-h::before { content: '↔'; }
  .arch-grid .arrow-v::before { content: '↕'; }

  /* 模块详情条 */
  .detail { margin: 0 14px 14px; padding: 11px 12px; border: 1px solid var(--sx-border); border-left: 3px solid var(--dc, var(--sx-brand)); border-radius: 7px; background: var(--sx-bg-hover); }
  .detail h4 { margin: 0 0 5px; font-size: 11.5px; display: flex; align-items: center; gap: 6px; }
  .detail p { margin: 0; font-size: 10px; line-height: 1.6; color: var(--sx-text-secondary); }
  .detail code { display: inline-block; margin-top: 7px; padding: 4px 8px; border-radius: 4px; background: var(--sx-bg-surface); border: 1px solid var(--sx-border); font-size: 9.5px; color: var(--sx-brand); font-family: 'SF Mono', Menlo, Consolas, monospace; }

  /* ===== 底部应用支持 ===== */
  .apps { margin: 0 18px 18px; border: 1px solid var(--sx-border); border-radius: 9px; background: var(--sx-bg-surface); padding: 9px 12px 12px; }
  .apps-title { font-size: 11.5px; font-weight: 700; margin: 0 0 9px; display: flex; align-items: center; gap: 6px; }
  .apps-row { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 8px; }
  @media (max-width: 900px) { .apps-row { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
  .app-item { display: flex; align-items: center; gap: 8px; padding: 9px 10px; border: 1px solid var(--sx-border); border-radius: 7px; cursor: pointer; }
  .app-item:hover { border-color: var(--ac); }
  .app-item .ai { width: 27px; height: 27px; flex: none; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; color: #fff; }
  .app-item .an { font-size: 10.5px; font-weight: 600; }
  .app-item .as { font-size: 9px; color: var(--sx-text-hint); margin-top: 2px; }
`
