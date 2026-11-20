/**
 * SheetX 渲染性能基准（任务书 T6 / 正式方案 L845-857）
 *
 * 只驱动真实 @sheetx/grid，不造 mock 渲染器；所有数字来自浏览器 rAF 采样
 * 与 grid.getRenderStats()。window.__bench 供自动化（Playwright/CDP）调用。
 */
import { createGrid, type SheetXGrid } from '@sheetx/grid'

type BenchReport = Record<string, unknown>

interface BenchApi {
  readonly ready: true
  seed(rows: number, cols: number): BenchReport
  scroll(axis: 'x' | 'y', frames?: number): Promise<BenchReport>
  paste(cells?: number): Promise<BenchReport>
  runAll(): Promise<BenchReport>
}

declare global {
  interface Window {
    __bench?: BenchApi
  }
}

const host = document.getElementById('grid-host') as HTMLElement
const out = document.getElementById('out') as HTMLPreElement
const runButton = document.getElementById('run') as HTMLButtonElement

let grid: SheetXGrid | null = null

const nextFrame = (): Promise<void> => new Promise((resolve) => requestAnimationFrame(() => resolve()))
const round = (value: number, digits = 2): number => Number(value.toFixed(digits))

function makeRows(rowCount: number, colCount: number): Array<Record<string, unknown>> {
  const rows: Array<Record<string, unknown>> = new Array(rowCount)
  for (let row = 0; row < rowCount; row++) {
    const record: Record<string, unknown> = { id: `r${row}` }
    for (let col = 0; col < colCount; col++) record[`c${col}`] = (row * 31 + col) % 1000
    rows[row] = record
  }
  return rows
}

function seed(rows: number, cols: number): BenchReport {
  grid?.destroy()
  host.replaceChildren()
  const columns = Array.from({ length: cols }, (_, index) => ({
    key: `c${index}`,
    title: `C${index}`,
    width: 90,
  }))
  const t0 = performance.now()
  const records = makeRows(rows, cols)
  const generated = performance.now() - t0
  const t1 = performance.now()
  grid = createGrid({ container: host, columns, data: records })
  const created = performance.now() - t1
  return {
    rows,
    cols,
    dataGenerateMs: round(generated),
    gridCreateMs: round(created),
    totalMs: round(performance.now() - t0),
    // 真实指标：渲染技术与 DOM 节点数（Canvas 虚拟化不随行数线性增长）
    rendererKind: grid?.layeredRenderer.kind ?? 'canvas',
    domNodeCount: host.getElementsByTagName('*').length,
  }
}

async function scroll(axis: 'x' | 'y', frames = 90): Promise<BenchReport> {
  if (!grid) throw new Error('请先调用 seed()')
  const target = host.querySelector('.sx-grid-scroll') as HTMLElement | null
  if (!target) throw new Error('找不到网格滚动容器')
  const intervals: number[] = []
  let last = performance.now()
  for (let index = 0; index < frames; index++) {
    if (axis === 'y') {
      const max = Math.max(1, target.scrollHeight - target.clientHeight)
      target.scrollTop = (target.scrollTop + 97) % max
    } else {
      const max = Math.max(1, target.scrollWidth - target.clientWidth)
      target.scrollLeft = (target.scrollLeft + 83) % max
    }
    await nextFrame()
    const now = performance.now()
    intervals.push(now - last)
    last = now
  }
  // 第一帧包含首次布局，剔除后更接近稳态
  const samples = intervals.slice(1).sort((a, b) => a - b)
  const avg = samples.reduce((sum, value) => sum + value, 0) / Math.max(1, samples.length)
  const p95 = samples[Math.min(samples.length - 1, Math.floor(samples.length * 0.95))] ?? 0
  return {
    axis,
    frames: samples.length,
    fps: round(1000 / Math.max(avg, 0.01), 1),
    avgFrameMs: round(avg),
    p95FrameMs: round(p95),
    renderStats: grid.getRenderStats(),
  }
}

async function paste(cells = 1000): Promise<BenchReport> {
  if (!grid) throw new Error('请先调用 seed()')
  const cols = 40
  const rows = Math.ceil(cells / cols)
  const matrix = Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => `v${row}-${col}`))
  const t0 = performance.now()
  grid.paste(matrix, 0, 0)
  const syncMs = performance.now() - t0
  await nextFrame()
  await nextFrame()
  return {
    cells: rows * cols,
    syncMutationMs: round(syncMs),
    twoFrameMs: round(performance.now() - t0),
    renderStats: grid.getRenderStats(),
  }
}

async function runAll(): Promise<BenchReport> {
  const report: BenchReport = {
    browser: navigator.userAgent,
    dpr: window.devicePixelRatio || 1,
    viewport: { width: host.clientWidth, height: host.clientHeight },
    timestamp: new Date().toISOString(),
  }
  try {
    report.seed100k20 = seed(100_000, 20)
    await nextFrame()
    await nextFrame()
    report.scroll100k = await scroll('y', 120)
    report.paste1000 = await paste(1000)

    report.seed1000cols = seed(1000, 1000)
    await nextFrame()
    await nextFrame()
    report.scroll1000cols = await scroll('x', 90)

    grid?.freezeRows(2)
    grid?.freezeColumns(3)
    await nextFrame()
    report.frozenScroll = await scroll('y', 90)
    return report
  } catch (error) {
    report.error = error instanceof Error ? error.message : String(error)
    return report
  }
}

const api: BenchApi = {
  ready: true,
  seed,
  scroll,
  paste,
  runAll,
}
window.__bench = api

runButton.addEventListener('click', async () => {
  runButton.disabled = true
  out.textContent = '运行中…（10 万行初始化 → 滚动 → 粘贴 → 1000 列 → 冻结组合）'
  const report = await runAll()
  out.textContent = JSON.stringify(report, null, 2)
  runButton.disabled = false
})
