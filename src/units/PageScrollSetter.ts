import { PageScroller } from "./PageScroller";

/**
 * 页面滚动设置类
 * 对应 DrissionPage.PageScrollSetter
 */
export class PageScrollSetter {
  private readonly _scroll: PageScroller;

  constructor(scroll: PageScroller) {
    this._scroll = scroll;
  }

  /**
   * 设置滚动命令后是否等待完成
   */
  wait_complete(onOff: boolean = true): void {
    (this._scroll as any)._waitComplete = onOff;
  }

  /**
   * 设置页面滚动是否平滑滚动
   */
  smooth(onOff: boolean = true): void {
    (this._scroll as any)._smooth = onOff;
  }
}
