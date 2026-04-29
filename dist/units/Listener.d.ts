import { CDPSession } from "../core/CDPSession";
export interface ListenerOwner {
    cdpSession: CDPSession;
    tab_id: string;
    _run_cdp(cmd: string, params?: any): Promise<any>;
}
export declare class ExtraInfo {
    protected _extraInfo: Record<string, any>;
    constructor(extraInfo: Record<string, any>);
    get all_info(): Record<string, any>;
}
export declare class RequestExtraInfo extends ExtraInfo {
    get requestId(): string;
    get associatedCookies(): any[];
    get headers(): Record<string, string>;
    get connectTiming(): Record<string, any>;
    get clientSecurityState(): Record<string, any>;
    get siteHasCookieInOtherPartition(): boolean;
}
export declare class ResponseExtraInfo extends ExtraInfo {
    get requestId(): string;
    get blockedCookies(): any[];
    get headers(): Record<string, string>;
    get resourceIPAddressSpace(): string;
    get statusCode(): number;
    get headersText(): string;
    get cookiePartitionKey(): string;
    get cookiePartitionKeyOpaque(): boolean;
}
export declare class FailInfo {
    private _dataPacket;
    private _failInfo;
    constructor(dataPacket: ListenerDataPacket, failInfo: Record<string, any>);
    get errorText(): string;
    get canceled(): boolean;
    get blockedReason(): string | null;
    get corsErrorStatus(): string | null;
}
export declare class Request {
    private _dataPacket;
    private _request;
    private _rawPostData;
    private _headers;
    constructor(dataPacket: ListenerDataPacket, rawRequest: Record<string, any>, postData: string | null);
    get url(): string;
    get method(): string;
    get urlFragment(): string;
    get hasPostData(): boolean;
    get postDataEntries(): any[];
    get mixedContentType(): string;
    get initialPriority(): string;
    get referrerPolicy(): string;
    get isLinkPreload(): boolean;
    get trustTokenParams(): Record<string, any>;
    get isSameSite(): boolean;
    get headers(): Record<string, string>;
    get params(): Record<string, string>;
    get postData(): any;
    get cookies(): any[];
    get extra_info(): RequestExtraInfo | null;
}
export declare class Response {
    private _dataPacket;
    private _response;
    private _rawBody;
    private _isBase64Body;
    private _body;
    private _headers;
    constructor(dataPacket: ListenerDataPacket, rawResponse: Record<string, any>, rawBody: string | null, base64Body: boolean);
    get url(): string;
    get status(): number;
    get statusText(): string;
    get headersText(): string;
    get mimeType(): string;
    get requestHeaders(): Record<string, string>;
    get requestHeadersText(): string;
    get connectionReused(): boolean;
    get connectionId(): any;
    get remoteIPAddress(): string;
    get remotePort(): number;
    get fromDiskCache(): boolean;
    get fromServiceWorker(): boolean;
    get fromPrefetchCache(): boolean;
    get fromEarlyHints(): boolean;
    get encodedDataLength(): number;
    get timing(): Record<string, any>;
    get protocol(): string;
    get securityState(): string;
    get securityDetails(): Record<string, any>;
    get headers(): Record<string, string>;
    get raw_body(): string;
    get body(): any;
    get extra_info(): ResponseExtraInfo | null;
}
export declare class ListenerDataPacket {
    tab_id: string;
    target: string | true;
    is_failed: boolean;
    _raw_request: any;
    _raw_post_data: any;
    _raw_response: any;
    _raw_body: any;
    _raw_fail_info: any;
    _base64_body: boolean;
    _requestExtraInfo: any;
    _responseExtraInfo: any;
    _resource_type: string | null;
    private _requestObj;
    private _responseObj;
    private _failInfoObj;
    constructor(tabId: string, target: string | true);
    get url(): string;
    get method(): string;
    get frame_id(): string | undefined;
    get resource_type(): string | null;
    get request(): Request;
    get response(): Response;
    get fail_info(): FailInfo | null;
    get body(): string | null;
    get post_data(): string | null;
    wait_extra_info(timeout?: number): Promise<boolean>;
    toString(): string;
}
export declare class Listener {
    private readonly _owner;
    private _listening;
    private _targets;
    private _is_regex;
    private _method;
    private _res_type;
    private _listenTargets;
    private _data;
    private _waitResolvers;
    private _isolateSession;
    private _requestIds;
    private _extraInfoIds;
    private _runningRequests;
    private _runningTargets;
    constructor(owner: ListenerOwner);
    get listening(): boolean;
    get data(): ListenerDataPacket[];
    get running_requests(): number;
    get running_targets(): number;
    get targets(): Set<string> | true | null;
    private get _session();
    set_targets(targets?: string | string[] | true, isRegex?: boolean, method?: string | string[] | true, resType?: string | string[] | true): void;
    start(targets?: string | string[] | true, isRegex?: boolean, method?: string | string[] | true, resType?: string | string[] | true): void;
    listen(targets?: string[]): void;
    listen_with_isolate(targets?: string[]): Promise<void>;
    private _setupCallbacks;
    private _methodMatches;
    private _resTypeMatches;
    private _onRequestWillBeSent;
    private _onRequestWillBeSentExtraInfo;
    private _onResponseReceived;
    private _onResponseReceivedExtraInfo;
    private _onLoadingFinished;
    private _onLoadingFailed;
    pause(clear?: boolean): void;
    resume(): void;
    stop(): void;
    wait(count?: number, timeout?: number, fitCount?: boolean): Promise<ListenerDataPacket | ListenerDataPacket[] | false>;
    wait_silent(timeout?: number, targetsOnly?: boolean, limit?: number): Promise<boolean>;
    clear(): void;
    steps(count?: number, timeout?: number, gap?: number): ListenerDataPacket[];
}
export declare class FrameListener extends Listener {
    private _frameOwner;
    private _is_diff;
    constructor(owner: any);
}
