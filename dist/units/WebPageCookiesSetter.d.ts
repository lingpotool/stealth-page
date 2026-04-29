import { CookiesSetter, CookieData } from "./CookiesSetter";
export declare class WebPageCookiesSetter extends CookiesSetter {
    private readonly _sessionSetter;
    constructor(owner: any, sessionPage: any);
    set(cookies: CookieData | CookieData[] | string | Record<string, string>): Promise<void>;
    remove(name: string, url?: string, domain?: string, path?: string): Promise<void>;
    clear(): Promise<void>;
}
