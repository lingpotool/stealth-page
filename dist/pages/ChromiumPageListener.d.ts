import { ChromiumPage } from "./ChromiumPage";
export interface ListenStep {
    url: string;
    method: string;
    status?: number;
    requestHeaders?: Record<string, string>;
    responseHeaders?: Record<string, string>;
    requestBody?: string;
    responseBody?: string;
    requestId?: string;
    resourceType?: string;
    timestamp: number;
    frameId?: string;
    failed?: boolean;
    errorText?: string;
}
export type ResourceType = "Document" | "Stylesheet" | "Image" | "Media" | "Font" | "Script" | "TextTrack" | "XHR" | "Fetch" | "Prefetch" | "EventSource" | "WebSocket" | "Manifest" | "SignedExchange" | "Ping" | "CSPViolationReport" | "Preflight" | "Other";
export interface ListenerOptions {
    targets?: string | string[] | true;
    isRegex?: boolean;
    method?: string | string[] | true;
    resType?: ResourceType | ResourceType[] | true;
}
/**
 * 数据包类，对应 DrissionPage 的 DataPacket
 */
export declare class DataPacket {
    readonly tabId: string;
    readonly target: string | boolean;
    readonly url: string;
    readonly method: string;
    readonly frameId?: string;
    readonly resourceType?: string;
    private _rawRequest;
    private _rawResponse;
    private _rawPostData?;
    private _rawBody?;
    private _base64Body;
    private _isFailed;
    private _failInfo?;
    private _requestExtraInfo?;
    private _responseExtraInfo?;
    constructor(tabId: string, target: string | boolean, request: any);
    get is_failed(): boolean;
    get request(): DataPacketRequest;
    get response(): DataPacketResponse | null;
    get fail_info(): {
        errorText: string;
        canceled: boolean;
    } | null;
    _setResponse(response: any): void;
    _setBody(body: string, base64: boolean): void;
    _setFailed(errorText: string, canceled: boolean): void;
    _setRequestExtraInfo(info: any): void;
    _setResponseExtraInfo(info: any): void;
}
/**
 * 请求数据类
 */
export declare class DataPacketRequest {
    readonly url: string;
    readonly method: string;
    readonly headers: Record<string, string>;
    readonly postData?: string;
    private _extraInfo?;
    constructor(rawRequest: any, postData?: string, extraInfo?: any);
    get params(): Record<string, string>;
    get cookies(): Array<{
        name: string;
        value: string;
    }>;
    get extra_info(): any;
}
/**
 * 响应数据类
 */
export declare class DataPacketResponse {
    readonly url: string;
    readonly status: number;
    readonly statusText: string;
    readonly headers: Record<string, string>;
    readonly mimeType: string;
    private _rawBody?;
    private _base64Body;
    private _extraInfo?;
    constructor(rawResponse: any, rawBody?: string, base64Body?: boolean, extraInfo?: any);
    get raw_body(): string | undefined;
    get body(): any;
    get extra_info(): any;
}
/**
 * 网络监听器，对应 DrissionPage 的 Listener
 */
export declare class ChromiumPageListener {
    private readonly _page;
    private _listening;
    private _steps;
    private _packets;
    private _targets;
    private _isRegex;
    private _methods;
    private _resTypes;
    private _interceptEnabled;
    private _requestIdMap;
    private _packetMap;
    private _runningRequests;
    constructor(page: ChromiumPage);
    /**
     * 获取监听目标
     */
    get targets(): Set<string> | null;
    /**
     * 设置监听目标
     */
    set_targets(targets?: string | string[] | true | null, isRegex?: boolean, method?: string | string[] | true | null, resType?: ResourceType | ResourceType[] | true | null): void;
    /**
     * 开始监听
     */
    start(options?: ListenerOptions): Promise<void>;
    /**
     * 停止监听
     */
    stop(): void;
    /**
     * 暂停监听
     */
    pause(clear?: boolean): void;
    /**
     * 恢复监听
     */
    resume(): void;
    /**
     * 启用请求拦截
     */
    enable_intercept(): Promise<void>;
    /**
     * 禁用请求拦截
     */
    disable_intercept(): Promise<void>;
    /**
     * 获取监听到的数据包（旧格式）
     */
    get steps(): ListenStep[];
    /**
     * 获取监听到的数据包（新格式）
     */
    get packets(): DataPacket[];
    /**
     * 是否正在监听
     */
    get listening(): boolean;
    /**
     * 清空结果
     */
    clear(): void;
    /**
     * 等待指定数量的数据包
     */
    wait(count?: number, timeout?: number, fitCount?: boolean): Promise<DataPacket[] | DataPacket | false>;
    /**
     * 等待所有请求完成
     */
    wait_silent(timeout?: number, targetsOnly?: boolean, limit?: number): Promise<boolean>;
    /**
     * 迭代器，用于单步操作
     */
    steps_gen(count?: number, timeout?: number, gap?: number): AsyncGenerator<DataPacket | DataPacket[]>;
    private _matchTarget;
    private _matchMethod;
    private _matchResType;
    private _handleRequest;
    private _handleRequestExtraInfo;
    private _handleResponse;
    private _handleResponseExtraInfo;
    private _handleLoadingFinished;
    private _handleLoadingFailed;
}
