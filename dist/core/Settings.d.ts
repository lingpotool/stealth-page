declare class Settings {
    static raise_when_ele_not_found: boolean;
    static raise_when_click_failed: boolean;
    static raise_when_wait_failed: boolean;
    static singleton_tab_obj: boolean;
    static cdp_timeout: number;
    static browser_connect_timeout: number;
    static auto_handle_alert: boolean | null;
    static none_ele_return_value: any;
    static none_ele_value: any;
    static retry_times: number;
    static retry_interval: number;
    static debug: boolean;
    static suffixes_list: string;
    static _lang: any;
    static set_raise_when_ele_not_found(on_off?: boolean): typeof Settings;
    static set_raise_when_click_failed(on_off?: boolean): typeof Settings;
    static set_raise_when_wait_failed(on_off?: boolean): typeof Settings;
    static set_singleton_tab_obj(on_off?: boolean): typeof Settings;
    static set_cdp_timeout(second: number): typeof Settings;
    static set_browser_connect_timeout(second: number): typeof Settings;
    static set_auto_handle_alert(accept?: boolean | null): typeof Settings;
    static set_suffixes_list(path: string): typeof Settings;
    static set_language(code: string): typeof Settings;
}
export { Settings };
