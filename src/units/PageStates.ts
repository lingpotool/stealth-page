import { CDPSession } from "../core/CDPSession";

export interface StatefulPage {
  readonly cdpSession: CDPSession;
}

/**
 * 页面状态检查器，对应 DrissionPage 的 PageStates
 */
export class PageStates {
  private readonly _page: StatefulPage;

  constructor(page: StatefulPage) {
    this._page = page;
  }

  /**
   * 页面是否在加载中
   */
  get is_loading(): Promise<boolean> {
    return this._checkLoading();
  }

  /**
   * 页面是否仍然可用
   */
  get is_alive(): Promise<boolean> {
    return this._checkAlive();
  }

  /**
   * 页面加载状态
   */
  get ready_state(): Promise<string | null> {
    return this._getReadyState();
  }

  /**
   * 是否存在弹窗
   */
  get has_alert(): Promise<boolean> {
    return this._checkAlert();
  }

  private async _checkLoading(): Promise<boolean> {
    try {
      const { result } = await this._page.cdpSession.send<{ result: { value: string } }>("Runtime.evaluate", {
        expression: "document.readyState",
        returnByValue: true,
      });
      return result.value !== "complete";
    } catch {
      return false;
    }
  }

  private async _checkAlive(): Promise<boolean> {
    try {
      await this._page.cdpSession.send("Runtime.evaluate", {
        expression: "1",
      });
      return true;
    } catch {
      return false;
    }
  }

  private async _getReadyState(): Promise<string | null> {
    try {
      const { result } = await this._page.cdpSession.send<{ result: { value: string } }>("Runtime.evaluate", {
        expression: "document.readyState",
        returnByValue: true,
      });
      return result.value;
    } catch {
      return null;
    }
  }

  private async _checkAlert(): Promise<boolean> {
    // CDP 没有直接检查 alert 的方法，这里返回 false
    // 实际实现需要监听 Page.javascriptDialogOpening 事件
    return false;
  }

  /**
   * 浏览器是否无头模式
   */
  get is_headless(): Promise<boolean> {
    return this._checkHeadless();
  }

  /**
   * 浏览器是否接管的
   */
  get is_existed(): Promise<boolean> {
    return this._checkExisted();
  }

  /**
   * 浏览器是否无痕模式
   */
  get is_incognito(): Promise<boolean> {
    return this._checkIncognito();
  }

  private async _checkHeadless(): Promise<boolean> {
    try {
      const { result } = await this._page.cdpSession.send<{ result: { value: boolean } }>("Runtime.evaluate", {
        expression: "navigator.webdriver || /HeadlessChrome/.test(navigator.userAgent)",
        returnByValue: true,
      });
      return result.value;
    } catch {
      return false;
    }
  }

  private async _checkExisted(): Promise<boolean> {
    // 检查是否是接管的浏览器（通常通过配置判断）
    return false;
  }

  private async _checkIncognito(): Promise<boolean> {
    try {
      const { result } = await this._page.cdpSession.send<{ result: { value: boolean } }>("Runtime.evaluate", {
        expression: `(async () => {
          try {
            const fs = await navigator.storage.estimate();
            return fs.quota < 120000000;
          } catch {
            return false;
          }
        })()`,
        returnByValue: true,
        awaitPromise: true,
      });
      return result.value;
    } catch {
      return false;
    }
  }
}
