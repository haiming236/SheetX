/**
 * 性能基准（任务书第九节：性能声明必须有 benchmark 数据支撑）
 * 运行：pnpm test -- data/test/bench.test.ts
 * 输出真实测量值到控制台，验收标准断言采用宽松上界。
 */
import { describe, it, expect } from 'vitest'
import { GridStore, CommandService, registerGridMutations, buildSetCellsParams, SparseMatrix } from '../src/index.js'
import { normalizeRows } from '../src/changes.js'

function generateRows(n: number): Array<Record<string, unknown>> {
  const rows = new Array(n)
  for (let i = 0; i < n; i++) {
    rows[i] = { id: `row-${i}`, name: `商品${i}`, qty: i % 1000, price: (i % 997) + 0.5, category: `分类${i % 20}` }
  }
  return rows
}

describe('性能基准（真实测量，验收标准为宽松上界）', () => {
  it('① 10 万行初始化 < 1s（任务书 T1 验收）', () => {
    const rows = generateRows(100_000)
    const start = performance.now()
    const store = new GridStore(normalizeRows(rows))
    const elapsed = performance.now() - start
    console.log(`[bench] 10 万行 GridStore 初始化: ${elapsed.toFixed(1)}ms（${(100000 / Math.max(elapsed, 1) * 1000).toFixed(0)} 行/秒）`)
    expect(store.rowCount).toBe(100_000)
    expect(elapsed).toBeLessThan(1000)
  })

  it('② 100 万行初始化（内存/速度摸底）', () => {
    const rows = generateRows(1_000_000)
    const start = performance.now()
    const store = new GridStore(normalizeRows(rows))
    const elapsed = performance.now() - start
    console.log(`[bench] 100 万行 GridStore 初始化: ${elapsed.toFixed(1)}ms`)
    expect(store.rowCount).toBe(1_000_000)
    expect(elapsed).toBeLessThan(5000) // 摸底值，非验收线
  })

  it('③ 单单元格更新 O(1)（含命令协议+undo 入栈）', () => {
    const store = new GridStore(normalizeRows(generateRows(100_000)))
    const commands = new CommandService(store, 'bench')
    registerGridMutations(commands)
    // 预热
    commands.executeMutation({ id: 'grid.mutation.set-cells', params: buildSetCellsParams(store, [{ rowId: 'row-0', field: 'qty', value: -1 }]), source: 'user' })
    const start = performance.now()
    const N = 10_000
    for (let i = 0; i < N; i++) {
      commands.executeMutation({
        id: 'grid.mutation.set-cells',
        params: buildSetCellsParams(store, [{ rowId: `row-${i % 100_000}`, field: 'qty', value: i }]),
        source: 'user',
      })
    }
    const perOp = (performance.now() - start) / N
    console.log(`[bench] 单格更新（含 mutation+undo 栈）: ${perOp.toFixed(3)}ms/次`)
    expect(perOp).toBeLessThan(0.5)
  })

  it('④ 批量 1000 格粘贴（单事务）', () => {
    const store = new GridStore(normalizeRows(generateRows(100_000)))
    const commands = new CommandService(store, 'bench')
    registerGridMutations(commands)
    const intents = Array.from({ length: 1000 }, (_, i) => ({ rowId: `row-${i}`, field: 'qty', value: 9999 }))
    const start = performance.now()
    commands.executeMutation({ id: 'grid.mutation.set-cells', params: buildSetCellsParams(store, intents), source: 'paste' })
    const elapsed = performance.now() - start
    console.log(`[bench] 1000 格批量粘贴（单事务+单 undo 项）: ${elapsed.toFixed(1)}ms`)
    expect(elapsed).toBeLessThan(100)
  })

  it('⑤ 撤销/重做 1000 次往返', async () => {
    const store = new GridStore(normalizeRows(generateRows(1000)))
    const commands = new CommandService(store, 'bench')
    registerGridMutations(commands)
    for (let i = 0; i < 1000; i++) {
      commands.executeMutation({ id: 'grid.mutation.set-cells', params: buildSetCellsParams(store, [{ rowId: `row-${i}`, field: 'qty', value: i }]), source: 'user' })
    }
    const start = performance.now()
    for (let i = 0; i < 1000; i++) await commands.undo()
    const undoMs = performance.now() - start
    const start2 = performance.now()
    for (let i = 0; i < 1000; i++) await commands.redo()
    const redoMs = performance.now() - start2
    console.log(`[bench] 1000 次 undo: ${undoMs.toFixed(1)}ms（${(undoMs / 1000).toFixed(3)}ms/次）；redo: ${redoMs.toFixed(1)}ms`)
    expect(undoMs / 1000).toBeLessThan(1)
  })

  it('⑥ 稀疏矩阵：100 万格中仅存 1000 个', () => {
    const matrix = new SparseMatrix<string>()
    const start = performance.now()
    for (let i = 0; i < 1000; i++) matrix.set((i * 977) % 100_000, (i * 131) % 100, { v: i })
    const elapsed = performance.now() - start
    console.log(`[bench] 稀疏矩阵 1000 次随机写（百万格域）: ${elapsed.toFixed(2)}ms，非空行 ${matrix.rowCount}`)
    expect(matrix.rowCount).toBeLessThanOrEqual(1000)
  })
})
