import { CDPSession } from "../core/CDPSession";
export interface StatefulElement {
    readonly session: CDPSession;
    readonly nodeId: number;
    getObjectId(): Promise<string>;
}
/**
 * 元素状态检查器，对应 DrissionPage 的 ElementStates
 */
export declare class ElementStates {
    private readonly _ele;
    constructor(ele: StatefulElement);
    /**
     * 元素是否被选中（用于 checkbox/radio）
     */
    get is_checked(): Promise<boolean>;
    /**
     * 元素是否被选择（用于 option）
     */
    get is_selected(): Promise<boolean>;
    /**
     * 元素是否显示
     */
    get is_displayed(): Promise<boolean>;
    /**
     * 元素是否可用
     */
    get is_enabled(): Promise<boolean>;
    /**
     * 元素是否仍在 DOM 中
     */
    get is_alive(): Promise<boolean>;
    /**
     * 元素是否在视口中
     */
    get is_in_viewport(): Promise<boolean>;
    /**
     * 元素是否整个都在视口内
     */
    get is_whole_in_viewport(): Promise<boolean>;
    /**
     * 元素是否被覆盖
     */
    get is_covered(): Promise<boolean | number>;
    /**
     * 元素是否可被点击
     */
    get is_clickable(): Promise<boolean>;
    /**
     * 元素是否有大小和位置
     */
    get has_rect(): Promise<boolean>;
    private _getBoolProperty;
    private _checkDisplayed;
    private _checkEnabled;
    private _checkAlive;
    private _checkInViewport;
    private _checkWholeInViewport;
    private _checkCovered;
    private _checkClickable;
    private _checkHasRect;
}
