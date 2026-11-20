/**
 * @sheetx/io - 打印分页与矢量输出（M4「打印」）
 *
 * 设计约束（与 SheetX 整体一致）：
 * - 零依赖、纯函数：只消费「行列尺寸 + 单元格文本」的抽象源，不依赖 grid/renderer/DOM；
 * - 输出矢量 SVG（<text>/<rect>），不栅格化、不内嵌位图——放大不模糊，体积可控；
 * - 分页逻辑与渲染分离：`paginatePrint` 可在 Worker/Node 里跑，`renderPrintSvgPage` 只做字符串拼装。
 *
 * 坐标与单位：纸张用 mm，内容用 CSS px（96dpi）；scale=1 表示 100%。
 */

// ---------------------------------------------------------------------------
// 契约
// ---------------------------------------------------------------------------

/** 常用纸张（mm）；自定义纸张给 { width, height } */
export type PrintPaper = 'A4' | 'A3' | 'A5' | 'Letter' | 'Legal' | { width: number; height: number }

export interface PrintMargins {
  /** mm */
  top: number
  right: number
  bottom: number
  left: number
}

export interface PrintCellStyle {
  align?: 'left' | 'center' | 'right'
  bold?: boolean
  color?: string
  background?: string
  /** px，默认 12 */
  fontSize?: number
}

/** 打印源：宿主把引擎/数据适配成这组只读回调 */
export interface PrintSource {
  rowCount: number
  colCount: number
  rowHeight(row: number): number
  colWidth(col: number): number
  cellText(row: number, col: number): string
  cellStyle?(row: number, col: number): PrintCellStyle | undefined
  /** 页眉/页脚 {sheet} 变量 */
  sheetName?: string
}

export interface PrintOptions {
  paper?: PrintPaper
  orientation?: 'portrait' | 'landscape'
  /** mm，默认 A4 常规 15/15/18/18 */
  margins?: Partial<PrintMargins>
  /** 内容缩放倍率，默认 1；0.5 表示一页放两倍内容 */
  scale?: number
  /** 每页重复顶部 N 行（标题行），默认 0 */
  repeatRows?: number
  /** 每页重复左侧 N 列（标识列），默认 0 */
  repeatCols?: number
  /** 页眉模板，支持 {page} {pages} {sheet} {date} {time}，默认空 */
  header?: string
  /** 页脚模板，同上，默认空 */
  footer?: string
  /** 是否画单元格网格线，默认 true */
  gridLines?: boolean
  /** 字体族（SVG font-family），默认系统无衬线 */
  fontFamily?: string
  /**
   * 需要内嵌到导出物的字体（base64 TTF）。
   * 填了之后 SVG/HTML 自带 @font-face，在没有安装该字体的机器上也能正确显示——
   * 这是"打印与 PDF 导出"一致性的关键；不填则依赖系统字体。
   */
  embeddedFonts?: PrintableFont[]
}

/** 内嵌字体描述（由 @sheetx/fonts 的 loadBinary + base64 提供） */
export interface PrintableFont {
  family: string
  /** 400 / 700 */
  weight?: number
  /** TTF 的 base64（不含 data: 前缀） */
  base64: string
}

export interface PrintPage {
  index: number
  /** 本页行（不含重复行） */
  rows: number[]
  /** 本页列（不含重复列） */
  cols: number[]
  /** 每页重复的行/列（来自 options.repeatRows / repeatCols） */
  repeatRows: number[]
  repeatCols: number[]
  /** 纸张尺寸（px） */
  paperWidth: number
  paperHeight: number
  /** 可打印区域（px，已扣边距和页眉页脚） */
  printableWidth: number
  printableHeight: number
  /** 页眉/页脚高度（px） */
  headerHeight: number
  footerHeight: number
  scale: number
  options: Required<Omit<PrintOptions, 'margins' | 'embeddedFonts'>> & { margins: PrintMargins; embeddedFonts?: PrintableFont[] }
}

// ---------------------------------------------------------------------------
// 单位与分页
// ---------------------------------------------------------------------------

const MM_TO_PX = 96 / 25.4
/** 页眉/页脚默认行高（mm），仅用于占位计算 */
const HEADER_FOOTER_MM = 8

const PAPER_SIZES: Record<string, { width: number; height: number }> = {
  A4: { width: 210, height: 297 },
  A3: { width: 297, height: 420 },
  A5: { width: 148, height: 210 },
  Letter: { width: 215.9, height: 279.4 },
  Legal: { width: 215.9, height: 355.6 },
}

function resolveOptions(options: PrintOptions): PrintPage['options'] {
  const paper = options.paper ?? 'A4'
  const margins = {
    top: options.margins?.top ?? 15,
    right: options.margins?.right ?? 15,
    bottom: options.margins?.bottom ?? 18,
    left: options.margins?.left ?? 18,
  }
  return {
    paper,
    orientation: options.orientation ?? 'portrait',
    margins,
    scale: options.scale ?? 1,
    repeatRows: Math.max(0, Math.floor(options.repeatRows ?? 0)),
    repeatCols: Math.max(0, Math.floor(options.repeatCols ?? 0)),
    header: options.header ?? '',
    footer: options.footer ?? '',
    gridLines: options.gridLines ?? true,
    fontFamily: options.fontFamily ?? "'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif",
    embeddedFonts: options.embeddedFonts,
  }
}

function paperPx(paper: PrintPaper, orientation: 'portrait' | 'landscape'): { width: number; height: number } {
  const size = typeof paper === 'string' ? PAPER_SIZES[paper] ?? PAPER_SIZES.A4! : paper
  const landscape = orientation === 'landscape'
  const width = (landscape ? size.height : size.width) * MM_TO_PX
  const height = (landscape ? size.width : size.height) * MM_TO_PX
  return { width, height }
}

/**
 * 按尺寸数组切片成多页（保持顺序、不拆分单行/列）。
 * 单行超过可用空间时独占一页——否则会出现空白页死循环。
 */
function sliceBySizes(sizes: ReadonlyArray<number>, available: number): number[][] {
  if (sizes.length === 0) return []
  const pages: number[][] = []
  let current: number[] = []
  let used = 0
  for (let i = 0; i < sizes.length; i++) {
    const size = sizes[i]!
    if (current.length > 0 && used + size > available) {
      pages.push(current)
      current = []
      used = 0
    }
    current.push(i)
    used += size
  }
  if (current.length > 0) pages.push(current)
  return pages
}

function totalOf(sizes: ReadonlyArray<number>, indices: ReadonlyArray<number>): number {
  let total = 0
  for (const index of indices) total += sizes[index] ?? 0
  return total
}

/**
 * 分页：先扣除重复行列与页眉页脚占用的空间，再按可用区域切分行列。
 * 行列独立切分 → 形成 M×N 页网格（按行优先输出）。
 */
export function paginatePrint(source: PrintSource, options: PrintOptions = {}): PrintPage[] {
  const resolved = resolveOptions(options)
  const { width: paperWidth, height: paperHeight } = paperPx(resolved.paper, resolved.orientation)
  const headerHeight = resolved.header ? HEADER_FOOTER_MM * MM_TO_PX : 0
  const footerHeight = resolved.footer ? HEADER_FOOTER_MM * MM_TO_PX : 0
  const printableWidth = Math.max(0, paperWidth - (resolved.margins.left + resolved.margins.right) * MM_TO_PX)
  const printableHeight = Math.max(0, paperHeight - (resolved.margins.top + resolved.margins.bottom) * MM_TO_PX - headerHeight - footerHeight)
  if (printableWidth <= 0 || printableHeight <= 0) return []

  const repeatRows = Array.from({ length: Math.min(resolved.repeatRows, source.rowCount) }, (_, i) => i)
  const repeatCols = Array.from({ length: Math.min(resolved.repeatCols, source.colCount) }, (_, i) => i)
  const rowSizes = Array.from({ length: source.rowCount }, (_, i) => source.rowHeight(i))
  const colSizes = Array.from({ length: source.colCount }, (_, i) => source.colWidth(i))
  const repeatRowWidth = totalOf(rowSizes, repeatRows)
  const repeatColWidth = totalOf(colSizes, repeatCols)

  // 缩放：内容逻辑尺寸 × scale 必须放进可打印区域
  const availWidth = Math.max(1, printableWidth / resolved.scale - repeatColWidth)
  const availHeight = Math.max(1, printableHeight / resolved.scale - repeatRowWidth)

  const rowChunks = sliceBySizes(rowSizes.slice(resolved.repeatRows), availHeight)
  const colChunks = sliceBySizes(colSizes.slice(resolved.repeatCols), availWidth)
  const pages: PrintPage[] = []
  for (const rows of rowChunks) {
    for (const cols of colChunks) {
      pages.push({
        index: pages.length,
        rows: rows.map((i) => i + resolved.repeatRows),
        cols: cols.map((i) => i + resolved.repeatCols),
        repeatRows,
        repeatCols,
        paperWidth,
        paperHeight,
        printableWidth,
        printableHeight,
        headerHeight,
        footerHeight,
        scale: resolved.scale,
        options: resolved,
      })
    }
  }
  return pages
}

// ---------------------------------------------------------------------------
// 矢量 SVG 输出
// ---------------------------------------------------------------------------

function escapeXml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function formatTemplate(template: string, page: PrintPage, pageCount: number, sheetName: string): string {
  const now = new Date()
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  return template
    .replaceAll('{page}', String(page.index + 1))
    .replaceAll('{pages}', String(pageCount))
    .replaceAll('{sheet}', sheetName)
    .replaceAll('{date}', date)
    .replaceAll('{time}', time)
}

/** 渲染单页为矢量 SVG 字符串（无 <image>，可安全放大） */
export function renderPrintSvgPage(source: PrintSource, page: PrintPage, pageCount: number): string {
  const { margins, fontFamily, gridLines } = page.options
  const rows = [...page.repeatRows, ...page.rows]
  const cols = [...page.repeatCols, ...page.cols]
  const parts: string[] = []
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${page.paperWidth.toFixed(2)}" height="${page.paperHeight.toFixed(2)}" ` +
      `viewBox="0 0 ${page.paperWidth.toFixed(2)} ${page.paperHeight.toFixed(2)}">`,
  )
  parts.push(`<rect x="0" y="0" width="${page.paperWidth.toFixed(2)}" height="${page.paperHeight.toFixed(2)}" fill="#fff"/>`)

  // 内嵌字体：让导出的 SVG 自包含，脱离系统字体也能正确显示
  const embeddedFonts = page.options.embeddedFonts
  if (embeddedFonts && embeddedFonts.length > 0) {
    const faces = embeddedFonts
      .map(
        (font) =>
          `@font-face{font-family:'${font.family}';font-weight:${font.weight ?? 400};font-style:normal;` +
          `src:url(data:font/ttf;base64,${font.base64}) format('truetype');}`,
      )
      .join('')
    parts.push(`<defs><style type="text/css">${faces}</style></defs>`)
  }

  // 页眉页脚（页坐标，不受 scale 影响）
  if (page.headerHeight > 0) {
    parts.push(
      `<text x="${(margins.left * MM_TO_PX).toFixed(2)}" y="${((margins.top - HEADER_FOOTER_MM + 5) * MM_TO_PX).toFixed(2)}" ` +
        `font-family="${escapeXml(fontFamily)}" font-size="11" fill="#475569">${escapeXml(formatTemplate(page.options.header, page, pageCount, source.sheetName ?? ''))}</text>`,
    )
  }
  if (page.footerHeight > 0) {
    const footerY = (page.paperHeight / MM_TO_PX - margins.bottom + HEADER_FOOTER_MM) * MM_TO_PX
    parts.push(
      `<text x="${(margins.left * MM_TO_PX).toFixed(2)}" y="${footerY.toFixed(2)}" ` +
        `font-family="${escapeXml(fontFamily)}" font-size="11" fill="#475569">${escapeXml(formatTemplate(page.options.footer, page, pageCount, source.sheetName ?? ''))}</text>`,
    )
  }

  const contentTop = (margins.top * MM_TO_PX + page.headerHeight) / page.scale
  const contentLeft = (margins.left * MM_TO_PX) / page.scale
  parts.push(`<g transform="translate(${contentLeft.toFixed(2)} ${contentTop.toFixed(2)}) scale(${page.scale})">`)

  // 三趟绘制：背景 → 网格/边框 → 文字。
  // 坐标语义：rowY = 该行之前所有行高之和；x = 该列之前所有列宽之和。
  const drawCells = (draw: (row: number, col: number, x: number, y: number, w: number, h: number) => void): void => {
    let rowY = 0
    for (const row of rows) {
      const h = source.rowHeight(row)
      let x = 0
      for (const col of cols) {
        const w = source.colWidth(col)
        draw(row, col, x, rowY, w, h)
        x += w
      }
      rowY += h
    }
  }

  // 1) 背景
  drawCells((row, col, x, y, w, h) => {
    const background = source.cellStyle?.(row, col)?.background
    if (background) parts.push(`<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" fill="${escapeXml(background)}"/>`)
  })
  // 2) 网格线
  if (gridLines) {
    drawCells((_row, _col, x, y, w, h) => {
      parts.push(`<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" fill="none" stroke="#cbd5e1" stroke-width="0.7"/>`)
    })
  }
  // 3) 文字
  drawCells((row, col, x, y, w, h) => {
    const style = source.cellStyle?.(row, col)
    const text = source.cellText(row, col)
    if (text === '') return
    const fontSize = style?.fontSize ?? 12
    const anchor = style?.align === 'right' ? 'end' : style?.align === 'center' ? 'middle' : 'start'
    const tx = style?.align === 'right' ? x + w - 4 : style?.align === 'center' ? x + w / 2 : x + 4
    parts.push(
      `<text x="${tx.toFixed(2)}" y="${(y + h / 2 + fontSize * 0.35).toFixed(2)}" ` +
        `text-anchor="${anchor}" font-family="${escapeXml(fontFamily)}" font-size="${fontSize}" ` +
        `font-weight="${style?.bold ? 600 : 400}" fill="${escapeXml(style?.color ?? '#1f2937')}">${escapeXml(text)}</text>`,
    )
  })

  parts.push('</g></svg>')
  return parts.join('')
}

export function renderPrintSvg(source: PrintSource, options: PrintOptions = {}): string[] {
  const pages = paginatePrint(source, options)
  return pages.map((page) => renderPrintSvgPage(source, page, pages.length))
}

// ---------------------------------------------------------------------------
// HTML 打印输出（浏览器 window.print()）
// ---------------------------------------------------------------------------

/** 生成带 @page 规则与分页符的 HTML 文档（页面内已内联 SVG，打印即矢量） */
export function renderPrintHtml(source: PrintSource, options: PrintOptions = {}): string {
  const resolved = resolveOptions(options)
  const { width, height } = paperPx(resolved.paper, resolved.orientation)
  const svgs = renderPrintSvg(source, options)
  const landscape = resolved.orientation === 'landscape'
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeXml(source.sheetName ?? '打印')}</title>` +
    `<style>@page{size:${landscape ? 'landscape' : 'portrait'};margin:0}` +
    `html,body{margin:0;padding:0;background:#fff}` +
    `.sx-page{width:${width.toFixed(2)}px;height:${height.toFixed(2)}px;page-break-after:always;break-after:page;overflow:hidden}` +
    `.sx-page:last-child{page-break-after:auto;break-after:auto}` +
    `svg{display:block}</style></head><body>` +
    svgs.map((svg) => `<div class="sx-page">${svg}</div>`).join('') +
    `</body></html>`
}
