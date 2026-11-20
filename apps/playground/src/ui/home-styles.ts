/**
 * SheetX 首页 · 设计稿导航中心 — 样式
 *
 * 风格约束：无 glow / shadow，简洁清爽；卡片 hover 仅用边框高亮 + 轻微位移。
 */
import { css } from 'lit'

export const homeStyles = css`
  :host {
    display: block;
    height: 100%;
    background: var(--sx-bg-app);
    color: var(--sx-text-primary);
    font-family: 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif;
    font-size: 14px;
  }

  .home { height: 100%; overflow-y: auto; }

  /* ============ 顶部导航 ============ */
  .home-topbar {
    position: sticky; top: 0; z-index: 20;
    height: 54px;
    display: flex; align-items: center; gap: 12px;
    padding: 0 28px;
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(6px);
    border-bottom: 1px solid var(--sx-border);
  }
  .home-topbar .brand { display: flex; align-items: center; }
  .home-topbar .divider { width: 1px; height: 20px; background: var(--sx-border); }
  .home-topbar .crumb { font-size: 14px; font-weight: 600; color: var(--sx-text-primary); }
  .home-topbar .right { margin-left: auto; display: flex; align-items: center; gap: 10px; }
  .ver-chip {
    font-size: 11.5px; color: var(--sx-text-secondary);
    border: 1px solid var(--sx-border-input);
    border-radius: 999px; padding: 3px 10px;
    background: var(--sx-bg-surface);
  }
  .ver-chip b { color: var(--sx-brand); font-weight: 600; }

  /* ============ Hero ============ */
  .hero {
    max-width: 1160px; margin: 0 auto;
    padding: 44px 28px 26px;
    text-align: center;
  }
  .hero-badge {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 12px; color: var(--sx-brand);
    background: var(--sx-bg-active);
    border: 1px solid #cfe2fb;
    padding: 4px 12px; border-radius: 999px;
    font-weight: 600;
  }
  .hero h1 {
    margin: 14px 0 8px;
    font-size: 30px; font-weight: 700; letter-spacing: 0.5px;
    color: var(--sx-text-primary);
  }
  .hero h1 .grad { color: var(--sx-brand); }
  .hero p { margin: 0; font-size: 14px; color: var(--sx-text-secondary); }
  .hero-stats {
    display: flex; justify-content: center; gap: 12px;
    margin-top: 20px; flex-wrap: wrap;
  }
  .stat-chip {
    min-width: 108px;
    background: var(--sx-bg-surface);
    border: 1px solid var(--sx-border);
    border-radius: 10px;
    padding: 8px 14px;
    text-align: center;
  }
  .stat-chip .sv { font-size: 17px; font-weight: 700; color: var(--sx-brand); }
  .stat-chip .sl { font-size: 11.5px; color: var(--sx-text-hint); margin-top: 1px; }

  /* ============ 卡片墙 ============ */
  .grid {
    max-width: 1160px; margin: 0 auto;
    padding: 6px 28px 40px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(252px, 1fr));
    gap: 16px;
  }
  .card {
    display: block;
    background: var(--sx-bg-surface);
    border: 1px solid #e5eaf3;
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    text-decoration: none;
    color: inherit;
    transition: border-color 0.15s ease, transform 0.15s ease;
  }
  .card:hover { border-color: var(--sx-brand); transform: translateY(-2px); }

  .card-preview {
    height: 122px;
    border-bottom: 1px solid var(--sx-border);
    background-image:
      linear-gradient(to right, #f2f5fa 1px, transparent 1px),
      linear-gradient(to bottom, #f2f5fa 1px, transparent 1px);
    background-size: 22px 22px;
    background-color: var(--sx-bg-subtle);
    display: flex; align-items: center; justify-content: center;
    position: relative;
  }
  .card-no-float {
    position: absolute; top: 8px; left: 10px;
    font-size: 11px; font-weight: 700;
    color: var(--sx-text-hint);
    letter-spacing: 0.6px;
  }

  .card-body { padding: 11px 13px 12px; }
  .card-head { display: flex; align-items: center; gap: 8px; }
  .card-icon {
    width: 26px; height: 26px; border-radius: 7px; flex-shrink: 0;
    display: inline-flex; align-items: center; justify-content: center;
    color: #fff;
  }
  .card-title { font-size: 14px; font-weight: 700; }
  .card-arrow {
    margin-left: auto; color: var(--sx-text-hint);
    display: inline-flex; transition: transform 0.15s ease, color 0.15s ease;
  }
  .card:hover .card-arrow { color: var(--sx-brand); transform: translateX(2px); }
  .card-desc {
    margin: 7px 0 9px;
    font-size: 12px; line-height: 1.6; color: var(--sx-text-secondary);
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: 38px;
  }
  .card-tags { display: flex; gap: 6px; flex-wrap: wrap; }
  .tag {
    font-size: 10.5px; color: var(--sx-text-secondary);
    background: #f3f5f9;
    border-radius: 5px; padding: 2px 7px;
    white-space: nowrap;
  }

  /* ============ 页脚 ============ */
  .home-foot {
    max-width: 1160px; margin: 0 auto;
    padding: 0 28px 34px;
    display: flex; align-items: center; gap: 8px;
    font-size: 12px; color: var(--sx-text-hint);
  }
  .home-foot code {
    background: var(--sx-bg-subtle); border-radius: 5px; padding: 1px 7px;
    font-family: 'SF Mono', Menlo, monospace; font-size: 11.5px;
    color: var(--sx-text-secondary);
  }

  /* =====================================================
   * Mock 缩略图（mini window）
   * ===================================================== */
  .mwin {
    width: 82%; max-width: 208px;
    background: var(--sx-bg-surface);
    border: 1px solid var(--sx-border);
    border-radius: 8px;
    overflow: hidden;
    display: flex; flex-direction: column;
  }
  .mchrome {
    height: 15px; flex-shrink: 0;
    display: flex; align-items: center; gap: 3px;
    padding: 0 7px;
    border-bottom: 1px solid var(--sx-border);
    background: #fafbfd;
  }
  .mchrome i { width: 4.5px; height: 4.5px; border-radius: 50%; background: #dbe2ec; }
  .mbody { padding: 6px; display: flex; flex-direction: column; gap: 4px; position: relative; min-height: 0; }
  .mrow { display: flex; gap: 3px; align-items: center; }
  .mcell { height: 8px; border-radius: 2px; background: var(--sx-bg-subtle); flex-shrink: 0; }
  .mcell.thin { height: 6px; }
  .mcell.hd { background: #3b82f6; }
  .mcell.hdl { background: #93c5fd; }
  .mpill { height: 6px; border-radius: 999px; flex-shrink: 0; }
  .mdot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

  .mtoolbar { display: flex; gap: 3px; align-items: center; }
  .mtool { width: 10px; height: 8px; border-radius: 2px; background: #e6ebf3; flex-shrink: 0; }
  .mtool.wide { width: 22px; }
  .mtabs { display: flex; gap: 3px; margin-top: 1px; }
  .mtab { height: 7px; border-radius: 3px 3px 0 0; background: var(--sx-bg-subtle); }
  .mtab.on { background: #3b82f6; }

  .mmenu {
    position: absolute; z-index: 3;
    background: var(--sx-bg-surface);
    border: 1px solid var(--sx-border);
    border-radius: 6px;
    padding: 4px;
    display: flex; flex-direction: column; gap: 3px;
  }
  .mmenu .mi { display: flex; align-items: center; gap: 4px; }
  .mmenu .mi i { width: 6px; height: 6px; border-radius: 2px; flex-shrink: 0; }
  .mmenu .mi span { height: 5px; border-radius: 2px; background: var(--sx-bg-subtle); display: block; }

  .mpanel {
    position: absolute; top: 0; right: 0; bottom: 0;
    width: 34%;
    background: var(--sx-bg-subtle);
    border-left: 1px solid var(--sx-border);
    padding: 5px;
    display: flex; flex-direction: column; gap: 4px;
  }
  .mchip {
    height: 9px; border-radius: 3px;
    background: var(--sx-bg-active); border: 1px solid #cfe2fb;
  }

  .mbar-row { display: flex; align-items: flex-end; gap: 4px; }
  .mbar { width: 9px; border-radius: 2px 2px 0 0; }

  .mupload {
    border: 1.5px dashed #c7d7f0;
    border-radius: 6px;
    background: #f8fbff;
    display: flex; align-items: center; justify-content: center;
    color: #8fb6ee;
  }

  .mfx {
    display: flex; align-items: center; gap: 4px;
    background: var(--sx-bg-surface); border: 1px solid var(--sx-border); border-radius: 4px;
    padding: 2px 5px;
    font-size: 7px; color: var(--sx-text-secondary); font-style: italic;
  }
  .mfx b { color: #3b82f6; font-style: normal; font-family: 'SF Mono', Menlo, monospace; font-size: 7px; }

  .mcomment {
    display: flex; gap: 4px; align-items: flex-start;
    background: var(--sx-bg-surface); border: 1px solid var(--sx-border); border-radius: 6px;
    padding: 4px 5px;
  }
  .mavatar { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }

  .mdialog {
    background: var(--sx-bg-surface); border: 1px solid #f3c8c8; border-radius: 7px;
    padding: 5px 7px;
    display: flex; flex-direction: column; align-items: center; gap: 3px;
  }
  .mdialog .dbtn { height: 6px; width: 26px; border-radius: 3px; background: #3b82f6; }

  .mscroll {
    position: absolute; top: 4px; right: 3px; bottom: 4px; width: 4px;
    background: var(--sx-bg-subtle); border-radius: 2px;
  }
  .mscroll i { display: block; width: 100%; border-radius: 2px; background: #c3cede; }

  .mswatch-row { display: flex; gap: 4px; }
  .mswatch { width: 12px; height: 12px; border-radius: 4px; }
  .mtoggle {
    width: 18px; height: 10px; border-radius: 999px;
    background: #3b82f6; position: relative; flex-shrink: 0;
  }
  .mtoggle::after {
    content: ''; position: absolute; top: 1.5px; right: 1.5px;
    width: 7px; height: 7px; border-radius: 50%; background: var(--sx-bg-surface);
  }
  .mtoggle.off { background: #d5dce8; }
  .mtoggle.off::after { right: auto; left: 1.5px; }

  .mtheme-cards { display: flex; gap: 4px; }
  .mtheme {
    flex: 1; height: 30px; border-radius: 5px;
    border: 1.5px solid var(--sx-border); background: var(--sx-bg-surface);
    position: relative; overflow: hidden;
  }
  .mtheme.on { border-color: #3b82f6; }
  .mtheme.dark { background: #2a2e3a; }
  .mtheme.half { background: linear-gradient(135deg, #fff 50%, #2a2e3a 50%); }
  .mtheme i {
    position: absolute; left: 4px; bottom: 4px;
    width: 55%; height: 4px; border-radius: 2px; background: #dbe2ec;
  }
  .mtheme.dark i { background: #454b5c; }

  .mcode {
    font-family: 'SF Mono', Menlo, monospace;
    font-size: 8px; line-height: 1.5;
    color: var(--sx-text-secondary);
  }
  .mcode b { color: #22c55e; font-weight: 600; }
  .mcode em { color: #3b82f6; font-style: normal; }

  /* ============ 顶栏搜索 ============ */
  .home-search {
    display: flex; align-items: center; gap: 6px;
    height: 30px; padding: 0 10px; min-width: 220px;
    border: 1px solid var(--sx-border); border-radius: 7px;
    background: var(--sx-bg-surface); color: var(--sx-text-hint);
  }
  .home-search:focus-within { border-color: var(--sx-brand); }
  .home-search input {
    flex: 1; min-width: 0; border: 0; outline: 0; background: transparent;
    font: inherit; font-size: 12.5px; color: var(--sx-text-primary);
  }
  .home-search .search-clear {
    display: inline-flex; align-items: center; justify-content: center;
    width: 18px; height: 18px; padding: 0; border: 0; border-radius: 4px;
    background: var(--sx-bg-subtle); color: var(--sx-text-secondary); cursor: pointer;
  }
  .home-search .search-clear:hover { background: var(--sx-bg-hover); }

  /* ============ 最近访问 ============ */
  .recentbar {
    display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
    max-width: 1160px; margin: -4px auto 14px; padding: 0 28px;
    font-size: 12px; color: var(--sx-text-hint);
  }
  .recent-chip {
    display: inline-flex; align-items: center; gap: 6px;
    height: 26px; padding: 0 10px; border-radius: 999px;
    border: 1px solid var(--sx-border); background: var(--sx-bg-surface);
    color: var(--sx-text-secondary); font-size: 12px; text-decoration: none;
    cursor: pointer; transition: border-color .14s ease, color .14s ease;
  }
  .recent-chip:hover { border-color: var(--sx-brand); color: var(--sx-brand); }
  .recent-chip .no { font-size: 10px; color: var(--sx-text-hint); }

  /* ============ 首页实时业务数据（全局 store） ============ */
  .live-stats {
    display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
    margin-top: 14px; font-size: 12px;
  }
  .live-label { color: var(--sx-text-hint); margin-right: 2px; }
  .live-chip {
    display: inline-flex; align-items: center; gap: 4px;
    height: 24px; padding: 0 9px; border-radius: 999px;
    border: 1px solid var(--sx-border); background: var(--sx-bg-surface);
    color: var(--sx-text-secondary);
  }
  .live-chip b { color: var(--sx-text-primary); font-weight: 600; font-variant-numeric: tabular-nums; }
  .live-chip.warn { border-color: #f0c88a; background: #fff8ec; color: #a5670a; }
  html[data-theme='dark'] .live-chip.warn { border-color: #4a3a1a; background: #2a2418; color: #e8c07a; }

  /* ============ 搜索空态 ============ */
  .empty-state {
    grid-column: 1 / -1;
    padding: 56px 20px; text-align: center;
    color: var(--sx-text-secondary); font-size: 13px;
  }
  .empty-state .es-title { font-size: 15px; color: var(--sx-text-primary); margin-bottom: 6px; }
  .empty-state .es-hint { color: var(--sx-text-hint); font-size: 12px; }
`
