/**
 * SheetX UI 图标库
 *
 * 线性风格图标（24x24, currentColor），与第 01 张设计稿一致。
 * 图标为硬编码可信常量，通过 unsafeSVG 注入。
 */
import { html, type TemplateResult } from 'lit'
import { unsafeSVG } from 'lit/directives/unsafe-svg.js'

// 官方 Logo 单一真源：所有页面统一从 logo.ts 取，icons.ts 仅做重导出兼容旧 import
export { sxLogo, SX_LOGO_SVG } from './logo.js'

/** 图标名称 */
export type IconName =
  | 'undo' | 'redo' | 'search' | 'help' | 'sun' | 'moon'
  | 'bold' | 'italic' | 'underline' | 'fontColor'
  | 'alignLeft' | 'alignCenter' | 'alignRight' | 'alignJustify'
  | 'valignTop' | 'valignMiddle' | 'valignBottom'
  | 'merge' | 'format' | 'currency' | 'percent' | 'decimalMinus' | 'decimalPlus'
  | 'conditional' | 'validation' | 'filter' | 'sort' | 'freeze'
  | 'chevronDown' | 'close' | 'plus' | 'checkCircle'
  | 'gridView' | 'listView' | 'zoomOut' | 'zoomIn' | 'fullscreen'
  | 'fx' | 'settings' | 'menu'
  | 'bell' | 'trash' | 'download' | 'upload' | 'edit' | 'more'
  | 'chevronRight' | 'chevronLeft' | 'checkboxChecked' | 'checkbox'
  | 'navInventory' | 'navPurchase' | 'navSales' | 'navFinance' | 'navReport'
  | 'tableStyle' | 'trendUp' | 'cart' | 'box' | 'chartBar' | 'file'
  | 'calendar' | 'user' | 'laptop' | 'check' | 'chevronUp'
  | 'bolt' | 'clock' | 'group' | 'batch' | 'bulb' | 'rocket'
  | 'sigma' | 'textT' | 'dash'
  | 'cloudUpload' | 'database' | 'clipboard' | 'sparkles' | 'refresh'
  | 'pivot' | 'split' | 'dedup' | 'folder' | 'image' | 'tag' | 'arrowRight'
  | 'print' | 'border' | 'copy' | 'scissors' | 'paste' | 'eraser' | 'link'
  | 'fill' | 'arrowDown' | 'arrowUp' | 'arrowLeft' | 'blankCell' | 'sameFormat'
  | 'sortAZ' | 'sortZA' | 'minusCircle'
  | 'palette' | 'sliders' | 'eye' | 'lock'
  | 'chartLine' | 'chartPie' | 'chartHBar' | 'chartArea' | 'chartCombo'
  | 'colsV' | 'drag'
  | 'comment' | 'history' | 'shield' | 'users' | 'thumbsUp' | 'reply' | 'send' | 'atSign'
  | 'shieldCheck' | 'alertCircle' | 'infoCircle' | 'warnTriangle'
  | 'puzzle' | 'package' | 'code' | 'star' | 'plug' | 'market' | 'terminal' | 'play'
  | 'globe'

/** 图标 SVG path（stroke 线性风格） */
const paths: Record<IconName, string> = {
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
  redo: '<path d="m15 14 5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4-4"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.2 9a3 3 0 0 1 5.6 1.5c0 2-2.8 2.2-2.8 4"/><circle cx="12" cy="17.3" r=".8" fill="currentColor" stroke="none"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  bold: '<path d="M7 5h6a3.5 3.5 0 0 1 0 7H7z"/><path d="M7 12h7a3.5 3.5 0 0 1 0 7H7z"/>',
  italic: '<path d="M14 5h5M9 19h5M15 5 9 19"/>',
  underline: '<path d="M7 4v7a5 5 0 0 0 10 0V4M5 21h14"/>',
  fontColor: '<path d="m6 17 6-13 6 13M8 13h8"/><rect x="4" y="19" width="16" height="2.5" rx="1" fill="currentColor" stroke="none"/>',
  alignLeft: '<path d="M4 6h16M4 10h10M4 14h16M4 18h10"/>',
  alignCenter: '<path d="M4 6h16M7 10h10M4 14h16M7 18h10"/>',
  alignRight: '<path d="M4 6h16M10 10h10M4 14h16M10 18h10"/>',
  alignJustify: '<path d="M4 6h16M4 10h16M4 14h16M4 18h16"/>',
  valignTop: '<path d="M4 4h16M8 8v11M16 8v11M8 8l2 2M16 8l-2 2"/>',
  valignMiddle: '<path d="M4 12h16M8 7v10M16 7v10"/>',
  valignBottom: '<path d="M4 20h16M8 5v11M16 5v11M8 16l2-2M16 16l-2-2"/>',
  merge: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M10 10v10"/>',
  format: '<path d="M4 6h16M4 12h16M4 18h10"/><path d="m17 15 3 3-3 3"/>',
  currency: '<path d="M8 4l4 7 4-7M12 11v9M8.5 13h7M8.5 16.5h7"/>',
  percent: '<path d="M19 5 5 19"/><circle cx="7.5" cy="7.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/>',
  decimalMinus: '<path d="M4 8h8M4 12h8M4 16h8M17 12h5"/><circle cx="19" cy="17" r="1" fill="currentColor" stroke="none"/>',
  decimalPlus: '<path d="M4 8h8M4 12h8M4 16h8M17 12h5M19.5 9.5v5"/>',
  conditional: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 9v11"/><path d="m12.5 14 1.5 1.5 2.5-3"/>',
  validation: '<path d="M9 4H5a2 2 0 0 0-2 2v4M15 4h4a2 2 0 0 1 2 2v4M9 20H5a2 2 0 0 1-2-2v-4M15 20h4a2 2 0 0 0 2-2v-4"/><path d="m9 12 2 2 4-4"/>',
  filter: '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
  sort: '<path d="M7 4v16M7 4 4 7M7 4l3 3M17 20V4M17 20l-3-3M17 20l3-3"/>',
  freeze: '<path d="M12 2v20M2 12h20M4.9 4.9l14.2 14.2M19.1 4.9 4.9 19.1"/><circle cx="12" cy="12" r="2.5"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8 12 2.6 2.6L16.5 9"/>',
  gridView: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  listView: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1" fill="currentColor" stroke="none"/>',
  zoomOut: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4-4M7.5 10.5h6"/>',
  zoomIn: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4-4M7.5 10.5h6M10.5 7.5v6"/>',
  fullscreen: '<path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/>',
  fx: '<path d="M6 5h9M6 12h9M6 19h4"/><path d="M14 5c0 3-3 3.5-3 7M12 12c0 3 3 3 3 7"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
  trash: '<path d="M4 7h16M10 4h4M6 7l1 14h10l1-14M10 11v6M14 11v6"/>',
  download: '<path d="M12 3v12M12 15l-4-4M12 15l4-4M4 19h16"/>',
  upload: '<path d="M12 15V4M12 4 8 8M12 4l4 4M4 20h16"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4"/>',
  more: '<circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none"/>',
  chevronRight: '<path d="m9 5 7 7-7 7"/>',
  chevronLeft: '<path d="m15 5-7 7 7 7"/>',
  checkbox: '<rect x="4" y="4" width="16" height="16" rx="3"/>',
  checkboxChecked: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="m8 12 2.7 2.7L16 9.5"/>',
  navInventory: '<path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v10l9 4 9-4V7M12 11v10"/>',
  navPurchase: '<circle cx="9" cy="20" r="1.3"/><circle cx="18" cy="20" r="1.3"/><path d="M2 4h3l2.5 11h10L20 7H6"/>',
  navSales: '<path d="M4 19V9M10 19V5M16 19v-7M21 19H3"/>',
  navFinance: '<circle cx="12" cy="12" r="9"/><path d="M9 8h6M12 8v9M9 13h6"/>',
  navReport: '<path d="M6 3h9l4 4v14H6zM15 3v5h4M9 12h6M9 16h6"/>',
  tableStyle: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 9v11"/>',
  trendUp: '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  cart: '<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 4h3l2.5 11h10L20 7H6"/>',
  box: '<path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v10l9 4 9-4V7M12 11v10"/>',
  chartBar: '<path d="M5 20V10M12 20V4M19 20v-7M3 20h18"/>',
  file: '<path d="M6 3h9l4 4v14H6zM15 3v5h4"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>',
  laptop: '<rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 19h20"/>',
  check: '<path d="m5 12 4.5 4.5L19 7"/>',
  chevronUp: '<path d="m6 15 6-6 6 6"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  group: '<rect x="3" y="4" width="18" height="4" rx="1"/><rect x="3" y="10" width="18" height="4" rx="1"/><rect x="3" y="16" width="18" height="4" rx="1"/>',
  batch: '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>',
  bulb: '<path d="M9 18h6M10 22h4"/><path d="M12 2a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 2z"/>',
  rocket: '<path d="M5 15c-1 1-1.5 4-1.5 4S6 17.5 7 16.5M9 15l-3-3c1-4 4-7 10-8 1 6-2 9-6 10l-1-1z"/><circle cx="14" cy="9" r="1.5"/>',
  sigma: '<path d="M17 5H7l6 7-6 7h10"/>',
  textT: '<path d="M6 5h12M12 5v14"/>',
  dash: '<path d="M6 12h12"/>',
  cloudUpload: '<path d="M7 15.5a4 4 0 0 1 .6-7.9A5 5 0 0 1 17 8.7a3.6 3.6 0 0 1 .9 7"/><path d="M12 12.5V20M12 12.5 9.5 15M12 12.5l2.5 2.5"/>',
  database: '<ellipse cx="12" cy="5.5" rx="7" ry="2.6"/><path d="M5 5.5v13c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6v-13"/><path d="M5 12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6"/>',
  clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4.5a1.8 1.8 0 0 1 1.8-1.8h2.4A1.8 1.8 0 0 1 15 4.5V6H9z"/><path d="M9 11.5h6M9 15.5h4"/>',
  sparkles: '<path d="m12 4 1.6 4.6L18 10.2l-4.4 1.6L12 16.4l-1.6-4.6L6 10.2l4.4-1.6z"/><path d="m18.6 15.4.6 1.8 1.8.6-1.8.6-.6 1.8-.6-1.8-1.8-.6 1.8-.6z"/>',
  refresh: '<path d="M20 12a8 8 0 1 1-2.34-5.66"/><path d="M20 3.5V8h-4.5"/>',
  pivot: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 9v12M3 15h18"/>',
  split: '<rect x="3" y="5" width="7.5" height="14" rx="1.2"/><rect x="13.5" y="5" width="7.5" height="14" rx="1.2"/>',
  dedup: '<rect x="3" y="7" width="12" height="13" rx="1.5"/><path d="M7.5 7V5.2A1.2 1.2 0 0 1 8.7 4h10.1a1.2 1.2 0 0 1 1.2 1.2v10.6a1.2 1.2 0 0 1-1.2 1.2H17"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2.2h8a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  image: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.3" cy="9.8" r="1.5"/><path d="m5 17 4.6-4.6 3.4 3.4 2.4-2.4L19 17"/>',
  tag: '<path d="M4 4h7l9 9-7 7-9-9z"/><circle cx="8.2" cy="8.2" r="1.2"/>',
  arrowRight: '<path d="M4 12h15M14 6.5 19.5 12 14 17.5"/>',
  print: '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M6 14h12v7H6z"/>',
  border: '<rect x="4" y="4" width="16" height="16" rx="1"/><path d="M4 9.3h16M4 14.6h16M9.3 4v16M14.6 4v16"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12"/>',
  paste: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 13h6M9 17h4"/>',
  eraser: '<path d="M16 3l5 5-11 11H5v-5z"/><path d="m13 6 5 5"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  fill: '<path d="m17 3 4 4-3 3-4-4z"/><path d="m14 6-9.5 9.5a2.12 2.12 0 0 0 3 3L17 9"/>',
  arrowDown: '<path d="M12 4v15M12 19l-5-5M12 19l5-5"/>',
  arrowUp: '<path d="M12 20V5M12 5l-5 5M12 5l5 5"/>',
  arrowLeft: '<path d="M20 12H5M5 12l5-5M5 12l5 5"/>',
  blankCell: '<rect x="4" y="4" width="16" height="16" rx="2" stroke-dasharray="3.2 3.2"/>',
  sameFormat: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M15 5H7a2 2 0 0 0-2 2v8"/>',
  sortAZ: '<text x="3.5" y="10.5" font-size="9" font-weight="600" fill="currentColor" stroke="none">A</text><text x="3.5" y="20" font-size="9" font-weight="600" fill="currentColor" stroke="none">Z</text><path d="M18.5 4.5v14M18.5 18.5 15.5 15.5M18.5 18.5l3-3"/>',
  sortZA: '<text x="3.5" y="10.5" font-size="9" font-weight="600" fill="currentColor" stroke="none">Z</text><text x="3.5" y="20" font-size="9" font-weight="600" fill="currentColor" stroke="none">A</text><path d="M18.5 4.5v14M18.5 18.5 15.5 15.5M18.5 18.5l3-3"/>',
  minusCircle: '<circle cx="12" cy="12" r="8.5"/><path d="M8.5 12h7"/>',
  palette: '<path d="M12 3a9 9 0 0 0 0 18c1.2 0 2-.9 2-2 0-.5-.2-1-.6-1.4a2 2 0 0 1 1.4-3.4h2.4a4.6 4.6 0 0 0 4.6-4.6C21.8 6.3 17.4 3 12 3z"/><circle cx="7.5" cy="10.8" r="1" fill="currentColor" stroke="none"/><circle cx="11.3" cy="7.3" r="1" fill="currentColor" stroke="none"/><circle cx="16" cy="9" r="1" fill="currentColor" stroke="none"/>',
  sliders: '<path d="M4 7h8M18 7h2M4 12h2M12 12h8M4 17h8M18 17h2"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="15" cy="17" r="2"/>',
  eye: '<path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/><circle cx="12" cy="15.5" r="1" fill="currentColor" stroke="none"/>',
  chartLine: '<path d="M4 20h16"/><path d="M5 16l4-5 3.5 3L18 7"/><circle cx="18" cy="7" r="1.4" fill="currentColor" stroke="none"/>',
  chartPie: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5V12l6.2 5.4"/>',
  chartHBar: '<path d="M4 6h9M4 12h14M4 18h6"/>',
  chartArea: '<path d="M4 20h16"/><path d="M5 16v-6l4 3 4-7 4 5v5z"/>',
  chartCombo: '<path d="M6 20v-6M11 20v-9M16 20v-4"/><path d="M4 9l5-4 5 3 6-5"/>',
  colsV: '<path d="M6 4v16M12 4v16M18 4v16"/>',
  drag: '<path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01"/>',
  comment: '<path d="M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-9l-5 4V6a2 2 0 0 1 2-2z"/>',
  history: '<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1"/><path d="M3.5 3.5V8H8"/><path d="M12 8v4.5l3 1.8"/>',
  shield: '<path d="M12 3l7 2.8V11c0 4.8-3.4 7.9-7 9.8-3.6-1.9-7-5-7-9.8V5.8L12 3z"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><circle cx="17" cy="9.5" r="2.5"/><path d="M16.5 15a4.5 4.5 0 0 1 4 4.5"/>',
  thumbsUp: '<path d="M7 11v9H4.5a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1H7zm0 0l3.8-6.8A2 2 0 0 1 13 5.2V9h4.6a2 2 0 0 1 2 2.4l-1.2 5.6a2 2 0 0 1-2 1.6H7"/>',
  reply: '<path d="M9 14L4 9l5-5"/><path d="M4 9h9a7 7 0 0 1 7 7v3.5"/>',
  send: '<path d="M21 3L10.5 13.5"/><path d="M21 3l-6.8 18-3.7-7.5L3 9.8 21 3z"/>',
  atSign: '<circle cx="12" cy="12" r="4"/><path d="M16 12v1.3a2.7 2.7 0 0 0 5.4 0V12a9.4 9.4 0 1 0-3.7 7.5"/>',
  shieldCheck: '<path d="M12 3l7 2.8V11c0 4.8-3.4 7.9-7 9.8-3.6-1.9-7-5-7-9.8V5.8L12 3z"/><path d="M9 11.6l2.1 2.1L15.4 9"/>',
  alertCircle: '<circle cx="12" cy="12" r="9"/><path d="M12 7.2V13"/><path d="M12 16.2h.01"/>',
  infoCircle: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.2"/><path d="M12 7.6h.01"/>',
  warnTriangle: '<path d="M12 4.2L2.8 19.5h18.4L12 4.2z"/><path d="M12 10v4"/><path d="M12 16.8h.01"/>',
  puzzle: '<path d="M9 4.5a1.7 1.7 0 0 1 3.4 0V6h3.3a1.7 1.7 0 0 1 1.7 1.7V9h1.5a1.7 1.7 0 0 1 0 3.4H17.4v3.3a1.7 1.7 0 0 1-1.7 1.7H12.3v-1.5a1.7 1.7 0 0 0-3.4 0v1.5H7.2a1.7 1.7 0 0 1-1.7-1.7v-3.3H4a1.7 1.7 0 0 1 0-3.4h1.5V7.7A1.7 1.7 0 0 1 7.2 6h1.8z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3z"/>',
  package: '<path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9"/><path d="M7.7 5.2 16.2 9.7"/>',
  code: '<path d="m8.5 8-4 4 4 4M15.5 8l4 4-4 4"/><path d="m13.5 5-3 14"/>',
  star: '<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/>',
  plug: '<path d="M9 3v5M15 3v5"/><path d="M7 8h10v3a5 5 0 0 1-10 0z"/><path d="M12 16v5"/>',
  market: '<path d="M4 9h16l-1 11H5z"/><path d="M3 9l2-5h14l2 5"/><path d="M9 13v3M15 13v3"/>',
  terminal: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 3 3-3 3M13 15h4"/>',
  play: '<path d="M8 5.5v13l10-6.5z"/>',
}

/** 生成图标 TemplateResult */
export function sxIcon(name: IconName, size = 16): TemplateResult {
  const body = paths[name]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`
  return html`<span class="sx-icon" style="display:inline-flex;align-items:center;justify-content:center;line-height:0">${unsafeSVG(svg)}</span>`
}

// sxLogo 已迁移到 ./logo.js 并在上方重导出（官方文字 Logo：Sheet 深海蓝 + X 翡翠绿）
