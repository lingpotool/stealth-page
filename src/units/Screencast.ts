import { CDPSession } from "../core/CDPSession";
import * as fs from "fs";
import * as path from "path";

/**
 * 录屏模式
 */
export type ScreencastMode = "video" | "frugal_video" | "imgs" | "frugal_imgs";

/**
 * 录屏页面接口
 */
export interface ScreencastPage {
  cdpSession: CDPSession;
}

/**
 * 录屏模式设置类
 */
export class ScreencastModeSetter {
  private readonly _screencast: Screencast;

  constructor(screencast: Screencast) {
    this._screencast = screencast;
  }

  /**
   * 持续视频模式
   */
  video_mode(): void {
    this._screencast["_mode"] = "video";
  }

  /**
   * 节俭视频模式（页面有变化时才录制）
   */
  frugal_video_mode(): void {
    this._screencast["_mode"] = "frugal_video";
  }

  /**
   * 持续截图模式
   */
  imgs_mode(): void {
    this._screencast["_mode"] = "imgs";
  }

  /**
   * 节俭截图模式（页面有变化时才截图）
   */
  frugal_imgs_mode(): void {
    this._screencast["_mode"] = "frugal_imgs";
  }
}

/**
 * 屏幕录制类，对应 DrissionPage 的 Screencast
 */
export class Screencast {
  private readonly _owner: ScreencastPage;
  private _path: string | null = null;
  private _tmpPath: string | null = null;
  private _running: boolean = false;
  private _mode: ScreencastMode = "imgs";
  private _frames: Buffer[] = [];
  private _frameHandler: ((params: any) => void) | null = null;
  private _setMode: ScreencastModeSetter | null = null;
  private _frameCount: number = 0;

  constructor(owner: ScreencastPage) {
    this._owner = owner;
  }

  /**
   * 是否正在录制
   */
  get running(): boolean {
    return this._running;
  }

  /**
   * 返回用于设置录屏模式的对象
   */
  get set_mode(): ScreencastModeSetter {
    if (!this._setMode) {
      this._setMode = new ScreencastModeSetter(this);
    }
    return this._setMode;
  }

  /**
   * 设置保存路径
   */
  set_save_path(savePath: string): void {
    this._path = savePath;
    if (!fs.existsSync(savePath)) {
      fs.mkdirSync(savePath, { recursive: true });
    }
  }

  /**
   * 开始录屏
   */
  async start(savePath?: string): Promise<void> {
    if (this._running) return;

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
    this._frameHandler = async (params: any) => {
      const { data, sessionId } = params;
      const frameBuffer = Buffer.from(data, "base64");
      
      if (this._mode === "imgs" || this._mode === "frugal_imgs") {
        // 图片模式：保存每一帧
        const framePath = path.join(this._tmpPath!, `frame_${String(this._frameCount).padStart(6, "0")}.png`);
        fs.writeFileSync(framePath, frameBuffer);
      } else {
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
  async stop(videoName?: string): Promise<string> {
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

    let resultPath: string;

    if (this._mode === "imgs" || this._mode === "frugal_imgs") {
      // 图片模式：移动临时目录
      const finalDir = path.join(this._path!, name);
      if (this._tmpPath && fs.existsSync(this._tmpPath)) {
        fs.renameSync(this._tmpPath, finalDir);
      }
      resultPath = finalDir;
    } else {
      // 视频模式：需要外部工具合成视频
      // 这里只保存帧图片，实际视频合成需要 ffmpeg 等工具
      const finalDir = path.join(this._path!, name);
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
