/**
 * 公式引擎性能基准：增量重算 vs 全量重算
 */
import { describe, it, expect } from 'vitest'
import { FormulaEngine } from '../src/engine.js'
import type { ValueSource, CellValueLike } from '../src/evaluator.js'

function makeSource(cells: Map<string, CellValueLike>): ValueSource {
  return {
    getCellValue(sheet, row, col) {
      void sheet
      return cells.get(`${row},${col}`) ?? null
    },
    getRangeValues(sheet, r1, c1, r2, c2) {
      void sheet
      const out: CellValueLike[][] = []
      for (let r = r1; r <= r2; r++) {
        const rowValues: CellValueLike[] = []
        for (let c = c1; c <= c2; c++) rowValues.push(cells.get(`${r},${c}`) ?? null)
        out.push(rowValues)
      }
      return out
    },
  }
}

describe('公式引擎基准', () => {
  it('① 1000 个链式公式：改首格只重算下游（增量语义验证）', () => {
    const cells = new Map<string, CellValueLike>([['0,0', 1]])
    const engine = new FormulaEngine({ source: makeSource(cells) })
    // B 列 1000 行链式引用：B1=A1+1，B2=B1+1, …（深度 1000 的依赖链）
    for (let r = 0; r < 1000; r++) {
      engine.setFormula('Sheet1', r, 1, r === 0 ? '=A1+1' : `=B${r}+1`)
    }
    const start = performance.now()
    cells.set('0,0', 2)
    const changes = engine.recompute([{ sheet: 'Sheet1', row: 0, col: 0 }])
    const elapsed = performance.now() - start
    console.log(`[bench] 1000 深度依赖链增量重算: ${elapsed.toFixed(1)}ms，变更 ${changes.length} 个`)
    expect(changes.length).toBe(1000)
    expect(elapsed).toBeLessThan(500)
  })

  it('② 5000 个独立公式 + 全列变更重算', () => {
    const cells = new Map<string, CellValueLike>()
    for (let r = 0; r < 5000; r++) cells.set(`${r},0`, r)
    const engine = new FormulaEngine({ source: makeSource(cells) })
    for (let r = 0; r < 5000; r++) engine.setFormula('Sheet1', r, 1, `=A${r + 1}*2`)
    const start = performance.now()
    // A1:A5000 全部翻倍 → 5000 个变更格作为 seeds（区域变更的正确传入方式）
    for (let r = 0; r < 5000; r++) cells.set(`${r},0`, r * 2)
    const seeds = Array.from({ length: 5000 }, (_, r) => ({ sheet: 'Sheet1', row: r, col: 0 }))
    const changes = engine.recompute(seeds)
    const elapsed = performance.now() - start
    console.log(`[bench] 5000 公式全列变更重算: ${elapsed.toFixed(1)}ms，变更 ${changes.length} 个`)
    // A1=0→0 使首行公式值不变（0*2=0）——值相等门控正确跳过，故 4999
    expect(changes.length).toBe(4999)
    expect(elapsed).toBeLessThan(2000)
  })

  it('③ 无关变更零重算（增量门控）', () => {
    const cells = new Map<string, CellValueLike>([['0,0', 1]])
    const engine = new FormulaEngine({ source: makeSource(cells) })
    for (let r = 0; r < 1000; r++) engine.setFormula('Sheet1', r, 1, `=A1+${r}`)
    const start = performance.now()
    // 变更 Z10000（无公式引用它）
    cells.set('10000,25', 5)
    const changes = engine.recompute([{ sheet: 'Sheet1', row: 10000, col: 25 }])
    const elapsed = performance.now() - start
    console.log(`[bench] 无关变更的重算开销: ${elapsed.toFixed(2)}ms，变更 ${changes.length} 个（应为 0）`)
    expect(changes.length).toBe(0)
    expect(elapsed).toBeLessThan(20)
  })
})
