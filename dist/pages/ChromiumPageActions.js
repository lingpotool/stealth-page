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
        this._page = page;
    }
    /**
     * 移动到指定坐标或元素
     */
    async move_to(eleOrLoc, offsetX = 0, offsetY = 0, duration = 0.5) {
        let x, y;
        if (eleOrLoc instanceof Element_1.Element) {
            const rect = await eleOrLoc.get_rect();
            x = rect.x + rect.width / 2 + offsetX;
            y = rect.y + rect.height / 2 + offsetY;
        }
        else if (typeof eleOrLoc === "string") {
            const ele = await this._page.ele(eleOrLoc);
            if (!ele)
                throw new Error(`Element not found: ${eleOrLoc}`);
            const rect = await ele.get_rect();
            x = rect.x + rect.width / 2 + offsetX;
            y = rect.y + rect.height / 2 + offsetY;
        }
        else {
            x = eleOrLoc.x + offsetX;
            y = eleOrLoc.y + offsetY;
        }
        if (duration > 0) {
            const steps = Math.max(1, Math.floor(duration * 20));
            const startX = this._currX;
            const startY = this._currY;
            for (let i = 1; i <= steps; i++) {
                const nx = startX + ((x - startX) * i) / steps;
                const ny = startY + ((y - startY) * i) / steps;
                await this.move(nx, ny);
                await new Promise(r => setTimeout(r, duration * 1000 / steps));
            }
        }
        else {
            await this.move(x, y);
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
     * 相对当前位置移动
     */
    async move_by(offsetX = 0, offsetY = 0, duration = 0.5) {
        return this.move_to({ x: this._currX, y: this._currY }, offsetX, offsetY, duration);
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
        const page = this._page["_page"];
        if (!page)
            return this;
        for (let i = 0; i < times; i++) {
            await page.cdpSession.send("Input.dispatchMouseEvent", {
                type: "mousePressed",
                x: this._currX,
                y: this._currY,
                button,
                clickCount: 1,
                modifiers: this._modifier,
            });
            await page.cdpSession.send("Input.dispatchMouseEvent", {
                type: "mouseReleased",
                x: this._currX,
                y: this._currY,
                button,
                clickCount: 1,
                modifiers: this._modifier,
            });
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
