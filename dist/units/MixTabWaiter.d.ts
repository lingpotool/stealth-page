import { MixTab } from "../pages/MixTab";
export declare class MixTabWaiter {
    private readonly _owner;
    private readonly _chromiumWaiter;
    constructor(owner: MixTab);
    wait(second: number, scope?: number): Promise<MixTab>;
    ele_deleted(locator: string, timeout?: number, raiseErr?: boolean | null): Promise<boolean>;
    ele_displayed(locator: string, timeout?: number, raiseErr?: boolean | null): Promise<boolean>;
    ele_hidden(locator: string, timeout?: number, raiseErr?: boolean | null): Promise<boolean>;
    url_change(text?: string, exclude?: boolean, timeout?: number, raiseErr?: boolean | null): Promise<MixTab | false>;
    title_change(text?: string, exclude?: boolean, timeout?: number, raiseErr?: boolean | null): Promise<MixTab | false>;
    download_begin(timeout?: number, cancelIt?: boolean): Promise<any | false>;
    downloads_done(timeout?: number, cancelIfTimeout?: boolean): Promise<boolean>;
    new_tab(timeout?: number, raiseErr?: boolean | null): Promise<string | false>;
    alert_closed(timeout?: number): Promise<MixTab | false>;
}
