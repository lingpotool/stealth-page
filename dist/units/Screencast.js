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
exports.Screencast = exports.ScreencastModeSetter = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * 录屏模式设置类
 */
class ScreencastModeSetter {
    constructor(screencast) {
        this._screencast = screencast;
    }
    /**
     * 持续视频模式
     */
    video_mode() {
        this._screencast["_mode"] = "video";
    }
    /**
     * 节俭视频模式（页面有变化时才录制）
     */
    frugal_video_mode() {
        this._screencast["_mode"] = "frugal_video";
    }
    /**
     * 持续截图模式
     */
    imgs_mode() {
        this._screencast["_mode"] = "imgs";
    }
    /**
     * 节俭截图模式（页面有变化时才截图）
     */
    frugal_imgs_mode() {
        this._screencast["_mode"] = "frugal_imgs";
    }
}
exports.ScreencastModeSetter = ScreencastModeSetter;
/**
 * 屏幕录制类，对应 DrissionPage 的 Screencast
 */
class Screencast {
    constructor(owner) {
        this._path = null;
        this._tmpPath = null;
        this._running = false;
        this._mode = "imgs";
        this._frames = [];
        this._frameHandler = null;
        this._setMode = null;
        this._frameCount = 0;
        this._owner = owner;
    }
    /**
     * 是否正在录制
     */
    get running() {
        return this._running;
    }
    /**
     * 返回用于设置录屏模式的对象
     */
    get set_mode() {
        if (!this._setMode) {
            this._setMode = new ScreencastModeSetter(this);
        }
        return this._setMode;
    }
    /**
     * 设置保存路径
     */
    set_save_path(savePath) {
        this._path = savePath;
        if (!fs.existsSync(savePath)) {
            fs.mkdirSync(savePath, { recursive: true });
        }
    }
    /**
     * 开始录屏
     */
    async start(savePath) {
        if (this._running)
            return;
        if (savePath) {
            this.set_save_path(savePath);
        }
        if (!this._path) {
            this._path = process.cwd();
        }
        // 创建临时目录存放帧
        this._tmpPath = path.join(this._path, `.screencast_tmp_${Date.now()}`);
        if (!fs.existsSync(this._tmpPath)) {
            fs.mkdirSync(this._tmpPath, { recursive: true });
        }
        this._frames = [];
        this._frameCount = 0;
        // 设置帧处理器
        this._frameHandler = async (params) => {
            const { data, sessionId } = params;
            const frameBuffer = Buffer.from(data, "base64");
            if (this._mode === "imgs" || this._mode === "frugal_imgs") {
                // 图片模式：保存每一帧
                const framePath = path.join(this._tmpPath, `frame_${String(this._frameCount).padStart(6, "0")}.png`);
                fs.writeFileSync(framePath, frameBuffer);
            }
            else {
                // 视频模式：存储帧数据
                this._frames.push(frameBuffer);
            }
            this._frameCount++;
            // 确认帧已处理
            await this._owner.cdpSession.send("Page.screencastFrameAck", {
                sessionId,
            });
        };
        this._owner.cdpSession.on("Page.screencastFrame", this._frameHandler);
        // 启动录屏
        await this._owner.cdpSession.send("Page.startScreencast", {
            format: "png",
            quality: 80,
            everyNthFrame: this._mode.startsWith("frugal") ? 5 : 1,
        });
        this._running = true;
    }
    /**
     * 停止录屏
     */
    async stop(videoName) {
        if (!this._running) {
            return "";
        }
        // 停止录屏
        await this._owner.cdpSession.send("Page.stopScreencast");
        if (this._frameHandler) {
            this._owner.cdpSession.off("Page.screencastFrame", this._frameHandler);
            this._frameHandler = null;
        }
        this._running = false;
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const name = videoName || `screencast_${timestamp}`;
        let resultPath;
        if (this._mode === "imgs" || this._mode === "frugal_imgs") {
            // 图片模式：移动临时目录
            const finalDir = path.join(this._path, name);
            if (this._tmpPath && fs.existsSync(this._tmpPath)) {
                fs.renameSync(this._tmpPath, finalDir);
            }
            resultPath = finalDir;
        }
        else {
            // 视频模式：需要外部工具合成视频
            // 这里只保存帧图片，实际视频合成需要 ffmpeg 等工具
            const finalDir = path.join(this._path, name);
            if (!fs.existsSync(finalDir)) {
                fs.mkdirSync(finalDir, { recursive: true });
            }
            // 保存所有帧
            for (let i = 0; i < this._frames.length; i++) {
                const framePath = path.join(finalDir, `frame_${String(i).padStart(6, "0")}.png`);
                fs.writeFileSync(framePath, this._frames[i]);
            }
            // 清理临时目录
            if (this._tmpPath && fs.existsSync(this._tmpPath)) {
                fs.rmSync(this._tmpPath, { recursive: true, force: true });
            }
            resultPath = finalDir;
        }
        this._frames = [];
        this._tmpPath = null;
        return resultPath;
    }
}
exports.Screencast = Screencast;
