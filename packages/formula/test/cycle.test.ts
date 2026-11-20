/**
 * E1 环检测专项回归（阶段二任务书）：
 * - 自环（区间引用包含自身）建图时标记 → #CYCLE!，不再把自身旧值当输入；
 * - 区间环 / 跨表互引 → 环上全部 #CYCLE!；
 * - #CYCLE! 沿下游传播（Excel 语义），且不污染无关公式。
 */
import { describe, it, expect } from 'vitest'
import { FormulaEngine, valueToCell } from '../src/engine.js'
import type { ValueSource, CellValueLike } from '../src/evaluator.js'
import { FormulaErrorCode } from '../src/errors.js'

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

describe('E1 · 自环（区间引用包含自身）', () => {
  it('A3=SUM(A1:A3) 建图即 #CYCLE!（不执行求值）', () => {
    const cells = new Map<string, CellValueLike>([['0,0', 100], ['1,0', 20]])
    const engine = new FormulaEngine({ source: makeSource(cells) })
    engine.setFormula('Sheet1', 2, 0, '=SUM(A1:A3)')
    expect(valueToCell(engine.getComputed('Sheet1', 2, 0))).toBe(FormulaErrorCode.CYCLE)
  })

  it('整列自引用 A3=SUM(A:A) 同样判环', () => {
    const engine = new FormulaEngine({ source: makeSource(new Map()) })
    engine.setFormula('Sheet1', 2, 0, '=SUM(A:A)')
    expect(valueToCell(engine.getComputed('Sheet1', 2, 0))).toBe(FormulaErrorCode.CYCLE)
  })

  it('改上游值后环格不再漂移（修复 120→400→490 静默错误）', () => {
    const cells = new Map<string, CellValueLike>([['0,0', 100], ['1,0', 20]])
    const engine = new FormulaEngine({ source: makeSource(cells) })
    engine.setFormula('Sheet1', 2, 0, '=SUM(A1:A3)')
    // 上游 A1 变更 → 增量重算：环格必须保持 #CYCLE!，绝不能出现数值
    for (let round = 1; round <= 3; round++) {
      cells.set('0,0', 100 + round)
      const changes = engine.recompute([{ sheet: 'Sheet1', row: 0, col: 0 }])
      const a3 = changes.find((change) => change.row === 2 && change.col === 0)
      if (a3) expect(a3.newValue).toBe(FormulaErrorCode.CYCLE)
      expect(valueToCell(engine.getComputed('Sheet1', 2, 0))).toBe(FormulaErrorCode.CYCLE)
    }
  })
})

describe('E1 · 区间环与跨表互引', () => {
  it('A1=SUM(B1:B2)、B1=SUM(A1:A2) → 双环全 #CYCLE!', () => {
    const engine = new FormulaEngine({ source: makeSource(new Map([['1,0', 5]])) })
    engine.setFormula('Sheet1', 0, 0, '=SUM(B1:B2)')
    engine.setFormula('Sheet1', 0, 1, '=SUM(A1:A2)')
    expect(valueToCell(engine.getComputed('Sheet1', 0, 0))).toBe(FormulaErrorCode.CYCLE)
    expect(valueToCell(engine.getComputed('Sheet1', 0, 1))).toBe(FormulaErrorCode.CYCLE)
  })

  it('跨表互引：Sheet1!A1 ↔ Sheet2!A1 双环', () => {
    const engine = new FormulaEngine({ source: makeSource(new Map()) })
    engine.setFormula('Sheet1', 0, 0, '=Sheet2!A1+1')
    engine.setFormula('Sheet2', 0, 0, '=Sheet1!A1+1')
    expect(valueToCell(engine.getComputed('Sheet1', 0, 0))).toBe(FormulaErrorCode.CYCLE)
    expect(valueToCell(engine.getComputed('Sheet2', 0, 0))).toBe(FormulaErrorCode.CYCLE)
  })

  it('三节点环 A=B+1, B=C+1, C=A+1', () => {
    const engine = new FormulaEngine({ source: makeSource(new Map()) })
    // 三个节点落在第 1 行的 A/B/C 三列，公式互引形成 A1→B1→C1→A1 环
    engine.setFormula('Sheet1', 0, 0, '=B1+1')
    engine.setFormula('Sheet1', 0, 1, '=C1+1')
    engine.setFormula('Sheet1', 0, 2, '=A1+1')
    expect(valueToCell(engine.getComputed('Sheet1', 0, 0))).toBe(FormulaErrorCode.CYCLE)
    expect(valueToCell(engine.getComputed('Sheet1', 0, 1))).toBe(FormulaErrorCode.CYCLE)
    expect(valueToCell(engine.getComputed('Sheet1', 0, 2))).toBe(FormulaErrorCode.CYCLE)
  })
})

describe('E1 · 环的下游与隔离性', () => {
  it('下游引用环格显示 #CYCLE!（错误传播，符合 Excel 语义）', () => {
    const cells = new Map<string, CellValueLike>([['0,0', 100], ['1,0', 20]])
    const engine = new FormulaEngine({ source: makeSource(cells) })
    engine.setFormula('Sheet1', 2, 0, '=SUM(A1:A3)') // A3 自环
    engine.setFormula('Sheet1', 3, 0, '=A3*2') // A4 引用环格 → 下游
    engine.setFormula('Sheet1', 4, 0, '=A4+1') // A5 引用下游 → 二级传播
    expect(valueToCell(engine.getComputed('Sheet1', 3, 0))).toBe(FormulaErrorCode.CYCLE)
    expect(valueToCell(engine.getComputed('Sheet1', 4, 0))).toBe(FormulaErrorCode.CYCLE)
    // 上游变更后仍传播
    cells.set('0,0', 150)
    const changes = engine.recompute([{ sheet: 'Sheet1', row: 0, col: 0 }])
    const byAddr = new Map(changes.map((change) => [`${change.row},${change.col}`, change.newValue]))
    expect(byAddr.get('3,0')).toBe(FormulaErrorCode.CYCLE)
    expect(byAddr.get('4,0')).toBe(FormulaErrorCode.CYCLE)
  })

  it('环不污染无关公式（A 列有环，C 列正常计算）', () => {
    const cells = new Map<string, CellValueLike>([['0,0', 10], ['0,2', 7]])
    const engine = new FormulaEngine({ source: makeSource(cells) })
    engine.setFormula('Sheet1', 2, 0, '=SUM(A1:A3)') // A3 自环
    engine.setFormula('Sheet1', 1, 2, '=C1*3') // C2 正常链
    engine.setFormula('Sheet1', 2, 2, '=C2+1')
    expect(valueToCell(engine.getComputed('Sheet1', 2, 0))).toBe(FormulaErrorCode.CYCLE)
    expect(valueToCell(engine.getComputed('Sheet1', 1, 2))).toBe(21)
    expect(valueToCell(engine.getComputed('Sheet1', 2, 2))).toBe(22)
    // 上游变更只影响正常链
    cells.set('0,2', 8)
    const changes = engine.recompute([{ sheet: 'Sheet1', row: 0, col: 2 }])
    expect(changes.some((change) => change.col === 0)).toBe(false) // A 列环不受 C 列变更影响
    expect(changes.some((change) => change.row === 1 && change.col === 2 && change.newValue === 24)).toBe(true)
  })

  it('解环后恢复正常计算（undo 场景：公式改掉即可退出环）', () => {
    const cells = new Map<string, CellValueLike>([['0,0', 100], ['1,0', 20]])
    const engine = new FormulaEngine({ source: makeSource(cells) })
    engine.setFormula('Sheet1', 2, 0, '=SUM(A1:A3)')
    expect(valueToCell(engine.getComputed('Sheet1', 2, 0))).toBe(FormulaErrorCode.CYCLE)
    // 把 A3 改成普通公式（不再引用自身）
    engine.setFormula('Sheet1', 2, 0, '=SUM(A1:A2)')
    expect(valueToCell(engine.getComputed('Sheet1', 2, 0))).toBe(120)
    // 下游恢复数值
    engine.setFormula('Sheet1', 3, 0, '=A3*2')
    expect(valueToCell(engine.getComputed('Sheet1', 3, 0))).toBe(240)
  })
})
