import { ChromiumFrame } from "../pages/ChromiumFrame";
import { Settings } from "../core/Settings";

function shouldRaise(raiseErr?: boolean | null): boolean {
  if (raiseErr === true) return true;
  if (raiseErr === false) return false;
  return Settings.raise_when_wait_failed;
}

export class FrameWaiter {
  private readonly _frame: ChromiumFrame;

  constructor(frame: ChromiumFrame) {
    this._frame = frame;
  }

  async wait(second: number, scope?: number): Promise<ChromiumFrame> {
    const waitTime = scope !== undefined
      ? second + Math.random() * (scope - second)
      : second;
    await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
    return this._frame;
  }

  async url_change(text?: string, exclude: boolean = false, timeout?: number, raiseErr?: boolean | null): Promise<ChromiumFrame | false> {
    const timeoutMs = (timeout ?? Settings.cdp_timeout) * 1000;
    const startUrl = await this._frame.url();
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const currentUrl = await this._frame.url();

      if (text === undefined) {
        if (currentUrl !== startUrl) {
          return this._frame;
        }
      } else {
        const contains = currentUrl.includes(text);
        if (exclude ? !contains : contains) {
          return this._frame;
        }
      }

      await new Promise(resolve => setTimeout(resolve, 50));
    }

    if (shouldRaise(raiseErr)) {
      const { WaitTimeoutError } = await import("../errors");
      throw new WaitTimeoutError(`url_change timeout, waiting for: ${text}`);
    }

    return false;
  }

  async title_change(text?: string, exclude: boolean = false, timeout?: number, raiseErr?: boolean | null): Promise<ChromiumFrame | false> {
    const timeoutMs = (timeout ?? Settings.cdp_timeout) * 1000;
    const startTitle = await this._frame.title();
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const currentTitle = await this._frame.title();

      if (text === undefined) {
        if (currentTitle !== startTitle) {
          return this._frame;
        }
      } else {
        const contains = currentTitle.includes(text);
        if (exclude ? !contains : contains) {
          return this._frame;
        }
      }

      await new Promise(resolve => setTimeout(resolve, 50));
    }

    if (shouldRaise(raiseErr)) {
      const { WaitTimeoutError } = await import("../errors");
      throw new WaitTimeoutError(`title_change timeout, waiting for: ${text}`);
    }

    return false;
  }

  async deleted(timeout?: number, raiseErr?: boolean | null): Promise<ChromiumFrame | false> {
    const timeoutMs = (timeout ?? Settings.cdp_timeout) * 1000;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      try {
        await this._frame.frame_ele.getObjectId();
      } catch {
        return this._frame;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (shouldRaise(raiseErr)) {
      const { WaitTimeoutError } = await import("../errors");
      throw new WaitTimeoutError("deleted timeout");
    }

    return false;
  }

  async displayed(timeout?: number, raiseErr?: boolean | null): Promise<ChromiumFrame | false> {
    const timeoutMs = (timeout ?? Settings.cdp_timeout) * 1000;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      try {
        const displayed = await this._frame.frame_ele.is_displayed();
        if (displayed) return this._frame;
      } catch {
        // ignore
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (shouldRaise(raiseErr)) {
      const { WaitTimeoutError } = await import("../errors");
      throw new WaitTimeoutError("displayed timeout");
    }

    return false;
  }

  async hidden(timeout?: number, raiseErr?: boolean | null): Promise<ChromiumFrame | false> {
    const timeoutMs = (timeout ?? Settings.cdp_timeout) * 1000;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      try {
        const displayed = await this._frame.frame_ele.is_displayed();
        if (!displayed) return this._frame;
      } catch {
        return this._frame;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (shouldRaise(raiseErr)) {
      const { WaitTimeoutError } = await import("../errors");
      throw new WaitTimeoutError("hidden timeout");
    }

    return false;
  }

  async has_rect(timeout?: number, raiseErr?: boolean | null): Promise<ChromiumFrame | false> {
    const timeoutMs = (timeout ?? Settings.cdp_timeout) * 1000;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      try {
        const rect = await this._frame.frame_ele.get_rect();
        if (rect.width > 0 && rect.height > 0) return this._frame;
      } catch {
        // ignore
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (shouldRaise(raiseErr)) {
      const { WaitTimeoutError } = await import("../errors");
      throw new WaitTimeoutError("has_rect timeout");
    }

    return false;
  }

  async covered(timeout?: number, raiseErr?: boolean | null): Promise<ChromiumFrame | false> {
    const timeoutMs = (timeout ?? Settings.cdp_timeout) * 1000;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      try {
        const result = await this._frame.frame_ele.states.is_covered;
        if (result !== false && result !== 0) return this._frame;
      } catch {
        // ignore
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (shouldRaise(raiseErr)) {
      const { WaitTimeoutError } = await import("../errors");
      throw new WaitTimeoutError("covered timeout");
    }

    return false;
  }

  async not_covered(timeout?: number, raiseErr?: boolean | null): Promise<ChromiumFrame | false> {
    const timeoutMs = (timeout ?? Settings.cdp_timeout) * 1000;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      try {
        const result = await this._frame.frame_ele.states.is_covered;
        if (result === false || result === 0) return this._frame;
      } catch {
        return this._frame;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (shouldRaise(raiseErr)) {
      const { WaitTimeoutError } = await import("../errors");
      throw new WaitTimeoutError("not_covered timeout");
    }

    return false;
  }

  async enabled(timeout?: number, raiseErr?: boolean | null): Promise<ChromiumFrame | false> {
    const timeoutMs = (timeout ?? Settings.cdp_timeout) * 1000;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      try {
        const enabled = await this._frame.frame_ele.is_enabled();
        if (enabled) return this._frame;
      } catch {
        // ignore
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (shouldRaise(raiseErr)) {
      const { WaitTimeoutError } = await import("../errors");
      throw new WaitTimeoutError("enabled timeout");
    }

    return false;
  }

  async disabled(timeout?: number, raiseErr?: boolean | null): Promise<ChromiumFrame | false> {
    const timeoutMs = (timeout ?? Settings.cdp_timeout) * 1000;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      try {
        const enabled = await this._frame.frame_ele.is_enabled();
        if (!enabled) return this._frame;
      } catch {
        return this._frame;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (shouldRaise(raiseErr)) {
      const { WaitTimeoutError } = await import("../errors");
      throw new WaitTimeoutError("disabled timeout");
    }

    return false;
  }

  async disabled_or_deleted(timeout?: number, raiseErr?: boolean | null): Promise<ChromiumFrame | false> {
    const timeoutMs = (timeout ?? Settings.cdp_timeout) * 1000;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      try {
        const enabled = await this._frame.frame_ele.is_enabled();
        if (!enabled) return this._frame;
      } catch {
        return this._frame;
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    if (shouldRaise(raiseErr)) {
      const { WaitTimeoutError } = await import("../errors");
      throw new WaitTimeoutError("disabled_or_deleted timeout");
    }

    return false;
  }

  async clickable(waitMoved: boolean = true, timeout?: number, raiseErr?: boolean | null): Promise<ChromiumFrame | false> {
    const timeoutMs = (timeout ?? Settings.cdp_timeout) * 1000;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      try {
        const displayed = await this._frame.frame_ele.is_displayed();
        const enabled = await this._frame.frame_ele.is_enabled();
        const rect = await this._frame.frame_ele.get_rect();
        if (displayed && enabled && rect.width > 0 && rect.height > 0) {
          if (waitMoved) {
            const remaining = deadline - Date.now();
            const stopped = await this.stop_moving(remaining > 0 ? remaining : 100);
            if (stopped) return this._frame;
          } else {
            return this._frame;
          }
        }
      } catch {
        // ignore
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (shouldRaise(raiseErr)) {
      const { WaitTimeoutError } = await import("../errors");
      throw new WaitTimeoutError("clickable timeout");
    }

    return false;
  }

  async stop_moving(timeout?: number, gap: number = 100, raiseErr?: boolean | null): Promise<ChromiumFrame | false> {
    const timeoutMs = (timeout ?? Settings.cdp_timeout) * 1000;
    const deadline = Date.now() + timeoutMs;

    let lastRect: { x: number; y: number; width: number; height: number } | null = null;

    while (Date.now() < deadline) {
      try {
        const rect = await this._frame.frame_ele.get_rect();
        if (lastRect && rect.x === lastRect.x && rect.y === lastRect.y &&
            rect.width === lastRect.width && rect.height === lastRect.height) {
          return this._frame;
        }
        lastRect = rect;
      } catch {
        // ignore
      }
      await new Promise(resolve => setTimeout(resolve, gap));
    }

    if (shouldRaise(raiseErr)) {
      const { WaitTimeoutError } = await import("../errors");
      throw new WaitTimeoutError("stop_moving timeout");
    }

    return false;
  }
}
