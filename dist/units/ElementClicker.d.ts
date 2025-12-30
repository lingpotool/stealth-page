import { CDPSession } from "../core/CDPSession";
export interface ClickableElement {
    readonly session: CDPSession;
    readonly nodeId: number;
    getObjectId(): Promise<string>;
    get_rect(): Promise<{
        x: number;
        y: number;
        width: number;
        height: number;
    }>;
    scroll_into_view(): Promise<void>;
}
/**
 * 可获取页面的元素接口（用于 for_new_tab 等方法）
 */
export interface ClickableElementWithPage extends ClickableElement {
    getPage?(): any;
}
/**
 * 元素点击器，对应 DrissionPage 的 Clicker
 */
export declare class ElementClicker {
    private readonly _ele;
    constructor(ele: ClickableElementWithPage);
    /**
     * 默认点击（左键单击）
     * @param byJs 是否用js点击，为null时先用模拟点击，遇到遮挡改用js
     * @param timeout 模拟点击的超时时间（秒）
     * @param waitStop 是否等待元素运动结束再执行点击
     */
    __call__(byJs?: boolean | null, timeout?: number, waitStop?: boolean): Promise<ClickableElement | false>;
    /**
     * 左键单击
     * @param byJs 是否用js点击，为null时先用模拟点击，遇到遮挡改用js
     * @param timeout 模拟点击的超时时间（秒）
     * @param waitStop 是否等待元素运动结束再执行点击
     */
    left(byJs?: boolean | null, timeout?: number, waitStop?: boolean): Promise<ClickableElement | false>;
    /**
     * 右键单击
     */
    right(): Promise<ClickableElement>;
    /**
     * 中键单击，默认返回新出现的tab对象
     * @param getTab 是否返回新tab对象，为false则返回null
     */
    middle(getTab?: boolean): Promise<any>;
    /**
     * 带偏移量点击本元素，相对于左上角坐标
     * @param offsetX 相对元素左上角坐标的x轴偏移量
     * @param offsetY 相对元素左上角坐标的y轴偏移量
     * @param button 点击哪个键
     * @param count 点击次数
     */
    at(offsetX?: number, offsetY?: number, button?: "left" | "right" | "middle" | "back" | "forward", count?: number): Promise<ClickableElement>;
    /**
     * 多次点击
     * @param times 点击次数，默认双击
     */
    multi(times?: number): Promise<ClickableElement>;
    /**
     * 点击触发下载
     * @param savePath 保存路径
     * @param rename 重命名文件名
     * @param suffix 指定文件后缀
     * @param newTab 下载任务是否从新标签页触发
     * @param byJs 是否用js方式点击
     * @param timeout 等待下载触发的超时时间
     */
    to_download(savePath?: string, rename?: string, suffix?: string, newTab?: boolean, byJs?: boolean, timeout?: number): Promise<any>;
    /**
     * 触发上传文件选择框并自动填入指定路径
     * @param filePaths 文件路径，支持多文件
     * @param byJs 是否用js方式点击
     */
    to_upload(filePaths: string | string[], byJs?: boolean): Promise<void>;
    /**
     * 点击后等待新tab出现并返回其对象
     * @param byJs 是否使用js点击
     * @param timeout 等待超时时间（秒）
     */
    for_new_tab(byJs?: boolean, timeout?: number): Promise<any>;
    /**
     * 点击并等待tab的url变成包含或不包含指定文本
     * @param text 用于识别的文本，为空等待当前url变化
     * @param exclude 是否排除
     * @param byJs 是否用js点击
     * @param timeout 超时时间（秒）
     */
    for_url_change(text?: string, exclude?: boolean, byJs?: boolean, timeout?: number): Promise<boolean>;
    /**
     * 点击并等待tab的title变成包含或不包含指定文本
     * @param text 用于识别的文本，为空等待当前title变化
     * @param exclude 是否排除
     * @param byJs 是否用js点击
     * @param timeout 超时时间（秒）
     */
    for_title_change(text?: string, exclude?: boolean, byJs?: boolean, timeout?: number): Promise<boolean>;
    /**
     * 实施点击
     */
    private _click;
    /**
     * 使用 JS 方式点击
     */
    private _clickByJs;
    /**
     * 使用鼠标模拟点击
     */
    private _clickByMouse;
    /**
     * 等待元素停止运动
     */
    private _waitStopMoving;
}
