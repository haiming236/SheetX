/** 并行计算：纯任务语义、Worker 协议、主线程降级与 revision 竞态 */
import { describe, it, expect } from 'vitest'
import {
  StaleResultError,
  WorkerMessageType,
  createComputeRunner,
  filterRows,
  sortRows,
  aggregateRows,
  isWorkerResponse,
  type CalculateRequest,
} from '../src/index.js'

const rows = [
  { id: 'r1', name: '香蕉', qty: 20, category: '水果' },
  { id: 'r2', name: '苹果', qty: 10, category: '水果' },
  { id: 'r3', name: '笔记本', qty: 5, category: '数码' },
  { id: 'r4', name: null, qty: null, category: '水果' },
]

describe('纯计算任务', () => {
  it('排序：数值/中文/空值恒后，desc 反转', () => {
    expect(sortRows({ rows, field: 'qty' }).map((row) => row.id)).toEqual(['r3', 'r2', 'r1', 'r4'])
    expect(sortRows({ rows, field: 'qty', dir: 'desc' }).map((row) => row.id)).toEqual(['r1', 'r2', 'r3', 'r4'])
    // 中文按拼音：笔记本(bi) < 苹果(ping) < 香蕉(xiang)
    expect(sortRows({ rows, field: 'name' }).map((row) => row.id)).toEqual(['r3', 'r2', 'r1', 'r4'])
    expect(rows[0]!.id).toBe('r1') // 原数组未改
  })

  it('筛选：多条件 AND，支持数字/文本/包含', () => {
    expect(filterRows({
      rows,
      conditions: [
        { field: 'category', op: 'eq', value: '水果' },
        { field: 'qty', op: 'gte', value: 10 },
      ],
    }).map((row) => row.id)).toEqual(['r1', 'r2'])
    expect(filterRows({
      rows,
      conditions: [{ field: 'name', op: 'contains', value: '蕉' }],
    }).map((row) => row.id)).toEqual(['r1'])
  })

  it('聚合：sum / avg / count 忽略无效数值', () => {
    expect(aggregateRows({ rows, field: 'qty', op: 'sum' })).toBe(35)
    expect(aggregateRows({ rows, field: 'qty', op: 'avg' })).toBeCloseTo(35 / 3)
    expect(aggregateRows({ rows, op: 'count' })).toBe(4)
    expect(aggregateRows({ rows, field: 'missing', op: 'max' })).toBe(0)
  })
})

describe('ComputeRunner 降级与协议', () => {
  it('Node 无 Worker 时自动主线程降级且语义一致', async () => {
    const runner = createComputeRunner()
    expect(runner.mode).toBe('main')
    const sorted = await runner.run('sort', { rows, field: 'qty' })
    expect(sorted).toEqual(sortRows({ rows, field: 'qty' }))
    runner.dispose()
  })

  it('revision 倒退的过期结果直接拒绝', async () => {
    const runner = createComputeRunner({ forceMainThread: true })
    await runner.run('aggregate', { rows, op: 'count' }, 2)
    await expect(runner.run('aggregate', { rows, op: 'count' }, 1))
      .rejects.toBeInstanceOf(StaleResultError)
    runner.dispose()
  })

  it('注入 Worker：请求带 id/revision/task，返回结果', async () => {
    class FakeWorker {
      onmessage: ((event: MessageEvent) => void) | null = null
      onerror: ((event: ErrorEvent) => void) | null = null
      requests: CalculateRequest[] = []
      postMessage(message: CalculateRequest): void {
        this.requests.push(message)
        setTimeout(() => this.onmessage?.({
          data: {
            type: WorkerMessageType.RESULT,
            id: message.id,
            revision: message.revision,
            ok: true,
            result: 'ok',
          },
        } as MessageEvent), 0)
      }
      terminate(): void {}
    }
    const fake = new FakeWorker()
    const runner = createComputeRunner({ worker: fake as unknown as Worker })
    expect(runner.mode).toBe('worker')
    await expect(runner.run('aggregate', { rows, op: 'count' }, 7)).resolves.toBe('ok')
    expect(fake.requests[0]).toMatchObject({ type: 'CALCULATE', revision: 7, task: 'aggregate' })
    runner.dispose()
  })

  it('Worker 返回 ERROR 时拒绝并保留消息', async () => {
    class ErrorWorker {
      onmessage: ((event: MessageEvent) => void) | null = null
      onerror: ((event: ErrorEvent) => void) | null = null
      postMessage(message: CalculateRequest): void {
        setTimeout(() => this.onmessage?.({
          data: {
            type: WorkerMessageType.ERROR,
            id: message.id,
            revision: message.revision,
            ok: false,
            message: 'worker 内部错误',
          },
        } as MessageEvent), 0)
      }
      terminate(): void {}
    }
    const runner = createComputeRunner({ worker: new ErrorWorker() as unknown as Worker })
    await expect(runner.run('filter', { rows, conditions: [] })).rejects.toThrow(/worker 内部错误/)
    runner.dispose()
  })

  it('isWorkerResponse 过滤非法消息', () => {
    expect(isWorkerResponse({ type: 'RESULT', id: 1, revision: 1, ok: true, result: 1 })).toBe(true)
    expect(isWorkerResponse({ type: 'PING' })).toBe(false)
    expect(isWorkerResponse(null)).toBe(false)
  })
})
