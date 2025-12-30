import { CDPSession } from "../core/CDPSession";

export interface RectableElement {
  readonly session: CDPSession;
  readonly nodeId: number;
  getObjectId(): Promise<string>;
}

/**
 * 元素位置和大小信息，对应 DrissionPage 的 ElementRect
 */
export class ElementRect {
  private readonly _ele: RectableElement;

  constructor(ele: RectableElement) {
    this._ele = ele;
  }

  /**
   * 元素左上角在页面中的坐标
   */
  async location(): Promise<{ x: number; y: number }> {
    const objectId = await this._ele.getObjectId();
    const { result } = await this._ele.session.send<{ result: { value: { x: number; y: number } } }>("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function() {
        const rect = this.getBoundingClientRect();
        return { x: rect.left + window.scrollX, y: rect.top + window.scrollY };
      }`,
      returnByValue: true,
    });
    return result.value;
  }

  /**
   * 元素在视口中的坐标
   */
  async viewport_location(): Promise<{ x: number; y: number }> {
    const objectId = await this._ele.getObjectId();
    const { result } = await this._ele.session.send<{ result: { value: { x: number; y: number } } }>("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function() {
        const rect = this.getBoundingClientRect();
        return { x: rect.left, y: rect.top };
      }`,
      returnByValue: true,
    });
    return result.value;
  }

  /**
   * 元素在屏幕上的坐标
   */
  async screen_location(): Promise<{ x: number; y: number }> {
    const objectId = await this._ele.getObjectId();
    const { result } = await this._ele.session.send<{ result: { value: { x: number; y: number } } }>("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function() {
        const rect = this.getBoundingClientRect();
        return { x: rect.left + window.screenX, y: rect.top + window.screenY };
      }`,
      returnByValue: true,
    });
    return result.value;
  }

  /**
   * 元素大小
   */
  async size(): Promise<{ width: number; height: number }> {
    const objectId = await this._ele.getObjectId();
    const { result } = await this._ele.session.send<{ result: { value: { width: number; height: number } } }>("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function() {
        const rect = this.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      }`,
      returnByValue: true,
    });
    return result.value;
  }

  /**
   * 元素中心点在页面中的坐标
   */
  async midpoint(): Promise<{ x: number; y: number }> {
    const loc = await this.location();
    const sz = await this.size();
    return { x: loc.x + sz.width / 2, y: loc.y + sz.height / 2 };
  }

  /**
   * 元素中心点在视口中的坐标
   */
  async viewport_midpoint(): Promise<{ x: number; y: number }> {
    const loc = await this.viewport_location();
    const sz = await this.size();
    return { x: loc.x + sz.width / 2, y: loc.y + sz.height / 2 };
  }

  /**
   * 点击点坐标（默认为中心点）
   */
  async click_point(): Promise<{ x: number; y: number }> {
    return this.midpoint();
  }

  /**
   * 元素四个角的坐标
   */
  async corners(): Promise<Array<{ x: number; y: number }>> {
    const loc = await this.location();
    const sz = await this.size();
    return [
      { x: loc.x, y: loc.y },
      { x: loc.x + sz.width, y: loc.y },
      { x: loc.x + sz.width, y: loc.y + sz.height },
      { x: loc.x, y: loc.y + sz.height },
    ];
  }

  /**
   * 元素四个角在视口中的坐标
   */
  async viewport_corners(): Promise<Array<{ x: number; y: number }>> {
    const loc = await this.viewport_location();
    const sz = await this.size();
    return [
      { x: loc.x, y: loc.y },
      { x: loc.x + sz.width, y: loc.y },
      { x: loc.x + sz.width, y: loc.y + sz.height },
      { x: loc.x, y: loc.y + sz.height },
    ];
  }

  /**
   * 元素中心点在屏幕上的坐标
   */
  async screen_midpoint(): Promise<{ x: number; y: number }> {
    const objectId = await this._ele.getObjectId();
    const { result } = await this._ele.session.send<{ result: { value: { x: number; y: number } } }>("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function() {
        const rect = this.getBoundingClientRect();
        return { 
          x: rect.left + rect.width / 2 + window.screenX, 
          y: rect.top + rect.height / 2 + window.screenY 
        };
      }`,
      returnByValue: true,
    });
    return result.value;
  }

  /**
   * 元素点击点在屏幕上的坐标
   */
  async screen_click_point(): Promise<{ x: number; y: number }> {
    return this.screen_midpoint();
  }

  /**
   * 视口中的点击点坐标
   */
  async viewport_click_point(): Promise<{ x: number; y: number }> {
    return this.viewport_midpoint();
  }

  /**
   * 元素滚动条位置
   */
  async scroll_position(): Promise<{ x: number; y: number }> {
    const objectId = await this._ele.getObjectId();
    const { result } = await this._ele.session.send<{ result: { value: { x: number; y: number } } }>("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function() {
        return { x: this.scrollLeft || 0, y: this.scrollTop || 0 };
      }`,
      returnByValue: true,
    });
    return result.value;
  }
}
