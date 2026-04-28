class Timeout {
  base: number = 10;
  page_load: number = 30;
  script: number = 30;

  constructor(base?: number, pageLoad?: number, script?: number) {
    if (base !== undefined) this.base = base;
    if (pageLoad !== undefined) this.page_load = pageLoad;
    if (script !== undefined) this.script = script;
  }

  set(base?: number, pageLoad?: number, script?: number): Timeout {
    if (base !== undefined) this.base = base;
    if (pageLoad !== undefined) this.page_load = pageLoad;
    if (script !== undefined) this.script = script;
    return this;
  }

  get as_dict(): { base: number; page_load: number; script: number } {
    return { base: this.base, page_load: this.page_load, script: this.script };
  }

  toString(): string {
    return `{'base': ${this.base}, 'page_load': ${this.page_load}, 'script': ${this.script}}`;
  }
}

export { Timeout };
