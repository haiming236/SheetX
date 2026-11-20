/**
 * @sheetx/core - 数据透视表（M4 高级能力）
 *
 * 零依赖纯逻辑：只消费「记录数组 + 字段配置」，输出可用于渲染/导出的交叉表矩阵。
 * 不依赖 grid / spreadsheet / renderer，Node 与浏览器均可运行。
 *
 * 分组语义：
 * - 行/列维度均支持多级（维度路径用 JSON 键做 Map key，避免分隔符冲突）；
 * - 分组顺序按首次出现（稳定、可预测，不引入 locale 排序的不确定性）；
 * - 空值（null/undefined/''）归入 blankLabel 分组；
 * - sum/avg/min/max 只累计有限数值；count 统计可转为数值的记录数（与 sum/avg 同口径）。
 */
/** 维度字段 */
export interface PivotField {
    key: string;
    title?: string;
}
export type PivotAggregation = 'sum' | 'count' | 'avg' | 'min' | 'max';
/** 度量字段 */
export interface PivotValue {
    key: string;
    agg: PivotAggregation;
    title?: string;
}
export interface PivotConfig {
    /** 行维度（多级，按顺序外层 → 内层） */
    rows: ReadonlyArray<PivotField>;
    /** 列维度（多级） */
    cols: ReadonlyArray<PivotField>;
    /** 度量（可多个，输出时按 values 顺序展开在每列之后） */
    values: ReadonlyArray<PivotValue>;
    /** 空值分组名，默认 '(空白)' */
    blankLabel?: string;
    /** 行总计（沿列方向合计），默认 true */
    rowTotal?: boolean;
    /** 列总计（沿行方向合计），默认 true */
    colTotal?: boolean;
}
export interface PivotResult {
    /** 行维度路径（每行一条） */
    rowKeys: string[][];
    /** 列维度路径（每列一条，未展开度量） */
    colKeys: string[][];
    /** 展示用行标签（多级拼成 ' / '） */
    rowLabels: string[];
    colLabels: string[];
    /** 度量名（输出列顺序为 colKeys × valueKeys） */
    valueKeys: string[];
    /** cells[行][列]，列 = 列维度 × 度量；无记录为 null */
    cells: Array<Array<number | null>>;
    /** 每格参与聚合的记录数（与 cells 同形状） */
    counts: number[][];
    /** 行总计（每行 × 度量），rowTotal=false 时为 [] */
    rowTotals: Array<Array<number | null>>;
    /** 列总计（每列 × 度量），colTotal=false 时为 [] */
    colTotals: Array<Array<number | null>>;
    /** 全局总计（每度量一个值） */
    grandTotal: Array<number | null>;
    /** 参与记录总数 */
    recordCount: number;
}
/**
 * 构建数据透视表。
 *
 * @param records 记录数组（GridStore 的 RowData.data 或普通对象均可）
 * @param config 维度与度量配置
 */
export declare function buildPivotTable(records: ReadonlyArray<Record<string, unknown>>, config: PivotConfig): PivotResult;
/**
 * 透视结果 → 二维字符串矩阵（带表头），可直接交给 CSV / 打印 / 表格渲染。
 * 布局：左上角空白 + 列标签 × 度量名；每行列标签 + 数据 + 行总计。
 */
export declare function pivotToMatrix(result: PivotResult, config: PivotConfig): string[][];
