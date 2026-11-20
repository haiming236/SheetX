/**
 * SheetX 单元格编辑与业务下拉界面样式（第 04 张设计稿）
 */
import { css } from 'lit'

export const editorsStyles = css`
  :host {
    display: block; width: 100%; height: 100%;
    background: var(--sx-bg-app); overflow: hidden;
  }
  .app {
    display: grid; grid-template-rows: 42px 44px 30px 1fr 30px 28px;
    height: 100%; min-width: 1040px;
  }

  /* 顶部 */
  .topbar {
    display: flex; align-items: center; gap: 22px; padding: 0 16px;
    background: var(--sx-bg-surface); border-bottom: 1px solid var(--sx-border);
  }
  .nav { display: flex; gap: 1px; height: 100%; align-items: stretch; }
  .nav-item {
    position: relative; padding: 0 12px; border: none; background: transparent;
    color: var(--sx-text-secondary); font-size: 13px;
  }
  .nav-item.active { color: var(--sx-brand); font-weight: 500; }
  .nav-item.active::after {
    content: ''; position: absolute; left: 10px; right: 10px; bottom: 0;
    height: 2px; background: var(--sx-brand); border-radius: 2px 2px 0 0;
  }
  .topbar-right { margin-left: auto; display: flex; align-items: center; gap: 10px; }
  .search-box {
    display: flex; align-items: center; gap: 7px; width: 210px; height: 27px;
    padding: 0 10px; background: var(--sx-bg-subtle); border: 1px solid var(--sx-border);
    border-radius: 6px; color: var(--sx-text-hint); font-size: 11px;
  }
  .icon-btn {
    width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center;
    border: none; border-radius: 6px; background: transparent; color: var(--sx-text-secondary);
  }
  .avatar {
    width: 27px; height: 27px; border-radius: 50%; background: var(--sx-brand);
    color: #fff; font-size: 12px; display: inline-flex; align-items: center; justify-content: center;
  }

  /* 工具栏 */
  .toolbar {
    display: flex; align-items: center; gap: 3px; padding: 0 14px;
    background: var(--sx-bg-surface); border-bottom: 1px solid var(--sx-border); overflow: hidden;
  }
  .tool-btn {
    width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center;
    border: 1px solid transparent; border-radius: 5px; background: transparent; color: var(--sx-text-secondary); flex: none;
  }
  .tool-btn:hover { background: var(--sx-bg-hover); }
  .tool-btn.active { background: var(--sx-bg-active); color: var(--sx-brand); }
  .tool-btn.fcolor { color: var(--sx-danger); }
  .tool-select {
    display: inline-flex; align-items: center; justify-content: space-between; gap: 6px;
    height: 26px; padding: 0 7px; border: 1px solid var(--sx-border-input); border-radius: 5px;
    background: var(--sx-bg-surface); font-size: 12px; white-space: nowrap; flex: none;
  }
  .tool-select.font { width: 84px; }
  .tool-select.size { width: 46px; }
  .tool-select.format { width: 62px; }
  .tool-select .caret { color: var(--sx-text-hint); display: inline-flex; }
  .tool-action {
    display: inline-flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 1px; min-width: 44px; height: 34px; padding: 0 4px; border: none; border-radius: 5px;
    background: transparent; color: var(--sx-text-secondary); font-size: 10px; flex: none;
  }
  .tool-action:hover { background: var(--sx-bg-hover); }
  .sep { width: 1px; height: 20px; background: var(--sx-border); margin: 0 4px; flex: none; }

  /* 公式栏 */
  .formula-bar {
    display: flex; align-items: center; padding: 0 10px;
    background: var(--sx-bg-surface); border-bottom: 1px solid var(--sx-border); gap: 0;
  }
  .cell-address {
    display: inline-flex; align-items: center; justify-content: space-between;
    width: 68px; height: 22px; padding: 0 8px; border: 1px solid var(--sx-border-input);
    border-radius: 4px 0 0 4px; font-size: 12px; font-weight: 500; flex: none;
  }
  .cell-address .caret { color: var(--sx-text-hint); display: inline-flex; }
  .fx-box {
    width: 30px; height: 22px; display: inline-flex; align-items: center; justify-content: center;
    border: 1px solid var(--sx-border-input); border-left: none; border-right: none;
    color: var(--sx-text-secondary); font-style: italic; font-family: Georgia, serif; flex: none;
  }
  .formula-input {
    flex: 1; height: 22px; padding: 0 10px; border: 1px solid var(--sx-border-input);
    border-radius: 0 4px 4px 0; background: var(--sx-bg-surface); color: var(--sx-text-primary);
    font-size: 12px; outline: none;
  }

  /* 主区 */
  .body { display: flex; flex-direction: column; min-height: 0; }
  .grid-area { flex: 1; min-height: 150px; overflow: auto; position: relative; background: var(--sx-bg-surface); }

  .grid-table { border-collapse: separate; border-spacing: 0; table-layout: fixed; width: 100%; font-size: 12px; }
  .grid-table th, .grid-table td {
    height: 30px; border-right: 1px solid var(--sx-grid-line); border-bottom: 1px solid var(--sx-grid-line);
    padding: 0 10px; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .grid-table thead th {
    background: var(--sx-bg-subtle); color: var(--sx-text-secondary); font-weight: 500;
    position: sticky; top: 0; z-index: 2;
  }
  .grid-table tbody th.row-h {
    background: var(--sx-bg-subtle); color: var(--sx-text-hint); font-weight: 400;
    text-align: center; width: 30px; position: sticky; left: 0; z-index: 1;
  }
  .grid-table tbody th.row-h.hl { background: var(--sx-bg-active); color: var(--sx-brand); }
  .grid-table td { color: var(--sx-text-primary); background: var(--sx-bg-surface); }
  .grid-table td.center { text-align: center; }
  .grid-table td.right { text-align: right; font-variant-numeric: tabular-nums; }
  .grid-table td.editing {
    outline: 2px solid var(--sx-cell-selected); outline-offset: -2px; padding: 0 6px;
  }
  .edit-input {
    display: flex; align-items: center; justify-content: space-between; width: 100%; height: 26px;
    border: 1px solid var(--sx-brand); border-radius: 3px; background: var(--sx-bg-surface);
    padding: 0 6px; font-size: 12px;
  }
  .date-cell { display: inline-flex; align-items: center; gap: 6px; }
  .date-cell .cal { color: var(--sx-text-hint); display: inline-flex; }
  .badge { display: inline-flex; align-items: center; gap: 5px; padding: 2px 8px; border-radius: 4px; font-size: 11px; }
  .badge .dot { width: 6px; height: 6px; border-radius: 50%; }

  /* 商品搜索下拉浮层 */
  .product-dropdown {
    position: absolute; top: 68px; left: 250px; width: 248px;
    background: var(--sx-bg-surface); border: 1px solid var(--sx-border);
    border-radius: 8px; box-shadow: 0 6px 20px rgba(0,0,0,.12); z-index: 10; overflow: hidden;
  }
  .product-search {
    display: flex; align-items: center; gap: 7px; height: 34px; padding: 0 10px;
    border-bottom: 1px solid var(--sx-border); color: var(--sx-text-hint); font-size: 12px;
  }
  .product-search input { flex: 1; border: none; outline: none; background: transparent; font-size: 12px; color: var(--sx-text-primary); }
  .product-item {
    display: flex; align-items: center; gap: 9px; padding: 8px 10px; cursor: pointer;
  }
  .product-item:hover, .product-item.hl { background: var(--sx-brand-soft); }
  .product-item .thumb {
    width: 32px; height: 26px; border-radius: 4px; background: var(--sx-bg-subtle); color: var(--sx-text-secondary);
    display: inline-flex; align-items: center; justify-content: center; flex: none;
  }
  .product-item .pt { font-size: 12px; color: var(--sx-text-primary); }
  .product-item .ps { font-size: 10px; color: var(--sx-text-hint); }
  .product-footer {
    display: flex; align-items: center; justify-content: space-between;
    padding: 7px 10px; border-top: 1px solid var(--sx-border);
    font-size: 10px; color: var(--sx-text-hint);
  }
  .product-footer a { color: var(--sx-brand); text-decoration: none; }

  /* 编辑器演示区 */
  .editors {
    flex: none; display: grid; grid-template-columns: 1fr 1.1fr 1fr 1.15fr;
    gap: 12px; padding: 12px 14px; border-top: 1px solid var(--sx-border);
    background: var(--sx-bg-app);
  }
  .panel {
    background: var(--sx-bg-surface); border: 1px solid var(--sx-border);
    border-radius: 8px; padding: 11px 12px;
  }
  .panel h4 { margin: 0 0 10px; font-size: 12px; font-weight: 500; color: var(--sx-text-primary); }
  .num-input {
    display: flex; align-items: center; height: 32px; border: 1px solid var(--sx-border-input);
    border-radius: 5px; overflow: hidden;
  }
  .num-input input {
    flex: 1; height: 100%; padding: 0 10px; border: none; outline: none;
    background: var(--sx-bg-surface); color: var(--sx-text-primary); font-size: 13px;
  }
  .num-input .steps { display: flex; flex-direction: column; width: 22px; border-left: 1px solid var(--sx-border); }
  .num-input .steps button {
    flex: 1; border: none; background: var(--sx-bg-surface); color: var(--sx-text-secondary);
    display: flex; align-items: center; justify-content: center; font-size: 8px; line-height: 0;
  }
  .num-input .steps button + button { border-top: 1px solid var(--sx-border); }
  .quick-btns { display: flex; gap: 6px; margin-top: 9px; }
  .quick-btns button {
    flex: 1; height: 26px; border: 1px solid var(--sx-border-input); border-radius: 5px;
    background: var(--sx-bg-surface); color: var(--sx-text-secondary); font-size: 11px;
  }
  .quick-btns button:hover { border-color: var(--sx-brand); color: var(--sx-brand); }
  .range-hint { display: flex; align-items: center; gap: 5px; margin-top: 9px; font-size: 10px; color: var(--sx-text-hint); }
  .range-hint .check { color: var(--sx-success); display: inline-flex; }

  /* 日期选择器 */
  .date-input {
    display: flex; align-items: center; gap: 7px; height: 32px; padding: 0 9px;
    border: 1px solid var(--sx-border-input); border-radius: 5px; font-size: 12px;
  }
  .date-input .cal { color: var(--sx-text-hint); display: inline-flex; }
  .date-input .caret { margin-left: auto; color: var(--sx-text-hint); display: inline-flex; }
  .calendar { margin-top: 9px; border: 1px solid var(--sx-border); border-radius: 6px; padding: 8px; }
  .cal-head { display: flex; align-items: center; justify-content: space-between; font-size: 11px; color: var(--sx-text-primary); margin-bottom: 6px; }
  .cal-head button { border: none; background: transparent; color: var(--sx-text-secondary); display: inline-flex; }
  .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; text-align: center; }
  .cal-grid .wd { font-size: 9px; color: var(--sx-text-hint); padding: 2px 0; }
  .cal-grid .day { font-size: 10px; color: var(--sx-text-primary); padding: 3px 0; border-radius: 50%; }
  .cal-grid .day.sel { background: var(--sx-brand); color: #fff; }

  /* 状态下拉 */
  .select-box {
    display: flex; align-items: center; justify-content: space-between; height: 32px; padding: 0 10px;
    border: 1px solid var(--sx-border-input); border-radius: 5px; font-size: 12px;
  }
  .select-box .caret { color: var(--sx-text-hint); display: inline-flex; }
  .select-menu { margin-top: 6px; border: 1px solid var(--sx-border); border-radius: 6px; overflow: hidden; }
  .select-option {
    display: flex; align-items: center; justify-content: space-between;
    padding: 6px 10px; font-size: 11px;
  }
  .select-option .st { display: inline-flex; align-items: center; gap: 6px; }
  .select-option .st .dot { width: 7px; height: 7px; border-radius: 50%; }
  .select-option.active { background: var(--sx-brand-soft); }
  .select-option .check { color: var(--sx-brand); display: inline-flex; }

  /* 客户搜索 */
  .cust-search {
    display: flex; align-items: center; gap: 7px; height: 32px; padding: 0 10px;
    border: 1px solid var(--sx-border-input); border-radius: 5px; color: var(--sx-text-hint); font-size: 11px;
  }
  .cust-list { margin-top: 8px; display: flex; flex-direction: column; gap: 2px; }
  .cust-item { display: flex; align-items: center; gap: 8px; padding: 5px 4px; border-radius: 4px; }
  .cust-item:hover { background: var(--sx-bg-hover); }
  .cust-item .cavatar {
    width: 22px; height: 22px; border-radius: 50%; color: #fff; font-size: 10px;
    display: inline-flex; align-items: center; justify-content: center; flex: none;
  }
  .cust-item .cn { font-size: 11px; color: var(--sx-text-primary); }
  .cust-item .cc { font-size: 10px; color: var(--sx-text-hint); }

  /* 工作表 */
  .sheet-tabs {
    display: flex; align-items: center; gap: 2px; background: var(--sx-bg-surface);
    border-top: 1px solid var(--sx-border); padding: 0 12px;
  }
  .tab-add { width: 26px; height: 26px; display: inline-flex; align-items: center; justify-content: center; border: none; background: transparent; color: var(--sx-text-secondary); }
  .sheet-tab { position: relative; height: 100%; padding: 0 13px; border: none; background: transparent; color: var(--sx-text-secondary); font-size: 12px; }
  .sheet-tab.active { color: var(--sx-brand); font-weight: 500; }
  .sheet-tab.active::after { content: ''; position: absolute; left: 10px; right: 10px; bottom: 0; height: 2px; background: var(--sx-brand); border-radius: 2px 2px 0 0; }

  /* 状态栏 */
  .statusbar {
    display: flex; align-items: center; background: var(--sx-bg-surface);
    border-top: 1px solid var(--sx-border); padding: 0 12px; font-size: 11px; color: var(--sx-text-secondary);
  }
  .status-ready { display: flex; align-items: center; gap: 6px; }
  .status-ready .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--sx-success); }
  .status-stats { margin-left: auto; display: flex; gap: 20px; }
`
