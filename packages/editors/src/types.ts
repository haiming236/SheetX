/**
 * @sheetx/editors - 编辑器契约（任务书 T4）
 *
 * 函数式编辑器签名借鉴 Tabulator（cell, onRendered, success, cancel, params），
 * 类型化为 EditorFactory / EditorContext / EditorHandle。
 *
 * 契约要点（这些是各家踩坑总结出来的硬规则）：
 * 1. mount() 在元素进入 DOM **之后**调用——此时才能 focus（未入 DOM focus 无效）；
 * 2. 编辑器内部创建输入元素后，必须 ctx.imeGuard.attach(input)——IME 守卫由
 *    interaction 包提供，编辑器只负责接线（中文输入不丢字的保障）；
 * 3. Enter/Esc 的处理必须先过 imeGuard.shouldSuppressKeyEvent——composing 期间
 *    Enter 是候选词确认，绝不能触发提交；
 * 4. 编辑器不写数据：只能 ctx.commit(value) / ctx.cancel()——写值、校验、undo
 *    全部由 grid 引擎的命令系统完成。
 */

import type { CellValue, Rect, UnknownRecord } from '@sheetx/core'
import type { ImeGuard } from '@sheetx/interaction'

/** 提交来源元信息（E6：引擎据此在提交后移动焦点格） */
export interface CommitMeta {
  /** 提交触发的导航方向：Enter=down、Tab=right、Shift+Tab=left；失焦/点击提交不传（不移动） */
  move?: 'down' | 'up' | 'left' | 'right'
}

/** 编辑器上下文（引擎在打开编辑器时构造） */
export interface EditorContext {
  /** 行号（视口无关的数据坐标） */
  row: number
  col: number
  /** 行业务 id（Grid 模式）；Spreadsheet 模式为地址串 "r,c" */
  rowId: string
  field: string
  /** 当前原始值 */
  value: CellValue
  /** 当前显示值（格式化后，供编辑器预填） */
  displayValue: string
  /** 单元格屏幕矩形（viewport CSS px） */
  rect: Rect
  /** 编辑器挂载容器（grid 的编辑器宿主层） */
  container: HTMLElement
  /** IME 守卫——编辑器输入元素必须交给它 attach */
  imeGuard: ImeGuard
  /** 编辑器参数（来自 ColumnDef.editorParams） */
  params: UnknownRecord
  /**
   * 提交。引擎负责：校验 → set-cells mutation（含 autofill 字段联动）→ 关闭编辑器
   * →（按 meta.move）移动焦点格。
   * 远程搜索等联动字段通过 autofill 一起提交（同一事务，一次 undo）。
   */
  commit(value: CellValue, autofill?: Record<string, unknown>, meta?: CommitMeta): void
  /** 取消（还原旧值，等价于不写） */
  cancel(): void
}

/** 编辑器句柄：编辑器返回给引擎的控制接口 */
export interface EditorHandle {
  /** 根元素（引擎负责 appendChild 与定位） */
  el: HTMLElement
  /** 元素已进入 DOM 后调用——此时才能 focus/measure（Tabulator onRendered 教训） */
  mount?(): void
  /** 请求聚焦（引擎在定位后调用） */
  focus(): void
  /** 主动关闭时清理（移除自身监听） */
  destroy(): void
  /**
   * 键盘转发口：编辑器把「自己不处理」的按键交给引擎
   * （如 Ctrl+方向键移动选区、Tab 跳格——编辑态下 Excel 会提交并跳格）
   */
  onKeyDown?(event: KeyboardEvent): boolean
}

export type EditorFactory = (ctx: EditorContext) => EditorHandle

/** 远程搜索条目（远程搜索编辑器契约） */
export interface RemoteSearchItem {
  label: string
  value: CellValue
  /** 选中后要联动填充的字段值（如名称/规格/单位/价格——ERP 核心卖点） */
  payload?: Record<string, unknown>
}

/** 远程搜索查询函数（宿主注入，SheetX 不实现网络——纯前端边界） */
export type RemoteQueryFn = (keyword: string) => Promise<ReadonlyArray<RemoteSearchItem>>

/** 下拉选项（select 编辑器契约） */
export interface SelectOption {
  label: string
  value: CellValue
}
