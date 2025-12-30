export interface SessionOptionsInit {
    downloadPath?: string;
    timeout?: number;
    retryTimes?: number;
    retryInterval?: number;
    headers?: Record<string, string>;
    proxies?: {
        http?: string;
        https?: string;
    };
}
/**
 * Node 版 SessionOptions，对齐 DrissionPage.SessionOptions 的主要字段。
 * 当前仅用于描述配置，HTTP 细节后续实现。
 */
export declare class SessionOptions {
    downloadPath: string;
    timeout: number;
    retryTimes: number;
    retryInterval: number;
    headers: Record<string, string>;
    proxies: {
        http?: string;
        https?: string;
    };
    constructor(init?: SessionOptionsInit);
    set_download_path(path: string): this;
    set_timeouts(timeout: number): this;
    set_retry(times: number, interval: number): this;
    set_headers(headers: Record<string, string>): this;
    set_proxies(http?: string, https?: string): this;
    set_a_header(key: string, value: string): this;
    remove_a_header(key: string): this;
}
