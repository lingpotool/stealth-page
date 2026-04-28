import WebSocket from "ws";
import { CDPSession, CDPEventHandler } from "./CDPSession";

export interface CdpErrorInfo {
  error: string;
  type: string;
  method?: string;
  args?: Record<string, any>;
  data?: any;
}

interface PendingRequest {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}

const DEFAULT_CDP_TIMEOUT = 10;

class ChildCDPSession implements CDPSession {
  private readonly parent: WebSocketCDPSession;
  private readonly sessionId: string;

  constructor(parent: WebSocketCDPSession, sessionId: string) {
    this.parent = parent;
    this.sessionId = sessionId;
  }

  async send<T = any>(method: string, params?: Record<string, any>, timeout?: number): Promise<T> {
    return this.parent.sendToSession<T>(this.sessionId, method, params, timeout);
  }

  async run<T = any>(method: string, params?: Record<string, any>, _ignore?: any[]): Promise<T> {
    return this.parent.runInSession<T>(this.sessionId, method, params, _ignore);
  }

  on(event: string, handler: CDPEventHandler): void {
    this.parent.onSession(this.sessionId, event, handler);
  }

  once(event: string, handler: CDPEventHandler): void {
    const wrapper: CDPEventHandler = (params) => {
      this.off(event, wrapper);
      handler(params);
    };
    this.on(event, wrapper);
  }

  off(event: string, handler: CDPEventHandler): void {
    this.parent.offSession(this.sessionId, event, handler);
  }

  close(): void {
  }

  createChildSession(sessionId: string): CDPSession {
    return new ChildCDPSession(this.parent, sessionId);
  }
}

export class WebSocketCDPSession implements CDPSession {
  private readonly ws: WebSocket;
  private nextId = 0;
  private readonly pending = new Map<number, PendingRequest>();
  private readonly eventHandlers = new Map<string, Set<CDPEventHandler>>();
  private readonly sessionEventHandlers = new Map<string, Map<string, Set<CDPEventHandler>>>();
  private readonly immediateEventHandlers = new Map<string, CDPEventHandler>();
  private readonly immediateEventQueue: Array<{ method: string; params: any }> = [];
  owner?: any;
  alert_flag: boolean = false;

  private constructor(ws: WebSocket) {
    this.ws = ws;
    this.ws.on("message", this.handleMessage);
    this.ws.on("error", this.handleError);
    this.ws.on("close", this.handleClose);
    this._initAlertListeners();
  }

  private _initAlertListeners(): void {
    this.on("Page.javascriptDialogOpening", () => {
      this.alert_flag = true;
    });
    this.on("Page.javascriptDialogClosed", () => {
      this.alert_flag = false;
    });
  }

  static async connect(url: string): Promise<WebSocketCDPSession> {
    return new Promise<WebSocketCDPSession>((resolve, reject) => {
      const ws = new WebSocket(url);

      const onError = (err: Error) => {
        ws.removeAllListeners();
        reject(err);
      };

      ws.once("open", () => {
        ws.off("error", onError);
        resolve(new WebSocketCDPSession(ws));
      });

      ws.once("error", onError);
    });
  }

  set_callback(event: string, callback: CDPEventHandler, immediate: boolean = false): void {
    if (immediate) {
      this.immediateEventHandlers.set(event, callback);
    } else {
      this.on(event, callback);
    }
  }

  async send<T = any>(method: string, params?: Record<string, any>, timeout?: number): Promise<T> {
    if (this.alert_flag && (method.startsWith("Input.") || method.startsWith("Runtime."))) {
      const errorInfo: CdpErrorInfo = { error: "alert exists.", type: "alert_exists", method, args: params };
      throw errorInfo;
    }

    const id = ++this.nextId;
    const message = JSON.stringify({ id, method, params });
    const timeoutMs = (timeout !== undefined ? timeout : DEFAULT_CDP_TIMEOUT) * 1000;

    const sendPromise = new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(message, (err?: Error) => {
        if (err) {
          this.pending.delete(id);
          reject(err);
        }
      });
    });

    const timeoutPromise = new Promise<T>((_resolve, reject) => {
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          const errorInfo: CdpErrorInfo = { error: "timeout", type: "timeout", method, args: params };
          reject(errorInfo);
        }
      }, timeoutMs);
    });

    return Promise.race([sendPromise, timeoutPromise]);
  }

  async sendToSession<T = any>(sessionId: string, method: string, params?: Record<string, any>, timeout?: number): Promise<T> {
    if (this.alert_flag && (method.startsWith("Input.") || method.startsWith("Runtime."))) {
      const errorInfo: CdpErrorInfo = { error: "alert exists.", type: "alert_exists", method, args: params };
      throw errorInfo;
    }

    const id = ++this.nextId;
    const message = JSON.stringify({ id, method, params, sessionId });
    const timeoutMs = (timeout !== undefined ? timeout : DEFAULT_CDP_TIMEOUT) * 1000;

    const sendPromise = new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(message, (err?: Error) => {
        if (err) {
          this.pending.delete(id);
          reject(err);
        }
      });
    });

    const timeoutPromise = new Promise<T>((_resolve, reject) => {
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          const errorInfo: CdpErrorInfo = { error: "timeout", type: "timeout", method, args: params };
          reject(errorInfo);
        }
      }, timeoutMs);
    });

    return Promise.race([sendPromise, timeoutPromise]);
  }

  async run<T = any>(method: string, params?: Record<string, any>, _ignore: any[] = []): Promise<T> {
    try {
      return await this.send<T>(method, params);
    } catch (e: any) {
      if (this._shouldIgnore(e, _ignore)) {
        return undefined as T;
      }
      throw e;
    }
  }

  async runInSession<T = any>(sessionId: string, method: string, params?: Record<string, any>, _ignore: any[] = []): Promise<T> {
    try {
      return await this.sendToSession<T>(sessionId, method, params);
    } catch (e: any) {
      if (this._shouldIgnore(e, _ignore)) {
        return undefined as T;
      }
      throw e;
    }
  }

  private _shouldIgnore(error: any, _ignore: any[]): boolean {
    if (!_ignore || _ignore.length === 0) return false;
    const errorType = error?.type || '';
    const errorMsg = error?.error || (error?.message || '');
    for (const ignoreClass of _ignore) {
      if (typeof ignoreClass === 'function') {
        const className = ignoreClass.name;
        if (error instanceof ignoreClass) return true;
        if (errorType === 'alert_exists' && className === 'AlertExistsError') return true;
        if (errorType === 'timeout' && className === 'WaitTimeoutError') return true;
        if (errorType === 'cdp_error') {
          const errorMappings: Record<string, string> = {
            'Cannot find context': 'ContextLostError',
            'Could not find node': 'ElementLostError',
            'connection disconnected': 'PageDisconnectedError',
            'alert exists': 'AlertExistsError',
            'Node does not have layout': 'NoRectError',
            'Cannot navigate to invalid URL': 'IncorrectURLError',
            'Frame corresponds to opaque origin': 'StorageError',
            'Sanitizing cookie failed': 'CookieFormatError',
            'Given expression does not evaluate to a function': 'JavaScriptError',
          };
          for (const [pattern, mappedClass] of Object.entries(errorMappings)) {
            if (errorMsg.includes(pattern) && className === mappedClass) return true;
          }
          if (className === 'CDPError') return true;
        }
      }
    }
    return false;
  }

  on(event: string, handler: CDPEventHandler): void {
    let set = this.eventHandlers.get(event);
    if (!set) {
      set = new Set();
      this.eventHandlers.set(event, set);
    }
    set.add(handler);
  }

  once(event: string, handler: CDPEventHandler): void {
    const wrapper: CDPEventHandler = (params) => {
      this.off(event, wrapper);
      handler(params);
    };
    this.on(event, wrapper);
  }

  off(event: string, handler: CDPEventHandler): void {
    const set = this.eventHandlers.get(event);
    if (!set) {
      return;
    }
    set.delete(handler);
    if (set.size === 0) {
      this.eventHandlers.delete(event);
    }
  }

  onSession(sessionId: string, event: string, handler: CDPEventHandler): void {
    let sessionMap = this.sessionEventHandlers.get(sessionId);
    if (!sessionMap) {
      sessionMap = new Map();
      this.sessionEventHandlers.set(sessionId, sessionMap);
    }
    let set = sessionMap.get(event);
    if (!set) {
      set = new Set();
      sessionMap.set(event, set);
    }
    set.add(handler);
  }

  offSession(sessionId: string, event: string, handler: CDPEventHandler): void {
    const sessionMap = this.sessionEventHandlers.get(sessionId);
    if (!sessionMap) return;
    const set = sessionMap.get(event);
    if (!set) return;
    set.delete(handler);
    if (set.size === 0) {
      sessionMap.delete(event);
    }
    if (sessionMap.size === 0) {
      this.sessionEventHandlers.delete(sessionId);
    }
  }

  createChildSession(sessionId: string): CDPSession {
    return new ChildCDPSession(this, sessionId);
  }

  close(): void {
    this.ws.close();
  }

  private handleMessage = (data: WebSocket.RawData) => {
    let msg: any;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      return;
    }

    if (typeof msg.id === "number") {
      const pending = this.pending.get(msg.id);
      if (!pending) {
        return;
      }
      this.pending.delete(msg.id);
      if (msg.error) {
        const errorInfo: CdpErrorInfo = {
          error: msg.error.message || "CDP error",
          type: "cdp_error",
          data: msg.error,
        };
        pending.reject(errorInfo);
      } else {
        pending.resolve(msg.result);
      }
      return;
    }

    if (msg.method) {
      const immediateHandler = this.immediateEventHandlers.get(msg.method);
      if (immediateHandler) {
        try {
          immediateHandler(msg.params);
        } catch {
        }
        this.immediateEventQueue.push({ method: msg.method, params: msg.params });
      }

      if (msg.sessionId) {
        const sessionMap = this.sessionEventHandlers.get(msg.sessionId);
        if (sessionMap) {
          const handlers = sessionMap.get(msg.method);
          if (handlers) {
            for (const handler of handlers) {
              try {
                handler(msg.params);
              } catch {
              }
            }
          }
        }
      }
      
      const handlers = this.eventHandlers.get(msg.method);
      if (handlers) {
        for (const handler of handlers) {
          try {
            handler(msg.params);
          } catch {
          }
        }
      }
    }
  };

  private handleError = (err: Error) => {
    for (const [id, pending] of this.pending) {
      pending.reject(err);
      this.pending.delete(id);
    }
  };

  private handleClose = () => {
    if (this.owner && typeof this.owner._on_disconnect === 'function') {
      try {
        this.owner._on_disconnect();
      } catch {
      }
    }
    const err = new Error("CDP WebSocket closed");
    for (const [id, pending] of this.pending) {
      pending.reject(err);
      this.pending.delete(id);
    }
  };
}

export class BrowserDriver {
  private static readonly BROWSERS = new Map<string, BrowserDriver>();
  readonly id: string;
  readonly address: string;
  owner?: any;
  readonly session: WebSocketCDPSession;

  private constructor(id: string, address: string, session: WebSocketCDPSession) {
    this.id = id;
    this.address = address;
    this.session = session;
  }

  static async get(id: string, address: string, owner?: any): Promise<BrowserDriver> {
    const existing = BrowserDriver.BROWSERS.get(id);
    if (existing) {
      if (owner !== undefined) {
        existing.owner = owner;
        existing.session.owner = owner;
      }
      return existing;
    }

    const session = await WebSocketCDPSession.connect(address);
    const driver = new BrowserDriver(id, address, session);
    if (owner !== undefined) {
      driver.owner = owner;
      session.owner = owner;
    }
    BrowserDriver.BROWSERS.set(id, driver);
    return driver;
  }

  static has(id: string): boolean {
    return BrowserDriver.BROWSERS.has(id);
  }

  static remove(id: string): void {
    const driver = BrowserDriver.BROWSERS.get(id);
    if (driver) {
      driver.session.close();
      BrowserDriver.BROWSERS.delete(id);
    }
  }

  async send<T = any>(method: string, params?: Record<string, any>, timeout?: number): Promise<T> {
    return this.session.send<T>(method, params, timeout);
  }

  async run<T = any>(method: string, params?: Record<string, any>, _ignore: any[] = []): Promise<T> {
    return this.session.run<T>(method, params, _ignore);
  }

  set_callback(event: string, callback: CDPEventHandler, immediate: boolean = false): void {
    this.session.set_callback(event, callback, immediate);
  }

  close(): void {
    BrowserDriver.remove(this.id);
  }
}
