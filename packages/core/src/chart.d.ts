/**
 * @sheetx/core - 图表（M4「图表」，零依赖 SVG 原生手写）
 *
 * 不引入 ECharts / Chart.js：输出纯矢量 SVG 字符串，放大不模糊、体积可控，
 * 与打印引擎（io/print.ts）的矢量纪律一致。Node 与浏览器均可运行。
 *
 * 支持：折线 / 分组柱状 / 饼图（三种）；自动刻度、网格、图例、标题、空数据态。
 */
export type ChartKind = 'line' | 'bar' | 'pie';
export interface ChartSeries {
    name: string;
    values: number[];
    /** 显式颜色；缺省时按调色板顺序分配 */
    color?: string;
}
export interface ChartSpec {
    kind: ChartKind;
    /** 横轴分类标签 */
    categories: string[];
    series: ChartSeries[];
    title?: string;
    width?: number;
    height?: number;
    /** 显示图例，默认 true */
    legend?: boolean;
    /** 显示网格线，默认 true */
    grid?: boolean;
    /** 调色板（十六进制），内置默认 8 色 */
    palette?: string[];
}
/** 默认调色板（高对比、深浅底通用） */
export declare const DEFAULT_CHART_PALETTE: string[];
/** 构建 SVG 图表（空数据返回带提示的占位 SVG） */
export declare function buildChartSvg(spec: ChartSpec): string;
export interface ChartFromRecordsConfig {
    kind: ChartKind;
    /** 分类字段（记录里的列名） */
    categoryField: string;
    /** 数值字段（每条生成一个系列） */
    valueFields: ReadonlyArray<{
        key: string;
        name?: string;
    }>;
    title?: string;
    width?: number;
    height?: number;
}
/** 记录数组 → 图表规格：按分类字段分组，对各数值字段求和（保持分类首次出现顺序） */
export declare function chartFromRecords(records: ReadonlyArray<Record<string, unknown>>, config: ChartFromRecordsConfig): ChartSpec;
