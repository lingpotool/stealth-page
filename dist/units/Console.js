"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Console = void 0;
/**
 * 控制台消息监听类，对应 DrissionPage 的 Console
 */
class Console {
    constructor(owner) {
        this._listening = false;
        this._messages = [];
        this._handler = null;
        this._waitResolvers = [];
        this._owner = owner;
    }
    /**
     * 是否正在监听
     */
    get listening() {
        return this._listening;
    }
    /**
     * 获取已捕获的消息列表（获取后清空）
     */
    get messages() {
        const msgs = [...this._messages];
        this._messages = [];
        return msgs;
    }
    /**
     * 开始监听控制台消息
     */
    async start() {
        if (this._listening)
            return;
        this._handler = (params) => {
            const data = {
                source: params.source || "console-api",
                level: params.level || params.type || "log",
                text: params.text || "",
                url: params.url,
                line: params.lineNumber,
                column: params.columnNumber,
                timestamp: params.timestamp,
                args: params.args,
            };
            this._messages.push(data);
            // 通知等待者
            if (this._waitResolvers.length > 0) {
                const resolver = this._waitResolvers.shift();
                resolver?.(data);
            }
        };
        await this._owner.cdpSession.send("Runtime.enable");
        this._owner.cdpSession.on("Runtime.consoleAPICalled", this._handler);
        this._owner.cdpSession.on("Log.entryAdded", (params) => {
            if (this._handler) {
                this._handler(params.entry || params);
            }
        });
        await this._owner.cdpSession.send("Log.enable");
        this._listening = true;
    }
    /**
     * 停止监听并清空消息
     */
    async stop() {
        if (!this._listening)
            return;
        if (this._handler) {
            this._owner.cdpSession.off("Runtime.consoleAPICalled", this._handler);
            this._handler = null;
        }
        this._messages = [];
        this._waitResolvers = [];
        this._listening = false;
    }
    /**
     * 清空已捕获的消息
     */
    clear() {
        this._messages = [];
    }
    /**
     * 等待一条消息
     */
    async wait(timeout) {
        if (!this._listening) {
            await this.start();
        }
        // 如果已有消息，直接返回
        if (this._messages.length > 0) {
            return this._messages.shift();
        }
        return new Promise((resolve) => {
            let timer = null;
            const resolver = (data) => {
                if (timer)
                    clearTimeout(timer);
                resolve(data);
            };
            this._waitResolvers.push(resolver);
            if (timeout !== undefined) {
                timer = setTimeout(() => {
                    const idx = this._waitResolvers.indexOf(resolver);
                    if (idx >= 0) {
                        this._waitResolvers.splice(idx, 1);
                    }
                    resolve(false);
                }, timeout * 1000);
            }
        });
    }
    /**
     * 迭代器，每监听到一条消息就返回
     */
    async *steps(timeout) {
        if (!this._listening) {
            await this.start();
        }
        while (true) {
            const msg = await this.wait(timeout);
            if (msg === false) {
                break;
            }
            yield msg;
        }
    }
}
exports.Console = Console;
