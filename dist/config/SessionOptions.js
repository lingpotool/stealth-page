"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionOptions = void 0;
/**
 * Node 版 SessionOptions，对齐 DrissionPage.SessionOptions 的主要字段。
 * 当前仅用于描述配置，HTTP 细节后续实现。
 */
class SessionOptions {
    constructor(init) {
        this.downloadPath = ".";
        this.timeout = 10;
        this.retryTimes = 3;
        this.retryInterval = 2;
        this.headers = {};
        this.proxies = {};
        if (init) {
            Object.assign(this, {
                downloadPath: init.downloadPath ?? this.downloadPath,
                timeout: init.timeout ?? this.timeout,
                retryTimes: init.retryTimes ?? this.retryTimes,
                retryInterval: init.retryInterval ?? this.retryInterval,
                headers: init.headers ?? this.headers,
                proxies: init.proxies ?? this.proxies,
            });
        }
    }
    set_download_path(path) {
        this.downloadPath = path;
        return this;
    }
    set_timeouts(timeout) {
        this.timeout = timeout;
        return this;
    }
    set_retry(times, interval) {
        this.retryTimes = times;
        this.retryInterval = interval;
        return this;
    }
    set_headers(headers) {
        this.headers = { ...this.headers, ...headers };
        return this;
    }
    set_proxies(http, https) {
        this.proxies = { http, https };
        return this;
    }
    set_a_header(key, value) {
        this.headers[key] = value;
        return this;
    }
    remove_a_header(key) {
        delete this.headers[key];
        return this;
    }
}
exports.SessionOptions = SessionOptions;
