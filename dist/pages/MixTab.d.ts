import { Chromium } from "../chromium/Chromium";
import { ChromiumTab } from "./ChromiumTab";
import { SessionPage } from "./SessionPage";
import { SessionOptions } from "../config/SessionOptions";
import { Element } from "../core/Element";
import { SessionElement } from "../core/SessionElement";
export type MixTabMode = "d" | "s";
/**
 * MixTab - 混合模式标签页
 * 对应 DrissionPage.MixTab，支持 d 模式（浏览器）和 s 模式（Session）切换
 */
export declare class MixTab extends ChromiumTab {
    private _mode;
    private _sessionPage;
    private _sessionUrl;
    constructor(browser: Chromium, tabId: string, sessionOptions?: SessionOptions);
    get mode(): MixTabMode;
    /**
     * 切换模式
     * @param mode 目标模式，不传则切换
     * @param go 是否跳转到原模式的 url
     * @param copyCookies 是否复制 cookies 到目标模式
     */
    change_mode(mode?: MixTabMode, go?: boolean, copyCookies?: boolean): Promise<void>;
    /**
     * 把浏览器的 cookies 复制到 session 对象
     */
    cookies_to_session(copyUserAgent?: boolean): Promise<void>;
    /**
     * 把 session 对象的 cookies 复制到浏览器
     */
    cookies_to_browser(): Promise<void>;
    /**
     * 获取 user agent
     */
    user_agent(): Promise<string>;
    get(url: string, options?: {
        showErrmsg?: boolean;
        retry?: number;
        interval?: number;
        timeout?: number;
        params?: Record<string, string>;
        data?: any;
        json?: any;
        headers?: Record<string, string>;
        cookies?: any;
        files?: any;
        auth?: any;
        allowRedirects?: boolean;
        proxies?: Record<string, string>;
        hooks?: any;
        stream?: boolean;
        verify?: boolean | string;
        cert?: string | [string, string];
    }): Promise<boolean>;
    post(url: string, options?: {
        showErrmsg?: boolean;
        retry?: number;
        interval?: number;
        timeout?: number;
        params?: Record<string, string>;
        data?: any;
        json?: any;
        headers?: Record<string, string>;
        cookies?: any;
        files?: any;
        auth?: any;
        allowRedirects?: boolean;
        proxies?: Record<string, string>;
        hooks?: any;
        stream?: boolean;
        verify?: boolean | string;
        cert?: string | [string, string];
    }): Promise<boolean>;
    html(): Promise<string>;
    title(): Promise<string>;
    url(): Promise<string>;
    cookies(allDomains?: boolean, allInfo?: boolean): Promise<any[]>;
    ele(locator: string, index?: number, timeout?: number): Promise<Element | null>;
    eles(locator: string, timeout?: number): Promise<Element[]>;
    /**
     * 以 SessionElement 形式返回元素
     * d 模式下会获取页面 HTML 后解析，s 模式下直接返回
     */
    s_ele(locator: string, index?: number, timeout?: number): Promise<SessionElement | null>;
    s_eles(locator: string, timeout?: number): Promise<SessionElement[]>;
    get session(): SessionPage;
    get response_headers(): any;
    get status(): number | null;
    /**
     * 返回页面原始数据
     */
    get raw_data(): string | null;
    /**
     * 当返回内容是 json 格式时，返回对应的字典
     */
    json(): Promise<any>;
    close(others?: boolean): Promise<void>;
}
