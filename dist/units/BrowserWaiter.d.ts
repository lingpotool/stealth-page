import { Chromium } from "../chromium/Chromium";
/**
 * 浏览器等待类
 * 对应 DrissionPage.BrowserWaiter
 */
export declare class BrowserWaiter {
    private readonly _browser;
    constructor(browser: Chromium);
    /**
     * 等待若干秒
     */
    wait(second: number, scope?: number): Promise<Chromium>;
    /**
     * 等待新标签页出现
     */
    new_tab(timeout?: number, currTab?: string): Promise<string | false>;
    /**
     * 等待浏览器下载开始
     */
    download_begin(timeout?: number, cancelIt?: boolean): Promise<any | false>;
    /**
     * 等待所有下载任务结束
     */
    downloads_done(timeout?: number, cancelIfTimeout?: boolean): Promise<boolean>;
}
