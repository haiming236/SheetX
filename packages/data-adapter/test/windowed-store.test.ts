/** 窗口化数据存储：百万行「仅持有可见数据」、LRU、去重、竞态 */
import { describe, it, expect } from 'vitest'
import { WindowedDataStore } from '../src/windowed-store.js'
import type { IDataAdapter, DataQuery, PageResult } from '../src/index.js'
import { normalizeRows } from '@sheetx/data'

function makeAdapter(
  count: number,
  options: { delay?: number; track?: number[] } = {},
): IDataAdapter {
  const rows = normalizeRows(
    Array.from({ length: count }, (_, i) => ({ id: `r${i}`, no: i, name: `商品${i}` })),
  )
  return {
    kind: 'local',
    async load(query: DataQuery): Promise<PageResult> {
      options.track?.push(query.page ?? -1)
      if (options.delay) await new Promise<void>((resolve) => setTimeout(resolve, options.delay))
      const page = query.page ?? 1
      const size = query.pageSize ?? 200
      return {
        rows: rows.slice((page - 1) * size, (page - 1) * size + size),
        total: rows.length,
      }
    },
  }
}

describe('WindowedDataStore · 窗口加载', () => {
  it('按窗口取行：页内偏移正确、只加载覆盖到的页', async () => {
    const tracked: number[] = []
    const store = new WindowedDataStore(makeAdapter(10_000, { track: tracked }), {
      pageSize: 100,
      prefetch: 0,
    })
    const result = await store.slice(250, 50)
    // 行 250~299 全部落在第 3 页（索引 200~299），只加载 1 页
    expect(result.loads).toBe(1)
    expect(tracked).toEqual([3])
    expect(result.rows).toHaveLength(50)
    expect(result.rows[0]!.data.no).toBe(250)
    expect(result.rows[49]!.data.no).toBe(299)
    expect(result.total).toBe(10_000)
  })

  it('跨页窗口按序拼接，缓存命中不再 load', async () => {
    const tracked: number[] = []
    const store = new WindowedDataStore(makeAdapter(10_000, { track: tracked }), {
      pageSize: 100,
      prefetch: 0,
    })
    const first = await store.slice(180, 40) // 第 2 页尾 20 行 + 第 3 页头 20 行
    expect(first.loads).toBe(2)
    expect(first.rows.map((row) => row.data.no)).toEqual(
      Array.from({ length: 40 }, (_, i) => 180 + i),
    )
    const second = await store.slice(190, 20)
    expect(second.loads).toBe(0)
    expect(store.hits).toBeGreaterThan(0)
    expect(tracked).toEqual([2, 3])
  })

  it('预取相邻页，滚动时窗口命中缓存', async () => {
    const tracked: number[] = []
    const store = new WindowedDataStore(makeAdapter(10_000, { track: tracked }), {
      pageSize: 100,
      prefetch: 1,
    })
    await store.slice(200, 50) // 第 3 页 + 预取第 2、4 页
    expect(tracked.sort()).toEqual([2, 3, 4])
    const trackedBefore = tracked.length
    const next = await store.slice(300, 50) // 目标第 4 页已在缓存，只新增预取第 5 页
    expect(tracked.slice(trackedBefore)).toEqual([5]) // 第 4 页未重复请求
    expect(next.loads).toBe(1)
  })

  it('并发请求去重：同一页只发出一次 load', async () => {
    let calls = 0
    const adapter: IDataAdapter = {
      kind: 'local',
      async load(query) {
        calls++
        await new Promise<void>((resolve) => setTimeout(resolve, 10))
        const size = query.pageSize ?? 100
        return {
          rows: normalizeRows(
            Array.from({ length: size }, (_, i) => ({ id: `p${query.page}-${i}`, value: query.page })),
          ),
          total: 1000,
        }
      },
    }
    const store = new WindowedDataStore(adapter, { pageSize: 100, prefetch: 0 })
    const results = await Promise.all([store.getRow(0), store.getRow(1), store.getRow(2)])
    expect(calls).toBe(1)
    expect(results.map((row) => row!.data.value)).toEqual([1, 1, 1])
  })

  it('LRU 缓存限制内存：访问 30 页后只保留 maxPages 页', async () => {
    const store = new WindowedDataStore(makeAdapter(10_000), {
      pageSize: 100,
      maxPages: 5,
      prefetch: 0,
    })
    const visited: number[] = []
    for (let page = 1; page <= 30; page++) {
      const result = await store.slice((page - 1) * 100 + 10, 1)
      visited.push(result.rows[0]!.data.no as number)
    }
    expect(visited).toEqual(Array.from({ length: 30 }, (_, i) => i * 100 + 10))
    expect(store.cachedPageCount).toBe(5)
    // 最近访问的页 26~30 仍在
    expect((await store.getRow(2500))!.data.no).toBe(2500)
    // 最早页已被淘汰 → 重新加载
    const before = store.loads
    await store.getRow(10)
    expect(store.loads).toBe(before + 1)
  })

  it('invalidate 清空缓存与总数，重新加载', async () => {
    const store = new WindowedDataStore(makeAdapter(10_000), { pageSize: 100, prefetch: 0 })
    await store.slice(0, 10)
    expect(store.total).toBe(10_000)
    store.invalidate()
    expect(store.total).toBe(-1)
    expect(store.cachedPageCount).toBe(0)
    expect((await store.getRow(0))!.data.no).toBe(0)
  })
})

describe('WindowedDataStore · 竞态保护', () => {
  it('慢请求返回时版本号已过期 → 不覆盖新页数据', async () => {
    let callIndex = 0
    const adapter: IDataAdapter = {
      kind: 'local',
      async load(query) {
        const index = callIndex++
        await new Promise<void>((resolve) => setTimeout(resolve, index === 0 ? 40 : 5))
        return {
          rows: normalizeRows([{ id: `p${query.page}`, page: index === 0 ? 1 : 2 }]),
          total: 1000,
        }
      },
    }
    const store = new WindowedDataStore(adapter, { pageSize: 100, prefetch: 0 })
    // 先发慢请求（不等待），再发快请求覆盖同一页版本号
    // 同一页慢请求先发出 → invalidate 提升版本号 → 再对同页发快请求
    const slow = store.loadPage(1)
    store.invalidate()
    const fast = store.loadPage(1)
    await Promise.all([slow, fast])
    // 快请求写入缓存；慢请求返回时版本号已过期，不能覆盖
    const row = await store.getRow(0)
    expect(row!.data.page).toBe(2)
  })
})

describe('WindowedDataStore · 百万行指标', () => {
  it('100 万行仅驻留可见窗口，内存与总行数无关', async () => {
    const store = new WindowedDataStore(makeAdapter(1_000_000), {
      pageSize: 200,
      maxPages: 8,
      prefetch: 1,
    })
    await store.slice(500_000, 60)
    expect(store.total).toBe(1_000_000)
    expect(store.cachedPageCount).toBeLessThanOrEqual(8)
    // 3 页（当前+前后各 1）× 200 行 = 600 行驻留，而非 100 万行
    expect(store.residentRowCount).toBeLessThanOrEqual(200 * 8)
    const row = await store.getRow(500_000)
    expect(row!.data.no).toBe(500_000)
  })
})
