import { CDPSession } from "../core/CDPSession";
export interface ActionsPage {
    cdpSession: CDPSession;
    tab_id: string;
    run_cdp(method: string, params?: Record<string, any>): Promise<any>;
    wait(second: number, scope?: number): Promise<any>;
    scroll?: {
        to_see(ele: any): Promise<void>;
        to_location(x: number, y: number): Promise<void>;
    };
    ele(locator: string): Promise<any>;
    _run_js(script: string): Promise<any>;
}
export interface ActionsElement {
    rect: {
        midpoint: Promise<{
            x: number;
            y: number;
        }>;
        location: Promise<{
            x: number;
            y: number;
        }>;
        viewport_midpoint: Promise<{
            x: number;
            y: number;
        }>;
        viewport_location: Promise<{
            x: number;
            y: number;
        }>;
    };
    _type?: string;
}
export declare class Actions {
    private readonly _owner;
    modifier: number;
    curr_x: number;
    curr_y: number;
    private _holding;
    constructor(owner: ActionsPage);
    move_to(eleOrLoc: ActionsElement | [number, number] | string, offsetX?: number, offsetY?: number, duration?: number): Promise<Actions>;
    move(offsetX?: number, offsetY?: number, duration?: number): Promise<Actions>;
    click(onEle?: ActionsElement | string, times?: number): Promise<Actions>;
    r_click(onEle?: ActionsElement | string, times?: number): Promise<Actions>;
    m_click(onEle?: ActionsElement | string, times?: number): Promise<Actions>;
    hold(onEle?: ActionsElement | string): Promise<Actions>;
    release(onEle?: ActionsElement | string): Promise<Actions>;
    r_hold(onEle?: ActionsElement | string): Promise<Actions>;
    r_release(onEle?: ActionsElement | string): Promise<Actions>;
    m_hold(onEle?: ActionsElement | string): Promise<Actions>;
    m_release(onEle?: ActionsElement | string): Promise<Actions>;
    _hold(onEle?: ActionsElement | string, button?: string, count?: number): Promise<Actions>;
    _release(button: string): void;
    scroll(deltaY?: number, deltaX?: number, onEle?: ActionsElement | string): Promise<Actions>;
    up(pixel: number): Promise<Actions>;
    down(pixel: number): Promise<Actions>;
    left(pixel: number): Promise<Actions>;
    right(pixel: number): Promise<Actions>;
    key_down(key: string): Promise<Actions>;
    key_up(key: string): Promise<Actions>;
    type(keys: string | string[], interval?: number): Promise<Actions>;
    input(text: any): Promise<Actions>;
    drag_in(eleOrLoc: string | ActionsElement, files?: string | string[], text?: string, title?: string, baseURL?: string): Promise<Actions>;
    wait(second: number, scope?: number): Promise<Actions>;
}
export declare function location_to_client(page: ActionsPage, lx: number, ly: number): Promise<[number, number]>;
