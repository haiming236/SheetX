/**
 * @sheetx/io - 零依赖 XLSX 基础读写（任务书 T8）
 *
 * 边界：只实现「基础读写」，不追求完整 Excel 兼容性（样式/公式/日期序列号/宏均不处理）。
 * 为什么自研：任务书要求核心 MIT 零依赖；SheetJS/ExcelJS 只能作为可选宿主适配层，
 * 不能进入核心。这里用最小 OOXML + ZIP 实现常见的字符串/数字单元格往返，
 * 压缩条目走浏览器/Node 22 原生 DecompressionStream('deflate-raw')，无第三方包。
 *
 * 支持：
 * - 写：UTF-8 文件名、store 或 deflate-raw 压缩、inlineStr + 数值单元格、合并区域；
 * - 读：本地文件头 + 中央目录、store/deflate-raw、inlineStr / sharedStrings / 数值 / 布尔；
 * - 不依赖 DOMParser（Node 测试可用），XML 用受限正则解析，只覆盖上述标签。
 */

import type {
  XlsxCellStyle,
  XlsxConditionalFormat,
  XlsxConditionalFormatRule,
  XlsxDataValidation,
  XlsxParseResult,
  XlsxRichTextRun,
  XlsxSheetSnapshot,
} from './index.js'

const encoder = new TextEncoder()
const decoder = new TextDecoder('utf-8')

const XML_SHEET_NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
const XML_REL_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
const CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

export interface BuiltinXlsxOptions {
  /** 写盘时是否用 deflate-raw 压缩；不支持 CompressionStream 的环境自动降级为 store */
  compress?: boolean
}

// ---------------------------------------------------------------------------
// 公共 API
// ---------------------------------------------------------------------------

/** 生成最小可打开的 .xlsx 字节（可直接 new Blob([bytes])） */
export async function buildXlsx(
  sheets: ReadonlyArray<XlsxSheetSnapshot>,
  options: BuiltinXlsxOptions = {},
): Promise<Uint8Array> {
  if (sheets.length === 0) throw new Error('[SheetX] XLSX 至少需要一个工作表')

  const names = sheets.map((sheet, index) => sheet.name?.trim() || `Sheet${index + 1}`)
  if (new Set(names).size !== names.length) throw new Error('[SheetX] XLSX 工作表名不能重复')

  const overrides = sheets
    .map((_, index) => `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`)
    .join('')
  const workbookSheets = names
    .map((name, index) => `<sheet name="${escapeXml(name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`)
    .join('')
  const workbookRels = names
    .map((_, index) => `<Relationship Id="rId${index + 1}" Type="${XML_REL_NS}/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`)
    .join('')

  // 先生成工作表并登记样式，最后再序列化 styles.xml（保证索引一致）
  const registry = createStyleRegistry()
  const sheetXmls = sheets.map((sheet) => buildSheetXml(sheet, registry))

  const entries: ZipEntry[] = [
    { name: '[Content_Types].xml', data: encoder.encode(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
      `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
      `<Default Extension="xml" ContentType="application/xml"/>` +
      `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
      `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
      overrides + `</Types>`,
    ) },
    { name: '_rels/.rels', data: encoder.encode(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      `<Relationship Id="rId1" Type="${XML_REL_NS}/officeDocument" Target="xl/workbook.xml"/>` +
      `</Relationships>`,
    ) },
    { name: 'xl/workbook.xml', data: encoder.encode(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<workbook xmlns="${XML_SHEET_NS}" xmlns:r="${XML_REL_NS}"><sheets>${workbookSheets}</sheets></workbook>`,
    ) },
    { name: 'xl/_rels/workbook.xml.rels', data: encoder.encode(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      `${workbookRels}<Relationship Id="rIdStyles" Type="${XML_REL_NS}/styles" Target="styles.xml"/>` +
      `</Relationships>`,
    ) },
    { name: 'xl/styles.xml', data: encoder.encode(registry.toXml()) },
  ]
  sheetXmls.forEach((xml, index) => {
    entries.push({ name: `xl/worksheets/sheet${index + 1}.xml`, data: encoder.encode(xml) })
  })

  return buildZip(entries, options.compress ?? true)
}

/** 解析 .xlsx 字节为工作表快照（二维字符串矩阵 + 合并区域 A1 记法） */
export async function parseXlsx(data: ArrayBuffer): Promise<XlsxParseResult> {
  const files = await readZip(data)
  const workbook = textOf(files.get('xl/workbook.xml'))
  if (!workbook) throw new Error('[SheetX] 非法 XLSX：缺少 xl/workbook.xml')

  const rels = textOf(files.get('xl/_rels/workbook.xml.rels'))
  const relMap = new Map<string, string>()
  for (const match of rels.matchAll(/<Relationship\b([^>]*)\/?>/g)) {
    const id = attr(match[1] ?? '', 'Id')
    const target = attr(match[1] ?? '', 'Target')
    if (id && target) relMap.set(id, resolvePartPath(target))
  }

  const shared = parseSharedStrings(textOf(files.get('xl/sharedStrings.xml')))
  const stylesXml = textOf(files.get('xl/styles.xml'))
  const dateStyles = parseDateStyleIndexes(stylesXml)
  const parsedStyles = parseCellStyles(stylesXml)
  const dxfs = parseDxfs(stylesXml)
  const sheets: XlsxSheetSnapshot[] = []
  for (const match of workbook.matchAll(/<sheet\b([^>]*)\/?>/g)) {
    const attrs = match[1] ?? ''
    const name = decodeXml(attr(attrs, 'name') ?? `Sheet${sheets.length + 1}`)
    const part = relMap.get(attr(attrs, 'r:id') ?? '') ?? `xl/worksheets/sheet${sheets.length + 1}.xml`
    sheets.push(parseSheet(textOf(files.get(part)), name, shared, dateStyles, parsedStyles, dxfs))
  }
  return { sheets }
}

/** 交给 registerXlsxAdapter() 的内置适配器工厂 */
export function createBuiltinXlsxIO(options: BuiltinXlsxOptions = {}) {
  return {
    async parse(data: ArrayBuffer): Promise<XlsxParseResult> {
      return parseXlsx(data)
    },
    async build(sheets: ReadonlyArray<XlsxSheetSnapshot>): Promise<Blob> {
      const bytes = await buildXlsx(sheets, options)
      const copy = bytes.slice()
      return new Blob([copy.buffer as ArrayBuffer], { type: CONTENT_TYPE })
    },
  }
}

/**
 * 共享公式引用平移：按行/列偏移改写 A1 引用，`$` 锚定的行或列保持不变。
 * 跳过函数名（LOG10(）、工作表名（Sheet1!）与标识符片段，避免误判。
 */
export function shiftFormulaReferences(formula: string, deltaRow: number, deltaCol: number): string {
  return formula.replace(/(\$?)([A-Za-z]{1,3})(\$?)(\d+)/g, (full, colAbs: string, letters: string, rowAbs: string, digits: string, offset: number, source: string) => {
    const after = source[offset + full.length]
    const before = offset > 0 ? source[offset - 1] : ''
    if (after === '(' || after === '!' || /[A-Za-z0-9_]/.test(before)) return full
    const col = colAbs === '$' ? letters : colName(Math.max(0, (colIndexFromRef(letters) ?? 0) + deltaCol))
    const row = rowAbs === '$' ? digits : String(Math.max(1, Number(digits) + deltaRow))
    return `${colAbs}${col}${rowAbs}${row}`
  })
}

/** @internal 仅供测试构造带特殊 OOXML 片段的工作簿（不通过 index.ts 暴露） */
export async function __buildXlsxFromParts(
  parts: Record<string, string>,
  options: BuiltinXlsxOptions = {},
): Promise<Uint8Array> {
  const entries = Object.entries(parts).map(([name, text]) => ({ name, data: encoder.encode(text) }))
  return buildZip(entries, options.compress ?? false)
}

// ---------------------------------------------------------------------------
// OOXML 生成
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 日期序列号（Excel 1900 日期系统，含伪造闰日 bug）
// ---------------------------------------------------------------------------

const DAY_MS = 86_400_000
/** Excel 把 1900-02-29 当作存在（序列号 60）；JS 无法表示，按 1900-03-01 归一化 */
const EXCEL_FAKE_LEAP_DAY = 60

/** ISO 风格日期/日期时间 → Excel 序列号；非法日期返回 null */
export function dateToExcelSerial(input: string | Date): number | null {
  let date: Date | null
  if (input instanceof Date) {
    date = input
  } else {
    date = parseDateLike(input)
    if (!date) return null
  }
  const utc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),
    date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds())
  const base = utc < Date.UTC(1900, 2, 1) ? Date.UTC(1899, 11, 31) : Date.UTC(1899, 11, 30)
  return (utc - base) / DAY_MS
}

/** Excel 序列号 → UTC Date；负数/非数返回 null */
export function excelSerialToDate(serial: number): Date | null {
  if (!Number.isFinite(serial) || serial < 0) return null
  const day = Math.floor(serial)
  if (day === EXCEL_FAKE_LEAP_DAY) return new Date(Date.UTC(1900, 2, 1))
  const base = day < EXCEL_FAKE_LEAP_DAY ? Date.UTC(1899, 11, 31) : Date.UTC(1899, 11, 30)
  const fraction = serial - day
  return new Date(base + day * DAY_MS + Math.round(fraction * DAY_MS))
}

/** 日期 → 写回 XLSX 的字符串（纯日期不带时间尾） */
export function formatExcelDate(date: Date): string {
  const pad = (value: number): string => String(value).padStart(2, '0')
  const day = `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
  const hour = date.getUTCHours()
  const minute = date.getUTCMinutes()
  const second = date.getUTCSeconds()
  if (hour === 0 && minute === 0 && second === 0) return day
  return `${day} ${pad(hour)}:${pad(minute)}:${pad(second)}`
}

function parseDateLike(text: string): Date | null {
  const match = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const hour = Number(match[4] ?? 0)
  const minute = Number(match[5] ?? 0)
  const second = Number(match[6] ?? 0)
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59 || second > 59) return null
  const utc = Date.UTC(year, month - 1, day, hour, minute, second)
  const check = new Date(utc)
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null
  return check
}

interface StyleRegistry {
  /** 取得（或惰性注册）样式对应的 cellXfs 索引；0 = 默认样式 */
  xfIndex(style?: XlsxCellStyle | null, isDate?: boolean): number
  /** 条件格式 dxf 索引；无可视样式返回 -1 */
  dxfIndex(style: XlsxConditionalFormatRule): number
  toXml(): string
}

const DATE_FORMAT = 'yyyy-mm-dd hh:mm:ss'
const DEFAULT_FONT = '<font><sz val="11"/><name val="Calibri"/></font>'
const DEFAULT_FILLS = [
  '<fill><patternFill patternType="none"/></fill>',
  '<fill><patternFill patternType="gray125"/></fill>',
]
const DEFAULT_BORDER = '<border><left/><right/><top/><bottom/><diagonal/></border>'

/** 惰性样式注册表：只把真正用到的样式写进 styles.xml，空表零膨胀 */
function createStyleRegistry(): StyleRegistry {
  const fonts = [DEFAULT_FONT]
  const fills = [...DEFAULT_FILLS]
  const borders = [DEFAULT_BORDER]
  const formats = new Map<string, number>()
  let nextNumFmt = 164
  const xfs = ['<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>']
  const cache = new Map<string, number>()
  const dxfs: string[] = []
  const dxfCache = new Map<string, number>()

  return {
    xfIndex(style, isDate = false): number {
      const normalized: XlsxCellStyle = { ...(style ?? {}) }
      if (isDate && !normalized.numberFormat) normalized.numberFormat = DATE_FORMAT
      if (Object.keys(normalized).length === 0) return 0
      const key = JSON.stringify(normalized)
      const cached = cache.get(key)
      if (cached !== undefined) return cached

      let fontId = 0
      if (normalized.bold || normalized.italic || normalized.underline || normalized.fontColor) {
        const parts = ['<sz val="11"/>', '<name val="Calibri"/>']
        if (normalized.bold) parts.unshift('<b/>')
        if (normalized.italic) parts.unshift('<i/>')
        if (normalized.underline) parts.unshift('<u/>')
        if (normalized.fontColor) parts.push(`<color rgb="${toArgb(normalized.fontColor)}"/>`)
        fonts.push(`<font>${parts.join('')}</font>`)
        fontId = fonts.length - 1
      }

      let fillId = 0
      if (normalized.fill) {
        fills.push(`<fill><patternFill patternType="solid"><fgColor rgb="${toArgb(normalized.fill)}"/>` +
          `<bgColor indexed="64"/></patternFill></fill>`)
        fillId = fills.length - 1
      }

      let borderId = 0
      if (normalized.border) {
        const side = '<color rgb="FF000000"/>'
        borders.push(`<border><left style="thin">${side}</left><right style="thin">${side}</right>` +
          `<top style="thin">${side}</top><bottom style="thin">${side}</bottom><diagonal/></border>`)
        borderId = borders.length - 1
      }

      let numFmtId = 0
      if (normalized.numberFormat) {
        if (!formats.has(normalized.numberFormat)) formats.set(normalized.numberFormat, nextNumFmt++)
        numFmtId = formats.get(normalized.numberFormat)!
      }

      const attrs = [
        `numFmtId="${numFmtId}"`, `fontId="${fontId}"`, `fillId="${fillId}"`,
        `borderId="${borderId}"`, 'xfId="0"',
      ]
      if (fontId > 0) attrs.push('applyFont="1"')
      if (fillId > 0) attrs.push('applyFill="1"')
      if (borderId > 0) attrs.push('applyBorder="1"')
      if (numFmtId > 0) attrs.push('applyNumberFormat="1"')

      const alignment: string[] = []
      if (normalized.align) alignment.push(`horizontal="${normalized.align}"`)
      if (normalized.verticalAlign) alignment.push(`vertical="${normalized.verticalAlign}"`)
      if (normalized.wrapText) alignment.push('wrapText="1"')
      if (alignment.length > 0) attrs.push('applyAlignment="1"')
      xfs.push(`<xf ${attrs.join(' ')}>${alignment.length > 0 ? `<alignment ${alignment.join(' ')}/>` : ''}</xf>`)

      const index = xfs.length - 1
      cache.set(key, index)
      return index
    },

    dxfIndex(style): number {
      const normalized = { fill: style.fill, fontColor: style.fontColor, bold: style.bold }
      if (!normalized.fill && !normalized.fontColor && !normalized.bold) return -1
      const key = JSON.stringify(normalized)
      const cached = dxfCache.get(key)
      if (cached !== undefined) return cached
      const parts: string[] = []
      if (normalized.bold || normalized.fontColor) {
        const font: string[] = []
        if (normalized.bold) font.push('<b/>')
        if (normalized.fontColor) font.push(`<color rgb="${toArgb(normalized.fontColor)}"/>`)
        parts.push(`<font>${font.join('')}</font>`)
      }
      if (normalized.fill) {
        parts.push(`<fill><patternFill><bgColor rgb="${toArgb(normalized.fill)}"/></patternFill></fill>`)
      }
      dxfs.push(`<dxf>${parts.join('')}</dxf>`)
      const index = dxfs.length - 1
      dxfCache.set(key, index)
      return index
    },

    toXml(): string {
      const numFmtXml = formats.size > 0
        ? `<numFmts count="${formats.size}">` +
          [...formats].map(([code, id]) => `<numFmt numFmtId="${id}" formatCode="${escapeXml(code)}"/>`).join('') +
          `</numFmts>`
        : ''
      return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<styleSheet xmlns="${XML_SHEET_NS}">${numFmtXml}` +
        `<fonts count="${fonts.length}">${fonts.join('')}</fonts>` +
        `<fills count="${fills.length}">${fills.join('')}</fills>` +
        `<borders count="${borders.length}">${borders.join('')}</borders>` +
        `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
        `<cellXfs count="${xfs.length}">${xfs.join('')}</cellXfs>` +
        `<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>` +
        `<dxfs count="${dxfs.length}">${dxfs.join('')}</dxfs>` +
        `</styleSheet>`
    },
  }
}

function toArgb(color: string): string {
  const hex = color.startsWith('#') ? color.slice(1) : color
  return `FF${hex.toUpperCase().padStart(6, '0').slice(-6)}`
}

function fromArgb(color: string | undefined): string | undefined {
  if (!color) return undefined
  const match = color.match(/^(?:FF)?([0-9a-fA-F]{6})$/)
  return match ? `#${match[1]!.toUpperCase()}` : undefined
}

const BUILTIN_DATE_FORMAT_IDS = new Set([14, 15, 16, 17, 18, 19, 20, 21, 22, 45, 46, 47])

function parseDateStyleIndexes(xml: string): Set<number> {
  if (!xml) return new Set()
  const formats = new Map<number, string>()
  for (const match of xml.matchAll(/<numFmt\b([^>]*)\/?>/g)) {
    const id = Number(attr(match[1] ?? '', 'numFmtId'))
    const code = attr(match[1] ?? '', 'formatCode')
    if (Number.isFinite(id) && code) formats.set(id, decodeXml(code))
  }
  const xfsBlock = xml.match(/<cellXfs\b[^>]*>([\s\S]*?)<\/cellXfs>/)?.[1] ?? ''
  const indexes = new Set<number>()
  ;[...xfsBlock.matchAll(/<xf\b([^>]*)\/?>/g)].forEach((match, index) => {
    const id = Number(attr(match[1] ?? '', 'numFmtId') ?? 0)
    const code = formats.get(id) ?? ''
    if (BUILTIN_DATE_FORMAT_IDS.has(id) || (!code.match(/^General$/i) && /[ymdhs]/i.test(code.replace(/\\./g, '')))) {
      indexes.add(index)
    }
  })
  return indexes
}

function parseCellStyles(xml: string): XlsxCellStyle[] {
  if (!xml) return []
  const formats = new Map<number, string>()
  for (const match of xml.matchAll(/<numFmt\b([^>]*)\/?>/g)) {
    const id = Number(attr(match[1] ?? '', 'numFmtId'))
    const code = attr(match[1] ?? '', 'formatCode')
    if (Number.isFinite(id) && code) formats.set(id, decodeXml(code))
  }

  const fontBlock = xml.match(/<fonts\b[^>]*>([\s\S]*?)<\/fonts>/)?.[1] ?? ''
  const fonts = [...fontBlock.matchAll(/<font\b[^>]*>([\s\S]*?)<\/font>/g)].map((match) => {
    const body = match[1] ?? ''
    const style: XlsxCellStyle = {}
    if (/<b\b/.test(body)) style.bold = true
    if (/<i\b/.test(body)) style.italic = true
    if (/<u\b/.test(body)) style.underline = true
    const color = fromArgb(attr(body.match(/<color\b([^>]*)\/?>/)?.[1] ?? '', 'rgb'))
    if (color) style.fontColor = color
    return style
  })

  const fillBlock = xml.match(/<fills\b[^>]*>([\s\S]*?)<\/fills>/)?.[1] ?? ''
  const fills = [...fillBlock.matchAll(/<fill\b[^>]*>([\s\S]*?)<\/fill>/g)].map((match) => {
    const body = match[1] ?? ''
    const pattern = body.match(/<patternFill\b([^>]*)>([\s\S]*?)<\/patternFill>/)
    const style: XlsxCellStyle = {}
    if (pattern && attr(pattern[1] ?? '', 'patternType') === 'solid') {
      const color = fromArgb(attr((pattern[2] ?? '').match(/<fgColor\b([^>]*)\/?>/)?.[1] ?? '', 'rgb'))
      if (color) style.fill = color
    }
    return style
  })

  const borderBlock = xml.match(/<borders\b[^>]*>([\s\S]*?)<\/borders>/)?.[1] ?? ''
  // 默认 border 里也有空的 <left/>，必须看 style 属性才能判定真边框
  const borders = [...borderBlock.matchAll(/<border\b[^>]*>([\s\S]*?)<\/border>/g)]
    .map((match) => /<(?:left|right|top|bottom)\b[^>]*\bstyle="[^"]+"/.test(match[1] ?? ''))

  const xfBlock = xml.match(/<cellXfs\b[^>]*>([\s\S]*?)<\/cellXfs>/)?.[1] ?? ''
  return [...xfBlock.matchAll(/<xf\b([^>]*?)(?:\/>|>([\s\S]*?)<\/xf>)/g)].map((match) => {
    const attrs = match[1] ?? ''
    const body = match[2] ?? ''
    const style: XlsxCellStyle = { ...(fonts[Number(attr(attrs, 'fontId') ?? 0)] ?? {}) }
    const fill = fills[Number(attr(attrs, 'fillId') ?? 0)]
    if (fill?.fill) style.fill = fill.fill
    if (borders[Number(attr(attrs, 'borderId') ?? 0)]) style.border = true
    const numberFormat = formats.get(Number(attr(attrs, 'numFmtId') ?? 0))
    if (numberFormat) style.numberFormat = numberFormat

    const alignment = attr(body.match(/<alignment\b([^>]*)\/?>/)?.[1] ?? '', 'horizontal')
    if (alignment === 'left' || alignment === 'center' || alignment === 'right') style.align = alignment
    const vertical = attr(body.match(/<alignment\b([^>]*)\/?>/)?.[1] ?? '', 'vertical')
    if (vertical === 'top' || vertical === 'middle' || vertical === 'bottom') style.verticalAlign = vertical
    if (/<alignment\b[^>]*\bwrapText="1"/.test(body)) style.wrapText = true
    return style
  })
}

function buildValidationsXml(rules: ReadonlyArray<XlsxDataValidation> | undefined): string {
  if (!rules || rules.length === 0) return ''
  const body = rules.map((rule) => {
    const attrs = [`type="${rule.type}"`, `sqref="${escapeXml(rule.sqref)}"`]
    if (rule.operator) attrs.push(`operator="${rule.operator}"`)
    if (rule.allowBlank) attrs.push('allowBlank="1"')
    if (rule.showErrorMessage) attrs.push('showErrorMessage="1"')
    if (rule.error) attrs.push(`error="${escapeXml(rule.error)}"`)
    if (rule.showInputMessage) attrs.push('showInputMessage="1"')
    if (rule.prompt) attrs.push(`prompt="${escapeXml(rule.prompt)}"`)
    const formulas = rule.formulas
      .map((formula, index) => `<formula${index + 1}>${escapeXml(formula)}</formula${index + 1}>`)
      .join('')
    return `<dataValidation ${attrs.join(' ')}>${formulas}</dataValidation>`
  }).join('')
  return `<dataValidations count="${rules.length}">${body}</dataValidations>`
}

const VALIDATION_TYPES = new Set(['list', 'whole', 'decimal', 'date', 'textLength', 'custom'])
const VALIDATION_OPERATORS = new Set([
  'between', 'notBetween', 'equal', 'notEqual', 'greaterThan', 'lessThan',
  'greaterThanOrEqual', 'lessThanOrEqual',
])

function parseValidations(xml: string): XlsxDataValidation[] {
  const block = xml.match(/<dataValidations\b[^>]*>([\s\S]*?)<\/dataValidations>/)?.[1] ?? ''
  const rules: XlsxDataValidation[] = []
  for (const match of block.matchAll(/<dataValidation\b([^>]*?)(?:\/>|>([\s\S]*?)<\/dataValidation>)/g)) {
    const attrs = match[1] ?? ''
    const body = match[2] ?? ''
    const type = attr(attrs, 'type') ?? ''
    if (!VALIDATION_TYPES.has(type)) continue
    const rule: XlsxDataValidation = {
      type: type as XlsxDataValidation['type'],
      sqref: decodeXml(attr(attrs, 'sqref') ?? ''),
      formulas: [],
    }
    const operator = attr(attrs, 'operator') ?? ''
    if (VALIDATION_OPERATORS.has(operator)) rule.operator = operator as XlsxDataValidation['operator']
    if (/1|true/i.test(attr(attrs, 'allowBlank') ?? '')) rule.allowBlank = true
    if (/1|true/i.test(attr(attrs, 'showErrorMessage') ?? '')) rule.showErrorMessage = true
    const error = attr(attrs, 'error')
    if (error) rule.error = decodeXml(error)
    if (/1|true/i.test(attr(attrs, 'showInputMessage') ?? '')) rule.showInputMessage = true
    const prompt = attr(attrs, 'prompt')
    if (prompt) rule.prompt = decodeXml(prompt)
    const first = collectTag(body, 'formula1')
    const second = collectTag(body, 'formula2')
    if (first !== '') rule.formulas.push(decodeXml(first))
    if (second !== '') rule.formulas.push(decodeXml(second))
    rules.push(rule)
  }
  return rules
}

interface SharedFormulaBase {
  text: string
  row: number
  col: number
}

function readFormulaText(
  cellBody: string,
  row: number,
  col: number,
  shared: Map<string, SharedFormulaBase>,
): string {
  const match = cellBody.match(/<f\b([^>]*?)(?:\/>|>([\s\S]*?)<\/f>)/)
  if (!match) return ''
  const attrs = match[1] ?? ''
  const text = decodeXml(match[2] ?? '')
  if ((attr(attrs, 't') ?? '') !== 'shared') return text

  const si = attr(attrs, 'si') ?? ''
  if (text !== '') {
    shared.set(si, { text, row, col })
    return text
  }
  const base = shared.get(si)
  return base ? shiftFormulaReferences(base.text, row - base.row, col - base.col) : ''
}

interface DxfStyle {
  fill?: string
  fontColor?: string
  bold?: boolean
}

const CF_TYPES = new Set(['cellIs', 'containsText', 'colorScale', 'expression', 'duplicateValues', 'top10'])
const CF_TEXT_OPERATORS = new Set(['contains', 'notContains', 'beginsWith', 'endsWith'])

function cfFormula(text: string): string {
  const trimmed = text.trim()
  return trimmed.startsWith('=') ? trimmed.slice(1) : trimmed
}

function buildConditionalFormatsXml(
  formats: ReadonlyArray<XlsxConditionalFormat> | undefined,
  registry: StyleRegistry,
): string {
  if (!formats || formats.length === 0) return ''
  let priority = 1
  return formats.map((format) => {
    const rules = format.rules.map((rule) => {
      const attrs = [`type="${rule.type}"`, `priority="${priority++}"`]
      if (rule.operator) attrs.push(`operator="${rule.operator}"`)
      if (rule.type === 'containsText' && rule.textOperator) attrs.push(`operator="${rule.textOperator}"`)
      if (rule.type === 'top10') {
        if (rule.rank !== undefined) attrs.push(`rank="${rule.rank}"`)
        if (rule.percent) attrs.push('percent="1"')
        if (rule.bottom) attrs.push('bottom="1"')
      }
      const dxfId = registry.dxfIndex(rule)
      if (dxfId >= 0) attrs.push(`dxfId="${dxfId}"`)

      let body = ''
      if (rule.type === 'colorScale') {
        const colors = rule.colors ?? []
        const stops = colors.length === 2
          ? [{ type: 'min' }, { type: 'max' }]
          : [{ type: 'min' }, { type: 'percentile', val: 50 }, { type: 'max' }]
        body = `<colorScale>${colors.map((color, index) => {
          const stop = stops[index] ?? stops[stops.length - 1]!
          const val = 'val' in stop ? ` val="${stop.val}"` : ''
          return `<cfvo type="${stop.type}"${val}/><color rgb="${toArgb(color)}"/>`
        }).join('')}</colorScale>`
      } else if (rule.type === 'containsText') {
        body = `<formula>${escapeXml(rule.text ?? '')}</formula>`
      } else if (rule.formulas && rule.formulas.length > 0) {
        body = rule.formulas.map((formula) => `<formula>${escapeXml(cfFormula(formula))}</formula>`).join('')
      }
      return `<cfRule ${attrs.join(' ')}>${body}</cfRule>`
    }).join('')
    return `<conditionalFormatting sqref="${escapeXml(format.sqref)}">${rules}</conditionalFormatting>`
  }).join('')
}

function parseDxfs(xml: string): DxfStyle[] {
  const block = xml.match(/<dxfs\b[^>]*>([\s\S]*?)<\/dxfs>/)?.[1] ?? ''
  return [...block.matchAll(/<dxf\b[^>]*>([\s\S]*?)<\/dxf>/g)].map((match) => {
    const body = match[1] ?? ''
    const fontBlock = body.match(/<font\b[^>]*>([\s\S]*?)<\/font>/)?.[1] ?? ''
    const fillBlock = body.match(/<fill\b[^>]*>([\s\S]*?)<\/fill>/)?.[1] ?? ''
    const style: DxfStyle = {}
    if (/<b\b/.test(fontBlock)) style.bold = true
    const fontColor = fromArgb(attr(fontBlock.match(/<color\b([^>]*)\/?>/)?.[1] ?? '', 'rgb'))
    if (fontColor) style.fontColor = fontColor
    const fill = fromArgb(attr(fillBlock.match(/<bgColor\b([^>]*)\/?>/)?.[1] ?? '', 'rgb'))
      ?? fromArgb(attr(fillBlock.match(/<fgColor\b([^>]*)\/?>/)?.[1] ?? '', 'rgb'))
    if (fill) style.fill = fill
    return style
  })
}

function parseConditionalFormats(xml: string, dxfs: ReadonlyArray<DxfStyle>): XlsxConditionalFormat[] {
  const formats: XlsxConditionalFormat[] = []
  const blocks = xml.matchAll(/<conditionalFormatting\b([^>]*?)(?:\/>|>([\s\S]*?)<\/conditionalFormatting>)/g)
  for (const block of blocks) {
    const sqref = decodeXml(attr(block[1] ?? '', 'sqref') ?? '')
    if (!sqref) continue
    const rules: XlsxConditionalFormatRule[] = []
    for (const match of (block[2] ?? '').matchAll(/<cfRule\b([^>]*?)(?:\/>|>([\s\S]*?)<\/cfRule>)/g)) {
      const attrs = match[1] ?? ''
      const body = match[2] ?? ''
      const type = attr(attrs, 'type') ?? ''
      if (!CF_TYPES.has(type)) continue
      const rule: XlsxConditionalFormatRule = { type: type as XlsxConditionalFormatRule['type'] }
      const style = dxfs[Number(attr(attrs, 'dxfId') ?? -1)]
      if (style) Object.assign(rule, style)
      const operator = attr(attrs, 'operator') ?? ''
      if (rule.type === 'containsText') {
        if (CF_TEXT_OPERATORS.has(operator)) rule.textOperator = operator as XlsxConditionalFormatRule['textOperator']
        rule.text = decodeXml(collectTag(body, 'formula')) || undefined
      } else if (VALIDATION_OPERATORS.has(operator)) {
        rule.operator = operator as XlsxConditionalFormatRule['operator']
      }
      if (rule.type === 'top10') {
        const rank = Number(attr(attrs, 'rank'))
        if (Number.isFinite(rank)) rule.rank = rank
        if (/1|true/i.test(attr(attrs, 'percent') ?? '')) rule.percent = true
        if (/1|true/i.test(attr(attrs, 'bottom') ?? '')) rule.bottom = true
      }
      if (rule.type === 'colorScale') {
        const colors = [...body.matchAll(/<color\b([^>]*)\/?>/g)]
          .map((color) => fromArgb(attr(color[1] ?? '', 'rgb')))
          .filter((color): color is string => Boolean(color))
        if (colors.length > 0) rule.colors = colors
      }
      const formulas = [...body.matchAll(/<formula\b[^>]*>([\s\S]*?)<\/formula>/g)]
        .map((formula) => decodeXml(formula[1] ?? ''))
        .filter((formula) => formula !== '')
      if (rule.type === 'expression' && formulas[0] !== undefined) {
        rule.formulas = [formulas[0].startsWith('=') ? formulas[0] : `=${formulas[0]}`]
      } else if (rule.type !== 'containsText' && rule.type !== 'colorScale' && formulas.length > 0) {
        rule.formulas = formulas
      }
      rules.push(rule)
    }
    if (rules.length > 0) formats.push({ sqref, rules })
  }
  return formats
}

function buildSheetXml(sheet: XlsxSheetSnapshot, registry: StyleRegistry): string {
  const styleAt = (row: number, col: number): XlsxCellStyle | undefined => sheet.styles?.[row]?.[col] ?? undefined
  const suffix = (index: number): string => index > 0 ? ` s="${index}"` : ''
  const rows = sheet.cells.map((cells, rowIndex) => {
    const rowNumber = rowIndex + 1
    const body = cells.map((value, colIndex) => {
      const ref = `${colName(colIndex)}${rowNumber}`
      const text = value === null || value === undefined ? '' : String(value)
      const style = styleAt(rowIndex, colIndex)
      const rawFormula = sheet.formulas?.[rowIndex]?.[colIndex]?.trim() ?? ''
      if (rawFormula !== '') {
        // OOXML 公式串不带前导 '='；外部契约统一带 '='，写入时只剥掉首字符
        const formula = rawFormula.startsWith('=') ? rawFormula.slice(1) : rawFormula
        const s = suffix(registry.xfIndex(style))
        if (text !== '' && isNumericText(text)) {
          return `<c r="${ref}"${s}><f>${escapeXml(formula)}</f><v>${text}</v></c>`
        }
        return `<c r="${ref}"${s} t="str"><f>${escapeXml(formula)}</f><v>${escapeXml(text)}</v></c>`
      }
      const runs = sheet.richText?.[rowIndex]?.[colIndex]
      if (runs && runs.length > 0) {
        const s = suffix(registry.xfIndex(style))
        return `<c r="${ref}"${s} t="inlineStr"><is>${buildRichTextRunsXml(runs)}</is></c>`
      }
      const date = text === '' ? null : parseDateLike(text)
      if (date) {
        const serial = Math.round(dateToExcelSerial(date)! * 1e6) / 1e6
        return `<c r="${ref}"${suffix(registry.xfIndex(style, true))}><v>${serial}</v></c>`
      }
      const s = suffix(registry.xfIndex(style))
      if (text !== '' && isNumericText(text)) return `<c r="${ref}"${s}><v>${text}</v></c>`
      return `<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">${escapeXml(text)}</t></is></c>`
    }).join('')
    return `<row r="${rowNumber}">${body}</row>`
  }).join('')

  const maxRows = sheet.cells.length
  const maxCols = sheet.cells.reduce((max, row) => Math.max(max, row.length), 0)
  const dimension = maxRows > 0 ? `<dimension ref="A1:${colName(Math.max(0, maxCols - 1))}${maxRows}"/>` : ''
  const merges = sheet.merges && sheet.merges.length > 0
    ? `<mergeCells count="${sheet.merges.length}">${sheet.merges
      .map((ref) => `<mergeCell ref="${escapeXml(ref)}"/>`).join('')}</mergeCells>`
    : ''

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="${XML_SHEET_NS}">${dimension}<sheetData>${rows}</sheetData>` +
    `${merges}${buildConditionalFormatsXml(sheet.conditionalFormats, registry)}` +
    `${buildValidationsXml(sheet.validations)}</worksheet>`
}

function parseSheet(
  xml: string,
  name: string,
  shared: ReadonlyArray<SharedStringEntry>,
  dateStyles: ReadonlySet<number>,
  parsedStyles: ReadonlyArray<XlsxCellStyle>,
  dxfs: ReadonlyArray<DxfStyle>,
): XlsxSheetSnapshot {
  const rows = new Map<number, string[]>()
  const formulaRows = new Map<number, string[]>()
  const styleRows = new Map<number, Array<XlsxCellStyle | undefined>>()
  const richRows = new Map<number, Array<XlsxRichTextRun[] | undefined>>()
  const sharedFormulas = new Map<string, SharedFormulaBase>()
  let nextRow = 0
  for (const rowMatch of xml.matchAll(/<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g)) {
    const rowAttrs = rowMatch[1] ?? ''
    const declared = Number(attr(rowAttrs, 'r'))
    const rowIndex = Number.isInteger(declared) && declared > 0 ? declared - 1 : nextRow
    nextRow = rowIndex + 1
    const cells: string[] = []
    const formulaCells: string[] = []
    const styleCells: Array<XlsxCellStyle | undefined> = []
    const richCells: Array<XlsxRichTextRun[] | undefined> = []
    let nextCol = 0
    const body = rowMatch[2] ?? ''
    for (const cellMatch of body.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const cellAttrs = cellMatch[1] ?? ''
      const ref = attr(cellAttrs, 'r') ?? ''
      const col = colIndexFromRef(ref) ?? nextCol
      nextCol = col + 1
      const type = attr(cellAttrs, 't') ?? ''
      const styleIndex = Number(attr(cellAttrs, 's') ?? 0)
      const cellBody = cellMatch[2] ?? ''
      let value = ''
      let rich: XlsxRichTextRun[] | undefined
      if (type === 'inlineStr') {
        const isBody = cellBody.match(/<is\b[^>]*>([\s\S]*?)<\/is>/)?.[1] ?? cellBody
        const parsed = readRichText(isBody)
        value = parsed.text
        rich = parsed.runs
      } else {
        const raw = collectTag(cellBody, 'v')
        if (type === 's') {
          const entry = shared[Number(raw)]
          value = entry?.text ?? ''
          rich = entry?.runs
        } else if (type === 'b') value = raw === '1' ? 'TRUE' : 'FALSE'
        else if (dateStyles.has(styleIndex) && raw !== '') {
          const serial = Number(raw)
          const date = Number.isFinite(serial) ? excelSerialToDate(serial) : null
          value = date ? formatExcelDate(date) : decodeXml(raw)
        } else value = decodeXml(raw)
      }
      cells[col] = value
      const formulaText = readFormulaText(cellBody, rowIndex, col, sharedFormulas)
      if (formulaText !== '') formulaCells[col] = formulaText.startsWith('=') ? formulaText : `=${formulaText}`
      const parsed = parsedStyles[styleIndex]
      if (parsed && Object.keys(parsed).length > 0) styleCells[col] = parsed
      if (rich) richCells[col] = rich
    }
    rows.set(rowIndex, cells)
    formulaRows.set(rowIndex, formulaCells)
    styleRows.set(rowIndex, styleCells)
    richRows.set(rowIndex, richCells)
  }

  const lastRow = rows.size > 0 ? Math.max(...rows.keys()) : -1
  const matrix: string[][] = []
  const formulas: string[][] = []
  const styles: Array<Array<XlsxCellStyle | undefined>> = []
  const richText: Array<Array<XlsxRichTextRun[] | undefined>> = []
  let hasFormula = false
  let hasStyle = false
  let hasRichText = false
  for (let index = 0; index <= lastRow; index++) {
    const row = rows.get(index) ?? []
    const formulaRow = formulaRows.get(index) ?? []
    const styleRow = styleRows.get(index) ?? []
    const richRow = richRows.get(index) ?? []
    matrix.push(row.map((cell) => cell ?? ''))
    const normalizedFormulas = matrix[index]!.map((_, col) => formulaRow[col] ?? '')
    const normalizedStyles = matrix[index]!.map((_, col) => styleRow[col])
    const normalizedRich = matrix[index]!.map((_, col) => richRow[col])
    if (normalizedFormulas.some((cell) => cell !== '')) hasFormula = true
    if (normalizedStyles.some((style) => style !== undefined)) hasStyle = true
    if (normalizedRich.some((run) => run !== undefined)) hasRichText = true
    formulas.push(normalizedFormulas)
    styles.push(normalizedStyles)
    richText.push(normalizedRich)
  }
  const merges = [...xml.matchAll(/<mergeCell\b([^>]*)\/?>/g)]
    .map((match) => decodeXml(attr(match[1] ?? '', 'ref') ?? ''))
    .filter((ref) => ref !== '')
  const validations = parseValidations(xml)
  const conditionalFormats = parseConditionalFormats(xml, dxfs)
  return {
    name,
    cells: matrix,
    ...(hasFormula ? { formulas } : {}),
    ...(hasStyle ? { styles } : {}),
    ...(hasRichText ? { richText } : {}),
    ...(merges.length > 0 ? { merges } : {}),
    ...(validations.length > 0 ? { validations } : {}),
    ...(conditionalFormats.length > 0 ? { conditionalFormats } : {}),
  }
}

interface SharedStringEntry {
  text: string
  runs?: XlsxRichTextRun[]
}

function buildRichTextRunsXml(runs: ReadonlyArray<XlsxRichTextRun>): string {
  return runs.map((run) => {
    const props: string[] = []
    if (run.bold) props.push('<b/>')
    if (run.italic) props.push('<i/>')
    if (run.underline) props.push('<u/>')
    if (run.fontColor) props.push(`<color rgb="${toArgb(run.fontColor)}"/>`)
    if (run.fontSize) props.push(`<sz val="${run.fontSize}"/>`)
    if (run.fontFamily) props.push(`<name val="${escapeXml(run.fontFamily)}"/>`)
    const rPr = props.length > 0 ? `<rPr>${props.join('')}</rPr>` : ''
    return `<r>${rPr}<t xml:space="preserve">${escapeXml(run.text)}</t></r>`
  }).join('')
}

function parseRun(body: string): XlsxRichTextRun {
  const rPr = body.match(/<rPr\b[^>]*>([\s\S]*?)<\/rPr>/)?.[1] ?? ''
  const run: XlsxRichTextRun = { text: decodeXml(collectTag(body, 't')) }
  if (/<b\b/.test(rPr)) run.bold = true
  if (/<i\b/.test(rPr)) run.italic = true
  if (/<u\b/.test(rPr)) run.underline = true
  const color = fromArgb(attr(rPr.match(/<color\b([^>]*)\/?>/)?.[1] ?? '', 'rgb'))
  if (color) run.fontColor = color
  const size = Number(attr(rPr.match(/<sz\b([^>]*)\/?>/)?.[1] ?? '', 'val'))
  if (Number.isFinite(size) && size > 0) run.fontSize = size
  const family = decodeXml(attr(rPr.match(/<name\b([^>]*)\/?>/)?.[1] ?? '', 'val') ?? '')
  if (family) run.fontFamily = family
  return run
}

function readRichText(body: string): SharedStringEntry {
  const runs = [...body.matchAll(/<r\b[^>]*>([\s\S]*?)<\/r>/g)].map((match) => parseRun(match[1] ?? ''))
  if (runs.length === 0) return { text: collectTextTags(body) }
  return { text: runs.map((run) => run.text).join(''), runs }
}

function parseSharedStrings(xml: string): SharedStringEntry[] {
  if (!xml) return []
  return [...xml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map((match) => readRichText(match[1] ?? ''))
}

// ---------------------------------------------------------------------------
// ZIP（store / deflate-raw）
// ---------------------------------------------------------------------------

interface ZipEntry {
  name: string
  data: Uint8Array
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let value = i
    for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
    table[i] = value >>> 0
  }
  return table
})()

function crc32(data: Uint8Array): number {
  let value = 0xffffffff
  for (const byte of data) value = CRC_TABLE[(value ^ byte) & 0xff]! ^ (value >>> 8)
  return (value ^ 0xffffffff) >>> 0
}

async function buildZip(entries: ReadonlyArray<ZipEntry>, compress: boolean): Promise<Uint8Array> {
  const localChunks: Uint8Array[] = []
  const centralChunks: Uint8Array[] = []
  let offset = 0

  for (const entry of entries) {
    const name = encoder.encode(entry.name)
    const crc = crc32(entry.data)
    const method = compress && typeof CompressionStream !== 'undefined' ? 8 : 0
    const payload = method === 8 ? await deflateRaw(entry.data) : entry.data

    const local = new Uint8Array(30)
    const localView = new DataView(local.buffer)
    localView.setUint32(0, 0x04034b50, true)
    localView.setUint16(4, 20, true)
    localView.setUint16(6, 0x0800, true) // UTF-8 文件名
    localView.setUint16(8, method, true)
    localView.setUint16(10, 0, true) // time
    localView.setUint16(12, 0x0021, true) // 1980-01-01
    localView.setUint32(14, crc, true)
    localView.setUint32(18, payload.length, true)
    localView.setUint32(22, entry.data.length, true)
    localView.setUint16(26, name.length, true)
    localView.setUint16(28, 0, true)
    localChunks.push(local, name, payload)

    const central = new Uint8Array(46)
    const centralView = new DataView(central.buffer)
    centralView.setUint32(0, 0x02014b50, true)
    centralView.setUint16(4, 20, true)
    centralView.setUint16(6, 20, true)
    centralView.setUint16(8, 0x0800, true)
    centralView.setUint16(10, method, true)
    centralView.setUint16(12, 0, true)
    centralView.setUint16(14, 0x0021, true)
    centralView.setUint32(16, crc, true)
    centralView.setUint32(20, payload.length, true)
    centralView.setUint32(24, entry.data.length, true)
    centralView.setUint16(28, name.length, true)
    centralView.setUint16(30, 0, true)
    centralView.setUint16(32, 0, true)
    centralView.setUint16(34, 0, true)
    centralView.setUint16(36, 0, true)
    centralView.setUint32(38, 0, true)
    centralView.setUint32(42, offset, true)
    centralChunks.push(central, name)

    offset += local.length + name.length + payload.length
  }

  const centralSize = centralChunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const end = new Uint8Array(22)
  const endView = new DataView(end.buffer)
  endView.setUint32(0, 0x06054b50, true)
  endView.setUint16(8, entries.length, true)
  endView.setUint16(10, entries.length, true)
  endView.setUint32(12, centralSize, true)
  endView.setUint32(16, offset, true)

  return concatBytes([...localChunks, ...centralChunks, end])
}

async function readZip(buffer: ArrayBuffer): Promise<Map<string, Uint8Array>> {
  const bytes = new Uint8Array(buffer)
  const view = new DataView(buffer)
  const eocd = findEocd(bytes, view)
  const count = view.getUint16(eocd + 10, true)
  let cursor = view.getUint32(eocd + 16, true)
  const result = new Map<string, Uint8Array>()

  for (let index = 0; index < count; index++) {
    if (view.getUint32(cursor, true) !== 0x02014b50) break
    const method = view.getUint16(cursor + 10, true)
    const compressedSize = view.getUint32(cursor + 20, true)
    const nameLength = view.getUint16(cursor + 28, true)
    const extraLength = view.getUint16(cursor + 30, true)
    const commentLength = view.getUint16(cursor + 32, true)
    const localOffset = view.getUint32(cursor + 42, true)
    const name = decoder.decode(bytes.subarray(cursor + 46, cursor + 46 + nameLength))

    if (view.getUint32(localOffset, true) === 0x04034b50) {
      const localNameLength = view.getUint16(localOffset + 26, true)
      const localExtraLength = view.getUint16(localOffset + 28, true)
      const start = localOffset + 30 + localNameLength + localExtraLength
      const payload = bytes.subarray(start, start + compressedSize)
      result.set(name, method === 8 ? await inflateRaw(payload) : payload)
    }
    cursor += 46 + nameLength + extraLength + commentLength
  }
  return result
}

function findEocd(bytes: Uint8Array, view: DataView): number {
  const lower = Math.max(0, bytes.length - 22 - 0xffff)
  for (let index = bytes.length - 22; index >= lower; index--) {
    if (view.getUint32(index, true) === 0x06054b50) return index
  }
  throw new Error('[SheetX] 非法 XLSX：找不到 ZIP 结束记录')
}

async function deflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data.slice().buffer as ArrayBuffer])
    .stream()
    .pipeThrough(new CompressionStream('deflate-raw'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data.slice().buffer as ArrayBuffer])
    .stream()
    .pipeThrough(new DecompressionStream('deflate-raw'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

function concatBytes(chunks: ReadonlyArray<Uint8Array>): Uint8Array {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const result = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.length
  }
  return result
}

// ---------------------------------------------------------------------------
// XML / 文本小工具
// ---------------------------------------------------------------------------

function textOf(data: Uint8Array | undefined): string {
  return data ? decoder.decode(data) : ''
}

function escapeXml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function decodeXml(text: string): string {
  return text
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&amp;', '&')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal: string) => String.fromCodePoint(Number(decimal)))
}

function attr(tag: string, name: string): string | undefined {
  const match = tag.match(new RegExp(`\\b${name}="([^"]*)"`))
  return match?.[1]
}

function collectTag(xml: string, tag: string): string {
  return xml.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`))?.[1] ?? ''
}

function collectTextTags(xml: string): string {
  return [...xml.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)]
    .map((match) => decodeXml(match[1] ?? ''))
    .join('')
}

function resolvePartPath(target: string): string {
  const clean = target.replace(/^\//, '')
  return clean.startsWith('xl/') ? clean : `xl/${clean}`
}

function colName(index: number): string {
  let value = index + 1
  let name = ''
  while (value > 0) {
    const remainder = (value - 1) % 26
    name = String.fromCharCode(65 + remainder) + name
    value = Math.floor((value - 1) / 26)
  }
  return name || 'A'
}

function colIndexFromRef(ref: string): number | undefined {
  const letters = ref.match(/^[A-Z]+/i)?.[0]
  if (!letters) return undefined
  let index = 0
  for (const char of letters.toUpperCase()) index = index * 26 + (char.charCodeAt(0) - 64)
  return index - 1
}

function isNumericText(text: string): boolean {
  if (!/^-?\d+(\.\d+)?$/.test(text)) return false
  return String(Number(text)) === text
}
