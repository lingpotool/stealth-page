import { Chromium } from "../chromium/Chromium";
import { WindowSetter } from "./WindowSetter";
import { BrowserCookiesSetter } from "./BrowserCookiesSetter";
import { LoadMode } from "./LoadMode";
/**
 * 浏览器设置类
 * 对应 DrissionPage.BrowserSetter
 */
export declare class BrowserSetter {
    private readonly _browser;
    private _cookiesSetter;
    private _windowSetter;
    private _loadMode;
    constructor(browser: Chromium);
    /**
     * 返回用于设置 cookies 的对象
     */
    get cookies(): BrowserCookiesSetter;
    /**
     * 返回用于设置窗口的对象
     */
    get window(): WindowSetter;
    /**
     * 返回用于设置页面加载模式的对象
     */
    get load_mode(): LoadMode;
    /**
     * 设置超时时间
     */
    timeouts(base?: number, pageLoad?: number, script?: number): void;
    /**
     * 设置是否自动处理弹窗
     */
    auto_handle_alert(onOff?: boolean, accept?: boolean): void;
    /**
     * 设置下载路径
     */
    download_path(path: string | null): void;
    /**
     * 设置下一个被下载文件的名称
     */
    download_file_name(name?: string, suffix?: string): void;
    /**
     * 设置当存在同名文件时的处理方式
     */
    when_download_file_exists(mode: "skip" | "rename" | "overwrite" | "s" | "r" | "o"): void;
    /**
     * 设置重试次数
     */
    retry_times(times: number): void;
    /**
     * 设置重试间隔
     */
    retry_interval(interval: number): void;
    /**
     * 设置空元素返回值
     */
    NoneElement_value(value?: any, onOff?: boolean): void;
}
