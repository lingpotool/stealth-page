"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChromiumTab = void 0;
const ChromiumBase_1 = require("./ChromiumBase");
class ChromiumTab extends ChromiumBase_1.ChromiumBase {
    constructor(browser, tabId) {
        super(browser);
        this._tabId = tabId;
    }
    get tab_id() {
        return this._tabId;
    }
    async init() {
        if (!this._page) {
            await this._browser.connect();
            this._page = await this._browser.get_page_by_id(this._tabId);
        }
    }
    async close(others = false) {
        if (others) {
            const tabs = await this._browser.get_tabs();
            for (const tab of tabs) {
                if (tab.id !== this._tabId) {
                    await this._browser.close_tab(tab.id);
                }
            }
        }
        else {
            await this._browser.close_tab(this._tabId);
        }
    }
    async activate() {
        await this._browser.activate_tab(this._tabId);
    }
    async get_screenshot(path, name, asBytes, asBase64, fullPage = false, leftTop, rightBottom) {
        await this.init();
        return this._get_screenshot(path, name, asBytes, asBase64, fullPage, leftTop, rightBottom);
    }
    async get_frame_elements(locator) {
        await this.init();
        if (locator) {
            return this.eles(locator);
        }
        return this.eles("iframe, frame");
    }
    _on_disconnect() {
        this._page = null;
    }
}
exports.ChromiumTab = ChromiumTab;
