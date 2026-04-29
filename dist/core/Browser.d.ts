import { CDPSession } from "./CDPSession";
import { Page } from "./Page";
import { DownloadManager } from "./DownloadManager";
export interface BrowserOptions {
    userAgent?: string;
    viewport?: {
        width: number;
        height: number;
        deviceScaleFactor?: number;
    };
}
export declare class Browser {
    private readonly session;
    private readonly options;
    private closed;
    readonly _drivers: Map<string, CDPSession>;
    readonly _all_drivers: Map<string, CDPSession>;
    readonly _frames: Map<string, string>;
    readonly _relation: Map<string, string>;
    readonly _dl_mgr: DownloadManager;
    private _targetListenersInitialized;
    private constructor();
    static attach(session: CDPSession, options?: BrowserOptions): Promise<Browser>;
    private _initTargetListeners;
    get_driver(targetId: string): Promise<CDPSession>;
    newPage(): Promise<Page>;
    close(): Promise<void>;
}
