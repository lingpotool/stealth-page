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
exports.SessionPage = void 0;
const http = __importStar(require("http"));
const https = __importStar(require("https"));
const cheerio_1 = require("cheerio");
const SessionOptions_1 = require("../config/SessionOptions");
const SessionElement_1 = require("../core/SessionElement");
const locator_1 = require("../core/locator");
const SessionPageSetter_1 = require("../units/SessionPageSetter");
// 默认 User-Agent
const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
/**
 * Node 版 SessionPage，对应 DrissionPage.SessionPage。
 * 当前实现基础 HTTP 能力：get/post 与最近一次响应内容缓存。
 */
class SessionPage {
    constructor(sessionOrOptions) {
        this._setter = null;
        this._url = null;
        this._statusCode = null;
        this._html = null;
        this._responseHeaders = null;
        this._cookies = [];
        this._encoding = "utf-8";
        // 重试配置
        this.retry_times = 3;
        this.retry_interval = 2;
        this._options = sessionOrOptions ?? new SessionOptions_1.SessionOptions();
        this.retry_times = this._options.retryTimes;
        this.retry_interval = this._options.retryInterval;
    }
    /**
     * 返回用于设置的对象
     */
    get set() {
        if (!this._setter) {
            this._setter = new SessionPageSetter_1.SessionPageSetter(this);
        }
        return this._setter;
    }
    get options() {
        return this._options;
    }
    get url() {
        return this._url;
    }
    get status() {
        return this._statusCode;
    }
    get html() {
        return this._html;
    }
    get title() {
        if (!this._html) {
            return null;
        }
        const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(this._html);
        if (!match) {
            return null;
        }
        return match[1].trim();
    }
    get response_headers() {
        return this._responseHeaders;
    }
    /**
     * 返回页面原始数据
     */
    get raw_data() {
        return this._html;
    }
    /**
     * 当返回内容是 json 格式时，返回对应的字典
     */
    get json() {
        if (!this._html)
            return null;
        try {
            return JSON.parse(this._html);
        }
        catch {
            return null;
        }
    }
    /**
     * 返回 user agent
     */
    get user_agent() {
        return this._options.headers["User-Agent"] || DEFAULT_USER_AGENT;
    }
    /**
     * 返回编码设置
     */
    get encoding() {
        return this._encoding;
    }
    /**
     * 设置编码
     */
    set encoding(value) {
        this._encoding = value;
    }
    /**
     * 返回超时设置
     */
    get timeout() {
        return this._options.timeout;
    }
    async cookies() {
        const now = Date.now();
        return this._cookies
            .filter((c) => !c.expiresAt || c.expiresAt > now)
            .map((c) => ({ ...c }));
    }
    async set_cookies(cookies) {
        for (const cookie of cookies) {
            const entry = {
                name: cookie.name,
                value: cookie.value,
                domain: cookie.domain || "",
                path: cookie.path || "/",
                expiresAt: cookie.expiresAt,
            };
            this._cookies = this._cookies.filter((c) => !(c.name === entry.name && c.domain === entry.domain && c.path === entry.path));
            this._cookies.push(entry);
        }
    }
    clear_cookies() {
        this._cookies = [];
    }
    async put(url, extra) {
        const { retryTimes, retryInterval } = this._options;
        let attempt = 0;
        while (true) {
            try {
                const res = await this._request("PUT", url, extra);
                this._cacheResponse(res);
                return res.statusCode >= 200 && res.statusCode < 400;
            }
            catch {
                if (attempt >= retryTimes) {
                    this._url = url;
                    this._statusCode = 0;
                    this._html = null;
                    return false;
                }
                attempt += 1;
                await new Promise((resolve) => setTimeout(resolve, retryInterval * 1000));
            }
        }
    }
    async delete(url, extra) {
        const { retryTimes, retryInterval } = this._options;
        let attempt = 0;
        while (true) {
            try {
                const res = await this._request("DELETE", url, extra);
                this._cacheResponse(res);
                return res.statusCode >= 200 && res.statusCode < 400;
            }
            catch {
                if (attempt >= retryTimes) {
                    this._url = url;
                    this._statusCode = 0;
                    this._html = null;
                    return false;
                }
                attempt += 1;
                await new Promise((resolve) => setTimeout(resolve, retryInterval * 1000));
            }
        }
    }
    async get(url, extra) {
        const { retryTimes, retryInterval } = this._options;
        let attempt = 0;
        while (true) {
            try {
                const res = await this._request("GET", url, extra);
                this._cacheResponse(res);
                return res.statusCode >= 200 && res.statusCode < 400;
            }
            catch {
                if (attempt >= retryTimes) {
                    this._url = url;
                    this._statusCode = 0;
                    this._html = null;
                    return false;
                }
                attempt += 1;
                await new Promise((resolve) => setTimeout(resolve, this._options.retryInterval * 1000));
            }
        }
    }
    async post(url, extra) {
        const { retryTimes, retryInterval } = this._options;
        let attempt = 0;
        while (true) {
            try {
                const res = await this._request("POST", url, extra);
                this._cacheResponse(res);
                return res.statusCode >= 200 && res.statusCode < 400;
            }
            catch {
                if (attempt >= retryTimes) {
                    this._url = url;
                    this._statusCode = 0;
                    this._html = null;
                    return false;
                }
                attempt += 1;
                await new Promise((resolve) => setTimeout(resolve, retryInterval * 1000));
            }
        }
    }
    async ele(locator, index = 1, _timeout) {
        const all = await this.eles(locator, _timeout);
        if (index <= 0) {
            index = 1;
        }
        return all[index - 1] ?? null;
    }
    async eles(locator, _timeout) {
        if (!this._html) {
            return [];
        }
        const raw = String(locator);
        const parsed = (0, locator_1.parseLocator)(raw);
        const $ = (0, cheerio_1.load)(this._html);
        if (parsed.raw.startsWith("text=") || parsed.raw.startsWith("text:") || parsed.raw.startsWith("text^") || parsed.raw.startsWith("text$")) {
            const mode = parsed.raw.slice(4, 5); // = : ^ $
            const value = parsed.raw.slice(5);
            const allNodes = $("*").toArray();
            const matched = allNodes.filter((node) => {
                const t = $(node).text();
                if (!t) {
                    return false;
                }
                if (mode === "=") {
                    return t === value;
                }
                if (mode === ":") {
                    return t.includes(value);
                }
                if (mode === "^") {
                    return t.startsWith(value);
                }
                if (mode === "$") {
                    return t.endsWith(value);
                }
                return false;
            });
            return matched.map((node) => new SessionElement_1.SessionElement($, node));
        }
        if (parsed.type === "css") {
            const nodes = $(parsed.value).toArray();
            return nodes.map((node) => new SessionElement_1.SessionElement($, node));
        }
        throw new Error("SessionPage currently does not support xpath locators. Use css: or text= style in session mode.");
    }
    /**
     * 返回页面中符合条件的一个元素（与 ele 相同，为了 API 兼容）
     */
    async s_ele(locator, index = 1) {
        return this.ele(locator, index);
    }
    /**
     * 返回页面中符合条件的所有元素（与 eles 相同，为了 API 兼容）
     */
    async s_eles(locator) {
        return this.eles(locator);
    }
    /**
     * 关闭 Session（清理资源）
     */
    close() {
        this._cookies = [];
        this._html = null;
        this._url = null;
        this._statusCode = null;
        this._responseHeaders = null;
    }
    _cacheResponse(res) {
        this._url = res.url;
        this._statusCode = res.statusCode;
        this._html = res.body.toString("utf8");
        this._responseHeaders = res.headers;
    }
    async _request(method, url, extra) {
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === "https:";
        const client = isHttps ? https : http;
        const headers = {
            'User-Agent': DEFAULT_USER_AGENT,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            ...this._options.headers,
            ...(extra?.headers ?? {}),
        };
        const hasCookieHeader = Object.keys(headers).some((k) => k.toLowerCase() === "cookie");
        if (!hasCookieHeader) {
            const cookieHeader = this._buildCookieHeader(urlObj);
            if (cookieHeader) {
                headers["Cookie"] = cookieHeader;
            }
        }
        const timeoutMs = this._options.timeout * 1000;
        return new Promise((resolve, reject) => {
            const req = client.request({
                protocol: urlObj.protocol,
                hostname: urlObj.hostname,
                port: urlObj.port || (isHttps ? 443 : 80),
                path: `${urlObj.pathname}${urlObj.search}`,
                method,
                headers,
            }, (res) => {
                const chunks = [];
                res.on("data", (chunk) => chunks.push(chunk));
                res.on("end", () => {
                    const body = Buffer.concat(chunks);
                    this._storeCookies(urlObj, res);
                    resolve({
                        url: urlObj.toString(),
                        statusCode: res.statusCode ?? 0,
                        headers: res.headers,
                        body,
                    });
                });
            });
            req.on("error", (err) => reject(err));
            if (timeoutMs > 0) {
                req.setTimeout(timeoutMs, () => {
                    req.destroy();
                    reject(new Error(`SessionPage request timeout after ${timeoutMs}ms`));
                });
            }
            if (extra?.body) {
                req.write(extra.body);
            }
            req.end();
        });
    }
    _buildCookieHeader(urlObj) {
        const host = urlObj.hostname;
        const reqPath = urlObj.pathname || "/";
        const now = Date.now();
        const pairs = [];
        for (const c of this._cookies) {
            if (c.expiresAt && c.expiresAt <= now) {
                continue;
            }
            if (!domainMatches(c.domain || host, host)) {
                continue;
            }
            if (!pathMatches(c.path || "/", reqPath)) {
                continue;
            }
            pairs.push(`${c.name}=${c.value}`);
        }
        if (!pairs.length) {
            return null;
        }
        return pairs.join("; ");
    }
    _storeCookies(urlObj, res) {
        const setCookie = res.headers["set-cookie"];
        if (!setCookie) {
            return;
        }
        const list = Array.isArray(setCookie) ? setCookie : [setCookie];
        for (const raw of list) {
            if (!raw) {
                continue;
            }
            const parts = raw.split(";");
            const [nameValue, ...attrParts] = parts;
            const nv = nameValue.split("=");
            if (nv.length < 2) {
                continue;
            }
            const name = nv[0].trim();
            const value = nv.slice(1).join("=").trim();
            const entry = {
                name,
                value,
                domain: urlObj.hostname,
                path: "/",
            };
            for (const attr of attrParts) {
                const t = attr.trim();
                if (!t) {
                    continue;
                }
                const [k, v] = t.split("=");
                const key = k.toLowerCase();
                const val = v ? v.trim() : "";
                if (key === "domain" && val) {
                    entry.domain = val.startsWith(".") ? val.slice(1) : val;
                }
                else if (key === "path" && val) {
                    entry.path = val;
                }
                else if (key === "expires" && val) {
                    const ts = Date.parse(val);
                    if (!Number.isNaN(ts)) {
                        entry.expiresAt = ts;
                    }
                }
                else if (key === "max-age" && val) {
                    const sec = Number(val);
                    if (!Number.isNaN(sec)) {
                        entry.expiresAt = Date.now() + sec * 1000;
                    }
                }
                else if (key === "secure") {
                    entry.secure = true;
                }
                else if (key === "httponly") {
                    entry.httpOnly = true;
                }
            }
            this._cookies = this._cookies.filter((c) => !(c.name === entry.name && c.domain === entry.domain && c.path === entry.path));
            const now = Date.now();
            if (!entry.expiresAt || entry.expiresAt > now) {
                this._cookies.push(entry);
            }
        }
    }
}
exports.SessionPage = SessionPage;
function domainMatches(cookieDomain, host) {
    const cd = cookieDomain.toLowerCase();
    const h = host.toLowerCase();
    return h === cd || h.endsWith(`.${cd}`);
}
function pathMatches(cookiePath, requestPath) {
    if (!cookiePath) {
        return true;
    }
    if (!requestPath.startsWith("/")) {
        return true;
    }
    return requestPath.startsWith(cookiePath);
}
