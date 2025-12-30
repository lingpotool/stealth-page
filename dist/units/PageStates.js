"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageStates = void 0;
/**
 * 页面状态检查器，对应 DrissionPage 的 PageStates
 */
class PageStates {
    constructor(page) {
        this._page = page;
    }
    /**
     * 页面是否在加载中
     */
    get is_loading() {
        return this._checkLoading();
    }
    /**
     * 页面是否仍然可用
     */
    get is_alive() {
        return this._checkAlive();
    }
    /**
     * 页面加载状态
     */
    get ready_state() {
        return this._getReadyState();
    }
    /**
     * 是否存在弹窗
     */
    get has_alert() {
        return this._checkAlert();
    }
    async _checkLoading() {
        try {
            const { result } = await this._page.cdpSession.send("Runtime.evaluate", {
                expression: "document.readyState",
                returnByValue: true,
            });
            return result.value !== "complete";
        }
        catch {
            return false;
        }
    }
    async _checkAlive() {
        try {
            await this._page.cdpSession.send("Runtime.evaluate", {
                expression: "1",
            });
            return true;
        }
        catch {
            return false;
        }
    }
    async _getReadyState() {
        try {
            const { result } = await this._page.cdpSession.send("Runtime.evaluate", {
                expression: "document.readyState",
                returnByValue: true,
            });
            return result.value;
        }
        catch {
            return null;
        }
    }
    async _checkAlert() {
        // CDP 没有直接检查 alert 的方法，这里返回 false
        // 实际实现需要监听 Page.javascriptDialogOpening 事件
        return false;
    }
    /**
     * 浏览器是否无头模式
     */
    get is_headless() {
        return this._checkHeadless();
    }
    /**
     * 浏览器是否接管的
     */
    get is_existed() {
        return this._checkExisted();
    }
    /**
     * 浏览器是否无痕模式
     */
    get is_incognito() {
        return this._checkIncognito();
    }
    async _checkHeadless() {
        try {
            const { result } = await this._page.cdpSession.send("Runtime.evaluate", {
                expression: "navigator.webdriver || /HeadlessChrome/.test(navigator.userAgent)",
                returnByValue: true,
            });
            return result.value;
        }
        catch {
            return false;
        }
    }
    async _checkExisted() {
        // 检查是否是接管的浏览器（通常通过配置判断）
        return false;
    }
    async _checkIncognito() {
        try {
            const { result } = await this._page.cdpSession.send("Runtime.evaluate", {
                expression: `(async () => {
          try {
            const fs = await navigator.storage.estimate();
            return fs.quota < 120000000;
          } catch {
            return false;
          }
        })()`,
                returnByValue: true,
                awaitPromise: true,
            });
            return result.value;
        }
        catch {
            return false;
        }
    }
}
exports.PageStates = PageStates;
