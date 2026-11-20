/**
 * @sheetx/data - 撤销/重做栈
 *
 * 实现 core 的 IUndoRedoService：按 unitId 分栈的双栈结构。
 * 栈里存的是「成对的可序列化 mutation 列表」（IUndoRedoItem），而不是快照——
 * 内存开销只与变更量成正比（Luckysheet「整表快照七件套」的反面教材）。
 *
 * 实际的 mutation 回放由构造时注入的 applier 执行（CommandService），
 * 本类只负责栈管理——关注点分离使它可独立测试。
 */

import type { IExecutionOptions, IUndoRedoItem, IUndoRedoService } from '@sheetx/core'

/** 默认历史深度。100 步足够日常编辑；协作/审计场景由宿主另行持久化 */
export const DEFAULT_UNDO_LIMIT = 100

export class UndoRedoService implements IUndoRedoService {
  private stacks = new Map<string, { undo: IUndoRedoItem[]; redo: IUndoRedoItem[] }>()

  constructor(
    /** 回放器：执行 undo/redo mutation 列表（CommandService 注入，fromChangeset 模式） */
    private readonly applier: (mutations: IUndoRedoItem['undoMutations'], options: IExecutionOptions) => void | Promise<void>,
    private readonly limit: number = DEFAULT_UNDO_LIMIT,
  ) {}

  private stackFor(unitId: string): { undo: IUndoRedoItem[]; redo: IUndoRedoItem[] } {
    let stack = this.stacks.get(unitId)
    if (!stack) {
      stack = { undo: [], redo: [] }
      this.stacks.set(unitId, stack)
    }
    return stack
  }

  push(item: IUndoRedoItem): void {
    const stack = this.stackFor(item.unitId)
    stack.undo.push(item)
    // 新操作入栈后 redo 分支立即失效（标准 undo 语义）
    stack.redo.length = 0
    if (stack.undo.length > this.limit) {
      stack.undo.splice(0, stack.undo.length - this.limit)
    }
  }

  async undo(unitId: string): Promise<void> {
    const stack = this.stackFor(unitId)
    const item = stack.undo.pop()
    if (!item) return
    await this.applier(item.undoMutations, { fromChangeset: true })
    stack.redo.push(item)
  }

  async redo(unitId: string): Promise<void> {
    const stack = this.stackFor(unitId)
    const item = stack.redo.pop()
    if (!item) return
    await this.applier(item.redoMutations, { fromChangeset: true })
    stack.undo.push(item)
  }

  canUndo(unitId: string): boolean {
    return (this.stacks.get(unitId)?.undo.length ?? 0) > 0
  }

  canRedo(unitId: string): boolean {
    return (this.stacks.get(unitId)?.redo.length ?? 0) > 0
  }

  clear(unitId: string): void {
    const stack = this.stacks.get(unitId)
    if (stack) {
      stack.undo.length = 0
      stack.redo.length = 0
    }
  }
}
