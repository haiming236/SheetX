/**
 * @sheetx/fonts - 字体注册表（SheetXFonts）
 *
 * 单一事实来源：Grid / Spreadsheet / Renderer / IO / PDF 都从这里取字体，
 * 保证「屏幕上看到的」和「打印/导出出来的」是同一套字形。
 */

import {
  buildCssFamily,
  type FontDescriptor,
  type FontFaceSource,
  type FontMetrics,
  type FontWeight,
  type IFontRegistry,
  type ResolvedFont,
} from '@sheetx/core'
import { isBrowser, loadFontFace, awaitFontsReady, type AssetResolver } from './loader.js'
import { parseTtf } from './ttf.js'
import { createPdfFontProgram, type PdfFontProgram } from './pdf.js'

export interface BuiltinFontSpec {
  family: string
  displayName: string
  license: string
  /** 相对 assets 的路径 */
  regular: string
  bold: string
}

/**
 * 内置字体清单。
 * 体积（精简子集）：思源黑体 ~920K/2.0M、思源宋体 ~1.4M、Inter ~0.9M/0.3M
 */
export const BUILTIN_FONTS: readonly BuiltinFontSpec[] = [
  {
    family: 'Source Han Serif CN',
    displayName: '思源宋体',
    license: 'SIL Open Font License 1.1',
    regular: 'source-han-serif/regular.ttf',
    bold: 'source-han-serif/bold.ttf',
  },
  {
    family: 'Source Han Sans CN',
    displayName: '思源黑体',
    license: 'SIL Open Font License 1.1',
    regular: 'source-han-sans/regular.ttf',
    bold: 'source-han-sans/bold.ttf',
  },
  {
    family: 'Inter',
    displayName: 'Inter',
    license: 'SIL Open Font License 1.1',
    regular: 'inter/regular.ttf',
    bold: 'inter/bold.ttf',
  },
]

/** 默认字体：思源宋体 Regular */
export const DEFAULT_BUILTIN_FONT = 'Source Han Serif CN'

/** 默认资源解析：基于包的 assets 目录（Vite / Rollup 可直接识别 new URL） */
function defaultAssetResolver(family: string, weight: FontWeight): string | undefined {
  const spec = BUILTIN_FONTS.find((item) => item.family === family)
  if (!spec) return undefined
  const rel = weight >= 600 ? spec.bold : spec.regular
  try {
    return new URL(`../assets/${rel}`, import.meta.url).href
  } catch {
    return undefined
  }
}

export class FontRegistry implements IFontRegistry {
  private fonts = new Map<string, FontDescriptor>()
  private defaultFamily = DEFAULT_BUILTIN_FONT
  private resolver: AssetResolver = defaultAssetResolver
  private binaryCache = new Map<string, Uint8Array>()
  private metricsCache = new Map<string, FontMetrics>()
  private registeredBuiltins = false

  /** 自定义资源解析（Node / CDN / 打包器特殊处理时使用） */
  setAssetResolver(resolver: AssetResolver): void {
    this.resolver = resolver
  }

  getAssetResolver(): AssetResolver {
    return this.resolver
  }

  /** 注册内置字体（幂等）。默认只注册，不立即加载字形。 */
  async registerBuiltins(options: { load?: boolean; weights?: FontWeight[] } = {}): Promise<void> {
    if (!this.registeredBuiltins) {
      for (const spec of BUILTIN_FONTS) {
        this.register({
          family: spec.family,
          displayName: spec.displayName,
          builtin: true,
          license: spec.license,
          faces: [
            { weight: 400, style: 'normal' },
            { weight: 700, style: 'normal' },
          ],
          cssFamily: buildCssFamily(spec.family),
        })
      }
      this.registeredBuiltins = true
    }
    if (options.load) {
      await awaitFontsReady()
      const weights = options.weights ?? [400]
      await Promise.all(
        BUILTIN_FONTS.flatMap((spec) => weights.map((weight) => this.loadFace(spec.family, weight))),
      )
    }
  }

  register(descriptor: FontDescriptor): void {
    if (!descriptor.family) throw new Error('[sheetx/fonts] register 需要 family')
    if (descriptor.faces.length === 0) throw new Error(`[sheetx/fonts] ${descriptor.family} 至少需要一个字重`)
    this.fonts.set(descriptor.family, {
      ...descriptor,
      cssFamily: descriptor.cssFamily ?? buildCssFamily(descriptor.family),
    })
  }

  /** 便捷注册：直接用字节注册自定义 TTF */
  registerFromBytes(options: {
    family: string
    displayName?: string
    weight?: FontWeight
    bytes: Uint8Array | ArrayBuffer
    license?: string
  }): void {
    const weight = options.weight ?? 400
    const data = options.bytes instanceof Uint8Array ? options.bytes : new Uint8Array(options.bytes)
    const existing = this.fonts.get(options.family)
    const face: FontFaceSource = { weight, data, byteLength: data.byteLength }
    const faces = existing ? [...existing.faces.filter((item) => item.weight !== weight), face] : [face]
    this.register({
      family: options.family,
      displayName: options.displayName ?? options.family,
      builtin: false,
      license: options.license,
      faces,
    })
    // 新字节注册后旧缓存失效
    this.binaryCache.delete(`${options.family}::${weight}`)
    this.metricsCache.delete(`${options.family}::${weight}`)
  }

  unregister(family: string): boolean {
    return this.fonts.delete(family)
  }

  get(family: string): FontDescriptor | undefined {
    return this.fonts.get(family)
  }

  list(): FontDescriptor[] {
    return [...this.fonts.values()]
  }

  /** 与用户设计稿一致的别名 */
  getAvailableFonts(): FontDescriptor[] {
    return this.list()
  }

  setDefault(family: string): void {
    if (!this.fonts.has(family)) {
      throw new Error(`[sheetx/fonts] 未注册的字体：${family}（请先 register 或 registerBuiltins）`)
    }
    this.defaultFamily = family
  }

  getDefault(): string {
    return this.defaultFamily
  }

  resolve(family?: string, weight: FontWeight = 400): ResolvedFont {
    const name = family && this.fonts.has(family) ? family : this.defaultFamily
    const descriptor = this.fonts.get(name)
    if (!descriptor) {
      return { family: name, weight, cssFamily: buildCssFamily(name) }
    }
    const face = descriptor.faces.find((item) => item.weight === weight) ?? descriptor.faces[0]
    return {
      family: name,
      weight,
      cssFamily: descriptor.cssFamily ?? buildCssFamily(name),
      face,
    }
  }

  /** 解析成 CSS font-family 字符串（最常用） */
  resolveCssFamily(family?: string, weight: FontWeight = 400): string {
    return this.resolve(family, weight).cssFamily
  }

  /** 载入某个字重到浏览器字体系统（幂等） */
  async loadFace(family: string, weight: FontWeight = 400): Promise<void> {
    const descriptor = this.fonts.get(family)
    if (!descriptor) return
    await loadFontFace(descriptor, weight, this.resolver)
  }

  /** 预加载（首屏前调用可避免闪烁） */
  async preload(entries: Array<{ family: string; weight?: FontWeight }>): Promise<void> {
    await Promise.all(entries.map((entry) => this.loadFace(entry.family, entry.weight ?? 400)))
    await awaitFontsReady()
  }

  /** 读取字形二进制（PDF 嵌入 / Node 测量） */
  async loadBinary(family: string, weight: FontWeight = 400): Promise<Uint8Array> {
    const key = `${family}::${weight}`
    const cached = this.binaryCache.get(key)
    if (cached) return cached

    const descriptor = this.fonts.get(family)
    if (!descriptor) throw new Error(`[sheetx/fonts] 未注册的字体：${family}`)
    const face = descriptor.faces.find((item) => item.weight === weight) ?? descriptor.faces[0]
    if (!face) throw new Error(`[sheetx/fonts] ${family} 缺少可用字重`)

    let bytes: Uint8Array
    if (face.data) {
      bytes = face.data instanceof Uint8Array ? face.data : new Uint8Array(face.data)
    } else {
      const resolved = this.resolver(family, weight)
      if (!resolved) throw new Error(`[sheetx/fonts] 无法解析字体资源：${family} ${weight}`)
      if (typeof resolved === 'string') {
        if (typeof fetch !== 'function') throw new Error('[sheetx/fonts] 当前环境无 fetch，请用 setAssetResolver 提供字节')
        const response = await fetch(resolved)
        if (!response.ok) throw new Error(`[sheetx/fonts] 字体下载失败 ${response.status}：${resolved}`)
        bytes = new Uint8Array(await response.arrayBuffer())
      } else {
        bytes = resolved.data instanceof Uint8Array ? resolved.data : new Uint8Array(resolved.data)
      }
    }
    this.binaryCache.set(key, bytes)
    return bytes
  }

  async loadMetrics(family: string, weight: FontWeight = 400): Promise<FontMetrics> {
    const key = `${family}::${weight}`
    const cached = this.metricsCache.get(key)
    if (cached) return cached
    const bytes = await this.loadBinary(family, weight)
    const parsed = parseTtf(bytes)
    const metrics: FontMetrics = {
      unitsPerEm: parsed.unitsPerEm,
      ascent: parsed.ascent,
      descent: parsed.descent,
      lineGap: parsed.lineGap,
      capHeight: parsed.capHeight,
      numGlyphs: parsed.numGlyphs,
    }
    this.metricsCache.set(key, metrics)
    return metrics
  }

  /** 取一份可直接塞进打印导出（SVG @font-face）的字体数据 */
  async getPrintableFont(
    family: string,
    weight: FontWeight = 400,
  ): Promise<{ family: string; weight: number; base64: string }> {
    const bytes = await this.loadBinary(family, weight)
    return { family, weight, base64: bytesToBase64(bytes) }
  }

  /**
   * 生成 PDF 字体嵌入程序（子集化 + FontFile2 + ToUnicode）。
   * @param text 文档中会出现的文本，用于子集化
   */
  async createPdfFont(family: string, text: string, weight: FontWeight = 400): Promise<PdfFontProgram> {
    const bytes = await this.loadBinary(family, weight)
    return createPdfFontProgram(bytes, text)
  }

  /** 当前环境是否支持浏览器字体加载 */
  get supportsFontFace(): boolean {
    return isBrowser()
  }

  /** 清空（测试用） */
  reset(): void {
    this.fonts.clear()
    this.binaryCache.clear()
    this.metricsCache.clear()
    this.registeredBuiltins = false
    this.defaultFamily = DEFAULT_BUILTIN_FONT
    this.resolver = defaultAssetResolver
  }
}

/** Uint8Array → base64（浏览器 / Node 通用，不依赖 Buffer） */
export function bytesToBase64(bytes: Uint8Array): string {
  const g = globalThis as { btoa?: (input: string) => string; Buffer?: { from: (input: Uint8Array) => { toString: (encoding: string) => string } } }
  if (typeof g.btoa === 'function') {
    let binary = ''
    const chunk = 0x8000
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
    }
    return g.btoa(binary)
  }
  if (g.Buffer) return g.Buffer.from(bytes).toString('base64')
  throw new Error('[sheetx/fonts] 当前环境不支持 base64 编码')
}

/** 全局单例：与用户设计稿的 `SheetXFonts.xxx` 用法一致 */
export const SheetXFonts = new FontRegistry()
