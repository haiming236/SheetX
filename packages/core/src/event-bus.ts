/**
 * @sheetx/core - 事件总线实现
 *
 * IEventBus 的唯一实现（零依赖）。设计约束（源自研究报告 §11）：
 * - 全引擎只有这一种事件机制——Univer 三种订阅风格并存的 dispose 链灾难不重演；
 * - emit 同步派发：表格引擎内事件全部是本地同步语义（跨线程走 Worker RPC，不走事件总线）；
 * - 监听器异常不中断其他监听器（隔离），开发期 console.error 暴露。
 */

import type { EventListener, IEventBus, Unsubscribe } from './event.js'

export class EventBus implements IEventBus {
  private listeners = new Map<string, Set<EventListener>>()

  on<T = unknown>(event: string, listener: EventListener<T>): Unsubscribe {
    let set = this.listeners.get(event)
    if (!set) {
      set = new Set()
      this.listeners.set(event, set)
    }
    set.add(listener as EventListener)
    return () => this.off(event, listener as EventListener)
  }

  once<T = unknown>(event: string, listener: EventListener<T>): Unsubscribe {
    const wrapped: EventListener = (payload: unknown): void => {
      unsubscribe()
      listener(payload as T)
    }
    const unsubscribe = this.on(event, wrapped)
    return unsubscribe
  }

  off(event: string, listener: EventListener): void {
    this.listeners.get(event)?.delete(listener)
  }

  emit<T = unknown>(event: string, payload: T): void {
    const set = this.listeners.get(event)
    if (!set) return
    // 拷贝一份：监听器内部可能 on/off（重入安全）
    for (const listener of [...set]) {
      try {
        listener(payload)
      } catch (error) {
        console.error(`[SheetX] 事件 "${event}" 的监听器抛出异常:`, error)
      }
    }
  }

  clear(event?: string): void {
    if (event === undefined) this.listeners.clear()
    else this.listeners.delete(event)
  }
}
