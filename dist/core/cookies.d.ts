export interface CookieDict {
    name: string;
    value: string;
    domain?: string;
    url?: string;
    path?: string;
    expires?: number | string;
    expiry?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: string | null | false;
    priority?: string | null | false;
    sourceScheme?: string | null | false;
    [key: string]: any;
}
export declare function format_cookie(cookie: CookieDict): CookieDict;
export declare function format_cookies(cookies: CookieDict[]): CookieDict[];
export declare function make_cookie_info(cookie: Record<string, any>): Record<string, any>;
interface PageLike {
    run_cdp(method: string, params?: Record<string, any>): Promise<any>;
    url: string;
}
export declare function set_tab_cookie(page: PageLike, cookies: CookieDict | CookieDict[]): Promise<void>;
export declare class CookiesList extends Array<CookieDict> {
    as_dict(): Record<string, string>;
    as_str(): string;
    as_json(): string;
}
export declare function cookie_to_dict(cookie: CookieDict | string): CookieDict;
export declare function cookies_to_tuple(cookies: CookieDict | CookieDict[] | string | Record<string, string>): CookieDict[];
export {};
