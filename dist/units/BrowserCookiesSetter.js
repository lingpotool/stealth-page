"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserCookiesSetter = void 0;
/**
 * 浏览器级别 Cookies 设置类
 * 对应 DrissionPage.BrowserCookiesSetter
 */
class BrowserCookiesSetter {
    constructor(browser) {
        this._browser = browser;
    }
    /**
     * 设置一个或多个 cookie
     */
    async set(cookies) {
        const cookieList = Array.isArray(cookies) ? cookies : [cookies];
        for (const cookie of cookieList) {
            await this._browser.cdpSession.send("Network.setCookie", {
                name: cookie.name,
                value: cookie.value,
                domain: cookie.domain,
                path: cookie.path || "/",
                expires: cookie.expires,
                httpOnly: cookie.httpOnly,
                secure: cookie.secure,
                sameSite: cookie.sameSite,
            });
        }
    }
    /**
     * 删除指定的 cookie
     */
    async remove(name, domain, path) {
        await this._browser.cdpSession.send("Network.deleteCookies", {
            name,
            domain,
            path,
        });
    }
    /**
     * 清除所有 cookies
     */
    async clear(domain) {
        if (domain) {
            // 获取指定域名的 cookies 并删除
            const { cookies } = await this._browser.cdpSession.send("Storage.getCookies");
            for (const cookie of cookies) {
                if (cookie.domain === domain || cookie.domain === `.${domain}`) {
                    await this.remove(cookie.name, cookie.domain, cookie.path);
                }
            }
        }
        else {
            await this._browser.cdpSession.send("Network.clearBrowserCookies");
        }
    }
}
exports.BrowserCookiesSetter = BrowserCookiesSetter;
