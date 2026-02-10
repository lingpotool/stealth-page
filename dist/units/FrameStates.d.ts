import { CDPSession } from "../core/CDPSession";
import { Element } from "../core/Element";
export interface FrameLike {
    readonly session: CDPSession;
    readonly frame_ele: Element;
    readonly frameId: string;
}
/**
 * Frame 状态检查类，对应 DrissionPage 的 FrameStates
 */
export declare class FrameStates {
    private readonly _frame;
    constructor(frame: FrameLike);
    /**
     * 是否正在加载
     */
    get is_loading(): Promise<boolean>;
    /**
     * frame 是否存活（检查 frame 元素是否仍有 frameId）
     */
    get is_alive(): Promise<boolean>;
    /**
     * 就绪状态
     */
    get ready_state(): Promise<string>;
    /**
     * frame 元素是否可见
     */
    get is_displayed(): Promise<boolean>;
    /**
     * 是否有弹窗
     */
    get has_alert(): Promise<boolean>;
}
