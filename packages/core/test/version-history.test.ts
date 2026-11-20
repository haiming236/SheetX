/** 版本快照与差异：数据安全（快照隔离/差异只报变化/持久化/节流） */
import { describe, it, expect, vi } from 'vitest'
import { VersionManager, SnapshotThrottler } from '../src/version-history.js'

interface Row { id: string; name: string; amount: number }

const rows = (): Row[] => [
  { id: 'r1', name: '笔记本电脑', amount: 128000 },
  { id: 'r2', name: '平板电脑', amount: 95000 },
  { id: 'r3', name: '智能手机', amount: 156000 },
  { id: 'r4', name: '显示器', amount: 72000 },
  { id: 'r5', name: '键盘鼠标', amount: 68000 },
]

describe('VersionManager', () => {
  it('快照深拷贝：后续修改原记录不污染快照', () => {
    const manager = new VersionManager<Row>()
    const source = rows()
    const snapshot = manager.capture(source, '初始版本')
    source[0]!.amount = 999
    source.push({ id: 'r6', name: '新行', amount: 1 })
    expect(snapshot.records[0]!.amount).toBe(128000)
    expect(snapshot.records).toHaveLength(5)
    expect(manager.latest()?.records[0]!.amount).toBe(128000)
  })

  it('diff 按 id 与字段给出新增/删除/修改，只报变化的单元格', () => {
    const manager = new VersionManager<Row>()
    const a = manager.capture(rows(), 'A')
    const changed = rows()
    changed[2]!.amount = 158000 // 修改一个单元格
    changed.splice(3, 1)        // 删除 r4
    changed.push({ id: 'r6', name: '新行', amount: 100 }) // 新增
    const b = manager.capture(changed, 'B')

    const diff = manager.diff(a.id, b.id)!
    expect(diff.added).toEqual(['r6'])
    expect(diff.removed).toEqual(['r4'])
    expect(diff.modified).toHaveLength(1)
    expect(diff.modified[0]!.rowId).toBe('r3')
    expect(diff.modified[0]!.cells).toEqual([{
      rowId: 'r3', field: 'amount', before: 156000, after: 158000,
    }])
    expect(diff.totalChanges).toBe(3)
  })

  it('restore 返回深拷贝，修改恢复数据不影响快照', () => {
    const manager = new VersionManager<Row>()
    const snapshot = manager.capture(rows(), '初始')
    const restored = manager.restore(snapshot.id)!
    restored[0]!.name = '篡改'
    expect(manager.get(snapshot.id)!.records[0]!.name).toBe('笔记本电脑')
    expect(manager.restore('不存在')).toBeNull()
  })

  it('序列化往返：导出后重建，历史与 diff 保持', () => {
    const manager = new VersionManager<Row>()
    const a = manager.capture(rows(), 'A')
    const changed = rows()
    changed[0]!.amount = 130000
    const b = manager.capture(changed, 'B')
    const json = manager.serialize()

    const restored = new VersionManager<Row>()
    expect(restored.deserialize(json)).toBe(true)
    expect(restored.count).toBe(2)
    expect(restored.diff(a.id, b.id)!.totalChanges).toBe(1)
  })

  it('deserialize 拒绝非法结构，不破坏现有历史', () => {
    const manager = new VersionManager<Row>()
    manager.capture(rows(), '保留')
    expect(manager.deserialize('{"bad":true}')).toBe(false)
    expect(manager.deserialize('[{"id":"x"}]')).toBe(false)
    expect(manager.count).toBe(1)
  })

  it('limit 限制历史条数（防止无限增长）', () => {
    const manager = new VersionManager<Row>(3)
    for (let i = 0; i < 10; i++) manager.capture(rows(), `v${i}`)
    expect(manager.count).toBe(3)
    expect(manager.latest()?.label).toBe('v9')
  })

  it('remove / clear', () => {
    const manager = new VersionManager<Row>()
    const a = manager.capture(rows(), 'A')
    expect(manager.remove(a.id)).toBe(true)
    expect(manager.remove(a.id)).toBe(false)
    expect(manager.count).toBe(0)
  })
})

describe('SnapshotThrottler · 高频编辑合并', () => {
  it('连续触发只执行最后一次（停止编辑 1.5s 后快照）', async () => {
    vi.useFakeTimers()
    const throttler = new SnapshotThrottler(100)
    const handler = vi.fn()
    for (let i = 0; i < 20; i++) throttler.schedule(handler)
    expect(handler).not.toHaveBeenCalled()
    expect(throttler.hasPending).toBe(true)
    await vi.advanceTimersByTimeAsync(101)
    expect(handler).toHaveBeenCalledTimes(1)
    expect(throttler.hasPending).toBe(false)
    vi.useRealTimers()
  })

  it('flush 立即落盘最后一次，不丢数据', () => {
    vi.useFakeTimers()
    const throttler = new SnapshotThrottler(1000)
    const handler = vi.fn()
    throttler.schedule(handler)
    throttler.flush()
    expect(handler).toHaveBeenCalledTimes(1)
    expect(throttler.hasPending).toBe(false)
    vi.useRealTimers()
  })
})
