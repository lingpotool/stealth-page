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
exports.ShadowRoot = void 0;
const Element_1 = require("./Element");
const NoneElement_1 = require("./NoneElement");
const locator_1 = require("./locator");
const ShadowRootStates_1 = require("../units/ShadowRootStates");
class ShadowRoot {
    constructor(parentEle, opts) {
        this._backendNodeId = 0;
        this._objectId = null;
        this._nodeId = 0;
        this._page = null;
        this._states = null;
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
    get states() {
        if (!this._states) {
            this._states = new ShadowRootStates_1.ShadowRootStates(this);
        }
        return this._states;
    }
    get backendNodeId() {
        return this._backendNodeId;
    }
    equals(other) {
        if (!(other instanceof ShadowRoot))
            return false;
        return this._backendNodeId > 0 && this._backendNodeId === other._backendNodeId;
    }
    async inner_html() {
        return this.run_js("return this.innerHTML;");
    }
    async html() {
        const inner = await this.inner_html();
        return `<shadow_root>${inner}</shadow_root>`;
    }
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
    async _run_js(script, ...args) {
        return this.run_js(script, ...args);
    }
    async run_async_js(script, ...args) {
        const objectId = await this._getObjectId();
        await this._session.send("Runtime.callFunctionOn", {
            objectId,
            functionDeclaration: `function() { ${script} }`,
            arguments: args.map((a) => ({ value: a })),
            awaitPromise: false,
        });
    }
    async ele(locator, index = 1, timeout) {
        if (timeout !== undefined && timeout > 0) {
            const deadline = Date.now() + timeout * 1000;
            while (true) {
                const elements = await this.eles(locator);
                const idx = index > 0 ? index - 1 : elements.length + index;
                if (elements[idx])
                    return elements[idx];
                if (Date.now() >= deadline)
                    break;
                await new Promise(r => setTimeout(r, 200));
            }
        }
        const elements = await this.eles(locator);
        const idx = index > 0 ? index - 1 : elements.length + index;
        const result = elements[idx] ?? null;
        if (!result) {
            if (NoneElement_1.NoneElement.raiseWhenNotFound) {
                const { ElementNotFoundError } = await Promise.resolve().then(() => __importStar(require("../errors")));
                throw new ElementNotFoundError(locator);
            }
            return new NoneElement_1.NoneElement("ele", { locator, index });
        }
        return result;
    }
    async eles(locator, timeout) {
        if (timeout !== undefined && timeout > 0) {
            const deadline = Date.now() + timeout * 1000;
            while (true) {
                const result = await this._elesOnce(locator);
                if (result.length > 0)
                    return result;
                if (Date.now() >= deadline)
                    break;
                await new Promise(r => setTimeout(r, 200));
            }
        }
        return this._elesOnce(locator);
    }
    async _elesOnce(locator) {
        const parsed = (0, locator_1.parseLocator)(locator);
        if (parsed.type === "xpath") {
            return this._elesByXPath(parsed.value);
        }
        return this._elesByCss(parsed.value);
    }
    async s_ele(locator, index = 1) {
        const html = await this.html();
        const { load } = await Promise.resolve().then(() => __importStar(require("cheerio")));
        const { SessionElement } = await Promise.resolve().then(() => __importStar(require("./SessionElement")));
        const $ = load(html);
        const parsed = (0, locator_1.parseLocator)(locator);
        let nodes;
        if (parsed.type === "css") {
            nodes = $(parsed.value).toArray();
        }
        else {
            nodes = [];
        }
        const idx = index > 0 ? index - 1 : nodes.length + index;
        const node = nodes[idx];
        return node ? new SessionElement($, node) : null;
    }
    async s_eles(locator) {
        const html = await this.html();
        const { load } = await Promise.resolve().then(() => __importStar(require("cheerio")));
        const { SessionElement } = await Promise.resolve().then(() => __importStar(require("./SessionElement")));
        const $ = load(html);
        const parsed = (0, locator_1.parseLocator)(locator);
        let nodes;
        if (parsed.type === "css") {
            nodes = $(parsed.value).toArray();
        }
        else {
            nodes = [];
        }
        return nodes.map((node) => new SessionElement($, node));
    }
    async parent(levelOrLoc = 1) {
        return this._parentEle.parent(levelOrLoc);
    }
    async child(locatorOrIndex = 1, index = 1, eleOnly = true) {
        if (typeof locatorOrIndex === "number") {
            const children = await this.children("", eleOnly);
            const idx = locatorOrIndex > 0 ? locatorOrIndex - 1 : children.length + locatorOrIndex;
            const result = children[idx] ?? null;
            if (!result) {
                if (NoneElement_1.NoneElement.raiseWhenNotFound) {
                    const { ElementNotFoundError } = await Promise.resolve().then(() => __importStar(require("../errors")));
                    throw new ElementNotFoundError("child");
                }
                return new NoneElement_1.NoneElement("child", { index: locatorOrIndex });
            }
            return result;
        }
        const children = await this.children(locatorOrIndex, eleOnly);
        const idx = index > 0 ? index - 1 : children.length + index;
        const result = children[idx] ?? null;
        if (!result) {
            if (NoneElement_1.NoneElement.raiseWhenNotFound) {
                const { ElementNotFoundError } = await Promise.resolve().then(() => __importStar(require("../errors")));
                throw new ElementNotFoundError(locatorOrIndex);
            }
            return new NoneElement_1.NoneElement("child", { locator: locatorOrIndex, index });
        }
        return result;
    }
    async children(locator = "", eleOnly = true) {
        if (!locator) {
            return this.eles("css:*");
        }
        return this.eles(locator);
    }
    async next(locator = "", index = 1, eleOnly = true) {
        return this._parentEle.next(locator, index, eleOnly);
    }
    async prev(locator = "", index = 1, eleOnly = true) {
        return this._parentEle.prev(locator, index, eleOnly);
    }
    async nexts(locator = "", eleOnly = true) {
        return this._parentEle.nexts(locator, eleOnly);
    }
    async prevs(locator = "", eleOnly = true) {
        return this._parentEle.prevs(locator, eleOnly);
    }
    async before(locator = "", index = 1, eleOnly = true) {
        return this._parentEle.before(locator, index, eleOnly);
    }
    async after(locator = "", index = 1, eleOnly = true) {
        return this._parentEle.after(locator, index, eleOnly);
    }
    async befores(locator = "", eleOnly = true) {
        return this._parentEle.befores(locator, eleOnly);
    }
    async afters(locator = "", eleOnly = true) {
        return this._parentEle.afters(locator, eleOnly);
    }
    async _find_elements(locator, timeout, index, relative = false, raiseErr) {
        if (index === undefined || index === null) {
            return this.eles(locator);
        }
        if (index === 1) {
            return this.ele(locator, 1, timeout);
        }
        const all = await this.eles(locator);
        const idx = index > 0 ? index - 1 : all.length + index;
        return all[idx] ?? new NoneElement_1.NoneElement("ele", { locator, index });
    }
    async _get_node_id(objId) {
        if (this._nodeId && this._nodeId > 0)
            return this._nodeId;
        const oid = objId ?? this._objectId;
        if (oid) {
            try {
                const { nodeId } = await this._session.send("DOM.requestNode", { objectId: oid });
                if (nodeId && nodeId > 0) {
                    this._nodeId = nodeId;
                    return nodeId;
                }
            }
            catch { }
        }
        return 0;
    }
    async _get_obj_id(backendId) {
        if (this._objectId)
            return this._objectId;
        const bid = backendId ?? this._backendNodeId;
        if (bid && bid > 0) {
            try {
                const { object } = await this._session.send("DOM.resolveNode", { backendNodeId: bid });
                if (object?.objectId) {
                    this._objectId = object.objectId;
                    return object.objectId;
                }
            }
            catch { }
        }
        return '';
    }
    async _get_backend_id(nodeId) {
        if (this._backendNodeId && this._backendNodeId > 0)
            return this._backendNodeId;
        const nid = nodeId ?? this._nodeId;
        if (nid && nid > 0) {
            try {
                const { node } = await this._session.send("DOM.describeNode", { nodeId: nid });
                if (node?.backendNodeId && node.backendNodeId > 0) {
                    this._backendNodeId = node.backendNodeId;
                    return node.backendNodeId;
                }
            }
            catch { }
        }
        return 0;
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
        await this._session.send("DOM.getDocument", { depth: -1 });
        const { nodeId } = await this._session.send("DOM.requestNode", {
            objectId,
        });
        this._nodeId = nodeId;
        return nodeId;
    }
    async _elesByCss(selector) {
        const objectId = await this._getObjectId();
        const { result } = await this._session.send("Runtime.callFunctionOn", {
            objectId,
            functionDeclaration: `function(sel) { return Array.from(this.querySelectorAll(sel)); }`,
            arguments: [{ value: selector }],
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
            }
        }
        return elements;
    }
    async _elesByXPath(xpath) {
        const objectId = await this._getObjectId();
        const js = `function(xpath){
      let a=[];
      let e=document.evaluate(xpath,this,null,7,null);
      for(let i=0;i<e.snapshotLength;i++){
        let node=e.snapshotItem(i);
        if(node.nodeType===1){a.push(node);}
      }
      return a;
    }`;
        const { result } = await this._session.send("Runtime.callFunctionOn", {
            objectId,
            functionDeclaration: js,
            arguments: [{ value: xpath }],
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
            }
        }
        return elements;
    }
}
exports.ShadowRoot = ShadowRoot;
