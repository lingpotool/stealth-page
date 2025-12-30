import { ChromiumPage } from "./ChromiumPage";
import { CookiesSetter } from "../units/CookiesSetter";
import { WindowSetter } from "../units/WindowSetter";

/**
 * 加载模式设置类（页面级别）
 */
export class PageLoadMode {
  private readonly _setter: ChromiumPageSetter;

  constructor(setter: ChromiumPageSetter) {
    this._setter = setter;
  }

  /**
   * 设置为 normal 模式
   */
  async normal(): Promise<void> {
    await this._setter.load_mode("normal");
  }

  /**
   * 设置为 eager 模式
   */
  async eager(): Promise<void> {
    await this._setter.load_mode("eager");
  }

  /**
   * 设置为 none 模式
   */
  async none(): Promise<void> {
    await this._setter.load_mode("none");
  }
}

export class ChromiumPageSetter {
  private readonly _page: ChromiumPage;
  private _loadMode: PageLoadMode | null = null;
  private _cookies: CookiesSetter | null = null;
  private _window: WindowSetter | null = null;

  constructor(page: ChromiumPage) {
    this._page = page;
  }

  /**
   * 返回用于设置加载模式的对象
   */
  get load_mode_setter(): PageLoadMode {
    if (!this._loadMode) {
      this._loadMode = new PageLoadMode(this);
    }
    return this._loadMode;
  }

  /**
   * 返回用于设置 cookies 的对象
   */
  get cookies(): CookiesSetter {
    if (!this._cookies) {
      const page = this._page["_page"];
      if (page) {
        this._cookies = new CookiesSetter({ cdpSession: page.cdpSession });
      }
    }
    return this._cookies!;
  }

  /**
   * 返回用于设置窗口的对象
   */
  get window(): WindowSetter {
    if (!this._window) {
      const page = this._page["_page"];
      if (page) {
        this._window = new WindowSetter({ cdpSession: page.cdpSession });
      }
    }
    return this._window!;
  }

  timeouts(base?: number, pageLoad?: number, script?: number): this {
    const options = this._page.browser.options;
    if (base !== undefined) {
      options.timeouts.base = base;
    }
    if (pageLoad !== undefined) {
      options.timeouts.pageLoad = pageLoad;
    }
    if (script !== undefined) {
      options.timeouts.script = script;
    }
    return this;
  }

  async user_agent(ua: string, platform?: string): Promise<this> {
    const page = this._page["_page"];
    if (page) {
      const params: Record<string, any> = { userAgent: ua };
      if (platform) {
        params.platform = platform;
      }
      await page.cdpSession.send("Network.setUserAgentOverride", params);
    }
    return this;
  }

  async window_size(width: number, height: number): Promise<this> {
    const page = this._page["_page"];
    if (page) {
      await page.cdpSession.send("Browser.setWindowBounds", {
        windowId: 1,
        bounds: { width, height },
      });
    }
    return this;
  }

  async headers(headers: Record<string, string> | string): Promise<this> {
    const page = this._page["_page"];
    if (page) {
      let headerObj: Record<string, string>;
      if (typeof headers === "string") {
        // 解析从浏览器复制的 headers 文本
        headerObj = {};
        headers.split("\n").forEach(line => {
          const [key, ...valueParts] = line.split(":");
          if (key && valueParts.length > 0) {
            headerObj[key.trim()] = valueParts.join(":").trim();
          }
        });
      } else {
        headerObj = headers;
      }
      await page.cdpSession.send("Network.setExtraHTTPHeaders", {
        headers: headerObj,
      });
    }
    return this;
  }

  async download_path(path: string): Promise<this> {
    this._page.browser.options.downloadPath = path;
    const page = this._page["_page"];
    if (page) {
      await page.cdpSession.send("Browser.setDownloadBehavior", {
        behavior: "allow",
        downloadPath: path,
      });
    }
    return this;
  }

  async load_mode(mode: "normal" | "eager" | "none"): Promise<this> {
    const page = this._page["_page"];
    if (page) {
      const strategy = mode === "normal" ? "normal" : mode === "eager" ? "eager" : "none";
      await page.cdpSession.send("Page.setLifecycleEventsEnabled", {
        enabled: strategy !== "none",
      });
    }
    return this;
  }

  async blocked_urls(urls: string[] | null): Promise<this> {
    const page = this._page["_page"];
    if (page) {
      await page.cdpSession.send("Network.setBlockedURLs", {
        urls: urls || [],
      });
    }
    return this;
  }

  /**
   * 设置 sessionStorage
   */
  async session_storage(item: string, value: string | false): Promise<this> {
    const page = this._page["_page"];
    if (page) {
      if (value === false) {
        await page.cdpSession.send("Runtime.evaluate", {
          expression: `sessionStorage.removeItem(${JSON.stringify(item)})`,
        });
      } else {
        await page.cdpSession.send("Runtime.evaluate", {
          expression: `sessionStorage.setItem(${JSON.stringify(item)}, ${JSON.stringify(value)})`,
        });
      }
    }
    return this;
  }

  /**
   * 设置 localStorage
   */
  async local_storage(item: string, value: string | false): Promise<this> {
    const page = this._page["_page"];
    if (page) {
      if (value === false) {
        await page.cdpSession.send("Runtime.evaluate", {
          expression: `localStorage.removeItem(${JSON.stringify(item)})`,
        });
      } else {
        await page.cdpSession.send("Runtime.evaluate", {
          expression: `localStorage.setItem(${JSON.stringify(item)}, ${JSON.stringify(value)})`,
        });
      }
    }
    return this;
  }

  /**
   * 设置等待上传的文件路径
   */
  async upload_files(files: string | string[]): Promise<this> {
    const fileList = Array.isArray(files) ? files : files.split("\n");
    this._page.browser.options.uploadFiles = fileList;
    return this;
  }

  /**
   * 设置是否自动处理弹窗
   */
  async auto_handle_alert(onOff: boolean = true, accept: boolean = true): Promise<this> {
    const page = this._page["_page"];
    if (page) {
      if (onOff) {
        page.cdpSession.on("Page.javascriptDialogOpening", async () => {
          await page.cdpSession.send("Page.handleJavaScriptDialog", {
            accept,
          });
        });
      }
    }
    return this;
  }

  /**
   * 激活标签页
   */
  async activate(): Promise<this> {
    const tabs = await this._page.get_tabs();
    if (tabs.length > 0) {
      await this._page.activate_tab(tabs[0].id);
    }
    return this;
  }
}
