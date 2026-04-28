import { SessionPage } from "../pages/SessionPage";
import { SessionOptions } from "../config/SessionOptions";
import { SessionCookiesSetter } from "./SessionCookiesSetter";

/**
 * SessionPage 设置类
 * 对应 DrissionPage.SessionPageSetter
 */
export class SessionPageSetter {
  private readonly _owner: SessionPage;

  constructor(owner: SessionPage) {
    this._owner = owner;
  }

  get cookies(): SessionCookiesSetter {
    return new SessionCookiesSetter(this._owner);
  }

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

  auth(auth: string | [string, string] | Record<string, string>): void {
    if (Array.isArray(auth)) {
      (this._owner.options as any).auth = { username: auth[0], password: auth[1] };
    } else if (typeof auth === 'string') {
      const decoded = Buffer.from(auth, 'base64').toString('utf-8');
      const [username, password] = decoded.split(':');
      (this._owner.options as any).auth = { username, password };
    } else {
      (this._owner.options as any).auth = auth;
    }
  }

  hooks(hooks: Record<string, Function>): void {
    (this._owner.options as any).hooks = { ...((this._owner.options as any).hooks || {}), ...hooks };
  }

  params(params: Record<string, string>): void {
    (this._owner.options as any).params = { ...((this._owner.options as any).params || {}), ...params };
  }

  cert(cert: string | Record<string, string>): void {
    (this._owner.options as any).cert = cert;
  }

  stream(onOff: boolean): void {
    (this._owner.options as any).stream = onOff;
  }

  trust_env(onOff: boolean): void {
    (this._owner.options as any).trustEnv = onOff;
  }

  add_adapter(url: string, adapter: any): void {
    if (!(this._owner.options as any).adapters) {
      (this._owner.options as any).adapters = {};
    }
    (this._owner.options as any).adapters[url] = adapter;
  }
}
