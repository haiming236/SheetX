/**
 * @sheetx/core - 命令/变更协议
 *
 * 借鉴 Univer 的 Command / Operation / Mutation 三层设计（思想，非代码）。
 * 这是撤销重做、协作、持久化的共同基础。
 *
 * - COMMAND：业务编排，不进入快照
 * - OPERATION：UI 状态操作（滚动、选区），不进入快照，无冲突解决
 * - MUTATION：数据最小变更单元，进入快照，是协作冲突解决的最小粒度
 */
/** 命令类型（用 const object 而非 enum，保证 erasableSyntaxOnly 兼容） */
export declare const CommandType: {
    readonly COMMAND: 0;
    readonly OPERATION: 1;
    readonly MUTATION: 2;
};
export type CommandTypeValue = (typeof CommandType)[keyof typeof CommandType];
/** 命令基础接口：所有命令都是可序列化的 {id, type, params} */
export interface ICommand<Params = unknown> {
    readonly id: string;
    readonly type: CommandTypeValue;
    readonly params: Params;
}
export interface IMutation<Params = unknown> extends ICommand<Params> {
    readonly type: typeof CommandType.MUTATION;
}
export interface IOperation<Params = unknown> extends ICommand<Params> {
    readonly type: typeof CommandType.OPERATION;
}
/** 单元格变更（patch 的最小单元，借鉴正式方案的 CellChange） */
export interface CellChange {
    rowId: string;
    field: string;
    oldValue: unknown;
    newValue: unknown;
}
/** 数据事务（一批变更） */
export interface DataTransaction {
    id: string;
    changes: CellChange[];
    source: 'user' | 'api' | 'paste' | 'import' | 'formula';
}
/** 撤销/重做项：成对的可序列化 mutation */
export interface IUndoRedoItem {
    unitId: string;
    undoMutations: IMutation[];
    redoMutations: IMutation[];
    label?: string;
}
/** 命令执行选项 */
export interface IExecutionOptions {
    /** 仅本地执行，不广播 */
    onlyLocal?: boolean;
    /** 来自协作层 */
    fromCollab?: boolean;
    /** 来自变更集回放（撤销重做） */
    fromChangeset?: boolean;
    /** 仅同步，不触发重绘 */
    syncOnly?: boolean;
}
/** 命令处理器签名 */
export type CommandHandler<Params = unknown, Result = unknown> = (params: Params, options?: IExecutionOptions) => Result | Promise<Result>;
/** 撤销/重做服务接口 */
export interface IUndoRedoService {
    push(item: IUndoRedoItem): void;
    undo(unitId: string): Promise<void>;
    redo(unitId: string): Promise<void>;
    canUndo(unitId: string): boolean;
    canRedo(unitId: string): boolean;
    clear(unitId: string): void;
}
