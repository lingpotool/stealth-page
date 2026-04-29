import { CDPSession } from "../core/CDPSession";
/**
 * 录屏模式
 */
export type ScreencastMode = "video" | "frugal_video" | "imgs" | "frugal_imgs" | "js_video";
/**
 * 录屏页面接口
 */
export interface ScreencastPage {
    cdpSession: CDPSession;
}
/**
 * 录屏模式设置类
 */
export declare class ScreencastModeSetter {
    private readonly _screencast;
    constructor(screencast: Screencast);
    video_mode(): void;
    frugal_video_mode(): void;
    imgs_mode(): void;
    frugal_imgs_mode(): void;
    js_video_mode(): void;
}
/**
 * 屏幕录制类，对应 DrissionPage 的 Screencast
 */
export declare class Screencast {
    private readonly _owner;
    private _path;
    private _tmpPath;
    private _running;
    private _mode;
    private _frames;
    private _frameHandler;
    private _setMode;
    private _frameCount;
    constructor(owner: ScreencastPage);
    /**
     * 是否正在录制
     */
    get running(): boolean;
    /**
     * 返回用于设置录屏模式的对象
     */
    get set_mode(): ScreencastModeSetter;
    /**
     * 设置保存路径
     */
    set_save_path(savePath: string): void;
    /**
     * 开始录屏
     */
    start(savePath?: string): Promise<void>;
    /**
     * 停止录屏
     */
    stop(videoName?: string): Promise<string>;
}
