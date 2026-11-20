import { describe, it, expect } from 'vitest'
import { LocalAdapter, RemoteAdapter } from '../src/index.js'

const records = [
  { id: '1', name: '苹果', category: '水果', price: 5.5, stock: 100 },
  { id: '2', name: '香蕉', category: '水果', price: 3.2, stock: 200 },
  { id: '3', name: '牛奶', category: '饮品', price: 8, stock: 50 },
  { id: '4', name: '可乐', category: '饮品', price: 3, stock: 300 },
]

describe('LocalAdapter', () => {
  const adapter = LocalAdapter.fromRecords(records)

  it('全量加载', async () => {
    const result = await adapter.load({})
    expect(result.total).toBe(4)
    expect(result.rows.length).toBe(4)
    expect(result.rows[0]!.id).toBe('1')
  })

  it('分页', async () => {
    const page1 = await adapter.load({ page: 1, pageSize: 2 })
    expect(page1.rows.map((row) => row.id)).toEqual(['1', '2'])
    const page2 = await adapter.load({ page: 2, pageSize: 2 })
    expect(page2.rows.map((row) => row.id)).toEqual(['3', '4'])
  })

  it('排序（多键）', async () => {
    // 全表按价格降序：牛奶 8 > 苹果 5.5 > 香蕉 3.2 > 可乐 3
    const result = await adapter.load({ sort: [{ field: 'price', dir: 'desc' }] })
    expect(result.rows.map((row) => row.id)).toEqual(['3', '1', '2', '4'])
    // 多键：分类升序（水 < 饮，zh 拼音序），组内价格降序
    const multi = await adapter.load({ sort: [{ field: 'category', dir: 'asc' }, { field: 'price', dir: 'desc' }] })
    expect(multi.rows.map((row) => row.id)).toEqual(['1', '2', '3', '4']) // 水果(5.5,3.2) → 饮品(8,3)
  })

  it('筛选操作符', async () => {
    const contains = await adapter.load({ filter: [{ field: 'name', op: 'contains', value: '果' }] })
    expect(contains.total).toBe(1) // 只有「苹果」含「果」字
    const gte = await adapter.load({ filter: [{ field: 'price', op: 'gte', value: 5 }] })
    expect(gte.rows.map((row) => row.id)).toEqual(['1', '3'])
    const inOp = await adapter.load({ filter: [{ field: 'category', op: 'in', value: ['饮品'] }] })
    expect(inOp.total).toBe(2)
    const notEmpty = await adapter.load({ filter: [{ field: 'category', op: 'notEmpty', value: null }] })
    expect(notEmpty.total).toBe(4)
  })

  it('关键字全局搜索', async () => {
    const result = await adapter.load({ keyword: '牛奶' })
    expect(result.total).toBe(1)
  })

  it('组合：筛选+排序+分页', async () => {
    const result = await adapter.load({
      filter: [{ field: 'category', op: 'eq', value: '水果' }],
      sort: [{ field: 'price', dir: 'asc' }],
      page: 2,
      pageSize: 1,
    })
    expect(result.rows.map((row) => row.id)).toEqual(['1']) // 香蕉 3.2 排第 1 页，苹果 5.5 第 2 页
  })
})

describe('RemoteAdapter（纯回调契约——SheetX 不碰网络）', () => {
  it('load 委托宿主回调', async () => {
    let receivedQuery: unknown = null
    const adapter = new RemoteAdapter({
      load: async (query) => {
        receivedQuery = query
        return { rows: [], total: 0 }
      },
    })
    await adapter.load({ page: 1, pageSize: 10 })
    expect(receivedQuery).toEqual({ page: 1, pageSize: 10 })
  })

  it('未提供 save 回调时保存能力关闭且不抛异常', async () => {
    const adapter = new RemoteAdapter({ load: async () => ({ rows: [], total: 0 }) })
    const result = await adapter.save([])
    expect(result.success).toBe(false)
    expect(result.message).toContain('save')
  })
})
