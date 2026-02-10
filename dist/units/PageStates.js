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
    /**
     * 当前链接是否可用
     */
    get url_available() {
        return this._checkUrlAvailable();
    }
    async _checkUrlAvailable() {
        try {
            const { result } = await this._page.cdpSession.send("Runtime.evaluate", {
                expression: "document.location.href",
                returnByValue: true,
            });
            const url = result.value;
            return !!url && url !== "about:blank" && !url.startsWith("chrome-error://");
        }
        catch {
            return false;
        }
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
        // 尝试处理弹窗来检测是否存在
        try {
            // 发送一个不会改变状态的检查
            await this._page.cdpSession.send("Runtime.evaluate", {
                expression: "1+1",
                returnByValue: true,
                timeout: 100,
            });
            return false;
        }
        catch (e) {
            // 如果有弹窗，evaluate 会失败
            if (e?.message?.includes("dialog"))
                return true;
            return false;
        }
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
