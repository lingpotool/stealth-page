import { CDPSession } from "../core/CDPSession";

export interface ScrollableElement {
  readonly session: CDPSession;
  getObjectId(): Promise<string>;
}

/**
 * 元素滚动器，对应 DrissionPage 的 ElementScroller
 * 所有方法返回元素本身以支持链式调用
 */
export class ElementScroller {
  private readonly _ele: ScrollableElement;
  private _waitComplete: boolean = false;

  constructor(ele: ScrollableElement) {
    this._ele = ele;
  }

  /**
   * 设置是否等待滚动完成
   */
  set_wait_complete(on: boolean): void {
    this._waitComplete = on;
  }

  /**
   * 向下滚动若干像素
   */
  async __call__(pixel: number = 300): Promise<ScrollableElement> {
    return this.down(pixel);
  }

  /**
   * 滚动到顶部
   */
  async to_top(): Promise<ScrollableElement> {
    const objectId = await this._ele.getObjectId();
    await this._ele.session.send("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: "function() { this.scrollTop = 0; }",
    });
    if (this._waitComplete) await this._waitScrolled();
    return this._ele;
  }

  /**
   * 滚动到底部
   */
  async to_bottom(): Promise<ScrollableElement> {
    const objectId = await this._ele.getObjectId();
    await this._ele.session.send("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: "function() { this.scrollTop = this.scrollHeight; }",
    });
    if (this._waitComplete) await this._waitScrolled();
    return this._ele;
  }

  /**
   * 滚动到垂直中间位置
   */
  async to_half(): Promise<ScrollableElement> {
    const objectId = await this._ele.getObjectId();
    await this._ele.session.send("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: "function() { this.scrollTop = this.scrollHeight / 2; }",
    });
    if (this._waitComplete) await this._waitScrolled();
    return this._ele;
  }

  /**
   * 滚动到最右边
   */
  async to_rightmost(): Promise<ScrollableElement> {
    const objectId = await this._ele.getObjectId();
    await this._ele.session.send("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: "function() { this.scrollLeft = this.scrollWidth; }",
    });
    if (this._waitComplete) await this._waitScrolled();
    return this._ele;
  }

  /**
   * 滚动到最左边
   */
  async to_leftmost(): Promise<ScrollableElement> {
    const objectId = await this._ele.getObjectId();
    await this._ele.session.send("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: "function() { this.scrollLeft = 0; }",
    });
    if (this._waitComplete) await this._waitScrolled();
    return this._ele;
  }

  /**
   * 滚动到指定位置
   */
  async to_location(x: number, y: number): Promise<ScrollableElement> {
    const objectId = await this._ele.getObjectId();
    await this._ele.session.send("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function(x, y) { this.scrollLeft = x; this.scrollTop = y; }`,
      arguments: [{ value: x }, { value: y }],
    });
    if (this._waitComplete) await this._waitScrolled();
    return this._ele;
  }

  /**
   * 向上滚动
   */
  async up(pixel: number = 300): Promise<ScrollableElement> {
    const objectId = await this._ele.getObjectId();
    await this._ele.session.send("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function(p) { this.scrollTop -= p; }`,
      arguments: [{ value: pixel }],
    });
    if (this._waitComplete) await this._waitScrolled();
    return this._ele;
  }

  /**
   * 向下滚动
   */
  async down(pixel: number = 300): Promise<ScrollableElement> {
    const objectId = await this._ele.getObjectId();
    await this._ele.session.send("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function(p) { this.scrollTop += p; }`,
      arguments: [{ value: pixel }],
    });
    if (this._waitComplete) await this._waitScrolled();
    return this._ele;
  }

  /**
   * 向左滚动
   */
  async left(pixel: number = 300): Promise<ScrollableElement> {
    const objectId = await this._ele.getObjectId();
    await this._ele.session.send("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function(p) { this.scrollLeft -= p; }`,
      arguments: [{ value: pixel }],
    });
    if (this._waitComplete) await this._waitScrolled();
    return this._ele;
  }

  /**
   * 向右滚动
   */
  async right(pixel: number = 300): Promise<ScrollableElement> {
    const objectId = await this._ele.getObjectId();
    await this._ele.session.send("Runtime.callFunctionOn", {
      objectId,
      functionDeclaration: `function(p) { this.scrollLeft += p; }`,
      arguments: [{ value: pixel }],
    });
    if (this._waitComplete) await this._waitScrolled();
    return this._ele;
  }

  /**
   * 滚动页面直到元素可见
   * @param center 是否尽量滚动到页面正中，为null时如果被遮挡，则滚动到页面正中
   */
  async to_see(center: boolean | null = null): Promise<ScrollableElement> {
    const objectId = await this._ele.getObjectId();
    
    if (center === null) {
      // 先尝试 nearest，如果被遮挡则用 center
      await this._ele.session.send("Runtime.callFunctionOn", {
        objectId,
        functionDeclaration: `function() { 
          this.scrollIntoView({ behavior: 'auto', block: 'nearest' }); 
        }`,
      });
      
      // 检查是否被遮挡
      const { result } = await this._ele.session.send<{ result: { value: boolean } }>("Runtime.callFunctionOn", {
        objectId,
        functionDeclaration: `function() {
          const rect = this.getBoundingClientRect();
          const x = rect.left + rect.width / 2;
          const y = rect.top + rect.height / 2;
          const el = document.elementFromPoint(x, y);
          return el === this || this.contains(el);
        }`,
        returnByValue: true,
      });
      
      if (!result.value) {
        // 被遮挡，滚动到中间
        await this._ele.session.send("Runtime.callFunctionOn", {
          objectId,
          functionDeclaration: `function() { 
            this.scrollIntoView({ behavior: 'auto', block: 'center' }); 
          }`,
        });
      }
    } else {
      await this._ele.session.send("Runtime.callFunctionOn", {
        objectId,
        functionDeclaration: `function(c) { 
          this.scrollIntoView({ behavior: 'auto', block: c ? 'center' : 'nearest' }); 
        }`,
        arguments: [{ value: center }],
      });
    }
    
    if (this._waitComplete) await this._waitScrolled();
    return this._ele;
  }

  /**
   * 元素尽量滚动到视口中间
   */
  async to_center(): Promise<ScrollableElement> {
    return this.to_see(true);
  }

  /**
   * 等待滚动结束
   */
  private async _waitScrolled(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
