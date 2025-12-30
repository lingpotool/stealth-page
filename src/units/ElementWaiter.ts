import { CDPSession } from "../core/CDPSession";

export interface WaitableElement {
  readonly session: CDPSession;
  readonly nodeId: number;
  getObjectId(): Promise<string>;
  is_displayed(): Promise<boolean>;
  is_enabled(): Promise<boolean>;
  is_covered?(): Promise<number | false>;
  get_rect(): Promise<{ x: number; y: number; width: number; height: number }>;
}

/**
 * 元素等待器，对应 DrissionPage 的 ElementWaiter
 */
export class ElementWaiter {
  private readonly _ele: WaitableElement;
  private readonly _defaultTimeout: number;

  constructor(ele: WaitableElement, defaultTimeout: number = 10000) {
    this._ele = ele;
    this._defaultTimeout = defaultTimeout;
  }

  /**
   * 等待若干秒
   */
  async __call__(second: number, scope?: number): Promise<WaitableElement> {
    const ms = scope !== undefined
      ? (second + Math.random() * (scope - second)) * 1000
      : second * 1000;
    await new Promise(resolve => setTimeout(resolve, ms));
    return this._ele;
  }

  /**
   * 等待元素从 DOM 删除
   */
  async deleted(timeout?: number): Promise<WaitableElement | false> {
    const timeoutMs = timeout ?? this._defaultTimeout;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      try {
        await this._ele.getObjectId();
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch {
        return this._ele;
      }
    }
    return false;
  }

  /**
   * 等待元素显示
   */
  async displayed(timeout?: number): Promise<WaitableElement | false> {
    const timeoutMs = timeout ?? this._defaultTimeout;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      try {
        const displayed = await this._ele.is_displayed();
        if (displayed) return this._ele;
      } catch {
        // 元素可能不存在
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return false;
  }

  /**
   * 等待元素隐藏
   */
  async hidden(timeout?: number): Promise<WaitableElement | false> {
    const timeoutMs = timeout ?? this._defaultTimeout;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      try {
        const displayed = await this._ele.is_displayed();
        if (!displayed) return this._ele;
      } catch {
        return this._ele; // 元素不存在也算隐藏
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return false;
  }

  /**
   * 等待元素被遮盖
   */
  async covered(timeout?: number): Promise<WaitableElement | false> {
    const timeoutMs = timeout ?? this._defaultTimeout;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      try {
        if (this._ele.is_covered) {
          const result = await this._ele.is_covered();
          if (result !== false) return this._ele;
        }
      } catch {
        // 元素可能不存在
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return false;
  }

  /**
   * 等待元素不被遮盖
   */
  async not_covered(timeout?: number): Promise<WaitableElement | false> {
    const timeoutMs = timeout ?? this._defaultTimeout;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      try {
        if (this._ele.is_covered) {
          const result = await this._ele.is_covered();
          if (result === false) return this._ele;
        } else {
          return this._ele; // 没有 is_covered 方法，假设不被遮盖
        }
      } catch {
        // 元素可能不存在
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return false;
  }

  /**
   * 等待元素可用
   */
  async enabled(timeout?: number): Promise<WaitableElement | false> {
    const timeoutMs = timeout ?? this._defaultTimeout;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      try {
        const enabled = await this._ele.is_enabled();
        if (enabled) return this._ele;
      } catch {
        // 元素可能不存在
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return false;
  }

  /**
   * 等待元素不可用
   */
  async disabled(timeout?: number): Promise<WaitableElement | false> {
    const timeoutMs = timeout ?? this._defaultTimeout;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      try {
        const enabled = await this._ele.is_enabled();
        if (!enabled) return this._ele;
      } catch {
        return this._ele;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return false;
  }

  /**
   * 等待元素不可用或从 DOM 删除
   */
  async disabled_or_deleted(timeout?: number): Promise<boolean> {
    const timeoutMs = timeout ?? this._defaultTimeout;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      try {
        await this._ele.getObjectId();
        const enabled = await this._ele.is_enabled();
        if (!enabled) return true;
      } catch {
        return true; // 元素已删除
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return false;
  }

  /**
   * 等待元素停止移动
   */
  async stop_moving(timeout?: number, gap: number = 100): Promise<WaitableElement | false> {
    const timeoutMs = timeout ?? this._defaultTimeout;
    const deadline = Date.now() + timeoutMs;

    let lastRect: { x: number; y: number } | null = null;

    while (Date.now() < deadline) {
      try {
        const rect = await this._ele.get_rect();
        if (lastRect && rect.x === lastRect.x && rect.y === lastRect.y) {
          return this._ele;
        }
        lastRect = { x: rect.x, y: rect.y };
      } catch {
        // 元素可能不存在
      }
      await new Promise(resolve => setTimeout(resolve, gap));
    }
    return false;
  }

  /**
   * 等待元素可点击（显示、可用、有大小）
   */
  async clickable(waitMoved: boolean = true, timeout?: number): Promise<WaitableElement | false> {
    const timeoutMs = timeout ?? this._defaultTimeout;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      try {
        const displayed = await this._ele.is_displayed();
        const enabled = await this._ele.is_enabled();
        const rect = await this._ele.get_rect();
        const hasSize = rect.width > 0 && rect.height > 0;

        if (displayed && enabled && hasSize) {
          if (waitMoved) {
            const stopped = await this.stop_moving(Math.min(1000, deadline - Date.now()));
            if (stopped) return this._ele;
          } else {
            return this._ele;
          }
        }
      } catch {
        // 元素可能不存在
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return false;
  }

  /**
   * 等待元素有大小和位置
   */
  async has_rect(timeout?: number): Promise<WaitableElement | false> {
    const timeoutMs = timeout ?? this._defaultTimeout;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      try {
        const rect = await this._ele.get_rect();
        if (rect.width > 0 && rect.height > 0) {
          return this._ele;
        }
      } catch {
        // 元素可能不存在
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return false;
  }
}
