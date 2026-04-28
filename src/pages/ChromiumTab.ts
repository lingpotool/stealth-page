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

  async get_screenshot(options: {
    path?: string;
    name?: string;
    asBytes?: boolean;
    asBase64?: boolean;
    fullPage?: boolean;
    leftTop?: [number, number];
    rightBottom?: [number, number];
  } = {}): Promise<string | Buffer> {
    await this.init();
    const { path, name, asBytes, asBase64, fullPage, leftTop, rightBottom } = options;

    let clip: any = undefined;
    if (leftTop && rightBottom) {
      clip = { x: leftTop[0], y: leftTop[1], width: rightBottom[0] - leftTop[0], height: rightBottom[1] - leftTop[1], scale: 1 };
    } else if (fullPage) {
      const { result } = await this._page!.cdpSession.send<{ result: { value: any } }>("Runtime.evaluate", {
        expression: `({ width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight })`,
        returnByValue: true,
      });
      clip = { x: 0, y: 0, width: result.value.width, height: result.value.height, scale: 1 };
    }

    const { data } = await this._page!.cdpSession.send<{ data: string }>("Page.captureScreenshot", {
      format: "png", clip, captureBeyondViewport: fullPage,
    });
    const buffer = Buffer.from(data, "base64");

    if (asBase64) return data;
    if (asBytes) return buffer;
    if (path || name) {
      const fs = await import("fs");
      const filePath = path ? `${path}/${name || "screenshot.png"}` : name || "screenshot.png";
      fs.writeFileSync(filePath, buffer);
      return filePath;
    }
    return buffer;
  }

  async get_frame_elements(locator?: string): Promise<Element[]> {
    await this.init();
    if (locator) {
      return this.eles(locator);
    }
    return this.eles("iframe, frame");
  }
}
