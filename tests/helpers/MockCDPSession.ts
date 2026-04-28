import { vi } from 'vitest';
import { CDPSession } from '../src/core/CDPSession';

export class MockCDPSession implements CDPSession {
  private _responses = new Map<string, any>();
  private _eventHandlers = new Map<string, Set<(params: any) => void>>();
  private _sentMessages: Array<{ method: string; params?: Record<string, any> }> = [];

  setResponse(method: string, response: any): void {
    this._responses.set(method, response);
  }

  setResponseFn(method: string, fn: (params?: Record<string, any>) => any): void {
    this._responses.set(method, fn);
  }

  getSentMessages(): Array<{ method: string; params?: Record<string, any> }> {
    return this._sentMessages;
  }

  getLastMessage(method: string): { method: string; params?: Record<string, any> } | undefined {
    return [...this._sentMessages].reverse().find(m => m.method === method);
  }

  async send<T = any>(method: string, params?: Record<string, any>): Promise<T> {
    this._sentMessages.push({ method, params });
    const response = this._responses.get(method);
    if (response === undefined) {
      return {} as T;
    }
    if (typeof response === 'function') {
      return response(params) as T;
    }
    return response as T;
  }

  on(event: string, handler: (params: any) => void): void {
    let set = this._eventHandlers.get(event);
    if (!set) {
      set = new Set();
      this._eventHandlers.set(event, set);
    }
    set.add(handler);
  }

  once(event: string, handler: (params: any) => void): void {
    const wrapper = (params: any) => {
      this.off(event, wrapper);
      handler(params);
    };
    this.on(event, wrapper);
  }

  off(event: string, handler: (params: any) => void): void {
    const set = this._eventHandlers.get(event);
    if (set) {
      set.delete(handler);
    }
  }

  emit(event: string, params: any): void {
    const set = this._eventHandlers.get(event);
    if (set) {
      for (const handler of set) {
        handler(params);
      }
    }
  }

  close(): void {}
  createChildSession?(sessionId: string): CDPSession {
    return this;
  }

  reset(): void {
    this._responses.clear();
    this._eventHandlers.clear();
    this._sentMessages = [];
  }
}
