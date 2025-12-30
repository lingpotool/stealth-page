import { ChromiumPage } from "./ChromiumPage";

export interface DownloadInfo {
  url: string;
  path: string;
  state: "in_progress" | "completed" | "canceled";
  totalBytes: number;
  receivedBytes: number;
  guid: string;
  folder?: string;
  name?: string;
  finalPath?: string;
}

/**
 * 下载任务类
 */
export class DownloadMission {
  private readonly _downloader: ChromiumPageDownloader;
  readonly guid: string;
  readonly url: string;
  folder: string;
  name: string;
  state: string = "in_progress";
  totalBytes: number = 0;
  receivedBytes: number = 0;
  finalPath: string | null = null;
  private _isDone: boolean = false;

  constructor(downloader: ChromiumPageDownloader, guid: string, url: string, folder: string, name: string) {
    this._downloader = downloader;
    this.guid = guid;
    this.url = url;
    this.folder = folder;
    this.name = name;
  }

  /**
   * 下载进度百分比
   */
  get rate(): number {
    if (this.totalBytes === 0) return 0;
    return (this.receivedBytes / this.totalBytes) * 100;
  }

  /**
   * 任务是否完成
   */
  get is_done(): boolean {
    return this._isDone || this.state === "completed" || this.state === "canceled";
  }

  /**
   * 取消下载
   */
  async cancel(): Promise<void> {
    await this._downloader.cancel(this.guid);
    this.state = "canceled";
    this._isDone = true;
  }

  /**
   * 等待下载完成
   */
  async wait(show: boolean = true, timeout?: number, cancelIfTimeout: boolean = true): Promise<string | false> {
    const startTime = Date.now();
    const timeoutMs = timeout ? timeout * 1000 : Infinity;

    while (!this.is_done) {
      if (Date.now() - startTime > timeoutMs) {
        if (cancelIfTimeout) {
          await this.cancel();
        }
        return false;
      }

      if (show) {
        const percent = this.rate.toFixed(1);
        process.stdout.write(`\rDownloading: ${percent}% (${this.receivedBytes}/${this.totalBytes})`);
      }

      await new Promise(r => setTimeout(r, 200));
    }

    if (show) {
      console.log(`\nDownload completed: ${this.finalPath || this.name}`);
    }

    return this.finalPath || `${this.folder}/${this.name}`;
  }

  /**
   * 更新状态
   */
  _update(state: string, totalBytes: number, receivedBytes: number, finalPath?: string): void {
    this.state = state;
    this.totalBytes = totalBytes;
    this.receivedBytes = receivedBytes;
    if (finalPath) {
      this.finalPath = finalPath;
    }
    if (state === "completed" || state === "canceled") {
      this._isDone = true;
    }
  }
}

export class ChromiumPageDownloader {
  private readonly _page: ChromiumPage;
  private _downloads: Map<string, DownloadInfo> = new Map();
  private _missions: Map<string, DownloadMission> = new Map();
  private _listening: boolean = false;
  private _waitingResolvers: Array<(mission: DownloadMission) => void> = [];

  constructor(page: ChromiumPage) {
    this._page = page;
  }

  /**
   * 开始监听下载
   */
  async start(): Promise<void> {
    if (this._listening) {
      return;
    }

    this._listening = true;
    const page = this._page["_page"];
    if (!page) {
      return;
    }

    // 启用下载事件
    await page.cdpSession.send("Page.setDownloadBehavior", {
      behavior: "allow",
      downloadPath: this._page.browser.options.downloadPath,
    });

    page.cdpSession.on("Page.downloadWillBegin", this._handleDownloadBegin);
    page.cdpSession.on("Page.downloadProgress", this._handleDownloadProgress);
  }

  /**
   * 停止监听下载
   */
  stop(): void {
    if (!this._listening) {
      return;
    }

    this._listening = false;
    const page = this._page["_page"];
    if (!page) {
      return;
    }

    page.cdpSession.off("Page.downloadWillBegin", this._handleDownloadBegin);
    page.cdpSession.off("Page.downloadProgress", this._handleDownloadProgress);
  }

  /**
   * 获取所有下载信息
   */
  get downloads(): DownloadInfo[] {
    return Array.from(this._downloads.values());
  }

  /**
   * 获取所有下载任务
   */
  get missions(): DownloadMission[] {
    return Array.from(this._missions.values());
  }

  /**
   * 清空下载记录
   */
  clear(): void {
    this._downloads.clear();
    this._missions.clear();
  }

  /**
   * 等待下载开始
   */
  async wait_begin(timeout?: number, cancelIt: boolean = false): Promise<DownloadMission | false> {
    if (!this._listening) {
      await this.start();
    }

    return new Promise<DownloadMission | false>((resolve) => {
      let timer: NodeJS.Timeout | null = null;

      const resolver = (mission: DownloadMission) => {
        if (timer) clearTimeout(timer);
        if (cancelIt) {
          mission.cancel();
        }
        resolve(mission);
      };

      this._waitingResolvers.push(resolver);

      if (timeout !== undefined) {
        timer = setTimeout(() => {
          const idx = this._waitingResolvers.indexOf(resolver);
          if (idx >= 0) {
            this._waitingResolvers.splice(idx, 1);
          }
          resolve(false);
        }, timeout * 1000);
      }
    });
  }

  /**
   * 等待所有下载完成
   */
  async wait_all(timeout?: number, cancelIfTimeout: boolean = true): Promise<boolean> {
    const startTime = Date.now();
    const timeoutMs = timeout ? timeout * 1000 : Infinity;

    while (true) {
      const activeMissions = Array.from(this._missions.values()).filter(m => !m.is_done);
      if (activeMissions.length === 0) {
        return true;
      }

      if (Date.now() - startTime > timeoutMs) {
        if (cancelIfTimeout) {
          for (const mission of activeMissions) {
            await mission.cancel();
          }
        }
        return false;
      }

      await new Promise(r => setTimeout(r, 200));
    }
  }

  /**
   * 等待指定下载完成
   */
  async wait(guid?: string, timeoutMs: number = 60000): Promise<DownloadInfo | null> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (guid) {
        const download = this._downloads.get(guid);
        if (download && download.state === "completed") {
          return download;
        }
      } else {
        // 等待任意一个下载完成
        for (const download of this._downloads.values()) {
          if (download.state === "completed") {
            return download;
          }
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    return null;
  }

  /**
   * 取消下载
   */
  async cancel(guid: string): Promise<void> {
    const page = this._page["_page"];
    if (page) {
      try {
        await page.cdpSession.send("Page.cancelDownload", { guid });
      } catch {
        // 忽略取消错误
      }
    }
  }

  private _handleDownloadBegin = (params: any) => {
    const { url, guid, suggestedFilename } = params;
    const folder = this._page.browser.options.downloadPath;
    
    this._downloads.set(guid, {
      url,
      path: suggestedFilename || "",
      state: "in_progress",
      totalBytes: 0,
      receivedBytes: 0,
      guid,
      folder,
      name: suggestedFilename,
    });

    const mission = new DownloadMission(this, guid, url, folder, suggestedFilename || "");
    this._missions.set(guid, mission);

    // 通知等待者
    if (this._waitingResolvers.length > 0) {
      const resolver = this._waitingResolvers.shift();
      resolver?.(mission);
    }
  };

  private _handleDownloadProgress = (params: any) => {
    const { guid, state, totalBytes, receivedBytes } = params;
    const download = this._downloads.get(guid);
    if (download) {
      download.state = state;
      download.totalBytes = totalBytes || 0;
      download.receivedBytes = receivedBytes || 0;
    }

    const mission = this._missions.get(guid);
    if (mission) {
      mission._update(state, totalBytes || 0, receivedBytes || 0);
    }
  };
}
