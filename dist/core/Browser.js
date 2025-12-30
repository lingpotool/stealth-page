"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Browser = void 0;
const Page_1 = require("./Page");
class Browser {
    constructor(session, options = {}) {
        this.closed = false;
        this.session = session;
        this.options = options;
    }
    static async attach(session, options = {}) {
        return new Browser(session, options);
    }
    async newPage() {
        if (this.closed) {
            throw new Error("Browser is already closed.");
        }
        const page = new Page_1.Page(this.session);
        await page.init(this.options);
        return page;
    }
    async close() {
        if (this.closed) {
            return;
        }
        this.closed = true;
        try {
            await this.session.send("Browser.close");
        }
        catch {
        }
    }
}
exports.Browser = Browser;
