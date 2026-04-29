"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Actions = void 0;
exports.location_to_client = location_to_client;
const Keys_1 = require("../core/Keys");
class Actions {
    constructor(owner) {
        this.modifier = 0;
        this.curr_x = 0;
        this.curr_y = 0;
        this._holding = 'left';
        this._owner = owner;
    }
    async move_to(eleOrLoc, offsetX, offsetY, duration = 0.5) {
        const midPoint = offsetX === undefined && offsetY === undefined;
        const ox = offsetX ?? 0;
        const oy = offsetY ?? 0;
        let isLoc = false;
        let cx;
        let cy;
        if (Array.isArray(eleOrLoc)) {
            isLoc = true;
            const lx = Number(eleOrLoc[0]) + ox;
            const ly = Number(eleOrLoc[1]) + oy;
            const [clientX, clientY] = await location_to_client(this._owner, lx, ly);
            cx = Number(clientX) || lx;
            cy = Number(clientY) || ly;
        }
        else if (typeof eleOrLoc === 'string' || eleOrLoc._type === 'ChromiumElement') {
            const ele = typeof eleOrLoc === 'string' ? await this._owner.ele(eleOrLoc) : eleOrLoc;
            if (this._owner.scroll) {
                await this._owner.scroll.to_see(ele);
            }
            const rect = ele.rect;
            const point = midPoint ? await rect.viewport_midpoint : await rect.viewport_location;
            cx = point.x + ox;
            cy = point.y + oy;
        }
        else {
            throw new Error('ele_or_loc must be tuple, element, or locator string');
        }
        const moveX = cx - this.curr_x;
        const moveY = cy - this.curr_y;
        await this.move(moveX, moveY, duration);
        return this;
    }
    async move(offsetX = 0, offsetY = 0, duration = 0.5) {
        if (duration < 0.02)
            duration = 0.02;
        const num = Math.max(1, Math.floor(duration * 50));
        const points = [];
        for (let i = 1; i < num; i++) {
            points.push([
                this.curr_x + i * (offsetX / num),
                this.curr_y + i * (offsetY / num),
            ]);
        }
        points.push([this.curr_x + offsetX, this.curr_y + offsetY]);
        for (const [x, y] of points) {
            const t = Date.now();
            this.curr_x = x;
            this.curr_y = y;
            const params = {
                type: 'mouseMoved',
                x: Number(x),
                y: Number(y),
            };
            if (this.modifier)
                params.modifiers = this.modifier;
            await this._owner.run_cdp('Input.dispatchMouseEvent', params);
            const elapsed = Date.now() - t;
            const sleepMs = 20 - elapsed;
            if (sleepMs > 0) {
                await new Promise(r => setTimeout(r, sleepMs));
            }
        }
        return this;
    }
    async click(onEle, times = 1) {
        await this._hold(onEle, 'left', times);
        await this.wait(0.05);
        this._release('left');
        return this;
    }
    async r_click(onEle, times = 1) {
        await this._hold(onEle, 'right', times);
        await this.wait(0.05);
        this._release('right');
        return this;
    }
    async m_click(onEle, times = 1) {
        await this._hold(onEle, 'middle', times);
        await this.wait(0.05);
        this._release('middle');
        return this;
    }
    async hold(onEle) {
        await this._hold(onEle, 'left');
        return this;
    }
    async release(onEle) {
        if (onEle) {
            await this.move_to(onEle, undefined, undefined, 0.2);
        }
        this._release('left');
        return this;
    }
    async r_hold(onEle) {
        await this._hold(onEle, 'right');
        return this;
    }
    async r_release(onEle) {
        if (onEle) {
            await this.move_to(onEle, undefined, undefined, 0.2);
        }
        this._release('right');
        return this;
    }
    async m_hold(onEle) {
        await this._hold(onEle, 'middle');
        return this;
    }
    async m_release(onEle) {
        if (onEle) {
            await this.move_to(onEle, undefined, undefined, 0.2);
        }
        this._release('middle');
        return this;
    }
    async _hold(onEle, button = 'left', count = 1) {
        if (onEle) {
            await this.move_to(onEle, undefined, undefined, 0.2);
        }
        await this._owner.run_cdp('Input.dispatchMouseEvent', {
            type: 'mousePressed',
            button,
            clickCount: count,
            x: this.curr_x,
            y: this.curr_y,
            modifiers: this.modifier,
        });
        this._holding = button;
        return this;
    }
    _release(button) {
        this._owner.run_cdp('Input.dispatchMouseEvent', {
            type: 'mouseReleased',
            button,
            clickCount: 1,
            x: this.curr_x,
            y: this.curr_y,
            modifiers: this.modifier,
        }).catch(() => { });
        this._holding = 'left';
    }
    async scroll(deltaY = 0, deltaX = 0, onEle) {
        if (onEle) {
            await this.move_to(onEle, undefined, undefined, 0.2);
        }
        await this._owner.run_cdp('Input.dispatchMouseEvent', {
            type: 'mouseWheel',
            x: this.curr_x,
            y: this.curr_y,
            deltaX,
            deltaY,
            modifiers: this.modifier,
        });
        return this;
    }
    async up(pixel) {
        return this.move(0, -pixel);
    }
    async down(pixel) {
        return this.move(0, pixel);
    }
    async left(pixel) {
        return this.move(-pixel, 0);
    }
    async right(pixel) {
        return this.move(pixel, 0);
    }
    async key_down(key) {
        const resolvedKey = Keys_1.Keys[key.toUpperCase()] || key;
        if (resolvedKey in Keys_1.modifierBit) {
            this.modifier |= Keys_1.modifierBit[resolvedKey] || 0;
            return this;
        }
        const data = (0, Keys_1.make_input_data)(resolvedKey, this.modifier, false);
        if (!data) {
            throw new Error(`No such key: ${key}`);
        }
        await this._owner.run_cdp('Input.dispatchKeyEvent', data);
        return this;
    }
    async key_up(key) {
        const resolvedKey = Keys_1.Keys[key.toUpperCase()] || key;
        if (resolvedKey in Keys_1.modifierBit) {
            this.modifier ^= Keys_1.modifierBit[resolvedKey] || 0;
            return this;
        }
        const data = (0, Keys_1.make_input_data)(resolvedKey, this.modifier, true);
        if (!data) {
            throw new Error(`No such key: ${key}`);
        }
        await this._owner.run_cdp('Input.dispatchKeyEvent', data);
        return this;
    }
    async type(keys, interval = 0) {
        const modifiers = [];
        if (!Array.isArray(keys)) {
            keys = [keys];
        }
        for (const item of keys) {
            for (const character of item) {
                if (character in Keys_1.modifierBit) {
                    this.modifier |= Keys_1.modifierBit[character] || 0;
                    modifiers.push(character);
                }
                const data = (0, Keys_1.make_input_data)(character, this.modifier, false);
                if (data) {
                    await this._owner.run_cdp('Input.dispatchKeyEvent', data);
                    if (!(character in Keys_1.modifierBit)) {
                        const upData = (0, Keys_1.make_input_data)(character, this.modifier, true);
                        if (upData) {
                            await this._owner.run_cdp('Input.dispatchKeyEvent', upData);
                        }
                    }
                }
                else {
                    await this._owner.run_cdp('Input.dispatchKeyEvent', {
                        type: 'char',
                        text: character,
                    });
                }
                if (interval > 0) {
                    await new Promise(r => setTimeout(r, interval * 1000));
                }
            }
        }
        for (const m of modifiers) {
            await this.key_up(m);
        }
        return this;
    }
    async input(text) {
        await (0, Keys_1.input_text_or_keys)(this._owner, text);
        return this;
    }
    async drag_in(eleOrLoc, files, text, title, baseURL) {
        const ele = typeof eleOrLoc === 'string' ? await this._owner.ele(eleOrLoc) : eleOrLoc;
        const { x, y } = await ele.rect.viewport_midpoint;
        let data;
        if (files) {
            const items = [];
            const paths = [];
            const fileList = Array.isArray(files) ? files : [files];
            const pathModule = await Promise.resolve().then(() => __importStar(require('path')));
            for (const file of fileList) {
                const p = pathModule.resolve(file);
                items.push({ mimeType: 'text/plain', data: p });
                paths.push(p);
            }
            data = { items, files: paths, dragOperationsMask: 16 };
        }
        else if (text !== undefined) {
            const item = { data: text };
            if (title !== undefined) {
                item.title = title;
                item.mimeType = 'text/uri-list';
            }
            else if (baseURL !== undefined) {
                item.baseURL = baseURL;
                item.mimeType = 'text/uri-list';
            }
            else {
                item.mimeType = 'text/plain';
            }
            data = { items: [item], dragOperationsMask: 1 };
        }
        else {
            throw new Error('Must provide files or text argument');
        }
        await this._owner.run_cdp('Input.dispatchDragEvent', {
            type: 'dragEnter',
            x,
            y,
            data,
            modifiers: this.modifier,
        });
        await this._owner.run_cdp('Input.dispatchDragEvent', {
            type: 'drop',
            x,
            y,
            data,
            modifiers: this.modifier,
        });
        return this;
    }
    async wait(second, scope) {
        await this._owner.wait(second, scope);
        return this;
    }
}
exports.Actions = Actions;
async function location_to_client(page, lx, ly) {
    try {
        const scrollX = Number(await page._run_js('return document.documentElement.scrollLeft;')) || 0;
        const scrollY = Number(await page._run_js('return document.documentElement.scrollTop;')) || 0;
        return [lx - scrollX, ly - scrollY];
    }
    catch {
        return [lx, ly];
    }
}
