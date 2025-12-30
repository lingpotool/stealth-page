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
exports.ChromiumPage = void 0;
const Chromium_1 = require("../chromium/Chromium");
const Element_1 = require("../core/Element");
const SessionElement_1 = require("../core/SessionElement");
const ChromiumPageSetter_1 = require("./ChromiumPageSetter");
const ChromiumPageWaiter_1 = require("./ChromiumPageWaiter");
const ChromiumPageActions_1 = require("./ChromiumPageActions");
const ChromiumPageListener_1 = require("./ChromiumPageListener");
const ChromiumPageDownloader_1 = require("./ChromiumPageDownloader");
const ChromiumFrame_1 = require("./ChromiumFrame");
const ChromiumTab_1 = require("./ChromiumTab");
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
 * Node 版 ChromiumPage，对应 DrissionPage.ChromiumPage。
 * 内部基于 core/Page 实现，后续逐步补充完整行为。
 */
class ChromiumPage {
    get set() {
        if (!this._setter) {
            this._setter = new ChromiumPageSetter_1.ChromiumPageSetter(this);
        }
        return this._setter;
    }
    /**
     * 等待功能 - 可以直接调用 page.wait(秒数) 或访问 page.wait.xxx 方法
     */
    get wait() {
        if (!this._waiter) {
            this._waiter = new ChromiumPageWaiter_1.ChromiumPageWaiter(this);
        }
        // 创建一个可调用的代理，支持 page.wait(0.1) 和 page.wait.ele() 两种用法
        const waiter = this._waiter;
        const callable = async (second, scope) => {
            return waiter.wait(second, scope);
        };
        // 将 waiter 的所有属性和方法复制到 callable
        Object.setPrototypeOf(callable, Object.getPrototypeOf(waiter));
        Object.assign(callable, waiter);
        // 绑定方法的 this
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
    /**
     * 获取当前页面的所有 cookies
     */
    get cookies() {
        return this._getCookies();
    }
    async _getCookies() {
        await this.init();
        const { cookies } = await this._page.cdpSession.send("Network.getCookies");
        return cookies;
    }
    get window() {
        if (!this._windowSetter && this._page) {
            this._windowSetter = new WindowSetter_1.WindowSetter({ cdpSession: this._page.cdpSession });
        }
        return this._windowSetter;
    }
    constructor(addrOrOpts) {
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
        // ========== 初始化脚本 ==========
        this._initScripts = new Map();
        if (addrOrOpts instanceof Chromium_1.Chromium) {
            this._chromium = addrOrOpts;
        }
        else {
            this._chromium = new Chromium_1.Chromium(addrOrOpts);
        }
    }
    get browser() {
        return this._chromium;
    }
    async init() {
        if (!this._page) {
            await this._chromium.connect();
            this._page = await this._chromium.new_page();
        }
    }
    async get(url) {
        await this.init();
        const timeoutMs = this._chromium.options.timeouts.pageLoad * 1000;
        await this._page.get(url, { timeoutMs });
        return true;
    }
    async ele(locator, index = 1) {
        await this.init();
        if (index !== 1) {
            const all = await this._page.eles(locator);
            return all[index - 1] ?? null;
        }
        return this._page.ele(locator);
    }
    async eles(locator) {
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
    async ele_text(locator) {
        await this.init();
        return this._page.ele_text(locator);
    }
    async ele_html(locator) {
        await this.init();
        return this._page.ele_html(locator);
    }
    async eles_attrs(locator, attrs) {
        await this.init();
        return this._page.eles_attrs(locator, attrs);
    }
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
    async new_tab(url, options) {
        await this.init();
        // 创建新标签页
        const { targetId } = await this._chromium.cdpSession.send("Target.createTarget", {
            url: url || "about:blank",
            newWindow: options?.newWindow,
            background: options?.background,
        });
        // 返回 ChromiumTab 对象
        const tab = new ChromiumTab_1.ChromiumTab(this._chromium, targetId);
        await tab.init();
        return tab;
    }
    /**
     * 获取一个标签页对象
     */
    async get_tab(options) {
        const tabs = await this._chromium.get_tabs();
        if (options?.idOrNum !== undefined) {
            if (typeof options.idOrNum === "string") {
                // 按 id 查找
                const found = tabs.find(t => t.id === options.idOrNum);
                if (!found)
                    return null;
                if (options.asId)
                    return found.id;
                const tab = new ChromiumTab_1.ChromiumTab(this._chromium, found.id);
                await tab.init();
                return tab;
            }
            else {
                // 按序号查找
                const idx = options.idOrNum > 0 ? options.idOrNum - 1 : tabs.length + options.idOrNum;
                const found = tabs[idx];
                if (!found)
                    return null;
                if (options.asId)
                    return found.id;
                const tab = new ChromiumTab_1.ChromiumTab(this._chromium, found.id);
                await tab.init();
                return tab;
            }
        }
        // 按 title/url 模糊匹配
        let filtered = tabs;
        if (options?.title) {
            filtered = filtered.filter(t => t.title.includes(options.title));
        }
        if (options?.url) {
            filtered = filtered.filter(t => t.url.includes(options.url));
        }
        if (filtered.length === 0)
            return null;
        if (options?.asId)
            return filtered[0].id;
        const tab = new ChromiumTab_1.ChromiumTab(this._chromium, filtered[0].id);
        await tab.init();
        return tab;
    }
    async close() {
        // TODO: 需要获取当前页面的 targetId 才能正确关闭
        // 当前实现可能无法正确工作
        if (this._page) {
            try {
                const tabs = await this._chromium.get_tabs();
                if (tabs.length > 0) {
                    await this._chromium.cdpSession.send("Target.closeTarget", {
                        targetId: tabs[0].id,
                    });
                }
            }
            catch {
                // 忽略关闭错误
            }
        }
    }
    async run_js(script) {
        await this.init();
        return this._page.runJs(script);
    }
    async set_cookies(cookies) {
        await this.init();
        return this._page.set_cookies(cookies);
    }
    async refresh() {
        await this.init();
        return this._page.refresh();
    }
    async back() {
        await this.init();
        return this._page.back();
    }
    async forward() {
        await this.init();
        return this._page.forward();
    }
    async get_tabs() {
        return this._chromium.get_tabs();
    }
    async activate_tab(tabId) {
        return this._chromium.activate_tab(tabId);
    }
    async close_tab(tabId) {
        if (tabId) {
            return this._chromium.close_tab(tabId);
        }
        return this.close();
    }
    get tabs_count() {
        return 1;
    }
    get tab_ids() {
        return [];
    }
    async scroll_to(x, y) {
        await this.init();
        return this._page.scroll_to(x, y);
    }
    async scroll_to_top() {
        await this.init();
        return this._page.scroll_to_top();
    }
    async scroll_to_bottom() {
        await this.init();
        return this._page.scroll_to_bottom();
    }
    async quit() {
        return this._chromium.quit();
    }
    async handle_alert(accept = true, promptText) {
        await this.init();
        return this._page.handle_alert(accept, promptText);
    }
    async screenshot(path) {
        await this.init();
        return this._page.screenshot(path);
    }
    async get_frames() {
        await this.init();
        return this._page.get_frames();
    }
    /**
     * 获取页面中的一个 frame 对象
     */
    async get_frame(locIndEle) {
        await this.init();
        const frames = await this.get_frames();
        if (typeof locIndEle === "number") {
            // 按序号获取
            const idx = locIndEle > 0 ? locIndEle - 1 : frames.length + locIndEle;
            const frameInfo = frames[idx];
            if (!frameInfo)
                return null;
            // 查找对应的 iframe 元素
            const iframes = await this.eles("iframe, frame");
            const frameEle = iframes[idx];
            if (!frameEle)
                return null;
            return new ChromiumFrame_1.ChromiumFrame(this._page.cdpSession, frameInfo.id, frameEle);
        }
        if (locIndEle instanceof Element_1.Element) {
            // 传入的是元素对象
            const src = await locIndEle.attr("src");
            const name = await locIndEle.attr("name");
            for (const frameInfo of frames) {
                if ((src && frameInfo.url === src) || (name && frameInfo.name === name)) {
                    return new ChromiumFrame_1.ChromiumFrame(this._page.cdpSession, frameInfo.id, locIndEle);
                }
            }
            return null;
        }
        // 按定位符查找
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
    async stop_loading() {
        await this.init();
        return this._page.stop_loading();
    }
    async reload() {
        await this.init();
        return this._page.reload();
    }
    async set_geolocation(latitude, longitude, accuracy) {
        await this.init();
        return this._page.set_geolocation(latitude, longitude, accuracy);
    }
    async clear_geolocation() {
        await this.init();
        return this._page.clear_geolocation();
    }
    // ========== Storage 方法 ==========
    /**
     * 获取 sessionStorage
     */
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
    /**
     * 获取 localStorage
     */
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
    /**
     * 清除缓存
     */
    async clear_cache(options = {}) {
        await this.init();
        const { sessionStorage = true, localStorage = true, cache = true, cookies = true } = options;
        if (sessionStorage) {
            await this._page.cdpSession.send("Runtime.evaluate", {
                expression: "sessionStorage.clear()",
            });
        }
        if (localStorage) {
            await this._page.cdpSession.send("Runtime.evaluate", {
                expression: "localStorage.clear()",
            });
        }
        if (cache) {
            await this._page.cdpSession.send("Network.clearBrowserCache");
        }
        if (cookies) {
            await this._page.cdpSession.send("Network.clearBrowserCookies");
        }
    }
    /**
     * 添加初始化脚本
     */
    async add_init_js(script) {
        await this.init();
        const { identifier } = await this._page.cdpSession.send("Page.addScriptToEvaluateOnNewDocument", {
            source: script,
        });
        this._initScripts.set(identifier, script);
        return identifier;
    }
    /**
     * 移除初始化脚本
     */
    async remove_init_js(scriptId) {
        await this.init();
        if (scriptId) {
            await this._page.cdpSession.send("Page.removeScriptToEvaluateOnNewDocument", {
                identifier: scriptId,
            });
            this._initScripts.delete(scriptId);
        }
        else {
            // 移除所有
            for (const id of this._initScripts.keys()) {
                await this._page.cdpSession.send("Page.removeScriptToEvaluateOnNewDocument", {
                    identifier: id,
                });
            }
            this._initScripts.clear();
        }
    }
    // ========== CDP 方法 ==========
    /**
     * 执行 CDP 命令
     */
    async run_cdp(cmd, params = {}) {
        await this.init();
        return this._page.cdpSession.send(cmd, params);
    }
    /**
     * 执行 CDP 命令（等待页面加载完成）
     */
    async run_cdp_loaded(cmd, params = {}) {
        await this.init();
        // 等待页面加载完成
        await this._page.cdpSession.send("Runtime.evaluate", {
            expression: "new Promise(r => document.readyState === 'complete' ? r() : window.addEventListener('load', r))",
            awaitPromise: true,
        });
        return this._page.cdpSession.send(cmd, params);
    }
    // ========== 异步 JS ==========
    /**
     * 异步执行 JS
     */
    async run_async_js(script) {
        await this.init();
        await this._page.cdpSession.send("Runtime.evaluate", {
            expression: script,
            awaitPromise: false,
        });
    }
    // ========== 页面保存 ==========
    /**
     * 保存页面为 PDF 或 MHTML
     */
    async save(options = {}) {
        await this.init();
        const { asPdf = false, path, name } = options;
        if (asPdf) {
            // 保存为 PDF
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
            // 保存为 MHTML
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
    // ========== 浏览器信息 ==========
    /**
     * 获取浏览器版本
     */
    async browser_version() {
        await this.init();
        const { product } = await this._page.cdpSession.send("Browser.getVersion");
        return product;
    }
    /**
     * 获取浏览器进程 ID
     */
    async process_id() {
        try {
            const { processId } = await this._chromium.cdpSession.send("SystemInfo.getProcessInfo");
            return processId;
        }
        catch {
            return null;
        }
    }
    /**
     * 获取浏览器地址
     */
    get address() {
        return this._chromium.options.address;
    }
    /**
     * 获取最新的标签页 ID
     */
    async latest_tab() {
        const tabs = await this.get_tabs();
        return tabs.length > 0 ? tabs[tabs.length - 1].id : null;
    }
    /**
     * 关闭多个标签页
     */
    async close_tabs(tabIds, others = false) {
        const ids = Array.isArray(tabIds) ? tabIds : [tabIds];
        const allTabs = await this.get_tabs();
        if (others) {
            // 关闭指定标签页之外的
            for (const tab of allTabs) {
                if (!ids.includes(tab.id)) {
                    await this._chromium.close_tab(tab.id);
                }
            }
        }
        else {
            // 关闭指定的标签页
            for (const id of ids) {
                await this._chromium.close_tab(id);
            }
        }
    }
    /**
     * 获取当前焦点所在元素
     */
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
    /**
     * 从页面删除一个元素
     */
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
    /**
     * 添加一个新元素
     */
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
}
exports.ChromiumPage = ChromiumPage;
