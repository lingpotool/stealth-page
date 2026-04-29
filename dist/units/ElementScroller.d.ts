import { CDPSession } from "../core/CDPSession";
export interface ScrollableElement {
    readonly session: CDPSession;
    getObjectId(): Promise<string>;
}
export declare class ElementScroller {
    private readonly _ele;
    private _waitComplete;
    constructor(ele: ScrollableElement);
    set_wait_complete(on: boolean): void;
    __call__(pixel?: number): Promise<ScrollableElement>;
    to_top(): Promise<ScrollableElement>;
    to_bottom(): Promise<ScrollableElement>;
    to_half(): Promise<ScrollableElement>;
    to_rightmost(): Promise<ScrollableElement>;
    to_leftmost(): Promise<ScrollableElement>;
    to_location(x: number, y: number): Promise<ScrollableElement>;
    up(pixel?: number): Promise<ScrollableElement>;
    down(pixel?: number): Promise<ScrollableElement>;
    left(pixel?: number): Promise<ScrollableElement>;
    right(pixel?: number): Promise<ScrollableElement>;
    to_see(center?: boolean | null): Promise<ScrollableElement>;
    to_center(): Promise<ScrollableElement>;
    private _waitScrolled;
}
