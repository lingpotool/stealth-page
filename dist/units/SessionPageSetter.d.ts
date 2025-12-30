import { SessionPage } from "../pages/SessionPage";
/**
 * SessionPage 设置类
 * 对应 DrissionPage.SessionPageSetter
 */
export declare class SessionPageSetter {
    private readonly _owner;
    constructor(owner: SessionPage);
    /**
     * 设置下载路径
     */
    download_path(path: string | null): void;
    /**
     * 设置连接超时时间
     */
    timeout(second: number): void;
    /**
     * 设置编码
     */
    encoding(encoding: string | null, _setAll?: boolean): void;
    /**
     * 设置通用 headers
     */
    headers(headers: Record<string, string> | string): void;
    /**
     * 设置单个 header
     */
    header(name: string, value: string): void;
    /**
     * 设置 User-Agent
     */
    user_agent(ua: string): void;
    /**
     * 设置代理
     */
    proxies(http?: string, https?: string): void;
    /**
     * 设置重试次数
     */
    retry_times(times: number): void;
    /**
     * 设置重试间隔
     */
    retry_interval(interval: number): void;
    /**
     * 设置是否验证 SSL 证书
     */
    verify(onOff: boolean | null): void;
    /**
     * 设置是否允许重定向
     */
    allow_redirects(onOff: boolean): void;
    /**
     * 设置最大重定向次数
     */
    max_redirects(times: number | null): void;
}
