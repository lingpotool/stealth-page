import { Chromium } from "../chromium/Chromium";
import { Page } from "../core/Page";
import { Element } from "../core/Element";
import { NoneElement } from "../core/NoneElement";
import { ChromiumBase } from "./ChromiumBase";

export class ChromiumTab extends ChromiumBase {
  protected readonly _tabId: string;

  constructor(browser: Chromium, tabId: string) {
    super(browser);
    this._tabId = tabId;
  }

  get tab_id(): string {
    return this._tabId;
  }

  async init(): Promise<void> {
    if (!this._page) {
      await this._browser.connect();
      this._page = await this._browser.get_page_by_id(this._tabId);
    }
  }

  async close(others: boolean = false): Promise<void> {
    if (others) {
      const tabs = await this._browser.get_tabs();
      for (const tab of tabs) {
        if (tab.id !== this._tabId) {
          await this._browser.close_tab(tab.id);
        }
      }
    } else {
      await this._browser.close_tab(this._tabId);
    }
  }

  async activate(): Promise<void> {
    await this._browser.activate_tab(this._tabId);
  }

  async get_screenshot(
    path?: string,
    name?: string,
    asBytes?: boolean | 'jpg' | 'jpeg' | 'png' | 'webp',
    asBase64?: boolean | 'jpg' | 'jpeg' | 'png' | 'webp',
    fullPage: boolean = false,
    leftTop?: [number, number],
    rightBottom?: [number, number]
  ): Promise<string | Buffer> {
    await this.init();
    return this._get_screenshot(path, name, asBytes, asBase64, fullPage, leftTop, rightBottom);
  }

  async get_frame_elements(locator?: string): Promise<Element[]> {
    await this.init();
    if (locator) {
      return this.eles(locator);
    }
    return this.eles("iframe, frame");
  }

  _on_disconnect(): void {
    this._page = null;
  }
}
