export interface SessionOptionsInit {
  downloadPath?: string;
  timeout?: number;
  retryTimes?: number;
  retryInterval?: number;
  headers?: Record<string, string>;
  proxies?: { http?: string; https?: string };
}

/**
 * Node 版 SessionOptions，对齐 DrissionPage.SessionOptions 的主要字段。
 * 当前仅用于描述配置，HTTP 细节后续实现。
 */
export class SessionOptions {
  downloadPath: string = ".";
  timeout: number = 10;
  retryTimes: number = 3;
  retryInterval: number = 2;
  headers: Record<string, string> = {};
  proxies: { http?: string; https?: string } = {};

  constructor(init?: SessionOptionsInit) {
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

  set_download_path(path: string): this {
    this.downloadPath = path;
    return this;
  }

  set_timeouts(timeout: number): this {
    this.timeout = timeout;
    return this;
  }

  set_retry(times: number, interval: number): this {
    this.retryTimes = times;
    this.retryInterval = interval;
    return this;
  }

  set_headers(headers: Record<string, string>): this {
    this.headers = { ...this.headers, ...headers };
    return this;
  }

  set_proxies(http?: string, https?: string): this {
    this.proxies = { http, https };
    return this;
  }

  set_a_header(key: string, value: string): this {
    this.headers[key] = value;
    return this;
  }

  remove_a_header(key: string): this {
    delete this.headers[key];
    return this;
  }
}
