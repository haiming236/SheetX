/**
 * Integration Lab：模拟真实宿主（ERP）页面。
 * 消费 @sheetx/web-component 的构建产物，只设置 columns/data/appearance。
 */
import { defineSheetxElements } from '@sheetx/web-component'
import type { SheetXGridElement } from '@sheetx/web-component'
import type { GridColumnDef } from '@sheetx/grid'

defineSheetxElements()

const columns: GridColumnDef[] = [
  { key: 'name', title: '商品名称', width: 160 },
  { key: 'price', title: '单价（元）', width: 110 },
  { key: 'qty', title: '库存', width: 90 },
  { key: 'status', title: '状态', width: 90 },
]

const data = [
  { name: 'MacBook Pro', price: 12999, qty: 24, status: '在售' },
  { name: 'iPhone 17', price: 7999, qty: 58, status: '在售' },
  { name: 'iPad Pro', price: 5999, qty: 31, status: '在售' },
  { name: 'AirPods Pro', price: 1999, qty: 96, status: '补货中' },
]

const grid = document.querySelector('sheetx-grid') as SheetXGridElement
if (grid) {
  grid.columns = columns
  grid.data = data
  grid.appearance = { preset: 'compact', parts: { statusBar: false, formulaBar: false } }
}

const sheet = document.querySelector('sheetx-spreadsheet') as HTMLElement & { appearance: { preset: string } }
if (sheet) sheet.appearance = { preset: 'spreadsheet' }
