"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MixTabCookiesSetter = void 0;
const CookiesSetter_1 = require("./CookiesSetter");
const SessionCookiesSetter_1 = require("./SessionCookiesSetter");
class MixTabCookiesSetter extends CookiesSetter_1.CookiesSetter {
    constructor(owner, sessionPage) {
        super(owner);
        this._sessionSetter = new SessionCookiesSetter_1.SessionCookiesSetter(sessionPage);
    }
    async set(cookies) {
        await super.set(cookies);
        const cookieList = this._parseCookies(cookies);
        await this._sessionSetter.set(cookieList.map(c => ({
            name: c.name,
            value: c.value,
            domain: c.domain,
            path: c.path,
        })));
    }
    async remove(name, url, domain, path) {
        await super.remove(name, url, domain, path);
    }
    async clear() {
        await super.clear();
        await this._sessionSetter.clear();
    }
}
exports.MixTabCookiesSetter = MixTabCookiesSetter;
