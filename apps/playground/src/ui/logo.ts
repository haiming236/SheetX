/**
 * SheetX 官方 Logo —— 单一真源
 *
 * 用户指定的宽幅文字标：Sheet 采用企业级深海蓝 #0D2140，X 采用翡翠绿 #00A86B。
 * 建议在浅色背景下使用（深色背景可在外层容器加浅色底衬）。
 * 本文件同时供 playground（Lit）与文档站（logo.svg 同源）使用，确保全站一致。
 */
import { html, type TemplateResult } from 'lit'
import { unsafeSVG } from 'lit/directives/unsafe-svg.js'

/** Logo 原始 SVG（viewBox 540×180，宽高比 3:1） */
export const SX_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 180" width="100%" height="100%" aria-label="Sheet X">
<g font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="800" font-size="96" letter-spacing="-2">
<text x="270" y="120" text-anchor="middle">
<tspan fill="#0D2140">Sheet </tspan>
<tspan fill="#00A86B">X</tspan>
</text>
</g>
</svg>`

/**
 * 渲染 Logo（Lit 模板）。
 * @param height 显示高度（px），宽度按 3:1 自动计算，默认 30px
 */
export function sxLogo(height = 30): TemplateResult {
  const width = Math.round(height * 3)
  const sized = SX_LOGO_SVG.replace('width="100%" height="100%"', `width="${width}" height="${height}"`)
  // --sx-logo-bg 浅色透明 / 深色浅底衬（官方文字标建议浅色背景，保证深海蓝 Sheet 可读）
  return html`<span class="sx-logo" style="display:inline-flex;line-height:0;flex:none;vertical-align:middle;background:var(--sx-logo-bg,transparent);border-radius:4px;padding:1px 4px">${unsafeSVG(sized)}</span>`
}
