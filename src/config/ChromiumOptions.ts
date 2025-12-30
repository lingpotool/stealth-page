export interface ChromiumTimeouts {
  base: number;
  pageLoad: number;
  script: number;
}

export interface ChromiumOptionsInit {
  browserPath?: string;
  userDataPath?: string;
  downloadPath?: string;
  tmpPath?: string | null;
  address?: string;
  arguments?: string[];
  extensions?: string[];
  flags?: Record<string, any>;
  timeouts?: ChromiumTimeouts;
  uploadFiles?: string[];
}

/**
 * Node 版的 ChromiumOptions，对齐 DrissionPage.ChromiumOptions 的主要字段和方法。
 * 目前只定义结构，具体行为在后续实现。
 */
export class ChromiumOptions {
  browserPath: string = "";
  userDataPath?: string;
  downloadPath: string = ".";
  tmpPath: string | null = null;
  address: string = "";
  arguments: string[] = [];
  extensions: string[] = [];
  flags: Record<string, any> = {};
  timeouts: ChromiumTimeouts = { base: 10, pageLoad: 30, script: 30 };
  uploadFiles: string[] = [];

  constructor(init?: ChromiumOptionsInit) {
    if (init) {
      Object.assign(this, {
        browserPath: init.browserPath ?? this.browserPath,
        userDataPath: init.userDataPath ?? this.userDataPath,
        downloadPath: init.downloadPath ?? this.downloadPath,
        tmpPath: init.tmpPath ?? this.tmpPath,
        address: init.address ?? this.address,
        arguments: init.arguments ?? this.arguments,
        extensions: init.extensions ?? this.extensions,
        flags: init.flags ?? this.flags,
        timeouts: init.timeouts ?? this.timeouts,
      });
    }
  }

  set_timeouts(base: number, pageLoad?: number, script?: number): this {
    this.timeouts = {
      base,
      pageLoad: pageLoad ?? this.timeouts.pageLoad,
      script: script ?? this.timeouts.script,
    };
    return this;
  }

  set_paths(options: { downloadPath?: string; tmpPath?: string | null; userDataPath?: string }): this {
    if (options.downloadPath !== undefined) {
      this.downloadPath = options.downloadPath;
    }
    if (options.tmpPath !== undefined) {
      this.tmpPath = options.tmpPath;
    }
    if (options.userDataPath !== undefined) {
      this.userDataPath = options.userDataPath;
    }
    return this;
  }

  set_argument(arg: string): this {
    if (!this.arguments.includes(arg)) {
      this.arguments.push(arg);
    }
    return this;
  }

  remove_argument(arg: string): this {
    this.arguments = this.arguments.filter((a) => a !== arg);
    return this;
  }

  headless(enabled: boolean = true): this {
    if (enabled) {
      this.set_argument("--headless=new");
    } else {
      this.remove_argument("--headless=new");
      this.remove_argument("--headless");
    }
    return this;
  }

  incognito(enabled: boolean = true): this {
    if (enabled) {
      this.set_argument("--incognito");
    } else {
      this.remove_argument("--incognito");
    }
    return this;
  }

  no_imgs(enabled: boolean = true): this {
    if (enabled) {
      this.set_argument("--blink-settings=imagesEnabled=false");
    } else {
      this.arguments = this.arguments.filter((a) => !a.includes("imagesEnabled"));
    }
    return this;
  }

  no_js(enabled: boolean = true): this {
    if (enabled) {
      this.set_argument("--disable-javascript");
    } else {
      this.remove_argument("--disable-javascript");
    }
    return this;
  }

  mute(enabled: boolean = true): this {
    if (enabled) {
      this.set_argument("--mute-audio");
    } else {
      this.remove_argument("--mute-audio");
    }
    return this;
  }

  set_browser_path(path: string): this {
    this.browserPath = path;
    return this;
  }

  set_address(address: string): this {
    this.address = address;
    return this;
  }

  set_user_data_path(path: string): this {
    this.userDataPath = path;
    return this;
  }

  add_extension(path: string): this {
    if (!this.extensions.includes(path)) {
      this.extensions.push(path);
    }
    return this;
  }

  remove_extension(path: string): this {
    this.extensions = this.extensions.filter((e) => e !== path);
    return this;
  }

  set_flag(key: string, value: any): this {
    this.flags[key] = value;
    return this;
  }

  remove_flag(key: string): this {
    delete this.flags[key];
    return this;
  }
}
