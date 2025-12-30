"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElementSetter = void 0;
/**
 * 元素属性设置器，对应 DrissionPage 的 ChromiumElementSetter
 */
class ElementSetter {
    constructor(ele) {
        this._ele = ele;
    }
    /**
     * 设置元素 attribute 属性
     */
    async attr(name, value = "") {
        const objectId = await this._ele.getObjectId();
        await this._ele.session.send("Runtime.callFunctionOn", {
            objectId,
            functionDeclaration: "function(n, v) { if (this && this.setAttribute) { this.setAttribute(n, v); } }",
            arguments: [{ value: name }, { value }],
        });
    }
    /**
     * 设置元素 property 属性
     */
    async property(name, value) {
        const objectId = await this._ele.getObjectId();
        await this._ele.session.send("Runtime.callFunctionOn", {
            objectId,
            functionDeclaration: "function(n, v) { if (this) { this[n] = v; } }",
            arguments: [{ value: name }, { value }],
        });
    }
    /**
     * 设置元素 style 样式
     */
    async style(name, value) {
        const objectId = await this._ele.getObjectId();
        await this._ele.session.send("Runtime.callFunctionOn", {
            objectId,
            functionDeclaration: "function(n, v) { if (this && this.style) { this.style[n] = v; } }",
            arguments: [{ value: name }, { value }],
        });
    }
    /**
     * 设置元素 innerHTML
     */
    async innerHTML(html) {
        const objectId = await this._ele.getObjectId();
        await this._ele.session.send("Runtime.callFunctionOn", {
            objectId,
            functionDeclaration: "function(h) { if (this) { this.innerHTML = h; } }",
            arguments: [{ value: html }],
        });
    }
    /**
     * 设置元素 value 值
     */
    async value(val) {
        const objectId = await this._ele.getObjectId();
        await this._ele.session.send("Runtime.callFunctionOn", {
            objectId,
            functionDeclaration: `function(v) { 
        if (this) { 
          this.value = v;
          this.dispatchEvent(new Event('input', { bubbles: true }));
          this.dispatchEvent(new Event('change', { bubbles: true }));
        } 
      }`,
            arguments: [{ value: val }],
        });
    }
}
exports.ElementSetter = ElementSetter;
