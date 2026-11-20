/**
 * @sheetx/grid - 行模型（Fenwick 驱动的可变行高布局）
 *
 * 行高默认值 + 稀疏覆盖（Map）+ Fenwick 前缀和索引。
 * 内存账本：100 万行 = 覆盖 Map（只有改过行高的行）+ 8MB Float64 树。
 */

import { FenwickTree } from './fenwick.js'

export class RowModel {
  defaultHeight = 28

  /** 行高覆盖表：只有与默认值不同的行才记录 */
  private overrides = new Map<number, number>()
  private fenwick: FenwickTree | null = null
  private rowCount_ = 0

  get rowCount(): number {
    return this.rowCount_
  }

  /**
   * 设置行数（增删行/setData 后调用）。
   * Fenwick 重建 O(n)——结构变更低频，可接受；日常行高变化走 setHeight O(log n)。
   */
  setRowCount(count: number): void {
    this.rowCount_ = count
    if (count > 0) {
      this.fenwick = new FenwickTree(count, (index) => this.overrides.get(index) ?? this.defaultHeight)
    } else {
      this.fenwick = null
    }
  }

  setDefaultHeight(height: number): void {
    if (height === this.defaultHeight) return
    this.defaultHeight = height
    // 默认值变化影响全表——重建树（结构级低频操作）
    this.setRowCount(this.rowCount_)
  }

  /** 行高变更：O(log n)——不重建树，只更新一条路径 */
  setHeight(row: number, height: number): void {
    const clampedHeight = Math.max(8, Math.min(height, 2000))
    const old = this.getHeight(row)
    if (clampedHeight === this.defaultHeight) this.overrides.delete(row)
    else this.overrides.set(row, clampedHeight)
    if (this.fenwick && old !== clampedHeight) {
      this.fenwick.add(row, clampedHeight - old)
    }
  }

  getHeight(row: number): number {
    return this.overrides.get(row) ?? this.defaultHeight
  }

  /** 行顶部的累计像素（content 坐标） */
  offsetOf(row: number): number {
    if (!this.fenwick) return 0
    return row <= 0 ? 0 : this.fenwick.prefixSum(row - 1)
  }

  /** 像素 → 行号（滚动定位；y 超界返回最后一行） */
  indexAtOffset(y: number): number {
    if (!this.fenwick || this.rowCount_ === 0) return 0
    return this.fenwick.findIndexByPrefix(y + 0.0001)
  }

  get totalHeight(): number {
    return this.fenwick?.total() ?? 0
  }

  /** 行中心 y（编辑器/表头命中用） */
  centerOf(row: number): number {
    return this.offsetOf(row) + this.getHeight(row) / 2
  }
}
