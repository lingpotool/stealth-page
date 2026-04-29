import type { ChromiumOptions } from "../config/ChromiumOptions";
export declare function connect_browser(option: ChromiumOptions): Promise<boolean>;
export declare function get_launch_args(opt: ChromiumOptions): {
    args: string[];
    userPath: string | false;
};
export declare function set_prefs(opt: ChromiumOptions): void;
export declare function set_flags(opt: ChromiumOptions): void;
export declare function test_connect(ip: string, port: number): Promise<boolean>;
export declare function get_chrome_path(iniPath?: string): string | null;
