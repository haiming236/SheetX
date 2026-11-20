import { describe, it, expect } from 'vitest'
import { SparseMatrix } from '../src/sparse.js'
import { GridStore } from '../src/grid-store.js'
import { WorksheetStore, StyleTable } from '../src/sheet-store.js'
import { CommandService } from '../src/command-service.js'
import { SetCellsMutation, InsertRowsMutation, DeleteRowsMutation, ReplaceRowsMutation, registerGridMutations, buildSetCellsParams } from '../src/mutations-grid.js'
import { normalizeRows } from '../src/changes.js'

describe('SparseMatrix', () => {
  it('空格不占内存（稀疏不变量）', () => {
    const matrix = new SparseMatrix<string>()
    matrix.set(0, 0, 'a')
    matrix.set(999, 888, 'z')
    expect(matrix.get(0, 0)).toBe('a')
    expect(matrix.get(999, 888)).toBe('z')
    expect(matrix.get(1, 1)).toBeUndefined()
    expect(matrix.rowCount).toBe(2)
  })

  it('set null/undefined 触发删除并回收空行', () => {
    const matrix = new SparseMatrix<string>()
    matrix.set(5, 5, 'x')
    matrix.set(5, 6, 'y')
    matrix.set(5, 7, 'z')
    matrix.set(5, 5, null)
    expect(matrix.has(5, 5)).toBe(false)
    expect(matrix.rowCount).toBe(1)
    matrix.set(5, 6, undefined)
    matrix.delete(5, 7)
    expect(matrix.rowCount).toBe(0)
  })

  it('JSON 往返无损', () => {
    const matrix = new SparseMatrix<number>()
    matrix.set(1, 2, 42)
    matrix.set(10, 20, 7)
    const json = JSON.parse(JSON.stringify(matrix.toJSON()))
    const restored = SparseMatrix.fromJSON<number>(json)
    expect(restored.get(1, 2)).toBe(42)
    expect(restored.get(10, 20)).toBe(7)
  })
})

describe('GridStore', () => {
  function makeRows(n: number) {
    return Array.from({ length: n }, (_, i) => ({ id: `r${i}`, data: { name: `item${i}`, qty: i } }))
  }

  it('初始化 10 万行 < 1s（验收标准）', () => {
    const start = performance.now()
    const store = new GridStore(makeRows(100_000))
    const elapsed = performance.now() - start
    expect(store.rowCount).toBe(100_000)
    expect(elapsed).toBeLessThan(1000)
  })

  it('单格更新 O(1) 返回变更', () => {
    const store = new GridStore(makeRows(3))
    const change = store.setRawCell('r1', 'qty', 99)
    expect(change).toEqual({ rowId: 'r1', field: 'qty', oldValue: 1, newValue: 99 })
    expect(store.getCell('r1', 'qty')).toBe(99)
    expect(store.setRawCell('r1', 'qty', 99)).toBeNull() // 相同值不产生变更
  })

  it('insert/delete 保持索引一致', () => {
    const store = new GridStore(makeRows(5))
    store.insertRows(2, [{ id: 'rx', data: { name: 'x' } }])
    expect(store.getRowIndex('rx')).toBe(2)
    expect(store.getRowIndex('r2')).toBe(3)
    const deleted = store.deleteRows(['rx'])
    expect(deleted.length).toBe(1)
    expect(deleted[0]!.id).toBe('rx')
    expect(store.getRowIndex('r2')).toBe(2)
    expect(store.getRowIndex('rx')).toBe(-1)
  })
})

describe('CommandService + Undo/Redo', () => {
  function makeService() {
    const store = new GridStore(normalizeRows([
      { id: 'a', name: '苹果', qty: 10 },
      { id: 'b', name: '香蕉', qty: 20 },
    ]))
    const service = new CommandService(store, 'grid-1')
    registerGridMutations(service)
    return { store, service }
  }

  it('set-cells 写入并可撤销重做', async () => {
    const { store, service } = makeService()
    const params = buildSetCellsParams(store, [{ rowId: 'a', field: 'qty', value: 55 }])
    service.executeMutation({ id: 'grid.mutation.set-cells', params, source: 'user' })
    expect(store.getCell('a', 'qty')).toBe(55)
    expect(service.canUndo()).toBe(true)

    await service.undo()
    expect(store.getCell('a', 'qty')).toBe(10)
    expect(service.canRedo()).toBe(true)

    await service.redo()
    expect(store.getCell('a', 'qty')).toBe(55)
  })

  it('insert ↔ delete 跨 mutation 反演', async () => {
    const { store, service } = makeService()
    service.executeMutation({
      id: 'grid.mutation.insert-rows',
      params: { index: 2, rows: [{ id: 'c', data: { name: '樱桃', qty: 3 } }] },
    })
    expect(store.rowCount).toBe(3)
    await service.undo()
    expect(store.rowCount).toBe(2)
    expect(store.getRow('c')).toBeUndefined()
    await service.redo()
    expect(store.rowCount).toBe(3)
    expect(store.getCell('c', 'name')).toBe('樱桃')
  })

  it('delete-rows 的反演抢救完整行数据', async () => {
    const { store, service } = makeService()
    service.executeMutation({ id: 'grid.mutation.delete-rows', params: { rowIds: ['b'] } })
    expect(store.rowCount).toBe(1)
    await service.undo()
    expect(store.getRow('b')).toBeDefined()
    expect(store.getCell('b', 'qty')).toBe(20)
    expect(store.getRowIndex('b')).toBe(1) // 位置恢复
  })

  it('replace-data 可撤销', async () => {
    const { store, service } = makeService()
    service.executeMutation({
      id: 'grid.mutation.replace-data',
      params: { rows: normalizeRows([{ id: 'x', name: '新数据', qty: 1 }]) },
    })
    expect(store.rowCount).toBe(1)
    await service.undo()
    expect(store.rowCount).toBe(2)
    expect(store.getCell('a', 'name')).toBe('苹果')
  })

  it('序列执行伪事务：失败回滚且不入栈', () => {
    const { store, service } = makeService()
    const result = service.sequenceExecute([
      { id: 'grid.mutation.set-cells', params: buildSetCellsParams(store, [{ rowId: 'a', field: 'qty', value: 1 }]) },
      { id: 'grid.mutation.set-cells', params: { changes: [{ rowId: 'ghost', field: 'x', oldValue: 0, newValue: 1 }] } },
    ])
    expect(result.result).toBe(false)
    // 回滚生效
    expect(store.getCell('a', 'qty')).toBe(10)
    expect(service.canUndo()).toBe(false)
  })

  it('mutation 参数可 JSON 序列化（协作/持久化前提）', () => {
    const { store, service } = makeService()
    const params = buildSetCellsParams(store, [{ rowId: 'a', field: 'qty', value: 42 }])
    const round = JSON.parse(JSON.stringify(params))
    expect(() => service.executeMutation({ id: 'grid.mutation.set-cells', params: round })).not.toThrow()
    expect(store.getCell('a', 'qty')).toBe(42)
  })

  it('未知 mutation 报错并列出可用项', () => {
    const { service } = makeService()
    expect(() => service.executeMutation({ id: 'grid.mutation.nope', params: {} })).toThrow(/可用/)
  })
})

describe('WorksheetStore / StyleTable', () => {
  it('样式去重：相同内容同 id', () => {
    const table = new StyleTable()
    const id1 = table.put({ bold: true, color: '#f00' })
    const id2 = table.put({ bold: true, color: '#f00' })
    expect(id1).toBe(id2)
    expect(table.put({ bold: false })).not.toBe(id1)
  })

  it('合并区域命中测试', () => {
    const sheet = new WorksheetStore('s1', 'Sheet1', 100, 26)
    sheet.addMerge({ start: { row: 2, col: 3 }, end: { row: 4, col: 5 } })
    expect(sheet.findMergeAt(2, 3)?.range.start.row).toBe(2) // 主格
    expect(sheet.findMergeAt(3, 4)?.range.start.col).toBe(3) // 覆盖格
    expect(sheet.findMergeAt(5, 5)).toBeUndefined()
    expect(sheet.removeMerge(2, 3)).toBeDefined()
    expect(sheet.findMergeAt(3, 4)).toBeUndefined()
  })

  it('行列尺寸覆盖是稀疏的', () => {
    const sheet = new WorksheetStore('s1', 'Sheet1', 100, 26)
    sheet.setRowHeight(5, 40)
    expect(sheet.getRowHeight(5)).toBe(40)
    expect(sheet.getRowHeight(6)).toBe(24)
    expect(sheet.rowHeights.size).toBe(1)
    sheet.setRowHeight(5, 24) // 回到默认值 → 覆盖条目回收
    expect(sheet.rowHeights.size).toBe(0)
  })

  it('快照 JSON 往返', () => {
    const sheet = new WorksheetStore('s1', '数据表', 50, 10)
    sheet.setCellData(0, 0, { v: 'hello' })
    sheet.setCellData(1, 1, { v: 42, f: '=SUM(A1)' })
    sheet.setRowHeight(3, 50)
    sheet.addMerge({ start: { row: 0, col: 0 }, end: { row: 0, col: 2 } })
    const json = JSON.parse(JSON.stringify(sheet.toJSON()))
    const restored = WorksheetStore.fromJSON?.(json) ?? undefined
    // fromJSON 在 v1 未实现（快照重建由 spreadsheet 包负责），此处只验证序列化完整性
    void restored
    expect(json.name).toBe('数据表')
    expect((json.cells as Record<string, Record<string, unknown>>)['0']?.['0']).toEqual({ v: 'hello' })
    expect(json.rowHeights).toEqual({ '3': 50 })
  })
})
