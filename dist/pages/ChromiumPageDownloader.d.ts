import type { DownloadMission } from "../core/DownloadManager";
export declare class ChromiumPageDownloader {
    private readonly _tabId;
    private readonly _downloadMgr;
    private readonly _tmpPath;
    constructor(tabId: string, downloadMgr: any, tmpPath?: string);
    get tab_id(): string;
    get missions(): Set<DownloadMission>;
    set_path(savePath: string): void;
    set_rename(rename: string | null): void;
    set_suffix(suffix: string | null): void;
    set_file_exists(mode: 'rename' | 'overwrite' | 'skip'): void;
    set_flag(flag: [boolean, DownloadMission | null]): void;
    get_flag(): [boolean, DownloadMission | null] | undefined;
    handle_download_complete(mission: DownloadMission): void;
    cancel(guid: string): void;
}
