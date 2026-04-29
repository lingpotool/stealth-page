"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElementRect = void 0;
class ElementRect {
    constructor(ele) {
        this._ele = ele;
    }
    async location() {
        const vp = await this.viewport_location();
        try {
            const metrics = await this._ele.session.send("Page.getLayoutMetrics");
            return {
                x: vp.x + metrics.visualViewport.pageX,
                y: vp.y + metrics.visualViewport.pageY,
            };
        }
        catch {
            return vp;
        }
    }
    async viewport_location() {
        try {
            const { model } = await this._ele.session.send("DOM.getBoxModel", {
                backendNodeId: this._ele.backendNodeId,
            });
            const border = model.border;
            return { x: border[0], y: border[1] };
        }
        catch {
            const objectId = await this._ele.getObjectId();
            const { result } = await this._ele.session.send("Runtime.callFunctionOn", {
                objectId,
                functionDeclaration: `function() { const r = this.getBoundingClientRect(); return { x: r.left, y: r.top }; }`,
                returnByValue: true,
            });
            return result.value;
        }
    }
    async screen_location() {
        const vp = await this.viewport_location();
        try {
            const { result } = await this._ele.session.send("Runtime.evaluate", {
                expression: "({ x: window.screenX + (window.outerWidth - window.innerWidth), y: window.screenY + (window.outerHeight - window.innerHeight), dpr: window.devicePixelRatio || 1 })",
                returnByValue: true,
            });
            return {
                x: vp.x * result.value.dpr + result.value.x,
                y: vp.y * result.value.dpr + result.value.y,
            };
        }
        catch {
            return vp;
        }
    }
    async size() {
        try {
            const { model } = await this._ele.session.send("DOM.getBoxModel", {
                backendNodeId: this._ele.backendNodeId,
            });
            const b = model.border;
            const width = Math.sqrt((b[2] - b[0]) ** 2 + (b[3] - b[1]) ** 2);
            const height = Math.sqrt((b[6] - b[0]) ** 2 + (b[7] - b[1]) ** 2);
            return { width, height };
        }
        catch {
            const objectId = await this._ele.getObjectId();
            const { result } = await this._ele.session.send("Runtime.callFunctionOn", {
                objectId,
                functionDeclaration: `function() { const r = this.getBoundingClientRect(); return { width: r.width, height: r.height }; }`,
                returnByValue: true,
            });
            return result.value;
        }
    }
    async midpoint() {
        const loc = await this.location();
        const sz = await this.size();
        return { x: loc.x + sz.width / 2, y: loc.y + sz.height / 2 };
    }
    async viewport_midpoint() {
        const loc = await this.viewport_location();
        const sz = await this.size();
        return { x: loc.x + sz.width / 2, y: loc.y + sz.height / 2 };
    }
    async click_point() {
        const vp = await this.viewport_click_point();
        try {
            const metrics = await this._ele.session.send("Page.getLayoutMetrics");
            return {
                x: vp.x + metrics.visualViewport.pageX,
                y: vp.y + metrics.visualViewport.pageY,
            };
        }
        catch {
            return this.midpoint();
        }
    }
    async corners() {
        try {
            const { model } = await this._ele.session.send("DOM.getBoxModel", {
                backendNodeId: this._ele.backendNodeId,
            });
            const b = model.border;
            return [
                { x: b[0], y: b[1] },
                { x: b[2], y: b[3] },
                { x: b[4], y: b[5] },
                { x: b[6], y: b[7] },
            ];
        }
        catch {
            const loc = await this.location();
            const sz = await this.size();
            return [
                { x: loc.x, y: loc.y },
                { x: loc.x + sz.width, y: loc.y },
                { x: loc.x + sz.width, y: loc.y + sz.height },
                { x: loc.x, y: loc.y + sz.height },
            ];
        }
    }
    async viewport_corners() {
        try {
            const { model } = await this._ele.session.send("DOM.getBoxModel", {
                backendNodeId: this._ele.backendNodeId,
            });
            const b = model.border;
            return [
                { x: b[0], y: b[1] },
                { x: b[2], y: b[3] },
                { x: b[4], y: b[5] },
                { x: b[6], y: b[7] },
            ];
        }
        catch {
            const loc = await this.viewport_location();
            const sz = await this.size();
            return [
                { x: loc.x, y: loc.y },
                { x: loc.x + sz.width, y: loc.y },
                { x: loc.x + sz.width, y: loc.y + sz.height },
                { x: loc.x, y: loc.y + sz.height },
            ];
        }
    }
    async screen_midpoint() {
        const loc = await this.screen_location();
        const sz = await this.size();
        return { x: loc.x + sz.width / 2, y: loc.y + sz.height / 2 };
    }
    async screen_click_point() {
        return this.screen_midpoint();
    }
    async viewport_click_point() {
        try {
            const mid = await this.viewport_midpoint();
            const backendId = this._ele.backendNodeId;
            if (backendId > 0) {
                const { model } = await this._ele.session.send("DOM.getBoxModel", { backendNodeId: backendId });
                const paddingTop = model.padding[1];
                return { x: mid.x, y: paddingTop + 3 };
            }
            return mid;
        }
        catch {
            return this.viewport_midpoint();
        }
    }
    async scroll_position() {
        const objectId = await this._ele.getObjectId();
        const { result } = await this._ele.session.send("Runtime.callFunctionOn", {
            objectId,
            functionDeclaration: `function() { return { x: this.scrollLeft || 0, y: this.scrollTop || 0 }; }`,
            returnByValue: true,
        });
        return result.value;
    }
}
exports.ElementRect = ElementRect;
