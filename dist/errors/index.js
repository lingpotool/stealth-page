"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MethodNotFoundError = exports.InvalidHeaderNameError = exports.DownloadError = exports.NetworkError = exports.NavigationError = exports.UnknownError = exports.TargetNotFoundError = exports.CookieFormatError = exports.StorageError = exports.LocatorError = exports.IncorrectURLError = exports.WaitTimeoutError = exports.GetDocumentError = exports.CanNotClickError = exports.NoResourceError = exports.BrowserConnectError = exports.NoRectError = exports.JavaScriptError = exports.PageDisconnectedError = exports.CDPError = exports.ElementLostError = exports.ContextLostError = exports.AlertExistsError = exports.ElementNotFoundError = exports.BaseError = void 0;
const Settings_1 = require("../core/Settings");
class BaseError extends Error {
    constructor(msg, method, args) {
        const defaultMsg = BaseError._getDefaultMsg(new.target.name);
        let message = msg || defaultMsg;
        const parts = [];
        if (method)
            parts.push(`Method: ${method}`);
        if (args && Object.keys(args).length > 0) {
            parts.push(`Arguments: ${Object.entries(args).map(([k, v]) => `${k}=${v}`).join(', ')}`);
        }
        if (parts.length > 0 && !msg) {
            message += '\n' + parts.join('\n');
        }
        super(message);
        this.name = new.target.name;
        this.method = method;
        this.args = args;
    }
    static _getDefaultMsg(className) {
        const key = className.toUpperCase();
        const lang = Settings_1.Settings._lang;
        if (lang && key in lang) {
            return lang[key];
        }
        return className;
    }
}
exports.BaseError = BaseError;
class ElementNotFoundError extends BaseError {
    constructor(locatorOrMethod, args) {
        if (args) {
            super(undefined, locatorOrMethod, args);
        }
        else {
            super(`Element not found with locator: ${locatorOrMethod}`);
        }
    }
}
exports.ElementNotFoundError = ElementNotFoundError;
class AlertExistsError extends BaseError {
}
exports.AlertExistsError = AlertExistsError;
class ContextLostError extends BaseError {
}
exports.ContextLostError = ContextLostError;
class ElementLostError extends BaseError {
}
exports.ElementLostError = ElementLostError;
class CDPError extends BaseError {
}
exports.CDPError = CDPError;
class PageDisconnectedError extends BaseError {
}
exports.PageDisconnectedError = PageDisconnectedError;
class JavaScriptError extends BaseError {
}
exports.JavaScriptError = JavaScriptError;
class NoRectError extends BaseError {
}
exports.NoRectError = NoRectError;
class BrowserConnectError extends BaseError {
}
exports.BrowserConnectError = BrowserConnectError;
class NoResourceError extends BaseError {
}
exports.NoResourceError = NoResourceError;
class CanNotClickError extends BaseError {
}
exports.CanNotClickError = CanNotClickError;
class GetDocumentError extends BaseError {
}
exports.GetDocumentError = GetDocumentError;
class WaitTimeoutError extends BaseError {
}
exports.WaitTimeoutError = WaitTimeoutError;
class IncorrectURLError extends BaseError {
}
exports.IncorrectURLError = IncorrectURLError;
class LocatorError extends BaseError {
}
exports.LocatorError = LocatorError;
class StorageError extends BaseError {
}
exports.StorageError = StorageError;
class CookieFormatError extends BaseError {
}
exports.CookieFormatError = CookieFormatError;
class TargetNotFoundError extends BaseError {
}
exports.TargetNotFoundError = TargetNotFoundError;
class UnknownError extends BaseError {
}
exports.UnknownError = UnknownError;
class NavigationError extends BaseError {
}
exports.NavigationError = NavigationError;
class NetworkError extends BaseError {
}
exports.NetworkError = NetworkError;
class DownloadError extends BaseError {
}
exports.DownloadError = DownloadError;
class InvalidHeaderNameError extends BaseError {
}
exports.InvalidHeaderNameError = InvalidHeaderNameError;
class MethodNotFoundError extends BaseError {
}
exports.MethodNotFoundError = MethodNotFoundError;
