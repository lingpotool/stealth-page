import * as http from "http";
import * as https from "https";
import { load } from "cheerio";
import { SessionOptions } from "../config/SessionOptions";
import { SessionElement } from "../core/SessionElement";
import { parseLocator } from "../core/locator";
import { SessionPageSetter } from "../units/SessionPageSetter";

// 默认 User-Agent
const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * Node 版 SessionPage，对应 DrissionPage.SessionPage。
 * 当前实现基础 HTTP 能力：get/post 与最近一次响应内容缓存。
 */
export class SessionPage {
  private readonly _options: SessionOptions;
  private _setter: SessionPageSetter | null = null;

  private _url: string | null = null;
  private _statusCode: number | null = null;
  private _html: string | null = null;
  private _responseHeaders: http.IncomingHttpHeaders | null = null;
  private _cookies: CookieEntry[] = [];
  private _encoding: string = "utf-8";

  // 重试配置
  retry_times: number = 3;
  retry_interval: number = 2;

  constructor(sessionOrOptions?: SessionOptions) {
    this._options = sessionOrOptions ?? new SessionOptions();
    this.retry_times = this._options.retryTimes;
    this.retry_interval = this._options.retryInterval;
  }

  /**
   * 返回用于设置的对象
   */
  get set(): SessionPageSetter {
    if (!this._setter) {
      this._setter = new SessionPageSetter(this);
    }
    return this._setter;
  }

  get options(): SessionOptions {
    return this._options;
  }

  get url(): string | null {
    return this._url;
  }

  get status(): number | null {
    return this._statusCode;
  }

  get html(): string | null {
    return this._html;
  }

  get title(): string | null {
    if (!this._html) {
      return null;
    }
    const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(this._html);
    if (!match) {
      return null;
    }
    return match[1].trim();
  }

  get response_headers(): http.IncomingHttpHeaders | null {
    return this._responseHeaders;
  }

  /**
   * 返回页面原始数据
   */
  get raw_data(): string | null {
    return this._html;
  }

  /**
   * 当返回内容是 json 格式时，返回对应的字典
   */
  get json(): any {
    if (!this._html) return null;
    try {
      return JSON.parse(this._html);
    } catch {
      return null;
    }
  }

  /**
   * 返回 user agent
   */
  get user_agent(): string {
    return this._options.headers["User-Agent"] || DEFAULT_USER_AGENT;
  }

  /**
   * 返回编码设置
   */
  get encoding(): string {
    return this._encoding;
  }

  /**
   * 设置编码
   */
  set encoding(value: string) {
    this._encoding = value;
  }

  /**
   * 返回超时设置
   */
  get timeout(): number {
    return this._options.timeout;
  }

  async cookies(): Promise<CookieEntry[]> {
    const now = Date.now();
    return this._cookies
      .filter((c) => !c.expiresAt || c.expiresAt > now)
      .map((c) => ({ ...c }));
  }

  async set_cookies(cookies: Array<{ name: string; value: string; domain?: string; path?: string; expiresAt?: number }>): Promise<void> {
    for (const cookie of cookies) {
      const entry: CookieEntry = {
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain || "",
        path: cookie.path || "/",
        expiresAt: cookie.expiresAt,
      };
      this._cookies = this._cookies.filter((c) =>
        !(c.name === entry.name && c.domain === entry.domain && c.path === entry.path),
      );
      this._cookies.push(entry);
    }
  }

  clear_cookies(): void {
    this._cookies = [];
  }

  async put(url: string, extra?: { headers?: Record<string, string>; body?: string | Buffer }): Promise<boolean> {
    const { retryTimes, retryInterval } = this._options;
    let attempt = 0;
    while (true) {
      try {
        const res = await this._request("PUT", url, extra);
        this._cacheResponse(res);
        return res.statusCode >= 200 && res.statusCode < 400;
      } catch {
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

  async delete(url: string, extra?: { headers?: Record<string, string> }): Promise<boolean> {
    const { retryTimes, retryInterval } = this._options;
    let attempt = 0;
    while (true) {
      try {
        const res = await this._request("DELETE", url, extra);
        this._cacheResponse(res);
        return res.statusCode >= 200 && res.statusCode < 400;
      } catch {
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

  async get(url: string, extra?: { headers?: Record<string, string> }): Promise<boolean> {
    const { retryTimes, retryInterval } = this._options;
    let attempt = 0;
    while (true) {
      try {
        const res = await this._request("GET", url, extra);
        this._cacheResponse(res);
        return res.statusCode >= 200 && res.statusCode < 400;
      } catch {
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

  async post(
    url: string,
    extra?: { headers?: Record<string, string>; body?: string | Buffer } | undefined,
  ): Promise<boolean> {
    const { retryTimes, retryInterval } = this._options;
    let attempt = 0;
    while (true) {
      try {
        const res = await this._request("POST", url, extra);
        this._cacheResponse(res);
        return res.statusCode >= 200 && res.statusCode < 400;
      } catch {
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

  async ele(locator: any, index = 1, _timeout?: number): Promise<any> {
    const all = await this.eles(locator, _timeout);
    if (index <= 0) {
      index = 1;
    }
    return all[index - 1] ?? null;
  }

  async eles(locator: any, _timeout?: number): Promise<any[]> {
    if (!this._html) {
      return [];
    }
    const raw = String(locator);
    const parsed = parseLocator(raw);
    const $ = load(this._html);

    if (parsed.raw.startsWith("text=") || parsed.raw.startsWith("text:") || parsed.raw.startsWith("text^") || parsed.raw.startsWith("text$")) {
      const mode = parsed.raw.slice(4, 5); // = : ^ $
      const value = parsed.raw.slice(5);
      const allNodes = $("*").toArray();
      const matched = allNodes.filter((node: any) => {
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
      return matched.map((node: any) => new SessionElement($, node));
    }

    if (parsed.type === "css") {
      const nodes = $(parsed.value).toArray();
      return nodes.map((node: any) => new SessionElement($, node));
    }

    throw new Error("SessionPage currently does not support xpath locators. Use css: or text= style in session mode.");
  }

  /**
   * 返回页面中符合条件的一个元素（与 ele 相同，为了 API 兼容）
   */
  async s_ele(locator: string, index: number = 1): Promise<SessionElement | null> {
    return this.ele(locator, index);
  }

  /**
   * 返回页面中符合条件的所有元素（与 eles 相同，为了 API 兼容）
   */
  async s_eles(locator: string): Promise<SessionElement[]> {
    return this.eles(locator);
  }

  /**
   * 关闭 Session（清理资源）
   */
  close(): void {
    this._cookies = [];
    this._html = null;
    this._url = null;
    this._statusCode = null;
    this._responseHeaders = null;
  }

  private _cacheResponse(res: HttpResponse): void {
    this._url = res.url;
    this._statusCode = res.statusCode;
    this._html = res.body.toString("utf8");
    this._responseHeaders = res.headers;
  }

  private async _request(
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
    url: string,
    extra?: { headers?: Record<string, string>; body?: string | Buffer },
  ): Promise<HttpResponse> {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === "https:";
    const client = isHttps ? https : http;

    const headers: Record<string, string> = {
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

    return new Promise<HttpResponse>((resolve, reject) => {
      const req = client.request(
        {
          protocol: urlObj.protocol,
          hostname: urlObj.hostname,
          port: urlObj.port || (isHttps ? 443 : 80),
          path: `${urlObj.pathname}${urlObj.search}`,
          method,
          headers,
        },
        (res: http.IncomingMessage) => {
          const chunks: Buffer[] = [];
          res.on("data", (chunk: Buffer) => chunks.push(chunk));
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
        },
      );

      req.on("error", (err: Error) => reject(err));

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

  private _buildCookieHeader(urlObj: URL): string | null {
    const host = urlObj.hostname;
    const reqPath = urlObj.pathname || "/";
    const now = Date.now();
    const pairs: string[] = [];
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

  private _storeCookies(urlObj: URL, res: http.IncomingMessage): void {
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
      const entry: CookieEntry = {
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
        } else if (key === "path" && val) {
          entry.path = val;
        } else if (key === "expires" && val) {
          const ts = Date.parse(val);
          if (!Number.isNaN(ts)) {
            entry.expiresAt = ts;
          }
        } else if (key === "max-age" && val) {
          const sec = Number(val);
          if (!Number.isNaN(sec)) {
            entry.expiresAt = Date.now() + sec * 1000;
          }
        } else if (key === "secure") {
          entry.secure = true;
        } else if (key === "httponly") {
          entry.httpOnly = true;
        }
      }
      this._cookies = this._cookies.filter((c) =>
        !(c.name === entry.name && c.domain === entry.domain && c.path === entry.path),
      );
      const now = Date.now();
      if (!entry.expiresAt || entry.expiresAt > now) {
        this._cookies.push(entry);
      }
    }
  }
}

interface HttpResponse {
  url: string;
  statusCode: number;
  headers: http.IncomingHttpHeaders;
  body: Buffer;
}

interface CookieEntry {
  name: string;
  value: string;
  domain: string;
  path: string;
  expiresAt?: number;
  secure?: boolean;
  httpOnly?: boolean;
}

function domainMatches(cookieDomain: string, host: string): boolean {
  const cd = cookieDomain.toLowerCase();
  const h = host.toLowerCase();
  return h === cd || h.endsWith(`.${cd}`);
}

function pathMatches(cookiePath: string, requestPath: string): boolean {
  if (!cookiePath) {
    return true;
  }
  if (!requestPath.startsWith("/")) {
    return true;
  }
  return requestPath.startsWith(cookiePath);
}

