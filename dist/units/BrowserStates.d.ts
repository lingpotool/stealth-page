import { Chromium } from "../chromium/Chromium";
/**
 * 浏览器状态检查类
 * 对应 DrissionPage.BrowserStates
 */
export declare class BrowserStates {
    private readonly _browser;
    constructor(browser: Chromium);
    /**
     * 返回浏览器是否已连接
     */
    get is_alive(): boolean;
    /**
     * 返回是否为无头模式
     */
    get is_headless(): boolean;
    /**
     * 返回是否为隐身模式
     */
    get is_incognito(): boolean;
    /**
     * 返回标签页数量
     */
    tabs_count(): Promise<number>;
    /**
     * 检查浏览器是否有活动的下载
     */
    has_active_downloads(): Promise<boolean>;
    /**
     * 获取浏览器版本信息
     */
    version(): Promise<string>;
    /**
     * 获取 User-Agent
     */
    user_agent(): Promise<string>;
    /**
     * 获取协议版本
     */
    protocol_version(): Promise<string>;
}
