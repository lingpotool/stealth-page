import { CDPSession } from "../core/CDPSession";
export interface StatefulPage {
    readonly cdpSession: CDPSession;
}
/**
 * 页面状态检查器，对应 DrissionPage 的 PageStates
 */
export declare class PageStates {
    private readonly _page;
    constructor(page: StatefulPage);
    /**
     * 页面是否在加载中
     */
    get is_loading(): Promise<boolean>;
    /**
     * 页面是否仍然可用
     */
    get is_alive(): Promise<boolean>;
    /**
     * 页面加载状态
     */
    get ready_state(): Promise<string | null>;
    /**
     * 是否存在弹窗
     */
    get has_alert(): Promise<boolean>;
    private _checkLoading;
    private _checkAlive;
    private _getReadyState;
    private _checkAlert;
    /**
     * 浏览器是否无头模式
     */
    get is_headless(): Promise<boolean>;
    /**
     * 浏览器是否接管的
     */
    get is_existed(): Promise<boolean>;
    /**
     * 浏览器是否无痕模式
     */
    get is_incognito(): Promise<boolean>;
    private _checkHeadless;
    private _checkExisted;
    private _checkIncognito;
}
