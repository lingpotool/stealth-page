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
exports.ChromiumTab = void 0;
const Element_1 = require("../core/Element");
const SessionElement_1 = require("../core/SessionElement");
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
const locator_1 = require("../core/locator");
/**
 * ChromiumTab - 浏览器标签页类
 * 对应 DrissionPage.ChromiumTab
 */
class ChromiumTab {
    constructor(browser, tabId) {
        this._page = null;
        // 操作对象缓存
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
        // ========== 初始化脚本 ==========
        this._initScripts = new Map();
        this._browser = browser;
        this._tabId = tabId;
    }
    // ========== 属性访问器 ==========
    get browser() {
        return this._browser;
    }
    get tab_id() {
        return this._tabId;
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
        return this._waiter;
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
            this._downloader = new ChromiumPageDownloader_1.ChromiumPageDownloader(this);
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
    // ========== 初始化 ==========
    async init() {
        if (!this._page) {
            await this._browser.connect();
            this._page = await this._browser.get_page_by_id(this._tabId);
        }
    }
    // ========== 页面导航 ==========
    async get(url) {
        await this.init();
        const timeoutMs = this._browser.options.timeouts.pageLoad * 1000;
        await this._page.get(url, { timeoutMs });
        return true;
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
        for (let i = 0; i < steps; i++) {
            await this._page.back();
        }
    }
    async forward(steps = 1) {
        await this.init();
        for (let i = 0; i < steps; i++) {
            await this._page.forward();
        }
    }
    async stop_loading() {
        await this.init();
        await this._page.stop_loading();
    }
    // ========== 页面信息 ==========
    async html() {
        await this.init();
        return this._page.html();
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
        const cookies = await this._page.cookies();
        if (!allInfo) {
            return cookies.map((c) => ({
                name: c.name,
                value: c.value,
                domain: c.domain,
            }));
        }
        return cookies;
    }
    // ========== 元素查找 ==========
    async ele(locator, index = 1, timeout) {
        await this.init();
        if (index !== 1) {
            const all = await this._page.eles(locator);
            const idx = index > 0 ? index - 1 : all.length + index;
            return all[idx] ?? null;
        }
        return this._page.ele(locator);
    }
    async eles(locator, timeout) {
        await this.init();
        return this._page.eles(locator);
    }
    /**
     * 以 SessionElement 形式返回元素（高效处理复杂页面）
     */
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
            // 简单文本匹配
            nodes = $("*").toArray().filter((node) => {
                const text = $(node).text();
                return text && text.includes(locator);
            });
        }
        const idx = index > 0 ? index - 1 : nodes.length + index;
        const node = nodes[idx];
        return node ? new SessionElement_1.SessionElement($, node) : null;
    }
    /**
     * 以 SessionElement 列表形式返回所有匹配元素
     */
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
            nodes = $("*").toArray().filter((node) => {
                const text = $(node).text();
                return text && text.includes(locator);
            });
        }
        return nodes.map((node) => new SessionElement_1.SessionElement($, node));
    }
    // ========== JavaScript 执行 ==========
    async run_js(script, ...args) {
        await this.init();
        return this._page.runJs(script);
    }
    async run_js_loaded(script, ...args) {
        await this.init();
        await this._page.cdpSession.send("Runtime.evaluate", {
            expression: "new Promise(r => document.readyState === 'complete' ? r() : window.addEventListener('load', r))",
            awaitPromise: true,
        });
        return this._page.runJs(script);
    }
    async run_async_js(script, ...args) {
        await this.init();
        await this._page.cdpSession.send("Runtime.evaluate", {
            expression: script,
            awaitPromise: false,
        });
    }
    async run_cdp(cmd, params = {}) {
        await this.init();
        return this._page.cdpSession.send(cmd, params);
    }
    // ========== 标签页操作 ==========
    async close(others = false) {
        if (others) {
            const tabs = await this._browser.get_tabs();
            for (const tab of tabs) {
                if (tab.id !== this._tabId) {
                    await this._browser.close_tab(tab.id);
                }
            }
        }
        else {
            await this._browser.close_tab(this._tabId);
        }
    }
    async activate() {
        await this._browser.activate_tab(this._tabId);
    }
    // ========== Frame 操作 ==========
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
            const src = await locIndEle.attr("src");
            const name = await locIndEle.attr("name");
            for (const frameInfo of frames) {
                if ((src && frameInfo.url === src) || (name && frameInfo.name === name)) {
                    return new ChromiumFrame_1.ChromiumFrame(this._page.cdpSession, frameInfo.id, locIndEle);
                }
            }
            return null;
        }
        const frameEle = await this.ele(locIndEle);
        if (!frameEle)
            return null;
        const src = await frameEle.attr("src");
        const name = await frameEle.attr("name");
        for (const frameInfo of frames) {
            if ((src && frameInfo.url === src) || (name && frameInfo.name === name)) {
                return new ChromiumFrame_1.ChromiumFrame(this._page.cdpSession, frameInfo.id, frameEle);
            }
        }
        return null;
    }
    async get_frames(locator) {
        await this.init();
        if (locator) {
            return this.eles(locator);
        }
        return this.eles("iframe, frame");
    }
    // ========== 截图和保存 ==========
    async screenshot(path) {
        await this.init();
        return this._page.screenshot(path);
    }
    async get_screenshot(options = {}) {
        await this.init();
        const { path, name, asBytes, asBase64, fullPage } = options;
        let clip = undefined;
        if (fullPage) {
            const { result } = await this._page.cdpSession.send("Runtime.evaluate", {
                expression: `({ width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight })`,
                returnByValue: true,
            });
            clip = { x: 0, y: 0, width: result.value.width, height: result.value.height, scale: 1 };
        }
        const { data } = await this._page.cdpSession.send("Page.captureScreenshot", {
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
            const fs = await Promise.resolve().then(() => __importStar(require("fs")));
            const filePath = path ? `${path}/${name || "screenshot.png"}` : name || "screenshot.png";
            fs.writeFileSync(filePath, buffer);
            return filePath;
        }
        return buffer;
    }
    async save(options = {}) {
        await this.init();
        const { asPdf = false, path, name } = options;
        if (asPdf) {
            const { data } = await this._page.cdpSession.send("Page.printToPDF", {
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
                const fs = await Promise.resolve().then(() => __importStar(require("fs")));
                const filePath = path ? `${path}/${name || "page.pdf"}` : name || "page.pdf";
                fs.writeFileSync(filePath, buffer);
                return filePath;
            }
            return buffer;
        }
        else {
            const { data } = await this._page.cdpSession.send("Page.captureSnapshot", {
                format: "mhtml",
            });
            if (path || name) {
                const fs = await Promise.resolve().then(() => __importStar(require("fs")));
                const filePath = path ? `${path}/${name || "page.mhtml"}` : name || "page.mhtml";
                fs.writeFileSync(filePath, data);
                return filePath;
            }
            return data;
        }
    }
    // ========== Storage ==========
    async session_storage(item) {
        await this.init();
        if (item) {
            const { result } = await this._page.cdpSession.send("Runtime.evaluate", {
                expression: `sessionStorage.getItem(${JSON.stringify(item)})`,
                returnByValue: true,
            });
            return result.value;
        }
        const { result } = await this._page.cdpSession.send("Runtime.evaluate", {
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
    async local_storage(item) {
        await this.init();
        if (item) {
            const { result } = await this._page.cdpSession.send("Runtime.evaluate", {
                expression: `localStorage.getItem(${JSON.stringify(item)})`,
                returnByValue: true,
            });
            return result.value;
        }
        const { result } = await this._page.cdpSession.send("Runtime.evaluate", {
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
    async clear_cache(options = {}) {
        await this.init();
        const { sessionStorage = true, localStorage = true, cache = true, cookies = true } = options;
        if (sessionStorage) {
            await this._page.cdpSession.send("Runtime.evaluate", { expression: "sessionStorage.clear()" });
        }
        if (localStorage) {
            await this._page.cdpSession.send("Runtime.evaluate", { expression: "localStorage.clear()" });
        }
        if (cache) {
            await this._page.cdpSession.send("Network.clearBrowserCache");
        }
        if (cookies) {
            await this._page.cdpSession.send("Network.clearBrowserCookies");
        }
    }
    // ========== Alert 处理 ==========
    async handle_alert(accept = true, send, timeout) {
        await this.init();
        try {
            await this._page.handle_alert(accept, send);
            return "";
        }
        catch {
            return false;
        }
    }
    // ========== 元素操作 ==========
    async active_ele() {
        await this.init();
        // 必须先初始化 DOM 树，否则 DOM.requestNode 会返回 nodeId: 0
        await this._page.cdpSession.send("DOM.getDocument", { depth: -1 });
        const { result } = await this._page.cdpSession.send("Runtime.evaluate", {
            expression: "document.activeElement",
        });
        if (!result.objectId)
            return null;
        const { nodeId } = await this._page.cdpSession.send("DOM.requestNode", {
            objectId: result.objectId,
        });
        return new Element_1.Element(this._page.cdpSession, { nodeId });
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
        if (ele) {
            const objectId = await ele.getObjectId();
            await this._page.cdpSession.send("Runtime.callFunctionOn", {
                objectId,
                functionDeclaration: "function() { this.remove(); }",
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
            parentEle = typeof insertTo === "string" ? await this.ele(insertTo) : insertTo;
        }
        if (!parentEle) {
            parentEle = await this.ele("body");
        }
        if (!parentEle)
            return null;
        const parentObjectId = await parentEle.getObjectId();
        const { result } = await this._page.cdpSession.send("Runtime.callFunctionOn", {
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
        if (!result.objectId)
            return null;
        // 必须先初始化 DOM 树
        await this._page.cdpSession.send("DOM.getDocument", { depth: -1 });
        const { nodeId } = await this._page.cdpSession.send("DOM.requestNode", {
            objectId: result.objectId,
        });
        return new Element_1.Element(this._page.cdpSession, { nodeId });
    }
    async add_init_js(script) {
        await this.init();
        const { identifier } = await this._page.cdpSession.send("Page.addScriptToEvaluateOnNewDocument", {
            source: script,
        });
        this._initScripts.set(identifier, script);
        return identifier;
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
    // ========== Cookies ==========
    async set_cookies(cookies) {
        await this.init();
        return this._page.set_cookies(cookies);
    }
}
exports.ChromiumTab = ChromiumTab;
