/** 多维筛选：AND/OR 分组、跨字段比较、方案持久化、命中统计 */
import { describe, it, expect } from 'vitest'
import { normalizeRows } from '@sheetx/data'
import {
  evaluateGroup, evaluateFilter, conditionIds, serializeFilters, deserializeFilters,
  type FilterGroup, type FilterCondition, type SavedFilter,
} from '../src/filter-groups.js'

const rows = normalizeRows([
  { id: 'r1', 地区: '华东', 类别: '笔记本电脑', 金额: 128000, 状态: '已完成', 目标: 100000 },
  { id: 'r2', 地区: '华南', 类别: '平板电脑', 金额: 95000, 状态: '进行中', 目标: 90000 },
  { id: 'r3', 地区: '华北', 类别: '智能手机', 金额: 156000, 状态: '已完成', 目标: 120000 },
  { id: 'r4', 地区: '华东', 类别: '显示器', 金额: 72000, 状态: '未开始', 目标: 80000 },
  { id: 'r5', 地区: '华南', 类别: '笔记本电脑', 金额: 118000, 状态: '已完成', 目标: 100000 },
])

const cond = (id: string, field: string, op: FilterCondition['op'], value?: unknown, extra: Partial<FilterCondition> = {}): FilterCondition =>
  ({ id, field, op, value, ...extra })

describe('evaluateGroup · AND/OR 与嵌套', () => {
  it('AND 组：所有条件满足才命中', () => {
    const group: FilterGroup = {
      id: 'g1', logic: 'and',
      conditions: [
        cond('c1', '地区', 'eq', '华东'),
        cond('c2', '金额', 'gte', 100000),
      ],
    }
    const result = evaluateFilter(rows, group)
    expect(result.matched).toBe(1)
    expect(result.matchedIds).toEqual(['r1'])
    expect(result.conditionHits).toEqual({ c1: 2, c2: 3 })
  })

  it('OR 组：任一条件满足即命中', () => {
    const group: FilterGroup = {
      id: 'g1', logic: 'or',
      conditions: [
        cond('c1', '类别', 'eq', '显示器'),
        cond('c2', '状态', 'eq', '进行中'),
      ],
    }
    const result = evaluateFilter(rows, group)
    expect(result.matchedIds).toEqual(['r2', 'r4'])
  })

  it('嵌套组：AND 外层 + OR 内层（设计稿「条件组1 AND 条件组2」）', () => {
    const group: FilterGroup = {
      id: 'root', logic: 'and',
      conditions: [cond('amount', '金额', 'gte', 100000)],
      groups: [{
        id: 'g2', logic: 'or', label: '条件组 2',
        conditions: [
          cond('p1', '类别', 'eq', '笔记本电脑'),
          cond('p2', '类别', 'eq', '智能手机'),
        ],
      }],
    }
    const result = evaluateFilter(rows, group)
    // 金额>=100k: r1,r3,r5；其中 笔记本/智能手机: r1,r3,r5 → 全命中
    expect(result.matchedIds).toEqual(['r1', 'r3', 'r5'])
    expect(conditionIds(group)).toEqual(['amount', 'p1', 'p2'])
  })

  it('禁用条件不参与求值，空组视为不过滤', () => {
    const disabled: FilterGroup = {
      id: 'g', logic: 'and',
      conditions: [
        cond('c1', '地区', 'eq', '华东', { enabled: false }),
      ],
    }
    expect(evaluateFilter(rows, disabled).matched).toBe(5)
    expect(evaluateFilter(rows, { id: 'g', logic: 'or', conditions: [] }).matched).toBe(5)
  })

  it('跨字段比较：金额 >= 目标（valueField 而非常量）', () => {
    const group: FilterGroup = {
      id: 'g', logic: 'and',
      conditions: [cond('cross', '金额', 'gte', undefined, { valueField: '目标' })],
    }
    expect(evaluateFilter(rows, group).matchedIds).toEqual(['r1', 'r2', 'r3', 'r5'])
  })

  it('contains / between / in / notEmpty 等操作符', () => {
    expect(evaluateFilter(rows, { id: 'g', logic: 'and', conditions: [cond('c', '类别', 'contains', '笔记本')] }).matched).toBe(2)
    expect(evaluateFilter(rows, { id: 'g', logic: 'and', conditions: [cond('c', '金额', 'between', 90000, { value2: 120000 })] }).matchedIds).toEqual(['r2', 'r5'])
    expect(evaluateFilter(rows, { id: 'g', logic: 'and', conditions: [cond('c', '地区', 'in', ['华东', '华北'])] }).matched).toBe(3)
    expect(evaluateFilter(rows, { id: 'g', logic: 'and', conditions: [cond('c', '状态', 'notEmpty')] }).matched).toBe(5)
  })
})

describe('evaluateFilter · 统计与内存保护', () => {
  it('命中数/总数/条件贡献度，matchedIds 可截断', () => {
    const big = normalizeRows(Array.from({ length: 1000 }, (_, i) => ({ id: `b${i}`, v: i })))
    const result = evaluateFilter(big, {
      id: 'g', logic: 'and', conditions: [cond('c', 'v', 'gte', 0)],
    }, { maxMatchedIds: 10 })
    expect(result).toMatchObject({ matched: 1000, total: 1000 })
    expect(result.matchedIds).toHaveLength(10)
    expect(result.conditionHits.c).toBe(1000)
  })
})

describe('筛选方案持久化', () => {
  const group: FilterGroup = {
    id: 'g', logic: 'and',
    conditions: [cond('c1', '地区', 'eq', '华东')],
  }
  const saved: SavedFilter[] = [{
    id: 's1', name: '华东大额', group, createdAt: '2025-01-15T10:00:00.000Z',
  }]

  it('序列化/反序列化往返，求值语义保持', () => {
    const restored = deserializeFilters(serializeFilters(saved))
    expect(restored).toHaveLength(1)
    expect(evaluateFilter(rows, restored![0]!.group).matchedIds).toEqual(['r1', 'r4'])
  })

  it('非法 JSON 返回 null，不破坏现有方案', () => {
    expect(deserializeFilters('{}')).toBeNull()
    expect(deserializeFilters('[{"id":"x"}]')).toBeNull()
    expect(deserializeFilters('not json')).toBeNull()
  })
})
