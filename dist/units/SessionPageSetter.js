"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionPageSetter = void 0;
/**
 * SessionPage 设置类
 * 对应 DrissionPage.SessionPageSetter
 */
class SessionPageSetter {
    constructor(owner) {
        this._owner = owner;
    }
    /**
     * 设置下载路径
     */
    download_path(path) {
        if (path !== null) {
            this._owner.options.downloadPath = path;
        }
    }
    /**
     * 设置连接超时时间
     */
    timeout(second) {
        this._owner.options.timeout = second;
    }
    /**
     * 设置编码
     */
    encoding(encoding, _setAll = true) {
        this._owner.encoding = encoding || "utf-8";
    }
    /**
     * 设置通用 headers
     */
    headers(headers) {
        if (typeof headers === "string") {
            // 解析从浏览器复制的 headers 文本
            const parsed = {};
            const lines = headers.split("\n");
            for (const line of lines) {
                const idx = line.indexOf(":");
                if (idx > 0) {
                    const key = line.slice(0, idx).trim();
                    const value = line.slice(idx + 1).trim();
                    if (key && value) {
                        parsed[key] = value;
                    }
                }
            }
            Object.assign(this._owner.options.headers, parsed);
        }
        else {
            Object.assign(this._owner.options.headers, headers);
        }
    }
    /**
     * 设置单个 header
     */
    header(name, value) {
        this._owner.options.headers[name] = value;
    }
    /**
     * 设置 User-Agent
     */
    user_agent(ua) {
        this._owner.options.headers["User-Agent"] = ua;
    }
    /**
     * 设置代理
     */
    proxies(http, https) {
        if (http) {
            this._owner.options.proxy = http;
        }
        if (https) {
            this._owner.options.httpsProxy = https;
        }
    }
    /**
     * 设置重试次数
     */
    retry_times(times) {
        this._owner.retry_times = times;
        this._owner.options.retryTimes = times;
    }
    /**
     * 设置重试间隔
     */
    retry_interval(interval) {
        this._owner.retry_interval = interval;
        this._owner.options.retryInterval = interval;
    }
    /**
     * 设置是否验证 SSL 证书
     */
    verify(onOff) {
        this._owner.options.verify = onOff;
    }
    /**
     * 设置是否允许重定向
     */
    allow_redirects(onOff) {
        this._owner.options.allowRedirects = onOff;
    }
    /**
     * 设置最大重定向次数
     */
    max_redirects(times) {
        this._owner.options.maxRedirects = times;
    }
}
exports.SessionPageSetter = SessionPageSetter;
