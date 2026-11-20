/** 导入校验报告：错误行定位、统计、内存上限 */
import { describe, it, expect } from 'vitest'
import {
  validateImportRows, summarizeImport, firstIssue, groupIssuesByRow,
  type FieldRule,
} from '../src/import-report.js'

const rules: FieldRule[] = [
  { field: '订单编号', label: '订单编号', required: true, unique: true, pattern: /^SO-\d+$/ },
  { field: '客户名称', label: '客户名称', required: true, maxLength: 20 },
  { field: '订单金额', label: '订单金额', type: 'number', min: 0 },
  { field: '订单日期', label: '订单日期', type: 'date', severity: 'warning' },
]

describe('validateImportRows · 错误行定位', () => {
  it('定位到具体行号、字段、错误码与原始值', () => {
    const records = [
      { 订单编号: 'SO-001', 客户名称: '华东科技', 订单金额: 12800.5, 订单日期: '2025-01-15' },
      { 订单编号: '', 客户名称: '创新电子', 订单金额: 8650, 订单日期: '2025-01-16' },
      { 订单编号: 'SO-002', 客户名称: '智联网络', 订单金额: 'abc', 订单日期: '2025-01-17' },
    ]
    const issues = validateImportRows(records, rules, { idField: '订单编号' })
    expect(issues).toHaveLength(2)
    expect(issues[0]).toMatchObject({
      row: 2, field: '订单编号', code: 'required', severity: 'error',
    })
    expect(issues[1]).toMatchObject({ row: 3, field: '订单金额', code: 'type' })
    expect(issues[1]!.raw).toBe('abc')
  })

  it('唯一性校验标记第二次出现，并回指首次行号', () => {
    const records = [
      { 订单编号: 'SO-001', 客户名称: 'A', 订单金额: 1, 订单日期: '2025-01-01' },
      { 订单编号: 'SO-001', 客户名称: 'B', 订单金额: 2, 订单日期: '2025-01-02' },
    ]
    const issues = validateImportRows(records, rules)
    const duplicate = issues.find((issue) => issue.code === 'duplicate')
    expect(duplicate).toMatchObject({ row: 2, message: '订单编号 与第 1 行重复' })
  })

  it('warning 级别独立标记（日期格式）且不影响 error 统计', () => {
    const issues = validateImportRows([
      { 订单编号: 'SO-001', 客户名称: 'A', 订单金额: 1, 订单日期: '不是日期' },
    ], rules)
    expect(issues).toHaveLength(1)
    expect(issues[0]).toMatchObject({ severity: 'warning', code: 'format' })
  })

  it('自定义校验与行号回调', () => {
    const custom: FieldRule[] = [{ field: 'qty', validate: (value, row) => Number(value) > 10 && row === 1 ? '首行数量不能超过 10' : null }]
    const issues = validateImportRows([{ qty: 20 }, { qty: 20 }], custom)
    expect(issues).toEqual([{
      row: 1, field: 'qty', code: 'custom', severity: 'error',
      message: '首行数量不能超过 10', raw: '20',
    }])
  })

  it('maxIssues 限制内存：100 万问题行只保留上限条数', () => {
    const records = Array.from({ length: 100_000 }, (_, i) => ({ 订单编号: '', 客户名称: `客户${i}`, 订单金额: i, 订单日期: '2025-01-01' }))
    const issues = validateImportRows(records, rules, { maxIssues: 50 })
    expect(issues).toHaveLength(50)
    expect(issues[0]!.row).toBe(1)
    expect(issues[49]!.row).toBe(50)
  })
})

describe('summarizeImport · 批量处理结果', () => {
  it('统计成功/警告/失败行（同一行多重错误只算一次）', () => {
    const issues = [
      { row: 2, field: 'a', code: 'required' as const, severity: 'error' as const, message: '' },
      { row: 2, field: 'b', code: 'type' as const, severity: 'error' as const, message: '' },
      { row: 3, field: 'c', code: 'format' as const, severity: 'warning' as const, message: '' },
    ]
    const report = summarizeImport(5, 5, issues, 1000, 2500)
    expect(report).toMatchObject({ total: 5, processed: 5, success: 3, warning: 1, error: 1, durationMs: 1500 })
  })

  it('firstIssue 与按行分组', () => {
    const issues = [
      { row: 3, field: 'b', code: 'type' as const, severity: 'error' as const, message: 'b' },
      { row: 2, field: 'a', code: 'required' as const, severity: 'error' as const, message: 'a' },
      { row: 3, field: 'c', code: 'range' as const, severity: 'warning' as const, message: 'c' },
    ]
    expect(firstIssue(issues)!.row).toBe(3) // 按问题出现顺序，不做行号排序（保留导入顺序）
    const grouped = groupIssuesByRow(issues)
    expect([...grouped.keys()]).toEqual([3, 2])
    expect(grouped.get(3)).toHaveLength(2)
  })
})
