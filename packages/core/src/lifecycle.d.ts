/**
 * @sheetx/core - 生命周期
 *
 * 表格实例从创建到销毁的生命周期，供 UI 适配层与插件挂钩。
 */
/** 表格实例生命周期状态 */
export declare const Lifecycle: {
    readonly CREATED: 'created';
    readonly INITIALIZED: 'initialized';
    readonly RENDERED: 'rendered';
    readonly DESTROYED: 'destroyed';
};
export type LifecycleValue = (typeof Lifecycle)[keyof typeof Lifecycle];
/** 生命周期监听 */
export interface ILifecycleHost {
    readonly lifecycle: LifecycleValue;
    onLifecycleChange(listener: (state: LifecycleValue) => void): () => void;
}
