import { ChromiumOptions } from "../config/ChromiumOptions";
import { CDPSession } from "../core/CDPSession";
import { Browser } from "../core/Browser";
import { Page } from "../core/Page";
import { BrowserSetter } from "../units/BrowserSetter";
import { BrowserWaiter } from "../units/BrowserWaiter";
import { BrowserStates } from "../units/BrowserStates";
export interface ChromiumInitOptions {
    addrOrOpts?: string | ChromiumOptions;
}
export declare class Chromium {
    private static readonly _BROWSERS;
    private _options;
    private _browser;
    private _cdpSession;
    private _setter;
    private _waiter;
    private _states;
    private _disconnect_flag;
    private _is_headless;
    private _process_id;
    constructor(addrOrOpts?: string | ChromiumOptions);
    static get_instances(): Map<string, Chromium>;
    get set(): BrowserSetter;
    get wait(): BrowserWaiter;
    get states(): BrowserStates;
    get options(): ChromiumOptions;
    get browser(): Browser;
    get cdpSession(): CDPSession;
    get none_ele_return_value(): any;
    set none_ele_return_value(value: any);
    get none_ele_value(): any;
    set none_ele_value(value: any);
    get auto_handle_alert(): boolean | null;
    set auto_handle_alert(value: boolean | null);
    get _disconnect_flag_value(): boolean;
    get is_headless(): boolean;
    _on_disconnect(): void;
    _run_cdp(cmd: string, params?: Record<string, any>, _ignore?: any[]): Promise<any>;
    connect(): Promise<void>;
    new_page(): Promise<Page>;
    quit(options?: {
        timeout?: number;
        force?: boolean;
        delData?: boolean;
    }): Promise<void>;
    get_tab(idOrNum?: string | number, title?: string, url?: string, tabType?: string | string[]): Promise<{
        id: string;
        url: string;
        title: string;
        type: string;
    } | null>;
    get_tabs(title?: string, url?: string, tabType?: string | string[]): Promise<Array<{
        id: string;
        url: string;
        title: string;
        type: string;
    }>>;
    activate_tab(tabIdOrIndex: string | number): Promise<void>;
    close_tab(tabId: string): Promise<void>;
    new_tab(url?: string, options?: {
        newWindow?: boolean;
        background?: boolean;
        newContext?: boolean;
    }): Promise<string>;
    private _new_tab_by_js;
    get is_connected(): boolean;
    get_page_by_id(tabId: string): Promise<Page>;
    get_version(): Promise<{
        browser: string;
        protocol: string;
        userAgent: string;
    }>;
    version(): Promise<string>;
    tabs_count(): Promise<number>;
    tab_ids(): Promise<string[]>;
    latest_tab(): Promise<string | null>;
    cookies(allInfo?: boolean): Promise<any[]>;
    clear_cache(options?: {
        cache?: boolean;
        cookies?: boolean;
    }): Promise<void>;
    close_tabs(tabIds: string | string[], others?: boolean): Promise<void>;
    reconnect(): Promise<void>;
    process_id(): Promise<number | null>;
    get user_data_path(): string | undefined;
    get download_path(): string | undefined;
}
