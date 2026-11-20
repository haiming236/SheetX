/**
 * @sheetx/worker - 计算运行器
 *
 * 浏览器：内联 Worker（Blob URL，零构建产物）承载 sort/filter/aggregate；
 * Node/禁用 Worker：主线程降级，先让出一次宏任务再执行同样纯函数。
 * 所有请求带 revision，旧版本结果直接拒绝，避免慢 Worker 覆盖新数据。
 */
import {
  WorkerMessageType,
  isWorkerResponse,
  type CalculateRequest,
  type WorkerTaskType,
} from './protocol.js'
import { runTask } from './tasks.js'

export type ComputeRunnerMode = 'worker' | 'main'

export interface ComputeRunnerOptions {
  /** 注入 Worker（测试/宿主自建 worker 场景） */
  worker?: Worker
  /** 强制主线程降级 */
  forceMainThread?: boolean
}

interface Pending {
  resolve: (value: unknown) => void
  reject: (reason: Error) => void
  task: WorkerTaskType
}

export class StaleResultError extends Error {
  constructor(task: WorkerTaskType, revision: number, latest: number) {
    super(`[SheetX] 丢弃过期 ${task} 结果：revision ${revision} < ${latest}`)
    this.name = 'StaleResultError'
  }
}

export interface ComputeRunner {
  readonly mode: ComputeRunnerMode
  run<T = unknown>(task: WorkerTaskType, payload: unknown, revision?: number): Promise<T>
  dispose(): void
}

const WORKER_SOURCE = `
function compareValues(a, b) {
  if (a === b) return 0;
  if (a === null || a === undefined || a === '') return 1;
  if (b === null || b === undefined || b === '') return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), 'zh-CN', { numeric: true });
}
function comparable(v) {
  if (typeof v === 'number') return v;
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v);
  return String(v === null || v === undefined ? '' : v);
}
function sortRows(p) {
  var dir = p.dir || 'asc';
  return p.rows.slice().sort(function (a, b) {
    var left = a[p.field];
    var right = b[p.field];
    var leftEmpty = left === null || left === undefined || left === '';
    var rightEmpty = right === null || right === undefined || right === '';
    if (leftEmpty && rightEmpty) return 0;
    if (leftEmpty) return 1;
    if (rightEmpty) return -1;
    var delta = compareValues(left, right);
    return dir === 'desc' ? -delta : delta;
  });
}
function filterRows(p) {
  return p.rows.filter(function (row) {
    return p.conditions.every(function (c) {
      var left = comparable(row[c.field]);
      var right = comparable(c.value);
      switch (c.op) {
        case 'eq': return left === right;
        case 'ne': return left !== right;
        case 'gt': return left > right;
        case 'gte': return left >= right;
        case 'lt': return left < right;
        case 'lte': return left <= right;
        case 'contains': return String(left).indexOf(String(right)) >= 0;
        default: return false;
      }
    });
  });
}
function aggregateRows(p) {
  if (p.op === 'count') return p.rows.length;
  if (!p.field) return 0;
  var values = p.rows
    .map(function (row) { return row[p.field]; })
    .filter(function (v) { return typeof v === 'number' || (typeof v === 'string' && v.trim() !== ''); })
    .map(Number)
    .filter(function (v) { return isFinite(v); });
  if (values.length === 0) return 0;
  if (p.op === 'sum') return values.reduce(function (s, v) { return s + v; }, 0);
  if (p.op === 'avg') return values.reduce(function (s, v) { return s + v; }, 0) / values.length;
  if (p.op === 'min') return Math.min.apply(null, values);
  if (p.op === 'max') return Math.max.apply(null, values);
  return 0;
}
self.onmessage = function (event) {
  var msg = event.data;
  if (!msg || msg.type !== 'CALCULATE') return;
  try {
    var result;
    if (msg.task === 'sort') result = sortRows(msg.payload);
    else if (msg.task === 'filter') result = filterRows(msg.payload);
    else if (msg.task === 'aggregate') result = aggregateRows(msg.payload);
    else throw new Error('未知计算任务: ' + msg.task);
    self.postMessage({ type: 'RESULT', id: msg.id, revision: msg.revision, ok: true, result: result });
  } catch (err) {
    self.postMessage({ type: 'ERROR', id: msg.id, revision: msg.revision, ok: false,
      message: String(err && err.message || err) });
  }
};
`

const yieldToMain = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0))

export function createComputeRunner(options: ComputeRunnerOptions = {}): ComputeRunner {
  let worker = options.worker ?? null
  let ownsWorker = false
  let objectUrl: string | null = null

  if (!options.forceMainThread && !worker && typeof Worker !== 'undefined' && typeof Blob !== 'undefined' && typeof URL?.createObjectURL === 'function') {
    objectUrl = URL.createObjectURL(new Blob([WORKER_SOURCE], { type: 'text/javascript' }))
    worker = new Worker(objectUrl)
    ownsWorker = true
  }

  const mode: ComputeRunnerMode = worker ? 'worker' : 'main'
  const pending = new Map<number, Pending>()
  const latestRevision = new Map<WorkerTaskType, number>()
  let sequence = 0
  let disposed = false

  const failPending = (error: Error): void => {
    for (const entry of pending.values()) entry.reject(error)
    pending.clear()
  }

  if (worker) {
    worker.onmessage = (event: MessageEvent<unknown>): void => {
      const message: unknown = event.data
      if (!isWorkerResponse(message)) return
      const entry = pending.get(message.id)
      if (!entry) return
      pending.delete(message.id)
      if (message.ok === false) {
        entry.reject(new Error(message.message))
      } else if (message.revision < (latestRevision.get(entry.task) ?? -Infinity)) {
        entry.reject(new StaleResultError(entry.task, message.revision, latestRevision.get(entry.task)!))
      } else {
        entry.resolve(message.result)
      }
    }
    worker.onerror = (event: ErrorEvent): void => {
      failPending(new Error(event.message || '[SheetX] Worker 运行失败'))
    }
  }

  return {
    mode,

    async run<T>(task: WorkerTaskType, payload: unknown, revision?: number): Promise<T> {
      if (disposed) throw new Error('[SheetX] ComputeRunner 已销毁')
      const id = ++sequence
      const nextRevision = revision ?? id
      const latest = latestRevision.get(task) ?? -Infinity
      if (nextRevision < latest) throw new StaleResultError(task, nextRevision, latest)
      latestRevision.set(task, nextRevision)

      if (!worker) {
        await yieldToMain()
        return runTask(task, payload) as T
      }

      const request: CalculateRequest = {
        type: WorkerMessageType.CALCULATE,
        id,
        revision: nextRevision,
        task,
        payload,
      }
      return new Promise<T>((resolve, reject) => {
        pending.set(id, { resolve: resolve as (value: unknown) => void, reject, task })
        try {
          worker!.postMessage(request)
        } catch (error) {
          pending.delete(id)
          reject(error instanceof Error ? error : new Error(String(error)))
        }
      })
    },

    dispose(): void {
      if (disposed) return
      disposed = true
      failPending(new Error('[SheetX] ComputeRunner 已销毁'))
      if (worker) {
        worker.onmessage = null
        worker.onerror = null
        if (ownsWorker) {
          worker.terminate()
          if (objectUrl) URL.revokeObjectURL(objectUrl)
        }
      }
    },
  }
}
