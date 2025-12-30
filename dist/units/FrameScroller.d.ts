import { PageScroller, ScrollablePage } from "./PageScroller";
/**
 * Frame 滚动接口
 */
export interface ScrollableFrame extends ScrollablePage {
    readonly frameId: string;
}
/**
 * Frame 滚动器，对应 DrissionPage 的 FrameScroller
 * 继承自 PageScroller，专门用于 iframe 内的滚动操作
 */
export declare class FrameScroller extends PageScroller {
    protected readonly _frame: ScrollableFrame;
    constructor(frame: ScrollableFrame);
    /**
     * 滚动到顶部
     */
    to_top(): Promise<ScrollableFrame>;
    /**
     * 滚动到底部
     */
    to_bottom(): Promise<ScrollableFrame>;
    /**
     * 滚动到垂直中间位置
     */
    to_half(): Promise<ScrollableFrame>;
    /**
     * 滚动到最右边
     */
    to_rightmost(): Promise<ScrollableFrame>;
    /**
     * 滚动到最左边
     */
    to_leftmost(): Promise<ScrollableFrame>;
    /**
     * 滚动到指定位置
     */
    to_location(x: number, y: number): Promise<ScrollableFrame>;
    /**
     * 向上滚动
     */
    up(pixel?: number): Promise<ScrollableFrame>;
    /**
     * 向下滚动
     */
    down(pixel?: number): Promise<ScrollableFrame>;
    /**
     * 向左滚动
     */
    left(pixel?: number): Promise<ScrollableFrame>;
    /**
     * 向右滚动
     */
    right(pixel?: number): Promise<ScrollableFrame>;
    /**
     * 滚动页面直到元素可见
     */
    to_see(locOrEle: string | {
        scroll_into_view: () => Promise<void>;
        scroll?: {
            to_see: (center?: boolean | null) => Promise<any>;
        };
    }, center?: boolean | null): Promise<ScrollableFrame>;
}
