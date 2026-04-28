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
import { raise_error } from "../core/tools";
import { Settings } from "../core/Settings";

export interface ChromiumInitOptions {
  addrOrOpts?: string | ChromiumOptions;
}

export class Chromium {
  private static readonly _BROWSERS = new Map<string, Chromium>();

  private _options: ChromiumOptions;
  private _browser: Browser | null = null;
  private _cdpSession: CDPSession | null = null;
  private _setter: BrowserSetter | null = null;
  private _waiter: BrowserWaiter | null = null;
  private _states: BrowserStates | null = null;
  private _disconnect_flag: boolean = false;
  private _is_headless: boolean = false;
  private _process_id: number | null = null;

  constructor(addrOrOpts?: string | ChromiumOptions) {
    this._options = typeof addrOrOpts === "string" ? new ChromiumOptions({ address: addrOrOpts }) : addrOrOpts ?? new ChromiumOptions();

    const address = this._options.address || '127.0.0.1:9222';
    const existing = Chromium._BROWSERS.get(address);
    if (existing) {
      return existing;
    }
    Chromium._BROWSERS.set(address, this);
  }

  static get_instances(): Map<string, Chromium> {
    return Chromium._BROWSERS;
  }

  get set(): BrowserSetter {
    if (!this._setter) {
      this._setter = new BrowserSetter(this);
    }
    return this._setter;
  }

  get wait(): BrowserWaiter {
    if (!this._waiter) {
      this._waiter = new BrowserWaiter(this);
    }
    return this._waiter;
  }

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

  get none_ele_return_value(): any {
    return Settings.none_ele_return_value;
  }

  set none_ele_return_value(value: any) {
    Settings.none_ele_return_value = value;
  }

  get none_ele_value(): any {
    return Settings.none_ele_value;
  }

  set none_ele_value(value: any) {
    Settings.none_ele_value = value;
  }

  get auto_handle_alert(): boolean | null {
    return Settings.auto_handle_alert;
  }

  set auto_handle_alert(value: boolean | null) {
    Settings.auto_handle_alert = value;
  }

  get _disconnect_flag_value(): boolean {
    return this._disconnect_flag;
  }

  get is_headless(): boolean {
    return this._is_headless;
  }

  _on_disconnect(): void {
    this._disconnect_flag = true;
    if (this._browser) {
      this._browser._drivers.clear();
      this._browser._all_drivers.clear();
      this._browser._frames.clear();
      this._browser._relation.clear();
    }
  }

  async _run_cdp(cmd: string, params?: Record<string, any>, _ignore: any[] = []): Promise<any> {
    if (!this._cdpSession) {
      throw new Error("Chromium is not connected yet.");
    }
    try {
      return await this._cdpSession.send(cmd, params);
    } catch (e: any) {
      if (_ignore.length > 0) {
        try {
          raise_error(e, cmd, params);
        } catch (raised) {
          for (const ignoreClass of _ignore) {
            if (raised instanceof ignoreClass) {
              return undefined;
            }
          }
          throw raised;
        }
      }
      raise_error(e, cmd, params);
    }
  }

  async connect(): Promise<void> {
    if (this._browser && this._cdpSession) {
      return;
    }

    this._disconnect_flag = false;
    await ensureBrowserForOptions(this._options);

    const address = this._options.address;
    if (!address) {
      throw new Error(
        "ChromiumOptions.address must be set to a DevTools HTTP address (host:port) or a WebSocket URL.",
      );
    }

    for (const arg of this._options.arguments) {
      if (arg.includes('--headless')) {
        this._is_headless = true;
        break;
      }
    }

    let wsUrl: string;

    if (address.startsWith("ws://") || address.startsWith("wss://")) {
      wsUrl = address;
    } else {
      const base = address.startsWith("http://") || address.startsWith("https://") ? address : `http://${address}`;
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
    cdp.owner = this;
    this._cdpSession = cdp;
    this._browser = await Browser.attach(cdp, {
      userAgent: undefined,
      viewport: undefined,
    });
  }

  async new_page(): Promise<Page> {
    if (!this._browser) {
      throw new Error("Chromium is not connected yet.");
    }
    return this._browser.newPage();
  }

  async quit(options?: { timeout?: number; force?: boolean; delData?: boolean }): Promise<void> {
    const { timeout = 5, force = true, delData = false } = options || {};
    const deadline = Date.now() + timeout * 1000;

    if (this._browser) {
      try {
        await Promise.race([
          this._browser.close(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), deadline - Date.now())),
        ]);
      } catch {}
    }
    if (this._cdpSession) {
      try {
        await this._cdpSession.send("Browser.close");
      } catch {}
    }
    if (force && this._process_id) {
      try {
        process.kill(this._process_id);
      } catch {}
    }
    if (delData && this._options.userDataPath) {
      try {
        const fs = await import("fs");
        fs.rmSync(this._options.userDataPath, { recursive: true, force: true });
      } catch {}
    }
    const address = this._options.address || '127.0.0.1:9222';
    Chromium._BROWSERS.delete(address);
    this._cdpSession = null;
    this._browser = null;
  }

  async get_tab(idOrNum?: string | number, title?: string, url?: string, tabType?: string | string[]): Promise<{ id: string; url: string; title: string; type: string } | null> {
    if (!this._cdpSession) return null;
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

  async get_tabs(title?: string, url?: string, tabType?: string | string[]): Promise<Array<{ id: string; url: string; title: string; type: string }>> {
    if (!this._cdpSession) {
      return [];
    }
    const { targetInfos } = await this._cdpSession.send<{
      targetInfos: Array<{ targetId: string; url: string; title: string; type: string }>;
    }>("Target.getTargets");

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

  async activate_tab(tabIdOrIndex: string | number): Promise<void> {
    if (!this._cdpSession) {
      return;
    }
    let tabId: string;
    if (typeof tabIdOrIndex === 'number') {
      const tabs = await this.get_tabs();
      const idx = tabIdOrIndex > 0 ? tabIdOrIndex - 1 : tabs.length + tabIdOrIndex;
      const tab = tabs[idx];
      if (!tab) return;
      tabId = tab.id;
    } else {
      tabId = tabIdOrIndex;
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

  async new_tab(url?: string, options?: { newWindow?: boolean; background?: boolean; newContext?: boolean }): Promise<string> {
    if (!this._cdpSession) {
      throw new Error("Chromium is not connected yet.");
    }
    const { newWindow = false, background = false, newContext = false } = options || {};

    let browserContextId: string | undefined;
    if (newContext) {
      try {
        const result = await this._cdpSession.send<{ browserContextId: string }>("Target.createBrowserContext", {
          disposeOnDetach: true,
        });
        browserContextId = result.browserContextId;
      } catch {}
    }

    const params: Record<string, any> = { url: url || "about:blank" };
    if (newWindow) params.newWindow = true;
    if (background) params.background = true;
    if (browserContextId) params.browserContextId = browserContextId;

    try {
      const { targetId } = await this._cdpSession.send<{ targetId: string }>("Target.createTarget", params);
      return targetId;
    } catch {
      return await this._new_tab_by_js(url, newWindow);
    }
  }

  private async _new_tab_by_js(url?: string, newWindow?: boolean): Promise<string> {
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

  get is_connected(): boolean {
    return this._cdpSession !== null && this._browser !== null && !this._disconnect_flag;
  }

  async get_page_by_id(tabId: string): Promise<Page> {
    if (!this._cdpSession) {
      throw new Error("Chromium is not connected yet.");
    }
    
    const { sessionId } = await this._cdpSession.send<{ sessionId: string }>("Target.attachToTarget", {
      targetId: tabId,
      flatten: true,
    });
    
    if (!this._cdpSession.createChildSession) {
      throw new Error("CDP session does not support child sessions.");
    }
    const tabCdp = this._cdpSession.createChildSession(sessionId);
    
    const page = new Page(tabCdp);
    await page.init();
    
    return page;
  }

  async get_version(): Promise<{ browser: string; protocol: string; userAgent: string }> {
    if (!this._cdpSession) {
      throw new Error("Chromium is not connected yet.");
    }
    const result = await this._cdpSession.send<{
      product: string;
      protocolVersion: string;
      userAgent: string;
    }>("Browser.getVersion");
    return {
      browser: result.product,
      protocol: result.protocolVersion,
      userAgent: result.userAgent,
    };
  }

  async tabs_count(): Promise<number> {
    const tabs = await this.get_tabs();
    return tabs.length;
  }

  async tab_ids(): Promise<string[]> {
    const tabs = await this.get_tabs();
    return tabs.map(t => t.id);
  }

  async latest_tab(): Promise<string | null> {
    const tabs = await this.get_tabs();
    return tabs.length > 0 ? tabs[tabs.length - 1].id : null;
  }

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

  async clear_cache(options: { cache?: boolean; cookies?: boolean } = {}): Promise<void> {
    if (!this._cdpSession) return;
    const { cache = true, cookies = true } = options;
    
    if (cookies) {
      await this._cdpSession.send("Storage.clearCookies");
    }
    if (cache) {
      await this._cdpSession.send("Network.clearBrowserCache");
    }
  }

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

  async reconnect(): Promise<void> {
    if (this._cdpSession?.close) {
      this._cdpSession.close();
    }
    this._cdpSession = null;
    this._browser = null;
    this._disconnect_flag = false;
    await this.connect();
  }

  async process_id(): Promise<number | null> {
    if (!this._cdpSession) return null;
    try {
      const result = await this._cdpSession.send<any>("SystemInfo.getProcessInfo");
      const processInfo = result?.processInfo;
      if (Array.isArray(processInfo)) {
        const browserProc = processInfo.find((p: any) => p.type === 'browser');
        if (browserProc && browserProc.id) {
          this._process_id = browserProc.id;
          return this._process_id;
        }
      }
      return this._process_id;
    } catch {
      return this._process_id;
    }
  }

  get user_data_path(): string | undefined {
    return this._options.userDataPath;
  }

  get download_path(): string | undefined {
    return this._options.downloadPath;
  }
}

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

async function ensureBrowserForOptions(options: ChromiumOptions): Promise<void> {
  let address = options.address;

  if (!address) {
    address = "127.0.0.1:9222";
    options.address = address;
  }

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

  const isLocalHost = host === "127.0.0.1" || host === "localhost";
  if (!isLocalHost) {
    return;
  }

  const base = `http://${host}:${port}`;
  const versionUrl = base.endsWith("/") ? `${base}json/version` : `${base}/json/version`;

  try {
    await fetchJson(versionUrl);
    return;
  } catch {
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
  });
  child.unref();

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
