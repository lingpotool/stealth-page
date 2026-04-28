class TabDownloadSettings {
  private static readonly _instances = new Map<string, TabDownloadSettings>();

  readonly tabId: string;
  save_path: string = '.';
  rename: string | null = null;
  suffix: string | null = null;
  when_file_exists: 'rename' | 'overwrite' | 'skip' = 'rename';

  private constructor(tabId: string) {
    this.tabId = tabId;
  }

  static get(tabId: string): TabDownloadSettings {
    let instance = TabDownloadSettings._instances.get(tabId);
    if (!instance) {
      instance = new TabDownloadSettings(tabId);
      TabDownloadSettings._instances.set(tabId, instance);
    }
    return instance;
  }

  static remove(tabId: string): void {
    TabDownloadSettings._instances.delete(tabId);
  }

  set_path(path: string): TabDownloadSettings {
    this.save_path = path;
    return this;
  }

  set_rename(rename: string | null): TabDownloadSettings {
    this.rename = rename;
    return this;
  }

  set_suffix(suffix: string | null): TabDownloadSettings {
    this.suffix = suffix;
    return this;
  }

  set_file_exists(mode: 'rename' | 'overwrite' | 'skip'): TabDownloadSettings {
    this.when_file_exists = mode;
    return this;
  }
}

export { TabDownloadSettings };
