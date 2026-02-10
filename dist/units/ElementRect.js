"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElementRect = void 0;
/**
 * 元素位置和大小信息，对应 DrissionPage 的 ElementRect
 */
class ElementRect {
    constructor(ele) {
        this._ele = ele;
    }
    /**
     * 元素左上角在页面中的坐标
     */
    async location() {
        const objectId = await this._ele.getObjectId();
        const { result } = await this._ele.session.send("Runtime.callFunctionOn", {
            objectId,
            functionDeclaration: `function() {
        const rect = this.getBoundingClientRect();
        return { x: rect.left + window.scrollX, y: rect.top + window.scrollY };
      }`,
            returnByValue: true,
        });
        return result.value;
    }
    /**
     * 元素在视口中的坐标
     */
    async viewport_location() {
        const objectId = await this._ele.getObjectId();
        const { result } = await this._ele.session.send("Runtime.callFunctionOn", {
            objectId,
            functionDeclaration: `function() {
        const rect = this.getBoundingClientRect();
        return { x: rect.left, y: rect.top };
      }`,
            returnByValue: true,
        });
        return result.value;
    }
    /**
     * 元素在屏幕上的坐标
     */
    async screen_location() {
        const objectId = await this._ele.getObjectId();
        const { result } = await this._ele.session.send("Runtime.callFunctionOn", {
            objectId,
            functionDeclaration: `function() {
        const rect = this.getBoundingClientRect();
        return { x: rect.left + window.screenX, y: rect.top + window.screenY };
      }`,
            returnByValue: true,
        });
        return result.value;
    }
    /**
     * 元素大小
     */
    async size() {
        const objectId = await this._ele.getObjectId();
        const { result } = await this._ele.session.send("Runtime.callFunctionOn", {
            objectId,
            functionDeclaration: `function() {
        const rect = this.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      }`,
            returnByValue: true,
        });
        return result.value;
    }
    /**
     * 元素中心点在页面中的坐标
     */
    async midpoint() {
        const loc = await this.location();
        const sz = await this.size();
        return { x: loc.x + sz.width / 2, y: loc.y + sz.height / 2 };
    }
    /**
     * 元素中心点在视口中的坐标
     */
    async viewport_midpoint() {
        const loc = await this.viewport_location();
        const sz = await this.size();
        return { x: loc.x + sz.width / 2, y: loc.y + sz.height / 2 };
    }
    /**
     * 点击点坐标（页面坐标）
     * 对齐 DrissionPage: x 取中点，y 取 padding 顶部 + 3
     */
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
    /**
     * 元素四个角的坐标
     */
    async corners() {
        const loc = await this.location();
        const sz = await this.size();
        return [
            { x: loc.x, y: loc.y },
            { x: loc.x + sz.width, y: loc.y },
            { x: loc.x + sz.width, y: loc.y + sz.height },
            { x: loc.x, y: loc.y + sz.height },
        ];
    }
    /**
     * 元素四个角在视口中的坐标
     */
    async viewport_corners() {
        const loc = await this.viewport_location();
        const sz = await this.size();
        return [
            { x: loc.x, y: loc.y },
            { x: loc.x + sz.width, y: loc.y },
            { x: loc.x + sz.width, y: loc.y + sz.height },
            { x: loc.x, y: loc.y + sz.height },
        ];
    }
    /**
     * 元素中心点在屏幕上的坐标
     */
    async screen_midpoint() {
        const objectId = await this._ele.getObjectId();
        const { result } = await this._ele.session.send("Runtime.callFunctionOn", {
            objectId,
            functionDeclaration: `function() {
        const rect = this.getBoundingClientRect();
        return { 
          x: rect.left + rect.width / 2 + window.screenX, 
          y: rect.top + rect.height / 2 + window.screenY 
        };
      }`,
            returnByValue: true,
        });
        return result.value;
    }
    /**
     * 元素点击点在屏幕上的坐标
     */
    async screen_click_point() {
        return this.screen_midpoint();
    }
    /**
     * 视口中的点击点坐标
     * 对齐 DrissionPage: x 取 border 中点，y 取 padding 顶部 + 3
     */
    async viewport_click_point() {
        try {
            const mid = await this.viewport_midpoint();
            // 尝试用 DOM.getBoxModel 获取 padding 区域
            const backendId = this._ele.backendNodeId;
            if (backendId > 0) {
                const { model } = await this._ele.session.send("DOM.getBoxModel", { backendNodeId: backendId });
                // padding quad: [x1,y1, x2,y2, x3,y3, x4,y4]
                const paddingTop = model.padding[1];
                return { x: mid.x, y: paddingTop + 3 };
            }
            return mid;
        }
        catch {
            return this.viewport_midpoint();
        }
    }
    /**
     * 元素滚动条位置
     */
    async scroll_position() {
        const objectId = await this._ele.getObjectId();
        const { result } = await this._ele.session.send("Runtime.callFunctionOn", {
            objectId,
            functionDeclaration: `function() {
        return { x: this.scrollLeft || 0, y: this.scrollTop || 0 };
      }`,
            returnByValue: true,
        });
        return result.value;
    }
}
exports.ElementRect = ElementRect;
