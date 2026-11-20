/**
 * CDN / 单脚本入口（副作用版）
 *
 * 打包成 sheetx.iife.js 时以本文件为 entry：加载后自动
 * 1) 挂全局 SheetX 门面（createGrid / createSpreadsheet）；
 * 2) 注册 <sheetx-grid> / <sheetx-spreadsheet>。
 * npm 用户仍从 './index.js' 具名导入，不触发任何副作用。
 */
import { installSheetX } from './facade.js'
import { defineSheetxElements } from './index.js'

installSheetX()
if (typeof customElements !== 'undefined') defineSheetxElements()
