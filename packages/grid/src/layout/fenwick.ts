/**
 * @sheetx/grid - 树状数组（Fenwick Tree）
 *
 * 可变行高布局索引的核心（正式方案 §2 的明确要求）：
 * - 前缀和：offsetOf(row) —— 第 row 行顶部的累计像素，O(log n)
 * - 点更新：setHeight(row, h) —— 行高变化只改一条路径，O(log n)
 * - 逆查：indexAtOffset(y) —— 滚动位置定位行号，O(log n)
 *
 * 为什么不用普通前缀和数组：行高变化要 O(n) 重排（AG Grid 的 positionRows
 * 就是这么做的，是它 auto-height 昂贵的根源，见研究报告 §03）。
 *
 * 为什么不用二叉树/线段树：树状数组内存只有 8 字节/行（Float64Array，
 * 100 万行 = 8MB），常数更小；逆查用「二分下降」技巧实现，同样 O(log n)。
 */

/** 树状数组：前缀和 / 点更新 / 按前缀和逆查 */
export class FenwickTree {
  private tree: Float64Array
  private readonly size: number

  constructor(size: number, initialValue?: (index: number) => number) {
    this.size = size
    this.tree = new Float64Array(size + 1) // 树状数组 1 基
    // O(n) 线性构建：先填叶子，再逐层向上累加
    for (let i = 0; i < size; i++) {
      this.tree[i + 1] = initialValue ? initialValue(i) : 0
    }
    for (let i = 1; i <= size; i++) {
      const parent = i + (i & -i)
      if (parent <= size) this.tree[parent]! += this.tree[i]!
    }
  }

  /** 单点加 delta：行高从 h0 变为 h1 时调用 add(row, h1 - h0) */
  add(index: number, delta: number): void {
    // index 0 基 → 树内 1 基
    for (let i = index + 1; i <= this.size; i += i & -i) {
      this.tree[i]! += delta
    }
  }

  /** 前缀和：[0..index] 的累计值（含 index；index 越界返回总和） */
  prefixSum(index: number): number {
    let sum = 0
    for (let i = Math.min(index + 1, this.size); i > 0; i -= i & -i) {
      sum += this.tree[i]!
    }
    return sum
  }

  /** 点查询：第 index 个元素的当前值 */
  get(index: number): number {
    return this.prefixSum(index) - this.prefixSum(index - 1)
  }

  /** 总和 */
  total(): number {
    return this.prefixSum(this.size - 1)
  }

  /**
   * 逆查：返回「偏移量 target 落在的元素下标」。
   * 元素 i 覆盖像素区间 [cum(i), cum(i+1))，即最小的 k 使 cum(k+1) > target，
   * 等价于最大的 pos 使 cum(pos) <= target（pos 即目标下标）。
   * 二分下降技巧：从最高位试探累加，O(log n)。
   */
  findIndexByPrefix(target: number): number {
    let position = 0
    let remaining = target
    // 最高 2 的幂：log2(size)
    let bitmask = 1
    while (bitmask * 2 <= this.size) bitmask *= 2
    while (bitmask > 0) {
      const next = position + bitmask
      // >= 而非 >：target 正好压在边界上时归属下一个元素（[10,30) 的 10 归元素 1）
      if (next <= this.size && remaining >= this.tree[next]!) {
        position = next
        remaining -= this.tree[next]!
      }
      bitmask >>= 1
    }
    return Math.min(position, this.size - 1)
  }
}
