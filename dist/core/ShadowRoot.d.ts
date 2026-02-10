import { CDPSession } from "./CDPSession";
import { Element } from "./Element";
/**
 * ShadowRoot 类，对应 DrissionPage 的 ShadowRoot
 * 用于操作 Shadow DOM 内的元素
 */
export declare class ShadowRoot {
    private readonly _session;
    private readonly _parentEle;
    private _backendNodeId;
    private _objectId;
    private _nodeId;
    private _page;
    constructor(parentEle: Element, opts?: {
        objId?: string;
        backendId?: number;
    });
    get session(): CDPSession;
    get parent_ele(): Element;
    get tag(): string;
    get backendNodeId(): number;
    /**
     * 获取 shadow root 的 innerHTML
     */
    inner_html(): Promise<string>;
    /**
     * 获取 shadow root 的 HTML
     */
    html(): Promise<string>;
    /**
     * 在 shadow root 内执行 JS
     */
    run_js(script: string, ...args: any[]): Promise<any>;
    /**
     * 异步执行 JS
     */
    run_async_js(script: string, ...args: any[]): Promise<void>;
    /**
     * 在 shadow root 内查找单个元素
     */
    ele(locator: string, index?: number): Promise<Element | null>;
    /**
     * 在 shadow root 内查找所有元素
     */
    eles(locator: string): Promise<Element[]>;
    /**
     * 获取父元素
     */
    parent(levelOrLoc?: number | string): Promise<Element | null>;
    /**
     * 获取子元素
     */
    child(locatorOrIndex?: string | number, index?: number): Promise<Element | null>;
    /**
     * 获取所有子元素
     */
    children(locator?: string): Promise<Element[]>;
    /**
     * 获取下一个兄弟元素（相对于 parent_ele）
     */
    next(locator?: string, index?: number): Promise<Element | null>;
    /**
     * 获取前面的兄弟元素
     */
    before(locator?: string, index?: number): Promise<Element | null>;
    /**
     * 获取后面的兄弟元素
     */
    after(locator?: string, index?: number): Promise<Element | null>;
    toString(): string;
    private _getObjectId;
    private _getNodeId;
    private _elesByXPath;
}
