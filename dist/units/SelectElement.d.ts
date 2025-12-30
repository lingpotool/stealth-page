import { CDPSession } from "../core/CDPSession";
export interface SelectableElement {
    readonly session: CDPSession;
    getObjectId(): Promise<string>;
    tag_name(): Promise<string>;
}
export interface ElementLike {
    readonly session: CDPSession;
    readonly nodeId: number;
    text(): Promise<string>;
    attr(name: string): Promise<string | null>;
}
export type ElementFactory = (session: CDPSession, nodeId: number) => ElementLike;
/**
 * 下拉列表操作类，对应 DrissionPage 的 SelectElement
 */
export declare class SelectElement {
    private readonly _ele;
    private readonly _elementFactory?;
    constructor(ele: SelectableElement, elementFactory?: ElementFactory);
    /**
     * 选择选项
     */
    __call__(textOrIndex: string | number, timeout?: number): Promise<void>;
    /**
     * 是否多选
     */
    is_multi(): Promise<boolean>;
    /**
     * 获取所有选项
     */
    options(): Promise<Array<{
        text: string;
        value: string;
        index: number;
        selected: boolean;
    }>>;
    /**
     * 获取第一个被选中的选项
     */
    selected_option(): Promise<{
        text: string;
        value: string;
        index: number;
    } | null>;
    /**
     * 获取所有被选中的选项
     */
    selected_options(): Promise<Array<{
        text: string;
        value: string;
        index: number;
    }>>;
    /**
     * 全选（仅多选）
     */
    all(): Promise<void>;
    /**
     * 清除所有选择
     */
    clear(): Promise<void>;
    /**
     * 反选（仅多选）
     */
    invert(): Promise<void>;
    /**
     * 根据文本选择
     */
    by_text(text: string | string[]): Promise<void>;
    /**
     * 根据 value 选择
     */
    by_value(value: string | string[]): Promise<void>;
    /**
     * 根据索引选择（从 1 开始）
     */
    by_index(index: number | number[]): Promise<void>;
    /**
     * 根据文本取消选择
     */
    cancel_by_text(text: string | string[]): Promise<void>;
    /**
     * 根据 value 取消选择
     */
    cancel_by_value(value: string | string[]): Promise<void>;
    /**
     * 根据索引取消选择
     */
    cancel_by_index(index: number | number[]): Promise<void>;
    /**
     * 根据定位符选择
     */
    by_locator(locator: string): Promise<void>;
    /**
     * 根据定位符取消选择
     */
    cancel_by_locator(locator: string): Promise<void>;
    /**
     * 选中指定的 option 元素
     */
    by_option(optionIndices: number | number[]): Promise<void>;
    /**
     * 取消选中指定的 option 元素
     */
    cancel_by_option(optionIndices: number | number[]): Promise<void>;
}
