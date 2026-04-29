import { ChromiumPage } from "./ChromiumPage";
import { CookiesSetter } from "../units/CookiesSetter";
import { WindowSetter } from "../units/WindowSetter";
/**
 * 加载模式设置类（页面级别）
 */
export declare class PageLoadMode {
    private readonly _setter;
    constructor(setter: ChromiumPageSetter);
    /**
     * 设置为 normal 模式
     */
    normal(): Promise<void>;
    /**
     * 设置为 eager 模式
     */
    eager(): Promise<void>;
    /**
     * 设置为 none 模式
     */
    none(): Promise<void>;
}
export declare class ChromiumPageSetter {
    private readonly _page;
    private _loadMode;
    private _cookies;
    private _window;
    private _scrollSettings;
    constructor(page: ChromiumPage);
    /**
     * 返回用于设置加载模式的对象
     */
    get load_mode_setter(): PageLoadMode;
    /**
     * 返回用于设置 cookies 的对象
     */
    get cookies(): CookiesSetter;
    /**
     * 返回用于设置窗口的对象
     */
    get window(): WindowSetter;
    timeouts(base?: number, pageLoad?: number, script?: number): this;
    user_agent(ua: string, platform?: string): Promise<this>;
    window_size(width: number, height: number): Promise<this>;
    headers(headers: Record<string, string> | string): Promise<this>;
    download_path(path: string): Promise<this>;
    load_mode(mode: "normal" | "eager" | "none"): Promise<this>;
    blocked_urls(urls: string[] | null): Promise<this>;
    /**
     * 设置 sessionStorage
     */
    session_storage(item: string, value: string | false): Promise<this>;
    /**
     * 设置 localStorage
     */
    local_storage(item: string, value: string | false): Promise<this>;
    /**
     * 设置等待上传的文件路径
     */
    upload_files(files: string | string[]): Promise<this>;
    /**
     * 设置是否自动处理弹窗
     */
    auto_handle_alert(onOff?: boolean, accept?: boolean): Promise<this>;
    /**
     * 激活标签页
     */
    activate(): Promise<this>;
    /**
     * 设置连接失败时重连次数
     */
    retry_times(times: number): this;
    /**
     * 设置连接失败时重连间隔（秒）
     */
    retry_interval(interval: number): this;
    /**
     * 返回滚动设置对象
     */
    get scroll(): ScrollSettings;
    /**
     * 设置下载文件名
     */
    download_file_name(name?: string, suffix?: string): this;
    /**
     * 设置下载文件已存在时的处理方式
     * @param mode 'rename' | 'overwrite' | 'skip' | 'cancel'
     */
    when_download_file_exists(mode: string): this;
    none_element_value(value?: any, returnSelf?: boolean): this;
    none_element_raise(raise?: boolean): this;
}
/**
 * 滚动设置类
 */
export declare class ScrollSettings {
    private readonly _page;
    constructor(page: ChromiumPage);
    /**
     * 设置是否平滑滚动
     */
    smooth(onOff?: boolean): void;
    /**
     * 设置滚动后是否等待滚动结束
     */
    wait_complete(onOff?: boolean): void;
}
