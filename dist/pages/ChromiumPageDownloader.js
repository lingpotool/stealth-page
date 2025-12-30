"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChromiumPageDownloader = exports.DownloadMission = void 0;
/**
 * 下载任务类
 */
class DownloadMission {
    constructor(downloader, guid, url, folder, name) {
        this.state = "in_progress";
        this.totalBytes = 0;
        this.receivedBytes = 0;
        this.finalPath = null;
        this._isDone = false;
        this._downloader = downloader;
        this.guid = guid;
        this.url = url;
        this.folder = folder;
        this.name = name;
    }
    /**
     * 下载进度百分比
     */
    get rate() {
        if (this.totalBytes === 0)
            return 0;
        return (this.receivedBytes / this.totalBytes) * 100;
    }
    /**
     * 任务是否完成
     */
    get is_done() {
        return this._isDone || this.state === "completed" || this.state === "canceled";
    }
    /**
     * 取消下载
     */
    async cancel() {
        await this._downloader.cancel(this.guid);
        this.state = "canceled";
        this._isDone = true;
    }
    /**
     * 等待下载完成
     */
    async wait(show = true, timeout, cancelIfTimeout = true) {
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
    _update(state, totalBytes, receivedBytes, finalPath) {
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
exports.DownloadMission = DownloadMission;
class ChromiumPageDownloader {
    constructor(page) {
        this._downloads = new Map();
        this._missions = new Map();
        this._listening = false;
        this._waitingResolvers = [];
        this._handleDownloadBegin = (params) => {
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
        this._handleDownloadProgress = (params) => {
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
        this._page = page;
    }
    /**
     * 开始监听下载
     */
    async start() {
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
    stop() {
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
    get downloads() {
        return Array.from(this._downloads.values());
    }
    /**
     * 获取所有下载任务
     */
    get missions() {
        return Array.from(this._missions.values());
    }
    /**
     * 清空下载记录
     */
    clear() {
        this._downloads.clear();
        this._missions.clear();
    }
    /**
     * 等待下载开始
     */
    async wait_begin(timeout, cancelIt = false) {
        if (!this._listening) {
            await this.start();
        }
        return new Promise((resolve) => {
            let timer = null;
            const resolver = (mission) => {
                if (timer)
                    clearTimeout(timer);
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
    async wait_all(timeout, cancelIfTimeout = true) {
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
    async wait(guid, timeoutMs = 60000) {
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
            if (guid) {
                const download = this._downloads.get(guid);
                if (download && download.state === "completed") {
                    return download;
                }
            }
            else {
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
    async cancel(guid) {
        const page = this._page["_page"];
        if (page) {
            try {
                await page.cdpSession.send("Page.cancelDownload", { guid });
            }
            catch {
                // 忽略取消错误
            }
        }
    }
}
exports.ChromiumPageDownloader = ChromiumPageDownloader;
