/**
 * @sheetx/core
 *
 * SheetX 内核：公共类型、命令、事件、插件、生命周期、渲染接口。
 * 零运行时依赖，所有上层包的契约基础。
 */
export * from './types.js';
export * from './font.js';
export * from './command.js';
export * from './event.js';
export { EventBus } from './event-bus.js';
export * from './plugin.js';
export * from './plugin-runtime.js';
export * from './renderer.js';
export * from './conditional-format.js';
export * from './pivot.js';
export * from './chart.js';
export * from './version-history.js';
export * from './view-manager.js';
export * from './lifecycle.js';
export declare function nextId(prefix?: string): string;
