/**
 * Playground 侧的字体资源解析
 *
 * @sheetx/fonts 本身不绑定任何打包器（避免把 Vite 语义带进库），
 * 由宿主应用决定"字体文件从哪来"。这里用 Vite 的 import.meta.glob
 * 把包内 assets 显式登记成 URL，既能被 Vite 正确处理，也能配合 PDF 导出取字节。
 */
import { SheetXFonts } from '@sheetx/fonts'

/** 打包时把 assets 下所有 ttf 变成可访问 URL */
const assets = import.meta.glob('../../../../packages/fonts/assets/**/*.ttf', {
  query: '?url',
  import: 'default',
  eager: true,
}) as Record<string, string>

/** 字体 → assets 相对路径（与 registry.ts 中 BUILTIN_FONTS 保持一致） */
const ASSET_PATHS: Record<string, { regular: string; bold: string }> = {
  'Source Han Serif CN': { regular: 'source-han-serif/regular.ttf', bold: 'source-han-serif/bold.ttf' },
  'Source Han Sans CN': { regular: 'source-han-sans/regular.ttf', bold: 'source-han-sans/bold.ttf' },
  Inter: { regular: 'inter/regular.ttf', bold: 'inter/bold.ttf' },
}

function findAsset(rel: string): string | undefined {
  for (const [key, url] of Object.entries(assets)) {
    if (key.endsWith(`/assets/${rel}`)) return url
  }
  return undefined
}

let installed = false

/** 安装解析器（幂等）：必须在 registerBuiltins 前调用 */
export function installFontAssets(): void {
  if (installed) return
  installed = true
  SheetXFonts.setAssetResolver((family, weight) => {
    const spec = ASSET_PATHS[family]
    if (!spec) return undefined
    return findAsset(weight >= 600 ? spec.bold : spec.regular)
  })
}
