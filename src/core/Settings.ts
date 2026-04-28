import { get_txt_class } from "./Texts";

class Settings {
  static raise_when_ele_not_found: boolean = false;
  static raise_when_click_failed: boolean = false;
  static raise_when_wait_failed: boolean = false;
  static singleton_tab_obj: boolean = true;
  static cdp_timeout: number = 30;
  static browser_connect_timeout: number = 30;
  static auto_handle_alert: boolean | null = null;
  static none_ele_return_value: any = null;
  static none_ele_value: any = null;
  static retry_times: number = 0;
  static retry_interval: number = 0.5;
  static debug: boolean = false;
  static _lang: any = get_txt_class(null);

  static set_raise_when_ele_not_found(on_off: boolean = true): typeof Settings {
    Settings.raise_when_ele_not_found = on_off;
    return Settings;
  }

  static set_raise_when_click_failed(on_off: boolean = true): typeof Settings {
    Settings.raise_when_click_failed = on_off;
    return Settings;
  }

  static set_raise_when_wait_failed(on_off: boolean = true): typeof Settings {
    Settings.raise_when_wait_failed = on_off;
    return Settings;
  }

  static set_singleton_tab_obj(on_off: boolean = true): typeof Settings {
    Settings.singleton_tab_obj = on_off;
    return Settings;
  }

  static set_cdp_timeout(second: number): typeof Settings {
    Settings.cdp_timeout = second;
    return Settings;
  }

  static set_browser_connect_timeout(second: number): typeof Settings {
    Settings.browser_connect_timeout = second;
    return Settings;
  }

  static set_auto_handle_alert(accept: boolean | null = true): typeof Settings {
    Settings.auto_handle_alert = accept;
    return Settings;
  }

  static set_language(code: string): typeof Settings {
    Settings._lang = get_txt_class(code);
    return Settings;
  }
}

export { Settings };
