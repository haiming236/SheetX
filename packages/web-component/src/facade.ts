/**
 * 顶层公共门面（基线裁定 #3）
 *
 * 全项目统一暴露 SheetX.createGrid({...}) / SheetX.createSpreadsheet({...})。
 * 这里只做聚合，不含任何引擎逻辑；CDN/Script 入口调用 installSheetX() 后，
 * 宿主即可从全局拿到同一套签名（npm 用户直接 import { SheetX }）。
 */
import { createGrid } from '@sheetx/grid'
import type { GridConfig } from '@sheetx/grid'
import { createSpreadsheet } from '@sheetx/spreadsheet'
import type { SpreadsheetConfig } from '@sheetx/spreadsheet'

export interface SheetXFacade {
  readonly version: string
  createGrid(config: GridConfig): ReturnType<typeof createGrid>
  createSpreadsheet(config: SpreadsheetConfig): ReturnType<typeof createSpreadsheet>
}

export const SheetX: SheetXFacade = {
  version: '0.1.0',
  createGrid,
  createSpreadsheet,
}

type GlobalTarget = Record<string, unknown>

/**
 * 把门面挂到宿主全局对象（幂等）。默认挂 globalThis；测试可传自定义对象。
 * 已存在同名对象时不覆盖——宿主可能先注入了带扩展方法的门面。
 */
export function installSheetX(target: GlobalTarget = globalThis as unknown as GlobalTarget): SheetXFacade {
  const existing = target.SheetX
  if (existing && typeof existing === 'object') return existing as SheetXFacade
  target.SheetX = SheetX
  return SheetX
}
