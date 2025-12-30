import { CDPSession } from "../core/CDPSession";
export interface RectableElement {
    readonly session: CDPSession;
    readonly nodeId: number;
    getObjectId(): Promise<string>;
}
/**
 * 元素位置和大小信息，对应 DrissionPage 的 ElementRect
 */
export declare class ElementRect {
    private readonly _ele;
    constructor(ele: RectableElement);
    /**
     * 元素左上角在页面中的坐标
     */
    location(): Promise<{
        x: number;
        y: number;
    }>;
    /**
     * 元素在视口中的坐标
     */
    viewport_location(): Promise<{
        x: number;
        y: number;
    }>;
    /**
     * 元素在屏幕上的坐标
     */
    screen_location(): Promise<{
        x: number;
        y: number;
    }>;
    /**
     * 元素大小
     */
    size(): Promise<{
        width: number;
        height: number;
    }>;
    /**
     * 元素中心点在页面中的坐标
     */
    midpoint(): Promise<{
        x: number;
        y: number;
    }>;
    /**
     * 元素中心点在视口中的坐标
     */
    viewport_midpoint(): Promise<{
        x: number;
        y: number;
    }>;
    /**
     * 点击点坐标（默认为中心点）
     */
    click_point(): Promise<{
        x: number;
        y: number;
    }>;
    /**
     * 元素四个角的坐标
     */
    corners(): Promise<Array<{
        x: number;
        y: number;
    }>>;
    /**
     * 元素四个角在视口中的坐标
     */
    viewport_corners(): Promise<Array<{
        x: number;
        y: number;
    }>>;
    /**
     * 元素中心点在屏幕上的坐标
     */
    screen_midpoint(): Promise<{
        x: number;
        y: number;
    }>;
    /**
     * 元素点击点在屏幕上的坐标
     */
    screen_click_point(): Promise<{
        x: number;
        y: number;
    }>;
    /**
     * 视口中的点击点坐标
     */
    viewport_click_point(): Promise<{
        x: number;
        y: number;
    }>;
    /**
     * 元素滚动条位置
     */
    scroll_position(): Promise<{
        x: number;
        y: number;
    }>;
}
