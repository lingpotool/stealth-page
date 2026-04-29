"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Settings = void 0;
const Texts_1 = require("./Texts");
const path_1 = require("path");
class Settings {
    static set_raise_when_ele_not_found(on_off = true) {
        Settings.raise_when_ele_not_found = on_off;
        return Settings;
    }
    static set_raise_when_click_failed(on_off = true) {
        Settings.raise_when_click_failed = on_off;
        return Settings;
    }
    static set_raise_when_wait_failed(on_off = true) {
        Settings.raise_when_wait_failed = on_off;
        return Settings;
    }
    static set_singleton_tab_obj(on_off = true) {
        Settings.singleton_tab_obj = on_off;
        return Settings;
    }
    static set_cdp_timeout(second) {
        Settings.cdp_timeout = second;
        return Settings;
    }
    static set_browser_connect_timeout(second) {
        Settings.browser_connect_timeout = second;
        return Settings;
    }
    static set_auto_handle_alert(accept = true) {
        Settings.auto_handle_alert = accept;
        return Settings;
    }
    static set_suffixes_list(path) {
        Settings.suffixes_list = path.replace(/\\/g, '/');
        return Settings;
    }
    static set_language(code) {
        Settings._lang = (0, Texts_1.get_txt_class)(code);
        return Settings;
    }
}
exports.Settings = Settings;
Settings.raise_when_ele_not_found = false;
Settings.raise_when_click_failed = false;
Settings.raise_when_wait_failed = false;
Settings.singleton_tab_obj = true;
Settings.cdp_timeout = 30;
Settings.browser_connect_timeout = 30;
Settings.auto_handle_alert = null;
Settings.none_ele_return_value = null;
Settings.none_ele_value = null;
Settings.retry_times = 0;
Settings.retry_interval = 0.5;
Settings.debug = false;
Settings.suffixes_list = (0, path_1.join)(__dirname, '..', '..', 'suffixes.dat').replace(/\\/g, '/');
Settings._lang = (0, Texts_1.get_txt_class)(null);
