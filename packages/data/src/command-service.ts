/**
 * @sheetx/data - 命令服务（变更协议的中枢）
 *
 * 三层协议（core/command.ts）在这里落地：
 *   COMMAND   = 业务编排（一个命令 = 一段 mutation 序列）
 *   OPERATION = UI 状态（滚动/选区——不经过本服务，直接走事件总线）
 *   MUTATION  = 最小数据变更（可序列化、幂等、可反演；undo/redo/协作回放的共同单位）
 *
 * 关键设计（源自 Univer 架构研究，见《开源项目源码研究报告.md》§02）：
 * 1. 反演在 apply 之前基于当前状态计算（createUndo）——undo 与 redo 共用同一套
 *    mutation handler，避免手写两份互逆逻辑。
 * 2. sequenceExecute 伪事务：mutation 列表逐个执行，任一失败立即中止并回滚已执行
 *    部分、不入 undo 栈——「要么全成，要么不动」。
 * 3. mutation 的 params 必须可 JSON 序列化——这是 undo 跨会话恢复、协作广播、
 *    Worker 同步的共同前提。
 */

import type { IEventBus, IExecutionOptions, IMutation, IUndoRedoItem } from '@sheetx/core'
import { CommandType, PublicEvent, nextId } from '@sheetx/core'
import type { TransactionSource } from './changes.js'
import { UndoRedoService } from './undo-redo.js'

/** 反演 mutation 引用：undo 时要执行的「另一条」mutation（可与正向 mutation 不同 id，如 insert↔delete） */
export interface UndoMutationRef {
  readonly id: string
  readonly params: unknown
}

/**
 * Mutation 定义。S 是该模式的数据仓库类型（GridStore / WorkbookModel 等），
 * P 是参数类型——**P 必须可 JSON 序列化**。
 */
export interface MutationDef<S, P = unknown> {
  readonly id: string
  /** 就地修改 store。约定：同参数重复执行结果一致（幂等可重放） */
  apply(store: S, params: P): void
  /**
   * 在 apply **之前**基于当前状态计算反演 mutation。
   * 返回 undefined / 省略该字段 = 本 mutation 不可撤销。
   * 自反型 mutation（如 set-cells 新旧互换）返回自己的 id；
   * 互逆型（insert↔delete）返回对方的 id。
   */
  createUndo?(store: S, params: P): UndoMutationRef
  /**
   * 变更的事务描述（作为 DATA_CHANGED 事件的载荷，形态由各模式决定）。
   * 返回 null/undefined 表示本 mutation 不派发数据变更事件。
   */
  transaction?(params: P, source: TransactionSource): unknown
}

/** Mutation 调用信息（core ICommand 的运行时形态 + 变更来源标注） */
export interface MutationInfo<P = unknown> {
  readonly id: string
  readonly params: P
  readonly source?: TransactionSource
}

/** 命令定义：一个业务命令展开为一段 mutation 序列 */
export interface CommandDef<S, P = unknown> {
  readonly id: string
  /** build 拿到 store——命令可在执行前读取当前状态来组装 mutation 参数 */
  build(store: S, params: P): Array<MutationInfo>
}

/** DATA_CHANGED 事件载荷 */
export interface DataChangedPayload {
  unitId: string
  /** 具体形态由各模式决定：Grid = DataTransaction，Sheet = SheetTransaction（见 spreadsheet 包） */
  transaction: unknown
}

export interface CommandServiceOptions {
  eventBus?: IEventBus
  undoLimit?: number
}

/** 调用信息 → core IMutation（进入 undo 栈的序列化形态） */
function toMutation(id: string, params: unknown): IMutation {
  return { id, type: CommandType.MUTATION, params }
}

/** 类型安全的泛型擦除容器（注册表内部使用） */
/* eslint-disable @typescript-eslint/no-explicit-any */
export class MutationRegistry<S> {
  private defs = new Map<string, MutationDef<S, any>>()

  register<P>(def: MutationDef<S, P>): void {
    if (this.defs.has(def.id)) {
      throw new Error(`[SheetX] Mutation "${def.id}" 重复注册。`)
    }
    this.defs.set(def.id, def as MutationDef<S, any>)
  }

  get(id: string): MutationDef<S, any> | undefined {
    return this.defs.get(id)
  }

  has(id: string): boolean {
    return this.defs.has(id)
  }

  /** 报错时列出全部可用 id——调用方能立刻知道自己能调什么（AG Grid 的「错误即文档」实践） */
  get ids(): string[] {
    return [...this.defs.keys()]
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export class CommandService<S> {
  readonly mutations = new MutationRegistry<S>()
  private readonly undoRedo: UndoRedoService
  private readonly bus: IEventBus | undefined
  private readonly commands = new Map<string, CommandDef<S, any>>()

  constructor(
    private readonly store: S,
    readonly unitId: string,
    options: CommandServiceOptions = {},
  ) {
    this.bus = options.eventBus
    this.undoRedo = new UndoRedoService(this.applyChangeset, options.undoLimit)
  }

  getEventBus(): IEventBus | undefined {
    return this.bus
  }

  registerMutation<P>(def: MutationDef<S, P>): void {
    this.mutations.register(def)
  }

  registerCommand<P>(def: CommandDef<S, P>): void {
    if (this.commands.has(def.id)) {
      throw new Error(`[SheetX] Command "${def.id}" 重复注册。`)
    }
    this.commands.set(def.id, def as CommandDef<S, any>)
  }

  /**
   * 执行单个 mutation。
   * 返回是否成功入栈 undo（fromChangeset 模式与不可反演 mutation 均不入栈）。
   */
  executeMutation<P>(info: MutationInfo<P>, options?: IExecutionOptions): { undoable: boolean } {
    const def = this.mutations.get(info.id)
    if (!def) {
      throw new Error(`[SheetX] 未注册的 mutation: "${info.id}"。可用: ${this.mutations.ids.join(', ')}`)
    }
    // 1. 反演必须在 apply 之前基于「变更前状态」计算——顺序反了 undo 就是错的
    const undoRef = def.createUndo?.(this.store, info.params)
    // 2. 执行
    def.apply(this.store, info.params)
    // 3. undo 入栈：协作回放（fromChangeset）不产生新历史
    let undoable = false
    if (!options?.fromChangeset && undoRef !== undefined) {
      const item: IUndoRedoItem = {
        unitId: this.unitId,
        undoMutations: [toMutation(undoRef.id, undoRef.params)],
        redoMutations: [toMutation(info.id, info.params)],
        label: info.id,
      }
      this.undoRedo.push(item)
      undoable = true
    }
    // 4. 事件：DATA_CHANGED（带事务载荷）+ 内部审计事件
    const source: TransactionSource = options?.fromChangeset ? 'api' : (info.source ?? 'api')
    const transaction = def.transaction?.(info.params, source)
    if (transaction !== null && transaction !== undefined && this.bus) {
      this.bus.emit<DataChangedPayload>(PublicEvent.DATA_CHANGED, { unitId: this.unitId, transaction })
    }
    this.bus?.emit('sx:mutation-applied', { unitId: this.unitId, id: info.id, params: info.params, source, undoable })
    return { undoable }
  }

  /** 执行注册的业务命令（展开为 mutation 序列并走伪事务） */
  executeCommand<P>(id: string, params: P, options?: IExecutionOptions): { result: boolean } {
    const def = this.commands.get(id)
    if (!def) {
      throw new Error(`[SheetX] 未注册的 command: "${id}"。可用: ${[...this.commands.keys()].join(', ')}`)
    }
    const infos = def.build(this.store, params)
    return this.sequenceExecute(infos, options)
  }

  /**
   * 伪事务执行 mutation 序列。
   * - 全部成功：合并为一个 undo 项入栈（undo 时逆序回放）
   * - 任一失败：回滚已执行部分，不入栈，返回 { result: false }
   */
  sequenceExecute(infos: ReadonlyArray<MutationInfo>, options?: IExecutionOptions): { result: boolean } {
    if (infos.length === 0) return { result: true }
    const applied: Array<{ id: string; undoRef?: UndoMutationRef; redoParams: unknown }> = []
    try {
      for (const info of infos) {
        const def = this.mutations.get(info.id)
        if (!def) {
          throw new Error(`[SheetX] 未注册的 mutation: "${info.id}"。可用: ${this.mutations.ids.join(', ')}`)
        }
        const undoRef = def.createUndo?.(this.store, info.params)
        def.apply(this.store, info.params)
        applied.push({ id: info.id, undoRef, redoParams: info.params })
      }
    } catch {
      // 回滚：逆序应用已执行部分的反演（尽力而为；反演失败说明 mutation 实现有 bug）
      for (let i = applied.length - 1; i >= 0; i--) {
        const entry = applied[i]!
        if (!entry.undoRef) continue
        try {
          this.mutations.get(entry.undoRef.id)?.apply(this.store, entry.undoRef.params)
        } catch {
          /* 回滚失败只能记录——此路径意味着 createUndo 实现不正确，开发期必须修 */
        }
      }
      return { result: false }
    }
    if (!options?.fromChangeset && applied.length > 0) {
      const undoableEntries = applied.filter((entry) => entry.undoRef !== undefined)
      if (undoableEntries.length > 0) {
        const item: IUndoRedoItem = {
          unitId: this.unitId,
          // 逆序：后执行的先撤销
          undoMutations: undoableEntries
            .slice()
            .reverse()
            .map((entry) => toMutation(entry.undoRef!.id, entry.undoRef!.params)),
          redoMutations: undoableEntries.map((entry) => toMutation(entry.id, entry.redoParams)),
          label: infos[0]!.id,
        }
        this.undoRedo.push(item)
      }
    }
    // 事件（source 取首个 info 的标注）
    const source: TransactionSource = options?.fromChangeset ? 'api' : (infos[0]!.source ?? 'api')
    for (const info of infos) {
      const def = this.mutations.get(info.id)!
      const transaction = def.transaction?.(info.params, source)
      if (transaction !== null && transaction !== undefined && this.bus) {
        this.bus.emit<DataChangedPayload>(PublicEvent.DATA_CHANGED, { unitId: this.unitId, transaction })
      }
    }
    this.bus?.emit('sx:command-executed', { unitId: this.unitId, count: infos.length, source })
    return { result: true }
  }

  async undo(): Promise<void> {
    await this.undoRedo.undo(this.unitId)
    this.bus?.emit('sx:undo', { unitId: this.unitId })
  }

  async redo(): Promise<void> {
    await this.undoRedo.redo(this.unitId)
    this.bus?.emit('sx:redo', { unitId: this.unitId })
  }

  canUndo(): boolean {
    return this.undoRedo.canUndo(this.unitId)
  }

  canRedo(): boolean {
    return this.undoRedo.canRedo(this.unitId)
  }

  clearHistory(): void {
    this.undoRedo.clear(this.unitId)
  }

  /** 给 UndoRedoService 的回放器：changeset 模式重放（不产生新历史） */
  private applyChangeset = (mutations: IUndoRedoItem['undoMutations'], options: IExecutionOptions): void => {
    const result = this.sequenceExecute(mutations, options)
    if (!result.result) {
      // 历史回放失败属于引擎内部状态损坏，必须暴露而不是吞掉
      throw new Error('[SheetX] 撤销/重做回放失败——mutation 反演实现可能不正确。')
    }
  }
}

/** 事务 id 生成（各模式 transaction() 实现里用） */
export function newTransactionId(): string {
  return nextId('tx')
}
