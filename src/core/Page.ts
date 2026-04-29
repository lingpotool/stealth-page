import { CDPSession } from "./CDPSession";
import { Element } from "./Element";
import { NoneElement } from "./NoneElement";
import { parseLocator } from "./locator";
import { parseJsResult, convertArgument } from "./jsResult";
import { PageStates } from "../units/PageStates";
import { PageScroller } from "../units/PageScroller";
import { PageRect } from "../units/PageRect";
import { Console } from "../units/Console";
import { Screencast } from "../units/Screencast";
import { Actions } from "../units/Actions";
import { Listener } from "../units/Listener";
import { PageCookiesSetter } from "../units/CookiesSetter";
import { WindowSetter } from "../units/WindowSetter";
import { LoadMode } from "../units/LoadMode";
import { Alert } from "../units/Alert";
import { Settings } from "./Settings";
import { raise_error } from "./tools";

export interface NavigationOptions {
  timeoutMs?: number;
  waitUntil?: "load" | "domcontentloaded" | "networkidle0" | "networkidle2";
}

export interface PageInitOptions {
  userAgent?: string;
  viewport?: {
    width: number;
    height: number;
    deviceScaleFactor?: number;
  };
}

const STEALTH_SCRIPT = `
Object.defineProperty(navigator, 'webdriver', {
  get: () => undefined,
  configurable: true
});
if (!window.chrome) {
  window.chrome = {
    runtime: {},
    loadTimes: function() { return {}; },
    csi: function() { return {}; },
    app: { isInstalled: false }
  };
}
const originalQuery = navigator.permissions.query;
navigator.permissions.query = (params) => {
  if (params.name === 'notifications') {
    return Promise.resolve({ state: Notification.permission });
  }
  return originalQuery.call(navigator.permissions, params);
};
Object.defineProperty(navigator, 'plugins', {
  get: () => {
    const plugins = {
      0: { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format', length: 1 },
      1: { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '', length: 1 },
      2: { name: 'Native Client', filename: 'internal-nacl-plugin', description: '', length: 2 },
      length: 3,
      item: function(i) { return this[i] || null; },
      namedItem: function(name) { for (let i = 0; i < this.length; i++) { if (this[i] && this[i].name === name) return this[i]; } return null; },
      refresh: function() {}
    };
    Object.setPrototypeOf(plugins, PluginArray.prototype);
    return plugins;
  }
});
Object.defineProperty(navigator, 'mimeTypes', {
  get: () => {
    const mimeTypes = {
      0: { type: 'application/pdf', suffixes: 'pdf', description: 'Portable Document Format' },
      1: { type: 'text/pdf', suffixes: 'pdf', description: 'Portable Document Format' },
      length: 2,
      item: function(i) { return this[i] || null; },
      namedItem: function(name) { for (let i = 0; i < this.length; i++) { if (this[i] && this[i].type === name) return this[i]; } return null; }
    };
    Object.setPrototypeOf(mimeTypes, MimeTypeArray.prototype);
    return mimeTypes;
  }
});
Object.defineProperty(navigator, 'languages', { get: () => ['zh-CN', 'zh', 'en'] });
Object.defineProperty(navigator, 'language', { get: () => 'zh-CN' });
Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 });
Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });
Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 0 });
const originalContentWindow = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'contentWindow');
if (originalContentWindow) {
  Object.defineProperty(HTMLIFrameElement.prototype, 'contentWindow', {
    get: function() {
      const win = originalContentWindow.get.call(this);
      if (win) { try { Object.defineProperty(win.navigator, 'webdriver', { get: () => undefined }); } catch(e) {} }
      return win;
    }
  });
}
const automationProps = ['cdc_adoQpoasnfa76pfcZLmcfl_Array','cdc_adoQpoasnfa76pfcZLmcfl_Promise','cdc_adoQpoasnfa76pfcZLmcfl_Symbol','__webdriver_evaluate','__selenium_evaluate','__webdriver_script_function','__webdriver_script_func','__webdriver_script_fn','__fxdriver_evaluate','__driver_unwrapped','__webdriver_unwrapped','__driver_evaluate','__selenium_unwrapped','__fxdriver_unwrapped','_Selenium_IDE_Recorder','_selenium','calledSelenium','$chrome_asyncScriptInfo','$cdc_asdjflasutopfhvcZLmcfl_','$wdc_'];
automationProps.forEach(prop => { try { delete window[prop]; } catch(e) {} });
if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
  Object.defineProperty(Notification, 'permission', { get: () => 'default' });
}
`;

const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export class Page {
  private readonly session: CDPSession;
  private _networkRequests = 0;
  private _networkIdle0Resolver: (() => void) | null = null;
  private _networkIdle2Resolver: (() => void) | null = null;
  private _networkIdle0Timer: ReturnType<typeof setTimeout> | null = null;
  private _networkIdle2Timer: ReturnType<typeof setTimeout> | null = null;
  private _states: PageStates | null = null;
  private _scroll: PageScroller | null = null;
  private _rect: PageRect | null = null;
  private _console: Console | null = null;
  private _screencast: Screencast | null = null;
  private _actions: Actions | null = null;
  private _listen: Listener | null = null;
  private _set: PageCookiesSetter | null = null;
  private _window: WindowSetter | null = null;
  private _loadMode: LoadMode | null = null;
  private _alert: Alert | null = null;
  private _tab_id: string = '';
  private _target_id: string = '';
  private _js_ready_state: string = 'loading';
  _has_alert: boolean = false;
  _alert_text: string = '';
  private _browser: any = null;
  private _timeout: any = null;
  private _load_mode_str: string = 'normal';
  private _init_scripts: Map<string, string> = new Map();

  constructor(session: CDPSession) {
    this.session = session;
  }

  get cdpSession(): CDPSession {
    return this.session;
  }

  get states(): PageStates {
    if (!this._states) {
      this._states = new PageStates(this);
    }
    return this._states;
  }

  get scroll(): PageScroller {
    if (!this._scroll) {
      this._scroll = new PageScroller(this);
    }
    return this._scroll;
  }

  get rect(): PageRect {
    if (!this._rect) {
      this._rect = new PageRect(this);
    }
    return this._rect;
  }

  get console(): Console {
    if (!this._console) {
      this._console = new Console(this);
    }
    return this._console;
  }

  get screencast(): Screencast {
    if (!this._screencast) {
      this._screencast = new Screencast(this);
    }
    return this._screencast;
  }

  get actions(): Actions {
    if (!this._actions) {
      this._actions = new Actions(this as any);
    }
    return this._actions;
  }

  get listen(): Listener {
    if (!this._listen) {
      this._listen = new Listener(this);
    }
    return this._listen;
  }

  get set(): PageCookiesSetter {
    if (!this._set) {
      this._set = new PageCookiesSetter(this);
    }
    return this._set;
  }

  get window(): WindowSetter {
    if (!this._window) {
      this._window = new WindowSetter(this);
    }
    return this._window;
  }

  get load_mode_setter(): LoadMode {
    if (!this._loadMode) {
      this._loadMode = new LoadMode(this.session);
    }
    return this._loadMode;
  }

  async run_cdp(method: string, params?: Record<string, any>): Promise<any> {
    return this.session.send(method, params);
  }

  async _run_cdp(method: string, params?: Record<string, any>): Promise<any> {
    return this.run_cdp(method, params);
  }

  get tab_id(): string {
    return this._tab_id;
  }

  set tab_id(value: string) {
    this._tab_id = value;
  }

  get _target_id_value(): string {
    return this._target_id;
  }

  set _target_id_val(value: string) {
    this._target_id = value;
  }

  get driver(): CDPSession {
    return this.session;
  }

  get browser(): any {
    return this._browser;
  }

  set browser(value: any) {
    this._browser = value;
  }

  get timeout(): any {
    return this._timeout;
  }

  set timeout(value: any) {
    this._timeout = value;
  }

  get load_mode(): string {
    return this._load_mode_str;
  }

  set load_mode(value: string) {
    this._load_mode_str = value;
  }

  get alert(): Alert {
    if (!this._alert) {
      this._alert = new Alert(this);
    }
    return this._alert;
  }

  get _has_alert_value(): boolean {
    return this._has_alert;
  }

  async run_cdp_loaded(method: string, params?: Record<string, any>): Promise<any> {
    await this._wait_loaded();
    return this.run_cdp(method, params);
  }

  async run_js_loaded(expression: string, ...args: any[]): Promise<any> {
    await this._wait_loaded();
    return this.runJs(expression, ...args);
  }

  async run_async_js(expression: string, ...args: any[]): Promise<any> {
    const params: Record<string, any> = {
      expression,
      returnByValue: false,
      awaitPromise: false,
      userGesture: true,
    };
    const { result } = await this.session.send<{ result: any }>("Runtime.evaluate", params);
    return parseJsResult({ session: this.session }, result);
  }

  async s_ele(htmlOrStr: string): Promise<Element | NoneElement> {
    const { result } = await this.session.send<{ result: { objectId?: string } }>("Runtime.evaluate", {
      expression: `(${htmlOrStr})`,
      returnByValue: false,
    });
    if (!result.objectId) return new NoneElement("s_ele", { html: htmlOrStr });
    try {
      const { nodeId } = await this.session.send<{ nodeId: number }>("DOM.requestNode", {
        objectId: result.objectId,
      });
      if (nodeId > 0) {
        const { node } = await this.session.send<{ node: { backendNodeId: number } }>("DOM.describeNode", { nodeId });
        return new Element(this.session, { nodeId, backendNodeId: node.backendNodeId });
      }
    } catch {}
    return new NoneElement("s_ele", { html: htmlOrStr });
  }

  async s_eles(htmlOrStr: string): Promise<Element[]> {
    const js = `
      (function() {
        const container = document.createElement('div');
        container.innerHTML = ${JSON.stringify(htmlOrStr)};
        return Array.from(container.children);
      })()
    `;
    const { result } = await this.session.send<{ result: { objectId?: string; description?: string } }>("Runtime.evaluate", {
      expression: js,
      returnByValue: false,
    });
    if (!result.objectId || result.description === "Array(0)") return [];
    try {
      const { result: propsResult } = await this.session.send<{ result: Array<{ name: string; value?: { objectId?: string; type?: string } }> }>("Runtime.getProperties", {
        objectId: result.objectId,
        ownProperties: true,
      });
      const elements: Element[] = [];
      for (const prop of propsResult) {
        if (!prop.value?.objectId || prop.name === 'length' || prop.value.type !== "object") continue;
        try {
          const { nodeId } = await this.session.send<{ nodeId: number }>("DOM.requestNode", { objectId: prop.value.objectId });
          if (nodeId > 0) {
            const { node } = await this.session.send<{ node: { backendNodeId: number } }>("DOM.describeNode", { nodeId });
            elements.push(new Element(this.session, { nodeId, backendNodeId: node.backendNodeId }));
          }
        } catch {}
      }
      return elements;
    } catch {}
    return [];
  }

  async add_ele(htmlOrInfo: string | [string, Record<string, string>], insertTo?: Element, before?: Element): Promise<Element> {
    let html: string;
    if (typeof htmlOrInfo === 'string') {
      html = htmlOrInfo;
    } else {
      const [tag, attrs] = htmlOrInfo;
      const attrStr = Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ');
      html = `<${tag} ${attrStr}></${tag}>`;
    }

    const { result: docResult } = await this.session.send<{ result: { objectId: string } }>("Runtime.evaluate", {
      expression: "document",
      returnByValue: false,
    });

    const { result } = await this.session.send<{ result: { objectId?: string } }>("Runtime.callFunctionOn", {
      functionDeclaration: `function(html) { const div = document.createElement('div'); div.innerHTML = html; return div.firstElementChild; }`,
      objectId: docResult.objectId,
      arguments: [{ value: html }],
      returnByValue: false,
    });

    if (!result.objectId) throw new Error("Failed to create element from HTML");

    const { nodeId } = await this.session.send<{ nodeId: number }>("DOM.requestNode", { objectId: result.objectId });
    const { node } = await this.session.send<{ node: { backendNodeId: number } }>("DOM.describeNode", { nodeId });

    if (insertTo) {
      const parentNodeId = (insertTo as any)._nodeId;
      if (parentNodeId) {
        if (before) {
          const beforeNodeId = (before as any)._nodeId;
          await this.session.send("DOM.insertBefore", { parentNodeId, newNodeId: nodeId, referenceNodeId: beforeNodeId });
        } else {
          await this.session.send("DOM.appendChild", { parentNodeId, newNodeId: nodeId });
        }
      }
    }

    return new Element(this.session, { nodeId, backendNodeId: node.backendNodeId });
  }

  async remove_ele(ele: Element): Promise<void> {
    const nodeId = (ele as any)._nodeId;
    if (nodeId) {
      await this.session.send("DOM.removeNode", { nodeId });
    }
  }

  async add_init_js(script: string): Promise<string> {
    const { identifier } = await this.session.send<{ identifier: string }>("Page.addScriptToEvaluateOnNewDocument", {
      source: script,
    });
    this._init_scripts.set(identifier, script);
    return identifier;
  }

  async remove_init_js(scriptId: string): Promise<void> {
    await this.session.send("Page.removeScriptToEvaluateOnNewDocument", { identifier: scriptId });
    this._init_scripts.delete(scriptId);
  }

  async clear_cache(options: { sessionStorage?: boolean; localStorage?: boolean; cache?: boolean; cookies?: boolean } = {}): Promise<void> {
    const { sessionStorage = false, localStorage = false, cache = true, cookies = false } = options;

    if (sessionStorage) {
      await this.session.send("Runtime.evaluate", { expression: "sessionStorage.clear();" });
    }
    if (localStorage) {
      await this.session.send("Runtime.evaluate", { expression: "localStorage.clear();" });
    }
    if (cache) {
      await this.session.send("Network.clearBrowserCache");
    }
    if (cookies) {
      await this.session.send("Storage.clearCookies");
    }
  }

  async disconnect(): Promise<void> {
    if (this.session.close) {
      this.session.close();
    }
  }

  async reconnect(wait: number = 1): Promise<void> {
    await this.disconnect();
    await new Promise(r => setTimeout(r, wait * 1000));
  }

  async session_storage(key?: string): Promise<any> {
    if (key) {
      const { result } = await this.session.send<{ result: { value: any } }>("Runtime.evaluate", {
        expression: `sessionStorage.getItem(${JSON.stringify(key)})`,
        returnByValue: true,
      });
      return result.value;
    }
    const { result } = await this.session.send<{ result: { value: any } }>("Runtime.evaluate", {
      expression: "JSON.stringify(Object.fromEntries(Object.entries(sessionStorage)))",
      returnByValue: true,
    });
    try {
      return JSON.parse(result.value as string);
    } catch {
      return {};
    }
  }

  async local_storage(key?: string): Promise<any> {
    if (key) {
      const { result } = await this.session.send<{ result: { value: any } }>("Runtime.evaluate", {
        expression: `localStorage.getItem(${JSON.stringify(key)})`,
        returnByValue: true,
      });
      return result.value;
    }
    const { result } = await this.session.send<{ result: { value: any } }>("Runtime.evaluate", {
      expression: "JSON.stringify(Object.fromEntries(Object.entries(localStorage)))",
      returnByValue: true,
    });
    try {
      return JSON.parse(result.value);
    } catch {
      return {};
    }
  }

  async _get_document(timeout?: number): Promise<number> {
    const timeoutMs = (timeout ?? Settings.cdp_timeout) * 1000;
    const endTime = Date.now() + timeoutMs;
    while (Date.now() < endTime) {
      try {
        const { root } = await this.session.send<{ root: { nodeId: number } }>("DOM.getDocument", { depth: -1 });
        return root.nodeId;
      } catch {
        await new Promise(r => setTimeout(r, 200));
      }
    }
    throw new Error("Failed to get document within timeout");
  }

  async _wait_loaded(timeout?: number): Promise<void> {
    const timeoutMs = (timeout ?? 30) * 1000;
    const endTime = Date.now() + timeoutMs;
    while (Date.now() < endTime) {
      const { result } = await this.session.send<{ result: { value: string } }>("Runtime.evaluate", {
        expression: "document.readyState",
        returnByValue: true,
      });
      if (result.value === 'complete' || result.value === 'interactive') return;
      await new Promise(r => setTimeout(r, 200));
    }
  }

  async _d_connect(url: string, times: number = 3, interval: number = 1): Promise<void> {
    let lastError: any;
    for (let i = 0; i < times; i++) {
      try {
        await this.session.send("Page.navigate", { url });
        return;
      } catch (e: any) {
        lastError = e;
        if (i < times - 1) {
          await new Promise(r => setTimeout(r, interval * 1000));
        }
      }
    }
    throw lastError;
  }

  async init(options: PageInitOptions = {}): Promise<void> {
    await this.session.send("Page.enable");
    await this.session.send("Runtime.enable");
    await this.session.send("DOM.enable");
    await this.session.send("Network.enable");

    await this.session.send("Page.addScriptToEvaluateOnNewDocument", {
      source: STEALTH_SCRIPT
    });

    const userAgent = options.userAgent || DEFAULT_USER_AGENT;
    await this.session.send("Emulation.setUserAgentOverride", {
      userAgent,
      acceptLanguage: 'zh-CN,zh;q=0.9,en;q=0.8',
      platform: 'Win32'
    });

    if (options.viewport) {
      await this.session.send("Emulation.setDeviceMetricsOverride", {
        width: options.viewport.width,
        height: options.viewport.height,
        deviceScaleFactor: options.viewport.deviceScaleFactor ?? 1,
        mobile: false,
      });
    }

    this._setupNetworkIdleTracking();
    this._initAlert();
  }

  private _initAlert(): void {
    if (!this._alert) {
      this._alert = new Alert(this);
    }
  }

  private _setupNetworkIdleTracking(): void {
    this.session.on("Network.requestWillBeSent", () => {
      this._networkRequests++;
      this._clearNetworkIdleTimers();
    });

    const onResponse = () => {
      this._networkRequests = Math.max(0, this._networkRequests - 1);
      if (this._networkRequests <= 2) {
        this._networkIdle2Timer = setTimeout(() => {
          this._networkIdle2Resolver?.();
          this._networkIdle2Resolver = null;
        }, 500);
      }
      if (this._networkRequests === 0) {
        this._networkIdle0Timer = setTimeout(() => {
          this._networkIdle0Resolver?.();
          this._networkIdle0Resolver = null;
        }, 500);
      }
    };

    this.session.on("Network.responseReceived", onResponse);
    this.session.on("Network.loadingFailed", onResponse);
    this.session.on("Network.loadingFinished", onResponse);
  }

  private _clearNetworkIdleTimers(): void {
    if (this._networkIdle0Timer) { clearTimeout(this._networkIdle0Timer); this._networkIdle0Timer = null; }
    if (this._networkIdle2Timer) { clearTimeout(this._networkIdle2Timer); this._networkIdle2Timer = null; }
  }

  private _waitForNetworkIdle(type: "networkidle0" | "networkidle2", timeoutMs: number): Promise<void> {
    const threshold = type === "networkidle0" ? 0 : 2;
    if (this._networkRequests <= threshold) {
      return new Promise<void>((resolve) => setTimeout(resolve, 500));
    }

    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        this._clearNetworkIdleTimers();
        reject(new Error(`Navigation timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      const resolver = () => { clearTimeout(timer); resolve(); };

      if (type === "networkidle0") {
        this._networkIdle0Resolver = resolver;
      } else {
        this._networkIdle2Resolver = resolver;
      }
    });
  }

  async get(url: string, options: NavigationOptions = {}): Promise<void> {
    const mode = this._load_mode_str || options.waitUntil || 'load';
    await this.session.send("Page.navigate", { url });

    if (mode === 'none') return;

    if (mode === 'eager' || mode === 'domcontentloaded') {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => { cleanup(); resolve(); }, 30000);
        const handler = () => { cleanup(); resolve(); };
        const cleanup = () => { clearTimeout(timer); this.session.off("Page.domContentEventFired", handler); this.session.off("Page.loadEventFired", handler); };
        this.session.on("Page.domContentEventFired", handler);
        this.session.on("Page.loadEventFired", handler);
      });
      return;
    }

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => { cleanup(); reject(new Error(`Navigation timeout after 30000ms`)); }, options.timeoutMs ?? 30000);
      const handler = () => { cleanup(); resolve(); };
      const cleanup = () => { clearTimeout(timer); this.session.off("Page.loadEventFired", handler); };
      this.session.on("Page.loadEventFired", handler);
    });
  }

  async ele(locator: string, timeout?: number): Promise<Element | NoneElement> {
    const timeoutMs = (timeout ?? Settings.cdp_timeout) * 1000;
    const deadline = Date.now() + timeoutMs;

    while (true) {
      try {
        await this.session.send("DOM.getDocument", { depth: -1 }).catch(() => {});
        
        const parsed = parseLocator(locator);
        let nodeId: number = 0;
        let backendNodeId: number = 0;

        if (parsed.type === 'css') {
          const { searchId } = await this.session.send<{ searchId: string }>("DOM.performSearch", {
            query: parsed.value,
            includeUserAgentShadowDOM: true,
          });
          const { nodeIds } = await this.session.send<{ nodeIds: number[] }>("DOM.getSearchResults", {
            searchId,
            fromIndex: 0,
            toIndex: 1,
          });
          await this.session.send("DOM.discardSearchResults", { searchId }).catch(() => {});
          if (nodeIds.length > 0 && nodeIds[0] > 0) {
            nodeId = nodeIds[0];
          }
        } else {
          const xpath = parsed.value;
          const { result } = await this.session.send<{ result: { objectId?: string } }>("Runtime.evaluate", {
            expression: `(function() { const r = document.evaluate(${JSON.stringify(xpath)}, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null); return r.singleNodeValue; })()`,
            returnByValue: false,
          });
          if (result.objectId) {
            const nodeResult = await this.session.send<{ nodeId: number; backendNodeId?: number }>("DOM.requestNode", { objectId: result.objectId });
            nodeId = nodeResult.nodeId;
            backendNodeId = nodeResult.backendNodeId || 0;
          }
        }

        if (nodeId > 0) {
          if (backendNodeId === 0) {
            const { node } = await this.session.send<{ node: { backendNodeId: number } }>("DOM.describeNode", { nodeId });
            backendNodeId = node.backendNodeId;
          }
          return new Element(this.session, { nodeId, backendNodeId });
        }
      } catch {}

      if (Date.now() >= deadline) break;
      await new Promise(r => setTimeout(r, 200));
    }

    if (Settings.raise_when_ele_not_found) {
      const { ElementNotFoundError } = await import("../errors");
      throw new ElementNotFoundError(locator);
    }
    return new NoneElement("ele", { locator });
  }

  async ele_text(locator: string): Promise<string | null> {
    const parsed = parseLocator(locator);

    if (parsed.type === "xpath") {
      const { result } = await this.session.send<{ result: { value: string | null } }>("Runtime.evaluate", {
        expression: `(function() {
          const xpath = ${JSON.stringify(parsed.value)};
          const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
          const node = result.singleNodeValue;
          return node ? (node.innerText || node.textContent || '') : null;
        })()`,
        returnByValue: true,
      });
      return result.value;
    }

    const ele = await this.ele(locator);
    if (ele instanceof NoneElement) return null;
    return await ele.text();
  }

  async ele_html(locator: string): Promise<string | null> {
    const parsed = parseLocator(locator);

    if (parsed.type === "xpath") {
      const { result } = await this.session.send<{ result: { value: string | null } }>("Runtime.evaluate", {
        expression: `(function() {
          const xpath = ${JSON.stringify(parsed.value)};
          const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
          const node = result.singleNodeValue;
          return node ? node.innerHTML : null;
        })()`,
        returnByValue: true,
      });
      return result.value;
    }

    const ele = await this.ele(locator);
    if (ele instanceof NoneElement) return null;
    return await ele.html;
  }

  async eles_attrs(locator: string, attrs: string[]): Promise<Array<Record<string, string>>> {
    const parsed = parseLocator(locator);

    if (parsed.type === "xpath") {
      const { result } = await this.session.send<{ result: { value: Array<Record<string, string>> } }>("Runtime.evaluate", {
        expression: `(function() {
          const xpath = ${JSON.stringify(parsed.value)};
          const attrNames = ${JSON.stringify(attrs)};
          const result = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
          const items = [];
          for (let i = 0; i < result.snapshotLength; i++) {
            const node = result.snapshotItem(i);
            const item = {};
            for (const attr of attrNames) {
              if (attr === 'text') { item[attr] = node.innerText || node.textContent || ''; }
              else if (attr === 'html') { item[attr] = node.innerHTML || ''; }
              else { item[attr] = node.getAttribute(attr) || ''; }
            }
            items.push(item);
          }
          return items;
        })()`,
        returnByValue: true,
      });
      return result.value;
    }

    const elements = await this.eles(locator);
    const results: Array<Record<string, string>> = [];
    for (const ele of elements) {
      const item: Record<string, string> = {};
      for (const attr of attrs) {
        if (attr === 'text') {
          item[attr] = await ele.text();
        } else if (attr === 'html') {
          item[attr] = await ele.html;
        } else {
          item[attr] = (await ele.attr(attr)) || '';
        }
      }
      results.push(item);
    }
    return results;
  }

  async eles(locator: string): Promise<Element[]> {
    const parsed = parseLocator(locator);
    const query = parsed.type === 'css' ? parsed.value : `xpath=${parsed.value}`;

    try {
      const { searchId, resultCount } = await this.session.send<{ searchId: string; resultCount: number }>("DOM.performSearch", {
        query,
        includeUserAgentShadowDOM: true,
      });

      const { nodeIds } = await this.session.send<{ nodeIds: number[] }>("DOM.getSearchResults", {
        searchId,
        fromIndex: 0,
        toIndex: resultCount || 100000,
      });

      await this.session.send("DOM.discardSearchResults", { searchId }).catch(() => {});

      const elements: Element[] = [];
      for (const nodeId of nodeIds) {
        if (nodeId > 0) {
          try {
            const { node } = await this.session.send<{ node: { backendNodeId: number } }>("DOM.describeNode", { nodeId });
            elements.push(new Element(this.session, { nodeId, backendNodeId: node.backendNodeId }));
          } catch {}
        }
      }
      return elements;
    } catch {
      return [];
    }
  }

  async runJs<T = any>(expression: string, ...args: any[]): Promise<T> {
    let asExpr = false;
    let timeout: number | undefined;
    if (args.length > 0 && typeof args[args.length - 1] === 'object' && args[args.length - 1] !== null
        && ('asExpr' in args[args.length - 1] || 'timeout' in args[args.length - 1])) {
      const opts = args.pop();
      asExpr = opts.asExpr ?? false;
      timeout = opts.timeout;
    }

    const endTime = timeout !== undefined ? Date.now() + timeout * 1000 : undefined;

    if (asExpr) {
      const params: Record<string, any> = {
        expression,
        returnByValue: false,
        awaitPromise: true,
        userGesture: true,
      };
      if (timeout !== undefined) params.timeout = timeout * 1000;
      const { result } = await this.session.send<{ result: any }>("Runtime.evaluate", params);
      return parseJsResult({ session: this.session }, result, endTime) as Promise<T>;
    }

    if (args.length > 0) {
      let funcBody = expression.trim();
      const isFunction = funcBody.startsWith('function') || funcBody.startsWith('(') || funcBody.startsWith('async');
      if (!isFunction) {
        funcBody = `function(){${funcBody}}`;
      }

      const { result: docResult } = await this.session.send<{ result: { objectId: string } }>("Runtime.evaluate", {
        expression: "document",
        returnByValue: false,
      });

      const params: Record<string, any> = {
        functionDeclaration: funcBody,
        objectId: docResult.objectId,
        arguments: args.map(a => convertArgument(a)),
        returnByValue: false,
        awaitPromise: true,
        userGesture: true,
      };
      if (timeout !== undefined) params.timeout = timeout * 1000;
      const { result } = await this.session.send<{ result: any }>("Runtime.callFunctionOn", params);
      return parseJsResult({ session: this.session }, result, endTime) as Promise<T>;
    }

    let wrappedExpression = expression.trim();
    if (!wrappedExpression.startsWith('return ') &&
        !wrappedExpression.includes('\n') &&
        !wrappedExpression.startsWith('(') &&
        !wrappedExpression.startsWith('{')) {
      wrappedExpression = `return ${wrappedExpression}`;
    }

    const finalExpression = `(function() { ${wrappedExpression} })()`;

    const params: Record<string, any> = {
      expression: finalExpression,
      returnByValue: false,
      awaitPromise: true,
      userGesture: true,
    };
    if (timeout !== undefined) params.timeout = timeout * 1000;
    const { result } = await this.session.send<{ result: any }>("Runtime.evaluate", params);

    return parseJsResult({ session: this.session }, result, endTime) as Promise<T>;
  }

  async html(): Promise<string> {
    const { result } = await this.session.send<{
      result: { value: string };
    }>("Runtime.evaluate", {
      expression: "document.documentElement.outerHTML",
      returnByValue: true,
    });

    return result.value;
  }

  async title(): Promise<string> {
    const { result } = await this.session.send<{
      result: { value: string };
    }>("Runtime.evaluate", {
      expression: "document.title || ''",
      returnByValue: true,
    });

    return result.value;
  }

  async url(): Promise<string> {
    return this.runJs<string>("document.location.href || ''");
  }

  async json(): Promise<any> {
    const htmlText = await this.runJs<string>("document.body?.innerText || ''");
    try {
      return JSON.parse(htmlText);
    } catch {
      throw new Error("页面内容不是有效的 JSON");
    }
  }

  async cookies(allDomains: boolean = false, allInfo: boolean = false): Promise<any> {
    const cdpMethod = allDomains ? 'Storage.getCookies' : 'Network.getCookies';
    let params: Record<string, any> = {};
    if (!allDomains) {
      const currentUrl = await this.url();
      if (currentUrl) params.urls = [currentUrl];
    }

    const { cookies } = await this.session.send<{ cookies: any[] }>(cdpMethod, params);

    if (allInfo) {
      return cookies;
    }

    return cookies.map((c: any) => ({
      name: c.name,
      value: c.value,
      domain: c.domain,
    }));
  }

  async set_cookies(cookies: Array<{ name: string; value: string; domain?: string; path?: string }>): Promise<void> {
    for (const cookie of cookies) {
      await this.session.send("Network.setCookie", {
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path || "/",
      });
    }
  }

  async refresh(ignoreCache: boolean = false): Promise<void> {
    await this.session.send("Page.reload", { ignoreCache });
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error("Page reload timeout"));
      }, 30000);

      const handler = () => {
        cleanup();
        resolve();
      };

      const cleanup = () => {
        clearTimeout(timer);
        this.session.off("Page.loadEventFired", handler);
      };

      this.session.on("Page.loadEventFired", handler);
    });
  }

  async back(steps: number = 1): Promise<void> {
    await this._forward_or_back(-steps);
  }

  async forward(steps: number = 1): Promise<void> {
    await this._forward_or_back(steps);
  }

  private async _forward_or_back(steps: number): Promise<void> {
    if (steps === 0) return;

    const { currentIndex, entries } = await this.session.send<{
      currentIndex: number;
      entries: Array<{ id: number; url: string }>;
    }>("Page.getNavigationHistory");

    const direction = steps > 0 ? 1 : -1;
    const absSteps = Math.abs(steps);
    let count = 0;
    let targetIndex = currentIndex;

    for (let i = currentIndex + direction; i >= 0 && i < entries.length; i += direction) {
      if (entries[i].url !== entries[targetIndex].url) {
        count++;
        targetIndex = i;
        if (count >= absSteps) break;
      }
    }

    if (count > 0 && targetIndex !== currentIndex) {
      await this.session.send("Page.navigateToHistoryEntry", { entryId: entries[targetIndex].id });
    }
  }

  async scroll_to(x: number, y: number): Promise<void> {
    await this.session.send("Runtime.evaluate", {
      expression: `window.scrollTo(${x}, ${y});`,
    });
  }

  async scroll_to_top(): Promise<void> {
    await this.scroll_to(0, 0);
  }

  async scroll_to_bottom(): Promise<void> {
    await this.session.send("Runtime.evaluate", {
      expression: "window.scrollTo(0, document.body.scrollHeight);",
    });
  }

  async handle_alert(accept: boolean | string | null = true, send?: string, timeout?: number, nextOne: boolean = false): Promise<string | false> {
    if (nextOne) {
      this._alert_auto = { accept: accept === true, text: send };
      return '';
    }

    const timeoutMs = (timeout ?? Settings.cdp_timeout) * 1000;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      if (this._has_alert) break;
      await new Promise(r => setTimeout(r, 50));
    }

    if (!this._has_alert) return false;

    const resText = this._alert_text || '';

    if (typeof accept !== 'boolean') {
      return resText;
    }

    const params: Record<string, any> = { accept };
    if (send !== undefined) {
      params.promptText = send;
    }

    try {
      await this.session.send("Page.handleJavaScriptDialog", params);
    } catch {}

    while (this._has_alert) {
      await new Promise(r => setTimeout(r, 10));
    }

    return resText;
  }

  private _alert_auto: { accept: boolean; text?: string } | null = null;

  async screenshot(path?: string): Promise<Buffer> {
    const { data } = await this.session.send<{ data: string }>("Page.captureScreenshot", {
      format: "png",
    });
    const buffer = Buffer.from(data, "base64");
    if (path) {
      const fs = await import("fs");
      fs.writeFileSync(path, buffer);
    }
    return buffer;
  }

  async get_screenshot(options: {
    path?: string;
    name?: string;
    asBytes?: boolean | 'jpg' | 'jpeg' | 'png' | 'webp';
    asBase64?: boolean | 'jpg' | 'jpeg' | 'png' | 'webp';
    fullPage?: boolean;
    leftTop?: { x: number; y: number };
    rightBottom?: { x: number; y: number };
  } = {}): Promise<string | Buffer> {
    const { path, name, asBytes, asBase64, fullPage, leftTop, rightBottom } = options;

    let picType: string = 'png';

    if (asBytes) {
      if (asBytes === true) {
        picType = 'png';
      } else {
        picType = asBytes === 'jpg' ? 'jpeg' : asBytes;
      }
    } else if (asBase64) {
      if (asBase64 === true) {
        picType = 'png';
      } else {
        picType = asBase64 === 'jpg' ? 'jpeg' : asBase64;
      }
    } else {
      picType = 'png';
    }

    const params: Record<string, any> = { format: picType };

    if (fullPage) {
      params.captureBeyondViewport = true;
      const { result } = await this.session.send<{ result: { contentSize: { width: number; height: number } } }>("Page.getLayoutMetrics");
      const { width, height } = result.contentSize;
      if (width === 0 || height === 0) {
        throw new Error('Page size is 0, cannot take screenshot.');
      }
      params.clip = { x: 0, y: 0, width, height, scale: 1 };
    } else if (leftTop || rightBottom) {
      const lt = leftTop || { x: 0, y: 0 };
      const rb = rightBottom || (await this._getViewportSize());
      params.clip = {
        x: lt.x,
        y: lt.y,
        width: rb.x - lt.x,
        height: rb.y - lt.y,
        scale: 1,
      };
    }

    const { data } = await this.session.send<{ data: string }>("Page.captureScreenshot", params);
    const buffer = Buffer.from(data, "base64");

    if (asBase64) return data;
    if (asBytes) return buffer;

    if (path) {
      const fs = await import("fs");
      const pathModule = await import("path");
      let filePath = path;
      const ext = `.${picType === 'jpeg' ? 'jpg' : picType}`;
      if (!path.endsWith(ext) && !path.endsWith('.png') && !path.endsWith('.jpg') && !path.endsWith('.jpeg') && !path.endsWith('.webp')) {
        const fileName = name || `screenshot${ext}`;
        filePath = pathModule.join(path, fileName);
      }
      fs.writeFileSync(filePath, buffer);
      return filePath;
    }

    return buffer;
  }

  private async _getViewportSize(): Promise<{ x: number; y: number }> {
    try {
      const { result } = await this.session.send<{ result: { value: string } }>("Runtime.evaluate", {
        expression: "JSON.stringify({x: window.innerWidth, y: window.innerHeight})",
        returnByValue: true,
      });
      return JSON.parse(result.value);
    } catch {
      return { x: 1280, y: 720 };
    }
  }

  async get_frame(_frameId: string): Promise<Page> {
    return new Page(this.session);
  }

  async get_frames(): Promise<Array<{ id: string; url: string; name: string }>> {
    const { frameTree } = await this.session.send<{
      frameTree: {
        frame: { id: string; url: string; name?: string };
        childFrames?: Array<{ frame: { id: string; url: string; name?: string } }>;
      };
    }>("Page.getFrameTree");

    const frames: Array<{ id: string; url: string; name: string }> = [
      {
        id: frameTree.frame.id,
        url: frameTree.frame.url,
        name: frameTree.frame.name || "",
      },
    ];

    if (frameTree.childFrames) {
      for (const child of frameTree.childFrames) {
        frames.push({
          id: child.frame.id,
          url: child.frame.url,
          name: child.frame.name || "",
        });
      }
    }

    return frames;
  }

  async stop_loading(): Promise<void> {
    await this.session.send("Page.stopLoading");
  }

  async reload(): Promise<void> {
    await this.session.send("Page.reload");
  }

  async set_geolocation(latitude: number, longitude: number, accuracy: number = 100): Promise<void> {
    await this.session.send("Emulation.setGeolocationOverride", {
      latitude,
      longitude,
      accuracy,
    });
  }

  async clear_geolocation(): Promise<void> {
    await this.session.send("Emulation.clearGeolocationOverride");
  }
}
