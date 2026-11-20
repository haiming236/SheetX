/** T8：零依赖 XLSX 基础读写（真实 ArrayBuffer 往返、压缩/非压缩、中文与合并区域） */
import { describe, it, expect } from 'vitest'
import {
  buildXlsx,
  parseXlsx,
  createBuiltinXlsxIO,
  getXlsxAdapter,
  registerBuiltinXlsxAdapter,
  dateToExcelSerial,
  excelSerialToDate,
  formatExcelDate,
} from '../src/index.js'
import type {
  XlsxCellStyle,
  XlsxConditionalFormat,
  XlsxDataValidation,
  XlsxParseResult,
  XlsxRichTextRun,
  XlsxSheetSnapshot,
} from '../src/index.js'
import { shiftFormulaReferences, __buildXlsxFromParts } from '../src/xlsx.js'

const snapshot: XlsxSheetSnapshot = {
  name: '商品明细',
  cells: [
    ['商品名称', '数量', '单价', '备注'],
    ['苹果', '100', '5.5', '新鲜,直达'],
    ['香蕉', '200', '3.2', ''],
    ['编号', '001', '-2', 'a<b&"c\'d'],
  ],
  merges: ['A1:B1'],
}

describe('buildXlsx → parseXlsx 往返', () => {
  it('deflate-raw 压缩写入后能读回中文/数字/空单元格/转义字符', async () => {
    const bytes = await buildXlsx([snapshot])
    expect(bytes.length).toBeGreaterThan(100)
    const result = await parseXlsx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer)
    expect(result.sheets).toHaveLength(1)
    expect(result.sheets[0]!.name).toBe('商品明细')
    expect(result.sheets[0]!.cells).toEqual(snapshot.cells)
    expect(result.sheets[0]!.merges).toEqual(['A1:B1'])
  })

  it('store（无压缩）模式同样可往返', async () => {
    const bytes = await buildXlsx([snapshot], { compress: false })
    const result = await parseXlsx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer)
    expect(result.sheets[0]!.cells).toEqual(snapshot.cells)
  })

  it('多工作表与顺序保持', async () => {
    const bytes = await buildXlsx([
      { name: '第一张', cells: [['A', 'B'], ['1', '2']] },
      { name: '第二张', cells: [['中文']] },
    ])
    const result = await parseXlsx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer)
    expect(result.sheets.map((sheet) => sheet.name)).toEqual(['第一张', '第二张'])
    expect(result.sheets[1]!.cells).toEqual([['中文']])
  })

  it('工作表名重复时明确拒绝', async () => {
    await expect(buildXlsx([
      { name: '同名', cells: [] },
      { name: '同名', cells: [] },
    ])).rejects.toThrow(/不能重复/)
  })

  it('空工作表列表拒绝生成', async () => {
    await expect(buildXlsx([])).rejects.toThrow(/至少需要一个工作表/)
  })

  it('非法字节流给出可诊断错误', async () => {
    await expect(parseXlsx(new ArrayBuffer(16))).rejects.toThrow(/ZIP 结束记录/)
  })

  it('deflate-raw 对重复内容有真实压缩收益', async () => {
    const large: XlsxSheetSnapshot = {
      name: '批量',
      cells: Array.from({ length: 300 }, (_, row) => [`商品${row % 20}`, '100', '5.5', '同样的备注文本']),
    }
    const compressed = await buildXlsx([large])
    const stored = await buildXlsx([large], { compress: false })
    expect(compressed.length).toBeLessThan(stored.length * 0.5)
  })
})

describe('createBuiltinXlsxIO / 注册', () => {
  it('Blob 构建 → ArrayBuffer 解析闭环', async () => {
    const io = createBuiltinXlsxIO()
    const blob = await io.build!([snapshot])
    expect(blob.type).toContain('spreadsheetml.sheet')
    const result = await io.parse(await blob.arrayBuffer())
    expect(result.sheets[0]!.cells[1]![0]).toBe('苹果')
  })

  it('registerBuiltinXlsxAdapter 幂等且可覆盖宿主适配器', () => {
    const first = registerBuiltinXlsxAdapter()
    expect(getXlsxAdapter()).toBe(first)
    const second = registerBuiltinXlsxAdapter({ compress: false })
    expect(getXlsxAdapter()).toBe(second)
    expect(second).not.toBe(first)
  })
})

describe('Excel 日期序列号（1900 日期系统）', () => {
  it('早期日期按 1899-12-31 基准，1900-03-01 起按 1899-12-30 基准', () => {
    expect(dateToExcelSerial('1900-01-01')).toBe(1)
    expect(dateToExcelSerial('1900-02-28')).toBe(59)
    expect(dateToExcelSerial('1900-03-01')).toBe(61)
    expect(dateToExcelSerial('1970-01-01')).toBe(25569)
  })

  it('伪造闰日 1900-02-29 不是合法日期；序列号 60 归一化到 1900-03-01', () => {
    expect(dateToExcelSerial('1900-02-29')).toBeNull()
    expect(formatExcelDate(excelSerialToDate(60)!)).toBe('1900-03-01')
  })

  it('分数部分表示时间，且非法输入安全返回 null', () => {
    expect(dateToExcelSerial('1970-01-01 12:00:00')).toBe(25569.5)
    expect(formatExcelDate(excelSerialToDate(25569.75)!)).toBe('1970-01-01 18:00:00')
    expect(dateToExcelSerial('2023-02-30')).toBeNull()
    expect(excelSerialToDate(-1)).toBeNull()
    expect(excelSerialToDate(Number.NaN)).toBeNull()
  })

  it('XLSX 日期单元格写出为数值序列号 + 样式索引，读回还原 ISO 字符串', async () => {
    const dated: XlsxSheetSnapshot = {
      name: '日期',
      cells: [
        ['日期', '时间', '文本数字'],
        ['2024-03-15', '2024-03-15 14:30:00', '001'],
      ],
    }
    const bytes = await buildXlsx([dated])
    const result = await parseXlsx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer)
    expect(result.sheets[0]!.cells).toEqual(dated.cells)
  })
})

describe('XLSX 公式读写（只保留公式串，不执行计算）', () => {
  const bytesOf = async (sheet: XlsxSheetSnapshot): Promise<XlsxParseResult> => {
    const bytes = await buildXlsx([sheet])
    return parseXlsx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer)
  }

  it('数值缓存公式：<f> + <v> 写出后公式与显示值都读回', async () => {
    const sheet: XlsxSheetSnapshot = {
      name: '公式',
      cells: [['商品', '金额'], ['苹果', '10'], ['香蕉', '20'], ['合计', '30']],
      formulas: [['', ''], ['', ''], ['', ''], ['', '=SUM(B2:B3)']],
    }
    const result = await bytesOf(sheet)
    expect(result.sheets[0]!.cells).toEqual(sheet.cells)
    expect(result.sheets[0]!.formulas).toEqual(sheet.formulas)
  })

  it('字符串缓存公式：t="str" 的显示值正确读回', async () => {
    const sheet: XlsxSheetSnapshot = {
      name: '字符串公式',
      cells: [['OK']],
      formulas: [['=IF(TRUE,"OK","NO")']],
    }
    const result = await bytesOf(sheet)
    expect(result.sheets[0]!.cells).toEqual([['OK']])
    expect(result.sheets[0]!.formulas).toEqual([['=IF(TRUE,"OK","NO")']])
  })

  it('无公式或空公式时不写 formulas 字段（向后兼容）', async () => {
    const result = await bytesOf({ name: '普通', cells: [['A', 'B']] })
    expect(result.sheets[0]!.formulas).toBeUndefined()
    const empty = await bytesOf({ name: '空公式', cells: [['A']], formulas: [['']] })
    expect(empty.sheets[0]!.formulas).toBeUndefined()
  })

  it('公式串缺前导 = 时读回统一补全', async () => {
    const result = await bytesOf({ name: '规范化', cells: [['6']], formulas: [['SUM(1,2,3)']] })
    expect(result.sheets[0]!.formulas).toEqual([['=SUM(1,2,3)']])
  })
})

describe('XLSX 单元格样式读写', () => {
  const bytesOf = async (sheet: XlsxSheetSnapshot): Promise<XlsxParseResult> => {
    const bytes = await buildXlsx([sheet])
    return parseXlsx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer)
  }

  it('字体/填充/边框/对齐/数字格式完整往返', async () => {
    const style: XlsxCellStyle = {
      bold: true, italic: true, underline: true,
      fontColor: '#FF0000', fill: '#FFFF00', border: true,
      align: 'center', verticalAlign: 'middle', wrapText: true,
      numberFormat: '#,##0.00',
    }
    const result = await bytesOf({ name: '样式', cells: [['1234.5']], styles: [[style]] })
    expect(result.sheets[0]!.cells).toEqual([['1234.5']])
    expect(result.sheets[0]!.styles?.[0]![0]).toEqual(style)
  })

  it('默认样式与空对象不写入 styles 字段（向后兼容）', async () => {
    const result = await bytesOf({ name: '无样式', cells: [['A', 'B']], styles: [[undefined, {}]] })
    expect(result.sheets[0]!.styles).toBeUndefined()
  })

  it('日期值与自定义样式共存：显示值转 ISO，样式号仍读回', async () => {
    const result = await bytesOf({
      name: '日期样式',
      cells: [['2024-03-15']],
      styles: [[{ bold: true, numberFormat: 'yyyy-mm-dd' }]],
    })
    expect(result.sheets[0]!.cells).toEqual([['2024-03-15']])
    expect(result.sheets[0]!.styles?.[0]![0]).toEqual({ bold: true, numberFormat: 'yyyy-mm-dd' })
  })

  it('公式与样式共存', async () => {
    const result = await bytesOf({
      name: '公式样式',
      cells: [['30']],
      formulas: [['=SUM(1,2,3)']],
      styles: [[{ bold: true }]],
    })
    expect(result.sheets[0]!.formulas).toEqual([['=SUM(1,2,3)']])
    expect(result.sheets[0]!.styles?.[0]![0]).toEqual({ bold: true })
  })
})

describe('XLSX 数据验证读写', () => {
  const bytesOf = async (sheet: XlsxSheetSnapshot): Promise<XlsxParseResult> => {
    const bytes = await buildXlsx([sheet])
    return parseXlsx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer)
  }

  it('列表验证与错误提示往返', async () => {
    const rule: XlsxDataValidation = {
      type: 'list', sqref: 'B2:B100', formulas: ['"苹果,香蕉,橙子"'],
      allowBlank: true, showErrorMessage: true, error: '请从下拉列表中选择',
    }
    const result = await bytesOf({ name: '验证', cells: [['商品', '数量']], validations: [rule] })
    expect(result.sheets[0]!.validations).toEqual([rule])
  })

  it('数值区间与自定义公式往返', async () => {
    const rules: XlsxDataValidation[] = [
      { type: 'whole', sqref: 'C2:C50', operator: 'between', formulas: ['1', '100'] },
      { type: 'custom', sqref: 'D2:D50', formulas: ['ISNUMBER(D2)'], showInputMessage: true, prompt: '请输入数字' },
    ]
    const result = await bytesOf({ name: '验证', cells: [['A', 'B']], validations: rules })
    expect(result.sheets[0]!.validations).toEqual(rules)
  })

  it('日期验证往返', async () => {
    const rule: XlsxDataValidation = {
      type: 'date', sqref: 'E2:E20', operator: 'greaterThan', formulas: ['DATE(2024,1,1)'],
    }
    const result = await bytesOf({ name: '验证', cells: [['日期']], validations: [rule] })
    expect(result.sheets[0]!.validations).toEqual([rule])
  })

  it('无验证时不输出 validations 字段（向后兼容）', async () => {
    const result = await bytesOf({ name: '普通', cells: [['A']], validations: [] })
    expect(result.sheets[0]!.validations).toBeUndefined()
  })
})

describe('XLSX 条件格式读写', () => {
  const bytesOf = async (sheet: XlsxSheetSnapshot): Promise<XlsxParseResult> => {
    const bytes = await buildXlsx([sheet])
    return parseXlsx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer)
  }

  it('cellIs 规则与 dxf 字体色/填充色往返', async () => {
    const formats: XlsxConditionalFormat[] = [{
      sqref: 'B2:B100',
      rules: [{
        type: 'cellIs', operator: 'greaterThan', formulas: ['100'],
        fill: '#FFC7CE', fontColor: '#9C0006', bold: true,
      }],
    }]
    const result = await bytesOf({ name: '条件格式', cells: [['A', 'B']], conditionalFormats: formats })
    expect(result.sheets[0]!.conditionalFormats).toEqual(formats)
  })

  it('三色阶与公式规则往返', async () => {
    const formats: XlsxConditionalFormat[] = [
      { sqref: 'C2:C20', rules: [{ type: 'colorScale', colors: ['#F8696B', '#FFEB84', '#63BE7B'] }] },
      { sqref: 'D2:D20', rules: [{ type: 'expression', formulas: ['=D2>AVERAGE($D$2:$D$20)'] }] },
    ]
    const result = await bytesOf({ name: '条件格式', cells: [['A']], conditionalFormats: formats })
    expect(result.sheets[0]!.conditionalFormats).toEqual(formats)
  })

  it('重复值 / 前 N 项 / 包含文本规则往返', async () => {
    const formats: XlsxConditionalFormat[] = [
      { sqref: 'A1:A10', rules: [{ type: 'duplicateValues', fill: '#FFFF00' }] },
      { sqref: 'B1:B10', rules: [{ type: 'top10', rank: 10, percent: true, bottom: true }] },
      { sqref: 'C1:C10', rules: [{ type: 'containsText', textOperator: 'contains', text: '苹果' }] },
    ]
    const result = await bytesOf({ name: '条件格式', cells: [['A']], conditionalFormats: formats })
    expect(result.sheets[0]!.conditionalFormats).toEqual(formats)
  })

  it('无条件格式时不输出 conditionalFormats 字段（向后兼容）', async () => {
    const result = await bytesOf({ name: '普通', cells: [['A']] })
    expect(result.sheets[0]!.conditionalFormats).toBeUndefined()
  })
})

describe('XLSX 共享公式读取', () => {
  it('引用平移保留 $ 锚点，跳过函数名/表名/标识符', () => {
    expect(shiftFormulaReferences('A1+$B$2+C3', 1, 1)).toBe('B2+$B$2+D4')
    expect(shiftFormulaReferences('Sheet1!A1+LOG10(A1)+MY_A1', 1, 1)).toBe('Sheet1!B2+LOG10(B2)+MY_A1')
    expect(shiftFormulaReferences('A1', 0, -5)).toBe('A1')
  })

  it('shared si base + 自闭合 dependent 按偏移还原公式', async () => {
    const ns = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
    const relNs = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
    const bytes = await __buildXlsxFromParts({
      'xl/workbook.xml': `<?xml version="1.0"?><workbook xmlns="${ns}" xmlns:r="${relNs}">` +
        `<sheets><sheet name="共享" sheetId="1" r:id="rId1"/></sheets></workbook>`,
      'xl/_rels/workbook.xml.rels': `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="${relNs}/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`,
      'xl/worksheets/sheet1.xml': `<?xml version="1.0"?><worksheet xmlns="${ns}"><sheetData>` +
        `<row r="1"><c r="A1" t="inlineStr"><is><t>值</t></is></c><c r="B1" t="inlineStr"><is><t>结果</t></is></c></row>` +
        `<row r="2"><c r="A2"><v>2</v></c><c r="B2"><f t="shared" ref="B2:B4" si="0">A2*2</f><v>4</v></c></row>` +
        `<row r="3"><c r="A3"><v>3</v></c><c r="B3"><f t="shared" si="0"/><v>6</v></c></row>` +
        `<row r="4"><c r="A4"><v>4</v></c><c r="B4"><f t="shared" si="0"/><v>8</v></c></row>` +
        `</sheetData></worksheet>`,
    })
    const result = await parseXlsx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer)
    expect(result.sheets[0]!.cells[1]).toEqual(['2', '4'])
    expect(result.sheets[0]!.formulas).toEqual([
      ['', ''],
      ['', '=A2*2'],
      ['', '=A3*2'],
      ['', '=A4*2'],
    ])
  })

  it('普通公式写入路径不回归', async () => {
    const bytes = await buildXlsx([{
      name: '普通公式',
      cells: [['6']],
      formulas: [['=SUM(1,2,3)']],
    }])
    const result = await parseXlsx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer)
    expect(result.sheets[0]!.formulas).toEqual([['=SUM(1,2,3)']])
  })
})

describe('XLSX 富文本读写', () => {
  const bytesOf = async (sheet: XlsxSheetSnapshot): Promise<XlsxParseResult> => {
    const bytes = await buildXlsx([sheet])
    return parseXlsx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer)
  }

  it('inlineStr 富文本 run 完整往返', async () => {
    const runs: XlsxRichTextRun[] = [
      { text: '合计', bold: true, fontColor: '#FF0000' },
      { text: ' 123.45', italic: true, underline: true, fontFamily: 'Arial', fontSize: 14 },
    ]
    const result = await bytesOf({ name: '富文本', cells: [['合计 123.45']], richText: [[runs]] })
    expect(result.sheets[0]!.cells).toEqual([['合计 123.45']])
    expect(result.sheets[0]!.richText?.[0]![0]).toEqual(runs)
  })

  it('cells 为空时按 run 拼接显示文本', async () => {
    const runs: XlsxRichTextRun[] = [{ text: 'A' }, { text: 'B', bold: true }]
    const result = await bytesOf({ name: '富文本', cells: [['']], richText: [[runs]] })
    expect(result.sheets[0]!.cells).toEqual([['AB']])
  })

  it('sharedStrings 富文本读取', async () => {
    const ns = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
    const relNs = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
    const bytes = await __buildXlsxFromParts({
      'xl/workbook.xml': `<?xml version="1.0"?><workbook xmlns="${ns}" xmlns:r="${relNs}">` +
        `<sheets><sheet name="富文本" sheetId="1" r:id="rId1"/></sheets></workbook>`,
      'xl/_rels/workbook.xml.rels': `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="${relNs}/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`,
      'xl/sharedStrings.xml': `<?xml version="1.0"?><sst xmlns="${ns}" count="1" uniqueCount="1"><si>` +
        `<r><rPr><b/><color rgb="FFFF0000"/></rPr><t>红</t></r><r><t>色</t></r></si></sst>`,
      'xl/worksheets/sheet1.xml': `<?xml version="1.0"?><worksheet xmlns="${ns}"><sheetData>` +
        `<row r="1"><c r="A1" t="s"><v>0</v></c></row></sheetData></worksheet>`,
    })
    const result = await parseXlsx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer)
    expect(result.sheets[0]!.cells).toEqual([['红色']])
    expect(result.sheets[0]!.richText?.[0]![0]).toEqual([
      { text: '红', bold: true, fontColor: '#FF0000' },
      { text: '色' },
    ])
  })

  it('纯文本不输出 richText 字段（向后兼容）', async () => {
    const result = await bytesOf({ name: '普通', cells: [['A']] })
    expect(result.sheets[0]!.richText).toBeUndefined()
  })
})
