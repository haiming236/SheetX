/**
 * 公式栏 ↔ 单元格双向编辑 API 回归
 *
 * 宿主公式栏需要的三件事都在这里：
 * 1) 选中格回填显示文本（公式格回填 '=…' 原文，而非计算值）；
 * 2) 右侧显示计算结果（错误显示 #CODE!）；
 * 3) 输入后写回单元格并走既有依赖图/撤销链路。
 */
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { createSpreadsheet } from '../src/index.js'

function makeSheet() {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const sheet = createSpreadsheet({
    container: host,
    sheets: [{ name: 'S', rowCount: 30, columnCount: 30 }],
  })
  return { sheet, host }
}

describe('公式栏双向编辑 API', () => {
  it('常量格回填原始文本，公式格回填公式原文并给出计算值', () => {
    const { sheet, host } = makeSheet()
    sheet.setCellValue(undefined, 0, 0, 120)
    sheet.setCellValue(undefined, 1, 0, 80)
    sheet.setCellValue(undefined, 2, 0, '=SUM(A1:A2)')

    expect(sheet.getFormulaBarText(0, 0)).toBe('120')
    expect(sheet.getFormulaBarText(2, 0)).toBe('=SUM(A1:A2)')
    expect(sheet.getFormulaBarValue(2, 0)).toBe(200)
    sheet.destroy()
    host.remove()
  })

  it('从公式栏改写常量 / 公式 / 清空，结果同步且公式链路重建', () => {
    const { sheet, host } = makeSheet()
    sheet.setFormulaBarText(0, 0, '120')
    sheet.setFormulaBarText(1, 0, '80')
    sheet.setFormulaBarText(2, 0, '=SUM(A1:A2)')
    expect(sheet.getCellValue(undefined, 2, 0)).toBe(200)

    // 改左上格 → 依赖图增量重算
    sheet.setFormulaBarText(0, 0, '200')
    expect(sheet.getFormulaBarValue(2, 0)).toBe(280)

    // 改写为常量 → 公式被移除，不再跟随上游
    sheet.setFormulaBarText(2, 0, '999')
    expect(sheet.getFormulaBarText(2, 0)).toBe('999')
    sheet.setFormulaBarText(0, 0, '1')
    expect(sheet.getCellValue(undefined, 2, 0)).toBe(999)

    // 空串清空
    sheet.setFormulaBarText(2, 0, '')
    expect(sheet.getFormulaBarText(2, 0)).toBe('')
    expect(sheet.getCellValue(undefined, 2, 0)).toBe(null)
    sheet.destroy()
    host.remove()
  })

  it('A1 地址换算支持 26 列之后', () => {
    const { sheet, host } = makeSheet()
    expect(sheet.cellAddress(0, 0)).toBe('A1')
    expect(sheet.cellAddress(4, 25)).toBe('Z5')
    expect(sheet.cellAddress(1, 26)).toBe('AA2')
    expect(sheet.cellAddress(9, 27)).toBe('AB10')
    sheet.destroy()
    host.remove()
  })

  it('错误公式在公式栏显示错误码', () => {
    const { sheet, host } = makeSheet()
    sheet.setFormulaBarText(0, 0, '=SUM(A1:A1)') // 自环 → #CYCLE!
    expect(sheet.getFormulaBarText(0, 0)).toBe('=SUM(A1:A1)')
    expect(sheet.getFormulaBarValue(0, 0)).toBe('#CYCLE!')
    sheet.destroy()
    host.remove()
  })
})

describe('电子表格缩放（双指/宿主）', () => {
  it('setZoom 缩放列宽与行高，复位回到基准', () => {
    const { sheet, host } = makeSheet()
    const layout = (sheet as unknown as {
      layout: { cols: { getWidth(i: number): number }; rows: { defaultHeight: number } }
    }).layout
    const w0 = layout.cols.getWidth(0)
    const h0 = layout.rows.defaultHeight

    expect(sheet.setZoom(2)).toBe(2)
    expect(sheet.getZoom()).toBe(2)
    expect(layout.cols.getWidth(0)).toBe(w0 * 2)
    expect(layout.rows.defaultHeight).toBe(Math.round(h0 * 2))

    sheet.setZoom(1)
    expect(layout.cols.getWidth(0)).toBe(w0)
    expect(layout.rows.defaultHeight).toBe(h0)
    sheet.destroy()
    host.remove()
  })
})
