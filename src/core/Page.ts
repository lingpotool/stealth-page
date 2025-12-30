import { CDPSession } from "./CDPSession";
import { Element } from "./Element";
import { parseLocator } from "./locator";

export interface NavigationOptions {
  timeoutMs?: number;
  waitUntil?: "load" | "domcontentloaded" | "networkidle0" | "networkidle2";
}

export interface PageInitOptions {
  userAgent?: string;
  viewport?: {
    width: number;
    height: number;
    deviceScaleFactor?: number;
  };
}

// 反检测脚本 - 核心！模仿 DrissionPage 的实现
const STEALTH_SCRIPT = `
// 1. 删除 webdriver 标识
Object.defineProperty(navigator, 'webdriver', {
  get: () => undefined,
  configurable: true
});

// 2. 修复 chrome 对象
if (!window.chrome) {
  window.chrome = {
    runtime: {},
    loadTimes: function() { return {}; },
    csi: function() { return {}; },
    app: { isInstalled: false }
  };
}

// 3. 修复 permissions API
const originalQuery = navigator.permissions.query;
navigator.permissions.query = (params) => {
  if (params.name === 'notifications') {
    return Promise.resolve({ state: Notification.permission });
  }
  return originalQuery.call(navigator.permissions, params);
};

// 4. 修复 plugins - 返回类数组对象
Object.defineProperty(navigator, 'plugins', {
  get: () => {
    const plugins = {
      0: { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format', length: 1 },
      1: { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '', length: 1 },
      2: { name: 'Native Client', filename: 'internal-nacl-plugin', description: '', length: 2 },
      length: 3,
      item: function(i) { return this[i] || null; },
      namedItem: function(name) { 
        for (let i = 0; i < this.length; i++) {
          if (this[i] && this[i].name === name) return this[i];
        }
        return null;
      },
      refresh: function() {}
    };
    Object.setPrototypeOf(plugins, PluginArray.prototype);
    return plugins;
  }
});

// 5. 修复 mimeTypes
Object.defineProperty(navigator, 'mimeTypes', {
  get: () => {
    const mimeTypes = {
      0: { type: 'application/pdf', suffixes: 'pdf', description: 'Portable Document Format' },
      1: { type: 'text/pdf', suffixes: 'pdf', description: 'Portable Document Format' },
      length: 2,
      item: function(i) { return this[i] || null; },
      namedItem: function(name) {
        for (let i = 0; i < this.length; i++) {
          if (this[i] && this[i].type === name) return this[i];
        }
        return null;
      }
    };
    Object.setPrototypeOf(mimeTypes, MimeTypeArray.prototype);
    return mimeTypes;
  }
});

// 6. 设置语言
Object.defineProperty(navigator, 'languages', { get: () => ['zh-CN', 'zh', 'en'] });
Object.defineProperty(navigator, 'language', { get: () => 'zh-CN' });

// 7. 硬件信息
Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 });
Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });
Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 0 });

// 8. 修复 iframe contentWindow
const originalContentWindow = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'contentWindow');
if (originalContentWindow) {
  Object.defineProperty(HTMLIFrameElement.prototype, 'contentWindow', {
    get: function() {
      const win = originalContentWindow.get.call(this);
      if (win) {
        try { 
          Object.defineProperty(win.navigator, 'webdriver', { get: () => undefined });
        } catch(e) {}
      }
      return win;
    }
  });
}

// 9. 删除自动化相关的全局变量
const automationProps = [
  'cdc_adoQpoasnfa76pfcZLmcfl_Array',
  'cdc_adoQpoasnfa76pfcZLmcfl_Promise', 
  'cdc_adoQpoasnfa76pfcZLmcfl_Symbol',
  '__webdriver_evaluate',
  '__selenium_evaluate',
  '__webdriver_script_function',
  '__webdriver_script_func',
  '__webdriver_script_fn',
  '__fxdriver_evaluate',
  '__driver_unwrapped',
  '__webdriver_unwrapped',
  '__driver_evaluate',
  '__selenium_unwrapped',
  '__fxdriver_unwrapped',
  '_Selenium_IDE_Recorder',
  '_selenium',
  'calledSelenium',
  '$chrome_asyncScriptInfo',
  '$cdc_asdjflasutopfhvcZLmcfl_',
  '$wdc_'
];
automationProps.forEach(prop => {
  try { delete window[prop]; } catch(e) {}
});

// 10. 修复 Notification
if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
  Object.defineProperty(Notification, 'permission', { get: () => 'default' });
}
`;

// 默认 User-Agent
const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export class Page {
  private readonly session: CDPSession;

  constructor(session: CDPSession) {
    this.session = session;
  }

  get cdpSession(): CDPSession {
    return this.session;
  }

  async init(options: PageInitOptions = {}): Promise<void> {
    await this.session.send("Page.enable");
    await this.session.send("Runtime.enable");
    await this.session.send("DOM.enable");
    await this.session.send("Network.enable");

    // 注入反检测脚本 - 这是关键！
    await this.session.send("Page.addScriptToEvaluateOnNewDocument", {
      source: STEALTH_SCRIPT
    });

    // 设置 User-Agent
    const userAgent = options.userAgent || DEFAULT_USER_AGENT;
    await this.session.send("Emulation.setUserAgentOverride", {
      userAgent,
      acceptLanguage: 'zh-CN,zh;q=0.9,en;q=0.8',
      platform: 'Win32'
    });

    if (options.viewport) {
      await this.session.send("Emulation.setDeviceMetricsOverride", {
        width: options.viewport.width,
        height: options.viewport.height,
        deviceScaleFactor: options.viewport.deviceScaleFactor ?? 1,
        mobile: false,
      });
    }
  }

  async get(url: string, options: NavigationOptions = {}): Promise<void> {
    const { timeoutMs = 30000, waitUntil = "load" } = options;

    await this.session.send("Page.navigate", { url });

    if (!waitUntil) {
      return;
    }

    const eventName =
      waitUntil === "domcontentloaded"
        ? "Page.domContentEventFired"
        : "Page.loadEventFired";

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error(`Navigation timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      const handler = () => {
        cleanup();
        if (waitUntil === "networkidle0" || waitUntil === "networkidle2") {
          // 简单近似：在 load 后再多等一小段时间
          setTimeout(() => resolve(), 1000);
        } else {
          resolve();
        }
      };

      const cleanup = () => {
        clearTimeout(timer);
        this.session.off(eventName, handler);
      };

      this.session.on(eventName, handler);
    });
  }

  async ele(locator: string): Promise<Element | null> {
    const all = await this.eles(locator);
    return all[0] ?? null;
  }

  // 直接执行 XPath 并返回文本内容（避免 nodeId 失效问题）
  async ele_text(locator: string): Promise<string | null> {
    const parsed = parseLocator(locator);
    
    if (parsed.type === "xpath") {
      const { result } = await this.session.send<{ result: { value: string | null } }>("Runtime.evaluate", {
        expression: `
          (function() {
            const xpath = ${JSON.stringify(parsed.value)};
            const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            const node = result.singleNodeValue;
            return node ? (node.innerText || node.textContent || '') : null;
          })()
        `,
        returnByValue: true,
      });
      return result.value;
    }
    
    // 其他类型使用原有方式
    const ele = await this.ele(locator);
    return ele ? await ele.text() : null;
  }

  // 直接执行 XPath 并返回 HTML
  async ele_html(locator: string): Promise<string | null> {
    const parsed = parseLocator(locator);
    
    if (parsed.type === "xpath") {
      const { result } = await this.session.send<{ result: { value: string | null } }>("Runtime.evaluate", {
        expression: `
          (function() {
            const xpath = ${JSON.stringify(parsed.value)};
            const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            const node = result.singleNodeValue;
            return node ? node.innerHTML : null;
          })()
        `,
        returnByValue: true,
      });
      return result.value;
    }
    
    const ele = await this.ele(locator);
    return ele ? await ele.html : null;
  }

  // 直接执行 XPath 并返回所有元素的文本和属性
  async eles_attrs(locator: string, attrs: string[]): Promise<Array<Record<string, string>>> {
    const parsed = parseLocator(locator);
    
    if (parsed.type === "xpath") {
      const { result } = await this.session.send<{ result: { value: Array<Record<string, string>> } }>("Runtime.evaluate", {
        expression: `
          (function() {
            const xpath = ${JSON.stringify(parsed.value)};
            const attrNames = ${JSON.stringify(attrs)};
            const result = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
            const items = [];
            for (let i = 0; i < result.snapshotLength; i++) {
              const node = result.snapshotItem(i);
              const item = {};
              for (const attr of attrNames) {
                if (attr === 'text') {
                  item[attr] = node.innerText || node.textContent || '';
                } else if (attr === 'html') {
                  item[attr] = node.innerHTML || '';
                } else {
                  item[attr] = node.getAttribute(attr) || '';
                }
              }
              items.push(item);
            }
            return items;
          })()
        `,
        returnByValue: true,
      });
      return result.value;
    }
    
    // 其他类型使用原有方式
    const elements = await this.eles(locator);
    const results: Array<Record<string, string>> = [];
    for (const ele of elements) {
      const item: Record<string, string> = {};
      for (const attr of attrs) {
        if (attr === 'text') {
          item[attr] = await ele.text();
        } else if (attr === 'html') {
          item[attr] = await ele.html;
        } else {
          item[attr] = (await ele.attr(attr)) || '';
        }
      }
      results.push(item);
    }
    return results;
  }

  async eles(locator: string): Promise<Element[]> {
    const parsed = parseLocator(locator);

    // css 选择器：使用 DOM.querySelectorAll
    if (parsed.type === "css") {
      const selector = parsed.value;
      const { root } = await this.session.send<{ root: { nodeId: number } }>(
        "DOM.getDocument",
        { depth: -1 }
      );

      const { nodeIds } = await this.session.send<{ nodeIds: number[] }>(
        "DOM.querySelectorAll",
        { nodeId: root.nodeId, selector }
      );

      // 过滤掉无效的 nodeId (0 或负数)
      return nodeIds
        .filter((nodeId) => nodeId > 0)
        .map((nodeId) => new Element(this.session, { nodeId }));
    }

    // xpath：使用 DOM.performSearch + DOM.getSearchResults
    const query = parsed.value;
    const search = await this.session.send<{
      searchId: string;
      resultCount: number;
    }>("DOM.performSearch", {
      query,
      includeUserAgentShadowDOM: true,
    });

    if (!search || !search.resultCount) {
      return [];
    }

    const { nodeIds } = await this.session.send<{ nodeIds: number[] }>(
      "DOM.getSearchResults",
      {
        searchId: search.searchId,
        fromIndex: 0,
        toIndex: search.resultCount,
      }
    );

    // 过滤掉无效的 nodeId (0 或负数)
    return nodeIds
      .filter((nodeId) => nodeId > 0)
      .map((nodeId) => new Element(this.session, { nodeId }));
  }

  async runJs<T = any>(expression: string): Promise<T> {
    // 如果表达式不包含 return 语句，自动包装
    let wrappedExpression = expression.trim();
    if (!wrappedExpression.startsWith('return ') && 
        !wrappedExpression.includes('\n') && 
        !wrappedExpression.startsWith('(') &&
        !wrappedExpression.startsWith('{')) {
      // 简单表达式，自动添加 return
      wrappedExpression = `return ${wrappedExpression}`;
    }
    
    // 包装成立即执行函数
    const finalExpression = `(function() { ${wrappedExpression} })()`;
    
    const { result } = await this.session.send<{
      result: { value: T };
    }>("Runtime.evaluate", {
      expression: finalExpression,
      returnByValue: true,
    });

    return result.value;
  }

  async html(): Promise<string> {
    const { result } = await this.session.send<{
      result: { value: string };
    }>("Runtime.evaluate", {
      expression: "document.documentElement.outerHTML",
      returnByValue: true,
    });

    return result.value;
  }

  async title(): Promise<string> {
    const { result } = await this.session.send<{
      result: { value: string };
    }>("Runtime.evaluate", {
      expression: "document.title || ''",
      returnByValue: true,
    });

    return result.value;
  }

  async url(): Promise<string> {
    return this.runJs<string>("document.location.href || ''");
  }

  async cookies(): Promise<
    Array<{
      name: string;
      value: string;
      domain: string;
      path: string;
      expires?: number;
      httpOnly?: boolean;
      secure?: boolean;
    }>
  > {
    const currentUrl = await this.url();
    const params = currentUrl ? { urls: [currentUrl] } : {};

    const { cookies } = await this.session.send<{
      cookies: Array<{
        name: string;
        value: string;
        domain: string;
        path: string;
        expires?: number;
        httpOnly?: boolean;
        secure?: boolean;
      }>;
    }>("Network.getCookies", params);

    return cookies;
  }

  async set_cookies(cookies: Array<{ name: string; value: string; domain?: string; path?: string }>): Promise<void> {
    for (const cookie of cookies) {
      await this.session.send("Network.setCookie", {
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path || "/",
      });
    }
  }

  async refresh(): Promise<void> {
    await this.session.send("Page.reload");
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  async back(): Promise<void> {
    await this.session.send("Runtime.evaluate", {
      expression: "window.history.back();",
      returnByValue: true,
    });
  }

  async forward(): Promise<void> {
    await this.session.send("Runtime.evaluate", {
      expression: "window.history.forward();",
      returnByValue: true,
    });
  }

  async scroll_to(x: number, y: number): Promise<void> {
    await this.session.send("Runtime.evaluate", {
      expression: `window.scrollTo(${x}, ${y});`,
    });
  }

  async scroll_to_top(): Promise<void> {
    await this.scroll_to(0, 0);
  }

  async scroll_to_bottom(): Promise<void> {
    await this.session.send("Runtime.evaluate", {
      expression: "window.scrollTo(0, document.body.scrollHeight);",
    });
  }

  async handle_alert(accept: boolean = true, promptText?: string): Promise<void> {
    await this.session.send("Page.handleJavaScriptDialog", {
      accept,
      promptText,
    });
  }

  async screenshot(path?: string): Promise<Buffer> {
    const { data } = await this.session.send<{ data: string }>("Page.captureScreenshot", {
      format: "png",
    });
    const buffer = Buffer.from(data, "base64");
    if (path) {
      const fs = await import("fs");
      fs.writeFileSync(path, buffer);
    }
    return buffer;
  }

  async get_frame(_frameId: string): Promise<Page> {
    // TODO: 实现真正的 frame 切换
    return new Page(this.session);
  }

  async get_frames(): Promise<Array<{ id: string; url: string; name: string }>> {
    const { frameTree } = await this.session.send<{
      frameTree: {
        frame: { id: string; url: string; name?: string };
        childFrames?: Array<{ frame: { id: string; url: string; name?: string } }>;
      };
    }>("Page.getFrameTree");

    const frames: Array<{ id: string; url: string; name: string }> = [
      {
        id: frameTree.frame.id,
        url: frameTree.frame.url,
        name: frameTree.frame.name || "",
      },
    ];

    if (frameTree.childFrames) {
      for (const child of frameTree.childFrames) {
        frames.push({
          id: child.frame.id,
          url: child.frame.url,
          name: child.frame.name || "",
        });
      }
    }

    return frames;
  }

  async stop_loading(): Promise<void> {
    await this.session.send("Page.stopLoading");
  }

  async reload(): Promise<void> {
    await this.session.send("Page.reload");
  }

  async set_geolocation(latitude: number, longitude: number, accuracy: number = 100): Promise<void> {
    await this.session.send("Emulation.setGeolocationOverride", {
      latitude,
      longitude,
      accuracy,
    });
  }

  async clear_geolocation(): Promise<void> {
    await this.session.send("Emulation.clearGeolocationOverride");
  }
}
