/**
 * @sheetx/worker - 增量消息协议
 *
 * 纪律：主线程与 Worker 之间只传「任务 + 增量数据 + revision」，
 * 绝不反复传完整表格快照（正式方案第四部分）。
 */

export const WorkerMessageType = {
  CALCULATE: 'CALCULATE',
  RESULT: 'RESULT',
  ERROR: 'ERROR',
} as const

export type WorkerTaskType = 'sort' | 'filter' | 'aggregate'

export interface CalculateRequest<T = unknown> {
  type: typeof WorkerMessageType.CALCULATE
  /** 请求序号，用于匹配响应 */
  id: number
  /** 数据版本；responses 里回传，调用方可丢弃过期结果 */
  revision: number
  task: WorkerTaskType
  payload: T
}

export interface WorkerResult<T = unknown> {
  type: typeof WorkerMessageType.RESULT
  id: number
  revision: number
  ok: true
  result: T
}

export interface WorkerError {
  type: typeof WorkerMessageType.ERROR
  id: number
  revision: number
  ok: false
  message: string
}

export type WorkerRequest = CalculateRequest
export type WorkerResponse = WorkerResult | WorkerError

export function isWorkerResponse(value: unknown): value is WorkerResponse {
  if (!value || typeof value !== 'object') return false
  const message = value as Partial<WorkerResponse>
  return message.type === WorkerMessageType.RESULT || message.type === WorkerMessageType.ERROR
}
