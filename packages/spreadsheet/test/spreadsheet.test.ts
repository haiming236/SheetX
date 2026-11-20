import { describe, it, expect } from 'vitest'
import { WorkbookModel } from '../src/workbook.js'
import { formatValue } from '../src/format.js'
import { registerSheetMutations } from '../src/sheet-mutations.js'
import { SetSheetCellsMutation, MergeCellsMutation, UnmergeCellsMutation, SetColWidthMutation } from '../src/sheet-mutations.js'
import { CommandService } from '@sheetx/data'
import { WorksheetStore } from '@sheetx/data'

describe('WorkbookModel', () => {
  it('创建/命名/活动表', () => {
    const workbook = new WorkbookModel()
    const s1 = workbook.createSheet('数据')
    const s2 = workbook.createSheet('配置')
    expect(workbook.sheetCount).toBe(2)
    expect(workbook.activeSheetId).toBe(s1.id)
    workbook.setActiveSheet(s2.id)
    expect(workbook.getActive()!.name).toBe('配置')
    expect(workbook.resolveSheet('数据')!.id).toBe(s1.id) // 按名解析（公式引用路径）
    expect(workbook.resolveSheet(s1.id)!.id).toBe(s1.id) // 按 id 解析
    expect(workbook.resolveSheet(null)!.id).toBe(s2.id) // null = 活动表
  })

  it('重名/重 id 抛错', () => {
    const workbook = new WorkbookModel()
    workbook.createSheet('Sheet1')
    expect(() => workbook.createSheet('Sheet1')).toThrow(/已存在/)
  })

  it('删除活动表后自动切换', () => {
    const workbook = new WorkbookModel()
    const s1 = workbook.createSheet('A')
    const s2 = workbook.createSheet('B')
    workbook.setActiveSheet(s2.id)
    workbook.removeSheet(s2.id)
    expect(workbook.activeSheetId).toBe(s1.id)
  })

  it('快照 JSON 往返', () => {
    const workbook = new WorkbookModel()
    const sheet = workbook.createSheet('数据', 10, 5)
    sheet.setCellData(0, 0, { v: 42, f: '=A1+1' })
    const json = JSON.parse(JSON.stringify(workbook.toJSON()))
    const restored = WorkbookModel.fromJSON(json)
    expect(restored.sheetCount).toBe(1)
    expect(restored.getSheetByName('数据')!.getCellData(0, 0)).toEqual({ v: 42, f: '=A1+1' })
  })
})

describe('formatValue（数字/日期格式）', () => {
  it('General / 默认', () => {
    expect(formatValue('文本', undefined)).toBe('文本')
    expect(formatValue(42, 'General')).toBe('42')
    expect(formatValue(true, undefined)).toBe('TRUE')
    expect(formatValue(null, '0.00')).toBe('')
  })

  it('定点小数', () => {
    expect(formatValue(3.14159, '0.00')).toBe('3.14')
    expect(formatValue(3, '0.00')).toBe('3.00')
    expect(formatValue(5, '0')).toBe('5')
  })

  it('千分位与货币', () => {
    expect(formatValue(1234567.891, '#,##0.00')).toBe('1,234,567.89')
    expect(formatValue(1234567, '#,##0')).toBe('1,234,567')
    expect(formatValue(88.5, '¥#,##0.00')).toBe('¥88.50')
  })

  it('百分比', () => {
    expect(formatValue(0.256, '0%')).toBe('26%')
    expect(formatValue(0.256, '0.00%')).toBe('25.60%')
  })

  it('Excel 日期序列格式化', () => {
    // 序列 61 = 1900-03-01（Excel 精确兼容起点）
    expect(formatValue(61, 'yyyy-mm-dd')).toBe('1900-03-01')
    expect(formatValue(61, 'yyyy/mm/dd')).toBe('1900/03/01')
    expect(formatValue(45951, 'yyyy-mm-dd')).toBe('2025-10-21') // 与 Excel 2025-10-21 对照（序列 45951）
  })

  it('未识别模式按原值输出', () => {
    expect(formatValue(42, '@@weird@@')).toBe('42')
  })
})

describe('Sheet mutations + Undo（工作簿级命令系统）', () => {
  function makeService() {
    const workbook = new WorkbookModel()
    const sheet = workbook.createSheet('Sheet1', 20, 10)
    const service = new CommandService(workbook, 'sheet-1')
    registerSheetMutations(service)
    return { workbook, sheet, service }
  }

  it('set-cells 写入/撤销/重做', async () => {
    const { sheet, service } = makeService()
    const params = { sheetId: sheet.id, cells: [{ row: 0, col: 0, newData: { v: 'hello' as never } }] }
    service.executeMutation({ id: 'sheet.mutation.set-cells', params, source: 'user' })
    expect(sheet.getRawValue(0, 0)).toBe('hello')
    await service.undo()
    expect(sheet.getCellData(0, 0)).toBeUndefined() // 稀疏：清空即回收
    await service.redo()
    expect(sheet.getRawValue(0, 0)).toBe('hello')
  })

  it('覆盖写值撤销恢复旧值', async () => {
    const { sheet, service } = makeService()
    service.executeMutation({ id: 'sheet.mutation.set-cells', params: { sheetId: sheet.id, cells: [{ row: 1, col: 1, newData: { v: 1 } }] } })
    service.executeMutation({ id: 'sheet.mutation.set-cells', params: { sheetId: sheet.id, cells: [{ row: 1, col: 1, newData: { v: 2 } }] } })
    expect(sheet.getRawValue(1, 1)).toBe(2)
    await service.undo()
    expect(sheet.getRawValue(1, 1)).toBe(1)
  })

  it('merge ↔ unmerge 跨 mutation 反演', async () => {
    const { sheet, service } = makeService()
    service.executeMutation({
      id: 'sheet.mutation.merge',
      params: { sheetId: sheet.id, range: { start: { row: 0, col: 0 }, end: { row: 2, col: 2 } } },
    })
    expect(sheet.findMergeAt(1, 1)).toBeDefined()
    await service.undo()
    expect(sheet.findMergeAt(1, 1)).toBeUndefined()
    await service.redo()
    expect(sheet.findMergeAt(1, 1)?.range.end.row).toBe(2)
  })

  it('列宽变更可撤销', async () => {
    const { sheet, service } = makeService()
    service.executeMutation({ id: 'sheet.mutation.set-col-width', params: { sheetId: sheet.id, col: 3, width: 250, prevWidth: sheet.getColWidth(3) } })
    expect(sheet.getColWidth(3)).toBe(250)
    await service.undo()
    expect(sheet.colWidths.has(3)).toBe(false) // 回到默认值 → 覆盖条目回收
  })

  it('删表撤销恢复全部数据（丢失型操作）', async () => {
    const { workbook, sheet, service } = makeService()
    sheet.setCellData(0, 0, { v: '重要数据' })
    sheet.setCellData(5, 5, { v: 99, f: '=A1' })
    service.executeMutation({ id: 'sheet.mutation.remove-sheet', params: { sheetId: sheet.id } })
    expect(workbook.sheetCount).toBe(0)
    await service.undo()
    expect(workbook.sheetCount).toBe(1)
    const restored = workbook.getSheet(sheet.id)!
    expect(restored.getRawValue(0, 0)).toBe('重要数据')
    expect(restored.getCellData(5, 5)?.f).toBe('=A1')
  })
})
