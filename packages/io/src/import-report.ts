/**
 * @sheetx/io - 导入校验报告与错误行定位（百万级批量导入的可观测性）
 *
 * 零依赖：只消费记录数组与字段规则，不依赖 CSV 解析过程本身。
 * 设计目标：错误必须能定位到「第几行、哪个字段、什么问题」，
 * 且报告只保留问题行与统计，不复制全量数据（内存与问题数成正比）。
 */

export type IssueSeverity = 'error' | 'warning'

/** 单行单字段的问题 */
export interface ImportIssue {
  /** 1 起始的数据行号（不含表头） */
  row: number
  /** 行标识（若有 id/订单号等字段） */
  rowId?: string
  field: string
  code: 'required' | 'type' | 'range' | 'format' | 'duplicate' | 'custom'
  severity: IssueSeverity
  message: string
  /** 原始值（截断，避免大文本占内存） */
  raw?: string
}

/** 字段校验规则 */
export interface FieldRule {
  field: string
  label?: string
  required?: boolean
  type?: 'text' | 'number' | 'date' | 'boolean'
  /** 数值范围 */
  min?: number
  max?: number
  /** 文本最大长度 */
  maxLength?: number
  /** 正则格式 */
  pattern?: RegExp
  /** 唯一值（跨行去重） */
  unique?: boolean
  /** 自定义校验；返回 message 表示有问题 */
  validate?: (value: unknown, row: number) => string | null
  /** 问题严重级别，默认 error */
  severity?: IssueSeverity
}

export interface ImportStats {
  total: number
  processed: number
  success: number
  warning: number
  error: number
  /** 耗时 ms */
  durationMs: number
}

export interface ImportReport extends ImportStats {
  issues: ImportIssue[]
  /** 只展示前 N 条问题时是否有截断 */
  truncated: boolean
}

const DATE_PATTERN = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/

function toText(value: unknown): string {
  return value === null || value === undefined ? '' : String(value)
}

function preview(value: unknown): string {
  const text = toText(value)
  return text.length > 40 ? `${text.slice(0, 40)}…` : text
}

function issueOf(
  row: number,
  rowId: string | undefined,
  rule: FieldRule,
  code: ImportIssue['code'],
  message: string,
  raw: unknown,
): ImportIssue {
  return {
    row,
    rowId,
    field: rule.field,
    code,
    severity: rule.severity ?? 'error',
    message: message || `${rule.label ?? rule.field} 校验失败`,
    raw: preview(raw),
  }
}

/**
 * 逐行校验记录，返回问题清单（只保留问题行，不复制正常数据）。
 * @param records 已解析的记录数组
 * @param rules 字段规则
 * @param rowOffset 数据行的起始行号（默认 1，即表头之后第一行）
 * @param idField 用于定位的行标识字段
 * @param maxIssues 最多保留的问题数（默认 1000，防止异常数据撑爆内存）
 */
export function validateImportRows(
  records: ReadonlyArray<Record<string, unknown>>,
  rules: ReadonlyArray<FieldRule>,
  options: { rowOffset?: number; idField?: string; maxIssues?: number } = {},
): ImportIssue[] {
  const rowOffset = options.rowOffset ?? 1
  const maxIssues = options.maxIssues ?? 1000
  const issues: ImportIssue[] = []
  const seen = new Map<string, number>()

  outer: for (let index = 0; index < records.length; index++) {
    const record = records[index]!
    const row = index + rowOffset
    const rowId = options.idField ? toText(record[options.idField]) || undefined : undefined
    for (const rule of rules) {
      const value = record[rule.field]
      const text = toText(value)
      const label = rule.label ?? rule.field

      if (rule.required && text.trim() === '') {
        issues.push(issueOf(row, rowId, rule, 'required', `${label} 为必填项`, value))
      } else if (text.trim() !== '') {
        if (rule.type === 'number' && !Number.isFinite(Number(text))) {
          issues.push(issueOf(row, rowId, rule, 'type', `${label} 应为数字`, value))
        } else if (rule.type === 'date' && !DATE_PATTERN.test(text) && Number.isNaN(Date.parse(text))) {
          issues.push(issueOf(row, rowId, rule, 'format', `${label} 日期格式不正确`, value))
        } else if (rule.type === 'boolean' && !/^(true|false|1|0|是|否)$/i.test(text)) {
          issues.push(issueOf(row, rowId, rule, 'type', `${label} 应为布尔值`, value))
        } else if (rule.min !== undefined || rule.max !== undefined) {
          const num = Number(text)
          if (Number.isFinite(num) && ((rule.min !== undefined && num < rule.min) || (rule.max !== undefined && num > rule.max))) {
            issues.push(issueOf(row, rowId, rule, 'range', `${label} 超出允许范围`, value))
          }
        } else if (rule.maxLength !== undefined && text.length > rule.maxLength) {
          issues.push(issueOf(row, rowId, rule, 'range', `${label} 超过 ${rule.maxLength} 字符`, value))
        } else if (rule.pattern && !rule.pattern.test(text)) {
          issues.push(issueOf(row, rowId, rule, 'format', `${label} 格式不正确`, value))
        }
      }

      if (rule.unique && text.trim() !== '') {
        const first = seen.get(text)
        if (first !== undefined) {
          issues.push(issueOf(row, rowId, rule, 'duplicate', `${label} 与第 ${first} 行重复`, value))
        } else {
          seen.set(text, row)
        }
      }

      if (rule.validate) {
        const message = rule.validate(value, row)
        if (message) issues.push(issueOf(row, rowId, rule, 'custom', message, value))
      }

      if (issues.length >= maxIssues) break outer
    }
  }
  return issues
}

/** 由问题清单汇总统计（成功数 = 总数 - 有问题的不同行数） */
export function summarizeImport(
  total: number,
  processed: number,
  issues: ReadonlyArray<ImportIssue>,
  startedAt: number,
  endedAt = Date.now(),
): ImportReport {
  const warningRows = new Set<number>()
  const errorRows = new Set<number>()
  for (const issue of issues) {
    if (issue.severity === 'warning') warningRows.add(issue.row)
    else errorRows.add(issue.row)
  }
  const failedRows = errorRows.size
  const warningOnly = [...warningRows].filter((row) => !errorRows.has(row)).length
  return {
    total,
    processed,
    success: Math.max(0, processed - failedRows - warningOnly),
    warning: warningOnly,
    error: failedRows,
    durationMs: Math.max(0, endedAt - startedAt),
    issues: [...issues],
    truncated: issues.length >= 1000,
  }
}

/** 按问题行定位：返回首个问题（用于「跳转到错误行」按钮） */
export function firstIssue(issues: ReadonlyArray<ImportIssue>): ImportIssue | null {
  return issues.length > 0 ? issues[0]! : null
}

/** 问题按行分组（错误行定位面板用） */
export function groupIssuesByRow(issues: ReadonlyArray<ImportIssue>): Map<number, ImportIssue[]> {
  const grouped = new Map<number, ImportIssue[]>()
  for (const issue of issues) {
    const list = grouped.get(issue.row) ?? []
    list.push(issue)
    grouped.set(issue.row, list)
  }
  return grouped
}
