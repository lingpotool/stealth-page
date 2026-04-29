import { WebPage } from "../pages/WebPage";
export declare class WebPageWaiter {
    private readonly _owner;
    private readonly _chromiumWaiter;
    constructor(owner: WebPage);
    wait(second: number, scope?: number): Promise<WebPage>;
    ele_deleted(locator: string, timeout?: number, raiseErr?: boolean | null): Promise<boolean>;
    ele_displayed(locator: string, timeout?: number, raiseErr?: boolean | null): Promise<boolean>;
    ele_hidden(locator: string, timeout?: number, raiseErr?: boolean | null): Promise<boolean>;
    url_change(text?: string, exclude?: boolean, timeout?: number, raiseErr?: boolean | null): Promise<WebPage | false>;
    title_change(text?: string, exclude?: boolean, timeout?: number, raiseErr?: boolean | null): Promise<WebPage | false>;
    download_begin(timeout?: number, cancelIt?: boolean): Promise<any | false>;
    downloads_done(timeout?: number, cancelIfTimeout?: boolean): Promise<boolean>;
    new_tab(timeout?: number, raiseErr?: boolean | null): Promise<string | false>;
    alert_closed(timeout?: number): Promise<WebPage | false>;
}
