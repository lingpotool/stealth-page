"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionCookiesSetter = void 0;
class SessionCookiesSetter {
    constructor(owner) {
        this._owner = owner;
    }
    async set(cookies) {
        await this._owner.set_cookies(cookies);
    }
    async remove(name) {
        this._owner.clear_cookies();
    }
    async clear() {
        this._owner.clear_cookies();
    }
}
exports.SessionCookiesSetter = SessionCookiesSetter;
