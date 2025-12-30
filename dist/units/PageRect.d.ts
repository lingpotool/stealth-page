import { CDPSession } from "../core/CDPSession";
export interface RectablePage {
    readonly cdpSession: CDPSession;
}
/**
 * 页面/标签页位置和大小信息，对应 DrissionPage 的 TabRect
 */
export declare class PageRect {
    private readonly _page;
    constructor(page: RectablePage);
    /**
     * 窗口在屏幕上的位置
     */
    window_location(): Promise<{
        x: number;
        y: number;
    }>;
    /**
     * 窗口大小（包括边框）
     */
    window_size(): Promise<{
        width: number;
        height: number;
    }>;
    /**
     * 视口位置（相对于页面）
     */
    viewport_location(): Promise<{
        x: number;
        y: number;
    }>;
    /**
     * 视口大小
     */
    viewport_size(): Promise<{
        width: number;
        height: number;
    }>;
    /**
     * 页面大小（整个文档）
     */
    page_size(): Promise<{
        width: number;
        height: number;
    }>;
    /**
     * 屏幕大小
     */
    screen_size(): Promise<{
        width: number;
        height: number;
    }>;
    /**
     * 可用屏幕大小（排除任务栏等）
     */
    screen_available_size(): Promise<{
        width: number;
        height: number;
    }>;
    /**
     * 窗口状态：normal、fullscreen、maximized、minimized
     */
    window_state(): Promise<string>;
    /**
     * 页面左上角在屏幕中坐标
     */
    page_location(): Promise<{
        x: number;
        y: number;
    }>;
    /**
     * 页面总大小
     */
    size(): Promise<{
        width: number;
        height: number;
    }>;
    /**
     * 视口大小（包括滚动条）
     */
    viewport_size_with_scrollbar(): Promise<{
        width: number;
        height: number;
    }>;
    /**
     * 滚动条位置
     */
    scroll_position(): Promise<{
        x: number;
        y: number;
    }>;
}
