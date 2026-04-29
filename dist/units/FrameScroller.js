"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrameScroller = void 0;
const PageScroller_1 = require("./PageScroller");
class FrameScroller extends PageScroller_1.PageScroller {
    constructor(page) {
        super(page);
    }
}
exports.FrameScroller = FrameScroller;
