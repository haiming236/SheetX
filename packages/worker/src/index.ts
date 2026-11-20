/**
 * @sheetx/worker - 并行计算（正式方案第四部分）
 *
 * 只依赖 @sheetx/core 的类型；浏览器用内联 Worker（Blob URL，零构建产物），
 * Node/禁用 Worker 自动降级到主线程，语义由同一套纯函数保证。
 */
export * from './protocol.js'
export * from './tasks.js'
export * from './runner.js'
