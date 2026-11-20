/**
 * @sheetx/fonts
 *
 * SheetX 内置字体库。对外暴露：
 * - `SheetXFonts`：全局字体注册表（register / getAvailableFonts / setDefault / resolve / loadBinary）
 * - `createPdfFontProgram` / `buildPdfWithLines`：PDF 字体嵌入
 * - `parseTtf` / `subsetTtf`：TTF 解析与子集化（Node 端也可用）
 *
 * 典型用法：
 * ```ts
 * import { SheetXFonts } from '@sheetx/fonts'
 * await SheetXFonts.registerBuiltins({ load: true })     // 注册 + 加载 Regular
 * SheetXFonts.setDefault('Source Han Serif CN')
 * const css = SheetXFonts.resolveCssFamily('Source Han Sans CN', 700)
 * ```
 */

export { SheetXFonts, FontRegistry, BUILTIN_FONTS, DEFAULT_BUILTIN_FONT, bytesToBase64, type BuiltinFontSpec } from './registry.js'
export {
  isBrowser,
  awaitFontsReady,
  loadFontFace,
  isFontFaceLoaded,
  resetFontFaceCache,
  type AssetResolver,
  type LoadOptions,
} from './loader.js'
export { parseTtf, readTables, readLoca, readGlyph, readCompositeComponents, type ParsedTtf, type TtfTableRecord } from './ttf.js'
export { subsetTtf, tableChecksum, type SubsetResult } from './subset.js'
export {
  createPdfFontProgram,
  buildPdfWithLines,
  buildPdfDocument,
  collectTextFromLines,
  type PdfFontProgram,
  type PdfLine,
  type PdfDocumentOptions,
} from './pdf.js'
