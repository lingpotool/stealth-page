import { CDPSession } from "../core/CDPSession";

export interface ScrollablePage {
  readonly cdpSession: CDPSession;
}

/**
 * 页面滚动器，对应 DrissionPage 的 PageScroller
 * 所有方法返回页面对象以支持链式调用
 */
export class PageScroller {
  protected readonly _page: ScrollablePage;
  protected _waitComplete: boolean = false;
  protected _smooth: boolean = false;

  constructor(page: ScrollablePage) {
    this._page = page;
  }

  /**
   * 设置是否等待滚动完成
   */
  set_wait_complete(on: boolean): void {
    this._waitComplete = on;
  }

  /**
   * 设置是否平滑滚动
   */
  set_smooth(on: boolean): void {
    this._smooth = on;
  }

  /**
   * 向下滚动若干像素
   */
  async __call__(pixel: number = 300): Promise<ScrollablePage> {
    return this.down(pixel);
  }

  /**
   * 滚动到顶部
   */
  async to_top(): Promise<ScrollablePage> {
    const behavior = this._smooth ? "smooth" : "auto";
    await this._runJs(`window.scrollTo({ top: 0, behavior: '${behavior}' });`);
    if (this._waitComplete) await this._waitScrolled();
    return this._page;
  }

  /**
   * 滚动到底部
   */
  async to_bottom(): Promise<ScrollablePage> {
    const behavior = this._smooth ? "smooth" : "auto";
    await this._runJs(`window.scrollTo({ top: document.body.scrollHeight, behavior: '${behavior}' });`);
    if (this._waitComplete) await this._waitScrolled();
    return this._page;
  }

  /**
   * 滚动到垂直中间位置
   */
  async to_half(): Promise<ScrollablePage> {
    const behavior = this._smooth ? "smooth" : "auto";
    await this._runJs(`window.scrollTo({ top: document.body.scrollHeight / 2, behavior: '${behavior}' });`);
    if (this._waitComplete) await this._waitScrolled();
    return this._page;
  }

  /**
   * 滚动到最右边
   */
  async to_rightmost(): Promise<ScrollablePage> {
    const behavior = this._smooth ? "smooth" : "auto";
    await this._runJs(`window.scrollTo({ left: document.body.scrollWidth, top: window.scrollY, behavior: '${behavior}' });`);
    if (this._waitComplete) await this._waitScrolled();
    return this._page;
  }

  /**
   * 滚动到最左边
   */
  async to_leftmost(): Promise<ScrollablePage> {
    const behavior = this._smooth ? "smooth" : "auto";
    await this._runJs(`window.scrollTo({ left: 0, top: window.scrollY, behavior: '${behavior}' });`);
    if (this._waitComplete) await this._waitScrolled();
    return this._page;
  }

  /**
   * 滚动到指定位置
   */
  async to_location(x: number, y: number): Promise<ScrollablePage> {
    const behavior = this._smooth ? "smooth" : "auto";
    await this._runJs(`window.scrollTo({ left: ${x}, top: ${y}, behavior: '${behavior}' });`);
    if (this._waitComplete) await this._waitScrolled();
    return this._page;
  }

  /**
   * 向上滚动
   */
  async up(pixel: number = 300): Promise<ScrollablePage> {
    const behavior = this._smooth ? "smooth" : "auto";
    await this._runJs(`window.scrollBy({ top: -${pixel}, behavior: '${behavior}' });`);
    if (this._waitComplete) await this._waitScrolled();
    return this._page;
  }

  /**
   * 向下滚动
   */
  async down(pixel: number = 300): Promise<ScrollablePage> {
    const behavior = this._smooth ? "smooth" : "auto";
    await this._runJs(`window.scrollBy({ top: ${pixel}, behavior: '${behavior}' });`);
    if (this._waitComplete) await this._waitScrolled();
    return this._page;
  }

  /**
   * 向左滚动
   */
  async left(pixel: number = 300): Promise<ScrollablePage> {
    const behavior = this._smooth ? "smooth" : "auto";
    await this._runJs(`window.scrollBy({ left: -${pixel}, behavior: '${behavior}' });`);
    if (this._waitComplete) await this._waitScrolled();
    return this._page;
  }

  /**
   * 向右滚动
   */
  async right(pixel: number = 300): Promise<ScrollablePage> {
    const behavior = this._smooth ? "smooth" : "auto";
    await this._runJs(`window.scrollBy({ left: ${pixel}, behavior: '${behavior}' });`);
    if (this._waitComplete) await this._waitScrolled();
    return this._page;
  }

  /**
   * 滚动页面直到元素可见
   * @param locOrEle 元素的定位信息，可以是定位符或元素对象
   * @param center 是否尽量滚动到页面正中，为null时如果被遮挡，则滚动到页面正中
   */
  async to_see(locOrEle: string | { scroll_into_view: () => Promise<void>; scroll?: { to_see: (center?: boolean | null) => Promise<any> } }, center: boolean | null = null): Promise<ScrollablePage> {
    if (typeof locOrEle === "string") {
      // 使用定位符查找元素
      const behavior = this._smooth ? "smooth" : "auto";
      const block = center === true ? "center" : center === false ? "nearest" : "center";
      
      await this._runJs(`
        const el = document.querySelector(${JSON.stringify(locOrEle)});
        if (el) {
          el.scrollIntoView({ behavior: '${behavior}', block: '${block}' });
          ${center === null ? `
            // 检查是否被遮挡
            const rect = el.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            const topEl = document.elementFromPoint(x, y);
            if (topEl !== el && !el.contains(topEl)) {
              el.scrollIntoView({ behavior: '${behavior}', block: 'center' });
            }
          ` : ''}
        }
      `);
    } else if (locOrEle.scroll?.to_see) {
      // 元素对象，使用其 scroll.to_see 方法
      await locOrEle.scroll.to_see(center);
    } else {
      // 简单的 scroll_into_view
      await locOrEle.scroll_into_view();
    }
    
    if (this._waitComplete) await this._waitScrolled();
    return this._page;
  }

  protected async _runJs(js: string): Promise<void> {
    await this._page.cdpSession.send("Runtime.evaluate", {
      expression: js,
    });
  }

  protected async _waitScrolled(): Promise<void> {
    // 等待滚动完成
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
