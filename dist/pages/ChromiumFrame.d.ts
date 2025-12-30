import { CDPSession } from "../core/CDPSession";
import { Element } from "../core/Element";
import { FrameScroller } from "../units/FrameScroller";
import { PageStates } from "../units/PageStates";
import { PageRect } from "../units/PageRect";
/**
 * Frame 信息接口
 */
export interface FrameInfo {
    id: string;
    url: string;
    name: string;
    parentId?: string;
}
/**
 * ChromiumFrame 类，对应 DrissionPage 的 ChromiumFrame
 * 用于处理 iframe 内的操作
 */
export declare class ChromiumFrame {
    private readonly _session;
    private readonly _frameId;
    private readonly _frameEle;
    private _documentNodeId;
    private _scroller;
    private _states;
    private _rect;
    constructor(session: CDPSession, frameId: string, frameEle: Element);
    /**
     * 获取 frame 的 CDP session
     */
    get session(): CDPSession;
    /**
     * 获取 cdpSession（兼容 ScrollablePage 接口）
     */
    get cdpSession(): CDPSession;
    /**
     * 获取 frame ID
     */
    get frameId(): string;
    /**
     * 获取 frame 元素
     */
    get frame_ele(): Element;
    /**
     * 滚动操作对象
     */
    get scroll(): FrameScroller;
    /**
     * 状态检查对象
     */
    get states(): PageStates;
    /**
     * 位置信息对象
     */
    get rect(): PageRect;
    /**
     * 获取 frame 的 URL
     */
    url(): Promise<string>;
    /**
     * 获取 frame 的 title
     */
    title(): Promise<string>;
    /**
     * 获取 frame 的 HTML
     */
    html(): Promise<string>;
    /**
     * 获取 frame 的 innerHTML
     */
    inner_html(): Promise<string>;
    /**
     * 获取 frame 的标签名
     */
    tag(): Promise<string>;
    /**
     * 获取 frame 元素的属性
     */
    attr(name: string): Promise<string | null>;
    /**
     * 获取 frame 元素的所有属性
     */
    attrs(): Promise<Record<string, string>>;
    /**
     * 刷新 frame
     */
    refresh(): Promise<void>;
    /**
     * 在 frame 内查找单个元素
     */
    ele(locator: string, index?: number): Promise<Element | null>;
    /**
     * 在 frame 内查找所有元素
     */
    eles(locator: string): Promise<Element[]>;
    private _elesByXPath;
    /**
     * 在 frame 内执行 JS
     */
    run_js(script: string, ...args: any[]): Promise<any>;
    /**
     * 异步执行 JS
     */
    run_async_js(script: string, ...args: any[]): Promise<void>;
    /**
     * 截图
     */
    screenshot(path?: string): Promise<Buffer>;
    /**
     * 获取 frame 的执行上下文 ID
     */
    private _getContextId;
    /**
     * 获取 frame 的 document 节点 ID
     */
    private _getDocumentNodeId;
    parent(level?: number): Promise<Element | null>;
    prev(locator?: string, index?: number): Promise<Element | null>;
    next(locator?: string, index?: number): Promise<Element | null>;
    prevs(locator?: string): Promise<Element[]>;
    nexts(locator?: string): Promise<Element[]>;
    before(locator?: string, index?: number): Promise<Element | null>;
    after(locator?: string, index?: number): Promise<Element | null>;
    befores(locator?: string): Promise<Element[]>;
    afters(locator?: string): Promise<Element[]>;
}
