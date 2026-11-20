/**
 * @sheetx/core - 插件运行时（M4「插件中心与扩展生态」）
 *
 * plugin.ts 只定义契约，本模块提供可执行的注册/依赖排序/生命周期/扩展点记账：
 * - 插件目录（manifest）与安装状态分离：市场列表 ≠ 已安装插件；
 * - 依赖拓扑排序，缺失依赖、循环依赖、未启用依赖直接拒绝；
 * - 按 STARTING → READY → RENDERED → STEADY 推进生命周期，错误按插件隔离；
 * - 所有扩展点注册统一记账（command/editor/formatter/renderer/dataAdapter/theme/menu/function），
 *   便于宿主做「扩展管理 / 安全审计 / 热禁用」；
 * - 状态可序列化到 localStorage/服务端，零运行时依赖，浏览器与 Node 均可运行。
 */
import { type PluginStageValue } from './plugin.js';
/** 一等扩展点：插件能通过它们向宿主注入能力 */
export declare const EXTENSION_POINTS: readonly ['command', 'editor', 'formatter', 'renderer', 'dataAdapter', 'theme', 'menu', 'function'];
export type ExtensionPoint = (typeof EXTENSION_POINTS)[number];
export declare const EXTENSION_POINT_LABELS: Record<ExtensionPoint, string>;
/** 插件市场条目（可序列化，UI 只依赖这一层元数据） */
export interface PluginManifest {
    id: string;
    name: string;
    version: string;
    category?: string;
    description?: string;
    publisher?: string;
    dependencies?: readonly string[];
    extensionPoints?: readonly ExtensionPoint[];
    rating?: number;
    downloads?: number;
    recommended?: boolean;
}
export type PluginHookName = 'onStarting' | 'onReady' | 'onRendered' | 'onSteady';
export interface PluginHooks {
    onStarting?(ctx: PluginRuntimeContext): void | Promise<void>;
    onReady?(ctx: PluginRuntimeContext): void | Promise<void>;
    onRendered?(ctx: PluginRuntimeContext): void | Promise<void>;
    onSteady?(ctx: PluginRuntimeContext): void | Promise<void>;
    onDisable?(ctx: PluginRuntimeContext): void | Promise<void>;
}
export interface RuntimePlugin extends PluginManifest {
    hooks?: PluginHooks;
}
/** 宿主暴露的真实注册能力；缺省为空表示只做运行时代办，不接引擎 */
export interface ExtensionHost {
    registerCommand?(name: string, handler: unknown): void;
    registerEditor?(name: string, factory: unknown): void;
    registerFormatter?(name: string, formatter: unknown): void;
    registerRenderer?(name: string, renderer: unknown): void;
    registerDataAdapter?(name: string, adapter: unknown): void;
    registerTheme?(name: string, theme: unknown): void;
    registerMenu?(name: string, menu: unknown): void;
    registerFunction?(name: string, fn: unknown): void;
}
export interface ExtensionRegistration {
    pluginId: string;
    point: ExtensionPoint;
    name: string;
    /** 真实注入值；仅做元数据声明时为 undefined */
    payload?: unknown;
}
export interface PluginRuntimeContext extends ExtensionHost {
    readonly id: string;
    readonly manifest: Readonly<RuntimePlugin>;
    log(message: string): void;
}
export type PluginStageName = PluginStageValue | 'disabled' | 'error';
export interface PluginStatus {
    id: string;
    installed: boolean;
    enabled: boolean;
    stage: PluginStageName;
    error?: string;
}
export interface ActivationEvent {
    pluginId: string;
    stage: PluginStageName;
    ok: boolean;
    message?: string;
    at: string;
}
export type PluginSort = 'recommended' | 'downloads' | 'rating' | 'name';
export interface PluginFilter {
    query?: string;
    category?: string;
    sort?: PluginSort;
    installedOnly?: boolean;
    installedIds?: ReadonlySet<string>;
}
/** 排序/筛选是纯函数：页面与服务端市场可共用同一套语义 */
export declare function filterPlugins(plugins: ReadonlyArray<PluginManifest>, filter?: PluginFilter): PluginManifest[];
/**
 * 依赖拓扑排序。enabledIds 为空表示全部参与；传入时只保留启用插件，
 * 但启用插件依赖的插件也必须处于 enabledIds，否则拒绝（不允许隐式拉起已禁用插件）。
 */
export declare function resolvePluginOrder(plugins: ReadonlyArray<PluginManifest>, enabledIds?: ReadonlySet<string>): string[];
export declare class PluginRuntime {
    private readonly host;
    private readonly catalog;
    private states;
    private registrations;
    private events;
    constructor(host?: ExtensionHost);
    /** 登记到目录；默认视为已安装并启用，市场页面可传 installed:false */
    add(plugin: RuntimePlugin, options?: {
        installed?: boolean;
        enabled?: boolean;
    }): PluginStatus;
    addAll(plugins: ReadonlyArray<RuntimePlugin>, options?: {
        installed?: boolean;
        enabled?: boolean;
    }): void;
    get(id: string): RuntimePlugin | undefined;
    list(): RuntimePlugin[];
    status(id: string): PluginStatus | undefined;
    statuses(): PluginStatus[];
    installedIds(): Set<string>;
    install(id: string): PluginStatus;
    /** 有其它已安装插件依赖它时拒绝卸载，避免产生隐式断裂 */
    uninstall(id: string): Promise<boolean>;
    enable(id: string): Promise<PluginStatus>;
    disable(id: string): Promise<boolean>;
    /**
     * 按依赖顺序激活。单个插件抛错只把它自己标记为 error，依赖它的插件跳过；
     * 其余插件继续加载，避免「一个坏插件拖垮整个表格」。
     */
    activate(ids?: ReadonlyArray<string>): Promise<ActivationEvent[]>;
    /** 扩展点账本：UI 用它渲染「扩展管理」面板，宿主也可用它做安全审计 */
    extensions(point?: ExtensionPoint): ExtensionRegistration[];
    summary(): Array<{
        point: ExtensionPoint;
        label: string;
        count: number;
        pluginIds: string[];
    }>;
    getEvents(): ActivationEvent[];
    clearEvents(): void;
    /** 只持久化安装状态；插件代码/manifest 由市场或宿主提供，不反序列化任意对象 */
    serialize(): string;
    deserialize(json: string): boolean;
    private registerExtension;
    private createContext;
    private pushEvent;
}
