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
exports.ElementWaiter = void 0;
const Settings_1 = require("../core/Settings");
function shouldRaise(raiseErr) {
    if (raiseErr === true)
        return true;
    if (raiseErr === false)
        return false;
    return Settings_1.Settings.raise_when_wait_failed;
}
class ElementWaiter {
    constructor(ele, defaultTimeout = 10000) {
        this._ele = ele;
        this._defaultTimeout = defaultTimeout;
    }
    async __call__(second, scope) {
        const ms = scope !== undefined
            ? (second + Math.random() * (scope - second)) * 1000
            : second * 1000;
        await new Promise(resolve => setTimeout(resolve, ms));
        return this._ele;
    }
    async deleted(timeout, raiseErr) {
        return this._waitState('is_alive', false, timeout, raiseErr);
    }
    async displayed(timeout, raiseErr) {
        return this._waitState('is_displayed', true, timeout, raiseErr);
    }
    async hidden(timeout, raiseErr) {
        return this._waitState('is_displayed', false, timeout, raiseErr);
    }
    async covered(timeout, raiseErr) {
        return this._waitState('is_covered', true, timeout, raiseErr);
    }
    async not_covered(timeout, raiseErr) {
        return this._waitState('is_covered', false, timeout, raiseErr);
    }
    async enabled(timeout, raiseErr) {
        return this._waitState('is_enabled', true, timeout, raiseErr);
    }
    async disabled(timeout, raiseErr) {
        return this._waitState('is_enabled', false, timeout, raiseErr);
    }
    async disabled_or_deleted(timeout, raiseErr) {
        const timeoutMs = timeout ?? this._defaultTimeout;
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
            try {
                const enabled = await this._ele.is_enabled();
                if (!enabled)
                    return this._ele;
            }
            catch {
                return this._ele;
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
        const timeoutMs = timeout ?? this._defaultTimeout;
        const t1 = Date.now();
        const result = await this._waitState('is_clickable', true, timeoutMs, false);
        if (waitMoved && result) {
            const remaining = timeoutMs - (Date.now() - t1);
            const moveResult = await this.stop_moving(remaining > 0 ? remaining : 100);
            if (!moveResult && shouldRaise(raiseErr)) {
                const { WaitTimeoutError } = await Promise.resolve().then(() => __importStar(require("../errors")));
                throw new WaitTimeoutError("clickable timeout (stop_moving)");
            }
            return moveResult;
        }
        if (!result && shouldRaise(raiseErr)) {
            const { WaitTimeoutError } = await Promise.resolve().then(() => __importStar(require("../errors")));
            throw new WaitTimeoutError("clickable timeout");
        }
        return result;
    }
    async has_rect(timeout, raiseErr) {
        return this._waitState('has_rect', true, timeout, raiseErr);
    }
    async stop_moving(timeout, gap = 100, raiseErr) {
        const timeoutMs = (timeout ?? this._defaultTimeout);
        if (timeoutMs <= 0) {
            return this._ele;
        }
        const deadline = Date.now() + timeoutMs;
        let lastRect = null;
        while (Date.now() < deadline) {
            try {
                const rect = await this._ele.get_rect();
                if (lastRect && rect.x === lastRect.x && rect.y === lastRect.y &&
                    rect.width === lastRect.width && rect.height === lastRect.height) {
                    return this._ele;
                }
                lastRect = rect;
            }
            catch {
                // element may not exist yet
            }
            await new Promise(resolve => setTimeout(resolve, gap));
        }
        if (shouldRaise(raiseErr)) {
            const { WaitTimeoutError } = await Promise.resolve().then(() => __importStar(require("../errors")));
            throw new WaitTimeoutError("stop_moving timeout");
        }
        return false;
    }
    async download_begin(timeout, cancelIt = false) {
        const timeoutMs = timeout ?? this._defaultTimeout;
        const session = this._ele.session;
        return new Promise((resolve) => {
            let resolved = false;
            const handler = (params) => {
                if (!resolved) {
                    resolved = true;
                    cleanup();
                    if (cancelIt) {
                        session.send("Browser.cancelDownload", { guid: params.guid }).catch(() => { });
                    }
                    resolve(params);
                }
            };
            const cleanup = () => {
                clearTimeout(timer);
                session.off("Browser.downloadWillBegin", handler);
            };
            const timer = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    cleanup();
                    resolve(false);
                }
            }, timeoutMs);
            session.on("Browser.downloadWillBegin", handler);
        });
    }
    async upload_paths_inputted(timeout) {
        const timeoutMs = timeout ?? this._defaultTimeout;
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        return true;
    }
    async state(stateName, mode = true, timeout, raiseErr) {
        return this._waitState(stateName, mode, timeout, raiseErr);
    }
    async _waitState(attr, mode, timeout, raiseErr) {
        const timeoutMs = timeout ?? this._defaultTimeout;
        const deadline = Date.now() + timeoutMs;
        const check = async () => {
            try {
                switch (attr) {
                    case 'is_alive': {
                        await this._ele.getObjectId();
                        return true;
                    }
                    case 'is_displayed': {
                        const displayed = await this._ele.is_displayed();
                        return displayed;
                    }
                    case 'is_enabled': {
                        const enabled = await this._ele.is_enabled();
                        return enabled;
                    }
                    case 'is_covered': {
                        if (this._ele.is_covered) {
                            const result = await this._ele.is_covered();
                            return result !== false;
                        }
                        return false;
                    }
                    case 'is_clickable': {
                        const displayed = await this._ele.is_displayed();
                        const enabled = await this._ele.is_enabled();
                        const rect = await this._ele.get_rect();
                        return displayed && enabled && rect.width > 0 && rect.height > 0;
                    }
                    case 'has_rect': {
                        const rect = await this._ele.get_rect();
                        return rect.width > 0 && rect.height > 0;
                    }
                    default:
                        return false;
                }
            }
            catch {
                if (attr === 'is_alive')
                    return false;
                if (attr === 'is_displayed')
                    return false;
                if (attr === 'is_enabled')
                    return false;
                return false;
            }
        };
        const initial = await check();
        if ((initial && mode) || (!initial && !mode)) {
            return this._ele;
        }
        while (Date.now() < deadline) {
            const result = await check();
            if ((result && mode) || (!result && !mode)) {
                return this._ele;
            }
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        if (shouldRaise(raiseErr)) {
            const { WaitTimeoutError } = await Promise.resolve().then(() => __importStar(require("../errors")));
            throw new WaitTimeoutError(`${attr} timeout`);
        }
        return false;
    }
}
exports.ElementWaiter = ElementWaiter;
