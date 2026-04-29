"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TabDownloadSettings = void 0;
class TabDownloadSettings {
    constructor(tabId) {
        this.save_path = '.';
        this.rename = null;
        this.suffix = null;
        this.when_file_exists = 'rename';
        this.tabId = tabId;
    }
    static get(tabId) {
        let instance = TabDownloadSettings._instances.get(tabId);
        if (!instance) {
            instance = new TabDownloadSettings(tabId);
            TabDownloadSettings._instances.set(tabId, instance);
        }
        return instance;
    }
    static remove(tabId) {
        TabDownloadSettings._instances.delete(tabId);
    }
    set_path(path) {
        this.save_path = path;
        return this;
    }
    set_rename(rename) {
        this.rename = rename;
        return this;
    }
    set_suffix(suffix) {
        this.suffix = suffix;
        return this;
    }
    set_file_exists(mode) {
        this.when_file_exists = mode;
        return this;
    }
}
exports.TabDownloadSettings = TabDownloadSettings;
TabDownloadSettings._instances = new Map();
