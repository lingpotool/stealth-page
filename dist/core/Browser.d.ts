import { CDPSession } from "./CDPSession";
import { Page } from "./Page";
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
    private constructor();
    static attach(session: CDPSession, options?: BrowserOptions): Promise<Browser>;
    newPage(): Promise<Page>;
    close(): Promise<void>;
}
