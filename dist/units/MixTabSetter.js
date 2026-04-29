"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MixTabSetter = void 0;
const SessionPageSetter_1 = require("./SessionPageSetter");
const WebPageCookiesSetter_1 = require("./WebPageCookiesSetter");
class MixTabSetter {
    constructor(owner) {
        this._owner = owner;
        this._sessionSetter = new SessionPageSetter_1.SessionPageSetter(owner.session);
    }
    get cookies() {
        return new WebPageCookiesSetter_1.WebPageCookiesSetter(this._owner, this._owner.session);
    }
    async timeouts(base, pageLoad, script) {
        const page = this._owner._page;
        if (page) {
            await this._owner.set.timeouts(base, pageLoad, script);
        }
    }
    async download_path(path) {
        await this._owner.set.download_path(path);
    }
    async download_file_name(name, suffix) {
        await this._owner.set.download_file_name(name, suffix);
    }
    async when_download_file_exists(mode) {
        await this._owner.set.when_download_file_exists(mode);
    }
    async activate() {
        await this._owner.set.activate();
    }
    async headers(headers) {
        await this._owner.set.headers(headers);
    }
    async user_agent(ua, platform) {
        await this._owner.set.user_agent(ua, platform);
    }
    async session_storage(item, value) {
        await this._owner.set.session_storage(item, value);
    }
    async local_storage(item, value) {
        await this._owner.set.local_storage(item, value);
    }
    async upload_files(files) {
        await this._owner.set.upload_files(files);
    }
    async auto_handle_alert(onOff = true, accept = true) {
        await this._owner.set.auto_handle_alert(onOff, accept);
    }
    async blocked_urls(urls) {
        await this._owner.set.blocked_urls(urls);
    }
    timeout(second) {
        this._sessionSetter.timeout(second);
    }
    encoding(encoding, setAll = true) {
        this._sessionSetter.encoding(encoding, setAll);
    }
    proxies(http, https) {
        this._sessionSetter.proxies(http, https);
    }
    verify(onOff) {
        this._sessionSetter.verify(onOff);
    }
}
exports.MixTabSetter = MixTabSetter;
