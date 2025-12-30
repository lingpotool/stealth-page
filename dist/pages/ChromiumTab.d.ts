import { Chromium } from "../chromium/Chromium";
import { Page } from "../core/Page";
import { Element } from "../core/Element";
import { SessionElement } from "../core/SessionElement";
import { ChromiumPageSetter } from "./ChromiumPageSetter";
import { ChromiumPageWaiter } from "./ChromiumPageWaiter";
import { ChromiumPageActions } from "./ChromiumPageActions";
import { ChromiumPageListener } from "./ChromiumPageListener";
import { ChromiumPageDownloader } from "./ChromiumPageDownloader";
import { ChromiumFrame } from "./ChromiumFrame";
import { PageScroller } from "../units/PageScroller";
import { PageStates } from "../units/PageStates";
import { PageRect } from "../units/PageRect";
import { Console } from "../units/Console";
import { Screencast } from "../units/Screencast";
import { CookiesSetter } from "../units/CookiesSetter";
import { WindowSetter } from "../units/WindowSetter";
/**
 * ChromiumTab - 浏览器标签页类
 * 对应 DrissionPage.ChromiumTab
 */
export declare class ChromiumTab {
    protected readonly _browser: Chromium;
    protected readonly _tabId: string;
    protected _page: Page | null;
    protected _setter: ChromiumPageSetter | null;
    protected _waiter: ChromiumPageWaiter | null;
    protected _actions: ChromiumPageActions | null;
    protected _listener: ChromiumPageListener | null;
    protected _downloader: ChromiumPageDownloader | null;
    protected _scroller: PageScroller | null;
    protected _states: PageStates | null;
    protected _rect: PageRect | null;
    protected _console: Console | null;
    protected _screencast: Screencast | null;
    protected _cookiesSetter: CookiesSetter | null;
    protected _windowSetter: WindowSetter | null;
    constructor(browser: Chromium, tabId: string);
    get browser(): Chromium;
    get tab_id(): string;
    get set(): ChromiumPageSetter;
    get wait(): ChromiumPageWaiter;
    get actions(): ChromiumPageActions;
    get listen(): ChromiumPageListener;
    get download(): ChromiumPageDownloader;
    get scroll(): PageScroller;
    get states(): PageStates;
    get rect(): PageRect;
    get console(): Console;
    get screencast(): Screencast;
    get cookies_setter(): CookiesSetter;
    get window(): WindowSetter;
    init(): Promise<void>;
    get(url: string): Promise<boolean>;
    refresh(ignoreCache?: boolean): Promise<void>;
    back(steps?: number): Promise<void>;
    forward(steps?: number): Promise<void>;
    stop_loading(): Promise<void>;
    html(): Promise<string>;
    title(): Promise<string>;
    url(): Promise<string>;
    cookies(allDomains?: boolean, allInfo?: boolean): Promise<any[]>;
    ele(locator: string, index?: number, timeout?: number): Promise<Element | null>;
    eles(locator: string, timeout?: number): Promise<Element[]>;
    /**
     * 以 SessionElement 形式返回元素（高效处理复杂页面）
     */
    s_ele(locator: string, index?: number, timeout?: number): Promise<SessionElement | null>;
    /**
     * 以 SessionElement 列表形式返回所有匹配元素
     */
    s_eles(locator: string, timeout?: number): Promise<SessionElement[]>;
    run_js(script: string, ...args: any[]): Promise<any>;
    run_js_loaded(script: string, ...args: any[]): Promise<any>;
    run_async_js(script: string, ...args: any[]): Promise<void>;
    run_cdp(cmd: string, params?: Record<string, any>): Promise<any>;
    close(others?: boolean): Promise<void>;
    activate(): Promise<void>;
    get_frame(locIndEle: string | number | Element): Promise<ChromiumFrame | null>;
    get_frames(locator?: string): Promise<Element[]>;
    screenshot(path?: string): Promise<Buffer>;
    get_screenshot(options?: {
        path?: string;
        name?: string;
        asBytes?: boolean;
        asBase64?: boolean;
        fullPage?: boolean;
    }): Promise<string | Buffer>;
    save(options?: {
        path?: string;
        name?: string;
        asPdf?: boolean;
        landscape?: boolean;
        printBackground?: boolean;
        scale?: number;
        paperWidth?: number;
        paperHeight?: number;
        marginTop?: number;
        marginBottom?: number;
        marginLeft?: number;
        marginRight?: number;
        pageRanges?: string;
    }): Promise<Buffer | string>;
    session_storage(item?: string): Promise<string | Record<string, string> | null>;
    local_storage(item?: string): Promise<string | Record<string, string> | null>;
    clear_cache(options?: {
        sessionStorage?: boolean;
        localStorage?: boolean;
        cache?: boolean;
        cookies?: boolean;
    }): Promise<void>;
    handle_alert(accept?: boolean, send?: string, timeout?: number): Promise<string | false>;
    active_ele(): Promise<Element | null>;
    remove_ele(locOrEle: string | Element): Promise<void>;
    add_ele(htmlOrInfo: string | {
        tag: string;
        attrs?: Record<string, string>;
    }, insertTo?: string | Element, before?: string | Element): Promise<Element | null>;
    private _initScripts;
    add_init_js(script: string): Promise<string>;
    remove_init_js(scriptId?: string): Promise<void>;
    set_cookies(cookies: Array<{
        name: string;
        value: string;
        domain?: string;
        path?: string;
    }>): Promise<void>;
}
