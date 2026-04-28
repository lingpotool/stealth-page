import { ChromiumPage } from "./ChromiumPage";
import { Element } from "../core/Element";
import { NoneElement } from "../core/NoneElement";

export class ChromiumPageWaiter {
  private readonly _page: ChromiumPage;

  constructor(page: ChromiumPage) {
    this._page = page;
  }

  async wait(second: number, scope?: number): Promise<ChromiumPage> {
    const waitTime = scope !== undefined
      ? second + Math.random() * (scope - second)
      : second;
    await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
    return this._page;
  }

  async ele(locator: string, timeoutMs?: number, intervalMs = 200): Promise<Element | NoneElement> {
    const options = this._page.browser.options;
    const effectiveTimeout = timeoutMs != null ? timeoutMs : options.timeouts.base * 1000;
    const deadline = Date.now() + effectiveTimeout;
    while (true) {
      const el = await this._page.ele(locator);
      if (!(el instanceof NoneElement)) {
        return el;
      }
      if (Date.now() > deadline) {
        return el;
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

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

  async url_change(text?: string, exclude: boolean = false, timeout?: number): Promise<ChromiumPage | false> {
    const options = this._page.browser.options;
    const timeoutMs = (timeout ?? options.timeouts.base) * 1000;
    const startUrl = await this._page.url();
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const currentUrl = await this._page.url();

      if (text === undefined) {
        if (currentUrl !== startUrl) {
          return this._page;
        }
      } else {
        const contains = currentUrl.includes(text);
        if (exclude ? !contains : contains) {
          return this._page;
        }
      }

      await new Promise(resolve => setTimeout(resolve, 50));
    }

    return false;
  }

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

      await new Promise(resolve => setTimeout(resolve, 50));
    }

    return false;
  }

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

  async js_ready(timeout?: number): Promise<boolean> {
    const options = this._page.browser.options;
    const timeoutMs = (timeout ?? options.timeouts.pageLoad) * 1000;
    const deadline = Date.now() + timeoutMs;
    const page = this._page["_page"];
    if (!page) return false;

    while (Date.now() < deadline) {
      try {
        const result = await page.cdpSession.send("Runtime.evaluate", {
          expression: "document.readyState",
          returnByValue: true,
        });
        if (result.result?.value === "complete" || result.result?.value === "interactive") {
          return true;
        }
      } catch {
        // ignore
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    return false;
  }

  async activated(timeout?: number): Promise<boolean> {
    const options = this._page.browser.options;
    const timeoutMs = (timeout ?? options.timeouts.base) * 1000;
    const deadline = Date.now() + timeoutMs;
    const page = this._page["_page"];
    if (!page) return false;

    while (Date.now() < deadline) {
      try {
        const targetId = page.tab_id;
        const result = await page.cdpSession.send("Target.getTargetInfo", { targetId });
        if (result.targetInfo?.isActive) {
          return true;
        }
      } catch {
        // ignore
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    return false;
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

  async upload_paths_inputted(timeout?: number): Promise<boolean> {
    const options = this._page.browser.options;
    const timeoutMs = (timeout ?? options.timeouts.base) * 1000;
    const deadline = Date.now() + timeoutMs;
    const page = this._page["_page"];

    while (Date.now() < deadline) {
      if (!page || !(page as any)._upload_list || (page as any)._upload_list.length === 0) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    return false;
  }

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
        page.cdpSession.off("Browser.downloadWillBegin", handler);
      };

      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve(false);
        }
      }, timeoutMs);

      page.cdpSession.on("Browser.downloadWillBegin", handler);
    });
  }

  async downloads_done(timeout?: number, cancelIfTimeout: boolean = true): Promise<boolean> {
    const timeoutMs = timeout ? timeout * 1000 : 60000;
    const deadline = Date.now() + timeoutMs;
    const browser = this._page.browser;
    const dlMgr = browser.browser?._dl_mgr;

    if (!dlMgr) {
      await new Promise(resolve => setTimeout(resolve, Math.min(timeoutMs, 1000)));
      return true;
    }

    const tabId = this._page["_page"]?.tab_id;

    while (Date.now() < deadline) {
      const missions = tabId ? dlMgr.get_tab_missions?.(tabId) : null;
      if (!missions || missions.size === 0) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (cancelIfTimeout && tabId) {
      const missions = dlMgr.get_tab_missions?.(tabId);
      if (missions) {
        for (const m of missions) {
          m.state = 'canceled';
        }
      }
    }

    return false;
  }

  async all_downloads_done(timeout?: number, cancelIfTimeout: boolean = true): Promise<boolean> {
    return this.downloads_done(timeout, cancelIfTimeout);
  }

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

  async alert_closed(timeout?: number): Promise<ChromiumPage | false> {
    const options = this._page.browser.options;
    const timeoutMs = timeout !== undefined ? timeout * 1000 : Infinity;
    const page = this._page["_page"];

    if (!page) return this._page;

    const deadline = timeoutMs !== Infinity ? Date.now() + timeoutMs : Infinity;

    while (!(page as any)._has_alert) {
      if (deadline !== Infinity && Date.now() >= deadline) return false;
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    while ((page as any)._has_alert) {
      if (deadline !== Infinity && Date.now() >= deadline) return false;
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return this._page;
  }
}
