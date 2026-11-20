import { describe, it, expect } from 'vitest'
import { FenwickTree } from '../src/layout/fenwick.js'
import { RowModel } from '../src/layout/row-model.js'
import { ColumnModel } from '../src/layout/col-model.js'
import { GridLayout, ROW_HEADER_WIDTH, COL_HEADER_HEIGHT } from '../src/layout/grid-layout.js'

describe('FenwickTree', () => {
  it('前缀和与点更新', () => {
    const tree = new FenwickTree(6, (i) => (i + 1) * 10) // 10,20,...,60
    expect(tree.prefixSum(0)).toBe(10)
    expect(tree.prefixSum(5)).toBe(210)
    tree.add(2, -5) // 第3个元素 30→25
    expect(tree.prefixSum(5)).toBe(205)
    expect(tree.get(2)).toBe(25)
  })

  it('按前缀和逆查（滚动定位）', () => {
    // 行高 [10, 20, 30, 40]：偏移 0/10/30/60，总 100
    const tree = new FenwickTree(4, (i) => (i + 1) * 10)
    expect(tree.findIndexByPrefix(0)).toBe(0)
    expect(tree.findIndexByPrefix(9)).toBe(0)
    expect(tree.findIndexByPrefix(10)).toBe(1)
    expect(tree.findIndexByPrefix(45)).toBe(2)
    expect(tree.findIndexByPrefix(99)).toBe(3)
    expect(tree.findIndexByPrefix(1000)).toBe(3) // 越界钳制
  })

  it('百万级逆查 O(log n) 性能', () => {
    const n = 1_000_000
    const tree = new FenwickTree(n, () => 28)
    const start = performance.now()
    for (let i = 0; i < 10000; i++) {
      tree.findIndexByPrefix(i * 28)
    }
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(500) // 1 万次逆查应在 0.5s 内
  })
})

describe('RowModel', () => {
  it('可变行高：offsetOf / indexAtOffset 一致性', () => {
    const model = new RowModel()
    model.defaultHeight = 100
    model.setRowCount(5)
    model.setHeight(1, 50) // 第2行改矮
    model.setHeight(3, 200)
    // 行高 [100, 50, 100, 200, 100] → 顶部偏移 0/100/150/250/450
    expect(model.offsetOf(0)).toBe(0)
    expect(model.offsetOf(1)).toBe(100)
    expect(model.offsetOf(2)).toBe(150)
    expect(model.offsetOf(3)).toBe(250)
    expect(model.offsetOf(4)).toBe(450)
    expect(model.totalHeight).toBe(550) // 100+50+100+200+100
    // 往返：任一行的中间像素反查回该行
    for (const row of [0, 1, 2, 3, 4]) {
      const mid = model.offsetOf(row) + model.getHeight(row) / 2
      expect(model.indexAtOffset(mid)).toBe(row)
    }
  })

  it('行高变更 O(log n)：万次变更不重建', () => {
    const model = new RowModel()
    model.setRowCount(100_000)
    const start = performance.now()
    for (let i = 0; i < 10_000; i++) {
      model.setHeight(i % 100_000, 30 + (i % 20))
    }
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(200)
    expect(model.totalHeight).toBeGreaterThan(0)
  })
})

describe('ColumnModel', () => {
  it('前缀偏移与冻结列宽度', () => {
    const model = new ColumnModel()
    model.setColumns([
      { key: 'a', title: 'A', width: 120, frozen: true },
      { key: 'b', title: 'B', width: 80, frozen: true },
      { key: 'c', title: 'C' },
      { key: 'd', title: 'D', width: 150 },
    ])
    expect(model.offsetOf(0)).toBe(0)
    expect(model.offsetOf(1)).toBe(120)
    expect(model.offsetOf(3)).toBe(300) // 120+80+100
    expect(model.frozenCount).toBe(2)
    expect(model.frozenWidth).toBe(200) // 120+80
    expect(model.totalWidth).toBe(450)
    expect(model.indexAtOffset(150)).toBe(1)
    expect(model.indexAtOffset(400)).toBe(3)
  })

  it('setWidth 后重建前缀', () => {
    const model = new ColumnModel()
    model.setColumns([
      { key: 'a', title: 'A', width: 100 },
      { key: 'b', title: 'B', width: 100 },
    ])
    model.setWidth(0, 200)
    expect(model.offsetOf(1)).toBe(200)
    expect(model.totalWidth).toBe(300)
  })
})

describe('GridLayout', () => {
  function makeLayout(): GridLayout {
    const layout = new GridLayout()
    layout.rows.defaultHeight = 100
    layout.rows.setRowCount(10)
    layout.cols.setColumns([
      { key: 'a', title: 'A', width: 100 },
      { key: 'b', title: 'B', width: 100 },
      { key: 'c', title: 'C', width: 100 },
      { key: 'd', title: 'D', width: 100, frozen: true },
    ])
    // 注意：冻结列约定在最前——重设为正确顺序
    layout.cols.setColumns([
      { key: 'd', title: 'D', width: 100, frozen: true },
      { key: 'a', title: 'A', width: 100 },
      { key: 'b', title: 'B', width: 100 },
      { key: 'c', title: 'C', width: 100 },
    ])
    layout.viewportSize = { width: 800, height: 600 }
    layout.scroll = { x: 0, y: 0 }
    return layout
  }

  it('getCellRect / 命中测试往返', () => {
    const layout = makeLayout()
    const rect = layout.getCellRect(2, 2)!
    expect(rect.x).toBe(ROW_HEADER_WIDTH + 200)
    expect(rect.y).toBe(COL_HEADER_HEIGHT + 200)
    // 命中格中心 → 回到同一格
    const hit = layout.hitTest({ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 })
    expect(hit).toEqual({ kind: 'cell', row: 2, col: 2 })
    // 表头命中
    expect(layout.hitTest({ x: 10, y: 10 })).toEqual({ kind: 'corner', row: -1, col: -1 })
    expect(layout.hitTest({ x: 300, y: 10 })?.kind).toBe('colHeader')
    expect(layout.hitTest({ x: 10, y: 300 })?.kind).toBe('rowHeader')
  })

  it('滚动后命中跟随', () => {
    const layout = makeLayout()
    layout.scroll = { x: 50, y: 50 }
    // col1 内容 x=100，视口 x=48+100-50=98；row2 内容 y=200，视口 y=24+200-50=174
    const rect = layout.getCellRect(2, 1)!
    expect(rect.x).toBe(ROW_HEADER_WIDTH + 50)
    expect(rect.y).toBe(COL_HEADER_HEIGHT + 150)
    const hit = layout.hitTest({ x: rect.x + 50, y: rect.y + 50 })
    expect(hit?.kind).toBe('cell')
    expect(hit?.row).toBe(2)
    expect(hit?.col).toBe(1)
  })

  it('冻结列的视口坐标不随横向滚动', () => {
    const layout = makeLayout()
    layout.scroll = { x: 500, y: 0 }
    const frozenRect = layout.getCellRect(0, 0)!
    expect(frozenRect.x).toBe(ROW_HEADER_WIDTH) // 冻结列钉住
    const normalRect = layout.getCellRect(0, 3)!
    expect(normalRect.x).toBe(ROW_HEADER_WIDTH + layout.cols.offsetOf(3) - 500)
  })

  it('resize 手柄命中（列头右缘 3px）', () => {
    const layout = makeLayout()
    const col0Right = ROW_HEADER_WIDTH + 100
    const hit = layout.hitTest({ x: col0Right, y: 12 })
    expect(hit?.kind).toBe('colResize')
    expect((hit as { handleIndex?: number }).handleIndex).toBe(0)
  })

  it('可见窗口含缓冲', () => {
    const layout = makeLayout()
    const win = layout.getVisibleWindow()
    expect(win.firstRow).toBe(0)
    expect(win.firstCol).toBe(0)
    expect(win.lastRow).toBeGreaterThanOrEqual(4) // 600px 视口 / 100 行高 = 6 行 + 缓冲
  })
})
