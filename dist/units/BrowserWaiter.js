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
exports.BrowserWaiter = void 0;
const Settings_1 = require("../core/Settings");
function shouldRaise(raiseErr) {
    if (raiseErr === true)
        return true;
    if (raiseErr === false)
        return false;
    return Settings_1.Settings.raise_when_wait_failed;
}
class BrowserWaiter {
    constructor(browser) {
        this._browser = browser;
    }
    async wait(second, scope) {
        const waitTime = scope !== undefined
            ? second + Math.random() * (scope - second)
            : second;
        await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
        return this._browser;
    }
    async new_tab(timeout, currTab, raiseErr) {
        const timeoutMs = (timeout ?? this._browser.options.timeouts.base) * 1000;
        const startTime = Date.now();
        const initialTabs = await this._browser.get_tabs();
        const initialIds = new Set(initialTabs.map(t => t.id));
        if (currTab && !initialIds.has(currTab)) {
            initialIds.add(currTab);
        }
        while (Date.now() - startTime < timeoutMs) {
            const currentTabs = await this._browser.get_tabs();
            for (const tab of currentTabs) {
                if (!initialIds.has(tab.id)) {
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
    async download_begin(timeout, cancelIt = false) {
        const timeoutMs = (timeout ?? this._browser.options.timeouts.base) * 1000;
        return new Promise((resolve) => {
            let resolved = false;
            const handler = (params) => {
                if (!resolved) {
                    resolved = true;
                    this._browser.cdpSession.off("Browser.downloadWillBegin", handler);
                    if (cancelIt) {
                        this._browser.cdpSession.send("Browser.cancelDownload", {
                            guid: params.guid,
                        }).catch(() => { });
                    }
                    resolve(params);
                }
            };
            this._browser.cdpSession.on("Browser.downloadWillBegin", handler);
            this._browser.cdpSession.send("Browser.setDownloadBehavior", {
                behavior: "allowAndName",
                downloadPath: this._browser.options.downloadPath,
                eventsEnabled: true,
            }).catch(() => { });
            setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    this._browser.cdpSession.off("Browser.downloadWillBegin", handler);
                    resolve(false);
                }
            }, timeoutMs);
        });
    }
    async downloads_done(timeout, cancelIfTimeout = true) {
        const timeoutMs = timeout ? timeout * 1000 : Infinity;
        const startTime = Date.now();
        while (Date.now() - startTime < timeoutMs) {
            await new Promise(resolve => setTimeout(resolve, 500));
            return true;
        }
        return !cancelIfTimeout;
    }
}
exports.BrowserWaiter = BrowserWaiter;
