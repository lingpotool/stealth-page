import { CDPSession } from "../core/CDPSession";
export interface ScrollableElement {
    readonly session: CDPSession;
    getObjectId(): Promise<string>;
}
/**
 * 元素滚动器，对应 DrissionPage 的 ElementScroller
 * 所有方法返回元素本身以支持链式调用
 */
export declare class ElementScroller {
    private readonly _ele;
    private _waitComplete;
    constructor(ele: ScrollableElement);
    /**
     * 设置是否等待滚动完成
     */
    set_wait_complete(on: boolean): void;
    /**
     * 向下滚动若干像素
     */
    __call__(pixel?: number): Promise<ScrollableElement>;
    /**
     * 滚动到顶部
     */
    to_top(): Promise<ScrollableElement>;
    /**
     * 滚动到底部
     */
    to_bottom(): Promise<ScrollableElement>;
    /**
     * 滚动到垂直中间位置
     */
    to_half(): Promise<ScrollableElement>;
    /**
     * 滚动到最右边
     */
    to_rightmost(): Promise<ScrollableElement>;
    /**
     * 滚动到最左边
     */
    to_leftmost(): Promise<ScrollableElement>;
    /**
     * 滚动到指定位置
     */
    to_location(x: number, y: number): Promise<ScrollableElement>;
    /**
     * 向上滚动
     */
    up(pixel?: number): Promise<ScrollableElement>;
    /**
     * 向下滚动
     */
    down(pixel?: number): Promise<ScrollableElement>;
    /**
     * 向左滚动
     */
    left(pixel?: number): Promise<ScrollableElement>;
    /**
     * 向右滚动
     */
    right(pixel?: number): Promise<ScrollableElement>;
    /**
     * 滚动页面直到元素可见
     * @param center 是否尽量滚动到页面正中，为null时如果被遮挡，则滚动到页面正中
     */
    to_see(center?: boolean | null): Promise<ScrollableElement>;
    /**
     * 元素尽量滚动到视口中间
     */
    to_center(): Promise<ScrollableElement>;
    /**
     * 等待滚动结束
     */
    private _waitScrolled;
}
