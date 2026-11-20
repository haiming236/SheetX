/**
 * 第 18 张设计稿 · 单元格格式与高级样式 — 数据层
 *
 * 样式表是「每格一份 CellStyle」，与 @sheetx/data 的 CellStyle 结构一致，
 * 可直接写入 <sheetx-spreadsheet>.setCellStyle()；显示用 @sheetx/spreadsheet 的 formatValue。
 */
/** 与 @sheetx/data 的 CellStyle 同构（playground 不额外依赖 data 包） */
export interface CellStyle {
  bold?: boolean
  italic?: boolean
  underline?: boolean
  fontSize?: number
  fontFamily?: string
  color?: string
  background?: string
  hAlign?: 'left' | 'center' | 'right'
  vAlign?: 'top' | 'middle' | 'bottom'
  numFmt?: string
  border?: { top?: string; right?: string; bottom?: string; left?: string }
}

export type NumCategory =
  | 'general' | 'number' | 'currency' | 'accounting' | 'date' | 'time'
  | 'percent' | 'fraction' | 'scientific' | 'text' | 'special' | 'custom'

export const NUM_CATEGORIES: Array<{ key: NumCategory; label: string }> = [
  { key: 'general', label: '常规' },
  { key: 'number', label: '数字' },
  { key: 'currency', label: '货币' },
  { key: 'accounting', label: '会计专用' },
  { key: 'date', label: '日期' },
  { key: 'time', label: '时间' },
  { key: 'percent', label: '百分比' },
  { key: 'fraction', label: '分数' },
  { key: 'scientific', label: '科学记数' },
  { key: 'text', label: '文本' },
  { key: 'special', label: '特殊' },
  { key: 'custom', label: '自定义' },
]

export const FORMAT_TABS = ['数字', '对齐', '字体', '边框', '填充'] as const
export type FormatTab = (typeof FORMAT_TABS)[number]

export interface ReportRow {
  dept: string
  target: number
  actual: number
  rate: number
  rank: number | '—'
  status: '优秀' | '良好' | '待提升' | '—'
}

/** A1:F7 报表数据（第 1 行是合并标题，第 2 行表头，第 7 行合计） */
export const REPORT_ROWS: ReportRow[] = [
  { dept: '华东', target: 120000, actual: 128000, rate: 1.067, rank: 1, status: '优秀' },
  { dept: '华南', target: 100000, actual: 95000, rate: 0.95, rank: 4, status: '良好' },
  { dept: '华北', target: 90000, actual: 92000, rate: 1.022, rank: 2, status: '优秀' },
  { dept: '西南', target: 80000, actual: 78000, rate: 0.975, rank: 3, status: '良好' },
  { dept: '华中', target: 70000, actual: 65000, rate: 0.929, rank: 5, status: '待提升' },
]

export const COLUMN_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']
export const HEADERS = ['部门', '销售目标', '实际销售', '完成率', '排名', '状态']

/** 状态标签配色 */
export const STATUS_STYLE: Record<ReportRow['status'], { color: string; background: string; icon: string }> = {
  优秀: { color: '#16a34a', background: '#f0fdf4', icon: '★' },
  良好: { color: '#f59e0b', background: '#fffbeb', icon: '★' },
  待提升: { color: '#dc2626', background: '#fef2f2', icon: '!' },
  '—': { color: '#94a3b8', background: 'transparent', icon: '—' },
}

/** 完成率条件着色（保留设计稿的红/黄/绿） */
export function rateBackground(rate: number): string | undefined {
  if (rate >= 1) return '#dcfce7'
  if (rate >= 0.95) return '#fef9c3'
  if (rate < 0.95) return '#fee2e2'
  return undefined
}

/** 单元格默认样式（按设计稿预设：标题/表头/合计行/完成率列） */
export function defaultCellStyle(row: number, col: number): CellStyle {
  if (row === 0) {
    return {
      bold: true,
      fontSize: 22,
      fontFamily: '思源黑体',
      color: '#ffffff',
      background: '#2563eb',
      hAlign: 'left',
      vAlign: 'middle',
    }
  }
  if (row === 1) {
    return {
      bold: true, fontSize: 13, fontFamily: '思源黑体', color: '#1e40af',
      background: '#dbeafe', hAlign: col === 0 ? 'left' : 'center', vAlign: 'middle',
    }
  }
  if (row === 6) {
    return {
      bold: true, fontSize: 13, fontFamily: '思源黑体', color: '#1e3a5f',
      background: '#dbeafe', hAlign: col === 0 ? 'left' : 'center', vAlign: 'middle',
    }
  }
  return {
    fontSize: 13, fontFamily: '思源黑体',
    hAlign: col === 0 ? 'left' : col === 5 ? 'center' : 'right',
    vAlign: 'middle',
    background: col === 3 && row >= 2 && row <= 6 ? rateBackground(REPORT_ROWS[row - 2]?.rate ?? 1) : undefined,
  }
}

/** 数值列 → 默认 numFmt（与右侧面板「货币 / 百分比」对应） */
export function defaultNumFmt(row: number, col: number): string {
  if (row === 0 || row === 1 || row === 6 && col === 0 || col === 0 || col === 4 || col === 5) return 'General'
  if (col === 3) return '0.0%'
  if (row === 6) return '¥#,##0'
  return '¥#,##0'
}

/** 分类 → 默认格式串（右侧面板选择时套用） */
export function categoryFmt(
  category: NumCategory,
  options: { decimals: number; symbol: string; negative: string },
): string {
  const zeros = options.decimals > 0 ? `.${'0'.repeat(options.decimals)}` : ''
  switch (category) {
    case 'general': return 'General'
    case 'number': return `#,##0${zeros}`
    case 'currency': return `${options.symbol}#,##0${zeros}`
    case 'accounting': return `_(${options.symbol}* #,##0${zeros}_)`
    case 'date': return 'yyyy-mm-dd'
    case 'time': return 'hh:mm'
    case 'percent': return `0${zeros}%`
    case 'fraction': return '# ?/?'
    case 'scientific': return '0.00E+00'
    case 'text': return '@'
    case 'special': return '000000'
    case 'custom': return `${options.symbol}#,##0${zeros}`
  }
}

/** 从格式串反推分类（选中已有格式的单元格时回填面板） */
export function categoryFromFmt(fmt: string): NumCategory {
  if (!fmt || fmt === 'General') return 'general'
  if (fmt.includes('%')) return 'percent'
  if (fmt.includes('E+')) return 'scientific'
  if (fmt.includes('?/?')) return 'fraction'
  if (fmt.includes('yyyy') || fmt.includes('mm-dd')) return 'date'
  if (fmt.includes('hh')) return 'time'
  if (fmt.includes('#,##')) return fmt.startsWith('¥') || fmt.includes('$') ? 'currency' : 'number'
  if (fmt === '@') return 'text'
  return 'custom'
}

export const FONT_FAMILIES = ['思源黑体', '苹方', '微软雅黑', 'Segoe UI', 'Arial']
export const FONT_SIZES = [12, 10, 11, 14, 16, 18, 22, 28]
export const COLOR_SWATCHES = [
  '#1f2937', '#2563eb', '#dc2626', '#16a34a', '#f59e0b', '#7c3aed',
  '#ffffff', '#dbeafe', '#fee2e2', '#dcfce7', '#fef9c3', '#f3f4f8',
]
