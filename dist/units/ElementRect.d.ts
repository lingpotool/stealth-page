import { CDPSession } from "../core/CDPSession";
export interface RectableElement {
    readonly session: CDPSession;
    readonly nodeId: number;
    readonly backendNodeId: number;
    getObjectId(): Promise<string>;
}
export declare class ElementRect {
    private readonly _ele;
    constructor(ele: RectableElement);
    location(): Promise<{
        x: number;
        y: number;
    }>;
    viewport_location(): Promise<{
        x: number;
        y: number;
    }>;
    screen_location(): Promise<{
        x: number;
        y: number;
    }>;
    size(): Promise<{
        width: number;
        height: number;
    }>;
    midpoint(): Promise<{
        x: number;
        y: number;
    }>;
    viewport_midpoint(): Promise<{
        x: number;
        y: number;
    }>;
    click_point(): Promise<{
        x: number;
        y: number;
    }>;
    corners(): Promise<Array<{
        x: number;
        y: number;
    }>>;
    viewport_corners(): Promise<Array<{
        x: number;
        y: number;
    }>>;
    screen_midpoint(): Promise<{
        x: number;
        y: number;
    }>;
    screen_click_point(): Promise<{
        x: number;
        y: number;
    }>;
    viewport_click_point(): Promise<{
        x: number;
        y: number;
    }>;
    scroll_position(): Promise<{
        x: number;
        y: number;
    }>;
}
