"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrameRect = void 0;
const PageRect_1 = require("./PageRect");
class FrameRect extends PageRect_1.PageRect {
    constructor(page) {
        super(page);
    }
}
exports.FrameRect = FrameRect;
