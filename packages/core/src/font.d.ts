/**
 * @sheetx/core - 字体契约（Font Contract）
 *
 * 为什么放在 core：
 * Grid / Spreadsheet / Renderer / IO / PDF 导出都要"同一套字体"，如果各自实现，
 * 必然出现「Canvas 用 A、导出 PDF 用 B、打印又是 C」的不一致。
 * 因此在 core 只定义**接口与类型**（零运行时依赖），由 @sheetx/fonts 提供内置实现，
 * 上层模块一律面向 `IFontRegistry` 编程。
 */
/** 常用字重（内置只保证 400/700，其余由自定义字体扩展） */
export type FontWeight = 400 | 500 | 600 | 700;
export type FontStyle = 'normal' | 'italic';
/** 字形来源：URL（浏览器按需加载）或已加载的二进制（Node / PDF 嵌入） */
export interface FontSource {
    /** 字形文件地址（.ttf / .otf），浏览器 FontFace 直接消费 */
    url?: string;
    /** 已读取的字形字节；PDF 嵌入与 Node 端使用 */
    data?: ArrayBuffer | Uint8Array;
    /** 字节数（UI 展示体积 / 预算控制） */
    byteLength?: number;
}
/** 一个字体面（一个字重 / 一种字形） */
export interface FontFaceSource extends FontSource {
    weight: FontWeight;
    style?: FontStyle;
}
/**
 * 字体描述符：注册到 registry 的最小单元。
 * `family` 是**逻辑名**（如 'Source Han Sans CN'），也是 CSS font-family 用名。
 */
export interface FontDescriptor {
    family: string;
    /** 显示名（中文界面展示，如 '思源黑体'） */
    displayName?: string;
    /** 是否 SDK 内置 */
    builtin?: boolean;
    faces: FontFaceSource[];
    /** CSS 回退栈；不填时由 registry 依据 family 生成 */
    cssFamily?: string;
    /** 许可证标识（PDF 嵌入/再分发前必须确认） */
    license?: string;
    /** 是否允许嵌入 PDF（来自 OS/2 fsType 校验结果，undefined 表示未检测） */
    pdfEmbeddingAllowed?: boolean;
}
/** 解析后的字体度量（PDF 描述符 / 行高计算 / Canvas 基线对齐都要用） */
export interface FontMetrics {
    unitsPerEm: number;
    /** 相对 unitsPerEm 的升部（正值） */
    ascent: number;
    /** 相对 unitsPerEm 的降部（负值或正值均可能出现，按字体原样返回） */
    descent: number;
    lineGap: number;
    capHeight?: number;
    numGlyphs: number;
}
/** 解析结果：把「逻辑字体名 + 字重」落到具体一条 CSS font-family 栈 */
export interface ResolvedFont {
    family: string;
    weight: FontWeight;
    /** 可直接写入 Canvas `font` / CSS `font-family` 的字符串（不含字号） */
    cssFamily: string;
    /** 命中的具体字体面；未注册时为 undefined（回退系统字体） */
    face?: FontFaceSource;
}
/**
 * 字体注册表接口。
 *
 * 约定：
 * - 所有方法必须幂等、可在任意环境（浏览器 / Node / Worker）安全调用；
 * - `loadBinary` 是唯一可能触发 IO 的方法，其余均为同步纯查询；
 * - 未注册的字体名必须**优雅回退**（返回系统字体栈），绝不抛错。
 */
export interface IFontRegistry {
    /** 注册（同 family 覆盖） */
    register(descriptor: FontDescriptor): void;
    /** 注销；返回是否真的删除了 */
    unregister(family: string): boolean;
    get(family: string): FontDescriptor | undefined;
    list(): FontDescriptor[];
    /** 设置默认字体（未注册时应抛错，避免静默回退到系统字体） */
    setDefault(family: string): void;
    getDefault(): string;
    /** 解析家族名 + 字重 → CSS 栈；未注册回退系统字体 */
    resolve(family?: string, weight?: FontWeight): ResolvedFont;
    /** 读取字形二进制（PDF 嵌入 / Node 端测量用） */
    loadBinary?(family: string, weight?: FontWeight): Promise<Uint8Array>;
    /** 读取并解析字体度量与字形表 */
    loadMetrics?(family: string, weight?: FontWeight): Promise<FontMetrics>;
}
/** 默认回退栈（未注册字体时的兜底，覆盖 macOS / Windows / Linux） */
export declare const DEFAULT_FONT_FALLBACK = "'PingFang SC', 'Microsoft YaHei', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
/** 生成 CSS font-family 字符串（含兜底） */
export declare function buildCssFamily(family: string, fallback?: string): string;
