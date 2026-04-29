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
exports.ChromiumFrame = void 0;
const Element_1 = require("../core/Element");
const NoneElement_1 = require("../core/NoneElement");
const FrameScroller_1 = require("../units/FrameScroller");
const FrameStates_1 = require("../units/FrameStates");
const FrameWaiter_1 = require("../units/FrameWaiter");
const Listener_1 = require("../units/Listener");
const ChromiumFrameSetter_1 = require("../units/ChromiumFrameSetter");
const PageRect_1 = require("../units/PageRect");
const Settings_1 = require("../core/Settings");
const locator_1 = require("../core/locator");
class ChromiumFrame {
    constructor(session, frameId, frameEle) {
        this._documentNodeId = null;
        this._scroller = null;
        this._states = null;
        this._waiter = null;
        this._setter = null;
        this._listener = null;
        this._rect = null;
        this._contextId = null;
        this._is_cross_origin = false;
        this._isolated_session = null;
        this._tab_id = '';
        this._load_mode = 'normal';
        this._session = session;
        this._frameId = frameId;
        this._frameEle = frameEle;
        this._initContextListener();
    }
    _initContextListener() {
        this._session.on("Runtime.executionContextCreated", (params) => {
            const context = params.context;
            if (context && context.auxData && context.auxData.frameId === this._frameId) {
                this._contextId = context.id;
            }
        });
        this._session.on("Runtime.executionContextDestroyed", (params) => {
            if (params.executionContextId === this._contextId) {
                this._contextId = null;
            }
        });
        this._session.on("Runtime.executionContextsCleared", () => {
            this._contextId = null;
        });
        this._session.on("Page.frameAttached", (params) => {
            if (params.frameId === this._frameId) {
                this._is_cross_origin = true;
            }
        });
        this._session.on("Page.frameDetached", (params) => {
            if (params.frameId === this._frameId) {
                this._is_cross_origin = false;
                this._contextId = null;
                if (this._isolated_session) {
                    this._isolated_session = null;
                }
            }
        });
        this._session.on("Inspector.detached", () => {
            this._is_cross_origin = false;
            this._isolated_session = null;
            this._contextId = null;
        });
    }
    get session() {
        return this._is_cross_origin && this._isolated_session ? this._isolated_session : this._session;
    }
    get cdpSession() {
        return this.session;
    }
    get frameId() {
        return this._frameId;
    }
    get frame_ele() {
        return this._frameEle;
    }
    get owner() {
        return this._frameEle;
    }
    get tab() {
        return this._frameEle;
    }
    get tab_id() {
        return this._tab_id;
    }
    set tab_id(value) {
        this._tab_id = value;
    }
    get is_cross_origin() {
        return this._is_cross_origin;
    }
    get load_mode() {
        return this._load_mode;
    }
    set load_mode(value) {
        this._load_mode = value;
    }
    get scroll() {
        if (!this._scroller) {
            this._scroller = new FrameScroller_1.FrameScroller(this);
        }
        return this._scroller;
    }
    get states() {
        if (!this._states) {
            this._states = new FrameStates_1.FrameStates(this);
        }
        return this._states;
    }
    get wait() {
        if (!this._waiter) {
            this._waiter = new FrameWaiter_1.FrameWaiter(this);
        }
        return this._waiter;
    }
    get set() {
        if (!this._setter) {
            this._setter = new ChromiumFrameSetter_1.ChromiumFrameSetter(this);
        }
        return this._setter;
    }
    get listen() {
        if (!this._listener) {
            this._listener = new Listener_1.FrameListener({ cdpSession: this.session, tab_id: this._tab_id, _run_cdp: async (cmd, params) => this.session.send(cmd, params) });
        }
        return this._listener;
    }
    async active_ele() {
        try {
            const { result } = await this.session.send("Runtime.evaluate", {
                expression: "document.activeElement",
                contextId: this._contextId || undefined,
            });
            if (result?.objectId) {
                const { node } = await this.session.send("DOM.describeNode", { objectId: result.objectId });
                return new Element_1.Element(this.session, { nodeId: node.nodeId, backendNodeId: node.backendNodeId });
            }
        }
        catch { }
        return null;
    }
    get rect() {
        if (!this._rect) {
            this._rect = new PageRect_1.PageRect({ cdpSession: this.session });
        }
        return this._rect;
    }
    async url() {
        try {
            const { result } = await this.session.send("Runtime.evaluate", {
                expression: "document.URL",
                contextId: this._contextId || undefined,
                returnByValue: true,
            });
            return result.value || "";
        }
        catch {
            const src = await this._frameEle.attr("src");
            return src || "";
        }
    }
    async title() {
        const { result } = await this.session.send("Runtime.evaluate", {
            expression: "document.title",
            contextId: this._contextId || undefined,
            returnByValue: true,
        });
        return result.value || "";
    }
    async html() {
        return this._frameEle.outer_html();
    }
    async inner_html() {
        return this._frameEle.inner_html();
    }
    async tag() {
        return this._frameEle.tag_name();
    }
    async attr(name) {
        return this._frameEle.attr(name);
    }
    async attrs() {
        return this._frameEle.attrs();
    }
    async refresh() {
        const src = await this._frameEle.attr("src");
        if (src) {
            await this._frameEle.set.attr("src", src);
        }
    }
    async _reload() {
        try {
            const src = await this.url();
            if (src) {
                await this.session.send("Page.navigate", { url: src, frameId: this._frameId });
            }
        }
        catch {
            await this.refresh();
        }
    }
    async _get_document(timeout) {
        if (this._documentNodeId)
            return this._documentNodeId;
        const timeoutMs = (timeout ?? Settings_1.Settings.cdp_timeout) * 1000;
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
            try {
                const { root } = await this.session.send("DOM.getDocument", { depth: -1 });
                this._documentNodeId = root.nodeId;
                return root.nodeId;
            }
            catch {
                await new Promise(r => setTimeout(r, 200));
            }
        }
        throw new Error("Failed to get frame document within timeout");
    }
    async ele(locator, timeout) {
        const timeoutMs = (timeout ?? Settings_1.Settings.cdp_timeout) * 1000;
        const deadline = Date.now() + timeoutMs;
        while (true) {
            try {
                const parsed = (0, locator_1.parseLocator)(locator);
                const query = parsed.type === 'css' ? parsed.value : `xpath=${parsed.value}`;
                const { searchId, resultCount } = await this.session.send("DOM.performSearch", {
                    query,
                    includeUserAgentShadowDOM: true,
                });
                if (resultCount > 0) {
                    const { nodeIds } = await this.session.send("DOM.getSearchResults", {
                        searchId,
                        fromIndex: 0,
                        toIndex: 1,
                    });
                    await this.session.send("DOM.discardSearchResults", { searchId }).catch(() => { });
                    if (nodeIds.length > 0 && nodeIds[0] > 0) {
                        const { node } = await this.session.send("DOM.describeNode", { nodeId: nodeIds[0] });
                        return new Element_1.Element(this.session, { nodeId: nodeIds[0], backendNodeId: node.backendNodeId });
                    }
                }
                await this.session.send("DOM.discardSearchResults", { searchId }).catch(() => { });
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
    async eles(locator) {
        const parsed = (0, locator_1.parseLocator)(locator);
        const query = parsed.type === 'css' ? parsed.value : `xpath=${parsed.value}`;
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
    async run_js(script, ...args) {
        const { result } = await this.session.send("Runtime.evaluate", {
            expression: `(function() { ${script} })()`,
            contextId: this._contextId || undefined,
            returnByValue: true,
        });
        return result.value;
    }
    async _run_js(script, ...args) {
        return this.run_js(script, ...args);
    }
    async js_ready_state() {
        try {
            const { result } = await this.session.send("Runtime.evaluate", {
                expression: "document.readyState",
                contextId: this._contextId || undefined,
                returnByValue: true,
            });
            return result.value || 'unknown';
        }
        catch {
            return 'unknown';
        }
    }
    get _js_ready_state() {
        return this.js_ready_state();
    }
    async run_async_js(script, ...args) {
        await this.session.send("Runtime.evaluate", {
            expression: `(function() { ${script} })()`,
            contextId: this._contextId || undefined,
            awaitPromise: false,
        });
    }
    async run_js_loaded(script, ...args) {
        await this._wait_loaded();
        return this.run_js(script, ...args);
    }
    async screenshot(path) {
        return this._frameEle.screenshot(path);
    }
    async get_screenshot(path, name) {
        if (this._is_cross_origin) {
            try {
                const { data } = await this.session.send("Page.captureScreenshot", {
                    format: 'png',
                });
                const buffer = Buffer.from(data, 'base64');
                if (path) {
                    const fs = await Promise.resolve().then(() => __importStar(require('fs')));
                    const pathModule = await Promise.resolve().then(() => __importStar(require('path')));
                    fs.mkdirSync(path, { recursive: true });
                    const fullPath = pathModule.join(path, (name || 'frame') + '.png');
                    fs.writeFileSync(fullPath, buffer);
                }
                return buffer;
            }
            catch {
                return this._frameEle.screenshot(path);
            }
        }
        return this._frameEle.screenshot(path);
    }
    async _get_screenshot(path, name, asBytes, asBase64, fullPage = false, leftTop, rightBottom, ele) {
        return this.get_screenshot(path, name);
    }
    async _find_elements(locator, timeout, index, relative = false, raiseErr) {
        if (locator instanceof Element_1.Element)
            return locator;
        if (index === undefined || index === null) {
            return this.eles(locator);
        }
        if (index === 1) {
            const el = await this.ele(locator, timeout);
            if (el instanceof NoneElement_1.NoneElement) {
                if (raiseErr ?? Settings_1.Settings.raise_when_ele_not_found) {
                    const { ElementNotFoundError } = await Promise.resolve().then(() => __importStar(require("../errors")));
                    throw new ElementNotFoundError(locator);
                }
            }
            return el;
        }
        const all = await this.eles(locator);
        const idx = index > 0 ? index - 1 : all.length + index;
        const result = all[idx] ?? null;
        if (!result) {
            if (raiseErr ?? Settings_1.Settings.raise_when_ele_not_found) {
                const { ElementNotFoundError } = await Promise.resolve().then(() => __importStar(require("../errors")));
                throw new ElementNotFoundError(locator);
            }
            return new NoneElement_1.NoneElement("ele", { locator, index });
        }
        return result;
    }
    _is_inner_frame() {
        return !this._is_cross_origin;
    }
    async property(name) {
        const { result } = await this.session.send("Runtime.evaluate", {
            expression: `document[${JSON.stringify(name)}]`,
            contextId: this._contextId || undefined,
            returnByValue: true,
        });
        return result.value;
    }
    async style(name, pseudoEle = "") {
        const target = pseudoEle ? `document.querySelector('iframe')::${pseudoEle}` : "document.documentElement";
        const { result } = await this.session.send("Runtime.evaluate", {
            expression: `getComputedStyle(${target})[${JSON.stringify(name)}]`,
            contextId: this._contextId || undefined,
            returnByValue: true,
        });
        return result.value || '';
    }
    async set_load_mode(mode) {
        this._load_mode = mode;
    }
    async _wait_loaded(timeout) {
        const timeoutMs = (timeout ?? 30) * 1000;
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
            try {
                const { result } = await this.session.send("Runtime.evaluate", {
                    expression: "document.readyState",
                    contextId: this._contextId || undefined,
                    returnByValue: true,
                });
                if (result.value === 'complete' || result.value === 'interactive')
                    return;
            }
            catch { }
            await new Promise(r => setTimeout(r, 200));
        }
    }
    async parent(level = 1) {
        return this._frameEle.parent(level);
    }
    async prev(locator = "", index = 1) {
        return this._frameEle.prev(locator, index);
    }
    async next(locator = "", index = 1) {
        return this._frameEle.next(locator, index);
    }
    async prevs(locator = "") {
        return this._frameEle.prevs(locator);
    }
    async nexts(locator = "") {
        return this._frameEle.nexts(locator);
    }
    async before(locator = "", index = 1) {
        return this._frameEle.before(locator, index);
    }
    async after(locator = "", index = 1) {
        return this._frameEle.after(locator, index);
    }
    async befores(locator = "") {
        return this._frameEle.befores(locator);
    }
    async afters(locator = "") {
        return this._frameEle.afters(locator);
    }
    async _run_cdp(method, params) {
        return this.session.send(method, params);
    }
    async s_ele(locator, index = 1) {
        return this.ele(locator, index);
    }
    async s_eles(locator) {
        return this.eles(locator);
    }
    async remove_attr(name) {
        await this._frameEle.remove_attr(name);
    }
    async children(locator = "", timeout) {
        return this._frameEle.children(locator, true);
    }
    async link() {
        const href = await this._frameEle.attr("href");
        if (href)
            return href;
        const src = await this._frameEle.attr("src");
        return src || "";
    }
    async xpath() {
        try {
            const { result } = await this.session.send("Runtime.evaluate", {
                expression: `(function(){function getXPath(el){if(el.id!=='')return '//*[@id=\"'+el.id+'\"]';if(el===document.body)return el.tagName;var ix=0;var siblings=el.parentNode.childNodes;for(var i=0;i<siblings.length;i++){var sib=siblings[i];if(sib===el)return getXPath(el.parentNode)+'/'+el.tagName+'['+(ix+1)+']';if(sib.nodeType===1&&sib.tagName===el.tagName)ix++;}}return getXPath(this);}).call(document.querySelector('iframe'))`,
                contextId: this._contextId || undefined,
                returnByValue: true,
            });
            return result.value || "";
        }
        catch {
            return "";
        }
    }
    async css_path() {
        try {
            const { result } = await this.session.send("Runtime.evaluate", {
                expression: `(function(){function getCSSPath(el){if(el.id!=='')return '#'+el.id;if(el===document.body)return el.tagName.toLowerCase();var ix=0;var siblings=el.parentNode.children;for(var i=0;i<siblings.length;i++){var sib=siblings[i];if(sib===el)return getCSSPath(el.parentNode)+' > '+el.tagName.toLowerCase()+':nth-of-type('+(ix+1)+')';if(sib.tagName===el.tagName)ix++;}}return getCSSPath(this);}).call(document.querySelector('iframe'))`,
                contextId: this._contextId || undefined,
                returnByValue: true,
            });
            return result.value || "";
        }
        catch {
            return "";
        }
    }
    async child_count() {
        return this._frameEle.child_count();
    }
    async shadow_root() {
        return this._frameEle.shadow_root;
    }
    async sr() {
        return this.shadow_root();
    }
    get download_path() {
        return '.';
    }
    get doc_ele() {
        return this._frameEle;
    }
}
exports.ChromiumFrame = ChromiumFrame;
