/**
 * @sheetx/core - 生命周期
 *
 * 表格实例从创建到销毁的生命周期，供 UI 适配层与插件挂钩。
 */

/** 表格实例生命周期状态 */
export const Lifecycle = {
  CREATED: 'created',
  INITIALIZED: 'initialized',
  RENDERED: 'rendered',
  DESTROYED: 'destroyed',
} as const

export type LifecycleValue = (typeof Lifecycle)[keyof typeof Lifecycle]

/** 生命周期监听 */
export interface ILifecycleHost {
  readonly lifecycle: LifecycleValue
  onLifecycleChange(listener: (state: LifecycleValue) => void): () => void
}
