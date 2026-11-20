/**
 * SheetX 浏览器级交互验收（任务书 §3.4 / T3）
 *
 * 注意：系统级输入法无法在 CI 里驱动，这里用真实浏览器的 CompositionEvent
 * 序列验证 IME 守卫语义（合成事件发生在真实 DOM 与真实事件循环，而非 jsdom）；
 * 剪贴板用真实 ClipboardEvent + DataTransfer，不碰 navigator.clipboard 权限。
 */
import { createGrid } from '@sheetx/grid'
import { ClipboardController, ImeGuard } from '@sheetx/interaction'
import { createComputeRunner } from '@sheetx/worker'
import { OffscreenRenderer, isOffscreenRendererAvailable } from '@sheetx/renderer'

interface CaseResult {
  name: string
  pass: boolean
  [key: string]: unknown
}

interface E2EApi {
  readonly ready: true
  runAll(): Promise<{ cases: CaseResult[]; passed: number; failed: number; browser: string }>
}

declare global {
  interface Window {
    __e2e?: E2EApi
  }
}

const host = document.getElementById('grid-host') as HTMLElement
const imeInput = document.getElementById('ime-input') as HTMLInputElement
const out = document.getElementById('out') as HTMLPreElement
const runButton = document.getElementById('run') as HTMLButtonElement

const nextFrame = (): Promise<void> => new Promise((resolve) => requestAnimationFrame(() => resolve()))

function clipboardEvent(type: string, entries: Record<string, string>): { event: ClipboardEvent; data: DataTransfer } {
  const data = new DataTransfer()
  for (const [key, value] of Object.entries(entries)) data.setData(key, value)
  return { event: new ClipboardEvent(type, { clipboardData: data, bubbles: true, cancelable: true }), data }
}

function testIme(): CaseResult {
  imeInput.value = ''
  const states: boolean[] = []
  const guard = new ImeGuard({ onStateChange: (composing) => states.push(composing) })
  guard.attach(imeInput)
  const commits: string[] = []
  const tryCommit = (event: KeyboardEvent): void => {
    if (guard.shouldSuppressKeyEvent(event)) return
    commits.push(imeInput.value)
  }

  imeInput.dispatchEvent(new CompositionEvent('compositionstart', { data: '', bubbles: true }))
  imeInput.dispatchEvent(new CompositionEvent('compositionupdate', { data: 'ni', bubbles: true }))
  imeInput.value = 'ni'
  const composingKeydown = new KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true, cancelable: true })
  const suppressed = guard.isComposing() && guard.shouldSuppressKeyEvent(composingKeydown)
  tryCommit(composingKeydown)

  imeInput.dispatchEvent(new CompositionEvent('compositionend', { data: '你好', bubbles: true }))
  imeInput.value = '你好'
  tryCommit(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))

  // 跨组合取消判定：上一次结束是「你好」，这次 end 与上次相同 => 视为取消
  imeInput.dispatchEvent(new CompositionEvent('compositionstart', { data: '', bubbles: true }))
  imeInput.dispatchEvent(new CompositionEvent('compositionupdate', { data: '你好', bubbles: true }))
  imeInput.dispatchEvent(new CompositionEvent('compositionend', { data: '你好', bubbles: true }))
  const canceled = guard.wasCanceled()

  const pass = suppressed && commits.length === 1 && commits[0] === '你好' &&
    !guard.isComposing() && states.join(',') === 'true,false,true,false' && canceled
  guard.detach()
  return { name: 'IME 组合期间不提交 / 结束后提交一次 / Esc 取消识别', pass, states, commits, suppressed, canceled }
}

async function testClipboard(): Promise<CaseResult> {
  const container = document.createElement('div')
  document.body.appendChild(container)
  let pasted: string[][] | null = null
  let meta: string | null = null
  const controller = new ClipboardController()
  controller.attach(container, {
    getCopyData: () => ({ text: '苹果\t100\n香蕉\t200' }),
    getPasteTarget: () => ({ row: 0, col: 0 }),
    onPaste: (matrix, pasteMeta) => {
      pasted = matrix.map((row) => [...row])
      meta = pasteMeta.format
    },
    onCut: () => {},
  })

  const tsv = clipboardEvent('paste', { 'text/plain': '苹果\t100\n香蕉\t200' })
  container.dispatchEvent(tsv.event)
  const tsvPass = JSON.stringify(pasted) === JSON.stringify([['苹果', '100'], ['香蕉', '200']]) && meta === 'tsv'

  const html = clipboardEvent('paste', {
    'text/html': '<table><tr><td>A</td><td>B</td></tr><tr><td>C</td><td>D</td></tr></table>',
    'text/plain': '应被 HTML 覆盖',
  })
  container.dispatchEvent(html.event)
  const htmlPass = JSON.stringify(pasted) === JSON.stringify([['A', 'B'], ['C', 'D']]) && meta === 'html'

  const copy = clipboardEvent('copy', {})
  container.dispatchEvent(copy.event)
  const copyPass = copy.data.getData('text/plain') === '苹果\t100\n香蕉\t200'

  controller.detach()
  container.remove()
  return {
    name: 'Excel TSV / HTML 粘贴优先级 + 复制写出 TSV',
    pass: tsvPass && htmlPass && copyPass,
    tsvPass,
    htmlPass,
    copyPass,
    pasted,
    meta,
  }
}

function makeGrid(): { grid: ReturnType<typeof createGrid>; root: HTMLElement } {
  host.replaceChildren()
  const grid = createGrid({
    container: host,
    columns: [{ key: 'a', title: 'A' }, { key: 'b', title: 'B' }],
    data: [
      { id: 'r0', a: '1', b: '2' },
      { id: 'r1', a: '3', b: '4' },
      { id: 'r2', a: '5', b: '6' },
    ],
  })
  const root = host.querySelector('.sx-grid') as HTMLElement
  return { grid, root }
}

async function testGridPaste(): Promise<CaseResult> {
  const { grid, root } = makeGrid()
  const paste = clipboardEvent('paste', { 'text/plain': 'X\tY\nZ\tW' })
  root.dispatchEvent(paste.event)
  await nextFrame()
  const values = [grid.getValue('r0', 'a'), grid.getValue('r0', 'b'), grid.getValue('r1', 'a'), grid.getValue('r1', 'b')]
  const pass = values.join(',') === 'X,Y,Z,W'
  grid.destroy()
  return { name: '真实 paste 事件 → Grid mutation → 单元格值', pass, values }
}

async function testKeyboard(): Promise<CaseResult> {
  const { grid, root } = makeGrid()
  root.focus()
  const before = grid.getSelectedRange()
  root.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }))
  await nextFrame()
  const afterRight = grid.getSelectedRange()
  root.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
  await nextFrame()
  const afterEnter = grid.getSelectedRange()
  const pass = before?.start.col === 0 && afterRight?.start.col === 1 && afterEnter?.start.row === 1
  grid.destroy()
  return {
    name: '方向键 / Enter 导航符合 Excel 习惯',
    pass,
    before: { row: before?.start.row, col: before?.start.col },
    afterRight: { row: afterRight?.start.row, col: afterRight?.start.col },
    afterEnter: { row: afterEnter?.start.row, col: afterEnter?.start.col },
  }
}

async function testWorker(): Promise<CaseResult> {
  const runner = createComputeRunner()
  const rows = [
    { id: 'r1', qty: 20 },
    { id: 'r2', qty: 10 },
    { id: 'r3', qty: 30 },
  ]
  const sorted = await runner.run<Array<{ id: string }>>('sort', { rows, field: 'qty' })
  const total = await runner.run<number>('aggregate', { rows, field: 'qty', op: 'sum' })
  const mode = runner.mode
  const pass = mode === 'worker' && sorted.map((row) => row.id).join(',') === 'r2,r1,r3' && total === 60
  runner.dispose()
  return { name: '内联 Worker 真实执行 sort / aggregate', pass, mode, sorted, total }
}

async function testOffscreenRender(): Promise<CaseResult> {
  const available = isOffscreenRendererAvailable()
  const canvas = document.createElement('canvas')
  canvas.width = 120
  canvas.height = 80
  document.body.appendChild(canvas)
  const renderer = new OffscreenRenderer()
  const mode = renderer.mode
  renderer.initialize(canvas)
  renderer.resize(120, 80)
  // 一个铺满画布的纯红矩形，中心采样应为不透明红（证明 Worker 真画上了）
  const scene = {
    viewport: { x: 0, y: 0, width: 120, height: 80 },
    dpr: 1,
    layers: [{ id: 'bg', zIndex: 0, commands: [{ t: 'rect', x: 0, y: 0, w: 120, h: 80, fill: '#ff0000' }] }],
  }
  renderer.render(scene as Parameters<typeof renderer.render>[0])
  const stats = await renderer.waitForStats()
  const sample = stats.sample
  const pass = available && mode === 'worker' && !!sample &&
    sample[0] > 200 && sample[1] < 60 && sample[2] < 60 && sample[3] > 200
  renderer.destroy()
  canvas.remove()
  return {
    name: 'OffscreenCanvas 工作线程真实渲染（中心像素回传）',
    pass,
    available,
    mode,
    sample,
    drawCalls: stats.drawCalls,
  }
}

async function runAll(): Promise<{ cases: CaseResult[]; passed: number; failed: number; browser: string }> {
  const cases: CaseResult[] = []
  const run = async (fn: () => CaseResult | Promise<CaseResult>): Promise<void> => {
    try {
      cases.push(await fn())
    } catch (error) {
      cases.push({ name: '未命名用例', pass: false, error: error instanceof Error ? error.message : String(error) })
    }
  }
  await run(testIme)
  await run(testClipboard)
  await run(testGridPaste)
  await run(testKeyboard)
  await run(testWorker)
  await run(testOffscreenRender)
  return {
    cases,
    passed: cases.filter((item) => item.pass).length,
    failed: cases.filter((item) => !item.pass).length,
    browser: navigator.userAgent,
  }
}

window.__e2e = { ready: true, runAll }

runButton.addEventListener('click', async () => {
  runButton.disabled = true
  out.textContent = '运行中…'
  const report = await runAll()
  out.textContent = JSON.stringify(report, null, 2)
  runButton.disabled = false
})
