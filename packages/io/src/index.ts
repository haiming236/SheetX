/**
 * @sheetx/io - 导入导出（任务书 T8）
 *
 * 职责：CSV 读写、XLSX 适配契约、剪贴板格式工具、大批量分批导入。
 *
 * 设计约束：
 * - CSV 自研实现（RFC 4180 状态机：引号转义、CRLF、内嵌换行），
 *   不引第三方库——这是任务书明确的要求，也是中文/Excel 互操作最常翻车的地方。
 * - XLSX 提供零依赖基础适配层（最小 OOXML + ZIP，字符串/数字/合并区域），
 *   复杂 Excel 兼容仍可通过 registerXlsxAdapter 注入 SheetJS 等宿主实现。
 * - 大文件导入通过分批 + 让出主线程保证不卡死 UI；Worker 化由宿主可选启用。
 */

import type { RowData } from '@sheetx/core'
import { normalizeRows } from '@sheetx/data'

export * from './print.js'
export * from './import-report.js'
export * from './xlsx.js'
import { createBuiltinXlsxIO, type BuiltinXlsxOptions } from './xlsx.js'

// ---------------------------------------------------------------------------
// CSV 解析（RFC 4180 状态机）
// ---------------------------------------------------------------------------

export interface CsvParseOptions {
  /** 字段分隔符，默认 ','；';'/'\t' 亦可 */
  delimiter?: string
  /** 是否去除 BOM（Windows 导出的 UTF-8 文件常带 EF BB BF） */
  stripBom?: boolean
}

/**
 * 解析 CSV 文本为二维字符串矩阵。
 *
 * 状态机要点（这是与 Excel 互操作的核心坑位）：
 * 1. 引号字段内允许出现分隔符、换行、连续双引号（"" 转义为 "）
 * 2. 字段开头带引号才算引号字段（`a"b` 中引号是普通字符）
 * 3. CRLF 与 LF 都视为行结束
 */
export function parseCsv(text: string, options: CsvParseOptions = {}): string[][] {
  const delimiter = options.delimiter ?? ','
  let input = text
  if (options.stripBom !== false && input.charCodeAt(0) === 0xfeff) input = input.slice(1)

  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  let fieldWasQuoted = false

  const pushField = (): void => {
    row.push(field)
    field = ''
    fieldWasQuoted = false
  }
  const pushRow = (): void => {
    pushField()
    // 末尾空行容忍：最后一行只有空字段时丢弃
    if (rows.length === 0 || row.length !== 1 || row[0] !== '') rows.push(row)
    row = []
  }

  for (let i = 0; i < input.length; i++) {
    const char = input[i]!
    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"' // "" → 字面引号
          i++
        } else {
          inQuotes = false // 闭合引号
        }
      } else {
        field += char
      }
      continue
    }
    if (char === '"' && field === '' && !fieldWasQuoted) {
      inQuotes = true
      fieldWasQuoted = true
      continue
    }
    if (char === delimiter) {
      pushField()
      continue
    }
    if (char === '\r') {
      if (input[i + 1] === '\n') i++
      pushRow()
      continue
    }
    if (char === '\n') {
      pushRow()
      continue
    }
    field += char
  }
  // 文件末尾没有换行时补最后一行
  if (field !== '' || row.length > 0 || fieldWasQuoted) pushRow()
  return rows
}

export interface CsvStringifyOptions {
  delimiter?: string
  /** 行结束符，默认 '\r\n'（Excel 兼容） */
  newline?: string
}

/** 单元格值 → CSV 字段（含引号规则） */
function csvEscape(value: unknown, delimiter: string): string {
  const text = value === null || value === undefined ? '' : String(value)
  const needsQuote = text.includes('"') || text.includes(delimiter) || text.includes('\n') || text.includes('\r')
  if (!needsQuote) return text
  return `"${text.replaceAll('"', '""')}"`
}

/** 二维矩阵 → CSV 文本 */
export function stringifyCsv(matrix: ReadonlyArray<ReadonlyArray<unknown>>, options: CsvStringifyOptions = {}): string {
  const delimiter = options.delimiter ?? ','
  const newline = options.newline ?? '\r\n'
  return matrix.map((row) => row.map((value) => csvEscape(value, delimiter)).join(delimiter)).join(newline)
}

// ---------------------------------------------------------------------------
// 行记录 ↔ CSV（Grid 模式便捷层）
// ---------------------------------------------------------------------------

export interface CsvColumnSpec {
  key: string
  /** 表头显示名（缺省用 key） */
  title?: string
}

/** 行数组 → CSV（含表头） */
export function rowsToCsv(rows: ReadonlyArray<RowData>, columns: ReadonlyArray<CsvColumnSpec>): string {
  const header = columns.map((col) => col.title ?? col.key)
  const body = rows.map((row) => columns.map((col) => row.data[col.key]))
  return stringifyCsv([header, ...body])
}

export interface CsvToRowsOptions extends CsvParseOptions {
  /** 提供列规格时按 key 对齐（忽略表头名）；不提供则用表头行作为 key */
  columns?: ReadonlyArray<CsvColumnSpec>
  /** CSV 是否含表头行，默认 true */
  hasHeader?: boolean
}

/** CSV → 行数组（自动规整 id；表头作为字段键或按 columns 对齐） */
export function csvToRows(csv: string, options: CsvToRowsOptions = {}): { rows: RowData[]; header: string[] } {
  const matrix = parseCsv(csv, options)
  if (matrix.length === 0) return { rows: [], header: [] }
  const hasHeader = options.hasHeader ?? true
  let header: string[]
  let bodyRows: string[][]
  if (hasHeader) {
    header = matrix[0]!
    bodyRows = matrix.slice(1)
  } else {
    header = (options.columns ?? []).map((col) => col.key)
    bodyRows = matrix
  }
  // columns 显式给出时按 key 对齐（表头名可能被翻译过）
  const keys = options.columns ? options.columns.map((col) => col.key) : header
  const records: Array<Record<string, unknown>> = bodyRows.map((cells) => {
    const record: Record<string, unknown> = {}
    keys.forEach((key, index) => {
      if (key === undefined) return
      const raw = cells[index] ?? ''
      record[key] = raw === '' ? null : raw
    })
    return record
  })
  return { rows: normalizeRows(records), header }
}

// ---------------------------------------------------------------------------
// XLSX 适配契约（内置零依赖基础实现 + 宿主可注入完整实现）
// ---------------------------------------------------------------------------

/** 单元格基础样式（XLSX 最小可互操作子集；不处理富文本/条件格式） */
export interface XlsxCellStyle {
  bold?: boolean
  italic?: boolean
  underline?: boolean
  /** 字体颜色，#RRGGBB */
  fontColor?: string
  /** 纯色填充，#RRGGBB */
  fill?: string
  /** 四边细边框 */
  border?: boolean
  align?: 'left' | 'center' | 'right'
  verticalAlign?: 'top' | 'middle' | 'bottom'
  wrapText?: boolean
  /** Excel 数字格式，如 '#,##0.00' / '0.00%' / 'yyyy-mm-dd' */
  numberFormat?: string
}

/** XLSX 富文本片段（对应 <r>；纯文本单元格不需要填） */
export interface XlsxRichTextRun {
  text: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  /** #RRGGBB */
  fontColor?: string
  fontFamily?: string
  fontSize?: number
}

/** Excel 条件格式规则（对应 cfRule；公式串按 Excel 原文保留，expression 统一带 '='） */
export interface XlsxConditionalFormatRule {
  type: 'cellIs' | 'containsText' | 'colorScale' | 'expression' | 'duplicateValues' | 'top10'
  operator?: 'between' | 'notBetween' | 'equal' | 'notEqual' | 'greaterThan' | 'lessThan' | 'greaterThanOrEqual' | 'lessThanOrEqual'
  /** cellIs / expression 的公式；expression 写 '=A1>10'，cellIs 写比较值 */
  formulas?: string[]
  /** containsText */
  text?: string
  textOperator?: 'contains' | 'notContains' | 'beginsWith' | 'endsWith'
  /** colorScale：按 min / midpoint / max 顺序给出 #RRGGBB */
  colors?: string[]
  /** top10 */
  rank?: number
  percent?: boolean
  bottom?: boolean
  /** dxf 差分样式 */
  fill?: string
  fontColor?: string
  bold?: boolean
}

export interface XlsxConditionalFormat {
  /** 应用区域，A1 记法，如 "B2:B100" */
  sqref: string
  rules: XlsxConditionalFormatRule[]
}

/** Excel 数据验证规则（对应 dataValidation 区块；公式串按 Excel 原文保留） */
export interface XlsxDataValidation {
  type: 'list' | 'whole' | 'decimal' | 'date' | 'textLength' | 'custom'
  /** 应用区域，A1 记法，如 "B2:B100" */
  sqref: string
  operator?: 'between' | 'notBetween' | 'equal' | 'notEqual' | 'greaterThan' | 'lessThan' | 'greaterThanOrEqual' | 'lessThanOrEqual'
  /** formula1 / formula2 原文（列表通常形如 '"苹果,香蕉"'） */
  formulas: string[]
  allowBlank?: boolean
  showErrorMessage?: boolean
  error?: string
  showInputMessage?: boolean
  prompt?: string
}

/** 单个工作表快照（XLSX 解析结果的最小契约） */
export interface XlsxSheetSnapshot {
  name: string
  /** 二维矩阵；单元格值为字符串（宿主可在此做类型转换） */
  cells: string[][]
  /**
   * 可选公式矩阵（与 cells 同坐标；公式串带前导 '='，如 "=SUM(A1:A2)"）。
   * 空串表示该格无公式；读取时只保留公式字符串，不执行计算。
   */
  formulas?: Array<Array<string | null | undefined>>
  /** 可选样式矩阵（与 cells 同坐标；空对象/undefined 表示默认样式） */
  styles?: Array<Array<XlsxCellStyle | null | undefined>>
  /** 合并区域（A1 记法，如 "B2:D4"），可选 */
  merges?: string[]
  /** 数据验证规则，可选 */
  validations?: XlsxDataValidation[]
  /** 条件格式，可选 */
  conditionalFormats?: XlsxConditionalFormat[]
  /** 富文本矩阵（与 cells 同坐标；每个单元格为 run 数组） */
  richText?: Array<Array<XlsxRichTextRun[] | null | undefined>>
}

export interface XlsxParseResult {
  sheets: XlsxSheetSnapshot[]
}

/**
 * XLSX 适配器契约。默认可用零依赖内置实现：
 * ```ts
 * registerBuiltinXlsxAdapter() // 基础字符串/数字/合并区域读写
 * ```
 * 需要公式/样式/日期序列号等完整 Excel 兼容时，宿主可注入 SheetJS 等实现覆盖：
 * ```ts
 * registerXlsxAdapter({ parse: async (data) => ..., build: async (sheets) => ... })
 * ```
 */
export interface IXlsxIO {
  parse(data: ArrayBuffer): Promise<XlsxParseResult>
  build?(sheets: ReadonlyArray<XlsxSheetSnapshot>): Promise<Blob>
}

let xlsxAdapter: IXlsxIO | null = null

export function registerXlsxAdapter(adapter: IXlsxIO | null): void {
  xlsxAdapter = adapter
}

export function getXlsxAdapter(): IXlsxIO | null {
  return xlsxAdapter
}

/** 注册零依赖内置 XLSX 适配器（需完整 Excel 兼容时改用 registerXlsxAdapter 覆盖） */
export function registerBuiltinXlsxAdapter(options?: BuiltinXlsxOptions): IXlsxIO {
  const adapter = createBuiltinXlsxIO(options)
  registerXlsxAdapter(adapter)
  return adapter
}

// ---------------------------------------------------------------------------
// 分批导入：大文件不卡主线程
// ---------------------------------------------------------------------------

/**
 * 分批处理工具。
 * 每批之间让出主线程（macrotask），长任务不会阻塞输入与渲染——
 * 这是「10 万单元格导入后台分批处理」验收标准的主线程版本。
 * 在 Web Worker 中调用本函数同样有效（Worker 内让出的是 Worker 自己的事件循环）。
 */
export async function runInBatches<T>(
  items: ReadonlyArray<T>,
  batchSize: number,
  onBatch: (batch: ReadonlyArray<T>, index: number) => void | Promise<void>,
): Promise<void> {
  for (let start = 0; start < items.length; start += batchSize) {
    const batch = items.slice(start, start + batchSize)
    await onBatch(batch, start / batchSize)
    // 让出主线程：setTimeout(0) 是 macrotask，比 queueMicrotask 更可靠地打断长任务
    await new Promise<void>((resolve) => setTimeout(resolve, 0))
  }
}

export interface ImportCsvOptions extends CsvToRowsOptions {
  /** 每批行数，默认 5000 */
  batchSize?: number
  /** 进度回调（0~1） */
  onProgress?: (progress: number) => void
}

/**
 * CSV → 分批导入到宿主回调。
 * 宿主在 onBatch 里调用 store.insertRows / adapter.save，从而获得
 * 「后台分批处理 + 进度反馈」的导入体验。
 */
export async function importCsvInBatches(
  csv: string,
  handlers: {
    onBatch: (batch: ReadonlyArray<RowData>, progress: number) => void | Promise<void>
    onDone?: (total: number) => void
  },
  options: ImportCsvOptions = {},
): Promise<void> {
  const batchSize = options.batchSize ?? 5000
  const { rows } = csvToRows(csv, options)
  const total = rows.length
  for (let start = 0; start < total; start += batchSize) {
    const batch = rows.slice(start, start + batchSize)
    await handlers.onBatch(batch, total === 0 ? 1 : (start + batch.length) / total)
    await new Promise<void>((resolve) => setTimeout(resolve, 0))
  }
  handlers.onDone?.(total)
}
