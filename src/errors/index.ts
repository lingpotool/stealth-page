export class BrowserConnectError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BrowserConnectError";
  }
}

export class ElementNotFoundError extends Error {
  constructor(locator: string) {
    super(`Element not found with locator: ${locator}`);
    this.name = "ElementNotFoundError";
  }
}

export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TimeoutError";
  }
}

export class NavigationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NavigationError";
  }
}

export class LocatorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LocatorError";
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

export class DownloadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DownloadError";
  }
}
