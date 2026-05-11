import { Chromium } from "../chromium/Chromium";
import { Page } from "../core/Page";
import { Element } from "../core/Element";
import { NoneElement } from "../core/NoneElement";
import { SessionElement } from "../core/SessionElement";
import { Timeout } from "../units/Timeout";
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
import { get_mhtml, get_pdf } from "../core/web";
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
  protected _timeouts: Timeout | null = null;

  protected constructor(browser: Chromium) {
    this._browser = browser;
  }

  abstract init(): Promise<void>;
  abstract tab_id: string;

  get browser(): Chromium {
    return this._browser;
  }

  get driver() {
    return this._page?.cdpSession ?? null;
  }

  get _target_id(): string {
    return (this._page as any)?._target_id ?? this.tab_id ?? '';
  }

  get _browser_url(): string {
    return this._browser.options.address;
  }

  get set(): ChromiumPageSetter {
    if (!this._setter) {
      this._setter = new ChromiumPageSetter(this as any);
    }
    return this._setter;
  }

  get wait(): ChromiumPageWaiter & ((second: number, scope?: number) => Promise<ChromiumBase>) {
    if (!this._waiter) {
      this._waiter = new ChromiumPageWaiter(this as any);
    }
    const waiter = this._waiter;
    const callable = async (second: number, scope?: number) => {
      return waiter.wait(second, scope);
    };
    Object.setPrototypeOf(callable, Object.getPrototypeOf(waiter));
    Object.assign(callable, waiter);
    for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(waiter))) {
      if (key !== 'constructor' && typeof (waiter as any)[key] === 'function') {
        (callable as any)[key] = (waiter as any)[key].bind(waiter);
      }
    }
    return callable as any;
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

  get timeouts(): Timeout {
    if (!this._timeouts) {
      this._timeouts = new Timeout();
    }
    return this._timeouts;
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

  get load_mode(): 'none' | 'normal' | 'eager' {
    return (this._browser.options.loadMode ?? "normal") as 'none' | 'normal' | 'eager';
  }

  async user_agent(): Promise<string> {
    await this.init();
    const { result } = await this._page!.cdpSession.send<{ result: { value: string } }>("Runtime.evaluate", {
      expression: "navigator.userAgent",
      returnByValue: true,
    });
    return result.value;
  }

  async get(url: string, options?: { showErrmsg?: boolean; retry?: number; interval?: number; timeout?: number }): Promise<boolean> {
    await this.init();
    const retry = options?.retry ?? this._browser.options.retryTimes ?? 0;
    const interval = options?.interval ?? this._browser.options.retryInterval ?? 1;
    const timeoutMs = (options?.timeout ?? this._browser.options.timeouts.pageLoad) * 1000;

    for (let i = 0; i <= retry; i++) {
      try {
        await this._page!.get(url, { timeoutMs });
        return true;
      } catch (e) {
        if (options?.showErrmsg && i >= retry) {
          console.error(`Failed to navigate to ${url}:`, e);
        }
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
    await this._forward_or_back(-steps);
  }

  async forward(steps: number = 1): Promise<void> {
    await this.init();
    await this._forward_or_back(steps);
  }

  private async _forward_or_back(steps: number): Promise<void> {
    if (!this._page) return;
    const direction = steps > 0 ? 1 : -1;
    const absSteps = Math.abs(steps);
    const currentUrl = await this.url();

    for (let i = 0; i < absSteps; i++) {
      if (direction > 0) {
        await this._page!.forward();
      } else {
        await this._page!.back();
      }
      await new Promise(r => setTimeout(r, 50));
      const newUrl = await this.url();
      if (newUrl !== currentUrl) return;
    }
  }

  async js_ready_state(): Promise<string> {
    await this.init();
    try {
      const { result } = await this._page!.cdpSession.send<{ result: { value: string } }>("Runtime.evaluate", {
        expression: "document.readyState",
        returnByValue: true,
      });
      return result.value;
    } catch {
      return 'unknown';
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

  async json(): Promise<Record<string, any> | null> {
    await this.init();
    const text = await this._page!.html();
    try {
      const match = text.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
      const content = match ? match[1] : text.replace(/<[^>]+>/g, '');
      return JSON.parse(content);
    } catch {
      return null;
    }
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

  async call(locator: string, index: number = 1, timeout?: number): Promise<Element | NoneElement> {
    return this.ele(locator, index, timeout);
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
    await this._wait_loaded();
    return this._page!.cdpSession.send(cmd, params);
  }

  async _run_cdp_loaded(cmd: string, params: Record<string, any> = {}): Promise<any> {
    return this.run_cdp_loaded(cmd, params);
  }

  async _run_js(script: string, ...args: any[]): Promise<any> {
    return this.run_js(script, ...args);
  }

  async _run_js_loaded(script: string, ...args: any[]): Promise<any> {
    return this.run_js_loaded(script, ...args);
  }

  async _wait_loaded(timeout?: number): Promise<boolean> {
    await this.init();
    const timeoutMs = (timeout ?? this._browser.options.timeouts.pageLoad) * 1000;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      try {
        const { result } = await this._page!.cdpSession.send<{ result: { value: string } }>("Runtime.evaluate", {
          expression: "document.readyState",
          returnByValue: true,
        });
        if (result.value === 'complete' || result.value === 'interactive') {
          return true;
        }
      } catch {}
      await new Promise(r => setTimeout(r, 50));
    }

    await this.stop_loading();
    return false;
  }

  async _handle_alert(accept: boolean | null = true, send?: string, timeout?: number, nextOne: boolean = false): Promise<string | false> {
    return this.handle_alert(accept, send, timeout, nextOne);
  }

  _on_alert_open(_event: any = {}): void {}

  _on_alert_close(_event: any = {}): void {}

  async _find_elements(
    locator: string | Element,
    timeout: number,
    index?: number,
    relative: boolean = false,
    raiseErr?: boolean
  ): Promise<Element | NoneElement | Element[]> {
    if (locator instanceof Element) return locator;
    if (index === undefined || index === null) {
      return this.eles(locator, timeout);
    }
    if (index === 1) {
      const el = await this.ele(locator, 1, timeout);
      if (el instanceof NoneElement) {
        if (raiseErr ?? NoneElement.raiseWhenNotFound) {
          const { ElementNotFoundError } = await import("../errors");
          throw new ElementNotFoundError(locator);
        }
      }
      return el;
    }
    const all = await this.eles(locator, timeout);
    const idx = index > 0 ? index - 1 : all.length + index;
    const result = all[idx] ?? null;
    if (!result) {
      if (raiseErr ?? NoneElement.raiseWhenNotFound) {
        const { ElementNotFoundError } = await import("../errors");
        throw new ElementNotFoundError(locator);
      }
      return new NoneElement("ele", { locator, index });
    }
    return result;
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

  async get_screenshot(
    path?: string,
    name?: string,
    asBytes?: boolean | 'jpg' | 'jpeg' | 'png' | 'webp',
    asBase64?: boolean | 'jpg' | 'jpeg' | 'png' | 'webp',
    fullPage: boolean = false,
    leftTop?: [number, number],
    rightBottom?: [number, number]
  ): Promise<string | Buffer> {
    await this.init();
    return this._get_screenshot(path, name, asBytes, asBase64, fullPage, leftTop, rightBottom);
  }

  async _get_screenshot(
    path?: string,
    name?: string,
    asBytes?: boolean | 'jpg' | 'jpeg' | 'png' | 'webp',
    asBase64?: boolean | 'jpg' | 'jpeg' | 'png' | 'webp',
    fullPage: boolean = false,
    leftTop?: [number, number],
    rightBottom?: [number, number],
    ele?: Element
  ): Promise<string | Buffer> {
    await this.init();

    let picType: string = 'png';
    if (asBytes) {
      picType = asBytes === true ? 'png' : (asBytes === 'jpg' ? 'jpeg' : asBytes);
    } else if (asBase64) {
      picType = asBase64 === true ? 'png' : (asBase64 === 'jpg' ? 'jpeg' : asBase64);
    }

    const clipParams: Record<string, any> = {};
    if (leftTop || rightBottom) {
      const layoutMetrics = await this._page!.cdpSession.send<{
        cssVisualViewport: { x: number; y: number; width: number; height: number; scaleX: number; scaleY: number }
      }>("Page.getLayoutMetrics");
      const viewport = layoutMetrics.cssVisualViewport;
      const scale = viewport.scaleX || 1;

      clipParams.clip = {
        x: (leftTop ? leftTop[0] : 0) / scale,
        y: (leftTop ? leftTop[1] : 0) / scale,
        width: ((rightBottom ? rightBottom[0] : viewport.width) - (leftTop ? leftTop[0] : 0)) / scale,
        height: ((rightBottom ? rightBottom[1] : viewport.height) - (leftTop ? leftTop[1] : 0)) / scale,
        scale: 1,
      };
    } else if (ele) {
      await (ele as any)._ensureBackendNodeId();
      const backendNodeId = (ele as any).backendNodeId;
      if (backendNodeId > 0) {
        const { model } = await this._page!.cdpSession.send<{
          model: { content: number[]; width: number; height: number }
        }>("DOM.getBoxModel", { backendNodeId });
        clipParams.clip = {
          x: model.content[0],
          y: model.content[1],
          width: model.content[4] - model.content[0],
          height: model.content[5] - model.content[1],
          scale: 1,
        };
      }
    }

    const screenshotParams: Record<string, any> = {
      format: picType === 'jpeg' ? 'jpeg' : 'png',
      quality: picType === 'jpeg' ? 80 : undefined,
    };

    if (fullPage) {
      screenshotParams.captureBeyondViewport = true;
    }

    if (clipParams.clip) {
      screenshotParams.clip = clipParams.clip;
    }

    const { data } = await this._page!.cdpSession.send<{ data: string }>("Page.captureScreenshot", screenshotParams);
    const buffer = Buffer.from(data, "base64");

    if (asBase64) return data;
    if (asBytes) return buffer;

    if (path) {
      const fs = await import("fs");
      const pathModule = await import("path");
      const ext = `.${picType === 'jpeg' ? 'jpg' : picType}`;
      const fileName = name || `screenshot${ext}`;
      const fullPath = pathModule.join(path, fileName);
      fs.writeFileSync(fullPath, buffer);
      return fullPath;
    }
    return buffer;
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

    if (ss && ls && cache && cookies) {
      try {
        await this._page!.cdpSession.send("Storage.clearDataForOrigin", { origin: "*", storageTypes: "all" });
        return;
      } catch {}
    }

    if (ss || ls) {
      try {
        await this._page!.cdpSession.send("DOMStorage.enable");
        const { storageKey } = await this._page!.cdpSession.send<{ storageKey: string }>("Storage.getStorageKeyForFrame", {
          frameId: (this._page as any)._target_id || '',
        });
        if (ss) {
          await this._page!.cdpSession.send("DOMStorage.clear", {
            storageId: { storageKey, isLocalStorage: false },
          });
        }
        if (ls) {
          await this._page!.cdpSession.send("DOMStorage.clear", {
            storageId: { storageKey, isLocalStorage: true },
          });
        }
        await this._page!.cdpSession.send("DOMStorage.disable");
      } catch {}
    }

    if (cache) {
      try {
        await this._page!.cdpSession.send("Network.clearBrowserCache");
      } catch {}
    }

    if (cookies) {
      try {
        await this._page!.cdpSession.send("Network.clearBrowserCookies");
      } catch {}
    }
  }

  async find(
    locators: string[],
    options: { anyOne?: boolean; firstEle?: boolean; timeout?: number } = {}
  ): Promise<Map<string, Element | Element[] | NoneElement | null>> {
    await this.init();
    const { anyOne = true, firstEle = true, timeout } = options;
    const actualTimeout = timeout ?? this.timeout;
    const result = new Map<string, Element | Element[] | NoneElement | null>();
    for (const loc of locators) {
      result.set(loc, null);
    }

    if (actualTimeout === 0) {
      for (const loc of locators) {
        try {
          const ele = firstEle
            ? await this.ele(loc)
            : await this.eles(loc);
          result.set(loc, ele);
          if (ele && anyOne) return result;
        } catch {
          result.set(loc, null);
        }
      }
      return result;
    }

    const endTime = Date.now() + actualTimeout * 1000;
    while (Date.now() <= endTime) {
      for (const loc of locators) {
        if (result.get(loc)) continue;
        try {
          const ele = firstEle
            ? await this.ele(loc)
            : await this.eles(loc);
          result.set(loc, ele);
          if (ele && anyOne) return result;
        } catch {
          result.set(loc, null);
        }
      }
      let allFound = true;
      for (const loc of locators) {
        if (!result.get(loc)) { allFound = false; break; }
      }
      if (allFound) return result;
      await new Promise(r => setTimeout(r, 50));
    }

    return result;
  }

  async add_init_js(script: string): Promise<string> {
    await this.init();
    const { identifier } = await this._page!.cdpSession.send<{ identifier: string }>("Page.addScriptToEvaluateOnNewDocument", { source: script });
    this._initScripts.set(identifier, script);
    return identifier;
  }

  async save_page(options: { path?: string; name?: string; asPdf?: boolean; pdfOptions?: Record<string, any> } = {}): Promise<string | Buffer> {
    await this.init();
    const { path, name, asPdf = false, pdfOptions } = options;
    if (asPdf) {
      return get_pdf(this._page!, path, name, pdfOptions);
    }
    return get_mhtml(this._page!, path, name);
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

  private _upload_list: string[] | null = null;

  get upload_list(): string[] | null {
    return this._upload_list;
  }

  set upload_list(files: string[] | null) {
    this._upload_list = files;
    if (files && this._page) {
      this._page.cdpSession.on('Page.fileChooserOpened', async (params: any) => {
        if (this._upload_list && params.backendNodeId) {
          const fileList = params.mode === 'selectMultiple' ? this._upload_list : this._upload_list.slice(0, 1);
          try {
            await this._page!.cdpSession.send('DOM.setFileInputFiles', {
              files: fileList,
              backendNodeId: params.backendNodeId,
            });
          } catch {}
          this._upload_list = null;
          try {
            await this._page!.cdpSession.send('Page.setInterceptFileChooserDialog', { enabled: false });
          } catch {}
        }
      });
      try {
        this._page.cdpSession.send('Page.setInterceptFileChooserDialog', { enabled: true }).catch(() => {});
      } catch {}
    }
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
        const pathModule = await import("path");
        let fullPath: string;
        if (path && pathModule.extname(path)) {
          fullPath = path;
        } else {
          fullPath = path ? pathModule.join(path, name || "page.pdf") : (name || "page.pdf");
        }
        const dir = pathModule.dirname(fullPath);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(fullPath, buffer);
        return fullPath;
      }
      return buffer;
    } else {
      const { data } = await this._page!.cdpSession.send<{ data: string }>("Page.captureSnapshot", { format: "mhtml" });
      if (path || name) {
        const fs = await import("fs");
        const pathModule = await import("path");
        let fullPath: string;
        if (path && pathModule.extname(path)) {
          fullPath = path;
        } else {
          fullPath = path ? pathModule.join(path, name || "page.mhtml") : (name || "page.mhtml");
        }
        const dir = pathModule.dirname(fullPath);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(fullPath, data);
        return fullPath;
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
