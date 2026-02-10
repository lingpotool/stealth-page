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
        const { parseLocator } = await Promise.resolve().then(() => __importStar(require("../core/locator")));
        const parsed = parseLocator(locator);
        const docNodeId = await this._getDocumentNodeId();
        if (parsed.type === "xpath") {
            return this._elesByXPath(parsed.value, docNodeId);
        }
        // CSS 选择器
        const { nodeIds } = await this._session.send("DOM.querySelectorAll", {
            nodeId: docNodeId,
            selector: parsed.value,
        });
        return nodeIds.map(nodeId => new Element_1.Element(this._session, { nodeId }));
    }
    async _elesByXPath(xpath, contextNodeId) {
        const escapedXpath = xpath.replace(/'/g, "\\'");
        // 对齐 DrissionPage: 一次性获取所有结果
        const js = `(() => {
      let a=[];
      let e=document.evaluate('${escapedXpath}',document,null,7,null);
      for(let i=0;i<e.snapshotLength;i++){
        let node=e.snapshotItem(i);
        if(node.nodeType===1){a.push(node);}
      }
      return a;
    })()`;
        const { result } = await this._session.send("Runtime.evaluate", {
            expression: js,
            contextId: await this._getContextId(),
            returnByValue: false,
        });
        if (!result.objectId || result.subtype === "null" || result.description === "Array(0)") {
            return [];
        }
        const { result: propsResult } = await this._session.send("Runtime.getProperties", {
            objectId: result.objectId,
            ownProperties: true,
        });
        const elements = [];
        // 确保 DOM 树已初始化
        await this._session.send("DOM.getDocument", { depth: -1 });
        for (const prop of propsResult) {
            if (prop.name === "length" || !prop.value?.objectId || isNaN(Number(prop.name)))
                continue;
            if (prop.value.type !== "object")
                continue;
            try {
                const { nodeId } = await this._session.send("DOM.requestNode", {
                    objectId: prop.value.objectId,
                });
                if (nodeId > 0) {
                    elements.push(new Element_1.Element(this._session, { nodeId }));
                }
            }
            catch {
                // 跳过无效元素
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
