"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChromiumPageSetter = exports.PageLoadMode = void 0;
const CookiesSetter_1 = require("../units/CookiesSetter");
const WindowSetter_1 = require("../units/WindowSetter");
/**
 * 加载模式设置类（页面级别）
 */
class PageLoadMode {
    constructor(setter) {
        this._setter = setter;
    }
    /**
     * 设置为 normal 模式
     */
    async normal() {
        await this._setter.load_mode("normal");
    }
    /**
     * 设置为 eager 模式
     */
    async eager() {
        await this._setter.load_mode("eager");
    }
    /**
     * 设置为 none 模式
     */
    async none() {
        await this._setter.load_mode("none");
    }
}
exports.PageLoadMode = PageLoadMode;
class ChromiumPageSetter {
    constructor(page) {
        this._loadMode = null;
        this._cookies = null;
        this._window = null;
        this._page = page;
    }
    /**
     * 返回用于设置加载模式的对象
     */
    get load_mode_setter() {
        if (!this._loadMode) {
            this._loadMode = new PageLoadMode(this);
        }
        return this._loadMode;
    }
    /**
     * 返回用于设置 cookies 的对象
     */
    get cookies() {
        if (!this._cookies) {
            const page = this._page["_page"];
            if (page) {
                this._cookies = new CookiesSetter_1.CookiesSetter({ cdpSession: page.cdpSession });
            }
        }
        return this._cookies;
    }
    /**
     * 返回用于设置窗口的对象
     */
    get window() {
        if (!this._window) {
            const page = this._page["_page"];
            if (page) {
                this._window = new WindowSetter_1.WindowSetter({ cdpSession: page.cdpSession });
            }
        }
        return this._window;
    }
    timeouts(base, pageLoad, script) {
        const options = this._page.browser.options;
        if (base !== undefined) {
            options.timeouts.base = base;
        }
        if (pageLoad !== undefined) {
            options.timeouts.pageLoad = pageLoad;
        }
        if (script !== undefined) {
            options.timeouts.script = script;
        }
        return this;
    }
    async user_agent(ua, platform) {
        const page = this._page["_page"];
        if (page) {
            const params = { userAgent: ua };
            if (platform) {
                params.platform = platform;
            }
            await page.cdpSession.send("Network.setUserAgentOverride", params);
        }
        return this;
    }
    async window_size(width, height) {
        const page = this._page["_page"];
        if (page) {
            await page.cdpSession.send("Browser.setWindowBounds", {
                windowId: 1,
                bounds: { width, height },
            });
        }
        return this;
    }
    async headers(headers) {
        const page = this._page["_page"];
        if (page) {
            let headerObj;
            if (typeof headers === "string") {
                // 解析从浏览器复制的 headers 文本
                headerObj = {};
                headers.split("\n").forEach(line => {
                    const [key, ...valueParts] = line.split(":");
                    if (key && valueParts.length > 0) {
                        headerObj[key.trim()] = valueParts.join(":").trim();
                    }
                });
            }
            else {
                headerObj = headers;
            }
            await page.cdpSession.send("Network.setExtraHTTPHeaders", {
                headers: headerObj,
            });
        }
        return this;
    }
    async download_path(path) {
        this._page.browser.options.downloadPath = path;
        const page = this._page["_page"];
        if (page) {
            await page.cdpSession.send("Browser.setDownloadBehavior", {
                behavior: "allow",
                downloadPath: path,
            });
        }
        return this;
    }
    async load_mode(mode) {
        const page = this._page["_page"];
        if (page) {
            const strategy = mode === "normal" ? "normal" : mode === "eager" ? "eager" : "none";
            await page.cdpSession.send("Page.setLifecycleEventsEnabled", {
                enabled: strategy !== "none",
            });
        }
        return this;
    }
    async blocked_urls(urls) {
        const page = this._page["_page"];
        if (page) {
            await page.cdpSession.send("Network.setBlockedURLs", {
                urls: urls || [],
            });
        }
        return this;
    }
    /**
     * 设置 sessionStorage
     */
    async session_storage(item, value) {
        const page = this._page["_page"];
        if (page) {
            if (value === false) {
                await page.cdpSession.send("Runtime.evaluate", {
                    expression: `sessionStorage.removeItem(${JSON.stringify(item)})`,
                });
            }
            else {
                await page.cdpSession.send("Runtime.evaluate", {
                    expression: `sessionStorage.setItem(${JSON.stringify(item)}, ${JSON.stringify(value)})`,
                });
            }
        }
        return this;
    }
    /**
     * 设置 localStorage
     */
    async local_storage(item, value) {
        const page = this._page["_page"];
        if (page) {
            if (value === false) {
                await page.cdpSession.send("Runtime.evaluate", {
                    expression: `localStorage.removeItem(${JSON.stringify(item)})`,
                });
            }
            else {
                await page.cdpSession.send("Runtime.evaluate", {
                    expression: `localStorage.setItem(${JSON.stringify(item)}, ${JSON.stringify(value)})`,
                });
            }
        }
        return this;
    }
    /**
     * 设置等待上传的文件路径
     */
    async upload_files(files) {
        const fileList = Array.isArray(files) ? files : files.split("\n");
        this._page.browser.options.uploadFiles = fileList;
        return this;
    }
    /**
     * 设置是否自动处理弹窗
     */
    async auto_handle_alert(onOff = true, accept = true) {
        const page = this._page["_page"];
        if (page) {
            if (onOff) {
                page.cdpSession.on("Page.javascriptDialogOpening", async () => {
                    await page.cdpSession.send("Page.handleJavaScriptDialog", {
                        accept,
                    });
                });
            }
        }
        return this;
    }
    /**
     * 激活标签页
     */
    async activate() {
        const tabs = await this._page.get_tabs();
        if (tabs.length > 0) {
            await this._page.activate_tab(tabs[0].id);
        }
        return this;
    }
}
exports.ChromiumPageSetter = ChromiumPageSetter;
