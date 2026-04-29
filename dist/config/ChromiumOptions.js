"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChromiumOptions = void 0;
const OptionsManager_1 = require("../core/OptionsManager");
const PortFinder_1 = require("../core/PortFinder");
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
        this.retryTimes = 3;
        this.retryInterval = 2;
        this.loadMode = "normal";
        this._proxy = "";
        this.downloadFileName = null;
        this.downloadFileSuffix = null;
        this.whenDownloadFileExists = "rename";
        this.user = "Default";
        this.system_user_path = false;
        this.is_existing_only = false;
        this.is_auto_port = false;
        this.is_headless = false;
        this.prefs = {};
        this._prefs_to_del = [];
        this._new_env = false;
        this._ua_set = false;
        this._clear_file_flags = false;
        if (typeof init === 'string') {
            const om = new OptionsManager_1.OptionsManager(init);
            this._load_from_manager(om);
        }
        else if (init) {
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
                user: init.user ?? this.user,
                system_user_path: init.systemUserPath ?? this.system_user_path,
                is_existing_only: init.existingOnly ?? this.is_existing_only,
                is_auto_port: init.autoPort ?? this.is_auto_port,
                is_headless: init.headless ?? this.is_headless,
                _new_env: init.newEnv ?? this._new_env,
            });
        }
    }
    _load_from_manager(om) {
        const co = om.get_option('chromium_options');
        if (co.browser_path)
            this.browserPath = co.browser_path;
        if (co.address)
            this.address = co.address;
        if (co.arguments)
            this.arguments = Array.isArray(co.arguments) ? co.arguments : [];
        if (co.extensions)
            this.extensions = Array.isArray(co.extensions) ? co.extensions : [];
        if (co.prefs)
            this.prefs = typeof co.prefs === 'object' ? co.prefs : {};
        if (co.flags)
            this.flags = typeof co.flags === 'object' ? co.flags : {};
        if (co.load_mode)
            this.loadMode = co.load_mode;
        if (co.user)
            this.user = co.user;
        if (co.auto_port)
            this.is_auto_port = co.auto_port === true || co.auto_port === 'True';
        if (co.system_user_path)
            this.system_user_path = co.system_user_path === true || co.system_user_path === 'True';
        if (co.existing_only)
            this.is_existing_only = co.existing_only === true || co.existing_only === 'True';
        if (co.new_env)
            this._new_env = co.new_env === true || co.new_env === 'True';
        const paths = om.get_option('paths');
        if (paths.download_path)
            this.downloadPath = paths.download_path;
        if (paths.tmp_path)
            this.tmpPath = paths.tmp_path;
        const timeouts = om.get_option('timeouts');
        if (timeouts.base)
            this.timeouts.base = Number(timeouts.base);
        if (timeouts.page_load)
            this.timeouts.pageLoad = Number(timeouts.page_load);
        if (timeouts.script)
            this.timeouts.script = Number(timeouts.script);
    }
    get ws_address() {
        let addr = this.address;
        if (!addr)
            return '';
        if (addr.startsWith('ws://') || addr.startsWith('wss://'))
            return addr;
        addr = addr.replace('localhost', '127.0.0.1');
        if (addr.startsWith('http://'))
            addr = addr.substring(7);
        else if (addr.startsWith('https://'))
            addr = addr.substring(8);
        return `ws://${addr}/devtools/browser/`;
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
    set_argument(arg, value) {
        if (value !== undefined && value !== '') {
            const fullArg = `${arg}=${value}`;
            const prefix = `${arg}=`;
            this.arguments = this.arguments.filter(a => !a.startsWith(prefix));
            this.arguments.push(fullArg);
        }
        else {
            if (!this.arguments.includes(arg)) {
                this.arguments.push(arg);
            }
        }
        return this;
    }
    remove_argument(arg) {
        this.arguments = this.arguments.filter((a) => {
            if (a === arg)
                return false;
            if (a.startsWith(`${arg}=`))
                return false;
            return true;
        });
        return this;
    }
    headless(enabled = true) {
        if (enabled) {
            this.set_argument('--headless', 'new');
            this.is_headless = true;
        }
        else {
            this.remove_argument('--headless');
            this.is_headless = false;
        }
        return this;
    }
    incognito(enabled = true) {
        if (enabled) {
            this.set_argument("--incognito");
            this.set_argument("--inprivate");
        }
        else {
            this.remove_argument("--incognito");
            this.remove_argument("--inprivate");
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
        if (address.startsWith('ws://') || address.startsWith('wss://')) {
            this.address = address;
        }
        else {
            this.address = address.replace('localhost', '127.0.0.1');
            if (this.address.startsWith('http://')) {
                this.address = this.address.substring(7);
            }
            else if (this.address.startsWith('https://')) {
                this.address = this.address.substring(8);
            }
        }
        return this;
    }
    set_user_data_path(path) {
        this.userDataPath = path;
        return this;
    }
    set_user(user) {
        this.user = user;
        this.set_argument('--profile-directory', user);
        return this;
    }
    set_pref(key, value) {
        this.prefs[key] = value;
        const idx = this._prefs_to_del.indexOf(key);
        if (idx >= 0)
            this._prefs_to_del.splice(idx, 1);
        return this;
    }
    remove_pref(key) {
        delete this.prefs[key];
        if (!this._prefs_to_del.includes(key)) {
            this._prefs_to_del.push(key);
        }
        return this;
    }
    clear_flags() {
        this.flags = {};
        this._clear_file_flags = true;
        return this;
    }
    clear_arguments() {
        this.arguments = [];
        return this;
    }
    clear_prefs() {
        this.prefs = {};
        this._prefs_to_del = [];
        return this;
    }
    set_load_mode(mode) {
        this.loadMode = mode;
        return this;
    }
    set_local_port(port) {
        this.address = `127.0.0.1:${port}`;
        return this;
    }
    set_cache_path(path) {
        this.tmpPath = path;
        return this;
    }
    auto_port(scope) {
        this.is_auto_port = true;
        const result = PortFinder_1.PortFinder.getPort(scope);
        this.address = `127.0.0.1:${result.port}`;
        this.tmpPath = result.path;
        return this;
    }
    existing_only(enabled = true) {
        this.is_existing_only = enabled;
        return this;
    }
    ignore_certificate_errors(enabled = true) {
        if (enabled) {
            this.set_argument('--ignore-certificate-errors');
        }
        else {
            this.remove_argument('--ignore-certificate-errors');
        }
        return this;
    }
    set_user_agent(ua) {
        this._ua_set = true;
        this.set_argument('--user-agent', ua);
        return this;
    }
    new_env(enabled = true) {
        this._new_env = enabled;
        return this;
    }
    save(filePath) {
        const om = new OptionsManager_1.OptionsManager(false);
        om.set_item('paths', 'download_path', this.downloadPath);
        om.set_item('paths', 'tmp_path', this.tmpPath || '');
        om.set_item('chromium_options', 'address', this.address);
        om.set_item('chromium_options', 'browser_path', this.browserPath);
        om.set_item('chromium_options', 'arguments', JSON.stringify(this.arguments));
        om.set_item('chromium_options', 'extensions', JSON.stringify(this.extensions));
        om.set_item('chromium_options', 'prefs', JSON.stringify(this.prefs));
        om.set_item('chromium_options', 'flags', JSON.stringify(this.flags));
        om.set_item('chromium_options', 'load_mode', this.loadMode);
        om.set_item('chromium_options', 'user', this.user);
        om.set_item('chromium_options', 'auto_port', String(this.is_auto_port));
        om.set_item('chromium_options', 'system_user_path', String(this.system_user_path));
        om.set_item('chromium_options', 'existing_only', String(this.is_existing_only));
        om.set_item('chromium_options', 'new_env', String(this._new_env));
        om.set_item('timeouts', 'base', String(this.timeouts.base));
        om.set_item('timeouts', 'page_load', String(this.timeouts.pageLoad));
        om.set_item('timeouts', 'script', String(this.timeouts.script));
        return om.save(filePath);
    }
    save_to_default() {
        return this.save('default');
    }
    remove_extensions() {
        this.extensions = [];
        this.arguments = this.arguments.filter(a => !a.startsWith('--disable-extensions-except=') && !a.startsWith('--load-extension='));
        return this;
    }
    get proxy() {
        return this._proxy;
    }
    set_proxy(proxy) {
        this._proxy = proxy;
        this.arguments = this.arguments.filter((a) => !a.startsWith("--proxy-server"));
        if (proxy) {
            this.set_argument(`--proxy-server=${proxy}`);
        }
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
