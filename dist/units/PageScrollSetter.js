"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageScrollSetter = void 0;
/**
 * 页面滚动设置类
 * 对应 DrissionPage.PageScrollSetter
 */
class PageScrollSetter {
    constructor(scroll) {
        this._scroll = scroll;
    }
    /**
     * 设置滚动命令后是否等待完成
     */
    wait_complete(onOff = true) {
        this._scroll._waitComplete = onOff;
    }
    /**
     * 设置页面滚动是否平滑滚动
     */
    smooth(onOff = true) {
        this._scroll._smooth = onOff;
    }
}
exports.PageScrollSetter = PageScrollSetter;
