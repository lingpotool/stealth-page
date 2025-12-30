import { Chromium } from "../chromium/Chromium";
import { ChromiumOptions } from "../config/ChromiumOptions";
import { Element } from "../core/Element";
import { SessionElement } from "../core/SessionElement";
import { ChromiumPageSetter } from "./ChromiumPageSetter";
import { ChromiumPageWaiter } from "./ChromiumPageWaiter";
import { ChromiumPageActions } from "./ChromiumPageActions";
import { ChromiumPageListener } from "./ChromiumPageListener";
import { ChromiumPageDownloader } from "./ChromiumPageDownloader";
import { ChromiumFrame } from "./ChromiumFrame";
import { ChromiumTab } from "./ChromiumTab";
import { PageScroller } from "../units/PageScroller";
import { PageStates } from "../units/PageStates";
import { PageRect } from "../units/PageRect";
import { Console } from "../units/Console";
import { Screencast } from "../units/Screencast";
import { CookiesSetter } from "../units/CookiesSetter";
import { WindowSetter } from "../units/WindowSetter";
/**
 * Node 版 ChromiumPage，对应 DrissionPage.ChromiumPage。
 * 内部基于 core/Page 实现，后续逐步补充完整行为。
 */
export declare class ChromiumPage {
    private readonly _chromium;
    private _page;
    private _setter;
    private _waiter;
    private _actions;
    private _listener;
    private _downloader;
    private _scroller;
    private _states;
    private _rect;
    private _console;
    private _screencast;
    private _cookiesSetter;
    private _windowSetter;
    get set(): ChromiumPageSetter;
    /**
     * 等待功能 - 可以直接调用 page.wait(秒数) 或访问 page.wait.xxx 方法
     */
    get wait(): ChromiumPageWaiter & ((second: number, scope?: number) => Promise<ChromiumPage>);
    get actions(): ChromiumPageActions;
    get listen(): ChromiumPageListener;
    get download(): ChromiumPageDownloader;
    get scroll(): PageScroller;
    get states(): PageStates;
    get rect(): PageRect;
    get console(): Console;
    get screencast(): Screencast;
    get cookies_setter(): CookiesSetter;
    /**
     * 获取当前页面的所有 cookies
     */
    get cookies(): Promise<any[]>;
    private _getCookies;
    get window(): WindowSetter;
    constructor(addrOrOpts?: string | Chromium | ChromiumOptions);
    get browser(): Chromium;
    init(): Promise<void>;
    get(url: string): Promise<boolean>;
    ele(locator: string, index?: number): Promise<Element | null>;
    eles(locator: string): Promise<Element[]>;
    /**
     * 以 SessionElement 形式返回元素（高效处理复杂页面）
     */
    s_ele(locator: string, index?: number, timeout?: number): Promise<SessionElement | null>;
    /**
     * 以 SessionElement 列表形式返回所有匹配元素
     */
    s_eles(locator: string, timeout?: number): Promise<SessionElement[]>;
    ele_text(locator: string): Promise<string | null>;
    ele_html(locator: string): Promise<string | null>;
    eles_attrs(locator: string, attrs: string[]): Promise<Array<Record<string, string>>>;
    html(): Promise<string>;
    title(): Promise<string>;
    url(): Promise<string>;
    new_tab(url?: string, options?: {
        newWindow?: boolean;
        background?: boolean;
    }): Promise<ChromiumTab>;
    /**
     * 获取一个标签页对象
     */
    get_tab(options?: {
        idOrNum?: string | number;
        title?: string;
        url?: string;
        asId?: boolean;
    }): Promise<ChromiumTab | string | null>;
    close(): Promise<void>;
    run_js(script: string): Promise<any>;
    set_cookies(cookies: Array<{
        name: string;
        value: string;
        domain?: string;
        path?: string;
    }>): Promise<void>;
    refresh(): Promise<void>;
    back(): Promise<void>;
    forward(): Promise<void>;
    get_tabs(): Promise<Array<{
        id: string;
        url: string;
        title: string;
    }>>;
    activate_tab(tabId: string): Promise<void>;
    close_tab(tabId?: string): Promise<void>;
    get tabs_count(): number;
    get tab_ids(): string[];
    scroll_to(x: number, y: number): Promise<void>;
    scroll_to_top(): Promise<void>;
    scroll_to_bottom(): Promise<void>;
    quit(): Promise<void>;
    handle_alert(accept?: boolean, promptText?: string): Promise<void>;
    screenshot(path?: string): Promise<Buffer>;
    get_frames(): Promise<Array<{
        id: string;
        url: string;
        name: string;
    }>>;
    /**
     * 获取页面中的一个 frame 对象
     */
    get_frame(locIndEle: string | number | Element): Promise<ChromiumFrame | null>;
    stop_loading(): Promise<void>;
    reload(): Promise<void>;
    set_geolocation(latitude: number, longitude: number, accuracy?: number): Promise<void>;
    clear_geolocation(): Promise<void>;
    /**
     * 获取 sessionStorage
     */
    session_storage(item?: string): Promise<string | Record<string, string> | null>;
    /**
     * 获取 localStorage
     */
    local_storage(item?: string): Promise<string | Record<string, string> | null>;
    /**
     * 清除缓存
     */
    clear_cache(options?: {
        sessionStorage?: boolean;
        localStorage?: boolean;
        cache?: boolean;
        cookies?: boolean;
    }): Promise<void>;
    private _initScripts;
    /**
     * 添加初始化脚本
     */
    add_init_js(script: string): Promise<string>;
    /**
     * 移除初始化脚本
     */
    remove_init_js(scriptId?: string): Promise<void>;
    /**
     * 执行 CDP 命令
     */
    run_cdp(cmd: string, params?: Record<string, any>): Promise<any>;
    /**
     * 执行 CDP 命令（等待页面加载完成）
     */
    run_cdp_loaded(cmd: string, params?: Record<string, any>): Promise<any>;
    /**
     * 异步执行 JS
     */
    run_async_js(script: string): Promise<void>;
    /**
     * 保存页面为 PDF 或 MHTML
     */
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
    /**
     * 获取浏览器版本
     */
    browser_version(): Promise<string>;
    /**
     * 获取浏览器进程 ID
     */
    process_id(): Promise<number | null>;
    /**
     * 获取浏览器地址
     */
    get address(): string;
    /**
     * 获取最新的标签页 ID
     */
    latest_tab(): Promise<string | null>;
    /**
     * 关闭多个标签页
     */
    close_tabs(tabIds: string | string[], others?: boolean): Promise<void>;
    /**
     * 获取当前焦点所在元素
     */
    active_ele(): Promise<Element | null>;
    /**
     * 从页面删除一个元素
     */
    remove_ele(locOrEle: string | Element): Promise<void>;
    /**
     * 添加一个新元素
     */
    add_ele(htmlOrInfo: string | {
        tag: string;
        attrs?: Record<string, string>;
    }, insertTo?: string | Element, before?: string | Element): Promise<Element | null>;
}
