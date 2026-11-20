/**
 * @sheetx/renderer - 绘制指令协议
 *
 * RenderLayer.commands（core 里是 unknown[]）的具体形态在本包定义。
 * 这是「渲染器 ↔ 业务模式」的唯一契约：grid/spreadsheet 的场景构建器
 * 只产出这些纯数据指令，渲染器不解释任何业务含义（core/renderer.ts 的纪律）。
 *
 * 坐标系约定：
 * - 指令默认使用 **content 坐标**（相对表格内容左上角，随滚动平移）
 * - `space: 'viewport'` 的指令使用 **viewport 坐标**（相对画布左上角，固定不动）
 *   ——行头/列头、冻结分隔线等「钉在屏幕上」的元素用这个空间。
 */

import type { Rect } from '@sheetx/core'

/** 绘制指令（判别联合，字段名从简以控制场景体积） */
export type DrawCommand =
  /** 矩形：填充和/或描边 */
  | { t: 'rect'; x: number; y: number; w: number; h: number; fill?: string; stroke?: string; lineWidth?: number; space?: CoordSpace }
  /** 文本（自动做度量缓存与省略号截断） */
  | { t: 'text'; x: number; y: number; text: string; font: string; fill?: string; align?: 'left' | 'center' | 'right'; baseline?: 'top' | 'middle' | 'bottom'; maxWidth?: number; space?: CoordSpace }
  /** 直线 */
  | { t: 'line'; x1: number; y1: number; x2: number; y2: number; stroke: string; width?: number; space?: CoordSpace }
  /** 多段折线（边框等需要连笔的场景，避免上百条 line 指令） */
  | { t: 'polyline'; points: Array<[number, number]>; stroke: string; width?: number; space?: CoordSpace }
  /** 开始裁剪区域（本层后续指令只画在该矩形内；必须与 clip-end 成对——滚动内容不越进表头区的机制） */
  | { t: 'clip'; x: number; y: number; w: number; h: number; space?: CoordSpace }
  /** 结束最近一次 clip（成对出现） */
  | { t: 'clip-end' }

export type CoordSpace = 'content' | 'viewport'

/** 字体串工具（canvas font 属性格式；默认字体族与 SheetX 主题一致） */
export function fontString(options: { size: number; family?: string; bold?: boolean; italic?: boolean }): string {
  const family = options.family ?? "'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif"
  const style = options.italic ? 'italic ' : ''
  const weight = options.bold ? 'bold ' : ''
  return `${style}${weight}${options.size}px ${family}`
}

/** 矩形指令快捷构造 */
export function drawRect(x: number, y: number, w: number, h: number, fill: string, space?: CoordSpace): DrawCommand {
  return { t: 'rect', x, y, w, h, fill, space }
}

/** 文本指令快捷构造 */
export function drawText(
  x: number,
  y: number,
  text: string,
  font: string,
  fill: string,
  options?: { align?: 'left' | 'center' | 'right'; baseline?: 'top' | 'middle' | 'bottom'; maxWidth?: number; space?: CoordSpace },
): DrawCommand {
  return { t: 'text', x, y, text, font, fill, ...options }
}

/** 矩形集合的包围盒（脏区域合并用） */
export function unionRects(rects: ReadonlyArray<Rect>): Rect {
  if (rects.length === 0) return { x: 0, y: 0, width: 0, height: 0 }
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const rect of rects) {
    minX = Math.min(minX, rect.x)
    minY = Math.min(minY, rect.y)
    maxX = Math.max(maxX, rect.x + rect.width)
    maxY = Math.max(maxY, rect.y + rect.height)
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

/** 两矩形是否相交（或间距小于 padding） */
export function rectsIntersect(a: Rect, b: Rect, padding = 0): boolean {
  return (
    a.x - padding <= b.x + b.width &&
    b.x - padding <= a.x + a.width &&
    a.y - padding <= b.y + b.height &&
    b.y - padding <= a.y + a.height
  )
}
