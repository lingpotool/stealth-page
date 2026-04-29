import { CDPSession } from "../core/CDPSession";
export interface AlertPage {
    cdpSession: CDPSession;
    _has_alert?: boolean;
    _alert_text?: string;
}
export declare class Alert {
    private readonly _owner;
    private _is_open;
    private _type;
    private _message;
    private _defaultPrompt;
    private _responseAccept;
    private _responseText;
    private _handleNext;
    private _nextText;
    private _auto;
    constructor(owner: AlertPage, auto?: boolean | string | null);
    private _initListeners;
    get activated(): boolean;
    get is_open(): boolean;
    get text(): string | null;
    get message(): string | null;
    get type(): string | null;
    get default_prompt(): string | null;
    get response_accept(): boolean | null;
    get response_text(): string | null;
    get handle_next(): boolean | null;
    set handle_next(value: boolean | null);
    get next_text(): string | null;
    set next_text(value: string | null);
    get auto(): boolean | string | null;
    set auto(value: boolean | string | null);
    accept(promptText?: string): Promise<void>;
    dismiss(): Promise<void>;
    private _handleInternal;
}
