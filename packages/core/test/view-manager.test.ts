/** 多视图管理：字段配置、排序、分组聚合、视图持久化 */
import { describe, it, expect } from 'vitest'
import { applyView, groupRows, ViewManager, type ViewDefinition } from '../src/view-manager.js'

interface Row extends Record<string, unknown> {
  id: string
  region: string
  product: string
  amount: number
  status: string
}

const rows: Row[] = [
  { id: 'r1', region: '华东', product: '笔记本电脑', amount: 128000, status: '已完成' },
  { id: 'r2', region: '华南', product: '平板电脑', amount: 95000, status: '进行中' },
  { id: 'r3', region: '华东', product: '智能手机', amount: 156000, status: '已完成' },
  { id: 'r4', region: '华北', product: '显示器', amount: 72000, status: '未开始' },
  { id: 'r5', region: '华南', product: '笔记本电脑', amount: 118000, status: '已完成' },
]

const table: ViewDefinition = {
  id: 'v1', name: '表格视图', type: 'table',
  fields: [
    { field: 'region', title: '地区', visible: true, order: 0 },
    { field: 'product', title: '产品', visible: true, order: 1 },
    { field: 'amount', title: '销售额', visible: true, order: 2 },
    { field: 'id', visible: false, order: 3 },
  ],
  sort: [{ field: 'amount', dir: 'desc' }],
}

describe('applyView · 字段与排序配置', () => {
  it('隐藏字段不出现在 fields，但保留原始行数据', () => {
    const result = applyView(rows, table)
    expect(result.fields.map((field) => field.field)).toEqual(['region', 'product', 'amount'])
    expect(result.rows[0]!.id).toBe('r3') // 排序生效
    expect(rows[0]!.id).toBe('r1') // 原数组未改
  })

  it('按 order 排序字段而非声明顺序', () => {
    const view: ViewDefinition = {
      ...table,
      fields: [
        { field: 'amount', order: 2, visible: true },
        { field: 'region', order: 0, visible: true },
        { field: 'product', order: 1, visible: true },
      ],
      sort: [],
    }
    expect(applyView(rows, view).fields.map((field) => field.field)).toEqual(['region', 'product', 'amount'])
  })

  it('没有可见字段时保留全部字段（避免空视图）', () => {
    const view: ViewDefinition = { ...table, fields: [{ field: 'id', visible: false }], sort: [] }
    expect(applyView(rows, view).fields).toHaveLength(1)
  })

  it('多字段排序按优先级，空值恒后', () => {
    const view: ViewDefinition = {
      ...table,
      sort: [{ field: 'region', dir: 'asc' }, { field: 'amount', dir: 'desc' }],
    }
    expect(applyView(rows, view).rows.map((row) => row.id)).toEqual(['r4', 'r3', 'r1', 'r5', 'r2']) // 中文按 localeCompare 拼音序
  })
})

describe('groupRows · 分组与看板桶', () => {
  it('按字段分桶并按金额汇总', () => {
    const groups = groupRows(rows, 'region', { totalField: 'amount' })
    expect(groups.map((group) => group.key)).toEqual(['华东', '华南', '华北'])
    expect(groups[0]).toMatchObject({ key: '华东', total: 284000 })
    expect(groups[0]!.rows).toHaveLength(2)
  })

  it('自定义标签与缺失值归入未分组', () => {
    const withMissing: Row[] = [...rows, { id: 'r6', region: '', product: '手表', amount: 10, status: '已完成' }]
    const groups = groupRows(withMissing, 'region', {
      totalField: 'amount',
      labelOf: (key) => `区域 · ${key}`,
    })
    expect(groups.find((group) => group.key === '未分组')?.label).toBe('区域 · 未分组')
  })

  it('看板按状态分桶（列 = 泳道）', () => {
    const groups = groupRows(rows, 'status', { totalField: 'amount' })
    expect(groups.map((group) => group.key)).toEqual(['已完成', '进行中', '未开始'])
    expect(groups[0]!.rows).toHaveLength(3)
  })
})

describe('ViewManager · 个人视图管理', () => {
  it('新增/切换/更新/删除视图', () => {
    const manager = new ViewManager()
    const a = manager.add({ name: '表格', type: 'table', fields: [{ field: 'region' }] })
    const b = manager.add({ name: '看板', type: 'kanban', boardBy: 'status', fields: [{ field: 'product' }] })
    expect(manager.current?.id).toBe(b.id)
    expect(manager.switchTo(a.id)).toBe(true)
    expect(manager.current?.name).toBe('表格')
    expect(manager.update(a.id, { name: '表格2' })).toBe(true)
    expect(manager.get(a.id)?.name).toBe('表格2')
    expect(manager.remove(b.id)).toBe(true)
    expect(manager.list).toHaveLength(1)
  })

  it('limit 限制视图数量（超出淘汰最早）', () => {
    const manager = new ViewManager(2)
    for (let i = 0; i < 5; i++) manager.add({ name: `v${i}`, type: 'table', fields: [] })
    expect(manager.list).toHaveLength(2)
    expect(manager.list.map((view) => view.name)).toEqual(['v3', 'v4'])
  })

  it('序列化往返：当前视图与配置保持', () => {
    const manager = new ViewManager()
    manager.add({ name: '卡片', type: 'card', cardSize: 'large', fields: [{ field: 'product', visible: true }] })
    const json = manager.serialize()
    const restored = new ViewManager()
    expect(restored.deserialize(json)).toBe(true)
    expect(restored.current?.type).toBe('card')
    expect(restored.current?.cardSize).toBe('large')
  })

  it('非法 JSON 返回 false 且不破坏现有视图', () => {
    const manager = new ViewManager()
    manager.add({ name: '保留', type: 'table', fields: [] })
    expect(manager.deserialize('{}')).toBe(false)
    expect(manager.deserialize('{"views":[{"id":"x"}]}')).toBe(false)
    expect(manager.list).toHaveLength(1)
  })
})
