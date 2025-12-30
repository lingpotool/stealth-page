import { CDPSession } from "../core/CDPSession";
export type LoadModeValue = "normal" | "eager" | "none";
/**
 * 页面加载策略设置类
 * 对应 DrissionPage.LoadMode
 */
export declare class LoadMode {
    private readonly _cdpSession;
    private _mode;
    constructor(cdpSession: CDPSession);
    get value(): LoadModeValue;
    /**
     * 设置加载策略
     */
    set(value: LoadModeValue): Promise<void>;
    /**
     * 设置为 normal 模式（等待页面完全加载）
     */
    normal(): Promise<void>;
    /**
     * 设置为 eager 模式（DOM 加载完成即可）
     */
    eager(): Promise<void>;
    /**
     * 设置为 none 模式（不等待加载）
     */
    none(): Promise<void>;
}
