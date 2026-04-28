import * as fs from "fs";
import * as path from "path";

class OptionsManager {
  iniPath: string | null;
  fileExists: boolean = false;
  private _conf: Map<string, Map<string, string>> = new Map();

  constructor(iniPath?: string | null | false) {
    if (iniPath === false) {
      this.iniPath = null;
      this._initDefaults();
      return;
    }

    if (iniPath === undefined || iniPath === null) {
      const dpConfigs = path.resolve('dp_configs.ini');
      if (fs.existsSync(dpConfigs)) {
        this.iniPath = dpConfigs;
      } else {
        this.iniPath = path.join(__dirname, '..', 'config', 'configs.ini');
      }
    } else if (iniPath === 'default') {
      this.iniPath = path.join(__dirname, '..', 'config', 'configs.ini');
    } else {
      this.iniPath = path.resolve(iniPath);
    }

    if (this.iniPath && fs.existsSync(this.iniPath)) {
      this.fileExists = true;
      this._readIni(this.iniPath);
    } else {
      this._initDefaults();
    }
  }

  private _initDefaults(): void {
    this._setSection('paths');
    this.set_item('paths', 'download_path', '');
    this.set_item('paths', 'tmp_path', '');

    this._setSection('chromium_options');
    this.set_item('chromium_options', 'address', '127.0.0.1:9222');
    this.set_item('chromium_options', 'browser_path', 'chrome');
    this.set_item('chromium_options', 'arguments', "['--no-default-browser-check', '--disable-suggestions-ui', '--no-first-run', '--disable-infobars', '--disable-popup-blocking', '--hide-crash-restore-bubble', '--disable-features=PrivacySandboxSettings4']");
    this.set_item('chromium_options', 'extensions', '[]');
    this.set_item('chromium_options', 'prefs', "{'profile.default_content_settings.popups': 0, 'profile.default_content_setting_values': {'notifications': 2}}");
    this.set_item('chromium_options', 'flags', '{}');
    this.set_item('chromium_options', 'load_mode', 'normal');
    this.set_item('chromium_options', 'user', 'Default');
    this.set_item('chromium_options', 'auto_port', 'False');
    this.set_item('chromium_options', 'system_user_path', 'False');
    this.set_item('chromium_options', 'existing_only', 'False');
    this.set_item('chromium_options', 'new_env', 'False');

    this._setSection('session_options');
    this.set_item('session_options', 'headers', "{'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/603.3.8 (KHTML, like Gecko) Version/10.1.2 Safari/603.3.8', 'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', 'connection': 'keep-alive', 'accept-charset': 'GB2312,utf-8;q=0.7,*;q=0.7'}");

    this._setSection('timeouts');
    this.set_item('timeouts', 'base', '10');
    this.set_item('timeouts', 'page_load', '30');
    this.set_item('timeouts', 'script', '30');

    this._setSection('proxies');
    this.set_item('proxies', 'http', '');
    this.set_item('proxies', 'https', '');

    this._setSection('others');
    this.set_item('others', 'retry_times', '3');
    this.set_item('others', 'retry_interval', '2');
  }

  private _setSection(section: string): void {
    if (!this._conf.has(section)) {
      this._conf.set(section, new Map());
    }
  }

  private _readIni(filePath: string): void {
    const content = fs.readFileSync(filePath, 'utf-8');
    let currentSection = '';

    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith(';')) continue;

      const sectionMatch = trimmed.match(/^\[(.+)\]$/);
      if (sectionMatch) {
        currentSection = sectionMatch[1];
        this._setSection(currentSection);
        continue;
      }

      if (currentSection) {
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex > 0) {
          const key = trimmed.substring(0, eqIndex).trim();
          const value = trimmed.substring(eqIndex + 1).trim();
          this._conf.get(currentSection)!.set(key, value);
        }
      }
    }
  }

  get_value(section: string, item: string): any {
    const sectionMap = this._conf.get(section);
    if (!sectionMap) return null;
    const value = sectionMap.get(item);
    if (value === undefined) return null;
    try {
      return JSON.parse(value.replace(/'/g, '"').replace(/True/g, 'true').replace(/False/g, 'false').replace(/None/g, 'null'));
    } catch {
      return value;
    }
  }

  get_option(section: string): Record<string, any> {
    const sectionMap = this._conf.get(section);
    if (!sectionMap) return {};
    const result: Record<string, any> = {};
    for (const [key, value] of sectionMap) {
      try {
        result[key] = JSON.parse(value.replace(/'/g, '"').replace(/True/g, 'true').replace(/False/g, 'false').replace(/None/g, 'null'));
      } catch {
        result[key] = value;
      }
    }
    return result;
  }

  set_item(section: string, item: string, value: any): OptionsManager {
    this._setSection(section);
    this._conf.get(section)!.set(item, String(value));
    return this;
  }

  remove_item(section: string, item: string): OptionsManager {
    const sectionMap = this._conf.get(section);
    if (sectionMap) {
      sectionMap.delete(item);
    }
    return this;
  }

  save(filePath?: string | null): string {
    let targetPath: string;
    const defaultPath = path.join(__dirname, '..', 'config', 'configs.ini');

    if (filePath === 'default') {
      targetPath = defaultPath;
    } else if (!filePath) {
      if (!this.iniPath) {
        throw new Error('ini_path is not set.');
      }
      targetPath = this.iniPath;
    } else {
      targetPath = path.resolve(filePath);
    }

    if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {
      targetPath = path.join(targetPath, 'config.ini');
    }

    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const lines: string[] = [];
    for (const [section, items] of this._conf) {
      lines.push(`[${section}]`);
      for (const [key, value] of items) {
        lines.push(`${key} = ${value}`);
      }
      lines.push('');
    }

    fs.writeFileSync(targetPath, lines.join('\n'), 'utf-8');
    this.fileExists = true;
    return targetPath;
  }

  save_to_default(): string {
    return this.save('default');
  }
}

export { OptionsManager };
