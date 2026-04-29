"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChromiumPageWaiter = void 0;
const NoneElement_1 = require("../core/NoneElement");
const Settings_1 = require("../core/Settings");
function shouldRaise(raiseErr) {
    if (raiseErr === true)
        return true;
    if (raiseErr === false)
        return false;
    return Settings_1.Settings.raise_when_wait_failed;
}
class ChromiumPageWaiter {
    constructor(page) {
        this._page = page;
    }
    async wait(second, scope) {
        const waitTime = scope !== undefined
            ? second + Math.random() * (scope - second)
            : second;
        await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
        return this._page;
    }
    async ele(locator, timeoutMs, intervalMs = 200) {
        const options = this._page.browser.options;
        const effectiveTimeout = timeoutMs != null ? timeoutMs : options.timeouts.base * 1000;
        const deadline = Date.now() + effectiveTimeout;
        while (true) {
            const el = await this._page.ele(locator);
            if (!(el instanceof NoneElement_1.NoneElement)) {
                return el;
            }
            if (Date.now() > deadline) {
                return el;
            }
            await new Promise((resolve) => setTimeout(resolve, intervalMs));
        }
    }
    async eles_loaded(locators, timeout, anyOne = false, raiseErr) {
        const options = this._page.browser.options;
        const timeoutMs = (timeout ?? options.timeouts.base) * 1000;
        const deadline = Date.now() + timeoutMs;
        const locatorList = Array.isArray(locators) ? locators : [locators];
        while (Date.now() < deadline) {
            const results = await Promise.all(locatorList.map(async (loc) => {
                const el = await this._page.ele(loc);
                return el !== null;
            }));
            if (anyOne) {
                if (results.some(r => r)) {
                    return true;
                }
            }
            else {
                if (results.every(r => r)) {
                    return true;
                }
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        if (shouldRaise(raiseErr)) {
            const { WaitTimeoutError } = await Promise.resolve().then(() => __importStar(require("../errors")));
            throw new WaitTimeoutError(`eles_loaded timeout for: ${locatorList.join(', ')}`);
        }
        return false;
    }
    async url_change(text, exclude = false, timeout, raiseErr) {
        const options = this._page.browser.options;
        const timeoutMs = (timeout ?? options.timeouts.base) * 1000;
        const startUrl = await this._page.url();
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
            const currentUrl = await this._page.url();
            if (text === undefined) {
                if (currentUrl !== startUrl) {
                    return this._page;
                }
            }
            else {
                const contains = currentUrl.includes(text);
                if (exclude ? !contains : contains) {
                    return this._page;
                }
            }
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        if (shouldRaise(raiseErr)) {
            const { WaitTimeoutError } = await Promise.resolve().then(() => __importStar(require("../errors")));
            throw new WaitTimeoutError(`url_change timeout, waiting for: ${text}`);
        }
        return false;
    }
    async title_change(text, exclude = false, timeout, raiseErr) {
        const options = this._page.browser.options;
        const timeoutMs = (timeout ?? options.timeouts.base) * 1000;
        const startTitle = await this._page.title();
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
            const currentTitle = await this._page.title();
            if (text === undefined) {
                if (currentTitle !== startTitle) {
                    return this._page;
                }
            }
            else {
                const contains = currentTitle.includes(text);
                if (exclude ? !contains : contains) {
                    return this._page;
                }
            }
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        if (shouldRaise(raiseErr)) {
            const { WaitTimeoutError } = await Promise.resolve().then(() => __importStar(require("../errors")));
            throw new WaitTimeoutError(`title_change timeout, waiting for: ${text}`);
        }
        return false;
    }
    async load_start(timeout, raiseErr) {
        const options = this._page.browser.options;
        const timeoutMs = (timeout ?? options.timeouts.pageLoad) * 1000;
        const page = this._page["_page"];
        if (!page)
            return false;
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                cleanup();
                if (shouldRaise(raiseErr)) {
                    const { WaitTimeoutError } = require("../errors");
                    reject(new WaitTimeoutError("load_start timeout"));
                }
                else {
                    resolve(false);
                }
            }, timeoutMs);
            const handler = () => {
                cleanup();
                resolve(true);
            };
            const cleanup = () => {
                clearTimeout(timer);
                page.cdpSession.off("Page.frameStartedLoading", handler);
            };
            page.cdpSession.on("Page.frameStartedLoading", handler);
        });
    }
    async doc_loaded(timeout, raiseErr) {
        const options = this._page.browser.options;
        const timeoutMs = (timeout ?? options.timeouts.pageLoad) * 1000;
        const page = this._page["_page"];
        if (!page)
            return false;
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                cleanup();
                if (shouldRaise(raiseErr)) {
                    const { WaitTimeoutError } = require("../errors");
                    reject(new WaitTimeoutError("doc_loaded timeout"));
                }
                else {
                    resolve(false);
                }
            }, timeoutMs);
            const handler = () => {
                cleanup();
                resolve(true);
            };
            const cleanup = () => {
                clearTimeout(timer);
                page.cdpSession.off("Page.domContentEventFired", handler);
            };
            page.cdpSession.on("Page.domContentEventFired", handler);
        });
    }
    async js_ready(timeout) {
        const options = this._page.browser.options;
        const timeoutMs = (timeout ?? options.timeouts.pageLoad) * 1000;
        const deadline = Date.now() + timeoutMs;
        const page = this._page["_page"];
        if (!page)
            return false;
        while (Date.now() < deadline) {
            try {
                const result = await page.cdpSession.send("Runtime.evaluate", {
                    expression: "document.readyState",
                    returnByValue: true,
                });
                if (result.result?.value === "complete" || result.result?.value === "interactive") {
                    return true;
                }
            }
            catch {
                // ignore
            }
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        return false;
    }
    async activated(timeout) {
        const options = this._page.browser.options;
        const timeoutMs = (timeout ?? options.timeouts.base) * 1000;
        const deadline = Date.now() + timeoutMs;
        const page = this._page["_page"];
        if (!page)
            return false;
        while (Date.now() < deadline) {
            try {
                const targetId = page.tab_id;
                const result = await page.cdpSession.send("Target.getTargetInfo", { targetId });
                if (result.targetInfo?.isActive) {
                    return true;
                }
            }
            catch {
                // ignore
            }
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        return false;
    }
    async load(timeoutMs = 30000) {
        const page = this._page["_page"];
        if (!page) {
            return false;
        }
        return new Promise((resolve) => {
            const timer = setTimeout(() => {
                cleanup();
                resolve(false);
            }, timeoutMs);
            const handler = () => {
                cleanup();
                resolve(true);
            };
            const cleanup = () => {
                clearTimeout(timer);
                page.cdpSession.off("Page.loadEventFired", handler);
            };
            page.cdpSession.on("Page.loadEventFired", handler);
        });
    }
    async new_tab(timeout, raiseErr) {
        const options = this._page.browser.options;
        const timeoutMs = (timeout ?? options.timeouts.base) * 1000;
        const startTabs = await this._page.get_tabs();
        const startIds = new Set(startTabs.map(t => t.id));
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
            const currentTabs = await this._page.get_tabs();
            for (const tab of currentTabs) {
                if (!startIds.has(tab.id)) {
                    return tab.id;
                }
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        if (shouldRaise(raiseErr)) {
            const { WaitTimeoutError } = await Promise.resolve().then(() => __importStar(require("../errors")));
            throw new WaitTimeoutError("new_tab timeout");
        }
        return false;
    }
    async ele_deleted(locator, timeout, raiseErr) {
        const options = this._page.browser.options;
        const timeoutMs = (timeout ?? options.timeouts.base) * 1000;
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
            const el = await this._page.ele(locator);
            if (!el) {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        if (shouldRaise(raiseErr)) {
            const { WaitTimeoutError } = await Promise.resolve().then(() => __importStar(require("../errors")));
            throw new WaitTimeoutError(`ele_deleted timeout for: ${locator}`);
        }
        return false;
    }
    async ele_displayed(locator, timeout, raiseErr) {
        const options = this._page.browser.options;
        const timeoutMs = (timeout ?? options.timeouts.base) * 1000;
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
            const el = await this._page.ele(locator);
            if (el) {
                const displayed = await el.is_displayed();
                if (displayed) {
                    return true;
                }
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        if (shouldRaise(raiseErr)) {
            const { WaitTimeoutError } = await Promise.resolve().then(() => __importStar(require("../errors")));
            throw new WaitTimeoutError(`ele_displayed timeout for: ${locator}`);
        }
        return false;
    }
    async ele_hidden(locator, timeout, raiseErr) {
        const options = this._page.browser.options;
        const timeoutMs = (timeout ?? options.timeouts.base) * 1000;
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
            const el = await this._page.ele(locator);
            if (!el) {
                return true;
            }
            const displayed = await el.is_displayed();
            if (!displayed) {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        if (shouldRaise(raiseErr)) {
            const { WaitTimeoutError } = await Promise.resolve().then(() => __importStar(require("../errors")));
            throw new WaitTimeoutError(`ele_hidden timeout for: ${locator}`);
        }
        return false;
    }
    async upload_paths_inputted(timeout) {
        const options = this._page.browser.options;
        const timeoutMs = (timeout ?? options.timeouts.base) * 1000;
        const deadline = Date.now() + timeoutMs;
        const page = this._page["_page"];
        while (Date.now() < deadline) {
            if (!page || !page._upload_list || page._upload_list.length === 0) {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        return false;
    }
    async download_begin(timeout, cancelIt = false) {
        const options = this._page.browser.options;
        const timeoutMs = (timeout ?? options.timeouts.base) * 1000;
        const page = this._page["_page"];
        if (!page)
            return false;
        return new Promise((resolve) => {
            let resolved = false;
            const handler = (params) => {
                if (!resolved) {
                    resolved = true;
                    cleanup();
                    if (cancelIt) {
                        page.cdpSession.send("Browser.cancelDownload", {
                            guid: params.guid,
                        }).catch(() => { });
                    }
                    resolve(params);
                }
            };
            const cleanup = () => {
                clearTimeout(timer);
                page.cdpSession.off("Browser.downloadWillBegin", handler);
            };
            const timer = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    cleanup();
                    resolve(false);
                }
            }, timeoutMs);
            page.cdpSession.on("Browser.downloadWillBegin", handler);
        });
    }
    async downloads_done(timeout, cancelIfTimeout = true) {
        const timeoutMs = timeout ? timeout * 1000 : 60000;
        const deadline = Date.now() + timeoutMs;
        const browser = this._page.browser;
        const dlMgr = browser.browser?._dl_mgr;
        if (!dlMgr) {
            await new Promise(resolve => setTimeout(resolve, Math.min(timeoutMs, 1000)));
            return true;
        }
        const tabId = this._page["_page"]?.tab_id;
        while (Date.now() < deadline) {
            const missions = tabId ? dlMgr.get_tab_missions?.(tabId) : null;
            if (!missions || missions.size === 0) {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        if (cancelIfTimeout && tabId) {
            const missions = dlMgr.get_tab_missions?.(tabId);
            if (missions) {
                for (const m of missions) {
                    m.state = 'canceled';
                }
            }
        }
        return false;
    }
    async all_downloads_done(timeout, cancelIfTimeout = true) {
        return this.downloads_done(timeout, cancelIfTimeout);
    }
    async alert(timeout) {
        const options = this._page.browser.options;
        const timeoutMs = (timeout ?? options.timeouts.base) * 1000;
        const page = this._page["_page"];
        if (!page)
            return false;
        return new Promise((resolve) => {
            const timer = setTimeout(() => {
                cleanup();
                resolve(false);
            }, timeoutMs);
            const handler = () => {
                cleanup();
                resolve(true);
            };
            const cleanup = () => {
                clearTimeout(timer);
                page.cdpSession.off("Page.javascriptDialogOpening", handler);
            };
            page.cdpSession.on("Page.javascriptDialogOpening", handler);
        });
    }
    async alert_closed(timeout) {
        const options = this._page.browser.options;
        const timeoutMs = timeout !== undefined ? timeout * 1000 : Infinity;
        const page = this._page["_page"];
        if (!page)
            return this._page;
        const deadline = timeoutMs !== Infinity ? Date.now() + timeoutMs : Infinity;
        while (!page._has_alert) {
            if (deadline !== Infinity && Date.now() >= deadline)
                return false;
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        while (page._has_alert) {
            if (deadline !== Infinity && Date.now() >= deadline)
                return false;
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        return this._page;
    }
}
exports.ChromiumPageWaiter = ChromiumPageWaiter;
