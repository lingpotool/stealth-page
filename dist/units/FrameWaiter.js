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
exports.FrameWaiter = void 0;
const Settings_1 = require("../core/Settings");
function shouldRaise(raiseErr) {
    if (raiseErr === true)
        return true;
    if (raiseErr === false)
        return false;
    return Settings_1.Settings.raise_when_wait_failed;
}
class FrameWaiter {
    constructor(frame) {
        this._frame = frame;
    }
    async wait(second, scope) {
        const waitTime = scope !== undefined
            ? second + Math.random() * (scope - second)
            : second;
        await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
        return this._frame;
    }
    async url_change(text, exclude = false, timeout, raiseErr) {
        const timeoutMs = (timeout ?? Settings_1.Settings.cdp_timeout) * 1000;
        const startUrl = await this._frame.url();
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
            const currentUrl = await this._frame.url();
            if (text === undefined) {
                if (currentUrl !== startUrl) {
                    return this._frame;
                }
            }
            else {
                const contains = currentUrl.includes(text);
                if (exclude ? !contains : contains) {
                    return this._frame;
                }
            }
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        if (shouldRaise(raiseErr)) {
            const { WaitTimeoutError } = await Promise.resolve().then(() => __importStar(require("../errors")));
            throw new WaitTimeoutError(`url_change timeout, waiting for: ${text}`);
        }
        return false;
    }
    async title_change(text, exclude = false, timeout, raiseErr) {
        const timeoutMs = (timeout ?? Settings_1.Settings.cdp_timeout) * 1000;
        const startTitle = await this._frame.title();
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
            const currentTitle = await this._frame.title();
            if (text === undefined) {
                if (currentTitle !== startTitle) {
                    return this._frame;
                }
            }
            else {
                const contains = currentTitle.includes(text);
                if (exclude ? !contains : contains) {
                    return this._frame;
                }
            }
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        if (shouldRaise(raiseErr)) {
            const { WaitTimeoutError } = await Promise.resolve().then(() => __importStar(require("../errors")));
            throw new WaitTimeoutError(`title_change timeout, waiting for: ${text}`);
        }
        return false;
    }
    async deleted(timeout, raiseErr) {
        const timeoutMs = (timeout ?? Settings_1.Settings.cdp_timeout) * 1000;
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
            try {
                await this._frame.frame_ele.getObjectId();
            }
            catch {
                return this._frame;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        if (shouldRaise(raiseErr)) {
            const { WaitTimeoutError } = await Promise.resolve().then(() => __importStar(require("../errors")));
            throw new WaitTimeoutError("deleted timeout");
        }
        return false;
    }
    async displayed(timeout, raiseErr) {
        const timeoutMs = (timeout ?? Settings_1.Settings.cdp_timeout) * 1000;
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
            try {
                const displayed = await this._frame.frame_ele.is_displayed();
                if (displayed)
                    return this._frame;
            }
            catch {
                // ignore
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        if (shouldRaise(raiseErr)) {
            const { WaitTimeoutError } = await Promise.resolve().then(() => __importStar(require("../errors")));
            throw new WaitTimeoutError("displayed timeout");
        }
        return false;
    }
    async hidden(timeout, raiseErr) {
        const timeoutMs = (timeout ?? Settings_1.Settings.cdp_timeout) * 1000;
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
            try {
                const displayed = await this._frame.frame_ele.is_displayed();
                if (!displayed)
                    return this._frame;
            }
            catch {
                return this._frame;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        if (shouldRaise(raiseErr)) {
            const { WaitTimeoutError } = await Promise.resolve().then(() => __importStar(require("../errors")));
            throw new WaitTimeoutError("hidden timeout");
        }
        return false;
    }
    async has_rect(timeout, raiseErr) {
        const timeoutMs = (timeout ?? Settings_1.Settings.cdp_timeout) * 1000;
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
            try {
                const rect = await this._frame.frame_ele.get_rect();
                if (rect.width > 0 && rect.height > 0)
                    return this._frame;
            }
            catch {
                // ignore
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        if (shouldRaise(raiseErr)) {
            const { WaitTimeoutError } = await Promise.resolve().then(() => __importStar(require("../errors")));
            throw new WaitTimeoutError("has_rect timeout");
        }
        return false;
    }
    async covered(timeout, raiseErr) {
        const timeoutMs = (timeout ?? Settings_1.Settings.cdp_timeout) * 1000;
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
            try {
                const result = await this._frame.frame_ele.states.is_covered;
                if (result !== false && result !== 0)
                    return this._frame;
            }
            catch {
                // ignore
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        if (shouldRaise(raiseErr)) {
            const { WaitTimeoutError } = await Promise.resolve().then(() => __importStar(require("../errors")));
            throw new WaitTimeoutError("covered timeout");
        }
        return false;
    }
    async not_covered(timeout, raiseErr) {
        const timeoutMs = (timeout ?? Settings_1.Settings.cdp_timeout) * 1000;
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
            try {
                const result = await this._frame.frame_ele.states.is_covered;
                if (result === false || result === 0)
                    return this._frame;
            }
            catch {
                return this._frame;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        if (shouldRaise(raiseErr)) {
            const { WaitTimeoutError } = await Promise.resolve().then(() => __importStar(require("../errors")));
            throw new WaitTimeoutError("not_covered timeout");
        }
        return false;
    }
    async enabled(timeout, raiseErr) {
        const timeoutMs = (timeout ?? Settings_1.Settings.cdp_timeout) * 1000;
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
            try {
                const enabled = await this._frame.frame_ele.is_enabled();
                if (enabled)
                    return this._frame;
            }
            catch {
                // ignore
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        if (shouldRaise(raiseErr)) {
            const { WaitTimeoutError } = await Promise.resolve().then(() => __importStar(require("../errors")));
            throw new WaitTimeoutError("enabled timeout");
        }
        return false;
    }
    async disabled(timeout, raiseErr) {
        const timeoutMs = (timeout ?? Settings_1.Settings.cdp_timeout) * 1000;
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
            try {
                const enabled = await this._frame.frame_ele.is_enabled();
                if (!enabled)
                    return this._frame;
            }
            catch {
                return this._frame;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        if (shouldRaise(raiseErr)) {
            const { WaitTimeoutError } = await Promise.resolve().then(() => __importStar(require("../errors")));
            throw new WaitTimeoutError("disabled timeout");
        }
        return false;
    }
    async disabled_or_deleted(timeout, raiseErr) {
        const timeoutMs = (timeout ?? Settings_1.Settings.cdp_timeout) * 1000;
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
            try {
                const enabled = await this._frame.frame_ele.is_enabled();
                if (!enabled)
                    return this._frame;
            }
            catch {
                return this._frame;
            }
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        if (shouldRaise(raiseErr)) {
            const { WaitTimeoutError } = await Promise.resolve().then(() => __importStar(require("../errors")));
            throw new WaitTimeoutError("disabled_or_deleted timeout");
        }
        return false;
    }
    async clickable(waitMoved = true, timeout, raiseErr) {
        const timeoutMs = (timeout ?? Settings_1.Settings.cdp_timeout) * 1000;
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
            try {
                const displayed = await this._frame.frame_ele.is_displayed();
                const enabled = await this._frame.frame_ele.is_enabled();
                const rect = await this._frame.frame_ele.get_rect();
                if (displayed && enabled && rect.width > 0 && rect.height > 0) {
                    if (waitMoved) {
                        const remaining = deadline - Date.now();
                        const stopped = await this.stop_moving(remaining > 0 ? remaining : 100);
                        if (stopped)
                            return this._frame;
                    }
                    else {
                        return this._frame;
                    }
                }
            }
            catch {
                // ignore
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        if (shouldRaise(raiseErr)) {
            const { WaitTimeoutError } = await Promise.resolve().then(() => __importStar(require("../errors")));
            throw new WaitTimeoutError("clickable timeout");
        }
        return false;
    }
    async stop_moving(timeout, gap = 100, raiseErr) {
        const timeoutMs = (timeout ?? Settings_1.Settings.cdp_timeout) * 1000;
        const deadline = Date.now() + timeoutMs;
        let lastRect = null;
        while (Date.now() < deadline) {
            try {
                const rect = await this._frame.frame_ele.get_rect();
                if (lastRect && rect.x === lastRect.x && rect.y === lastRect.y &&
                    rect.width === lastRect.width && rect.height === lastRect.height) {
                    return this._frame;
                }
                lastRect = rect;
            }
            catch {
                // ignore
            }
            await new Promise(resolve => setTimeout(resolve, gap));
        }
        if (shouldRaise(raiseErr)) {
            const { WaitTimeoutError } = await Promise.resolve().then(() => __importStar(require("../errors")));
            throw new WaitTimeoutError("stop_moving timeout");
        }
        return false;
    }
}
exports.FrameWaiter = FrameWaiter;
