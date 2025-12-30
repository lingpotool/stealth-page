"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageScroller = void 0;
/**
 * 页面滚动器，对应 DrissionPage 的 PageScroller
 * 所有方法返回页面对象以支持链式调用
 */
class PageScroller {
    constructor(page) {
        this._waitComplete = false;
        this._smooth = false;
        this._page = page;
    }
    /**
     * 设置是否等待滚动完成
     */
    set_wait_complete(on) {
        this._waitComplete = on;
    }
    /**
     * 设置是否平滑滚动
     */
    set_smooth(on) {
        this._smooth = on;
    }
    /**
     * 向下滚动若干像素
     */
    async __call__(pixel = 300) {
        return this.down(pixel);
    }
    /**
     * 滚动到顶部
     */
    async to_top() {
        const behavior = this._smooth ? "smooth" : "auto";
        await this._runJs(`window.scrollTo({ top: 0, behavior: '${behavior}' });`);
        if (this._waitComplete)
            await this._waitScrolled();
        return this._page;
    }
    /**
     * 滚动到底部
     */
    async to_bottom() {
        const behavior = this._smooth ? "smooth" : "auto";
        await this._runJs(`window.scrollTo({ top: document.body.scrollHeight, behavior: '${behavior}' });`);
        if (this._waitComplete)
            await this._waitScrolled();
        return this._page;
    }
    /**
     * 滚动到垂直中间位置
     */
    async to_half() {
        const behavior = this._smooth ? "smooth" : "auto";
        await this._runJs(`window.scrollTo({ top: document.body.scrollHeight / 2, behavior: '${behavior}' });`);
        if (this._waitComplete)
            await this._waitScrolled();
        return this._page;
    }
    /**
     * 滚动到最右边
     */
    async to_rightmost() {
        const behavior = this._smooth ? "smooth" : "auto";
        await this._runJs(`window.scrollTo({ left: document.body.scrollWidth, top: window.scrollY, behavior: '${behavior}' });`);
        if (this._waitComplete)
            await this._waitScrolled();
        return this._page;
    }
    /**
     * 滚动到最左边
     */
    async to_leftmost() {
        const behavior = this._smooth ? "smooth" : "auto";
        await this._runJs(`window.scrollTo({ left: 0, top: window.scrollY, behavior: '${behavior}' });`);
        if (this._waitComplete)
            await this._waitScrolled();
        return this._page;
    }
    /**
     * 滚动到指定位置
     */
    async to_location(x, y) {
        const behavior = this._smooth ? "smooth" : "auto";
        await this._runJs(`window.scrollTo({ left: ${x}, top: ${y}, behavior: '${behavior}' });`);
        if (this._waitComplete)
            await this._waitScrolled();
        return this._page;
    }
    /**
     * 向上滚动
     */
    async up(pixel = 300) {
        const behavior = this._smooth ? "smooth" : "auto";
        await this._runJs(`window.scrollBy({ top: -${pixel}, behavior: '${behavior}' });`);
        if (this._waitComplete)
            await this._waitScrolled();
        return this._page;
    }
    /**
     * 向下滚动
     */
    async down(pixel = 300) {
        const behavior = this._smooth ? "smooth" : "auto";
        await this._runJs(`window.scrollBy({ top: ${pixel}, behavior: '${behavior}' });`);
        if (this._waitComplete)
            await this._waitScrolled();
        return this._page;
    }
    /**
     * 向左滚动
     */
    async left(pixel = 300) {
        const behavior = this._smooth ? "smooth" : "auto";
        await this._runJs(`window.scrollBy({ left: -${pixel}, behavior: '${behavior}' });`);
        if (this._waitComplete)
            await this._waitScrolled();
        return this._page;
    }
    /**
     * 向右滚动
     */
    async right(pixel = 300) {
        const behavior = this._smooth ? "smooth" : "auto";
        await this._runJs(`window.scrollBy({ left: ${pixel}, behavior: '${behavior}' });`);
        if (this._waitComplete)
            await this._waitScrolled();
        return this._page;
    }
    /**
     * 滚动页面直到元素可见
     * @param locOrEle 元素的定位信息，可以是定位符或元素对象
     * @param center 是否尽量滚动到页面正中，为null时如果被遮挡，则滚动到页面正中
     */
    async to_see(locOrEle, center = null) {
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
        }
        else if (locOrEle.scroll?.to_see) {
            // 元素对象，使用其 scroll.to_see 方法
            await locOrEle.scroll.to_see(center);
        }
        else {
            // 简单的 scroll_into_view
            await locOrEle.scroll_into_view();
        }
        if (this._waitComplete)
            await this._waitScrolled();
        return this._page;
    }
    async _runJs(js) {
        await this._page.cdpSession.send("Runtime.evaluate", {
            expression: js,
        });
    }
    async _waitScrolled() {
        // 等待滚动完成
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}
exports.PageScroller = PageScroller;
