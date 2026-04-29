"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MixTabWaiter = void 0;
const ChromiumPageWaiter_1 = require("../pages/ChromiumPageWaiter");
const Settings_1 = require("../core/Settings");
function shouldRaise(raiseErr) {
    if (raiseErr === true)
        return true;
    if (raiseErr === false)
        return false;
    return Settings_1.Settings.raise_when_wait_failed;
}
class MixTabWaiter {
    constructor(owner) {
        this._owner = owner;
        this._chromiumWaiter = new ChromiumPageWaiter_1.ChromiumPageWaiter(owner);
    }
    async wait(second, scope) {
        await this._chromiumWaiter.wait(second, scope);
        return this._owner;
    }
    async ele_deleted(locator, timeout, raiseErr) {
        return this._chromiumWaiter.ele_deleted(locator, timeout, raiseErr);
    }
    async ele_displayed(locator, timeout, raiseErr) {
        return this._chromiumWaiter.ele_displayed(locator, timeout, raiseErr);
    }
    async ele_hidden(locator, timeout, raiseErr) {
        return this._chromiumWaiter.ele_hidden(locator, timeout, raiseErr);
    }
    async url_change(text, exclude = false, timeout, raiseErr) {
        const result = await this._chromiumWaiter.url_change(text, exclude, timeout, raiseErr);
        return result ? this._owner : false;
    }
    async title_change(text, exclude = false, timeout, raiseErr) {
        const result = await this._chromiumWaiter.title_change(text, exclude, timeout, raiseErr);
        return result ? this._owner : false;
    }
    async download_begin(timeout, cancelIt = false) {
        return this._chromiumWaiter.download_begin(timeout, cancelIt);
    }
    async downloads_done(timeout, cancelIfTimeout = true) {
        return this._chromiumWaiter.downloads_done(timeout, cancelIfTimeout);
    }
    async new_tab(timeout, raiseErr) {
        return this._chromiumWaiter.new_tab(timeout, raiseErr);
    }
    async alert_closed(timeout) {
        const result = await this._chromiumWaiter.alert_closed(timeout);
        return result ? this._owner : false;
    }
}
exports.MixTabWaiter = MixTabWaiter;
