/**
 * @sheetx/interaction - 交互契约类型
 *
 * 交互引擎的铁律：**只产出语义命令与回调，绝不直接改数据**（任务书 T3 验收标准）。
 * 布局知识（命中测试、单元格矩形）通过回调接口注入——interaction 不理解任何布局，
 * 因此可同时服务 Grid 与 Spreadsheet 两种模式。
 */

import type { CellAddress, CellRange, Point, Rect, Size, UnknownRecord } from '@sheetx/core'

/** 命中目标种类 */
export type HitKind =
  | 'cell'
  | 'rowHeader'
  | 'colHeader'
  | 'corner'
  | 'rowResize'
  | 'colResize'
  | 'colSort'
  | 'fillHandle'

export interface HitTarget {
  kind: HitKind
  /** 命中的单元格坐标（header 类目标：rowHeader 的 col=-1，colHeader 的 row=-1，corner 全 -1） */
  row: number
  col: number
  /** resize 类拖动的目标行/列号 */
  handleIndex?: number
}

/** 语义命令（交给宿主翻译成引擎 Command） */
export interface SemanticCommand {
  id: string
  params: UnknownRecord
}

/** resize 回调相位 */
export type ResizePhase = 'start' | 'move' | 'end'

/**
 * 宿主回调接口——Grid/Spreadsheet 引擎实现。
 * 每个方法都有明确职责注释，interaction 自身零布局知识。
 */
export interface InteractionCallbacks {
  /** 命中测试：屏幕坐标（viewport CSS px）→ 命中目标 */
  hitTest(point: Point): HitTarget | null
  /** 单元格屏幕矩形（viewport CSS px；不存在返回 null） */
  getCellRect(row: number, col: number): Rect | null
  /** 内容总尺寸（自动滚动边界计算用） */
  getContentSize(): Size
  /** 行列总数（键盘导航钳制用） */
  getRowCount(): number
  getColCount(): number
  /** 该格是否可编辑 */
  isCellEditable(row: number, col: number): boolean
  /** 当前滚动偏移（content 坐标） */
  getScroll(): Point
  /** 请求滚动（自动滚动使用） */
  scrollBy(dx: number, dy: number): void
  /** 语义命令出口：编辑提交、剪贴板、撤销重做、清空、填充……全部经此 */
  onCommand(command: SemanticCommand): void
  /** 选区变化（OPERATION 层事件，不进 undo） */
  onSelectionChange(ranges: ReadonlyArray<CellRange>, activeIndex: number): void
  /** 请求开始编辑（initialChar 为键盘直接输入的首字符，Excel 语义） */
  onEditStart(row: number, col: number, options?: { initialChar?: string }): void
  /** 行高/列宽调整（拖动 resize 手柄） */
  onResize(kind: 'row' | 'col', index: number, deltaPx: number, phase: ResizePhase): void
  /** 剪贴板复制内容（选区 → TSV/HTML；宿主负责格式化值） */
  getCopyData(): { text: string; html?: string } | null
  /**
   * Excel 语义的数据边界跳转（Ctrl+方向键用）：
   * 从 (row,col) 沿 (dr,dc) 找「连续非空区的最后一个非空格」；
   * 若当前格为空则跳到下一个非空格的前一格（或行列边界）。
   * 宿主不实现时键位表退化为大跨度移动。
   */
  getEdgeCell?(row: number, col: number, dr: number, dc: number): { row: number; col: number } | null
  /**
   * 双击行/列边界 → 自适应尺寸（Excel 习惯：双击列边界按内容最宽处定宽）。
   * 宿主不实现时双击 resize 边界不产生副作用。
   */
  onAutoFit?(kind: 'row' | 'col', index: number): void
}

/** 交互状态机的状态集合（正式方案 L362-371 的显式 FSM） */
export const InteractionState = {
  IDLE: 'idle',
  SELECTING: 'selecting',
  EDITING: 'editing',
  IME_COMPOSING: 'ime-composing',
  DRAGGING: 'dragging',
  RESIZING: 'resizing',
} as const

export type InteractionStateValue = (typeof InteractionState)[keyof typeof InteractionState]

/** 交互引擎常用地址类型重导出（方便上层一次性导入） */
export type { CellAddress, CellRange, Point, Rect, Size, UnknownRecord }
