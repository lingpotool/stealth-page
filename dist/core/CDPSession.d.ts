export type CDPEventHandler = (params: any) => void;
export interface CDPSession {
    send<T = any>(method: string, params?: Record<string, any>): Promise<T>;
    on(event: string, handler: CDPEventHandler): void;
    off(event: string, handler: CDPEventHandler): void;
    close?(): void;
    createChildSession?(sessionId: string): CDPSession;
}
