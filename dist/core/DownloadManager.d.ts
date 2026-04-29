export interface DownloadMission {
    guid: string;
    tabId: string;
    fromTab?: string;
    url: string;
    fileName: string;
    state: 'in_progress' | 'completed' | 'canceled' | 'interrupted' | 'skipped' | 'running';
    receivedBytes: number;
    totalBytes: number;
    finalPath?: string;
    folder?: string;
    _is_done?: boolean;
    _overwrite?: boolean | null;
    _mgr?: DownloadManager;
    _waitResolvers?: Array<(result: string | false) => void>;
}
export declare function getMissionRate(mission: DownloadMission): number;
export declare function isMissionDone(mission: DownloadMission): boolean;
export declare function cancelMission(mission: DownloadMission): Promise<void>;
export declare function waitMission(mission: DownloadMission, timeout?: number, cancelIfTimeout?: boolean): Promise<string | false>;
declare class TabDownloadSettings {
    private static readonly _instances;
    readonly tabId: string;
    path: string;
    rename: string | null;
    suffix: string | null;
    when_file_exists: string;
    private constructor();
    static get(tabId: string): TabDownloadSettings;
}
interface BrowserLike {
    _run_cdp(method: string, params?: Record<string, any>): Promise<any>;
    _driver?: {
        set_callback(event: string, callback: Function, immediate?: boolean): void;
    };
    download_path: string;
}
export declare class DownloadManager {
    private _browser;
    private _missions;
    private _tabMissions;
    private _flags;
    private _waitingTab;
    private _tmpPath;
    private _running;
    constructor(browser: BrowserLike);
    get missions(): Map<string, DownloadMission>;
    set_path(tab: string | {
        tab_id: string;
    }, path: string): void;
    static set_rename(tabId: string, rename?: string | null, suffix?: string | null): void;
    static set_file_exists(tabId: string, mode: string): void;
    set_flag(tabId: string, flag: [boolean, DownloadMission | null]): void;
    get_flag(tabId: string): [boolean, DownloadMission | null] | undefined;
    get_tab_missions(tabId: string): Set<DownloadMission>;
    set_done(mission: DownloadMission, state: string, finalPath?: string): void;
    cancel(mission: DownloadMission): Promise<void>;
    skip(mission: DownloadMission): Promise<void>;
    clear_tab_info(tabId: string): void;
    private _onDownloadWillBegin;
    private _onDownloadProgress;
}
export { TabDownloadSettings };
