/**
 * @sheetx/core - 版本快照与差异（M4 数据安全的持久化补充）
 *
 * UndoRedoService 的 mutation 双栈解决「高频编辑的内存效率」，
 * 但它是易失的（刷新即丢、深度 100 步）。VersionManager 解决另一半：
 * - 按显式/自动快照保留可持久化版本（可 JSON 序列化）；
 * - 差异对比按「行 id + 字段」计算，只返回变化的单元格（不是整表）；
 * - 恢复时产出「目标版本数据」交给宿主/引擎写入（本类不碰 store）。
 *
 * 零依赖：只消费普通对象记录，不依赖 grid / spreadsheet / data。
 */
export interface VersionSnapshot<T = Record<string, unknown>> {
    id: string;
    /** ISO 时间字符串 */
    createdAt: string;
    label: string;
    /** 记录数组（深拷贝的纯数据） */
    records: T[];
}
export interface VersionCellChange {
    rowId: string;
    field: string;
    before: unknown;
    after: unknown;
}
export interface RowChange {
    type: 'added' | 'removed' | 'modified';
    rowId: string;
    /** modified 时的字段变化 */
    cells?: VersionCellChange[];
}
export interface VersionDiff {
    fromId: string;
    toId: string;
    added: string[];
    removed: string[];
    modified: Array<{
        rowId: string;
        cells: VersionCellChange[];
    }>;
    /** 变化单元格总数（指标） */
    totalChanges: number;
}
/** 版本历史管理（纯逻辑；宿主负责持久化与写入引擎） */
export declare class VersionManager<T extends Record<string, unknown> = Record<string, unknown>> {
    private readonly limit;
    private snapshots;
    private counter;
    constructor(limit?: number);
    get count(): number;
    /** 新增快照（深拷贝，宿主后续修改原记录不影响快照） */
    capture(records: ReadonlyArray<T>, label: string, createdAt?: string): VersionSnapshot<T>;
    list(): ReadonlyArray<VersionSnapshot<T>>;
    get(id: string): VersionSnapshot<T> | undefined;
    /** 取最新快照 */
    latest(): VersionSnapshot<T> | undefined;
    /** 删除快照（返回是否删除成功） */
    remove(id: string): boolean;
    clear(): void;
    /** 导出为 JSON 字符串（宿主可写入 localStorage / 服务器） */
    serialize(): string;
    /** 从 JSON 恢复（结构校验失败时保持现有历史） */
    deserialize(json: string): boolean;
    /** 恢复到指定版本：返回该版本记录的深拷贝（宿主编排写入，不直接改 store） */
    restore(id: string): T[] | null;
    /** 对比两个版本：按 id 匹配行，按字段比较值 */
    diff(fromId: string, toId: string): VersionDiff | null;
}
/** 高频编辑节流：把连续操作合并成一次快照（避免高频编辑产生海量版本） */
export declare class SnapshotThrottler {
    private readonly waitMs;
    private timer;
    private pending;
    constructor(waitMs?: number);
    /** 每次编辑调用；停止编辑 waitMs 后才真正快照 */
    schedule(action: () => void): void;
    /** 立即执行挂起的快照（页面离开/手动保存时调用，保证不丢最后一次） */
    flush(): void;
    get hasPending(): boolean;
    dispose(): void;
}
