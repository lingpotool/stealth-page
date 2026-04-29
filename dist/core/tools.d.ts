import type { CdpErrorInfo } from "./WebSocketCDPSession";
export declare function raise_error(errorItem: CdpErrorInfo | any, method?: string, args?: Record<string, any>): never;
export declare function wait_until(condition: () => boolean | Promise<boolean>, timeout?: number, interval?: number): Promise<void>;
export declare function show_or_hide_browser(pid: number, show?: boolean): Promise<void>;
export declare function port_is_using(ip: string, port: number): boolean;
export declare function clean_folder(folderPath: string, ignore?: string[]): Promise<void>;
