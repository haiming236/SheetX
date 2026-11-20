/**
 * @sheetx/core - 条件格式契约与纯逻辑求值（零依赖）
 *
 * 正式方案 M4「高级能力」之一，ERP 高频：阈值标红、数据条、色阶。
 * 规则是纯数据（可 JSON 序列化），求值只消费单元格值与坐标——
 * 因此 core 不依赖公式/网格/渲染，grid 与 spreadsheet 可共用。
 *
 * 冲突优先级：按规则数组顺序，第一条命中的规则生效（与 Excel 管理器的自上而下一致）。
 */
import type { CellRange, CellValue } from './types.js';
export interface ConditionalStyle {
    /** 背景色（CSS 颜色字符串） */
    background?: string;
    /** 文字色 */
    color?: string;
    bold?: boolean;
}
/** 条件格式规则（判别联合；id 由宿主分配，删除/更新按 id） */
export type ConditionalRule = {
    id: string;
    type: 'cellIs';
    range: CellRange;
    operator: '>' | '>=' | '<' | '<=' | '=' | '<>';
    value: CellValue | number | string;
    style: ConditionalStyle;
} | {
    id: string;
    type: 'containsText';
    range: CellRange;
    text: string;
    style: ConditionalStyle;
}
/** 数据条：min/max 省略时取该规则覆盖区域的数值上下界（由宿主计算后传入 ctx） */
 | {
    id: string;
    type: 'dataBar';
    range: CellRange;
    min?: number;
    max?: number;
    color: string;
}
/** 三色/双色阶：min/max 为数值区间端点 */
 | {
    id: string;
    type: 'colorScale';
    range: CellRange;
    min: number;
    max: number;
    minColor: string;
    maxColor: string;
    midColor?: string;
};
/** 求值结果：样式覆盖 + 可视化比例（数据条/色阶由渲染层消费） */
export interface ConditionalFormatResult {
    background?: string;
    color?: string;
    bold?: boolean;
    /** 数据条长度比例 0..1 */
    dataBarRatio?: number;
    dataBarColor?: string;
    /** 色阶插值后的颜色 */
    scaleColor?: string;
}
/** 单元格是否落在规则区域内 */
export declare function isCellInRange(row: number, col: number, range: CellRange): boolean;
/** 两色线性插值（仅接受 #rgb / #rrggbb；其它颜色原样返回末色） */
export declare function lerpColor(from: string, to: string, ratio: number): string;
/**
 * 对某格求值条件格式。
 * @param bounds 数据条/色阶的实际数据上下界（由宿主按规则区域预先算好）
 */
export declare function evaluateConditionalFormat(value: CellValue | null | undefined, row: number, col: number, rules: ReadonlyArray<ConditionalRule>, bounds?: {
    min?: number;
    max?: number;
}): ConditionalFormatResult | null;
