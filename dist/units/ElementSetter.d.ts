import { CDPSession } from "../core/CDPSession";
export interface SettableElement {
    readonly session: CDPSession;
    getObjectId(): Promise<string>;
}
/**
 * 元素属性设置器，对应 DrissionPage 的 ChromiumElementSetter
 */
export declare class ElementSetter {
    private readonly _ele;
    constructor(ele: SettableElement);
    /**
     * 设置元素 attribute 属性
     */
    attr(name: string, value?: string): Promise<void>;
    /**
     * 设置元素 property 属性
     */
    property(name: string, value: any): Promise<void>;
    /**
     * 设置元素 style 样式
     */
    style(name: string, value: string): Promise<void>;
    /**
     * 设置元素 innerHTML
     */
    innerHTML(html: string): Promise<void>;
    /**
     * 设置元素 value 值
     */
    value(val: string): Promise<void>;
}
