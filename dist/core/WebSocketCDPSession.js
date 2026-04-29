"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserDriver = exports.WebSocketCDPSession = void 0;
const ws_1 = __importDefault(require("ws"));
const DEFAULT_CDP_TIMEOUT = 10;
class ChildCDPSession {
    constructor(parent, sessionId) {
        this.parent = parent;
        this.sessionId = sessionId;
    }
    async send(method, params, timeout) {
        return this.parent.sendToSession(this.sessionId, method, params, timeout);
    }
    async run(method, params, _ignore) {
        return this.parent.runInSession(this.sessionId, method, params, _ignore);
    }
    on(event, handler) {
        this.parent.onSession(this.sessionId, event, handler);
    }
    once(event, handler) {
        const wrapper = (params) => {
            this.off(event, wrapper);
            handler(params);
        };
        this.on(event, wrapper);
    }
    off(event, handler) {
        this.parent.offSession(this.sessionId, event, handler);
    }
    close() {
    }
    createChildSession(sessionId) {
        return new ChildCDPSession(this.parent, sessionId);
    }
}
class WebSocketCDPSession {
    constructor(ws) {
        this.nextId = 0;
        this.pending = new Map();
        this.eventHandlers = new Map();
        this.sessionEventHandlers = new Map();
        this.immediateEventHandlers = new Map();
        this.immediateEventQueue = [];
        this.alert_flag = false;
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
                    const errorInfo = {
                        error: msg.error.message || "CDP error",
                        type: "cdp_error",
                        data: msg.error,
                    };
                    pending.reject(errorInfo);
                }
                else {
                    pending.resolve(msg.result);
                }
                return;
            }
            if (msg.method) {
                const immediateHandler = this.immediateEventHandlers.get(msg.method);
                if (immediateHandler) {
                    try {
                        immediateHandler(msg.params);
                    }
                    catch {
                    }
                    this.immediateEventQueue.push({ method: msg.method, params: msg.params });
                }
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
            if (this.owner && typeof this.owner._on_disconnect === 'function') {
                try {
                    this.owner._on_disconnect();
                }
                catch {
                }
            }
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
        this._initAlertListeners();
    }
    _initAlertListeners() {
        this.on("Page.javascriptDialogOpening", () => {
            this.alert_flag = true;
        });
        this.on("Page.javascriptDialogClosed", () => {
            this.alert_flag = false;
        });
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
    set_callback(event, callback, immediate = false) {
        if (immediate) {
            this.immediateEventHandlers.set(event, callback);
        }
        else {
            this.on(event, callback);
        }
    }
    async send(method, params, timeout) {
        if (this.alert_flag && (method.startsWith("Input.") || method.startsWith("Runtime."))) {
            const errorInfo = { error: "alert exists.", type: "alert_exists", method, args: params };
            throw errorInfo;
        }
        const id = ++this.nextId;
        const message = JSON.stringify({ id, method, params });
        const timeoutMs = (timeout !== undefined ? timeout : DEFAULT_CDP_TIMEOUT) * 1000;
        const sendPromise = new Promise((resolve, reject) => {
            this.pending.set(id, { resolve, reject });
            this.ws.send(message, (err) => {
                if (err) {
                    this.pending.delete(id);
                    reject(err);
                }
            });
        });
        const timeoutPromise = new Promise((_resolve, reject) => {
            setTimeout(() => {
                if (this.pending.has(id)) {
                    this.pending.delete(id);
                    const errorInfo = { error: "timeout", type: "timeout", method, args: params };
                    reject(errorInfo);
                }
            }, timeoutMs);
        });
        return Promise.race([sendPromise, timeoutPromise]);
    }
    async sendToSession(sessionId, method, params, timeout) {
        if (this.alert_flag && (method.startsWith("Input.") || method.startsWith("Runtime."))) {
            const errorInfo = { error: "alert exists.", type: "alert_exists", method, args: params };
            throw errorInfo;
        }
        const id = ++this.nextId;
        const message = JSON.stringify({ id, method, params, sessionId });
        const timeoutMs = (timeout !== undefined ? timeout : DEFAULT_CDP_TIMEOUT) * 1000;
        const sendPromise = new Promise((resolve, reject) => {
            this.pending.set(id, { resolve, reject });
            this.ws.send(message, (err) => {
                if (err) {
                    this.pending.delete(id);
                    reject(err);
                }
            });
        });
        const timeoutPromise = new Promise((_resolve, reject) => {
            setTimeout(() => {
                if (this.pending.has(id)) {
                    this.pending.delete(id);
                    const errorInfo = { error: "timeout", type: "timeout", method, args: params };
                    reject(errorInfo);
                }
            }, timeoutMs);
        });
        return Promise.race([sendPromise, timeoutPromise]);
    }
    async run(method, params, _ignore = []) {
        try {
            return await this.send(method, params);
        }
        catch (e) {
            if (this._shouldIgnore(e, _ignore)) {
                return undefined;
            }
            throw e;
        }
    }
    async runInSession(sessionId, method, params, _ignore = []) {
        try {
            return await this.sendToSession(sessionId, method, params);
        }
        catch (e) {
            if (this._shouldIgnore(e, _ignore)) {
                return undefined;
            }
            throw e;
        }
    }
    _shouldIgnore(error, _ignore) {
        if (!_ignore || _ignore.length === 0)
            return false;
        const errorType = error?.type || '';
        const errorMsg = error?.error || (error?.message || '');
        for (const ignoreClass of _ignore) {
            if (typeof ignoreClass === 'function') {
                const className = ignoreClass.name;
                if (error instanceof ignoreClass)
                    return true;
                if (errorType === 'alert_exists' && className === 'AlertExistsError')
                    return true;
                if (errorType === 'timeout' && className === 'WaitTimeoutError')
                    return true;
                if (errorType === 'cdp_error') {
                    const errorMappings = {
                        'Cannot find context': 'ContextLostError',
                        'Could not find node': 'ElementLostError',
                        'connection disconnected': 'PageDisconnectedError',
                        'alert exists': 'AlertExistsError',
                        'Node does not have layout': 'NoRectError',
                        'Cannot navigate to invalid URL': 'IncorrectURLError',
                        'Frame corresponds to opaque origin': 'StorageError',
                        'Sanitizing cookie failed': 'CookieFormatError',
                        'Given expression does not evaluate to a function': 'JavaScriptError',
                    };
                    for (const [pattern, mappedClass] of Object.entries(errorMappings)) {
                        if (errorMsg.includes(pattern) && className === mappedClass)
                            return true;
                    }
                    if (className === 'CDPError')
                        return true;
                }
            }
        }
        return false;
    }
    on(event, handler) {
        let set = this.eventHandlers.get(event);
        if (!set) {
            set = new Set();
            this.eventHandlers.set(event, set);
        }
        set.add(handler);
    }
    once(event, handler) {
        const wrapper = (params) => {
            this.off(event, wrapper);
            handler(params);
        };
        this.on(event, wrapper);
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
    createChildSession(sessionId) {
        return new ChildCDPSession(this, sessionId);
    }
    close() {
        this.ws.close();
    }
}
exports.WebSocketCDPSession = WebSocketCDPSession;
class BrowserDriver {
    constructor(id, address, session) {
        this.id = id;
        this.address = address;
        this.session = session;
    }
    static async get(id, address, owner) {
        const existing = BrowserDriver.BROWSERS.get(id);
        if (existing) {
            if (owner !== undefined) {
                existing.owner = owner;
                existing.session.owner = owner;
            }
            return existing;
        }
        const session = await WebSocketCDPSession.connect(address);
        const driver = new BrowserDriver(id, address, session);
        if (owner !== undefined) {
            driver.owner = owner;
            session.owner = owner;
        }
        BrowserDriver.BROWSERS.set(id, driver);
        return driver;
    }
    static has(id) {
        return BrowserDriver.BROWSERS.has(id);
    }
    static remove(id) {
        const driver = BrowserDriver.BROWSERS.get(id);
        if (driver) {
            driver.session.close();
            BrowserDriver.BROWSERS.delete(id);
        }
    }
    async send(method, params, timeout) {
        return this.session.send(method, params, timeout);
    }
    async run(method, params, _ignore = []) {
        return this.session.run(method, params, _ignore);
    }
    set_callback(event, callback, immediate = false) {
        this.session.set_callback(event, callback, immediate);
    }
    close() {
        BrowserDriver.remove(this.id);
    }
}
exports.BrowserDriver = BrowserDriver;
BrowserDriver.BROWSERS = new Map();
