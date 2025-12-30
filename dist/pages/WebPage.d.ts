import { SessionPage } from "./SessionPage";
import { ChromiumOptions } from "../config/ChromiumOptions";
import { SessionOptions } from "../config/SessionOptions";
import { SessionElement } from "../core/SessionElement";
export type WebPageMode = "d" | "s";
/**
 * Node 版 WebPage，对应 DrissionPage.WebPage。
 * 通过 mode 切换浏览器驱动模式(d)和会话模式(s)。
 */
export declare class WebPage {
    private _mode;
    private readonly _chromiumPage;
    private readonly _sessionPage;
    get wait(): any;
    /**
     * 滚动操作对象（仅 d 模式）
     */
    get scroll(): any;
    /**
     * 状态检查对象（仅 d 模式）
     */
    get states(): any;
    /**
     * 位置信息对象（仅 d 模式）
     */
    get rect(): any;
    /**
     * 控制台监听对象（仅 d 模式）
     */
    get console(): any;
    /**
     * 录屏对象（仅 d 模式）
     */
    get screencast(): any;
    /**
     * 窗口设置对象（仅 d 模式）
     */
    get window(): any;
    constructor(mode?: WebPageMode, _timeout?: number | null, chromiumOptions?: ChromiumOptions, sessionOrOptions?: SessionOptions);
    get mode(): WebPageMode;
    change_mode(mode?: WebPageMode): void;
    get chromium_options(): ChromiumOptions;
    get session_options(): SessionOptions;
    get set(): any;
    get actions(): any;
    get listen(): any;
    get download(): any;
    get(url: string, options?: any): Promise<boolean>;
    post(url: string, options?: any): Promise<boolean>;
    ele(locator: any, index?: number, timeout?: number): Promise<any>;
    eles(locator: string): Promise<any[]>;
    /**
     * 以 SessionElement 形式返回元素
     * d 模式下会获取页面 HTML 后解析，s 模式下直接返回
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
    cookies(): Promise<any[]>;
    new_tab(url?: string): Promise<any>;
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
    get tabs_count(): number;
    get tab_ids(): string[];
    scroll_to(x: number, y: number): Promise<void>;
    scroll_to_top(): Promise<void>;
    scroll_to_bottom(): Promise<void>;
    quit(): Promise<void>;
    put(url: string, extra?: any): Promise<boolean>;
    delete(url: string, extra?: any): Promise<boolean>;
    get_tabs(): Promise<any[]>;
    get_tab(tabId: string): Promise<any>;
    activate_tab(tabId: string): Promise<void>;
    close_tab(tabId?: string): Promise<void>;
    handle_alert(accept?: boolean, promptText?: string): Promise<void>;
    screenshot(path?: string): Promise<Buffer>;
    get_frames(): Promise<any[]>;
    stop_loading(): Promise<void>;
    reload(): Promise<void>;
    set_geolocation(latitude: number, longitude: number, accuracy?: number): Promise<void>;
    clear_geolocation(): Promise<void>;
    /**
     * 把浏览器的 cookies 复制到 session 对象
     */
    cookies_to_session(copyUserAgent?: boolean): Promise<void>;
    /**
     * 把 session 对象的 cookies 复制到浏览器
     */
    cookies_to_browser(): Promise<void>;
    /**
     * 获取 user agent
     */
    user_agent(): Promise<string>;
    /**
     * 获取 session 对象
     */
    get session(): SessionPage;
    /**
     * 获取响应头（仅 s 模式）
     */
    get response_headers(): any;
    /**
     * 获取响应状态码（仅 s 模式）
     */
    get status(): number | null;
    /**
     * 返回页面原始数据
     */
    get raw_data(): string | null;
    /**
     * 当返回内容是 json 格式时，返回对应的字典
     */
    json(): Promise<any>;
    /**
     * 执行 CDP 命令（仅 d 模式）
     */
    run_cdp(cmd: string, params?: Record<string, any>): Promise<any>;
    /**
     * 获取 localStorage（仅 d 模式）
     */
    local_storage(item?: string): Promise<string | Record<string, string> | null>;
    /**
     * 获取 sessionStorage（仅 d 模式）
     */
    session_storage(item?: string): Promise<string | Record<string, string> | null>;
    /**
     * 清除缓存（仅 d 模式）
     */
    clear_cache(options?: {
        sessionStorage?: boolean;
        localStorage?: boolean;
        cache?: boolean;
        cookies?: boolean;
    }): Promise<void>;
    /**
     * 添加初始化脚本（仅 d 模式）
     */
    add_init_js(script: string): Promise<string>;
    /**
     * 移除初始化脚本（仅 d 模式）
     */
    remove_init_js(scriptId?: string): Promise<void>;
    /**
     * 保存页面（仅 d 模式）
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
     * 获取当前焦点元素（仅 d 模式）
     */
    active_ele(): Promise<any>;
    /**
     * 删除元素（仅 d 模式）
     */
    remove_ele(locOrEle: string | any): Promise<void>;
    /**
     * 添加元素（仅 d 模式）
     */
    add_ele(htmlOrInfo: string | {
        tag: string;
        attrs?: Record<string, string>;
    }, insertTo?: string | any, before?: string | any): Promise<any>;
    /**
     * 获取 frame（仅 d 模式）
     */
    get_frame(locIndEle: string | number | any): Promise<any>;
}
