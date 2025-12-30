import { Chromium } from "../chromium/Chromium";
import { WindowSetter } from "./WindowSetter";
import { BrowserCookiesSetter } from "./BrowserCookiesSetter";
import { LoadMode } from "./LoadMode";

/**
 * 浏览器设置类
 * 对应 DrissionPage.BrowserSetter
 */
export class BrowserSetter {
  private readonly _browser: Chromium;
  private _cookiesSetter: BrowserCookiesSetter | null = null;
  private _windowSetter: WindowSetter | null = null;
  private _loadMode: LoadMode | null = null;

  constructor(browser: Chromium) {
    this._browser = browser;
  }

  /**
   * 返回用于设置 cookies 的对象
   */
  get cookies(): BrowserCookiesSetter {
    if (!this._cookiesSetter) {
      this._cookiesSetter = new BrowserCookiesSetter(this._browser);
    }
    return this._cookiesSetter;
  }

  /**
   * 返回用于设置窗口的对象
   */
  get window(): WindowSetter {
    if (!this._windowSetter) {
      this._windowSetter = new WindowSetter({ cdpSession: this._browser.cdpSession });
    }
    return this._windowSetter;
  }

  /**
   * 返回用于设置页面加载模式的对象
   */
  get load_mode(): LoadMode {
    if (!this._loadMode) {
      this._loadMode = new LoadMode(this._browser.cdpSession);
    }
    return this._loadMode;
  }

  /**
   * 设置超时时间
   */
  timeouts(base?: number, pageLoad?: number, script?: number): void {
    if (base !== undefined) {
      this._browser.options.timeouts.base = base;
    }
    if (pageLoad !== undefined) {
      this._browser.options.timeouts.pageLoad = pageLoad;
    }
    if (script !== undefined) {
      this._browser.options.timeouts.script = script;
    }
  }

  /**
   * 设置是否自动处理弹窗
   */
  auto_handle_alert(onOff: boolean = true, accept: boolean = true): void {
    (this._browser.options as any).autoHandleAlert = onOff;
    (this._browser.options as any).alertAccept = accept;
  }

  /**
   * 设置下载路径
   */
  download_path(path: string | null): void {
    if (path !== null) {
      this._browser.options.downloadPath = path;
    }
  }

  /**
   * 设置下一个被下载文件的名称
   */
  download_file_name(name?: string, suffix?: string): void {
    (this._browser.options as any).nextDownloadName = name;
    (this._browser.options as any).nextDownloadSuffix = suffix;
  }

  /**
   * 设置当存在同名文件时的处理方式
   */
  when_download_file_exists(mode: "skip" | "rename" | "overwrite" | "s" | "r" | "o"): void {
    const modeMap: Record<string, string> = {
      s: "skip",
      r: "rename",
      o: "overwrite",
    };
    (this._browser.options as any).downloadFileExists = modeMap[mode] || mode;
  }

  /**
   * 设置重试次数
   */
  retry_times(times: number): void {
    (this._browser.options as any).retryTimes = times;
  }

  /**
   * 设置重试间隔
   */
  retry_interval(interval: number): void {
    (this._browser.options as any).retryInterval = interval;
  }

  /**
   * 设置空元素返回值
   */
  NoneElement_value(value: any = null, onOff: boolean = true): void {
    (this._browser.options as any).noneElementValue = onOff ? value : undefined;
    (this._browser.options as any).noneElementEnabled = onOff;
  }
}
