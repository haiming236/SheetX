import { describe, it, expect } from 'vitest'
import { deriveFillSeries, orderSourceToward } from '../src/fill-series.js'
import { dateToSerial } from '@sheetx/formula'

describe('E5 · 填充序列推导', () => {
  it('数字等差（任务书用例：1,3 → 5,7,9）', () => {
    expect(deriveFillSeries([1, 3], 3)).toEqual([5, 7, 9])
    expect(deriveFillSeries([2, 4, 6], 2)).toEqual([8, 10])
  })

  it('单值源复制（Excel 默认）', () => {
    expect(deriveFillSeries([42], 3)).toEqual([42, 42, 42])
    expect(deriveFillSeries(['文本'], 2)).toEqual(['文本', '文本'])
  })

  it('日期日序列（±1 天）', () => {
    const d1 = dateToSerial(new Date(Date.UTC(2026, 0, 30)))
    const d2 = dateToSerial(new Date(Date.UTC(2026, 0, 31)))
    expect(deriveFillSeries([d1, d2], 2)).toEqual([
      dateToSerial(new Date(Date.UTC(2026, 1, 1))),
      dateToSerial(new Date(Date.UTC(2026, 1, 2))),
    ])
  })

  it('日期周序列（±7 天）', () => {
    const d1 = dateToSerial(new Date(Date.UTC(2026, 0, 5)))
    const d2 = dateToSerial(new Date(Date.UTC(2026, 0, 12)))
    const out = deriveFillSeries([d1, d2], 2)
    expect(out[0]).toBe(dateToSerial(new Date(Date.UTC(2026, 0, 19))))
    expect(out[1]).toBe(dateToSerial(new Date(Date.UTC(2026, 0, 26))))
  })

  it('月序列 + 月末钳制（任务书用例：01-31 下拉 → 02-28）', () => {
    const jan31 = dateToSerial(new Date(Date.UTC(2026, 0, 31)))
    const feb28 = dateToSerial(new Date(Date.UTC(2026, 1, 28)))
    const out = deriveFillSeries([jan31, feb28], 3)
    expect(out[0]).toBe(dateToSerial(new Date(Date.UTC(2026, 2, 31)))) // 03-31
    expect(out[1]).toBe(dateToSerial(new Date(Date.UTC(2026, 3, 30)))) // 04-30 钳制
    expect(out[2]).toBe(dateToSerial(new Date(Date.UTC(2026, 4, 31)))) // 05-31
  })

  it('ISO 字符串日期保持字符串输出', () => {
    const out = deriveFillSeries(['2026-01-30', '2026-01-31'], 2)
    expect(out).toEqual(['2026-02-01', '2026-02-02'])
  })

  it('中文星期循环（任务书用例：周一 → 周二…周日循环）', () => {
    expect(deriveFillSeries(['周一'], 9)).toEqual([
      '周二', '周三', '周四', '周五', '周六', '周日', '周一', '周二', '周三',
    ])
    expect(deriveFillSeries(['周六', '周日'], 2)).toEqual(['周一', '周二'])
  })

  it('中文月份循环', () => {
    expect(deriveFillSeries(['十一月', '十二月'], 2)).toEqual(['一月', '二月'])
  })

  it('混合类型退回平铺', () => {
    expect(deriveFillSeries(['文本', 42], 4)).toEqual(['文本', 42, '文本', 42])
  })

  it('含空值源跳过空值分类', () => {
    expect(deriveFillSeries([1, null, 3], 2)).toEqual([5, 7])
  })

  it('orderSourceToward 方向排序', () => {
    expect(orderSourceToward([1, 3], { start: 0, end: 1 }, 3)).toEqual({ source: [1, 3], sign: 1 })
    expect(orderSourceToward([1, 3], { start: 0, end: 1 }, -2)?.source).toEqual([3, 1])
    expect(orderSourceToward([1], { start: 0, end: 0 }, 0)).toBeNull() // 拖动量不足
  })
})
