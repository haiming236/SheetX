/**
 * @sheetx/fonts - 字体加载器
 *
 * 职责：
 * - 把 TTF 注册进浏览器的字体系统（FontFace），使 Canvas / DOM 都能用；
 * - 等待 `document.fonts.ready`，避免"字体没加载完就测量/绘制"导致宽度错乱；
 * - 在 Node / Worker（无 document）环境下安全降级。
 *
 * 设计取舍：不在这里做任何打包器相关的事（如 `?url` 导入），
 * 资源地址通过 resolver 注入，保证同一份代码在 Vite / Webpack / Node 都能跑。
 */

import type { FontDescriptor, FontFaceSource, FontWeight } from '@sheetx/core'

/** 资源解析：把一个字体面解析成 URL 或原始字节 */
export type AssetResolver = (
  family: string,
  weight: FontWeight,
) => string | { data: ArrayBuffer | Uint8Array; mime?: string } | undefined

export interface LoadOptions {
  /** 超时（ms），默认 8000；超时不抛错，只标记失败 */
  timeout?: number
  /** 是否在失败时抛错，默认 false（字体缺失应优雅回退系统字体） */
  rejectOnError?: boolean
}

const faceCache = new Map<string, Promise<void>>()

function cacheKey(family: string, weight: FontWeight): string {
  return `${family}::${weight}`
}

export function isBrowser(): boolean {
  return typeof document !== 'undefined' && typeof (globalThis as { FontFace?: unknown }).FontFace === 'function'
}

/** 等待浏览器字体系统就绪（Node 环境直接 resolve） */
export async function awaitFontsReady(): Promise<void> {
  if (!isBrowser()) return
  const fonts = (document as Document & { fonts?: FontFaceSet }).fonts
  if (!fonts) return
  try {
    await fonts.ready
  } catch {
    /* 忽略：ready 在极端情况下可能 reject */
  }
}

/**
 * FontFace 的 source 必须是 CSS src 语法（`url("...")`），
 * 直接传裸 URL 会抛 "The string did not match the expected pattern"。
 */
function toCssUrl(url: string): string {
  const trimmed = url.trim()
  if (/^(url|local)\(/i.test(trimmed)) return trimmed
  return `url("${trimmed.replace(/"/g, '\\"')}")`
}

function toSource(fontFace: FontFaceSource, resolved: ReturnType<AssetResolver>): string | ArrayBuffer | Uint8Array | null {
  if (resolved) {
    if (typeof resolved === 'string') return toCssUrl(resolved)
    return resolved.data
  }
  if (fontFace.data) return fontFace.data
  if (fontFace.url) return toCssUrl(fontFace.url)
  return null
}

/**
 * 载入一个字体面（幂等，重复调用共享同一个 Promise）。
 * @param descriptor 字体描述符（用 family 作为 CSS 家族名）
 * @param weight 字重
 */
export function loadFontFace(
  descriptor: FontDescriptor,
  weight: FontWeight,
  resolver: AssetResolver,
  options: LoadOptions = {},
): Promise<void> {
  const key = cacheKey(descriptor.family, weight)
  const cached = faceCache.get(key)
  if (cached) return cached

  const fontFace = descriptor.faces.find((face) => face.weight === weight) ?? descriptor.faces[0]
  if (!fontFace) return Promise.resolve()

  // Node / 无 FontFace：无需注册，直接完成（PDF 嵌入走 loadBinary）
  if (!isBrowser()) {
    faceCache.set(key, Promise.resolve())
    return Promise.resolve()
  }

  let resolved: ReturnType<AssetResolver>
  try {
    resolved = resolver(descriptor.family, weight)
  } catch (error) {
    console.warn('[sheetx/fonts] resolver 抛错', descriptor.family, weight, error)
    return Promise.resolve()
  }
  const source = toSource(fontFace, resolved)
  if (source === null) {
    console.warn('[sheetx/fonts] 未解析到字体资源（resolver 无返回）', descriptor.family, weight)
    return Promise.resolve()
  }

  const timeout = options.timeout ?? 8000
  const task = (async () => {
    const face = new FontFace(descriptor.family, source as string | BufferSource, {
      weight: String(weight),
      style: fontFace.style ?? 'normal',
      display: 'swap',
    })
    const guard = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`[sheetx/fonts] 字体加载超时：${descriptor.family} ${weight}`)), timeout)
    })
    try {
      await Promise.race([face.load(), guard])
      ;(document as Document & { fonts?: FontFaceSet }).fonts?.add(face)
      await awaitFontsReady()
    } catch (error) {
      console.warn('[sheetx/fonts] FontFace 加载失败', descriptor.family, weight, error)
      if (options.rejectOnError) throw error
      // 失败不阻断：resolve 后由调用方回退系统字体
    }
  })()

  faceCache.set(key, task)
  return task
}

/** 是否已加载（浏览器环境检查 CSS 可用性） */
export function isFontFaceLoaded(family: string, weight: FontWeight = 400): boolean {
  if (!isBrowser()) return false
  const fonts = (document as Document & { fonts?: FontFaceSet }).fonts
  if (!fonts) return false
  return fonts.check(`${weight} 12px "${family}"`)
}

/** 清空缓存（测试用） */
export function resetFontFaceCache(): void {
  faceCache.clear()
}
