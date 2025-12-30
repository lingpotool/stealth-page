"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrameScroller = void 0;
const PageScroller_1 = require("./PageScroller");
/**
 * Frame 滚动器，对应 DrissionPage 的 FrameScroller
 * 继承自 PageScroller，专门用于 iframe 内的滚动操作
 */
class FrameScroller extends PageScroller_1.PageScroller {
    constructor(frame) {
        super(frame);
        this._frame = frame;
    }
    /**
     * 滚动到顶部
     */
    async to_top() {
        await super.to_top();
        return this._frame;
    }
    /**
     * 滚动到底部
     */
    async to_bottom() {
        await super.to_bottom();
        return this._frame;
    }
    /**
     * 滚动到垂直中间位置
     */
    async to_half() {
        await super.to_half();
        return this._frame;
    }
    /**
     * 滚动到最右边
     */
    async to_rightmost() {
        await super.to_rightmost();
        return this._frame;
    }
    /**
     * 滚动到最左边
     */
    async to_leftmost() {
        await super.to_leftmost();
        return this._frame;
    }
    /**
     * 滚动到指定位置
     */
    async to_location(x, y) {
        await super.to_location(x, y);
        return this._frame;
    }
    /**
     * 向上滚动
     */
    async up(pixel = 300) {
        await super.up(pixel);
        return this._frame;
    }
    /**
     * 向下滚动
     */
    async down(pixel = 300) {
        await super.down(pixel);
        return this._frame;
    }
    /**
     * 向左滚动
     */
    async left(pixel = 300) {
        await super.left(pixel);
        return this._frame;
    }
    /**
     * 向右滚动
     */
    async right(pixel = 300) {
        await super.right(pixel);
        return this._frame;
    }
    /**
     * 滚动页面直到元素可见
     */
    async to_see(locOrEle, center = null) {
        await super.to_see(locOrEle, center);
        return this._frame;
    }
}
exports.FrameScroller = FrameScroller;
