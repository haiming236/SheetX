/**
 * @sheetx/validation - 校验引擎（任务书 T9）
 *
 * 职责：规则校验、异步校验、错误提示。
 *
 * 设计要点：
 * - 校验**不改数据**：只产出错误列表，由 grid 引擎决定 UI 呈现与是否拦截提交
 *   （对应 Univer 拦截器思想：VALIDATE_CELL 挂钩，引擎零侵入）。
 * - 同步规则先跑、异步规则后跑；批量校验返回全部错误（不短路），
 *   这是 ERP「保存前全表校验」的刚需。
 * - 错误定位到 (rowId, field)，UI 层负责渲染错误标记。
 */

import type { RowData } from '@sheetx/core'

/** 校验错误级别 */
export type ValidationLevel = 'error' | 'warning'

export interface ValidationError {
  rowId: string
  field: string
  level: ValidationLevel
  message: string
  /** 触发校验的值 */
  value?: unknown
}

/** 校验上下文（可拿到整行，支持跨字段联动校验） */
export interface ValidationContext {
  rowId: string
  field: string
  row: RowData | null
}

/**
 * 校验器接口：返回 null 表示通过。
 * 同步或异步（返回 Promise<null>）皆可，引擎统一处理。
 */
export interface FieldValidator {
  validate(value: unknown, ctx: ValidationContext): ValidationError | null | Promise<ValidationError | null>
}

// ---------------------------------------------------------------------------
// 内置规则工厂（返回 FieldValidator，可自由组合）
// ---------------------------------------------------------------------------

export function required(message = '必填项不能为空'): FieldValidator {
  return {
    validate(value) {
      const empty = value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)
      return empty ? { rowId: '', field: '', level: 'error', message, value } : null
    },
  }
}

export interface NumberRangeOptions {
  min?: number
  max?: number
  integer?: boolean
  message?: string
}

export function numberRange(options: NumberRangeOptions = {}): FieldValidator {
  return {
    validate(value) {
      if (value === null || value === undefined || value === '') return null // 空值交给 required
      const num = typeof value === 'number' ? value : Number(value)
      if (Number.isNaN(num)) {
        return { rowId: '', field: '', level: 'error', message: options.message ?? '必须是数字', value }
      }
      if (options.integer && !Number.isInteger(num)) {
        return { rowId: '', field: '', level: 'error', message: options.message ?? '必须是整数', value }
      }
      if (options.min !== undefined && num < options.min) {
        return { rowId: '', field: '', level: 'error', message: options.message ?? `不能小于 ${options.min}`, value }
      }
      if (options.max !== undefined && num > options.max) {
        return { rowId: '', field: '', level: 'error', message: options.message ?? `不能大于 ${options.max}`, value }
      }
      return null
    },
  }
}

export function lengthRange(min: number, max: number, message?: string): FieldValidator {
  return {
    validate(value) {
      // 空值（含空串）跳过——空值校验是 required 的职责，避免双报
      if (value === null || value === undefined || value === '') return null
      const length = String(value).length
      if (length < min || length > max) {
        return { rowId: '', field: '', level: 'error', message: message ?? `长度须在 ${min}~${max} 之间`, value }
      }
      return null
    },
  }
}

export function regex(pattern: RegExp, message = '格式不正确'): FieldValidator {
  return {
    validate(value) {
      if (value === null || value === undefined || value === '') return null
      return pattern.test(String(value)) ? null : { rowId: '', field: '', level: 'error', message, value }
    },
  }
}

export function options(allowed: ReadonlyArray<unknown>, message?: string): FieldValidator {
  return {
    validate(value) {
      if (value === null || value === undefined || value === '') return null
      return allowed.includes(value)
        ? null
        : { rowId: '', field: '', level: 'error', message: message ?? `必须是：${allowed.join(' / ')}`, value }
    },
  }
}

/** 自定义同步规则 */
export function custom(
  fn: (value: unknown, ctx: ValidationContext) => string | null,
  level: ValidationLevel = 'error',
): FieldValidator {
  return {
    validate(value, ctx) {
      const message = fn(value, ctx)
      return message ? { rowId: '', field: '', level, message, value } : null
    },
  }
}

/** 自定义异步规则（远程唯一性等） */
export function customAsync(
  fn: (value: unknown, ctx: ValidationContext) => Promise<string | null>,
  level: ValidationLevel = 'error',
): FieldValidator {
  return {
    async validate(value, ctx) {
      const message = await fn(value, ctx)
      return message ? { rowId: '', field: '', level, message, value } : null
    },
  }
}

// ---------------------------------------------------------------------------
// 校验引擎：字段规则注册 + 单元/批量校验
// ---------------------------------------------------------------------------

export interface ValidationEngineOptions {
  /** 事件总线（可选）：校验失败时派发 PublicEvent.VALIDATION_ERROR */
  eventBus?: { emit(event: string, payload: unknown): void }
  /** 单元格错误消息的统一前缀模板 */
  defaultMessage?: string
}

export class ValidationEngine {
  private fieldRules = new Map<string, FieldValidator[]>()

  constructor(private readonly options: ValidationEngineOptions = {}) {}

  /** 注册某字段的规则链（按注册顺序执行） */
  registerField(field: string, validators: FieldValidator | ReadonlyArray<FieldValidator>): void {
    const list = Array.isArray(validators) ? [...validators] : [validators]
    const existing = this.fieldRules.get(field) ?? []
    this.fieldRules.set(field, [...existing, ...list])
  }

  unregisterField(field: string): void {
    this.fieldRules.delete(field)
  }

  getRegisteredFields(): string[] {
    return [...this.fieldRules.keys()]
  }

  /** 单值校验（编辑器提交前调用，同步语义）。异步规则的 Promise 结果在此被跳过——用 validateRow/validateRows 聚合 */
  validateValue(field: string, value: unknown, ctx?: { rowId?: string; row?: RowData | null }): ValidationError[] {
    const rules = this.fieldRules.get(field)
    if (!rules) return []
    const errors: ValidationError[] = []
    const context: ValidationContext = { rowId: ctx?.rowId ?? '', field, row: ctx?.row ?? null }
    for (const rule of rules) {
      const result = rule.validate(value, context)
      if (result instanceof Promise) continue
      if (result) errors.push(fillError(result, context))
    }
    return errors
  }

  /** 单行校验（同步规则 + 异步规则，返回 Promise 聚合） */
  async validateRow(row: RowData): Promise<ValidationError[]> {
    const results: ValidationError[] = []
    for (const field of this.fieldRules.keys()) {
      const errors = this.validateValue(field, row.data[field], { rowId: row.id, row })
      results.push(...errors)
    }
    // 异步规则
    const asyncChecks: Array<Promise<void>> = []
    for (const field of this.fieldRules.keys()) {
      const rules = this.fieldRules.get(field) ?? []
      const context: ValidationContext = { rowId: row.id, field, row }
      for (const rule of rules) {
        const outcome = rule.validate(row.data[field], context)
        if (outcome instanceof Promise) {
          asyncChecks.push(
            outcome.then((result) => {
              if (result) results.push(fillError(result, context))
            }),
          )
        }
      }
    }
    await Promise.all(asyncChecks)
    return results
  }

  /**
   * 批量校验：返回全部错误（不短路），错误按 (row, field) 去重。
   * 这正是「保存前全表校验」的语义。
   */
  async validateRows(rows: ReadonlyArray<RowData>): Promise<ValidationError[]> {
    const all = await Promise.all(rows.map((row) => this.validateRow(row)))
    const merged: ValidationError[] = []
    const seen = new Set<string>()
    for (const list of all) {
      for (const error of list) {
        const key = `${error.rowId}|${error.field}|${error.message}`
        if (!seen.has(key)) {
          seen.add(key)
          merged.push(error)
        }
      }
    }
    if (merged.length > 0 && this.options.eventBus) {
      this.options.eventBus.emit('validation-error', { errors: merged })
    }
    return merged
  }
}

function fillError(error: ValidationError, ctx: ValidationContext): ValidationError {
  // 规则工厂不知道 rowId/field（在值层面工作），由引擎在收集时补齐定位信息
  return { ...error, rowId: error.rowId || ctx.rowId, field: error.field || ctx.field }
}
