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
}
