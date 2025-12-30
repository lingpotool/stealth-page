import { CDPSession } from "../core/CDPSession";
/**
 * 控制台消息数据
 */
export interface ConsoleData {
    source: string;
    level: string;
    text: string;
    url?: string;
    line?: number;
    column?: number;
    timestamp?: number;
    args?: any[];
}
/**
 * 控制台消息监听器接口
 */
export interface ConsolePage {
    cdpSession: CDPSession;
}
/**
 * 控制台消息监听类，对应 DrissionPage 的 Console
 */
export declare class Console {
    private readonly _owner;
    private _listening;
    private _messages;
    private _handler;
    private _waitResolvers;
    constructor(owner: ConsolePage);
    /**
     * 是否正在监听
     */
    get listening(): boolean;
    /**
     * 获取已捕获的消息列表（获取后清空）
     */
    get messages(): ConsoleData[];
    /**
     * 开始监听控制台消息
     */
    start(): Promise<void>;
    /**
     * 停止监听并清空消息
     */
    stop(): Promise<void>;
    /**
     * 清空已捕获的消息
     */
    clear(): void;
    /**
     * 等待一条消息
     */
    wait(timeout?: number): Promise<ConsoleData | false>;
    /**
     * 迭代器，每监听到一条消息就返回
     */
    steps(timeout?: number): AsyncGenerator<ConsoleData, void, unknown>;
}
