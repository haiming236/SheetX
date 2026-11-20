# 并行计算（Web Worker）

`@sheetx/worker` 把排序、筛选、聚合等计算搬到内联 Worker，Node / 禁用 Worker 时主线程降级。

## 基本用法

```ts
import { createComputeRunner } from '@sheetx/worker'

const runner = createComputeRunner()
runner.mode // 'worker' | 'main'

const sorted = await runner.run('sort', { rows, field: 'qty', dir: 'asc' })
const total = await runner.run<number>('aggregate', { rows, field: 'qty', op: 'sum' })
runner.dispose()
```

任务：`sort` / `filter` / `aggregate`。

## 增量消息协议

```ts
interface WorkerMessage {
  type: 'DATA_PATCH' | 'CALCULATE' | 'RESULT' | 'ERROR'
  id: number
  revision: number
  task?: WorkerTaskType
  payload?: unknown
}
```

- **只传任务 + 增量数据 + revision**，不传整表快照（改 100 格只发 100 格变更）。
- 每个请求带 `revision`；旧版本结果直接拒绝（`StaleResultError`），避免慢 Worker 覆盖新数据。
- Worker 回传 `RESULT` / `ERROR`；`isWorkerResponse()` 白名单校验。

## 主线程降级

- Node / 无 Worker / `forceMainThread: true` 时，使用同源纯函数执行（先让出一次宏任务）。
- 排序语义在两条路径完全一致：中文按拼音、空值恒后（含降序也后置）。

## 语义一致性

`sortRows` / `filterRows` / `aggregateRows` 是纯函数，主线程与 Worker 复用同一套语义，避免"Worker 一套结果、降级另一套结果"。

## 生命周期

- `dispose()` 终止自有 Worker 并 revoke ObjectURL，拒绝所有 pending 请求。
- 注入 Worker（`options.worker`）时由宿主负责终止，本类不越权。
- 自有 Worker 用内联 Blob，**零构建产物**。

## 下一步

[公式与函数](/api/formula) · [后台渲染](/advanced/offscreen) · [性能基准](/engineering/performance)
