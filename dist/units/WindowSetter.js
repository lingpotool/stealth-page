"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WindowSetter = void 0;
/**
 * 窗口设置类，对应 DrissionPage 的 WindowSetter
 */
class WindowSetter {
    constructor(owner) {
        this._windowId = null;
        this._owner = owner;
    }
    /**
     * 获取窗口 ID
     */
    async _getWindowId() {
        if (this._windowId !== null) {
            return this._windowId;
        }
        const { windowId } = await this._owner.cdpSession.send("Browser.getWindowForTarget");
        this._windowId = windowId;
        return windowId;
    }
    /**
     * 获取窗口信息
     */
    async _getInfo() {
        const windowId = await this._getWindowId();
        const { bounds } = await this._owner.cdpSession.send("Browser.getWindowBounds", { windowId });
        return bounds;
    }
    /**
     * 执行窗口操作
     */
    async _perform(bounds) {
        const windowId = await this._getWindowId();
        await this._owner.cdpSession.send("Browser.setWindowBounds", {
            windowId,
            bounds,
        });
    }
    /**
     * 窗口最大化
     */
    async max() {
        await this._perform({ windowState: "maximized" });
    }
    /**
     * 窗口最小化
     */
    async mini() {
        await this._perform({ windowState: "minimized" });
    }
    /**
     * 窗口全屏
     */
    async full() {
        await this._perform({ windowState: "fullscreen" });
    }
    /**
     * 窗口恢复正常
     */
    async normal() {
        await this._perform({ windowState: "normal" });
    }
    /**
     * 设置窗口大小
     */
    async size(width, height) {
        // 先恢复正常状态
        await this.normal();
        const bounds = {};
        if (width !== undefined)
            bounds.width = width;
        if (height !== undefined)
            bounds.height = height;
        if (Object.keys(bounds).length > 0) {
            await this._perform(bounds);
        }
    }
    /**
     * 设置窗口位置
     */
    async location(x, y) {
        // 先恢复正常状态
        await this.normal();
        const bounds = {};
        if (x !== undefined)
            bounds.left = x;
        if (y !== undefined)
            bounds.top = y;
        if (Object.keys(bounds).length > 0) {
            await this._perform(bounds);
        }
    }
    /**
     * 隐藏浏览器窗口（仅 Windows）
     */
    async hide() {
        // CDP 不直接支持隐藏窗口，可以通过最小化实现
        await this.mini();
    }
    /**
     * 显示浏览器窗口（仅 Windows）
     */
    async show() {
        await this.normal();
    }
    /**
     * 获取当前窗口大小
     */
    async getSize() {
        const bounds = await this._getInfo();
        return {
            width: bounds.width || 0,
            height: bounds.height || 0,
        };
    }
    /**
     * 获取当前窗口位置
     */
    async getLocation() {
        const bounds = await this._getInfo();
        return {
            x: bounds.left || 0,
            y: bounds.top || 0,
        };
    }
    /**
     * 获取窗口状态
     */
    async getState() {
        const bounds = await this._getInfo();
        return bounds.windowState || "normal";
    }
}
exports.WindowSetter = WindowSetter;
