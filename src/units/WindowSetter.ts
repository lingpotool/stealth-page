import { CDPSession } from "../core/CDPSession";

/**
 * 窗口信息接口
 */
export interface WindowBounds {
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  windowState?: "normal" | "minimized" | "maximized" | "fullscreen";
}

/**
 * 窗口设置页面接口
 */
export interface WindowPage {
  cdpSession: CDPSession;
}

/**
 * 窗口设置类，对应 DrissionPage 的 WindowSetter
 */
export class WindowSetter {
  private readonly _owner: WindowPage;
  private _windowId: number | null = null;

  constructor(owner: WindowPage) {
    this._owner = owner;
  }

  /**
   * 获取窗口 ID
   */
  private async _getWindowId(): Promise<number> {
    if (this._windowId !== null) {
      return this._windowId;
    }

    const { windowId } = await this._owner.cdpSession.send<{ windowId: number }>(
      "Browser.getWindowForTarget"
    );
    this._windowId = windowId;
    return windowId;
  }

  /**
   * 获取窗口信息
   */
  private async _getInfo(): Promise<WindowBounds> {
    const windowId = await this._getWindowId();
    const { bounds } = await this._owner.cdpSession.send<{ bounds: WindowBounds }>(
      "Browser.getWindowBounds",
      { windowId }
    );
    return bounds;
  }

  /**
   * 执行窗口操作
   */
  private async _perform(bounds: WindowBounds): Promise<void> {
    const windowId = await this._getWindowId();
    await this._owner.cdpSession.send("Browser.setWindowBounds", {
      windowId,
      bounds,
    });
  }

  /**
   * 窗口最大化
   */
  async max(): Promise<void> {
    await this._perform({ windowState: "maximized" });
  }

  /**
   * 窗口最小化
   */
  async mini(): Promise<void> {
    await this._perform({ windowState: "minimized" });
  }

  /**
   * 窗口全屏
   */
  async full(): Promise<void> {
    await this._perform({ windowState: "fullscreen" });
  }

  /**
   * 窗口恢复正常
   */
  async normal(): Promise<void> {
    await this._perform({ windowState: "normal" });
  }

  /**
   * 设置窗口大小
   */
  async size(width?: number, height?: number): Promise<void> {
    // 先恢复正常状态
    await this.normal();
    
    const bounds: WindowBounds = {};
    if (width !== undefined) bounds.width = width;
    if (height !== undefined) bounds.height = height;
    
    if (Object.keys(bounds).length > 0) {
      await this._perform(bounds);
    }
  }

  /**
   * 设置窗口位置
   */
  async location(x?: number, y?: number): Promise<void> {
    // 先恢复正常状态
    await this.normal();
    
    const bounds: WindowBounds = {};
    if (x !== undefined) bounds.left = x;
    if (y !== undefined) bounds.top = y;
    
    if (Object.keys(bounds).length > 0) {
      await this._perform(bounds);
    }
  }

  /**
   * 隐藏浏览器窗口（仅 Windows）
   */
  async hide(): Promise<void> {
    // CDP 不直接支持隐藏窗口，可以通过最小化实现
    await this.mini();
  }

  /**
   * 显示浏览器窗口（仅 Windows）
   */
  async show(): Promise<void> {
    await this.normal();
  }

  /**
   * 获取当前窗口大小
   */
  async getSize(): Promise<{ width: number; height: number }> {
    const bounds = await this._getInfo();
    return {
      width: bounds.width || 0,
      height: bounds.height || 0,
    };
  }

  /**
   * 获取当前窗口位置
   */
  async getLocation(): Promise<{ x: number; y: number }> {
    const bounds = await this._getInfo();
    return {
      x: bounds.left || 0,
      y: bounds.top || 0,
    };
  }

  /**
   * 获取窗口状态
   */
  async getState(): Promise<string> {
    const bounds = await this._getInfo();
    return bounds.windowState || "normal";
  }
}
