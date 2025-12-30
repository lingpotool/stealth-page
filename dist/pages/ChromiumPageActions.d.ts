import { ChromiumPage } from "./ChromiumPage";
import { Element } from "../core/Element";
/**
 * 动作链类，对应 DrissionPage 的 Actions
 */
export declare class ChromiumPageActions {
    private readonly _page;
    private _currX;
    private _currY;
    private _modifier;
    constructor(page: ChromiumPage);
    /**
     * 移动到指定坐标或元素
     */
    move_to(eleOrLoc: Element | {
        x: number;
        y: number;
    } | string, offsetX?: number, offsetY?: number, duration?: number): Promise<this>;
    /**
     * 移动到坐标
     */
    move(x: number, y: number): Promise<this>;
    /**
     * 相对当前位置移动
     */
    move_by(offsetX?: number, offsetY?: number, duration?: number): Promise<this>;
    /**
     * 点击
     */
    click(onEle?: Element | string, times?: number): Promise<this>;
    /**
     * 右键点击
     */
    r_click(onEle?: Element | string, times?: number): Promise<this>;
    /**
     * 中键点击
     */
    m_click(onEle?: Element | string, times?: number): Promise<this>;
    private _click;
    /**
     * 按住鼠标左键
     */
    hold(onEle?: Element | string): Promise<this>;
    /**
     * 释放鼠标左键
     */
    release(onEle?: Element | string): Promise<this>;
    /**
     * 按住鼠标右键
     */
    r_hold(onEle?: Element | string): Promise<this>;
    /**
     * 释放鼠标右键
     */
    r_release(onEle?: Element | string): Promise<this>;
    /**
     * 按住鼠标中键
     */
    m_hold(onEle?: Element | string): Promise<this>;
    /**
     * 释放鼠标中键
     */
    m_release(onEle?: Element | string): Promise<this>;
    private _hold;
    private _release;
    /**
     * 拖拽
     */
    drag(fromX: number, fromY: number, toX: number, toY: number, duration?: number): Promise<this>;
    /**
     * 滚动
     */
    scroll(deltaY?: number, deltaX?: number, onEle?: Element | string): Promise<this>;
    /**
     * 向上移动
     */
    up(pixel: number): Promise<this>;
    /**
     * 向下移动
     */
    down(pixel: number): Promise<this>;
    /**
     * 向左移动
     */
    left(pixel: number): Promise<this>;
    /**
     * 向右移动
     */
    right(pixel: number): Promise<this>;
    /**
     * 按下键盘按键
     */
    key_down(key: string): Promise<this>;
    /**
     * 释放键盘按键
     */
    key_up(key: string): Promise<this>;
    /**
     * 模拟键盘输入
     */
    type(keys: string | string[], interval?: number): Promise<this>;
    /**
     * 直接输入文本
     */
    input(text: string): Promise<this>;
    /**
     * 从浏览器外拖入文件、文本等
     */
    drag_in(eleOrLoc: Element | string, options?: {
        files?: string | string[];
        text?: string;
        title?: string;
        baseURL?: string;
    }): Promise<this>;
    /**
     * 等待
     */
    wait(second: number, scope?: number): Promise<this>;
}
