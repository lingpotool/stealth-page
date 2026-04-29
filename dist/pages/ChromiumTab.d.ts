import { Chromium } from "../chromium/Chromium";
import { Element } from "../core/Element";
import { ChromiumBase } from "./ChromiumBase";
export declare class ChromiumTab extends ChromiumBase {
    protected readonly _tabId: string;
    constructor(browser: Chromium, tabId: string);
    get tab_id(): string;
    init(): Promise<void>;
    close(others?: boolean): Promise<void>;
    activate(): Promise<void>;
    get_screenshot(path?: string, name?: string, asBytes?: boolean | 'jpg' | 'jpeg' | 'png' | 'webp', asBase64?: boolean | 'jpg' | 'jpeg' | 'png' | 'webp', fullPage?: boolean, leftTop?: [number, number], rightBottom?: [number, number]): Promise<string | Buffer>;
    get_frame_elements(locator?: string): Promise<Element[]>;
    _on_disconnect(): void;
}
