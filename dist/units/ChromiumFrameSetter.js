"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChromiumFrameSetter = void 0;
class ChromiumFrameSetter {
    constructor(frame) {
        this._frame = frame;
    }
    async attr(name, value = "") {
        await this._frame.frame_ele.set.attr(name, value);
    }
    async property(name, value) {
        await this._frame.frame_ele.set.property(name, value);
    }
    async style(name, value) {
        await this._frame.frame_ele.set.style(name, value);
    }
}
exports.ChromiumFrameSetter = ChromiumFrameSetter;
