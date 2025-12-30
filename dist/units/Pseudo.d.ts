import { CDPSession } from "../core/CDPSession";
/**
 * 伪元素接口
 */
export interface PseudoElement {
    session: CDPSession;
    getObjectId(): Promise<string>;
}
/**
 * 伪元素内容获取类，对应 DrissionPage 的 Pseudo
 */
export declare class Pseudo {
    private readonly _ele;
    constructor(ele: PseudoElement);
    /**
     * 获取 ::before 伪元素的文本内容
     */
    get before(): Promise<string>;
    /**
     * 获取 ::after 伪元素的文本内容
     */
    get after(): Promise<string>;
    /**
     * 获取伪元素内容
     */
    private _getContent;
}
