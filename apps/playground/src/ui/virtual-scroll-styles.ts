/**
 * SheetX 第 41 张 · 虚拟滚动与百万级数据性能 — 样式
 * 顶部导航 / 4指标卡 / 虚拟滚动演示 / 工作原理 / 底部四卡。
 */
import { css } from 'lit'

export const virtualScrollStyles = css`
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
  .menu-item:hover { background: var(--sx-bg-hover); }
  .menu-item.active { color: var(--sx-brand); font-weight: 700; }
  .search-box { margin-left: auto; display: flex; align-items: center; gap: 6px; height: 30px; padding: 0 10px; border: 1px solid var(--sx-border); border-radius: 6px; color: var(--sx-text-hint); font-size: 11.5px; min-width: 140px; }
  .search-box input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--sx-text-primary); font: inherit; }
  .icon-btn { width: 30px; height: 30px; border: 0; border-radius: 6px; background: transparent; color: var(--sx-text-secondary); display: inline-flex; align-items: center; justify-content: center; }
  .icon-btn:hover { background: var(--sx-bg-hover); }
  .avatar { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--sx-text-secondary); }
  .avatar .face { width: 27px; height: 27px; border-radius: 50%; background: var(--sx-brand); color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; }

  /* 标题 + 指标卡 */
  .hero-row { padding: 16px 18px 12px; display: flex; gap: 14px; align-items: center; }
  .hero { display: flex; gap: 11px; align-items: flex-start; }
  .hero-ico { width: 44px; height: 44px; flex: none; border-radius: 10px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: #fff; display: inline-flex; align-items: center; justify-content: center; }
  .hero h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -.4px; }
  .hero p { margin: 5px 0 0; font-size: 11.5px; color: var(--sx-text-secondary); }
  .hero-metrics { margin-left: auto; display: flex; gap: 8px; }
  @media (max-width: 1100px) { .hero-row { flex-direction: column; align-items: stretch; } .hero-metrics { margin-left: 0; } }
  .mcard { min-width: 108px; padding: 9px 12px; border: 1px solid var(--sx-border); border-radius: 8px; background: var(--sx-bg-surface); display: flex; align-items: center; gap: 8px; }
  .mcard .mi { width: 28px; height: 28px; flex: none; border-radius: 7px; display: inline-flex; align-items: center; justify-content: center; color: var(--mc); background: color-mix(in srgb, var(--mc) 12%, transparent); }
  .mcard .mv { font-size: 14px; font-weight: 800; color: var(--mc); }
  .mcard .ml { font-size: 9px; color: var(--sx-text-hint); margin-top: 1px; }

  /* 主体两栏 */
  .shell { flex: 1; display: grid; grid-template-columns: minmax(0, 1fr) 268px; gap: 14px; padding: 0 18px; align-items: start; }
  @media (max-width: 1040px) { .shell { grid-template-columns: 1fr; } }

  /* 虚拟滚动演示窗口 */
  .demo { border: 1px solid var(--sx-border); border-radius: 9px; overflow: hidden; background: var(--sx-bg-surface); }
  .demo-head { height: 36px; display: flex; align-items: center; gap: 8px; padding: 0 12px; color: #fff; background: linear-gradient(90deg, #2563eb, #4f7cff); font-size: 12px; font-weight: 700; }
  .demo-head .stat { margin-left: auto; font-size: 9.5px; font-weight: 400; opacity: .95; }
  .table-wrap { position: relative; }
  .thead { display: flex; background: var(--sx-bg-hover); border-bottom: 1px solid var(--sx-border); position: sticky; top: 0; z-index: 3; }
  .thead .th { flex: none; padding: 6px 6px; font-size: 9.5px; font-weight: 600; color: var(--sx-text-secondary); border-right: 1px solid var(--sx-border); overflow: hidden; white-space: nowrap; }
  .vscroll { height: 286px; overflow-y: auto; overflow-x: auto; position: relative; }
  .vspacer { position: relative; width: 100%; }
  .vrow { position: absolute; left: 0; right: 0; display: flex; border-bottom: 1px solid var(--sx-border); font-size: 9.5px; align-items: center; }
  .vrow:hover { background: var(--sx-bg-hover); }
  .vrow .td { flex: none; padding: 5px 6px; border-right: 1px solid var(--sx-border); overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
  .vrow .td.num { font-variant-numeric: tabular-nums; }
  .vrow .td.cb { display: inline-flex; align-items: center; }
  .vrow .cbx { width: 12px; height: 12px; accent-color: var(--sx-brand); }
  .status-tag { display: inline-block; padding: 1px 6px; border-radius: 8px; font-size: 8.5px; }
  .status-on { background: #e7f7ed; color: #16a34a; }
  .status-trial { background: #fdf3e2; color: #d97706; }
  .status-off { background: #fdeaea; color: #dc2626; }
  .demo-foot { height: 30px; display: flex; align-items: center; gap: 8px; padding: 0 10px; border-top: 1px solid var(--sx-border); font-size: 9.5px; color: var(--sx-text-hint); }
  .demo-foot .range { margin-left: auto; color: var(--sx-brand); font-weight: 600; }
  .hint-bubble { position: absolute; right: 12px; top: 44px; z-index: 8; padding: 7px 10px; border-radius: 7px; background: var(--sx-brand); color: #fff; font-size: 9.5px; line-height: 1.5; box-shadow: 0 3px 10px rgba(37,99,235,.28); }
  .hint-bubble .t { font-weight: 700; }
  .btn-mini { height: 22px; padding: 0 8px; border: 1px solid var(--sx-border); border-radius: 4px; background: var(--sx-bg-surface); color: var(--sx-text-secondary); font-size: 9px; }
  .btn-mini:hover { border-color: var(--sx-brand); color: var(--sx-brand); }

  /* 右侧工作原理 */
  .principle { border: 1px solid var(--sx-border); border-radius: 9px; background: var(--sx-bg-surface); overflow: hidden; }
  .principle-head { height: 34px; display: flex; align-items: center; gap: 6px; padding: 0 12px; font-size: 12px; font-weight: 700; background: var(--sx-brand-soft); color: var(--sx-brand); }
  .psteps { padding: 10px; display: flex; flex-direction: column; }
  .pstep { display: flex; gap: 9px; align-items: center; padding: 8px 9px; border: 1px solid var(--sx-border); border-radius: 7px; background: var(--sx-bg-surface); }
  .pstep .pi { width: 26px; height: 26px; flex: none; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; color: var(--pc); background: color-mix(in srgb, var(--pc) 12%, transparent); }
  .pstep .pt { font-size: 10.5px; font-weight: 600; }
  .pstep .pd { font-size: 9px; color: var(--sx-text-hint); margin-top: 2px; }
  .parrow { height: 16px; margin-left: 22px; border-left: 1.5px dashed var(--sx-border); position: relative; }
  .parrow::after { content: ''; position: absolute; bottom: -1px; left: -3px; width: 0; height: 0; border-left: 4px solid transparent; border-right: 4px solid transparent; border-top: 5px solid var(--sx-border); }
  .pfinish { margin-top: 8px; padding: 9px; border-radius: 7px; background: #e7f7ed; color: #059669; font-size: 10px; font-weight: 600; display: flex; align-items: center; gap: 6px; justify-content: center; }

  /* 底部四卡 */
  .bottom-grid { display: grid; grid-template-columns: 1.15fr 1fr .95fr .95fr; gap: 12px; margin: 14px 18px 18px; }
  @media (max-width: 1100px) { .bottom-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  .bcard { border: 1px solid var(--sx-border); border-radius: 8px; padding: 11px 12px; background: var(--sx-bg-surface); min-width: 0; }
  .bcard h4 { margin: 0 0 9px; font-size: 11.5px; display: flex; align-items: center; gap: 6px; color: var(--bc, var(--sx-text-primary)); }
  .bcard ul { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 5px; }
  .bcard li { display: flex; align-items: center; gap: 5px; font-size: 9.5px; color: var(--sx-text-secondary); }
  .bcard li svg { color: var(--bc, var(--sx-brand)); flex: none; }

  /* 性能对比折线图 */
  .chart-legend { display: flex; gap: 12px; font-size: 8.5px; color: var(--sx-text-hint); margin-bottom: 4px; }
  .chart-legend i { display: inline-block; width: 8px; height: 2px; vertical-align: middle; margin-right: 3px; }
  .perf-chart { position: relative; height: 84px; margin-top: 2px; }
  .perf-chart .ylabels { position: absolute; left: 0; top: 0; bottom: 10px; display: flex; flex-direction: column; justify-content: space-between; font-size: 8px; color: var(--sx-text-hint); }
  .perf-chart .plot { position: absolute; left: 20px; right: 4px; top: 0; bottom: 10px; }
  .perf-chart .gline { position: absolute; left: 0; right: 0; height: 1px; background: var(--sx-border); }
  .perf-chart svg { position: absolute; inset: 0; width: 100%; height: 100%; }
  .perf-chart .xlabels { position: absolute; left: 20px; right: 4px; bottom: 0; display: flex; justify-content: space-between; font-size: 8px; color: var(--sx-text-hint); }
  .chart-note { margin-top: 3px; font-size: 8.5px; color: var(--sx-brand); font-weight: 600; text-align: right; }

  /* 性能指标 2×2 */
  .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
  .stat { padding: 8px; border: 1px solid var(--sx-border); border-radius: 6px; }
  .stat .sv { font-size: 13px; font-weight: 800; color: var(--sc); display: flex; align-items: center; gap: 4px; }
  .stat .sl { font-size: 8.5px; color: var(--sx-text-hint); margin-top: 3px; }
`
