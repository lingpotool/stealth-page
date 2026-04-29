"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connect_browser = connect_browser;
exports.get_launch_args = get_launch_args;
exports.set_prefs = set_prefs;
exports.set_flags = set_flags;
exports.test_connect = test_connect;
exports.get_chrome_path = get_chrome_path;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const child_process = __importStar(require("child_process"));
const http_1 = __importDefault(require("http"));
const Settings_1 = require("./Settings");
const errors_1 = require("../errors");
const OptionsManager_1 = require("./OptionsManager");
async function connect_browser(option) {
    let address = (option.address || '127.0.0.1:9222').replace('localhost', '127.0.0.1');
    if (address.startsWith('http')) {
        address = address.replace(/^https?:\/\//, '');
    }
    const browserPath = option.browserPath;
    const [ip, portStr] = address.split(':');
    const port = parseInt(portStr, 10);
    const using = _port_is_using(ip, port);
    if (ip !== '127.0.0.1' || using) {
        if (await test_connect(ip, port)) {
            return true;
        }
        if (ip !== '127.0.0.1') {
            throw new errors_1.BrowserConnectError(undefined, undefined, { ADDRESS: address });
        }
        if (using) {
            throw new errors_1.BrowserConnectError(undefined, undefined, { ADDRESS: address });
        }
    }
    const { args, userPath } = get_launch_args(option);
    set_prefs(option);
    set_flags(option);
    try {
        _run_browser(port, browserPath || 'chrome', args);
    }
    catch (e) {
        if (e.code === 'ENOENT' || e.message?.includes('not found') || e.message?.includes('spawn')) {
            const foundPath = get_chrome_path();
            if (!foundPath) {
                throw new Error('Cannot find browser executable path. Please configure it manually.');
            }
            _run_browser(port, foundPath, args);
        }
        else {
            throw e;
        }
    }
    if (!await test_connect(ip, port)) {
        throw new errors_1.BrowserConnectError(undefined, undefined, { ADDRESS: address });
    }
    return false;
}
function get_launch_args(opt) {
    const result = new Set();
    let userPath = false;
    for (const i of opt.arguments) {
        if (i.startsWith('--disable-extensions-except=') ||
            i.startsWith('--load-extension=') ||
            i.startsWith('--remote-debugging-port=')) {
            continue;
        }
        else if (i.startsWith('--user-data-dir')) {
            const p = path.resolve(i.substring(16));
            userPath = `--user-data-dir=${p}`;
            result.add(userPath);
            continue;
        }
        result.add(i);
    }
    if (!userPath && opt.userDataPath) {
        const p = path.resolve(opt.userDataPath);
        userPath = `--user-data-dir=${p}`;
        result.add(userPath);
    }
    else if (!userPath) {
        const port = opt.address ? opt.address.split(':').pop() : '0';
        const base = opt.tmpPath || path.join(os.tmpdir(), 'DrissionPage');
        const p = path.join(base, 'userData', port || '0');
        fs.mkdirSync(p, { recursive: true });
        userPath = `--user-data-dir=${p}`;
        opt.set_user_data_path(p);
        result.add(userPath);
    }
    const argsList = Array.from(result);
    const ext = opt.extensions.map(e => path.resolve(e));
    const exts = [];
    if (ext.length > 0) {
        for (const e of ext) {
            if (!fs.existsSync(e)) {
                throw new Error(`Extension path does not exist: ${e}`);
            }
            const stat = fs.statSync(e);
            if (stat.isFile()) {
                throw new Error(`Plugin needs to be decompressed into a folder: ${e}`);
            }
            exts.push(e);
        }
        const extStr = [...new Set(exts)].join(',');
        argsList.push(`--disable-extensions-except=${extStr}`);
        argsList.push(`--load-extension=${extStr}`);
    }
    return { args: argsList, userPath };
}
function set_prefs(opt) {
    const prefs = opt.preferences || opt.prefs;
    const prefsToDel = opt._prefs_to_del;
    if (!opt.userDataPath || (!prefs && !prefsToDel))
        return;
    let user = 'Default';
    for (const arg of opt.arguments) {
        if (arg.startsWith('--profile-directory')) {
            user = arg.split('=').pop().trim();
            break;
        }
    }
    const prefsFile = path.join(opt.userDataPath, user, 'Preferences');
    if (!fs.existsSync(prefsFile)) {
        fs.mkdirSync(path.dirname(prefsFile), { recursive: true });
        fs.writeFileSync(prefsFile, '{}', 'utf-8');
    }
    let prefsDict = {};
    try {
        prefsDict = JSON.parse(fs.readFileSync(prefsFile, 'utf-8'));
    }
    catch {
        prefsDict = {};
    }
    if (prefs && typeof prefs === 'object') {
        for (const [prefKey, value] of Object.entries(prefs)) {
            const parts = prefKey.split('.');
            _make_leave_in_dict(prefsDict, parts, 0, parts.length);
            _set_value_to_dict(prefsDict, parts, value);
        }
    }
    if (prefsToDel && Array.isArray(prefsToDel)) {
        for (const pref of prefsToDel) {
            _remove_arg_from_dict(prefsDict, pref);
        }
    }
    fs.writeFileSync(prefsFile, JSON.stringify(prefsDict, null, 2), 'utf-8');
}
function set_flags(opt) {
    const clearFileFlags = opt.clear_file_flags;
    if (!opt.userDataPath || (!clearFileFlags && !opt.flags))
        return;
    const stateFile = path.join(opt.userDataPath, 'Local State');
    if (!fs.existsSync(stateFile)) {
        fs.mkdirSync(path.dirname(stateFile), { recursive: true });
        fs.writeFileSync(stateFile, '{}', 'utf-8');
    }
    let statesDict = {};
    try {
        statesDict = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
    }
    catch {
        statesDict = {};
    }
    if (!statesDict.browser)
        statesDict.browser = {};
    if (!statesDict.browser.enabled_labs_experiments)
        statesDict.browser.enabled_labs_experiments = [];
    const flagsList = clearFileFlags ? [] : statesDict.browser.enabled_labs_experiments;
    const flagsDict = {};
    for (const i of flagsList) {
        const f = String(i).split('@', 2);
        flagsDict[f[0]] = f.length === 1 ? null : f[1];
    }
    if (opt.flags && typeof opt.flags === 'object') {
        for (const [k, v] of Object.entries(opt.flags)) {
            flagsDict[k] = v;
        }
    }
    statesDict.browser.enabled_labs_experiments = Object.entries(flagsDict).map(([k, v]) => v != null ? `${k}@${v}` : k);
    fs.writeFileSync(stateFile, JSON.stringify(statesDict, null, 2), 'utf-8');
}
async function test_connect(ip, port) {
    const endTime = Date.now() + Settings_1.Settings.browser_connect_timeout * 1000;
    while (Date.now() < endTime) {
        try {
            const result = await _httpGet(`http://${ip}:${port}/json`);
            const tabs = JSON.parse(result);
            for (const tab of tabs) {
                if (tab.type === 'page' || tab.type === 'webview') {
                    return true;
                }
            }
        }
        catch {
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }
    return false;
}
function _run_browser(port, browserPath, args) {
    let p = browserPath;
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
        p = path.join(p, 'chrome');
    }
    const arguments_ = [p, `--remote-debugging-port=${port}`, ...args];
    try {
        return child_process.spawn(arguments_[0], arguments_.slice(1), {
            stdio: 'ignore',
            detached: true,
        });
    }
    catch (e) {
        throw new Error(`Browser not found at path: ${p}`);
    }
}
function get_chrome_path(iniPath) {
    if (iniPath && fs.existsSync(iniPath)) {
        try {
            const om = new OptionsManager_1.OptionsManager(iniPath);
            const p = om.get_value('chromium_options', 'browser_path');
            if (p && p !== 'chrome' && fs.existsSync(p) && fs.statSync(p).isFile()) {
                return p;
            }
        }
        catch { }
    }
    const whichResult = _which('chrome') || _which('chromium') || _which('google-chrome') || _which('google-chrome-stable');
    if (whichResult)
        return whichResult;
    const platform = os.platform();
    if (platform === 'darwin') {
        const p = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
        return fs.existsSync(p) ? p : null;
    }
    else if (platform === 'linux') {
        const paths = ['/usr/bin/google-chrome', '/opt/google/chrome/google-chrome', '/usr/lib/chromium-browser/chromium-browser'];
        for (const p of paths) {
            if (fs.existsSync(p))
                return p;
        }
        return null;
    }
    else if (platform !== 'win32') {
        return null;
    }
    if (platform === 'win32') {
        const regPaths = _readRegistryChromePath();
        if (regPaths)
            return regPaths;
    }
    const envPath = process.env.PATH || '';
    for (const p of envPath.split(';')) {
        const chromePath = path.join(p, 'chrome.exe');
        try {
            if (fs.existsSync(chromePath))
                return chromePath;
        }
        catch { }
    }
    return null;
}
function _which(cmd) {
    try {
        const result = child_process.execSync(process.platform === 'win32' ? `where ${cmd} 2>nul` : `which ${cmd} 2>/dev/null`, { encoding: 'utf-8', timeout: 5000 }).trim();
        return result || null;
    }
    catch {
        return null;
    }
}
function _readRegistryChromePath() {
    try {
        const result = child_process.execSync('reg query "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe" /ve 2>nul', { encoding: 'utf-8', timeout: 5000 }).trim();
        const match = result.match(/REG_SZ\s+(.+)/);
        if (match && match[1] && fs.existsSync(match[1].trim())) {
            return match[1].trim();
        }
    }
    catch { }
    try {
        const result = child_process.execSync('reg query "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe" /ve 2>nul', { encoding: 'utf-8', timeout: 5000 }).trim();
        const match = result.match(/REG_SZ\s+(.+)/);
        if (match && match[1] && fs.existsSync(match[1].trim())) {
            return match[1].trim();
        }
    }
    catch { }
    return null;
}
function _port_is_using(ip, port) {
    const result = _which('netstat');
    if (!result)
        return false;
    try {
        const output = child_process.execSync(`netstat -nao | findstr :${port}`, { encoding: 'utf-8', timeout: 5000 });
        return output.includes('LISTENING');
    }
    catch {
        return false;
    }
}
function _httpGet(url) {
    return new Promise((resolve, reject) => {
        http_1.default.get(url, { timeout: 10000 }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject)
            .on('timeout', function () {
            this.destroy();
            reject(new Error('timeout'));
        });
    });
}
function _make_leave_in_dict(target, src, num, end) {
    if (num === end)
        return;
    if (!(src[num] in target)) {
        target[src[num]] = {};
    }
    _make_leave_in_dict(target[src[num]], src, num + 1, end);
}
function _set_value_to_dict(target, src, value) {
    let current = target;
    for (let i = 0; i < src.length - 1; i++) {
        current = current[src[i]];
    }
    current[src[src.length - 1]] = value;
}
function _remove_arg_from_dict(target, arg) {
    const parts = arg.split('.');
    let current = target;
    for (let i = 0; i < parts.length - 1; i++) {
        if (!(parts[i] in current))
            return;
        current = current[parts[i]];
    }
    const lastKey = parts[parts.length - 1];
    if (lastKey in current) {
        delete current[lastKey];
    }
}
