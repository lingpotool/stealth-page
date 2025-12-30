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
exports.Element = void 0;
const ElementScroller_1 = require("../units/ElementScroller");
const ElementClicker_1 = require("../units/ElementClicker");
const ElementWaiter_1 = require("../units/ElementWaiter");
const ElementSetter_1 = require("../units/ElementSetter");
const ElementRect_1 = require("../units/ElementRect");
const ElementStates_1 = require("../units/ElementStates");
const SelectElement_1 = require("../units/SelectElement");
const Pseudo_1 = require("../units/Pseudo");
/**
 * 元素类，对应 DrissionPage 的 ChromiumElement
 */
class Element {
    constructor(session, ref, page) {
        this._objectIdCache = null;
        this._objectIdCacheTime = 0;
        this._objectIdCacheDuration = 500;
        this._page = null;
        // 操作对象缓存
        this._scroll = null;
        this._clicker = null;
        this._wait = null;
        this._set = null;
        this._rect = null;
        this._states = null;
        this._select = null;
        this._pseudo = null;
        this._session = session;
        this._ref = ref;
        this._page = page;
    }
    // ========== 公开属性 ==========
    get session() {
        return this._session;
    }
    get nodeId() {
        return this._ref.nodeId;
    }
    /**
     * 获取元素所属的页面对象
     */
    getPage() {
        return this._page;
    }
    /**
     * 设置元素所属的页面对象
     */
    setPage(page) {
        this._page = page;
    }
    /**
     * 获取 objectId（供内部和 units 使用）
     */
    async getObjectId() {
        const now = Date.now();
        if (this._objectIdCache && now - this._objectIdCacheTime < this._objectIdCacheDuration) {
            return this._objectIdCache;
        }
        try {
            const { object } = await this._session.send("DOM.resolveNode", {
                nodeId: this._ref.nodeId,
            });
            this._objectIdCache = object.objectId;
            this._objectIdCacheTime = now;
            return object.objectId;
        }
        catch (e) {
            throw new Error(`Element no longer exists (nodeId: ${this._ref.nodeId})`);
        }
    }
    // ========== DrissionPage 风格的操作对象属性 ==========
    /**
     * 滚动操作对象
     */
    get scroll() {
        if (!this._scroll) {
            this._scroll = new ElementScroller_1.ElementScroller(this);
        }
        return this._scroll;
    }
    /**
     * 点击操作对象
     */
    get click() {
        if (!this._clicker) {
            this._clicker = new ElementClicker_1.ElementClicker(this);
        }
        return this._clicker;
    }
    /**
     * 等待操作对象
     */
    get wait() {
        if (!this._wait) {
            this._wait = new ElementWaiter_1.ElementWaiter(this);
        }
        return this._wait;
    }
    /**
     * 设置操作对象
     */
    get set() {
        if (!this._set) {
            this._set = new ElementSetter_1.ElementSetter(this);
        }
        return this._set;
    }
    /**
     * 位置信息对象
     */
    get rect() {
        if (!this._rect) {
            this._rect = new ElementRect_1.ElementRect(this);
        }
        return this._rect;
    }
    /**
     * 状态检查对象
     */
    get states() {
        if (!this._states) {
            this._states = new ElementStates_1.ElementStates(this);
        }
        return this._states;
    }
    /**
     * 下拉列表操作对象（仅 select 元素有效）
     */
    get select() {
        if (this._select === null) {
            // 延迟初始化，需要检查是否是 select 元素
            this._select = new SelectElement_1.SelectElement(this);
        }
        return this._select;
    }
    /**
     * 伪元素内容获取对象
     */
    get pseudo() {
        if (!this._pseudo) {
            this._pseudo = new Pseudo_1.Pseudo(this);
        }
        return this._pseudo;
    }
    // ========== 基础属性 ==========
    /**
     * 元素标签名
     */
    get tag() {
        return this.tag_name();
    }
    /**
     * 元素 outerHTML
     */
    get html() {
        return this.outer_html();
    }
    // ========== 基础方法 ==========
    async tag_name() {
        const objectId = await this.getObjectId();
        const { result } = await this._session.send("Runtime.callFunctionOn", {
            objectId,
            functionDeclaration: "function() { return this.tagName ? this.tagName.toLowerCase() : ''; }",
            returnByValue: true,
        });
        return result.value;
    }
    async outer_html() {
        const objectId = await this.getObjectId();
        const { result } = await this._session.send("Runtime.callFunctionOn", {
            objectId,
            functionDeclaration: "function() { return this.outerHTML || ''; }",
            returnByValue: true,
        });
        return result.value;
    }
    async inner_html() {
        const objectId = await this.getObjectId();
        const { result } = await this._session.send("Runtime.callFunctionOn", {
            objectId,
            functionDeclaration: "function() { return this.innerHTML || ''; }",
            returnByValue: true,
        });
        return result.value ?? "";
    }
    async text() {
        const objectId = await this.getObjectId();
        const { result } = await this._session.send("Runtime.callFunctionOn", {
            objectId,
            functionDeclaration: "function() { return (this && this.innerText) || ''; }",
            returnByValue: true,
        });
        return result.value;
    }
    async raw_text() {
        const objectId = await this.getObjectId();
        const { result } = await this._session.send("Runtime.callFunctionOn", {
            objectId,
            functionDeclaration: "function() { return (this && this.textContent) || ''; }",
            returnByValue: true,
        });
        return result.value;
    }
    async value() {
        const objectId = await this.getObjectId();
        const { result } = await this._session.send("Runtime.callFunctionOn", {
            objectId,
            functionDeclaration: "function() { return (this && this.value) || ''; }",
            returnByValue: true,
        });
        return result.value;
    }
    async attr(name) {
        const objectId = await this.getObjectId();
        const { result } = await this._session.send("Runtime.callFunctionOn", {
            objectId,
            functionDeclaration: "function(n) { return this && this.getAttribute ? this.getAttribute(n) : null; }",
            arguments: [{ value: name }],
            returnByValue: true,
        });
        return result.value;
    }
    async attrs() {
        const objectId = await this.getObjectId();
        const { result } = await this._session.send("Runtime.callFunctionOn", {
            objectId,
            functionDeclaration: `function() {
        if (!this || !this.attributes) return {};
        const attrs = {};
        for (let i = 0; i < this.attributes.length; i++) {
          attrs[this.attributes[i].name] = this.attributes[i].value;
        }
        return attrs;
      }`,
            returnByValue: true,
        });
        return result.value;
    }
    async property(name) {
        const objectId = await this.getObjectId();
        const { result } = await this._session.send("Runtime.callFunctionOn", {
            objectId,
            functionDeclaration: "function(n) { return this ? this[n] : null; }",
            arguments: [{ value: name }],
            returnByValue: true,
        });
        return result.value;
    }
    async style(name, pseudoEle = "") {
        const objectId = await this.getObjectId();
        const { result } = await this._session.send("Runtime.callFunctionOn", {
            objectId,
            functionDeclaration: `function(n, p) {
        const style = window.getComputedStyle(this, p || null);
        return style ? style.getPropertyValue(n) || style[n] || '' : '';
      }`,
            arguments: [{ value: name }, { value: pseudoEle }],
            returnByValue: true,
        });
        return result.value;
    }
    // ========== 属性设置方法（保持向后兼容） ==========
    async set_attr(name, value) {
        return this.set.attr(name, value);
    }
    async remove_attr(name) {
        const objectId = await this.getObjectId();
        await this._session.send("Runtime.callFunctionOn", {
            objectId,
            functionDeclaration: "function(n) { if (this && this.removeAttribute) { this.removeAttribute(n); } }",
            arguments: [{ value: name }],
        });
    }
    // ========== 状态检查方法（保持向后兼容） ==========
    async is_displayed() {
        return this.states.is_displayed;
    }
    async is_enabled() {
        return this.states.is_enabled;
    }
    async is_selected() {
        return this.states.is_selected;
    }
    // ========== 交互方法 ==========
    /**
     * 简单点击（向后兼容）
     */
    async do_click() {
        await this.click.left(true);
        return this;
    }
    /**
     * 输入文本
     */
    async input(value, clear = false) {
        const objectId = await this.getObjectId();
        await this._session.send("Runtime.callFunctionOn", {
            objectId,
            functionDeclaration: `function(v, c) { 
        var el = this; 
        if (!el) return; 
        el.focus && el.focus(); 
        if (c) el.value = ''; 
        el.value = v; 
        if (typeof Event === 'function') { 
          el.dispatchEvent(new Event('input', { bubbles: true })); 
          el.dispatchEvent(new Event('change', { bubbles: true })); 
        } 
      }`,
            arguments: [{ value }, { value: clear }],
        });
        return this;
    }
    /**
     * 清空内容
     */
    async clear() {
        const objectId = await this.getObjectId();
        await this._session.send("Runtime.callFunctionOn", {
            objectId,
            functionDeclaration: `function() {
        if (this) {
          if (this.value !== undefined) this.value = '';
          if (this.innerText !== undefined) this.innerText = '';
        }
      }`,
        });
    }
    /**
     * 获取焦点
     */
    async focus() {
        const objectId = await this.getObjectId();
        await this._session.send("Runtime.callFunctionOn", {
            objectId,
            functionDeclaration: "function() { if (this && this.focus) { this.focus(); } }",
        });
    }
    /**
     * 鼠标悬停
     */
    async hover() {
        const loc = await this.rect.viewport_midpoint();
        await this._session.send("Input.dispatchMouseEvent", {
            type: "mouseMoved",
            x: loc.x,
            y: loc.y,
        });
    }
    /**
     * 双击
     */
    async double_click() {
        await this.click.multi(2);
    }
    /**
     * 右键点击
     */
    async right_click() {
        await this.click.right();
    }
    /**
     * 滚动到可见
     */
    async scroll_into_view() {
        await this.scroll.to_see();
    }
    /**
     * 选中/取消选中复选框
     */
    async check(uncheck = false, _byJs = false) {
        const objectId = await this.getObjectId();
        await this._session.send("Runtime.callFunctionOn", {
            objectId,
            functionDeclaration: `function(uncheck) {
        if (!this) return;
        const shouldCheck = !uncheck;
        if (this.checked !== shouldCheck) {
          this.checked = shouldCheck;
          this.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }`,
            arguments: [{ value: uncheck }],
        });
    }
    // ========== 拖拽方法 ==========
    /**
     * 拖拽到相对位置
     */
    async drag(offsetX = 0, offsetY = 0, duration = 0.5) {
        const loc = await this.rect.viewport_midpoint();
        const startX = loc.x;
        const startY = loc.y;
        const endX = startX + offsetX;
        const endY = startY + offsetY;
        await this._performDrag(startX, startY, endX, endY, duration);
    }
    /**
     * 拖拽到目标元素或坐标
     */
    async drag_to(target, duration = 0.5) {
        const loc = await this.rect.viewport_midpoint();
        let endX, endY;
        if (target instanceof Element) {
            const targetLoc = await target.rect.viewport_midpoint();
            endX = targetLoc.x;
            endY = targetLoc.y;
        }
        else {
            endX = target.x;
            endY = target.y;
        }
        await this._performDrag(loc.x, loc.y, endX, endY, duration);
    }
    async _performDrag(startX, startY, endX, endY, duration) {
        const steps = Math.max(1, Math.floor(duration * 20));
        await this._session.send("Input.dispatchMouseEvent", {
            type: "mouseMoved",
            x: startX,
            y: startY,
        });
        await this._session.send("Input.dispatchMouseEvent", {
            type: "mousePressed",
            x: startX,
            y: startY,
            button: "left",
            clickCount: 1,
        });
        for (let i = 1; i <= steps; i++) {
            const x = startX + ((endX - startX) * i) / steps;
            const y = startY + ((endY - startY) * i) / steps;
            await this._session.send("Input.dispatchMouseEvent", {
                type: "mouseMoved",
                x,
                y,
            });
            await new Promise(resolve => setTimeout(resolve, duration * 1000 / steps));
        }
        await this._session.send("Input.dispatchMouseEvent", {
            type: "mouseReleased",
            x: endX,
            y: endY,
            button: "left",
            clickCount: 1,
        });
    }
    // ========== 位置和大小方法（保持向后兼容） ==========
    async location() {
        return this.rect.location();
    }
    async size() {
        return this.rect.size();
    }
    async get_rect() {
        const loc = await this.rect.location();
        const sz = await this.rect.size();
        return { ...loc, ...sz };
    }
    // ========== DOM 导航方法 ==========
    async parent(levelOrLoc = 1, _index = 1) {
        if (typeof levelOrLoc === "number") {
            return this._getParentByLevel(levelOrLoc);
        }
        // TODO: 支持定位符查找父元素
        return this._getParentByLevel(1);
    }
    async _getParentByLevel(level) {
        const objectId = await this.getObjectId();
        const { result } = await this._session.send("Runtime.callFunctionOn", {
            objectId,
            functionDeclaration: `function(level) {
        let el = this;
        for (let i = 0; i < level && el; i++) {
          el = el.parentElement;
        }
        return el;
      }`,
            arguments: [{ value: level }],
        });
        if (!result.objectId)
            return null;
        const { nodeId } = await this._session.send("DOM.requestNode", {
            objectId: result.objectId,
        });
        return this._createElement(nodeId);
    }
    async child(locatorOrIndex = 1, index = 1) {
        if (typeof locatorOrIndex === "number") {
            return this._getChildByIndex(locatorOrIndex);
        }
        // 使用定位符查找
        const children = await this.children(locatorOrIndex);
        return children[index - 1] ?? null;
    }
    async _getChildByIndex(idx) {
        const objectId = await this.getObjectId();
        const { result } = await this._session.send("Runtime.callFunctionOn", {
            objectId,
            functionDeclaration: `function(i) { 
        const children = Array.from(this.children);
        const idx = i > 0 ? i - 1 : children.length + i;
        return children[idx] || null;
      }`,
            arguments: [{ value: idx }],
        });
        if (!result.objectId)
            return null;
        const { nodeId } = await this._session.send("DOM.requestNode", {
            objectId: result.objectId,
        });
        return this._createElement(nodeId);
    }
    async children(locator = "") {
        if (locator) {
            return this.eles(locator);
        }
        const objectId = await this.getObjectId();
        const { result } = await this._session.send("Runtime.callFunctionOn", {
            objectId,
            functionDeclaration: "function() { return this.children ? this.children.length : 0; }",
            returnByValue: true,
        });
        const count = result.value;
        const elements = [];
        for (let i = 1; i <= count; i++) {
            const child = await this._getChildByIndex(i);
            if (child)
                elements.push(child);
        }
        return elements;
    }
    async next(locator = "", index = 1) {
        if (locator) {
            const nexts = await this.nexts(locator);
            return nexts[index - 1] ?? null;
        }
        return this._getSibling("nextElementSibling", index);
    }
    async prev(locator = "", index = 1) {
        if (locator) {
            const prevs = await this.prevs(locator);
            return prevs[index - 1] ?? null;
        }
        return this._getSibling("previousElementSibling", index);
    }
    async _getSibling(direction, count) {
        const objectId = await this.getObjectId();
        const { result } = await this._session.send("Runtime.callFunctionOn", {
            objectId,
            functionDeclaration: `function(dir, count) {
        let el = this;
        for (let i = 0; i < count && el; i++) {
          el = el[dir];
        }
        return el;
      }`,
            arguments: [{ value: direction }, { value: count }],
        });
        if (!result.objectId)
            return null;
        const { nodeId } = await this._session.send("DOM.requestNode", {
            objectId: result.objectId,
        });
        return this._createElement(nodeId);
    }
    async nexts(locator = "") {
        return this._getSiblings("nextElementSibling", locator);
    }
    async prevs(locator = "") {
        return this._getSiblings("previousElementSibling", locator);
    }
    async _getSiblings(direction, locator) {
        const objectId = await this.getObjectId();
        const { result } = await this._session.send("Runtime.callFunctionOn", {
            objectId,
            functionDeclaration: `function(dir, selector) {
        const results = [];
        let el = this[dir];
        while (el) {
          if (!selector || el.matches(selector)) {
            results.push(1); // 占位
          }
          el = el[dir];
        }
        return results.length;
      }`,
            arguments: [{ value: direction }, { value: locator }],
            returnByValue: true,
        });
        const count = result.value;
        const elements = [];
        // 逐个获取
        for (let i = 0; i < count; i++) {
            const { result: sibResult } = await this._session.send("Runtime.callFunctionOn", {
                objectId,
                functionDeclaration: `function(dir, selector, idx) {
          let el = this[dir];
          let found = 0;
          while (el) {
            if (!selector || el.matches(selector)) {
              if (found === idx) return el;
              found++;
            }
            el = el[dir];
          }
          return null;
        }`,
                arguments: [{ value: direction }, { value: locator }, { value: i }],
            });
            if (sibResult.objectId) {
                const { nodeId } = await this._session.send("DOM.requestNode", {
                    objectId: sibResult.objectId,
                });
                elements.push(this._createElement(nodeId));
            }
        }
        return elements;
    }
    async before(locator = "", index = 1) {
        const befores = await this.befores(locator);
        return befores[index - 1] ?? null;
    }
    async after(locator = "", index = 1) {
        const afters = await this.afters(locator);
        return afters[index - 1] ?? null;
    }
    async befores(locator = "") {
        // 获取文档中此元素之前的所有匹配元素
        const objectId = await this.getObjectId();
        const { result } = await this._session.send("Runtime.callFunctionOn", {
            objectId,
            functionDeclaration: `function(selector) {
        const all = selector ? document.querySelectorAll(selector) : document.querySelectorAll('*');
        let count = 0;
        for (const el of all) {
          if (el === this) break;
          count++;
        }
        return count;
      }`,
            arguments: [{ value: locator }],
            returnByValue: true,
        });
        const count = result.value;
        if (count === 0)
            return [];
        // 获取这些元素
        const selector = locator || "*";
        const { nodeIds } = await this._session.send("DOM.querySelectorAll", {
            nodeId: (await this._getDocumentNodeId()),
            selector,
        });
        return nodeIds.slice(0, count).map(nodeId => this._createElement(nodeId));
    }
    async afters(locator = "") {
        const objectId = await this.getObjectId();
        const { result } = await this._session.send("Runtime.callFunctionOn", {
            objectId,
            functionDeclaration: `function(selector) {
        const all = selector ? document.querySelectorAll(selector) : document.querySelectorAll('*');
        let found = false;
        let count = 0;
        for (const el of all) {
          if (found) count++;
          if (el === this) found = true;
        }
        return count;
      }`,
            arguments: [{ value: locator }],
            returnByValue: true,
        });
        const count = result.value;
        if (count === 0)
            return [];
        const selector = locator || "*";
        const { nodeIds } = await this._session.send("DOM.querySelectorAll", {
            nodeId: (await this._getDocumentNodeId()),
            selector,
        });
        // 返回最后 count 个元素
        return nodeIds.slice(-count).map(nodeId => this._createElement(nodeId));
    }
    async _getDocumentNodeId() {
        const { root } = await this._session.send("DOM.getDocument", { depth: 0 });
        return root.nodeId;
    }
    /**
     * 创建子元素，继承 page 引用
     */
    _createElement(nodeId) {
        return new Element(this._session, { nodeId }, this._page);
    }
    // ========== Shadow DOM ==========
    async shadow_root() {
        const objectId = await this.getObjectId();
        const { result } = await this._session.send("Runtime.callFunctionOn", {
            objectId,
            functionDeclaration: "function() { return this.shadowRoot; }",
        });
        if (!result.objectId)
            return null;
        const { nodeId } = await this._session.send("DOM.requestNode", {
            objectId: result.objectId,
        });
        return this._createElement(nodeId);
    }
    /**
     * shadow_root 的简写
     */
    get sr() {
        return this.shadow_root();
    }
    // ========== 元素查找 ==========
    async ele(locator, index = 1) {
        const elements = await this.eles(locator);
        const idx = index > 0 ? index - 1 : elements.length + index;
        return elements[idx] ?? null;
    }
    async eles(locator) {
        const objectId = await this.getObjectId();
        // 判断是 CSS 还是 XPath
        const isXPath = locator.startsWith("//") || locator.startsWith("./") || locator.startsWith("(");
        if (isXPath) {
            return this._elesByXPath(locator);
        }
        // CSS 选择器
        const { result } = await this._session.send("Runtime.callFunctionOn", {
            objectId,
            functionDeclaration: `function(selector) { return this.querySelectorAll(selector).length; }`,
            arguments: [{ value: locator }],
            returnByValue: true,
        });
        const count = result.value;
        const elements = [];
        for (let i = 0; i < count; i++) {
            const { result: elResult } = await this._session.send("Runtime.callFunctionOn", {
                objectId,
                functionDeclaration: `function(selector, idx) { return this.querySelectorAll(selector)[idx]; }`,
                arguments: [{ value: locator }, { value: i }],
            });
            if (elResult.objectId) {
                const { nodeId } = await this._session.send("DOM.requestNode", {
                    objectId: elResult.objectId,
                });
                elements.push(this._createElement(nodeId));
            }
        }
        return elements;
    }
    async _elesByXPath(xpath) {
        const objectId = await this.getObjectId();
        // 使用 document.evaluate 在元素内查找
        const { result } = await this._session.send("Runtime.callFunctionOn", {
            objectId,
            functionDeclaration: `function(xpath) {
        const result = document.evaluate(xpath, this, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        return result.snapshotLength;
      }`,
            arguments: [{ value: xpath }],
            returnByValue: true,
        });
        const count = result.value;
        const elements = [];
        for (let i = 0; i < count; i++) {
            const { result: elResult } = await this._session.send("Runtime.callFunctionOn", {
                objectId,
                functionDeclaration: `function(xpath, idx) {
          const result = document.evaluate(xpath, this, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
          return result.snapshotItem(idx);
        }`,
                arguments: [{ value: xpath }, { value: i }],
            });
            if (elResult.objectId) {
                const { nodeId } = await this._session.send("DOM.requestNode", {
                    objectId: elResult.objectId,
                });
                elements.push(this._createElement(nodeId));
            }
        }
        return elements;
    }
    /**
     * 以 SessionElement 形式返回元素（高效处理复杂页面）
     */
    async s_ele(locator, index = 1) {
        // 获取元素的 HTML，然后用 cheerio 解析
        const html = await this.html;
        const { load } = await Promise.resolve().then(() => __importStar(require("cheerio")));
        const { SessionElement } = await Promise.resolve().then(() => __importStar(require("./SessionElement")));
        const { parseLocator } = await Promise.resolve().then(() => __importStar(require("./locator")));
        const $ = load(html);
        const parsed = parseLocator(locator);
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
        return node ? new SessionElement($, node) : null;
    }
    /**
     * 以 SessionElement 列表形式返回所有匹配元素
     */
    async s_eles(locator) {
        const html = await this.html;
        const { load } = await Promise.resolve().then(() => __importStar(require("cheerio")));
        const { SessionElement } = await Promise.resolve().then(() => __importStar(require("./SessionElement")));
        const { parseLocator } = await Promise.resolve().then(() => __importStar(require("./locator")));
        const $ = load(html);
        const parsed = parseLocator(locator);
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
        return nodes.map((node) => new SessionElement($, node));
    }
    // ========== JavaScript 执行 ==========
    async run_js(script, ...args) {
        const objectId = await this.getObjectId();
        const { result } = await this._session.send("Runtime.callFunctionOn", {
            objectId,
            functionDeclaration: `function() { ${script} }`,
            arguments: args.map(a => ({ value: a })),
            returnByValue: true,
        });
        return result.value;
    }
    async run_async_js(script, ...args) {
        const objectId = await this.getObjectId();
        await this._session.send("Runtime.callFunctionOn", {
            objectId,
            functionDeclaration: `function() { ${script} }`,
            arguments: args.map(a => ({ value: a })),
            awaitPromise: false,
        });
    }
    // ========== 截图 ==========
    async screenshot(path) {
        const { model } = await this._session.send("DOM.getBoxModel", { nodeId: this._ref.nodeId });
        const { data } = await this._session.send("Page.captureScreenshot", {
            format: "png",
            clip: {
                x: model.content[0],
                y: model.content[1],
                width: model.content[4] - model.content[0],
                height: model.content[5] - model.content[1],
                scale: 1,
            },
        });
        const buffer = Buffer.from(data, "base64");
        if (path) {
            const fs = await Promise.resolve().then(() => __importStar(require("fs")));
            fs.writeFileSync(path, buffer);
        }
        return buffer;
    }
    async get_screenshot(path, name, asBytes, asBase64, scrollToCenter = true) {
        if (scrollToCenter) {
            await this.scroll.to_center();
        }
        const buffer = await this.screenshot(path ? `${path}/${name || "screenshot.png"}` : undefined);
        if (asBase64) {
            return buffer.toString("base64");
        }
        if (asBytes) {
            return buffer;
        }
        if (path) {
            const fullPath = `${path}/${name || "screenshot.png"}`;
            const fs = await Promise.resolve().then(() => __importStar(require("fs")));
            fs.writeFileSync(fullPath, buffer);
            return fullPath;
        }
        return buffer;
    }
    // ========== 资源获取 ==========
    async src(_timeout, base64ToBytes = true) {
        const srcAttr = await this.attr("src");
        if (!srcAttr)
            return null;
        // 如果是 base64 数据
        if (srcAttr.startsWith("data:")) {
            const match = srcAttr.match(/^data:[^;]+;base64,(.+)$/);
            if (match && base64ToBytes) {
                return Buffer.from(match[1], "base64");
            }
            return srcAttr;
        }
        // 返回 URL
        return srcAttr;
    }
    async save(path, name, _timeout, _rename = true) {
        const src = await this.src(_timeout);
        if (!src) {
            throw new Error("Element has no src attribute");
        }
        // 如果是 Buffer，直接保存
        if (Buffer.isBuffer(src)) {
            const fs = await Promise.resolve().then(() => __importStar(require("fs")));
            const filePath = path ? `${path}/${name || "file"}` : name || "file";
            fs.writeFileSync(filePath, src);
            return filePath;
        }
        // 如果是 URL，需要下载
        // TODO: 实现 URL 下载
        return src;
    }
    // ========== 方向定位方法 ==========
    /**
     * 获取元素右边的指定元素
     */
    async east(locOrPixel, index = 1) {
        return this._getRelativeEle("east", locOrPixel, index);
    }
    /**
     * 获取元素下方的指定元素
     */
    async south(locOrPixel, index = 1) {
        return this._getRelativeEle("south", locOrPixel, index);
    }
    /**
     * 获取元素左边的指定元素
     */
    async west(locOrPixel, index = 1) {
        return this._getRelativeEle("west", locOrPixel, index);
    }
    /**
     * 获取元素上方的指定元素
     */
    async north(locOrPixel, index = 1) {
        return this._getRelativeEle("north", locOrPixel, index);
    }
    /**
     * 获取覆盖在本元素上最上层的元素
     */
    async over() {
        const loc = await this.rect.viewport_midpoint();
        const objectId = await this.getObjectId();
        const { result } = await this._session.send("Runtime.callFunctionOn", {
            objectId,
            functionDeclaration: `function(x, y) {
        const el = document.elementFromPoint(x, y);
        return el !== this ? el : null;
      }`,
            arguments: [{ value: loc.x }, { value: loc.y }],
        });
        if (!result.objectId)
            return null;
        const { nodeId } = await this._session.send("DOM.requestNode", {
            objectId: result.objectId,
        });
        return this._createElement(nodeId);
    }
    /**
     * 获取相对本元素指定偏移量位置的元素
     */
    async offset(locator, x, y) {
        const rect = await this.rect.viewport_location();
        const size = await this.rect.size();
        // 如果没有指定偏移量，定位到元素中间点
        const targetX = x !== undefined ? rect.x + x : rect.x + size.width / 2;
        const targetY = y !== undefined ? rect.y + y : rect.y + size.height / 2;
        const { result } = await this._session.send("Runtime.evaluate", {
            expression: `document.elementFromPoint(${targetX}, ${targetY})`,
            returnByValue: false,
        });
        if (!result.objectId)
            return null;
        const { nodeId } = await this._session.send("DOM.requestNode", {
            objectId: result.objectId,
        });
        const ele = this._createElement(nodeId);
        // 如果有定位符，在找到的元素中继续查找
        if (locator) {
            return ele.ele(locator);
        }
        return ele;
    }
    async _getRelativeEle(direction, locOrPixel, index = 1) {
        const myRect = await this.get_rect();
        const myCenterX = myRect.x + myRect.width / 2;
        const myCenterY = myRect.y + myRect.height / 2;
        // 如果是像素距离
        if (typeof locOrPixel === "number") {
            let targetX = myCenterX;
            let targetY = myCenterY;
            switch (direction) {
                case "east":
                    targetX += locOrPixel;
                    break;
                case "west":
                    targetX -= locOrPixel;
                    break;
                case "south":
                    targetY += locOrPixel;
                    break;
                case "north":
                    targetY -= locOrPixel;
                    break;
            }
            const { result } = await this._session.send("Runtime.evaluate", {
                expression: `document.elementFromPoint(${targetX}, ${targetY})`,
            });
            if (!result.objectId)
                return null;
            const { nodeId } = await this._session.send("DOM.requestNode", {
                objectId: result.objectId,
            });
            return this._createElement(nodeId);
        }
        // 如果是定位符，查找所有匹配元素并按方向筛选
        const selector = locOrPixel || "*";
        const docNodeId = await this._getDocumentNodeId();
        const { nodeIds } = await this._session.send("DOM.querySelectorAll", {
            nodeId: docNodeId,
            selector,
        });
        const candidates = [];
        for (const nodeId of nodeIds) {
            const ele = this._createElement(nodeId);
            try {
                const rect = await ele.get_rect();
                const centerX = rect.x + rect.width / 2;
                const centerY = rect.y + rect.height / 2;
                let isInDirection = false;
                let distance = 0;
                switch (direction) {
                    case "east":
                        isInDirection = centerX > myCenterX;
                        distance = centerX - myCenterX;
                        break;
                    case "west":
                        isInDirection = centerX < myCenterX;
                        distance = myCenterX - centerX;
                        break;
                    case "south":
                        isInDirection = centerY > myCenterY;
                        distance = centerY - myCenterY;
                        break;
                    case "north":
                        isInDirection = centerY < myCenterY;
                        distance = myCenterY - centerY;
                        break;
                }
                if (isInDirection && distance > 0) {
                    candidates.push({ ele, distance });
                }
            }
            catch {
                // 忽略无法获取位置的元素
            }
        }
        // 按距离排序
        candidates.sort((a, b) => a.distance - b.distance);
        return candidates[index - 1]?.ele ?? null;
    }
}
exports.Element = Element;
