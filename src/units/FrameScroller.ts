import { CDPSession } from "../core/CDPSession";
import { PageScroller, ScrollablePage } from "./PageScroller";

/**
 * Frame 滚动接口
 */
export interface ScrollableFrame extends ScrollablePage {
  readonly frameId: string;
}

/**
 * Frame 滚动器，对应 DrissionPage 的 FrameScroller
 * 继承自 PageScroller，专门用于 iframe 内的滚动操作
 */
export class FrameScroller extends PageScroller {
  protected readonly _frame: ScrollableFrame;

  constructor(frame: ScrollableFrame) {
    super(frame);
    this._frame = frame;
  }

  /**
   * 滚动到顶部
   */
  async to_top(): Promise<ScrollableFrame> {
    await super.to_top();
    return this._frame;
  }

  /**
   * 滚动到底部
   */
  async to_bottom(): Promise<ScrollableFrame> {
    await super.to_bottom();
    return this._frame;
  }

  /**
   * 滚动到垂直中间位置
   */
  async to_half(): Promise<ScrollableFrame> {
    await super.to_half();
    return this._frame;
  }

  /**
   * 滚动到最右边
   */
  async to_rightmost(): Promise<ScrollableFrame> {
    await super.to_rightmost();
    return this._frame;
  }

  /**
   * 滚动到最左边
   */
  async to_leftmost(): Promise<ScrollableFrame> {
    await super.to_leftmost();
    return this._frame;
  }

  /**
   * 滚动到指定位置
   */
  async to_location(x: number, y: number): Promise<ScrollableFrame> {
    await super.to_location(x, y);
    return this._frame;
  }

  /**
   * 向上滚动
   */
  async up(pixel: number = 300): Promise<ScrollableFrame> {
    await super.up(pixel);
    return this._frame;
  }

  /**
   * 向下滚动
   */
  async down(pixel: number = 300): Promise<ScrollableFrame> {
    await super.down(pixel);
    return this._frame;
  }

  /**
   * 向左滚动
   */
  async left(pixel: number = 300): Promise<ScrollableFrame> {
    await super.left(pixel);
    return this._frame;
  }

  /**
   * 向右滚动
   */
  async right(pixel: number = 300): Promise<ScrollableFrame> {
    await super.right(pixel);
    return this._frame;
  }

  /**
   * 滚动页面直到元素可见
   */
  async to_see(locOrEle: string | { scroll_into_view: () => Promise<void>; scroll?: { to_see: (center?: boolean | null) => Promise<any> } }, center: boolean | null = null): Promise<ScrollableFrame> {
    await super.to_see(locOrEle, center);
    return this._frame;
  }
}
