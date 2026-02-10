"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChromiumPageActions = void 0;
const Element_1 = require("../core/Element");
const Keys_1 = require("../core/Keys");
/**
 * 动作链类，对应 DrissionPage 的 Actions
 */
class ChromiumPageActions {
    constructor(page) {
        this._currX = 0;
        this._currY = 0;
        this._modifier = 0;
        this._holding = "left";
        this._page = page;
    }
    /** 返回使用此动作链的页面对象 */
    get owner() {
        return this._page;
    }
    /** 当前光标 x 坐标 */
    get curr_x() {
        return this._currX;
    }
    /** 当前光标 y 坐标 */
    get curr_y() {
        return this._currY;
    }
    /**
     * 移动到指定坐标或元素（对齐 DrissionPage Actions.move_to）
     * 使用视口坐标，与 Input.dispatchMouseEvent 一致
     */
    async move_to(eleOrLoc, offsetX, offsetY, duration = 0.5) {
        let cx, cy;
        const midPoint = offsetX === undefined && offsetY === undefined;
        if (offsetX === undefined)
            offsetX = 0;
        if (offsetY === undefined)
            offsetY = 0;
        if (eleOrLoc instanceof Element_1.Element) {
            // 先滚动到可见
            await eleOrLoc.scroll_into_view();
            if (midPoint) {
                const vp = await eleOrLoc.rect.viewport_midpoint();
                cx = vp.x + offsetX;
                cy = vp.y + offsetY;
            }
            else {
                const vp = await eleOrLoc.rect.viewport_location();
                cx = vp.x + offsetX;
                cy = vp.y + offsetY;
            }
        }
        else if (typeof eleOrLoc === "string") {
            const ele = await this._page.ele(eleOrLoc);
            if (!ele)
                throw new Error(`Element not found: ${eleOrLoc}`);
            await ele.scroll_into_view();
            if (midPoint) {
                const vp = await ele.rect.viewport_midpoint();
                cx = vp.x + offsetX;
                cy = vp.y + offsetY;
            }
            else {
                const vp = await ele.rect.viewport_location();
                cx = vp.x + offsetX;
                cy = vp.y + offsetY;
            }
        }
        else {
            // 传入的是页面坐标，需要转换为视口坐标
            const page = this._page["_page"];
            if (page) {
                const { result } = await page.cdpSession.send("Runtime.evaluate", {
                    expression: `({sx: document.documentElement.scrollLeft, sy: document.documentElement.scrollTop})`,
                    returnByValue: true,
                });
                cx = eleOrLoc.x + offsetX - result.value.sx;
                cy = eleOrLoc.y + offsetY - result.value.sy;
            }
            else {
                cx = eleOrLoc.x + offsetX;
                cy = eleOrLoc.y + offsetY;
            }
        }
        if (duration > 0) {
            const steps = Math.max(1, Math.floor(duration * 50));
            const startX = this._currX;
            const startY = this._currY;
            for (let i = 1; i <= steps; i++) {
                const nx = startX + ((cx - startX) * i) / steps;
                const ny = startY + ((cy - startY) * i) / steps;
                const t = performance.now();
                await this.move(nx, ny);
                const elapsed = performance.now() - t;
                const sleepMs = 20 - elapsed;
                if (sleepMs > 0) {
                    await new Promise(r => setTimeout(r, sleepMs));
                }
            }
        }
        else {
            await this.move(cx, cy);
        }
        return this;
    }
    /**
     * 移动到坐标
     */
    async move(x, y) {
        const page = this._page["_page"];
        if (page) {
            await page.cdpSession.send("Input.dispatchMouseEvent", {
                type: "mouseMoved",
                button: this._holding,
                x,
                y,
                modifiers: this._modifier,
            });
            this._currX = x;
            this._currY = y;
        }
        return this;
    }
    /**
     * 相对当前位置移动（对齐 DrissionPage Actions.move）
     */
    async move_by(offsetX = 0, offsetY = 0, duration = 0.5) {
        duration = duration < 0.02 ? 0.02 : duration;
        const num = Math.floor(duration * 50);
        const points = [];
        for (let i = 1; i < num; i++) {
            points.push([
                this._currX + i * (offsetX / num),
                this._currY + i * (offsetY / num),
            ]);
        }
        points.push([this._currX + offsetX, this._currY + offsetY]);
        for (const [px, py] of points) {
            const t = performance.now();
            await this.move(px, py);
            const sleepMs = 20 - (performance.now() - t);
            if (sleepMs > 0) {
                await new Promise(r => setTimeout(r, sleepMs));
            }
        }
        return this;
    }
    /**
     * 点击
     */
    async click(onEle, times = 1) {
        if (onEle) {
            await this.move_to(onEle);
        }
        return this._click("left", times);
    }
    /**
     * 右键点击
     */
    async r_click(onEle, times = 1) {
        if (onEle) {
            await this.move_to(onEle);
        }
        return this._click("right", times);
    }
    /**
     * 中键点击
     */
    async m_click(onEle, times = 1) {
        if (onEle) {
            await this.move_to(onEle);
        }
        return this._click("middle", times);
    }
    async _click(button, times) {
        // 对齐 DrissionPage: hold(count) + wait(.05) + release
        await this._hold(button);
        await new Promise(r => setTimeout(r, 50));
        await this._release(button);
        // 多次点击
        for (let i = 1; i < times; i++) {
            await this._hold(button);
            await new Promise(r => setTimeout(r, 50));
            await this._release(button);
        }
        return this;
    }
    /**
     * 按住鼠标左键
     */
    async hold(onEle) {
        if (onEle) {
            await this.move_to(onEle);
        }
        return this._hold("left");
    }
    /**
     * 释放鼠标左键
     */
    async release(onEle) {
        if (onEle) {
            await this.move_to(onEle);
        }
        return this._release("left");
    }
    /**
     * 按住鼠标右键
     */
    async r_hold(onEle) {
        if (onEle) {
            await this.move_to(onEle);
        }
        return this._hold("right");
    }
    /**
     * 释放鼠标右键
     */
    async r_release(onEle) {
        if (onEle) {
            await this.move_to(onEle);
        }
        return this._release("right");
    }
    /**
     * 按住鼠标中键
     */
    async m_hold(onEle) {
        if (onEle) {
            await this.move_to(onEle);
        }
        return this._hold("middle");
    }
    /**
     * 释放鼠标中键
     */
    async m_release(onEle) {
        if (onEle) {
            await this.move_to(onEle);
        }
        return this._release("middle");
    }
    async _hold(button) {
        const page = this._page["_page"];
        if (page) {
            await page.cdpSession.send("Input.dispatchMouseEvent", {
                type: "mousePressed",
                x: this._currX,
                y: this._currY,
                button,
                clickCount: 1,
                modifiers: this._modifier,
            });
            this._holding = button;
        }
        return this;
    }
    async _release(button) {
        const page = this._page["_page"];
        if (page) {
            await page.cdpSession.send("Input.dispatchMouseEvent", {
                type: "mouseReleased",
                x: this._currX,
                y: this._currY,
                button,
                clickCount: 1,
                modifiers: this._modifier,
            });
            this._holding = "left";
        }
        return this;
    }
    /**
     * 拖拽
     */
    async drag(fromX, fromY, toX, toY, duration = 0.5) {
        await this.move(fromX, fromY);
        await this._hold("left");
        const steps = Math.max(1, Math.floor(duration * 20));
        for (let i = 1; i <= steps; i++) {
            const x = fromX + ((toX - fromX) * i) / steps;
            const y = fromY + ((toY - fromY) * i) / steps;
            await this.move(x, y);
            await new Promise(r => setTimeout(r, duration * 1000 / steps));
        }
        await this._release("left");
        return this;
    }
    /**
     * 滚动
     */
    async scroll(deltaY = 0, deltaX = 0, onEle) {
        if (onEle) {
            await this.move_to(onEle);
        }
        const page = this._page["_page"];
        if (page) {
            await page.cdpSession.send("Input.dispatchMouseEvent", {
                type: "mouseWheel",
                x: this._currX,
                y: this._currY,
                deltaX,
                deltaY,
                modifiers: this._modifier,
            });
        }
        return this;
    }
    /**
     * 向上移动
     */
    async up(pixel) {
        return this.move_by(0, -pixel, 0);
    }
    /**
     * 向下移动
     */
    async down(pixel) {
        return this.move_by(0, pixel, 0);
    }
    /**
     * 向左移动
     */
    async left(pixel) {
        return this.move_by(-pixel, 0, 0);
    }
    /**
     * 向右移动
     */
    async right(pixel) {
        return this.move_by(pixel, 0, 0);
    }
    /**
     * 按下键盘按键
     */
    async key_down(key) {
        const page = this._page["_page"];
        if (!page)
            return this;
        // 检查是否是修饰键
        if (key in Keys_1.modifierBit) {
            this._modifier |= Keys_1.modifierBit[key];
        }
        const def = Keys_1.keyDefinitions[key] || { key, keyCode: 0, code: "" };
        await page.cdpSession.send("Input.dispatchKeyEvent", {
            type: "keyDown",
            key: def.key,
            code: def.code,
            windowsVirtualKeyCode: def.keyCode,
            modifiers: this._modifier,
        });
        return this;
    }
    /**
     * 释放键盘按键
     */
    async key_up(key) {
        const page = this._page["_page"];
        if (!page)
            return this;
        // 检查是否是修饰键
        if (key in Keys_1.modifierBit) {
            this._modifier &= ~Keys_1.modifierBit[key];
        }
        const def = Keys_1.keyDefinitions[key] || { key, keyCode: 0, code: "" };
        await page.cdpSession.send("Input.dispatchKeyEvent", {
            type: "keyUp",
            key: def.key,
            code: def.code,
            windowsVirtualKeyCode: def.keyCode,
            modifiers: this._modifier,
        });
        return this;
    }
    /**
     * 模拟键盘输入
     */
    async type(keys, interval = 0) {
        const page = this._page["_page"];
        if (!page)
            return this;
        const chars = Array.isArray(keys) ? keys : keys.split("");
        for (const char of chars) {
            if (char.length === 1) {
                await page.cdpSession.send("Input.insertText", { text: char });
            }
            else {
                // 特殊键
                await this.key_down(char);
                await this.key_up(char);
            }
            if (interval > 0) {
                await new Promise(r => setTimeout(r, interval));
            }
        }
        return this;
    }
    /**
     * 直接输入文本
     */
    async input(text) {
        const page = this._page["_page"];
        if (page) {
            await page.cdpSession.send("Input.insertText", { text });
        }
        return this;
    }
    /**
     * 从浏览器外拖入文件、文本等
     */
    async drag_in(eleOrLoc, options = {}) {
        // 先移动到目标元素
        await this.move_to(eleOrLoc);
        const page = this._page["_page"];
        if (!page)
            return this;
        const { files, text, title, baseURL } = options;
        if (files) {
            // 拖入文件
            const fileList = Array.isArray(files) ? files : [files];
            // 使用 Input.setFilesToUpload 或模拟拖放事件
            // 这里简化实现，通过 dispatchDragEvent
            await page.cdpSession.send("Input.dispatchDragEvent", {
                type: "dragEnter",
                x: this._currX,
                y: this._currY,
                data: {
                    items: fileList.map(f => ({
                        mimeType: "application/octet-stream",
                        data: f,
                    })),
                    dragOperationsMask: 1,
                },
            });
            await page.cdpSession.send("Input.dispatchDragEvent", {
                type: "drop",
                x: this._currX,
                y: this._currY,
                data: {
                    items: fileList.map(f => ({
                        mimeType: "application/octet-stream",
                        data: f,
                    })),
                    dragOperationsMask: 1,
                },
            });
        }
        else if (text) {
            // 拖入文本
            const mimeType = title ? "text/uri-list" : (baseURL ? "text/html" : "text/plain");
            await page.cdpSession.send("Input.dispatchDragEvent", {
                type: "dragEnter",
                x: this._currX,
                y: this._currY,
                data: {
                    items: [{ mimeType, data: text }],
                    dragOperationsMask: 1,
                },
            });
            await page.cdpSession.send("Input.dispatchDragEvent", {
                type: "drop",
                x: this._currX,
                y: this._currY,
                data: {
                    items: [{ mimeType, data: text }],
                    dragOperationsMask: 1,
                },
            });
        }
        return this;
    }
    /**
     * 等待
     */
    async wait(second, scope) {
        const ms = scope !== undefined
            ? (second + Math.random() * (scope - second)) * 1000
            : second * 1000;
        await new Promise(r => setTimeout(r, ms));
        return this;
    }
}
exports.ChromiumPageActions = ChromiumPageActions;
