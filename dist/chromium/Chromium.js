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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Chromium = void 0;
const http = __importStar(require("http"));
const https = __importStar(require("https"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const child_process_1 = require("child_process");
const ChromiumOptions_1 = require("../config/ChromiumOptions");
const Browser_1 = require("../core/Browser");
const Page_1 = require("../core/Page");
const WebSocketCDPSession_1 = require("../core/WebSocketCDPSession");
const BrowserSetter_1 = require("../units/BrowserSetter");
const BrowserWaiter_1 = require("../units/BrowserWaiter");
const BrowserStates_1 = require("../units/BrowserStates");
const tools_1 = require("../core/tools");
const Settings_1 = require("../core/Settings");
class Chromium {
    constructor(addrOrOpts) {
        this._browser = null;
        this._cdpSession = null;
        this._setter = null;
        this._waiter = null;
        this._states = null;
        this._disconnect_flag = false;
        this._is_headless = false;
        this._process_id = null;
        this._options = typeof addrOrOpts === "string" ? new ChromiumOptions_1.ChromiumOptions({ address: addrOrOpts }) : addrOrOpts ?? new ChromiumOptions_1.ChromiumOptions();
        const address = this._options.address || '127.0.0.1:9222';
        const existing = Chromium._BROWSERS.get(address);
        if (existing) {
            return existing;
        }
        Chromium._BROWSERS.set(address, this);
    }
    static get_instances() {
        return Chromium._BROWSERS;
    }
    get set() {
        if (!this._setter) {
            this._setter = new BrowserSetter_1.BrowserSetter(this);
        }
        return this._setter;
    }
    get wait() {
        if (!this._waiter) {
            this._waiter = new BrowserWaiter_1.BrowserWaiter(this);
        }
        return this._waiter;
    }
    get states() {
        if (!this._states) {
            this._states = new BrowserStates_1.BrowserStates(this);
        }
        return this._states;
    }
    get options() {
        return this._options;
    }
    get browser() {
        if (!this._browser) {
            throw new Error("Chromium browser is not initialized yet.");
        }
        return this._browser;
    }
    get cdpSession() {
        if (!this._cdpSession) {
            throw new Error("Chromium CDP session is not initialized yet.");
        }
        return this._cdpSession;
    }
    get none_ele_return_value() {
        return Settings_1.Settings.none_ele_return_value;
    }
    set none_ele_return_value(value) {
        Settings_1.Settings.none_ele_return_value = value;
    }
    get none_ele_value() {
        return Settings_1.Settings.none_ele_value;
    }
    set none_ele_value(value) {
        Settings_1.Settings.none_ele_value = value;
    }
    get auto_handle_alert() {
        return Settings_1.Settings.auto_handle_alert;
    }
    set auto_handle_alert(value) {
        Settings_1.Settings.auto_handle_alert = value;
    }
    get _disconnect_flag_value() {
        return this._disconnect_flag;
    }
    get is_headless() {
        return this._is_headless;
    }
    _on_disconnect() {
        this._disconnect_flag = true;
        if (this._browser) {
            this._browser._drivers.clear();
            this._browser._all_drivers.clear();
            this._browser._frames.clear();
            this._browser._relation.clear();
        }
    }
    async _run_cdp(cmd, params, _ignore = []) {
        if (!this._cdpSession) {
            throw new Error("Chromium is not connected yet.");
        }
        try {
            return await this._cdpSession.send(cmd, params);
        }
        catch (e) {
            if (_ignore.length > 0) {
                try {
                    (0, tools_1.raise_error)(e, cmd, params);
                }
                catch (raised) {
                    for (const ignoreClass of _ignore) {
                        if (raised instanceof ignoreClass) {
                            return undefined;
                        }
                    }
                    throw raised;
                }
            }
            (0, tools_1.raise_error)(e, cmd, params);
        }
    }
    async connect() {
        if (this._browser && this._cdpSession) {
            return;
        }
        this._disconnect_flag = false;
        await ensureBrowserForOptions(this._options);
        const address = this._options.address;
        if (!address) {
            throw new Error("ChromiumOptions.address must be set to a DevTools HTTP address (host:port) or a WebSocket URL.");
        }
        for (const arg of this._options.arguments) {
            if (arg.includes('--headless')) {
                this._is_headless = true;
                break;
            }
        }
        let wsUrl;
        if (address.startsWith("ws://") || address.startsWith("wss://")) {
            wsUrl = address;
        }
        else {
            const base = address.startsWith("http://") || address.startsWith("https://") ? address : `http://${address}`;
            const listUrl = base.endsWith("/") ? `${base}json/list` : `${base}/json/list`;
            let pageWs = null;
            try {
                const arr = (await fetchJson(listUrl));
                if (Array.isArray(arr)) {
                    const page = arr.find((i) => i.type === "page" && i.webSocketDebuggerUrl) || arr[0];
                    if (page && page.webSocketDebuggerUrl) {
                        pageWs = page.webSocketDebuggerUrl;
                    }
                }
            }
            catch {
            }
            if (pageWs) {
                wsUrl = pageWs;
            }
            else {
                const verUrl = base.endsWith("/") ? `${base}json/version` : `${base}/json/version`;
                const data = (await fetchJson(verUrl));
                if (!data.webSocketDebuggerUrl) {
                    throw new Error("DevTools version response missing webSocketDebuggerUrl.");
                }
                wsUrl = data.webSocketDebuggerUrl;
            }
        }
        const cdp = await WebSocketCDPSession_1.WebSocketCDPSession.connect(wsUrl);
        cdp.owner = this;
        this._cdpSession = cdp;
        this._browser = await Browser_1.Browser.attach(cdp, {
            userAgent: undefined,
            viewport: undefined,
        });
    }
    async new_page() {
        if (!this._browser) {
            throw new Error("Chromium is not connected yet.");
        }
        return this._browser.newPage();
    }
    async quit(options) {
        const { timeout = 5, force = true, delData = false } = options || {};
        const deadline = Date.now() + timeout * 1000;
        if (this._browser) {
            try {
                await Promise.race([
                    this._browser.close(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), deadline - Date.now())),
                ]);
            }
            catch { }
        }
        if (this._cdpSession) {
            try {
                await this._cdpSession.send("Browser.close");
            }
            catch { }
        }
        if (force && this._process_id) {
            try {
                process.kill(this._process_id);
            }
            catch { }
        }
        if (delData && this._options.userDataPath) {
            try {
                const fs = await Promise.resolve().then(() => __importStar(require("fs")));
                fs.rmSync(this._options.userDataPath, { recursive: true, force: true });
            }
            catch { }
        }
        const address = this._options.address || '127.0.0.1:9222';
        Chromium._BROWSERS.delete(address);
        this._cdpSession = null;
        this._browser = null;
    }
    async get_tab(idOrNum, title, url, tabType) {
        if (!this._cdpSession)
            return null;
        const tabs = await this.get_tabs(title, url, tabType);
        if (idOrNum !== undefined) {
            if (typeof idOrNum === 'number') {
                const idx = idOrNum > 0 ? idOrNum - 1 : tabs.length + idOrNum;
                return tabs[idx] ?? null;
            }
            return tabs.find(t => t.id === idOrNum) ?? null;
        }
        return tabs[0] ?? null;
    }
    async get_tabs(title, url, tabType) {
        if (!this._cdpSession) {
            return [];
        }
        const { targetInfos } = await this._cdpSession.send("Target.getTargets");
        const typeFilter = tabType
            ? (Array.isArray(tabType) ? tabType : [tabType])
            : ['page'];
        let result = targetInfos
            .filter((t) => typeFilter.includes(t.type))
            .map((t) => ({
            id: t.targetId,
            url: t.url,
            title: t.title,
            type: t.type,
        }));
        if (title) {
            result = result.filter(t => t.title.includes(title));
        }
        if (url) {
            result = result.filter(t => t.url.includes(url));
        }
        return result;
    }
    async activate_tab(tabIdOrIndex) {
        if (!this._cdpSession) {
            return;
        }
        let tabId;
        if (typeof tabIdOrIndex === 'number') {
            const tabs = await this.get_tabs();
            const idx = tabIdOrIndex > 0 ? tabIdOrIndex - 1 : tabs.length + tabIdOrIndex;
            const tab = tabs[idx];
            if (!tab)
                return;
            tabId = tab.id;
        }
        else {
            tabId = tabIdOrIndex;
        }
        await this._cdpSession.send("Target.activateTarget", {
            targetId: tabId,
        });
    }
    async close_tab(tabId) {
        if (!this._cdpSession) {
            return;
        }
        await this._cdpSession.send("Target.closeTarget", {
            targetId: tabId,
        });
    }
    async new_tab(url, options) {
        if (!this._cdpSession) {
            throw new Error("Chromium is not connected yet.");
        }
        const { newWindow = false, background = false, newContext = false } = options || {};
        let browserContextId;
        if (newContext) {
            try {
                const result = await this._cdpSession.send("Target.createBrowserContext", {
                    disposeOnDetach: true,
                });
                browserContextId = result.browserContextId;
            }
            catch { }
        }
        const params = { url: url || "about:blank" };
        if (newWindow)
            params.newWindow = true;
        if (background)
            params.background = true;
        if (browserContextId)
            params.browserContextId = browserContextId;
        try {
            const { targetId } = await this._cdpSession.send("Target.createTarget", params);
            return targetId;
        }
        catch {
            return await this._new_tab_by_js(url, newWindow);
        }
    }
    async _new_tab_by_js(url, newWindow) {
        if (!this._cdpSession) {
            throw new Error("Chromium is not connected yet.");
        }
        const tabs = await this.get_tabs();
        if (tabs.length === 0) {
            throw new Error("No existing tabs to open new tab from.");
        }
        const tabId = tabs[0].id;
        const { sessionId } = await this._cdpSession.send("Target.attachToTarget", { targetId: tabId, flatten: true });
        const childSession = this._cdpSession.createChildSession
            ? this._cdpSession.createChildSession(sessionId)
            : this._cdpSession;
        const windowName = newWindow ? `win_${Date.now()}` : '_blank';
        await childSession.send("Runtime.evaluate", {
            expression: `window.open('${url || 'about:blank'}', '${windowName}')`,
        });
        await new Promise(resolve => setTimeout(resolve, 500));
        const newTabs = await this.get_tabs();
        for (const tab of newTabs) {
            if (!tabs.some(t => t.id === tab.id)) {
                return tab.id;
            }
        }
        throw new Error("Failed to create new tab via JS.");
    }
    get is_connected() {
        return this._cdpSession !== null && this._browser !== null && !this._disconnect_flag;
    }
    async get_page_by_id(tabId) {
        if (!this._cdpSession) {
            throw new Error("Chromium is not connected yet.");
        }
        const { sessionId } = await this._cdpSession.send("Target.attachToTarget", {
            targetId: tabId,
            flatten: true,
        });
        if (!this._cdpSession.createChildSession) {
            throw new Error("CDP session does not support child sessions.");
        }
        const tabCdp = this._cdpSession.createChildSession(sessionId);
        const page = new Page_1.Page(tabCdp);
        await page.init();
        return page;
    }
    async get_version() {
        if (!this._cdpSession) {
            throw new Error("Chromium is not connected yet.");
        }
        const result = await this._cdpSession.send("Browser.getVersion");
        return {
            browser: result.product,
            protocol: result.protocolVersion,
            userAgent: result.userAgent,
        };
    }
    async version() {
        const info = await this.get_version();
        return info.browser;
    }
    async tabs_count() {
        const tabs = await this.get_tabs();
        return tabs.length;
    }
    async tab_ids() {
        const tabs = await this.get_tabs();
        return tabs.map(t => t.id);
    }
    async latest_tab() {
        const tabs = await this.get_tabs();
        return tabs.length > 0 ? tabs[tabs.length - 1].id : null;
    }
    async cookies(allInfo = false) {
        if (!this._cdpSession) {
            return [];
        }
        const { cookies } = await this._cdpSession.send("Storage.getCookies");
        if (!allInfo) {
            return cookies.map(c => ({
                name: c.name,
                value: c.value,
                domain: c.domain,
            }));
        }
        return cookies;
    }
    async clear_cache(options = {}) {
        if (!this._cdpSession)
            return;
        const { cache = true, cookies = true } = options;
        if (cookies) {
            await this._cdpSession.send("Storage.clearCookies");
        }
        if (cache) {
            await this._cdpSession.send("Network.clearBrowserCache");
        }
    }
    async close_tabs(tabIds, others = false) {
        const ids = Array.isArray(tabIds) ? tabIds : [tabIds];
        const allTabs = await this.get_tabs();
        if (others) {
            for (const tab of allTabs) {
                if (!ids.includes(tab.id)) {
                    await this.close_tab(tab.id);
                }
            }
        }
        else {
            for (const id of ids) {
                await this.close_tab(id);
            }
        }
    }
    async reconnect() {
        if (this._cdpSession?.close) {
            this._cdpSession.close();
        }
        this._cdpSession = null;
        this._browser = null;
        this._disconnect_flag = false;
        await this.connect();
    }
    async process_id() {
        if (!this._cdpSession)
            return null;
        try {
            const result = await this._cdpSession.send("SystemInfo.getProcessInfo");
            const processInfo = result?.processInfo;
            if (Array.isArray(processInfo)) {
                const browserProc = processInfo.find((p) => p.type === 'browser');
                if (browserProc && browserProc.id) {
                    this._process_id = browserProc.id;
                    return this._process_id;
                }
            }
            return this._process_id;
        }
        catch {
            return this._process_id;
        }
    }
    get user_data_path() {
        return this._options.userDataPath;
    }
    get download_path() {
        return this._options.downloadPath;
    }
}
exports.Chromium = Chromium;
Chromium._BROWSERS = new Map();
const STEALTH_ARGS = [
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    "--disable-background-timer-throttling",
    "--disable-backgrounding-occluded-windows",
    "--disable-breakpad",
    "--disable-component-extensions-with-background-pages",
    "--disable-component-update",
    "--disable-default-apps",
    "--disable-dev-shm-usage",
    "--disable-extensions",
    "--disable-features=TranslateUI",
    "--disable-hang-monitor",
    "--disable-ipc-flooding-protection",
    "--disable-popup-blocking",
    "--disable-prompt-on-repost",
    "--disable-renderer-backgrounding",
    "--disable-sync",
    "--enable-features=NetworkService,NetworkServiceInProcess",
    "--force-color-profile=srgb",
    "--metrics-recording-only",
    "--no-service-autorun",
    "--password-store=basic",
    "--use-mock-keychain",
];
async function ensureBrowserForOptions(options) {
    let address = options.address;
    if (!address) {
        address = "127.0.0.1:9222";
        options.address = address;
    }
    let raw = address;
    if (raw.startsWith("http://")) {
        raw = raw.substring("http://".length);
    }
    else if (raw.startsWith("https://")) {
        raw = raw.substring("https://".length);
    }
    if (raw.startsWith("ws://")) {
        raw = raw.substring("ws://".length);
    }
    else if (raw.startsWith("wss://")) {
        raw = raw.substring("wss://".length);
    }
    const [host, portStr] = raw.split(":");
    const port = Number(portStr || "9222");
    if (!host || Number.isNaN(port)) {
        throw new Error(`Invalid DevTools address: ${address}`);
    }
    const isLocalHost = host === "127.0.0.1" || host === "localhost";
    if (!isLocalHost) {
        return;
    }
    const base = `http://${host}:${port}`;
    const versionUrl = base.endsWith("/") ? `${base}json/version` : `${base}/json/version`;
    try {
        await fetchJson(versionUrl);
        return;
    }
    catch {
    }
    const exe = options.browserPath && options.browserPath.trim().length > 0 ? options.browserPath : "chrome";
    let userDataDir = options.userDataPath;
    if (!userDataDir) {
        const baseTmp = options.tmpPath ?? path.join(os.tmpdir(), "stealth-page");
        userDataDir = path.join(baseTmp, "userData", String(port));
        options.userDataPath = userDataDir;
    }
    if (!fs.existsSync(userDataDir)) {
        fs.mkdirSync(userDataDir, { recursive: true });
    }
    const args = [...STEALTH_ARGS, ...(options.arguments ?? [])];
    if (!args.some((a) => a.startsWith("--user-data-dir"))) {
        args.push(`--user-data-dir=${userDataDir}`);
    }
    args.push(`--remote-debugging-port=${port}`);
    const child = (0, child_process_1.spawn)(exe, args, {
        stdio: "ignore",
        detached: false,
    });
    child.on("error", () => {
    });
    child.unref();
    await new Promise((resolve) => setTimeout(resolve, 1500));
}
async function fetchJson(url) {
    return new Promise((resolve, reject) => {
        const isHttps = url.startsWith("https://");
        const client = isHttps ? https : http;
        const req = client.get(url, (res) => {
            const { statusCode } = res;
            if (!statusCode || statusCode < 200 || statusCode >= 300) {
                res.resume();
                reject(new Error(`Request failed with status code ${statusCode}`));
                return;
            }
            const chunks = [];
            res.on("data", (chunk) => chunks.push(chunk));
            res.on("end", () => {
                try {
                    const body = Buffer.concat(chunks).toString("utf8");
                    const json = JSON.parse(body);
                    resolve(json);
                }
                catch (err) {
                    reject(err);
                }
            });
        });
        req.on("error", (err) => reject(err));
    });
}
