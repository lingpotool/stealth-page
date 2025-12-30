"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketCDPSession = void 0;
const ws_1 = __importDefault(require("ws"));
/**
 * 子会话，用于 flatten 模式下与特定 target 通信
 */
class ChildCDPSession {
    constructor(parent, sessionId) {
        this.parent = parent;
        this.sessionId = sessionId;
    }
    async send(method, params) {
        return this.parent.sendToSession(this.sessionId, method, params);
    }
    on(event, handler) {
        this.parent.onSession(this.sessionId, event, handler);
    }
    off(event, handler) {
        this.parent.offSession(this.sessionId, event, handler);
    }
    close() {
        // 子会话不直接关闭 WebSocket
    }
    createChildSession(sessionId) {
        return new ChildCDPSession(this.parent, sessionId);
    }
}
/**
 * 通过 WebSocket 实现的 CDP 会话，用于连接 Chrome DevTools 协议。
 */
class WebSocketCDPSession {
    constructor(ws) {
        this.nextId = 0;
        this.pending = new Map();
        this.eventHandlers = new Map();
        // 用于 flatten 模式的子会话事件处理
        this.sessionEventHandlers = new Map();
        this.handleMessage = (data) => {
            let msg;
            try {
                msg = JSON.parse(data.toString());
            }
            catch {
                return;
            }
            if (typeof msg.id === "number") {
                const pending = this.pending.get(msg.id);
                if (!pending) {
                    return;
                }
                this.pending.delete(msg.id);
                if (msg.error) {
                    pending.reject(new Error(msg.error.message || "CDP error"));
                }
                else {
                    pending.resolve(msg.result);
                }
                return;
            }
            if (msg.method) {
                // 处理带 sessionId 的事件（flatten 模式）
                if (msg.sessionId) {
                    const sessionMap = this.sessionEventHandlers.get(msg.sessionId);
                    if (sessionMap) {
                        const handlers = sessionMap.get(msg.method);
                        if (handlers) {
                            for (const handler of handlers) {
                                try {
                                    handler(msg.params);
                                }
                                catch {
                                }
                            }
                        }
                    }
                }
                // 也触发全局事件处理器
                const handlers = this.eventHandlers.get(msg.method);
                if (handlers) {
                    for (const handler of handlers) {
                        try {
                            handler(msg.params);
                        }
                        catch {
                        }
                    }
                }
            }
        };
        this.handleError = (err) => {
            for (const [id, pending] of this.pending) {
                pending.reject(err);
                this.pending.delete(id);
            }
        };
        this.handleClose = () => {
            const err = new Error("CDP WebSocket closed");
            for (const [id, pending] of this.pending) {
                pending.reject(err);
                this.pending.delete(id);
            }
        };
        this.ws = ws;
        this.ws.on("message", this.handleMessage);
        this.ws.on("error", this.handleError);
        this.ws.on("close", this.handleClose);
    }
    static async connect(url) {
        return new Promise((resolve, reject) => {
            const ws = new ws_1.default(url);
            const onError = (err) => {
                ws.removeAllListeners();
                reject(err);
            };
            ws.once("open", () => {
                ws.off("error", onError);
                resolve(new WebSocketCDPSession(ws));
            });
            ws.once("error", onError);
        });
    }
    async send(method, params) {
        const id = ++this.nextId;
        const message = JSON.stringify({ id, method, params });
        return new Promise((resolve, reject) => {
            this.pending.set(id, { resolve, reject });
            this.ws.send(message, (err) => {
                if (err) {
                    this.pending.delete(id);
                    reject(err);
                }
            });
        });
    }
    /**
     * 向特定 session 发送命令（flatten 模式）
     */
    async sendToSession(sessionId, method, params) {
        const id = ++this.nextId;
        const message = JSON.stringify({ id, method, params, sessionId });
        return new Promise((resolve, reject) => {
            this.pending.set(id, { resolve, reject });
            this.ws.send(message, (err) => {
                if (err) {
                    this.pending.delete(id);
                    reject(err);
                }
            });
        });
    }
    on(event, handler) {
        let set = this.eventHandlers.get(event);
        if (!set) {
            set = new Set();
            this.eventHandlers.set(event, set);
        }
        set.add(handler);
    }
    off(event, handler) {
        const set = this.eventHandlers.get(event);
        if (!set) {
            return;
        }
        set.delete(handler);
        if (set.size === 0) {
            this.eventHandlers.delete(event);
        }
    }
    /**
     * 为特定 session 注册事件处理器
     */
    onSession(sessionId, event, handler) {
        let sessionMap = this.sessionEventHandlers.get(sessionId);
        if (!sessionMap) {
            sessionMap = new Map();
            this.sessionEventHandlers.set(sessionId, sessionMap);
        }
        let set = sessionMap.get(event);
        if (!set) {
            set = new Set();
            sessionMap.set(event, set);
        }
        set.add(handler);
    }
    /**
     * 移除特定 session 的事件处理器
     */
    offSession(sessionId, event, handler) {
        const sessionMap = this.sessionEventHandlers.get(sessionId);
        if (!sessionMap)
            return;
        const set = sessionMap.get(event);
        if (!set)
            return;
        set.delete(handler);
        if (set.size === 0) {
            sessionMap.delete(event);
        }
        if (sessionMap.size === 0) {
            this.sessionEventHandlers.delete(sessionId);
        }
    }
    /**
     * 创建子会话（用于 flatten 模式）
     */
    createChildSession(sessionId) {
        return new ChildCDPSession(this, sessionId);
    }
    close() {
        this.ws.close();
    }
}
exports.WebSocketCDPSession = WebSocketCDPSession;
