/**
 * @sheetx/fonts - PDF 字体嵌入（零依赖）
 *
 * 关键点：**TTF 格式本身不代表能嵌入 PDF**。要真正"带上字体"，必须：
 *   1) 子集化 → 只留用到字形（体积可控）
 *   2) 以 FontFile2 形式写进 FontDescriptor
 *   3) 用 CIDFontType2 + Identity-H（2 字节 CID = 字形号）排版
 *   4) 提供 ToUnicode，保证复制/搜索/无障碍能取回中文
 *
 * 本模块提供两层能力：
 * - `createPdfFontProgram()`：产出任意 PDF 引擎都能复用的嵌入数据（推荐集成点）
 * - `buildPdfWithLines()`：一个最小可用 PDF 生成器，用于自测/导出纯文本页
 */

import { parseTtf, type ParsedTtf } from './ttf.js'
import { subsetTtf } from './subset.js'

export interface PdfFontProgram {
  /** 子集化后的 TTF 字节（写进 FontFile2） */
  fontFile: Uint8Array
  /** PDF BaseFont 名（带 6 位子集前缀，如 ABCDEF+SourceHanSansCN-Regular） */
  baseFont: string
  /** PostScript 名（去空格） */
  postScriptName: string
  /** 每个新 glyphId 的宽度（1000 单位/em） */
  widths: number[]
  /** 新 glyphId → Unicode 码点（生成 ToUnicode） */
  toUnicode: Map<number, number>
  /** 字体度量（1000 单位/em） */
  metrics: { ascent: number; descent: number; capHeight: number; bbox: [number, number, number, number] }
  /** 原字号字体度量（未缩放，用于行高计算） */
  rawMetrics: { unitsPerEm: number; ascent: number; descent: number; lineGap: number; numGlyphs: number }
  /** 该字体是否覆盖某码点（多字体回退用） */
  hasCodePoint(cp: number): boolean
  /** 把字符串编码成 Identity-H 的十六进制串（每字 4 位 hex） */
  encodeHex(text: string): string
  /** 字符串在给定字号下的宽度（pt） */
  measure(text: string, fontSize: number): number
  /** 字体里缺失（会落到 .notdef）的码点，便于提前告警 */
  missing: number[]
  /** 子集统计 */
  stats: { originalGlyphs: number; subsetGlyphs: number; bytes: number; codePoints: number; missing: number }
  /** 源字体解析结果（供上层取更多信息） */
  source: ParsedTtf
}

const SUBSET_PREFIX_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function subsetPrefix(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  let prefix = ''
  for (let i = 0; i < 6; i++) {
    prefix += SUBSET_PREFIX_CHARS[hash % 26]!
    hash = Math.floor(hash / 26) + 7
  }
  return prefix
}

function missingCodePoints(ttf: ParsedTtf, codePoints: Set<number>): number[] {
  const missing: number[] = []
  for (const cp of codePoints) {
    if (!ttf.cmap.has(cp)) missing.push(cp)
  }
  return missing.sort((a, b) => a - b)
}

function collectCodePoints(text: string): Set<number> {
  const set = new Set<number>()
  for (const ch of text) {
    const cp = ch.codePointAt(0)
    if (cp !== undefined) set.add(cp)
  }
  return set
}

/**
 * 生成 PDF 字体嵌入程序。
 * @param fontBytes 原始 TTF 字节
 * @param text 文档中会出现的全部文本（用于子集化；传空则退化为"保留全部字形"）
 */
export function createPdfFontProgram(fontBytes: Uint8Array, text: string): PdfFontProgram {
  const ttf = parseTtf(fontBytes)
  const codePoints = collectCodePoints(text)

  // 没有任何文本时保留常用 ASCII，避免产出空字体
  if (codePoints.size === 0) {
    for (let cp = 32; cp < 127; cp++) codePoints.add(cp)
  }

  const subset = subsetTtf(ttf, codePoints)
  const scale = 1000 / ttf.unitsPerEm

  // 新 glyphId → advance（1000 单位/em）
  const newAdvances: number[] = []
  for (const [oldGid, newGid] of subset.glyphMap) {
    newAdvances[newGid] = Math.round((ttf.advances[oldGid] ?? 0) * scale)
  }
  const widths: number[] = []
  for (let gid = 0; gid < subset.subsetGlyphs; gid++) widths[gid] = newAdvances[gid] ?? 0

  // 新 glyphId → Unicode（优先 BMP 常用字；同字形多码点时取第一个）
  const toUnicode = new Map<number, number>()
  for (const cp of codePoints) {
    const oldGid = ttf.cmap.get(cp)
    if (oldGid === undefined) continue
    const newGid = subset.glyphMap.get(oldGid)
    if (newGid === undefined) continue
    if (!toUnicode.has(newGid)) toUnicode.set(newGid, cp)
  }

  const baseName = (ttf.postScriptName || ttf.familyName || 'SheetXFont').replace(/[\s()<>[\]{}%/]/g, '')
  const prefix = subsetPrefix(baseName + text.length)
  const baseFont = `${prefix}+${baseName}`

  const hasCodePoint = (cp: number): boolean => {
    const oldGid = ttf.cmap.get(cp)
    return oldGid !== undefined && subset.glyphMap.has(oldGid)
  }

  const encodeHex = (value: string): string => {
    let hex = ''
    for (const ch of value) {
      const cp = ch.codePointAt(0)
      if (cp === undefined) continue
      const oldGid = ttf.cmap.get(cp)
      const newGid = oldGid === undefined ? 0 : subset.glyphMap.get(oldGid) ?? 0
      hex += newGid.toString(16).padStart(4, '0').toUpperCase()
    }
    return hex
  }

  const measure = (value: string, fontSize: number): number => {
    let total = 0
    for (const ch of value) {
      const cp = ch.codePointAt(0)
      const oldGid = cp === undefined ? undefined : ttf.cmap.get(cp)
      const newGid = oldGid === undefined ? 0 : subset.glyphMap.get(oldGid) ?? 0
      total += widths[newGid] ?? 0
    }
    return (total * fontSize) / 1000
  }

  const missing = missingCodePoints(ttf, codePoints)

  return {
    fontFile: subset.data,
    baseFont,
    postScriptName: baseName,
    widths,
    toUnicode,
    metrics: {
      ascent: Math.round(ttf.ascent * scale),
      descent: Math.round(ttf.descent * scale),
      capHeight: Math.round((ttf.capHeight ?? ttf.ascent) * scale),
      bbox: [
        Math.round(ttf.bbox.xMin * scale),
        Math.round(ttf.bbox.yMin * scale),
        Math.round(ttf.bbox.xMax * scale),
        Math.round(ttf.bbox.yMax * scale),
      ],
    },
    rawMetrics: {
      unitsPerEm: ttf.unitsPerEm,
      ascent: ttf.ascent,
      descent: ttf.descent,
      lineGap: ttf.lineGap,
      numGlyphs: ttf.numGlyphs,
    },
    hasCodePoint,
    encodeHex,
    measure,
    missing,
    stats: {
      originalGlyphs: subset.originalGlyphs,
      subsetGlyphs: subset.subsetGlyphs,
      bytes: subset.data.length,
      codePoints: subset.codePoints,
      missing: missing.length,
    },
    source: ttf,
  }
}

// ---------------------------------------------------------------------------
// 最小 PDF 生成器（纯文本页 / 自测字体嵌入）
//
// 支持**多字体回退**：主字体缺字（如思源子集缺 ¥ · 空格）时，自动切到后备字体，
// 避免导出 PDF 出现空白/豆腐块。这是中文报表最常见的坑。
// ---------------------------------------------------------------------------

export interface PdfLine {
  text: string
  /** pt，默认 12 */
  fontSize?: number
  /** pt，距左边界，默认 48 */
  x?: number
  /** pt，距底部，默认自动向下排 */
  y?: number
}

export interface PdfDocumentOptions {
  lines: PdfLine[]
  /** 纸张 pt，默认 A4 */
  pageWidth?: number
  pageHeight?: number
  /** 文档标题（写入 Info） */
  title?: string
  /** 行距（字号倍数），默认 1.6 */
  lineHeight?: number
}

interface PdfObject {
  id: number
  body: string | Uint8Array
  stream?: boolean
}

function latin1(text: string): Uint8Array {
  const out = new Uint8Array(text.length)
  for (let i = 0; i < text.length; i++) out[i] = text.charCodeAt(i) & 0xff
  return out
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  let total = 0
  for (const part of parts) total += part.length
  const out = new Uint8Array(total)
  let offset = 0
  for (const part of parts) { out.set(part, offset); offset += part.length }
  return out
}

function buildToUnicodeCMap(program: PdfFontProgram): string {
  const entries = [...program.toUnicode.entries()].sort((a, b) => a[0] - b[0])
  const lines: string[] = [
    '/CIDInit /ProcSet findresource begin',
    '12 dict begin',
    'begincmap',
    '/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def',
    '/CMapName /Adobe-Identity-UCS def',
    '/CMapType 2 def',
    '1 begincodespacerange',
    '<0000> <FFFF>',
    'endcodespacerange',
  ]
  for (let i = 0; i < entries.length; i += 100) {
    const chunk = entries.slice(i, i + 100)
    lines.push(`${chunk.length} beginbfchar`)
    for (const [gid, cp] of chunk) {
      const gidHex = gid.toString(16).padStart(4, '0').toUpperCase()
      const uniHex = cp > 0xffff
        ? Array.from(new TextEncoder().encode(String.fromCodePoint(cp)))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')
            .toUpperCase()
        : cp.toString(16).padStart(4, '0').toUpperCase()
      lines.push(`<${gidHex}> <${uniHex}>`)
    }
    lines.push('endbfchar')
  }
  lines.push('endcmap', 'CMapName currentdict /CMap defineresource pop', 'end', 'end')
  return lines.join('\n')
}

function buildWidthsArray(widths: number[]): string {
  const parts: string[] = []
  for (let gid = 0; gid < widths.length; gid++) parts.push(`${gid} [${widths[gid] ?? 0}]`)
  return `[${parts.join(' ')}]`
}

/** 把一行文本按"哪个字体有这个字"切成若干 run */
function splitRuns(text: string, programs: PdfFontProgram[]): Array<{ text: string; fontIndex: number }> {
  const runs: Array<{ text: string; fontIndex: number }> = []
  for (const ch of text) {
    const cp = ch.codePointAt(0)
    if (cp === undefined) continue
    let index = programs.findIndex((program) => program.hasCodePoint(cp))
    if (index < 0) index = 0 // 全都没有：交给主字体（渲染为 .notdef）
    const last = runs[runs.length - 1]
    if (last && last.fontIndex === index) last.text += ch
    else runs.push({ text: ch, fontIndex: index })
  }
  return runs
}

/** 内嵌多个字体程序的 PDF 写入器 */
function writePdf(programs: PdfFontProgram[], options: PdfDocumentOptions): Uint8Array {
  const pageWidth = options.pageWidth ?? 595.28
  const pageHeight = options.pageHeight ?? 841.89
  const lineHeight = options.lineHeight ?? 1.6
  const left = 48
  const top = pageHeight - 72

  // 对象编号规划：1 catalog / 2 pages / 3 page / 4 contents / 5.. 字体组 / 最后 Info
  const fontIds = programs.map((_, index) => ({
    type0: 5 + index * 5,
    cid: 6 + index * 5,
    desc: 7 + index * 5,
    file: 8 + index * 5,
    toUnicode: 9 + index * 5,
  }))
  const infoId = 5 + programs.length * 5

  const contentParts: string[] = []
  let cursorY = top
  for (const line of options.lines) {
    const fontSize = line.fontSize ?? 12
    const y = line.y ?? cursorY
    let x = line.x ?? left
    for (const run of splitRuns(line.text, programs)) {
      const program = programs[run.fontIndex]!
      const hex = program.encodeHex(run.text)
      if (hex) {
        const resource = `F${run.fontIndex + 1}`
        contentParts.push(`BT /${resource} ${fontSize} Tf 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm <${hex}> Tj ET`)
        x += program.measure(run.text, fontSize)
      }
    }
    cursorY = y - fontSize * lineHeight
  }

  const objects: PdfObject[] = []
  objects.push({ id: 1, body: '<< /Type /Catalog /Pages 2 0 R >>' })
  objects.push({ id: 2, body: '<< /Type /Pages /Kids [3 0 R] /Count 1 >>' })

  const fontResources = programs
    .map((_, index) => `/F${index + 1} ${fontIds[index]!.type0} 0 R`)
    .join(' ')
  objects.push({
    id: 3,
    body: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << ${fontResources} >> >> /Contents 4 0 R >>`,
  })
  objects.push({ id: 4, body: latin1(contentParts.join('\n')), stream: true })

  programs.forEach((program, index) => {
    const ids = fontIds[index]!
    const m = program.metrics
    objects.push({
      id: ids.type0,
      body: `<< /Type /Font /Subtype /Type0 /BaseFont /${program.baseFont} /Encoding /Identity-H /DescendantFonts [${ids.cid} 0 R] /ToUnicode ${ids.toUnicode} 0 R >>`,
    })
    objects.push({
      id: ids.cid,
      body: `<< /Type /Font /Subtype /CIDFontType2 /BaseFont /${program.baseFont} /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /FontDescriptor ${ids.desc} 0 R /DW 1000 /W ${buildWidthsArray(program.widths)} /CIDToGIDMap /Identity >>`,
    })
    objects.push({
      id: ids.desc,
      body: `<< /Type /FontDescriptor /FontName /${program.baseFont} /Flags 4 /FontBBox [${m.bbox.join(' ')}] /ItalicAngle 0 /Ascent ${m.ascent} /Descent ${m.descent} /CapHeight ${m.capHeight} /StemV 80 /FontFile2 ${ids.file} 0 R >>`,
    })
    objects.push({ id: ids.file, body: program.fontFile, stream: true })
    objects.push({ id: ids.toUnicode, body: latin1(buildToUnicodeCMap(program)), stream: true })
  })

  objects.push({
    id: infoId,
    body: `<< /Title (${(options.title ?? 'SheetX Export').replace(/[()\\]/g, ' ')}) /Producer (SheetX Fonts) /Creator (SheetX) >>`,
  })

  // 序列化
  const chunks: Uint8Array[] = [latin1('%PDF-1.7\n%\xE2\xE3\xCF\xD3\n')]
  const offsets = new Map<number, number>()
  let length = chunks[0]!.length
  for (const obj of objects) {
    offsets.set(obj.id, length)
    const head = latin1(`${obj.id} 0 obj\n`)
    if (obj.stream) {
      const data = obj.body as Uint8Array
      const dict = latin1(`<< /Length ${data.length} >>\nstream\n`)
      const tail = latin1('\nendstream\nendobj\n')
      chunks.push(head, dict, data, tail)
      length += head.length + dict.length + data.length + tail.length
    } else {
      const body = latin1(`${obj.body as string}\nendobj\n`)
      chunks.push(head, body)
      length += head.length + body.length
    }
  }

  const xrefOffset = length
  const xrefLines: string[] = ['xref', `0 ${objects.length + 1}`, '0000000000 65535 f ']
  for (const obj of objects) {
    xrefLines.push(`${String(offsets.get(obj.id) ?? 0).padStart(10, '0')} 00000 n `)
  }
  const trailer = `${xrefLines.join('\n')}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info ${infoId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`
  chunks.push(latin1(trailer))
  return concatBytes(chunks)
}

/** 收集一份文档里所有会绘制的文本（子集化必须覆盖它们，否则会落到 .notdef） */
export function collectTextFromLines(lines: readonly PdfLine[]): string {
  return lines.map((line) => line.text).join('')
}

/**
 * 用已构建的字体程序生成 PDF（单字体）。
 * 注意：`program` 的子集必须覆盖 `options.lines` 的全部字符，否则缺字会变空白。
 * 不确定时请用 `buildPdfDocument()`。
 */
export function buildPdfWithLines(program: PdfFontProgram, options: PdfDocumentOptions): Uint8Array {
  return writePdf([program], options)
}

/**
 * 推荐入口：从字体字节（可多份，按优先级作回退链）+ 文档内容生成 PDF。
 * 自动按全文子集化，缺字自动切后备字体。
 *
 * @example
 * buildPdfDocument([sansBytes, interBytes], { lines: [...] })
 */
export function buildPdfDocument(fonts: Uint8Array | Uint8Array[], options: PdfDocumentOptions): Uint8Array {
  const list = Array.isArray(fonts) ? fonts : [fonts]
  const text = collectTextFromLines(options.lines)
  const programs = list.map((bytes) => createPdfFontProgram(bytes, text))
  return writePdf(programs, options)
}
