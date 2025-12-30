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
export declare class DownloadMission {
    private readonly _downloader;
    readonly guid: string;
    readonly url: string;
    folder: string;
    name: string;
    state: string;
    totalBytes: number;
    receivedBytes: number;
    finalPath: string | null;
    private _isDone;
    constructor(downloader: ChromiumPageDownloader, guid: string, url: string, folder: string, name: string);
    /**
     * 下载进度百分比
     */
    get rate(): number;
    /**
     * 任务是否完成
     */
    get is_done(): boolean;
    /**
     * 取消下载
     */
    cancel(): Promise<void>;
    /**
     * 等待下载完成
     */
    wait(show?: boolean, timeout?: number, cancelIfTimeout?: boolean): Promise<string | false>;
    /**
     * 更新状态
     */
    _update(state: string, totalBytes: number, receivedBytes: number, finalPath?: string): void;
}
export declare class ChromiumPageDownloader {
    private readonly _page;
    private _downloads;
    private _missions;
    private _listening;
    private _waitingResolvers;
    constructor(page: ChromiumPage);
    /**
     * 开始监听下载
     */
    start(): Promise<void>;
    /**
     * 停止监听下载
     */
    stop(): void;
    /**
     * 获取所有下载信息
     */
    get downloads(): DownloadInfo[];
    /**
     * 获取所有下载任务
     */
    get missions(): DownloadMission[];
    /**
     * 清空下载记录
     */
    clear(): void;
    /**
     * 等待下载开始
     */
    wait_begin(timeout?: number, cancelIt?: boolean): Promise<DownloadMission | false>;
    /**
     * 等待所有下载完成
     */
    wait_all(timeout?: number, cancelIfTimeout?: boolean): Promise<boolean>;
    /**
     * 等待指定下载完成
     */
    wait(guid?: string, timeoutMs?: number): Promise<DownloadInfo | null>;
    /**
     * 取消下载
     */
    cancel(guid: string): Promise<void>;
    private _handleDownloadBegin;
    private _handleDownloadProgress;
}
