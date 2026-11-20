/**
 * @sheetx/formula - 区间空间索引（E2）
 *
 * 依赖图从「节点线性扫描 + 区间包含判断」升级为空间索引（阶段二任务书 E2）。
 *
 * 实现选型（对照研究报告 §10 的 Univer 方案）：
 * - Univer 用 rbush（外部依赖）；任务书工程纪律要求引擎包零外部运行时依赖，
 *   故此处自研 **STR 批量装载 R-Tree**（Sort-Tile-Recursive，O(n log n) 建树）；
 * - 懒重建策略：insert/remove 只标脏，下次查询时整树重建——公式格的增删
 *   相对「值编辑」是低频操作（编辑值不触图），批量写公式后一次重算只建一次树，
 *   摊销成本最优；
 * - **超大区间单独线性表**：整列引用（A:A，高度百万）会把 R-Tree 节点 MBR
 *   撑到退化成全表扫描——超过阈值（行高 4096 / 列宽 256）的区间不进树，
 *   放入独立数组每次查询线性扫（此类区间在真实工作簿中占比极小）。
 */

export interface SpatialRect {
  r1: number
  c1: number
  r2: number
  c2: number
}

/** 叶子容量（STR packing 每节点条目数） */
const NODE_CAPACITY = 8

interface RTreeNode {
  mbr: SpatialRect
  children: Array<RTreeNode | { id: string; rect: SpatialRect }>
  leaf: boolean
}

export class RectIndex {
  private items = new Map<string, SpatialRect>()
  private giants: Array<{ id: string; rect: SpatialRect }> = []
  private dirty = true
  private root: RTreeNode | null = null

  /** 条目数（不含失效状态） */
  get size(): number {
    return this.items.size
  }

  insert(id: string, rect: SpatialRect): void {
    this.items.set(id, rect)
    this.dirty = true
  }

  remove(id: string): void {
    this.items.delete(id)
    this.dirty = true
  }

  invalidate(): void {
    this.dirty = true
  }

  /**
   * 查询所有与目标矩形相交的 id。
   * 返回值可能包含同一逻辑对象的多个条目（由调用方按需去重）。
   */
  query(r1: number, c1: number, r2: number, c2: number): string[] {
    this.ensureBuilt()
    const out: string[] = []
    // 超大区间线性扫描（不进树）
    for (const giant of this.giants) {
      if (rectsIntersect(giant.rect, r1, c1, r2, c2)) out.push(giant.id)
    }
    if (this.root) {
      const stack: RTreeNode[] = [this.root]
      while (stack.length > 0) {
        const node = stack.pop()!
        if (!rectsIntersect(node.mbr, r1, c1, r2, c2)) continue
        for (const child of node.children) {
          if ('leaf' in child) {
            // 内部节点
            if (rectsIntersect(child.mbr, r1, c1, r2, c2)) stack.push(child)
          } else if (rectsIntersect(child.rect, r1, c1, r2, c2)) {
            out.push(child.id)
          }
        }
      }
    }
    return out
  }

  /** 懒重建：任何变更后的首次查询触发 STR 批量建树 */
  private ensureBuilt(): void {
    if (!this.dirty) return
    this.dirty = false
    this.giants = []
    const leafEntries: Array<{ id: string; rect: SpatialRect }> = []
    for (const [id, rect] of this.items) {
      if (rect.r2 - rect.r1 > 4096 || rect.c2 - rect.c1 > 256) {
        this.giants.push({ id, rect }) // 超大区间不进树
      } else {
        leafEntries.push({ id, rect })
      }
    }
    this.root = buildSTR(leafEntries)
  }
}

// ---------------------------------------------------------------------------
// STR 批量装载（Sort-Tile-Recursive）
// ---------------------------------------------------------------------------

function buildSTR(entries: Array<{ id: string; rect: SpatialRect }>): RTreeNode | null {
  if (entries.length === 0) return null
  // 1. 按 x（列）中心排序，切成竖条
  const byX = [...entries].sort(
    (a, b) => center(a.rect, 'c') - center(b.rect, 'c'),
  )
  const stripCount = Math.ceil(entries.length / NODE_CAPACITY)
  const stripSize = Math.ceil(entries.length / stripCount)
  // 2. 每个竖条内按 y（行）中心排序，每 M 个打成叶子
  const leaves: RTreeNode[] = []
  for (let s = 0; s < entries.length; s += stripSize) {
    const strip = byX.slice(s, s + stripSize).sort(
      (a, b) => center(a.rect, 'r') - center(b.rect, 'r'),
    )
    for (let i = 0; i < strip.length; i += NODE_CAPACITY) {
      const chunk = strip.slice(i, i + NODE_CAPACITY)
      leaves.push({ mbr: mbrOf(chunk.map((entry) => entry.rect)), children: chunk, leaf: true })
    }
  }
  // 3. 逐层向上打包（同样 STR）
  let level = leaves
  while (level.length > 1) {
    level.sort((a, b) => center(a.mbr, 'c') - center(b.mbr, 'c'))
    const nodes: RTreeNode[] = []
    const groupSize = NODE_CAPACITY
    for (let i = 0; i < level.length; i += groupSize) {
      const chunk = level.slice(i, i + groupSize)
      nodes.push({ mbr: mbrOf(chunk.map((child) => child.mbr)), children: chunk, leaf: false })
    }
    level = nodes
  }
  return level[0] ?? null
}

function center(rect: SpatialRect, axis: 'r' | 'c'): number {
  return axis === 'r' ? (rect.r1 + rect.r2) / 2 : (rect.c1 + rect.c2) / 2
}

function mbrOf(rects: ReadonlyArray<SpatialRect>): SpatialRect {
  let r1 = Infinity
  let c1 = Infinity
  let r2 = -Infinity
  let c2 = -Infinity
  for (const rect of rects) {
    if (rect.r1 < r1) r1 = rect.r1
    if (rect.c1 < c1) c1 = rect.c1
    if (rect.r2 > r2) r2 = rect.r2
    if (rect.c2 > c2) c2 = rect.c2
  }
  return { r1, c1, r2, c2 }
}

function rectsIntersect(rect: SpatialRect, r1: number, c1: number, r2: number, c2: number): boolean {
  return rect.r1 <= r2 && r1 <= rect.r2 && rect.c1 <= c2 && c1 <= rect.c2
}
