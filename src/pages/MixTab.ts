import { Chromium } from "../chromium/Chromium";
import { ChromiumTab } from "./ChromiumTab";
import { SessionPage } from "./SessionPage";
import { SessionOptions } from "../config/SessionOptions";
import { Element } from "../core/Element";
import { SessionElement } from "../core/SessionElement";

export type MixTabMode = "d" | "s";

/**
 * MixTab - 混合模式标签页
 * 对应 DrissionPage.MixTab，支持 d 模式（浏览器）和 s 模式（Session）切换
 */
export class MixTab extends ChromiumTab {
  private _mode: MixTabMode = "d";
  private _sessionPage: SessionPage;
  private _sessionUrl: string | null = null;

  constructor(browser: Chromium, tabId: string, sessionOptions?: SessionOptions) {
    super(browser, tabId);
    this._sessionPage = new SessionPage(sessionOptions);
  }

  // ========== 模式相关 ==========

  get mode(): MixTabMode {
    return this._mode;
  }

  /**
   * 切换模式
   * @param mode 目标模式，不传则切换
   * @param go 是否跳转到原模式的 url
   * @param copyCookies 是否复制 cookies 到目标模式
   */
  async change_mode(mode?: MixTabMode, go: boolean = true, copyCookies: boolean = true): Promise<void> {
    const targetMode = mode || (this._mode === "d" ? "s" : "d");
    
    if (targetMode === this._mode) return;
    
    if (copyCookies) {
      if (this._mode === "d" && targetMode === "s") {
        await this.cookies_to_session();
      } else if (this._mode === "s" && targetMode === "d") {
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
  async cookies_to_session(copyUserAgent: boolean = true): Promise<void> {
    await this.init();
    
    // 获取浏览器 cookies
    const browserCookies = await super.cookies(true, true);
    
    // 设置到 session
    await this._sessionPage.set_cookies(browserCookies.map((c: any) => ({
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
  async cookies_to_browser(): Promise<void> {
    await this.init();
    
    const sessionCookies = await this._sessionPage.cookies();
    const currentUrl = await super.url();
    const urlObj = currentUrl ? new URL(currentUrl) : null;
    
    const cookiesToSet = sessionCookies.map((c: any) => ({
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
  async user_agent(): Promise<string> {
    if (this._mode === "d") {
      await this.init();
      const { result } = await this._browser.cdpSession.send<{ result: { value: string } }>("Runtime.evaluate", {
        expression: "navigator.userAgent",
        returnByValue: true,
      });
      return result.value;
    }
    return this._sessionPage.options.headers["User-Agent"] || "";
  }

  // ========== 重写的方法 ==========

  async get(url: string, options?: {
    showErrmsg?: boolean;
    retry?: number;
    interval?: number;
    timeout?: number;
    params?: Record<string, string>;
    data?: any;
    json?: any;
    headers?: Record<string, string>;
    cookies?: any;
    files?: any;
    auth?: any;
    allowRedirects?: boolean;
    proxies?: Record<string, string>;
    hooks?: any;
    stream?: boolean;
    verify?: boolean | string;
    cert?: string | [string, string];
  }): Promise<boolean> {
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

  async post(url: string, options?: {
    showErrmsg?: boolean;
    retry?: number;
    interval?: number;
    timeout?: number;
    params?: Record<string, string>;
    data?: any;
    json?: any;
    headers?: Record<string, string>;
    cookies?: any;
    files?: any;
    auth?: any;
    allowRedirects?: boolean;
    proxies?: Record<string, string>;
    hooks?: any;
    stream?: boolean;
    verify?: boolean | string;
    cert?: string | [string, string];
  }): Promise<boolean> {
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

  async html(): Promise<string> {
    if (this._mode === "d") {
      return super.html();
    }
    return this._sessionPage.html || "";
  }

  async title(): Promise<string> {
    if (this._mode === "d") {
      return super.title();
    }
    return this._sessionPage.title || "";
  }

  async url(): Promise<string> {
    if (this._mode === "d") {
      return super.url();
    }
    return this._sessionPage.url || "";
  }

  async cookies(allDomains: boolean = false, allInfo: boolean = false): Promise<any[]> {
    if (this._mode === "d") {
      return super.cookies(allDomains, allInfo);
    }
    return this._sessionPage.cookies();
  }

  async ele(locator: string, index: number = 1, timeout?: number): Promise<Element | null> {
    if (this._mode === "d") {
      return super.ele(locator, index, timeout);
    }
    // s 模式下返回 SessionElement，但为了类型兼容，这里返回 Element | null
    // 实际使用时可以通过 s_ele 获取 SessionElement
    const sessionEle = await this._sessionPage.ele(locator, index, timeout);
    return sessionEle as any;
  }

  async eles(locator: string, timeout?: number): Promise<Element[]> {
    if (this._mode === "d") {
      return super.eles(locator, timeout);
    }
    // s 模式下返回 SessionElement[]，但为了类型兼容，这里返回 Element[]
    const sessionEles = await this._sessionPage.eles(locator, timeout);
    return sessionEles as any;
  }

  /**
   * 以 SessionElement 形式返回元素
   * d 模式下会获取页面 HTML 后解析，s 模式下直接返回
   */
  async s_ele(locator: string, index: number = 1, timeout?: number): Promise<SessionElement | null> {
    if (this._mode === "d") {
      return super.s_ele(locator, index, timeout);
    }
    return this._sessionPage.ele(locator, index, timeout) as Promise<SessionElement | null>;
  }

  async s_eles(locator: string, timeout?: number): Promise<SessionElement[]> {
    if (this._mode === "d") {
      return super.s_eles(locator, timeout);
    }
    return this._sessionPage.eles(locator, timeout) as Promise<SessionElement[]>;
  }

  // ========== Session 特有属性 ==========

  get session(): SessionPage {
    return this._sessionPage;
  }

  get response_headers(): any {
    return this._sessionPage.response_headers;
  }

  get status(): number | null {
    return this._sessionPage.status;
  }

  /**
   * 返回页面原始数据
   */
  get raw_data(): string | null {
    if (this._mode === "s") {
      return this._sessionPage.html;
    }
    return null;
  }

  /**
   * 当返回内容是 json 格式时，返回对应的字典
   */
  async json(): Promise<any> {
    if (this._mode === "s" && this._sessionPage.html) {
      try {
        return JSON.parse(this._sessionPage.html);
      } catch {
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
      } catch {
        return null;
      }
    }
    
    return null;
  }

  // ========== 关闭 ==========

  async close(others: boolean = false): Promise<void> {
    if (this._mode === "d") {
      await super.close(others);
    }
    // s 模式下不需要关闭标签页
  }
}
