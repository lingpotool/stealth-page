"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoadMode = void 0;
/**
 * 页面加载策略设置类
 * 对应 DrissionPage.LoadMode
 */
class LoadMode {
    constructor(cdpSession) {
        this._mode = "normal";
        this._cdpSession = cdpSession;
    }
    get value() {
        return this._mode;
    }
    /**
     * 设置加载策略
     */
    async set(value) {
        this._mode = value;
        // CDP 没有直接的加载策略设置，这里记录状态供其他方法使用
    }
    /**
     * 设置为 normal 模式（等待页面完全加载）
     */
    async normal() {
        await this.set("normal");
    }
    /**
     * 设置为 eager 模式（DOM 加载完成即可）
     */
    async eager() {
        await this.set("eager");
    }
    /**
     * 设置为 none 模式（不等待加载）
     */
    async none() {
        await this.set("none");
    }
}
exports.LoadMode = LoadMode;
