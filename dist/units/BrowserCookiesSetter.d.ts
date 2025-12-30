import { Chromium } from "../chromium/Chromium";
export interface BrowserCookieData {
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
 * 浏览器级别 Cookies 设置类
 * 对应 DrissionPage.BrowserCookiesSetter
 */
export declare class BrowserCookiesSetter {
    private readonly _browser;
    constructor(browser: Chromium);
    /**
     * 设置一个或多个 cookie
     */
    set(cookies: BrowserCookieData | BrowserCookieData[]): Promise<void>;
    /**
     * 删除指定的 cookie
     */
    remove(name: string, domain?: string, path?: string): Promise<void>;
    /**
     * 清除所有 cookies
     */
    clear(domain?: string): Promise<void>;
}
