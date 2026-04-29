"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChromiumElementsList = exports.SessionElementsList = void 0;
exports.get_frame = get_frame;
const NoneElement_1 = require("./NoneElement");
const locator_1 = require("./locator");
class SessionElementsList extends Array {
    filter_text(text) {
        const result = new SessionElementsList();
        for (const ele of this) {
            if (ele instanceof NoneElement_1.NoneElement)
                continue;
            try {
                const eleText = ele._text_cache;
                if (eleText && eleText.includes(text)) {
                    result.push(ele);
                }
            }
            catch { }
        }
        return result;
    }
    filter_tag(tag) {
        const result = new SessionElementsList();
        for (const ele of this) {
            if (ele instanceof NoneElement_1.NoneElement)
                continue;
            try {
                const eleTag = ele._tag_cache;
                if (eleTag && eleTag.toLowerCase() === tag.toLowerCase()) {
                    result.push(ele);
                }
            }
            catch { }
        }
        return result;
    }
    filter_attr(name, value) {
        const result = new SessionElementsList();
        for (const ele of this) {
            if (ele instanceof NoneElement_1.NoneElement)
                continue;
            try {
                const attrs = ele._attrs_cache;
                if (attrs) {
                    if (value !== undefined) {
                        if (attrs[name] === value)
                            result.push(ele);
                    }
                    else {
                        if (name in attrs)
                            result.push(ele);
                    }
                }
            }
            catch { }
        }
        return result;
    }
    filter_style(name, value) {
        const result = new SessionElementsList();
        for (const ele of this) {
            if (ele instanceof NoneElement_1.NoneElement)
                continue;
            try {
                const styles = ele._style_cache;
                if (styles) {
                    if (value !== undefined) {
                        if (styles[name] === value)
                            result.push(ele);
                    }
                    else {
                        if (name in styles)
                            result.push(ele);
                    }
                }
            }
            catch { }
        }
        return result;
    }
    filter_property(name, value) {
        const result = new SessionElementsList();
        for (const ele of this) {
            if (ele instanceof NoneElement_1.NoneElement)
                continue;
            try {
                const props = ele._props_cache;
                if (props) {
                    if (value !== undefined) {
                        if (props[name] === value)
                            result.push(ele);
                    }
                    else {
                        if (name in props)
                            result.push(ele);
                    }
                }
            }
            catch { }
        }
        return result;
    }
    filter_displayed() {
        const result = new SessionElementsList();
        for (const ele of this) {
            if (ele instanceof NoneElement_1.NoneElement)
                continue;
            try {
                if (ele._displayed_cache)
                    result.push(ele);
            }
            catch { }
        }
        return result;
    }
    filter_checked() {
        const result = new SessionElementsList();
        for (const ele of this) {
            if (ele instanceof NoneElement_1.NoneElement)
                continue;
            try {
                if (ele._checked_cache)
                    result.push(ele);
            }
            catch { }
        }
        return result;
    }
    filter_selected() {
        const result = new SessionElementsList();
        for (const ele of this) {
            if (ele instanceof NoneElement_1.NoneElement)
                continue;
            try {
                if (ele._selected_cache)
                    result.push(ele);
            }
            catch { }
        }
        return result;
    }
    filter_enabled() {
        const result = new SessionElementsList();
        for (const ele of this) {
            if (ele instanceof NoneElement_1.NoneElement)
                continue;
            try {
                if (ele._enabled_cache)
                    result.push(ele);
            }
            catch { }
        }
        return result;
    }
    filter_clickable() {
        const result = new SessionElementsList();
        for (const ele of this) {
            if (ele instanceof NoneElement_1.NoneElement)
                continue;
            try {
                if (ele._clickable_cache)
                    result.push(ele);
            }
            catch { }
        }
        return result;
    }
    filter_have_rect() {
        const result = new SessionElementsList();
        for (const ele of this) {
            if (ele instanceof NoneElement_1.NoneElement)
                continue;
            try {
                if (ele._have_rect_cache)
                    result.push(ele);
            }
            catch { }
        }
        return result;
    }
    filter_have_text() {
        const result = new SessionElementsList();
        for (const ele of this) {
            if (ele instanceof NoneElement_1.NoneElement)
                continue;
            try {
                const text = ele._text_cache;
                if (text && text.trim())
                    result.push(ele);
            }
            catch { }
        }
        return result;
    }
    filter_one(condition, value) {
        const filtered = this._apply_filter(condition, value);
        return filtered[0] || new NoneElement_1.NoneElement("filter_one", { condition, value });
    }
    _apply_filter(condition, value) {
        switch (condition) {
            case 'text': return this.filter_text(value);
            case 'tag': return this.filter_tag(value);
            case 'displayed': return this.filter_displayed();
            case 'checked': return this.filter_checked();
            case 'selected': return this.filter_selected();
            case 'enabled': return this.filter_enabled();
            case 'clickable': return this.filter_clickable();
            case 'have_rect': return this.filter_have_rect();
            case 'have_text': return this.filter_have_text();
            default: return this;
        }
    }
    async search(locator) {
        const result = new SessionElementsList();
        for (const ele of this) {
            if (ele instanceof NoneElement_1.NoneElement)
                continue;
            try {
                const found = await ele.ele(locator, 0);
                if (found && !(found instanceof NoneElement_1.NoneElement)) {
                    result.push(ele);
                }
            }
            catch { }
        }
        return result;
    }
    async search_one(locator) {
        const result = await this.search(locator);
        return result[0] || new NoneElement_1.NoneElement("search_one", { locator });
    }
    get(index) {
        if (index >= 0) {
            return this[index] || new NoneElement_1.NoneElement("get", { index });
        }
        return this[this.length + index] || new NoneElement_1.NoneElement("get", { index });
    }
}
exports.SessionElementsList = SessionElementsList;
class ChromiumElementsList extends SessionElementsList {
}
exports.ChromiumElementsList = ChromiumElementsList;
async function get_frame(page, locIndEle, timeout) {
    if (typeof locIndEle === 'object' && locIndEle !== null && !Array.isArray(locIndEle)) {
        return locIndEle;
    }
    if (typeof locIndEle === 'number') {
        const frames = await _get_frame_elements(page);
        if (locIndEle >= 0 && locIndEle < frames.length) {
            return frames[locIndEle];
        }
        throw new Error(`Frame index ${locIndEle} out of range.`);
    }
    if (Array.isArray(locIndEle)) {
        const [locType, locValue] = locIndEle;
        const parsed = (0, locator_1.parseLocator)(`${locType}:${locValue}`);
        const frameEle = await page.ele(parsed.value, timeout);
        if (frameEle instanceof NoneElement_1.NoneElement) {
            throw new Error(`Frame not found with locator: ${locType}:${locValue}`);
        }
        return frameEle;
    }
    const locStr = String(locIndEle);
    if (locStr.startsWith('#') || locStr.startsWith('name:')) {
        const attrName = locStr.startsWith('#') ? 'id' : 'name';
        const attrValue = locStr.startsWith('#') ? locStr.substring(1) : locStr.substring(5);
        const frames = await _get_frame_elements(page);
        for (const frame of frames) {
            try {
                const attr = await frame.attr(attrName);
                if (attr === attrValue)
                    return frame;
            }
            catch { }
        }
        throw new Error(`Frame not found with ${attrName}="${attrValue}".`);
    }
    const frameEle = await page.ele(locStr, timeout);
    if (frameEle instanceof NoneElement_1.NoneElement) {
        throw new Error(`Frame not found with locator: ${locStr}`);
    }
    return frameEle;
}
async function _get_frame_elements(page) {
    return page.eles('xpath://iframe|//frame');
}
