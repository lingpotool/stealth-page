import * as http from "http";
import { SessionOptions } from "../config/SessionOptions";
import { SessionElement } from "../core/SessionElement";
import { SessionPageSetter } from "../units/SessionPageSetter";
/**
 * Node 版 SessionPage，对应 DrissionPage.SessionPage。
 * 当前实现基础 HTTP 能力：get/post 与最近一次响应内容缓存。
 */
export declare class SessionPage {
    private readonly _options;
    private _setter;
    private _url;
    private _statusCode;
    private _html;
    private _responseHeaders;
    private _cookies;
    private _encoding;
    retry_times: number;
    retry_interval: number;
    constructor(sessionOrOptions?: SessionOptions);
    /**
     * 返回用于设置的对象
     */
    get set(): SessionPageSetter;
    get options(): SessionOptions;
    get url(): string | null;
    get status(): number | null;
    get html(): string | null;
    get title(): string | null;
    get response_headers(): http.IncomingHttpHeaders | null;
    get response(): {
        status: number | null;
        headers: http.IncomingHttpHeaders | null;
        body: string | null;
        url: string | null;
    };
    /**
     * 返回页面原始数据
     */
    get raw_data(): string | null;
    /**
     * 当返回内容是 json 格式时，返回对应的字典
     */
    get json(): any;
    /**
     * 返回 user agent
     */
    get user_agent(): string;
    /**
     * 返回编码设置
     */
    get encoding(): string;
    /**
     * 设置编码
     */
    set encoding(value: string);
    /**
     * 返回超时设置
     */
    get timeout(): number;
    cookies(allDomains?: boolean, allInfo?: boolean): Promise<CookieEntry[]>;
    set_cookies(cookies: Array<{
        name: string;
        value: string;
        domain?: string;
        path?: string;
        expiresAt?: number;
    }>): Promise<void>;
    clear_cookies(): void;
    put(url: string, extra?: {
        headers?: Record<string, string>;
        body?: string | Buffer;
    }): Promise<boolean>;
    delete(url: string, extra?: {
        headers?: Record<string, string>;
    }): Promise<boolean>;
    get(url: string, extra?: {
        headers?: Record<string, string>;
        params?: Record<string, string>;
        data?: Record<string, any>;
        json?: any;
        cookies?: Array<{
            name: string;
            value: string;
            domain?: string;
            path?: string;
        }>;
        auth?: {
            username: string;
            password: string;
        } | [string, string];
        allow_redirects?: boolean;
        verify?: boolean;
        timeout?: number;
        showErrmsg?: boolean;
        retry?: number;
        interval?: number;
    }): Promise<boolean>;
    post(url: string, extra?: {
        headers?: Record<string, string>;
        params?: Record<string, string>;
        data?: Record<string, any>;
        json?: any;
        body?: string | Buffer;
        cookies?: Array<{
            name: string;
            value: string;
            domain?: string;
            path?: string;
        }>;
        auth?: {
            username: string;
            password: string;
        } | [string, string];
        files?: Record<string, string>;
        allow_redirects?: boolean;
        verify?: boolean;
        timeout?: number;
        showErrmsg?: boolean;
        retry?: number;
        interval?: number;
    }): Promise<boolean>;
    ele(locator: any, index?: number, _timeout?: number): Promise<any>;
    eles(locator: any, _timeout?: number): Promise<any[]>;
    /**
     * 返回页面中符合条件的一个元素（与 ele 相同，为了 API 兼容）
     */
    s_ele(locator: string, index?: number): Promise<SessionElement | null>;
    /**
     * 返回页面中符合条件的所有元素（与 eles 相同，为了 API 兼容）
     */
    s_eles(locator: string): Promise<SessionElement[]>;
    /**
     * 关闭 Session（清理资源）
     */
    close(): void;
    private _buildUrl;
    private _buildRequestExtra;
    private _cacheResponse;
    private _request;
    private _buildCookieHeader;
    private _storeCookies;
}
interface CookieEntry {
    name: string;
    value: string;
    domain: string;
    path: string;
    expiresAt?: number;
    secure?: boolean;
    httpOnly?: boolean;
}
export {};
