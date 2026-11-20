/**
 * E2 性能基准：依赖图区间查询 线性扫描 vs 空间索引（RectIndex / STR R-Tree）
 *
 * 数据（供《阶段二引擎任务报告》引用）：
 * - 场景：N 个公式，每个引用一个 10×10 区间（SUM 常见形态），随机 200 个变更格；
 * - 对比对象：旧实现（逐节点线性扫描 + 区间包含判断，阶段一 5000 格实测 571ms
 *   的瓶颈就在这里）vs 新实现（RectIndex）；
 * - 线性基线在基准内以内联方式复刻旧算法（等价逻辑），保证同机同数据可比。
 */
import { describe, it, expect } from 'vitest'
import { RectIndex } from '../src/spatial.js'
import type { SpatialRect } from '../src/spatial.js'

interface BenchNode {
  key: string
  sheet: string
  row: number
  col: number
  refs: SpatialRect[]
}

/** 构造 N 个公式节点：每格一个 10×10 引用区间 */
function makeNodes(n: number): BenchNode[] {
  const nodes: BenchNode[] = []
  for (let i = 0; i < n; i++) {
    const row = i % Math.ceil(Math.sqrt(n * 10))
    const col = Math.floor(i / Math.ceil(Math.sqrt(n * 10)))
    nodes.push({
      key: `Sheet1\u0000${row},${col}`,
      sheet: 'Sheet1',
      row,
      col,
      refs: [{ sheet: 'Sheet1', r1: row, c1: col, r2: row + 9, c2: col + 9 }],
    })
  }
  return nodes
}

function randomChangedCells(n: number, count: number): Array<{ sheet: string; row: number; col: number }> {
  const cells: Array<{ sheet: string; row: number; col: number }> = []
  for (let i = 0; i < count; i++) {
    cells.push({ sheet: 'Sheet1', row: Math.floor((i * 7919) % (n * 2)), col: Math.floor((i * 104729) % 50) })
  }
  return cells
}

/** 旧实现的等价逻辑：逐节点线性扫描 + 区间包含判断（阶段一 collectDirty 的种子/扩散阶段） */
function linearCovering(nodes: BenchNode[], row: number, col: number): BenchNode[] {
  const out: BenchNode[] = []
  for (const node of nodes) {
    for (const range of node.refs) {
      if (range.sheet === 'Sheet1' && row >= range.r1 && row <= range.r2 && col >= range.c1 && col <= range.c2) {
        out.push(node)
        break
      }
    }
  }
  return out
}

function benchLinear(nodes: BenchNode[], changed: Array<{ sheet: string; row: number; col: number }>): number {
  const start = performance.now()
  // 模拟 collectDirty 的三次查询阶段（seeds + 每个受影响节点一次扩散查询）
  let hits = 0
  for (const cell of changed) {
    hits += linearCovering(nodes, cell.row, cell.col).length
  }
  for (const node of nodes.slice(0, 200)) {
    hits += linearCovering(nodes, node.row, node.col).length
  }
  void hits
  return performance.now() - start
}

function benchIndexed(nodes: BenchNode[], changed: Array<{ sheet: string; row: number; col: number }>): number {
  const index = new RectIndex()
  for (const node of nodes) {
    node.refs.forEach((range, i) => index.insert(`${node.key}#${i}`, range))
  }
  const start = performance.now()
  let hits = 0
  for (const cell of changed) {
    hits += index.query(cell.row, cell.col, cell.row, cell.col).length
  }
  for (const node of nodes.slice(0, 200)) {
    hits += index.query(node.row, node.col, node.row, node.col).length
  }
  void hits
  return performance.now() - start
}

describe('E2 基准 · 区间查询 线性 vs 空间索引', () => {
  for (const n of [1_000, 10_000, 50_000]) {
    it(`N=${n} 公式 × 200 变更格：collectDirty 查询阶段对比`, () => {
      const nodes = makeNodes(n)
      const changed = randomChangedCells(n, 200)
      // 预热（索引建树 / JIT）
      benchIndexed(nodes.slice(0, 100), changed.slice(0, 10))
      const linearMs = benchLinear(nodes, changed)
      const indexedMs = benchIndexed(nodes, changed)
      console.log(
        `[E2-bench] N=${n}: 线性扫描 ${linearMs.toFixed(1)}ms | 空间索引 ${indexedMs.toFixed(1)}ms | 加速 ${(linearMs / Math.max(indexedMs, 0.01)).toFixed(0)}×`,
      )
      expect(indexedMs).toBeLessThan(linearMs)
    })
  }

  it('RectIndex 正确性抽查（与线性扫描一致）', () => {
    const nodes = makeNodes(500)
    const index = new RectIndex()
    for (const node of nodes) {
      node.refs.forEach((range, i) => index.insert(`${node.key}#${i}`, range))
    }
    const changed = randomChangedCells(500, 100)
    for (const cell of changed) {
      const linear = new Set(linearCovering(nodes, cell.row, cell.col).map((node) => node.key))
      const indexed = new Set(
        index.query(cell.row, cell.col, cell.row, cell.col).map((id) => id.split('#').slice(0, -1).join('#')),
      )
      expect([...indexed].sort()).toEqual([...linear].sort())
    }
  })
})
