import { CDPSession } from "../core/CDPSession";
/**
 * Cookie 数据接口
 */
export interface CookieData {
    name: string;
    value: string;
    domain?: string;
    path?: string;
    expires?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "Strict" | "Lax" | "None";
}
/**
 * Cookie 设置页面接口
 */
export interface CookiesPage {
    cdpSession: CDPSession;
}
/**
 * Cookie 设置类，对应 DrissionPage 的 CookiesSetter
 */
export declare class CookiesSetter {
    protected readonly _owner: CookiesPage;
    constructor(owner: CookiesPage);
    /**
     * 设置一个或多个 cookie
     */
    set(cookies: CookieData | CookieData[] | string | Record<string, string>): Promise<void>;
    /**
     * 删除一个 cookie
     */
    remove(name: string, url?: string, domain?: string, path?: string): Promise<void>;
    /**
     * 清除所有 cookie
     */
    clear(): Promise<void>;
    /**
     * 解析各种格式的 cookie 输入
     */
    private _parseCookies;
}
/**
 * 页面级别的 Cookie 设置类
 */
export declare class PageCookiesSetter extends CookiesSetter {
    /**
     * 获取所有 cookie
     */
    getAll(urls?: string[]): Promise<CookieData[]>;
}
