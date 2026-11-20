/**
 * @sheetx/fonts 单测
 *
 * 覆盖：
 * 1. TTF 解析（度量 / 字形数 / cmap 覆盖）
 * 2. 子集化（字形数骤减、子集可再次解析、cmap 映射正确）
 * 3. PDF 字体程序（FontFile2 字节、widths、ToUnicode、encodeHex）
 * 4. PDF 文档结构（含 CIDFontType2 / FontFile2 / ToUnicode）
 * 5. 注册表（注册 / 默认字体 / resolve 回退 / 自定义字节注册）
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it, beforeEach } from 'vitest'
import { parseTtf } from '../src/ttf.js'
import { subsetTtf } from '../src/subset.js'
import { createPdfFontProgram, buildPdfWithLines, buildPdfDocument, collectTextFromLines } from '../src/pdf.js'
import { FontRegistry } from '../src/registry.js'

function readAsset(rel: string): Uint8Array {
  const path = fileURLToPath(new URL(`../assets/${rel}`, import.meta.url))
  return new Uint8Array(readFileSync(path))
}

const SANS = readAsset('source-han-sans/regular.ttf')
const SANS_BOLD = readAsset('source-han-sans/bold.ttf')
const SERIF = readAsset('source-han-serif/regular.ttf')
const INTER = readAsset('inter/regular.ttf')

/** Uint8Array → 字符串（用于断言 PDF 内部结构） */
function latin1(bytes: Uint8Array): string {
  let out = ''
  for (let i = 0; i < bytes.length; i++) out += String.fromCharCode(bytes[i]!)
  return out
}

describe('TTF 解析', () => {
  it('解析思源黑体基础信息', () => {
    const ttf = parseTtf(SANS)
    expect(ttf.unitsPerEm).toBeGreaterThan(0)
    expect(ttf.numGlyphs).toBeGreaterThan(100)
    expect(ttf.familyName.length).toBeGreaterThan(0)
    expect(ttf.postScriptName.length).toBeGreaterThan(0)
    expect(ttf.cmap.size).toBeGreaterThan(1000)
    expect(ttf.advances.length).toBe(ttf.numGlyphs)
  })

  it('中文与 ASCII 都能映射到字形', () => {
    const ttf = parseTtf(SANS)
    const cps = ['中', '文', '表', '格', 'A', '1'].map((ch) => ch.codePointAt(0)!)
    for (const cp of cps) {
      expect(ttf.cmap.get(cp), `码点 ${cp} 应有字形`).toBeGreaterThan(0)
    }
  })

  it('三种字体都能解析', () => {
    for (const bytes of [SANS, SANS_BOLD, SERIF, INTER]) {
      const ttf = parseTtf(bytes)
      expect(ttf.numGlyphs).toBeGreaterThan(50)
    }
  })
})

describe('TTF 子集化', () => {
  it('只保留用到的字形，体积显著下降', () => {
    const ttf = parseTtf(SANS)
    const text = '销售额完成率负责人备注'
    const subset = subsetTtf(ttf, [...text].map((ch) => ch.codePointAt(0)!))

    expect(subset.subsetGlyphs).toBeLessThan(60)
    expect(subset.originalGlyphs).toBeGreaterThan(subset.subsetGlyphs)
    expect(subset.data.length).toBeLessThan(SANS.length / 4)

    // 子集本身必须是合法 TTF（能被再次解析）
    const reparsed = parseTtf(subset.data)
    expect(reparsed.numGlyphs).toBe(subset.subsetGlyphs)
    expect(reparsed.cmap.get('销'.codePointAt(0)!)).toBeGreaterThan(0)
    expect(reparsed.cmap.get('额'.codePointAt(0)!)).toBeGreaterThan(0)
  })

  it('复合字形会带上组件（闭包）', () => {
    // Inter 的 é 是复合字形（e + 重音符）；思源系列中文为扁平轮廓，无复合字形
    const ttf = parseTtf(INTER)
    const subset = subsetTtf(ttf, ['é'.codePointAt(0)!])
    const reparsed = parseTtf(subset.data)
    expect(reparsed.cmap.get('é'.codePointAt(0)!)).toBeGreaterThan(0)
    // 闭包含组件：不止 .notdef + é
    expect(subset.subsetGlyphs).toBeGreaterThan(2)
  })

  it('中文子集只保留用到的字形（思源为扁平轮廓）', () => {
    const ttf = parseTtf(SANS)
    const subset = subsetTtf(ttf, ['说'.codePointAt(0)!])
    expect(subset.subsetGlyphs).toBe(2) // .notdef + 说
    const reparsed = parseTtf(subset.data)
    expect(reparsed.cmap.get('说'.codePointAt(0)!)).toBeGreaterThan(0)
  })

  it('ASCII 子集也能正常工作', () => {
    const ttf = parseTtf(INTER)
    const subset = subsetTtf(ttf, [...'SheetX 123'].map((ch) => ch.codePointAt(0)!))
    const reparsed = parseTtf(subset.data)
    expect(reparsed.cmap.get('S'.codePointAt(0)!)).toBeGreaterThan(0)
    expect(reparsed.advances.length).toBe(subset.subsetGlyphs)
  })
})

describe('PDF 字体嵌入程序', () => {
  const text = 'SheetX 销售报表 2026'

  it('生成子集字体 + 宽度 + ToUnicode', () => {
    const program = createPdfFontProgram(SANS, text)
    expect(program.fontFile.length).toBeGreaterThan(1000)
    expect(program.fontFile.length).toBeLessThan(SANS.length)
    expect(program.widths.length).toBe(program.stats.subsetGlyphs)
    expect(program.toUnicode.size).toBeGreaterThan(5)
    expect(program.baseFont).toMatch(/^[A-Z]{6}\+/)
    expect(program.postScriptName).not.toContain(' ')
  })

  it('宽度是 1000 单位/em 且文本可测量', () => {
    const program = createPdfFontProgram(SANS, text)
    const width = program.measure('中文', 12)
    expect(width).toBeGreaterThan(0)
    expect(width).toBeLessThan(12 * 2 * 2) // 两个字最多 2em
  })

  it('能检测字体缺失码点（内置思源子集缺空格等符号）', () => {
    const clean = createPdfFontProgram(SANS, '销售报表')
    expect(clean.missing.length).toBe(0)

    // 该字体子集不含空格 → 必须被如实报告，而不是静默画成空白
    const withSpace = createPdfFontProgram(SANS, '销售报表 2026')
    expect(withSpace.missing).toContain(0x20)

    // 后备字体 Inter 覆盖空格与 ¥（但中文自然缺失，二者互补）
    const fallback = createPdfFontProgram(INTER, '销售报表 2026 ¥')
    expect(fallback.hasCodePoint(0x20)).toBe(true)
    expect(fallback.hasCodePoint(0xa5)).toBe(true)
    expect(fallback.missing.length).toBe(4) // 四个汉字
  })

  it('多字体回退：缺字符号自动落到后备字体', () => {
    const text = '销售额 ¥1,234.56 · 完成率 90%'
    const primary = createPdfFontProgram(SANS, text)
    const backup = createPdfFontProgram(INTER, text)
    // 主字体缺 ¥/·/空格，Inter 补上
    expect(primary.missing.length).toBeGreaterThan(0)
    expect(backup.hasCodePoint(0x20)).toBe(true)
    expect(backup.hasCodePoint(0xa5)).toBe(true)
  })

  it('encodeHex 每字符 4 位十六进制', () => {
    const program = createPdfFontProgram(SANS, text)
    const hex = program.encodeHex('中文')
    expect(hex).toMatch(/^[0-9A-F]{8}$/)
  })
})

describe('PDF 文档结构', () => {
  it('产出包含 FontFile2 / CIDFontType2 / ToUnicode 的 PDF', () => {
    const text = 'SheetX 内置字体 中文测试'
    const program = createPdfFontProgram(SANS, text)
    const pdf = buildPdfWithLines(program, {
      lines: [
        { text: 'SheetX 内置字体', fontSize: 20 },
        { text: '中文测试 123', fontSize: 12 },
      ],
      title: 'SheetX Font Test',
    })
    const content = latin1(pdf)
    expect(content.startsWith('%PDF-1.7')).toBe(true)
    expect(content).toContain('/Subtype /CIDFontType2')
    expect(content).toContain('/FontFile2 8 0 R')
    expect(content).toContain('/Encoding /Identity-H')
    expect(content).toContain('/ToUnicode 9 0 R')
    expect(content).toContain('/CIDToGIDMap /Identity')
    expect(content).toContain('startxref')
    expect(content.trimEnd().endsWith('%%EOF')).toBe(true)
    // 交叉引用表项数应与对象数一致（10 个对象 + free）
    expect(content).toMatch(/^0 11$/m)
  })

  /**
   * 端到端：从生成的 PDF 里把 FontFile2 抽出来重新解析。
   * 这是"字体真的被嵌入"的硬证据——不是靠渲染器的系统字体兜底。
   */
  it('内嵌字体程序可被重新解析（证明真的嵌入了 TTF 子集）', () => {
    const text = '销售报表 完成率 负责人'
    const program = createPdfFontProgram(SANS, text)
    const pdf = buildPdfWithLines(program, { lines: [{ text, fontSize: 14 }] })

    // 找到 FontFile2 流：定位 "<< /Length N >>\nstream\n" 之后的字节
    const marker = latin1(pdf.subarray(0, Math.min(pdf.length, 4096)))
    expect(marker).toContain('/FontFile2 8 0 R')

    // 解析对象 8 的字典长度，抽出流内容
    const text8 = latin1(pdf)
    const obj8 = text8.indexOf('8 0 obj')
    expect(obj8).toBeGreaterThan(-1)
    const lenMatch = /8 0 obj\s*<< \/Length (\d+) >>/.exec(text8)
    expect(lenMatch).not.toBeNull()
    const streamLen = Number(lenMatch![1])
    const streamStart = text8.indexOf('stream\n', obj8) + 'stream\n'.length
    const embedded = pdf.subarray(streamStart, streamStart + streamLen)

    // 重新解析内嵌字体：应为合法 TTF 子集，且包含用到的中文字形
    expect(embedded[0]).toBe(0x00)
    expect(embedded[1]).toBe(0x01) // sfntVersion 1.0
    const reparsed = parseTtf(embedded)
    expect(reparsed.numGlyphs).toBe(program.stats.subsetGlyphs)
    expect(reparsed.cmap.get('销'.codePointAt(0)!)).toBeGreaterThan(0)
    expect(embedded.length).toBeLessThan(SANS.length / 3)
  })
})

describe('字体注册表', () => {
  let registry: FontRegistry

  beforeEach(() => {
    registry = new FontRegistry()
  })

  it('注册内置字体并可列举', async () => {
    await registry.registerBuiltins()
    const fonts = registry.getAvailableFonts()
    expect(fonts).toHaveLength(3)
    expect(fonts.map((f) => f.family)).toEqual([
      'Source Han Serif CN',
      'Source Han Sans CN',
      'Inter',
    ])
    expect(fonts.every((f) => f.builtin === true)).toBe(true)
  })

  it('默认字体为思源宋体，可切换', async () => {
    await registry.registerBuiltins()
    expect(registry.getDefault()).toBe('Source Han Serif CN')
    registry.setDefault('Source Han Sans CN')
    expect(registry.getDefault()).toBe('Source Han Sans CN')
    expect(() => registry.setDefault('不存在')).toThrow()
  })

  it('resolve 生成 CSS 栈并回退系统字体', async () => {
    await registry.registerBuiltins()
    const css = registry.resolveCssFamily('Source Han Sans CN')
    expect(css).toContain("'Source Han Sans CN'")
    expect(css).toContain('sans-serif')

    // 未注册字体不应抛错
    const fallback = registry.resolve('Not Exist Font')
    expect(fallback.cssFamily).toContain('sans-serif')
  })

  it('resolve 命中对应字重', async () => {
    await registry.registerBuiltins()
    const bold = registry.resolve('Inter', 700)
    expect(bold.weight).toBe(700)
    expect(bold.face?.weight).toBe(700)
  })

  it('支持自定义字节注册与注销', () => {
    registry.registerFromBytes({ family: 'My Font', bytes: INTER })
    expect(registry.get('My Font')?.builtin).toBe(false)
    expect(registry.resolveCssFamily('My Font')).toContain("'My Font'")
    expect(registry.unregister('My Font')).toBe(true)
    expect(registry.get('My Font')).toBeUndefined()
  })
})

/**
 * 可选：生成一份真实 PDF 供人工/系统渲染验证字体嵌入效果。
 * 用法：SHEETX_EMIT_DEMO=/tmp/sheetx-font-demo.pdf npx vitest run packages/fonts/test/fonts.test.ts
 */
describe('PDF 实物产出（可选）', () => {
  it('按需写出一份带中文的 PDF', async () => {
    const out = process.env.SHEETX_EMIT_DEMO
    if (!out) return
    const { writeFileSync } = await import('node:fs')
    const lines = [
        { text: 'SheetX 内置字体', fontSize: 22 },
        { text: '思源黑体 · 思源宋体 · Inter', fontSize: 14 },
        { text: '销售报表 完成率 负责人 备注', fontSize: 14 },
        { text: 'ABC abc 123 ¥1,234.56 90%', fontSize: 14 },
    ]
    // 主字体（思源黑体子集缺 ¥ · 空格）→ 后备 Inter 兜底
    const pdf = buildPdfDocument([SANS, INTER], { lines, title: 'SheetX Font Demo' })
    writeFileSync(out, pdf)
    expect(pdf.length).toBeGreaterThan(1000)
  })
})
