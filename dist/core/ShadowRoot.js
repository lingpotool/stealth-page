"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShadowRoot = void 0;
const Element_1 = require("./Element");
const locator_1 = require("./locator");
/**
 * ShadowRoot 类，对应 DrissionPage 的 ShadowRoot
 * 用于操作 Shadow DOM 内的元素
 */
class ShadowRoot {
    constructor(parentEle, opts) {
        this._backendNodeId = 0;
        this._objectId = null;
        this._nodeId = 0;
        this._page = null;
        this._session = parentEle.session;
        this._parentEle = parentEle;
        this._page = parentEle.getPage();
        if (opts?.backendId) {
            this._backendNodeId = opts.backendId;
        }
        if (opts?.objId) {
            this._objectId = opts.objId;
        }
    }
    get session() {
        return this._session;
    }
    get parent_ele() {
        return this._parentEle;
    }
    get tag() {
        return "shadow-root";
    }
    get backendNodeId() {
        return this._backendNodeId;
    }
    /**
     * 获取 shadow root 的 innerHTML
     */
    async inner_html() {
        return this.run_js("return this.innerHTML;");
    }
    /**
     * 获取 shadow root 的 HTML
     */
    async html() {
        const inner = await this.inner_html();
        return `<shadow_root>${inner}</shadow_root>`;
    }
    /**
     * 在 shadow root 内执行 JS
     */
    async run_js(script, ...args) {
        const objectId = await this._getObjectId();
        const needsReturn = !script.trimStart().startsWith("return ") && !script.includes("\n");
        const wrappedScript = needsReturn ? `return ${script}` : script;
        const { result } = await this._session.send("Runtime.callFunctionOn", {
            objectId,
            functionDeclaration: `function() { ${wrappedScript} }`,
            arguments: args.map((a) => ({ value: a })),
            returnByValue: true,
        });
        return result.value;
    }
    /**
     * 异步执行 JS
     */
    async run_async_js(script, ...args) {
        const objectId = await this._getObjectId();
        await this._session.send("Runtime.callFunctionOn", {
            objectId,
            functionDeclaration: `function() { ${script} }`,
            arguments: args.map((a) => ({ value: a })),
            awaitPromise: false,
        });
    }
    /**
     * 在 shadow root 内查找单个元素
     */
    async ele(locator, index = 1) {
        const elements = await this.eles(locator);
        const idx = index > 0 ? index - 1 : elements.length + index;
        return elements[idx] ?? null;
    }
    /**
     * 在 shadow root 内查找所有元素
     */
    async eles(locator) {
        const parsed = (0, locator_1.parseLocator)(locator);
        if (parsed.type === "xpath") {
            return this._elesByXPath(parsed.value);
        }
        // CSS 选择器
        const nodeId = await this._getNodeId();
        try {
            const { nodeIds } = await this._session.send("DOM.querySelectorAll", {
                nodeId,
                selector: parsed.value,
            });
            return nodeIds
                .filter((id) => id > 0)
                .map((id) => {
                const el = new Element_1.Element(this._session, { nodeId: id }, this._page);
                return el;
            });
        }
        catch {
            return [];
        }
    }
    /**
     * 获取父元素
     */
    async parent(levelOrLoc = 1) {
        return this._parentEle.parent(levelOrLoc);
    }
    /**
     * 获取子元素
     */
    async child(locatorOrIndex = 1, index = 1) {
        if (typeof locatorOrIndex === "number") {
            const children = await this.children();
            const idx = locatorOrIndex > 0 ? locatorOrIndex - 1 : children.length + locatorOrIndex;
            return children[idx] ?? null;
        }
        const children = await this.children(locatorOrIndex);
        const idx = index > 0 ? index - 1 : children.length + index;
        return children[idx] ?? null;
    }
    /**
     * 获取所有子元素
     */
    async children(locator = "") {
        if (!locator) {
            return this.eles("css:*");
        }
        return this.eles(locator);
    }
    /**
     * 获取下一个兄弟元素（相对于 parent_ele）
     */
    async next(locator = "", index = 1) {
        return this._parentEle.next(locator, index);
    }
    /**
     * 获取前面的兄弟元素
     */
    async before(locator = "", index = 1) {
        return this._parentEle.before(locator, index);
    }
    /**
     * 获取后面的兄弟元素
     */
    async after(locator = "", index = 1) {
        return this._parentEle.after(locator, index);
    }
    toString() {
        return `<ShadowRoot in ${this._parentEle}>`;
    }
    // ========== 私有方法 ==========
    async _getObjectId() {
        if (this._objectId)
            return this._objectId;
        if (this._backendNodeId > 0) {
            const { object } = await this._session.send("DOM.resolveNode", {
                backendNodeId: this._backendNodeId,
            });
            this._objectId = object.objectId;
            return object.objectId;
        }
        // 通过父元素获取 shadow root
        const parentObjId = await this._parentEle.getObjectId();
        const { result } = await this._session.send("Runtime.callFunctionOn", {
            objectId: parentObjId,
            functionDeclaration: "function() { return this.shadowRoot; }",
            returnByValue: false,
        });
        if (result.objectId) {
            this._objectId = result.objectId;
            return result.objectId;
        }
        throw new Error("Cannot get ShadowRoot objectId");
    }
    async _getNodeId() {
        if (this._nodeId > 0)
            return this._nodeId;
        const objectId = await this._getObjectId();
        // 确保 DOM 树已初始化
        await this._session.send("DOM.getDocument", { depth: -1 });
        const { nodeId } = await this._session.send("DOM.requestNode", {
            objectId,
        });
        this._nodeId = nodeId;
        return nodeId;
    }
    async _elesByXPath(xpath) {
        // Shadow DOM 内的 XPath 查找
        const objectId = await this._getObjectId();
        const escapedXpath = xpath.replace(/'/g, "\\'");
        const js = `(() => {
      let a=[];
      let e=document.evaluate('${escapedXpath}',this,null,7,null);
      for(let i=0;i<e.snapshotLength;i++){
        let node=e.snapshotItem(i);
        if(node.nodeType===1){a.push(node);}
      }
      return a;
    })()`;
        const { result } = await this._session.send("Runtime.callFunctionOn", {
            objectId,
            functionDeclaration: `function() { ${js.replace("document.evaluate", "document.evaluate")} }`,
            returnByValue: false,
        });
        if (!result.objectId || result.subtype === "null") {
            return [];
        }
        const { result: propsResult } = await this._session.send("Runtime.getProperties", {
            objectId: result.objectId,
            ownProperties: true,
        });
        const elements = [];
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
                    elements.push(new Element_1.Element(this._session, { nodeId }, this._page));
                }
            }
            catch {
                // 跳过无效元素
            }
        }
        return elements;
    }
}
exports.ShadowRoot = ShadowRoot;
