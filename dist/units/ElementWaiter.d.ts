import { CDPSession } from "../core/CDPSession";
export interface WaitableElement {
    readonly session: CDPSession;
    readonly nodeId: number;
    getObjectId(): Promise<string>;
    is_displayed(): Promise<boolean>;
    is_enabled(): Promise<boolean>;
    is_covered?(): Promise<number | false>;
    get_rect(): Promise<{
        x: number;
        y: number;
        width: number;
        height: number;
    }>;
}
/**
 * 元素等待器，对应 DrissionPage 的 ElementWaiter
 */
export declare class ElementWaiter {
    private readonly _ele;
    private readonly _defaultTimeout;
    constructor(ele: WaitableElement, defaultTimeout?: number);
    /**
     * 等待若干秒
     */
    __call__(second: number, scope?: number): Promise<WaitableElement>;
    /**
     * 等待元素从 DOM 删除
     */
    deleted(timeout?: number): Promise<WaitableElement | false>;
    /**
     * 等待元素显示
     */
    displayed(timeout?: number): Promise<WaitableElement | false>;
    /**
     * 等待元素隐藏
     */
    hidden(timeout?: number): Promise<WaitableElement | false>;
    /**
     * 等待元素被遮盖
     */
    covered(timeout?: number): Promise<WaitableElement | false>;
    /**
     * 等待元素不被遮盖
     */
    not_covered(timeout?: number): Promise<WaitableElement | false>;
    /**
     * 等待元素可用
     */
    enabled(timeout?: number): Promise<WaitableElement | false>;
    /**
     * 等待元素不可用
     */
    disabled(timeout?: number): Promise<WaitableElement | false>;
    /**
     * 等待元素不可用或从 DOM 删除
     */
    disabled_or_deleted(timeout?: number): Promise<boolean>;
    /**
     * 等待元素停止移动
     */
    stop_moving(timeout?: number, gap?: number): Promise<WaitableElement | false>;
    /**
     * 等待元素可点击（显示、可用、有大小）
     */
    clickable(waitMoved?: boolean, timeout?: number): Promise<WaitableElement | false>;
    /**
     * 等待元素有大小和位置
     */
    has_rect(timeout?: number): Promise<WaitableElement | false>;
}
