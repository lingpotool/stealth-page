import { Chromium } from "../chromium/Chromium";
import { ChromiumOptions } from "../config/ChromiumOptions";
import { ChromiumTab } from "./ChromiumTab";
import { ChromiumBase } from "./ChromiumBase";
export declare class ChromiumPage extends ChromiumBase {
    constructor(addrOrOpts?: string | Chromium | ChromiumOptions);
    get tab_id(): string;
    init(): Promise<void>;
    new_tab(url?: string, options?: {
        newWindow?: boolean;
        background?: boolean;
        newContext?: boolean;
    }): Promise<ChromiumTab>;
    get_tab(options?: {
        idOrNum?: string | number;
        title?: string;
        url?: string;
        tabType?: string;
        asId?: boolean;
    }): Promise<ChromiumTab | string | null>;
    close(): Promise<void>;
    get_tabs(title?: string, url?: string, tabType?: string, asId?: boolean): Promise<Array<{
        id: string;
        url: string;
        title: string;
        type?: string;
    }>>;
    get_tab_ids(title?: string, url?: string, tabType?: string): Promise<string[]>;
    activate_tab(tabIdOrIndex: string | number): Promise<void>;
    close_tab(tabId?: string): Promise<void>;
    get tabs_count(): Promise<number>;
    get tab_ids(): Promise<string[]>;
    quit(options?: {
        timeout?: number;
        force?: boolean;
        delData?: boolean;
    }): Promise<void>;
    get address(): string;
    browser_version(): Promise<string>;
    latest_tab(): Promise<ChromiumTab | null>;
    close_tabs(tabIds: string | string[], others?: boolean): Promise<void>;
    process_id(): Promise<number | null>;
    _on_disconnect(): void;
}
