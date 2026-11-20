/**
 * SheetX Playground · 共享业务数据（单一数据源）
 *
 * 此前每个设计稿页面各持一份 mock，切换页面数据互不相干、刷新即丢。
 * 本模块提供跨页面唯一的业务数据：
 * - sales     销售汇总（01 主工作界面）
 * - inventory 库存明细（02 业务网格 / 09 筛选排序）
 * - orders    订单明细（09 筛选排序）
 * - comments  批注（14 批阅）
 * 任何页面的增删改都写回这里并广播，其他页面/首页统计立即同步；
 * 数据持久化到 localStorage（刷新、切页均保留）。
 */
import type { LitElement, ReactiveController } from 'lit'
import { demoRows, type DemoRow } from './mock-data.js'
import { inventoryRows, type InventoryRow } from './grid-data.js'
import { FILTER_ROWS, type FilterRow } from './filter-data.js'
import { INITIAL_COMMENTS, type Comment } from './review-data.js'

export type { DemoRow, InventoryRow, FilterRow, Comment }

export interface StoreSnapshot {
  sales: DemoRow[]
  inventory: InventoryRow[]
  orders: FilterRow[]
  comments: Comment[]
}

const STORE_KEY = 'sx:store'
const VERSION = 2

interface Persisted extends StoreSnapshot {
  __v?: number
}

function seed(): StoreSnapshot {
  return {
    sales: demoRows.map((row) => ({ ...row })),
    inventory: inventoryRows.map((row) => ({ ...row })),
    orders: FILTER_ROWS.map((row) => ({ ...row })),
    comments: INITIAL_COMMENTS.map((comment) => ({ ...comment, replies: comment.replies.map((reply) => ({ ...reply })) })),
  }
}

class DataStore {
  private state: StoreSnapshot = seed()
  private listeners = new Set<() => void>()

  constructor() {
    this.restore()
  }

  /** 订阅数据变化（返回退订函数） */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  snapshot(): Readonly<StoreSnapshot> {
    return this.state
  }

  /** 整体替换若干分区（不可变更新：数组引用一定变，Lit 的引用比较才生效） */
  update(patch: Partial<StoreSnapshot>): void {
    this.state = { ...this.state, ...patch }
    this.persist()
    for (const listener of this.listeners) listener()
  }

  /* ---------------- 销售（01 主工作界面） ---------------- */

  updateSale(no: number, patch: Partial<DemoRow>): void {
    this.update({ sales: this.state.sales.map((row) => (row.no === no ? { ...row, ...patch } : row)) })
  }

  /** 在指定行之前插入一行（右键菜单/工具栏「插入行」） */
  insertSale(atIndex: number, row: DemoRow): void {
    const next = [...this.state.sales]
    next.splice(Math.max(0, Math.min(atIndex, next.length)), 0, row)
    this.update({ sales: next.map((item, index) => ({ ...item, no: index + 1 })) })
  }

  /** 删除指定行（右键菜单「删除行」） */
  removeSale(no: number): void {
    const next = this.state.sales.filter((row) => row.no !== no)
    this.update({ sales: next.map((item, index) => ({ ...item, no: index + 1 })) })
  }

  /** 追加一行（工具栏「新增记录」） */
  addSale(row: DemoRow): void {
    this.update({ sales: [...this.state.sales, { ...row, no: this.state.sales.length + 1 }] })
  }

  replaceSales(rows: DemoRow[]): void {
    this.update({ sales: rows.map((item, index) => ({ ...item, no: index + 1 })) })
  }

  /* ---------------- 库存（02 业务网格 / 09 筛选） ---------------- */

  addInventory(item: InventoryRow): void {
    this.update({ inventory: [item, ...this.state.inventory] })
  }

  removeInventory(no: number): void {
    this.update({ inventory: this.state.inventory.filter((row) => row.no !== no) })
  }

  replaceInventory(rows: InventoryRow[]): void {
    this.update({ inventory: rows })
  }

  /* ---------------- 订单（09 筛选排序） ---------------- */

  replaceOrders(rows: FilterRow[]): void {
    this.update({ orders: rows })
  }

  /* ---------------- 批注（14 批阅） ---------------- */

  replaceComments(comments: Comment[]): void {
    this.update({ comments })
  }

  /** 恢复初始演示数据（设置页/工具栏可用） */
  reset(): void {
    this.state = seed()
    this.persist()
    for (const listener of this.listeners) listener()
  }

  /* ---------------- 统计（首页实时数据卡） ---------------- */

  stats(): { salesTotal: string; salesCount: number; stockWarning: number; inventoryCount: number; openComments: number } {
    const salesTotal = this.state.sales.reduce((sum, row) => sum + row.amount, 0)
    return {
      salesTotal: salesTotal.toFixed(1),
      salesCount: this.state.sales.length,
      stockWarning: this.state.inventory.filter((row) => row.status === '预警').length,
      inventoryCount: this.state.inventory.length,
      openComments: this.state.comments.filter((comment) => !comment.resolved).length,
    }
  }

  /* ---------------- 持久化 ---------------- */

  private persist(): void {
    try {
      const payload: Persisted = { ...this.state, __v: VERSION }
      localStorage.setItem(STORE_KEY, JSON.stringify(payload))
    } catch {
      /* 隐私模式/配额不足时静默降级为内存态 */
    }
  }

  private restore(): void {
    try {
      const raw = localStorage.getItem(STORE_KEY)
      if (!raw) return
      const saved = JSON.parse(raw) as Persisted
      if (saved.__v !== VERSION) return
      if (Array.isArray(saved.sales)) this.state.sales = saved.sales
      if (Array.isArray(saved.inventory)) this.state.inventory = saved.inventory
      if (Array.isArray(saved.orders)) this.state.orders = saved.orders
      if (Array.isArray(saved.comments)) this.state.comments = saved.comments
    } catch {
      /* 数据损坏时回落到初始种子 */
    }
  }
}

export const store = new DataStore()

/** Lit 控制器：数据变化时自动 requestUpdate（组件卸载自动退订） */
class StoreController implements ReactiveController {
  private disposer: (() => void) | null = null

  constructor(private readonly host: LitElement) {}

  hostConnected(): void {
    this.disposer = store.subscribe(() => this.host.requestUpdate())
  }

  hostDisconnected(): void {
    this.disposer?.()
    this.disposer = null
  }
}

/** 在组件 constructor 里调用：useStore(this) */
export function useStore(host: LitElement): void {
  host.addController(new StoreController(host))
}
