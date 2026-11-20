import { describe, it, expect } from 'vitest'
import { parseCsv, stringifyCsv, rowsToCsv, csvToRows, runInBatches, importCsvInBatches } from '../src/index.js'

describe('CSV 解析（RFC 4180 状态机）', () => {
  it('基础解析', () => {
    expect(parseCsv('a,b,c\n1,2,3')).toEqual([['a', 'b', 'c'], ['1', '2', '3']])
  })

  it('BOM 去除（Windows 导出）', () => {
    expect(parseCsv('\uFEFFa,b')).toEqual([['a', 'b']])
  })

  it('引号字段内含逗号/换行/双引号', () => {
    const csv = '"a,1","line1\nline2","say ""hi"""'
    expect(parseCsv(csv)).toEqual([['a,1', 'line1\nline2', 'say "hi"']])
  })

  it('非引号字段中的引号是普通字符', () => {
    expect(parseCsv('a"b')).toEqual([['a"b']])
  })

  it('CRLF 与 LF 都支持', () => {
    expect(parseCsv('a,b\r\nc,d')).toEqual([['a', 'b'], ['c', 'd']])
    expect(parseCsv('a,b\nc,d')).toEqual([['a', 'b'], ['c', 'd']])
  })

  it('中文内容', () => {
    expect(parseCsv('苹果,5.5\n香蕉,3.2')).toEqual([['苹果', '5.5'], ['香蕉', '3.2']])
  })
})

describe('CSV 导出', () => {
  it('需要引号时正确转义', () => {
    expect(stringifyCsv([['a,b', 'x']])).toBe('"a,b",x')
    expect(stringifyCsv([['say "hi"']])).toBe('"say ""hi"""')
    expect(stringifyCsv([['line\nbreak']])).toBe('"line\nbreak"')
  })

  it('CRLF 行结束（Excel 兼容）', () => {
    expect(stringifyCsv([['a'], ['b']])).toBe('a\r\nb')
  })

  it('行导出与导入往返', () => {
    const rows = [
      { id: 'r1', data: { name: '苹果', price: 5.5, note: '新鲜,直达' } },
      { id: 'r2', data: { name: '香蕉', price: 3.2, note: null } },
    ]
    const csv = rowsToCsv(rows, [
      { key: 'name', title: '商品名称' },
      { key: 'price', title: '单价' },
      { key: 'note', title: '备注' },
    ])
    const round = csvToRows(csv, {
      columns: [
        { key: 'name' },
        { key: 'price' },
        { key: 'note' },
      ],
    })
    expect(round.rows.length).toBe(2)
    expect(round.rows[0]!.data.name).toBe('苹果')
    expect(round.rows[0]!.data.note).toBe('新鲜,直达')
    expect(round.rows[1]!.data.note).toBeNull()
  })
})

describe('分批导入', () => {
  it('runInBatches 按批回调并让出主线程', async () => {
    const batches: number[][] = []
    await runInBatches([1, 2, 3, 4, 5], 2, async (batch) => {
      batches.push([...batch])
    })
    expect(batches).toEqual([[1, 2], [3, 4], [5]])
  })

  it('importCsvInBatches 进度与总数', async () => {
    // 11 行文本 = 1 行表头 + 10 行数据
    const rows = Array.from({ length: 11 }, (_, i) => `name${i},${i}`).join('\n')
    const seen: number[] = []
    let lastProgress = 0
    await importCsvInBatches(rows, {
      onBatch: (batch, progress) => {
        seen.push(batch.length)
        lastProgress = progress
      },
    }, { batchSize: 4 })
    expect(seen).toEqual([4, 4, 2])
    expect(lastProgress).toBe(1)
  })
})
