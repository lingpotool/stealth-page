import { CDPSession } from "./CDPSession";
import { Page } from "./Page";
import { DownloadManager } from "./DownloadManager";

export interface BrowserOptions {
  userAgent?: string;
  viewport?: {
    width: number;
    height: number;
    deviceScaleFactor?: number;
  };
}

export class Browser {
  private readonly session: CDPSession;
  private readonly options: BrowserOptions;
  private closed = false;

  readonly _drivers: Map<string, CDPSession> = new Map();
  readonly _all_drivers: Map<string, CDPSession> = new Map();
  readonly _frames: Map<string, string> = new Map();
  readonly _relation: Map<string, string> = new Map();
  readonly _dl_mgr: DownloadManager;
  private _targetListenersInitialized = false;

  private constructor(session: CDPSession, options: BrowserOptions = {}) {
    this.session = session;
    this.options = options;
    this._dl_mgr = new DownloadManager(this as any);
  }

  static async attach(session: CDPSession, options: BrowserOptions = {}): Promise<Browser> {
    const browser = new Browser(session, options);
    browser._initTargetListeners();
    return browser;
  }

  private _initTargetListeners(): void {
    if (this._targetListenersInitialized) return;
    this._targetListenersInitialized = true;

    this.session.on("Target.targetCreated", (params: any) => {
      const targetInfo = params.targetInfo;
      if (!targetInfo) return;

      const targetId = targetInfo.targetId;
      const type = targetInfo.type;

      if (type === 'page' || type === 'webview' || type === 'iframe' || type === 'other') {
        if (targetInfo.openerId) {
          this._relation.set(targetId, targetInfo.openerId);
        }
      }
    });

    this.session.on("Target.targetDestroyed", (params: any) => {
      const targetId = params.targetId;
      if (targetId) {
        this._drivers.delete(targetId);
        this._all_drivers.delete(targetId);
        this._relation.delete(targetId);

        const framesToDelete: string[] = [];
        for (const [frameId, parentId] of this._frames) {
          if (parentId === targetId) {
            framesToDelete.push(frameId);
          }
        }
        for (const frameId of framesToDelete) {
          this._frames.delete(frameId);
        }
      }
    });

    this.session.on("Target.targetInfoChanged", (params: any) => {
      const targetInfo = params.targetInfo;
      if (!targetInfo) return;

      const targetId = targetInfo.targetId;
      if (targetInfo.openerId) {
        this._relation.set(targetId, targetInfo.openerId);
      } else {
        this._relation.delete(targetId);
      }
    });
  }

  async get_driver(targetId: string): Promise<CDPSession> {
    const existing = this._drivers.get(targetId);
    if (existing) return existing;

    const result = await this.session.send("Target.attachToTarget", { targetId, flatten: true });
    const sessionId = result.sessionId;
    const childSession = this.session.createChildSession
      ? this.session.createChildSession(sessionId)
      : this.session;

    this._drivers.set(targetId, childSession);
    this._all_drivers.set(targetId, childSession);

    return childSession;
  }

  async newPage(): Promise<Page> {
    if (this.closed) {
      throw new Error("Browser is already closed.");
    }
    const page = new Page(this.session);
    await page.init(this.options);
    return page;
  }

  async close(): Promise<void> {
    if (this.closed) {
      return;
    }
    this.closed = true;
    try {
      await this.session.send("Browser.close");
    } catch {
    }
  }
}
