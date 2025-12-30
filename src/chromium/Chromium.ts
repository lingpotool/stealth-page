import * as http from "http";
import * as https from "https";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { spawn } from "child_process";
import { ChromiumOptions } from "../config/ChromiumOptions";
import { CDPSession } from "../core/CDPSession";
import { Browser } from "../core/Browser";
import { Page } from "../core/Page";
import { WebSocketCDPSession } from "../core/WebSocketCDPSession";
import { BrowserSetter } from "../units/BrowserSetter";
import { BrowserWaiter } from "../units/BrowserWaiter";
import { BrowserStates } from "../units/BrowserStates";

export interface ChromiumInitOptions {
  addrOrOpts?: string | ChromiumOptions;
}

/**
 * Node 版 Chromium，对应 DrissionPage.Chromium。
 * 当前只定义接口和基本结构，具体连接和 CDP 逻辑后续实现。
 */
export class Chromium {
  private _options: ChromiumOptions;
  private _browser: Browser | null = null;
  private _cdpSession: CDPSession | null = null;
  private _setter: BrowserSetter | null = null;
  private _waiter: BrowserWaiter | null = null;
  private _states: BrowserStates | null = null;

  constructor(addrOrOpts?: string | ChromiumOptions) {
    this._options = typeof addrOrOpts === "string" ? new ChromiumOptions({ address: addrOrOpts }) : addrOrOpts ?? new ChromiumOptions();
  }

  /**
   * 返回用于设置的对象
   */
  get set(): BrowserSetter {
    if (!this._setter) {
      this._setter = new BrowserSetter(this);
    }
    return this._setter;
  }

  /**
   * 返回用于等待的对象
   */
  get wait(): BrowserWaiter {
    if (!this._waiter) {
      this._waiter = new BrowserWaiter(this);
    }
    return this._waiter;
  }

  /**
   * 返回用于状态检查的对象
   */
  get states(): BrowserStates {
    if (!this._states) {
      this._states = new BrowserStates(this);
    }
    return this._states;
  }

  get options(): ChromiumOptions {
    return this._options;
  }

  get browser(): Browser {
    if (!this._browser) {
      throw new Error("Chromium browser is not initialized yet.");
    }
    return this._browser;
  }

  get cdpSession(): CDPSession {
    if (!this._cdpSession) {
      throw new Error("Chromium CDP session is not initialized yet.");
    }
    return this._cdpSession;
  }

  async connect(): Promise<void> {
    if (this._browser && this._cdpSession) {
      return;
    }

    await ensureBrowserForOptions(this._options);

    const address = this._options.address;
    if (!address) {
      throw new Error(
        "ChromiumOptions.address must be set to a DevTools HTTP address (host:port) or a WebSocket URL.",
      );
    }

    let wsUrl: string;

    if (address.startsWith("ws://") || address.startsWith("wss://")) {
      wsUrl = address;
    } else {
      const base = address.startsWith("http://") || address.startsWith("https://") ? address : `http://${address}`;
      // 优先从 /json/list 获取 page 级 websocket
      const listUrl = base.endsWith("/") ? `${base}json/list` : `${base}/json/list`;
      let pageWs: string | null = null;

      try {
        const arr = (await fetchJson(listUrl)) as any[];
        if (Array.isArray(arr)) {
          const page = arr.find((i) => i.type === "page" && i.webSocketDebuggerUrl) || arr[0];
          if (page && page.webSocketDebuggerUrl) {
            pageWs = page.webSocketDebuggerUrl as string;
          }
        }
      } catch {
        // ignore and fallback to /json/version
      }

      if (pageWs) {
        wsUrl = pageWs;
      } else {
        const verUrl = base.endsWith("/") ? `${base}json/version` : `${base}/json/version`;
        const data = (await fetchJson(verUrl)) as any;
        if (!data.webSocketDebuggerUrl) {
          throw new Error("DevTools version response missing webSocketDebuggerUrl.");
        }
        wsUrl = data.webSocketDebuggerUrl as string;
      }
    }

    const cdp = await WebSocketCDPSession.connect(wsUrl);
    this._cdpSession = cdp;
    this._browser = await Browser.attach(cdp, {
      userAgent: undefined, // 由 Page.init() 中设置
      viewport: undefined,
    });
  }

  async new_page(): Promise<Page> {
    if (!this._browser) {
      throw new Error("Chromium is not connected yet.");
    }
    return this._browser.newPage();
  }

  async quit(): Promise<void> {
    if (this._browser) {
      await this._browser.close();
    }
    if (this._cdpSession) {
      try {
        await this._cdpSession.send("Browser.close");
      } catch {
        // Ignore close errors
      }
    }
  }

  async get_tabs(): Promise<Array<{ id: string; url: string; title: string; type: string }>> {
    if (!this._cdpSession) {
      return [];
    }
    const { targetInfos } = await this._cdpSession.send<{
      targetInfos: Array<{ targetId: string; url: string; title: string; type: string }>;
    }>("Target.getTargets");
    return targetInfos
      .filter((t) => t.type === "page")
      .map((t) => ({
        id: t.targetId,
        url: t.url,
        title: t.title,
        type: t.type,
      }));
  }

  async activate_tab(tabId: string): Promise<void> {
    if (!this._cdpSession) {
      return;
    }
    await this._cdpSession.send("Target.activateTarget", {
      targetId: tabId,
    });
  }

  async close_tab(tabId: string): Promise<void> {
    if (!this._cdpSession) {
      return;
    }
    await this._cdpSession.send("Target.closeTarget", {
      targetId: tabId,
    });
  }

  async new_tab(url?: string): Promise<string> {
    if (!this._cdpSession) {
      throw new Error("Chromium is not connected yet.");
    }
    const { targetId } = await this._cdpSession.send<{ targetId: string }>("Target.createTarget", {
      url: url || "about:blank",
    });
    return targetId;
  }

  get is_connected(): boolean {
    return this._cdpSession !== null && this._browser !== null;
  }

  /**
   * 根据 tab id 获取 Page 对象
   */
  async get_page_by_id(tabId: string): Promise<Page> {
    if (!this._cdpSession) {
      throw new Error("Chromium is not connected yet.");
    }
    
    // 附加到指定的 target
    const { sessionId } = await this._cdpSession.send<{ sessionId: string }>("Target.attachToTarget", {
      targetId: tabId,
      flatten: true,
    });
    
    // 创建一个新的 CDP session 用于该 tab
    if (!this._cdpSession.createChildSession) {
      throw new Error("CDP session does not support child sessions.");
    }
    const tabCdp = this._cdpSession.createChildSession(sessionId);
    
    // 创建 Page 对象
    const page = new Page(tabCdp);
    await page.init();
    
    return page;
  }

  async get_version(): Promise<{ browser: string; protocol: string; userAgent: string }> {
    if (!this._cdpSession) {
      throw new Error("Chromium is not connected yet.");
    }
    const result = await this._cdpSession.send<{
      browser: string;
      protocolVersion: string;
      userAgent: string;
    }>("Browser.getVersion");
    return {
      browser: result.browser,
      protocol: result.protocolVersion,
      userAgent: result.userAgent,
    };
  }

  /**
   * 返回标签页数量
   */
  async tabs_count(): Promise<number> {
    const tabs = await this.get_tabs();
    return tabs.length;
  }

  /**
   * 返回所有标签页 id 列表
   */
  async tab_ids(): Promise<string[]> {
    const tabs = await this.get_tabs();
    return tabs.map(t => t.id);
  }

  /**
   * 返回最新的标签页 id
   */
  async latest_tab(): Promise<string | null> {
    const tabs = await this.get_tabs();
    return tabs.length > 0 ? tabs[tabs.length - 1].id : null;
  }

  /**
   * 获取所有域名的 cookies
   */
  async cookies(allInfo: boolean = false): Promise<any[]> {
    if (!this._cdpSession) {
      return [];
    }
    const { cookies } = await this._cdpSession.send<{ cookies: any[] }>("Storage.getCookies");
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
  async clear_cache(options: { cache?: boolean; cookies?: boolean } = {}): Promise<void> {
    if (!this._cdpSession) return;
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
  async close_tabs(tabIds: string | string[], others: boolean = false): Promise<void> {
    const ids = Array.isArray(tabIds) ? tabIds : [tabIds];
    const allTabs = await this.get_tabs();
    
    if (others) {
      for (const tab of allTabs) {
        if (!ids.includes(tab.id)) {
          await this.close_tab(tab.id);
        }
      }
    } else {
      for (const id of ids) {
        await this.close_tab(id);
      }
    }
  }

  /**
   * 断开重连
   */
  async reconnect(): Promise<void> {
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
  async process_id(): Promise<number | null> {
    if (!this._cdpSession) return null;
    try {
      const { processId } = await this._cdpSession.send<{ processId: number }>("SystemInfo.getProcessInfo");
      return processId;
    } catch {
      return null;
    }
  }

  /**
   * 获取用户数据目录路径
   */
  get user_data_path(): string | undefined {
    return this._options.userDataPath;
  }

  /**
   * 获取下载路径
   */
  get download_path(): string | undefined {
    return this._options.downloadPath;
  }
}

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

async function ensureBrowserForOptions(options: ChromiumOptions): Promise<void> {
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
  } else if (raw.startsWith("https://")) {
    raw = raw.substring("https://".length);
  }

  if (raw.startsWith("ws://")) {
    raw = raw.substring("ws://".length);
  } else if (raw.startsWith("wss://")) {
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
  } catch {
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
  const args: string[] = [...STEALTH_ARGS, ...(options.arguments ?? [])];
  if (!args.some((a) => a.startsWith("--user-data-dir"))) {
    args.push(`--user-data-dir=${userDataDir}`);
  }
  args.push(`--remote-debugging-port=${port}`);

  const child = spawn(exe, args, {
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

async function fetchJson(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith("https://");
    const client = isHttps ? https : http;

    const req = client.get(url, (res: http.IncomingMessage) => {
      const { statusCode } = res;
      if (!statusCode || statusCode < 200 || statusCode >= 300) {
        res.resume();
        reject(new Error(`Request failed with status code ${statusCode}`));
        return;
      }

      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () => {
        try {
          const body = Buffer.concat(chunks).toString("utf8");
          const json = JSON.parse(body);
          resolve(json);
        } catch (err) {
          reject(err as Error);
        }
      });
    });

    req.on("error", (err: Error) => reject(err));
  });
}
