/**
 * @sheetx/core - 插件系统
 *
 * 借鉴 Univer 的生命周期钩子 + Tabulator 的模块注册（思想，非代码）。
 * 插件是扩展 SheetX 能力的一等公民，商业扩展也通过插件机制接入。
 */
import type { Disposable } from './types.js';
/** 插件生命周期阶段（按序推进） */
export declare const PluginStage: {
    readonly STARTING: 'starting';
    readonly READY: 'ready';
    readonly RENDERED: 'rendered';
    readonly STEADY: 'steady';
};
export type PluginStageValue = (typeof PluginStage)[keyof typeof PluginStage];
/** 插件上下文：插件可访问的引擎服务（由宿主注入） */
export interface IPluginContext {
    /** 注册命令 */
    registerCommand(id: string, handler: unknown): void;
    /** 注册编辑器 */
    registerEditor(name: string, factory: unknown): void;
    /** 注册单元格格式化器 */
    registerFormatter(name: string, formatter: unknown): void;
    /** 获取事件总线 */
    getEventBus(): unknown;
}
/** 插件接口 */
export interface IPlugin extends Disposable {
    readonly name: string;
    readonly version?: string;
    /** 依赖的其它插件名 */
    readonly dependencies?: string[];
    onStarting?(ctx: IPluginContext): void | Promise<void>;
    onReady?(ctx: IPluginContext): void | Promise<void>;
    onRendered?(ctx: IPluginContext): void | Promise<void>;
    onSteady?(ctx: IPluginContext): void | Promise<void>;
}
/** 插件注册表接口 */
export interface IPluginRegistry {
    register(plugin: IPlugin): void;
    unregister(name: string): void;
    get(name: string): IPlugin | undefined;
    list(): IPlugin[];
}
