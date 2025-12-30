"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DownloadError = exports.NetworkError = exports.LocatorError = exports.NavigationError = exports.TimeoutError = exports.ElementNotFoundError = exports.BrowserConnectError = void 0;
class BrowserConnectError extends Error {
    constructor(message) {
        super(message);
        this.name = "BrowserConnectError";
    }
}
exports.BrowserConnectError = BrowserConnectError;
class ElementNotFoundError extends Error {
    constructor(locator) {
        super(`Element not found with locator: ${locator}`);
        this.name = "ElementNotFoundError";
    }
}
exports.ElementNotFoundError = ElementNotFoundError;
class TimeoutError extends Error {
    constructor(message) {
        super(message);
        this.name = "TimeoutError";
    }
}
exports.TimeoutError = TimeoutError;
class NavigationError extends Error {
    constructor(message) {
        super(message);
        this.name = "NavigationError";
    }
}
exports.NavigationError = NavigationError;
class LocatorError extends Error {
    constructor(message) {
        super(message);
        this.name = "LocatorError";
    }
}
exports.LocatorError = LocatorError;
class NetworkError extends Error {
    constructor(message) {
        super(message);
        this.name = "NetworkError";
    }
}
exports.NetworkError = NetworkError;
class DownloadError extends Error {
    constructor(message) {
        super(message);
        this.name = "DownloadError";
    }
}
exports.DownloadError = DownloadError;
