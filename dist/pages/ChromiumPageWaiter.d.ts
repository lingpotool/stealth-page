import { ChromiumPage } from "./ChromiumPage";
import { Element } from "../core/Element";
import { NoneElement } from "../core/NoneElement";
export declare class ChromiumPageWaiter {
    private readonly _page;
    constructor(page: ChromiumPage);
    wait(second: number, scope?: number): Promise<ChromiumPage>;
    ele(locator: string, timeoutMs?: number, intervalMs?: number): Promise<Element | NoneElement>;
    eles_loaded(locators: string | string[], timeout?: number, anyOne?: boolean, raiseErr?: boolean | null): Promise<boolean>;
    url_change(text?: string, exclude?: boolean, timeout?: number, raiseErr?: boolean | null): Promise<ChromiumPage | false>;
    title_change(text?: string, exclude?: boolean, timeout?: number, raiseErr?: boolean | null): Promise<ChromiumPage | false>;
    load_start(timeout?: number, raiseErr?: boolean | null): Promise<boolean>;
    doc_loaded(timeout?: number, raiseErr?: boolean | null): Promise<boolean>;
    js_ready(timeout?: number): Promise<boolean>;
    activated(timeout?: number): Promise<boolean>;
    load(timeoutMs?: number): Promise<boolean>;
    new_tab(timeout?: number, raiseErr?: boolean | null): Promise<string | false>;
    ele_deleted(locator: string, timeout?: number, raiseErr?: boolean | null): Promise<boolean>;
    ele_displayed(locator: string, timeout?: number, raiseErr?: boolean | null): Promise<boolean>;
    ele_hidden(locator: string, timeout?: number, raiseErr?: boolean | null): Promise<boolean>;
    upload_paths_inputted(timeout?: number): Promise<boolean>;
    download_begin(timeout?: number, cancelIt?: boolean): Promise<any | false>;
    downloads_done(timeout?: number, cancelIfTimeout?: boolean): Promise<boolean>;
    all_downloads_done(timeout?: number, cancelIfTimeout?: boolean): Promise<boolean>;
    alert(timeout?: number): Promise<boolean>;
    alert_closed(timeout?: number): Promise<ChromiumPage | false>;
}
