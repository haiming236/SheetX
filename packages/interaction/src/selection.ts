/**
 * @sheetx/interaction - 选区模型
 *
 * 借鉴 Tabulator Range 模型（start/end 归一化 + 多 range 共存 + activeRange）
 * 与 Univer ISelectionWithStyle（锚定格与范围分离）的思想。
 *
 * 术语：
 * - anchor（锚点）：选区的起始格，Shift 扩选时固定不动
 * - focus（焦点格）：键盘导航/鼠标拖动到达的格
 * - range：anchor..focus 归一化后的矩形
 */

import type { CellAddress, CellRange } from '@sheetx/core'

/** 归一化：start 恒为左上角、end 恒为右下角（闭区间） */
export function normalizeRange(a: CellAddress, b: CellAddress): CellRange {
  return {
    start: { row: Math.min(a.row, b.row), col: Math.min(a.col, b.col) },
    end: { row: Math.max(a.row, b.row), col: Math.max(a.col, b.col) },
  }
}

export function rangeContains(range: CellRange, row: number, col: number): boolean {
  return row >= range.start.row && row <= range.end.row && col >= range.start.col && col <= range.end.col
}

export function rangeEquals(a: CellRange, b: CellRange): boolean {
  return (
    a.start.row === b.start.row && a.start.col === b.start.col && a.end.row === b.end.row && a.end.col === b.end.col
  )
}

export interface SelectionChangePayload {
  ranges: ReadonlyArray<CellRange>
  activeIndex: number
}

export class SelectionModel {
  private ranges: CellRange[] = []
  private activeIndex = 0
  /** 锚点格（Shift 扩选的固定端） */
  private anchorCell: CellAddress | null = null
  /** 焦点格 */
  private focusCell: CellAddress | null = null
  private changeListener: ((payload: SelectionChangePayload) => void) | null = null

  constructor(bounds: { rowCount: number; colCount: number } = { rowCount: 0, colCount: 0 }) {
    this.bounds = { ...bounds }
  }

  /** 行列总数（导航钳制）；grid 在数据变化时更新 */
  bounds: { rowCount: number; colCount: number }

  setChangeListener(listener: ((payload: SelectionChangePayload) => void) | null): void {
    this.changeListener = listener
  }

  // ---------- 读取 ----------

  getRanges(): readonly CellRange[] {
    return this.ranges
  }

  getActiveRange(): CellRange | null {
    return this.ranges[this.activeIndex] ?? null
  }

  getFocusCell(): CellAddress | null {
    return this.focusCell
  }

  getAnchorCell(): CellAddress | null {
    return this.anchorCell
  }

  getActiveIndex(): number {
    return this.activeIndex
  }

  isEmpty(): boolean {
    return this.ranges.length === 0
  }

  isCellSelected(row: number, col: number): boolean {
    return this.ranges.some((range) => rangeContains(range, row, col))
  }

  /** 单格选中且为唯一活动格（「当前单元格」语义，状态栏/编辑器用） */
  isSingleActiveCell(row: number, col: number): boolean {
    const active = this.getActiveRange()
    if (!active) return false
    return (
      active.start.row === active.end.row &&
      active.start.col === active.end.col &&
      active.start.row === row &&
      active.start.col === col
    )
  }

  // ---------- 变更 ----------

  /** 鼠标点击/程序设定：折叠到单格并重置选区（除非 ctrl 追加） */
  setAnchor(row: number, col: number, options: { additive?: boolean } = {}): void {
    const addr = this.clamp(row, col)
    if (options.additive) {
      // Ctrl+点击：追加一个单格 range，并把它设为活动 range
      const existing = this.ranges.findIndex((range) => rangeContains(range, addr.row, addr.col) && rangeEquals(range, normalizeRange(addr, addr)))
      if (existing >= 0) {
        this.activeIndex = existing
      } else {
        this.ranges.push(normalizeRange(addr, addr))
        this.activeIndex = this.ranges.length - 1
      }
    } else {
      this.ranges = [normalizeRange(addr, addr)]
      this.activeIndex = 0
    }
    this.anchorCell = addr
    this.focusCell = addr
    this.notify()
  }

  /** Shift 扩选 / 拖动：把活动 range 的对角拉到新焦点格 */
  extendTo(row: number, col: number): void {
    if (!this.anchorCell) {
      this.setAnchor(row, col)
      return
    }
    const focus = this.clamp(row, col)
    this.focusCell = focus
    this.ranges[this.activeIndex] = normalizeRange(this.anchorCell, focus)
    this.notify()
  }

  /** Ctrl+方向键：跳到数据块边界——由宿主计算目标格后调 collapseTo（选区模型不做数据感知） */
  collapseTo(row: number, col: number): void {
    this.setAnchor(row, col)
  }

  /** 键盘导航：焦点格移动 dr/dc。extend=true 时 Shift 扩选 */
  moveFocus(dr: number, dc: number, options: { extend?: boolean } = {}): void {
    const focus = this.focusCell ?? { row: 0, col: 0 }
    const next = this.clamp(focus.row + dr, focus.col + dc)
    if (options.extend) {
      if (!this.anchorCell) this.anchorCell = focus
      this.focusCell = next
      this.ranges[this.activeIndex] = normalizeRange(this.anchorCell, next)
    } else {
      this.setAnchor(next.row, next.col)
      return // setAnchor 已 notify
    }
    this.notify()
  }

  selectAll(): void {
    const { rowCount, colCount } = this.bounds
    if (rowCount <= 0 || colCount <= 0) return
    this.ranges = [normalizeRange({ row: 0, col: 0 }, { row: rowCount - 1, col: colCount - 1 })]
    this.activeIndex = 0
    this.anchorCell = { row: 0, col: 0 }
    this.focusCell = { row: rowCount - 1, col: colCount - 1 }
    this.notify()
  }

  selectRows(startRow: number, endRow: number): void {
    const { colCount } = this.bounds
    const range = normalizeRange({ row: startRow, col: 0 }, { row: endRow, col: Math.max(0, colCount - 1) })
    this.ranges = [range]
    this.activeIndex = 0
    this.anchorCell = range.start
    this.focusCell = range.end
    this.notify()
  }

  selectCols(startCol: number, endCol: number): void {
    const { rowCount } = this.bounds
    const range = normalizeRange({ row: 0, col: startCol }, { row: Math.max(0, rowCount - 1), col: endCol })
    this.ranges = [range]
    this.activeIndex = 0
    this.anchorCell = range.start
    this.focusCell = range.end
    this.notify()
  }

  /** 整行并入活动选区（Shift+点击行头扩选） */
  extendToRows(endRow: number): void {
    const { colCount } = this.bounds
    if (!this.anchorCell) {
      this.selectRows(endRow, endRow)
      return
    }
    const range = normalizeRange(this.anchorCell, { row: endRow, col: Math.max(0, colCount - 1) })
    this.ranges[this.activeIndex] = range
    this.focusCell = range.end
    this.notify()
  }

  clear(): void {
    this.ranges = []
    this.activeIndex = 0
    this.anchorCell = null
    this.focusCell = null
    this.notify()
  }

  /** 数据量变化后钳制现有选区（删行后调用，防止选区越界） */
  clampToBounds(): void {
    const { rowCount, colCount } = this.bounds
    if (rowCount <= 0 || colCount <= 0) {
      this.clear()
      return
    }
    const maxRow = rowCount - 1
    const maxCol = colCount - 1
    this.ranges = this.ranges.map((range) =>
      normalizeRange(
        { row: Math.min(range.start.row, maxRow), col: Math.min(range.start.col, maxCol) },
        { row: Math.min(range.end.row, maxRow), col: Math.min(range.end.col, maxCol) },
      ),
    )
    this.activeIndex = Math.min(this.activeIndex, this.ranges.length - 1)
    if (this.anchorCell) {
      this.anchorCell = {
        row: Math.min(this.anchorCell.row, maxRow),
        col: Math.min(this.anchorCell.col, maxCol),
      }
    }
    if (this.focusCell) {
      this.focusCell = {
        row: Math.min(this.focusCell.row, maxRow),
        col: Math.min(this.focusCell.col, maxCol),
      }
    }
    this.notify()
  }

  private clamp(row: number, col: number): CellAddress {
    return {
      row: Math.max(0, Math.min(row, this.bounds.rowCount - 1)),
      col: Math.max(0, Math.min(col, this.bounds.colCount - 1)),
    }
  }

  private notify(): void {
    this.changeListener?.({ ranges: this.ranges, activeIndex: this.activeIndex })
  }
}
