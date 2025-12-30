"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageRect = void 0;
/**
 * 页面/标签页位置和大小信息，对应 DrissionPage 的 TabRect
 */
class PageRect {
    constructor(page) {
        this._page = page;
    }
    /**
     * 窗口在屏幕上的位置
     */
    async window_location() {
        const { result } = await this._page.cdpSession.send("Runtime.evaluate", {
            expression: "({ x: window.screenX, y: window.screenY })",
            returnByValue: true,
        });
        return result.value;
    }
    /**
     * 窗口大小（包括边框）
     */
    async window_size() {
        const { result } = await this._page.cdpSession.send("Runtime.evaluate", {
            expression: "({ width: window.outerWidth, height: window.outerHeight })",
            returnByValue: true,
        });
        return result.value;
    }
    /**
     * 视口位置（相对于页面）
     */
    async viewport_location() {
        const { result } = await this._page.cdpSession.send("Runtime.evaluate", {
            expression: "({ x: window.scrollX, y: window.scrollY })",
            returnByValue: true,
        });
        return result.value;
    }
    /**
     * 视口大小
     */
    async viewport_size() {
        const { result } = await this._page.cdpSession.send("Runtime.evaluate", {
            expression: "({ width: window.innerWidth, height: window.innerHeight })",
            returnByValue: true,
        });
        return result.value;
    }
    /**
     * 页面大小（整个文档）
     */
    async page_size() {
        const { result } = await this._page.cdpSession.send("Runtime.evaluate", {
            expression: `({
        width: Math.max(document.body.scrollWidth, document.documentElement.scrollWidth),
        height: Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)
      })`,
            returnByValue: true,
        });
        return result.value;
    }
    /**
     * 屏幕大小
     */
    async screen_size() {
        const { result } = await this._page.cdpSession.send("Runtime.evaluate", {
            expression: "({ width: screen.width, height: screen.height })",
            returnByValue: true,
        });
        return result.value;
    }
    /**
     * 可用屏幕大小（排除任务栏等）
     */
    async screen_available_size() {
        const { result } = await this._page.cdpSession.send("Runtime.evaluate", {
            expression: "({ width: screen.availWidth, height: screen.availHeight })",
            returnByValue: true,
        });
        return result.value;
    }
    /**
     * 窗口状态：normal、fullscreen、maximized、minimized
     */
    async window_state() {
        try {
            const { windowId } = await this._page.cdpSession.send("Browser.getWindowForTarget");
            const { bounds } = await this._page.cdpSession.send("Browser.getWindowBounds", { windowId });
            return bounds.windowState || "normal";
        }
        catch {
            return "normal";
        }
    }
    /**
     * 页面左上角在屏幕中坐标
     */
    async page_location() {
        const { result } = await this._page.cdpSession.send("Runtime.evaluate", {
            expression: "({ x: window.screenX + (window.outerWidth - window.innerWidth), y: window.screenY + (window.outerHeight - window.innerHeight) })",
            returnByValue: true,
        });
        return result.value;
    }
    /**
     * 页面总大小
     */
    async size() {
        return this.page_size();
    }
    /**
     * 视口大小（包括滚动条）
     */
    async viewport_size_with_scrollbar() {
        const { result } = await this._page.cdpSession.send("Runtime.evaluate", {
            expression: "({ width: document.documentElement.clientWidth, height: document.documentElement.clientHeight })",
            returnByValue: true,
        });
        return result.value;
    }
    /**
     * 滚动条位置
     */
    async scroll_position() {
        const { result } = await this._page.cdpSession.send("Runtime.evaluate", {
            expression: "({ x: window.scrollX || window.pageXOffset, y: window.scrollY || window.pageYOffset })",
            returnByValue: true,
        });
        return result.value;
    }
}
exports.PageRect = PageRect;
