/**
 * 第 21 张设计稿 · 大数据导入与批量处理 — 数据层
 *
 * 与 @sheetx/io 的 importCsvInBatches / runInBatches / validateImportRows 同构：
 * 分批 + 让出主线程 + 问题行定位（页面内轻量实现，避免给 playground 增依赖）。
 */

export interface OrderRow { id: string; customer: string; amount: number; date: string }

export const ORDER_ROWS: OrderRow[] = [
  { id: 'SO-2025001', customer: '华东科技', amount: 12800.50, date: '2025-01-15' },
  { id: 'SO-2025002', customer: '创新电子', amount: 8650.00, date: '2025-01-16' },
  { id: 'SO-2025003', customer: '智联网络', amount: 15200.00, date: '2025-01-17' },
  { id: 'SO-2025004', customer: '新视界科技', amount: 9750.20, date: '2025-01-18' },
  { id: 'SO-2025005', customer: '博远科技', amount: 18300.00, date: '2025-01-19' },
  { id: 'SO-2025006', customer: '卓越电子', amount: 7920.80, date: '2025-01-20' },
  { id: 'SO-2025007', customer: '天启科技', amount: 11600.00, date: '2025-01-21' },
  { id: 'SO-2025008', customer: '数智互联', amount: 14280.00, date: '2025-01-22' },
  { id: 'SO-2025009', customer: '华创科技', amount: 10500.00, date: '2025-01-23' },
  { id: 'SO-2025010', customer: '未来智能', amount: 16720.50, date: '2025-01-24' },
]

export interface FieldMapping {
  source: string
  target: string
  type: '文本' | '数字' | '日期' | '布尔'
}

export const DEFAULT_MAPPINGS: FieldMapping[] = [
  { source: '订单编号', target: '订单编号', type: '文本' },
  { source: '客户名称', target: '客户名称', type: '文本' },
  { source: '订单金额', target: '订单金额', type: '数字' },
  { source: '订单日期', target: '订单日期', type: '日期' },
]

export const TARGET_FIELDS = ['订单编号', '客户名称', '订单金额', '订单日期', '状态', '备注']
export const FIELD_TYPES: FieldMapping['type'][] = ['文本', '数字', '日期', '布尔']

export type ImportStep = 1 | 2 | 3 | 4
export const STEP_LABELS = ['选择文件', '字段映射', '预览数据', '导入完成']

export type FileKind = 'excel' | 'csv' | 'json' | 'database' | 'other'
export const FILE_KINDS: Array<{ key: FileKind; label: string; icon: string; color: string }> = [
  { key: 'excel', label: 'Excel 文件', icon: 'gridView', color: '#16a34a' },
  { key: 'csv', label: 'CSV 文件', icon: 'textT', color: '#2563eb' },
  { key: 'json', label: 'JSON 文件', icon: 'database', color: '#8b5cf6' },
  { key: 'database', label: '数据库', icon: 'database', color: '#0ea5e9' },
  { key: 'other', label: '其他格式', icon: 'more', color: '#94a3b8' },
]

/** 导入任务进展（设计稿中的实时数据） */
export interface ImportTick {
  processed: number
  total: number
  success: number
  warning: number
  error: number
  elapsed: string
  log: LogEntry[]
}

export interface LogEntry { time: string; text: string; level: 'info' | 'warn' | 'error' | 'success' }

export const INITIAL_TICK: ImportTick = {
  processed: 780000,
  total: 1000000,
  success: 780000,
  warning: 7,
  error: 3,
  elapsed: '2 分 18 秒',
  log: [
    { time: '14:32:15', text: '开始导入文件：销售数据_2025.xlsx', level: 'info' },
    { time: '14:34:12', text: '已处理 500,000 行...', level: 'info' },
    { time: '14:36:03', text: '已处理 780,000 行...', level: 'info' },
  ],
}

/** 错误行（定位面板；与 core/io 的 ImportIssue 同构） */
export interface ImportIssue {
  row: number
  field: string
  code: string
  severity: 'error' | 'warning'
  message: string
  raw?: string
}

export const SAMPLE_ISSUES: ImportIssue[] = [
  { row: 152, field: '订单日期', code: 'format', severity: 'warning', message: '日期格式不正确：2025/13/02', raw: '2025/13/02' },
  { row: 301, field: '订单金额', code: 'type', severity: 'error', message: '订单金额应为数字', raw: 'N/A' },
  { row: 566, field: '客户名称', code: 'required', severity: 'error', message: '客户名称为必填项', raw: '' },
  { row: 801, field: '订单编号', code: 'duplicate', severity: 'error', message: '订单编号与第 799 行重复', raw: 'SO-20250801' },
  { row: 934, field: '订单金额', code: 'range', severity: 'warning', message: '订单金额超出允许范围', raw: '-1200' },
]

/** 分批任务：把大数据拆成批，每批之间让出主线程（与 io.runInBatches 同语义） */
export async function runImportBatches(
  total: number,
  batchSize: number,
  onBatch: (processed: number) => void,
  signal?: { cancelled: boolean },
): Promise<void> {
  for (let done = 0; done < total; done += batchSize) {
    if (signal?.cancelled) return
    const next = Math.min(total, done + batchSize)
    onBatch(next)
    // macrotask 让出主线程，避免长任务卡死 UI
    await new Promise<void>((resolve) => setTimeout(resolve, 0))
  }
}

/** 生成用于预览的模拟大批量数据（不真的分配 100 万行） */
export function previewRow(index: number): OrderRow {
  const base = ORDER_ROWS[index % ORDER_ROWS.length]!
  return { ...base, id: `SO-${String(2025000 + index).padStart(7, '0')}` }
}
