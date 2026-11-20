/**
 * SheetXSpreadsheet 引擎层测试（DOM 集成）
 *
 * 重点守护「运行时公式写入」路径的回归：
 * setCellValue('=…') 必须经 formula.setFormula 建图求值——
 * 曾因只调 recompute（新公式不在依赖图）导致公式格永远返回 null。
 */
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { createSpreadsheet } from '../src/index.js'

function makeSheet() {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const sheet = createSpreadsheet({
    container: host,
    sheets: [{ name: 'S', rowCount: 20, columnCount: 5 }],
  })
  return { sheet, host }
}

describe('SheetXSpreadsheet 运行时公式写入', () => {
  it('setCellValue 以 = 开头 → 自动解析并返回计算值', () => {
    const { sheet, host } = makeSheet()
    sheet.setCellValue(undefined, 0, 0, 120)
    sheet.setCellValue(undefined, 1, 0, 80)
    sheet.setCellValue(undefined, 2, 0, '=SUM(A1:A2)')
    expect(sheet.getCellValue(undefined, 2, 0)).toBe(200)
    sheet.destroy()
    host.remove()
  })

  it('改上游值 → 公式增量联动（不重算无关格）', () => {
    const { sheet, host } = makeSheet()
    sheet.setCellValue(undefined, 0, 0, 120)
    sheet.setCellValue(undefined, 1, 0, 80)
    sheet.setCellValue(undefined, 2, 0, '=SUM(A1:A2)')
    sheet.setCellValue(undefined, 3, 0, '=A1*A2')
    sheet.setCellValue(undefined, 0, 1, '无关格')
    sheet.setCellValue(undefined, 0, 0, 10)
    expect(sheet.getCellValue(undefined, 2, 0)).toBe(90) // SUM 联动
    expect(sheet.getCellValue(undefined, 3, 0)).toBe(800) // 乘积联动
    expect(sheet.getCellValue(undefined, 0, 1)).toBe('无关格') // 不受影响
    sheet.destroy()
    host.remove()
  })

  it('公式被普通值覆盖后读新值，不再返回旧计算结果', () => {
    const { sheet, host } = makeSheet()
    sheet.setCellValue(undefined, 0, 0, '=1+1')
    expect(sheet.getCellValue(undefined, 0, 0)).toBe(2)
    sheet.setCellValue(undefined, 0, 0, 5)
    expect(sheet.getCellValue(undefined, 0, 0)).toBe(5)
    sheet.destroy()
    host.remove()
  })

  it('公式引用公式：读到的是计算值而非原始串', () => {
    const { sheet, host } = makeSheet()
    sheet.setCellValue(undefined, 0, 0, 3)
    sheet.setCellValue(undefined, 1, 0, '=A1*2')
    sheet.setCellValue(undefined, 2, 0, '=A2+1')
    expect(sheet.getCellValue(undefined, 1, 0)).toBe(6)
    expect(sheet.getCellValue(undefined, 2, 0)).toBe(7)
    sheet.destroy()
    host.remove()
  })

  it('上游值变化触发 formula-change 事件（公式写入本身不发——值未变不发事件）', () => {
    const { sheet, host } = makeSheet()
    sheet.setCellValue(undefined, 0, 0, 1)
    sheet.setCellValue(undefined, 1, 0, '=A1*3') // 求值 = 3
    const changes: Array<{ row: number; oldValue: unknown; newValue: unknown }> = []
    sheet.on('formula-change', (payload) => {
      for (const c of payload as Array<{ row: number; oldValue: unknown; newValue: unknown }>) {
        changes.push({ row: c.row, oldValue: c.oldValue, newValue: c.newValue })
      }
    })
    sheet.setCellValue(undefined, 0, 0, 7) // A1: 1→7，A2 应 3→21
    expect(changes.some((c) => c.row === 1 && c.oldValue === 3 && c.newValue === 21)).toBe(true)
    sheet.destroy()
    host.remove()
  })
})
