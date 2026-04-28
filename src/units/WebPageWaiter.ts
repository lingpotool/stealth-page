import { WebPage } from "../pages/WebPage";
import { ChromiumPageWaiter } from "../pages/ChromiumPageWaiter";
import { Settings } from "../core/Settings";

export class WebPageWaiter {
  private readonly _owner: WebPage;
  private readonly _chromiumWaiter: ChromiumPageWaiter;

  constructor(owner: WebPage) {
    this._owner = owner;
    this._chromiumWaiter = new ChromiumPageWaiter(owner.chromium_page);
  }

  async wait(second: number, scope?: number): Promise<WebPage> {
    await this._chromiumWaiter.wait(second, scope);
    return this._owner;
  }

  async ele_deleted(locator: string, timeout?: number, raiseErr?: boolean | null): Promise<boolean> {
    return this._chromiumWaiter.ele_deleted(locator, timeout, raiseErr);
  }

  async ele_displayed(locator: string, timeout?: number, raiseErr?: boolean | null): Promise<boolean> {
    return this._chromiumWaiter.ele_displayed(locator, timeout, raiseErr);
  }

  async ele_hidden(locator: string, timeout?: number, raiseErr?: boolean | null): Promise<boolean> {
    return this._chromiumWaiter.ele_hidden(locator, timeout, raiseErr);
  }

  async url_change(text?: string, exclude: boolean = false, timeout?: number, raiseErr?: boolean | null): Promise<WebPage | false> {
    const result = await this._chromiumWaiter.url_change(text, exclude, timeout, raiseErr);
    return result ? this._owner : false;
  }

  async title_change(text?: string, exclude: boolean = false, timeout?: number, raiseErr?: boolean | null): Promise<WebPage | false> {
    const result = await this._chromiumWaiter.title_change(text, exclude, timeout, raiseErr);
    return result ? this._owner : false;
  }

  async download_begin(timeout?: number, cancelIt: boolean = false): Promise<any | false> {
    return this._chromiumWaiter.download_begin(timeout, cancelIt);
  }

  async downloads_done(timeout?: number, cancelIfTimeout: boolean = true): Promise<boolean> {
    return this._chromiumWaiter.downloads_done(timeout, cancelIfTimeout);
  }

  async new_tab(timeout?: number, raiseErr?: boolean | null): Promise<string | false> {
    return this._chromiumWaiter.new_tab(timeout, raiseErr);
  }

  async alert_closed(timeout?: number): Promise<WebPage | false> {
    const result = await this._chromiumWaiter.alert_closed(timeout);
    return result ? this._owner : false;
  }
}
