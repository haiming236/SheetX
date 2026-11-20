/**
 * @sheetx/data - Sheet 模式存储：工作表 + 样式表
 *
 * 工作表 = 稀疏单元格矩阵（SparseMatrix<CellData>）+ 行列尺寸覆盖表 + 合并区域 + 样式引用表。
 *
 * 样式引用表（借鉴 Univer「样式集中存放、cell 只存 styleId」思想）：
 * 千万个格子往往只共享几十种样式组合——内联样式会让内存和 JSON 体积爆炸，
 * 引用表让「改一个样式对象」天然等于改了所有引用它的格子。
 */

import type { CellData, CellRange, CellValue, WorksheetMeta } from '@sheetx/core'
import { SparseMatrix } from './sparse.js'

/** 单元格样式（可序列化，样式表内去重存储） */
export interface CellStyle {
  bold?: boolean
  italic?: boolean
  underline?: boolean
  fontSize?: number
  fontFamily?: string
  color?: string
  background?: string
  /** 水平对齐：left / center / right */
  hAlign?: 'left' | 'center' | 'right'
  /** 垂直对齐：top / middle / bottom */
  vAlign?: 'top' | 'middle' | 'bottom'
  /** 数字/日期格式串，如 "0.00"、"#,##0"、"yyyy-mm-dd"、"0%" */
  numFmt?: string
  /** 边框（按边独立设置；值为 CSS 颜色） */
  border?: {
    top?: string
    right?: string
    bottom?: string
    left?: string
  }
}

/**
 * 样式表：样式对象 → 去重 ID。
 * put 相同内容返回相同 id（JSON 序列化做键），这是样式去重的核心。
 */
export class StyleTable {
  private byId = new Map<number, CellStyle>()
  private keyToId = new Map<string, number>()
  private nextStyleId = 1

  put(style: CellStyle): number {
    const key = JSON.stringify(style)
    const existing = this.keyToId.get(key)
    if (existing !== undefined) return existing
    const id = this.nextStyleId++
    this.keyToId.set(key, id)
    this.byId.set(id, style)
    return id
  }

  /** 以已知 id 写入（快照重建用；id 冲突时沿用已存在的映射） */
  putWithId(id: number, style: CellStyle): void {
    const key = JSON.stringify(style)
    const existing = this.keyToId.get(key)
    if (existing !== undefined) return // 同内容不同 id 的快照场景：保留先到的
    this.keyToId.set(key, id)
    this.byId.set(id, style)
    if (id >= this.nextStyleId) this.nextStyleId = id + 1
  }

  get(id: number): CellStyle | undefined {
    return this.byId.get(id)
  }

  /** 删除样式引用（格子清样式时调用；未做引用计数，压缩接口留给 v2） */
  getAll(): Array<{ id: number; style: CellStyle }> {
    return [...this.byId.entries()].map(([id, style]) => ({ id, style }))
  }

  clear(): void {
    this.byId.clear()
    this.keyToId.clear()
    this.nextStyleId = 1
  }
}

/** 合并区域：range.start 是主格（内容所在），其余格子是被覆盖格 */
export interface MergeRange {
  range: CellRange
}

/** 工作表存储：稀疏单元格 + 尺寸覆盖 + 合并 + 样式表 */
export class WorksheetStore {
  readonly cells = new SparseMatrix<CellData>()
  readonly styles = new StyleTable()

  /** 行高覆盖表：只有与默认值不同的行才记录（稀疏思想同样适用于布局数据） */
  readonly rowHeights = new Map<number, number>()
  readonly colWidths = new Map<number, number>()

  defaultRowHeight = 24
  defaultColWidth = 100

  private merges: MergeRange[] = []
  /** 主格 → 合并区域 的反查索引，命中测试 O(1) */
  private mergeAnchorIndex = new Map<string, MergeRange>()

  constructor(
    readonly id: string,
    public name: string,
    public rowCount: number,
    public columnCount: number,
  ) {}

  getMeta(): WorksheetMeta {
    return { id: this.id, name: this.name, rowCount: this.rowCount, columnCount: this.columnCount }
  }

  // ---------- 单元格 ----------

  getCellData(row: number, col: number): CellData | undefined {
    return this.cells.get(row, col)
  }

  /** 原始值（不含公式计算结果——计算值由 formula 引擎的缓存提供） */
  getRawValue(row: number, col: number): CellValue {
    return this.cells.get(row, col)?.v ?? null
  }

  /**
   * 写入单元格数据。data 为 null/undefined 时删除整个格子。
   * 返回旧数据（供 Mutation 反演）；无旧数据返回 undefined。
   */
  setCellData(row: number, col: number, data: CellData | null | undefined): CellData | undefined {
    const old = this.cells.get(row, col)
    if (data === null || data === undefined) {
      if (old === undefined) return undefined
      this.cells.delete(row, col)
      return old
    }
    // CellData 全空等价于删除——维持稀疏不变量
    const isEmpty = data.v === undefined && data.f === undefined && data.s === undefined && data.t === undefined
    if (isEmpty) {
      if (old === undefined) return undefined
      this.cells.delete(row, col)
      return old
    }
    this.cells.set(row, col, data)
    return old
  }

  // ---------- 行列尺寸 ----------

  getRowHeight(row: number): number {
    return this.rowHeights.get(row) ?? this.defaultRowHeight
  }

  getColWidth(col: number): number {
    return this.colWidths.get(col) ?? this.defaultColWidth
  }

  setRowHeight(row: number, height: number): number {
    const old = this.getRowHeight(row)
    if (height === this.defaultRowHeight) this.rowHeights.delete(row)
    else this.rowHeights.set(row, height)
    return old
  }

  setColWidth(col: number, width: number): number {
    const old = this.getColWidth(col)
    if (width === this.defaultColWidth) this.colWidths.delete(col)
    else this.colWidths.set(col, width)
    return old
  }

  // ---------- 合并区域 ----------

  addMerge(range: CellRange): void {
    // 归一化（start > end 的输入钳正）
    const normalized: CellRange = {
      start: { row: Math.min(range.start.row, range.end.row), col: Math.min(range.start.col, range.end.col) },
      end: { row: Math.max(range.start.row, range.end.row), col: Math.max(range.start.col, range.end.col) },
    }
    const merge: MergeRange = { range: normalized }
    this.merges.push(merge)
    this.mergeAnchorIndex.set(`${normalized.start.row},${normalized.start.col}`, merge)
  }

  removeMerge(anchorRow: number, anchorCol: number): MergeRange | undefined {
    const key = `${anchorRow},${anchorCol}`
    const merge = this.mergeAnchorIndex.get(key)
    if (!merge) return undefined
    this.mergeAnchorIndex.delete(key)
    this.merges = this.merges.filter((m) => m !== merge)
    return merge
  }

  /** 命中测试：坐标落在某个合并区域内时返回该区域（含主格坐标） */
  findMergeAt(row: number, col: number): MergeRange | undefined {
    // 先查主格反查索引（O(1) 快路径），再做线性兜底（合并数量通常很少）
    const anchor = this.mergeAnchorIndex.get(`${row},${col}`)
    if (anchor) return anchor
    for (const merge of this.merges) {
      const { start, end } = merge.range
      if (row >= start.row && row <= end.row && col >= start.col && col <= end.col) return merge
    }
    return undefined
  }

  getMerges(): readonly MergeRange[] {
    return this.merges
  }

  // ---------- 结构调整 ----------

  resize(rowCount: number, columnCount: number): void {
    this.rowCount = rowCount
    this.columnCount = columnCount
  }

  /** 快照（可 JSON 序列化；供持久化/Worker 传输） */
  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      rowCount: this.rowCount,
      columnCount: this.columnCount,
      cells: this.cells.toJSON(),
      styles: this.styles.getAll().map(({ id, style }) => ({ id, style })),
      rowHeights: Object.fromEntries(this.rowHeights),
      colWidths: Object.fromEntries(this.colWidths),
      defaultRowHeight: this.defaultRowHeight,
      defaultColWidth: this.defaultColWidth,
      merges: this.merges.map((m) => m.range),
    }
  }

  /** 从快照重建（加载/Worker 回传） */
  static fromJSON(json: Record<string, unknown>): WorksheetStore {
    const sheet = new WorksheetStore(
      String(json.id),
      String(json.name),
      Number(json.rowCount),
      Number(json.columnCount),
    )
    SparseMatrix.fromJSON<CellData>((json.cells as never) ?? undefined).forEach((row, col, value) => {
      sheet.cells.set(row, col, value)
    })
    const styles = (json.styles as Array<{ id: number; style: CellStyle }>) ?? []
    for (const { id, style } of styles) sheet.styles.putWithId(id, style)
    const rowHeights = (json.rowHeights as Record<string, number>) ?? {}
    for (const key of Object.keys(rowHeights)) sheet.rowHeights.set(Number(key), rowHeights[key]!)
    const colWidths = (json.colWidths as Record<string, number>) ?? {}
    for (const key of Object.keys(colWidths)) sheet.colWidths.set(Number(key), colWidths[key]!)
    sheet.defaultRowHeight = Number(json.defaultRowHeight ?? 24)
    sheet.defaultColWidth = Number(json.defaultColWidth ?? 100)
    for (const range of (json.merges as CellRange[]) ?? []) sheet.addMerge(range)
    return sheet
  }
}
