/** M4 打印：分页 + 矢量导出（纯逻辑，零 DOM 依赖） */
import { describe, it, expect } from 'vitest'
import { paginatePrint, renderPrintSvg, renderPrintSvgPage, renderPrintHtml } from '../src/print.js'
import type { PrintSource } from '../src/print.js'

function makeSource(rowCount = 200, colCount = 3): PrintSource {
  return {
    rowCount,
    colCount,
    rowHeight: () => 30,
    colWidth: () => 100,
    cellText: (row, col) => `R${row + 1}C${col + 1}`,
    sheetName: '销售明细',
  }
}

describe('paginatePrint · 分页', () => {
  it('A4 纵向按内容尺寸切行，页内连续无重复', () => {
    const pages = paginatePrint(makeSource(), {})
    expect(pages.length).toBeGreaterThan(3)
    const seen = pages.flatMap((page) => page.rows)
    expect(seen).toHaveLength(200)
    expect(new Set(seen).size).toBe(200)
    expect(seen[0]).toBe(0)
    expect(seen[seen.length - 1]).toBe(199)
    // 每页都在纸张像素范围内
    for (const page of pages) {
      expect(page.paperWidth).toBeCloseTo(210 * 96 / 25.4, 1)
      expect(page.paperHeight).toBeCloseTo(297 * 96 / 25.4, 1)
      expect(page.rows.length * 30).toBeLessThanOrEqual(page.printableHeight / page.scale + 0.01)
    }
  })

  it('横向纸张可容纳更多列（列分页方向正确）', () => {
    const portrait = paginatePrint(makeSource(5, 20), {})[0]!
    const landscape = paginatePrint(makeSource(5, 20), { orientation: 'landscape' })[0]!
    expect(landscape.cols.length).toBeGreaterThan(portrait.cols.length)
    expect(landscape.paperWidth).toBeGreaterThan(landscape.paperHeight)
  })

  it('repeatRows / repeatCols 每页重复且不占主区配额', () => {
    const pages = paginatePrint(makeSource(200, 20), { repeatRows: 2, repeatCols: 1 })
    expect(pages.length).toBeGreaterThan(1)
    for (const page of pages) {
      expect(page.repeatRows).toEqual([0, 1])
      expect(page.repeatCols).toEqual([0])
      expect(page.rows.every((row) => row >= 2)).toBe(true)
      expect(page.cols.every((col) => col >= 1)).toBe(true)
    }
  })

  it('scale=0.5 使每页行数约翻倍', () => {
    const normal = paginatePrint(makeSource())[0]!.rows.length
    const half = paginatePrint(makeSource(), { scale: 0.5 })[0]!.rows.length
    expect(half).toBeGreaterThan(normal * 1.8)
  })

  it('单行超过可用高度时独占一页（不死循环/不空白页）', () => {
    const source: PrintSource = { ...makeSource(3, 2), rowHeight: () => 10_000 }
    const pages = paginatePrint(source, {})
    expect(pages).toHaveLength(3)
    expect(pages.map((page) => page.rows)).toEqual([[0], [1], [2]])
  })

  it('页眉页脚占用可打印高度', () => {
    const plain = paginatePrint(makeSource())[0]!
    const withHeader = paginatePrint(makeSource(), { header: 'x', footer: 'y' })[0]!
    expect(withHeader.printableHeight).toBeLessThan(plain.printableHeight)
    expect(withHeader.headerHeight).toBeGreaterThan(0)
    expect(withHeader.footerHeight).toBeGreaterThan(0)
  })
})

describe('renderPrintSvg · 矢量输出', () => {
  it('生成 <text>/<rect> 而非位图，坐标按行高/列宽正确累加', () => {
    const source = makeSource(2, 2)
    const pages = paginatePrint(source, {})
    const svg = renderPrintSvgPage(source, pages[0]!, pages.length)
    expect(svg).toContain('<svg')
    expect(svg).toContain('viewBox=')
    expect(svg).toContain('<text')
    expect(svg).not.toContain('<image')
    expect(svg).not.toContain('base64')
    expect(svg).toContain('R1C1')
    expect(svg).toContain('R2C2')
    // 首格文本 y ≈ rowHeight/2 (15) + fontSize*0.35 (4.2) ≈ 19.2（不含页面 translate）
    expect(svg).toMatch(/<text x="4.00" y="19\.20"/)
    // 坐标回归：第 2 列 x = 列宽 100 + 4 = 104；第 2 行 y = 30 + 15 + 4.2 = 49.2
    // 历史 bug：x 恒为 0、列宽被当成行高累加 —— 只断言「包含文本」抓不到，必须断言坐标
    expect(svg).toMatch(/<text x="104\.00" y="19\.20"/)
    expect(svg).toMatch(/<text x="4\.00" y="49\.20"/)
    expect(svg).toMatch(/<text x="104\.00" y="49\.20"/)
  })

  it('页眉页脚模板变量替换，页码总数正确', () => {
    const source = makeSource(200, 3)
    const pages = paginatePrint(source, { header: '{sheet} · 第 {page} / {pages} 页', footer: '{date}' })
    const last = renderPrintSvgPage(source, pages[pages.length - 1]!, pages.length)
    expect(last).toContain(`第 ${pages.length} / ${pages.length} 页`)
    expect(last).toContain('销售明细')
    expect(last).toMatch(/\d{4}-\d{2}-\d{2}/)
  })

  it('XML 特殊字符转义，不破坏 SVG 结构', () => {
    const source: PrintSource = {
      ...makeSource(1, 1),
      cellText: () => '<&"\' > 测试',
    }
    const svg = renderPrintSvg(source, {})[0]!
    expect(svg).toContain('&lt;&amp;&quot;&apos; &gt; 测试')
    expect(svg.match(/<text/g)).toHaveLength(1)
  })

  it('背景色与粗体样式透传到矢量元素', () => {
    const source: PrintSource = {
      ...makeSource(1, 1),
      cellStyle: () => ({ background: '#ff0000', color: '#00ff00', bold: true, align: 'right' }),
    }
    const svg = renderPrintSvg(source, {})[0]!
    expect(svg).toContain('fill="#ff0000"')
    expect(svg).toContain('fill="#00ff00"')
    expect(svg).toContain('font-weight="600"')
    expect(svg).toContain('text-anchor="end"')
  })

  it('renderPrintSvg 每页一个 SVG，顺序即页码', () => {
    const svgs = renderPrintSvg(makeSource(), {})
    expect(svgs).toHaveLength(paginatePrint(makeSource(), {}).length)
    for (const svg of svgs) expect(svg.startsWith('<svg')).toBe(true)
  })
})

describe('renderPrintHtml · 浏览器打印', () => {
  it('@page 规则 + 每页分页符 + 内联矢量 SVG', () => {
    const html = renderPrintHtml(makeSource(), { header: 'x' })
    expect(html).toContain('@page')
    expect(html).toContain('break-after:page')
    expect(html).toContain('<svg')
    expect((html.match(/class="sx-page"/g) ?? []).length).toBe(paginatePrint(makeSource(), { header: 'x' }).length)
    expect(html).toContain('<title>销售明细</title>')
  })
})
