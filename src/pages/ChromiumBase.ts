import { Chromium } from "../chromium/Chromium";
import { Page } from "../core/Page";
import { Element } from "../core/Element";
import { NoneElement } from "../core/NoneElement";
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

export abstract class ChromiumBase {
  protected readonly _browser: Chromium;
  protected _page: Page | null = null;
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
  protected _initScripts: Map<string, string> = new Map();

  protected constructor(browser: Chromium) {
    this._browser = browser;
  }

  abstract init(): Promise<void>;
  abstract tab_id: string;

  get browser(): Chromium {
    return this._browser;
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
      this._downloader = new ChromiumPageDownloader(
        this.tab_id,
        this._browser?.browser?._dl_mgr,
        this._browser?.download_path || '.'
      );
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

  get timeout(): number {
    return this._browser.options.timeouts.base;
  }

  get timeouts(): { base: number; page_load: number; script: number } {
    return {
      base: this._browser.options.timeouts.base,
      page_load: this._browser.options.timeouts.pageLoad,
      script: this._browser.options.timeouts.script,
    };
  }

  get retry_times(): number {
    return this._browser.options.retryTimes ?? 3;
  }

  get retry_interval(): number {
    return this._browser.options.retryInterval ?? 2;
  }

  get load_mode_value(): string {
    return this._browser.options.loadMode ?? "normal";
  }

  async user_agent(): Promise<string> {
    await this.init();
    const { result } = await this._page!.cdpSession.send<{ result: { value: string } }>("Runtime.evaluate", {
      expression: "navigator.userAgent",
      returnByValue: true,
    });
    return result.value;
  }

  async get(url: string, options?: { retry?: number; interval?: number; timeout?: number }): Promise<boolean> {
    await this.init();
    const retry = options?.retry ?? this._browser.options.retryTimes ?? 0;
    const interval = options?.interval ?? this._browser.options.retryInterval ?? 1;
    const timeoutMs = (options?.timeout ?? this._browser.options.timeouts.pageLoad) * 1000;

    for (let i = 0; i <= retry; i++) {
      try {
        await this._page!.get(url, { timeoutMs });
        return true;
      } catch (e) {
        if (i < retry) {
          await new Promise(r => setTimeout(r, interval * 1000));
        }
      }
    }
    return false;
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

  async json(): Promise<any> {
    await this.init();
    return this._page!.json();
  }

  async cookies(allDomains: boolean = false, allInfo: boolean = false): Promise<any[]> {
    await this.init();
    if (allDomains) {
      const { cookies } = await this._page!.cdpSession.send<{ cookies: any[] }>("Storage.getCookies", {
        browserContextId: undefined,
      });
      return cookies;
    }
    const { cookies } = await this._page!.cdpSession.send<{ cookies: any[] }>("Network.getCookies");
    return allInfo ? cookies : cookies.map(c => ({ name: c.name, value: c.value, domain: c.domain, path: c.path }));
  }

  async set_cookies(cookies: Array<{ name: string; value: string; domain?: string; path?: string; url?: string; secure?: boolean; httpOnly?: boolean; sameSite?: string; expires?: number }>): Promise<void> {
    await this.init();
    for (const cookie of cookies) {
      await this._page!.cdpSession.send("Network.setCookie", cookie);
    }
  }

  async ele(locator: string, index: number = 1, timeout?: number): Promise<Element | NoneElement> {
    await this.init();
    if (index !== 1) {
      const all = await this._page!.eles(locator);
      const idx = index > 0 ? index - 1 : all.length + index;
      const result = all[idx] ?? null;
      if (!result) {
        if (NoneElement.raiseWhenNotFound) {
          const { ElementNotFoundError } = await import("../errors");
          throw new ElementNotFoundError(locator);
        }
        return new NoneElement("ele", { locator, index });
      }
      return result;
    }
    return this._page!.ele(locator);
  }

  async eles(locator: string, timeout?: number): Promise<Element[]> {
    await this.init();
    return this._page!.eles(locator);
  }

  async s_ele(locator: string, index: number = 1, timeout?: number): Promise<SessionElement | null> {
    await this.init();
    const htmlContent = await this._page!.html();
    const $ = load(htmlContent);
    const parsed = parseLocator(locator);
    let nodes: any[];
    if (parsed.type === "css") {
      nodes = $(parsed.value).toArray();
    } else {
      nodes = _cheerioXPathFallback($, parsed.value);
    }
    const idx = index > 0 ? index - 1 : nodes.length + index;
    const node = nodes[idx];
    return node ? new SessionElement($, node) : null;
  }

  async s_eles(locator: string, timeout?: number): Promise<SessionElement[]> {
    await this.init();
    const htmlContent = await this._page!.html();
    const $ = load(htmlContent);
    const parsed = parseLocator(locator);
    let nodes: any[];
    if (parsed.type === "css") {
      nodes = $(parsed.value).toArray();
    } else {
      nodes = _cheerioXPathFallback($, parsed.value);
    }
    return nodes.map((node: any) => new SessionElement($, node));
  }

  async run_js(script: string, ...args: any[]): Promise<any> {
    await this.init();
    return this._page!.runJs(script, ...args);
  }

  async run_js_loaded(script: string, ...args: any[]): Promise<any> {
    await this.init();
    await this._page!.cdpSession.send("Runtime.evaluate", {
      expression: "new Promise(r => document.readyState === 'complete' ? r() : window.addEventListener('load', r))",
      awaitPromise: true,
    });
    return this._page!.runJs(script, ...args);
  }

  async run_async_js(script: string, ...args: any[]): Promise<void> {
    await this.init();
    let asExpr = false;
    if (args.length > 0 && typeof args[args.length - 1] === 'object' && args[args.length - 1] !== null
        && 'asExpr' in args[args.length - 1]) {
      asExpr = args.pop().asExpr ?? false;
    }
    if (asExpr) {
      await this._page!.cdpSession.send("Runtime.evaluate", { expression: script, awaitPromise: false });
      return;
    }
    if (args.length > 0) {
      const { result: docResult } = await this._page!.cdpSession.send<{ result: { objectId: string } }>("Runtime.evaluate", {
        expression: "document", returnByValue: false,
      });
      const isFunction = script.trim().startsWith('function') || script.trim().startsWith('(') || script.trim().startsWith('async');
      const funcBody = isFunction ? script : `function(){${script}}`;
      await this._page!.cdpSession.send("Runtime.callFunctionOn", {
        functionDeclaration: funcBody,
        objectId: docResult.objectId,
        arguments: args.map(a => ({ value: a })),
        returnByValue: false,
        awaitPromise: false,
      });
    } else {
      await this._page!.cdpSession.send("Runtime.evaluate", { expression: script, awaitPromise: false });
    }
  }

  async run_cdp(cmd: string, params: Record<string, any> = {}): Promise<any> {
    await this.init();
    return this._page!.cdpSession.send(cmd, params);
  }

  async _run_cdp(cmd: string, params: Record<string, any> = {}): Promise<any> {
    return this.run_cdp(cmd, params);
  }

  async run_cdp_loaded(cmd: string, params: Record<string, any> = {}): Promise<any> {
    await this.init();
    await this._page!.cdpSession.send("Runtime.evaluate", {
      expression: "new Promise(r => document.readyState === 'complete' ? r() : window.addEventListener('load', r))",
      awaitPromise: true,
    });
    return this._page!.cdpSession.send(cmd, params);
  }

  disconnect(): void {
    if (this._page) {
      this._page.cdpSession.close?.();
      this._page = null;
    }
  }

  async reconnect(wait: number = 0): Promise<void> {
    this.disconnect();
    if (wait > 0) {
      await new Promise(r => setTimeout(r, wait * 1000));
    }
    await this.init();
  }

  async handle_alert(accept: boolean | null = true, send?: string, timeout?: number, nextOne: boolean = false): Promise<string | false> {
    await this.init();
    return this._page!.handle_alert(accept, send, timeout, nextOne);
  }

  async screenshot(path?: string): Promise<Buffer> {
    await this.init();
    return this._page!.screenshot(path);
  }

  async get_frames(): Promise<Array<{ id: string; url: string; name: string }>> {
    await this.init();
    return this._page!.get_frames();
  }

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
      await locIndEle.getObjectId();
      const backendId = locIndEle.backendNodeId;
      if (backendId > 0) {
        try {
          const { node } = await this._page!.cdpSession.send<{ node: { frameId?: string } }>("DOM.describeNode", {
            backendNodeId: backendId,
          });
          if (node.frameId) {
            return new ChromiumFrame(this._page!.cdpSession, node.frameId, locIndEle);
          }
        } catch {}
      }
      const src = await locIndEle.attr("src");
      const name = await locIndEle.attr("name");
      const srcdoc = await locIndEle.attr("srcdoc");
      for (const frameInfo of frames) {
        if ((src && frameInfo.url === src) || (name && frameInfo.name === name)) {
          return new ChromiumFrame(this._page!.cdpSession, frameInfo.id, locIndEle);
        }
        if (srcdoc && frameInfo.url === "about:srcdoc") {
          return new ChromiumFrame(this._page!.cdpSession, frameInfo.id, locIndEle);
        }
      }
      return null;
    }

    const frameEle = await this.ele(locIndEle);
    if (frameEle instanceof NoneElement) return null;
    await frameEle.getObjectId();
    const backendId = frameEle.backendNodeId;
    if (backendId > 0) {
      try {
        const { node } = await this._page!.cdpSession.send<{ node: { frameId?: string } }>("DOM.describeNode", {
          backendNodeId: backendId,
        });
        if (node.frameId) {
          return new ChromiumFrame(this._page!.cdpSession, node.frameId, frameEle);
        }
      } catch {}
    }
    const src = await frameEle.attr("src");
    const name = await frameEle.attr("name");
    const srcdoc = await frameEle.attr("srcdoc");
    for (const frameInfo of frames) {
      if ((src && frameInfo.url === src) || (name && frameInfo.name === name)) {
        return new ChromiumFrame(this._page!.cdpSession, frameInfo.id, frameEle);
      }
      if (srcdoc && frameInfo.url === "about:srcdoc") {
        return new ChromiumFrame(this._page!.cdpSession, frameInfo.id, frameEle);
      }
    }
    return null;
  }

  async session_storage(item?: string): Promise<string | Record<string, string> | null> {
    await this.init();
    if (item) {
      const { result } = await this._page!.cdpSession.send<{ result: { value: string | null } }>("Runtime.evaluate", {
        expression: `sessionStorage.getItem(${JSON.stringify(item)})`, returnByValue: true,
      });
      return result.value;
    }
    const { result } = await this._page!.cdpSession.send<{ result: { value: Record<string, string> } }>("Runtime.evaluate", {
      expression: `(() => { const obj = {}; for (let i = 0; i < sessionStorage.length; i++) { const key = sessionStorage.key(i); obj[key] = sessionStorage.getItem(key); } return obj; })()`,
      returnByValue: true,
    });
    return result.value;
  }

  async local_storage(item?: string): Promise<string | Record<string, string> | null> {
    await this.init();
    if (item) {
      const { result } = await this._page!.cdpSession.send<{ result: { value: string | null } }>("Runtime.evaluate", {
        expression: `localStorage.getItem(${JSON.stringify(item)})`, returnByValue: true,
      });
      return result.value;
    }
    const { result } = await this._page!.cdpSession.send<{ result: { value: Record<string, string> } }>("Runtime.evaluate", {
      expression: `(() => { const obj = {}; for (let i = 0; i < localStorage.length; i++) { const key = localStorage.key(i); obj[key] = localStorage.getItem(key); } return obj; })()`,
      returnByValue: true,
    });
    return result.value;
  }

  async clear_cache(options: { sessionStorage?: boolean; localStorage?: boolean; cache?: boolean; cookies?: boolean } = {}): Promise<void> {
    await this.init();
    const { sessionStorage: ss = true, localStorage: ls = true, cache = true, cookies = true } = options;
    if (ss) await this._page!.cdpSession.send("Runtime.evaluate", { expression: "sessionStorage.clear()" });
    if (ls) await this._page!.cdpSession.send("Runtime.evaluate", { expression: "localStorage.clear()" });
    if (cache) await this._page!.cdpSession.send("Network.clearBrowserCache");
    if (cookies) await this._page!.cdpSession.send("Network.clearBrowserCookies");
  }

  async add_init_js(script: string): Promise<string> {
    await this.init();
    const { identifier } = await this._page!.cdpSession.send<{ identifier: string }>("Page.addScriptToEvaluateOnNewDocument", { source: script });
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

  async active_ele(): Promise<Element | null> {
    await this.init();
    await this._page!.cdpSession.send("DOM.getDocument", { depth: -1 });
    const { result } = await this._page!.cdpSession.send<{ result: { objectId?: string } }>("Runtime.evaluate", {
      expression: "document.activeElement",
    });
    if (!result.objectId) return null;
    const { nodeId } = await this._page!.cdpSession.send<{ nodeId: number }>("DOM.requestNode", { objectId: result.objectId });
    return new Element(this._page!.cdpSession, { nodeId });
  }

  async remove_ele(locOrEle: string | Element): Promise<void> {
    await this.init();
    let ele: Element | NoneElement | null;
    if (typeof locOrEle === "string") {
      ele = await this.ele(locOrEle);
    } else {
      ele = locOrEle;
    }
    if (ele && !(ele instanceof NoneElement)) {
      const objectId = await ele.getObjectId();
      await this._page!.cdpSession.send("Runtime.callFunctionOn", {
        objectId, functionDeclaration: "function() { this.remove(); }",
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
    let parentEle: Element | NoneElement | null = null;
    if (insertTo) {
      const found = typeof insertTo === "string" ? await this.ele(insertTo) : insertTo;
      parentEle = found instanceof NoneElement ? null : found;
    }
    if (!parentEle) {
      const body = await this.ele("body");
      parentEle = body instanceof NoneElement ? null : body;
    }
    if (!parentEle || parentEle instanceof NoneElement) return null;
    const parentObjectId = await parentEle.getObjectId();
    const { result } = await this._page!.cdpSession.send<{ result: { objectId?: string } }>("Runtime.callFunctionOn", {
      objectId: parentObjectId,
      functionDeclaration: `function(html, beforeSelector) { const temp = document.createElement('div'); temp.innerHTML = html; const newEle = temp.firstElementChild; if (!newEle) return null; if (beforeSelector) { const beforeEle = this.querySelector(beforeSelector); if (beforeEle) { this.insertBefore(newEle, beforeEle); } else { this.appendChild(newEle); } } else { this.appendChild(newEle); } return newEle; }`,
      arguments: [{ value: html }, { value: before ? (typeof before === "string" ? before : null) : null }],
    });
    if (!result.objectId) return null;
    await this._page!.cdpSession.send("DOM.getDocument", { depth: -1 });
    const { nodeId } = await this._page!.cdpSession.send<{ nodeId: number }>("DOM.requestNode", { objectId: result.objectId });
    return new Element(this._page!.cdpSession, { nodeId });
  }

  async save(options: { path?: string; name?: string; asPdf?: boolean; landscape?: boolean; printBackground?: boolean; scale?: number; paperWidth?: number; paperHeight?: number; marginTop?: number; marginBottom?: number; marginLeft?: number; marginRight?: number; pageRanges?: string } = {}): Promise<Buffer | string> {
    await this.init();
    const { asPdf = false, path, name } = options;
    if (asPdf) {
      const { data } = await this._page!.cdpSession.send<{ data: string }>("Page.printToPDF", {
        landscape: options.landscape, printBackground: options.printBackground ?? true, scale: options.scale ?? 1,
        paperWidth: options.paperWidth ?? 8.5, paperHeight: options.paperHeight ?? 11,
        marginTop: options.marginTop ?? 0.4, marginBottom: options.marginBottom ?? 0.4,
        marginLeft: options.marginLeft ?? 0.4, marginRight: options.marginRight ?? 0.4, pageRanges: options.pageRanges,
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
      const { data } = await this._page!.cdpSession.send<{ data: string }>("Page.captureSnapshot", { format: "mhtml" });
      if (path || name) {
        const fs = await import("fs");
        const filePath = path ? `${path}/${name || "page.mhtml"}` : name || "page.mhtml";
        fs.writeFileSync(filePath, data);
        return filePath;
      }
      return data;
    }
  }

  async browser_version(): Promise<string> {
    await this.init();
    const { product } = await this._page!.cdpSession.send<{ product: string }>("Browser.getVersion");
    return product;
  }

  async ele_text(locator: string): Promise<string | null> {
    const el = await this.ele(locator);
    if (el instanceof NoneElement) return null;
    return el.text();
  }

  async ele_html(locator: string): Promise<string | null> {
    const el = await this.ele(locator);
    if (el instanceof NoneElement) return null;
    return el.html;
  }

  async eles_attrs(locator: string, attrs: string[]): Promise<Array<Record<string, string>>> {
    const elements = await this.eles(locator);
    const results: Array<Record<string, string>> = [];
    for (const el of elements) {
      const record: Record<string, string> = {};
      for (const attr of attrs) {
        const val = await el.attr(attr);
        record[attr] = val || '';
      }
      results.push(record);
    }
    return results;
  }

  async scroll_to(x: number, y: number): Promise<void> {
    await this.init();
    await this._page!.cdpSession.send("Runtime.evaluate", {
      expression: `window.scrollTo(${x}, ${y})`,
    });
  }

  async scroll_to_top(): Promise<void> {
    await this.init();
    await this._page!.cdpSession.send("Runtime.evaluate", { expression: "window.scrollTo(0, 0)" });
  }

  async scroll_to_bottom(): Promise<void> {
    await this.init();
    await this._page!.cdpSession.send("Runtime.evaluate", {
      expression: "window.scrollTo(0, document.documentElement.scrollHeight)",
    });
  }

  async reload(ignoreCache: boolean = false): Promise<void> {
    return this.refresh(ignoreCache);
  }

  async set_geolocation(latitude: number, longitude: number, accuracy?: number): Promise<void> {
    await this.init();
    await this._page!.cdpSession.send("Emulation.setGeolocationOverride", {
      latitude, longitude, accuracy: accuracy ?? 100,
    });
  }

  async clear_geolocation(): Promise<void> {
    await this.init();
    await this._page!.cdpSession.send("Emulation.clearGeolocationOverride");
  }
}

function _cheerioXPathFallback($: any, xpath: string): any[] {
  let m = xpath.match(/\/\/\*\/text\(\)\[contains\(\.,\s*"([^"]+)"\)\]\/\.\./);
  if (m) {
    return $("*").toArray().filter((node: any) => {
      const text = $(node).text();
      return text && text.includes(m![1]);
    });
  }
  m = xpath.match(/\/\/\*\[text\(\)="([^"]+)"\]/);
  if (m) {
    return $("*").toArray().filter((node: any) => {
      const text = $(node).clone().children().remove().end().text().trim();
      return text === m![1];
    });
  }
  m = xpath.match(/\/\/\*\[@(\w+)="([^"]+)"\]/);
  if (m) {
    return $(`[${m[1]}="${m[2]}"]`).toArray();
  }
  m = xpath.match(/\/\/\*\[contains\(@(\w+),"([^"]+)"\)\]/);
  if (m) {
    return $(`[${m[1]}*="${m[2]}"]`).toArray();
  }
  m = xpath.match(/\/\/\*\[name\(\)="(\w+)"\]/);
  if (m) {
    return $(m[1]).toArray();
  }
  if (xpath === "//*") {
    return $("*").toArray();
  }
  return [];
}
