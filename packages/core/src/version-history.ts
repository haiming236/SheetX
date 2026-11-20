/**
 * @sheetx/core - 版本快照与差异（M4 数据安全的持久化补充）
 *
 * UndoRedoService 的 mutation 双栈解决「高频编辑的内存效率」，
 * 但它是易失的（刷新即丢、深度 100 步）。VersionManager 解决另一半：
 * - 按显式/自动快照保留可持久化版本（可 JSON 序列化）；
 * - 差异对比按「行 id + 字段」计算，只返回变化的单元格（不是整表）；
 * - 恢复时产出「目标版本数据」交给宿主/引擎写入（本类不碰 store）。
 *
 * 零依赖：只消费普通对象记录，不依赖 grid / spreadsheet / data。
 */

export interface VersionSnapshot<T = Record<string, unknown>> {
  id: string
  /** ISO 时间字符串 */
  createdAt: string
  label: string
  /** 记录数组（深拷贝的纯数据） */
  records: T[]
}

export interface VersionCellChange {
  rowId: string
  field: string
  before: unknown
  after: unknown
}

export interface RowChange {
  type: 'added' | 'removed' | 'modified'
  rowId: string
  /** modified 时的字段变化 */
  cells?: VersionCellChange[]
}

export interface VersionDiff {
  fromId: string
  toId: string
  added: string[]
  removed: string[]
  modified: Array<{ rowId: string; cells: VersionCellChange[] }>
  /** 变化单元格总数（指标） */
  totalChanges: number
}

function cloneRecords<T>(records: ReadonlyArray<T>): T[] {
  // 只做结构深拷贝：记录是扁平的数据对象（值cells为原始类型），JSON 足够且可序列化
  return records.map((record) => {
    if (record === null || typeof record !== 'object') return record
    return JSON.parse(JSON.stringify(record)) as T
  })
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/** 版本历史管理（纯逻辑；宿主负责持久化与写入引擎） */
export class VersionManager<T extends Record<string, unknown> = Record<string, unknown>> {
  private snapshots: VersionSnapshot<T>[] = []
  private counter = 0

  constructor(private readonly limit = 50) {}

  get count(): number {
    return this.snapshots.length
  }

  /** 新增快照（深拷贝，宿主后续修改原记录不影响快照） */
  capture(records: ReadonlyArray<T>, label: string, createdAt = new Date().toISOString()): VersionSnapshot<T> {
    const snapshot: VersionSnapshot<T> = {
      id: `v${Date.now().toString(36)}_${(++this.counter).toString(36)}`,
      createdAt,
      label,
      records: cloneRecords(records),
    }
    this.snapshots.unshift(snapshot) // 最新在前
    if (this.snapshots.length > this.limit) this.snapshots.length = this.limit
    return snapshot
  }

  list(): ReadonlyArray<VersionSnapshot<T>> {
    return this.snapshots
  }

  get(id: string): VersionSnapshot<T> | undefined {
    return this.snapshots.find((snapshot) => snapshot.id === id)
  }

  /** 取最新快照 */
  latest(): VersionSnapshot<T> | undefined {
    return this.snapshots[0]
  }

  /** 删除快照（返回是否删除成功） */
  remove(id: string): boolean {
    const index = this.snapshots.findIndex((snapshot) => snapshot.id === id)
    if (index < 0) return false
    this.snapshots.splice(index, 1)
    return true
  }

  clear(): void {
    this.snapshots = []
  }

  /** 导出为 JSON 字符串（宿主可写入 localStorage / 服务器） */
  serialize(): string {
    return JSON.stringify(this.snapshots)
  }

  /** 从 JSON 恢复（结构校验失败时保持现有历史） */
  deserialize(json: string): boolean {
    try {
      const parsed: unknown = JSON.parse(json)
      if (!Array.isArray(parsed)) return false
      const valid = parsed.every((item) =>
        isObject(item) && typeof item.id === 'string' && Array.isArray(item.records))
      if (!valid) return false
      this.snapshots = parsed as VersionSnapshot<T>[]
      return true
    } catch {
      return false
    }
  }

  /** 恢复到指定版本：返回该版本记录的深拷贝（宿主编排写入，不直接改 store） */
  restore(id: string): T[] | null {
    const snapshot = this.get(id)
    return snapshot ? cloneRecords(snapshot.records) : null
  }

  /** 对比两个版本：按 id 匹配行，按字段比较值 */
  diff(fromId: string, toId: string): VersionDiff | null {
    const from = this.get(fromId)
    const to = this.get(toId)
    if (!from || !to) return null

    const fromMap = new Map<string, T>()
    const toMap = new Map<string, T>()
    for (const record of from.records) {
      const id = String(record.id ?? '')
      if (id) fromMap.set(id, record)
    }
    for (const record of to.records) {
      const id = String(record.id ?? '')
      if (id) toMap.set(id, record)
    }

    const added: string[] = []
    const removed: string[] = []
    const modified: Array<{ rowId: string; cells: VersionCellChange[] }> = []
    for (const [id, record] of toMap) {
      if (!fromMap.has(id)) { added.push(id); continue }
      const before = fromMap.get(id)!
      const cells: VersionCellChange[] = []
      const fields = new Set([...Object.keys(before), ...Object.keys(record)])
      for (const field of fields) {
        if (field === 'id') continue
        if (!Object.is(before[field], record[field])) {
          cells.push({ rowId: id, field, before: before[field] ?? null, after: record[field] ?? null })
        }
      }
      if (cells.length > 0) modified.push({ rowId: id, cells })
    }
    for (const id of fromMap.keys()) if (!toMap.has(id)) removed.push(id)

    const totalChanges = added.length + removed.length +
      modified.reduce((sum, item) => sum + item.cells.length, 0)
    return { fromId, toId, added, removed, modified, totalChanges }
  }
}

/** 高频编辑节流：把连续操作合并成一次快照（避免高频编辑产生海量版本） */
export class SnapshotThrottler {
  private timer: ReturnType<typeof setTimeout> | null = null
  private pending: (() => void) | null = null

  constructor(private readonly waitMs = 1500) {}

  /** 每次编辑调用；停止编辑 waitMs 后才真正快照 */
  schedule(action: () => void): void {
    this.pending = action
    if (this.timer !== null) clearTimeout(this.timer)
    this.timer = setTimeout(() => {
      this.timer = null
      const run = this.pending
      this.pending = null
      run?.()
    }, this.waitMs)
  }

  /** 立即执行挂起的快照（页面离开/手动保存时调用，保证不丢最后一次） */
  flush(): void {
    if (this.timer !== null) clearTimeout(this.timer)
    this.timer = null
    const run = this.pending
    this.pending = null
    run?.()
  }

  get hasPending(): boolean {
    return this.pending !== null
  }

  dispose(): void {
    if (this.timer !== null) clearTimeout(this.timer)
    this.timer = null
    this.pending = null
  }
}
