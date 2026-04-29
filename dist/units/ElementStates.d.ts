import { CDPSession } from "../core/CDPSession";
export interface StatefulElement {
    readonly session: CDPSession;
    readonly nodeId: number;
    readonly backendNodeId: number;
    getObjectId(): Promise<string>;
}
export declare class ElementStates {
    private readonly _ele;
    constructor(ele: StatefulElement);
    get is_checked(): Promise<boolean>;
    get is_selected(): Promise<boolean>;
    get is_displayed(): Promise<boolean>;
    get is_enabled(): Promise<boolean>;
    get is_alive(): Promise<boolean>;
    get is_in_viewport(): Promise<boolean>;
    get is_whole_in_viewport(): Promise<boolean>;
    get is_covered(): Promise<boolean | number>;
    get is_clickable(): Promise<boolean>;
    get has_rect(): Promise<false | Array<{
        x: number;
        y: number;
    }>>;
    private _getBoolProperty;
    private _checkDisplayed;
    private _checkEnabled;
    private _checkAlive;
    private _checkInViewport;
    private _checkWholeInViewport;
    private _checkCovered;
    private _checkClickable;
    private _checkHasRect;
}
