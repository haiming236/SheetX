/**
 * SheetX 样式（第 08 张设计稿 · 右键菜单与快捷操作）
 * 复用系列骨架类名与令牌，新增格式工具栏 / 上下文菜单 / 填充子菜单 / 快捷操作卡。
 */
import { css } from 'lit'

export const contextStyles = css`
  :host {
    display: block;
    width: 100%;
    height: 100%;
    background: var(--sx-bg-app);
    overflow: hidden;
  }

  .app {
    display: grid;
    grid-template-rows: 44px 44px 38px 1fr 34px 30px;
    height: 100%;
    min-width: 980px;
  }

  /* ============ 顶部导航 ============ */
  .topbar {
    display: flex;
    align-items: center;
    background: var(--sx-bg-surface);
    border-bottom: 1px solid var(--sx-border);
    padding: 0 14px;
    gap: 22px;
  }
  .brand { flex: none; }
  .nav { display: flex; align-items: stretch; height: 100%; gap: 2px; }
  .nav-item {
    position: relative;
    display: inline-flex;
    align-items: center;
    padding: 0 13px;
    background: transparent;
    border: none;
    color: var(--sx-text-secondary);
    font-size: 13px;
    white-space: nowrap;
  }
  .nav-item:hover { color: var(--sx-text-primary); }
  .nav-item.active { color: var(--sx-brand); font-weight: 500; }
  .nav-item.active::after {
    content: '';
    position: absolute;
    left: 12px;
    right: 12px;
    bottom: 0;
    height: 2px;
    background: var(--sx-brand);
    border-radius: 2px 2px 0 0;
  }
  .topbar-right { margin-left: auto; display: flex; align-items: center; gap: 4px; }
  .icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--sx-text-secondary);
  }
  .icon-btn:hover { background: var(--sx-bg-hover); color: var(--sx-text-primary); }
  .avatar {
    width: 27px;
    height: 27px;
    margin-left: 4px;
    border-radius: 50%;
    background: var(--sx-brand);
    color: #fff;
    font-size: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
  }

  /* ============ 格式工具栏 ============ */
  .toolbar {
    display: flex;
    align-items: center;
    background: var(--sx-bg-surface);
    border-bottom: 1px solid var(--sx-border);
    padding: 0 12px;
    gap: 2px;
    overflow: hidden;
  }
  .tool-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 28px;
    height: 28px;
    border: 1px solid transparent;
    border-radius: 5px;
    background: transparent;
    color: var(--sx-text-secondary);
    flex: none;
    padding: 0 4px;
  }
  .tool-btn:hover { background: var(--sx-bg-hover); color: var(--sx-text-primary); }
  .tool-btn.active { color: var(--sx-brand); }
  .tool-btn:disabled { color: var(--sx-border-strong); cursor: default; }
  .tool-btn:disabled:hover { background: transparent; }
  .tool-btn .caret { color: var(--sx-text-hint); display: inline-flex; margin-left: 1px; }
  .v-sep { width: 1px; height: 18px; background: var(--sx-border); margin: 0 6px; flex: none; }
  /* 字体/字号/数字格式下拉 */
  .font-select {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 28px;
    padding: 0 8px;
    border: 1px solid transparent;
    border-radius: 5px;
    background: transparent;
    color: var(--sx-text-primary);
    font-size: 12px;
    white-space: nowrap;
    flex: none;
  }
  .font-select:hover { background: var(--sx-bg-hover); }
  .font-select .caret { color: var(--sx-text-hint); display: inline-flex; }
  .font-select.wide { min-width: 96px; justify-content: space-between; }
  /* 删除线 / 高亮 文字演示按钮 */
  .text-demo {
    font-size: 14px;
    font-weight: 600;
    line-height: 1;
    color: var(--sx-text-primary);
  }
  .text-demo.strike { position: relative; }
  .text-demo.strike::after {
    content: '';
    position: absolute;
    left: -2px;
    right: -2px;
    top: 50%;
    height: 1.6px;
    background: var(--sx-danger);
    transform: rotate(-14deg);
  }
  .text-demo.hl-mark {
    background: #fde68a;
    border-radius: 2px;
    padding: 1px 3px;
    font-weight: 500;
  }

  /* ============ 公式栏 ============ */
  .formula-bar {
    display: flex;
    align-items: center;
    background: var(--sx-bg-surface);
    border-bottom: 1px solid var(--sx-border);
    padding: 0 10px;
    gap: 0;
  }
  .cell-address {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    width: 88px;
    height: 26px;
    padding: 0 8px;
    border: 1px solid var(--sx-border-input);
    border-radius: 4px 0 0 4px;
    background: var(--sx-bg-surface);
    font-size: 12px;
    font-weight: 500;
    flex: none;
  }
  .cell-address .caret { color: var(--sx-text-hint); display: inline-flex; }
  .fx-box {
    width: 38px;
    height: 26px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--sx-border-input);
    border-left: none;
    border-right: none;
    color: var(--sx-text-secondary);
    font-style: italic;
    font-family: Georgia, serif;
    font-size: 14px;
    flex: none;
  }
  .formula-input {
    flex: 1;
    height: 26px;
    padding: 0 10px;
    border: 1px solid var(--sx-border-input);
    border-radius: 0 4px 4px 0;
    background: var(--sx-bg-surface);
    color: var(--sx-text-primary);
    font-size: 12.5px;
    outline: none;
    display: flex;
    align-items: center;
    white-space: nowrap;
    overflow: hidden;
  }

  /* ============ 主体区 ============ */
  .body {
    display: flex;
    min-height: 0;
    position: relative;
  }
  .grid-area {
    flex: 1;
    min-width: 0;
    overflow: auto;
    background: var(--sx-bg-surface);
    position: relative;
  }

  /* 表格（列宽总和 40+178+178+120+120+130+120+120 = 1006，固定宽度保证菜单定位稳定） */
  .sheet {
    border-collapse: separate;
    border-spacing: 0;
    table-layout: fixed;
    font-size: 12px;
    width: 1006px;
  }
  .sheet th, .sheet td {
    border-right: 1px solid var(--sx-grid-line);
    border-bottom: 1px solid var(--sx-grid-line);
    padding: 0;
    height: 30px;
    text-align: left;
    overflow: hidden;
  }
  .sheet thead th.corner,
  .sheet thead th.col-head {
    background: var(--sx-bg-subtle);
    color: var(--sx-text-hint);
    font-weight: 400;
    text-align: center;
    border-top: 1px solid var(--sx-grid-line);
    position: sticky;
    top: 0;
    z-index: 2;
  }
  .sheet thead th.corner { width: 40px; border-left: 1px solid var(--sx-grid-line); }
  .sheet tbody th.row-head {
    background: var(--sx-bg-subtle);
    color: var(--sx-text-secondary);
    font-weight: 400;
    text-align: center;
    border-left: 1px solid var(--sx-grid-line);
    position: sticky;
    left: 0;
    z-index: 1;
    width: 40px;
  }
  .sheet tbody tr:hover td { background: var(--sx-bg-hover); }
  .sheet td.cell {
    background: var(--sx-bg-surface);
    padding: 0 10px;
    white-space: nowrap;
    text-overflow: ellipsis;
    color: var(--sx-text-primary);
    cursor: cell;
  }
  .sheet td.head-cell {
    background: var(--sx-grid-header-bg);
    color: var(--sx-grid-header-text);
    font-weight: 500;
  }
  /* B 列整列浅蓝高亮（含表头） */
  .sheet td.cell.col-hl { background: var(--sx-row-selected-bg); }
  .sheet tbody tr:hover td.cell.col-hl { background: #dfeaff; }
  .sheet td.head-cell.hl { background: var(--sx-bg-active); color: var(--sx-brand); }
  /* 选中行（第 3 行） */
  .sheet tbody tr.row-active th.row-head,
  .sheet tbody tr.row-active td.cell { background: var(--sx-row-selected-bg); }
  .sheet tbody tr.row-active td.cell.col-hl { background: #dce9fd; }
  .sheet tbody tr.row-active th.row-head { color: var(--sx-brand); font-weight: 500; }
  /* 选中单元格：蓝色描边 + 右下角填充柄 */
  .sheet td.selected {
    position: relative;
    outline: 1.5px solid var(--sx-cell-selected);
    outline-offset: -1.5px;
    z-index: 3;
  }
  .fill-handle {
    position: absolute;
    right: -3.5px;
    bottom: -3.5px;
    width: 7px;
    height: 7px;
    background: var(--sx-cell-selected);
    border: 1.5px solid #ffffff;
    border-radius: 1px;
    z-index: 4;
  }

  /* ============ 右键菜单 ============ */
  .ctx-menu, .fill-submenu {
    position: absolute;
    width: 200px;
    background: var(--sx-bg-surface);
    border: 1px solid var(--sx-border-strong);
    border-radius: 8px;
    padding: 4px;
    z-index: 30;
  }
  .fill-submenu { width: 198px; z-index: 31; }
  /* 子菜单更紧凑（设计稿子菜单项高小于主菜单），保证 7 项在视口内完整展开 */
  .fill-submenu .mi { height: 24px; font-size: 12px; }
  .mi {
    display: flex;
    align-items: center;
    gap: 9px;
    height: 30px;
    padding: 0 9px;
    border: none;
    border-radius: 5px;
    background: transparent;
    color: var(--sx-text-primary);
    font-size: 12.5px;
    width: 100%;
    cursor: pointer;
    white-space: nowrap;
  }
  .mi:hover { background: var(--sx-bg-hover); }
  .mi .mi-icon { display: inline-flex; color: var(--sx-text-secondary); flex: none; width: 16px; justify-content: center; }
  .mi .mi-label { flex: 1; min-width: 0; text-align: left; overflow: hidden; text-overflow: ellipsis; }
  .mi .sc { color: var(--sx-text-hint); font-size: 11px; flex: none; }
  .mi .arr { display: inline-flex; color: var(--sx-text-hint); flex: none; }
  .mi.active { background: var(--sx-brand-soft); color: var(--sx-brand); }
  .mi.active .mi-icon, .mi.active .arr { color: var(--sx-brand); }
  .menu-divider { height: 1px; background: var(--sx-grid-line); margin: 4px 6px; }
  .mi-more {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 30px;
    border: none;
    border-radius: 5px;
    background: transparent;
    color: var(--sx-text-secondary);
    font-size: 12px;
    width: 100%;
    cursor: pointer;
  }
  .mi-more:hover { background: var(--sx-bg-hover); color: var(--sx-brand); }

  /* ============ 快捷操作提示卡 ============ */
  .quick-card {
    position: absolute;
    right: 26px;
    top: 368px;
    width: 178px;
    background: var(--sx-bg-surface);
    border: 1.5px solid var(--sx-brand);
    border-radius: 10px;
    padding: 12px 13px 13px;
    z-index: 10;
  }
  .quick-card::before, .quick-card::after {
    content: '';
    position: absolute;
    right: -14px;
    top: -10px;
    width: 22px;
    height: 2.5px;
    background: var(--sx-brand);
    border-radius: 2px;
  }
  .quick-card::before { transform: rotate(38deg); right: -6px; top: -16px; width: 18px; }
  .quick-card::after { transform: rotate(64deg); }
  .quick-head {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 13.5px;
    font-weight: 600;
    color: var(--sx-text-primary);
  }
  .quick-head .bolt { display: inline-flex; color: var(--sx-brand); }
  .quick-list { margin-top: 9px; display: flex; flex-direction: column; gap: 7px; }
  .quick-item { display: flex; align-items: center; gap: 7px; font-size: 12px; color: var(--sx-text-primary); }
  .quick-item .ck { display: inline-flex; color: var(--sx-success); flex: none; }

  /* ============ 工作表标签 ============ */
  .sheet-tabs {
    display: flex;
    align-items: center;
    gap: 2px;
    background: var(--sx-bg-surface);
    border-top: 1px solid var(--sx-border);
    padding: 0 10px;
  }
  .tab-add {
    width: 26px; height: 26px;
    display: inline-flex; align-items: center; justify-content: center;
    border: none; background: transparent; color: var(--sx-text-secondary);
    border-radius: 4px;
  }
  .tab-add:hover { background: var(--sx-bg-hover); }
  .sheet-tab {
    position: relative;
    height: 100%;
    padding: 0 14px;
    border: none;
    background: transparent;
    color: var(--sx-text-secondary);
    font-size: 12px;
  }
  .sheet-tab:hover { color: var(--sx-text-primary); }
  .sheet-tab.active { color: var(--sx-brand); font-weight: 500; }
  .sheet-tab.active::after {
    content: '';
    position: absolute;
    left: 12px; right: 12px; bottom: 0;
    height: 2px;
    background: var(--sx-brand);
    border-radius: 2px 2px 0 0;
  }

  /* ============ 状态栏 ============ */
  .statusbar {
    display: flex;
    align-items: center;
    background: var(--sx-bg-surface);
    border-top: 1px solid var(--sx-border);
    padding: 0 12px;
    font-size: 11px;
    color: var(--sx-text-secondary);
  }
  .status-ready { display: flex; align-items: center; gap: 6px; }
  .status-ready .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--sx-success); }
  .status-stats { margin-left: auto; display: flex; gap: 20px; }
  .zoom { display: flex; align-items: center; gap: 6px; margin-left: 20px; }
  .zoom-value { min-width: 34px; text-align: center; color: var(--sx-text-primary); }
`
