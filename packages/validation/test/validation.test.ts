import { describe, it, expect } from 'vitest'
import {
  ValidationEngine,
  required,
  numberRange,
  lengthRange,
  regex,
  options,
  custom,
  customAsync,
} from '../src/index.js'

describe('内置规则', () => {
  const ctx = { rowId: 'r1', field: 'f', row: null }

  it('required', () => {
    expect(required().validate(null, ctx)).not.toBeNull()
    expect(required().validate('', ctx)).not.toBeNull()
    expect(required().validate([], ctx)).not.toBeNull()
    expect(required().validate(0, ctx)).toBeNull()
    expect(required().validate('x', ctx)).toBeNull()
  })

  it('numberRange', () => {
    expect(numberRange({ min: 1, max: 10 }).validate(5, ctx)).toBeNull()
    expect(numberRange({ min: 1 }).validate(0, ctx)).not.toBeNull()
    expect(numberRange({ max: 10 }).validate(11, ctx)).not.toBeNull()
    expect(numberRange({ integer: true }).validate(1.5, ctx)).not.toBeNull()
    expect(numberRange().validate('abc', ctx)).not.toBeNull()
    expect(numberRange().validate(null, ctx)).toBeNull() // 空值交给 required
  })

  it('lengthRange / regex / options', () => {
    expect(lengthRange(2, 5).validate('abc', ctx)).toBeNull()
    expect(lengthRange(2, 5).validate('a', ctx)).not.toBeNull()
    expect(regex(/^A\d+$/).validate('A123', ctx)).toBeNull()
    expect(regex(/^A\d+$/).validate('B123', ctx)).not.toBeNull()
    expect(options(['红', '蓝']).validate('红', ctx)).toBeNull()
    expect(options(['红', '蓝']).validate('绿', ctx)).not.toBeNull()
  })

  it('custom / customAsync', async () => {
    expect(custom((v) => (v === 'ok' ? null : '不行')).validate('ok', ctx)).toBeNull()
    expect(custom((v) => (v === 'ok' ? null : '不行')).validate('no', ctx)).not.toBeNull()
    const asyncValidator = customAsync(async (v) => (v === 'free' ? null : '已占用'))
    const result = await asyncValidator.validate('taken', ctx)
    expect(result).not.toBeNull()
  })
})

describe('ValidationEngine', () => {
  function makeEngine(): ValidationEngine {
    const engine = new ValidationEngine()
    engine.registerField('name', [required(), lengthRange(2, 10)])
    engine.registerField('qty', [numberRange({ min: 0, max: 999, integer: true })])
    engine.registerField('email', [regex(/^[\w.]+@[\w.]+$/, '邮箱格式不正确')])
    return engine
  }

  it('validateValue 同步校验并补齐定位', () => {
    const engine = makeEngine()
    const errors = engine.validateValue('name', '', { rowId: 'row-9' })
    expect(errors.length).toBe(1)
    expect(errors[0]!.rowId).toBe('row-9')
    expect(errors[0]!.field).toBe('name')
    expect(engine.validateValue('qty', 5).length).toBe(0)
    expect(engine.validateValue('qty', 1.5).length).toBe(1)
  })

  it('validateRow 单行校验', async () => {
    const engine = makeEngine()
    const errors = await engine.validateRow({ id: 'r1', data: { name: 'x', qty: 3, email: 'bad' } })
    expect(errors.length).toBe(2) // name 太短 + email 格式
    expect(errors.map((e) => e.field).sort()).toEqual(['email', 'name'])
  })

  it('validateRows 批量返回全部错误（不短路）', async () => {
    const engine = makeEngine()
    const errors = await engine.validateRows([
      { id: 'a', data: { name: '', qty: -1, email: 'a@b.c' } },
      { id: 'b', data: { name: '好的', qty: 5, email: 'b@c.d' } },
    ])
    expect(errors.length).toBe(2) // a.name 必填 + a.qty 负数
    expect(errors.every((e) => e.rowId === 'a')).toBe(true)
  })

  it('异步规则聚合（远程唯一性）', async () => {
    const engine = new ValidationEngine()
    engine.registerField('code', [
      customAsync(async (value) => (value === 'DUP' ? '编码已存在' : null)),
    ])
    const errors = await engine.validateRows([
      { id: 'a', data: { code: 'DUP' } },
      { id: 'b', data: { code: 'OK' } },
    ])
    expect(errors.length).toBe(1)
    expect(errors[0]!.rowId).toBe('a')
  })

  it('校验失败派发事件', async () => {
    const events: unknown[] = []
    const engine = new ValidationEngine({ eventBus: { emit: (event, payload) => events.push({ event, payload }) } })
    engine.registerField('name', [required()])
    await engine.validateRows([{ id: 'a', data: { name: '' } }])
    expect(events.length).toBe(1)
  })
})
