/** 条件格式纯逻辑：类型契约 + 求值 + 颜色插值（零 DOM 依赖） */
import { describe, it, expect } from 'vitest'
import {
  evaluateConditionalFormat,
  isCellInRange,
  lerpColor,
  type ConditionalRule,
} from '../src/conditional-format.js'

const range = { start: { row: 0, col: 0 }, end: { row: 2, col: 2 } }
const red = { background: '#fdeeee', color: '#b33636', bold: true }

describe('条件格式求值', () => {
  it('范围判定（含反向选区）', () => {
    expect(isCellInRange(1, 1, range)).toBe(true)
    expect(isCellInRange(3, 0, range)).toBe(false)
    expect(isCellInRange(1, 1, { start: { row: 2, col: 2 }, end: { row: 0, col: 0 } })).toBe(true)
  })

  it('cellIs：数字比较先转数值，字符串比较忽略大小写', () => {
    const rules: ConditionalRule[] = [
      { id: 'r1', type: 'cellIs', range, operator: '>', value: 90, style: red },
    ]
    expect(evaluateConditionalFormat(95, 0, 0, rules)).toEqual(red)
    expect(evaluateConditionalFormat('85', 0, 0, rules)).toBe(null)
    expect(evaluateConditionalFormat('甲', 0, 0, [
      { id: 'r2', type: 'cellIs', range, operator: '=', value: '甲', style: red },
    ])).toEqual(red)
  })

  it('containsText：子串匹配', () => {
    const rules: ConditionalRule[] = [
      { id: 'r3', type: 'containsText', range, text: '预警', style: { background: '#fff3cd' } },
    ]
    expect(evaluateConditionalFormat('库存预警', 1, 0, rules)).toEqual({ background: '#fff3cd' })
    expect(evaluateConditionalFormat('正常', 1, 1, rules)).toBe(null)
  })

  it('dataBar：按边界换算 0..1 比例', () => {
    const rules: ConditionalRule[] = [
      { id: 'r4', type: 'dataBar', range, min: 0, max: 100, color: '#3b82f6' },
    ]
    expect(evaluateConditionalFormat(50, 0, 0, rules)?.dataBarRatio).toBe(0.5)
    expect(evaluateConditionalFormat(150, 0, 0, rules)?.dataBarRatio).toBe(1)
    expect(evaluateConditionalFormat(0, 0, 0, rules)?.dataBarRatio).toBe(0)
    // 规则未给 min/max 时用宿主传入的包络
    const auto: ConditionalRule[] = [{ id: 'r5', type: 'dataBar', range, color: '#22c55e' }]
    expect(evaluateConditionalFormat(15, 0, 0, auto, { min: 10, max: 20 })?.dataBarRatio).toBe(0.5)
  })

  it('colorScale：双色 / 三色插值', () => {
    const two: ConditionalRule[] = [
      { id: 'r6', type: 'colorScale', range, min: 0, max: 100, minColor: '#ff0000', maxColor: '#00ff00' },
    ]
    expect(evaluateConditionalFormat(50, 0, 0, two)?.scaleColor).toMatch(/^#[0-9a-f]{6}$/i)
    const three: ConditionalRule[] = [
      { id: 'r7', type: 'colorScale', range, min: 0, max: 100, minColor: '#ff0000', midColor: '#ffff00', maxColor: '#00ff00' },
    ]
    expect(evaluateConditionalFormat(25, 0, 0, three)?.scaleColor).toBe('#ff8000')
    expect(evaluateConditionalFormat(75, 0, 0, three)?.scaleColor).toBe('#80ff00')
  })

  it('优先级：按规则顺序首条命中生效', () => {
    const rules: ConditionalRule[] = [
      { id: 'a', type: 'cellIs', range, operator: '>', value: 10, style: { background: 'first' } },
      { id: 'b', type: 'cellIs', range, operator: '>', value: 5, style: { background: 'second' } },
    ]
    expect(evaluateConditionalFormat(20, 0, 0, rules)?.background).toBe('first')
    expect(evaluateConditionalFormat(7, 0, 0, rules)?.background).toBe('second')
  })

  it('lerpColor：3 位十六进制与钳制', () => {
    expect(lerpColor('#000', '#fff', 0.5)).toBe('#808080')
    expect(lerpColor('#f00', '#0f0', 2)).toBe('#00ff00')
  })
})
