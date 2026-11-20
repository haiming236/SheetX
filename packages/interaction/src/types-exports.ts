/**
 * @sheetx/interaction - 内部聚合导出
 *
 * 该文件仅供包内模块互相引用时收敛 import 路径（避免循环依赖的浅文件）。
 * 对外 API 统一走 ./index.js。
 */

export type { InteractionCallbacks, InteractionStateValue, SemanticCommand } from './types.js'
export { InteractionState } from './types.js'
export type { SelectionModel } from './selection.js'
