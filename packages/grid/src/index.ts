/**
 * @sheetx/grid - 业务数据网格模式
 *
 * 对外主入口之一（任务书 T6）。共享底层引擎，以业务记录为中心的数据模型。
 *
 * 依赖方向说明：spreadsheet 模式会复用本包的布局基建（Fenwick/虚拟化/场景构建），
 * 属于「模式层内的单向依赖」（spreadsheet → grid），无环，且 grid 不依赖 spreadsheet。
 */

// 主入口
export { SheetXGrid } from './grid-engine.js'
export type { GridConfig, GridFeatures, GridColumnDef, BeforeEditPayload, AfterEditPayload } from './grid-engine.js'
import { SheetXGrid } from './grid-engine.js'
import type { GridConfig } from './grid-engine.js'

/**
 * 公共 API 工厂（基线裁定 #3 的签名：createGrid({container, columns, data, features})）。
 * 顶层 SheetX 全局门面由 web-component/CDN 入口聚合；引擎层提供工厂函数。
 */
export function createGrid(config: GridConfig): SheetXGrid {
  return new SheetXGrid(config)
}

// 弹出层宿主（E4）与填充序列（E5）——spreadsheet 模式复用
export { PopupHostManager } from './popup-host.js'
export type { EditorHostMode, PopupHostManagerOptions } from './popup-host.js'
export { deriveFillSeries, orderSourceToward } from './fill-series.js'

// 布局基建（spreadsheet 复用 + 高级用户扩展）
export { FenwickTree } from './layout/fenwick.js'
export { RowModel } from './layout/row-model.js'
export { ColumnModel, DEFAULT_COL_WIDTH } from './layout/col-model.js'
export { GridLayout, ROW_HEADER_WIDTH, COL_HEADER_HEIGHT } from './layout/grid-layout.js'
export type { VisibleWindow } from './layout/grid-layout.js'

// 场景构建（spreadsheet 复用；自定义渲染的用户可参考其结构）
export { buildGridScene, rangeToViewportRect } from './scene/grid-scene-builder.js'
export type { GridSceneInput } from './scene/grid-scene-builder.js'
