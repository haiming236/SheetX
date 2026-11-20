/**
 * @sheetx/formula - 依赖图
 *
 * 节点 = 公式单元格；边 = 公式引用区间 ⊇ 前置单元格。
 *
 * 阶段二升级（E1 环检测 + E2 空间索引）：
 * - **自环建图时标记**：公式引用包含自身坐标的区间（A3=SUM(A1:A3)）在
 *   setFormula 阶段即置 selfCycle，求值直接产出 #CYCLE!——不把自身旧值
 *   当输入（修复「120→400→490 静默漂移」的正确性 bug）；
 * - **区间环**（A1=SUM(B1:B2)、B1=SUM(A1:A2) 跨表互引同理由 Kahn 检测）：
 *   自环边计入入度（旧实现 `other === node` 跳过自边导致漏检）；
 * - **空间索引**：区间查找从线性扫描升级为 RectIndex（STR R-Tree + 超大
 *   区间线性表，见 spatial.ts）——collectDirty 的三次「谁引用了这个格子」
 *   查询（seeds/扩散/拓扑入度）全部走索引，接口签名不变；
 * - 拓扑排序用 Kahn 算法；拓扑后仍有入度的节点 = 循环引用，标记 #CYCLE!；
 * - 依赖图**持久维护**（写时更新），不做 Luckysheet/FS 式的每次重算全量重建。
 */

import type { AstNode, ExtractedRange } from './ast.js'
import { collectRanges } from './ast.js'
import { RectIndex } from './spatial.js'

/** 依赖图节点 */
export interface FormulaNode {
  /** 唯一键：`${sheet}\u0000${row},${col}`（sheet 名 + 坐标；\u0000 避免与名字撞车） */
  key: string
  sheet: string
  row: number
  col: number
  ast: AstNode
  /** 公式引用的全部区间（sheet 已归一化为实际表名） */
  refs: ExtractedRange[]
  /** 引用了地址类函数（INDIRECT/OFFSET）——每次重算都视为受影响 */
  dynamic: boolean
  /**
   * 自环（E1）：引用区间包含自身坐标。
   * 建图时标记；求值层据此直接产出 #CYCLE!，不执行求值。
   */
  selfCycle: boolean
  /** 空间索引条目 id（graph 管理，求值层不关心） */
  entryIds: string[]
  /** 每条 entryIds 对应的索引桶表名（ref 条目 = 被引用表；cell 条目 = 公式所在表） */
  entrySheets: string[]
}

export function nodeKey(sheet: string, row: number, col: number): string {
  return `${sheet}\u0000${row},${col}`
}

export interface ChangedCell {
  sheet: string
  row: number
  col: number
}

export interface CollectResult {
  /** 拓扑序（依赖在前、下游在后）的待求值节点 */
  order: FormulaNode[]
  /** 循环引用中的节点（按 #CYCLE! 处理） */
  cyclic: Set<string>
}

export class DependencyGraph {
  private nodes = new Map<string, FormulaNode>()
  /** 引用区间索引（entry = 一条 ref 区间）：按格子查「谁引用了我」→ 下游 */
  private refIndexes = new Map<string, RectIndex>()
  /** 公式格位置索引（entry = 节点自身坐标）：按区间查「区间内有哪公式格」→ 前置 */
  private cellIndexes = new Map<string, RectIndex>()
  /** entryId → 节点（两个索引共用回溯表；ref 条目 id 与 cell 条目 id 前缀不同） */
  private entryOwners = new Map<string, FormulaNode>()

  get size(): number {
    return this.nodes.size
  }

  /** 按 key 取节点（O(1)；undo/redo 回放等需要从 key 反查的场景） */
  getNode(key: string): FormulaNode | undefined {
    return this.nodes.get(key)
  }

  /** 设置/替换公式节点；refs 由 AST 提取（sheet=null 的相对引用归一化为公式所在表） */
  setFormula(sheet: string, row: number, col: number, ast: AstNode): FormulaNode {
    const key = nodeKey(sheet, row, col)
    // 替换：先清掉旧条目（区间可能变了）
    const old = this.nodes.get(key)
    if (old) this.removeFromIndex(old)
    const refs = collectRanges(ast, sheet).map((range) => ({ ...range, sheet: range.sheet ?? sheet }))
    // E1：自环检测在建图时完成——引用区间覆盖自身坐标即自环
    const selfCycle = refs.some((range) => range.sheet === sheet && row >= range.r1 && row <= range.r2 && col >= range.c1 && col <= range.c2)
    // 动态函数检测：INDIRECT/OFFSET/INDEX 的引用是运行时决定的，静态提取不可靠
    const dynamic = containsDynamicFunction(ast)
    const node: FormulaNode = { key, sheet, row, col, ast, refs, dynamic, selfCycle, entryIds: [], entrySheets: [] }
    this.nodes.set(key, node)
    // 两个索引：ref 区间条目（下游查询，**按引用目标表分索引**——跨表引用的
    // 下游查询发生在目标表）+ 自身坐标条目（前置查询，公式所在表）。
    // entrySheets 记录每条条目的桶表名，removeFromIndex 按原桶删除（跨表条目
    // 若按公式所在表删会删错桶，留下幽灵引用）。
    refs.forEach((range, i) => {
      const entryId = `ref#${key}#${i}`
      this.ensureRefIndex(range.sheet).insert(entryId, range)
      this.entryOwners.set(entryId, node)
      node.entryIds.push(entryId)
      node.entrySheets.push(range.sheet)
    })
    const cellEntryId = `cell#${key}`
    this.ensureCellIndex(sheet).insert(cellEntryId, { r1: row, c1: col, r2: row, c2: col })
    this.entryOwners.set(cellEntryId, node)
    node.entryIds.push(cellEntryId)
    node.entrySheets.push(sheet)
    return node
  }

  removeFormula(sheet: string, row: number, col: number): void {
    const key = nodeKey(sheet, row, col)
    const node = this.nodes.get(key)
    if (!node) return
    this.removeFromIndex(node)
    this.nodes.delete(key)
  }

  getFormula(sheet: string, row: number, col: number): FormulaNode | undefined {
    return this.nodes.get(nodeKey(sheet, row, col))
  }

  allNodes(): FormulaNode[] {
    return [...this.nodes.values()]
  }

  clear(): void {
    this.nodes.clear()
    this.refIndexes.clear()
    this.cellIndexes.clear()
    this.entryOwners.clear()
  }

  /**
   * 增量收集：给定变更单元格，找出所有受影响节点并拓扑排序（E2：全部区间查询走空间索引）。
   * 算法：
   *   1. seeds = 引用区间覆盖了任一变更单元格的节点 + dynamic 节点；
   *   2. 沿「谁引用了我」的边向下扩散（BFS）；
   *   3. 对受影响子图做 Kahn 拓扑；**自环边计入入度**（E1 修复点）——
   *      自环或区间环上的节点永不就绪，落入 cyclic。
   */
  collectDirty(changed: ReadonlyArray<ChangedCell>): CollectResult {
    const affected = new Set<FormulaNode>()
    const queue: FormulaNode[] = []
    // dynamic 节点一律视为受影响
    for (const node of this.nodes.values()) {
      if (node.dynamic) {
        affected.add(node)
        queue.push(node)
      }
    }
    // seeds：空间索引逐变更单元格查询（去重变更格，大批量粘贴时同格只查一次）
    const seenCells = new Set<string>()
    for (const cell of changed) {
      const cellKey = `${cell.sheet}\u0000${cell.row},${cell.col}`
      if (seenCells.has(cellKey)) continue
      seenCells.add(cellKey)
      this.collectCovering(cell.sheet, cell.row, cell.col, affected, queue)
    }
    if (affected.size === 0) return { order: [], cyclic: new Set() }

    // 下游扩散：节点 A 受影响 → 所有「引用了 A 所在格」的节点也受影响
    while (queue.length > 0) {
      const node = queue.pop()!
      this.collectCovering(node.sheet, node.row, node.col, affected, queue)
    }
    if (affected.size === 0) return { order: [], cyclic: new Set() }

    // Kahn 拓扑（只在受影响子图内）：边 = A 依赖 B（B 是 A 的前置公式格）。
    // 前置查询：node 的每条 ref 区间在「公式格位置索引」里查落在区间内的公式格
    // （同节点多条 ref 命中同一前置时按节点去重，避免入度重复计数）。
    const inDegree = new Map<string, number>()
    const downstream = new Map<string, FormulaNode[]>()
    for (const node of affected) {
      const prereqs = new Set<FormulaNode>()
      for (const range of node.refs) {
        const cellIndex = this.cellIndexes.get(range.sheet)
        if (!cellIndex) continue
        for (const entryId of cellIndex.query(range.r1, range.c1, range.r2, range.c2)) {
          const other = this.entryOwners.get(entryId)
          if (other && other !== node && affected.has(other)) prereqs.add(other)
        }
      }
      // E1 修复点：自环边计入入度（旧实现 `other === node` 跳过 → 自环漏检）
      let count = prereqs.size
      if (node.selfCycle) count++
      inDegree.set(node.key, count)
      for (const other of prereqs) {
        const list = downstream.get(other.key) ?? []
        list.push(node)
        downstream.set(other.key, list)
      }
    }

    const order: FormulaNode[] = []
    const ready = [...affected].filter((node) => (inDegree.get(node.key) ?? 0) === 0)
    while (ready.length > 0) {
      const node = ready.pop()!
      order.push(node)
      for (const dependent of downstream.get(node.key) ?? []) {
        const remaining = (inDegree.get(dependent.key) ?? 0) - 1
        inDegree.set(dependent.key, remaining)
        if (remaining === 0) ready.push(dependent)
      }
    }
    // 拓扑后有剩余 = 环（自环 / 区间环 / 环的下游——下游因依赖永不就绪的环节点同样入
    // cyclic，求值层统一置 #CYCLE!，即 Excel 的错误传播语义）
    const cyclic = new Set<string>()
    for (const node of affected) {
      if ((inDegree.get(node.key) ?? 0) > 0) cyclic.add(node.key)
    }
    return { order, cyclic }
  }

  /** 全量拓扑（保留接口兼容；引擎全量重算走「全部节点作为 seeds」的路径） */
  collectAll(): CollectResult {
    return this.collectDirty([])
  }

  // ---- 内部 ----

  private ensureRefIndex(sheet: string): RectIndex {
    let index = this.refIndexes.get(sheet)
    if (!index) {
      index = new RectIndex()
      this.refIndexes.set(sheet, index)
    }
    return index
  }

  private ensureCellIndex(sheet: string): RectIndex {
    let index = this.cellIndexes.get(sheet)
    if (!index) {
      index = new RectIndex()
      this.cellIndexes.set(sheet, index)
    }
    return index
  }

  /** 收集「引用区间覆盖 (row,col)」的节点 = 该格子的下游公式（ref 区间索引） */
  private collectCovering(sheet: string, row: number, col: number, into: Set<FormulaNode>, queue?: FormulaNode[]): void {
    const index = this.refIndexes.get(sheet)
    if (!index) return
    for (const entryId of index.query(row, col, row, col)) {
      const node = this.entryOwners.get(entryId)
      if (node && !into.has(node)) {
        into.add(node)
        queue?.push(node)
      }
    }
  }

  private removeFromIndex(node: FormulaNode): void {
    node.entryIds.forEach((entryId, i) => {
      // 条目可能分布在 ref 索引与 cell 索引两处——按 id 前缀路由删除；
      // 桶名取建图时记录的表（ref 条目=被引用表，可能与公式所在表不同）
      const bucket = node.entrySheets[i] ?? node.sheet
      if (entryId.startsWith('ref#')) this.refIndexes.get(bucket)?.remove(entryId)
      else this.cellIndexes.get(bucket)?.remove(entryId)
      this.entryOwners.delete(entryId)
    })
  }
}

/** 是否包含地址类动态函数（引用运行时才可知，静态依赖提取不可靠） */
function containsDynamicFunction(node: AstNode): boolean {
  const dynamicNames = new Set(['INDIRECT', 'OFFSET', 'INDEX'])
  const visit = (ast: AstNode): boolean => {
    switch (ast.kind) {
      case 'call':
        if (dynamicNames.has(ast.name)) return true
        return ast.args.some(visit)
      case 'unary':
      case 'percent':
        return visit(ast.operand)
      case 'binary':
        return visit(ast.left) || visit(ast.right)
      default:
        return false
    }
  }
  return visit(node)
}
