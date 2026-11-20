/**
 * @sheetx/core - 多视图与视图管理（M4「融入现代企业业务系统」）
 *
 * 同一份数据、多种呈现：表格 / 卡片 / 看板 / 分组。
 * 本模块只管「视图配置」这一层纯数据，不关心渲染：
 * - 视图定义（类型 / 字段可见性与顺序 / 排序 / 分组字段 / 看板列字段）；
 * - 个人视图持久化（JSON 可序列化，宿主存 localStorage/服务器）；
 * - 分组聚合（按字段把记录分桶并统计），供分组视图与看板视图共用。
 *
 * 零运行时依赖：记录是普通对象，节点环境与浏览器均可运行。
 */

export type ViewType = 'table' | 'card' | 'kanban' | 'group'

export interface FieldConfig {
  field: string
  /** 显示名 */
  title?: string
  visible?: boolean
  /** 显示顺序（升序），缺省按 fields 数组顺序 */
  order?: number
  width?: number
}

export interface ViewSort {
  field: string
  dir: 'asc' | 'desc'
}

export interface ViewDefinition {
  id: string
  name: string
  type: ViewType
  fields: FieldConfig[]
  sort?: ViewSort[]
  /** 分组视图：分组字段 */
  groupBy?: string
  /** 看板视图：作为列（泳道）的字段 */
  boardBy?: string
  /** 卡片视图：卡片大小 */
  cardSize?: 'small' | 'medium' | 'large'
  /** 个人视图标记（用于 UI 图标） */
  personal?: boolean
  createdAt?: string
  /** 快照过滤配置（可选，与 data-adapter 的 FilterGroup 同构但此处不解释） */
  filter?: unknown
}

export interface GroupBucket<T> {
  key: string
  label: string
  rows: T[]
  /** 分组汇总值（数值字段求和，缺省聚合金额类字段） */
  total: number
}

function compareValues(a: unknown, b: unknown): number {
  if (Object.is(a, b)) return 0
  if (a === null || a === undefined || a === '') return 1
  if (b === null || b === undefined || b === '') return -1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), 'zh-CN', { numeric: true })
}

/** 应用视图的字段可见性与排序配置（返回新的行数组与字段列表，不改原始数据） */
export function applyView<T extends Record<string, unknown>>(
  rows: ReadonlyArray<T>,
  view: ViewDefinition,
): { rows: T[]; fields: FieldConfig[] } {
  const fields = [...view.fields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const visible = fields.filter((field) => field.visible !== false).map((field) => field.field)
  let result = [...rows]
  if (view.sort && view.sort.length > 0) {
    result.sort((a, b) => {
      for (const sort of view.sort!) {
        const delta = compareValues(a[sort.field], b[sort.field])
        if (delta !== 0) return sort.dir === 'desc' ? -delta : delta
      }
      return 0
    })
  }
  return { rows: result, fields: visible.length > 0 ? fields.filter((field) => field.visible !== false) : fields }
}

/** 按字段分组并统计（用于分组视图与看板视图） */
export function groupRows<T extends Record<string, unknown>>(
  rows: ReadonlyArray<T>,
  field: string,
  options: { totalField?: string; labelOf?: (key: string) => string } = {},
): GroupBucket<T>[] {
  const buckets = new Map<string, T[]>()
  for (const row of rows) {
    const raw = row[field]
    const key = raw === null || raw === undefined || raw === '' ? '未分组' : String(raw)
    const list = buckets.get(key) ?? []
    list.push(row)
    buckets.set(key, list)
  }
  const result: GroupBucket<T>[] = []
  for (const [key, list] of buckets) {
    let total = 0
    for (const row of list) {
      const value = options.totalField ? row[options.totalField] : undefined
      const numeric = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN
      if (Number.isFinite(numeric)) total += numeric
    }
    result.push({
      key,
      label: options.labelOf?.(key) ?? key,
      rows: list,
      total: Math.round(total * 100) / 100,
    })
  }
  return result
}

/** 视图管理器：创建/切换/持久化视图（纯状态管理，不碰 UI） */
export class ViewManager {
  private views: ViewDefinition[] = []
  private currentId: string | null = null
  private counter = 0

  constructor(private readonly limit = 50) {}

  get current(): ViewDefinition | null {
    return this.views.find((view) => view.id === this.currentId) ?? null
  }

  get list(): ReadonlyArray<ViewDefinition> {
    return this.views
  }

  get(id: string): ViewDefinition | undefined {
    return this.views.find((view) => view.id === id)
  }

  add(view: Omit<ViewDefinition, 'id' | 'createdAt'> & { id?: string }): ViewDefinition {
    const definition: ViewDefinition = {
      ...view,
      id: view.id ?? `view_${Date.now().toString(36)}_${(++this.counter).toString(36)}`,
      createdAt: new Date().toISOString(),
    }
    this.views = [...this.views, definition]
    if (this.views.length > this.limit) this.views = this.views.slice(-this.limit)
    this.currentId = definition.id
    return definition
  }

  update(id: string, patch: Partial<ViewDefinition>): boolean {
    const index = this.views.findIndex((view) => view.id === id)
    if (index < 0) return false
    this.views = this.views.map((view) => (view.id === id ? { ...view, ...patch, id: view.id } : view))
    return true
  }

  switchTo(id: string): boolean {
    if (!this.views.some((view) => view.id === id)) return false
    this.currentId = id
    return true
  }

  remove(id: string): boolean {
    this.views = this.views.filter((view) => view.id !== id)
    if (this.currentId === id) this.currentId = this.views[0]?.id ?? null
    return true
  }

  serialize(): string {
    return JSON.stringify({ currentId: this.currentId, views: this.views })
  }

  deserialize(json: string): boolean {
    try {
      const parsed: unknown = JSON.parse(json)
      if (!parsed || typeof parsed !== 'object') return false
      const data = parsed as { currentId?: unknown; views?: unknown }
      if (!Array.isArray(data.views)) return false
      if (!data.views.every((view) =>
        view && typeof view === 'object' && typeof view.id === 'string' &&
        typeof view.name === 'string' && typeof view.type === 'string' &&
        Array.isArray(view.fields)))
        return false
      this.views = data.views as ViewDefinition[]
      this.currentId = typeof data.currentId === 'string' && this.views.some((v) => v.id === data.currentId)
        ? data.currentId
        : this.views[0]?.id ?? null
      return true
    } catch {
      return false
    }
  }
}
