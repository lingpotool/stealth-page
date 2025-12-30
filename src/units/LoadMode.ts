import { CDPSession } from "../core/CDPSession";

export type LoadModeValue = "normal" | "eager" | "none";

/**
 * 页面加载策略设置类
 * 对应 DrissionPage.LoadMode
 */
export class LoadMode {
  private readonly _cdpSession: CDPSession;
  private _mode: LoadModeValue = "normal";

  constructor(cdpSession: CDPSession) {
    this._cdpSession = cdpSession;
  }

  get value(): LoadModeValue {
    return this._mode;
  }

  /**
   * 设置加载策略
   */
  async set(value: LoadModeValue): Promise<void> {
    this._mode = value;
    // CDP 没有直接的加载策略设置，这里记录状态供其他方法使用
  }

  /**
   * 设置为 normal 模式（等待页面完全加载）
   */
  async normal(): Promise<void> {
    await this.set("normal");
  }

  /**
   * 设置为 eager 模式（DOM 加载完成即可）
   */
  async eager(): Promise<void> {
    await this.set("eager");
  }

  /**
   * 设置为 none 模式（不等待加载）
   */
  async none(): Promise<void> {
    await this.set("none");
  }
}
