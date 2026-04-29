"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CookiesList = void 0;
exports.format_cookie = format_cookie;
exports.format_cookies = format_cookies;
exports.make_cookie_info = make_cookie_info;
exports.set_tab_cookie = set_tab_cookie;
exports.cookie_to_dict = cookie_to_dict;
exports.cookies_to_tuple = cookies_to_tuple;
function format_cookie(cookie) {
    if ('expiry' in cookie) {
        cookie.expires = typeof cookie.expiry === 'number' ? cookie.expiry : parseInt(String(cookie.expiry), 10);
        delete cookie.expiry;
    }
    if ('expires' in cookie) {
        if (!cookie.expires) {
            delete cookie.expires;
        }
        else if (typeof cookie.expires === 'string') {
            if (/^\d+$/.test(cookie.expires)) {
                cookie.expires = parseInt(cookie.expires, 10);
            }
            else if (/^\d+(\.\d+)?$/.test(cookie.expires)) {
                cookie.expires = parseFloat(cookie.expires);
            }
            else {
                try {
                    cookie.expires = Math.floor(new Date(cookie.expires).getTime() / 1000);
                }
                catch {
                    delete cookie.expires;
                }
            }
        }
    }
    if (cookie.value === null || cookie.value === undefined) {
        cookie.value = '';
    }
    else if (typeof cookie.value !== 'string') {
        cookie.value = String(cookie.value);
    }
    if (cookie.name.startsWith('__Host-')) {
        cookie.path = '/';
        cookie.secure = true;
    }
    else if (cookie.name.startsWith('__Secure-')) {
        cookie.secure = true;
    }
    if ('sameSite' in cookie) {
        const sameSite = cookie.sameSite;
        if (sameSite === null || sameSite === false || !['None', 'Lax', 'Strict', 'no_restriction'].includes(sameSite)) {
            delete cookie.sameSite;
        }
    }
    if ('priority' in cookie) {
        const priority = cookie.priority;
        if (priority === null || priority === false) {
            delete cookie.priority;
        }
        else if (!['Low', 'Medium', 'High'].includes(priority)) {
            throw new Error(`Invalid priority value: ${priority}. Must be "Low", "Medium", or "High".`);
        }
    }
    if ('sourceScheme' in cookie) {
        const sourceScheme = cookie.sourceScheme;
        if (sourceScheme === null || sourceScheme === false) {
            delete cookie.sourceScheme;
        }
        else if (!['Unset', 'NonSecure', 'Secure'].includes(sourceScheme)) {
            throw new Error(`Invalid sourceScheme value: ${sourceScheme}. Must be "Unset", "NonSecure", or "Secure".`);
        }
    }
    return cookie;
}
function format_cookies(cookies) {
    return cookies.map(c => format_cookie({ ...c }));
}
function make_cookie_info(cookie) {
    return {
        name: cookie.name || '',
        value: cookie.value || '',
        domain: cookie.domain || '',
        path: cookie.path || '/',
        expires: cookie.expires || -1,
        httpOnly: cookie.httpOnly || false,
        secure: cookie.secure || false,
        sameSite: cookie.sameSite || undefined,
    };
}
async function set_tab_cookie(page, cookies) {
    const cookieList = Array.isArray(cookies) ? cookies : [cookies];
    for (const rawCookie of cookieList) {
        const cookie = format_cookie({ ...rawCookie });
        if (cookie.name.startsWith('__Host-')) {
            if (!page.url.startsWith('http')) {
                cookie.name = cookie.name.replace('__Host-', '__Secure-');
            }
            else {
                cookie.url = page.url;
            }
            await page.run_cdp('Network.setCookie', cookie);
            continue;
        }
        if (cookie.domain) {
            try {
                await page.run_cdp('Network.setCookie', cookie);
                continue;
            }
            catch { }
        }
        if (!page.url.startsWith('http')) {
            throw new Error('Domain not set. Please set the domain parameter of the cookie or visit a website first.');
        }
        const urlObj = new URL(page.url);
        const hostParts = urlObj.hostname.split('.');
        const domainParts = [];
        for (let i = 0; i < hostParts.length; i++) {
            domainParts.push(hostParts.slice(i).join('.'));
        }
        for (const domain of domainParts) {
            cookie.domain = domain;
            await page.run_cdp('Network.setCookie', cookie);
            const result = await page.run_cdp('Network.getCookies');
            const found = result.cookies?.some((c) => c.name === cookie.name && c.value === cookie.value && c.domain === cookie.domain);
            if (found)
                break;
        }
    }
}
class CookiesList extends Array {
    as_dict() {
        const result = {};
        for (const c of this) {
            result[c.name] = c.value;
        }
        return result;
    }
    as_str() {
        return this.map(c => `${c.name}=${c.value}`).join('; ');
    }
    as_json() {
        return JSON.stringify(this);
    }
}
exports.CookiesList = CookiesList;
function cookie_to_dict(cookie) {
    if (typeof cookie === 'string') {
        const cookieDict = { name: '', value: '' };
        const parts = cookie.trim().replace(/[;,]\s*$/, '').split(/[;,]/);
        for (const part of parts) {
            const [key, ...valueParts] = part.trim().split('=');
            const value = valueParts.join('=');
            if (['domain', 'path', 'expires', 'max-age', 'HttpOnly', 'secure', 'expiry', 'name', 'value'].includes(key.trim())) {
                cookieDict[key.trim()] = value || '';
            }
            else if (!cookieDict.name) {
                cookieDict.name = key.trim();
                cookieDict.value = value || '';
            }
        }
        return cookieDict;
    }
    return { ...cookie };
}
function cookies_to_tuple(cookies) {
    if (Array.isArray(cookies)) {
        return cookies.map(c => cookie_to_dict(c));
    }
    if (typeof cookies === 'string') {
        const cDict = {};
        const parts = cookies.replace(/[;,]\s*$/, '').split(';');
        for (const part of parts) {
            const [key, ...valueParts] = part.trim().split('=');
            const value = valueParts.join('=');
            cDict[key.trim()] = value || true;
        }
        return _dict_cookies_to_tuple(cDict);
    }
    if (typeof cookies === 'object' && cookies !== null) {
        return _dict_cookies_to_tuple(cookies);
    }
    throw new Error('Invalid cookies type.');
}
function _dict_cookies_to_tuple(cookies) {
    if ('name' in cookies && 'value' in cookies) {
        return [cookies];
    }
    const keys = ['domain', 'path', 'expires', 'max-age', 'HttpOnly', 'secure', 'expiry'];
    const template = {};
    for (const k of keys) {
        if (k in cookies)
            template[k] = cookies[k];
    }
    const result = [];
    for (const [k, v] of Object.entries(cookies)) {
        if (!keys.includes(k)) {
            result.push({ name: k, value: v === true ? '' : String(v), ...template });
        }
    }
    return result;
}
