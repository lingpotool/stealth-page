import { CDPSession } from "../core/CDPSession";
/**
 * 录屏模式
 */
export type ScreencastMode = "video" | "frugal_video" | "imgs" | "frugal_imgs";
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
    /**
     * 持续视频模式
     */
    video_mode(): void;
    /**
     * 节俭视频模式（页面有变化时才录制）
     */
    frugal_video_mode(): void;
    /**
     * 持续截图模式
     */
    imgs_mode(): void;
    /**
     * 节俭截图模式（页面有变化时才截图）
     */
    frugal_imgs_mode(): void;
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
