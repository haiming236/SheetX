/**
 * @sheetx/interaction - 剪贴板控制器
 *
 * 技术选型说明（任务书 T3 明确不要沿用 execCommand）：
 * - 复制/粘贴主路径走 **ClipboardEvent**（'copy'/'paste' 事件 + clipboardData）——
 *   无需权限弹窗，Excel/WPS/浏览器互操作的标准姿势；
 * - 程序化复制（工具栏按钮触发）才用 navigator.clipboard.writeText（异步、需权限）。
 *
 * 粘贴解析优先级（AG Grid 调和算法的简化版，见研究报告 §08）：
 *   text/html（Excel 富结构：colspan/rowspan）→ text/plain（TSV）
 * TSV 解析规则与 Excel 一致：\t 分列、\n 分行、引号内的换行/制表符保留。
 */

import type { CellAddress } from '@sheetx/core'

export interface CopyData {
  text: string
  html?: string
}

export interface PasteMeta {
  /** 来源格式（用于 UI 提示与格式保留策略） */
  format: 'html' | 'tsv'
  /** 矩阵尺寸 */
  rows: number
  cols: number
}

export interface ClipboardCallbacks {
  /** 宿主提供复制内容（选区 → TSV/HTML） */
  getCopyData(): CopyData | null
  /** 宿主提供粘贴目标（通常是活动单元格） */
  getPasteTarget(): CellAddress | null
  /** 粘贴解析结果（宿主翻译成 set-cells mutation） */
  onPaste(matrix: string[][], meta: PasteMeta): void
  /** 剪切 = 复制 + 宿主清空选区 */
  onCut(): void
}

export class ClipboardController {
  private container: HTMLElement | null = null
  private callbacks: ClipboardCallbacks | null = null

  /** 最近一次复制的数据（内部粘贴时可作「内部保真」来源，v2 用） */
  lastCopyData: CopyData | null = null

  attach(container: HTMLElement, callbacks: ClipboardCallbacks): void {
    this.detach()
    this.container = container
    this.callbacks = callbacks
    container.addEventListener('copy', this.handleCopy)
    container.addEventListener('cut', this.handleCut)
    container.addEventListener('paste', this.handlePaste)
  }

  detach(): void {
    if (!this.container) return
    this.container.removeEventListener('copy', this.handleCopy)
    this.container.removeEventListener('cut', this.handleCut)
    this.container.removeEventListener('paste', this.handlePaste)
    this.container = null
    this.callbacks = null
  }

  /** 程序化复制（工具栏按钮）。事件路径优先级更高，此方法为兜底 */
  async programmaticCopy(): Promise<boolean> {
    const data = this.callbacks?.getCopyData()
    if (!data) return false
    this.lastCopyData = data
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(data.text)
        return true
      }
    } catch {
      /* 权限拒绝/非安全上下文 */
    }
    return false
  }

  private handleCopy = (event: ClipboardEvent): void => {
    const data = this.callbacks?.getCopyData()
    if (!data || !event.clipboardData) return
    event.preventDefault()
    event.clipboardData.setData('text/plain', data.text)
    if (data.html) event.clipboardData.setData('text/html', data.html)
    this.lastCopyData = data
  }

  private handleCut = (event: ClipboardEvent): void => {
    const data = this.callbacks?.getCopyData()
    if (!data || !event.clipboardData) return
    event.preventDefault()
    event.clipboardData.setData('text/plain', data.text)
    if (data.html) event.clipboardData.setData('text/html', data.html)
    this.lastCopyData = data
    this.callbacks?.onCut()
  }

  private handlePaste = (event: ClipboardEvent): void => {
    const callbacks = this.callbacks
    if (!callbacks || !event.clipboardData) return
    const target = callbacks.getPasteTarget()
    if (!target) return
    event.preventDefault()

    // 优先 HTML：Excel 复制的 HTML 表格带结构（跨行跨列），保真度最高
    const html = event.clipboardData.getData('text/html')
    if (html) {
      const matrix = parseHtmlTable(html)
      if (matrix) {
        callbacks.onPaste(matrix, { format: 'html', rows: matrix.length, cols: matrix[0]?.length ?? 0 })
        return
      }
    }
    const text = event.clipboardData.getData('text/plain')
    if (text === '') return
    const matrix = parseTsv(text)
    callbacks.onPaste(matrix, { format: 'tsv', rows: matrix.length, cols: matrix[0]?.length ?? 0 })
  }

  // ---- 静态解析工具（导出供 io 包/测试复用） ----

  /** TSV → 矩阵。Excel 的 text/plain 是纯文本 TSV：\t 分列，\n/\r\n 分行 */
  static parseTsv(text: string): string[][] {
    const rows = text.split(/\r\n|\n|\r/)
    // 末尾换行产生的空行丢弃
    if (rows.length > 0 && rows[rows.length - 1] === '') rows.pop()
    return rows.map((row) => row.split('\t'))
  }

  /**
   * HTML 表格 → 矩阵（处理 colspan/rowspan 展开与合并格空位补齐）。
   * 返回 null 表示不是表格（普通富文本粘贴降级走 TSV）。
   */
  static parseHtmlTable(html: string): string[][] | null {
    if (typeof DOMParser === 'undefined') return null
    const doc = new DOMParser().parseFromString(html, 'text/html')
    const table = doc.querySelector('table')
    if (!table) return null
    // 用一张占位网格展开 colspan/rowspan
    const grid: Array<Map<number, string>> = []
    let row = 0
    for (const tr of Array.from(table.querySelectorAll('tr'))) {
      if (!grid[row]) grid[row] = new Map()
      let col = 0
      for (const cell of Array.from(tr.children)) {
        while (grid[row]!.has(col)) col++ // 跳过被上方 rowspan 占据的位置
        const text = (cell.textContent ?? '').replace(/\u00a0/g, ' ').trim()
        const colspan = Number((cell as HTMLElement).getAttribute('colspan') ?? 1) || 1
        const rowspan = Number((cell as HTMLElement).getAttribute('rowspan') ?? 1) || 1
        for (let dr = 0; dr < rowspan; dr++) {
          for (let dc = 0; dc < colspan; dc++) {
            if (!grid[row + dr]) grid[row + dr] = new Map()
            // 主格取文本，被覆盖格留空（合并语义）
            grid[row + dr]!.set(col + dc, dr === 0 && dc === 0 ? text : '')
          }
        }
        col += colspan
      }
      row++
    }
    const width = Math.max(0, ...grid.map((line) => line.size))
    return grid.map((line) => Array.from({ length: width }, (_, index) => line.get(index) ?? ''))
  }
}

/** TSV 解析的快捷导出（同 ClipboardController.parseTsv） */
export function parseTsv(text: string): string[][] {
  return ClipboardController.parseTsv(text)
}

/** HTML 表格解析的快捷导出 */
export function parseHtmlTable(html: string): string[][] | null {
  return ClipboardController.parseHtmlTable(html)
}
