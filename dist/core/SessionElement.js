"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionElement = void 0;
class SessionElement {
    constructor($, node) {
        this.$ = $;
        this.node = node;
    }
    async text() {
        return this.$(this.node).text().trim();
    }
    async html() {
        const html = this.$(this.node).html();
        return html ?? "";
    }
    async outer_html() {
        // cheerio 没有直接的 outerHTML，需要包装
        const el = this.$(this.node);
        return this.$.html(el) ?? "";
    }
    async attr(name) {
        const val = this.$(this.node).attr(name);
        return val ?? null;
    }
    async value() {
        const val = this.$(this.node).val();
        return val?.toString() ?? "";
    }
    async tag_name() {
        const el = this.$(this.node);
        return (el.prop("tagName") || "").toLowerCase();
    }
    async parent() {
        const parentNode = this.$(this.node).parent().get(0);
        if (!parentNode) {
            return null;
        }
        return new SessionElement(this.$, parentNode);
    }
    async child(index = 1) {
        const children = this.$(this.node).children().toArray();
        const childNode = children[index - 1];
        if (!childNode) {
            return null;
        }
        return new SessionElement(this.$, childNode);
    }
    async children() {
        const childNodes = this.$(this.node).children().toArray();
        return childNodes.map((node) => new SessionElement(this.$, node));
    }
    async next() {
        const nextNode = this.$(this.node).next().get(0);
        if (!nextNode) {
            return null;
        }
        return new SessionElement(this.$, nextNode);
    }
    async prev() {
        const prevNode = this.$(this.node).prev().get(0);
        if (!prevNode) {
            return null;
        }
        return new SessionElement(this.$, prevNode);
    }
    async ele(locator) {
        const found = this.$(this.node).find(locator).get(0);
        if (!found) {
            return null;
        }
        return new SessionElement(this.$, found);
    }
    async eles(locator) {
        const nodes = this.$(this.node).find(locator).toArray();
        return nodes.map((node) => new SessionElement(this.$, node));
    }
}
exports.SessionElement = SessionElement;
