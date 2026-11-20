/**
 * @sheetx/fonts - TTF 子集化（零依赖）
 *
 * 目标：只保留「实际用到的字形」，把中文字体从 ~1MB 压到几十 KB 再嵌入 PDF。
 *
 * 处理范围：
 * - 字形闭包：复合字形（如「说」由 讠+兑 组成）会递归带上组件
 * - 重建表：glyf / loca / hmtx / cmap / head / hhea / maxp
 * - 其余表（name / OS2 / post / cvt / fpgm / prep / gasp ...）原样拷贝
 *
 * 不处理：CFF（OTF）、GSUB/GPOS、hinting 优化。
 */

import { readCompositeComponents, readGlyph, readLoca, type ParsedTtf } from './ttf.js'

export interface SubsetResult {
  data: Uint8Array
  /** 原 glyphId → 新 glyphId */
  glyphMap: Map<number, number>
  originalGlyphs: number
  subsetGlyphs: number
  /** 保留的 Unicode 码点数量 */
  codePoints: number
}

function u16(arr: Uint8Array, offset: number, value: number): void {
  arr[offset] = (value >> 8) & 0xff
  arr[offset + 1] = value & 0xff
}

function u32(arr: Uint8Array, offset: number, value: number): void {
  arr[offset] = (value >>> 24) & 0xff
  arr[offset + 1] = (value >>> 16) & 0xff
  arr[offset + 2] = (value >>> 8) & 0xff
  arr[offset + 3] = value & 0xff
}

/** 计算表校验和（按 4 字节累加，尾部补零） */
export function tableChecksum(data: Uint8Array): number {
  let sum = 0
  const len = data.length
  for (let i = 0; i < len; i += 4) {
    const b0 = data[i] ?? 0
    const b1 = data[i + 1] ?? 0
    const b2 = data[i + 2] ?? 0
    const b3 = data[i + 3] ?? 0
    sum = (sum + ((b0 << 24) | (b1 << 16) | (b2 << 8) | b3)) >>> 0
  }
  return sum >>> 0
}

/** 收集需要保留的 glyphId（含复合字形闭包） */
function collectGlyphs(ttf: ParsedTtf, codePoints: Set<number>): Set<number> {
  const loca = readLoca(ttf)
  const keep = new Set<number>([0]) // .notdef 必须保留
  for (const cp of codePoints) {
    const gid = ttf.cmap.get(cp)
    if (gid !== undefined && gid < ttf.numGlyphs) keep.add(gid)
  }
  // 递归补全复合字形组件
  const stack = [...keep]
  while (stack.length > 0) {
    const gid = stack.pop()!
    const glyph = readGlyph(ttf, gid, loca)
    if (glyph.length === 0) continue
    for (const component of readCompositeComponents(glyph)) {
      if (!keep.has(component) && component < ttf.numGlyphs) {
        keep.add(component)
        stack.push(component)
      }
    }
  }
  return keep
}

/** 重写复合字形中的组件 glyphId（改指向新编号） */
function rewriteComposite(glyph: Uint8Array, glyphMap: Map<number, number>): Uint8Array {
  const out = glyph.slice()
  if (out.length < 10) return out
  const dv = new DataView(out.buffer, out.byteOffset, out.byteLength)
  if (dv.getInt16(0) >= 0) return out // 简单字形
  let p = 10
  while (p + 4 <= out.length) {
    const flags = dv.getUint16(p)
    const oldGid = dv.getUint16(p + 2)
    const newGid = glyphMap.get(oldGid) ?? 0
    u16(out, p + 2, newGid)
    p += 4
    p += flags & 0x0001 ? 4 : 2
    if (flags & 0x0008) p += 2
    else if (flags & 0x0040) p += 4
    else if (flags & 0x0080) p += 8
    if (!(flags & 0x0020)) break
  }
  return out
}

/** 构建 format 4 cmap（BMP）；无法用线性映射的段会被拆分为单字符段 */
function buildCmapFormat4(entries: Array<[number, number]>, numGlyphs: number): Uint8Array {
  // entries: [codePoint, newGid]，已按 codePoint 升序
  const segments: Array<{ start: number; end: number; delta: number }> = []
  let i = 0
  while (i < entries.length) {
    const [start, startGid] = entries[i]!
    let end = start
    let j = i + 1
    while (j < entries.length) {
      const [cp, gid] = entries[j]!
      if (cp === end + 1 && gid === startGid + (cp - start)) {
        end = cp
        j++
      } else break
    }
    segments.push({ start, end, delta: (startGid - start) & 0xffff })
    i = j
  }
  // 结尾哨兵段
  segments.push({ start: 0xffff, end: 0xffff, delta: 1 })
  const segCount = segments.length
  const length = 16 + segCount * 8
  const out = new Uint8Array(length)
  u16(out, 0, 4)
  u16(out, 2, length)
  u16(out, 4, 0)
  u16(out, 6, segCount * 2)
  let pow = 1
  let entrySelector = 0
  while (pow * 2 <= segCount) { pow *= 2; entrySelector++ }
  u16(out, 8, pow * 2)
  u16(out, 10, entrySelector)
  u16(out, 12, segCount * 2 - pow * 2)
  const endBase = 14
  const startBase = endBase + segCount * 2 + 2
  const deltaBase = startBase + segCount * 2
  const rangeBase = deltaBase + segCount * 2
  for (let s = 0; s < segCount; s++) {
    const seg = segments[s]!
    u16(out, endBase + s * 2, seg.end)
    u16(out, startBase + s * 2, seg.start)
    u16(out, deltaBase + s * 2, seg.delta & 0xffff)
    u16(out, rangeBase + s * 2, 0)
  }
  void numGlyphs
  return out
}

/** 构建 format 12 cmap（覆盖全部 Unicode） */
function buildCmapFormat12(entries: Array<[number, number]>): Uint8Array {
  const groups: Array<{ start: number; end: number; startGid: number }> = []
  let i = 0
  while (i < entries.length) {
    const [start, startGid] = entries[i]!
    let end = start
    let j = i + 1
    while (j < entries.length) {
      const [cp, gid] = entries[j]!
      if (cp === end + 1 && gid === startGid + (cp - start)) {
        end = cp
        j++
      } else break
    }
    groups.push({ start, end, startGid })
    i = j
  }
  const length = 16 + groups.length * 12
  const out = new Uint8Array(length)
  u16(out, 0, 12)
  u16(out, 2, 0)
  u32(out, 4, length)
  u32(out, 8, 0)
  u32(out, 12, groups.length)
  let p = 16
  for (const g of groups) {
    u32(out, p, g.start)
    u32(out, p + 4, g.end)
    u32(out, p + 8, g.startGid)
    p += 12
  }
  return out
}

/** 组装 cmap 表（含子表目录） */
function buildCmapTable(entries: Array<[number, number]>, numGlyphs: number): Uint8Array {
  const maxCp = entries.length > 0 ? entries[entries.length - 1]![0] : 0
  const useFormat12 = maxCp > 0xfffe
  const sub = useFormat12 ? buildCmapFormat12(entries) : buildCmapFormat4(entries, numGlyphs)
  const header = 4 + 1 * 8
  const out = new Uint8Array(header + sub.length)
  u16(out, 0, 0)
  u16(out, 2, 1)
  u16(out, 4, useFormat12 ? 3 : 3)
  u16(out, 6, useFormat12 ? 10 : 1)
  u32(out, 8, header)
  out.set(sub, header)
  return out
}

/** 组装 sfnt（表目录 + 表数据，4 字节对齐 + head.checkSumAdjustment） */
function assembleSfnt(sfntVersion: number, tables: Map<string, Uint8Array>): Uint8Array {
  const tags = [...tables.keys()].sort()
  const numTables = tags.length
  let total = 12 + numTables * 16
  for (const tag of tags) total += Math.ceil(tables.get(tag)!.length / 4) * 4

  const out = new Uint8Array(total)
  u32(out, 0, sfntVersion)
  u16(out, 4, numTables)
  let pow = 1
  let entrySelector = 0
  while (pow * 2 <= numTables) { pow *= 2; entrySelector++ }
  u16(out, 6, pow * 16)
  u16(out, 8, entrySelector)
  u16(out, 10, numTables * 16 - pow * 16)

  let offset = 12 + numTables * 16
  tags.forEach((tag, index) => {
    const data = tables.get(tag)!
    const rec = 12 + index * 16
    for (let i = 0; i < 4; i++) out[rec + i] = tag.charCodeAt(i)
    u32(out, rec + 4, tableChecksum(data))
    u32(out, rec + 8, offset)
    u32(out, rec + 12, data.length)
    out.set(data, offset)
    // 表尾补零（已在分配时保证空间）
    offset += Math.ceil(data.length / 4) * 4
  })

  // head.checkSumAdjustment = 0xB1B0AFBA - fileChecksum
  const headOffset = findTableOffset(out, 'head')
  if (headOffset >= 0) {
    u32(out, headOffset + 8, 0)
    const sum = tableChecksum(out)
    u32(out, headOffset + 8, (0xb1b0afba - sum) >>> 0)
  }
  return out
}

function findTableOffset(sfnt: Uint8Array, tag: string): number {
  const dv = new DataView(sfnt.buffer, sfnt.byteOffset, sfnt.byteLength)
  const numTables = dv.getUint16(4)
  for (let i = 0; i < numTables; i++) {
    const rec = 12 + i * 16
    const t = String.fromCharCode(sfnt[rec]!, sfnt[rec + 1]!, sfnt[rec + 2]!, sfnt[rec + 3]!)
    if (t === tag) return dv.getUint32(rec + 8)
  }
  return -1
}

/**
 * 按码点集合做子集化。
 * @param ttf 已解析字体
 * @param codePoints 需要保留的 Unicode 码点（自动附加 .notdef）
 */
export function subsetTtf(ttf: ParsedTtf, codePoints: Iterable<number>): SubsetResult {
  const wanted = new Set<number>()
  for (const cp of codePoints) {
    if (Number.isFinite(cp) && cp >= 0) wanted.add(cp)
  }
  const keep = collectGlyphs(ttf, wanted)

  // 新编号：按原 gid 升序，保证 .notdef 在最前
  const sortedGids = [...keep].sort((a, b) => a - b)
  const glyphMap = new Map<number, number>()
  sortedGids.forEach((gid, index) => glyphMap.set(gid, index))
  const newNumGlyphs = sortedGids.length

  const loca = readLoca(ttf)
  // 1) glyf + loca
  const glyphDatas: Uint8Array[] = []
  const newLoca: number[] = [0]
  let cursor = 0
  for (const oldGid of sortedGids) {
    let glyph = readGlyph(ttf, oldGid, loca)
    if (glyph.length > 0) {
      glyph = rewriteComposite(glyph, glyphMap)
    }
    const padded = new Uint8Array(Math.ceil(glyph.length / 4) * 4)
    padded.set(glyph, 0)
    glyphDatas.push(padded)
    cursor += padded.length
    newLoca.push(cursor)
  }
  const glyfLength = cursor
  const glyf = new Uint8Array(glyfLength)
  {
    let p = 0
    for (const g of glyphDatas) { glyf.set(g, p); p += g.length }
  }
  const useShortLoca = glyfLength <= 0x1fffe
  const locaBytes = useShortLoca ? new Uint8Array((newNumGlyphs + 1) * 2) : new Uint8Array((newNumGlyphs + 1) * 4)
  for (let i = 0; i <= newNumGlyphs; i++) {
    if (useShortLoca) u16(locaBytes, i * 2, Math.floor(newLoca[i]! / 2))
    else u32(locaBytes, i * 4, newLoca[i]!)
  }

  // 2) hmtx（全部写成 longHorMetric，简单可靠）
  const hmtxDv = new DataView(ttf.data.buffer, ttf.data.byteOffset, ttf.data.byteLength)
  const hmtx = ttf.tables.get('hmtx')!
  const hhea = ttf.tables.get('hhea')!
  const numberOfHMetrics = hmtxDv.getUint16(hhea.offset + 34)
  const hmtxBytes = new Uint8Array(newNumGlyphs * 4)
  sortedGids.forEach((oldGid, index) => {
    const advance = ttf.advances[oldGid] ?? 0
    let lsb: number
    if (oldGid < numberOfHMetrics) {
      lsb = hmtxDv.getInt16(hmtx.offset + oldGid * 4 + 2)
    } else {
      lsb = hmtxDv.getInt16(hmtx.offset + numberOfHMetrics * 4 + (oldGid - numberOfHMetrics) * 2)
    }
    u16(hmtxBytes, index * 4, advance)
    u16(hmtxBytes, index * 4 + 2, lsb & 0xffff)
  })

  // 3) cmap
  const entries: Array<[number, number]> = []
  for (const cp of [...wanted].sort((a, b) => a - b)) {
    const newGid = glyphMap.get(ttf.cmap.get(cp) ?? -1)
    if (newGid !== undefined) entries.push([cp, newGid])
  }
  const cmap = buildCmapTable(entries, newNumGlyphs)

  // 4) head / hhea / maxp 打补丁
  const head = ttf.data.subarray(ttf.tables.get('head')!.offset, ttf.tables.get('head')!.offset + ttf.tables.get('head')!.length).slice()
  {
    const dv = new DataView(head.buffer, head.byteOffset, head.byteLength)
    dv.setInt16(50, useShortLoca ? 0 : 1)
    dv.setUint32(8, 0) // checkSumAdjustment 交给 assembleSfnt
  }
  const hheaBytes = ttf.data.subarray(hhea.offset, hhea.offset + hhea.length).slice()
  {
    const dv = new DataView(hheaBytes.buffer, hheaBytes.byteOffset, hheaBytes.byteLength)
    dv.setUint16(34, newNumGlyphs)
  }
  const maxpTable = ttf.tables.get('maxp')!
  const maxp = ttf.data.subarray(maxpTable.offset, maxpTable.offset + maxpTable.length).slice()
  {
    const dv = new DataView(maxp.buffer, maxp.byteOffset, maxp.byteLength)
    dv.setUint16(4, newNumGlyphs)
  }

  // 5) 其余表：只保留 PDF/光栅化必需的小表
  //
  // 必须丢弃的"大表"：GSUB / GPOS / GDEF（复杂排版，PDF 用 Identity-H 不做字距连字）、
  // DSIG（签名必然失效）、COLR/CPAL/SVG /sbix（彩色字形）。
  // 否则子集化后体积几乎不降（Inter 的 GSUB+GPOS 就有几百 KB）。
  const DROP = new Set([
    'GSUB', 'GPOS', 'GDEF', 'DSIG', 'BASE', 'JSTF', 'MATH',
    'COLR', 'CPAL', 'SVG ', 'sbix', 'EBDT', 'EBLC', 'CBDT', 'CBLC',
    'kern', 'VDMX', 'hdmx', 'LTSH', 'meta', 'STAT', 'avar', 'fvar', 'gvar', 'HVAR', 'MVAR',
  ])
  const tables = new Map<string, Uint8Array>()
  tables.set('head', head)
  tables.set('hhea', hheaBytes)
  tables.set('maxp', maxp)
  tables.set('hmtx', hmtxBytes)
  tables.set('cmap', cmap)
  tables.set('glyf', glyf)
  tables.set('loca', locaBytes)
  // post 降级为 3.0（丢弃字形名，省几十 KB）
  const postTable = ttf.tables.get('post')
  if (postTable && postTable.length >= 32) {
    const post = ttf.data.subarray(postTable.offset, postTable.offset + 32).slice()
    const dv = new DataView(post.buffer, post.byteOffset, post.byteLength)
    dv.setUint32(0, 0x00030000)
    tables.set('post', post)
  }
  for (const [tag, rec] of ttf.tables) {
    if (tables.has(tag)) continue
    if (DROP.has(tag)) continue
    tables.set(tag, ttf.data.subarray(rec.offset, rec.offset + rec.length).slice())
  }

  const data = assembleSfnt(ttf.sfntVersion === 0x4f54544f ? 0x4f54544f : 0x00010000, tables)
  return {
    data,
    glyphMap,
    originalGlyphs: ttf.numGlyphs,
    subsetGlyphs: newNumGlyphs,
    codePoints: entries.length,
  }
}
