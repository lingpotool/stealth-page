"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.get_ele_txt = get_ele_txt;
exports.format_html = format_html;
exports.location_in_viewport = location_in_viewport;
exports.offset_scroll = offset_scroll;
exports.make_absolute_link = make_absolute_link;
exports.is_js_func = is_js_func;
exports.get_blob = get_blob;
exports.get_mhtml = get_mhtml;
exports.get_pdf = get_pdf;
exports.tree = tree;
exports.format_headers = format_headers;
const url_1 = require("url");
const NOWRAP_LIST = new Set([
    'br', 'sub', 'sup', 'em', 'strong', 'a', 'font', 'b', 'span', 's', 'i', 'del', 'ins', 'img', 'td',
    'th', 'abbr', 'bdi', 'bdo', 'cite', 'code', 'data', 'dfn', 'kbd', 'mark', 'q', 'rp', 'rt', 'ruby',
    'samp', 'small', 'time', 'u', 'var', 'wbr', 'button', 'slot', 'content',
]);
const WRAP_AFTER_LIST = new Set([
    'p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ol', 'li', 'blockquote', 'header',
    'footer', 'address', 'article', 'aside', 'main', 'nav', 'section', 'figcaption', 'summary',
]);
const NO_TEXT_LIST = new Set([
    'script', 'style', 'video', 'audio', 'iframe', 'embed', 'noscript', 'canvas', 'template',
]);
const TAB_LIST = new Set(['td', 'th']);
function get_ele_txt(e) {
    if (NO_TEXT_LIST.has(e.tag)) {
        return e.raw_text || '';
    }
    function get_node_txt(ele, pre = false) {
        const tag = ele.tag;
        if (tag === 'br') {
            return [true];
        }
        if (!pre && tag === 'pre') {
            pre = true;
        }
        const strList = [];
        if (NO_TEXT_LIST.has(tag) && !pre) {
            return strList;
        }
        const nodes = [];
        if (ele.text)
            nodes.push(ele.text);
        if (ele.children)
            nodes.push(...ele.children);
        let prevEle = '';
        for (const el of nodes) {
            if (typeof el === 'string') {
                if (pre) {
                    strList.push(el);
                }
                else {
                    const stripped = el.replace(/[ \n\t\r]/g, '');
                    if (stripped !== '') {
                        let txt = el;
                        if (!pre) {
                            txt = txt.replace(/\r\n/g, ' ').replace(/\n/g, ' ');
                            txt = txt.replace(/ {2,}/g, ' ');
                        }
                        strList.push(txt);
                    }
                }
            }
            else {
                if (!NOWRAP_LIST.has(el.tag) && strList.length > 0 && strList[strList.length - 1] !== '\n') {
                    strList.push('\n');
                }
                if (TAB_LIST.has(el.tag) && TAB_LIST.has(prevEle)) {
                    strList.push('\t');
                }
                strList.push(...get_node_txt(el, pre));
                prevEle = el.tag;
            }
        }
        if (WRAP_AFTER_LIST.has(tag) && strList.length > 0 && strList[strList.length - 1] !== '\n' && strList[strList.length - 1] !== true) {
            strList.push('\n');
        }
        return strList;
    }
    let reStr = get_node_txt(e);
    if (reStr.length > 0 && reStr[reStr.length - 1] === '\n') {
        reStr.pop();
    }
    const l = reStr.length;
    if (l > 1) {
        const r = [];
        for (let i = 0; i < l - 1; i++) {
            const i1 = reStr[i];
            const i2 = reStr[i + 1];
            if (i1 === true) {
                r.push('\n');
                continue;
            }
            else if (i2 === true) {
                r.push(i1);
                continue;
            }
            else if (i1.endsWith(' ') && i2.startsWith(' ')) {
                r.push(i1.slice(0, -1));
                continue;
            }
            r.push(i1);
        }
        r.push(reStr[l - 1] === true ? '\n' : reStr[l - 1]);
        reStr = r;
    }
    else if (l === 0) {
        return '';
    }
    else {
        reStr = [reStr[0] === true ? '\n' : reStr[0]];
    }
    return format_html(reStr.join('').trim());
}
function format_html(text) {
    if (!text)
        return text || '';
    return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/\xa0/g, ' ')
        .replace(/&nbsp;/g, ' ');
}
async function location_in_viewport(page, locX, locY) {
    const js = `function(){let x = ${locX}; let y = ${locY};
    const scrollLeft = document.documentElement.scrollLeft;
    const scrollTop = document.documentElement.scrollTop;
    const vWidth = document.documentElement.clientWidth;
    const vHeight = document.documentElement.clientHeight;
    if(x< scrollLeft || y < scrollTop || x > vWidth + scrollLeft || y > vHeight + scrollTop){return false;}
    return true;}`;
    if (page._run_js) {
        return page._run_js(js);
    }
    const result = await page.run_cdp('Runtime.evaluate', { expression: `(${js})()`, returnByValue: true });
    return result.result.value;
}
async function offset_scroll(ele, offsetX, offsetY) {
    const [locX, locY] = ele.rect.location;
    const [cpX, cpY] = ele.rect.click_point;
    const lx = offsetX != null ? locX + offsetX : cpX;
    const ly = offsetY != null ? locY + offsetY : cpY;
    if (!await location_in_viewport(ele.owner, lx, ly)) {
        const clientWidth = await (ele.owner._run_js ? ele.owner._run_js('return document.body.clientWidth;') : (await ele.owner.run_cdp('Runtime.evaluate', { expression: 'document.body.clientWidth', returnByValue: true })).result.value);
        const clientHeight = await (ele.owner._run_js ? ele.owner._run_js('return document.body.clientHeight;') : (await ele.owner.run_cdp('Runtime.evaluate', { expression: 'document.body.clientHeight', returnByValue: true })).result.value);
        if (ele.owner._run_js) {
            ele.owner.run_cdp('Runtime.evaluate', { expression: `window.scrollTo(${lx - clientWidth / 2}, ${ly - clientHeight / 2})` });
        }
    }
    const [clX, clY] = ele.rect.viewport_location;
    const [ccpX, ccpY] = ele.rect.viewport_click_point;
    const cx = offsetX != null ? clX + offsetX : ccpX;
    const cy = offsetY != null ? clY + offsetY : ccpY;
    return [cx, cy];
}
function make_absolute_link(link, baseURI) {
    if (!link)
        return link || '';
    link = link.trim().replace(/\\/g, '/');
    if (link.startsWith('blob:') || link.startsWith('data:')) {
        return link;
    }
    try {
        const parsed = new url_1.URL(link, baseURI || undefined);
        return parsed.href;
    }
    catch {
        if (baseURI) {
            try {
                const base = new url_1.URL(baseURI);
                return new url_1.URL(link, base).href;
            }
            catch {
                return link;
            }
        }
        return link;
    }
}
function is_js_func(func) {
    func = func.trim();
    if ((func.startsWith('function') || func.startsWith('async ')) && func.endsWith('}')) {
        return true;
    }
    return false;
}
async function get_blob(page, url, asBytes = true) {
    const js = asBytes
        ? `(async () => { const r = await fetch(${JSON.stringify(url)}); const b = await r.arrayBuffer(); return Array.from(new Uint8Array(b)); })()`
        : `(async () => { const r = await fetch(${JSON.stringify(url)}); return await r.text(); })()`;
    const result = await page.run_cdp('Runtime.evaluate', {
        expression: js,
        returnByValue: true,
        awaitPromise: true,
    });
    if (asBytes && Array.isArray(result.result?.value)) {
        return Buffer.from(result.result.value);
    }
    return result.result?.value || '';
}
async function get_mhtml(page, filePath, name) {
    const result = await page.run_cdp('Page.captureSnapshot', { format: 'mhtml' });
    const data = result.data;
    if (!filePath && !name) {
        return data;
    }
    const fs = await Promise.resolve().then(() => __importStar(require('fs')));
    const path = await Promise.resolve().then(() => __importStar(require('path')));
    const dir = filePath || '.';
    fs.mkdirSync(dir, { recursive: true });
    const fileName = (name || 'page') + '.mhtml';
    const fullPath = path.join(dir, fileName);
    fs.writeFileSync(fullPath, data.replace(/\r\n/g, '\n'), 'utf-8');
    return data;
}
async function get_pdf(page, filePath, name, kwargs) {
    const params = { transferMode: 'ReturnAsBase64', printBackground: true, ...kwargs };
    const result = await page.run_cdp('Page.printToPDF', params);
    const data = Buffer.from(result.data, 'base64');
    if (!filePath && !name) {
        return data;
    }
    const fs = await Promise.resolve().then(() => __importStar(require('fs')));
    const path = await Promise.resolve().then(() => __importStar(require('path')));
    const dir = filePath || '.';
    fs.mkdirSync(dir, { recursive: true });
    const fileName = (name || 'page') + '.pdf';
    const fullPath = path.join(dir, fileName);
    fs.writeFileSync(fullPath, data);
    return data;
}
function tree(eleOrPage, text = false, showJs = false, showCss = false) {
    const lines = [];
    function _tree(obj, lastOne = true, body = '') {
        const listEle = obj.children || [];
        const length = listEle.length;
        const bodyUnit = lastOne ? '    ' : '│   ';
        const newBody = body + bodyUnit;
        if (length > 0) {
            for (let i = 0; i < length; i++) {
                const isLast = i === length - 1;
                const tail = isLast ? '└───' : '├───';
                const e = listEle[i];
                const attrs = e.attrs ? Object.entries(e.attrs).map(([k, v]) => `${k}='${v}'`).join(' ') : '';
                let showText = `${newBody}${tail}<${e.tag} ${attrs}>`.replace(/\n/g, ' ');
                if (text) {
                    const t = e.text?.replace(/\n/g, ' ');
                    if (t) {
                        if (!NO_TEXT_LIST.has(e.tag) || (e.tag === 'script' && showJs) || (e.tag === 'style' && showCss)) {
                            const displayText = text === true ? t : t.substring(0, text);
                            showText = `${showText} ${displayText}`;
                        }
                    }
                }
                lines.push(showText);
                _tree(e, isLast, newBody);
            }
        }
    }
    const ele = eleOrPage;
    const attrs = ele.attrs ? Object.entries(ele.attrs).map(([k, v]) => `${k}='${v}'`).join(' ') : '';
    let showText = `<${ele.tag} ${attrs}>`.replace(/\n/g, ' ');
    if (text) {
        const t = ele.text?.replace(/\n/g, ' ');
        if (t && (!NO_TEXT_LIST.has(ele.tag) || (ele.tag === 'script' && showJs) || (ele.tag === 'style' && showCss))) {
            const displayText = text === true ? t : t.substring(0, text);
            showText = `${showText} ${displayText}`;
        }
    }
    lines.push(showText);
    _tree(ele);
    return lines.join('\n');
}
function format_headers(txt) {
    if (typeof txt === 'object' && txt !== null && !Array.isArray(txt)) {
        const result = {};
        for (const [k, v] of Object.entries(txt)) {
            if (v !== null && v !== undefined && v !== true && v !== false) {
                if (!k.startsWith(':')) {
                    result[k] = String(v);
                }
            }
        }
        for (const k of [':method', ':scheme', ':authority', ':path']) {
            delete result[k];
        }
        return result;
    }
    const headers = {};
    const str = String(txt);
    for (const header of str.split('\n')) {
        if (header) {
            const colonIndex = header.indexOf(': ');
            if (colonIndex > 0) {
                const name = header.substring(0, colonIndex);
                const value = header.substring(colonIndex + 2);
                if (!name.startsWith(':')) {
                    headers[name] = value;
                }
            }
        }
    }
    return headers;
}
