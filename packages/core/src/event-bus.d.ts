/**
 * @sheetx/core - 事件总线实现
 *
 * IEventBus 的唯一实现（零依赖）。设计约束（源自研究报告 §11）：
 * - 全引擎只有这一种事件机制——Univer 三种订阅风格并存的 dispose 链灾难不重演；
 * - emit 同步派发：表格引擎内事件全部是本地同步语义（跨线程走 Worker RPC，不走事件总线）；
 * - 监听器异常不中断其他监听器（隔离），开发期 console.error 暴露。
 */
import type { EventListener, IEventBus, Unsubscribe } from './event.js';
export declare class EventBus implements IEventBus {
    private listeners;
    on<T = unknown>(event: string, listener: EventListener<T>): Unsubscribe;
    once<T = unknown>(event: string, listener: EventListener<T>): Unsubscribe;
    off(event: string, listener: EventListener): void;
    emit<T = unknown>(event: string, payload: T): void;
    clear(event?: string): void;
}
