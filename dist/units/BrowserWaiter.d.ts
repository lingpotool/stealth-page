import { Chromium } from "../chromium/Chromium";
export declare class BrowserWaiter {
    private readonly _browser;
    constructor(browser: Chromium);
    wait(second: number, scope?: number): Promise<Chromium>;
    new_tab(timeout?: number, currTab?: string, raiseErr?: boolean | null): Promise<string | false>;
    download_begin(timeout?: number, cancelIt?: boolean): Promise<any | false>;
    downloads_done(timeout?: number, cancelIfTimeout?: boolean): Promise<boolean>;
}
