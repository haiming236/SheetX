/**
 * SheetX UI 设计令牌
 *
 * 提取自《UI设计.md》第 01 张主工作界面设计稿。
 * 所有 UI 组件通过 var(--sx-*) 引用，支持浅色/深色两套主题。
 * 风格约束：无 glow / shadow，简洁清爽，提示文字调淡。
 */
import { css } from 'lit'

/**
 * 浅色令牌已迁移到 index.css 的 :root。
 * 全局主题切换要求变量定义在文档根上（CSS 变量才能继承进各页面 shadow DOM），
 * 因此这里只保留空的 :host 规则以兼容各页面 `static styles = [baseStyles, lightTokens, xxxStyles]` 组合。
 */
export const lightTokens = css`:host {}`

/** 深色令牌已迁移到 index.css 的 html[data-theme="dark"]（同上） */
export const darkTokens = css`:host {}`

/** 深色主题变量映射（用于 JS 切换时 setProperty，inline 优先于 :host 规则） */
export const darkVarMap: Record<string, string> = {
  '--sx-bg-app': '#16171d',
  '--sx-bg-surface': '#1e2029',
  '--sx-bg-subtle': '#262833',
  '--sx-bg-hover': '#2e313d',
  '--sx-bg-active': '#2b3a5c',
  '--sx-border': '#31343f',
  '--sx-border-strong': '#3d414e',
  '--sx-border-input': '#3a3e4a',
  '--sx-text-primary': '#e8eaed',
  '--sx-text-secondary': '#a8aebb',
  '--sx-text-hint': '#6f7683',
  '--sx-brand': '#5b8cff',
  '--sx-brand-hover': '#7aa2ff',
  '--sx-brand-soft': '#26365c',
  '--sx-success': '#3ec98a',
  '--sx-success-soft': '#1d3b30',
  '--sx-danger': '#f06a6a',
  '--sx-grid-line': '#2c2f3a',
  '--sx-grid-header-bg': '#262f42',
  '--sx-grid-header-text': '#c8cdd7',
  '--sx-cell-selected': '#5b8cff',
  '--sx-row-selected-bg': '#24304c',
  '--sx-progress-track': '#313643',
}

/** 通用基础样式（注入到每个组件），字体、盒模型、滚动条 */
export const baseStyles = css`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  :host {
    font-family: 'Source Han Sans CN', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
    font-size: 16px;
    color: var(--sx-text-primary);
    -webkit-font-smoothing: antialiased;
  }

  button {
    font-family: inherit;
    font-size: inherit;
    color: inherit;
    cursor: pointer;
  }

  /* 顶栏搜索框：真输入框（替换此前的 div+span 假输入，保证可输入/可清空） */
  .search-box input {
    flex: 1 1 auto;
    min-width: 0;
    height: 100%;
    padding: 0;
    border: 0;
    outline: 0;
    background: transparent;
    font: inherit;
    color: inherit;
  }
  .search-box input::placeholder {
    color: var(--sx-text-hint);
  }
  .search-box:focus-within {
    border-color: var(--sx-brand);
  }

  ::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }
  ::-webkit-scrollbar-thumb {
    background: var(--sx-border-strong);
    border-radius: 5px;
    border: 2px solid transparent;
    background-clip: padding-box;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }

  /* ===== 精细缩放滑块（参考 Excel / WPS 状态栏）=====
   * 细轨 3px + 9px 圆形 thumb，hover 放大反馈，去掉原生 accent-color 的粗大感。
   * 注入到 baseStyles 全局生效；各页面仅设 width，不覆盖伪元素。 */
  input[type='range'] {
    -webkit-appearance: none;
    appearance: none;
    height: 14px;
    background: transparent;
    cursor: pointer;
    margin: 0;
  }
  input[type='range']::-webkit-slider-runnable-track {
    height: 3px;
    border-radius: 2px;
    background: var(--sx-border-strong);
  }
  input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 9px;
    height: 9px;
    margin-top: -3px;
    border-radius: 50%;
    background: var(--sx-brand);
    border: none;
    transition: transform .12s ease, background .12s ease;
  }
  input[type='range']:hover::-webkit-slider-thumb {
    transform: scale(1.18);
    background: var(--sx-brand-hover);
  }
  input[type='range']:focus-visible::-webkit-slider-thumb {
    outline: 2px solid var(--sx-brand-soft);
    outline-offset: 1px;
  }
  input[type='range']::-moz-range-track {
    height: 3px;
    border-radius: 2px;
    background: var(--sx-border-strong);
  }
  input[type='range']::-moz-range-thumb {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--sx-brand);
    border: none;
    transition: transform .12s ease, background .12s ease;
  }
  input[type='range']:hover::-moz-range-thumb {
    transform: scale(1.18);
    background: var(--sx-brand-hover);
  }
`
