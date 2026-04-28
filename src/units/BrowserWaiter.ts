import { Chromium } from "../chromium/Chromium";
import { Settings } from "../core/Settings";

function shouldRaise(raiseErr?: boolean | null): boolean {
  if (raiseErr === true) return true;
  if (raiseErr === false) return false;
  return Settings.raise_when_wait_failed;
}

export class BrowserWaiter {
  private readonly _browser: Chromium;

  constructor(browser: Chromium) {
    this._browser = browser;
  }

  async wait(second: number, scope?: number): Promise<Chromium> {
    const waitTime = scope !== undefined
      ? second + Math.random() * (scope - second)
      : second;
    await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
    return this._browser;
  }

  async new_tab(timeout?: number, currTab?: string, raiseErr?: boolean | null): Promise<string | false> {
    const timeoutMs = (timeout ?? this._browser.options.timeouts.base) * 1000;
    const startTime = Date.now();

    const initialTabs = await this._browser.get_tabs();
    const initialIds = new Set(initialTabs.map(t => t.id));

    if (currTab && !initialIds.has(currTab)) {
      initialIds.add(currTab);
    }

    while (Date.now() - startTime < timeoutMs) {
      const currentTabs = await this._browser.get_tabs();
      for (const tab of currentTabs) {
        if (!initialIds.has(tab.id)) {
          return tab.id;
        }
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (shouldRaise(raiseErr)) {
      const { WaitTimeoutError } = await import("../errors");
      throw new WaitTimeoutError("new_tab timeout");
    }

    return false;
  }

  async download_begin(timeout?: number, cancelIt: boolean = false): Promise<any | false> {
    const timeoutMs = (timeout ?? this._browser.options.timeouts.base) * 1000;

    return new Promise((resolve) => {
      let resolved = false;

      const handler = (params: any) => {
        if (!resolved) {
          resolved = true;
          this._browser.cdpSession.off("Browser.downloadWillBegin", handler);

          if (cancelIt) {
            this._browser.cdpSession.send("Browser.cancelDownload", {
              guid: params.guid,
            }).catch(() => {});
          }

          resolve(params);
        }
      };

      this._browser.cdpSession.on("Browser.downloadWillBegin", handler);

      this._browser.cdpSession.send("Browser.setDownloadBehavior", {
        behavior: "allowAndName",
        downloadPath: this._browser.options.downloadPath,
        eventsEnabled: true,
      }).catch(() => {});

      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          this._browser.cdpSession.off("Browser.downloadWillBegin", handler);
          resolve(false);
        }
      }, timeoutMs);
    });
  }

  async downloads_done(timeout?: number, cancelIfTimeout: boolean = true): Promise<boolean> {
    const timeoutMs = timeout ? timeout * 1000 : Infinity;
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
    }

    return !cancelIfTimeout;
  }
}
