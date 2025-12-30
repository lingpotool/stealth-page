import { SessionPage } from "../pages/SessionPage";
import { SessionOptions } from "../config/SessionOptions";

/**
 * SessionPage 设置类
 * 对应 DrissionPage.SessionPageSetter
 */
export class SessionPageSetter {
  private readonly _owner: SessionPage;

  constructor(owner: SessionPage) {
    this._owner = owner;
  }

  /**
   * 设置下载路径
   */
  download_path(path: string | null): void {
    if (path !== null) {
      (this._owner.options as any).downloadPath = path;
    }
  }

  /**
   * 设置连接超时时间
   */
  timeout(second: number): void {
    (this._owner.options as any).timeout = second;
  }

  /**
   * 设置编码
   */
  encoding(encoding: string | null, _setAll: boolean = true): void {
    this._owner.encoding = encoding || "utf-8";
  }

  /**
   * 设置通用 headers
   */
  headers(headers: Record<string, string> | string): void {
    if (typeof headers === "string") {
      // 解析从浏览器复制的 headers 文本
      const parsed: Record<string, string> = {};
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
    } else {
      Object.assign(this._owner.options.headers, headers);
    }
  }

  /**
   * 设置单个 header
   */
  header(name: string, value: string): void {
    this._owner.options.headers[name] = value;
  }

  /**
   * 设置 User-Agent
   */
  user_agent(ua: string): void {
    this._owner.options.headers["User-Agent"] = ua;
  }

  /**
   * 设置代理
   */
  proxies(http?: string, https?: string): void {
    if (http) {
      (this._owner.options as any).proxy = http;
    }
    if (https) {
      (this._owner.options as any).httpsProxy = https;
    }
  }

  /**
   * 设置重试次数
   */
  retry_times(times: number): void {
    this._owner.retry_times = times;
    (this._owner.options as any).retryTimes = times;
  }

  /**
   * 设置重试间隔
   */
  retry_interval(interval: number): void {
    this._owner.retry_interval = interval;
    (this._owner.options as any).retryInterval = interval;
  }

  /**
   * 设置是否验证 SSL 证书
   */
  verify(onOff: boolean | null): void {
    (this._owner.options as any).verify = onOff;
  }

  /**
   * 设置是否允许重定向
   */
  allow_redirects(onOff: boolean): void {
    (this._owner.options as any).allowRedirects = onOff;
  }

  /**
   * 设置最大重定向次数
   */
  max_redirects(times: number | null): void {
    (this._owner.options as any).maxRedirects = times;
  }
}
