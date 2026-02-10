"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseLocator = parseLocator;
exports.quoteXPath = _quotesEscape;
/**
 * 解析 Drission 风格的定位字符串（完全对齐 DrissionPage 的 locator.py）
 *
 * 支持的格式：
 * - css 相关："css:div" / "css=.btn" / "c:div" / "c=.btn"
 * - xpath 相关："xpath://div" / "x://div"
 * - 文本相关："text=精确" / "text:包含" / "text^前缀" / "text$后缀"
 * - 标签相关："tag:div" / "t:div" / "tag:div@class=foo" / "tag:div@@class=foo@id=bar"
 * - 属性相关：
 *   - "@attr=value" / "@attr:value" / "@attr^value" / "@attr$value" / "@attr" - 单属性
 *   - "@@attr1=val1@attr2=val2" - 多属性 AND（支持 = : ^ $ 操作符）
 *   - "@|attr1=val1@attr2=val2" - 多属性 OR（支持 = : ^ $ 操作符）
 *   - "@!attr" / "@!attr=val" - 属性否定
 * - 简写：".class" / "#id" / ".=class" / ".:class" / ".^class" / ".$class"
 * - 默认：纯文本 → 模糊文本搜索（与 DrissionPage 一致）
 */
function parseLocator(loc) {
    const raw = loc.trim();
    let text = raw;
    if (!text) {
        return { type: "xpath", value: "//*", raw };
    }
    // ---------- 直接 xpath 表达式（必须在 _preprocess 之前检测） ----------
    if (text.startsWith("//") || text.startsWith("(//") || text.startsWith(".//") || text.startsWith("(.//")) {
        return { type: "xpath", value: text, raw };
    }
    // ---------- 预处理缩写（对齐 Python _preprocess） ----------
    text = _preprocess(text);
    // ---------- css 前缀 ----------
    if (text.startsWith("css:") || text.startsWith("css=")) {
        return { type: "css", value: text.slice(4), raw };
    }
    // ---------- xpath 前缀 ----------
    if (text.startsWith("xpath:") || text.startsWith("xpath=")) {
        return { type: "xpath", value: text.slice(6), raw };
    }
    // ---------- 多属性查找 @@ / @| / @! ----------
    if ((text.startsWith("@@") || text.startsWith("@|") || text.startsWith("@!")) &&
        text !== "@@" && text !== "@|" && text !== "@!") {
        return _makeMultiAttrXPath("*", text);
    }
    // ---------- 单属性查找 @ ----------
    if (text.startsWith("@") && text !== "@") {
        return _makeSingleAttrXPath("*", text);
    }
    // ---------- tag: 前缀（支持 tag:div@attr=val 组合） ----------
    if ((text.startsWith("tag:") || text.startsWith("tag=") ||
        text.startsWith("tag^") || text.startsWith("tag$")) &&
        text !== "tag:" && text !== "tag=" && text !== "tag^" && text !== "tag$") {
        const atInd = text.indexOf("@");
        if (atInd === -1) {
            // 纯 tag 查找
            return { type: "xpath", value: `//*[name()="${text.slice(4)}"]`, raw };
        }
        else {
            const tagName = text.slice(4, atInd);
            const attrPart = text.slice(atInd);
            if (attrPart.startsWith("@@") || attrPart.startsWith("@|") || attrPart.startsWith("@!")) {
                return _makeMultiAttrXPath(tagName, attrPart);
            }
            else {
                return _makeSingleAttrXPath(tagName, attrPart);
            }
        }
    }
    // ---------- 文本定位 ----------
    if (text.startsWith("text=") && text !== "text=") {
        const v = text.slice(5);
        return { type: "xpath", value: `//*[text()=${_quotesEscape(v)}]`, raw };
    }
    if (text.startsWith("text:") && text !== "text:") {
        const v = text.slice(5);
        return { type: "xpath", value: `//*/text()[contains(., ${_quotesEscape(v)})]/..`, raw };
    }
    if (text.startsWith("text^") && text !== "text^") {
        const v = text.slice(5);
        return { type: "xpath", value: `//*/text()[starts-with(., ${_quotesEscape(v)})]/..`, raw };
    }
    if (text.startsWith("text$") && text !== "text$") {
        const v = text.slice(5);
        return {
            type: "xpath",
            value: `//*/text()[substring(., string-length(.) - string-length(${_quotesEscape(v)}) +1) = ${_quotesEscape(v)}]/..`,
            raw,
        };
    }
    // ---------- 默认：模糊文本搜索（对齐 DrissionPage） ----------
    return { type: "xpath", value: `//*/text()[contains(., ${_quotesEscape(text)})]/..`, raw };
}
/**
 * 预处理缩写，替换回完整写法（对齐 Python _preprocess）
 */
function _preprocess(loc) {
    if (loc.startsWith(".")) {
        if (loc.startsWith(".=") || loc.startsWith(".:") || loc.startsWith(".^") || loc.startsWith(".$")) {
            return "@class" + loc.slice(1);
        }
        return "@class=" + loc.slice(1);
    }
    if (loc.startsWith("#")) {
        if (loc.startsWith("#=") || loc.startsWith("#:") || loc.startsWith("#^") || loc.startsWith("#$")) {
            return "@id" + loc.slice(1);
        }
        return "@id=" + loc.slice(1);
    }
    if (loc.startsWith("t:") || loc.startsWith("t=")) {
        return "tag:" + loc.slice(2);
    }
    if (loc.startsWith("tx:") || loc.startsWith("tx=") || loc.startsWith("tx^") || loc.startsWith("tx$")) {
        return "text" + loc.slice(2);
    }
    if (loc.startsWith("c:") || loc.startsWith("c=")) {
        return "css:" + loc.slice(2);
    }
    if (loc.startsWith("x:") || loc.startsWith("x=")) {
        return "xpath:" + loc.slice(2);
    }
    return loc;
}
/**
 * 将 " 转义为 XPath concat 形式（对齐 Python _quotes_escape）
 */
function _quotesEscape(searchStr) {
    if (!searchStr.includes('"')) {
        return `"${searchStr}"`;
    }
    const parts = searchStr.split('"');
    const partsNum = parts.length;
    let result = "concat(";
    for (let i = 0; i < partsNum; i++) {
        result += `"${parts[i]}"`;
        if (i < partsNum - 1) {
            result += ",'\"',";
        }
    }
    result += ',"")';
    return result;
}
/**
 * 解析单个属性参数 "attr=val" / "attr:val" / "attr^val" / "attr$val" / "attr"
 * 返回 [name, operator, value] 或 [name, null, null]
 */
function _parseArg(text) {
    const match = text.match(/^([^:=$^]+)([:=$^])(.*)$/);
    if (match) {
        let name = match[1];
        if (name === "tx()")
            name = "text()";
        if (name === "t()")
            name = "tag()";
        return [name, match[2], match[3]];
    }
    let name = text;
    if (name === "tx()")
        name = "text()";
    if (name === "t()")
        name = "tag()";
    return [name, null, null];
}
/**
 * 生成单属性 xpath 语句（对齐 Python _make_single_xpath_str）
 */
function _makeSingleAttrXPath(tag, text) {
    const argList = tag === "*" ? [] : [`name()="${tag}"`];
    let argStr = "";
    let txtStr = "";
    if (text === "@") {
        argStr = "not(@*)";
    }
    else {
        const r = _parseArg(text.slice(1)); // 去掉开头的 @
        const [name, symbol, val] = r;
        if (name && symbol && val !== null) {
            if (name === "tag()" || name === "t()") {
                argStr = `name()="${val.toLowerCase()}"`;
            }
            else if (symbol === "=") {
                const arg = (name === "text()" || name === "tx()") ? "text()" : `@${name}`;
                argStr = `${arg}=${_quotesEscape(val)}`;
            }
            else if (symbol === "^") {
                if (name === "text()" || name === "tx()") {
                    txtStr = `/text()[starts-with(., ${_quotesEscape(val)})]/..`;
                }
                else {
                    argStr = `starts-with(@${name},${_quotesEscape(val)})`;
                }
            }
            else if (symbol === "$") {
                if (name === "text()" || name === "tx()") {
                    txtStr = `/text()[substring(., string-length(.) - string-length(${_quotesEscape(val)}) +1) = ${_quotesEscape(val)}]/..`;
                }
                else {
                    argStr = `substring(@${name}, string-length(@${name}) - string-length(${_quotesEscape(val)}) +1) = ${_quotesEscape(val)}`;
                }
            }
            else if (symbol === ":") {
                if (name === "text()" || name === "tx()") {
                    txtStr = `/text()[contains(., ${_quotesEscape(val)})]/..`;
                }
                else {
                    argStr = `contains(@${name},${_quotesEscape(val)})`;
                }
            }
        }
        else if (name) {
            // 只有属性名，没有值
            if (name === "tag()" || name === "t()") {
                argStr = "";
            }
            else if (name === "text()" || name === "tx()") {
                argStr = "normalize-space(text())";
            }
            else {
                argStr = `@${name}`;
            }
        }
    }
    if (argStr) {
        argList.push(argStr);
    }
    const condition = argList.join(" and ");
    const xpath = condition ? `//*[${condition}]${txtStr}` : `//*${txtStr}`;
    return { type: "xpath", value: xpath, raw: text };
}
/**
 * 生成多属性查找的 xpath 语句（对齐 Python _make_multi_xpath_str）
 */
function _makeMultiAttrXPath(tag, text) {
    const argList = [];
    // 用正则分割 @@ / @| / @!
    const parts = text.split(/(@!|@@|@\|)/).filter(Boolean);
    const hasAnd = parts.includes("@@");
    const hasOr = parts.includes("@|");
    if (hasAnd && hasOr) {
        throw new Error(`Locator symbol conflict: cannot mix @@ and @| in "${text}"`);
    }
    const isAnd = !hasOr;
    const tags = tag === "*" ? [] : [`name()="${tag}"`];
    let tagsConnect = " or ";
    for (let k = 0; k < parts.length - 1; k += 2) {
        const prefix = parts[k]; // @@ or @| or @!
        const content = parts[k + 1]; // attr=val
        const ignore = prefix === "@!";
        const [name, symbol, val] = _parseArg(content);
        let argStr = "";
        if (!name) {
            argStr = "not(@*)";
        }
        else if (symbol === null || val === null) {
            // 只有属性名
            if (name === "tag()" || name === "t()") {
                continue;
            }
            if (name === "text()" || name === "tx()") {
                argStr = "normalize-space(text())";
            }
            else {
                argStr = `@${name}`;
            }
        }
        else {
            // 属性名和值都有
            if (name === "tag()" || name === "t()") {
                if (ignore) {
                    tags.push(`not(name()="${val}")`);
                    tagsConnect = " and ";
                }
                else {
                    tags.push(`name()="${val}"`);
                }
                continue;
            }
            const arg = (name === "text()" || name === "tx()") ? "." : `@${name}`;
            const txt = val;
            if (symbol === "=") {
                argStr = `${arg}=${_quotesEscape(txt)}`;
            }
            else if (symbol === ":") {
                argStr = `contains(${arg},${_quotesEscape(txt)})`;
            }
            else if (symbol === "^") {
                argStr = `starts-with(${arg},${_quotesEscape(txt)})`;
            }
            else if (symbol === "$") {
                argStr = `substring(${arg}, string-length(${arg}) - string-length(${_quotesEscape(txt)}) +1) = ${_quotesEscape(txt)}`;
            }
        }
        if (argStr && ignore) {
            argStr = `not(${argStr})`;
        }
        if (argStr) {
            argList.push(argStr);
        }
    }
    let argStr = isAnd ? argList.join(" and ") : argList.join(" or ");
    if (tags.length > 0) {
        const condition = argStr ? ` and (${argStr})` : "";
        argStr = `(${tags.join(tagsConnect)})${condition}`;
    }
    const xpath = argStr ? `//*[${argStr}]` : `//*`;
    return { type: "xpath", value: xpath, raw: text };
}
