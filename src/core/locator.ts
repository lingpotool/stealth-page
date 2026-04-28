export type LocatorType = "css" | "xpath";

export interface ParsedLocator {
  type: LocatorType;
  value: string;
  raw: string;
}

export interface LocatorTuple {
  by: string;
  value: string;
}

export interface LocatorDict {
  and: boolean;
  args: Array<[string, string | null, string | null, boolean]>;
}

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
export function parseLocator(loc: string): ParsedLocator {
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
    } else {
      const tagName = text.slice(4, atInd);
      const attrPart = text.slice(atInd);
      if (attrPart.startsWith("@@") || attrPart.startsWith("@|") || attrPart.startsWith("@!")) {
        return _makeMultiAttrXPath(tagName, attrPart);
      } else {
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
function _preprocess(loc: string): string {
  if (loc.startsWith(".")) {
    if (loc.startsWith(".=") || loc.startsWith(".:") || loc.startsWith(".^") || loc.startsWith(".$")) {
      return "@class" + loc.slice(1);
    }
    return "css:" + loc;
  }

  if (loc.startsWith("#")) {
    if (loc.startsWith("#=") || loc.startsWith("#:") || loc.startsWith("#^") || loc.startsWith("#$")) {
      return "@id" + loc.slice(1);
    }
    return "css:" + loc;
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
function _quotesEscape(searchStr: string): string {
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

  result += ',"")'
  return result;
}

/**
 * 解析单个属性参数 "attr=val" / "attr:val" / "attr^val" / "attr$val" / "attr"
 * 返回 [name, operator, value] 或 [name, null, null]
 */
function _parseArg(text: string): [string, string | null, string | null] {
  const match = text.match(/^([^:=$^*]+)([:=$^*])(.*)$/);
  if (match) {
    let name = match[1];
    if (name === "tx()") name = "text()";
    if (name === "t()") name = "tag()";
    // * 是 : 的别名（contains 匹配）
    const symbol = match[2] === "*" ? ":" : match[2];
    return [name, symbol, match[3]];
  }
  let name = text;
  if (name === "tx()") name = "text()";
  if (name === "t()") name = "tag()";
  return [name, null, null];
}

/**
 * 生成单属性 xpath 语句（对齐 Python _make_single_xpath_str）
 */
function _makeSingleAttrXPath(tag: string, text: string): ParsedLocator {
  const argList: string[] = tag === "*" ? [] : [`name()="${tag}"`];
  let argStr = "";
  let txtStr = "";

  if (text === "@") {
    argStr = "not(@*)";
  } else {
    const r = _parseArg(text.slice(1)); // 去掉开头的 @
    const [name, symbol, val] = r;

    if (name && symbol && val !== null) {
      if (name === "tag()" || name === "t()") {
        argStr = `name()="${val.toLowerCase()}"`;
      } else if (symbol === "=") {
        const arg = (name === "text()" || name === "tx()") ? "text()" : `@${name}`;
        argStr = `${arg}=${_quotesEscape(val)}`;
      } else if (symbol === "^") {
        if (name === "text()" || name === "tx()") {
          txtStr = `/text()[starts-with(., ${_quotesEscape(val)})]/..`;
        } else {
          argStr = `starts-with(@${name},${_quotesEscape(val)})`;
        }
      } else if (symbol === "$") {
        if (name === "text()" || name === "tx()") {
          txtStr = `/text()[substring(., string-length(.) - string-length(${_quotesEscape(val)}) +1) = ${_quotesEscape(val)}]/..`;
        } else {
          argStr = `substring(@${name}, string-length(@${name}) - string-length(${_quotesEscape(val)}) +1) = ${_quotesEscape(val)}`;
        }
      } else if (symbol === ":") {
        if (name === "text()" || name === "tx()") {
          txtStr = `/text()[contains(., ${_quotesEscape(val)})]/..`;
        } else {
          argStr = `contains(@${name},${_quotesEscape(val)})`;
        }
      }
    } else if (name) {
      // 只有属性名，没有值
      if (name === "tag()" || name === "t()") {
        argStr = "";
      } else if (name === "text()" || name === "tx()") {
        argStr = "normalize-space(text())";
      } else {
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
function _makeMultiAttrXPath(tag: string, text: string): ParsedLocator {
  const argList: string[] = [];
  // 用正则分割 @@ / @| / @!
  const parts = text.split(/(@!|@@|@\|)/).filter(Boolean);

  const hasAnd = parts.includes("@@");
  const hasOr = parts.includes("@|");
  if (hasAnd && hasOr) {
    throw new Error(`Locator symbol conflict: cannot mix @@ and @| in "${text}"`);
  }
  const isAnd = !hasOr;

  const tags: string[] = tag === "*" ? [] : [`name()="${tag}"`];
  let tagsConnect = " or ";

  for (let k = 0; k < parts.length - 1; k += 2) {
    const prefix = parts[k];     // @@ or @| or @!
    const content = parts[k + 1]; // attr=val
    const ignore = prefix === "@!";

    const [name, symbol, val] = _parseArg(content);
    let argStr = "";

    if (!name) {
      argStr = "not(@*)";
    } else if (symbol === null || val === null) {
      // 只有属性名
      if (name === "tag()" || name === "t()") {
        continue;
      }
      if (name === "text()" || name === "tx()") {
        argStr = "normalize-space(text())";
      } else {
        argStr = `@${name}`;
      }
    } else {
      // 属性名和值都有
      if (name === "tag()" || name === "t()") {
        if (ignore) {
          tags.push(`not(name()="${val}")`);
          tagsConnect = " and ";
        } else {
          tags.push(`name()="${val}"`);
        }
        continue;
      }

      const arg = (name === "text()" || name === "tx()") ? "." : `@${name}`;
      const txt = val;

      if (symbol === "=") {
        argStr = `${arg}=${_quotesEscape(txt)}`;
      } else if (symbol === ":") {
        argStr = `contains(${arg},${_quotesEscape(txt)})`;
      } else if (symbol === "^") {
        argStr = `starts-with(${arg},${_quotesEscape(txt)})`;
      } else if (symbol === "$") {
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

// 导出 _quotesEscape 供其他模块使用
export { _quotesEscape as quoteXPath };

import { By } from "./By";

export function css_trans(txt: string): string {
  const special = new Set(['!', '"', '#', '$', '%', '&', "'", '(', ')', '*', '+', ',', '-', '.', '/', ':', ';', '<', '=', '>', '?', '@', '[', '\\', ']', '^', '`', '{', '|', '}', '~', ' ']);
  return Array.from(txt).map(c => special.has(c) ? `\\${c}` : c).join('');
}

export function is_str_loc(text: string): boolean {
  return text.startsWith('.') || text.startsWith('#') || text.startsWith('@') ||
    text.startsWith('t:') || text.startsWith('t=') ||
    text.startsWith('tag:') || text.startsWith('tag=') ||
    text.startsWith('tx:') || text.startsWith('tx=') || text.startsWith('tx^') || text.startsWith('tx$') ||
    text.startsWith('text:') || text.startsWith('text=') || text.startsWith('text^') || text.startsWith('text$') ||
    text.startsWith('xpath:') || text.startsWith('xpath=') ||
    text.startsWith('x:') || text.startsWith('x=') ||
    text.startsWith('css:') || text.startsWith('css=') ||
    text.startsWith('c:') || text.startsWith('c=');
}

export function is_selenium_loc(loc: unknown): loc is [string, string] {
  if (!Array.isArray(loc) || loc.length !== 2) return false;
  if (typeof loc[0] !== 'string' || typeof loc[1] !== 'string') return false;
  const byConstants = [By.ID, By.XPATH, By.LINK_TEXT, By.PARTIAL_LINK_TEXT, By.NAME, By.TAG_NAME, By.CLASS_NAME, By.CSS_SELECTOR];
  return byConstants.includes(loc[0].toLowerCase());
}

export function get_loc(loc: string | [string, string], translate_css: boolean = false, css_mode: boolean = false): LocatorTuple {
  let result: LocatorTuple;

  if (Array.isArray(loc)) {
    result = css_mode ? translate_css_loc(loc) : translate_loc(loc);
  } else if (typeof loc === 'string') {
    result = css_mode ? str_to_css_loc(loc) : str_to_xpath_loc(loc);
  } else {
    throw new Error(`Invalid locator type: ${typeof loc}`);
  }

  if (result.by === 'css selector' && translate_css) {
    // In Python this uses lxml.cssselect to translate CSS to XPath
    // In Node.js we keep CSS as-is since DOM.performSearch supports CSS natively
  }

  return result;
}

export function str_to_xpath_loc(loc: string): LocatorTuple {
  let locBy = 'xpath';
  const text = _preprocess(loc.trim());

  if ((text.startsWith('@@') || text.startsWith('@|') || text.startsWith('@!')) &&
      text !== '@@' && text !== '@|' && text !== '@!') {
    const r = _makeMultiAttrXPath('*', text);
    return { by: 'xpath', value: r.value };
  }

  if (text.startsWith('@') && text !== '@') {
    const r = _makeSingleAttrXPath('*', text);
    return { by: 'xpath', value: r.value };
  }

  if ((text.startsWith('tag:') || text.startsWith('tag=') || text.startsWith('tag^') || text.startsWith('tag$')) &&
      text !== 'tag:' && text !== 'tag=' && text !== 'tag^' && text !== 'tag$') {
    const atInd = text.indexOf('@');
    if (atInd === -1) {
      return { by: 'xpath', value: `//*[name()="${text.slice(4)}"]` };
    }
    const tagName = text.slice(4, atInd);
    const attrPart = text.slice(atInd);
    if (attrPart.startsWith('@@') || attrPart.startsWith('@|') || attrPart.startsWith('@!')) {
      const r = _makeMultiAttrXPath(tagName, attrPart);
      return { by: 'xpath', value: r.value };
    }
    const r = _makeSingleAttrXPath(tagName, attrPart);
    return { by: 'xpath', value: r.value };
  }

  if (text.startsWith('text=') && text !== 'text=') {
    return { by: 'xpath', value: `//*[text()=${_quotesEscape(text.slice(5))}]` };
  }
  if (text.startsWith('text:') && text !== 'text:') {
    return { by: 'xpath', value: `//*/text()[contains(., ${_quotesEscape(text.slice(5))})]/..` };
  }
  if (text.startsWith('text^') && text !== 'text^') {
    return { by: 'xpath', value: `//*/text()[starts-with(., ${_quotesEscape(text.slice(5))})]/..` };
  }
  if (text.startsWith('text$') && text !== 'text$') {
    const v = text.slice(5);
    return { by: 'xpath', value: `//*/text()[substring(., string-length(.) - string-length(${_quotesEscape(v)}) +1) = ${_quotesEscape(v)}]/..` };
  }

  if ((text.startsWith('xpath:') || text.startsWith('xpath=')) && text !== 'xpath:' && text !== 'xpath=') {
    return { by: 'xpath', value: text.slice(6) };
  }

  if ((text.startsWith('css:') || text.startsWith('css=')) && text !== 'css:' && text !== 'css=') {
    return { by: 'css selector', value: text.slice(4) };
  }

  if (text) {
    return { by: 'xpath', value: `//*/text()[contains(., ${_quotesEscape(text)})]/..` };
  }

  return { by: 'xpath', value: '//*' };
}

export function str_to_css_loc(loc: string): LocatorTuple {
  let locBy = 'css selector';
  const text = _preprocess(loc.trim());

  if ((text.startsWith('@@') || text.startsWith('@|') || text.startsWith('@!')) &&
      text !== '@@' && text !== '@|' && text !== '@!') {
    return _makeMultiCssStr('*', text);
  }

  if (text.startsWith('@') && text !== '@') {
    return _makeSingleCssStr('*', text);
  }

  if ((text.startsWith('tag:') || text.startsWith('tag=') || text.startsWith('tag^') || text.startsWith('tag$')) &&
      text !== 'tag:' && text !== 'tag=' && text !== 'tag^' && text !== 'tag$') {
    const atInd = text.indexOf('@');
    if (atInd === -1) {
      return { by: 'css selector', value: text.slice(4) };
    }
    const tagName = text.slice(4, atInd);
    const attrPart = text.slice(atInd);
    if (attrPart.startsWith('@@') || attrPart.startsWith('@|') || attrPart.startsWith('@!')) {
      return _makeMultiCssStr(tagName, attrPart);
    }
    return _makeSingleCssStr(tagName, attrPart);
  }

  if (text.startsWith('text=') || text.startsWith('text:') || text.startsWith('text^') || text.startsWith('text$') ||
      text.startsWith('xpath=') || text.startsWith('xpath:')) {
    return str_to_xpath_loc(loc);
  }

  if ((text.startsWith('css:') || text.startsWith('css=')) && text !== 'css:' && text !== 'css=') {
    return { by: 'css selector', value: text.slice(4) };
  }

  if (text) {
    return str_to_xpath_loc(loc);
  }

  return { by: 'css selector', value: '*' };
}

function _makeSingleCssStr(tag: string, text: string): LocatorTuple {
  if (text === '@' || text.startsWith('@text()') || text.startsWith('@tx()')) {
    return _makeSingleAttrXPathTuple(tag, text);
  }

  const r = text.slice(1).split(/([:=$^])/);
  if (r[0] === 'tag()' || r[0] === 't()') {
    return { by: 'css selector', value: r[2] || tag };
  }

  if (r.length === 3) {
    const d: Record<string, string> = { '=': '', '^': '^', '$': '$', ':': '*' };
    const attrName = r[0];
    const symbol = r[1];
    const val = r[2];
    const argStr = `[${attrName}${d[symbol]}=${css_trans(val)}]`;
    return { by: 'css selector', value: `${tag}${argStr}` };
  }

  const argStr = `[${css_trans(r[0])}]`;
  return { by: 'css selector', value: `${tag}${argStr}` };
}

function _makeMultiCssStr(tag: string, text: string): LocatorTuple {
  const argList: string[] = [];
  const parts = text.split(/(@!|@@|@\|)/).filter(Boolean);

  if (parts.includes('@@') && parts.includes('@|')) {
    throw new Error(`Locator symbol conflict: cannot mix @@ and @| in "${text}"`);
  }
  const isAnd = !parts.includes('@|');
  let currentTag = tag;

  for (let k = 0; k < parts.length - 1; k += 2) {
    const prefix = parts[k];
    const content = parts[k + 1];
    const r = content.split(/([:=$^])/);

    if (!r[0] || r[0].startsWith('text()') || r[0].startsWith('tx()')) {
      return _makeMultiAttrXPathTuple(currentTag, text);
    }

    const ignore = prefix === '@!';
    let argStr = '';

    if (r.length !== 3) {
      if (r[0] === 'tag()' || r[0] === 't()') {
        continue;
      }
      argStr = `[${r[0]}]`;
    } else {
      if (r[0] === 'tag()' || r[0] === 't()') {
        if (currentTag === '*') {
          currentTag = ignore ? `:not(${r[2].toLowerCase()})` : r[2].toLowerCase();
        } else {
          currentTag += ignore ? `,:not(${r[2].toLowerCase()})` : `,${r[2].toLowerCase()}`;
        }
        continue;
      }

      const d: Record<string, string> = { '=': '', '^': '^', '$': '$', ':': '*' };
      argStr = `[${r[0]}${d[r[1]]}=${css_trans(r[2])}]`;
    }

    if (argStr && ignore) {
      argStr = `:not(${argStr})`;
    }

    if (argStr) {
      argList.push(argStr);
    }
  }

  if (isAnd) {
    return { by: 'css selector', value: `${currentTag}${argList.join('')}` };
  }

  return { by: 'css selector', value: `${currentTag}${argList.join(',' + currentTag)}` };
}

function _makeSingleAttrXPathTuple(tag: string, text: string): LocatorTuple {
  const r = _makeSingleAttrXPath(tag, text);
  return { by: 'xpath', value: r.value };
}

function _makeMultiAttrXPathTuple(tag: string, text: string): LocatorTuple {
  const r = _makeMultiAttrXPath(tag, text);
  return { by: 'xpath', value: r.value };
}

export function translate_loc(loc: [string, string]): LocatorTuple {
  if (loc.length !== 2) {
    throw new Error(`Locator tuple must have exactly 2 elements, got ${loc.length}`);
  }

  const loc0 = loc[0].toLowerCase();

  if (loc0 === By.XPATH) {
    return { by: 'xpath', value: loc[1] };
  }
  if (loc0 === By.CSS_SELECTOR) {
    return { by: 'css selector', value: loc[1] };
  }
  if (loc0 === By.ID) {
    return { by: 'xpath', value: `//*[@id="${loc[1]}"]` };
  }
  if (loc0 === By.CLASS_NAME) {
    return { by: 'xpath', value: `//*[@class="${loc[1]}"]` };
  }
  if (loc0 === By.LINK_TEXT) {
    return { by: 'xpath', value: `//a[text()="${loc[1]}"]` };
  }
  if (loc0 === By.NAME) {
    return { by: 'xpath', value: `//*[@name="${loc[1]}"]` };
  }
  if (loc0 === By.TAG_NAME) {
    return { by: 'xpath', value: `//*[name()="${loc[1]}"]` };
  }
  if (loc0 === By.PARTIAL_LINK_TEXT) {
    return { by: 'xpath', value: `//a[contains(text(),"${loc[1]}")]` };
  }

  throw new Error(`Invalid locator type: ${loc[0]}`);
}

export function translate_css_loc(loc: [string, string]): LocatorTuple {
  if (loc.length !== 2) {
    throw new Error(`Locator tuple must have exactly 2 elements, got ${loc.length}`);
  }

  const loc0 = loc[0].toLowerCase();

  if (loc0 === By.XPATH) {
    return { by: 'xpath', value: loc[1] };
  }
  if (loc0 === By.CSS_SELECTOR) {
    return { by: 'css selector', value: loc[1] };
  }
  if (loc0 === By.ID) {
    return { by: 'css selector', value: `#${css_trans(loc[1])}` };
  }
  if (loc0 === By.CLASS_NAME) {
    return { by: 'css selector', value: `.${css_trans(loc[1])}` };
  }
  if (loc0 === By.LINK_TEXT) {
    return { by: 'xpath', value: `//a[text()="${css_trans(loc[1])}"]` };
  }
  if (loc0 === By.NAME) {
    return { by: 'css selector', value: `*[@name=${css_trans(loc[1])}]` };
  }
  if (loc0 === By.TAG_NAME) {
    return { by: 'css selector', value: loc[1] };
  }
  if (loc0 === By.PARTIAL_LINK_TEXT) {
    return { by: 'xpath', value: `//a[contains(text(),"${loc[1]}")]` };
  }

  throw new Error(`Invalid locator type: ${loc[0]}`);
}

export function locator_to_tuple(loc: string): LocatorDict {
  const text = _preprocess(loc.trim());

  if ((text.startsWith('@@') || text.startsWith('@|') || text.startsWith('@!')) &&
      text !== '@@' && text !== '@|' && text !== '@!') {
    return _getArgs(text);
  }

  if (text.startsWith('@') && text !== '@') {
    const arg = _getArg(text.slice(1));
    return { and: true, args: [[arg[0], arg[1], arg[2], false]] };
  }

  if ((text.startsWith('tag:') || text.startsWith('tag=') || text.startsWith('tag^') || text.startsWith('tag$')) &&
      text !== 'tag:' && text !== 'tag=' && text !== 'tag^' && text !== 'tag$') {
    const atInd = text.indexOf('@');
    if (atInd === -1) {
      return { and: true, args: [['tag()', '=', text.slice(4).toLowerCase(), false]] };
    }
    const argsStr = text.slice(atInd);
    if (argsStr.startsWith('@@') || argsStr.startsWith('@|') || argsStr.startsWith('@!')) {
      const result = _getArgs(argsStr);
      result.args.push(['tag()', '=', text.slice(4, atInd).toLowerCase(), false]);
      return result;
    }
    const arg = _getArg(text.slice(atInd + 1));
    return { and: true, args: [['tag()', '=', text.slice(4, atInd).toLowerCase(), false], [arg[0], arg[1], arg[2], false]] };
  }

  if (text.startsWith('text=') || text.startsWith('text:') || text.startsWith('text^') || text.startsWith('text$')) {
    return { and: true, args: [['text()', text[4] as string, text.slice(5), false]] };
  }

  return { and: true, args: [['text()', '=', loc.trim(), false]] };
}

function _getArgs(text: string): LocatorDict {
  const argList: Array<[string, string | null, string | null, boolean]> = [];
  const parts = text.split(/(@!|@@|@\|)/).filter(Boolean);

  if (parts.includes('@@') && parts.includes('@|')) {
    throw new Error(`Locator symbol conflict: cannot mix @@ and @|`);
  }
  const isAnd = !parts.includes('@|');

  for (let k = 0; k < parts.length - 1; k += 2) {
    const arg = _getArg(parts[k + 1]);
    if (arg[0] !== null) {
      argList.push([arg[0], arg[1], arg[2], parts[k] === '@!']);
    }
  }

  return { and: isAnd, args: argList };
}

function _getArg(text: string): [string, string | null, string | null] {
  const r = text.split(/([:=$^])/);
  if (!r[0]) {
    return [null as any, null, null];
  }
  let name = r[0];
  if (name === 'tx()') name = 'text()';
  if (name === 't()') name = 'tag()';
  if (r.length !== 3) {
    return [name, null, null];
  }
  return [name, r[1], r[2]];
}
