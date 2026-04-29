"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebPageSetter = void 0;
const SessionPageSetter_1 = require("./SessionPageSetter");
const WebPageCookiesSetter_1 = require("./WebPageCookiesSetter");
class WebPageSetter {
    constructor(owner) {
        this._owner = owner;
        this._sessionSetter = new SessionPageSetter_1.SessionPageSetter(owner.session_page);
    }
    get cookies() {
        return new WebPageCookiesSetter_1.WebPageCookiesSetter(this._owner.chromium_page, this._owner.session_page);
    }
    async download_path(path) {
        await this._owner.chromium_page.set.download_path(path);
    }
    async download_file_name(name, suffix) {
        await this._owner.chromium_page.set.download_file_name(name, suffix);
    }
    async when_download_file_exists(mode) {
        await this._owner.chromium_page.set.when_download_file_exists(mode);
    }
    async timeouts(base, pageLoad, script) {
        await this._owner.chromium_page.set.timeouts(base, pageLoad, script);
    }
    async headers(headers) {
        await this._owner.chromium_page.set.headers(headers);
    }
    async user_agent(ua, platform) {
        await this._owner.chromium_page.set.user_agent(ua, platform);
    }
    async session_storage(item, value) {
        await this._owner.chromium_page.set.session_storage(item, value);
    }
    async local_storage(item, value) {
        await this._owner.chromium_page.set.local_storage(item, value);
    }
    async upload_files(files) {
        await this._owner.chromium_page.set.upload_files(files);
    }
    async auto_handle_alert(onOff = true, accept = true) {
        await this._owner.chromium_page.set.auto_handle_alert(onOff, accept);
    }
    async blocked_urls(urls) {
        await this._owner.chromium_page.set.blocked_urls(urls);
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
exports.WebPageSetter = WebPageSetter;
