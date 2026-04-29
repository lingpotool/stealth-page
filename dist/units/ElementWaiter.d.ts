import { CDPSession } from "../core/CDPSession";
export interface WaitableElement {
    readonly session: CDPSession;
    readonly nodeId: number;
    getObjectId(): Promise<string>;
    is_displayed(): Promise<boolean>;
    is_enabled(): Promise<boolean>;
    is_covered?(): Promise<number | false>;
    get_rect(): Promise<{
        x: number;
        y: number;
        width: number;
        height: number;
    }>;
}
export declare class ElementWaiter {
    private readonly _ele;
    private readonly _defaultTimeout;
    constructor(ele: WaitableElement, defaultTimeout?: number);
    __call__(second: number, scope?: number): Promise<WaitableElement>;
    deleted(timeout?: number, raiseErr?: boolean | null): Promise<WaitableElement | false>;
    displayed(timeout?: number, raiseErr?: boolean | null): Promise<WaitableElement | false>;
    hidden(timeout?: number, raiseErr?: boolean | null): Promise<WaitableElement | false>;
    covered(timeout?: number, raiseErr?: boolean | null): Promise<WaitableElement | false>;
    not_covered(timeout?: number, raiseErr?: boolean | null): Promise<WaitableElement | false>;
    enabled(timeout?: number, raiseErr?: boolean | null): Promise<WaitableElement | false>;
    disabled(timeout?: number, raiseErr?: boolean | null): Promise<WaitableElement | false>;
    disabled_or_deleted(timeout?: number, raiseErr?: boolean | null): Promise<WaitableElement | false>;
    clickable(waitMoved?: boolean, timeout?: number, raiseErr?: boolean | null): Promise<WaitableElement | false>;
    has_rect(timeout?: number, raiseErr?: boolean | null): Promise<WaitableElement | false>;
    stop_moving(timeout?: number, gap?: number, raiseErr?: boolean | null): Promise<WaitableElement | false>;
    download_begin(timeout?: number, cancelIt?: boolean): Promise<any | false>;
    upload_paths_inputted(timeout?: number): Promise<boolean>;
    state(stateName: string, mode?: boolean, timeout?: number, raiseErr?: boolean | null): Promise<WaitableElement | false>;
    private _waitState;
}
