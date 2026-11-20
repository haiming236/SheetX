/**
 * @sheetx/grid - 列模型
 *
 * 列数远小于行数（千级 vs 百万级），用简单前缀数组（列宽变化时重建 O(n)）。
 * 冻结列约定：ColumnDef.frozen 的列必须从第 0 列开始**连续**出现（Excel 语义），
 * 中间夹非冻结列视为从第一个非冻结列处截断。
 */

import type { ColumnDef } from '@sheetx/core'

export const DEFAULT_COL_WIDTH = 100

export class ColumnModel {
  private defs: ColumnDef[] = []
  private offsets: number[] = [] // offsets[i] = 第 i 列左边缘（content 坐标）
  private totalWidth_ = 0
  private frozenCount_ = 0
  private frozenWidth_ = 0
  defaultWidth = DEFAULT_COL_WIDTH

  /** 重建（列定义/宽度变化后调用） */
  setColumns(defs: ReadonlyArray<ColumnDef>, defaultWidth?: number): void {
    if (defaultWidth !== undefined) this.defaultWidth = defaultWidth
    this.defs = [...defs]
    this.offsets = new Array(this.defs.length)
    let x = 0
    let frozen = 0
    let frozenBreak = false
    for (let i = 0; i < this.defs.length; i++) {
      this.offsets[i] = x
      const width = this.defs[i]!.width ?? this.defaultWidth
      x += width
      if (this.defs[i]!.frozen && !frozenBreak) frozen++
      else frozenBreak = true
    }
    this.totalWidth_ = x
    this.frozenCount_ = frozen
    this.frozenWidth_ = frozen > 0 ? this.offsets[frozen] ?? x : 0
  }

  /**
   * 运行时设置冻结列数（Excel 语义：从第 0 列起连续冻结）。
   * 原地改标记以保持 def 对象引用稳定（setWidth 等仍作用于同一份定义）。
   */
  setFrozen(count: number): void {
    const next = Math.max(0, Math.min(Math.floor(count), this.defs.length))
    if (next === this.frozenCount_) return
    for (let i = 0; i < this.defs.length; i++) {
      this.defs[i]!.frozen = i < next
    }
    this.setColumns(this.defs)
  }

  get count(): number {
    return this.defs.length
  }

  getDef(col: number): ColumnDef | undefined {
    return this.defs[col]
  }

  getDefs(): readonly ColumnDef[] {
    return this.defs
  }

  getWidth(col: number): number {
    return this.defs[col]?.width ?? this.defaultWidth
  }

  /** 更新单列宽度（列头拖拽）；重建前缀数组（列数少，O(n) 可接受） */
  setWidth(col: number, width: number): void {
    const def = this.defs[col]
    if (!def) return
    def.width = Math.max(20, Math.min(width, 2000))
    this.setColumns(this.defs)
  }

  offsetOf(col: number): number {
    return this.offsets[col] ?? 0
  }

  /** 像素 → 列号 */
  indexAtOffset(x: number): number {
    // 二分：offsets 递增
    let low = 0
    let high = this.offsets.length - 1
    while (low < high) {
      const mid = Math.ceil((low + high) / 2)
      if (this.offsets[mid]! <= x) low = mid
      else high = mid - 1
    }
    return low
  }

  get totalWidth(): number {
    return this.totalWidth_
  }

  get frozenCount(): number {
    return this.frozenCount_
  }

  /** 冻结区总宽（冻结分隔线位置） */
  get frozenWidth(): number {
    return this.frozenWidth_
  }
}
