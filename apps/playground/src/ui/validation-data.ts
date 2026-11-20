/**
 * SheetX 第 15 张 · 数据验证与智能输入 — 静态数据
 */

export const TOP_MENUS = ['文件', '开始', '插入', '数据', '公式', '视图', '设置'] as const

export interface EmpRow {
  id: string
  name: string
  dept: string
  hireDate: string
  salary: number
}

/** 员工信息（月薪合计 55,000 / 平均 11,000，与设计稿状态栏一致） */
export const EMP_ROWS: EmpRow[] = [
  { id: 'E001', name: '张三', dept: '技术部', hireDate: '2025-01-15', salary: 12000 },
  { id: 'E002', name: '李四', dept: '市场部', hireDate: '2025-02-20', salary: 11000 },
  { id: 'E003', name: '王五', dept: '技术部', hireDate: '2025-03-10', salary: 13000 },
  { id: 'E004', name: '赵六', dept: '市场部', hireDate: '2025-04-12', salary: 10500 },
  { id: 'E005', name: '钱七', dept: '产品部', hireDate: '2025-05-18', salary: 8500 },
]

export const DEPT_OPTIONS = ['技术部', '市场部', '产品部', '运营部', '财务部'] as const

export const ALLOW_TYPES = ['序列（下拉列表）', '整数', '小数', '日期', '文本长度', '必填'] as const
export type AllowType = (typeof ALLOW_TYPES)[number]

export const ERROR_STYLES = ['停止', '警告', '信息'] as const
export type ErrorStyle = (typeof ERROR_STYLES)[number]

export const SHEET_TABS = ['员工信息', '销售数据', '统计分析'] as const

export const HIGHLIGHTS = [
  '下拉选项、数字范围、日期限制等多种校验规则',
  '实时校验与友好提示，减少数据错误',
  '支持批量设置，提升数据录入效率',
] as const

/** 每列校验规则 */
export interface ValidationRule {
  type: AllowType
  options: string[]
  min: number
  max: number
  minDate: string
  maxDate: string
  allowBlank: boolean
  dropdownArrow: boolean
  errorTitle: string
  errorContent: string
  promptTitle: string
  promptContent: string
}

function baseRule(): ValidationRule {
  return {
    type: '必填', options: [], min: 0, max: 100000,
    minDate: '2020-01-01', maxDate: '2025-12-31',
    allowBlank: false, dropdownArrow: true,
    errorTitle: '输入值不符合要求', errorContent: '该单元格不能为空',
    promptTitle: '', promptContent: '',
  }
}

/** 列 → 默认规则（A..E） */
export function defaultRules(): Record<string, ValidationRule> {
  const a = baseRule()
  a.errorContent = '员工编号不能为空'
  a.promptTitle = '员工编号'
  a.promptContent = '格式：E + 三位数字，如 E006'

  const b = baseRule()
  b.errorContent = '姓名不能为空'
  b.promptTitle = '姓名'
  b.promptContent = '请输入员工姓名'

  const c = baseRule()
  c.type = '序列（下拉列表）'
  c.options = [...DEPT_OPTIONS]
  c.allowBlank = true
  c.errorContent = '请选择部门列表中的选项'
  c.promptTitle = '部门'
  c.promptContent = '请从下拉列表中选择部门'

  const d = baseRule()
  d.type = '日期'
  d.allowBlank = true
  d.errorContent = '入职日期需在 2020-01-01 至 2025-12-31 之间'
  d.promptTitle = '入职日期'
  d.promptContent = '格式：YYYY-MM-DD，不晚于 2025-12-31'

  const e = baseRule()
  e.type = '整数'
  e.min = 0
  e.max = 100000
  e.allowBlank = true
  e.errorContent = '月薪需为 0 - 100,000 之间的整数'
  e.promptTitle = '月薪（元）'
  e.promptContent = '0 - 100,000 之间的整数'

  return { A: a, B: b, C: c, D: d, E: e }
}

export const PANEL_TABS = ['设置', '输入提示', '出错提示'] as const
