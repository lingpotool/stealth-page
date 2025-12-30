"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageCookiesSetter = exports.CookiesSetter = void 0;
/**
 * Cookie 设置类，对应 DrissionPage 的 CookiesSetter
 */
class CookiesSetter {
    constructor(owner) {
        this._owner = owner;
    }
    /**
     * 设置一个或多个 cookie
     */
    async set(cookies) {
        const cookieList = this._parseCookies(cookies);
        for (const cookie of cookieList) {
            await this._owner.cdpSession.send("Network.setCookie", {
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
     * 删除一个 cookie
     */
    async remove(name, url, domain, path) {
        const params = { name };
        if (url)
            params.url = url;
        if (domain)
            params.domain = domain;
        if (path)
            params.path = path;
        await this._owner.cdpSession.send("Network.deleteCookies", params);
    }
    /**
     * 清除所有 cookie
     */
    async clear() {
        await this._owner.cdpSession.send("Network.clearBrowserCookies");
    }
    /**
     * 解析各种格式的 cookie 输入
     */
    _parseCookies(cookies) {
        if (Array.isArray(cookies)) {
            return cookies;
        }
        if (typeof cookies === "string") {
            // 解析 cookie 字符串，如 "name1=value1; name2=value2"
            return cookies.split(";").map((pair) => {
                const [name, ...valueParts] = pair.trim().split("=");
                return {
                    name: name.trim(),
                    value: valueParts.join("=").trim(),
                };
            });
        }
        if (typeof cookies === "object" && !("name" in cookies)) {
            // Record<string, string> 格式
            return Object.entries(cookies).map(([name, value]) => ({
                name,
                value,
            }));
        }
        // 单个 CookieData
        return [cookies];
    }
}
exports.CookiesSetter = CookiesSetter;
/**
 * 页面级别的 Cookie 设置类
 */
class PageCookiesSetter extends CookiesSetter {
    /**
     * 获取所有 cookie
     */
    async getAll(urls) {
        const params = {};
        if (urls)
            params.urls = urls;
        const { cookies } = await this._owner.cdpSession.send("Network.getAllCookies", params);
        return cookies.map((c) => ({
            name: c.name,
            value: c.value,
            domain: c.domain,
            path: c.path,
            expires: c.expires,
            httpOnly: c.httpOnly,
            secure: c.secure,
            sameSite: c.sameSite,
        }));
    }
}
exports.PageCookiesSetter = PageCookiesSetter;
