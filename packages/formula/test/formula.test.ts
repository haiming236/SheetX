import { describe, it, expect } from 'vitest'
import { parseFormula } from '../src/parser.js'
import { FormulaSyntaxError } from '../src/lexer.js'
import { astToString } from '../src/ast.js'
import { FormulaEngine, valueToCell } from '../src/engine.js'
import type { ValueSource, CellValueLike } from '../src/evaluator.js'
import { FormulaErrorCode, FormulaError, isFormulaError } from '../src/errors.js'
import { dateToSerial, serialToDate } from '../src/functions.js'
import { colToLetters, lettersToCol, formatA1 } from '../src/refs.js'

/** 测试用数据源：二维数组模拟工作表 */
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

describe('引用记法', () => {
  it('列号往返', () => {
    expect(colToLetters(0)).toBe('A')
    expect(colToLetters(25)).toBe('Z')
    expect(colToLetters(26)).toBe('AA')
    expect(colToLetters(701)).toBe('ZZ')
    expect(lettersToCol('A')).toBe(0)
    expect(lettersToCol('AA')).toBe(26)
    expect(lettersToCol('ZZ')).toBe(701)
  })

  it('A1 格式化', () => {
    expect(formatA1(0, 0)).toBe('A1')
    expect(formatA1(9, 27, true, true)).toBe('$AB$10')
  })
})

describe('Parser', () => {
  it('四则运算 AST', () => {
    const ast = parseFormula('1+2*3')
    expect(astToString(ast)).toBe('(1 + (2 * 3))')
  })

  it('幂右结合', () => {
    expect(astToString(parseFormula('2^3^2'))).toBe('(2 ^ (3 ^ 2))')
  })

  it('函数与区域引用', () => {
    expect(astToString(parseFormula('SUM(A1:B3, 10)'))).toBe('SUM(A1:B3, 10)')
    expect(astToString(parseFormula('Sheet2!A1+1'))).toBe('(Sheet2!A1 + 1)')
  })

  it('跨表区域引用', () => {
    expect(astToString(parseFormula('SUM(数据!A1:B2)'))).toBe('SUM(数据!A1:B2)')
  })

  it('字符串与转义（双引号/单引号）', () => {
    expect(astToString(parseFormula('"it""s" & \' ok\''))).toBe('(\'it"s\' & \' ok\')')
    expect(astToString(parseFormula('"你好"'))).toBe("'你好'")
  })

  it('语法错误带位置', () => {
    expect(() => parseFormula('1+')).toThrow(FormulaSyntaxError)
    expect(() => parseFormula('SUM(A1,')).toThrow(FormulaSyntaxError)
  })
})

describe('Evaluator（纯表达式）', () => {
  function evalExpr(text: string): CellValueLike {
    const engine = new FormulaEngine({ source: makeSource({}) })
    return valueToCell(engine.evaluateText(text))
  }

  it('算术与优先级', () => {
    expect(evalExpr('1+2*3')).toBe(7)
    expect(evalExpr('(1+2)*3')).toBe(9)
    expect(evalExpr('2^10')).toBe(1024)
    expect(evalExpr('50%')).toBe(0.5)
    expect(evalExpr('-5+2')).toBe(-3)
  })

  it('除零错误传播', () => {
    expect(evalExpr('1/0')).toBe('#DIV/0!')
    expect(evalExpr('1/(2-2)+1')).toBe('#DIV/0!') // 错误沿依赖传播
  })

  it('字符串连接与比较', () => {
    expect(evalExpr("'a'&'b'&1")).toBe('ab1')
    expect(evalExpr('"abc"="ABC"')).toBe(true) // 大小写不敏感
    expect(evalExpr('3>=2')).toBe(true)
    expect(evalExpr('"b"<>"a"')).toBe(true)
  })

  it('数字字符串强转', () => {
    expect(evalExpr("'10'+5")).toBe(15)
    expect(evalExpr("'abc'+1")).toBe('#VALUE!')
  })
})

describe('FormulaEngine（数据源 + 增量重算）', () => {
  it('改 A1 只重算受影响的 A3/A4（验收标准）', () => {
    const cells: Record<string, CellValueLike> = { '0,0': 100, '1,0': 200 }
    const engine = new FormulaEngine({ source: makeSource(cells) })
    // A3 = A1+A2, A4 = A3*2（cells 键是 row,col；A1 = row0,col0）
    engine.setFormula('Sheet1', 2, 0, '=A1+A2')
    engine.setFormula('Sheet1', 3, 0, '=A3*2')
    expect(engine.getComputed('Sheet1', 2, 0)).toBe(300)
    expect(engine.getComputed('Sheet1', 3, 0)).toBe(600)

    // 先改数据源再重算（顺序不能反——recompute 读的是当前数据源）
    cells['0,0'] = 150
    const changes = engine.recompute([{ sheet: 'Sheet1', row: 0, col: 0 }])
    // 拓扑序：先 A3 后 A4（150 + 200 = 350；350 * 2 = 700）
    const byAddr = new Map(changes.map((change) => [`${change.row},${change.col}`, change]))
    expect(byAddr.get('2,0')?.newValue).toBe(350)
    expect(byAddr.get('3,0')?.newValue).toBe(700)
  })

  it('数据源取值实时反映变更（recompute 前外部先改数据）', () => {
    const cells: Record<string, CellValueLike> = { '0,0': 1, '1,0': 2 }
    const source = makeSource(cells)
    const engine = new FormulaEngine({ source })
    engine.setFormula('Sheet1', 2, 0, '=A1+A2')
    expect(engine.getComputed('Sheet1', 2, 0)).toBe(3)
    cells['0,0'] = 10
    const changes = engine.recompute([{ sheet: 'Sheet1', row: 0, col: 0 }])
    expect(changes.length).toBe(1)
    expect(changes[0]!.newValue).toBe(12)
  })

  it('跨表引用', () => {
    const data: Record<string, CellValueLike> = {}
    const source: ValueSource = {
      getCellValue(sheet, row, col) {
        return sheet === 'Sheet2' && row === 0 && col === 0 ? 42 : data[`${row},${col}`] ?? null
      },
      getRangeValues(sheet, r1, c1, r2, c2) {
        void sheet
        const out: CellValueLike[][] = []
        for (let r = r1; r <= r2; r++) {
          const row: CellValueLike[] = []
          for (let c = c1; c <= c2; c++) row.push(source.getCellValue(null, r, c))
          out.push(row)
        }
        return out
      },
    }
    const engine = new FormulaEngine({ source })
    engine.setFormula('Sheet1', 0, 0, '=Sheet2!A1*2')
    expect(engine.getComputed('Sheet1', 0, 0)).toBe(84)
  })

  it('函数：SUM/IF/CONCAT/ROUND', () => {
    const cells: Record<string, CellValueLike> = { '0,0': 1, '1,0': 2, '2,0': 3 }
    const engine = new FormulaEngine({ source: makeSource(cells) })
    engine.setFormula('Sheet1', 3, 0, '=SUM(A1:A3)')
    expect(engine.getComputed('Sheet1', 3, 0)).toBe(6)
    engine.setFormula('Sheet1', 4, 0, '=IF(A4>5, "多", "少")')
    expect(engine.getComputed('Sheet1', 4, 0)).toBe('多')
    engine.setFormula('Sheet1', 5, 0, '=CONCAT("a", 1, TRUE)')
    expect(engine.getComputed('Sheet1', 5, 0)).toBe('a1TRUE')
    engine.setFormula('Sheet1', 6, 0, '=ROUND(3.14159, 2)')
    expect(engine.getComputed('Sheet1', 6, 0)).toBe(3.14)
  })

  it('循环引用检测不栈溢出（验收标准；E1 后环在写图时即标记）', () => {
    const engine = new FormulaEngine({ source: makeSource({}) })
    // A1=A2, A2=A1 互环；B1=A1（环的下游）
    engine.setFormula('Sheet1', 0, 0, '=A2+1')
    engine.setFormula('Sheet1', 1, 0, '=A1+1')
    expect(valueToCell(engine.getComputed('Sheet1', 0, 0))).toBe('#CYCLE!')
    expect(valueToCell(engine.getComputed('Sheet1', 1, 0))).toBe('#CYCLE!')
    engine.setFormula('Sheet1', 2, 0, '=A1*10')
    // 环的下游同样传播 #CYCLE!
    expect(valueToCell(engine.getComputed('Sheet1', 2, 0))).toBe('#CYCLE!')
    // 全量重算不抛栈溢出，且值保持（变更列表为空 = 已在写图时标记、幂等）
    const changes = engine.recalculateAll()
    expect(changes.find((change) => change.row === 0 && change.col === 0)?.newValue ?? '#CYCLE!').toBe('#CYCLE!')
    expect(valueToCell(engine.getComputed('Sheet1', 2, 0))).toBe('#CYCLE!')
  })

  it('删除公式清理依赖', () => {
    const cells: Record<string, CellValueLike> = { '0,0': 1 }
    const engine = new FormulaEngine({ source: makeSource(cells) })
    engine.setFormula('Sheet1', 1, 0, '=A1*2')
    expect(engine.graph.size).toBe(1)
    engine.setFormula('Sheet1', 1, 0, null)
    expect(engine.graph.size).toBe(0)
    expect(engine.getComputed('Sheet1', 1, 0)).toBeUndefined()
  })

  it('语法错误的公式显示 #NAME? 且不炸引擎', () => {
    const engine = new FormulaEngine({ source: makeSource({}) })
    engine.setFormula('Sheet1', 0, 0, '=SUM(A1:')
    expect(isFormulaError(engine.getComputed('Sheet1', 0, 0))).toBe(true)
    expect(valueToCell(engine.getComputed('Sheet1', 0, 0))).toBe('#NAME?')
  })

  it('动态函数（INDIRECT）标记为每次重算', () => {
    const engine = new FormulaEngine({ source: makeSource({}) })
    engine.setFormula('Sheet1', 0, 0, '=INDIRECT("A5")')
    expect(engine.graph.getFormula('Sheet1', 0, 0)?.dynamic).toBe(true)
  })
})

describe('日期序列', () => {
  it('序列 ↔ 日期往返（1900-03-01 起 Excel 精确兼容）', () => {
    // 纪元 1899-12-30：从 1900-03-01 起与 Excel 序列精确一致（Excel 的 1900-02-29 幽灵日已补偿）
    expect(dateToSerial(new Date(Date.UTC(1900, 2, 1)))).toBe(61)
    // 1900-03-01 之前的日期比 Excel 大 1（引擎文档中注明的已知边界）
    expect(dateToSerial(new Date(Date.UTC(1900, 0, 1)))).toBe(2)
    expect(dateToSerial(new Date(Date.UTC(2026, 10, 20)))).toBeGreaterThan(45000)
    const round = serialToDate(dateToSerial(new Date(Date.UTC(2026, 10, 20))))
    expect(round.getUTCFullYear()).toBe(2026)
    expect(round.getUTCMonth()).toBe(10)
    expect(round.getUTCDate()).toBe(20)
  })

  it('DATE 函数月越界进位', () => {
    const engine = new FormulaEngine({ source: makeSource({}) })
    expect(engine.evaluateText('DATE(2026, 13, 1)')).toBe(dateToSerial(new Date(Date.UTC(2027, 0, 1))))
  })
})

describe('错误体系', () => {
  it('错误码常量与实例判别', () => {
    expect(FormulaErrorCode.DIV0).toBe('#DIV/0!')
    expect(isFormulaError(new FormulaError('#N/A'))).toBe(true)
    expect(isFormulaError(42)).toBe(false)
  })
})
