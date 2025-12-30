import { Chromium } from "../chromium/Chromium";
import { Page } from "../core/Page";
import { Element } from "../core/Element";
import { SessionElement } from "../core/SessionElement";
import { ChromiumPageSetter } from "./ChromiumPageSetter";
import { ChromiumPageWaiter } from "./ChromiumPageWaiter";
import { ChromiumPageActions } from "./ChromiumPageActions";
import { ChromiumPageListener } from "./ChromiumPageListener";
import { ChromiumPageDownloader } from "./ChromiumPageDownloader";
import { ChromiumFrame } from "./ChromiumFrame";
import { PageScroller } from "../units/PageScroller";
import { PageStates } from "../units/PageStates";
import { PageRect } from "../units/PageRect";
import { Console } from "../units/Console";
import { Screencast } from "../units/Screencast";
import { CookiesSetter } from "../units/CookiesSetter";
import { WindowSetter } from "../units/WindowSetter";
import { load } from "cheerio";
import { parseLocator } from "../core/locator";

/**
 * ChromiumTab - 浏览器标签页类
 * 对应 DrissionPage.ChromiumTab
 */
export class ChromiumTab {
  protected readonly _browser: Chromium;
  protected readonly _tabId: string;
  protected _page: Page | null = null;
  
  // 操作对象缓存
  protected _setter: ChromiumPageSetter | null = null;
  protected _waiter: ChromiumPageWaiter | null = null;
  protected _actions: ChromiumPageActions | null = null;
  protected _listener: ChromiumPageListener | null = null;
  protected _downloader: ChromiumPageDownloader | null = null;
  protected _scroller: PageScroller | null = null;
  protected _states: PageStates | null = null;
  protected _rect: PageRect | null = null;
  protected _console: Console | null = null;
  protected _screencast: Screencast | null = null;
  protected _cookiesSetter: CookiesSetter | null = null;
  protected _windowSetter: WindowSetter | null = null;

  constructor(browser: Chromium, tabId: string) {
    this._browser = browser;
    this._tabId = tabId;
  }

  // ========== 属性访问器 ==========

  get browser(): Chromium {
    return this._browser;
  }

  get tab_id(): string {
    return this._tabId;
  }

  get set(): ChromiumPageSetter {
    if (!this._setter) {
      this._setter = new ChromiumPageSetter(this as any);
    }
    return this._setter;
  }

  get wait(): ChromiumPageWaiter {
    if (!this._waiter) {
      this._waiter = new ChromiumPageWaiter(this as any);
    }
    return this._waiter;
  }

  get actions(): ChromiumPageActions {
    if (!this._actions) {
      this._actions = new ChromiumPageActions(this as any);
    }
    return this._actions;
  }

  get listen(): ChromiumPageListener {
    if (!this._listener) {
      this._listener = new ChromiumPageListener(this as any);
    }
    return this._listener;
  }

  get download(): ChromiumPageDownloader {
    if (!this._downloader) {
      this._downloader = new ChromiumPageDownloader(this as any);
    }
    return this._downloader;
  }

  get scroll(): PageScroller {
    if (!this._scroller && this._page) {
      this._scroller = new PageScroller({ cdpSession: this._page.cdpSession });
    }
    return this._scroller!;
  }

  get states(): PageStates {
    if (!this._states && this._page) {
      this._states = new PageStates({ cdpSession: this._page.cdpSession });
    }
    return this._states!;
  }

  get rect(): PageRect {
    if (!this._rect && this._page) {
      this._rect = new PageRect({ cdpSession: this._page.cdpSession });
    }
    return this._rect!;
  }

  get console(): Console {
    if (!this._console && this._page) {
      this._console = new Console({ cdpSession: this._page.cdpSession });
    }
    return this._console!;
  }

  get screencast(): Screencast {
    if (!this._screencast && this._page) {
      this._screencast = new Screencast({ cdpSession: this._page.cdpSession });
    }
    return this._screencast!;
  }

  get cookies_setter(): CookiesSetter {
    if (!this._cookiesSetter && this._page) {
      this._cookiesSetter = new CookiesSetter({ cdpSession: this._page.cdpSession });
    }
    return this._cookiesSetter!;
  }

  get window(): WindowSetter {
    if (!this._windowSetter && this._page) {
      this._windowSetter = new WindowSetter({ cdpSession: this._page.cdpSession });
    }
    return this._windowSetter!;
  }

  // ========== 初始化 ==========

  async init(): Promise<void> {
    if (!this._page) {
      await this._browser.connect();
      this._page = await this._browser.get_page_by_id(this._tabId);
    }
  }

  // ========== 页面导航 ==========

  async get(url: string): Promise<boolean> {
    await this.init();
    const timeoutMs = this._browser.options.timeouts.pageLoad * 1000;
    await this._page!.get(url, { timeoutMs });
    return true;
  }

  async refresh(ignoreCache: boolean = false): Promise<void> {
    await this.init();
    if (ignoreCache) {
      await this._page!.cdpSession.send("Page.reload", { ignoreCache: true });
    } else {
      await this._page!.refresh();
    }
  }

  async back(steps: number = 1): Promise<void> {
    await this.init();
    for (let i = 0; i < steps; i++) {
      await this._page!.back();
    }
  }

  async forward(steps: number = 1): Promise<void> {
    await this.init();
    for (let i = 0; i < steps; i++) {
      await this._page!.forward();
    }
  }

  async stop_loading(): Promise<void> {
    await this.init();
    await this._page!.stop_loading();
  }

  // ========== 页面信息 ==========

  async html(): Promise<string> {
    await this.init();
    return this._page!.html();
  }

  async title(): Promise<string> {
    await this.init();
    return this._page!.title();
  }

  async url(): Promise<string> {
    await this.init();
    return this._page!.url();
  }

  async cookies(allDomains: boolean = false, allInfo: boolean = false): Promise<any[]> {
    await this.init();
    const cookies = await this._page!.cookies();
    if (!allInfo) {
      return cookies.map((c: any) => ({
        name: c.name,
        value: c.value,
        domain: c.domain,
      }));
    }
    return cookies;
  }

  // ========== 元素查找 ==========

  async ele(locator: string, index: number = 1, timeout?: number): Promise<Element | null> {
    await this.init();
    if (index !== 1) {
      const all = await this._page!.eles(locator);
      const idx = index > 0 ? index - 1 : all.length + index;
      return all[idx] ?? null;
    }
    return this._page!.ele(locator);
  }

  async eles(locator: string, timeout?: number): Promise<Element[]> {
    await this.init();
    return this._page!.eles(locator);
  }

  /**
   * 以 SessionElement 形式返回元素（高效处理复杂页面）
   */
  async s_ele(locator: string, index: number = 1, timeout?: number): Promise<SessionElement | null> {
    await this.init();
    const htmlContent = await this._page!.html();
    const $ = load(htmlContent);
    
    const parsed = parseLocator(locator);
    let nodes: any[];
    
    if (parsed.type === "css") {
      nodes = $(parsed.value).toArray();
    } else {
      // 简单文本匹配
      nodes = $("*").toArray().filter((node: any) => {
        const text = $(node).text();
        return text && text.includes(locator);
      });
    }
    
    const idx = index > 0 ? index - 1 : nodes.length + index;
    const node = nodes[idx];
    return node ? new SessionElement($, node) : null;
  }

  /**
   * 以 SessionElement 列表形式返回所有匹配元素
   */
  async s_eles(locator: string, timeout?: number): Promise<SessionElement[]> {
    await this.init();
    const htmlContent = await this._page!.html();
    const $ = load(htmlContent);
    
    const parsed = parseLocator(locator);
    let nodes: any[];
    
    if (parsed.type === "css") {
      nodes = $(parsed.value).toArray();
    } else {
      nodes = $("*").toArray().filter((node: any) => {
        const text = $(node).text();
        return text && text.includes(locator);
      });
    }
    
    return nodes.map((node: any) => new SessionElement($, node));
  }

  // ========== JavaScript 执行 ==========

  async run_js(script: string, ...args: any[]): Promise<any> {
    await this.init();
    return this._page!.runJs(script);
  }

  async run_js_loaded(script: string, ...args: any[]): Promise<any> {
    await this.init();
    await this._page!.cdpSession.send("Runtime.evaluate", {
      expression: "new Promise(r => document.readyState === 'complete' ? r() : window.addEventListener('load', r))",
      awaitPromise: true,
    });
    return this._page!.runJs(script);
  }

  async run_async_js(script: string, ...args: any[]): Promise<void> {
    await this.init();
    await this._page!.cdpSession.send("Runtime.evaluate", {
      expression: script,
      awaitPromise: false,
    });
  }

  async run_cdp(cmd: string, params: Record<string, any> = {}): Promise<any> {
    await this.init();
    return this._page!.cdpSession.send(cmd, params);
  }

  // ========== 标签页操作 ==========

  async close(others: boolean = false): Promise<void> {
    if (others) {
      const tabs = await this._browser.get_tabs();
      for (const tab of tabs) {
        if (tab.id !== this._tabId) {
          await this._browser.close_tab(tab.id);
        }
      }
    } else {
      await this._browser.close_tab(this._tabId);
    }
  }

  async activate(): Promise<void> {
    await this._browser.activate_tab(this._tabId);
  }

  // ========== Frame 操作 ==========

  async get_frame(locIndEle: string | number | Element): Promise<ChromiumFrame | null> {
    await this.init();
    const frames = await this._page!.get_frames();
    
    if (typeof locIndEle === "number") {
      const idx = locIndEle > 0 ? locIndEle - 1 : frames.length + locIndEle;
      const frameInfo = frames[idx];
      if (!frameInfo) return null;
      
      const iframes = await this.eles("iframe, frame");
      const frameEle = iframes[idx];
      if (!frameEle) return null;
      
      return new ChromiumFrame(this._page!.cdpSession, frameInfo.id, frameEle);
    }
    
    if (locIndEle instanceof Element) {
      const src = await locIndEle.attr("src");
      const name = await locIndEle.attr("name");
      
      for (const frameInfo of frames) {
        if ((src && frameInfo.url === src) || (name && frameInfo.name === name)) {
          return new ChromiumFrame(this._page!.cdpSession, frameInfo.id, locIndEle);
        }
      }
      return null;
    }
    
    const frameEle = await this.ele(locIndEle);
    if (!frameEle) return null;
    
    const src = await frameEle.attr("src");
    const name = await frameEle.attr("name");
    
    for (const frameInfo of frames) {
      if ((src && frameInfo.url === src) || (name && frameInfo.name === name)) {
        return new ChromiumFrame(this._page!.cdpSession, frameInfo.id, frameEle);
      }
    }
    
    return null;
  }

  async get_frames(locator?: string): Promise<Element[]> {
    await this.init();
    if (locator) {
      return this.eles(locator);
    }
    return this.eles("iframe, frame");
  }

  // ========== 截图和保存 ==========

  async screenshot(path?: string): Promise<Buffer> {
    await this.init();
    return this._page!.screenshot(path);
  }

  async get_screenshot(options: {
    path?: string;
    name?: string;
    asBytes?: boolean;
    asBase64?: boolean;
    fullPage?: boolean;
  } = {}): Promise<string | Buffer> {
    await this.init();
    
    const { path, name, asBytes, asBase64, fullPage } = options;
    
    let clip: any = undefined;
    if (fullPage) {
      const { result } = await this._page!.cdpSession.send<{ result: { value: any } }>("Runtime.evaluate", {
        expression: `({ width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight })`,
        returnByValue: true,
      });
      clip = { x: 0, y: 0, width: result.value.width, height: result.value.height, scale: 1 };
    }
    
    const { data } = await this._page!.cdpSession.send<{ data: string }>("Page.captureScreenshot", {
      format: "png",
      clip,
      captureBeyondViewport: fullPage,
    });
    
    const buffer = Buffer.from(data, "base64");
    
    if (asBase64) {
      return data;
    }
    if (asBytes) {
      return buffer;
    }
    if (path || name) {
      const fs = await import("fs");
      const filePath = path ? `${path}/${name || "screenshot.png"}` : name || "screenshot.png";
      fs.writeFileSync(filePath, buffer);
      return filePath;
    }
    return buffer;
  }

  async save(options: {
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
  } = {}): Promise<Buffer | string> {
    await this.init();
    
    const { asPdf = false, path, name } = options;
    
    if (asPdf) {
      const { data } = await this._page!.cdpSession.send<{ data: string }>("Page.printToPDF", {
        landscape: options.landscape,
        printBackground: options.printBackground ?? true,
        scale: options.scale ?? 1,
        paperWidth: options.paperWidth ?? 8.5,
        paperHeight: options.paperHeight ?? 11,
        marginTop: options.marginTop ?? 0.4,
        marginBottom: options.marginBottom ?? 0.4,
        marginLeft: options.marginLeft ?? 0.4,
        marginRight: options.marginRight ?? 0.4,
        pageRanges: options.pageRanges,
      });
      
      const buffer = Buffer.from(data, "base64");
      
      if (path || name) {
        const fs = await import("fs");
        const filePath = path ? `${path}/${name || "page.pdf"}` : name || "page.pdf";
        fs.writeFileSync(filePath, buffer);
        return filePath;
      }
      
      return buffer;
    } else {
      const { data } = await this._page!.cdpSession.send<{ data: string }>("Page.captureSnapshot", {
        format: "mhtml",
      });
      
      if (path || name) {
        const fs = await import("fs");
        const filePath = path ? `${path}/${name || "page.mhtml"}` : name || "page.mhtml";
        fs.writeFileSync(filePath, data);
        return filePath;
      }
      
      return data;
    }
  }

  // ========== Storage ==========

  async session_storage(item?: string): Promise<string | Record<string, string> | null> {
    await this.init();
    if (item) {
      const { result } = await this._page!.cdpSession.send<{ result: { value: string | null } }>("Runtime.evaluate", {
        expression: `sessionStorage.getItem(${JSON.stringify(item)})`,
        returnByValue: true,
      });
      return result.value;
    }
    const { result } = await this._page!.cdpSession.send<{ result: { value: Record<string, string> } }>("Runtime.evaluate", {
      expression: `(() => {
        const obj = {};
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          obj[key] = sessionStorage.getItem(key);
        }
        return obj;
      })()`,
      returnByValue: true,
    });
    return result.value;
  }

  async local_storage(item?: string): Promise<string | Record<string, string> | null> {
    await this.init();
    if (item) {
      const { result } = await this._page!.cdpSession.send<{ result: { value: string | null } }>("Runtime.evaluate", {
        expression: `localStorage.getItem(${JSON.stringify(item)})`,
        returnByValue: true,
      });
      return result.value;
    }
    const { result } = await this._page!.cdpSession.send<{ result: { value: Record<string, string> } }>("Runtime.evaluate", {
      expression: `(() => {
        const obj = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          obj[key] = localStorage.getItem(key);
        }
        return obj;
      })()`,
      returnByValue: true,
    });
    return result.value;
  }

  async clear_cache(options: {
    sessionStorage?: boolean;
    localStorage?: boolean;
    cache?: boolean;
    cookies?: boolean;
  } = {}): Promise<void> {
    await this.init();
    const { sessionStorage = true, localStorage = true, cache = true, cookies = true } = options;

    if (sessionStorage) {
      await this._page!.cdpSession.send("Runtime.evaluate", { expression: "sessionStorage.clear()" });
    }
    if (localStorage) {
      await this._page!.cdpSession.send("Runtime.evaluate", { expression: "localStorage.clear()" });
    }
    if (cache) {
      await this._page!.cdpSession.send("Network.clearBrowserCache");
    }
    if (cookies) {
      await this._page!.cdpSession.send("Network.clearBrowserCookies");
    }
  }

  // ========== Alert 处理 ==========

  async handle_alert(accept: boolean = true, send?: string, timeout?: number): Promise<string | false> {
    await this.init();
    try {
      await this._page!.handle_alert(accept, send);
      return "";
    } catch {
      return false;
    }
  }

  // ========== 元素操作 ==========

  async active_ele(): Promise<Element | null> {
    await this.init();
    const { result } = await this._page!.cdpSession.send<{ result: { objectId?: string } }>("Runtime.evaluate", {
      expression: "document.activeElement",
    });
    
    if (!result.objectId) return null;
    
    const { nodeId } = await this._page!.cdpSession.send<{ nodeId: number }>("DOM.requestNode", {
      objectId: result.objectId,
    });
    
    return new Element(this._page!.cdpSession, { nodeId });
  }

  async remove_ele(locOrEle: string | Element): Promise<void> {
    await this.init();
    
    let ele: Element | null;
    if (typeof locOrEle === "string") {
      ele = await this.ele(locOrEle);
    } else {
      ele = locOrEle;
    }
    
    if (ele) {
      const objectId = await ele.getObjectId();
      await this._page!.cdpSession.send("Runtime.callFunctionOn", {
        objectId,
        functionDeclaration: "function() { this.remove(); }",
      });
    }
  }

  async add_ele(htmlOrInfo: string | { tag: string; attrs?: Record<string, string> }, insertTo?: string | Element, before?: string | Element): Promise<Element | null> {
    await this.init();
    
    let html: string;
    if (typeof htmlOrInfo === "string") {
      html = htmlOrInfo;
    } else {
      const attrs = htmlOrInfo.attrs ? Object.entries(htmlOrInfo.attrs).map(([k, v]) => `${k}="${v}"`).join(" ") : "";
      html = `<${htmlOrInfo.tag} ${attrs}></${htmlOrInfo.tag}>`;
    }
    
    let parentEle: Element | null = null;
    if (insertTo) {
      parentEle = typeof insertTo === "string" ? await this.ele(insertTo) : insertTo;
    }
    
    if (!parentEle) {
      parentEle = await this.ele("body");
    }
    
    if (!parentEle) return null;
    
    const parentObjectId = await parentEle.getObjectId();
    
    const { result } = await this._page!.cdpSession.send<{ result: { objectId?: string } }>("Runtime.callFunctionOn", {
      objectId: parentObjectId,
      functionDeclaration: `function(html, beforeSelector) {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        const newEle = temp.firstElementChild;
        if (!newEle) return null;
        
        if (beforeSelector) {
          const beforeEle = this.querySelector(beforeSelector);
          if (beforeEle) {
            this.insertBefore(newEle, beforeEle);
          } else {
            this.appendChild(newEle);
          }
        } else {
          this.appendChild(newEle);
        }
        return newEle;
      }`,
      arguments: [
        { value: html },
        { value: before ? (typeof before === "string" ? before : null) : null },
      ],
    });
    
    if (!result.objectId) return null;
    
    const { nodeId } = await this._page!.cdpSession.send<{ nodeId: number }>("DOM.requestNode", {
      objectId: result.objectId,
    });
    
    return new Element(this._page!.cdpSession, { nodeId });
  }

  // ========== 初始化脚本 ==========

  private _initScripts: Map<string, string> = new Map();

  async add_init_js(script: string): Promise<string> {
    await this.init();
    const { identifier } = await this._page!.cdpSession.send<{ identifier: string }>("Page.addScriptToEvaluateOnNewDocument", {
      source: script,
    });
    this._initScripts.set(identifier, script);
    return identifier;
  }

  async remove_init_js(scriptId?: string): Promise<void> {
    await this.init();
    if (scriptId) {
      await this._page!.cdpSession.send("Page.removeScriptToEvaluateOnNewDocument", { identifier: scriptId });
      this._initScripts.delete(scriptId);
    } else {
      for (const id of this._initScripts.keys()) {
        await this._page!.cdpSession.send("Page.removeScriptToEvaluateOnNewDocument", { identifier: id });
      }
      this._initScripts.clear();
    }
  }

  // ========== Cookies ==========

  async set_cookies(cookies: Array<{ name: string; value: string; domain?: string; path?: string }>): Promise<void> {
    await this.init();
    return this._page!.set_cookies(cookies);
  }
}
