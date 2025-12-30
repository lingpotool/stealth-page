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
/**
 * Node 版 Chromium，对应 DrissionPage.Chromium。
 * 当前只定义接口和基本结构，具体连接和 CDP 逻辑后续实现。
 */
class Chromium {
    constructor(addrOrOpts) {
        this._browser = null;
        this._cdpSession = null;
        this._setter = null;
        this._waiter = null;
        this._states = null;
        this._options = typeof addrOrOpts === "string" ? new ChromiumOptions_1.ChromiumOptions({ address: addrOrOpts }) : addrOrOpts ?? new ChromiumOptions_1.ChromiumOptions();
    }
    /**
     * 返回用于设置的对象
     */
    get set() {
        if (!this._setter) {
            this._setter = new BrowserSetter_1.BrowserSetter(this);
        }
        return this._setter;
    }
    /**
     * 返回用于等待的对象
     */
    get wait() {
        if (!this._waiter) {
            this._waiter = new BrowserWaiter_1.BrowserWaiter(this);
        }
        return this._waiter;
    }
    /**
     * 返回用于状态检查的对象
     */
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
    async connect() {
        if (this._browser && this._cdpSession) {
            return;
        }
        await ensureBrowserForOptions(this._options);
        const address = this._options.address;
        if (!address) {
            throw new Error("ChromiumOptions.address must be set to a DevTools HTTP address (host:port) or a WebSocket URL.");
        }
        let wsUrl;
        if (address.startsWith("ws://") || address.startsWith("wss://")) {
            wsUrl = address;
        }
        else {
            const base = address.startsWith("http://") || address.startsWith("https://") ? address : `http://${address}`;
            // 优先从 /json/list 获取 page 级 websocket
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
                // ignore and fallback to /json/version
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
        this._cdpSession = cdp;
        this._browser = await Browser_1.Browser.attach(cdp, {
            userAgent: undefined, // 由 Page.init() 中设置
            viewport: undefined,
        });
    }
    async new_page() {
        if (!this._browser) {
            throw new Error("Chromium is not connected yet.");
        }
        return this._browser.newPage();
    }
    async quit() {
        if (this._browser) {
            await this._browser.close();
        }
        if (this._cdpSession) {
            try {
                await this._cdpSession.send("Browser.close");
            }
            catch {
                // Ignore close errors
            }
        }
    }
    async get_tabs() {
        if (!this._cdpSession) {
            return [];
        }
        const { targetInfos } = await this._cdpSession.send("Target.getTargets");
        return targetInfos
            .filter((t) => t.type === "page")
            .map((t) => ({
            id: t.targetId,
            url: t.url,
            title: t.title,
            type: t.type,
        }));
    }
    async activate_tab(tabId) {
        if (!this._cdpSession) {
            return;
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
    async new_tab(url) {
        if (!this._cdpSession) {
            throw new Error("Chromium is not connected yet.");
        }
        const { targetId } = await this._cdpSession.send("Target.createTarget", {
            url: url || "about:blank",
        });
        return targetId;
    }
    get is_connected() {
        return this._cdpSession !== null && this._browser !== null;
    }
    /**
     * 根据 tab id 获取 Page 对象
     */
    async get_page_by_id(tabId) {
        if (!this._cdpSession) {
            throw new Error("Chromium is not connected yet.");
        }
        // 附加到指定的 target
        const { sessionId } = await this._cdpSession.send("Target.attachToTarget", {
            targetId: tabId,
            flatten: true,
        });
        // 创建一个新的 CDP session 用于该 tab
        if (!this._cdpSession.createChildSession) {
            throw new Error("CDP session does not support child sessions.");
        }
        const tabCdp = this._cdpSession.createChildSession(sessionId);
        // 创建 Page 对象
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
            browser: result.browser,
            protocol: result.protocolVersion,
            userAgent: result.userAgent,
        };
    }
    /**
     * 返回标签页数量
     */
    async tabs_count() {
        const tabs = await this.get_tabs();
        return tabs.length;
    }
    /**
     * 返回所有标签页 id 列表
     */
    async tab_ids() {
        const tabs = await this.get_tabs();
        return tabs.map(t => t.id);
    }
    /**
     * 返回最新的标签页 id
     */
    async latest_tab() {
        const tabs = await this.get_tabs();
        return tabs.length > 0 ? tabs[tabs.length - 1].id : null;
    }
    /**
     * 获取所有域名的 cookies
     */
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
    /**
     * 清除缓存
     */
    async clear_cache(options = {}) {
        if (!this._cdpSession)
            return;
        const { cache = true, cookies = true } = options;
        if (cache) {
            await this._cdpSession.send("Network.clearBrowserCache");
        }
        if (cookies) {
            await this._cdpSession.send("Network.clearBrowserCookies");
        }
    }
    /**
     * 关闭多个标签页
     */
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
    /**
     * 断开重连
     */
    async reconnect() {
        if (this._cdpSession?.close) {
            this._cdpSession.close();
        }
        this._cdpSession = null;
        this._browser = null;
        await this.connect();
    }
    /**
     * 获取浏览器进程 ID
     */
    async process_id() {
        if (!this._cdpSession)
            return null;
        try {
            const { processId } = await this._cdpSession.send("SystemInfo.getProcessInfo");
            return processId;
        }
        catch {
            return null;
        }
    }
    /**
     * 获取用户数据目录路径
     */
    get user_data_path() {
        return this._options.userDataPath;
    }
    /**
     * 获取下载路径
     */
    get download_path() {
        return this._options.downloadPath;
    }
}
exports.Chromium = Chromium;
// 默认的反检测启动参数（模仿 DrissionPage）
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
    // 关键：不要添加 --enable-automation
    // 关键：不要添加 --disable-blink-features=AutomationControlled（这本身就是检测点）
];
async function ensureBrowserForOptions(options) {
    let address = options.address;
    // 如果没有显式地址，默认使用本地 127.0.0.1:9222
    if (!address) {
        address = "127.0.0.1:9222";
        options.address = address;
    }
    // 规范化地址，取 host:port
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
    // 远程地址或非本机地址，不负责启动，只尝试连接
    const isLocalHost = host === "127.0.0.1" || host === "localhost";
    if (!isLocalHost) {
        return;
    }
    const base = `http://${host}:${port}`;
    const versionUrl = base.endsWith("/") ? `${base}json/version` : `${base}/json/version`;
    // 如果已经有浏览器在该端口上，直接复用
    try {
        await fetchJson(versionUrl);
        return;
    }
    catch {
        // 继续尝试启动
    }
    const exe = options.browserPath && options.browserPath.trim().length > 0 ? options.browserPath : "chrome";
    // 处理 user data 目录：优先使用 options.userDataPath，否则根据 tmpPath 和端口生成
    let userDataDir = options.userDataPath;
    if (!userDataDir) {
        const baseTmp = options.tmpPath ?? path.join(os.tmpdir(), "stealth-page");
        userDataDir = path.join(baseTmp, "userData", String(port));
        options.userDataPath = userDataDir;
    }
    if (!fs.existsSync(userDataDir)) {
        fs.mkdirSync(userDataDir, { recursive: true });
    }
    // 合并用户参数和反检测参数
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
        // 静默错误，后续由真正的连接过程给出更明确的错误信息
    });
    child.unref();
    // 给浏览器一点时间启动，真正的连接与错误由 connect() 中的逻辑处理
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
