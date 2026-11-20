/**
 * SheetX 第 26 张 · 宿主系统集成与开放 API 调试中心 — 样式
 * 三栏布局：左侧集成导航 / 中间配置主区 / 右侧 API 调试中心；无 glow/shadow。
 */
import { css } from 'lit'

export const hostStyles = css`
  :host { display: block; }
  .app {
    display: flex; flex-direction: column; min-height: calc(100vh - 42px);
    background: var(--sx-bg-app); color: var(--sx-text-primary);
    font-family: 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
  }

  /* ---- 顶部菜单 ---- */
  .menu-bar {
    height: 50px; flex: 0 0 50px; display: flex; align-items: center; gap: 14px;
    padding: 0 18px; background: var(--sx-bg-surface); border-bottom: 1px solid var(--sx-border);
  }
  .brand { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; }
  .brand-logo {
    width: 24px; height: 24px; border-radius: 6px; background: var(--sx-brand); color: #fff;
    display: inline-flex; align-items: center; justify-content: center;
  }
  .brand-logo svg { display: block; }
  .menu-list { display: flex; align-items: center; gap: 2px; margin-left: 12px; }
  .menu-item {
    height: 32px; padding: 0 12px; border: 0; border-radius: 6px; background: transparent;
    color: var(--sx-text-secondary); font-size: 13px; display: inline-flex; align-items: center; gap: 6px;
  }
  .menu-item:hover { background: var(--sx-bg-hover); color: var(--sx-text-primary); }
  .menu-item.active { color: var(--sx-brand); background: var(--sx-brand-soft); font-weight: 600; }
  .menu-right { display: flex; align-items: center; gap: 10px; margin-left: auto; }
  .icon-btn {
    width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center;
    border: 0; border-radius: 6px; background: transparent; color: var(--sx-text-secondary);
  }
  .icon-btn:hover { background: var(--sx-bg-hover); color: var(--sx-brand); }
  .avatar {
    width: 28px; height: 28px; border-radius: 50%; background: var(--sx-brand); color: #fff;
    display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600;
  }

  /* ---- 三栏主体 ---- */
  .shell { display: flex; flex: 1; min-height: 0; }

  /* 左侧导航 */
  .sidebar {
    width: 186px; flex: 0 0 186px; background: var(--sx-bg-surface);
    border-right: 1px solid var(--sx-border); padding: 16px 10px; display: flex; flex-direction: column;
  }
  .side-title { font-size: 11px; font-weight: 600; color: var(--sx-text-hint); padding: 0 10px 10px; }
  .side-item {
    display: flex; align-items: center; gap: 10px; width: 100%; height: 36px; padding: 0 10px;
    border: 0; border-radius: 6px; background: transparent; color: var(--sx-text-secondary);
    font-size: 12.5px; text-align: left;
  }
  .side-item:hover { background: var(--sx-bg-hover); color: var(--sx-text-primary); }
  .side-item.active { background: var(--sx-brand-soft); color: var(--sx-brand); font-weight: 600; }
  .guide-card {
    margin-top: 18px; padding: 13px 12px; border-radius: 8px;
    background: var(--sx-bg-app); border: 1px solid var(--sx-border);
  }
  .guide-card h4 { margin: 0 0 6px; font-size: 12.5px; display: flex; align-items: center; gap: 6px; }
  .guide-card p { margin: 0 0 10px; font-size: 11px; line-height: 1.55; color: var(--sx-text-hint); }
  .guide-link {
    display: inline-flex; align-items: center; gap: 5px; height: 28px; padding: 0 10px;
    border-radius: 5px; background: var(--sx-bg-surface); border: 1px solid var(--sx-border-input);
    color: var(--sx-brand); font-size: 11px;
  }
  .guide-link:hover { border-color: var(--sx-brand); }
  .side-version { margin-top: auto; padding: 12px 10px 0; font-size: 10.5px; color: var(--sx-text-hint); }

  /* 中间主区 */
  .main {
    flex: 1; min-width: 0; margin: 14px; padding: 18px 20px; border-radius: 8px;
    background: var(--sx-bg-surface); border: 1px solid var(--sx-border); overflow-y: auto;
  }
  .main-head { display: flex; align-items: flex-start; gap: 12px; padding-bottom: 14px; border-bottom: 1px solid var(--sx-border); }
  .head-icon {
    width: 40px; height: 40px; flex: none; border-radius: 9px; background: var(--sx-brand);
    color: #fff; display: inline-flex; align-items: center; justify-content: center;
  }
  .main-head h2 { margin: 0 0 4px; font-size: 18px; }
  .main-head p { margin: 0; font-size: 12px; color: var(--sx-text-hint); }
  .status-pill {
    margin-left: auto; display: inline-flex; align-items: center; gap: 5px;
    height: 24px; padding: 0 10px; border-radius: 12px;
    background: var(--sx-success-soft); color: var(--sx-success); font-size: 11px; white-space: nowrap;
  }
  .status-pill .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--sx-success); }
  .config-tabs { display: flex; gap: 2px; border-bottom: 1px solid var(--sx-border); margin: 0 -20px; padding: 0 20px; }
  .config-tab {
    height: 40px; padding: 0 14px; border: 0; border-bottom: 2px solid transparent;
    background: transparent; color: var(--sx-text-secondary); font-size: 12.5px;
  }
  .config-tab:hover { color: var(--sx-text-primary); }
  .config-tab.active { color: var(--sx-brand); border-bottom-color: var(--sx-brand); font-weight: 600; }
  .section-title { font-size: 13px; font-weight: 600; margin: 18px 0 10px; }

  /* 集成模式卡片 */
  .mode-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .mode-card {
    position: relative; padding: 16px 14px; border: 1px solid var(--sx-border-input); border-radius: 8px;
    background: var(--sx-bg-surface); text-align: center; cursor: pointer; transition: border-color .15s;
  }
  .mode-card:hover { border-color: var(--sx-brand); }
  .mode-card.on { border-color: var(--sx-brand); background: var(--sx-brand-soft); }
  .mode-card .badge {
    position: absolute; top: 8px; right: 8px; width: 18px; height: 18px; border-radius: 50%;
    background: var(--sx-brand); color: #fff; display: inline-flex; align-items: center; justify-content: center;
  }
  .mode-icon {
    width: 40px; height: 40px; margin: 0 auto 10px; border-radius: 8px;
    background: var(--sx-brand-soft); color: var(--sx-brand); display: inline-flex; align-items: center; justify-content: center;
  }
  .mode-card h4 { margin: 0 0 6px; font-size: 13px; }
  .mode-card p { margin: 0; font-size: 11px; line-height: 1.5; color: var(--sx-text-hint); }

  /* 参数表单 */
  .param-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 18px; }
  .field-row { display: flex; align-items: center; gap: 10px; }
  .field-row > label { width: 78px; flex: none; font-size: 12px; color: var(--sx-text-primary); }
  .input, .select {
    height: 32px; padding: 0 9px; border: 1px solid var(--sx-border-input); border-radius: 6px;
    background: var(--sx-bg-surface); color: var(--sx-text-primary); font-size: 12px; outline: none; flex: 1; min-width: 0;
  }
  .input:focus, .select:focus { border-color: var(--sx-brand); }
  .field-hint { font-size: 10.5px; color: var(--sx-text-hint); margin-top: 4px; padding-left: 88px; }
  .toggle-grid { display: flex; flex-wrap: wrap; gap: 14px 22px; }
  .check-row { display: inline-flex; align-items: center; gap: 7px; font-size: 12px; color: var(--sx-text-secondary); cursor: pointer; }
  .check-box {
    width: 16px; height: 16px; border: 1px solid var(--sx-border-strong); border-radius: 3px;
    display: inline-flex; align-items: center; justify-content: center; background: var(--sx-bg-surface); color: #fff; flex: none;
  }
  .check-box.on { background: var(--sx-brand); border-color: var(--sx-brand); }
  .tip {
    display: flex; align-items: flex-start; gap: 9px; padding: 12px 14px; margin-top: 18px;
    border-radius: 7px; background: var(--sx-brand-soft); color: var(--sx-text-secondary); font-size: 11.5px; line-height: 1.6;
  }
  .tip .tip-icon { color: var(--sx-brand); flex: none; margin-top: 1px; }
  .tip b { color: var(--sx-brand); }
  .main-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--sx-border); }
  .btn {
    height: 34px; padding: 0 16px; border-radius: 6px; border: 1px solid var(--sx-border-input);
    background: var(--sx-bg-surface); color: var(--sx-text-primary); font-size: 12px;
    display: inline-flex; align-items: center; gap: 6px;
  }
  .btn:hover { border-color: var(--sx-brand); }
  .btn.primary { background: var(--sx-brand); border-color: var(--sx-brand); color: #fff; }
  .btn.primary:hover { background: var(--sx-brand-hover); }

  /* ERP 卡片 */
  .erp-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .erp-card {
    padding: 12px; border: 1px solid var(--sx-border-input); border-radius: 8px; background: var(--sx-bg-surface); cursor: pointer;
  }
  .erp-card:hover { border-color: var(--sx-brand); }
  .erp-card.on { border-color: var(--sx-brand); background: var(--sx-brand-soft); }
  .erp-card .erp-head { display: flex; align-items: center; gap: 8px; }
  .erp-logo { width: 26px; height: 26px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; color: #fff; font-size: 11px; font-weight: 700; flex: none; }
  .erp-card h4 { margin: 0; font-size: 12.5px; }
  .erp-card .vendor { font-size: 10px; color: var(--sx-text-hint); }
  .endpoint-list { margin-top: 9px; display: flex; flex-direction: column; gap: 4px; font: 10px/1.5 'SF Mono', Menlo, monospace; color: var(--sx-text-hint); }
  .map-table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 11.5px; }
  .map-table th, .map-table td { border: 1px solid var(--sx-border); padding: 6px 10px; text-align: left; }
  .map-table th { background: var(--sx-bg-app); color: var(--sx-text-secondary); font-weight: 600; }
  .map-table td input { width: 100%; border: 0; background: transparent; color: var(--sx-text-primary); font: inherit; outline: none; }

  /* 权限矩阵 */
  .perm-table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
  .perm-table th, .perm-table td { border: 1px solid var(--sx-border); padding: 7px 10px; text-align: center; }
  .perm-table th { background: var(--sx-bg-app); color: var(--sx-text-secondary); font-weight: 600; }
  .perm-table td:first-child { text-align: left; font-weight: 600; }
  .perm-toggle { width: 34px; height: 19px; border-radius: 10px; border: 0; padding: 2px; background: var(--sx-border-strong); display: inline-flex; align-items: center; }
  .perm-toggle.on { background: var(--sx-brand); }
  .perm-toggle .knob { width: 15px; height: 15px; border-radius: 50%; background: #fff; transition: transform .15s; }
  .perm-toggle.on .knob { transform: translateX(15px); }

  /* 插件列表 */
  .plugin-row { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border: 1px solid var(--sx-border); border-radius: 7px; margin-bottom: 8px; }
  .plugin-row .name { font-size: 12.5px; font-weight: 600; }
  .plugin-row .meta { font-size: 10.5px; color: var(--sx-text-hint); }
  .plugin-row .switch { margin-left: auto; }

  /* ---- 右侧 API 调试中心 ---- */
  .debug {
    width: 330px; flex: 0 0 330px; margin: 14px 14px 14px 0; padding: 16px;
    background: var(--sx-bg-surface); border: 1px solid var(--sx-border); border-radius: 8px;
    overflow-y: auto; align-self: flex-start; max-height: calc(100vh - 42px - 50px - 28px);
  }
  .debug-head { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; }
  .debug-head .online { margin-left: auto; display: inline-flex; align-items: center; gap: 5px; font-size: 10.5px; color: var(--sx-success); font-weight: 400; }
  .debug-head .online .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--sx-success); }
  .api-tabs { display: flex; border-bottom: 1px solid var(--sx-border); margin: 12px -16px 0; padding: 0 16px; }
  .api-tab { flex: 1; height: 34px; border: 0; border-bottom: 2px solid transparent; background: transparent; color: var(--sx-text-secondary); font-size: 11.5px; }
  .api-tab.active { color: var(--sx-brand); border-bottom-color: var(--sx-brand); font-weight: 600; }
  .api-card { padding: 13px 0; border-bottom: 1px solid var(--sx-border); }
  .api-card:last-child { border-bottom: 0; }
  .api-card-head { display: flex; align-items: center; gap: 8px; }
  .api-card-head h4 { margin: 0; font-size: 12.5px; }
  .run-btn {
    margin-left: auto; height: 26px; padding: 0 9px; border: 1px solid var(--sx-brand); border-radius: 5px;
    background: var(--sx-bg-surface); color: var(--sx-brand); font-size: 10.5px; display: inline-flex; align-items: center; gap: 4px;
  }
  .run-btn:hover { background: var(--sx-brand-soft); }
  .api-card p { margin: 5px 0 8px; font-size: 10.5px; color: var(--sx-text-hint); }
  .code-box {
    position: relative; padding: 10px 26px 10px 10px; border-radius: 6px;
    background: var(--sx-bg-app); border: 1px solid var(--sx-border);
    font: 10.5px/1.6 'SF Mono', Menlo, Consolas, monospace; color: var(--sx-text-secondary);
    white-space: pre-wrap; overflow-wrap: break-word; word-break: keep-all; text-align: left;
  }
  .code-copy { position: absolute; top: 6px; right: 6px; width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; border: 0; background: transparent; color: var(--sx-text-hint); }
  .code-copy:hover { color: var(--sx-brand); }
  .success-card {
    display: flex; align-items: center; gap: 9px; padding: 11px 12px; margin-top: 14px;
    border-radius: 7px; background: var(--sx-success-soft); color: var(--sx-success);
  }
  .success-card .txt { font-size: 12px; font-weight: 600; }
  .success-card .sub { font-size: 10px; margin-top: 2px; opacity: .85; }
  .success-card .detail { margin-left: auto; font-size: 10.5px; text-decoration: none; border-bottom: 1px solid currentColor; }
  .resp-box { font: 10.5px/1.6 'SF Mono', Menlo, monospace; white-space: pre-wrap; word-break: break-all; padding: 10px; border: 1px solid var(--sx-border); border-radius: 6px; background: var(--sx-bg-app); color: var(--sx-text-secondary); }
  .log-row { display: flex; gap: 8px; padding: 8px 0; border-bottom: 1px solid var(--sx-border); font-size: 10.5px; }
  .log-row .time { color: var(--sx-text-hint); font-variant-numeric: tabular-nums; }
  .log-row .level { font-weight: 600; }
  .log-row .level.ERROR { color: var(--sx-danger); }
  .log-row .level.WARN { color: #e5a23c; }
  .log-row .level.INFO { color: var(--sx-brand); }
  .log-row .msg { color: var(--sx-text-secondary); }

  @media (max-width: 1200px) {
    .debug { width: 290px; flex-basis: 290px; }
    .mode-grid, .erp-grid { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 980px) {
    .shell { flex-direction: column; }
    .sidebar { width: 100%; flex-basis: auto; flex-direction: row; flex-wrap: wrap; gap: 4px; }
    .side-title, .guide-card, .side-version { display: none; }
    .side-item { width: auto; }
    .debug { width: auto; flex-basis: auto; margin: 0 14px 14px; max-height: none; }
    .param-grid { grid-template-columns: 1fr; }
  }
`
