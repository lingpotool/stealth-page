"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElementStates = void 0;
/**
 * 元素状态检查器，对应 DrissionPage 的 ElementStates
 */
class ElementStates {
    constructor(ele) {
        this._ele = ele;
    }
    /**
     * 元素是否被选中（用于 checkbox/radio）
     */
    get is_checked() {
        return this._getBoolProperty("checked");
    }
    /**
     * 元素是否被选择（用于 option）
     */
    get is_selected() {
        return this._getBoolProperty("selected");
    }
    /**
     * 元素是否显示
     */
    get is_displayed() {
        return this._checkDisplayed();
    }
    /**
     * 元素是否可用
     */
    get is_enabled() {
        return this._checkEnabled();
    }
    /**
     * 元素是否仍在 DOM 中
     */
    get is_alive() {
        return this._checkAlive();
    }
    /**
     * 元素是否在视口中
     */
    get is_in_viewport() {
        return this._checkInViewport();
    }
    /**
     * 元素是否整个都在视口内
     */
    get is_whole_in_viewport() {
        return this._checkWholeInViewport();
    }
    /**
     * 元素是否被覆盖
     */
    get is_covered() {
        return this._checkCovered();
    }
    /**
     * 元素是否可被点击
     */
    get is_clickable() {
        return this._checkClickable();
    }
    /**
     * 元素是否有大小和位置
     */
    get has_rect() {
        return this._checkHasRect();
    }
    async _getBoolProperty(name) {
        try {
            const objectId = await this._ele.getObjectId();
            const { result } = await this._ele.session.send("Runtime.callFunctionOn", {
                objectId,
                functionDeclaration: `function(n) { return !!this[n]; }`,
                arguments: [{ value: name }],
                returnByValue: true,
            });
            return result.value;
        }
        catch {
            return false;
        }
    }
    async _checkDisplayed() {
        try {
            const objectId = await this._ele.getObjectId();
            const { result } = await this._ele.session.send("Runtime.callFunctionOn", {
                objectId,
                functionDeclaration: `function() {
          if (!this) return false;
          const style = window.getComputedStyle(this);
          return style.display !== 'none' && style.visibility !== 'hidden' && this.offsetParent !== null;
        }`,
                returnByValue: true,
            });
            return result.value;
        }
        catch {
            return false;
        }
    }
    async _checkEnabled() {
        try {
            const objectId = await this._ele.getObjectId();
            const { result } = await this._ele.session.send("Runtime.callFunctionOn", {
                objectId,
                functionDeclaration: "function() { return this && !this.disabled; }",
                returnByValue: true,
            });
            return result.value;
        }
        catch {
            return false;
        }
    }
    async _checkAlive() {
        try {
            await this._ele.getObjectId();
            return true;
        }
        catch {
            return false;
        }
    }
    async _checkInViewport() {
        try {
            const objectId = await this._ele.getObjectId();
            const { result } = await this._ele.session.send("Runtime.callFunctionOn", {
                objectId,
                functionDeclaration: `function() {
          if (!this) return false;
          const rect = this.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          return cx >= 0 && cy >= 0 && cx <= window.innerWidth && cy <= window.innerHeight;
        }`,
                returnByValue: true,
            });
            return result.value;
        }
        catch {
            return false;
        }
    }
    async _checkWholeInViewport() {
        try {
            const objectId = await this._ele.getObjectId();
            const { result } = await this._ele.session.send("Runtime.callFunctionOn", {
                objectId,
                functionDeclaration: `function() {
          if (!this) return false;
          const rect = this.getBoundingClientRect();
          return rect.top >= 0 && rect.left >= 0 && 
                 rect.bottom <= window.innerHeight && rect.right <= window.innerWidth;
        }`,
                returnByValue: true,
            });
            return result.value;
        }
        catch {
            return false;
        }
    }
    async _checkCovered() {
        try {
            const objectId = await this._ele.getObjectId();
            const { result } = await this._ele.session.send("Runtime.callFunctionOn", {
                objectId,
                functionDeclaration: `function() {
          if (!this) return false;
          const rect = this.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const topEl = document.elementFromPoint(cx, cy);
          if (!topEl) return false;
          if (topEl === this || this.contains(topEl)) return false;
          return true;
        }`,
                returnByValue: true,
            });
            return result.value;
        }
        catch {
            return false;
        }
    }
    async _checkClickable() {
        try {
            const displayed = await this._checkDisplayed();
            const enabled = await this._checkEnabled();
            const hasRect = await this._checkHasRect();
            return displayed && enabled && hasRect;
        }
        catch {
            return false;
        }
    }
    async _checkHasRect() {
        try {
            const objectId = await this._ele.getObjectId();
            const { result } = await this._ele.session.send("Runtime.callFunctionOn", {
                objectId,
                functionDeclaration: `function() {
          if (!this) return false;
          const rect = this.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        }`,
                returnByValue: true,
            });
            return result.value;
        }
        catch {
            return false;
        }
    }
}
exports.ElementStates = ElementStates;
