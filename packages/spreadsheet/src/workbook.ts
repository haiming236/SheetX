/**
 * @sheetx/spreadsheet - 工作簿模型
 *
 * Workbook = 工作表集合（有序）+ 活动表指针。
 * 每个 WorksheetStore（来自 @sheetx/data）持有稀疏单元格/样式表/合并区域/行列尺寸。
 * 快照 = 各表 toJSON 的集合（可 JSON 序列化，Worker/持久化友好）。
 */

import { nextId } from '@sheetx/core'
import { WorksheetStore } from '@sheetx/data'

export class WorkbookModel {
  private sheets = new Map<string, WorksheetStore>()
  private order: string[] = []
  private activeId_: string | null = null

  get sheetCount(): number {
    return this.order.length
  }

  get activeSheetId(): string | null {
    return this.activeId_
  }

  setActiveSheet(id: string): void {
    if (!this.sheets.has(id)) throw new Error(`[SheetX] 工作表不存在: "${id}"`)
    this.activeId_ = id
  }

  getSheet(id: string): WorksheetStore | undefined {
    return this.sheets.get(id)
  }

  getSheetByName(name: string): WorksheetStore | undefined {
    for (const sheet of this.sheets.values()) {
      if (sheet.name === name) return sheet
    }
    return undefined
  }

  /** 公式引用按表名解析的统一入口：先按 id 查，再按名字查 */
  resolveSheet(sheetNameOrId: string | null): WorksheetStore | undefined {
    if (sheetNameOrId === null) return this.getSheet(this.activeId_ ?? '')
    return this.sheets.get(sheetNameOrId) ?? this.getSheetByName(sheetNameOrId)
  }

  getActive(): WorksheetStore | undefined {
    return this.activeId_ ? this.sheets.get(this.activeId_) : undefined
  }

  getSheetIds(): readonly string[] {
    return this.order
  }

  /** 创建工作表（生成 id 与默认尺寸）；返回新表 */
  createSheet(name?: string, rowCount = 200, columnCount = 26, index?: number): WorksheetStore {
    const sheet = new WorksheetStore(nextId('sheet'), name ?? `Sheet${this.order.length + 1}`, rowCount, columnCount)
    this.addSheet(sheet, index)
    return sheet
  }

  addSheet(sheet: WorksheetStore, index?: number): void {
    if (this.sheets.has(sheet.id)) throw new Error(`[SheetX] 工作表 id "${sheet.id}" 已存在。`)
    if (this.getSheetByName(sheet.name)) throw new Error(`[SheetX] 工作表名 "${sheet.name}" 已存在。`)
    const at = index === undefined ? this.order.length : Math.max(0, Math.min(index, this.order.length))
    this.order.splice(at, 0, sheet.id)
    this.sheets.set(sheet.id, sheet)
    if (!this.activeId_) this.activeId_ = sheet.id
  }

  removeSheet(id: string): WorksheetStore | undefined {
    const sheet = this.sheets.get(id)
    if (!sheet) return undefined
    const index = this.order.indexOf(id)
    this.order.splice(index, 1)
    this.sheets.delete(id)
    if (this.activeId_ === id) {
      this.activeId_ = this.order[Math.max(0, index - 1)] ?? this.order[0] ?? null
    }
    return sheet
  }

  renameSheet(id: string, name: string): string {
    const sheet = this.sheets.get(id)
    if (!sheet) throw new Error(`[SheetX] 工作表不存在: "${id}"`)
    const old = sheet.name
    sheet.name = name
    return old
  }

  /** 快照（持久化/Worker 传输） */
  toJSON(): Record<string, unknown> {
    return {
      activeSheetId: this.activeId_,
      sheets: this.order.map((id) => this.sheets.get(id)!.toJSON()),
    }
  }

  /** 从快照重建 */
  static fromJSON(json: Record<string, unknown>): WorkbookModel {
    const workbook = new WorkbookModel()
    const sheets = (json.sheets as Array<Record<string, unknown>>) ?? []
    for (const sheetJson of sheets) {
      workbook.addSheet(WorksheetStore.fromJSON(sheetJson))
    }
    const active = json.activeSheetId as string | undefined
    if (active && workbook.getSheet(active)) workbook.setActiveSheet(active)
    return workbook
  }
}
