import { CDPSession } from "../core/CDPSession";

export interface ListenerOwner {
  cdpSession: CDPSession;
  tab_id: string;
  _run_cdp(cmd: string, params?: any): Promise<any>;
}

interface ListenTarget {
  method: string;
  handler: (params: any) => void;
}

export class Listener {
  private readonly _owner: ListenerOwner;
  private _listening: boolean = false;
  private _targets: ListenTarget[] = [];
  private _data: any[] = [];
  private _waitResolvers: Array<(data: any) => void> = [];
  private _isolateSession: CDPSession | null = null;

  constructor(owner: ListenerOwner) {
    this._owner = owner;
  }

  get listening(): boolean {
    return this._listening;
  }

  get data(): any[] {
    return this._data;
  }

  private get _session(): CDPSession {
    return this._isolateSession || this._owner.cdpSession;
  }

  listen(targets: string[] = ['*']): void {
    if (this._listening) return;
    this._listening = true;
    this._data = [];

    for (const method of targets) {
      const handler = (params: any) => {
        const item = { method, params, timestamp: Date.now() };
        this._data.push(item);
        for (const resolver of this._waitResolvers) {
          resolver(item);
        }
        this._waitResolvers = [];
      };

      if (method === '*') {
        const defaultMethods = [
          'Network.requestWillBeSent',
          'Network.responseReceived',
          'Network.loadingFailed',
          'Network.requestWillBeSentExtraInfo',
          'Network.responseReceivedExtraInfo',
        ];
        for (const m of defaultMethods) {
          this._session.on(m, handler);
          this._targets.push({ method: m, handler });
        }
      } else {
        this._session.on(method, handler);
        this._targets.push({ method, handler });
      }
    }
  }

  async listen_with_isolate(targets: string[] = ['*']): Promise<void> {
    if (this._listening) return;

    try {
      const { sessionId } = await this._owner._run_cdp('Target.attachToTarget', {
        targetId: this._owner.tab_id,
        flatten: true,
      });

      const originalSession = this._owner.cdpSession;
      this._isolateSession = Object.create(originalSession);
      (this._isolateSession as any)._sessionId = sessionId;
    } catch {
      this._isolateSession = null;
    }

    this.listen(targets);
  }

  stop(): void {
    if (!this._listening) return;
    this._listening = false;
    for (const { method, handler } of this._targets) {
      this._session.off(method, handler);
    }
    this._targets = [];

    if (this._isolateSession) {
      try {
        this._owner._run_cdp('Target.detachFromTarget', {
          sessionId: (this._isolateSession as any)._sessionId,
        }).catch(() => {});
      } catch {}
      this._isolateSession = null;
    }
  }

  wait(timeout: number = 10, method?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const idx = this._waitResolvers.indexOf(resolve);
        if (idx >= 0) this._waitResolvers.splice(idx, 1);
        reject(new Error('Listener wait timeout'));
      }, timeout * 1000);

      const resolver = (data: any) => {
        if (method && data.method !== method) {
          this._waitResolvers.push(resolver);
          return;
        }
        clearTimeout(timer);
        resolve(data);
      };

      this._waitResolvers.push(resolver);
    });
  }

  wait_network(timeout: number = 10, url?: string, method?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const idx = this._waitResolvers.indexOf(resolve);
        if (idx >= 0) this._waitResolvers.splice(idx, 1);
        reject(new Error('Listener wait network timeout'));
      }, timeout * 1000);

      const resolver = (data: any) => {
        if (url && data.params?.request?.url && !data.params.request.url.includes(url)) {
          this._waitResolvers.push(resolver);
          return;
        }
        if (method && data.params?.request?.method && data.params.request.method !== method) {
          this._waitResolvers.push(resolver);
          return;
        }
        clearTimeout(timer);
        resolve(data);
      };

      this._waitResolvers.push(resolver);
    });
  }

  clear(): void {
    this._data = [];
  }

  steps(count: number): any[] {
    return this._data.slice(-count);
  }
}
