import WebSocket from "ws";
import { CDPSession, CDPEventHandler } from "./CDPSession";

interface PendingRequest {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}

/**
 * 子会话，用于 flatten 模式下与特定 target 通信
 */
class ChildCDPSession implements CDPSession {
  private readonly parent: WebSocketCDPSession;
  private readonly sessionId: string;

  constructor(parent: WebSocketCDPSession, sessionId: string) {
    this.parent = parent;
    this.sessionId = sessionId;
  }

  async send<T = any>(method: string, params?: Record<string, any>): Promise<T> {
    return this.parent.sendToSession<T>(this.sessionId, method, params);
  }

  on(event: string, handler: CDPEventHandler): void {
    this.parent.onSession(this.sessionId, event, handler);
  }

  off(event: string, handler: CDPEventHandler): void {
    this.parent.offSession(this.sessionId, event, handler);
  }

  close(): void {
    // 子会话不直接关闭 WebSocket
  }

  createChildSession(sessionId: string): CDPSession {
    return new ChildCDPSession(this.parent, sessionId);
  }
}

/**
 * 通过 WebSocket 实现的 CDP 会话，用于连接 Chrome DevTools 协议。
 */
export class WebSocketCDPSession implements CDPSession {
  private readonly ws: WebSocket;
  private nextId = 0;
  private readonly pending = new Map<number, PendingRequest>();
  private readonly eventHandlers = new Map<string, Set<CDPEventHandler>>();
  // 用于 flatten 模式的子会话事件处理
  private readonly sessionEventHandlers = new Map<string, Map<string, Set<CDPEventHandler>>>();

  private constructor(ws: WebSocket) {
    this.ws = ws;
    this.ws.on("message", this.handleMessage);
    this.ws.on("error", this.handleError);
    this.ws.on("close", this.handleClose);
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

  async send<T = any>(method: string, params?: Record<string, any>): Promise<T> {
    const id = ++this.nextId;
    const message = JSON.stringify({ id, method, params });

    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(message, (err?: Error) => {
        if (err) {
          this.pending.delete(id);
          reject(err);
        }
      });
    });
  }

  /**
   * 向特定 session 发送命令（flatten 模式）
   */
  async sendToSession<T = any>(sessionId: string, method: string, params?: Record<string, any>): Promise<T> {
    const id = ++this.nextId;
    const message = JSON.stringify({ id, method, params, sessionId });

    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(message, (err?: Error) => {
        if (err) {
          this.pending.delete(id);
          reject(err);
        }
      });
    });
  }

  on(event: string, handler: CDPEventHandler): void {
    let set = this.eventHandlers.get(event);
    if (!set) {
      set = new Set();
      this.eventHandlers.set(event, set);
    }
    set.add(handler);
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

  /**
   * 为特定 session 注册事件处理器
   */
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

  /**
   * 移除特定 session 的事件处理器
   */
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

  /**
   * 创建子会话（用于 flatten 模式）
   */
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
        pending.reject(new Error(msg.error.message || "CDP error"));
      } else {
        pending.resolve(msg.result);
      }
      return;
    }

    if (msg.method) {
      // 处理带 sessionId 的事件（flatten 模式）
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
      
      // 也触发全局事件处理器
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
    const err = new Error("CDP WebSocket closed");
    for (const [id, pending] of this.pending) {
      pending.reject(err);
      this.pending.delete(id);
    }
  };
}
