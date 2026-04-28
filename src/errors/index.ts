import { Settings } from "../core/Settings";

export class BaseError extends Error {
  method?: string;
  args?: Record<string, any>;

  constructor(msg?: string, method?: string, args?: Record<string, any>) {
    const defaultMsg = BaseError._getDefaultMsg(new.target.name);
    let message = msg || defaultMsg;
    const parts: string[] = [];
    if (method) parts.push(`Method: ${method}`);
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

  private static _getDefaultMsg(className: string): string {
    const key = className.toUpperCase();
    const lang = Settings._lang;
    if (lang && key in lang) {
      return lang[key];
    }
    return className;
  }
}

export class ElementNotFoundError extends BaseError {
  constructor(locatorOrMethod: string, args?: Record<string, any>) {
    if (args) {
      super(undefined, locatorOrMethod, args);
    } else {
      super(`Element not found with locator: ${locatorOrMethod}`);
    }
  }
}

export class AlertExistsError extends BaseError {}
export class ContextLostError extends BaseError {}
export class ElementLostError extends BaseError {}
export class CDPError extends BaseError {}
export class PageDisconnectedError extends BaseError {}
export class JavaScriptError extends BaseError {}
export class NoRectError extends BaseError {}
export class BrowserConnectError extends BaseError {}
export class NoResourceError extends BaseError {}
export class CanNotClickError extends BaseError {}
export class GetDocumentError extends BaseError {}
export class WaitTimeoutError extends BaseError {}
export class IncorrectURLError extends BaseError {}
export class LocatorError extends BaseError {}
export class StorageError extends BaseError {}
export class CookieFormatError extends BaseError {}
export class TargetNotFoundError extends BaseError {}
export class UnknownError extends BaseError {}

export class NavigationError extends BaseError {}
export class NetworkError extends BaseError {}
export class DownloadError extends BaseError {}
export class InvalidHeaderNameError extends BaseError {}
export class MethodNotFoundError extends BaseError {}
