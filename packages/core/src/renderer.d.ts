/**
 * @sheetx/core - 渲染接口
 *
 * 来自正式方案的 Renderer 接口（L67-79）。渲染器通过接口提供绘制能力，
 * 不直接依赖任何业务模式的数据结构。业务层只需实现 RenderScene。
 */
import type { Rect } from './types.js';
/** 脏区域矩形别名 */
export type DirtyRect = Rect;
/** 渲染场景：渲染器消费的纯数据描述（不含业务模型） */
export interface RenderScene {
    /** 视口区域（像素） */
    viewport: Rect;
    /** 待绘制的图层数据（由上层生成，渲染器不解释业务含义） */
    layers: RenderLayer[];
    /** 设备像素比 */
    dpr: number;
    /**
     * 不随内容滚动的固定带尺寸（CSS px）：顶部=列头+冻结行，左侧=行头+冻结列。
     * 渲染器走滚动位块搬移时，这些带不能跟着整帧像素位移，必须在搬移后单独重绘。
     */
    fixedBands?: {
        top: number;
        left: number;
    };
}
/** 渲染图层 */
export interface RenderLayer {
    id: string;
    zIndex: number;
    /** 图层绘制指令（不透明数据，由各模式自行定义结构） */
    commands: unknown[];
    visible?: boolean;
}
/** 统一渲染接口（第一版实现 Canvas2DRenderer，未来可加 Offscreen/WebGPU） */
export interface Renderer {
    initialize(canvas: HTMLCanvasElement): void;
    resize(width: number, height: number): void;
    render(scene: RenderScene): void;
    invalidate(rect?: DirtyRect): void;
    destroy(): void;
}
