"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrameStates = void 0;
/**
 * Frame 状态检查类，对应 DrissionPage 的 FrameStates
 */
class FrameStates {
    constructor(frame) {
        this._frame = frame;
    }
    /**
     * 是否正在加载
     */
    get is_loading() {
        return (async () => {
            try {
                const { result } = await this._frame.session.send("Runtime.evaluate", {
                    expression: "document.readyState",
                    returnByValue: true,
                });
                return result.value !== "complete";
            }
            catch {
                return false;
            }
        })();
    }
    /**
     * frame 是否存活（检查 frame 元素是否仍有 frameId）
     */
    get is_alive() {
        return (async () => {
            try {
                const backendId = this._frame.frame_ele.backendNodeId;
                if (backendId > 0) {
                    const { node } = await this._frame.session.send("DOM.describeNode", {
                        backendNodeId: backendId,
                    });
                    return "frameId" in node;
                }
                return false;
            }
            catch {
                return false;
            }
        })();
    }
    /**
     * 就绪状态
     */
    get ready_state() {
        return (async () => {
            try {
                const { result } = await this._frame.session.send("Runtime.evaluate", {
                    expression: "document.readyState",
                    returnByValue: true,
                });
                return result.value || "unknown";
            }
            catch {
                return "unknown";
            }
        })();
    }
    /**
     * frame 元素是否可见
     */
    get is_displayed() {
        return (async () => {
            try {
                const ele = this._frame.frame_ele;
                const visibility = await ele.style("visibility");
                if (visibility === "hidden")
                    return false;
                const display = await ele.style("display");
                if (display === "none")
                    return false;
                const hidden = await ele.run_js("return this.offsetParent === null;");
                return !hidden;
            }
            catch {
                return false;
            }
        })();
    }
    /**
     * 是否有弹窗
     */
    get has_alert() {
        return (async () => {
            try {
                const { result } = await this._frame.session.send("Runtime.evaluate", {
                    expression: "false",
                    returnByValue: true,
                });
                return false;
            }
            catch (e) {
                // 如果执行失败可能是因为有 alert 阻塞
                return e?.message?.includes("dialog") || false;
            }
        })();
    }
}
exports.FrameStates = FrameStates;
