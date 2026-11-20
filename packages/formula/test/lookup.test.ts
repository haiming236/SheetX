/**
 * M4 高级公式：查找与条件聚合函数
 * VLOOKUP / HLOOKUP / INDEX / MATCH / IFERROR / SUMIF / COUNTIF
 */
import { describe, it, expect } from 'vitest'
import { FormulaEngine } from '../src/engine.js'
import type { ValueSource, CellValueLike } from '../src/evaluator.js'
import { isFormulaError } from '../src/errors.js'

function makeSource(cells: Record<string, CellValueLike>): ValueSource {
  return {
    getCellValue(sheet, row, col) {
      void sheet
      return cells[`${row},${col}`] ?? null
    },
    getRangeValues(sheet, r1, c1, r2, c2) {
      void sheet
      const out: CellValueLike[][] = []
      for (let r = r1; r <= r2; r++) {
        const row: CellValueLike[] = []
        for (let c = c1; c <= c2; c++) row.push(cells[`${r},${c}`] ?? null)
        out.push(row)
      }
      return out
    },
  }
}

function evalFormula(formula: string, cells: Record<string, CellValueLike>) {
  const engine = new FormulaEngine({ source: makeSource(cells) })
  engine.setFormula('S', 10, 10, formula)
  return engine.getComputed('S', 10, 10)
}

const table = {
  '0,0': '甲', '0,1': 10, '0,2': '北京',
  '1,0': '乙', '1,1': 20, '1,2': '上海',
  '2,0': '丙', '2,1': 30, '2,2': '广州',
}

describe('查找函数', () => {
  it('VLOOKUP 精确匹配', () => {
    expect(evalFormula('=VLOOKUP("乙",A1:C3,2,0)', table)).toBe(20)
    expect(evalFormula('=VLOOKUP("丙",A1:C3,3,FALSE)', table)).toBe('广州')
  })

  it('VLOOKUP 未找到 → #N/A，IFERROR 可兜底', () => {
    const missing = evalFormula('=VLOOKUP("丁",A1:C3,2,0)', table)
    expect(isFormulaError(missing)).toBe(true)
    expect(evalFormula('=IFERROR(VLOOKUP("丁",A1:C3,2,0),"无记录")', table)).toBe('无记录')
    expect(evalFormula('=IFERROR(A1,"备用")', table)).toBe('甲')
  })

  it('VLOOKUP 近似匹配（升序首列）', () => {
    const numeric = {
      '0,0': 10, '0,1': '低',
      '1,0': 20, '1,1': '中',
      '2,0': 30, '2,1': '高',
    }
    expect(evalFormula('=VLOOKUP(25,A1:B3,2,1)', numeric)).toBe('中')
    expect(isFormulaError(evalFormula('=VLOOKUP(9,A1:B3,2,1)', numeric))).toBe(true) // 小于最小值 → #N/A
  })

  it('HLOOKUP 按首行匹配列', () => {
    // HLOOKUP 表头在首行：甲/乙/丙 横向排列
    const horizontal = {
      '0,0': '甲', '0,1': '乙', '0,2': '丙',
      '1,0': 10, '1,1': 20, '1,2': 30,
      '2,0': '北京', '2,1': '上海', '2,2': '广州',
    }
    expect(evalFormula('=HLOOKUP("乙",A1:C3,2,0)', horizontal)).toBe(20)
    expect(evalFormula('=HLOOKUP("丙",A1:C3,3,0)', horizontal)).toBe('广州')
  })

  it('INDEX / MATCH 1-based 定位', () => {
    expect(evalFormula('=INDEX(A1:C3,2,3)', table)).toBe('上海')
    expect(evalFormula('=MATCH("乙",A1:A3,0)', table)).toBe(2)
    expect(evalFormula('=MATCH("丁",A1:A3,0)', table)).toHaveProperty('code', '#N/A')
  })
})

describe('条件聚合', () => {
  it('SUMIF 精确条件 + 比较表达式', () => {
    expect(evalFormula('=SUMIF(A1:A3,"乙",B1:B3)', table)).toBe(20)
    expect(evalFormula('=SUMIF(B1:B3,">15")', table)).toBe(50)
    expect(evalFormula('=SUMIF(A1:A3,"<>乙",B1:B3)', table)).toBe(40)
  })

  it('COUNTIF 文本 / 数值条件', () => {
    expect(evalFormula('=COUNTIF(A1:A3,"甲")', table)).toBe(1)
    expect(evalFormula('=COUNTIF(B1:B3,">15")', table)).toBe(2)
    expect(evalFormula('=COUNTIF(A1:A3,"*")', table)).toBe(0) // 通配符 v2 未实现，按精确文本处理
  })
})
