import { CDPSession, CDPEventHandler } from "./CDPSession";
/**
 * 通过 WebSocket 实现的 CDP 会话，用于连接 Chrome DevTools 协议。
 */
export declare class WebSocketCDPSession implements CDPSession {
    private readonly ws;
    private nextId;
    private readonly pending;
    private readonly eventHandlers;
    private readonly sessionEventHandlers;
    private constructor();
    static connect(url: string): Promise<WebSocketCDPSession>;
    send<T = any>(method: string, params?: Record<string, any>): Promise<T>;
    /**
     * 向特定 session 发送命令（flatten 模式）
     */
    sendToSession<T = any>(sessionId: string, method: string, params?: Record<string, any>): Promise<T>;
    on(event: string, handler: CDPEventHandler): void;
    off(event: string, handler: CDPEventHandler): void;
    /**
     * 为特定 session 注册事件处理器
     */
    onSession(sessionId: string, event: string, handler: CDPEventHandler): void;
    /**
     * 移除特定 session 的事件处理器
     */
    offSession(sessionId: string, event: string, handler: CDPEventHandler): void;
    /**
     * 创建子会话（用于 flatten 模式）
     */
    createChildSession(sessionId: string): CDPSession;
    close(): void;
    private handleMessage;
    private handleError;
    private handleClose;
}
