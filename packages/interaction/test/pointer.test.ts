// @vitest-environment jsdom
/**
 * PointerController 坐标契约测试
 *
 * 背景（真实缺陷回归）：格子引擎 DOM 为
 *   root(overflow:hidden) > scrollDiv(overflow:auto) > spacer + canvas(pointer-events:none)
 * 鼠标事件的 target 是**已滚动的 scrollDiv/spacer**，若用 event.offsetX/offsetY，
 * 其中已含 scrollLeft/scrollTop；布局层 hitTest 又按视口坐标再叠加一次 scroll，
 * 双重偏移导致「滚动后点击/双击/拖选全部错位 scrollTop/rowHeight 行」。
 *
 * 本测试锁定三点：
 * 1. 传入 hitTest 的坐标是「容器相对视口坐标」，与内容滚动量无关；
 * 2. dblclick 走同一套换算；
 * 3. pointerdown 后容器获得焦点（键盘导航才有接收方）。
 */
import { describe, it, expect, afterEach } from 'vitest'
import { PointerController } from '../src/pointer.js'
import { InputController } from '../src/input-controller.js'
import { SelectionModel } from '../src/selection.js'
import { InteractionStateMachine } from '../src/fsm.js'
import type { InteractionCallbacks, Point } from '../src/types.js'

function makeCallbacks(sink: Point[]): InteractionCallbacks {
  return {
    hitTest: (point) => {
      sink.push(point)
      return { kind: 'cell', row: 0, col: 0 }
    },
    getCellRect: () => ({ x: 0, y: 0, width: 80, height: 30 }),
    getContentSize: () => ({ width: 800, height: 6000 }),
    getRowCount: () => 200,
    getColCount: () => 10,
    isCellEditable: () => true,
    getScroll: () => ({ x: 0, y: 0 }),
    scrollBy: () => {},
    onCommand: () => {},
    onSelectionChange: () => {},
    onEditStart: () => {},
    onResize: () => {},
    getCopyData: () => null,
  }
}

const CONTAINER_RECT = { left: 100, top: 50, width: 800, height: 400, right: 900, bottom: 450, x: 100, y: 50 }

function makeContainer(): HTMLElement {
  const container = document.createElement('div')
  container.tabIndex = 0
  container.getBoundingClientRect = () => ({ ...CONTAINER_RECT, toJSON: () => CONTAINER_RECT }) as DOMRect
  document.body.appendChild(container)
  return container
}

function pointerDown(container: HTMLElement, clientX: number, clientY: number): void {
  container.dispatchEvent(new MouseEvent('pointerdown', { clientX, clientY, button: 0, bubbles: true }))
}

let cleanup: HTMLElement[] = []
afterEach(() => {
  cleanup.forEach((node) => node.remove())
  cleanup = []
})

describe('PointerController · 容器相对视口坐标', () => {
  it('滚动后点击：hitTest 收到的坐标不含内容滚动量', () => {
    const container = makeContainer()
    cleanup.push(container)
    // 模拟内容已滚动 300px（scrollDiv 的 scrollTop），但 root 自身不滚动
    const inner = document.createElement('div')
    inner.className = 'sx-grid-scroll'
    container.appendChild(inner)

    const points: Point[] = []
    const controller = new PointerController()
    controller.attach(container, makeCallbacks(points), new SelectionModel({ rowCount: 200, colCount: 10 }), new InteractionStateMachine())

    // clientX/Y 是视口坐标；容器位于 (100, 50) → 容器内坐标应为 (50, 70)
    pointerDown(container, 150, 120)

    expect(points).toHaveLength(1)
    expect(points[0]).toEqual({ x: 50, y: 70 })
    controller.detach()
  })

  it('dblclick 走同一套坐标换算', () => {
    const container = makeContainer()
    cleanup.push(container)
    const points: Point[] = []
    const controller = new PointerController()
    controller.attach(container, makeCallbacks(points), new SelectionModel({ rowCount: 200, colCount: 10 }), new InteractionStateMachine())

    container.dispatchEvent(new MouseEvent('dblclick', { clientX: 260, clientY: 190, bubbles: true }))

    expect(points[0]).toEqual({ x: 160, y: 140 })
    controller.detach()
  })

  it('pointerdown 后容器获得焦点（键盘导航前提）', () => {
    const container = makeContainer()
    cleanup.push(container)
    const controller = new PointerController()
    controller.attach(container, makeCallbacks([]), new SelectionModel({ rowCount: 200, colCount: 10 }), new InteractionStateMachine())

    pointerDown(container, 150, 120)

    expect(document.activeElement).toBe(container)
    controller.detach()
  })
})

describe('InputController · 键盘接线', () => {
  it('attach 后容器 keydown 驱动选区移动（监听器 this 绑定回归）', () => {
    const container = makeContainer()
    cleanup.push(container)
    const controller = new InputController()
    controller.attach(container, makeCallbacks([]))
    controller.selection.setAnchor(2, 1)

    // 历史缺陷：handleKeydown 曾是原型方法，作为监听器时 this=container，
    // this.callbacks 为 undefined，所有键位静默失效。
    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }))

    expect(controller.selection.getFocusCell()).toEqual({ row: 3, col: 1 })
    // 普通方向键是「移动」：选区收敛为单格（历史缺陷：extend 写死 true 导致不断扩选）
    expect(controller.selection.getActiveRange()).toEqual({ start: { row: 3, col: 1 }, end: { row: 3, col: 1 } })
    controller.detach()
  })

  it('普通方向键移动、Shift+方向键扩展（Excel 语义）', () => {
    const container = makeContainer()
    cleanup.push(container)
    const controller = new InputController()
    controller.attach(container, makeCallbacks([]))
    controller.selection.setAnchor(5, 2)

    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    expect(controller.selection.getActiveRange()).toEqual({ start: { row: 6, col: 2 }, end: { row: 6, col: 2 } })

    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', shiftKey: true, bubbles: true }))
    expect(controller.selection.getActiveRange()).toEqual({ start: { row: 6, col: 2 }, end: { row: 7, col: 2 } })
    controller.detach()
  })

  it('Shift+ArrowRight 扩选、Home/End 跳到行列边界', () => {
    const container = makeContainer()
    cleanup.push(container)
    const controller = new InputController()
    controller.attach(container, makeCallbacks([]))
    controller.selection.setAnchor(4, 3)

    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', shiftKey: true, bubbles: true }))
    const range = controller.selection.getActiveRange()
    expect(range).toEqual({ start: { row: 4, col: 3 }, end: { row: 4, col: 4 } })

    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }))
    expect(controller.selection.getFocusCell()).toEqual({ row: 4, col: 0 })

    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }))
    expect(controller.selection.getFocusCell()).toEqual({ row: 4, col: 9 })
    controller.detach()
  })

  it('Ctrl+Home / Ctrl+End 跳到表首与表尾', () => {
    const container = makeContainer()
    cleanup.push(container)
    const controller = new InputController()
    controller.attach(container, makeCallbacks([]))
    controller.selection.setAnchor(5, 3)

    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', ctrlKey: true, bubbles: true }))
    expect(controller.selection.getFocusCell()).toEqual({ row: 0, col: 0 })

    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', ctrlKey: true, bubbles: true }))
    expect(controller.selection.getFocusCell()).toEqual({ row: 199, col: 9 })
    controller.detach()
  })

  it('Ctrl+方向键通过 getEdgeCell 跳到数据边界', () => {
    const container = makeContainer()
    cleanup.push(container)
    const sink: Point[] = []
    const callbacks: InteractionCallbacks = {
      ...makeCallbacks(sink),
      getEdgeCell: (row, col, dr, dc) => ({ row: row + dr * 7, col: col + dc * 2 }),
    }
    const controller = new InputController()
    controller.attach(container, callbacks)
    controller.selection.setAnchor(3, 2)

    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', ctrlKey: true, bubbles: true }))
    expect(controller.selection.getFocusCell()).toEqual({ row: 10, col: 2 })

    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', ctrlKey: true, bubbles: true }))
    expect(controller.selection.getFocusCell()).toEqual({ row: 10, col: 4 })
    controller.detach()
  })
})


describe('PointerController · 列头排序热区', () => {
  it('命中 colSort 时产出 grid.command.sort 语义命令', () => {
    const container = makeContainer()
    cleanup.push(container)
    const commands: Array<{ id: string; params: unknown }> = []
    const callbacks = {
      ...makeCallbacks([]),
      hitTest: () => ({ kind: 'colSort' as const, row: -1, col: 2, handleIndex: 2 }),
      onCommand: (command: { id: string; params: unknown }) => {
        commands.push(command)
      },
    }
    const controller = new PointerController()
    controller.attach(container, callbacks, new SelectionModel({ rowCount: 20, colCount: 5 }), new InteractionStateMachine())

    pointerDown(container, 150, 120)

    expect(commands).toHaveLength(1)
    expect(commands[0]!.id).toBe('grid.command.sort')
    expect(commands[0]!.params).toEqual({ col: 2, toggle: true })
    controller.detach()
  })
})
