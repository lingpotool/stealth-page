declare class OptionsManager {
    iniPath: string | null;
    fileExists: boolean;
    private _conf;
    constructor(iniPath?: string | null | false);
    private _initDefaults;
    private _setSection;
    private _readIni;
    get_value(section: string, item: string): any;
    get_option(section: string): Record<string, any>;
    set_item(section: string, item: string, value: any): OptionsManager;
    remove_item(section: string, item: string): OptionsManager;
    save(filePath?: string | null): string;
    save_to_default(): string;
}
export { OptionsManager };
