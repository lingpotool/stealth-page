export declare class BaseError extends Error {
    method?: string;
    args?: Record<string, any>;
    constructor(msg?: string, method?: string, args?: Record<string, any>);
    private static _getDefaultMsg;
}
export declare class ElementNotFoundError extends BaseError {
    constructor(locatorOrMethod: string, args?: Record<string, any>);
}
export declare class AlertExistsError extends BaseError {
}
export declare class ContextLostError extends BaseError {
}
export declare class ElementLostError extends BaseError {
}
export declare class CDPError extends BaseError {
}
export declare class PageDisconnectedError extends BaseError {
}
export declare class JavaScriptError extends BaseError {
}
export declare class NoRectError extends BaseError {
}
export declare class BrowserConnectError extends BaseError {
}
export declare class NoResourceError extends BaseError {
}
export declare class CanNotClickError extends BaseError {
}
export declare class GetDocumentError extends BaseError {
}
export declare class WaitTimeoutError extends BaseError {
}
export declare class IncorrectURLError extends BaseError {
}
export declare class LocatorError extends BaseError {
}
export declare class StorageError extends BaseError {
}
export declare class CookieFormatError extends BaseError {
}
export declare class TargetNotFoundError extends BaseError {
}
export declare class UnknownError extends BaseError {
}
export declare class NavigationError extends BaseError {
}
export declare class NetworkError extends BaseError {
}
export declare class DownloadError extends BaseError {
}
export declare class InvalidHeaderNameError extends BaseError {
}
export declare class MethodNotFoundError extends BaseError {
}
