import { CDPSession } from "../core/CDPSession";
/**
 * 窗口信息接口
 */
export interface WindowBounds {
    left?: number;
    top?: number;
    width?: number;
    height?: number;
    windowState?: "normal" | "minimized" | "maximized" | "fullscreen";
}
/**
 * 窗口设置页面接口
 */
export interface WindowPage {
    cdpSession: CDPSession;
}
/**
 * 窗口设置类，对应 DrissionPage 的 WindowSetter
 */
export declare class WindowSetter {
    private readonly _owner;
    private _windowId;
    constructor(owner: WindowPage);
    /**
     * 获取窗口 ID
     */
    private _getWindowId;
    /**
     * 获取窗口信息
     */
    private _getInfo;
    /**
     * 执行窗口操作
     */
    private _perform;
    /**
     * 窗口最大化
     */
    max(): Promise<void>;
    /**
     * 窗口最小化
     */
    mini(): Promise<void>;
    /**
     * 窗口全屏
     */
    full(): Promise<void>;
    /**
     * 窗口恢复正常
     */
    normal(): Promise<void>;
    /**
     * 设置窗口大小
     */
    size(width?: number, height?: number): Promise<void>;
    /**
     * 设置窗口位置
     */
    location(x?: number, y?: number): Promise<void>;
    /**
     * 隐藏浏览器窗口（仅 Windows）
     */
    hide(): Promise<void>;
    /**
     * 显示浏览器窗口（仅 Windows）
     */
    show(): Promise<void>;
    /**
     * 获取当前窗口大小
     */
    getSize(): Promise<{
        width: number;
        height: number;
    }>;
    /**
     * 获取当前窗口位置
     */
    getLocation(): Promise<{
        x: number;
        y: number;
    }>;
    /**
     * 获取窗口状态
     */
    getState(): Promise<string>;
}
