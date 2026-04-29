import { MixTab } from "../pages/MixTab";
import { WebPageCookiesSetter } from "./WebPageCookiesSetter";
export declare class MixTabSetter {
    private readonly _owner;
    private readonly _sessionSetter;
    constructor(owner: MixTab);
    get cookies(): WebPageCookiesSetter;
    timeouts(base?: number, pageLoad?: number, script?: number): Promise<void>;
    download_path(path: string): Promise<void>;
    download_file_name(name?: string, suffix?: string): Promise<void>;
    when_download_file_exists(mode: string): Promise<void>;
    activate(): Promise<void>;
    headers(headers: Record<string, string>): Promise<void>;
    user_agent(ua: string, platform?: string): Promise<void>;
    session_storage(item: string, value: string | boolean): Promise<void>;
    local_storage(item: string, value: string | boolean): Promise<void>;
    upload_files(files: string | string[]): Promise<void>;
    auto_handle_alert(onOff?: boolean, accept?: boolean): Promise<void>;
    blocked_urls(urls: string | string[] | null): Promise<void>;
    timeout(second: number): void;
    encoding(encoding: string | null, setAll?: boolean): void;
    proxies(http?: string, https?: string): void;
    verify(onOff: boolean | null): void;
}
