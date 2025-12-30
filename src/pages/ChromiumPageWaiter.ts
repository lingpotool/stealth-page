import { ChromiumPage } from "./ChromiumPage";
import { Element } from "../core/Element";

export class ChromiumPageWaiter {
  private readonly _page: ChromiumPage;

  constructor(page: ChromiumPage) {
    this._page = page;
  }

  /**
   * 等待若干秒
   */
  async wait(second: number, scope?: number): Promise<ChromiumPage> {
    const waitTime = scope !== undefined
      ? second + Math.random() * (scope - second)
      : second;
    await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
    return this._page;
  }

  async ele(locator: string, timeoutMs?: number, intervalMs = 200): Promise<Element | null> {
    const options = this._page.browser.options;
    const effectiveTimeout = timeoutMs != null ? timeoutMs : options.timeouts.base * 1000;
    const deadline = Date.now() + effectiveTimeout;
    while (true) {
      const el = await this._page.ele(locator);
      if (el) {
        return el;
      }
      if (Date.now() > deadline) {
        return null;
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  /**
   * 等待多个元素加载到 DOM
   */
  async eles_loaded(locators: string | string[], timeout?: number, anyOne: boolean = false): Promise<boolean> {
    const options = this._page.browser.options;
    const timeoutMs = (timeout ?? options.timeouts.base) * 1000;
    const deadline = Date.now() + timeoutMs;
    const locatorList = Array.isArray(locators) ? locators : [locators];

    while (Date.now() < deadline) {
      const results = await Promise.all(
        locatorList.map(async (loc) => {
          const el = await this._page.ele(loc);
          return el !== null;
        })
      );

      if (anyOne) {
        if (results.some(r => r)) {
          return true;
        }
      } else {
        if (results.every(r => r)) {
          return true;
        }
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return false;
  }

  /**
   * 等待 URL 变化（包含或不包含指定文本）
   */
  async url_change(text?: string, exclude: boolean = false, timeout?: number): Promise<ChromiumPage | false> {
    const options = this._page.browser.options;
    const timeoutMs = (timeout ?? options.timeouts.base) * 1000;
    const startUrl = await this._page.url();
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const currentUrl = await this._page.url();
      
      if (text === undefined) {
        // 没有指定文本，只要 URL 变化就返回
        if (currentUrl !== startUrl) {
          return this._page;
        }
      } else {
        // 指定了文本，检查是否包含/不包含
        const contains = currentUrl.includes(text);
        if (exclude ? !contains : contains) {
          return this._page;
        }
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return false;
  }

  /**
   * 等待标题变化（包含或不包含指定文本）
   */
  async title_change(text?: string, exclude: boolean = false, timeout?: number): Promise<ChromiumPage | false> {
    const options = this._page.browser.options;
    const timeoutMs = (timeout ?? options.timeouts.base) * 1000;
    const startTitle = await this._page.title();
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const currentTitle = await this._page.title();
      
      if (text === undefined) {
        if (currentTitle !== startTitle) {
          return this._page;
        }
      } else {
        const contains = currentTitle.includes(text);
        if (exclude ? !contains : contains) {
          return this._page;
        }
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return false;
  }

  /**
   * 等待页面开始加载
   */
  async load_start(timeout?: number): Promise<boolean> {
    const options = this._page.browser.options;
    const timeoutMs = (timeout ?? options.timeouts.pageLoad) * 1000;
    const page = this._page["_page"];
    if (!page) return false;

    return new Promise<boolean>((resolve) => {
      const timer = setTimeout(() => {
        cleanup();
        resolve(false);
      }, timeoutMs);

      const handler = () => {
        cleanup();
        resolve(true);
      };

      const cleanup = () => {
        clearTimeout(timer);
        page.cdpSession.off("Page.frameStartedLoading", handler);
      };

      page.cdpSession.on("Page.frameStartedLoading", handler);
    });
  }

  /**
   * 等待文档加载完成
   */
  async doc_loaded(timeout?: number): Promise<boolean> {
    const options = this._page.browser.options;
    const timeoutMs = (timeout ?? options.timeouts.pageLoad) * 1000;
    const page = this._page["_page"];
    if (!page) return false;

    return new Promise<boolean>((resolve) => {
      const timer = setTimeout(() => {
        cleanup();
        resolve(false);
      }, timeoutMs);

      const handler = () => {
        cleanup();
        resolve(true);
      };

      const cleanup = () => {
        clearTimeout(timer);
        page.cdpSession.off("Page.domContentEventFired", handler);
      };

      page.cdpSession.on("Page.domContentEventFired", handler);
    });
  }

  async load(timeoutMs = 30000): Promise<boolean> {
    const page = this._page["_page"];
    if (!page) {
      return false;
    }
    return new Promise<boolean>((resolve) => {
      const timer = setTimeout(() => {
        cleanup();
        resolve(false);
      }, timeoutMs);

      const handler = () => {
        cleanup();
        resolve(true);
      };

      const cleanup = () => {
        clearTimeout(timer);
        page.cdpSession.off("Page.loadEventFired", handler);
      };

      page.cdpSession.on("Page.loadEventFired", handler);
    });
  }

  /**
   * 等待新标签页出现
   */
  async new_tab(timeout?: number): Promise<string | false> {
    const options = this._page.browser.options;
    const timeoutMs = (timeout ?? options.timeouts.base) * 1000;
    const startTabs = await this._page.get_tabs();
    const startIds = new Set(startTabs.map(t => t.id));
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const currentTabs = await this._page.get_tabs();
      for (const tab of currentTabs) {
        if (!startIds.has(tab.id)) {
          return tab.id;
        }
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return false;
  }

  async ele_deleted(locator: string, timeout?: number): Promise<boolean> {
    const options = this._page.browser.options;
    const timeoutMs = (timeout ?? options.timeouts.base) * 1000;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const el = await this._page.ele(locator);
      if (!el) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return false;
  }

  async ele_displayed(locator: string, timeout?: number): Promise<boolean> {
    const options = this._page.browser.options;
    const timeoutMs = (timeout ?? options.timeouts.base) * 1000;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const el = await this._page.ele(locator);
      if (el) {
        const displayed = await el.is_displayed();
        if (displayed) {
          return true;
        }
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return false;
  }

  async ele_hidden(locator: string, timeout?: number): Promise<boolean> {
    const options = this._page.browser.options;
    const timeoutMs = (timeout ?? options.timeouts.base) * 1000;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const el = await this._page.ele(locator);
      if (!el) {
        return true;
      }
      const displayed = await el.is_displayed();
      if (!displayed) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return false;
  }

  /**
   * 等待上传文件路径输入完成
   */
  async upload_paths_inputted(): Promise<boolean> {
    // 简化实现：等待一小段时间
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  }

  /**
   * 等待下载开始
   */
  async download_begin(timeout?: number, cancelIt: boolean = false): Promise<any | false> {
    const options = this._page.browser.options;
    const timeoutMs = (timeout ?? options.timeouts.base) * 1000;
    const page = this._page["_page"];
    if (!page) return false;

    return new Promise((resolve) => {
      let resolved = false;

      const handler = (params: any) => {
        if (!resolved) {
          resolved = true;
          cleanup();
          
          if (cancelIt) {
            page.cdpSession.send("Browser.cancelDownload", {
              guid: params.guid,
            }).catch(() => {});
          }
          
          resolve(params);
        }
      };

      const cleanup = () => {
        clearTimeout(timer);
        page.cdpSession.off("Page.downloadWillBegin", handler);
      };

      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve(false);
        }
      }, timeoutMs);

      page.cdpSession.on("Page.downloadWillBegin", handler);
    });
  }

  /**
   * 等待所有下载任务完成
   */
  async downloads_done(timeout?: number, cancelIfTimeout: boolean = true): Promise<boolean> {
    // 简化实现
    const timeoutMs = timeout ? timeout * 1000 : 60000;
    await new Promise(resolve => setTimeout(resolve, Math.min(timeoutMs, 1000)));
    return true;
  }

  /**
   * 等待所有浏览器下载任务结束（别名）
   */
  async all_downloads_done(timeout?: number, cancelIfTimeout: boolean = true): Promise<boolean> {
    return this.downloads_done(timeout, cancelIfTimeout);
  }

  /**
   * 等待弹窗出现
   */
  async alert(timeout?: number): Promise<boolean> {
    const options = this._page.browser.options;
    const timeoutMs = (timeout ?? options.timeouts.base) * 1000;
    const page = this._page["_page"];
    if (!page) return false;

    return new Promise<boolean>((resolve) => {
      const timer = setTimeout(() => {
        cleanup();
        resolve(false);
      }, timeoutMs);

      const handler = () => {
        cleanup();
        resolve(true);
      };

      const cleanup = () => {
        clearTimeout(timer);
        page.cdpSession.off("Page.javascriptDialogOpening", handler);
      };

      page.cdpSession.on("Page.javascriptDialogOpening", handler);
    });
  }

  /**
   * 等待弹窗关闭
   */
  async alert_closed(timeout?: number): Promise<ChromiumPage> {
    const options = this._page.browser.options;
    const timeoutMs = timeout !== undefined ? timeout * 1000 : Infinity;
    const page = this._page["_page"];
    
    if (!page) return this._page;

    return new Promise<ChromiumPage>((resolve) => {
      let timer: NodeJS.Timeout | null = null;
      
      if (timeoutMs !== Infinity) {
        timer = setTimeout(() => {
          cleanup();
          resolve(this._page);
        }, timeoutMs);
      }

      const handler = () => {
        cleanup();
        resolve(this._page);
      };

      const cleanup = () => {
        if (timer) clearTimeout(timer);
        page.cdpSession.off("Page.javascriptDialogClosed", handler);
      };

      page.cdpSession.on("Page.javascriptDialogClosed", handler);
    });
  }
}
