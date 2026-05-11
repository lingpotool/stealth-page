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
exports.ChromiumBase = void 0;
const Element_1 = require("../core/Element");
const NoneElement_1 = require("../core/NoneElement");
const SessionElement_1 = require("../core/SessionElement");
const Timeout_1 = require("../units/Timeout");
const ChromiumPageSetter_1 = require("./ChromiumPageSetter");
const ChromiumPageWaiter_1 = require("./ChromiumPageWaiter");
const ChromiumPageActions_1 = require("./ChromiumPageActions");
const ChromiumPageListener_1 = require("./ChromiumPageListener");
const ChromiumPageDownloader_1 = require("./ChromiumPageDownloader");
const ChromiumFrame_1 = require("./ChromiumFrame");
const PageScroller_1 = require("../units/PageScroller");
const PageStates_1 = require("../units/PageStates");
const PageRect_1 = require("../units/PageRect");
const Console_1 = require("../units/Console");
const Screencast_1 = require("../units/Screencast");
const CookiesSetter_1 = require("../units/CookiesSetter");
const WindowSetter_1 = require("../units/WindowSetter");
const cheerio_1 = require("cheerio");
const web_1 = require("../core/web");
const locator_1 = require("../core/locator");
class ChromiumBase {
    constructor(browser) {
        this._page = null;
        this._setter = null;
        this._waiter = null;
        this._actions = null;
        this._listener = null;
        this._downloader = null;
        this._scroller = null;
        this._states = null;
        this._rect = null;
        this._console = null;
        this._screencast = null;
        this._cookiesSetter = null;
        this._windowSetter = null;
        this._initScripts = new Map();
        this._timeouts = null;
        this._upload_list = null;
        this._browser = browser;
    }
    get browser() {
        return this._browser;
    }
    get driver() {
        return this._page?.cdpSession ?? null;
    }
    get _target_id() {
        return this._page?._target_id ?? this.tab_id ?? '';
    }
    get _browser_url() {
        return this._browser.options.address;
    }
    get set() {
        if (!this._setter) {
            this._setter = new ChromiumPageSetter_1.ChromiumPageSetter(this);
        }
        return this._setter;
    }
    get wait() {
        if (!this._waiter) {
            this._waiter = new ChromiumPageWaiter_1.ChromiumPageWaiter(this);
        }
        const waiter = this._waiter;
        const callable = async (second, scope) => {
            return waiter.wait(second, scope);
        };
        Object.setPrototypeOf(callable, Object.getPrototypeOf(waiter));
        Object.assign(callable, waiter);
        for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(waiter))) {
            if (key !== 'constructor' && typeof waiter[key] === 'function') {
                callable[key] = waiter[key].bind(waiter);
            }
        }
        return callable;
    }
    get actions() {
        if (!this._actions) {
            this._actions = new ChromiumPageActions_1.ChromiumPageActions(this);
        }
        return this._actions;
    }
    get listen() {
        if (!this._listener) {
            this._listener = new ChromiumPageListener_1.ChromiumPageListener(this);
        }
        return this._listener;
    }
    get download() {
        if (!this._downloader) {
            this._downloader = new ChromiumPageDownloader_1.ChromiumPageDownloader(this.tab_id, this._browser?.browser?._dl_mgr, this._browser?.download_path || '.');
        }
        return this._downloader;
    }
    get scroll() {
        if (!this._scroller && this._page) {
            this._scroller = new PageScroller_1.PageScroller({ cdpSession: this._page.cdpSession });
        }
        return this._scroller;
    }
    get states() {
        if (!this._states && this._page) {
            this._states = new PageStates_1.PageStates({ cdpSession: this._page.cdpSession });
        }
        return this._states;
    }
    get rect() {
        if (!this._rect && this._page) {
            this._rect = new PageRect_1.PageRect({ cdpSession: this._page.cdpSession });
        }
        return this._rect;
    }
    get console() {
        if (!this._console && this._page) {
            this._console = new Console_1.Console({ cdpSession: this._page.cdpSession });
        }
        return this._console;
    }
    get screencast() {
        if (!this._screencast && this._page) {
            this._screencast = new Screencast_1.Screencast({ cdpSession: this._page.cdpSession });
        }
        return this._screencast;
    }
    get cookies_setter() {
        if (!this._cookiesSetter && this._page) {
            this._cookiesSetter = new CookiesSetter_1.CookiesSetter({ cdpSession: this._page.cdpSession });
        }
        return this._cookiesSetter;
    }
    get window() {
        if (!this._windowSetter && this._page) {
            this._windowSetter = new WindowSetter_1.WindowSetter({ cdpSession: this._page.cdpSession });
        }
        return this._windowSetter;
    }
    get timeout() {
        return this._browser.options.timeouts.base;
    }
    get timeouts() {
        if (!this._timeouts) {
            this._timeouts = new Timeout_1.Timeout();
        }
        return this._timeouts;
    }
    get retry_times() {
        return this._browser.options.retryTimes ?? 3;
    }
    get retry_interval() {
        return this._browser.options.retryInterval ?? 2;
    }
    get load_mode_value() {
        return this._browser.options.loadMode ?? "normal";
    }
    get load_mode() {
        return (this._browser.options.loadMode ?? "normal");
    }
    async user_agent() {
        await this.init();
        const { result } = await this._page.cdpSession.send("Runtime.evaluate", {
            expression: "navigator.userAgent",
            returnByValue: true,
        });
        return result.value;
    }
    async get(url, options) {
        await this.init();
        const retry = options?.retry ?? this._browser.options.retryTimes ?? 0;
        const interval = options?.interval ?? this._browser.options.retryInterval ?? 1;
        const timeoutMs = (options?.timeout ?? this._browser.options.timeouts.pageLoad) * 1000;
        for (let i = 0; i <= retry; i++) {
            try {
                await this._page.get(url, { timeoutMs });
                return true;
            }
            catch (e) {
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
    async refresh(ignoreCache = false) {
        await this.init();
        if (ignoreCache) {
            await this._page.cdpSession.send("Page.reload", { ignoreCache: true });
        }
        else {
            await this._page.refresh();
        }
    }
    async back(steps = 1) {
        await this.init();
        await this._forward_or_back(-steps);
    }
    async forward(steps = 1) {
        await this.init();
        await this._forward_or_back(steps);
    }
    async _forward_or_back(steps) {
        if (!this._page)
            return;
        const direction = steps > 0 ? 1 : -1;
        const absSteps = Math.abs(steps);
        const currentUrl = await this.url();
        for (let i = 0; i < absSteps; i++) {
            if (direction > 0) {
                await this._page.forward();
            }
            else {
                await this._page.back();
            }
            await new Promise(r => setTimeout(r, 50));
            const newUrl = await this.url();
            if (newUrl !== currentUrl)
                return;
        }
    }
    async js_ready_state() {
        await this.init();
        try {
            const { result } = await this._page.cdpSession.send("Runtime.evaluate", {
                expression: "document.readyState",
                returnByValue: true,
            });
            return result.value;
        }
        catch {
            return 'unknown';
        }
    }
    async stop_loading() {
        await this.init();
        await this._page.stop_loading();
    }
    async html() {
        await this.init();
        return this._page.html();
    }
    async json() {
        await this.init();
        const text = await this._page.html();
        try {
            const match = text.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
            const content = match ? match[1] : text.replace(/<[^>]+>/g, '');
            return JSON.parse(content);
        }
        catch {
            return null;
        }
    }
    async title() {
        await this.init();
        return this._page.title();
    }
    async url() {
        await this.init();
        return this._page.url();
    }
    async cookies(allDomains = false, allInfo = false) {
        await this.init();
        if (allDomains) {
            const { cookies } = await this._page.cdpSession.send("Storage.getCookies", {
                browserContextId: undefined,
            });
            return cookies;
        }
        const { cookies } = await this._page.cdpSession.send("Network.getCookies");
        return allInfo ? cookies : cookies.map(c => ({ name: c.name, value: c.value, domain: c.domain, path: c.path }));
    }
    async set_cookies(cookies) {
        await this.init();
        for (const cookie of cookies) {
            await this._page.cdpSession.send("Network.setCookie", cookie);
        }
    }
    async ele(locator, index = 1, timeout) {
        await this.init();
        if (index !== 1) {
            const all = await this._page.eles(locator);
            const idx = index > 0 ? index - 1 : all.length + index;
            const result = all[idx] ?? null;
            if (!result) {
                if (NoneElement_1.NoneElement.raiseWhenNotFound) {
                    const { ElementNotFoundError } = await Promise.resolve().then(() => __importStar(require("../errors")));
                    throw new ElementNotFoundError(locator);
                }
                return new NoneElement_1.NoneElement("ele", { locator, index });
            }
            return result;
        }
        return this._page.ele(locator);
    }
    async call(locator, index = 1, timeout) {
        return this.ele(locator, index, timeout);
    }
    async eles(locator, timeout) {
        await this.init();
        return this._page.eles(locator);
    }
    async s_ele(locator, index = 1, timeout) {
        await this.init();
        const htmlContent = await this._page.html();
        const $ = (0, cheerio_1.load)(htmlContent);
        const parsed = (0, locator_1.parseLocator)(locator);
        let nodes;
        if (parsed.type === "css") {
            nodes = $(parsed.value).toArray();
        }
        else {
            nodes = _cheerioXPathFallback($, parsed.value);
        }
        const idx = index > 0 ? index - 1 : nodes.length + index;
        const node = nodes[idx];
        return node ? new SessionElement_1.SessionElement($, node) : null;
    }
    async s_eles(locator, timeout) {
        await this.init();
        const htmlContent = await this._page.html();
        const $ = (0, cheerio_1.load)(htmlContent);
        const parsed = (0, locator_1.parseLocator)(locator);
        let nodes;
        if (parsed.type === "css") {
            nodes = $(parsed.value).toArray();
        }
        else {
            nodes = _cheerioXPathFallback($, parsed.value);
        }
        return nodes.map((node) => new SessionElement_1.SessionElement($, node));
    }
    async run_js(script, ...args) {
        await this.init();
        return this._page.runJs(script, ...args);
    }
    async run_js_loaded(script, ...args) {
        await this.init();
        await this._page.cdpSession.send("Runtime.evaluate", {
            expression: "new Promise(r => document.readyState === 'complete' ? r() : window.addEventListener('load', r))",
            awaitPromise: true,
        });
        return this._page.runJs(script, ...args);
    }
    async run_async_js(script, ...args) {
        await this.init();
        let asExpr = false;
        if (args.length > 0 && typeof args[args.length - 1] === 'object' && args[args.length - 1] !== null
            && 'asExpr' in args[args.length - 1]) {
            asExpr = args.pop().asExpr ?? false;
        }
        if (asExpr) {
            await this._page.cdpSession.send("Runtime.evaluate", { expression: script, awaitPromise: false });
            return;
        }
        if (args.length > 0) {
            const { result: docResult } = await this._page.cdpSession.send("Runtime.evaluate", {
                expression: "document", returnByValue: false,
            });
            const isFunction = script.trim().startsWith('function') || script.trim().startsWith('(') || script.trim().startsWith('async');
            const funcBody = isFunction ? script : `function(){${script}}`;
            await this._page.cdpSession.send("Runtime.callFunctionOn", {
                functionDeclaration: funcBody,
                objectId: docResult.objectId,
                arguments: args.map(a => ({ value: a })),
                returnByValue: false,
                awaitPromise: false,
            });
        }
        else {
            await this._page.cdpSession.send("Runtime.evaluate", { expression: script, awaitPromise: false });
        }
    }
    async run_cdp(cmd, params = {}) {
        await this.init();
        return this._page.cdpSession.send(cmd, params);
    }
    async _run_cdp(cmd, params = {}) {
        return this.run_cdp(cmd, params);
    }
    async run_cdp_loaded(cmd, params = {}) {
        await this.init();
        await this._wait_loaded();
        return this._page.cdpSession.send(cmd, params);
    }
    async _run_cdp_loaded(cmd, params = {}) {
        return this.run_cdp_loaded(cmd, params);
    }
    async _run_js(script, ...args) {
        return this.run_js(script, ...args);
    }
    async _run_js_loaded(script, ...args) {
        return this.run_js_loaded(script, ...args);
    }
    async _wait_loaded(timeout) {
        await this.init();
        const timeoutMs = (timeout ?? this._browser.options.timeouts.pageLoad) * 1000;
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
            try {
                const { result } = await this._page.cdpSession.send("Runtime.evaluate", {
                    expression: "document.readyState",
                    returnByValue: true,
                });
                if (result.value === 'complete' || result.value === 'interactive') {
                    return true;
                }
            }
            catch { }
            await new Promise(r => setTimeout(r, 50));
        }
        await this.stop_loading();
        return false;
    }
    async _handle_alert(accept = true, send, timeout, nextOne = false) {
        return this.handle_alert(accept, send, timeout, nextOne);
    }
    _on_alert_open(_event = {}) { }
    _on_alert_close(_event = {}) { }
    async _find_elements(locator, timeout, index, relative = false, raiseErr) {
        if (locator instanceof Element_1.Element)
            return locator;
        if (index === undefined || index === null) {
            return this.eles(locator, timeout);
        }
        if (index === 1) {
            const el = await this.ele(locator, 1, timeout);
            if (el instanceof NoneElement_1.NoneElement) {
                if (raiseErr ?? NoneElement_1.NoneElement.raiseWhenNotFound) {
                    const { ElementNotFoundError } = await Promise.resolve().then(() => __importStar(require("../errors")));
                    throw new ElementNotFoundError(locator);
                }
            }
            return el;
        }
        const all = await this.eles(locator, timeout);
        const idx = index > 0 ? index - 1 : all.length + index;
        const result = all[idx] ?? null;
        if (!result) {
            if (raiseErr ?? NoneElement_1.NoneElement.raiseWhenNotFound) {
                const { ElementNotFoundError } = await Promise.resolve().then(() => __importStar(require("../errors")));
                throw new ElementNotFoundError(locator);
            }
            return new NoneElement_1.NoneElement("ele", { locator, index });
        }
        return result;
    }
    disconnect() {
        if (this._page) {
            this._page.cdpSession.close?.();
            this._page = null;
        }
    }
    async reconnect(wait = 0) {
        this.disconnect();
        if (wait > 0) {
            await new Promise(r => setTimeout(r, wait * 1000));
        }
        await this.init();
    }
    async handle_alert(accept = true, send, timeout, nextOne = false) {
        await this.init();
        return this._page.handle_alert(accept, send, timeout, nextOne);
    }
    async screenshot(path) {
        await this.init();
        return this._page.screenshot(path);
    }
    async get_screenshot(path, name, asBytes, asBase64, fullPage = false, leftTop, rightBottom) {
        await this.init();
        return this._get_screenshot(path, name, asBytes, asBase64, fullPage, leftTop, rightBottom);
    }
    async _get_screenshot(path, name, asBytes, asBase64, fullPage = false, leftTop, rightBottom, ele) {
        await this.init();
        let picType = 'png';
        if (asBytes) {
            picType = asBytes === true ? 'png' : (asBytes === 'jpg' ? 'jpeg' : asBytes);
        }
        else if (asBase64) {
            picType = asBase64 === true ? 'png' : (asBase64 === 'jpg' ? 'jpeg' : asBase64);
        }
        const clipParams = {};
        if (leftTop || rightBottom) {
            const layoutMetrics = await this._page.cdpSession.send("Page.getLayoutMetrics");
            const viewport = layoutMetrics.cssVisualViewport;
            const scale = viewport.scaleX || 1;
            clipParams.clip = {
                x: (leftTop ? leftTop[0] : 0) / scale,
                y: (leftTop ? leftTop[1] : 0) / scale,
                width: ((rightBottom ? rightBottom[0] : viewport.width) - (leftTop ? leftTop[0] : 0)) / scale,
                height: ((rightBottom ? rightBottom[1] : viewport.height) - (leftTop ? leftTop[1] : 0)) / scale,
                scale: 1,
            };
        }
        else if (ele) {
            await ele._ensureBackendNodeId();
            const backendNodeId = ele.backendNodeId;
            if (backendNodeId > 0) {
                const { model } = await this._page.cdpSession.send("DOM.getBoxModel", { backendNodeId });
                clipParams.clip = {
                    x: model.content[0],
                    y: model.content[1],
                    width: model.content[4] - model.content[0],
                    height: model.content[5] - model.content[1],
                    scale: 1,
                };
            }
        }
        const screenshotParams = {
            format: picType === 'jpeg' ? 'jpeg' : 'png',
            quality: picType === 'jpeg' ? 80 : undefined,
        };
        if (fullPage) {
            screenshotParams.captureBeyondViewport = true;
        }
        if (clipParams.clip) {
            screenshotParams.clip = clipParams.clip;
        }
        const { data } = await this._page.cdpSession.send("Page.captureScreenshot", screenshotParams);
        const buffer = Buffer.from(data, "base64");
        if (asBase64)
            return data;
        if (asBytes)
            return buffer;
        if (path) {
            const fs = await Promise.resolve().then(() => __importStar(require("fs")));
            const pathModule = await Promise.resolve().then(() => __importStar(require("path")));
            const ext = `.${picType === 'jpeg' ? 'jpg' : picType}`;
            const fileName = name || `screenshot${ext}`;
            const fullPath = pathModule.join(path, fileName);
            fs.writeFileSync(fullPath, buffer);
            return fullPath;
        }
        return buffer;
    }
    async get_frames() {
        await this.init();
        return this._page.get_frames();
    }
    async get_frame(locIndEle) {
        await this.init();
        const frames = await this._page.get_frames();
        if (typeof locIndEle === "number") {
            const idx = locIndEle > 0 ? locIndEle - 1 : frames.length + locIndEle;
            const frameInfo = frames[idx];
            if (!frameInfo)
                return null;
            const iframes = await this.eles("iframe, frame");
            const frameEle = iframes[idx];
            if (!frameEle)
                return null;
            return new ChromiumFrame_1.ChromiumFrame(this._page.cdpSession, frameInfo.id, frameEle);
        }
        if (locIndEle instanceof Element_1.Element) {
            await locIndEle.getObjectId();
            const backendId = locIndEle.backendNodeId;
            if (backendId > 0) {
                try {
                    const { node } = await this._page.cdpSession.send("DOM.describeNode", {
                        backendNodeId: backendId,
                    });
                    if (node.frameId) {
                        return new ChromiumFrame_1.ChromiumFrame(this._page.cdpSession, node.frameId, locIndEle);
                    }
                }
                catch { }
            }
            const src = await locIndEle.attr("src");
            const name = await locIndEle.attr("name");
            const srcdoc = await locIndEle.attr("srcdoc");
            for (const frameInfo of frames) {
                if ((src && frameInfo.url === src) || (name && frameInfo.name === name)) {
                    return new ChromiumFrame_1.ChromiumFrame(this._page.cdpSession, frameInfo.id, locIndEle);
                }
                if (srcdoc && frameInfo.url === "about:srcdoc") {
                    return new ChromiumFrame_1.ChromiumFrame(this._page.cdpSession, frameInfo.id, locIndEle);
                }
            }
            return null;
        }
        const frameEle = await this.ele(locIndEle);
        if (frameEle instanceof NoneElement_1.NoneElement)
            return null;
        await frameEle.getObjectId();
        const backendId = frameEle.backendNodeId;
        if (backendId > 0) {
            try {
                const { node } = await this._page.cdpSession.send("DOM.describeNode", {
                    backendNodeId: backendId,
                });
                if (node.frameId) {
                    return new ChromiumFrame_1.ChromiumFrame(this._page.cdpSession, node.frameId, frameEle);
                }
            }
            catch { }
        }
        const src = await frameEle.attr("src");
        const name = await frameEle.attr("name");
        const srcdoc = await frameEle.attr("srcdoc");
        for (const frameInfo of frames) {
            if ((src && frameInfo.url === src) || (name && frameInfo.name === name)) {
                return new ChromiumFrame_1.ChromiumFrame(this._page.cdpSession, frameInfo.id, frameEle);
            }
            if (srcdoc && frameInfo.url === "about:srcdoc") {
                return new ChromiumFrame_1.ChromiumFrame(this._page.cdpSession, frameInfo.id, frameEle);
            }
        }
        return null;
    }
    async session_storage(item) {
        await this.init();
        if (item) {
            const { result } = await this._page.cdpSession.send("Runtime.evaluate", {
                expression: `sessionStorage.getItem(${JSON.stringify(item)})`, returnByValue: true,
            });
            return result.value;
        }
        const { result } = await this._page.cdpSession.send("Runtime.evaluate", {
            expression: `(() => { const obj = {}; for (let i = 0; i < sessionStorage.length; i++) { const key = sessionStorage.key(i); obj[key] = sessionStorage.getItem(key); } return obj; })()`,
            returnByValue: true,
        });
        return result.value;
    }
    async local_storage(item) {
        await this.init();
        if (item) {
            const { result } = await this._page.cdpSession.send("Runtime.evaluate", {
                expression: `localStorage.getItem(${JSON.stringify(item)})`, returnByValue: true,
            });
            return result.value;
        }
        const { result } = await this._page.cdpSession.send("Runtime.evaluate", {
            expression: `(() => { const obj = {}; for (let i = 0; i < localStorage.length; i++) { const key = localStorage.key(i); obj[key] = localStorage.getItem(key); } return obj; })()`,
            returnByValue: true,
        });
        return result.value;
    }
    async clear_cache(options = {}) {
        await this.init();
        const { sessionStorage: ss = true, localStorage: ls = true, cache = true, cookies = true } = options;
        if (ss && ls && cache && cookies) {
            try {
                await this._page.cdpSession.send("Storage.clearDataForOrigin", { origin: "*", storageTypes: "all" });
                return;
            }
            catch { }
        }
        if (ss || ls) {
            try {
                await this._page.cdpSession.send("DOMStorage.enable");
                const { storageKey } = await this._page.cdpSession.send("Storage.getStorageKeyForFrame", {
                    frameId: this._page._target_id || '',
                });
                if (ss) {
                    await this._page.cdpSession.send("DOMStorage.clear", {
                        storageId: { storageKey, isLocalStorage: false },
                    });
                }
                if (ls) {
                    await this._page.cdpSession.send("DOMStorage.clear", {
                        storageId: { storageKey, isLocalStorage: true },
                    });
                }
                await this._page.cdpSession.send("DOMStorage.disable");
            }
            catch { }
        }
        if (cache) {
            try {
                await this._page.cdpSession.send("Network.clearBrowserCache");
            }
            catch { }
        }
        if (cookies) {
            try {
                await this._page.cdpSession.send("Network.clearBrowserCookies");
            }
            catch { }
        }
    }
    async find(locators, options = {}) {
        await this.init();
        const { anyOne = true, firstEle = true, timeout } = options;
        const actualTimeout = timeout ?? this.timeout;
        const result = new Map();
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
                    if (ele && anyOne)
                        return result;
                }
                catch {
                    result.set(loc, null);
                }
            }
            return result;
        }
        const endTime = Date.now() + actualTimeout * 1000;
        while (Date.now() <= endTime) {
            for (const loc of locators) {
                if (result.get(loc))
                    continue;
                try {
                    const ele = firstEle
                        ? await this.ele(loc)
                        : await this.eles(loc);
                    result.set(loc, ele);
                    if (ele && anyOne)
                        return result;
                }
                catch {
                    result.set(loc, null);
                }
            }
            let allFound = true;
            for (const loc of locators) {
                if (!result.get(loc)) {
                    allFound = false;
                    break;
                }
            }
            if (allFound)
                return result;
            await new Promise(r => setTimeout(r, 50));
        }
        return result;
    }
    async add_init_js(script) {
        await this.init();
        const { identifier } = await this._page.cdpSession.send("Page.addScriptToEvaluateOnNewDocument", { source: script });
        this._initScripts.set(identifier, script);
        return identifier;
    }
    async save_page(options = {}) {
        await this.init();
        const { path, name, asPdf = false, pdfOptions } = options;
        if (asPdf) {
            return (0, web_1.get_pdf)(this._page, path, name, pdfOptions);
        }
        return (0, web_1.get_mhtml)(this._page, path, name);
    }
    async remove_init_js(scriptId) {
        await this.init();
        if (scriptId) {
            await this._page.cdpSession.send("Page.removeScriptToEvaluateOnNewDocument", { identifier: scriptId });
            this._initScripts.delete(scriptId);
        }
        else {
            for (const id of this._initScripts.keys()) {
                await this._page.cdpSession.send("Page.removeScriptToEvaluateOnNewDocument", { identifier: id });
            }
            this._initScripts.clear();
        }
    }
    async active_ele() {
        await this.init();
        await this._page.cdpSession.send("DOM.getDocument", { depth: -1 });
        const { result } = await this._page.cdpSession.send("Runtime.evaluate", {
            expression: "document.activeElement",
        });
        if (!result.objectId)
            return null;
        const { nodeId } = await this._page.cdpSession.send("DOM.requestNode", { objectId: result.objectId });
        return new Element_1.Element(this._page.cdpSession, { nodeId });
    }
    get upload_list() {
        return this._upload_list;
    }
    set upload_list(files) {
        this._upload_list = files;
        if (files && this._page) {
            this._page.cdpSession.on('Page.fileChooserOpened', async (params) => {
                if (this._upload_list && params.backendNodeId) {
                    const fileList = params.mode === 'selectMultiple' ? this._upload_list : this._upload_list.slice(0, 1);
                    try {
                        await this._page.cdpSession.send('DOM.setFileInputFiles', {
                            files: fileList,
                            backendNodeId: params.backendNodeId,
                        });
                    }
                    catch { }
                    this._upload_list = null;
                    try {
                        await this._page.cdpSession.send('Page.setInterceptFileChooserDialog', { enabled: false });
                    }
                    catch { }
                }
            });
            try {
                this._page.cdpSession.send('Page.setInterceptFileChooserDialog', { enabled: true }).catch(() => { });
            }
            catch { }
        }
    }
    async remove_ele(locOrEle) {
        await this.init();
        let ele;
        if (typeof locOrEle === "string") {
            ele = await this.ele(locOrEle);
        }
        else {
            ele = locOrEle;
        }
        if (ele && !(ele instanceof NoneElement_1.NoneElement)) {
            const objectId = await ele.getObjectId();
            await this._page.cdpSession.send("Runtime.callFunctionOn", {
                objectId, functionDeclaration: "function() { this.remove(); }",
            });
        }
    }
    async add_ele(htmlOrInfo, insertTo, before) {
        await this.init();
        let html;
        if (typeof htmlOrInfo === "string") {
            html = htmlOrInfo;
        }
        else {
            const attrs = htmlOrInfo.attrs ? Object.entries(htmlOrInfo.attrs).map(([k, v]) => `${k}="${v}"`).join(" ") : "";
            html = `<${htmlOrInfo.tag} ${attrs}></${htmlOrInfo.tag}>`;
        }
        let parentEle = null;
        if (insertTo) {
            const found = typeof insertTo === "string" ? await this.ele(insertTo) : insertTo;
            parentEle = found instanceof NoneElement_1.NoneElement ? null : found;
        }
        if (!parentEle) {
            const body = await this.ele("body");
            parentEle = body instanceof NoneElement_1.NoneElement ? null : body;
        }
        if (!parentEle || parentEle instanceof NoneElement_1.NoneElement)
            return null;
        const parentObjectId = await parentEle.getObjectId();
        const { result } = await this._page.cdpSession.send("Runtime.callFunctionOn", {
            objectId: parentObjectId,
            functionDeclaration: `function(html, beforeSelector) { const temp = document.createElement('div'); temp.innerHTML = html; const newEle = temp.firstElementChild; if (!newEle) return null; if (beforeSelector) { const beforeEle = this.querySelector(beforeSelector); if (beforeEle) { this.insertBefore(newEle, beforeEle); } else { this.appendChild(newEle); } } else { this.appendChild(newEle); } return newEle; }`,
            arguments: [{ value: html }, { value: before ? (typeof before === "string" ? before : null) : null }],
        });
        if (!result.objectId)
            return null;
        await this._page.cdpSession.send("DOM.getDocument", { depth: -1 });
        const { nodeId } = await this._page.cdpSession.send("DOM.requestNode", { objectId: result.objectId });
        return new Element_1.Element(this._page.cdpSession, { nodeId });
    }
    async save(options = {}) {
        await this.init();
        const { asPdf = false, path, name } = options;
        if (asPdf) {
            const { data } = await this._page.cdpSession.send("Page.printToPDF", {
                landscape: options.landscape, printBackground: options.printBackground ?? true, scale: options.scale ?? 1,
                paperWidth: options.paperWidth ?? 8.5, paperHeight: options.paperHeight ?? 11,
                marginTop: options.marginTop ?? 0.4, marginBottom: options.marginBottom ?? 0.4,
                marginLeft: options.marginLeft ?? 0.4, marginRight: options.marginRight ?? 0.4, pageRanges: options.pageRanges,
            });
            const buffer = Buffer.from(data, "base64");
            if (path || name) {
                const fs = await Promise.resolve().then(() => __importStar(require("fs")));
                const pathModule = await Promise.resolve().then(() => __importStar(require("path")));
                let fullPath;
                if (path && pathModule.extname(path)) {
                    fullPath = path;
                }
                else {
                    fullPath = path ? pathModule.join(path, name || "page.pdf") : (name || "page.pdf");
                }
                const dir = pathModule.dirname(fullPath);
                fs.mkdirSync(dir, { recursive: true });
                fs.writeFileSync(fullPath, buffer);
                return fullPath;
            }
            return buffer;
        }
        else {
            const { data } = await this._page.cdpSession.send("Page.captureSnapshot", { format: "mhtml" });
            if (path || name) {
                const fs = await Promise.resolve().then(() => __importStar(require("fs")));
                const pathModule = await Promise.resolve().then(() => __importStar(require("path")));
                let fullPath;
                if (path && pathModule.extname(path)) {
                    fullPath = path;
                }
                else {
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
    async browser_version() {
        await this.init();
        const { product } = await this._page.cdpSession.send("Browser.getVersion");
        return product;
    }
    async ele_text(locator) {
        const el = await this.ele(locator);
        if (el instanceof NoneElement_1.NoneElement)
            return null;
        return el.text();
    }
    async ele_html(locator) {
        const el = await this.ele(locator);
        if (el instanceof NoneElement_1.NoneElement)
            return null;
        return el.html;
    }
    async eles_attrs(locator, attrs) {
        const elements = await this.eles(locator);
        const results = [];
        for (const el of elements) {
            const record = {};
            for (const attr of attrs) {
                const val = await el.attr(attr);
                record[attr] = val || '';
            }
            results.push(record);
        }
        return results;
    }
    async scroll_to(x, y) {
        await this.init();
        await this._page.cdpSession.send("Runtime.evaluate", {
            expression: `window.scrollTo(${x}, ${y})`,
        });
    }
    async scroll_to_top() {
        await this.init();
        await this._page.cdpSession.send("Runtime.evaluate", { expression: "window.scrollTo(0, 0)" });
    }
    async scroll_to_bottom() {
        await this.init();
        await this._page.cdpSession.send("Runtime.evaluate", {
            expression: "window.scrollTo(0, document.documentElement.scrollHeight)",
        });
    }
    async reload(ignoreCache = false) {
        return this.refresh(ignoreCache);
    }
    async set_geolocation(latitude, longitude, accuracy) {
        await this.init();
        await this._page.cdpSession.send("Emulation.setGeolocationOverride", {
            latitude, longitude, accuracy: accuracy ?? 100,
        });
    }
    async clear_geolocation() {
        await this.init();
        await this._page.cdpSession.send("Emulation.clearGeolocationOverride");
    }
}
exports.ChromiumBase = ChromiumBase;
function _cheerioXPathFallback($, xpath) {
    let m = xpath.match(/\/\/\*\/text\(\)\[contains\(\.,\s*"([^"]+)"\)\]\/\.\./);
    if (m) {
        return $("*").toArray().filter((node) => {
            const text = $(node).text();
            return text && text.includes(m[1]);
        });
    }
    m = xpath.match(/\/\/\*\[text\(\)="([^"]+)"\]/);
    if (m) {
        return $("*").toArray().filter((node) => {
            const text = $(node).clone().children().remove().end().text().trim();
            return text === m[1];
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
