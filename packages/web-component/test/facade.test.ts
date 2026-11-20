/** 顶层 SheetX 门面：统一签名、全局安装幂等、不覆盖宿主已有门面 */
import { describe, it, expect } from 'vitest'
import { createGrid } from '@sheetx/grid'
import { createSpreadsheet } from '@sheetx/spreadsheet'
import { SheetX, installSheetX } from '../src/facade.js'

describe('SheetX 公共门面', () => {
  it('暴露基线裁定的两个工厂且直接复用分包工厂', () => {
    expect(SheetX.createGrid).toBe(createGrid)
    expect(SheetX.createSpreadsheet).toBe(createSpreadsheet)
    expect(typeof SheetX.version).toBe('string')
  })

  it('installSheetX 挂载到自定义宿主对象且幂等', () => {
    const target: Record<string, unknown> = {}
    const installed = installSheetX(target)
    expect(installed).toBe(SheetX)
    expect(target.SheetX).toBe(SheetX)
    expect(installSheetX(target)).toBe(SheetX)
  })

  it('宿主已注入同名门面时不覆盖（宿主可扩展后再安装）', () => {
    const hostFacade = { version: 'host', createGrid, createSpreadsheet }
    const target: Record<string, unknown> = { SheetX: hostFacade }
    expect(installSheetX(target)).toBe(hostFacade)
    expect(target.SheetX).toBe(hostFacade)
  })
})
