import { CDPSession } from "../core/CDPSession";
export interface ScrollablePage {
    readonly cdpSession: CDPSession;
}
/**
 * 页面滚动器，对应 DrissionPage 的 PageScroller
 * 所有方法返回页面对象以支持链式调用
 */
export declare class PageScroller {
    protected readonly _page: ScrollablePage;
    protected _waitComplete: boolean;
    protected _smooth: boolean;
    constructor(page: ScrollablePage);
    /**
     * 设置是否等待滚动完成
     */
    set_wait_complete(on: boolean): void;
    /**
     * 设置是否平滑滚动
     */
    set_smooth(on: boolean): void;
    /**
     * 向下滚动若干像素
     */
    __call__(pixel?: number): Promise<ScrollablePage>;
    /**
     * 滚动到顶部
     */
    to_top(): Promise<ScrollablePage>;
    /**
     * 滚动到底部
     */
    to_bottom(): Promise<ScrollablePage>;
    /**
     * 滚动到垂直中间位置
     */
    to_half(): Promise<ScrollablePage>;
    /**
     * 滚动到最右边
     */
    to_rightmost(): Promise<ScrollablePage>;
    /**
     * 滚动到最左边
     */
    to_leftmost(): Promise<ScrollablePage>;
    /**
     * 滚动到指定位置
     */
    to_location(x: number, y: number): Promise<ScrollablePage>;
    /**
     * 向上滚动
     */
    up(pixel?: number): Promise<ScrollablePage>;
    /**
     * 向下滚动
     */
    down(pixel?: number): Promise<ScrollablePage>;
    /**
     * 向左滚动
     */
    left(pixel?: number): Promise<ScrollablePage>;
    /**
     * 向右滚动
     */
    right(pixel?: number): Promise<ScrollablePage>;
    /**
     * 滚动页面直到元素可见
     * @param locOrEle 元素的定位信息，可以是定位符或元素对象
     * @param center 是否尽量滚动到页面正中，为null时如果被遮挡，则滚动到页面正中
     */
    to_see(locOrEle: string | {
        scroll_into_view: () => Promise<void>;
        scroll?: {
            to_see: (center?: boolean | null) => Promise<any>;
        };
    }, center?: boolean | null): Promise<ScrollablePage>;
    protected _runJs(js: string): Promise<void>;
    protected _waitScrolled(): Promise<void>;
}
