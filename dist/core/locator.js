"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseLocator = parseLocator;
/**
 * 解析 Drission 风格的定位字符串：
 * - css 相关："css:div" / "css=.btn" / "c:div" / "c=.btn" / ".class" / "#id"
 * - xpath 相关："xpath://div" / "x://div"
 * - 文本相关："text=精确" / "text:包含" / "text^前缀" / "text$后缀"
 * - 标签相关："tag:div" / "t:div"
 * - 属性相关：
 *   - "@attr=value" / "@attr" - 单属性
 *   - "@@attr1=val1@attr2=val2" - 多属性 AND
 *   - "@|attr1=val1@attr2=val2" - 多属性 OR
 *   - "@!attr" - 属性不存在
 */
function parseLocator(loc) {
    const raw = loc.trim();
    let text = raw;
    if (!text) {
        return { type: "css", value: "*", raw };
    }
    // ---------- css 前缀 ----------
    if (text.startsWith("css:") || text.startsWith("css=")) {
        return { type: "css", value: text.slice(4), raw };
    }
    if (text.startsWith("c:") || text.startsWith("c=")) {
        return { type: "css", value: text.slice(2), raw };
    }
    // ---------- xpath 前缀 ----------
    if (text.startsWith("xpath:") || text.startsWith("xpath=")) {
        return { type: "xpath", value: text.slice(6), raw };
    }
    if (text.startsWith("x:") || text.startsWith("x=")) {
        return { type: "xpath", value: text.slice(2), raw };
    }
    // ---------- 文本定位，转换为 xpath ----------
    if (text.startsWith("text=")) {
        const v = text.slice(5);
        return { type: "xpath", value: `//*[text()=${quoteXPath(v)}]`, raw };
    }
    if (text.startsWith("text:") && text !== "text:") {
        const v = text.slice(5);
        return { type: "xpath", value: `//*/text()[contains(., ${quoteXPath(v)})]/..`, raw };
    }
    if (text.startsWith("text^") && text !== "text^") {
        const v = text.slice(5);
        return { type: "xpath", value: `//*/text()[starts-with(., ${quoteXPath(v)})]/..`, raw };
    }
    if (text.startsWith("text$") && text !== "text$") {
        const v = text.slice(5);
        return {
            type: "xpath",
            value: `//*/text()[substring(., string-length(.) - string-length(${quoteXPath(v)}) + 1) = ${quoteXPath(v)}]/..`,
            raw,
        };
    }
    // ---------- tag: 前缀 ----------
    if (text.startsWith("tag:") || text.startsWith("tag=")) {
        const tagName = text.slice(4);
        return { type: "css", value: tagName, raw };
    }
    if (text.startsWith("t:") || text.startsWith("t=")) {
        const tagName = text.slice(2);
        return { type: "css", value: tagName, raw };
    }
    // ---------- @@ 多属性 AND ----------
    if (text.startsWith("@@")) {
        const attrPart = text.slice(2);
        const attrs = attrPart.split("@").filter(Boolean);
        const selectors = attrs.map((attr) => {
            if (attr.includes("=")) {
                const [key, ...valParts] = attr.split("=");
                const val = valParts.join("=");
                return `[${key}="${val}"]`;
            }
            return `[${attr}]`;
        });
        return { type: "css", value: selectors.join(""), raw };
    }
    // ---------- @| 多属性 OR ----------
    if (text.startsWith("@|")) {
        const attrPart = text.slice(2);
        const attrs = attrPart.split("@").filter(Boolean);
        const xpathConditions = attrs.map((attr) => {
            if (attr.includes("=")) {
                const [key, ...valParts] = attr.split("=");
                const val = valParts.join("=");
                return `@${key}="${val}"`;
            }
            return `@${attr}`;
        });
        return { type: "xpath", value: `//*[${xpathConditions.join(" or ")}]`, raw };
    }
    // ---------- @! 属性不存在 ----------
    if (text.startsWith("@!")) {
        const attrName = text.slice(2);
        return { type: "xpath", value: `//*[not(@${attrName})]`, raw };
    }
    // ---------- @attr 单属性定位 ----------
    if (text.startsWith("@") && !text.startsWith("@@")) {
        const attrPart = text.slice(1);
        if (attrPart.includes("=")) {
            const [attr, ...valParts] = attrPart.split("=");
            const val = valParts.join("=");
            return { type: "css", value: `[${attr}="${val}"]`, raw };
        }
        return { type: "css", value: `[${attrPart}]`, raw };
    }
    // ---------- .class / #id 简写 ----------
    if (text.startsWith(".")) {
        return { type: "css", value: text, raw };
    }
    if (text.startsWith("#")) {
        return { type: "css", value: text, raw };
    }
    // ---------- 直接 xpath 表达式 ----------
    if (text.startsWith("//") || text.startsWith("(//")) {
        return { type: "xpath", value: text, raw };
    }
    // 默认直接当作 css selector
    return { type: "css", value: text, raw };
}
function quoteXPath(str) {
    if (!str.includes("\"")) {
        return `"${str}"`;
    }
    const parts = str.split("\"");
    const quoted = parts
        .map((p) => `"${p}"`)
        .join(', "\"", ');
    return `concat(${quoted})`;
}
