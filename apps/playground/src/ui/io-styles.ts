/**
 * SheetX 样式（第 07 张设计稿 · 数据导入与导出）
 * 复用既有骨架类名与令牌；新增导入弹窗 / 字段映射 / 数据预览 / 导出面板样式。
 * 风格约束：无 glow / shadow，浮层用边框区分层次。
 */
import { css } from 'lit'

export const ioStyles = css`
  :host {
    display: block;
    width: 100%;
    height: 100%;
    background: var(--sx-bg-app);
    overflow: hidden;
  }

  .app {
    display: grid;
    grid-template-rows: 44px 44px 1fr 34px 30px;
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
  .nav {
    display: flex;
    align-items: stretch;
    height: 100%;
    gap: 2px;
  }
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
  .topbar-right {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .search-box {
    display: flex;
    align-items: center;
    gap: 7px;
    width: 240px;
    height: 28px;
    padding: 0 10px;
    margin-right: 8px;
    background: var(--sx-bg-subtle);
    border: 1px solid var(--sx-border);
    border-radius: 6px;
    color: var(--sx-text-hint);
    font-size: 12px;
  }
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

  /* ============ 工具栏 ============ */
  .toolbar {
    display: flex;
    align-items: center;
    background: var(--sx-bg-surface);
    border-bottom: 1px solid var(--sx-border);
    padding: 0 12px;
    gap: 2px;
    overflow: hidden;
  }
  .tool-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 28px;
    padding: 0 9px;
    border: none;
    border-radius: 5px;
    background: transparent;
    color: var(--sx-text-primary);
    font-size: 12.5px;
    white-space: nowrap;
    flex: none;
  }
  .tool-item:hover { background: var(--sx-bg-hover); }
  .tool-item.active {
    background: var(--sx-brand-soft);
    color: var(--sx-brand);
    font-weight: 500;
  }
  .tool-item .caret { color: var(--sx-text-hint); display: inline-flex; }
  .tool-item.active .caret { color: var(--sx-brand); }

  /* ============ 主体区 ============ */
  .body {
    display: flex;
    min-height: 0;
  }
  .grid-area {
    flex: 1;
    min-width: 0;
    overflow: auto;
    background: var(--sx-bg-surface);
    position: relative;
  }

  /* 背景表格（被弹窗遮挡，仅露出左缘与底部） */
  .bg-sheet {
    border-collapse: separate;
    border-spacing: 0;
    table-layout: fixed;
    font-size: 12px;
    width: 100%;
  }
  .bg-sheet th, .bg-sheet td {
    border-right: 1px solid var(--sx-grid-line);
    border-bottom: 1px solid var(--sx-grid-line);
    padding: 0;
    height: 30px;
    text-align: left;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .bg-sheet thead th {
    background: var(--sx-bg-subtle);
    color: var(--sx-text-hint);
    font-weight: 400;
    text-align: center;
    position: sticky;
    top: 0;
    z-index: 1;
  }
  .bg-sheet thead th.corner { width: 40px; }
  .bg-sheet tbody th.row-head {
    background: var(--sx-bg-subtle);
    color: var(--sx-text-secondary);
    font-weight: 400;
    text-align: center;
    width: 40px;
  }
  .bg-sheet td.cell {
    background: var(--sx-bg-surface);
    padding: 0 10px;
    color: var(--sx-text-primary);
  }
  .bg-sheet td.head-cell {
    background: var(--sx-grid-header-bg);
    color: var(--sx-grid-header-text);
    font-weight: 500;
  }
  .bg-sheet td.head-cell.accent {
    background: var(--sx-bg-active);
    color: var(--sx-brand);
  }
  .bg-sheet td.num { text-align: right; font-variant-numeric: tabular-nums; }
  [data-theme='dark'] .bg-sheet td.head-cell.accent { background: var(--sx-brand-soft); }

  /* ============ 数据导入弹窗 ============ */
  .modal {
    position: absolute;
    left: 118px;
    top: 12px;
    width: 762px;
    background: var(--sx-bg-surface);
    border: 1px solid var(--sx-border-strong);
    border-radius: 12px;
    z-index: 20;
    padding: 14px;
  }
  .modal-head {
    display: flex;
    align-items: center;
    gap: 9px;
    margin-bottom: 12px;
  }
  .modal-head .cloud { color: var(--sx-brand); display: inline-flex; }
  .modal-head .title { font-size: 15px; font-weight: 600; color: var(--sx-text-primary); }
  .modal-head .icon-btn { margin-left: auto; width: 26px; height: 26px; }

  .modal-body {
    display: flex;
    gap: 12px;
  }

  /* 左列：文件类型 */
  .file-list {
    width: 122px;
    flex: none;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .file-type {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 8px;
    border-radius: 8px;
    border: none;
    background: transparent;
    text-align: left;
    width: 100%;
  }
  .file-type:hover { background: var(--sx-bg-hover); }
  .file-type.active { background: var(--sx-brand-soft); }
  .file-type.active .ft-name { color: var(--sx-brand); font-weight: 500; }
  .ft-text { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
  .ft-name { font-size: 12.5px; color: var(--sx-text-primary); white-space: nowrap; }
  .ft-sub { font-size: 10.5px; color: var(--sx-text-hint); white-space: nowrap; }
  .file-type .linear-icon { color: var(--sx-brand); display: inline-flex; flex: none; }

  /* 彩色文件徽标 */
  .badge {
    width: 26px;
    height: 26px;
    border-radius: 6px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    font-weight: 700;
    flex: none;
  }
  .badge.excel { background: #1e8a4e; font-size: 14px; }
  .badge.csv { background: #2fa36b; font-size: 8px; letter-spacing: .4px; }
  .badge.json { background: #7c5cc9; font-size: 10px; }
  .badge.pdf { background: #d64545; font-size: 8px; letter-spacing: .3px; }
  .badge.img { background: #2f6fed; }
  .badge.lg { width: 42px; height: 42px; border-radius: 10px; font-size: 21px; }

  /* 右区 */
  .modal-main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .modal-row { display: flex; gap: 12px; }

  /* 中列：步骤 + 上传 + 已选文件 */
  .upload-col {
    flex: 1.05;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .steps {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .step {
    display: flex;
    align-items: center;
    gap: 6px;
    border: none;
    background: transparent;
    padding: 0;
    color: var(--sx-text-hint);
    font-size: 12px;
    white-space: nowrap;
    flex: none;
  }
  .step-dot {
    width: 19px;
    height: 19px;
    border-radius: 50%;
    border: 1.5px solid var(--sx-border-strong);
    color: var(--sx-text-hint);
    font-size: 11px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
  }
  .step.active { color: var(--sx-brand); font-weight: 500; }
  .step.active .step-dot {
    background: var(--sx-brand);
    border-color: var(--sx-brand);
    color: #ffffff;
  }
  .step-link {
    flex: 1;
    min-width: 18px;
    border-top: 1.5px dashed var(--sx-border-strong);
  }

  .upload-zone {
    border: 1.5px dashed var(--sx-border-strong);
    border-radius: 10px;
    padding: 14px 10px 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 7px;
    text-align: center;
  }
  .uz-main { font-size: 12.5px; color: var(--sx-text-primary); white-space: nowrap; }
  .uz-main .link { color: var(--sx-brand); cursor: pointer; }
  .uz-main .link:hover { text-decoration: underline; }
  .uz-sub { font-size: 10.5px; color: var(--sx-text-hint); white-space: nowrap; }
  .pick-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 29px;
    padding: 0 13px;
    margin-top: 3px;
    background: var(--sx-bg-surface);
    border: 1px solid var(--sx-border-input);
    border-radius: 6px;
    color: var(--sx-brand);
    font-size: 12.5px;
  }
  .pick-btn:hover { border-color: var(--sx-brand); background: var(--sx-brand-soft); }

  .picked-file {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 10px;
    background: var(--sx-bg-subtle);
    border-radius: 8px;
    font-size: 12px;
  }
  .picked-file .ok { color: var(--sx-success); display: inline-flex; flex: none; }
  .picked-file .name {
    color: var(--sx-text-primary);
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .picked-file .size { margin-left: auto; color: var(--sx-text-hint); flex: none; }
  .picked-file .remove {
    display: inline-flex;
    border: none;
    background: transparent;
    color: var(--sx-text-hint);
    padding: 2px;
    border-radius: 4px;
    flex: none;
  }
  .picked-file .remove:hover { color: var(--sx-danger); background: var(--sx-bg-hover); }

  /* 右列：字段映射 */
  .mapping-card {
    flex: 1.18;
    min-width: 0;
    border: 1px solid var(--sx-border);
    border-radius: 10px;
    overflow: visible;
    display: flex;
    flex-direction: column;
  }
  .card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 9px 12px;
  }
  .card-head .title { font-size: 13px; font-weight: 600; color: var(--sx-text-primary); }
  .smart-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 26px;
    padding: 0 10px;
    border: none;
    border-radius: 6px;
    background: var(--sx-brand-soft);
    color: var(--sx-brand);
    font-size: 12px;
    font-weight: 500;
  }
  .smart-btn:hover { background: var(--sx-bg-active); }

  .map-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    font-size: 12px;
  }
  .map-table th {
    background: var(--sx-bg-subtle);
    color: var(--sx-text-hint);
    font-weight: 400;
    text-align: left;
    height: 27px;
    padding: 0 10px;
    border-top: 1px solid var(--sx-border);
    border-bottom: 1px solid var(--sx-grid-line);
    white-space: nowrap;
  }
  .map-table td {
    height: 31px;
    padding: 0 10px;
    border-bottom: 1px solid var(--sx-grid-line);
    color: var(--sx-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .map-table tr:last-child td { border-bottom: none; }
  .map-select {
    position: relative;
    display: flex;
    align-items: center;
    gap: 5px;
    height: 25px;
    padding: 0 7px;
    border: 1px solid var(--sx-border-input);
    border-radius: 6px;
    background: var(--sx-bg-surface);
    font-size: 11.5px;
    color: var(--sx-text-primary);
    cursor: pointer;
    min-width: 0;
  }
  .map-select:hover { border-color: var(--sx-brand); }
  .map-select .mi { color: var(--sx-text-hint); display: inline-flex; flex: none; }
  .map-select .mt {
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .map-select .caret { color: var(--sx-text-hint); display: inline-flex; flex: none; }
  .map-menu {
    position: absolute;
    left: -1px;
    right: -1px;
    top: calc(100% + 3px);
    background: var(--sx-bg-surface);
    border: 1px solid var(--sx-border-strong);
    border-radius: 7px;
    z-index: 30;
    overflow: hidden;
  }
  .map-menu .opt {
    padding: 0 10px;
    height: 28px;
    display: flex;
    align-items: center;
    font-size: 11.5px;
    color: var(--sx-text-primary);
    cursor: pointer;
    border-bottom: 1px solid var(--sx-grid-line);
  }
  .map-menu .opt:last-child { border-bottom: none; }
  .map-menu .opt:hover { background: var(--sx-bg-hover); }
  .map-menu .opt.selected { color: var(--sx-brand); background: var(--sx-brand-soft); }

  /* 下排：导入选项 + 数据预览 */
  .import-opts {
    width: 138px;
    flex: none;
  }
  .opts-title, .preview-head .title { font-size: 13px; font-weight: 600; color: var(--sx-text-primary); }
  .opt-row {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 30px;
    border: none;
    background: transparent;
    padding: 0;
    font-size: 12px;
    color: var(--sx-text-primary);
    width: 100%;
    text-align: left;
  }
  .opt-row:hover .box { border-color: var(--sx-brand); }
  .box {
    width: 15px;
    height: 15px;
    border-radius: 4px;
    border: 1.5px solid var(--sx-border-strong);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    flex: none;
    background: var(--sx-bg-surface);
    transition: none;
  }
  .opt-row.checked .box {
    background: var(--sx-brand);
    border-color: var(--sx-brand);
  }

  .preview-card {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .preview-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  .view-all {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    border: none;
    background: transparent;
    padding: 0;
    color: var(--sx-brand);
    font-size: 12px;
  }
  .view-all:hover { text-decoration: underline; }
  .pv-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    font-size: 12px;
    border: 1px solid var(--sx-grid-line);
    border-radius: 8px;
  }
  .pv-table th {
    background: var(--sx-bg-subtle);
    color: var(--sx-text-secondary);
    font-weight: 500;
    text-align: left;
    height: 28px;
    padding: 0 8px;
    white-space: nowrap;
  }
  .pv-table td {
    height: 30px;
    padding: 0 8px;
    border-top: 1px solid var(--sx-grid-line);
    color: var(--sx-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .pv-table td.num { text-align: right; font-variant-numeric: tabular-nums; }
  .tag {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    line-height: 1.5;
  }
  .tag.shipped { background: #e2f5ea; color: #1e9e63; }
  .tag.pending { background: #fdf1dc; color: #d97a06; }
  [data-theme='dark'] .tag.shipped { background: #1d3b30; color: #3ec98a; }
  [data-theme='dark'] .tag.pending { background: #40351d; color: #e8a94a; }

  /* 底部按钮 */
  .modal-foot {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 2px;
  }
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: 31px;
    padding: 0 16px;
    border-radius: 7px;
    font-size: 12.5px;
    border: 1px solid var(--sx-border-input);
    background: var(--sx-bg-surface);
    color: var(--sx-text-primary);
  }
  .btn:hover { background: var(--sx-bg-hover); }
  .btn.primary {
    background: var(--sx-brand);
    border-color: var(--sx-brand);
    color: #ffffff;
    font-weight: 500;
  }
  .btn.primary:hover { background: var(--sx-brand-hover); border-color: var(--sx-brand-hover); }

  /* ============ 右侧数据导出面板 ============ */
  .export-panel {
    width: 192px;
    flex: none;
    background: var(--sx-bg-surface);
    border-left: 1px solid var(--sx-border);
    display: flex;
    flex-direction: column;
    padding: 12px 14px 14px;
    overflow-y: auto;
  }
  .export-head {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .export-head .dl { color: var(--sx-brand); display: inline-flex; }
  .export-head .title { font-size: 13.5px; font-weight: 600; color: var(--sx-text-primary); }
  .export-head .icon-btn { margin-left: auto; width: 24px; height: 24px; }
  .sec-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--sx-text-primary);
    margin: 14px 0 8px;
  }
  .fmt-list { display: flex; flex-direction: column; gap: 7px; }
  .fmt-card {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 9px;
    border: 1px solid var(--sx-border);
    border-radius: 8px;
    background: var(--sx-bg-surface);
    text-align: left;
    width: 100%;
  }
  .fmt-card:hover { border-color: var(--sx-border-strong); }
  .fmt-card.active {
    border-color: var(--sx-brand);
    background: var(--sx-brand-soft);
  }
  .fmt-card.active .fmt-name { color: var(--sx-brand); font-weight: 500; }
  .fmt-text { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
  .fmt-name { font-size: 12px; color: var(--sx-text-primary); white-space: nowrap; }
  .fmt-sub { font-size: 10.5px; color: var(--sx-text-hint); white-space: nowrap; }

  .radio-row {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 27px;
    border: none;
    background: transparent;
    padding: 0;
    font-size: 12px;
    color: var(--sx-text-primary);
    width: 100%;
    text-align: left;
  }
  .radio {
    width: 15px;
    height: 15px;
    border-radius: 50%;
    border: 1.5px solid var(--sx-border-strong);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    background: var(--sx-bg-surface);
  }
  .radio-row.checked .radio { border-color: var(--sx-brand); }
  .radio-row.checked .radio::after {
    content: '';
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--sx-brand);
  }

  .adv-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 14px;
    border: none;
    background: transparent;
    padding: 0;
    font-size: 12px;
    color: var(--sx-text-secondary);
    width: 100%;
  }
  .adv-row:hover { color: var(--sx-text-primary); }
  .adv-row .caret { display: inline-flex; color: var(--sx-text-hint); transition: none; }
  .adv-row.open .caret { transform: rotate(180deg); }
  .adv-body { display: flex; flex-direction: column; gap: 2px; margin-top: 4px; }

  .export-btn {
    margin-top: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    height: 34px;
    border: none;
    border-radius: 8px;
    background: var(--sx-brand);
    color: #ffffff;
    font-size: 13px;
    font-weight: 500;
  }
  .export-btn:hover { background: var(--sx-brand-hover); }

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
  .status-count { margin-left: 16px; }
  .status-count strong { color: var(--sx-text-primary); font-weight: 500; }
  .status-stats { margin-left: auto; display: flex; gap: 20px; }
  .status-view { display: flex; align-items: center; gap: 2px; margin-left: 20px; }
  .status-view .tool-btn { width: 24px; height: 24px; }
  .status-view .tool-btn.active { color: var(--sx-brand); }
  .zoom { display: flex; align-items: center; gap: 6px; margin-left: 14px; }
  .zoom input[type='range'] { width: 64px; accent-color: var(--sx-brand); }
  .zoom-value { min-width: 34px; text-align: right; }
  .tool-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: 1px solid transparent;
    border-radius: 5px;
    background: transparent;
    color: var(--sx-text-secondary);
    flex: none;
  }
  .tool-btn:hover { background: var(--sx-bg-hover); }
`
