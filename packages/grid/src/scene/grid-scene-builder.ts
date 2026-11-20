/**
 * @sheetx/grid - 场景构建器
 *
 * 把「布局 + 数据 + 选区 + 主题」翻译成纯数据绘制指令（RenderScene）。
 * 这是 renderer 与业务之间的唯一接合点：本文件不碰 canvas，渲染器不懂数据。
 *
 * 分 pass 组织（Univer Spreadsheet.draw 的管线思想，见研究报告 §04）：
 *   z0 背景 → z1 网格线 → z2 内容文本 → z3 选区/填充柄 → z4 表头（viewport 空间）
 *
 * E3 冻结行：内容区拆成「冻结带 + 主带」两个裁剪区分别绘制——
 * 冻结带钉在列头下方（viewport 固定），主带随滚动；两带各自的 clip
 * 保证滚动内容不会越进冻结带（与表头带同理）。
 */

import type { CellRange, ColumnDef, Rect, RenderScene, RenderLayer, ConditionalRule } from '@sheetx/core'
import { evaluateConditionalFormat } from '@sheetx/core'
import type { DrawCommand } from '@sheetx/renderer'
import { drawRect, drawText, fontString } from '@sheetx/renderer'
import type { ThemeTokens } from '@sheetx/themes'
import type { SelectionModel } from '@sheetx/interaction'
import type { GridStore } from '@sheetx/data'
import type { ValueFormatter, FormatContext } from '@sheetx/core'
import { COL_HEADER_HEIGHT, ROW_HEADER_WIDTH } from '../layout/grid-layout.js'
import type { GridLayout } from '../layout/grid-layout.js'

/** 场景构建输入（由 GridEngine 组装） */
export interface GridSceneInput {
  layout: GridLayout
  store: GridStore
  theme: ThemeTokens
  selection: SelectionModel
  /** 格式化器注册表（key = ColumnDef.formatter 名） */
  formatters: ReadonlyMap<string, ValueFormatter>
  /** 行号是否显示 */
  showRowNumbers: boolean
  /** 当前排序列与方向（列头箭头；未排序时省略） */
  sortState?: { col: number; dir: 'asc' | 'desc' }
  /** 条件格式规则（由引擎状态注入） */
  conditionalRules?: ReadonlyArray<ConditionalRule>
}

/** 单元格显示对齐推断：数字右对齐、布尔居中、其余左对齐（Excel 默认习惯） */
function inferAlign(value: unknown): 'left' | 'center' | 'right' {
  if (typeof value === 'number' || typeof value === 'bigint') return 'right'
  if (typeof value === 'boolean') return 'center'
  return 'left'
}

function formatCellValue(
  value: unknown,
  def: ColumnDef | undefined,
  formatters: ReadonlyMap<string, ValueFormatter>,
  row: number,
  col: number,
): string {
  if (value === null || value === undefined) return ''
  const formatterName = def?.formatter
  if (formatterName) {
    const formatter = formatters.get(formatterName)
    if (formatter) {
      const context: FormatContext = {
        column: def ?? { key: '', title: '' },
        row,
        col,
      }
      return formatter(value as never, context)
    }
  }
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE'
  return String(value)
}

export function buildGridScene(input: GridSceneInput): RenderScene {
  const { layout, store, theme, selection, formatters } = input
  const commands = {
    background: [] as DrawCommand[],
    grid: [] as DrawCommand[],
    conditional: [] as DrawCommand[],
    content: [] as DrawCommand[],
    overlay: [] as DrawCommand[],
    headers: [] as DrawCommand[],
  }

  const size = layout.viewportSize
  const window_ = layout.getVisibleWindow()
  const contentRect: Rect = {
    x: ROW_HEADER_WIDTH,
    y: COL_HEADER_HEIGHT,
    width: Math.max(0, size.width - ROW_HEADER_WIDTH),
    height: Math.max(0, size.height - COL_HEADER_HEIGHT),
  }

  // E3 冻结带 / 主带几何
  const frozenCount = Math.min(layout.frozenRowCount, layout.rows.rowCount)
  const frozenBand = layout.frozenBandHeight
  const mainBandY = COL_HEADER_HEIGHT + frozenBand
  const mainBandHeight = Math.max(0, size.height - mainBandY)
  const frozenRowList: number[] = Array.from({ length: frozenCount }, (_, index) => index)
  const mainRowCount = Math.max(0, window_.lastRow - window_.firstRow + 1)
  const mainRowList: number[] = Array.from({ length: mainRowCount }, (_, index) => window_.firstRow + index)

  // 条件格式：数据条/色阶的数值边界按规则区域自动扫描（规则自带 min/max 时以其为准）
  const cfRules = input.conditionalRules ?? []
  const cfBounds = new Map<string, { min: number; max: number }>()
  for (const rule of cfRules) {
    if (rule.type !== 'dataBar' && rule.type !== 'colorScale') continue
    let min = Infinity
    let max = -Infinity
    for (let row = rule.range.start.row; row <= rule.range.end.row; row++) {
      const rowData = store.getRowByIndex(row)
      if (!rowData) continue
      for (let col = rule.range.start.col; col <= rule.range.end.col; col++) {
        const def = layout.cols.getDef(col)
        if (!def) continue
        const raw = rowData.data[def.key]
        const value = typeof raw === 'number' ? raw : typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : NaN
        if (!Number.isFinite(value)) continue
        min = Math.min(min, value)
        max = Math.max(max, value)
      }
    }
    cfBounds.set(rule.id, { min: Number.isFinite(min) ? min : 0, max: Number.isFinite(max) ? max : 1 })
  }
  // 多规则时的整体包络（单规则场景即其自身边界）
  const cfEnvelope = {
    min: Math.min(...[...cfBounds.values()].map((b) => b.min), 0),
    max: Math.max(...[...cfBounds.values()].map((b) => b.max), 1),
  }

  /** 一个内容带的完整绘制（背景/网格/内容/条件四层各自 clip 到带内） */
  const drawBand = (rows: number[], cols: number[], bandX: number, bandW: number, bandY: number, bandHeight: number): void => {
    const band = { x: bandX, y: bandY, w: bandW, h: bandHeight }
    const clip = (): DrawCommand => ({ t: 'clip', x: band.x, y: band.y, w: band.w, h: band.h, space: 'viewport' })
    commands.background.push(clip())
    commands.background.push(drawRect(band.x, band.y, band.w, band.h, theme.background, 'viewport'))
    commands.grid.push(clip())
    commands.conditional.push(clip())
    commands.content.push(clip())
    const cellFont = fontString({ size: theme.fontSize, family: theme.fontFamily })
    for (const row of rows) {
      const y = layout.rowToViewportY(row)
      const h = layout.rows.getHeight(row)
      const rowData = store.getRowByIndex(row)
      for (const col of cols) {
        const x = layout.colToViewportX(col)
        const w = layout.cols.getWidth(col)
        const def = layout.cols.getDef(col)
        // 网格线（随格子画一次右边线 + 底边线）
        commands.grid.push({ t: 'line', x1: x + w, y1: y, x2: x + w, y2: y + h, stroke: theme.gridLine, space: 'viewport' })
        commands.grid.push({ t: 'line', x1: x, y1: y + h, x2: x + w, y2: y + h, stroke: theme.gridLine, space: 'viewport' })
        if (!rowData || !def) continue
        const value = rowData.data[def.key]
        const cf = cfRules.length > 0
          ? evaluateConditionalFormat(value as never, row, col, cfRules, cfEnvelope)
          : null
        if (cf) {
          const fill = cf.background ?? cf.scaleColor
          if (fill) commands.conditional.push(drawRect(x, y, w, h, fill, 'viewport'))
          if (cf.dataBarRatio !== undefined) {
            const barWidth = Math.max(2, (w - 6) * cf.dataBarRatio)
            commands.conditional.push(drawRect(x + 3, y + h / 2 - 3, barWidth, 6, cf.dataBarColor ?? theme.selectionFill, 'viewport'))
          }
        }
        const display = formatCellValue(value, def, formatters, row, col)
        if (display !== '') {
          const align = inferAlign(value)
          const cellFontFinal = cf?.bold
            ? fontString({ size: theme.fontSize, family: theme.fontFamily, bold: true })
            : cellFont
          const textX = align === 'right' ? x + w - 6 : align === 'center' ? x + w / 2 : x + 6
          commands.content.push({
            t: 'text',
            x: textX,
            y: y + h / 2,
            text: display,
            font: cellFontFinal,
            fill: cf?.color ?? theme.cellText,
            align,
            baseline: 'middle',
            maxWidth: Math.max(10, w - 12), // 超宽省略号截断（renderer 的度量缓存二分）
            space: 'viewport',
          })
        }
      }
    }
    commands.background.push({ t: 'clip-end' })
    commands.grid.push({ t: 'clip-end' })
    commands.conditional.push({ t: 'clip-end' })
    commands.content.push({ t: 'clip-end' })
  }

  // ---- z0/z1/z2：冻结带（如有）+ 主带 ----
  // 水平方向也拆分：冻结列固定绘制，主区列裁剪在冻结带右侧（否则滚动后主区列会盖住冻结列）
  const frozenColCount = Math.min(layout.cols.frozenCount, layout.cols.count)
  const frozenColWidth = layout.cols.frozenWidth
  const frozenColList: number[] = Array.from({ length: frozenColCount }, (_, index) => index)
  const mainColList: number[] = []
  for (let col = Math.max(frozenColCount, window_.firstCol); col <= window_.lastCol; col++) mainColList.push(col)
  const mainColX = ROW_HEADER_WIDTH + frozenColWidth
  const mainColW = Math.max(0, size.width - mainColX)

  const drawRowBand = (rows: number[], y: number, h: number): void => {
    if (frozenColCount > 0) drawBand(rows, frozenColList, ROW_HEADER_WIDTH, frozenColWidth, y, h)
    drawBand(rows, mainColList, mainColX, mainColW, y, h)
  }
  if (frozenCount > 0) drawRowBand(frozenRowList, COL_HEADER_HEIGHT, frozenBand)
  drawRowBand(mainRowList, mainBandY, mainBandHeight)

  // ---- 冻结分隔线（viewport 空间，盖在内容上） ----
  if (layout.cols.frozenCount > 0) {
    const fx = ROW_HEADER_WIDTH + layout.cols.frozenWidth
    commands.grid.push({ t: 'line', x1: fx, y1: COL_HEADER_HEIGHT, x2: fx, y2: size.height, stroke: theme.frozenLine, width: 2, space: 'viewport' })
  }
  if (frozenCount > 0) {
    const fy = COL_HEADER_HEIGHT + frozenBand
    commands.grid.push({ t: 'line', x1: 0, y1: fy, x2: size.width, y2: fy, stroke: theme.frozenLine, width: 2, space: 'viewport' })
  }

  // ---- z3 选区/填充柄（clip 覆盖整个内容区——选区可跨冻结带与主带） ----
  commands.overlay.push({ t: 'clip', x: contentRect.x, y: contentRect.y, w: contentRect.width, h: contentRect.height, space: 'viewport' })
  const ranges = selection.getRanges()
  for (let index = 0; index < ranges.length; index++) {
    const range = ranges[index]!
    const rect = rangeToViewportRect(layout, range)
    if (!rect) continue
    const isActive = index === selection.getActiveIndex()
    commands.overlay.push(drawRect(rect.x, rect.y, rect.width, rect.height, theme.selectionFill, 'viewport'))
    commands.overlay.push({
      t: 'rect',
      x: rect.x,
      y: rect.y,
      w: rect.width,
      h: rect.height,
      stroke: isActive ? theme.activeBorder : theme.selectionBorder,
      lineWidth: isActive ? 2 : 1,
      space: 'viewport',
    })
    if (isActive && rect.width > 0 && rect.height > 0) {
      commands.overlay.push(drawRect(rect.x + rect.width - 3, rect.y + rect.height - 3, 6, 6, theme.activeBorder, 'viewport'))
    }
  }
  commands.overlay.push({ t: 'clip-end' })

  // ---- z4 表头（viewport 空间：钉住不随滚动；行头含冻结行） ----
  const headerFont = fontString({ size: theme.headerFontSize, family: theme.fontFamily })
  for (const col of [...frozenColList, ...mainColList]) {
    const def = layout.cols.getDef(col)
    if (!def) continue
    const x = layout.colToViewportX(col)
    const w = layout.cols.getWidth(col)
    const selected = selection.getRanges().some((range) => col >= range.start.col && col <= range.end.col)
    commands.headers.push(drawRect(x, 0, w, COL_HEADER_HEIGHT, selected ? theme.selectionFill : theme.headerBackground, 'viewport'))
    commands.headers.push(drawText(x + w / 2, COL_HEADER_HEIGHT / 2, def.title, headerFont, theme.headerText, { align: 'center', baseline: 'middle', maxWidth: w - 8, space: 'viewport' }))
    commands.headers.push({ t: 'line', x1: x + w, y1: 0, x2: x + w, y2: COL_HEADER_HEIGHT, stroke: theme.headerBorder, space: 'viewport' })
    if (input.sortState?.col === col) {
      const cx = x + w - 9
      const cy = COL_HEADER_HEIGHT / 2
      const points: Array<[number, number]> =
        input.sortState.dir === 'asc'
          ? [[cx - 3, cy + 2], [cx, cy - 2], [cx + 3, cy + 2]]
          : [[cx - 3, cy - 2], [cx, cy + 2], [cx + 3, cy - 2]]
      commands.headers.push({ t: 'polyline', points, stroke: theme.headerText, width: 1.6, space: 'viewport' })
    }
  }
  commands.headers.push({ t: 'line', x1: 0, y1: COL_HEADER_HEIGHT, x2: size.width, y2: COL_HEADER_HEIGHT, stroke: theme.headerBorder, space: 'viewport' })
  // 行头：冻结行 + 主区行（rowToViewportY 已保证冻结行钉住）
  for (const row of [...frozenRowList, ...mainRowList]) {
    const y = layout.rowToViewportY(row)
    const h = layout.rows.getHeight(row)
    if (y + h < COL_HEADER_HEIGHT || y >= size.height) continue
    const selected = selection.getRanges().some((range) => row >= range.start.row && row <= range.end.row)
    commands.headers.push(drawRect(0, y, ROW_HEADER_WIDTH, h, selected ? theme.selectionFill : theme.headerBackground, 'viewport'))
    if (input.showRowNumbers) {
      commands.headers.push(drawText(ROW_HEADER_WIDTH / 2, y + h / 2, String(row + 1), headerFont, theme.headerText, { align: 'center', baseline: 'middle', space: 'viewport' }))
    }
    commands.headers.push({ t: 'line', x1: 0, y1: y + h, x2: ROW_HEADER_WIDTH, y2: y + h, stroke: theme.headerBorder, space: 'viewport' })
  }
  commands.headers.push({ t: 'line', x1: ROW_HEADER_WIDTH, y1: 0, x2: ROW_HEADER_WIDTH, y2: size.height, stroke: theme.headerBorder, space: 'viewport' })
  // 角落
  commands.headers.push(drawRect(0, 0, ROW_HEADER_WIDTH, COL_HEADER_HEIGHT, theme.headerBackground, 'viewport'))

  const layers: RenderLayer[] = [
    { id: 'background', zIndex: 0, commands: commands.background },
    { id: 'grid', zIndex: 1, commands: commands.grid },
    { id: 'conditional', zIndex: 1.5, commands: commands.conditional },
    { id: 'content', zIndex: 2, commands: commands.content },
    { id: 'overlay', zIndex: 3, commands: commands.overlay },
    { id: 'headers', zIndex: 4, commands: commands.headers },
  ]

  return {
    viewport: { x: layout.scroll.x, y: layout.scroll.y, width: size.width, height: size.height },
    layers,
    dpr: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
    // 滚动 blit 时这些带必须单独重绘（列头 + 冻结行 / 行头）
    fixedBands: { top: COL_HEADER_HEIGHT + frozenBand, left: ROW_HEADER_WIDTH + layout.cols.frozenWidth },
  }
}

/** CellRange → 视口矩形（越界钳制到内容区；完全出界返回 null；spreadsheet 复用） */
export function rangeToViewportRect(layout: GridLayout, range: CellRange): Rect | null {
  const size = layout.viewportSize
  const x1 = layout.colToViewportX(range.start.col)
  const y1 = layout.rowToViewportY(range.start.row)
  const x2 = layout.colToViewportX(range.end.col) + layout.cols.getWidth(range.end.col)
  const y2 = layout.rowToViewportY(range.end.row) + layout.rows.getHeight(range.end.row)
  // 与内容区求交
  const cx1 = Math.max(ROW_HEADER_WIDTH, x1)
  const cy1 = Math.max(COL_HEADER_HEIGHT, y1)
  const cx2 = Math.min(size.width, x2)
  const cy2 = Math.min(size.height, y2)
  if (cx2 <= cx1 || cy2 <= cy1) return null
  return { x: cx1, y: cy1, width: cx2 - cx1, height: cy2 - cy1 }
}
