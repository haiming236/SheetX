/**
 * @sheetx/data-adapter - 窗口化数据存储（100 万行「仅持有可见数据」）
 *
 * 方案目标：100 万行 × 20 列走「远程/虚拟化访问」——浏览器不持有全量数据。
 * 本类把 IDataAdapter 的分页契约包装成按窗口懒加载的存储：
 * - 只缓存最近访问的页（LRU，默认 12 页），内存占用与总行数无关；
 * - 同一页的并发请求去重（ identical in-flight Promise 复用）；
 * - 过期请求不覆盖新结果（滚动时快速翻页的竞态保护）；
 * - 相邻页预取（默认前后各 1 页），滚动时无白屏。
 *
 * 纯逻辑、零依赖：不知道 fetch/axios 的存在，宿主把 IDataAdapter 换成任意实现即可。
 */

import type { RowData } from '@sheetx/core'
import type { IDataAdapter, DataQuery, PageResult } from './index.js'

export interface WindowedStoreOptions {
  /** 每页行数，默认 200 */
  pageSize?: number
  /** 最多缓存页数，默认 12 */
  maxPages?: number
  /** 预取相邻页数（前后各 N），默认 1；0 关闭 */
  prefetch?: number
  /** 附加查询（排序/筛选/关键字），分页由本类接管 */
  query?: Omit<DataQuery, 'page' | 'pageSize'>
}

export interface WindowSlice {
  /** 请求区间的行（可能跨页，已按行序拼接） */
  rows: RowData[]
  /** 数据总行数（-1 表示未知） */
  total: number
  /** 本次实际触发的 load 次数（用于指标观测；0 = 全命中缓存） */
  loads: number
}

interface CachedPage {
  rows: RowData[]
  /** 单调递增的版本号；用于请求返回时的竞态判定 */
  version: number
}

/**
 * 窗口化行存储。api.load 必须按 DataQuery.page/pageSize 返回对应页（LocalAdapter/RemoteAdapter 均可）。
 */
export class WindowedDataStore {
  readonly pageSize: number
  readonly maxPages: number
  readonly prefetch: number
  private readonly adapter: IDataAdapter
  private readonly baseQuery: Omit<DataQuery, 'page' | 'pageSize'>
  private readonly cache = new Map<number, CachedPage>()
  private readonly inFlight = new Map<number, Promise<PageResult>>()
  private readonly versions = new Map<number, number>()
  private versionCounter = 0
  private total_ = -1
  /** 累计 load 次数（指标观测） */
  loads = 0
  /** 累计缓存命中次数 */
  hits = 0

  constructor(adapter: IDataAdapter, options: WindowedStoreOptions = {}) {
    this.adapter = adapter
    this.pageSize = Math.max(1, options.pageSize ?? 200)
    this.maxPages = Math.max(1, options.maxPages ?? 12)
    this.prefetch = Math.max(0, options.prefetch ?? 1)
    this.baseQuery = options.query ?? {}
  }

  /** 已知总行数（首次 load 前为 -1） */
  get total(): number {
    return this.total_
  }

  /** 当前缓存页数（内存占用指标） */
  get cachedPageCount(): number {
    return this.cache.size
  }

  /** 清空缓存（数据变更/查询条件变化后调用） */
  invalidate(): void {
    this.cache.clear()
    this.inFlight.clear()
    this.versions.clear()
    this.total_ = -1
  }

  private pageOf(rowIndex: number): number {
    return Math.floor(Math.max(0, rowIndex) / this.pageSize) + 1
  }

  private touch(page: number): void {
    // Map 保持插入序：删后重插 = 提升到队尾（LRU 最近使用）
    const cached = this.cache.get(page)
    if (!cached) return
    this.cache.delete(page)
    this.cache.set(page, cached)
    while (this.cache.size > this.maxPages) {
      const oldest = this.cache.keys().next().value
      if (oldest === undefined) break
      this.cache.delete(oldest)
    }
  }

  /** 加载单页（去重 + 竞态保护）；返回 null 表示越界或加载失败 */
  private async loadPageInternal(page: number): Promise<CachedPage | null> {
    if (page < 1) return null
    if (this.total_ >= 0 && (page - 1) * this.pageSize >= this.total_) return null
    const cached = this.cache.get(page)
    if (cached) {
      this.hits++
      this.touch(page)
      return cached
    }
    let request = this.inFlight.get(page)
    // 只有真正发起请求时才提升版本号：复用 in-flight 的并发调用若也改版本，
    // 会让请求返回时所有调用方都判定「过期」，并发结果被整体丢弃。
    let version = this.versions.get(page) ?? 0
    if (!request) {
      version = ++this.versionCounter
      this.versions.set(page, version)
      request = this.adapter.load({ ...this.baseQuery, page, pageSize: this.pageSize })
      this.inFlight.set(page, request)
      this.loads++
    }
    try {
      const result = await request
      if (this.total_ < 0) this.total_ = result.total
      // 竞态保护：期间有更新的请求发出 → 丢弃旧结果
      if (this.versions.get(page) !== version) return this.cache.get(page) ?? null
      const entry: CachedPage = { rows: result.rows, version }
      this.cache.set(page, entry)
      this.touch(page)
      return entry
    } finally {
      this.inFlight.delete(page)
    }
  }

  /**
   * 取 [startRow, startRow + count) 区间的行。
   * 仅加载覆盖到的页（+预取），不触碰全量数据。
   */
  async slice(startRow: number, count: number): Promise<WindowSlice> {
    const from = Math.max(0, Math.floor(startRow))
    const size = Math.max(0, Math.floor(count))
    if (size === 0) return { rows: [], total: this.total_, loads: 0 }

    const loadsBefore = this.loads
    const firstPage = this.pageOf(from)
    const lastPage = this.pageOf(from + size - 1)
    const pages = new Set<number>()
    for (let page = firstPage; page <= lastPage; page++) pages.add(page)
    if (this.prefetch > 0) {
      for (let page = firstPage - this.prefetch; page < firstPage; page++) if (page >= 1) pages.add(page)
      for (let page = lastPage + 1; page <= lastPage + this.prefetch; page++) pages.add(page)
    }

    await Promise.all([...pages].map((page) => this.loadPageInternal(page)))

    const rows: RowData[] = []
    for (let row = from; row < from + size; row++) {
      const page = this.pageOf(row)
      const cached = this.cache.get(page)
      if (!cached) break // 越界/加载失败：截断而不是抛错（滚动时容忍）
      const offset = row % this.pageSize
      const data = cached.rows[offset]
      if (!data) break
      rows.push(data)
    }
    return {
      rows,
      total: this.total_,
      loads: this.loads - loadsBefore,
    }
  }

  /** 加载指定页（1 起始）；供按页定位与竞态场景使用 */
  async loadPage(page: number): Promise<RowData[]> {
    const cached = await this.loadPageInternal(page)
    return cached?.rows ?? []
  }

  /** 按绝对行下标取单行（快捷键/定位用） */
  async getRow(rowIndex: number): Promise<RowData | null> {
    const result = await this.slice(rowIndex, 1)
    return result.rows[0] ?? null
  }

  /** 内存中的行总数（远小于 total；用于验证「浏览器不持有全量」） */
  get residentRowCount(): number {
    let count = 0
    for (const page of this.cache.values()) count += page.rows.length
    return count
  }
}
