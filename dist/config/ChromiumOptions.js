"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChromiumOptions = void 0;
/**
 * Node 版的 ChromiumOptions，对齐 DrissionPage.ChromiumOptions 的主要字段和方法。
 * 目前只定义结构，具体行为在后续实现。
 */
class ChromiumOptions {
    constructor(init) {
        this.browserPath = "";
        this.downloadPath = ".";
        this.tmpPath = null;
        this.address = "";
        this.arguments = [];
        this.extensions = [];
        this.flags = {};
        this.timeouts = { base: 10, pageLoad: 30, script: 30 };
        this.uploadFiles = [];
        if (init) {
            Object.assign(this, {
                browserPath: init.browserPath ?? this.browserPath,
                userDataPath: init.userDataPath ?? this.userDataPath,
                downloadPath: init.downloadPath ?? this.downloadPath,
                tmpPath: init.tmpPath ?? this.tmpPath,
                address: init.address ?? this.address,
                arguments: init.arguments ?? this.arguments,
                extensions: init.extensions ?? this.extensions,
                flags: init.flags ?? this.flags,
                timeouts: init.timeouts ?? this.timeouts,
            });
        }
    }
    set_timeouts(base, pageLoad, script) {
        this.timeouts = {
            base,
            pageLoad: pageLoad ?? this.timeouts.pageLoad,
            script: script ?? this.timeouts.script,
        };
        return this;
    }
    set_paths(options) {
        if (options.downloadPath !== undefined) {
            this.downloadPath = options.downloadPath;
        }
        if (options.tmpPath !== undefined) {
            this.tmpPath = options.tmpPath;
        }
        if (options.userDataPath !== undefined) {
            this.userDataPath = options.userDataPath;
        }
        return this;
    }
    set_argument(arg) {
        if (!this.arguments.includes(arg)) {
            this.arguments.push(arg);
        }
        return this;
    }
    remove_argument(arg) {
        this.arguments = this.arguments.filter((a) => a !== arg);
        return this;
    }
    headless(enabled = true) {
        if (enabled) {
            this.set_argument("--headless=new");
        }
        else {
            this.remove_argument("--headless=new");
            this.remove_argument("--headless");
        }
        return this;
    }
    incognito(enabled = true) {
        if (enabled) {
            this.set_argument("--incognito");
        }
        else {
            this.remove_argument("--incognito");
        }
        return this;
    }
    no_imgs(enabled = true) {
        if (enabled) {
            this.set_argument("--blink-settings=imagesEnabled=false");
        }
        else {
            this.arguments = this.arguments.filter((a) => !a.includes("imagesEnabled"));
        }
        return this;
    }
    no_js(enabled = true) {
        if (enabled) {
            this.set_argument("--disable-javascript");
        }
        else {
            this.remove_argument("--disable-javascript");
        }
        return this;
    }
    mute(enabled = true) {
        if (enabled) {
            this.set_argument("--mute-audio");
        }
        else {
            this.remove_argument("--mute-audio");
        }
        return this;
    }
    set_browser_path(path) {
        this.browserPath = path;
        return this;
    }
    set_address(address) {
        this.address = address;
        return this;
    }
    set_user_data_path(path) {
        this.userDataPath = path;
        return this;
    }
    add_extension(path) {
        if (!this.extensions.includes(path)) {
            this.extensions.push(path);
        }
        return this;
    }
    remove_extension(path) {
        this.extensions = this.extensions.filter((e) => e !== path);
        return this;
    }
    set_flag(key, value) {
        this.flags[key] = value;
        return this;
    }
    remove_flag(key) {
        delete this.flags[key];
        return this;
    }
}
exports.ChromiumOptions = ChromiumOptions;
