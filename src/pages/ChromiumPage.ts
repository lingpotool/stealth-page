import { Chromium } from "../chromium/Chromium";
import { ChromiumOptions } from "../config/ChromiumOptions";
import { Element } from "../core/Element";
import { NoneElement } from "../core/NoneElement";
import { ChromiumTab } from "./ChromiumTab";
import { ChromiumBase } from "./ChromiumBase";

export class ChromiumPage extends ChromiumBase {
  constructor(addrOrOpts?: string | Chromium | ChromiumOptions) {
    if (addrOrOpts instanceof Chromium) {
      super(addrOrOpts);
    } else {
      super(new Chromium(addrOrOpts as any));
    }
  }

  get tab_id(): string {
    return this._page?.tab_id || '';
  }

  async init(): Promise<void> {
    if (!this._page) {
      await this._browser.connect();
      this._page = await this._browser.new_page();
    }
  }

  async new_tab(url?: string, options?: { newWindow?: boolean; background?: boolean; newContext?: boolean }): Promise<ChromiumTab> {
    await this.init();
    if (options?.newContext) {
      const tabId = await this._browser.new_tab(url, options);
      const tab = new ChromiumTab(this._browser, tabId);
      await tab.init();
      return tab;
    }
    const { targetId } = await this._browser.cdpSession.send<{ targetId: string }>("Target.createTarget", {
      url: url || "about:blank",
      newWindow: options?.newWindow,
      background: options?.background,
    });
    const tab = new ChromiumTab(this._browser, targetId);
    await tab.init();
    return tab;
  }

  async get_tab(options?: { idOrNum?: string | number; title?: string; url?: string; tabType?: string; asId?: boolean }): Promise<ChromiumTab | string | null> {
    const tabs = await this._browser.get_tabs();
    if (options?.idOrNum !== undefined) {
      if (typeof options.idOrNum === "string") {
        const found = tabs.find(t => t.id === options.idOrNum);
        if (!found) return null;
        if (options.asId) return found.id;
        const tab = new ChromiumTab(this._browser, found.id);
        await tab.init();
        return tab;
      } else {
        const idx = options.idOrNum > 0 ? options.idOrNum - 1 : tabs.length + options.idOrNum;
        const found = tabs[idx];
        if (!found) return null;
        if (options.asId) return found.id;
        const tab = new ChromiumTab(this._browser, found.id);
        await tab.init();
        return tab;
      }
    }
    let filtered = tabs;
    if (options?.title) filtered = filtered.filter(t => t.title.includes(options.title!));
    if (options?.url) filtered = filtered.filter(t => t.url.includes(options.url!));
    if (filtered.length === 0) return null;
    if (options?.asId) return filtered[0].id;
    const tab = new ChromiumTab(this._browser, filtered[0].id);
    await tab.init();
    return tab;
  }

  async close(): Promise<void> {
    if (this._page) {
      try {
        const tabs = await this._browser.get_tabs();
        if (tabs.length > 0) {
          await this._browser.cdpSession.send("Target.closeTarget", { targetId: tabs[0].id });
        }
      } catch {}
    }
  }

  async get_tabs(title?: string, url?: string, tabType?: string, asId?: boolean): Promise<Array<{ id: string; url: string; title: string; type?: string }>> {
    let tabs = await this._browser.get_tabs(title, url);
    if (tabType) {
      tabs = tabs.filter(t => t.type === tabType);
    }
    return tabs;
  }

  async get_tab_ids(title?: string, url?: string, tabType?: string): Promise<string[]> {
    const tabs = await this.get_tabs(title, url, tabType);
    return tabs.map(t => t.id);
  }

  async activate_tab(tabIdOrIndex: string | number): Promise<void> {
    return this._browser.activate_tab(tabIdOrIndex);
  }

  async close_tab(tabId?: string): Promise<void> {
    if (tabId) return this._browser.close_tab(tabId);
    return this.close();
  }

  get tabs_count(): Promise<number> {
    return this._browser.get_tabs().then(tabs => tabs.length);
  }

  get tab_ids(): Promise<string[]> {
    return this._browser.get_tabs().then(tabs => tabs.map(t => t.id));
  }

  async quit(options?: { timeout?: number; force?: boolean; delData?: boolean }): Promise<void> {
    return this._browser.quit(options);
  }

  get address(): string {
    return this._browser.options.address;
  }

  async browser_version(): Promise<string> {
    return this._browser.version();
  }

  async latest_tab(): Promise<ChromiumTab | null> {
    const tabs = await this.get_tabs();
    if (tabs.length === 0) return null;
    const lastTab = tabs[tabs.length - 1];
    const tab = new ChromiumTab(this._browser, lastTab.id);
    await tab.init();
    return tab;
  }

  async close_tabs(tabIds: string | string[], others: boolean = false): Promise<void> {
    const ids = Array.isArray(tabIds) ? tabIds : [tabIds];
    const allTabs = await this.get_tabs();
    if (others) {
      for (const tab of allTabs) {
        if (!ids.includes(tab.id)) await this._browser.close_tab(tab.id);
      }
    } else {
      for (const id of ids) await this._browser.close_tab(id);
    }
  }

  async process_id(): Promise<number | null> {
    try {
      const { processId } = await this._browser.cdpSession.send<{ processId: number }>("SystemInfo.getProcessInfo");
      return processId;
    } catch {
      return null;
    }
  }

  _on_disconnect(): void {
    this._page = null;
  }
}
