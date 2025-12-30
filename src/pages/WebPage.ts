import { ChromiumPage } from "./ChromiumPage";
import { SessionPage } from "./SessionPage";
import { ChromiumOptions } from "../config/ChromiumOptions";
import { SessionOptions } from "../config/SessionOptions";
import { SessionElement } from "../core/SessionElement";

export type WebPageMode = "d" | "s";

/**
 * Node 版 WebPage，对应 DrissionPage.WebPage。
 * 通过 mode 切换浏览器驱动模式(d)和会话模式(s)。
 */
export class WebPage {
  private _mode: WebPageMode;
  private readonly _chromiumPage: ChromiumPage;
  private readonly _sessionPage: SessionPage;

  get wait(): any {
    if (this._mode === "d") {
      return this._chromiumPage.wait;
    }
    return {
      ele: async (locator: any, timeoutMs = 10000, intervalMs = 200): Promise<any> => {
        const deadline = Date.now() + timeoutMs;
        while (true) {
          const el = await this._sessionPage.ele(locator);
          if (el) {
            return el;
          }
          if (Date.now() > deadline) {
            return null;
          }
          await new Promise((resolve) => setTimeout(resolve, intervalMs));
        }
      },
    };
  }

  /**
   * 滚动操作对象（仅 d 模式）
   */
  get scroll(): any {
    if (this._mode === "d") {
      return this._chromiumPage.scroll;
    }
    return null;
  }

  /**
   * 状态检查对象（仅 d 模式）
   */
  get states(): any {
    if (this._mode === "d") {
      return this._chromiumPage.states;
    }
    return null;
  }

  /**
   * 位置信息对象（仅 d 模式）
   */
  get rect(): any {
    if (this._mode === "d") {
      return this._chromiumPage.rect;
    }
    return null;
  }

  /**
   * 控制台监听对象（仅 d 模式）
   */
  get console(): any {
    if (this._mode === "d") {
      return this._chromiumPage.console;
    }
    return null;
  }

  /**
   * 录屏对象（仅 d 模式）
   */
  get screencast(): any {
    if (this._mode === "d") {
      return this._chromiumPage.screencast;
    }
    return null;
  }

  /**
   * 窗口设置对象（仅 d 模式）
   */
  get window(): any {
    if (this._mode === "d") {
      return this._chromiumPage.window;
    }
    return null;
  }

  constructor(
    mode: WebPageMode = "d",
    _timeout?: number | null,
    chromiumOptions?: ChromiumOptions,
    sessionOrOptions?: SessionOptions,
  ) {
    this._mode = mode.toLowerCase() as WebPageMode;
    this._chromiumPage = new ChromiumPage(crmOrDefault(chromiumOptions));
    this._sessionPage = new SessionPage(sessionOrOptions);
  }

  get mode(): WebPageMode {
    return this._mode;
  }

  change_mode(mode?: WebPageMode): void {
    if (!mode) {
      this._mode = this._mode === "d" ? "s" : "d";
      return;
    }
    this._mode = mode;
  }

  get chromium_options(): ChromiumOptions {
    return this._chromiumPage.browser.options;
  }

  get session_options(): SessionOptions {
    return this._sessionPage.options;
  }

  get set(): any {
    if (this._mode === "d") {
      return this._chromiumPage.set;
    }
    return null;
  }

  get actions(): any {
    if (this._mode === "d") {
      return this._chromiumPage.actions;
    }
    return null;
  }

  get listen(): any {
    if (this._mode === "d") {
      return this._chromiumPage.listen;
    }
    return null;
  }

  get download(): any {
    if (this._mode === "d") {
      return this._chromiumPage.download;
    }
    return null;
  }

  async get(url: string, options?: any): Promise<boolean> {
    if (this._mode === "d") {
      return this._chromiumPage.get(url);
    }
    return this._sessionPage.get(url, options);
  }

  async post(url: string, options?: any): Promise<boolean> {
    if (this._mode === "d") {
      return this._sessionPage.post(url, options);
    }
    return this._sessionPage.post(url, options);
  }

  async ele(locator: any, index = 1, timeout?: number): Promise<any> {
    if (this._mode === "d") {
      return this._chromiumPage.ele(locator, index);
    }
    return this._sessionPage.ele(locator, index, timeout);
  }

  async eles(locator: string): Promise<any[]> {
    if (this._mode === "d") {
      return this._chromiumPage.eles(locator);
    } else {
      return this._sessionPage.eles(locator);
    }
  }

  /**
   * 以 SessionElement 形式返回元素
   * d 模式下会获取页面 HTML 后解析，s 模式下直接返回
   */
  async s_ele(locator: string, index: number = 1, timeout?: number): Promise<SessionElement | null> {
    if (this._mode === "d") {
      return this._chromiumPage.s_ele(locator, index, timeout);
    }
    return this._sessionPage.ele(locator, index, timeout) as Promise<SessionElement | null>;
  }

  /**
   * 以 SessionElement 列表形式返回所有匹配元素
   */
  async s_eles(locator: string, timeout?: number): Promise<SessionElement[]> {
    if (this._mode === "d") {
      return this._chromiumPage.s_eles(locator, timeout);
    }
    return this._sessionPage.eles(locator, timeout) as Promise<SessionElement[]>;
  }

  async ele_text(locator: string): Promise<string | null> {
    if (this._mode === "d") {
      return this._chromiumPage.ele_text(locator);
    } else {
      const ele = await this._sessionPage.ele(locator);
      return ele ? await ele.text() : null;
    }
  }

  async ele_html(locator: string): Promise<string | null> {
    if (this._mode === "d") {
      return this._chromiumPage.ele_html(locator);
    } else {
      const ele = await this._sessionPage.ele(locator);
      return ele ? await ele.html() : null;
    }
  }

  async eles_attrs(locator: string, attrs: string[]): Promise<Array<Record<string, string>>> {
    if (this._mode === "d") {
      return this._chromiumPage.eles_attrs(locator, attrs);
    } else {
      const elements = await this._sessionPage.eles(locator);
      const results: Array<Record<string, string>> = [];
      for (const ele of elements) {
        const item: Record<string, string> = {};
        for (const attr of attrs) {
          if (attr === 'text') {
            item[attr] = await ele.text();
          } else if (attr === 'html') {
            item[attr] = await ele.html();
          } else {
            item[attr] = (await ele.attr(attr)) || '';
          }
        }
        results.push(item);
      }
      return results;
    }
  }

  async html(): Promise<string> {
    if (this._mode === "d") {
      return this._chromiumPage.html();
    }
    if (this._sessionPage.html == null) {
      throw new Error("No session html available. Call get() in session mode first.");
    }
    return this._sessionPage.html;
  }

  async title(): Promise<string> {
    if (this._mode === "d") {
      return this._chromiumPage.title();
    }
    if (this._sessionPage.title == null) {
      throw new Error("No session title available. Call get() in session mode first.");
    }
    return this._sessionPage.title;
  }

  async url(): Promise<string> {
    if (this._mode === "d") {
      return this._chromiumPage.url();
    }
    if (this._sessionPage.url == null) {
      throw new Error("No session url available. Call get() in session mode first.");
    }
    return this._sessionPage.url;
  }

  async cookies(): Promise<any[]> {
    if (this._mode === "d") {
      return this._chromiumPage.cookies;
    }
    return this._sessionPage.cookies();
  }

  async new_tab(url?: string): Promise<any> {
    if (this._mode === "d") {
      return this._chromiumPage.new_tab(url);
    }
    throw new Error("WebPage new_tab() is only available in driver mode.");
  }

  async close(): Promise<void> {
    if (this._mode === "d") {
      return this._chromiumPage.close();
    }
  }

  async run_js(script: string): Promise<any> {
    if (this._mode === "d") {
      return this._chromiumPage.run_js(script);
    }
    throw new Error("WebPage run_js() is only available in driver mode.");
  }

  async set_cookies(cookies: Array<{ name: string; value: string; domain?: string; path?: string }>): Promise<void> {
    if (this._mode === "d") {
      return this._chromiumPage.set_cookies(cookies);
    }
    return this._sessionPage.set_cookies(cookies);
  }

  async refresh(): Promise<void> {
    if (this._mode === "d") {
      return this._chromiumPage.refresh();
    }
    throw new Error("WebPage refresh() is only available in driver mode.");
  }

  async back(): Promise<void> {
    if (this._mode === "d") {
      return this._chromiumPage.back();
    }
    throw new Error("WebPage back() is only available in driver mode.");
  }

  async forward(): Promise<void> {
    if (this._mode === "d") {
      return this._chromiumPage.forward();
    }
    throw new Error("WebPage forward() is only available in driver mode.");
  }

  get tabs_count(): number {
    if (this._mode === "d") {
      return this._chromiumPage.tabs_count;
    }
    return 0;
  }

  get tab_ids(): string[] {
    if (this._mode === "d") {
      return this._chromiumPage.tab_ids;
    }
    return [];
  }

  async scroll_to(x: number, y: number): Promise<void> {
    if (this._mode === "d") {
      return this._chromiumPage.scroll_to(x, y);
    }
    throw new Error("WebPage scroll_to() is only available in driver mode.");
  }

  async scroll_to_top(): Promise<void> {
    if (this._mode === "d") {
      return this._chromiumPage.scroll_to_top();
    }
    throw new Error("WebPage scroll_to_top() is only available in driver mode.");
  }

  async scroll_to_bottom(): Promise<void> {
    if (this._mode === "d") {
      return this._chromiumPage.scroll_to_bottom();
    }
    throw new Error("WebPage scroll_to_bottom() is only available in driver mode.");
  }

  async quit(): Promise<void> {
    if (this._mode === "d") {
      return this._chromiumPage.quit();
    }
  }

  async put(url: string, extra?: any): Promise<boolean> {
    if (this._mode === "d") {
      throw new Error("WebPage put() is only available in session mode.");
    }
    return this._sessionPage.put(url, extra);
  }

  async delete(url: string, extra?: any): Promise<boolean> {
    if (this._mode === "d") {
      throw new Error("WebPage delete() is only available in session mode.");
    }
    return this._sessionPage.delete(url, extra);
  }

  async get_tabs(): Promise<any[]> {
    if (this._mode === "d") {
      return this._chromiumPage.get_tabs();
    }
    return [];
  }

  async get_tab(tabId: string): Promise<any> {
    if (this._mode === "d") {
      return this._chromiumPage.get_tab({ idOrNum: tabId });
    }
    return null;
  }

  async activate_tab(tabId: string): Promise<void> {
    if (this._mode === "d") {
      return this._chromiumPage.activate_tab(tabId);
    }
  }

  async close_tab(tabId?: string): Promise<void> {
    if (this._mode === "d") {
      return this._chromiumPage.close_tab(tabId);
    }
  }

  async handle_alert(accept: boolean = true, promptText?: string): Promise<void> {
    if (this._mode === "d") {
      return this._chromiumPage.handle_alert(accept, promptText);
    }
    throw new Error("WebPage handle_alert() is only available in driver mode.");
  }

  async screenshot(path?: string): Promise<Buffer> {
    if (this._mode === "d") {
      return this._chromiumPage.screenshot(path);
    }
    throw new Error("WebPage screenshot() is only available in driver mode.");
  }

  async get_frames(): Promise<any[]> {
    if (this._mode === "d") {
      return this._chromiumPage.get_frames();
    }
    return [];
  }

  async stop_loading(): Promise<void> {
    if (this._mode === "d") {
      return this._chromiumPage.stop_loading();
    }
  }

  async reload(): Promise<void> {
    if (this._mode === "d") {
      return this._chromiumPage.reload();
    }
  }

  async set_geolocation(latitude: number, longitude: number, accuracy?: number): Promise<void> {
    if (this._mode === "d") {
      return this._chromiumPage.set_geolocation(latitude, longitude, accuracy);
    }
    throw new Error("WebPage set_geolocation() is only available in driver mode.");
  }

  async clear_geolocation(): Promise<void> {
    if (this._mode === "d") {
      return this._chromiumPage.clear_geolocation();
    }
  }

  // ========== Cookies 同步方法 ==========

  /**
   * 把浏览器的 cookies 复制到 session 对象
   */
  async cookies_to_session(copyUserAgent: boolean = true): Promise<void> {
    if (this._mode !== "d") {
      throw new Error("cookies_to_session() requires driver mode.");
    }
    
    // 获取浏览器 cookies
    const browserCookies = await this._chromiumPage.cookies;
    
    // 设置到 session
    await this._sessionPage.set_cookies(browserCookies.map((c: any) => ({
      name: c.name,
      value: c.value,
      domain: c.domain,
      path: c.path,
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
    if (this._mode !== "d") {
      throw new Error("cookies_to_browser() requires driver mode.");
    }
    
    const sessionCookies = await this._sessionPage.cookies();
    const currentUrl = await this._chromiumPage.url();
    const urlObj = currentUrl ? new URL(currentUrl) : null;
    
    const cookiesToSet = sessionCookies.map((c: any) => ({
      name: c.name,
      value: c.value,
      domain: c.domain || (urlObj ? urlObj.hostname : ""),
      path: c.path || "/",
    }));
    
    await this._chromiumPage.set_cookies(cookiesToSet);
  }

  /**
   * 获取 user agent
   */
  async user_agent(): Promise<string> {
    if (this._mode === "d") {
      return this._chromiumPage.run_js("navigator.userAgent");
    }
    return this._sessionPage.options.headers["User-Agent"] || "";
  }

  /**
   * 获取 session 对象
   */
  get session(): SessionPage {
    return this._sessionPage;
  }

  /**
   * 获取响应头（仅 s 模式）
   */
  get response_headers(): any {
    return this._sessionPage.response_headers;
  }

  /**
   * 获取响应状态码（仅 s 模式）
   */
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
      const htmlContent = await this._chromiumPage.html();
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

  /**
   * 执行 CDP 命令（仅 d 模式）
   */
  async run_cdp(cmd: string, params: Record<string, any> = {}): Promise<any> {
    if (this._mode === "d") {
      return this._chromiumPage.run_cdp(cmd, params);
    }
    throw new Error("WebPage run_cdp() is only available in driver mode.");
  }

  /**
   * 获取 localStorage（仅 d 模式）
   */
  async local_storage(item?: string): Promise<string | Record<string, string> | null> {
    if (this._mode === "d") {
      return this._chromiumPage.local_storage(item);
    }
    throw new Error("WebPage local_storage() is only available in driver mode.");
  }

  /**
   * 获取 sessionStorage（仅 d 模式）
   */
  async session_storage(item?: string): Promise<string | Record<string, string> | null> {
    if (this._mode === "d") {
      return this._chromiumPage.session_storage(item);
    }
    throw new Error("WebPage session_storage() is only available in driver mode.");
  }

  /**
   * 清除缓存（仅 d 模式）
   */
  async clear_cache(options?: {
    sessionStorage?: boolean;
    localStorage?: boolean;
    cache?: boolean;
    cookies?: boolean;
  }): Promise<void> {
    if (this._mode === "d") {
      return this._chromiumPage.clear_cache(options);
    }
    throw new Error("WebPage clear_cache() is only available in driver mode.");
  }

  /**
   * 添加初始化脚本（仅 d 模式）
   */
  async add_init_js(script: string): Promise<string> {
    if (this._mode === "d") {
      return this._chromiumPage.add_init_js(script);
    }
    throw new Error("WebPage add_init_js() is only available in driver mode.");
  }

  /**
   * 移除初始化脚本（仅 d 模式）
   */
  async remove_init_js(scriptId?: string): Promise<void> {
    if (this._mode === "d") {
      return this._chromiumPage.remove_init_js(scriptId);
    }
    throw new Error("WebPage remove_init_js() is only available in driver mode.");
  }

  /**
   * 保存页面（仅 d 模式）
   */
  async save(options?: {
    path?: string;
    name?: string;
    asPdf?: boolean;
    landscape?: boolean;
    printBackground?: boolean;
    scale?: number;
    paperWidth?: number;
    paperHeight?: number;
    marginTop?: number;
    marginBottom?: number;
    marginLeft?: number;
    marginRight?: number;
    pageRanges?: string;
  }): Promise<Buffer | string> {
    if (this._mode === "d") {
      return this._chromiumPage.save(options);
    }
    throw new Error("WebPage save() is only available in driver mode.");
  }

  /**
   * 获取当前焦点元素（仅 d 模式）
   */
  async active_ele(): Promise<any> {
    if (this._mode === "d") {
      return this._chromiumPage.active_ele();
    }
    throw new Error("WebPage active_ele() is only available in driver mode.");
  }

  /**
   * 删除元素（仅 d 模式）
   */
  async remove_ele(locOrEle: string | any): Promise<void> {
    if (this._mode === "d") {
      return this._chromiumPage.remove_ele(locOrEle);
    }
    throw new Error("WebPage remove_ele() is only available in driver mode.");
  }

  /**
   * 添加元素（仅 d 模式）
   */
  async add_ele(htmlOrInfo: string | { tag: string; attrs?: Record<string, string> }, insertTo?: string | any, before?: string | any): Promise<any> {
    if (this._mode === "d") {
      return this._chromiumPage.add_ele(htmlOrInfo, insertTo, before);
    }
    throw new Error("WebPage add_ele() is only available in driver mode.");
  }

  /**
   * 获取 frame（仅 d 模式）
   */
  async get_frame(locIndEle: string | number | any): Promise<any> {
    if (this._mode === "d") {
      return this._chromiumPage.get_frame(locIndEle);
    }
    throw new Error("WebPage get_frame() is only available in driver mode.");
  }
}

function crmOrDefault(options?: ChromiumOptions): string | ChromiumOptions | undefined {
  return options;
}
