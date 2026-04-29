"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoneElement = void 0;
exports.isNoneElement = isNoneElement;
const errors_1 = require("../errors");
class NoneElement {
    constructor(method = "", args = {}) {
        this._method = method;
        this._args = args;
        if (method && NoneElement._raiseWhenNotFound) {
            throw new errors_1.ElementNotFoundError(method, args);
        }
    }
    static setValue(value = null, returnSelf = true) {
        NoneElement._returnValue = value;
        NoneElement._returnSelf = returnSelf;
    }
    static get returnSelf() {
        return NoneElement._returnSelf;
    }
    static set returnSelf(value) {
        NoneElement._returnSelf = value;
    }
    static get returnValue() {
        return NoneElement._returnValue;
    }
    static set raiseWhenNotFound(value) {
        NoneElement._raiseWhenNotFound = value;
    }
    static get raiseWhenNotFound() {
        return NoneElement._raiseWhenNotFound;
    }
    _navResult() {
        if (NoneElement._returnSelf) {
            return this;
        }
        throw new errors_1.ElementNotFoundError(this._method, this._args);
    }
    _valueResult() {
        if (NoneElement._returnSelf) {
            return NoneElement._returnValue;
        }
        throw new errors_1.ElementNotFoundError(this._method, this._args);
    }
    get tag() {
        return this._valueResult() ?? "";
    }
    get html() {
        return this._valueResult() ?? "";
    }
    get inner_html() {
        return this._valueResult() ?? "";
    }
    get text() {
        return this._valueResult() ?? "";
    }
    get raw_text() {
        return this._valueResult() ?? "";
    }
    get attrs() {
        return this._valueResult() ?? {};
    }
    get value() {
        return this._valueResult() ?? "";
    }
    get sr() {
        return this._navResult();
    }
    get size() {
        return this._valueResult() ?? { width: 0, height: 0 };
    }
    get link() {
        return this._valueResult();
    }
    get css_path() {
        return this._valueResult();
    }
    get xpath() {
        return this._valueResult();
    }
    get comments() {
        return this._valueResult() ?? [];
    }
    get texts() {
        return this._valueResult();
    }
    async attr(_name) {
        return this._valueResult();
    }
    async style(_name, _pseudoEle) {
        return this._valueResult() ?? "";
    }
    async src(_timeout, _base64ToBytes) {
        return this._valueResult();
    }
    async property(_name) {
        return this._valueResult();
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
    async click() {
        return this._navResult();
    }
    async input(_value, _clear, _byJs) {
        return this._navResult();
    }
    async clear(_byJs) {
        return this._navResult();
    }
    async focus() {
        return this._navResult();
    }
    async hover(_offsetX, _offsetY) {
        return this._navResult();
    }
    async drag(_offsetX, _offsetY, _duration) {
        return this._navResult();
    }
    async drag_to(_target, _duration) {
        return this._navResult();
    }
    async check(_uncheck, _byJs) {
        return this._navResult();
    }
    async remove_attr(_name) {
        return this._navResult();
    }
    async set_attr(_name, _value) {
        return this._navResult();
    }
    async do_click() {
        return this._navResult();
    }
    async double_click() {
        return this._navResult();
    }
    async right_click() {
        return this._navResult();
    }
    async scroll_into_view() {
        return this._navResult();
    }
    async set_file_input(_files) {
        return this._navResult();
    }
    async ele(_locator, _index, _timeout) {
        return this._navResult();
    }
    async eles(_locator, _timeout) {
        if (NoneElement._returnSelf)
            return [];
        throw new errors_1.ElementNotFoundError(this._method, this._args);
    }
    async s_ele(_locator, _index) {
        return this._navResult();
    }
    async s_eles(_locator) {
        if (NoneElement._returnSelf)
            return [];
        throw new errors_1.ElementNotFoundError(this._method, this._args);
    }
    async parent(_level, _index) {
        return this._navResult();
    }
    async child(_locator, _index, _eleOnly) {
        return this._navResult();
    }
    async children(_locator, _eleOnly) {
        if (NoneElement._returnSelf)
            return [];
        throw new errors_1.ElementNotFoundError(this._method, this._args);
    }
    async next(_locator, _index, _eleOnly) {
        return this._navResult();
    }
    async prev(_locator, _index, _eleOnly) {
        return this._navResult();
    }
    async nexts(_locator, _eleOnly) {
        if (NoneElement._returnSelf)
            return [];
        throw new errors_1.ElementNotFoundError(this._method, this._args);
    }
    async prevs(_locator, _eleOnly) {
        if (NoneElement._returnSelf)
            return [];
        throw new errors_1.ElementNotFoundError(this._method, this._args);
    }
    async before(_locator, _index, _eleOnly) {
        return this._navResult();
    }
    async after(_locator, _index, _eleOnly) {
        return this._navResult();
    }
    async befores(_locator, _eleOnly) {
        if (NoneElement._returnSelf)
            return [];
        throw new errors_1.ElementNotFoundError(this._method, this._args);
    }
    async afters(_locator, _eleOnly) {
        if (NoneElement._returnSelf)
            return [];
        throw new errors_1.ElementNotFoundError(this._method, this._args);
    }
    async shadow_root() {
        return this._navResult();
    }
    async east(_locOrPixel, _index) {
        return this._navResult();
    }
    async south(_locOrPixel, _index) {
        return this._navResult();
    }
    async west(_locOrPixel, _index) {
        return this._navResult();
    }
    async north(_locOrPixel, _index) {
        return this._navResult();
    }
    async over(_timeout) {
        return this._navResult();
    }
    async offset(_locator, _x, _y, _timeout) {
        return this._navResult();
    }
    async get_frame(_frameId) {
        return this._navResult();
    }
    async location() {
        return { x: 0, y: 0 };
    }
    async get_size() {
        return { width: 0, height: 0 };
    }
    async get_rect() {
        return { x: 0, y: 0, width: 0, height: 0 };
    }
    async screenshot(_path) {
        return Buffer.alloc(0);
    }
    async get_screenshot() {
        return Buffer.alloc(0);
    }
    async run_js(_script, ..._args) {
        return this._valueResult();
    }
    async run_async_js(_script, ..._args) { }
    equals(other) {
        return other === null || other === undefined;
    }
    valueOf() {
        return false;
    }
    [Symbol.toPrimitive]() {
        return false;
    }
    toString() {
        return `<NoneElement method=${this._method} ${Object.entries(this._args).map(([k, v]) => `${k}=${v}`).join(", ")}>`;
    }
    get isNone() {
        return true;
    }
    get wait() {
        return new NoneElementWaiter(this);
    }
    get states() {
        return new NoneElementStates(this);
    }
    get rect() {
        return new NoneElementRect();
    }
    get scroll() {
        return new NoneElementScroller(this);
    }
    get actions() {
        return null;
    }
    get select() {
        return null;
    }
    async tag_name() {
        return "";
    }
    async getObjectId() {
        return "";
    }
    get nodeId() {
        return 0;
    }
    get backendNodeId() {
        return 0;
    }
    get session() {
        return null;
    }
    get page() {
        return null;
    }
    get timeout() {
        return 0;
    }
    get owner() {
        return null;
    }
    get parent_ele() {
        return null;
    }
}
exports.NoneElement = NoneElement;
NoneElement._returnValue = null;
NoneElement._returnSelf = false;
NoneElement._raiseWhenNotFound = false;
class NoneElementWaiter {
    constructor(ele) { this._ele = ele; }
    async deleted() { return true; }
    async displayed() { return false; }
    async hidden() { return true; }
    async covered() { return false; }
    async not_covered() { return true; }
    async enabled() { return false; }
    async disabled() { return true; }
    async clickable() { return false; }
    async has_rect() { return false; }
    async stop_moving() { return false; }
}
class NoneElementStates {
    constructor(ele) { this._ele = ele; }
    get is_alive() { return false; }
    get is_displayed() { return false; }
    get is_enabled() { return false; }
    get is_selected() { return false; }
    get is_covered() { return false; }
    get is_in_viewport() { return false; }
    get is_whole_in_viewport() { return false; }
    get is_clickable() { return false; }
    get has_rect() { return false; }
    get is_checked() { return false; }
}
class NoneElementRect {
    async location() { return { x: 0, y: 0 }; }
    async viewport_location() { return { x: 0, y: 0 }; }
    async screen_location() { return { x: 0, y: 0 }; }
    async size() { return { width: 0, height: 0 }; }
    async midpoint() { return { x: 0, y: 0 }; }
    async viewport_midpoint() { return { x: 0, y: 0 }; }
    async click_point() { return { x: 0, y: 0 }; }
    async corners() { return []; }
    async viewport_corners() { return []; }
    async screen_midpoint() { return { x: 0, y: 0 }; }
}
class NoneElementScroller {
    constructor(ele) { this._ele = ele; }
    async to_top() { return this._ele; }
    async to_bottom() { return this._ele; }
    async to_half() { return this._ele; }
    async to_rightmost() { return this._ele; }
    async to_leftmost() { return this._ele; }
    async to_location() { return this._ele; }
    async up() { return this._ele; }
    async down() { return this._ele; }
    async left() { return this._ele; }
    async right() { return this._ele; }
    async to_see() { return this._ele; }
    async to_center() { return this._ele; }
}
function isNoneElement(obj) {
    return obj instanceof NoneElement || (obj && obj.isNone === true);
}
