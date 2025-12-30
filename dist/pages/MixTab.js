"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MixTab = void 0;
const ChromiumTab_1 = require("./ChromiumTab");
const SessionPage_1 = require("./SessionPage");
/**
 * MixTab - 混合模式标签页
 * 对应 DrissionPage.MixTab，支持 d 模式（浏览器）和 s 模式（Session）切换
 */
class MixTab extends ChromiumTab_1.ChromiumTab {
    constructor(browser, tabId, sessionOptions) {
        super(browser, tabId);
        this._mode = "d";
        this._sessionUrl = null;
        this._sessionPage = new SessionPage_1.SessionPage(sessionOptions);
    }
    // ========== 模式相关 ==========
    get mode() {
        return this._mode;
    }
    /**
     * 切换模式
     * @param mode 目标模式，不传则切换
     * @param go 是否跳转到原模式的 url
     * @param copyCookies 是否复制 cookies 到目标模式
     */
    async change_mode(mode, go = true, copyCookies = true) {
        const targetMode = mode || (this._mode === "d" ? "s" : "d");
        if (targetMode === this._mode)
            return;
        if (copyCookies) {
            if (this._mode === "d" && targetMode === "s") {
                await this.cookies_to_session();
            }
            else if (this._mode === "s" && targetMode === "d") {
                await this.cookies_to_browser();
            }
        }
        const currentUrl = this._mode === "d" ? await super.url() : this._sessionPage.url;
        this._mode = targetMode;
        if (go && currentUrl) {
            await this.get(currentUrl);
        }
    }
    /**
     * 把浏览器的 cookies 复制到 session 对象
     */
    async cookies_to_session(copyUserAgent = true) {
        await this.init();
        // 获取浏览器 cookies
        const browserCookies = await super.cookies(true, true);
        // 设置到 session
        await this._sessionPage.set_cookies(browserCookies.map((c) => ({
            name: c.name,
            value: c.value,
            domain: c.domain,
            path: c.path,
            expiresAt: c.expires ? c.expires * 1000 : undefined,
        })));
        // 复制 user agent
        if (copyUserAgent) {
            const ua = await this.user_agent();
            if (ua) {
                this._sessionPage.options.headers["User-Agent"] = ua;
            }
        }
    }
    /**
     * 把 session 对象的 cookies 复制到浏览器
     */
    async cookies_to_browser() {
        await this.init();
        const sessionCookies = await this._sessionPage.cookies();
        const currentUrl = await super.url();
        const urlObj = currentUrl ? new URL(currentUrl) : null;
        const cookiesToSet = sessionCookies.map((c) => ({
            name: c.name,
            value: c.value,
            domain: c.domain || (urlObj ? urlObj.hostname : ""),
            path: c.path || "/",
        }));
        await super.set_cookies(cookiesToSet);
    }
    /**
     * 获取 user agent
     */
    async user_agent() {
        if (this._mode === "d") {
            await this.init();
            const { result } = await this._browser.cdpSession.send("Runtime.evaluate", {
                expression: "navigator.userAgent",
                returnByValue: true,
            });
            return result.value;
        }
        return this._sessionPage.options.headers["User-Agent"] || "";
    }
    // ========== 重写的方法 ==========
    async get(url, options) {
        if (this._mode === "d") {
            return super.get(url);
        }
        // s 模式
        const result = await this._sessionPage.get(url, {
            headers: options?.headers,
        });
        this._sessionUrl = url;
        return result;
    }
    async post(url, options) {
        if (this._mode === "d") {
            // d 模式下 post 使用 session
            return this._sessionPage.post(url, {
                headers: options?.headers,
                body: options?.data,
            });
        }
        return this._sessionPage.post(url, {
            headers: options?.headers,
            body: options?.data,
        });
    }
    async html() {
        if (this._mode === "d") {
            return super.html();
        }
        return this._sessionPage.html || "";
    }
    async title() {
        if (this._mode === "d") {
            return super.title();
        }
        return this._sessionPage.title || "";
    }
    async url() {
        if (this._mode === "d") {
            return super.url();
        }
        return this._sessionPage.url || "";
    }
    async cookies(allDomains = false, allInfo = false) {
        if (this._mode === "d") {
            return super.cookies(allDomains, allInfo);
        }
        return this._sessionPage.cookies();
    }
    async ele(locator, index = 1, timeout) {
        if (this._mode === "d") {
            return super.ele(locator, index, timeout);
        }
        // s 模式下返回 SessionElement，但为了类型兼容，这里返回 Element | null
        // 实际使用时可以通过 s_ele 获取 SessionElement
        const sessionEle = await this._sessionPage.ele(locator, index, timeout);
        return sessionEle;
    }
    async eles(locator, timeout) {
        if (this._mode === "d") {
            return super.eles(locator, timeout);
        }
        // s 模式下返回 SessionElement[]，但为了类型兼容，这里返回 Element[]
        const sessionEles = await this._sessionPage.eles(locator, timeout);
        return sessionEles;
    }
    /**
     * 以 SessionElement 形式返回元素
     * d 模式下会获取页面 HTML 后解析，s 模式下直接返回
     */
    async s_ele(locator, index = 1, timeout) {
        if (this._mode === "d") {
            return super.s_ele(locator, index, timeout);
        }
        return this._sessionPage.ele(locator, index, timeout);
    }
    async s_eles(locator, timeout) {
        if (this._mode === "d") {
            return super.s_eles(locator, timeout);
        }
        return this._sessionPage.eles(locator, timeout);
    }
    // ========== Session 特有属性 ==========
    get session() {
        return this._sessionPage;
    }
    get response_headers() {
        return this._sessionPage.response_headers;
    }
    get status() {
        return this._sessionPage.status;
    }
    /**
     * 返回页面原始数据
     */
    get raw_data() {
        if (this._mode === "s") {
            return this._sessionPage.html;
        }
        return null;
    }
    /**
     * 当返回内容是 json 格式时，返回对应的字典
     */
    async json() {
        if (this._mode === "s" && this._sessionPage.html) {
            try {
                return JSON.parse(this._sessionPage.html);
            }
            catch {
                return null;
            }
        }
        if (this._mode === "d") {
            const htmlContent = await super.html();
            try {
                // 尝试从 pre 标签中提取 JSON
                const match = /<pre[^>]*>([\s\S]*?)<\/pre>/i.exec(htmlContent);
                if (match) {
                    return JSON.parse(match[1]);
                }
                // 尝试直接解析
                return JSON.parse(htmlContent);
            }
            catch {
                return null;
            }
        }
        return null;
    }
    // ========== 关闭 ==========
    async close(others = false) {
        if (this._mode === "d") {
            await super.close(others);
        }
        // s 模式下不需要关闭标签页
    }
}
exports.MixTab = MixTab;
