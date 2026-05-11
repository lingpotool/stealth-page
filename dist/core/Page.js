"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Page = void 0;
const Element_1 = require("./Element");
const NoneElement_1 = require("./NoneElement");
const locator_1 = require("./locator");
const jsResult_1 = require("./jsResult");
const PageStates_1 = require("../units/PageStates");
const PageScroller_1 = require("../units/PageScroller");
const PageRect_1 = require("../units/PageRect");
const Console_1 = require("../units/Console");
const Screencast_1 = require("../units/Screencast");
const Actions_1 = require("../units/Actions");
const Listener_1 = require("../units/Listener");
const CookiesSetter_1 = require("../units/CookiesSetter");
const WindowSetter_1 = require("../units/WindowSetter");
const LoadMode_1 = require("../units/LoadMode");
const Alert_1 = require("../units/Alert");
const Settings_1 = require("./Settings");
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
class Page {
    constructor(session) {
        this._networkRequests = 0;
        this._networkIdle0Resolver = null;
        this._networkIdle2Resolver = null;
        this._networkIdle0Timer = null;
        this._networkIdle2Timer = null;
        this._states = null;
        this._scroll = null;
        this._rect = null;
        this._console = null;
        this._screencast = null;
        this._actions = null;
        this._listen = null;
        this._set = null;
        this._window = null;
        this._loadMode = null;
        this._alert = null;
        this._tab_id = '';
        this._target_id = '';
        this._js_ready_state = 'loading';
        this._has_alert = false;
        this._alert_text = '';
        this._browser = null;
        this._timeout = null;
        this._load_mode_str = 'normal';
        this._init_scripts = new Map();
        this._alert_auto = null;
        this.session = session;
    }
    get cdpSession() {
        return this.session;
    }
    get states() {
        if (!this._states) {
            this._states = new PageStates_1.PageStates(this);
        }
        return this._states;
    }
    get scroll() {
        if (!this._scroll) {
            this._scroll = new PageScroller_1.PageScroller(this);
        }
        return this._scroll;
    }
    get rect() {
        if (!this._rect) {
            this._rect = new PageRect_1.PageRect(this);
        }
        return this._rect;
    }
    get console() {
        if (!this._console) {
            this._console = new Console_1.Console(this);
        }
        return this._console;
    }
    get screencast() {
        if (!this._screencast) {
            this._screencast = new Screencast_1.Screencast(this);
        }
        return this._screencast;
    }
    get actions() {
        if (!this._actions) {
            this._actions = new Actions_1.Actions(this);
        }
        return this._actions;
    }
    get listen() {
        if (!this._listen) {
            this._listen = new Listener_1.Listener(this);
        }
        return this._listen;
    }
    get set() {
        if (!this._set) {
            this._set = new CookiesSetter_1.PageCookiesSetter(this);
        }
        return this._set;
    }
    get window() {
        if (!this._window) {
            this._window = new WindowSetter_1.WindowSetter(this);
        }
        return this._window;
    }
    get load_mode_setter() {
        if (!this._loadMode) {
            this._loadMode = new LoadMode_1.LoadMode(this.session);
        }
        return this._loadMode;
    }
    async run_cdp(method, params) {
        return this.session.send(method, params);
    }
    async _run_cdp(method, params) {
        return this.run_cdp(method, params);
    }
    get tab_id() {
        return this._tab_id;
    }
    set tab_id(value) {
        this._tab_id = value;
    }
    get _target_id_value() {
        return this._target_id;
    }
    set _target_id_val(value) {
        this._target_id = value;
    }
    get driver() {
        return this.session;
    }
    get browser() {
        return this._browser;
    }
    set browser(value) {
        this._browser = value;
    }
    get timeout() {
        return this._timeout;
    }
    set timeout(value) {
        this._timeout = value;
    }
    get load_mode() {
        return this._load_mode_str;
    }
    set load_mode(value) {
        this._load_mode_str = value;
    }
    get alert() {
        if (!this._alert) {
            this._alert = new Alert_1.Alert(this);
        }
        return this._alert;
    }
    get _has_alert_value() {
        return this._has_alert;
    }
    async run_cdp_loaded(method, params) {
        await this._wait_loaded();
        return this.run_cdp(method, params);
    }
    async run_js_loaded(expression, ...args) {
        await this._wait_loaded();
        return this.runJs(expression, ...args);
    }
    async run_async_js(expression, ...args) {
        const params = {
            expression,
            returnByValue: false,
            awaitPromise: false,
            userGesture: true,
        };
        const { result } = await this.session.send("Runtime.evaluate", params);
        return (0, jsResult_1.parseJsResult)({ session: this.session }, result);
    }
    async s_ele(htmlOrStr) {
        const { result } = await this.session.send("Runtime.evaluate", {
            expression: `(${htmlOrStr})`,
            returnByValue: false,
        });
        if (!result.objectId)
            return new NoneElement_1.NoneElement("s_ele", { html: htmlOrStr });
        try {
            const { nodeId } = await this.session.send("DOM.requestNode", {
                objectId: result.objectId,
            });
            if (nodeId > 0) {
                const { node } = await this.session.send("DOM.describeNode", { nodeId });
                return new Element_1.Element(this.session, { nodeId, backendNodeId: node.backendNodeId });
            }
        }
        catch { }
        return new NoneElement_1.NoneElement("s_ele", { html: htmlOrStr });
    }
    async s_eles(htmlOrStr) {
        const js = `
      (function() {
        const container = document.createElement('div');
        container.innerHTML = ${JSON.stringify(htmlOrStr)};
        return Array.from(container.children);
      })()
    `;
        const { result } = await this.session.send("Runtime.evaluate", {
            expression: js,
            returnByValue: false,
        });
        if (!result.objectId || result.description === "Array(0)")
            return [];
        try {
            const { result: propsResult } = await this.session.send("Runtime.getProperties", {
                objectId: result.objectId,
                ownProperties: true,
            });
            const elements = [];
            for (const prop of propsResult) {
                if (!prop.value?.objectId || prop.name === 'length' || prop.value.type !== "object")
                    continue;
                try {
                    const { nodeId } = await this.session.send("DOM.requestNode", { objectId: prop.value.objectId });
                    if (nodeId > 0) {
                        const { node } = await this.session.send("DOM.describeNode", { nodeId });
                        elements.push(new Element_1.Element(this.session, { nodeId, backendNodeId: node.backendNodeId }));
                    }
                }
                catch { }
            }
            return elements;
        }
        catch { }
        return [];
    }
    async add_ele(htmlOrInfo, insertTo, before) {
        let html;
        if (typeof htmlOrInfo === 'string') {
            html = htmlOrInfo;
        }
        else {
            const [tag, attrs] = htmlOrInfo;
            const attrStr = Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ');
            html = `<${tag} ${attrStr}></${tag}>`;
        }
        const { result: docResult } = await this.session.send("Runtime.evaluate", {
            expression: "document",
            returnByValue: false,
        });
        const { result } = await this.session.send("Runtime.callFunctionOn", {
            functionDeclaration: `function(html) { const div = document.createElement('div'); div.innerHTML = html; return div.firstElementChild; }`,
            objectId: docResult.objectId,
            arguments: [{ value: html }],
            returnByValue: false,
        });
        if (!result.objectId)
            throw new Error("Failed to create element from HTML");
        const { nodeId } = await this.session.send("DOM.requestNode", { objectId: result.objectId });
        const { node } = await this.session.send("DOM.describeNode", { nodeId });
        if (insertTo) {
            const parentNodeId = insertTo._nodeId;
            if (parentNodeId) {
                if (before) {
                    const beforeNodeId = before._nodeId;
                    await this.session.send("DOM.insertBefore", { parentNodeId, newNodeId: nodeId, referenceNodeId: beforeNodeId });
                }
                else {
                    await this.session.send("DOM.appendChild", { parentNodeId, newNodeId: nodeId });
                }
            }
        }
        return new Element_1.Element(this.session, { nodeId, backendNodeId: node.backendNodeId });
    }
    async remove_ele(ele) {
        const nodeId = ele._nodeId;
        if (nodeId) {
            await this.session.send("DOM.removeNode", { nodeId });
        }
    }
    async add_init_js(script) {
        const { identifier } = await this.session.send("Page.addScriptToEvaluateOnNewDocument", {
            source: script,
        });
        this._init_scripts.set(identifier, script);
        return identifier;
    }
    async remove_init_js(scriptId) {
        await this.session.send("Page.removeScriptToEvaluateOnNewDocument", { identifier: scriptId });
        this._init_scripts.delete(scriptId);
    }
    async clear_cache(options = {}) {
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
    async disconnect() {
        if (this.session.close) {
            this.session.close();
        }
    }
    async reconnect(wait = 1) {
        await this.disconnect();
        await new Promise(r => setTimeout(r, wait * 1000));
    }
    async session_storage(key) {
        if (key) {
            const { result } = await this.session.send("Runtime.evaluate", {
                expression: `sessionStorage.getItem(${JSON.stringify(key)})`,
                returnByValue: true,
            });
            return result.value;
        }
        const { result } = await this.session.send("Runtime.evaluate", {
            expression: "JSON.stringify(Object.fromEntries(Object.entries(sessionStorage)))",
            returnByValue: true,
        });
        try {
            return JSON.parse(result.value);
        }
        catch {
            return {};
        }
    }
    async local_storage(key) {
        if (key) {
            const { result } = await this.session.send("Runtime.evaluate", {
                expression: `localStorage.getItem(${JSON.stringify(key)})`,
                returnByValue: true,
            });
            return result.value;
        }
        const { result } = await this.session.send("Runtime.evaluate", {
            expression: "JSON.stringify(Object.fromEntries(Object.entries(localStorage)))",
            returnByValue: true,
        });
        try {
            return JSON.parse(result.value);
        }
        catch {
            return {};
        }
    }
    async _get_document(timeout) {
        const timeoutMs = (timeout ?? Settings_1.Settings.cdp_timeout) * 1000;
        const endTime = Date.now() + timeoutMs;
        while (Date.now() < endTime) {
            try {
                const { root } = await this.session.send("DOM.getDocument", { depth: -1 });
                return root.nodeId;
            }
            catch {
                await new Promise(r => setTimeout(r, 200));
            }
        }
        throw new Error("Failed to get document within timeout");
    }
    async _wait_loaded(timeout) {
        const timeoutMs = (timeout ?? 30) * 1000;
        const endTime = Date.now() + timeoutMs;
        while (Date.now() < endTime) {
            const { result } = await this.session.send("Runtime.evaluate", {
                expression: "document.readyState",
                returnByValue: true,
            });
            if (result.value === 'complete' || result.value === 'interactive')
                return;
            await new Promise(r => setTimeout(r, 200));
        }
    }
    async _d_connect(url, times = 3, interval = 1) {
        let lastError;
        for (let i = 0; i < times; i++) {
            try {
                await this.session.send("Page.navigate", { url });
                return;
            }
            catch (e) {
                lastError = e;
                if (i < times - 1) {
                    await new Promise(r => setTimeout(r, interval * 1000));
                }
            }
        }
        throw lastError;
    }
    async init(options = {}) {
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
    _initAlert() {
        if (!this._alert) {
            this._alert = new Alert_1.Alert(this);
        }
    }
    _setupNetworkIdleTracking() {
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
    _clearNetworkIdleTimers() {
        if (this._networkIdle0Timer) {
            clearTimeout(this._networkIdle0Timer);
            this._networkIdle0Timer = null;
        }
        if (this._networkIdle2Timer) {
            clearTimeout(this._networkIdle2Timer);
            this._networkIdle2Timer = null;
        }
    }
    _waitForNetworkIdle(type, timeoutMs) {
        const threshold = type === "networkidle0" ? 0 : 2;
        if (this._networkRequests <= threshold) {
            return new Promise((resolve) => setTimeout(resolve, 500));
        }
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this._clearNetworkIdleTimers();
                reject(new Error(`Navigation timeout after ${timeoutMs}ms`));
            }, timeoutMs);
            const resolver = () => { clearTimeout(timer); resolve(); };
            if (type === "networkidle0") {
                this._networkIdle0Resolver = resolver;
            }
            else {
                this._networkIdle2Resolver = resolver;
            }
        });
    }
    async get(url, options = {}) {
        const mode = this._load_mode_str || options.waitUntil || 'load';
        await this.session.send("Page.navigate", { url });
        if (mode === 'none')
            return;
        if (mode === 'eager' || mode === 'domcontentloaded') {
            await new Promise((resolve, reject) => {
                const timer = setTimeout(() => { cleanup(); resolve(); }, 30000);
                const handler = () => { cleanup(); resolve(); };
                const cleanup = () => { clearTimeout(timer); this.session.off("Page.domContentEventFired", handler); this.session.off("Page.loadEventFired", handler); };
                this.session.on("Page.domContentEventFired", handler);
                this.session.on("Page.loadEventFired", handler);
            });
            return;
        }
        await new Promise((resolve, reject) => {
            const timer = setTimeout(() => { cleanup(); reject(new Error(`Navigation timeout after 30000ms`)); }, options.timeoutMs ?? 30000);
            const handler = () => { cleanup(); resolve(); };
            const cleanup = () => { clearTimeout(timer); this.session.off("Page.loadEventFired", handler); };
            this.session.on("Page.loadEventFired", handler);
        });
    }
    async ele(locator, timeout) {
        const timeoutMs = (timeout ?? Settings_1.Settings.cdp_timeout) * 1000;
        const deadline = Date.now() + timeoutMs;
        while (true) {
            try {
                await this.session.send("DOM.getDocument", { depth: -1 }).catch(() => { });
                const parsed = (0, locator_1.parseLocator)(locator);
                let nodeId = 0;
                let backendNodeId = 0;
                if (parsed.type === 'css') {
                    const { searchId } = await this.session.send("DOM.performSearch", {
                        query: parsed.value,
                        includeUserAgentShadowDOM: true,
                    });
                    const { nodeIds } = await this.session.send("DOM.getSearchResults", {
                        searchId,
                        fromIndex: 0,
                        toIndex: 1,
                    });
                    await this.session.send("DOM.discardSearchResults", { searchId }).catch(() => { });
                    if (nodeIds.length > 0 && nodeIds[0] > 0) {
                        nodeId = nodeIds[0];
                    }
                }
                else {
                    const xpath = parsed.value;
                    const { result } = await this.session.send("Runtime.evaluate", {
                        expression: `(function() { const r = document.evaluate(${JSON.stringify(xpath)}, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null); return r.singleNodeValue; })()`,
                        returnByValue: false,
                    });
                    if (result.objectId) {
                        const nodeResult = await this.session.send("DOM.requestNode", { objectId: result.objectId });
                        nodeId = nodeResult.nodeId;
                        backendNodeId = nodeResult.backendNodeId || 0;
                    }
                }
                if (nodeId > 0) {
                    if (backendNodeId === 0) {
                        const { node } = await this.session.send("DOM.describeNode", { nodeId });
                        backendNodeId = node.backendNodeId;
                    }
                    return new Element_1.Element(this.session, { nodeId, backendNodeId });
                }
            }
            catch { }
            if (Date.now() >= deadline)
                break;
            await new Promise(r => setTimeout(r, 200));
        }
        if (Settings_1.Settings.raise_when_ele_not_found) {
            const { ElementNotFoundError } = await Promise.resolve().then(() => __importStar(require("../errors")));
            throw new ElementNotFoundError(locator);
        }
        return new NoneElement_1.NoneElement("ele", { locator });
    }
    async ele_text(locator) {
        const parsed = (0, locator_1.parseLocator)(locator);
        if (parsed.type === "xpath") {
            const { result } = await this.session.send("Runtime.evaluate", {
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
        if (ele instanceof NoneElement_1.NoneElement)
            return null;
        return await ele.text();
    }
    async ele_html(locator) {
        const parsed = (0, locator_1.parseLocator)(locator);
        if (parsed.type === "xpath") {
            const { result } = await this.session.send("Runtime.evaluate", {
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
        if (ele instanceof NoneElement_1.NoneElement)
            return null;
        return await ele.html;
    }
    async eles_attrs(locator, attrs) {
        const parsed = (0, locator_1.parseLocator)(locator);
        if (parsed.type === "xpath") {
            const { result } = await this.session.send("Runtime.evaluate", {
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
        const results = [];
        for (const ele of elements) {
            const item = {};
            for (const attr of attrs) {
                if (attr === 'text') {
                    item[attr] = await ele.text();
                }
                else if (attr === 'html') {
                    item[attr] = await ele.html;
                }
                else {
                    item[attr] = (await ele.attr(attr)) || '';
                }
            }
            results.push(item);
        }
        return results;
    }
    async eles(locator) {
        await this.session.send("DOM.getDocument", { depth: -1 }).catch(() => { });
        const parsed = (0, locator_1.parseLocator)(locator);
        const query = parsed.value;
        try {
            const { searchId, resultCount } = await this.session.send("DOM.performSearch", {
                query,
                includeUserAgentShadowDOM: true,
            });
            const { nodeIds } = await this.session.send("DOM.getSearchResults", {
                searchId,
                fromIndex: 0,
                toIndex: resultCount || 100000,
            });
            await this.session.send("DOM.discardSearchResults", { searchId }).catch(() => { });
            const elements = [];
            for (const nodeId of nodeIds) {
                if (nodeId > 0) {
                    try {
                        const { node } = await this.session.send("DOM.describeNode", { nodeId });
                        elements.push(new Element_1.Element(this.session, { nodeId, backendNodeId: node.backendNodeId }));
                    }
                    catch { }
                }
            }
            return elements;
        }
        catch {
            return [];
        }
    }
    async runJs(expression, ...args) {
        let asExpr = false;
        let timeout;
        if (args.length > 0 && typeof args[args.length - 1] === 'object' && args[args.length - 1] !== null
            && ('asExpr' in args[args.length - 1] || 'timeout' in args[args.length - 1])) {
            const opts = args.pop();
            asExpr = opts.asExpr ?? false;
            timeout = opts.timeout;
        }
        const endTime = timeout !== undefined ? Date.now() + timeout * 1000 : undefined;
        if (asExpr) {
            const params = {
                expression,
                returnByValue: false,
                awaitPromise: true,
                userGesture: true,
            };
            if (timeout !== undefined)
                params.timeout = timeout * 1000;
            const { result } = await this.session.send("Runtime.evaluate", params);
            return (0, jsResult_1.parseJsResult)({ session: this.session }, result, endTime);
        }
        if (args.length > 0) {
            let funcBody = expression.trim();
            const isFunction = funcBody.startsWith('function') || funcBody.startsWith('(') || funcBody.startsWith('async');
            if (!isFunction) {
                funcBody = `function(){${funcBody}}`;
            }
            const { result: docResult } = await this.session.send("Runtime.evaluate", {
                expression: "document",
                returnByValue: false,
            });
            const params = {
                functionDeclaration: funcBody,
                objectId: docResult.objectId,
                arguments: args.map(a => (0, jsResult_1.convertArgument)(a)),
                returnByValue: false,
                awaitPromise: true,
                userGesture: true,
            };
            if (timeout !== undefined)
                params.timeout = timeout * 1000;
            const { result } = await this.session.send("Runtime.callFunctionOn", params);
            return (0, jsResult_1.parseJsResult)({ session: this.session }, result, endTime);
        }
        let wrappedExpression = expression.trim();
        if (!wrappedExpression.startsWith('return ') &&
            !wrappedExpression.includes('\n') &&
            !wrappedExpression.startsWith('(') &&
            !wrappedExpression.startsWith('{')) {
            wrappedExpression = `return ${wrappedExpression}`;
        }
        const finalExpression = `(function() { ${wrappedExpression} })()`;
        const params = {
            expression: finalExpression,
            returnByValue: false,
            awaitPromise: true,
            userGesture: true,
        };
        if (timeout !== undefined)
            params.timeout = timeout * 1000;
        const { result } = await this.session.send("Runtime.evaluate", params);
        return (0, jsResult_1.parseJsResult)({ session: this.session }, result, endTime);
    }
    async html() {
        const { result } = await this.session.send("Runtime.evaluate", {
            expression: "document.documentElement.outerHTML",
            returnByValue: true,
        });
        return result.value;
    }
    async title() {
        const { result } = await this.session.send("Runtime.evaluate", {
            expression: "document.title || ''",
            returnByValue: true,
        });
        return result.value;
    }
    async url() {
        return this.runJs("document.location.href || ''");
    }
    async json() {
        const htmlText = await this.runJs("document.body?.innerText || ''");
        try {
            return JSON.parse(htmlText);
        }
        catch {
            throw new Error("页面内容不是有效的 JSON");
        }
    }
    async cookies(allDomains = false, allInfo = false) {
        const cdpMethod = allDomains ? 'Storage.getCookies' : 'Network.getCookies';
        let params = {};
        if (!allDomains) {
            const currentUrl = await this.url();
            if (currentUrl)
                params.urls = [currentUrl];
        }
        const { cookies } = await this.session.send(cdpMethod, params);
        if (allInfo) {
            return cookies;
        }
        return cookies.map((c) => ({
            name: c.name,
            value: c.value,
            domain: c.domain,
        }));
    }
    async set_cookies(cookies) {
        for (const cookie of cookies) {
            await this.session.send("Network.setCookie", {
                name: cookie.name,
                value: cookie.value,
                domain: cookie.domain,
                path: cookie.path || "/",
            });
        }
    }
    async refresh(ignoreCache = false) {
        await this.session.send("Page.reload", { ignoreCache });
        await new Promise((resolve, reject) => {
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
    async back(steps = 1) {
        await this._forward_or_back(-steps);
    }
    async forward(steps = 1) {
        await this._forward_or_back(steps);
    }
    async _forward_or_back(steps) {
        if (steps === 0)
            return;
        const { currentIndex, entries } = await this.session.send("Page.getNavigationHistory");
        const direction = steps > 0 ? 1 : -1;
        const absSteps = Math.abs(steps);
        let count = 0;
        let targetIndex = currentIndex;
        for (let i = currentIndex + direction; i >= 0 && i < entries.length; i += direction) {
            if (entries[i].url !== entries[targetIndex].url) {
                count++;
                targetIndex = i;
                if (count >= absSteps)
                    break;
            }
        }
        if (count > 0 && targetIndex !== currentIndex) {
            await this.session.send("Page.navigateToHistoryEntry", { entryId: entries[targetIndex].id });
        }
    }
    async scroll_to(x, y) {
        await this.session.send("Runtime.evaluate", {
            expression: `window.scrollTo(${x}, ${y});`,
        });
    }
    async scroll_to_top() {
        await this.scroll_to(0, 0);
    }
    async scroll_to_bottom() {
        await this.session.send("Runtime.evaluate", {
            expression: "window.scrollTo(0, document.body.scrollHeight);",
        });
    }
    async handle_alert(accept = true, send, timeout, nextOne = false) {
        if (nextOne) {
            this._alert_auto = { accept: accept === true, text: send };
            return '';
        }
        const timeoutMs = (timeout ?? Settings_1.Settings.cdp_timeout) * 1000;
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
            if (this._has_alert)
                break;
            await new Promise(r => setTimeout(r, 50));
        }
        if (!this._has_alert)
            return false;
        const resText = this._alert_text || '';
        if (typeof accept !== 'boolean') {
            return resText;
        }
        const params = { accept };
        if (send !== undefined) {
            params.promptText = send;
        }
        try {
            await this.session.send("Page.handleJavaScriptDialog", params);
        }
        catch { }
        while (this._has_alert) {
            await new Promise(r => setTimeout(r, 10));
        }
        return resText;
    }
    async screenshot(path) {
        const { data } = await this.session.send("Page.captureScreenshot", {
            format: "png",
        });
        const buffer = Buffer.from(data, "base64");
        if (path) {
            const fs = await Promise.resolve().then(() => __importStar(require("fs")));
            fs.writeFileSync(path, buffer);
        }
        return buffer;
    }
    async get_screenshot(options = {}) {
        const { path, name, asBytes, asBase64, fullPage, leftTop, rightBottom } = options;
        let picType = 'png';
        if (asBytes) {
            if (asBytes === true) {
                picType = 'png';
            }
            else {
                picType = asBytes === 'jpg' ? 'jpeg' : asBytes;
            }
        }
        else if (asBase64) {
            if (asBase64 === true) {
                picType = 'png';
            }
            else {
                picType = asBase64 === 'jpg' ? 'jpeg' : asBase64;
            }
        }
        else {
            picType = 'png';
        }
        const params = { format: picType };
        if (fullPage) {
            params.captureBeyondViewport = true;
            const { result } = await this.session.send("Page.getLayoutMetrics");
            const { width, height } = result.contentSize;
            if (width === 0 || height === 0) {
                throw new Error('Page size is 0, cannot take screenshot.');
            }
            params.clip = { x: 0, y: 0, width, height, scale: 1 };
        }
        else if (leftTop || rightBottom) {
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
        const { data } = await this.session.send("Page.captureScreenshot", params);
        const buffer = Buffer.from(data, "base64");
        if (asBase64)
            return data;
        if (asBytes)
            return buffer;
        if (path) {
            const fs = await Promise.resolve().then(() => __importStar(require("fs")));
            const pathModule = await Promise.resolve().then(() => __importStar(require("path")));
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
    async _getViewportSize() {
        try {
            const { result } = await this.session.send("Runtime.evaluate", {
                expression: "JSON.stringify({x: window.innerWidth, y: window.innerHeight})",
                returnByValue: true,
            });
            return JSON.parse(result.value);
        }
        catch {
            return { x: 1280, y: 720 };
        }
    }
    async get_frame(_frameId) {
        return new Page(this.session);
    }
    async get_frames() {
        const { frameTree } = await this.session.send("Page.getFrameTree");
        const frames = [
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
    async stop_loading() {
        await this.session.send("Page.stopLoading");
    }
    async reload() {
        await this.session.send("Page.reload");
    }
    async set_geolocation(latitude, longitude, accuracy = 100) {
        await this.session.send("Emulation.setGeolocationOverride", {
            latitude,
            longitude,
            accuracy,
        });
    }
    async clear_geolocation() {
        await this.session.send("Emulation.clearGeolocationOverride");
    }
}
exports.Page = Page;
