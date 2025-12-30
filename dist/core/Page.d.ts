import { CDPSession } from "./CDPSession";
import { Element } from "./Element";
export interface NavigationOptions {
    timeoutMs?: number;
    waitUntil?: "load" | "domcontentloaded" | "networkidle0" | "networkidle2";
}
export interface PageInitOptions {
    userAgent?: string;
    viewport?: {
        width: number;
        height: number;
        deviceScaleFactor?: number;
    };
}
export declare class Page {
    private readonly session;
    constructor(session: CDPSession);
    get cdpSession(): CDPSession;
    init(options?: PageInitOptions): Promise<void>;
    get(url: string, options?: NavigationOptions): Promise<void>;
    ele(locator: string): Promise<Element | null>;
    ele_text(locator: string): Promise<string | null>;
    ele_html(locator: string): Promise<string | null>;
    eles_attrs(locator: string, attrs: string[]): Promise<Array<Record<string, string>>>;
    eles(locator: string): Promise<Element[]>;
    runJs<T = any>(expression: string): Promise<T>;
    html(): Promise<string>;
    title(): Promise<string>;
    url(): Promise<string>;
    cookies(): Promise<Array<{
        name: string;
        value: string;
        domain: string;
        path: string;
        expires?: number;
        httpOnly?: boolean;
        secure?: boolean;
    }>>;
    set_cookies(cookies: Array<{
        name: string;
        value: string;
        domain?: string;
        path?: string;
    }>): Promise<void>;
    refresh(): Promise<void>;
    back(): Promise<void>;
    forward(): Promise<void>;
    scroll_to(x: number, y: number): Promise<void>;
    scroll_to_top(): Promise<void>;
    scroll_to_bottom(): Promise<void>;
    handle_alert(accept?: boolean, promptText?: string): Promise<void>;
    screenshot(path?: string): Promise<Buffer>;
    get_frame(_frameId: string): Promise<Page>;
    get_frames(): Promise<Array<{
        id: string;
        url: string;
        name: string;
    }>>;
    stop_loading(): Promise<void>;
    reload(): Promise<void>;
    set_geolocation(latitude: number, longitude: number, accuracy?: number): Promise<void>;
    clear_geolocation(): Promise<void>;
}
