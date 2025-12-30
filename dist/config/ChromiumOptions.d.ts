export interface ChromiumTimeouts {
    base: number;
    pageLoad: number;
    script: number;
}
export interface ChromiumOptionsInit {
    browserPath?: string;
    userDataPath?: string;
    downloadPath?: string;
    tmpPath?: string | null;
    address?: string;
    arguments?: string[];
    extensions?: string[];
    flags?: Record<string, any>;
    timeouts?: ChromiumTimeouts;
    uploadFiles?: string[];
}
/**
 * Node 版的 ChromiumOptions，对齐 DrissionPage.ChromiumOptions 的主要字段和方法。
 * 目前只定义结构，具体行为在后续实现。
 */
export declare class ChromiumOptions {
    browserPath: string;
    userDataPath?: string;
    downloadPath: string;
    tmpPath: string | null;
    address: string;
    arguments: string[];
    extensions: string[];
    flags: Record<string, any>;
    timeouts: ChromiumTimeouts;
    uploadFiles: string[];
    constructor(init?: ChromiumOptionsInit);
    set_timeouts(base: number, pageLoad?: number, script?: number): this;
    set_paths(options: {
        downloadPath?: string;
        tmpPath?: string | null;
        userDataPath?: string;
    }): this;
    set_argument(arg: string): this;
    remove_argument(arg: string): this;
    headless(enabled?: boolean): this;
    incognito(enabled?: boolean): this;
    no_imgs(enabled?: boolean): this;
    no_js(enabled?: boolean): this;
    mute(enabled?: boolean): this;
    set_browser_path(path: string): this;
    set_address(address: string): this;
    set_user_data_path(path: string): this;
    add_extension(path: string): this;
    remove_extension(path: string): this;
    set_flag(key: string, value: any): this;
    remove_flag(key: string): this;
}
