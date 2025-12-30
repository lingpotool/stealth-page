import { Chromium } from "../chromium/Chromium";

/**
 * 浏览器等待类
 * 对应 DrissionPage.BrowserWaiter
 */
export class BrowserWaiter {
  private readonly _browser: Chromium;

  constructor(browser: Chromium) {
    this._browser = browser;
  }

  /**
   * 等待若干秒
   */
  async wait(second: number, scope?: number): Promise<Chromium> {
    const waitTime = scope !== undefined
      ? second + Math.random() * (scope - second)
      : second;
    await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
    return this._browser;
  }

  /**
   * 等待新标签页出现
   */
  async new_tab(timeout?: number, currTab?: string): Promise<string | false> {
    const timeoutMs = (timeout ?? this._browser.options.timeouts.base) * 1000;
    const startTime = Date.now();
    
    // 获取当前标签页列表
    const initialTabs = await this._browser.get_tabs();
    const initialIds = new Set(initialTabs.map(t => t.id));
    
    // 如果指定了当前标签页，确保它在列表中
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

    return false;
  }

  /**
   * 等待浏览器下载开始
   */
  async download_begin(timeout?: number, cancelIt: boolean = false): Promise<any | false> {
    // 这需要监听 Browser.downloadWillBegin 事件
    // 简化实现
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
      
      // 启用下载事件
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

  /**
   * 等待所有下载任务结束
   */
  async downloads_done(timeout?: number, cancelIfTimeout: boolean = true): Promise<boolean> {
    // 简化实现：等待一段时间
    const timeoutMs = timeout ? timeout * 1000 : Infinity;
    const startTime = Date.now();
    
    // 这里需要跟踪所有下载任务的状态
    // 简化版本只是等待
    while (Date.now() - startTime < timeoutMs) {
      // 检查是否有活动的下载
      // 由于 CDP 没有直接的方法获取下载列表，这里简化处理
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 假设没有活动下载
      return true;
    }
    
    return !cancelIfTimeout;
  }
}
