/**
 * @sheetx/fonts - 极简 TTF 解析器（零依赖）
 *
 * 只解析 SheetX 真正需要的表：
 * - head  : unitsPerEm / 包围盒 / loca 格式
 * - hhea  : ascent / descent / lineGap / numberOfHMetrics
 * - maxp  : numGlyphs
 * - cmap  : codePoint → glyphId（format 4 / 12）
 * - hmtx  : 每个字形的 advance width
 * - name  : familyName / postScriptName
 * - OS/2  : fsType（PDF 嵌入许可）/ capHeight
 *
 * 不做：GSUB/GPOS（排版）、CFF 轮廓（OTF）、变量字体。
 */

export interface TtfTableRecord {
  tag: string
  checksum: number
  offset: number
  length: number
}

export interface ParsedTtf {
  data: Uint8Array
  sfntVersion: number
  tables: Map<string, TtfTableRecord>
  unitsPerEm: number
  numGlyphs: number
  ascent: number
  descent: number
  lineGap: number
  capHeight?: number
  indexToLocFormat: number
  bbox: { xMin: number; yMin: number; xMax: number; yMax: number }
  postScriptName: string
  familyName: string
  /** codePoint → glyphId */
  cmap: Map<number, number>
  /** glyphId → advance（字体单位） */
  advances: number[]
  /** OS/2 fsType；0 表示可自由嵌入 */
  fsType: number
}

function view(data: Uint8Array): DataView {
  return new DataView(data.buffer, data.byteOffset, data.byteLength)
}

function tagAt(data: Uint8Array, offset: number): string {
  return String.fromCharCode(data[offset]!, data[offset + 1]!, data[offset + 2]!, data[offset + 3]!)
}

/** 解析表目录 */
export function readTables(data: Uint8Array): Map<string, TtfTableRecord> {
  const dv = view(data)
  const numTables = dv.getUint16(4)
  const tables = new Map<string, TtfTableRecord>()
  for (let i = 0; i < numTables; i++) {
    const base = 12 + i * 16
    const tag = tagAt(data, base)
    tables.set(tag, {
      tag,
      checksum: dv.getUint32(base + 4),
      offset: dv.getUint32(base + 8),
      length: dv.getUint32(base + 12),
    })
  }
  return tables
}

/** 解析 name 表，返回 nameID → 文本 */
function readNames(data: Uint8Array, table: TtfTableRecord): Map<number, string> {
  const dv = view(data)
  const result = new Map<number, string>()
  const count = dv.getUint16(table.offset + 2)
  const stringOffset = table.offset + dv.getUint16(table.offset + 4)
  for (let i = 0; i < count; i++) {
    const rec = table.offset + 6 + i * 12
    const platformID = dv.getUint16(rec)
    const encodingID = dv.getUint16(rec + 2)
    const nameID = dv.getUint16(rec + 6)
    const length = dv.getUint16(rec + 8)
    const offset = stringOffset + dv.getUint16(rec + 10)
    // 只取 Unicode（平台 0/3）且非 0 长度
    if (length === 0) continue
    if (platformID !== 0 && platformID !== 3) continue
    let text = ''
    if (platformID === 3 && encodingID === 1) {
      // UTF-16BE
      for (let j = 0; j < length; j += 2) {
        text += String.fromCharCode(dv.getUint16(offset + j))
      }
    } else {
      for (let j = 0; j < length; j++) text += String.fromCharCode(data[offset + j]!)
    }
    if (!result.has(nameID)) result.set(nameID, text)
  }
  return result
}

/** 解析 cmap（优先 format 12 → 覆盖全部 Unicode；退回 format 4） */
function readCmap(data: Uint8Array, table: TtfTableRecord): Map<number, number> {
  const dv = view(data)
  const numSubtables = dv.getUint16(table.offset + 2)
  const map = new Map<number, number>()
  let best: number | null = null
  let bestScore = -1
  for (let i = 0; i < numSubtables; i++) {
    const rec = table.offset + 4 + i * 8
    const platformID = dv.getUint16(rec)
    const encodingID = dv.getUint16(rec + 2)
    const subOffset = table.offset + dv.getUint32(rec + 4)
    const format = dv.getUint16(subOffset)
    // 优先 (3,10) format12 > (3,1) format4 > (0,x)
    let score = 0
    if (format === 12) score = platformID === 3 && encodingID === 10 ? 100 : 60
    else if (format === 4) score = platformID === 3 && encodingID === 1 ? 80 : 40
    if (score > bestScore) {
      bestScore = score
      best = subOffset
    }
  }
  if (best === null) return map
  const format = dv.getUint16(best)
  if (format === 4) {
    const segCountX2 = dv.getUint16(best + 6)
    const segCount = segCountX2 / 2
    const endCodes = best + 14
    const startCodes = endCodes + segCountX2 + 2
    const idDeltas = startCodes + segCountX2
    const idRangeOffsets = idDeltas + segCountX2
    for (let i = 0; i < segCount; i++) {
      const end = dv.getUint16(endCodes + i * 2)
      const start = dv.getUint16(startCodes + i * 2)
      const delta = dv.getInt16(idDeltas + i * 2)
      const rangeOffset = dv.getUint16(idRangeOffsets + i * 2)
      if (start === 0xffff && end === 0xffff) break
      for (let cp = start; cp <= end && cp !== 0xffff; cp++) {
        let gid: number
        if (rangeOffset === 0) {
          gid = (cp + delta) & 0xffff
        } else {
          const addr = idRangeOffsets + i * 2 + rangeOffset + (cp - start) * 2
          if (addr + 2 > data.byteLength) continue
          gid = dv.getUint16(addr)
          if (gid !== 0) gid = (gid + delta) & 0xffff
        }
        if (gid !== 0 && !map.has(cp)) map.set(cp, gid)
      }
    }
  } else if (format === 12) {
    const numGroups = dv.getUint32(best + 12)
    let p = best + 16
    for (let i = 0; i < numGroups; i++) {
      const start = dv.getUint32(p)
      const end = dv.getUint32(p + 4)
      const startGid = dv.getUint32(p + 8)
      for (let cp = start; cp <= end; cp++) {
        if (!map.has(cp)) map.set(cp, startGid + (cp - start))
      }
      p += 12
    }
  }
  return map
}

/** 解析整份 TTF 的常用信息 */
export function parseTtf(data: Uint8Array): ParsedTtf {
  const dv = view(data)
  const sfntVersion = dv.getUint32(0)
  const tables = readTables(data)

  const head = tables.get('head')
  const hhea = tables.get('hhea')
  const maxp = tables.get('maxp')
  const hmtx = tables.get('hmtx')
  const cmapTable = tables.get('cmap')
  const nameTable = tables.get('name')
  const os2 = tables.get('OS/2')

  if (!head || !hhea || !maxp || !hmtx) {
    throw new Error('[sheetx/fonts] 不是有效的 TTF：缺少 head/hhea/maxp/hmtx')
  }

  const unitsPerEm = dv.getUint16(head.offset + 18)
  const indexToLocFormat = dv.getInt16(head.offset + 50)
  const bbox = {
    xMin: dv.getInt16(head.offset + 36),
    yMin: dv.getInt16(head.offset + 38),
    xMax: dv.getInt16(head.offset + 40),
    yMax: dv.getInt16(head.offset + 42),
  }
  const numGlyphs = dv.getUint16(maxp.offset + 4)
  const ascent = dv.getInt16(hhea.offset + 4)
  const descent = dv.getInt16(hhea.offset + 6)
  const lineGap = dv.getInt16(hhea.offset + 8)
  const numberOfHMetrics = dv.getUint16(hhea.offset + 34)

  // hmtx：前 numberOfHMetrics 个是 (advance, lsb)，其余只有 lsb
  const advances: number[] = new Array(numGlyphs)
  for (let i = 0; i < numGlyphs; i++) {
    const idx = Math.min(i, numberOfHMetrics - 1)
    advances[i] = dv.getUint16(hmtx.offset + idx * 4)
  }

  const cmap = cmapTable ? readCmap(data, cmapTable) : new Map<number, number>()

  let familyName = ''
  let postScriptName = ''
  if (nameTable) {
    const names = readNames(data, nameTable)
    familyName = names.get(1) ?? ''
    postScriptName = names.get(6) ?? ''
  }

  let capHeight: number | undefined
  let fsType = 0
  if (os2 && os2.length >= 10) {
    const version = dv.getUint16(os2.offset)
    fsType = dv.getUint16(os2.offset + 8)
    if (version >= 2 && os2.length >= 90) capHeight = dv.getInt16(os2.offset + 88)
  }

  return {
    data,
    sfntVersion,
    tables,
    unitsPerEm,
    numGlyphs,
    ascent,
    descent,
    lineGap,
    capHeight,
    indexToLocFormat,
    bbox,
    postScriptName,
    familyName,
    cmap,
    advances,
    fsType,
  }
}

/** 读取 loca 表为偏移数组（numGlyphs + 1 项） */
export function readLoca(ttf: ParsedTtf): number[] {
  const loca = ttf.tables.get('loca')
  if (!loca) throw new Error('[sheetx/fonts] 缺少 loca 表')
  const dv = view(ttf.data)
  const offsets: number[] = new Array(ttf.numGlyphs + 1)
  if (ttf.indexToLocFormat === 0) {
    for (let i = 0; i <= ttf.numGlyphs; i++) offsets[i] = dv.getUint16(loca.offset + i * 2) * 2
  } else {
    for (let i = 0; i <= ttf.numGlyphs; i++) offsets[i] = dv.getUint32(loca.offset + i * 4)
  }
  return offsets
}

/** 取单个字形的 glyf 字节 */
export function readGlyph(ttf: ParsedTtf, glyphId: number, loca: number[]): Uint8Array {
  const glyf = ttf.tables.get('glyf')
  if (!glyf) throw new Error('[sheetx/fonts] 缺少 glyf 表')
  const start = loca[glyphId] ?? 0
  const end = loca[glyphId + 1] ?? start
  if (end <= start) return new Uint8Array(0)
  return ttf.data.subarray(glyf.offset + start, glyf.offset + end)
}

/** 复合字形的组件 glyphId 列表（用于子集化的闭包计算） */
export function readCompositeComponents(glyph: Uint8Array): number[] {
  if (glyph.length < 10) return []
  const dv = view(glyph)
  const numberOfContours = dv.getInt16(0)
  if (numberOfContours >= 0) return []
  const result: number[] = []
  let p = 10
  while (p + 4 <= glyph.length) {
    const flags = dv.getUint16(p)
    const glyphIndex = dv.getUint16(p + 2)
    result.push(glyphIndex)
    p += 4
    p += flags & 0x0001 ? 4 : 2 // ARG_1_AND_2_ARE_WORDS
    // 变换矩阵
    if (flags & 0x0008) p += 2 // WE_HAVE_A_SCALE
    else if (flags & 0x0040) p += 4 // X_AND_Y_SCALE
    else if (flags & 0x0080) p += 8 // 2x2
    if (!(flags & 0x0020)) break // MORE_COMPONENTS
  }
  return result
}
