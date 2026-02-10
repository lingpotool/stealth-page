import { CDPSession } from "../core/CDPSession";

export interface ShadowRootLike {
  readonly session: CDPSession;
  readonly backendNodeId: number;
  run_js(script: string, ...args: any[]): Promise<any>;
}

/**
 * ShadowRoot 状态检查类，对应 DrissionPage 的 ShadowRootStates
 */
export class ShadowRootStates {
  private readonly _ele: ShadowRootLike;

  constructor(ele: ShadowRootLike) {
    this._ele = ele;
  }

  /**
   * 是否可用
   */
  get is_enabled(): Promise<boolean> {
    return (async () => {
      try {
        const disabled = await this._ele.run_js("return this.disabled;");
        return !disabled;
      } catch {
        return false;
      }
    })();
  }

  /**
   * 是否存活
   */
  get is_alive(): Promise<boolean> {
    return (async () => {
      try {
        if (this._ele.backendNodeId > 0) {
          const result = await this._ele.session.send<{ node: { nodeId: number } }>("DOM.describeNode", {
            backendNodeId: this._ele.backendNodeId,
          });
          return result.node.nodeId !== 0;
        }
        return false;
      } catch {
        return false;
      }
    })();
  }
}
