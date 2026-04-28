import { CDPSession } from "../core/CDPSession";
import { Settings } from "../core/Settings";

function shouldRaise(raiseErr?: boolean | null): boolean {
  if (raiseErr === true) return true;
  if (raiseErr === false) return false;
  return Settings.raise_when_wait_failed;
}

export interface WaitableElement {
  readonly session: CDPSession;
  readonly nodeId: number;
  getObjectId(): Promise<string>;
  is_displayed(): Promise<boolean>;
  is_enabled(): Promise<boolean>;
  is_covered?(): Promise<number | false>;
  get_rect(): Promise<{ x: number; y: number; width: number; height: number }>;
}

export class ElementWaiter {
  private readonly _ele: WaitableElement;
  private readonly _defaultTimeout: number;

  constructor(ele: WaitableElement, defaultTimeout: number = 10000) {
    this._ele = ele;
    this._defaultTimeout = defaultTimeout;
  }

  async __call__(second: number, scope?: number): Promise<WaitableElement> {
    const ms = scope !== undefined
      ? (second + Math.random() * (scope - second)) * 1000
      : second * 1000;
    await new Promise(resolve => setTimeout(resolve, ms));
    return this._ele;
  }

  async deleted(timeout?: number, raiseErr?: boolean | null): Promise<WaitableElement | false> {
    return this._waitState('is_alive', false, timeout, raiseErr);
  }

  async displayed(timeout?: number, raiseErr?: boolean | null): Promise<WaitableElement | false> {
    return this._waitState('is_displayed', true, timeout, raiseErr);
  }

  async hidden(timeout?: number, raiseErr?: boolean | null): Promise<WaitableElement | false> {
    return this._waitState('is_displayed', false, timeout, raiseErr);
  }

  async covered(timeout?: number, raiseErr?: boolean | null): Promise<WaitableElement | false> {
    return this._waitState('is_covered', true, timeout, raiseErr);
  }

  async not_covered(timeout?: number, raiseErr?: boolean | null): Promise<WaitableElement | false> {
    return this._waitState('is_covered', false, timeout, raiseErr);
  }

  async enabled(timeout?: number, raiseErr?: boolean | null): Promise<WaitableElement | false> {
    return this._waitState('is_enabled', true, timeout, raiseErr);
  }

  async disabled(timeout?: number, raiseErr?: boolean | null): Promise<WaitableElement | false> {
    return this._waitState('is_enabled', false, timeout, raiseErr);
  }

  async disabled_or_deleted(timeout?: number, raiseErr?: boolean | null): Promise<WaitableElement | false> {
    const timeoutMs = timeout ?? this._defaultTimeout;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      try {
        const enabled = await this._ele.is_enabled();
        if (!enabled) return this._ele;
      } catch {
        return this._ele;
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    if (shouldRaise(raiseErr)) {
      const { WaitTimeoutError } = await import("../errors");
      throw new WaitTimeoutError("disabled_or_deleted timeout");
    }

    return false;
  }

  async clickable(waitMoved: boolean = true, timeout?: number, raiseErr?: boolean | null): Promise<WaitableElement | false> {
    const timeoutMs = timeout ?? this._defaultTimeout;
    const t1 = Date.now();
    const result = await this._waitState('is_clickable', true, timeoutMs, false);
    if (waitMoved && result) {
      const remaining = timeoutMs - (Date.now() - t1);
      const moveResult = await this.stop_moving(remaining > 0 ? remaining : 100);
      if (!moveResult && shouldRaise(raiseErr)) {
        const { WaitTimeoutError } = await import("../errors");
        throw new WaitTimeoutError("clickable timeout (stop_moving)");
      }
      return moveResult;
    }
    if (!result && shouldRaise(raiseErr)) {
      const { WaitTimeoutError } = await import("../errors");
      throw new WaitTimeoutError("clickable timeout");
    }
    return result;
  }

  async has_rect(timeout?: number, raiseErr?: boolean | null): Promise<WaitableElement | false> {
    return this._waitState('has_rect', true, timeout, raiseErr);
  }

  async stop_moving(timeout?: number, gap: number = 100, raiseErr?: boolean | null): Promise<WaitableElement | false> {
    const timeoutMs = (timeout ?? this._defaultTimeout);
    if (timeoutMs <= 0) {
      return this._ele;
    }
    const deadline = Date.now() + timeoutMs;

    let lastRect: { x: number; y: number; width: number; height: number } | null = null;

    while (Date.now() < deadline) {
      try {
        const rect = await this._ele.get_rect();
        if (lastRect && rect.x === lastRect.x && rect.y === lastRect.y &&
            rect.width === lastRect.width && rect.height === lastRect.height) {
          return this._ele;
        }
        lastRect = rect;
      } catch {
        // element may not exist yet
      }
      await new Promise(resolve => setTimeout(resolve, gap));
    }

    if (shouldRaise(raiseErr)) {
      const { WaitTimeoutError } = await import("../errors");
      throw new WaitTimeoutError("stop_moving timeout");
    }

    return false;
  }

  async download_begin(timeout?: number, cancelIt: boolean = false): Promise<any | false> {
    const timeoutMs = timeout ?? this._defaultTimeout;
    const session = this._ele.session;

    return new Promise((resolve) => {
      let resolved = false;

      const handler = (params: any) => {
        if (!resolved) {
          resolved = true;
          cleanup();

          if (cancelIt) {
            session.send("Browser.cancelDownload", { guid: params.guid }).catch(() => {});
          }

          resolve(params);
        }
      };

      const cleanup = () => {
        clearTimeout(timer);
        session.off("Browser.downloadWillBegin", handler);
      };

      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve(false);
        }
      }, timeoutMs);

      session.on("Browser.downloadWillBegin", handler);
    });
  }

  async upload_paths_inputted(timeout?: number): Promise<boolean> {
    const timeoutMs = timeout ?? this._defaultTimeout;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    return true;
  }

  async state(stateName: string, mode: boolean = true, timeout?: number, raiseErr?: boolean | null): Promise<WaitableElement | false> {
    return this._waitState(stateName, mode, timeout, raiseErr);
  }

  private async _waitState(attr: string, mode: boolean, timeout?: number, raiseErr?: boolean | null): Promise<WaitableElement | false> {
    const timeoutMs = timeout ?? this._defaultTimeout;
    const deadline = Date.now() + timeoutMs;

    const check = async (): Promise<boolean> => {
      try {
        switch (attr) {
          case 'is_alive': {
            await this._ele.getObjectId();
            return true;
          }
          case 'is_displayed': {
            const displayed = await this._ele.is_displayed();
            return displayed;
          }
          case 'is_enabled': {
            const enabled = await this._ele.is_enabled();
            return enabled;
          }
          case 'is_covered': {
            if (this._ele.is_covered) {
              const result = await this._ele.is_covered();
              return result !== false;
            }
            return false;
          }
          case 'is_clickable': {
            const displayed = await this._ele.is_displayed();
            const enabled = await this._ele.is_enabled();
            const rect = await this._ele.get_rect();
            return displayed && enabled && rect.width > 0 && rect.height > 0;
          }
          case 'has_rect': {
            const rect = await this._ele.get_rect();
            return rect.width > 0 && rect.height > 0;
          }
          default:
            return false;
        }
      } catch {
        if (attr === 'is_alive') return false;
        if (attr === 'is_displayed') return false;
        if (attr === 'is_enabled') return false;
        return false;
      }
    };

    const initial = await check();
    if ((initial && mode) || (!initial && !mode)) {
      return this._ele;
    }

    while (Date.now() < deadline) {
      const result = await check();
      if ((result && mode) || (!result && !mode)) {
        return this._ele;
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    if (shouldRaise(raiseErr)) {
      const { WaitTimeoutError } = await import("../errors");
      throw new WaitTimeoutError(`${attr} timeout`);
    }

    return false;
  }
}
