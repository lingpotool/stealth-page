"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Browser = void 0;
const Page_1 = require("./Page");
const DownloadManager_1 = require("./DownloadManager");
class Browser {
    constructor(session, options = {}) {
        this.closed = false;
        this._drivers = new Map();
        this._all_drivers = new Map();
        this._frames = new Map();
        this._relation = new Map();
        this._targetListenersInitialized = false;
        this.session = session;
        this.options = options;
        this._dl_mgr = new DownloadManager_1.DownloadManager(this);
    }
    static async attach(session, options = {}) {
        const browser = new Browser(session, options);
        browser._initTargetListeners();
        return browser;
    }
    _initTargetListeners() {
        if (this._targetListenersInitialized)
            return;
        this._targetListenersInitialized = true;
        this.session.on("Target.targetCreated", (params) => {
            const targetInfo = params.targetInfo;
            if (!targetInfo)
                return;
            const targetId = targetInfo.targetId;
            const type = targetInfo.type;
            if (type === 'page' || type === 'webview' || type === 'iframe' || type === 'other') {
                if (targetInfo.openerId) {
                    this._relation.set(targetId, targetInfo.openerId);
                }
            }
        });
        this.session.on("Target.targetDestroyed", (params) => {
            const targetId = params.targetId;
            if (targetId) {
                this._drivers.delete(targetId);
                this._all_drivers.delete(targetId);
                this._relation.delete(targetId);
                const framesToDelete = [];
                for (const [frameId, parentId] of this._frames) {
                    if (parentId === targetId) {
                        framesToDelete.push(frameId);
                    }
                }
                for (const frameId of framesToDelete) {
                    this._frames.delete(frameId);
                }
            }
        });
        this.session.on("Target.targetInfoChanged", (params) => {
            const targetInfo = params.targetInfo;
            if (!targetInfo)
                return;
            const targetId = targetInfo.targetId;
            if (targetInfo.openerId) {
                this._relation.set(targetId, targetInfo.openerId);
            }
            else {
                this._relation.delete(targetId);
            }
        });
    }
    async get_driver(targetId) {
        const existing = this._drivers.get(targetId);
        if (existing)
            return existing;
        const result = await this.session.send("Target.attachToTarget", { targetId, flatten: true });
        const sessionId = result.sessionId;
        const childSession = this.session.createChildSession
            ? this.session.createChildSession(sessionId)
            : this.session;
        this._drivers.set(targetId, childSession);
        this._all_drivers.set(targetId, childSession);
        return childSession;
    }
    async newPage() {
        if (this.closed) {
            throw new Error("Browser is already closed.");
        }
        const page = new Page_1.Page(this.session);
        await page.init(this.options);
        return page;
    }
    async close() {
        if (this.closed) {
            return;
        }
        this.closed = true;
        try {
            await this.session.send("Browser.close");
        }
        catch {
        }
    }
}
exports.Browser = Browser;
