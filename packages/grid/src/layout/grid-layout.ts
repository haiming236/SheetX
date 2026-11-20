/**
 * @sheetx/grid - 总布局（几何中枢）
 *
 * 职责：把「滚动偏移 + 视口尺寸 + 行列模型 + 冻结配置」翻译成几何事实——
 * 可见区间、单元格矩形、命中测试。interaction 包的 hitTest 回调就委托到这里。
 *
 * 分区模型（Univer 9 视口的 Grid 模式简化版，见研究报告 §04）：
 *   +--------+---------------------+
 *   | corner | 列头（固定）          |
 *   +--------+---------------------+
 *   | 行头   | 冻结列 | 主区        |
 *   |（固定） |        |             |
 *   +--------+---------------------+
 * 冻结列固定在内容区左缘；冻结行固定在顶部（frozenRowCount）。
 */

import type { Rect, Size } from '@sheetx/core'
import type { HitTarget } from '@sheetx/interaction'
import { ColumnModel } from './col-model.js'
import { RowModel } from './row-model.js'

export const ROW_HEADER_WIDTH = 48
export const COL_HEADER_HEIGHT = 24
/** 视口外预渲染缓冲（行数）——滚动时不至于露白（Univer bufferEdge 的行数版） */
const VISIBLE_BUFFER = 5

export interface VisibleWindow {
  firstRow: number
  lastRow: number
  firstCol: number
  lastCol: number
}

export class GridLayout {
  readonly rows = new RowModel()
  readonly cols = new ColumnModel()
  /** 冻结行数（默认 0；freezeRows API 设置） */
  frozenRowCount = 0

  /** 视口尺寸（CSS px） */
  viewportSize: Size = { width: 0, height: 0 }
  /** 滚动偏移（content 坐标） */
  scroll = { x: 0, y: 0 }

  // ---------- 总尺寸 ----------

  /** 内容区总尺寸（滚动 spacer 的尺寸 = 表头带 + 内容） */
  getContentSize(): Size {
    return {
      width: ROW_HEADER_WIDTH + this.cols.totalWidth,
      height: COL_HEADER_HEIGHT + this.rows.totalHeight,
    }
  }

  /** 可滚动范围上限 */
  get maxScrollX(): number {
    return Math.max(0, this.cols.totalWidth - (this.viewportSize.width - ROW_HEADER_WIDTH))
  }

  get maxScrollY(): number {
    return Math.max(0, this.rows.totalHeight - (this.viewportSize.height - COL_HEADER_HEIGHT))
  }

  clampScroll(x: number, y: number): { x: number; y: number } {
    return { x: Math.max(0, Math.min(x, this.maxScrollX)), y: Math.max(0, Math.min(y, this.maxScrollY)) }
  }

  // ---------- 坐标转换 ----------

  /** 冻结行带总高（视口顶部固定区域，不含列头） */
  get frozenBandHeight(): number {
    if (this.frozenRowCount <= 0) return 0
    return this.rows.offsetOf(this.frozenRowCount)
  }

  /** 冻结列带总宽（视口左侧固定区域，不含行头） */
  get frozenBandWidth(): number {
    return this.cols.frozenWidth
  }

  /** 第 row 行的视口 y（已含滚动；冻结行钉在列头下方，不随滚动位移） */
  rowToViewportY(row: number): number {
    if (row < this.frozenRowCount) return COL_HEADER_HEIGHT + this.rows.offsetOf(row)
    return COL_HEADER_HEIGHT + this.rows.offsetOf(row) - this.scroll.y
  }

  /** 第 col 列的视口 x（已含滚动；冻结列不受影响） */
  colToViewportX(col: number): number {
    if (col < this.cols.frozenCount) return ROW_HEADER_WIDTH + this.cols.offsetOf(col)
    return ROW_HEADER_WIDTH + this.cols.offsetOf(col) - this.scroll.x
  }

  /** 视口坐标 → 内容坐标（主区；冻结带内请用 row/col AtViewport 系列） */
  toContent(point: { x: number; y: number }): { x: number; y: number } {
    return { x: point.x - ROW_HEADER_WIDTH + this.scroll.x, y: point.y - COL_HEADER_HEIGHT + this.scroll.y }
  }

  /** 视口 x → 列号（冻结列感知：冻结带内按固定坐标解析，主区按滚动坐标） */
  colAtViewportX(x: number): number {
    if (this.cols.frozenCount > 0 && x < ROW_HEADER_WIDTH + this.cols.frozenWidth) {
      return this.cols.indexAtOffset(Math.max(0, x - ROW_HEADER_WIDTH))
    }
    return this.cols.indexAtOffset(Math.max(0, x - ROW_HEADER_WIDTH + this.scroll.x))
  }

  /** 视口 y → 行号（E3 冻结行感知：冻结带内按固定坐标解析，主区按滚动坐标） */
  rowAtViewportY(y: number): number {
    const frozenBand = this.frozenBandHeight
    if (this.frozenRowCount > 0 && y < COL_HEADER_HEIGHT + frozenBand) {
      return this.rows.indexAtOffset(Math.max(0, y - COL_HEADER_HEIGHT))
    }
    return this.rows.indexAtOffset(Math.max(0, y - COL_HEADER_HEIGHT + this.scroll.y))
  }

  // ---------- 可见窗口 ----------

  /** 主区可见窗口（E3：不含冻结行——冻结行由场景构建器单独成带绘制） */
  getVisibleWindow(): VisibleWindow {
    const frozenBand = this.frozenBandHeight
    const mainViewportHeight = Math.max(0, this.viewportSize.height - COL_HEADER_HEIGHT - frozenBand)
    // 主区视口顶对应的内容偏移 = 冻结带末端 + 滚动量
    const contentTop = Math.max(0, frozenBand + this.scroll.y)
    const minRow = this.frozenRowCount
    const firstRow = Math.max(minRow, this.rows.indexAtOffset(contentTop) - VISIBLE_BUFFER)
    const bottomY = contentTop + mainViewportHeight
    const lastRow = Math.min(this.rows.rowCount - 1, this.rows.indexAtOffset(bottomY) + VISIBLE_BUFFER)
    // 公共 API 语义保持兼容：可见窗口仍包含冻结列；场景层会过滤出主区列
    const contentLeft = Math.max(0, this.scroll.x)
    const firstCol = Math.max(0, this.cols.indexAtOffset(contentLeft) - VISIBLE_BUFFER)
    const rightX = contentLeft + Math.max(0, this.viewportSize.width - ROW_HEADER_WIDTH)
    const lastCol = Math.min(this.cols.count - 1, this.cols.indexAtOffset(rightX) + VISIBLE_BUFFER)
    return { firstRow, lastRow: Math.max(lastRow, firstRow - 1), firstCol, lastCol: Math.max(lastCol, firstCol - 1) }
  }

  // ---------- 单元格矩形 ----------

  /** 单元格视口矩形（编辑器定位/自动滚动用）；越界不可见返回 null */
  getCellRect(row: number, col: number): Rect | null {
    if (row < 0 || row >= this.rows.rowCount || col < 0 || col >= this.cols.count) return null
    const x = this.colToViewportX(col)
    const y = this.rowToViewportY(row)
    return {
      x,
      y,
      width: this.cols.getWidth(col),
      height: this.rows.getHeight(row),
    }
  }

  /** 单元格在「视口内完全可见」吗（键盘导航的 ensureVisible 判定；E3 冻结行感知） */
  isCellVisible(row: number, col: number): boolean {
    const rect = this.getCellRect(row, col)
    if (!rect) return false
    // 冻结行只需在列头之下；主区行必须完整处于冻结带之下
    const topBound = row < this.frozenRowCount ? COL_HEADER_HEIGHT : COL_HEADER_HEIGHT + this.frozenBandHeight
    return (
      rect.x >= ROW_HEADER_WIDTH &&
      rect.y >= topBound &&
      rect.x + rect.width <= this.viewportSize.width &&
      rect.y + rect.height <= this.viewportSize.height
    )
  }


  // ---------- 命中测试 ----------

  /** 视口坐标 → 命中目标（interaction 的 hitTest 回调实现） */
  hitTest(point: { x: number; y: number }): HitTarget | null {
    // 角落
    if (point.x < ROW_HEADER_WIDTH && point.y < COL_HEADER_HEIGHT) {
      return { kind: 'corner', row: -1, col: -1 }
    }
    // 行头（含行高调整手柄：行底缘或下一行顶缘 3px 内；E3 冻结行感知解析）
    if (point.x < ROW_HEADER_WIDTH && point.y >= COL_HEADER_HEIGHT) {
      const row = this.rowAtViewportY(point.y)
      const bottom = this.rowToViewportY(row) + this.rows.getHeight(row)
      if (Math.abs(point.y - bottom) <= 3) {
        return { kind: 'rowResize', row, col: -1, handleIndex: row }
      }
      const top = this.rowToViewportY(row)
      if (row > 0 && Math.abs(point.y - top) <= 3) {
        return { kind: 'rowResize', row: row - 1, col: -1, handleIndex: row - 1 }
      }
      return { kind: 'rowHeader', row, col: -1 }
    }
    // 列头（含列宽调整手柄：列右缘/左缘 3px 内）
    if (point.y < COL_HEADER_HEIGHT && point.x >= ROW_HEADER_WIDTH) {
      const col = this.colAtViewportX(point.x)
      // 在内容坐标里比较边界：冻结列不加 scroll，主区列加 scroll
      const frozenHere = col < this.cols.frozenCount
      const shift = frozenHere ? 0 : this.scroll.x
      const right = ROW_HEADER_WIDTH + this.cols.offsetOf(col) + this.cols.getWidth(col) - shift
      if (Math.abs(point.x - right) <= 3) {
        return { kind: 'colResize', row: -1, col, handleIndex: col }
      }
      // 列头右侧 12px（避开 3px resize 手柄）= 排序热区（点一次升序，再点降序）
      if (point.x >= right - 15 && point.x < right - 3) {
        return { kind: 'colSort', row: -1, col, handleIndex: col }
      }
      // indexAtOffset 在边界像素上返回「下一列」，其左缘即上一列的右缘手柄
      const left = ROW_HEADER_WIDTH + this.cols.offsetOf(col) - shift
      if (col > 0 && Math.abs(point.x - left) <= 3) {
        return { kind: 'colResize', row: -1, col: col - 1, handleIndex: col - 1 }
      }
      return { kind: 'colHeader', row: -1, col }
    }
    // 内容区（E3：冻结行感知的行解析；列不受冻结行影响）
    const row = this.rowAtViewportY(point.y)
    const col = this.colAtViewportX(point.x)
    if (row >= this.rows.rowCount || col >= this.cols.count) return null
    // 填充柄：活动选区右下角 6px 方块
    return { kind: 'cell', row, col }
  }

  /** 填充柄的屏幕矩形（场景绘制与命中都从这里取） */
  getFillHandleRect(range: { start: { row: number; col: number }; end: { row: number; col: number } }): Rect | null {
    const rect = this.getCellRect(range.end.row, range.end.col)
    if (!rect) return null
    return { x: rect.x + rect.width - 3, y: rect.y + rect.height - 3, width: 6, height: 6 }
  }
}
