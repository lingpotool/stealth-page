"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShadowRootStates = void 0;
/**
 * ShadowRoot 状态检查类，对应 DrissionPage 的 ShadowRootStates
 */
class ShadowRootStates {
    constructor(ele) {
        this._ele = ele;
    }
    /**
     * 是否可用
     */
    get is_enabled() {
        return (async () => {
            try {
                const disabled = await this._ele.run_js("return this.disabled;");
                return !disabled;
            }
            catch {
                return false;
            }
        })();
    }
    /**
     * 是否存活
     */
    get is_alive() {
        return (async () => {
            try {
                if (this._ele.backendNodeId > 0) {
                    const result = await this._ele.session.send("DOM.describeNode", {
                        backendNodeId: this._ele.backendNodeId,
                    });
                    return result.node.nodeId !== 0;
                }
                return false;
            }
            catch {
                return false;
            }
        })();
    }
}
exports.ShadowRootStates = ShadowRootStates;
