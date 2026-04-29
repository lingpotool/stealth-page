import { CDPSession, CDPEventHandler } from "./CDPSession";
export interface CdpErrorInfo {
    error: string;
    type: string;
    method?: string;
    args?: Record<string, any>;
    data?: any;
}
export declare class WebSocketCDPSession implements CDPSession {
    private readonly ws;
    private nextId;
    private readonly pending;
    private readonly eventHandlers;
    private readonly sessionEventHandlers;
    private readonly immediateEventHandlers;
    private readonly immediateEventQueue;
    owner?: any;
    alert_flag: boolean;
    private constructor();
    private _initAlertListeners;
    static connect(url: string): Promise<WebSocketCDPSession>;
    set_callback(event: string, callback: CDPEventHandler, immediate?: boolean): void;
    send<T = any>(method: string, params?: Record<string, any>, timeout?: number): Promise<T>;
    sendToSession<T = any>(sessionId: string, method: string, params?: Record<string, any>, timeout?: number): Promise<T>;
    run<T = any>(method: string, params?: Record<string, any>, _ignore?: any[]): Promise<T>;
    runInSession<T = any>(sessionId: string, method: string, params?: Record<string, any>, _ignore?: any[]): Promise<T>;
    private _shouldIgnore;
    on(event: string, handler: CDPEventHandler): void;
    once(event: string, handler: CDPEventHandler): void;
    off(event: string, handler: CDPEventHandler): void;
    onSession(sessionId: string, event: string, handler: CDPEventHandler): void;
    offSession(sessionId: string, event: string, handler: CDPEventHandler): void;
    createChildSession(sessionId: string): CDPSession;
    close(): void;
    private handleMessage;
    private handleError;
    private handleClose;
}
export declare class BrowserDriver {
    private static readonly BROWSERS;
    readonly id: string;
    readonly address: string;
    owner?: any;
    readonly session: WebSocketCDPSession;
    private constructor();
    static get(id: string, address: string, owner?: any): Promise<BrowserDriver>;
    static has(id: string): boolean;
    static remove(id: string): void;
    send<T = any>(method: string, params?: Record<string, any>, timeout?: number): Promise<T>;
    run<T = any>(method: string, params?: Record<string, any>, _ignore?: any[]): Promise<T>;
    set_callback(event: string, callback: CDPEventHandler, immediate?: boolean): void;
    close(): void;
}
