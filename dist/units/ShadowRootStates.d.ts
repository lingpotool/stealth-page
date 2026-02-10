import { CDPSession } from "../core/CDPSession";
export interface ShadowRootLike {
    readonly session: CDPSession;
    readonly backendNodeId: number;
    run_js(script: string, ...args: any[]): Promise<any>;
}
/**
 * ShadowRoot 状态检查类，对应 DrissionPage 的 ShadowRootStates
 */
export declare class ShadowRootStates {
    private readonly _ele;
    constructor(ele: ShadowRootLike);
    /**
     * 是否可用
     */
    get is_enabled(): Promise<boolean>;
    /**
     * 是否存活
     */
    get is_alive(): Promise<boolean>;
}
