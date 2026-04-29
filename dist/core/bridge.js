"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.from_selenium = from_selenium;
exports.from_playwright = from_playwright;
const Chromium_1 = require("../chromium/Chromium");
const ChromiumOptions_1 = require("../config/ChromiumOptions");
async function from_selenium(driver) {
    const wsUrl = driver?.executor_?._wsUrl
        || driver?.executor_?._w3cCaps?.alwaysMatch?.['goog:chromeOptions']?.debuggerAddress
        || null;
    if (!wsUrl) {
        try {
            const caps = await driver.getCapabilities();
            const debuggerAddress = caps?.get('goog:chromeOptions')?.debuggerAddress;
            if (debuggerAddress) {
                const options = new ChromiumOptions_1.ChromiumOptions();
                options.address = debuggerAddress;
                const chromium = new Chromium_1.Chromium(options);
                await chromium.connect();
                return chromium;
            }
        }
        catch { }
        throw new Error('Cannot get WebSocket URL or debugger address from Selenium driver.');
    }
    const options = new ChromiumOptions_1.ChromiumOptions();
    if (wsUrl.startsWith('ws://')) {
        const url = new URL(wsUrl);
        options.address = `${url.hostname}:${url.port}`;
    }
    else {
        options.address = wsUrl;
    }
    const chromium = new Chromium_1.Chromium(options);
    await chromium.connect();
    return chromium;
}
async function from_playwright(browserOrPage) {
    let wsEndpoint = null;
    if (browserOrPage?._connection) {
        wsEndpoint = browserOrPage._connection._url;
    }
    else if (browserOrPage?.context?.browser?._connection) {
        wsEndpoint = browserOrPage.context.browser._connection._url;
    }
    else if (typeof browserOrPage?.newPage === 'function') {
        try {
            const context = browserOrPage.context();
            if (context?._browser?._connection) {
                wsEndpoint = context._browser._connection._url;
            }
        }
        catch { }
    }
    if (!wsEndpoint) {
        throw new Error('Cannot get WebSocket endpoint from Playwright browser or page.');
    }
    const url = new URL(wsEndpoint);
    const options = new ChromiumOptions_1.ChromiumOptions();
    options.address = `${url.hostname}:${url.port}`;
    const chromium = new Chromium_1.Chromium(options);
    await chromium.connect();
    return chromium;
}
