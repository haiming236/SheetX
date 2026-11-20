/**
 * @sheetx/core - 基础数据类型
 *
 * 这是整个 SheetX 引擎的公共语言。所有包都依赖这里的类型，
 * 但 core 自身不依赖任何上层包（零运行时依赖）。
 */
/** 单元格原始值类型 */
export type CellValue = string | number | boolean | null | undefined;
/** 单元格地址（电子表格模式，零基索引） */
export interface CellAddress {
    row: number;
    col: number;
}
/** 矩形区域（电子表格模式，零基索引，闭区间） */
export interface CellRange {
    start: CellAddress;
    end: CellAddress;
}
/** 像素矩形（渲染/命中测试） */
export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}
/** 尺寸 */
export interface Size {
    width: number;
    height: number;
}
/** 二维点 */
export interface Point {
    x: number;
    y: number;
}
/**
 * 单元格数据（Sheet 模式）
 * 稀疏存储：只有非空单元格才存在于工作表中。
 */
export interface CellData {
    /** 原始值 */
    v?: CellValue;
    /** 公式字符串，如 "=SUM(A1:A10)" */
    f?: string;
    /** 样式 ID，指向样式表 */
    s?: number;
    /** 显示格式 ID */
    t?: number;
}
/** 行定义（Grid 模式：一行是一条业务记录） */
export interface RowData {
    /** 唯一行 ID */
    id: string;
    /** 业务字段映射 */
    data: Record<string, unknown>;
}
/** 列定义（Grid / Sheet 共用） */
export interface ColumnDef {
    /** 字段键（Grid 模式对应 data 的 key） */
    key: string;
    /** 显示标题 */
    title: string;
    /** 宽度（像素） */
    width?: number;
    /** 编辑器类型名，注册在 @sheetx/editors */
    editor?: string;
    /** 是否可编辑 */
    editable?: boolean;
    /** 值格式化器名称 */
    formatter?: string;
    /** 是否冻结 */
    frozen?: boolean;
}
/** 工作表元数据 */
export interface WorksheetMeta {
    id: string;
    name: string;
    rowCount: number;
    columnCount: number;
}
/** 工作簿数据快照（可序列化，用于持久化/协作） */
export interface WorkbookData {
    id: string;
    sheets: WorksheetMeta[];
    activeSheetId?: string;
}
/** 值格式化器签名 */
export type ValueFormatter = (value: CellValue, ctx: FormatContext) => string;
/** 格式化上下文 */
export interface FormatContext {
    column: ColumnDef;
    row: number;
    col: number;
}
/** 可释放资源接口（贯穿整个引擎生命周期） */
export interface Disposable {
    dispose(): void;
}
/** 通用键值映射 */
export type UnknownRecord = Record<string, unknown>;
