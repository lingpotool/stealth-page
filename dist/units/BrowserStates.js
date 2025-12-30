"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserStates = void 0;
/**
 * 浏览器状态检查类
 * 对应 DrissionPage.BrowserStates
 */
class BrowserStates {
    constructor(browser) {
        this._browser = browser;
    }
    /**
     * 返回浏览器是否已连接
     */
    get is_alive() {
        return this._browser.is_connected;
    }
    /**
     * 返回是否为无头模式
     */
    get is_headless() {
        // 检查启动参数中是否有 headless
        return this._browser.options.arguments.some(arg => arg.includes("--headless"));
    }
    /**
     * 返回是否为隐身模式
     */
    get is_incognito() {
        return this._browser.options.arguments.some(arg => arg.includes("--incognito"));
    }
    /**
     * 返回标签页数量
     */
    async tabs_count() {
        const tabs = await this._browser.get_tabs();
        return tabs.length;
    }
    /**
     * 检查浏览器是否有活动的下载
     */
    async has_active_downloads() {
        // CDP 没有直接的方法检查下载状态
        // 这里返回 false 作为默认值
        return false;
    }
    /**
     * 获取浏览器版本信息
     */
    async version() {
        const info = await this._browser.get_version();
        return info.browser;
    }
    /**
     * 获取 User-Agent
     */
    async user_agent() {
        const info = await this._browser.get_version();
        return info.userAgent;
    }
    /**
     * 获取协议版本
     */
    async protocol_version() {
        const info = await this._browser.get_version();
        return info.protocol;
    }
}
exports.BrowserStates = BrowserStates;
