"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Timeout = void 0;
class Timeout {
    constructor(base, pageLoad, script) {
        this.base = 10;
        this.page_load = 30;
        this.script = 30;
        if (base !== undefined)
            this.base = base;
        if (pageLoad !== undefined)
            this.page_load = pageLoad;
        if (script !== undefined)
            this.script = script;
    }
    set(base, pageLoad, script) {
        if (base !== undefined)
            this.base = base;
        if (pageLoad !== undefined)
            this.page_load = pageLoad;
        if (script !== undefined)
            this.script = script;
        return this;
    }
    get as_dict() {
        return { base: this.base, page_load: this.page_load, script: this.script };
    }
    toString() {
        return `{'base': ${this.base}, 'page_load': ${this.page_load}, 'script': ${this.script}}`;
    }
}
exports.Timeout = Timeout;
