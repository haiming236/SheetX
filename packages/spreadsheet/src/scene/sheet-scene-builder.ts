/**
 * @sheetx/spreadsheet - 电子表格场景构建器
 *
 * 与 grid-scene-builder 同一套 pass 结构（z0 背景 → z1 网格/边框 → z2 内容 →
 * z3 选区 → z4 表头），差异点：
 * - 值 = 公式计算缓存 ?? 原始值，经 numFmt 格式化；
 * - 单元格样式（背景/颜色/对齐/字号/边框）逐格生效；
 * - 合并单元格：主格横跨绘制，被覆盖格跳过文本。
 *
 * E3 冻结行：内容区拆「冻结带 + 主带」两个裁剪区（与 grid 同构）。
 */

import type { ConditionalRule, Rect, RenderLayer, RenderScene } from '@sheetx/core'
import { evaluateConditionalFormat } from '@sheetx/core'
import type { DrawCommand } from '@sheetx/renderer'
import { drawRect, drawText, fontString } from '@sheetx/renderer'
import { rangeToViewportRect } from '@sheetx/grid'
import { COL_HEADER_HEIGHT, ROW_HEADER_WIDTH } from '@sheetx/grid'
import type { GridLayout } from '@sheetx/grid'
import type { ThemeTokens } from '@sheetx/themes'
import type { SelectionModel } from '@sheetx/interaction'
import type { WorksheetStore, CellStyle } from '@sheetx/data'
import type { CellValueLike } from '@sheetx/formula'
import { formatValue } from '../format.js'

export interface SheetSceneInput {
  layout: GridLayout
  sheet: WorksheetStore
  theme: ThemeTokens
  selection: SelectionModel
  /** 值读取（引擎注入：公式计算值 ?? 原始值） */
  getValue(row: number, col: number): CellValueLike
  /** 条件格式规则（由引擎状态注入） */
  conditionalRules?: ReadonlyArray<ConditionalRule>
}

/** 合并样式信息的读取器（样式 id → CellStyle） */
function styleOf(sheet: WorksheetStore, row: number, col: number): CellStyle | undefined {
  const data = sheet.getCellData(row, col)
  if (data?.s === undefined) return undefined
  return sheet.styles.get(data.s)
}

export function buildSheetScene(input: SheetSceneInput): RenderScene {
  const { layout, sheet, theme, selection, getValue } = input
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
  const frozenCount = Math.min(layout.frozenRowCount, sheet.rowCount)
  const frozenBand = layout.frozenBandHeight
  const mainBandY = COL_HEADER_HEIGHT + frozenBand
  const mainBandHeight = Math.max(0, size.height - mainBandY)
  const frozenRowList: number[] = Array.from({ length: frozenCount }, (_, index) => index)
  const mainRowCount = Math.max(0, window_.lastRow - window_.firstRow + 1)
  const mainRowList: number[] = Array.from({ length: mainRowCount }, (_, index) => window_.firstRow + index)

  // 条件格式：数据条/色阶的数值边界按规则区域自动扫描（显式值优先）
  const cfRules = input.conditionalRules ?? []
  const cfBounds = new Map<string, { min: number; max: number }>()
  for (const rule of cfRules) {
    if (rule.type !== 'dataBar' && rule.type !== 'colorScale') continue
    let min = Infinity
    let max = -Infinity
    for (let row = rule.range.start.row; row <= rule.range.end.row; row++) {
      for (let col = rule.range.start.col; col <= rule.range.end.col; col++) {
        const value = getValue(row, col)
        const num = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN
        if (!Number.isFinite(num)) continue
        min = Math.min(min, num)
        max = Math.max(max, num)
      }
    }
    cfBounds.set(rule.id, { min: Number.isFinite(min) ? min : 0, max: Number.isFinite(max) ? max : 1 })
  }
  const cfEnvelope = {
    min: Math.min(...[...cfBounds.values()].map((b) => b.min), 0),
    max: Math.max(...[...cfBounds.values()].map((b) => b.max), 1),
  }

  /** 一个内容带的完整绘制（样式背景/网格/边框/条件格式/内容随格绘制） */
  const drawBand = (rows: number[], cols: number[], bandX: number, bandW: number, bandY: number, bandHeight: number): void => {
    const band = { x: bandX, y: bandY, w: bandW, h: bandHeight }
    const clip = (): DrawCommand => ({ t: 'clip', x: band.x, y: band.y, w: band.w, h: band.h, space: 'viewport' })
    commands.background.push(clip())
    commands.background.push(drawRect(band.x, band.y, band.w, band.h, theme.background, 'viewport'))
    commands.grid.push(clip())
    commands.conditional.push(clip())
    commands.content.push(clip())
    for (const row of rows) {
      const y = layout.rowToViewportY(row)
      const h = layout.rows.getHeight(row)
      for (const col of cols) {
        const x = layout.colToViewportX(col)
        const w = layout.cols.getWidth(col)

        // 网格线
        commands.grid.push({ t: 'line', x1: x + w, y1: y, x2: x + w, y2: y + h, stroke: theme.gridLine, space: 'viewport' })
        commands.grid.push({ t: 'line', x1: x, y1: y + h, x2: x + w, y2: y + h, stroke: theme.gridLine, space: 'viewport' })

        const merge = sheet.findMergeAt(row, col)
        if (merge && !(merge.range.start.row === row && merge.range.start.col === col)) {
          continue // 被覆盖格：不画文本（背景由主格跨区绘制）
        }

        const style = styleOf(sheet, row, col)
        const isAnchor = merge !== undefined
        const drawW = isAnchor ? w * (merge!.range.end.col - merge!.range.start.col + 1) : w
        const drawH = isAnchor ? h * (merge!.range.end.row - merge!.range.start.row + 1) : h

        // 样式背景
        if (style?.background) {
          commands.background.push(drawRect(x, y, drawW, drawH, style.background, 'viewport'))
        }

        // 边框（样式边框盖住网格线）
        if (style?.border) {
          const border = style.border
          if (border.top) commands.grid.push({ t: 'line', x1: x, y1: y, x2: x + drawW, y2: y, stroke: border.top, width: 1.5, space: 'viewport' })
          if (border.bottom) commands.grid.push({ t: 'line', x1: x, y1: y + drawH, x2: x + drawW, y2: y + drawH, stroke: border.bottom, width: 1.5, space: 'viewport' })
          if (border.left) commands.grid.push({ t: 'line', x1: x, y1: y, x2: x, y2: y + drawH, stroke: border.left, width: 1.5, space: 'viewport' })
          if (border.right) commands.grid.push({ t: 'line', x1: x + drawW, y1: y, x2: x + drawW, y2: y + drawH, stroke: border.right, width: 1.5, space: 'viewport' })
        }

        // 内容
        const raw = getValue(row, col)
        const cf = cfRules.length > 0
          ? evaluateConditionalFormat(raw as never, row, col, cfRules, cfEnvelope)
          : null
        if (cf) {
          const fill = cf.background ?? cf.scaleColor
          if (fill) commands.conditional.push(drawRect(x, y, drawW, drawH, fill, 'viewport'))
          if (cf.dataBarRatio !== undefined) {
            const barWidth = Math.max(2, (drawW - 6) * cf.dataBarRatio)
            commands.conditional.push(drawRect(x + 3, y + drawH / 2 - 3, barWidth, 6, cf.dataBarColor ?? theme.selectionFill, 'viewport'))
          }
        }
        if (raw === null || raw === undefined || raw === '') continue
        const display = formatValue(raw, style?.numFmt)
        if (display === '') continue
        const font = fontString({
          size: style?.fontSize ?? theme.fontSize,
          family: theme.fontFamily,
          bold: style?.bold || cf?.bold,
          italic: style?.italic,
        })
        const align = style?.hAlign ?? inferAlign(raw)
        const textX = align === 'right' ? x + drawW - 6 : align === 'center' ? x + drawW / 2 : x + 6
        commands.content.push({
          t: 'text',
          x: textX,
          y: y + drawH / 2,
          text: display,
          font,
          fill: cf?.color ?? style?.color ?? theme.cellText,
          align,
          baseline: 'middle',
          maxWidth: Math.max(10, drawW - 12),
          space: 'viewport',
        })
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

  // ---- 冻结分隔线 ----
  if (layout.cols.frozenCount > 0) {
    const fx = ROW_HEADER_WIDTH + layout.cols.frozenWidth
    commands.grid.push({ t: 'line', x1: fx, y1: COL_HEADER_HEIGHT, x2: fx, y2: size.height, stroke: theme.frozenLine, width: 2, space: 'viewport' })
  }
  if (frozenCount > 0) {
    const fy = COL_HEADER_HEIGHT + frozenBand
    commands.grid.push({ t: 'line', x1: 0, y1: fy, x2: size.width, y2: fy, stroke: theme.frozenLine, width: 2, space: 'viewport' })
  }

  // ---- z3 选区 ----
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

  // ---- z4 表头（行头含冻结行） ----
  const headerFont = fontString({ size: theme.headerFontSize, family: theme.fontFamily })
  for (const col of [...frozenColList, ...mainColList]) {
    const x = layout.colToViewportX(col)
    const w = layout.cols.getWidth(col)
    const selected = selection.getRanges().some((range) => col >= range.start.col && col <= range.end.col)
    commands.headers.push(drawRect(x, 0, w, COL_HEADER_HEIGHT, selected ? theme.selectionFill : theme.headerBackground, 'viewport'))
    commands.headers.push(drawText(x + w / 2, COL_HEADER_HEIGHT / 2, colName(col), headerFont, theme.headerText, { align: 'center', baseline: 'middle', maxWidth: w - 8, space: 'viewport' }))
    commands.headers.push({ t: 'line', x1: x + w, y1: 0, x2: x + w, y2: COL_HEADER_HEIGHT, stroke: theme.headerBorder, space: 'viewport' })
  }
  commands.headers.push({ t: 'line', x1: 0, y1: COL_HEADER_HEIGHT, x2: size.width, y2: COL_HEADER_HEIGHT, stroke: theme.headerBorder, space: 'viewport' })
  for (const row of [...frozenRowList, ...mainRowList]) {
    const y = layout.rowToViewportY(row)
    const h = layout.rows.getHeight(row)
    if (y + h < COL_HEADER_HEIGHT || y >= size.height) continue
    const selected = selection.getRanges().some((range) => row >= range.start.row && row <= range.end.row)
    commands.headers.push(drawRect(0, y, ROW_HEADER_WIDTH, h, selected ? theme.selectionFill : theme.headerBackground, 'viewport'))
    commands.headers.push(drawText(ROW_HEADER_WIDTH / 2, y + h / 2, String(row + 1), headerFont, theme.headerText, { align: 'center', baseline: 'middle', space: 'viewport' }))
    commands.headers.push({ t: 'line', x1: 0, y1: y + h, x2: ROW_HEADER_WIDTH, y2: y + h, stroke: theme.headerBorder, space: 'viewport' })
  }
  commands.headers.push({ t: 'line', x1: ROW_HEADER_WIDTH, y1: 0, x2: ROW_HEADER_WIDTH, y2: size.height, stroke: theme.headerBorder, space: 'viewport' })
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

/** 列号 → 表头字母（A, B, … AA） */
function colName(col: number): string {
  let name = ''
  let n = col
  while (n >= 0) {
    name = String.fromCharCode(65 + (n % 26)) + name
    n = Math.floor(n / 26) - 1
  }
  return name
}

function inferAlign(value: unknown): 'left' | 'center' | 'right' {
  if (typeof value === 'number') return 'right'
  if (typeof value === 'boolean') return 'center'
  return 'left'
}
