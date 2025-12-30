import { ChromiumOptions } from "../config/ChromiumOptions";
import { CDPSession } from "../core/CDPSession";
import { Browser } from "../core/Browser";
import { Page } from "../core/Page";
import { BrowserSetter } from "../units/BrowserSetter";
import { BrowserWaiter } from "../units/BrowserWaiter";
import { BrowserStates } from "../units/BrowserStates";
export interface ChromiumInitOptions {
    addrOrOpts?: string | ChromiumOptions;
}
/**
 * Node 版 Chromium，对应 DrissionPage.Chromium。
 * 当前只定义接口和基本结构，具体连接和 CDP 逻辑后续实现。
 */
export declare class Chromium {
    private _options;
    private _browser;
    private _cdpSession;
    private _setter;
    private _waiter;
    private _states;
    constructor(addrOrOpts?: string | ChromiumOptions);
    /**
     * 返回用于设置的对象
     */
    get set(): BrowserSetter;
    /**
     * 返回用于等待的对象
     */
    get wait(): BrowserWaiter;
    /**
     * 返回用于状态检查的对象
     */
    get states(): BrowserStates;
    get options(): ChromiumOptions;
    get browser(): Browser;
    get cdpSession(): CDPSession;
    connect(): Promise<void>;
    new_page(): Promise<Page>;
    quit(): Promise<void>;
    get_tabs(): Promise<Array<{
        id: string;
        url: string;
        title: string;
        type: string;
    }>>;
    activate_tab(tabId: string): Promise<void>;
    close_tab(tabId: string): Promise<void>;
    new_tab(url?: string): Promise<string>;
    get is_connected(): boolean;
    /**
     * 根据 tab id 获取 Page 对象
     */
    get_page_by_id(tabId: string): Promise<Page>;
    get_version(): Promise<{
        browser: string;
        protocol: string;
        userAgent: string;
    }>;
    /**
     * 返回标签页数量
     */
    tabs_count(): Promise<number>;
    /**
     * 返回所有标签页 id 列表
     */
    tab_ids(): Promise<string[]>;
    /**
     * 返回最新的标签页 id
     */
    latest_tab(): Promise<string | null>;
    /**
     * 获取所有域名的 cookies
     */
    cookies(allInfo?: boolean): Promise<any[]>;
    /**
     * 清除缓存
     */
    clear_cache(options?: {
        cache?: boolean;
        cookies?: boolean;
    }): Promise<void>;
    /**
     * 关闭多个标签页
     */
    close_tabs(tabIds: string | string[], others?: boolean): Promise<void>;
    /**
     * 断开重连
     */
    reconnect(): Promise<void>;
    /**
     * 获取浏览器进程 ID
     */
    process_id(): Promise<number | null>;
    /**
     * 获取用户数据目录路径
     */
    get user_data_path(): string | undefined;
    /**
     * 获取下载路径
     */
    get download_path(): string | undefined;
}
