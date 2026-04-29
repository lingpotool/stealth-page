declare class TabDownloadSettings {
    private static readonly _instances;
    readonly tabId: string;
    save_path: string;
    rename: string | null;
    suffix: string | null;
    when_file_exists: 'rename' | 'overwrite' | 'skip';
    private constructor();
    static get(tabId: string): TabDownloadSettings;
    static remove(tabId: string): void;
    set_path(path: string): TabDownloadSettings;
    set_rename(rename: string | null): TabDownloadSettings;
    set_suffix(suffix: string | null): TabDownloadSettings;
    set_file_exists(mode: 'rename' | 'overwrite' | 'skip'): TabDownloadSettings;
}
export { TabDownloadSettings };
