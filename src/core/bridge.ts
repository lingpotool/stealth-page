import { Chromium } from "../chromium/Chromium";
import { ChromiumOptions } from "../config/ChromiumOptions";

export async function from_selenium(driver: any): Promise<Chromium> {
  const wsUrl = driver?.executor_?._wsUrl
    || driver?.executor_?._w3cCaps?.alwaysMatch?.['goog:chromeOptions']?.debuggerAddress
    || null;

  if (!wsUrl) {
    try {
      const caps = await driver.getCapabilities();
      const debuggerAddress = caps?.get('goog:chromeOptions')?.debuggerAddress;
      if (debuggerAddress) {
        const options = new ChromiumOptions();
        options.address = debuggerAddress;
        const chromium = new Chromium(options);
        await chromium.connect();
        return chromium;
      }
    } catch {}
    throw new Error('Cannot get WebSocket URL or debugger address from Selenium driver.');
  }

  const options = new ChromiumOptions();
  if (wsUrl.startsWith('ws://')) {
    const url = new URL(wsUrl);
    options.address = `${url.hostname}:${url.port}`;
  } else {
    options.address = wsUrl;
  }

  const chromium = new Chromium(options);
  await chromium.connect();
  return chromium;
}

export async function from_playwright(browserOrPage: any): Promise<Chromium> {
  let wsEndpoint: string | null = null;

  if (browserOrPage?._connection) {
    wsEndpoint = browserOrPage._connection._url;
  } else if (browserOrPage?.context?.browser?._connection) {
    wsEndpoint = browserOrPage.context.browser._connection._url;
  } else if (typeof browserOrPage?.newPage === 'function') {
    try {
      const context = browserOrPage.context();
      if (context?._browser?._connection) {
        wsEndpoint = context._browser._connection._url;
      }
    } catch {}
  }

  if (!wsEndpoint) {
    throw new Error('Cannot get WebSocket endpoint from Playwright browser or page.');
  }

  const url = new URL(wsEndpoint);
  const options = new ChromiumOptions();
  options.address = `${url.hostname}:${url.port}`;

  const chromium = new Chromium(options);
  await chromium.connect();
  return chromium;
}
