"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElementStates = void 0;
class ElementStates {
    constructor(ele) {
        this._ele = ele;
    }
    get is_checked() {
        return this._getBoolProperty("checked");
    }
    get is_selected() {
        return this._getBoolProperty("selected");
    }
    get is_displayed() {
        return this._checkDisplayed();
    }
    get is_enabled() {
        return this._checkEnabled();
    }
    get is_alive() {
        return this._checkAlive();
    }
    get is_in_viewport() {
        return this._checkInViewport();
    }
    get is_whole_in_viewport() {
        return this._checkWholeInViewport();
    }
    get is_covered() {
        return this._checkCovered();
    }
    get is_clickable() {
        return this._checkClickable();
    }
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
          return style.visibility !== 'hidden' && style.display !== 'none' && !this.hidden;
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
            if (this._ele.backendNodeId > 0) {
                await this._ele.session.send("DOM.describeNode", {
                    backendNodeId: this._ele.backendNodeId,
                });
                return true;
            }
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
            const { result: midResult } = await this._ele.session.send("Runtime.callFunctionOn", {
                objectId,
                functionDeclaration: `function() {
          if (!this) return { x: -1, y: -1 };
          const rect = this.getBoundingClientRect();
          return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        }`,
                returnByValue: true,
            });
            const cx = midResult.value.x;
            const cy = midResult.value.y;
            if (cx < 0 || cy < 0)
                return false;
            try {
                const { nodeId } = await this._ele.session.send("DOM.getNodeForLocation", {
                    x: Math.round(cx),
                    y: Math.round(cy),
                    ignorePointerEventsNone: true,
                });
                if (nodeId === this._ele.nodeId)
                    return false;
                const { result: containsResult } = await this._ele.session.send("Runtime.callFunctionOn", {
                    objectId,
                    functionDeclaration: `function(id) { 
            const el = document.querySelector('[data-node-id="' + id + '"]');
            return el ? this.contains(el) : false;
          }`,
                    arguments: [{ value: nodeId }],
                    returnByValue: true,
                });
                if (containsResult.value)
                    return false;
                try {
                    const { node } = await this._ele.session.send("DOM.describeNode", { nodeId });
                    return node.backendNodeId;
                }
                catch {
                    return true;
                }
            }
            catch {
                return false;
            }
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
            if (!displayed || !enabled || hasRect === false)
                return false;
            const objectId = await this._ele.getObjectId();
            const { result } = await this._ele.session.send("Runtime.callFunctionOn", {
                objectId,
                functionDeclaration: `function() { return window.getComputedStyle(this).pointerEvents; }`,
                returnByValue: true,
            });
            return result.value !== "none";
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
          if (rect.width === 0 && rect.height === 0) return false;
          return [
            {x: rect.left, y: rect.top},
            {x: rect.right, y: rect.top},
            {x: rect.left, y: rect.bottom},
            {x: rect.right, y: rect.bottom}
          ];
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
