/**
 * @sheetx/core - 数据透视表（M4 高级能力）
 *
 * 零依赖纯逻辑：只消费「记录数组 + 字段配置」，输出可用于渲染/导出的交叉表矩阵。
 * 不依赖 grid / spreadsheet / renderer，Node 与浏览器均可运行。
 *
 * 分组语义：
 * - 行/列维度均支持多级（维度路径用 JSON 键做 Map key，避免分隔符冲突）；
 * - 分组顺序按首次出现（稳定、可预测，不引入 locale 排序的不确定性）；
 * - 空值（null/undefined/''）归入 blankLabel 分组；
 * - sum/avg/min/max 只累计有限数值；count 统计可转为数值的记录数（与 sum/avg 同口径）。
 */

/** 维度字段 */
export interface PivotField {
  key: string
  title?: string
}

export type PivotAggregation = 'sum' | 'count' | 'avg' | 'min' | 'max'

/** 度量字段 */
export interface PivotValue {
  key: string
  agg: PivotAggregation
  title?: string
}

export interface PivotConfig {
  /** 行维度（多级，按顺序外层 → 内层） */
  rows: ReadonlyArray<PivotField>
  /** 列维度（多级） */
  cols: ReadonlyArray<PivotField>
  /** 度量（可多个，输出时按 values 顺序展开在每列之后） */
  values: ReadonlyArray<PivotValue>
  /** 空值分组名，默认 '(空白)' */
  blankLabel?: string
  /** 行总计（沿列方向合计），默认 true */
  rowTotal?: boolean
  /** 列总计（沿行方向合计），默认 true */
  colTotal?: boolean
}

/** 聚合累加器（内部） */
interface Accumulator {
  sum: number
  count: number
  min: number
  max: number
}

export interface PivotResult {
  /** 行维度路径（每行一条） */
  rowKeys: string[][]
  /** 列维度路径（每列一条，未展开度量） */
  colKeys: string[][]
  /** 展示用行标签（多级拼成 ' / '） */
  rowLabels: string[]
  colLabels: string[]
  /** 度量名（输出列顺序为 colKeys × valueKeys） */
  valueKeys: string[]
  /** cells[行][列]，列 = 列维度 × 度量；无记录为 null */
  cells: Array<Array<number | null>>
  /** 每格参与聚合的记录数（与 cells 同形状） */
  counts: number[][]
  /** 行总计（每行 × 度量），rowTotal=false 时为 [] */
  rowTotals: Array<Array<number | null>>
  /** 列总计（每列 × 度量），colTotal=false 时为 [] */
  colTotals: Array<Array<number | null>>
  /** 全局总计（每度量一个值） */
  grandTotal: Array<number | null>
  /** 参与记录总数 */
  recordCount: number
}

function newAccumulator(): Accumulator {
  return { sum: 0, count: 0, min: Infinity, max: -Infinity }
}

function numeric(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function resolve(acc: Accumulator, agg: PivotAggregation): number | null {
  if (acc.count === 0) return null
  switch (agg) {
    case 'sum': return acc.sum
    case 'count': return acc.count
    case 'avg': return acc.sum / acc.count
    case 'min': return acc.min === Infinity ? null : acc.min
    case 'max': return acc.max === -Infinity ? null : acc.max
  }
}

function pathKey(path: ReadonlyArray<string>): string {
  return JSON.stringify(path)
}

/**
 * 构建数据透视表。
 *
 * @param records 记录数组（GridStore 的 RowData.data 或普通对象均可）
 * @param config 维度与度量配置
 */
export function buildPivotTable(
  records: ReadonlyArray<Record<string, unknown>>,
  config: PivotConfig,
): PivotResult {
  const blankLabel = config.blankLabel ?? '(空白)'
  const rowTotal = config.rowTotal ?? true
  const colTotal = config.colTotal ?? true
  const valueFields = config.values
  const valueKeys = valueFields.map((value) => value.title ?? `${value.agg}(${value.key})`)

  // 分组路径收集（保持首次出现顺序）
  const rowPaths: string[][] = []
  const rowIndex = new Map<string, number>()
  const colPaths: string[][] = []
  const colIndex = new Map<string, number>()

  const pathOf = (
    record: Record<string, unknown>,
    fields: ReadonlyArray<PivotField>,
    paths: string[][],
    index: Map<string, number>,
  ): number => {
    const path = fields.map((field) => {
      const value = record[field.key]
      return value === null || value === undefined || value === '' ? blankLabel : String(value)
    })
    const key = pathKey(path)
    let at = index.get(key)
    if (at === undefined) {
      at = paths.length
      paths.push(path)
      index.set(key, at)
    }
    return at
  }

  // 聚合桶：cells[row * colCount + col] = Accumulator[]（每个度量一个）
  const buckets = new Map<string, Accumulator[]>()
  let recordCount = 0
  for (const record of records) {
    const r = pathOf(record, config.rows, rowPaths, rowIndex)
    const c = pathOf(record, config.cols, colPaths, colIndex)
    recordCount++
    const cellKey = `${r}\u0000${c}`
    let accs = buckets.get(cellKey)
    if (!accs) {
      accs = valueFields.map(() => newAccumulator())
      buckets.set(cellKey, accs)
    }
    valueFields.forEach((value, vi) => {
      const acc = accs![vi]!
      const num = numeric(record[value.key])
      if (num !== null) {
        acc.sum += num
        acc.count++
        acc.min = Math.min(acc.min, num)
        acc.max = Math.max(acc.max, num)
      }
    })
  }

  const accsOf = (r: number, c: number): Accumulator[] | undefined => buckets.get(`${r}\u0000${c}`)
  const emptyAccs = (): Accumulator[] => valueFields.map(() => newAccumulator())

  // 输出矩阵（列 = 列维度 × 度量）
  const cells: Array<Array<number | null>> = []
  const counts: number[][] = []
  for (let r = 0; r < rowPaths.length; r++) {
    const cellRow: Array<number | null> = []
    const countRow: number[] = []
    for (let c = 0; c < colPaths.length; c++) {
      const accs = accsOf(r, c) ?? emptyAccs()
      valueFields.forEach((value, vi) => {
        cellRow.push(resolve(accs[vi]!, value.agg))
        countRow.push(accs[vi]!.count)
      })
    }
    cells.push(cellRow)
    counts.push(countRow)
  }

  // 行总计：沿所有列合并每个度量的累加器
  const rowTotals: Array<Array<number | null>> = []
  if (rowTotal) {
    for (let r = 0; r < rowPaths.length; r++) {
      const accs = emptyAccs()
      for (let c = 0; c < colPaths.length; c++) {
        const source = accsOf(r, c)
        if (!source) continue
        source.forEach((acc, vi) => {
          accs[vi]!.sum += acc.sum
          accs[vi]!.count += acc.count
          accs[vi]!.min = Math.min(accs[vi]!.min, acc.min)
          accs[vi]!.max = Math.max(accs[vi]!.max, acc.max)
        })
      }
      rowTotals.push(valueFields.map((value, vi) => resolve(accs[vi]!, value.agg)))
    }
  }

  // 列总计：沿所有行合并
  const colTotals: Array<Array<number | null>> = []
  if (colTotal) {
    for (let c = 0; c < colPaths.length; c++) {
      const accs = emptyAccs()
      for (let r = 0; r < rowPaths.length; r++) {
        const source = accsOf(r, c)
        if (!source) continue
        source.forEach((acc, vi) => {
          accs[vi]!.sum += acc.sum
          accs[vi]!.count += acc.count
          accs[vi]!.min = Math.min(accs[vi]!.min, acc.min)
          accs[vi]!.max = Math.max(accs[vi]!.max, acc.max)
        })
      }
      colTotals.push(valueFields.map((value, vi) => resolve(accs[vi]!, value.agg)))
    }
  }

  const grandAccs = emptyAccs()
  for (const accs of buckets.values()) {
    accs.forEach((acc, vi) => {
      grandAccs[vi]!.sum += acc.sum
      grandAccs[vi]!.count += acc.count
      grandAccs[vi]!.min = Math.min(grandAccs[vi]!.min, acc.min)
      grandAccs[vi]!.max = Math.max(grandAccs[vi]!.max, acc.max)
    })
  }
  const grandTotal = valueFields.map((value, vi) => resolve(grandAccs[vi]!, value.agg))

  return {
    rowKeys: rowPaths,
    colKeys: colPaths,
    rowLabels: rowPaths.map((path) => path.join(' / ')),
    colLabels: colPaths.map((path) => path.join(' / ')),
    valueKeys,
    cells,
    counts,
    rowTotals,
    colTotals,
    grandTotal,
    recordCount,
  }
}

/**
 * 透视结果 → 二维字符串矩阵（带表头），可直接交给 CSV / 打印 / 表格渲染。
 * 布局：左上角空白 + 列标签 × 度量名；每行列标签 + 数据 + 行总计。
 */
export function pivotToMatrix(result: PivotResult, config: PivotConfig): string[][] {
  const header: string[] = config.rows.map((field) => field.title ?? field.key)
  for (let c = 0; c < result.colKeys.length; c++) {
    for (const valueKey of result.valueKeys) {
      header.push(result.colLabels[c]! ? `${result.colLabels[c]} · ${valueKey}` : valueKey)
    }
  }
  if (result.rowTotals.length > 0) header.push(...result.valueKeys.map((key) => `总计 · ${key}`))
  const matrix: string[][] = [header]
  for (let r = 0; r < result.rowKeys.length; r++) {
    const row: string[] = [...result.rowKeys[r]!]
    while (row.length < header.length && row.length < config.rows.length) row.push('')
    for (const cell of result.cells[r]!) row.push(cell === null ? '' : String(Math.round(cell * 1e6) / 1e6))
    for (const total of result.rowTotals[r] ?? []) row.push(total === null ? '' : String(Math.round(total * 1e6) / 1e6))
    matrix.push(row)
  }
  if (result.colTotals.length > 0) {
    const footer: string[] = config.rows.map(() => '总计')
    for (const totals of result.colTotals) {
      for (const total of totals) footer.push(total === null ? '' : String(Math.round(total * 1e6) / 1e6))
    }
    // grandTotal 补在行总计列
    for (const total of result.grandTotal) footer.push(total === null ? '' : String(Math.round(total * 1e6) / 1e6))
    matrix.push(footer)
  }
  return matrix
}
