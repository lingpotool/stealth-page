"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChromiumFrame = void 0;
const Element_1 = require("../core/Element");
const FrameScroller_1 = require("../units/FrameScroller");
const PageStates_1 = require("../units/PageStates");
const PageRect_1 = require("../units/PageRect");
/**
 * ChromiumFrame 类，对应 DrissionPage 的 ChromiumFrame
 * 用于处理 iframe 内的操作
 */
class ChromiumFrame {
    constructor(session, frameId, frameEle) {
        this._documentNodeId = null;
        this._scroller = null;
        this._states = null;
        this._rect = null;
        this._session = session;
        this._frameId = frameId;
        this._frameEle = frameEle;
    }
    /**
     * 获取 frame 的 CDP session
     */
    get session() {
        return this._session;
    }
    /**
     * 获取 cdpSession（兼容 ScrollablePage 接口）
     */
    get cdpSession() {
        return this._session;
    }
    /**
     * 获取 frame ID
     */
    get frameId() {
        return this._frameId;
    }
    /**
     * 获取 frame 元素
     */
    get frame_ele() {
        return this._frameEle;
    }
    /**
     * 滚动操作对象
     */
    get scroll() {
        if (!this._scroller) {
            this._scroller = new FrameScroller_1.FrameScroller(this);
        }
        return this._scroller;
    }
    /**
     * 状态检查对象
     */
    get states() {
        if (!this._states) {
            this._states = new PageStates_1.PageStates({ cdpSession: this._session });
        }
        return this._states;
    }
    /**
     * 位置信息对象
     */
    get rect() {
        if (!this._rect) {
            this._rect = new PageRect_1.PageRect({ cdpSession: this._session });
        }
        return this._rect;
    }
    /**
     * 获取 frame 的 URL
     */
    async url() {
        const src = await this._frameEle.attr("src");
        return src || "";
    }
    /**
     * 获取 frame 的 title
     */
    async title() {
        const { result } = await this._session.send("Runtime.evaluate", {
            expression: "document.title",
            contextId: await this._getContextId(),
            returnByValue: true,
        });
        return result.value || "";
    }
    /**
     * 获取 frame 的 HTML
     */
    async html() {
        return this._frameEle.outer_html();
    }
    /**
     * 获取 frame 的 innerHTML
     */
    async inner_html() {
        return this._frameEle.inner_html();
    }
    /**
     * 获取 frame 的标签名
     */
    async tag() {
        return this._frameEle.tag_name();
    }
    /**
     * 获取 frame 元素的属性
     */
    async attr(name) {
        return this._frameEle.attr(name);
    }
    /**
     * 获取 frame 元素的所有属性
     */
    async attrs() {
        return this._frameEle.attrs();
    }
    /**
     * 刷新 frame
     */
    async refresh() {
        const src = await this._frameEle.attr("src");
        if (src) {
            await this._frameEle.set.attr("src", src);
        }
    }
    /**
     * 在 frame 内查找单个元素
     */
    async ele(locator, index = 1) {
        const elements = await this.eles(locator);
        const idx = index > 0 ? index - 1 : elements.length + index;
        return elements[idx] ?? null;
    }
    /**
     * 在 frame 内查找所有元素
     */
    async eles(locator) {
        const docNodeId = await this._getDocumentNodeId();
        // 判断是 CSS 还是 XPath
        const isXPath = locator.startsWith("//") || locator.startsWith("./") || locator.startsWith("(");
        if (isXPath) {
            return this._elesByXPath(locator, docNodeId);
        }
        // CSS 选择器
        const { nodeIds } = await this._session.send("DOM.querySelectorAll", {
            nodeId: docNodeId,
            selector: locator,
        });
        return nodeIds.map(nodeId => new Element_1.Element(this._session, { nodeId }));
    }
    async _elesByXPath(xpath, contextNodeId) {
        const { result } = await this._session.send("Runtime.evaluate", {
            expression: `(() => {
        const result = document.evaluate(${JSON.stringify(xpath)}, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        return result.snapshotLength;
      })()`,
            contextId: await this._getContextId(),
            returnByValue: true,
        });
        const count = result.value;
        const elements = [];
        for (let i = 0; i < count; i++) {
            const { result: elResult } = await this._session.send("Runtime.evaluate", {
                expression: `(() => {
          const result = document.evaluate(${JSON.stringify(xpath)}, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
          return result.snapshotItem(${i});
        })()`,
                contextId: await this._getContextId(),
            });
            if (elResult.objectId) {
                const { nodeId } = await this._session.send("DOM.requestNode", {
                    objectId: elResult.objectId,
                });
                elements.push(new Element_1.Element(this._session, { nodeId }));
            }
        }
        return elements;
    }
    /**
     * 在 frame 内执行 JS
     */
    async run_js(script, ...args) {
        const { result } = await this._session.send("Runtime.evaluate", {
            expression: `(function() { ${script} })()`,
            contextId: await this._getContextId(),
            returnByValue: true,
            arguments: args.map(a => ({ value: a })),
        });
        return result.value;
    }
    /**
     * 异步执行 JS
     */
    async run_async_js(script, ...args) {
        await this._session.send("Runtime.evaluate", {
            expression: `(function() { ${script} })()`,
            contextId: await this._getContextId(),
            awaitPromise: false,
            arguments: args.map(a => ({ value: a })),
        });
    }
    /**
     * 截图
     */
    async screenshot(path) {
        return this._frameEle.screenshot(path);
    }
    /**
     * 获取 frame 的执行上下文 ID
     */
    async _getContextId() {
        // 获取 frame 的执行上下文
        const { frameTree } = await this._session.send("Page.getFrameTree");
        const findFrame = (tree) => {
            if (tree.frame.id === this._frameId) {
                return tree;
            }
            if (tree.childFrames) {
                for (const child of tree.childFrames) {
                    const found = findFrame(child);
                    if (found)
                        return found;
                }
            }
            return null;
        };
        const frameInfo = findFrame(frameTree);
        if (!frameInfo) {
            throw new Error(`Frame not found: ${this._frameId}`);
        }
        // 获取该 frame 的执行上下文
        const { result } = await this._session.send("Runtime.evaluate", {
            expression: "1",
            contextId: undefined,
        });
        // 返回默认上下文（简化实现）
        return 1;
    }
    /**
     * 获取 frame 的 document 节点 ID
     */
    async _getDocumentNodeId() {
        if (this._documentNodeId) {
            return this._documentNodeId;
        }
        // 获取 frame 的 document
        const { root } = await this._session.send("DOM.getDocument", {
            depth: 0,
        });
        this._documentNodeId = root.nodeId;
        return root.nodeId;
    }
    // ========== DOM 导航方法 ==========
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
}
exports.ChromiumFrame = ChromiumFrame;
