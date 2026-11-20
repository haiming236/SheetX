/**
 * @sheetx/core - 多视图与视图管理（M4「融入现代企业业务系统」）
 *
 * 同一份数据、多种呈现：表格 / 卡片 / 看板 / 分组。
 * 本模块只管「视图配置」这一层纯数据，不关心渲染：
 * - 视图定义（类型 / 字段可见性与顺序 / 排序 / 分组字段 / 看板列字段）；
 * - 个人视图持久化（JSON 可序列化，宿主存 localStorage/服务器）；
 * - 分组聚合（按字段把记录分桶并统计），供分组视图与看板视图共用。
 *
 * 零运行时依赖：记录是普通对象，节点环境与浏览器均可运行。
 */
export type ViewType = 'table' | 'card' | 'kanban' | 'group';
export interface FieldConfig {
    field: string;
    /** 显示名 */
    title?: string;
    visible?: boolean;
    /** 显示顺序（升序），缺省按 fields 数组顺序 */
    order?: number;
    width?: number;
}
export interface ViewSort {
    field: string;
    dir: 'asc' | 'desc';
}
export interface ViewDefinition {
    id: string;
    name: string;
    type: ViewType;
    fields: FieldConfig[];
    sort?: ViewSort[];
    /** 分组视图：分组字段 */
    groupBy?: string;
    /** 看板视图：作为列（泳道）的字段 */
    boardBy?: string;
    /** 卡片视图：卡片大小 */
    cardSize?: 'small' | 'medium' | 'large';
    /** 个人视图标记（用于 UI 图标） */
    personal?: boolean;
    createdAt?: string;
    /** 快照过滤配置（可选，与 data-adapter 的 FilterGroup 同构但此处不解释） */
    filter?: unknown;
}
export interface GroupBucket<T> {
    key: string;
    label: string;
    rows: T[];
    /** 分组汇总值（数值字段求和，缺省聚合金额类字段） */
    total: number;
}
/** 应用视图的字段可见性与排序配置（返回新的行数组与字段列表，不改原始数据） */
export declare function applyView<T extends Record<string, unknown>>(rows: ReadonlyArray<T>, view: ViewDefinition): {
    rows: T[];
    fields: FieldConfig[];
};
/** 按字段分组并统计（用于分组视图与看板视图） */
export declare function groupRows<T extends Record<string, unknown>>(rows: ReadonlyArray<T>, field: string, options?: {
    totalField?: string;
    labelOf?: (key: string) => string;
}): GroupBucket<T>[];
/** 视图管理器：创建/切换/持久化视图（纯状态管理，不碰 UI） */
export declare class ViewManager {
    private readonly limit;
    private views;
    private currentId;
    private counter;
    constructor(limit?: number);
    get current(): ViewDefinition | null;
    get list(): ReadonlyArray<ViewDefinition>;
    get(id: string): ViewDefinition | undefined;
    add(view: Omit<ViewDefinition, 'id' | 'createdAt'> & {
        id?: string;
    }): ViewDefinition;
    update(id: string, patch: Partial<ViewDefinition>): boolean;
    switchTo(id: string): boolean;
    remove(id: string): boolean;
    serialize(): string;
    deserialize(json: string): boolean;
}
