/**
 * SheetX 第 45 张 · AI 自然语言生成表格与业务数据 — 样式
 * 顶部标题 / Excel工作区 / AI生成助手面板 / 成功卡 / 底部三特性。
 */
import { css } from 'lit'

export const aiGenerateStyles = css`
  :host { display: block; }
  .app {
    display: flex; flex-direction: column; min-height: calc(100vh - 42px);
    background: linear-gradient(160deg, var(--sx-bg-app) 60%, color-mix(in srgb, #16a34a 6%, var(--sx-bg-app)));
    color: var(--sx-text-primary);
    font-family: 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
  }
  .topbar { height: 54px; flex: 0 0 54px; display: flex; align-items: center; gap: 14px; padding: 0 22px; background: var(--sx-bg-surface); border-bottom: 1px solid var(--sx-border); }
  .brand { display: flex; align-items: center; gap: 6px; font-size: 15px; font-weight: 800; }
  .top-divider { width: 1px; height: 24px; background: var(--sx-border); }
  .top-title { font-size: 18px; font-weight: 800; }
  .top-title small { display: block; font-size: 10.5px; font-weight: 400; color: var(--sx-text-hint); margin-top: 2px; }
  .top-badge { margin-left: auto; display: inline-flex; align-items: center; gap: 5px; padding: 5px 10px; border-radius: 12px; background: #e7f7ed; color: #059669; font-size: 10px; }

  .hero { padding: 16px 24px 6px; }
  .hero h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -.4px; }
  .hero p { margin: 5px 0 0; font-size: 12px; color: var(--sx-text-secondary); }

  /* 主体两栏 */
  .shell { flex: 1; display: grid; grid-template-columns: minmax(0, 1fr) 338px; gap: 16px; padding: 10px 24px 4px; align-items: start; }
  @media (max-width: 1040px) { .shell { grid-template-columns: 1fr; } }

  /* ===== Excel 工作区 ===== */
  .excel { border: 1px solid var(--sx-border); border-radius: 9px; background: var(--sx-bg-surface); overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,.04); }
  .ex-menu { height: 32px; display: flex; align-items: center; gap: 2px; padding: 0 10px; border-bottom: 1px solid var(--sx-border); }
  .ex-menu button { height: 24px; padding: 0 9px; border: 0; border-radius: 4px; background: transparent; color: var(--sx-text-secondary); font-size: 10.5px; }
  .ex-menu button.active { color: #059669; border-bottom: 2px solid #059669; font-weight: 700; }
  .ex-menu .ok { margin-left: auto; width: 22px; height: 22px; border-radius: 50%; background: #059669; color: #fff; display: inline-flex; align-items: center; justify-content: center; }
  .ex-toolbar { height: 36px; display: flex; align-items: center; gap: 4px; padding: 0 9px; border-bottom: 1px solid var(--sx-border); overflow-x: auto; scrollbar-width: none; }
  .ex-toolbar::-webkit-scrollbar { display: none; }
  .ex-btn { height: 24px; min-width: 24px; padding: 0 5px; border: 1px solid transparent; border-radius: 4px; background: transparent; color: var(--sx-text-secondary); display: inline-flex; align-items: center; justify-content: center; font-size: 10px; }
  .ex-btn:hover { background: var(--sx-bg-hover); }
  .ex-sel { height: 24px; border: 1px solid var(--sx-border); border-radius: 4px; background: var(--sx-bg-surface); color: var(--sx-text-secondary); font-size: 10px; padding: 0 4px; }
  .ex-sep { width: 1px; height: 14px; background: var(--sx-border); margin: 0 3px; }
  .formula { height: 30px; display: flex; align-items: center; gap: 6px; padding: 0 9px; border-bottom: 1px solid var(--sx-border); font-size: 10.5px; }
  .f-addr { width: 56px; height: 22px; border: 1px solid var(--sx-border); border-radius: 4px; display: inline-flex; align-items: center; justify-content: space-between; padding: 0 5px; font-size: 10px; }
  .f-fx { color: var(--sx-text-hint); font-style: italic; }
  .f-val { color: var(--sx-text-secondary); }
  .sheet-area { position: relative; height: 360px; overflow: auto; }
  .grid { border-collapse: collapse; font-size: 10.5px; min-width: 100%; }
  .grid th, .grid td { border: 1px solid var(--sx-border); padding: 6px 10px; text-align: left; white-space: nowrap; }
  .grid thead th { background: var(--sx-bg-hover); color: var(--sx-text-hint); font-size: 9.5px; font-weight: 500; text-align: center; width: 46px; }
  .grid .col-head td { background: #16a34a; color: #fff; font-weight: 700; text-align: center; }
  .grid td.num { text-align: right; font-variant-numeric: tabular-nums; }
  .grid td.sel { outline: 2px solid #059669; outline-offset: -2px; background: #f0fdf4; }
  .grid tr.new-row td { background: #f0fdf4; }
  .prompt-bubble { position: absolute; top: 58px; right: 16px; max-width: 300px; padding: 10px 12px; border: 1px solid #a7f3d0; border-radius: 9px; background: #f0fdf4; color: #166534; font-size: 10.5px; line-height: 1.6; z-index: 4; box-shadow: 0 3px 12px rgba(5,150,105,.12); }
  .prompt-bubble::after { content: ''; position: absolute; right: 24px; bottom: -7px; width: 12px; height: 12px; background: #f0fdf4; border-right: 1px solid #a7f3d0; border-bottom: 1px solid #a7f3d0; transform: rotate(45deg); }
  .prompt-bubble .sig { font-size: 9px; color: #059669; margin-top: 4px; }

  /* 成功卡 */
  .toast-card { position: absolute; left: 50%; top: 46%; transform: translate(-50%, -50%); z-index: 8; width: 330px; padding: 18px; border: 1px solid #a7f3d0; border-radius: 11px; background: var(--sx-bg-surface); box-shadow: 0 8px 30px rgba(0,0,0,.16); text-align: center; }
  .toast-card .tc-ico { width: 42px; height: 42px; border-radius: 50%; background: #059669; color: #fff; display: inline-flex; align-items: center; justify-content: center; }
  .toast-card h3 { margin: 10px 0 4px; font-size: 13px; }
  .toast-card p { margin: 0; font-size: 10.5px; color: var(--sx-text-secondary); }
  .toast-card .bars { display: flex; align-items: flex-end; justify-content: center; gap: 4px; height: 36px; margin: 10px 0; }
  .toast-card .bars i { width: 12px; background: #86efac; border-radius: 2px 2px 0 0; }
  .toast-card .btn { height: 28px; padding: 0 12px; border: 1px solid #059669; border-radius: 14px; background: var(--sx-bg-surface); color: #059669; font-size: 10.5px; }

  /* ===== AI 生成助手面板 ===== */
  .ai-panel { border: 1px solid var(--sx-border); border-radius: 10px; background: var(--sx-bg-surface); overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,.04); }
  .ai-head { height: 44px; display: flex; align-items: center; gap: 7px; padding: 0 13px; border-bottom: 1px solid var(--sx-border); font-size: 12px; font-weight: 700; }
  .ai-head .x { margin-left: auto; width: 22px; height: 22px; border: 0; background: transparent; color: var(--sx-text-hint); }
  .ai-body { padding: 13px; }
  .ai-reply { display: flex; gap: 9px; align-items: flex-start; }
  .bot { width: 38px; height: 38px; flex: none; border-radius: 10px; background: linear-gradient(135deg, #16a34a, #059669); color: #fff; display: inline-flex; align-items: center; justify-content: center; }
  .bubble { padding: 9px 11px; border: 1px solid var(--sx-border); border-radius: 8px; font-size: 10.5px; line-height: 1.6; background: var(--sx-bg-app); }
  .steps { margin: 12px 0; padding: 10px 11px; border-radius: 8px; background: #f0fdf4; border: 1px solid #dcfce7; display: flex; flex-direction: column; gap: 7px; }
  .step { display: flex; align-items: center; gap: 7px; font-size: 10.5px; color: #166534; }
  .step svg { color: #059669; flex: none; }

  .tpl-row { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 9px; }
  .tpl { height: 25px; padding: 0 8px; border: 1px solid var(--sx-border); border-radius: 12px; background: var(--sx-bg-surface); color: var(--sx-text-secondary); font-size: 9.5px; display: inline-flex; align-items: center; gap: 4px; }
  .tpl:hover { border-color: #059669; color: #059669; }
  .tpl.on { background: #e7f7ed; color: #059669; border-color: #059669; font-weight: 600; }
  .input-row { display: flex; gap: 6px; }
  .input-row textarea { flex: 1; min-width: 0; height: 60px; resize: none; border: 1px solid var(--sx-border); border-radius: 7px; padding: 8px 9px; background: var(--sx-bg-app); color: var(--sx-text-primary); font: 10.5px/1.55 inherit; outline: 0; }
  .gen-btn { width: 46px; border: 0; border-radius: 7px; background: #059669; color: #fff; display: inline-flex; align-items: center; justify-content: center; }
  .gen-btn:disabled { opacity: .5; }

  .preview { margin-top: 12px; border: 1px solid var(--sx-border); border-radius: 8px; overflow: hidden; }
  .preview-head { height: 32px; display: flex; align-items: center; padding: 0 10px; border-bottom: 1px solid var(--sx-border); font-size: 10.5px; font-weight: 700; }
  .preview-head .cp { margin-left: auto; width: 22px; height: 22px; border: 0; background: transparent; color: var(--sx-text-hint); }
  .preview-scroll { max-height: 172px; overflow: auto; }
  .preview table { width: 100%; border-collapse: collapse; font-size: 9.5px; }
  .preview th, .preview td { border-bottom: 1px solid var(--sx-border); border-right: 1px solid var(--sx-border); padding: 6px 7px; text-align: left; white-space: nowrap; }
  .preview th { background: var(--sx-bg-hover); color: var(--sx-text-secondary); font-weight: 600; position: sticky; top: 0; }
  .preview td.num { text-align: right; font-variant-numeric: tabular-nums; }
  .preview .more-row td { text-align: center; color: var(--sx-text-hint); }
  .count-row { display: flex; align-items: center; gap: 7px; padding: 8px 10px; font-size: 10px; color: var(--sx-text-secondary); }
  .count-row input[type=number] { width: 70px; height: 24px; border: 1px solid var(--sx-border); border-radius: 4px; background: var(--sx-bg-app); color: var(--sx-text-primary); padding: 0 5px; font-size: 10px; }
  .count-row .fill { margin-left: auto; height: 24px; padding: 0 8px; border: 1px solid var(--sx-border); border-radius: 4px; background: var(--sx-bg-surface); color: var(--sx-text-secondary); font-size: 9.5px; }
  .ai-actions { display: flex; gap: 8px; margin-top: 12px; }
  .ai-actions .btn { flex: 1; height: 34px; border: 1px solid var(--sx-border); border-radius: 7px; background: var(--sx-bg-surface); color: var(--sx-text-secondary); font-size: 11px; }
  .ai-actions .btn.primary { flex: 1.3; background: #059669; color: #fff; border-color: #059669; font-weight: 700; }
  .provider-note { margin-top: 9px; font-size: 9px; color: var(--sx-text-hint); display: flex; align-items: center; gap: 4px; }

  /* 底部三特性 */
  .features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin: 12px 24px 18px; }
  .feature { display: flex; gap: 10px; align-items: center; padding: 11px 14px; border: 1px solid var(--sx-border); border-radius: 9px; background: var(--sx-bg-surface); }
  .feature .fi { width: 34px; height: 34px; flex: none; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; color: var(--fc); background: color-mix(in srgb, var(--fc) 12%, transparent); }
  .feature .ft { font-size: 11px; font-weight: 700; }
  .feature .fd { font-size: 9.5px; color: var(--sx-text-hint); margin-top: 3px; }
  .statusbar { height: 26px; flex: 0 0 26px; display: flex; align-items: center; gap: 12px; padding: 0 14px; border-top: 1px solid var(--sx-border); background: var(--sx-bg-surface); font-size: 9.5px; color: var(--sx-text-secondary); }
  .statusbar .undo { color: #059669; cursor: pointer; margin-left: auto; }
`
