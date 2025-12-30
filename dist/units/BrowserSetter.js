"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserSetter = void 0;
const WindowSetter_1 = require("./WindowSetter");
const BrowserCookiesSetter_1 = require("./BrowserCookiesSetter");
const LoadMode_1 = require("./LoadMode");
/**
 * 浏览器设置类
 * 对应 DrissionPage.BrowserSetter
 */
class BrowserSetter {
    constructor(browser) {
        this._cookiesSetter = null;
        this._windowSetter = null;
        this._loadMode = null;
        this._browser = browser;
    }
    /**
     * 返回用于设置 cookies 的对象
     */
    get cookies() {
        if (!this._cookiesSetter) {
            this._cookiesSetter = new BrowserCookiesSetter_1.BrowserCookiesSetter(this._browser);
        }
        return this._cookiesSetter;
    }
    /**
     * 返回用于设置窗口的对象
     */
    get window() {
        if (!this._windowSetter) {
            this._windowSetter = new WindowSetter_1.WindowSetter({ cdpSession: this._browser.cdpSession });
        }
        return this._windowSetter;
    }
    /**
     * 返回用于设置页面加载模式的对象
     */
    get load_mode() {
        if (!this._loadMode) {
            this._loadMode = new LoadMode_1.LoadMode(this._browser.cdpSession);
        }
        return this._loadMode;
    }
    /**
     * 设置超时时间
     */
    timeouts(base, pageLoad, script) {
        if (base !== undefined) {
            this._browser.options.timeouts.base = base;
        }
        if (pageLoad !== undefined) {
            this._browser.options.timeouts.pageLoad = pageLoad;
        }
        if (script !== undefined) {
            this._browser.options.timeouts.script = script;
        }
    }
    /**
     * 设置是否自动处理弹窗
     */
    auto_handle_alert(onOff = true, accept = true) {
        this._browser.options.autoHandleAlert = onOff;
        this._browser.options.alertAccept = accept;
    }
    /**
     * 设置下载路径
     */
    download_path(path) {
        if (path !== null) {
            this._browser.options.downloadPath = path;
        }
    }
    /**
     * 设置下一个被下载文件的名称
     */
    download_file_name(name, suffix) {
        this._browser.options.nextDownloadName = name;
        this._browser.options.nextDownloadSuffix = suffix;
    }
    /**
     * 设置当存在同名文件时的处理方式
     */
    when_download_file_exists(mode) {
        const modeMap = {
            s: "skip",
            r: "rename",
            o: "overwrite",
        };
        this._browser.options.downloadFileExists = modeMap[mode] || mode;
    }
    /**
     * 设置重试次数
     */
    retry_times(times) {
        this._browser.options.retryTimes = times;
    }
    /**
     * 设置重试间隔
     */
    retry_interval(interval) {
        this._browser.options.retryInterval = interval;
    }
    /**
     * 设置空元素返回值
     */
    NoneElement_value(value = null, onOff = true) {
        this._browser.options.noneElementValue = onOff ? value : undefined;
        this._browser.options.noneElementEnabled = onOff;
    }
}
exports.BrowserSetter = BrowserSetter;
