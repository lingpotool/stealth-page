import { CDPSession } from "./CDPSession";
import { ElementScroller } from "../units/ElementScroller";
import { ElementClicker } from "../units/ElementClicker";
import { ElementWaiter } from "../units/ElementWaiter";
import { ElementSetter } from "../units/ElementSetter";
import { ElementRect } from "../units/ElementRect";
import { ElementStates } from "../units/ElementStates";
import { SelectElement } from "../units/SelectElement";
import { Pseudo } from "../units/Pseudo";
export interface ElementHandleRef {
    nodeId: number;
}
/**
 * 元素类，对应 DrissionPage 的 ChromiumElement
 */
export declare class Element {
    private readonly _session;
    private readonly _ref;
    private _objectIdCache;
    private _objectIdCacheTime;
    private readonly _objectIdCacheDuration;
    private _page;
    private _scroll;
    private _clicker;
    private _wait;
    private _set;
    private _rect;
    private _states;
    private _select;
    private _pseudo;
    constructor(session: CDPSession, ref: ElementHandleRef, page?: any);
    get session(): CDPSession;
    get nodeId(): number;
    /**
     * 获取元素所属的页面对象
     */
    getPage(): any;
    /**
     * 设置元素所属的页面对象
     */
    setPage(page: any): void;
    /**
     * 检查元素是否有效
     */
    isValid(): boolean;
    /**
     * 获取 objectId（供内部和 units 使用）
     */
    getObjectId(): Promise<string>;
    /**
     * 滚动操作对象
     */
    get scroll(): ElementScroller;
    /**
     * 点击操作对象
     */
    get click(): ElementClicker;
    /**
     * 等待操作对象
     */
    get wait(): ElementWaiter;
    /**
     * 设置操作对象
     */
    get set(): ElementSetter;
    /**
     * 位置信息对象
     */
    get rect(): ElementRect;
    /**
     * 状态检查对象
     */
    get states(): ElementStates;
    /**
     * 下拉列表操作对象（仅 select 元素有效）
     */
    get select(): SelectElement | false;
    /**
     * 伪元素内容获取对象
     */
    get pseudo(): Pseudo;
    /**
     * 元素标签名
     */
    get tag(): Promise<string>;
    /**
     * 元素 outerHTML
     */
    get html(): Promise<string>;
    tag_name(): Promise<string>;
    outer_html(): Promise<string>;
    inner_html(): Promise<string>;
    text(): Promise<string>;
    raw_text(): Promise<string>;
    value(): Promise<string>;
    attr(name: string): Promise<string | null>;
    attrs(): Promise<Record<string, string>>;
    property(name: string): Promise<any>;
    style(name: string, pseudoEle?: string): Promise<string>;
    set_attr(name: string, value: string): Promise<void>;
    remove_attr(name: string): Promise<void>;
    is_displayed(): Promise<boolean>;
    is_enabled(): Promise<boolean>;
    is_selected(): Promise<boolean>;
    /**
     * 简单点击（向后兼容）
     */
    do_click(): Promise<Element>;
    /**
     * 输入文本
     */
    input(value: string, clear?: boolean): Promise<Element>;
    /**
     * 清空内容
     */
    clear(): Promise<void>;
    /**
     * 获取焦点
     */
    focus(): Promise<void>;
    /**
     * 鼠标悬停
     */
    hover(): Promise<void>;
    /**
     * 双击
     */
    double_click(): Promise<void>;
    /**
     * 右键点击
     */
    right_click(): Promise<void>;
    /**
     * 滚动到可见
     */
    scroll_into_view(): Promise<void>;
    /**
     * 选中/取消选中复选框
     */
    check(uncheck?: boolean, _byJs?: boolean): Promise<void>;
    /**
     * 拖拽到相对位置
     */
    drag(offsetX?: number, offsetY?: number, duration?: number): Promise<void>;
    /**
     * 拖拽到目标元素或坐标
     */
    drag_to(target: Element | {
        x: number;
        y: number;
    }, duration?: number): Promise<void>;
    private _performDrag;
    location(): Promise<{
        x: number;
        y: number;
    }>;
    size(): Promise<{
        width: number;
        height: number;
    }>;
    get_rect(): Promise<{
        x: number;
        y: number;
        width: number;
        height: number;
    }>;
    parent(levelOrLoc?: number | string, _index?: number): Promise<Element | null>;
    private _getParentByLevel;
    child(locatorOrIndex?: string | number, index?: number): Promise<Element | null>;
    private _getChildByIndex;
    children(locator?: string): Promise<Element[]>;
    next(locator?: string, index?: number): Promise<Element | null>;
    prev(locator?: string, index?: number): Promise<Element | null>;
    private _getSibling;
    nexts(locator?: string): Promise<Element[]>;
    prevs(locator?: string): Promise<Element[]>;
    private _getSiblings;
    before(locator?: string, index?: number): Promise<Element | null>;
    after(locator?: string, index?: number): Promise<Element | null>;
    befores(locator?: string): Promise<Element[]>;
    afters(locator?: string): Promise<Element[]>;
    private _getDocumentNodeId;
    /**
     * 创建子元素，继承 page 引用
     */
    private _createElement;
    shadow_root(): Promise<Element | null>;
    /**
     * shadow_root 的简写
     */
    get sr(): Promise<Element | null>;
    ele(locator: string, index?: number): Promise<Element | null>;
    eles(locator: string): Promise<Element[]>;
    private _elesByXPath;
    /**
     * 以 SessionElement 形式返回元素（高效处理复杂页面）
     */
    s_ele(locator: string, index?: number): Promise<any>;
    /**
     * 以 SessionElement 列表形式返回所有匹配元素
     */
    s_eles(locator: string): Promise<any[]>;
    run_js(script: string, ...args: any[]): Promise<any>;
    run_async_js(script: string, ...args: any[]): Promise<void>;
    screenshot(path?: string): Promise<Buffer>;
    get_screenshot(path?: string, name?: string, asBytes?: boolean, asBase64?: boolean, scrollToCenter?: boolean): Promise<string | Buffer>;
    src(_timeout?: number, base64ToBytes?: boolean): Promise<Buffer | string | null>;
    save(path?: string, name?: string, _timeout?: number, _rename?: boolean): Promise<string>;
    /**
     * 获取元素右边的指定元素
     */
    east(locOrPixel?: string | number, index?: number): Promise<Element | null>;
    /**
     * 获取元素下方的指定元素
     */
    south(locOrPixel?: string | number, index?: number): Promise<Element | null>;
    /**
     * 获取元素左边的指定元素
     */
    west(locOrPixel?: string | number, index?: number): Promise<Element | null>;
    /**
     * 获取元素上方的指定元素
     */
    north(locOrPixel?: string | number, index?: number): Promise<Element | null>;
    /**
     * 获取覆盖在本元素上最上层的元素
     */
    over(): Promise<Element | null>;
    /**
     * 获取相对本元素指定偏移量位置的元素
     */
    offset(locator?: string, x?: number, y?: number): Promise<Element | null>;
    private _getRelativeEle;
}
