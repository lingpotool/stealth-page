"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoneElement = void 0;
exports.isNoneElement = isNoneElement;
/**
 * 空元素类，对应 DrissionPage 的 NoneElement
 * 用于在找不到元素时返回，避免 null 检查
 */
class NoneElement {
    constructor(method = "", args = {}) {
        this._method = method;
        this._args = args;
    }
    /**
     * 设置空元素返回值
     */
    static setValue(value = null, enabled = true) {
        NoneElement._returnValue = value;
        NoneElement._enabled = enabled;
    }
    /**
     * 是否启用空元素返回值
     */
    static get enabled() {
        return NoneElement._enabled;
    }
    /**
     * 获取设置的返回值
     */
    static get returnValue() {
        return NoneElement._returnValue;
    }
    // ========== 属性 ==========
    get tag() {
        return "";
    }
    get html() {
        return "";
    }
    get inner_html() {
        return "";
    }
    get text() {
        return "";
    }
    get raw_text() {
        return "";
    }
    get attrs() {
        return {};
    }
    get value() {
        return "";
    }
    // ========== 方法 ==========
    async attr(_name) {
        return null;
    }
    async property(_name) {
        return null;
    }
    async style(_name, _pseudoEle) {
        return "";
    }
    async is_displayed() {
        return false;
    }
    async is_enabled() {
        return false;
    }
    async is_selected() {
        return false;
    }
    async is_alive() {
        return false;
    }
    async is_in_viewport() {
        return false;
    }
    async is_covered() {
        return false;
    }
    // ========== 操作方法（返回自身以支持链式调用） ==========
    async click() {
        return this;
    }
    async input(_value) {
        return this;
    }
    async clear() {
        return this;
    }
    async focus() {
        return this;
    }
    async hover() {
        return this;
    }
    async drag(_offsetX, _offsetY) {
        return this;
    }
    async drag_to(_target) {
        return this;
    }
    async check(_uncheck) {
        return this;
    }
    // ========== 查找方法 ==========
    async ele(_locator) {
        return new NoneElement("ele", { locator: _locator });
    }
    async eles(_locator) {
        return [];
    }
    async parent(_level) {
        return new NoneElement("parent");
    }
    async child(_locator) {
        return new NoneElement("child");
    }
    async children(_locator) {
        return [];
    }
    async next(_locator) {
        return new NoneElement("next");
    }
    async prev(_locator) {
        return new NoneElement("prev");
    }
    async nexts(_locator) {
        return [];
    }
    async prevs(_locator) {
        return [];
    }
    async before(_locator) {
        return new NoneElement("before");
    }
    async after(_locator) {
        return new NoneElement("after");
    }
    async befores(_locator) {
        return [];
    }
    async afters(_locator) {
        return [];
    }
    async shadow_root() {
        return new NoneElement("shadow_root");
    }
    // ========== 位置信息 ==========
    async location() {
        return { x: 0, y: 0 };
    }
    async size() {
        return { width: 0, height: 0 };
    }
    async get_rect() {
        return { x: 0, y: 0, width: 0, height: 0 };
    }
    // ========== 截图 ==========
    async screenshot(_path) {
        return Buffer.alloc(0);
    }
    async get_screenshot() {
        return Buffer.alloc(0);
    }
    // ========== JS 执行 ==========
    async run_js(_script) {
        return null;
    }
    async run_async_js(_script) { }
    // ========== 字符串表示 ==========
    toString() {
        return `<NoneElement method=${this._method} args=${JSON.stringify(this._args)}>`;
    }
    /**
     * 用于判断是否为 NoneElement
     */
    get isNone() {
        return true;
    }
}
exports.NoneElement = NoneElement;
NoneElement._returnValue = null;
NoneElement._enabled = false;
/**
 * 判断是否为 NoneElement
 */
function isNoneElement(obj) {
    return obj instanceof NoneElement || (obj && obj.isNone === true);
}
